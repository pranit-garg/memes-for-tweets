import Anthropic from '@anthropic-ai/sdk';
import { MemeTemplate, getMemeFormatInfo, scoreTemplates, getTopScoredTemplates, type ScoringInput } from './imgflip';

let anthropicInstance: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}

export interface TextBox {
  text: string;
  position: string;
}

export interface MemeMatch {
  templateId: string;
  templateName: string;
  reasoning: string;
  suggestedTopText: string;
  suggestedBottomText: string;
  textBoxes: TextBox[];
  format: string;
}

export interface MatchResult {
  matches: MemeMatch[];
  modified: boolean;
  modifiedTweet?: string;
  message?: string;
}

// MM-001: Tweet Analysis Types
export type HumorType = 
  | 'sarcasm' 
  | 'irony' 
  | 'hot-take' 
  | 'complaint' 
  | 'self-deprecation' 
  | 'observation' 
  | 'flex' 
  | 'roast' 
  | 'absurdist' 
  | 'wholesome'
  | 'comparison';

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'sarcastic' | 'mixed';

// NEW: Topic detection for better template matching
export type TweetTopic = 
  | 'tech'
  | 'work'
  | 'relationships'
  | 'food'
  | 'money'
  | 'health'
  | 'gaming'
  | 'social-media'
  | 'education'
  | 'politics'
  | 'universal';

export interface TweetAnalysis {
  sentiment: Sentiment;
  humorType: HumorType;
  secondaryHumorType?: HumorType;
  keyEntities: string[];
  corePoint: string;
  hasTwoAlternatives: boolean;
  hasObviousOutcome: boolean;
  isSelfSabotage: boolean;
  topics?: TweetTopic[];  // NEW: Detected topics
  hasMultipleSteps?: boolean;  // NEW: For multi-panel memes
  emotionalVibe?: string; // NEW: The specific feeling (e.g., "exhausted realization", "smug superiority")
  memeStructure?: string; // NEW: Suggested structure (e.g., "X vs Y", "Expectation vs Reality")
}

// MM-001: Analyze tweet before matching
async function analyzeTweet(tweet: string): Promise<TweetAnalysis> {
  const prompt = `Analyze this tweet to help match it to the perfect meme template.

TWEET: "${tweet}"

Analyze and return JSON with these fields:
{
  "sentiment": "positive" | "negative" | "neutral" | "sarcastic" | "mixed",
  "humorType": primary type from: "sarcasm", "irony", "hot-take", "complaint", "self-deprecation", "observation", "flex", "roast", "absurdist", "wholesome", "comparison",
  "secondaryHumorType": optional secondary type (or null),
  "keyEntities": array of main subjects/topics mentioned (max 3),
  "corePoint": the main joke or point in ONE short sentence (max 15 words),
  "hasTwoAlternatives": true if comparing two distinct options (for Drake/comparison memes),
  "hasObviousOutcome": true if there's a predictable cause→effect (for Surprised Pikachu),
  "isSelfSabotage": true if someone causes their own problem (for Bike Fall),
  "topics": array from ["tech", "work", "relationships", "food", "money", "health", "gaming", "social-media", "education", "politics", "universal"],
  "hasMultipleSteps": true if the tweet describes a sequence/progression (for multi-panel memes like Gru's Plan, Clown Makeup),
  "emotionalVibe": "short phrase describing the specific feeling (e.g. 'exhausted realization', 'smug superiority', 'confused screaming')",
  "memeStructure": "suggestion for meme structure (e.g. 'X vs Y', 'Expectation vs Reality', 'Me pretending to be fine')"
}

Be precise. The humor type should match what would make this tweet funny as a meme.
Return ONLY the JSON object, no explanation.`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      temperature: 0.3, // Lower temp for more consistent analysis
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text) as TweetAnalysis | null;
      if (parsed && parsed.sentiment && parsed.humorType) {
        console.log('Tweet analysis:', JSON.stringify(parsed, null, 2));
        return parsed;
      }
    }
  } catch (error) {
    console.error('Tweet analysis failed:', error);
  }

  // Fallback analysis using simple heuristics
  return fallbackAnalyzeTweet(tweet);
}

// Fallback analysis when AI call fails
function fallbackAnalyzeTweet(tweet: string): TweetAnalysis {
  const lowerTweet = tweet.toLowerCase();
  
  // Detect sentiment
  let sentiment: Sentiment = 'neutral';
  if (lowerTweet.includes('worst') || lowerTweet.includes('hate') || lowerTweet.includes('bad') || lowerTweet.includes('sucks')) {
    sentiment = 'negative';
  } else if (lowerTweet.includes('love') || lowerTweet.includes('best') || lowerTweet.includes('amazing')) {
    sentiment = 'positive';
  } else if (lowerTweet.includes('apparently') || lowerTweet.includes('shocking') || lowerTweet.includes('surprising')) {
    sentiment = 'sarcastic';
  }

  // Detect humor type
  let humorType: HumorType = 'observation';
  if (lowerTweet.includes(' vs ') || lowerTweet.includes(' or ') || lowerTweet.includes('instead')) {
    humorType = 'comparison';
  } else if (lowerTweet.includes('turns out') || lowerTweet.includes('apparently')) {
    humorType = 'irony';
  } else if (lowerTweet.includes('i think') || lowerTweet.includes('unpopular opinion') || lowerTweet.includes('hot take')) {
    humorType = 'hot-take';
  } else if (lowerTweet.includes('why do i') || lowerTweet.includes('me:') || lowerTweet.includes('myself')) {
    humorType = 'self-deprecation';
  } else if (sentiment === 'negative') {
    humorType = 'complaint';
  }

  // Extract key entities (capitalized words)
  const entities = tweet
    .split(/\s+/)
    .filter(w => /^[A-Z][a-zA-Z]+/.test(w) && w.length > 2)
    .slice(0, 3);

  // Check for patterns
  const hasTwoAlternatives = /\bvs\b|\bor\b|instead of|rather than/i.test(tweet);
  const hasObviousOutcome = /turns out|shocking|surprised|obviously/i.test(tweet);
  const isSelfSabotage = /blame|fault|caused|my own/i.test(tweet);
  const hasMultipleSteps = /first|then|finally|step|1\.|2\.|3\./i.test(tweet);

  // NEW: Detect topics from keywords
  const topics: TweetTopic[] = [];
  if (/code|programming|software|app|api|bug|deploy|server|ai|tech|computer/i.test(tweet)) topics.push('tech');
  if (/job|work|boss|meeting|email|office|deadline|coworker|salary/i.test(tweet)) topics.push('work');
  if (/date|relationship|boyfriend|girlfriend|ex|marriage|love|tinder/i.test(tweet)) topics.push('relationships');
  if (/food|eat|cook|restaurant|pizza|coffee|drink|hungry/i.test(tweet)) topics.push('food');
  if (/money|broke|rich|buy|spend|save|invest|budget/i.test(tweet)) topics.push('money');
  if (/gym|workout|health|sleep|tired|sick|diet/i.test(tweet)) topics.push('health');
  if (/game|gaming|play|xbox|playstation|nintendo|steam/i.test(tweet)) topics.push('gaming');
  if (/twitter|instagram|tiktok|social|post|viral|followers/i.test(tweet)) topics.push('social-media');
  if (topics.length === 0) topics.push('universal');

  // Create core point from first sentence
  const firstSentence = tweet.split(/[.!?]/)[0]?.trim() || tweet;
  const corePoint = firstSentence.length > 60 ? firstSentence.slice(0, 57) + '...' : firstSentence;

  return {
    sentiment,
    humorType,
    keyEntities: entities,
    corePoint,
    hasTwoAlternatives,
    hasObviousOutcome,
    isSelfSabotage,
    topics,
    hasMultipleSteps,
    emotionalVibe: 'neutral observation',
    memeStructure: 'general reaction',
  };
}

// Extract JSON from potentially messy LLM output
function extractJson(text: string): unknown | null {
  // Remove markdown code blocks
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
  }
  
  // Try to find array
  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try {
      return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1));
    } catch {
      // Continue to try other methods
    }
  }
  
  // Try to find object
  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try {
      return JSON.parse(cleaned.slice(objStart, objEnd + 1));
    } catch {
      // Continue
    }
  }
  
  // Try parsing the whole thing
  try {
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// MM-003: Combined select + caption in a single API call
// The AI picks the best 3 templates AND generates captions together,
// so it can reason about WHY a template fits while writing the caption.
async function selectAndCaption(
  tweet: string,
  templates: MemeTemplate[],
  analysis: TweetAnalysis,
  excludeIds: string[] = [],
  count: number = 3
): Promise<MemeMatch[]> {
  const templateList = templates
    .filter(t => !excludeIds.includes(t.id))
    .map(t => {
      const info = getMemeFormatInfo(t);
      const topicStr = info.topicTags?.join(', ') || 'universal';
      const humorStr = info.humorTags?.join(', ') || 'general';
      const boxesDesc = info.textBoxes.map(b => `${b.position}: ${b.purpose}`).join('; ');
      const exampleLine = info.exampleCaptions?.[0] ? `\n  Example: ${info.exampleCaptions[0]}` : '';
      const isMultiPanel = info.format === 'multi-panel' || info.textBoxes.length > 2;
      return `${t.id}: ${t.name} (${info.format}${isMultiPanel ? ' - MULTI-PANEL, use all boxes!' : ''}, ${t.box_count} boxes)
  Best for: ${info.bestFor}
  Humor: [${humorStr}] | Topics: [${topicStr}]
  Boxes: [${boxesDesc}]${exampleLine}`;
    })
    .join('\n');

  const topicsStr = analysis.topics?.join(', ') || 'general';
  const multiStepHint = analysis.hasMultipleSteps
    ? '\n- Has multiple steps/progression: YES - consider multi-panel memes like Grus Plan, Clown Makeup, Expanding Brain'
    : '';

  const prompt = `You are a legendary comedy writer. Pick the ${count} BEST meme templates for this tweet AND write captions for each.

### GOLD STANDARD EXAMPLES (study the "WHY IT WORKS"):
${GOLD_STANDARD_EXAMPLES}

### TARGET TWEET:
"${tweet}"

### ANALYSIS:
- Humor: ${analysis.humorType}${analysis.secondaryHumorType ? ` (secondary: ${analysis.secondaryHumorType})` : ''}
- Sentiment: ${analysis.sentiment}
- Core point: ${analysis.corePoint}
- Topics: ${topicsStr}
- Vibe: ${analysis.emotionalVibe || 'N/A'}
- Suggested Structure: ${analysis.memeStructure || 'N/A'}
- Has comparison: ${analysis.hasTwoAlternatives}
- Has obvious outcome: ${analysis.hasObviousOutcome}
- Self-sabotage: ${analysis.isSelfSabotage}${multiStepHint}

### SELECTION RULES:
- ONLY comparison memes (Drake, Tuxedo Pooh) if tweet has TWO alternatives
- Surprised Pikachu ONLY for obvious cause→effect
- DIVERSITY: Pick templates with DIFFERENT formats
- Prefer templates matching the tweet's humor tags AND topics

### COMEDY RULES:
1. **Incongruity** — Humor from unexpected pairing
2. **Specificity > Generality** — Use exact entities from the tweet
3. **Escalation** — Multi-panel: each step MORE extreme
4. **The punchline is the IMAGE** — Don't describe what the image shows
5. **Brevity** — Max 8 words per box. Fewer is better.
6. **DON'T REPEAT THE TWEET** — Adapt the concept to the meme format

### AVAILABLE TEMPLATES (top ${templates.filter(t => !excludeIds.includes(t.id)).length} scored):
${templateList}

### OUTPUT:
Reply with a JSON array of ${count} objects. For each, explain WHY you chose it, then write the caption:
[
  {
    "templateId": "exact ID",
    "templateName": "name",
    "reasoning": "Why this template + this angle = funny",
    "suggestedTopText": "...",
    "suggestedBottomText": "...",
    "panel1": "...",
    "panel2": "...",
    "panel3": "...",
    "panel4": "..."
  }
]`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Build MemeMatch objects from parsed results
        const matches: MemeMatch[] = [];

        for (const m of parsed.slice(0, count)) {
          const template = templates.find(t => t.id === m.templateId);
          if (!template) continue;

          const formatInfo = getMemeFormatInfo(template);
          const isMultiPanel = formatInfo.format === 'multi-panel' || formatInfo.textBoxes.length > 2;
          const clean = (s: unknown) => String(s || '').trim().slice(0, 150);

          let textBoxes: TextBox[] = [];
          if (isMultiPanel) {
            if (m.panel1) textBoxes.push({ position: 'panel1', text: clean(m.panel1) });
            if (m.panel2) textBoxes.push({ position: 'panel2', text: clean(m.panel2) });
            if (m.panel3) textBoxes.push({ position: 'panel3', text: clean(m.panel3) });
            if (m.panel4) textBoxes.push({ position: 'panel4', text: clean(m.panel4) });
            if (textBoxes.length === 0) {
              if (m.suggestedTopText) textBoxes.push({ position: 'top', text: clean(m.suggestedTopText) });
              if (m.suggestedBottomText) textBoxes.push({ position: 'bottom', text: clean(m.suggestedBottomText) });
            }
          } else {
            if (m.suggestedTopText) textBoxes.push({ position: 'top', text: clean(m.suggestedTopText) });
            if (m.suggestedBottomText) textBoxes.push({ position: 'bottom', text: clean(m.suggestedBottomText) });
            if (textBoxes.length === 0 && formatInfo.format === 'label') {
              if (m.suggestedBottomText) textBoxes.push({ position: 'bottom', text: clean(m.suggestedBottomText) });
              else if (m.suggestedTopText) textBoxes.push({ position: 'center', text: clean(m.suggestedTopText) });
            }
          }

          matches.push({
            templateId: m.templateId,
            templateName: m.templateName || template.name,
            reasoning: m.reasoning || 'Comedy gold',
            suggestedTopText: clean(m.suggestedTopText || m.panel1),
            suggestedBottomText: clean(m.suggestedBottomText || m.panel2),
            format: formatInfo.format,
            textBoxes,
          });
        }

        // Enforce diversity post-hoc
        const diverseIds = enforceDiversity(
          matches.map(m => m.templateId),
          templates,
          excludeIds
        );
        const diverseMatches = diverseIds
          .map(id => matches.find(m => m.templateId === id))
          .filter((m): m is MemeMatch => m !== undefined);

        if (diverseMatches.length > 0) {
          console.log('Selected + captioned:', diverseMatches.map(m => m.templateName).join(', '));
          return diverseMatches;
        }
      }
    }
  } catch (error) {
    console.error('Select + caption failed:', error);
  }

  return [];
}

// NEW: Ensure result diversity - no more than 2 of the same format
function enforceDiversity(
  selectedIds: string[],
  allTemplates: MemeTemplate[],
  excludeIds: string[]
): string[] {
  const formatCounts: Record<string, number> = {};
  const diverseIds: string[] = [];
  
  for (const id of selectedIds) {
    const template = allTemplates.find(t => t.id === id);
    if (!template) continue;
    
    const format = getMemeFormatInfo(template).format;
    const currentCount = formatCounts[format] || 0;
    
    // Allow max 2 of same format
    if (currentCount < 2) {
      diverseIds.push(id);
      formatCounts[format] = currentCount + 1;
    }
  }
  
  // If we don't have enough, add from other templates
  if (diverseIds.length < 3) {
    const usedFormats = new Set(Object.keys(formatCounts).filter(f => formatCounts[f] >= 2));
    const alternatives = allTemplates
      .filter(t => 
        !diverseIds.includes(t.id) && 
        !excludeIds.includes(t.id) &&
        !usedFormats.has(getMemeFormatInfo(t).format)
      )
      .slice(0, 3 - diverseIds.length);
    
    for (const alt of alternatives) {
      diverseIds.push(alt.id);
    }
  }
  
  return diverseIds;
}

// Gold standard examples for few-shot learning
const GOLD_STANDARD_EXAMPLES = `
### EXAMPLE 1 (Multi-panel escalation):
TWEET: "I just spent 3 hours debugging a 5-line script that only had a typo."
MEME: Clown Applying Makeup
PANELS:
1. "Quick 5-line script"
2. "Why isn't it working?"
3. "Refactoring everything"
4. "It was a semicolon"
WHY IT WORKS: Each panel escalates the absurdity. The punchline is the contrast between effort and cause.

### EXAMPLE 2 (Label/misidentification):
TWEET: "My cat watching me work from home like I'm an intruder in his kingdom."
MEME: Is This a Pigeon
TEXT:
- Me: "My Cat"
- Object: "Me at my own desk"
- Caption: "Is this a trespasser?"
WHY IT WORKS: The meme image IS the joke (confident wrongness). Text just labels.

### EXAMPLE 3 (Multi-panel reveal):
TWEET: "The job says 'competitive salary' but they don't list it in the posting."
MEME: Anakin Padme 4 Panel
PANELS:
1. "Competitive salary"
2. "Above market rate, right?"
3. "..."
4. "Right??"
WHY IT WORKS: The silence IS the punchline. Builds false hope then drops it.

### EXAMPLE 4 (Comparison - A/B):
TWEET: "Reading documentation vs asking ChatGPT"
MEME: Drake Hotline Bling
TEXT:
- Top (reject): "Reading the docs"
- Bottom (prefer): "Pasting error into ChatGPT"
WHY IT WORKS: Extreme contrast between the responsible and lazy choice. Everyone relates.

### EXAMPLE 5 (Reaction - cause/effect):
TWEET: "Deployed to prod on Friday and went home"
MEME: Surprised Pikachu
TEXT:
- Top: "Deploy on Friday, go home"
- Bottom: "Everything breaks"
WHY IT WORKS: The outcome is OBVIOUS. That's the joke. Don't add extra text.

### EXAMPLE 6 (Single-text hot take):
TWEET: "Most meetings could be emails. Change my mind"
MEME: Change My Mind
TEXT:
- Center: "90% of meetings should be Slack messages"
WHY IT WORKS: Reframes the tweet as an even MORE extreme take. Doesn't just repeat it.

### EXAMPLE 7 (Top-bottom uncertainty):
TWEET: "Is my code good or did nobody review the PR?"
MEME: Futurama Fry
TEXT:
- Top: "Not sure if great code"
- Bottom: "Or just no reviewers"
WHY IT WORKS: Fits the "Not sure if X or Y" format perfectly. Specific to the situation.

### EXAMPLE 8 (3-panel self-sabotage):
TWEET: "Companies underpay employees then wonder why no one's loyal"
MEME: Bike Fall
TEXT:
- Panel 1: "Companies"
- Panel 2: "Minimum wage, no benefits"
- Panel 3: "Why is nobody loyal??"
WHY IT WORKS: The actor CAUSED the problem but blames others. Classic Bike Fall structure.

### EXAMPLE 9 (4-panel escalation):
TWEET: "My approach to problem solving: Google it, Stack Overflow, ask AI, rewrite from scratch"
MEME: Expanding Brain
TEXT:
- Panel 1: "Google the error"
- Panel 2: "Stack Overflow"
- Panel 3: "Ask Claude"
- Panel 4: "rm -rf and start over"
WHY IT WORKS: Each panel is MORE extreme. The last one is absurdly nuclear.

### EXAMPLE 10 (3-label agreement):
TWEET: "Frontend devs and backend devs both blame the API"
MEME: Epic Handshake
TEXT:
- Left arm: "Frontend devs"
- Right arm: "Backend devs"
- Handshake: "Blaming the API"
WHY IT WORKS: Two opposites united by one specific, relatable thing. Three labels, no wasted words.
`;

// MM-004: Self-critique and refine matches
async function critiqueAndRefine(
  tweet: string,
  matches: MemeMatch[],
  analysis: TweetAnalysis,
  templates: MemeTemplate[]
): Promise<MemeMatch[]> {
  if (matches.length === 0) return matches;

  const matchesSummary = matches.map(m => {
    const isMultiPanel = m.textBoxes.length > 2 || m.format === 'multi-panel';
    if (isMultiPanel) {
      const panelTexts = m.textBoxes.map(tb => `${tb.position}: "${tb.text}"`).join(' / ');
      return `${m.templateName} [multi-panel]: ${panelTexts}`;
    }
    return `${m.templateName}: "${m.suggestedTopText}" / "${m.suggestedBottomText}"`;
  }).join('\n');

  const prompt = `Critique these meme matches and fix any problems.

TWEET: "${tweet}"
Analysis: ${analysis.humorType} humor, ${analysis.sentiment} sentiment

CURRENT MATCHES:
${matchesSummary}

CRITIQUE CHECKLIST (be ruthless):
1. **Standalone test** — Would someone who HASN'T seen the tweet still get the joke? If not, fix it.
2. **Redundancy** — Does the text describe what the meme image already shows? (e.g., writing "surprised" on Surprised Pikachu). Remove it.
3. **Length** — Any text box over 8 words? Shorten it. 3 words > 8 words.
4. **Specificity** — Generic phrases like "When you", "Me:", "POV:", "Nobody:"? Replace with specific content.
5. **Comedy structure** — Comparison memes: is the contrast EXTREME enough? Multi-panel: does it ESCALATE? Reaction: is the cause SPECIFIC?
6. **Format integrity** — Multi-panel memes: ALL panels must be filled. Missing panels = broken meme.

If ALL matches are good, reply: {"approved": true}

If ANY match needs fixing, reply with the FIXED version.
For top/bottom memes use newTopText/newBottomText.
For multi-panel memes use newPanel1/newPanel2/newPanel3/newPanel4.
{
  "approved": false,
  "fixes": [
    {"templateId": "id", "newTopText": "fixed", "newBottomText": "fixed", "newPanel1": "", "newPanel2": "", "newPanel3": "", "newPanel4": "", "issue": "what was wrong"}
  ]
}`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text) as { approved?: boolean; fixes?: Array<{templateId: string; newTopText?: string; newBottomText?: string; newPanel1?: string; newPanel2?: string; newPanel3?: string; newPanel4?: string; issue: string}> } | null;

      if (parsed?.approved) {
        console.log('MM-004: Matches approved by self-critique');
        return matches;
      }

      if (parsed?.fixes && Array.isArray(parsed.fixes)) {
        console.log('MM-004: Applying fixes:', parsed.fixes.map(f => f.issue).join(', '));
        return matches.map(match => {
          const fix = parsed.fixes?.find(f => f.templateId === match.templateId);
          if (!fix) return match;

          const isMultiPanel = match.textBoxes.length > 2 || match.format === 'multi-panel';

          if (isMultiPanel) {
            // Preserve original textBoxes structure, only update text content
            const panelMap: Record<string, string | undefined> = {
              panel1: fix.newPanel1,
              panel2: fix.newPanel2,
              panel3: fix.newPanel3,
              panel4: fix.newPanel4,
            };
            const updatedBoxes = match.textBoxes.map(tb => {
              const newText = panelMap[tb.position];
              return newText ? { ...tb, text: newText } : tb;
            });
            return {
              ...match,
              suggestedTopText: fix.newPanel1 || match.suggestedTopText,
              suggestedBottomText: fix.newPanel2 || match.suggestedBottomText,
              textBoxes: updatedBoxes,
            };
          }

          // Standard top/bottom memes
          return {
            ...match,
            suggestedTopText: fix.newTopText || match.suggestedTopText,
            suggestedBottomText: fix.newBottomText || match.suggestedBottomText,
            textBoxes: match.textBoxes.map(tb => {
              if (tb.position === 'top' && fix.newTopText) return { ...tb, text: fix.newTopText };
              if (tb.position === 'bottom' && fix.newBottomText) return { ...tb, text: fix.newBottomText };
              return tb;
            }),
          };
        });
      }
    }
  } catch (error) {
    console.error('Self-critique failed:', error);
  }

  return matches;
}

// Main matching function: select + caption (1 call) → critique (1 call)
async function generateMemeMatches(
  tweet: string,
  templates: MemeTemplate[],
  analysis: TweetAnalysis,
  excludeIds: string[] = [],
  feedback?: string
): Promise<MemeMatch[] | null> {
  const feedbackNote = feedback ? ` (User wants: ${feedback})` : '';

  console.log('MM-003: Selecting templates + generating captions...');
  let matches = await selectAndCaption(
    tweet + feedbackNote,
    templates,
    analysis,
    excludeIds,
    3
  );

  if (matches.length === 0) {
    console.log('Select + caption failed');
    return null;
  }

  console.log('MM-004: Running self-critique...');
  matches = await critiqueAndRefine(tweet, matches, analysis, templates);

  return matches.length > 0 ? matches : null;
}


// Intelligent fallback - still uses AI but with a simpler prompt + analysis
async function generateFallbackMatches(
  tweet: string,
  templates: MemeTemplate[],
  excludeIds: string[] = [],
  analysis?: TweetAnalysis
): Promise<MemeMatch[]> {
  // Filter templates based on analysis if available
  const allTemplates = [
    { id: '181913649', name: 'Drake Hotline Bling', hint: 'reject A, prefer B', types: ['comparison'] },
    { id: '161865971', name: 'Tuxedo Winnie the Pooh', hint: 'basic vs fancy', types: ['comparison'] },
    { id: '155067746', name: 'Surprised Pikachu', hint: 'obvious result is obvious', types: ['irony', 'sarcasm'] },
    { id: '129242436', name: 'Change My Mind', hint: 'hot take statement', types: ['hot-take', 'observation'] },
    { id: '438680', name: 'Batman Slapping Robin', hint: 'shut down bad take', types: ['roast', 'complaint'] },
    { id: '252600902', name: 'Always Has Been', hint: 'reveal something was always true', types: ['irony', 'observation'] },
    { id: '79132341', name: 'Bike Fall', hint: 'self-sabotage', types: ['self-deprecation', 'irony'] },
    { id: '178591752', name: 'Clown Applying Makeup', hint: 'escalating bad decisions', types: ['self-deprecation'] },
    { id: '61544', name: 'This Is Fine', hint: 'ignoring problems', types: ['irony', 'sarcasm'] },
  ];

  // Prioritize templates matching the humor type
  let simpleTemplates = allTemplates.filter((t) => !excludeIds.includes(t.id));
  if (analysis) {
    const matchingTypes = simpleTemplates.filter(t => 
      t.types.includes(analysis.humorType) || 
      (analysis.secondaryHumorType && t.types.includes(analysis.secondaryHumorType))
    );
    const otherTypes = simpleTemplates.filter(t => 
      !t.types.includes(analysis.humorType) && 
      !(analysis.secondaryHumorType && t.types.includes(analysis.secondaryHumorType))
    );
    simpleTemplates = [...matchingTypes, ...otherTypes].slice(0, 6);
  }

  const analysisHint = analysis 
    ? `\nThis tweet is ${analysis.humorType} humor. Core point: "${analysis.corePoint}"`
    : '';

  const simplePrompt = `Turn this tweet into 3 memes. Be creative and funny.${analysisHint}

Tweet: "${tweet}"

Available memes:
${simpleTemplates.map((t) => `• ${t.name} (ID: ${t.id}) - ${t.hint}`).join('\n')}

Reply with JSON array only:
[{"templateId":"ID","templateName":"name","suggestedTopText":"top","suggestedBottomText":"bottom","reasoning":"why"}]`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      temperature: 0.7,
      messages: [{ role: 'user', content: simplePrompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map((m) => {
          const template = templates.find((t) => t.id === m.templateId);
          const formatInfo = template ? getMemeFormatInfo(template) : null;
          return {
            templateId: m.templateId || '181913649',
            templateName: m.templateName || 'Meme',
            reasoning: m.reasoning || 'A good fit for this tweet',
            suggestedTopText: String(m.suggestedTopText || tweet).slice(0, 80),
            suggestedBottomText: String(m.suggestedBottomText || 'This is fine').slice(0, 80),
            format: formatInfo?.format || 'comparison',
            textBoxes: [
              { position: 'top', text: String(m.suggestedTopText || tweet).slice(0, 80) },
              { position: 'bottom', text: String(m.suggestedBottomText || 'This is fine').slice(0, 80) },
            ],
          };
        });
      }
    }
  } catch (error) {
    console.error('Fallback AI also failed:', error);
  }

  // Ultimate fallback: generate captions based on tweet structure
  console.log('Using hardcoded fallback with tweet-based captions');
  return generateHardcodedFallback(tweet, templates, excludeIds);
}

// Last resort: hardcoded templates with tweet-derived captions
function generateHardcodedFallback(
  tweet: string,
  templates: MemeTemplate[],
  excludeIds: string[] = []
): MemeMatch[] {
  // Extract key elements from the tweet
  const essence = extractTweetEssence(tweet);
  
  const fallbackConfigs = [
    {
      id: '181913649',
      name: 'Drake Hotline Bling',
      format: 'comparison' as const,
      getTexts: () => ({
        top: essence.badThing || essence.subject || truncate(tweet, 40),
        bottom: essence.goodThing || essence.punchline || 'This instead',
      }),
      reasoning: 'Classic rejection/approval format',
    },
    {
      id: '155067746',
      name: 'Surprised Pikachu',
      format: 'reaction' as const,
      getTexts: () => ({
        top: essence.action || truncate(tweet, 45),
        bottom: essence.result || 'Everyone: *shocked*',
      }),
      reasoning: 'Perfect for obvious outcomes',
    },
    {
      id: '129242436',
      name: 'Change My Mind',
      format: 'label' as const,
      getTexts: () => ({
        top: essence.hotTake || essence.subject || truncate(tweet, 50),
        bottom: 'Change my mind',
      }),
      reasoning: 'Great for hot takes and opinions',
    },
    {
      id: '252600902',
      name: 'Always Has Been',
      format: 'reaction' as const,
      getTexts: () => ({
        top: `Wait, ${essence.subject || 'it'}'s ${essence.quality || 'like this'}?`,
        bottom: 'Always has been',
      }),
      reasoning: 'Reveals something was always true',
    },
    {
      id: '438680',
      name: 'Batman Slapping Robin',
      format: 'reaction' as const,
      getTexts: () => ({
        top: essence.badTake || truncate(tweet, 35),
        bottom: essence.correction || 'No.',
      }),
      reasoning: 'Shutting down bad takes',
    },
    {
      id: '161865971',
      name: 'Tuxedo Winnie the Pooh',
      format: 'comparison' as const,
      getTexts: () => ({
        top: essence.basicVersion || truncate(tweet, 40),
        bottom: essence.fancyVersion || 'The sophisticated approach',
      }),
      reasoning: 'Basic vs fancy comparison',
    },
  ];

  const excludeSet = new Set(excludeIds);
  const available = fallbackConfigs.filter(
    (c) => !excludeSet.has(c.id) && templates.some((t) => t.id === c.id)
  );

  // Shuffle to add variety
  const shuffled = available.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, 3);
  
  if (selected.length < 3) {
    const remaining = templates
      .filter((t) => !excludeSet.has(t.id) && !selected.some((s) => s.id === t.id))
      .slice(0, 3 - selected.length);
    
    for (const t of remaining) {
      selected.push({
        id: t.id,
        name: t.name,
        format: 'reaction' as const,
        getTexts: () => ({
          top: truncate(tweet, 45),
          bottom: 'This is fine',
        }),
        reasoning: 'A versatile meme template',
      });
    }
  }

  return selected.map((config) => {
    const texts = config.getTexts();
    return {
      templateId: config.id,
      templateName: config.name,
      reasoning: config.reasoning,
      suggestedTopText: texts.top,
      suggestedBottomText: texts.bottom,
      format: config.format,
      textBoxes: [
        { position: 'top', text: texts.top },
        { position: 'bottom', text: texts.bottom },
      ],
    };
  });
}

// Extract meaningful elements from a tweet for better fallback captions
function extractTweetEssence(tweet: string): {
  subject?: string;
  action?: string;
  result?: string;
  quality?: string;
  hotTake?: string;
  badThing?: string;
  goodThing?: string;
  badTake?: string;
  correction?: string;
  basicVersion?: string;
  fancyVersion?: string;
  punchline?: string;
} {
  const essence: ReturnType<typeof extractTweetEssence> = {};
  
  // Check for Tired/Wired pattern
  const tiredWired = tweet.match(/tired[:\s]+(.+?)\s*[\/\|\n]\s*wired[:\s]+(.+)/i);
  if (tiredWired) {
    essence.badThing = truncate(tiredWired[1].trim(), 40);
    essence.goodThing = truncate(tiredWired[2].trim(), 40);
    essence.basicVersion = essence.badThing;
    essence.fancyVersion = essence.goodThing;
  }
  
  // Check for vs pattern
  const vsMatch = tweet.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (vsMatch && !essence.badThing) {
    essence.badThing = truncate(vsMatch[1].trim(), 40);
    essence.goodThing = truncate(vsMatch[2].trim(), 40);
  }
  
  // Check for "X is Y" pattern (hot takes)
  const isMatch = tweet.match(/^(.{10,50})\s+is\s+(.{5,30})/i);
  if (isMatch) {
    essence.subject = truncate(isMatch[1].trim(), 35);
    essence.quality = truncate(isMatch[2].trim(), 25);
    essence.hotTake = truncate(`${isMatch[1].trim()} is ${isMatch[2].trim()}`, 50);
  }
  
  // Look for sentences/clauses
  const sentences = tweet.split(/[.!?\n]+/).filter(s => s.trim().length > 5);
  if (sentences.length >= 2) {
    essence.action = truncate(sentences[0].trim(), 45);
    essence.result = truncate(sentences[sentences.length - 1].trim(), 45);
    essence.punchline = essence.result;
  }
  
  // Extract main subject (first noun phrase or key term)
  const words = tweet.split(/\s+/);
  const capitalWords = words.filter(w => /^[A-Z][a-z]+/.test(w) && w.length > 2);
  if (capitalWords.length > 0) {
    essence.subject = capitalWords[0];
  }
  
  // Look for negative statements (for Batman slap)
  const negativeMatch = tweet.match(/(worst|bad|terrible|awful|sucks|hate|stupid|dumb)/i);
  if (negativeMatch) {
    const beforeNeg = tweet.slice(0, tweet.indexOf(negativeMatch[0])).trim();
    essence.badTake = truncate(beforeNeg || tweet, 35);
    essence.correction = 'Facts though';
  }
  
  return essence;
}

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3) + '...';
}

// Main export
export async function matchTweetToMemes(
  tweet: string,
  templates: MemeTemplate[],
  feedback?: string,
  previousIds?: string[]
): Promise<MatchResult> {
  const excludeIds = previousIds || [];
  
  console.log('=== Starting meme matching ===');
  console.log('Tweet:', tweet);
  console.log('Excluded IDs:', excludeIds);

  // MM-001: First, analyze the tweet
  console.log('Step 1: Analyzing tweet...');
  const analysis = await analyzeTweet(tweet);
  console.log('Analysis complete:', analysis.humorType, analysis.sentiment);

  // MM-002: Score all templates based on the analysis
  console.log('Step 2: Scoring templates...');
  const scoringInput: ScoringInput = {
    humorType: analysis.humorType,
    secondaryHumorType: analysis.secondaryHumorType,
    hasTwoAlternatives: analysis.hasTwoAlternatives,
    hasObviousOutcome: analysis.hasObviousOutcome,
    isSelfSabotage: analysis.isSelfSabotage,
    sentiment: analysis.sentiment,
    topics: analysis.topics,  // NEW: Pass detected topics
    hasMultipleSteps: analysis.hasMultipleSteps,  // NEW: Multi-step detection
  };
  
  // Get top 20 scored templates (filtered by excludeIds)
  const filteredTemplates = templates.filter(t => !excludeIds.includes(t.id));
  const topTemplates = getTopScoredTemplates(filteredTemplates, scoringInput, 20);
  
  // Log top 5 scores for debugging
  const topScores = scoreTemplates(filteredTemplates, scoringInput).slice(0, 5);
  console.log('Top 5 template scores:', topScores.map(s => `${s.templateName}: ${s.score}`).join(', '));

  // Step 3: Use AI to select and generate captions from top-scored templates
  console.log('Step 3: AI selecting from top-scored templates...');
  const matches = await generateMemeMatches(tweet, topTemplates, analysis, excludeIds, feedback);
  
  if (matches && matches.length > 0) {
    console.log('Primary matching succeeded');
    return {
      matches,
      modified: false,
    };
  }

  console.log('Primary matching failed, trying fallback...');
  
  // Fallback: simpler matching (still uses analysis for better fallback captions)
  const fallbackMatches = await generateFallbackMatches(tweet, templates, excludeIds, analysis);
  
  return {
    matches: fallbackMatches,
    modified: true,
    message: "We generated some meme options for you. Click 'Try again' for different choices!",
  };
}
