import Anthropic from '@anthropic-ai/sdk';
import { MemeTemplate, getMemeFormatInfo, MEME_FORMAT_DATABASE, scoreTemplates, getTopScoredTemplates, type ScoringInput } from './imgflip';

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
  "hasMultipleSteps": true if the tweet describes a sequence/progression (for multi-panel memes like Gru's Plan, Clown Makeup)
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
  };
}

// Build a curated template list with rich context
function getCuratedTemplates(
  templates: MemeTemplate[],
  excludeIds: string[] = []
): string {
  const excludeSet = new Set(excludeIds);
  const curatedIds = Object.keys(MEME_FORMAT_DATABASE);
  
  // Get curated templates first (we have rich descriptions for these)
  const curated = templates.filter(
    (t) => curatedIds.includes(t.id) && !excludeSet.has(t.id)
  );
  
  // Add some popular templates not in our curated list
  const popular = templates
    .filter((t) => !curatedIds.includes(t.id) && !excludeSet.has(t.id))
    .slice(0, 25);
  
  const all = [...curated, ...popular];
  
  return all
    .map((t) => {
      const info = getMemeFormatInfo(t);
      return `• ${t.name} (ID: ${t.id})
  Format: ${info.format} | Boxes: ${t.box_count}
  Best for: ${info.bestFor}
  How it works: ${info.description}`;
    })
    .join('\n\n');
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

// MM-003: Step 1 - Select best template IDs
// IMPROVED: Now enforces diversity (different formats) and considers topics
async function selectBestTemplates(
  tweet: string,
  templates: MemeTemplate[],
  analysis: TweetAnalysis,
  excludeIds: string[] = [],
  count: number = 3
): Promise<string[]> {
  const templateList = templates
    .filter(t => !excludeIds.includes(t.id))
    .map(t => {
      const info = getMemeFormatInfo(t);
      const topicStr = info.topicTags?.join(', ') || 'universal';
      return `${t.id}: ${t.name} (${info.format}) - ${info.bestFor} [topics: ${topicStr}]`;
    })
    .join('\n');

  const topicsStr = analysis.topics?.join(', ') || 'general';
  const multiStepHint = analysis.hasMultipleSteps 
    ? '\n- Has multiple steps/progression: YES - consider multi-panel memes like Grus Plan, Clown Makeup, Expanding Brain'
    : '';

  const prompt = `Select the ${count} BEST meme templates for this tweet.

TWEET: "${tweet}"

ANALYSIS:
- Humor: ${analysis.humorType}
- Sentiment: ${analysis.sentiment}
- Core point: ${analysis.corePoint}
- Topics: ${topicsStr}
- Has comparison: ${analysis.hasTwoAlternatives}
- Has obvious outcome: ${analysis.hasObviousOutcome}
- Self-sabotage: ${analysis.isSelfSabotage}${multiStepHint}

RULES:
- ONLY comparison memes (Drake, Tuxedo Pooh) if tweet has TWO alternatives
- Surprised Pikachu ONLY for obvious cause→effect
- Match the humor type to the template
- DIVERSITY: Pick templates with DIFFERENT formats (don't pick 3 comparison memes!)
- Prefer templates matching the tweet's topics

TEMPLATES:
${templateList}

Reply with ONLY a JSON array of ${count} template IDs:
["id1", "id2", "id3"]`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      temperature: 0.5,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text);
      if (Array.isArray(parsed) && parsed.every(id => typeof id === 'string')) {
        // Enforce diversity: check formats
        const selectedIds = parsed.slice(0, count);
        const diversified = enforceDiversity(selectedIds, templates, excludeIds);
        console.log('Selected templates (with diversity):', diversified);
        return diversified;
      }
    }
  } catch (error) {
    console.error('Template selection failed:', error);
  }

  // Fallback: return top-scored template IDs with diversity
  return enforceDiversity(
    templates.slice(0, count * 2).map(t => t.id),
    templates,
    excludeIds
  ).slice(0, count);
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

// Caption tone styles for variety
type CaptionTone = 'deadpan' | 'exaggerated' | 'absurdist' | 'wholesome' | 'savage';

const TONE_INSTRUCTIONS: Record<CaptionTone, string> = {
  deadpan: 'Use a dry, matter-of-fact tone. No exclamation marks. State things plainly for comedic effect.',
  exaggerated: 'Amp up the drama! Use hyperbole and dramatic statements. Make it over-the-top.',
  absurdist: 'Go weird and unexpected. Non-sequiturs welcome. Subvert expectations.',
  wholesome: 'Keep it light and relatable. Gentle humor that everyone can enjoy.',
  savage: 'Go hard. Be brutally honest. No holding back on the roast.',
};

// MM-003: Step 2 - Generate captions for selected templates
// IMPROVED: Now supports multi-panel memes with 3-4 text boxes and varied tones
async function generateCaptions(
  tweet: string,
  selectedTemplates: MemeTemplate[],
  analysis: TweetAnalysis
): Promise<MemeMatch[]> {
  // Assign different tones to each template for variety
  const tones: CaptionTone[] = ['deadpan', 'exaggerated', 'absurdist', 'wholesome', 'savage'];
  const shuffledTones = tones.sort(() => Math.random() - 0.5);
  
  const templateDetails = selectedTemplates.map((t, idx) => {
    const info = getMemeFormatInfo(t);
    const examples = info.exampleCaptions?.join(' | ') || 'None';
    const boxesDesc = info.textBoxes.map(b => `${b.position}: ${b.purpose}`).join(', ');
    const isMultiPanel = info.format === 'multi-panel' || info.textBoxes.length > 2;
    const assignedTone = shuffledTones[idx % shuffledTones.length];
    
    return `Template ${idx + 1}: ${t.name} (ID: ${t.id})
Format: ${info.format}${isMultiPanel ? ' (MULTI-PANEL - use all boxes!)' : ''}
How it works: ${info.description}
Text boxes: ${boxesDesc}
Example captions: ${examples}
TONE FOR THIS ONE: ${assignedTone.toUpperCase()} - ${TONE_INSTRUCTIONS[assignedTone]}`;
  }).join('\n\n');

  const prompt = `Generate perfect captions for these meme templates.

TWEET: "${tweet}"
Core point: "${analysis.corePoint}"
Humor type: ${analysis.humorType}

${templateDetails}

CAPTION RULES:
1. MAX 6-8 words per text box
2. NO "Me:", "When you...", "POV:", "Nobody:"
3. Transform the tweet's IDEA - don't copy words
4. Make it FUNNY and PUNCHY
5. Each meme should feel fresh and creative
6. For MULTI-PANEL memes: Fill ALL panels! Use panel1, panel2, panel3, panel4 as needed.
7. IMPORTANT: Follow the assigned TONE for each template to make them feel different!

Return JSON array:
[
  {
    "templateId": "exact ID",
    "templateName": "name",
    "reasoning": "Why this works for the humor type",
    "suggestedTopText": "for top/bottom memes",
    "suggestedBottomText": "for top/bottom memes",
    "panel1": "for multi-panel (if applicable)",
    "panel2": "for multi-panel (if applicable)",
    "panel3": "for multi-panel (if applicable)",
    "panel4": "for multi-panel (if applicable)"
  }
]`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text);
      if (Array.isArray(parsed)) {
        return parsed.map(m => {
          const template = selectedTemplates.find(t => t.id === m.templateId);
          const formatInfo = template ? getMemeFormatInfo(template) : null;
          const isMultiPanel = formatInfo?.format === 'multi-panel' || (formatInfo?.textBoxes.length || 0) > 2;
          
          // Build textBoxes based on template format
          let textBoxes: TextBox[];
          if (isMultiPanel && (m.panel1 || m.panel2)) {
            // Multi-panel meme
            textBoxes = [];
            if (m.panel1) textBoxes.push({ position: 'panel1', text: String(m.panel1).slice(0, 100) });
            if (m.panel2) textBoxes.push({ position: 'panel2', text: String(m.panel2).slice(0, 100) });
            if (m.panel3) textBoxes.push({ position: 'panel3', text: String(m.panel3).slice(0, 100) });
            if (m.panel4) textBoxes.push({ position: 'panel4', text: String(m.panel4).slice(0, 100) });
            // Fallback: if no panels but has top/bottom, use those
            if (textBoxes.length === 0) {
              textBoxes = [
                { position: 'top', text: String(m.suggestedTopText || '').slice(0, 100) },
                { position: 'bottom', text: String(m.suggestedBottomText || '').slice(0, 100) },
              ];
            }
          } else {
            // Standard top/bottom meme
            textBoxes = [
              { position: 'top', text: String(m.suggestedTopText || '').slice(0, 100) },
              { position: 'bottom', text: String(m.suggestedBottomText || '').slice(0, 100) },
            ];
          }
          
          return {
            templateId: m.templateId,
            templateName: m.templateName || template?.name || 'Meme',
            reasoning: m.reasoning || 'Great match',
            suggestedTopText: String(m.suggestedTopText || m.panel1 || '').slice(0, 100),
            suggestedBottomText: String(m.suggestedBottomText || m.panel2 || '').slice(0, 100),
            format: formatInfo?.format || 'top-bottom',
            textBoxes,
          };
        });
      }
    }
  } catch (error) {
    console.error('Caption generation failed:', error);
  }

  return [];
}

// MM-004: Self-critique and refine matches
async function critiqueAndRefine(
  tweet: string,
  matches: MemeMatch[],
  analysis: TweetAnalysis,
  templates: MemeTemplate[]
): Promise<MemeMatch[]> {
  if (matches.length === 0) return matches;

  const matchesSummary = matches.map(m => 
    `${m.templateName}: "${m.suggestedTopText}" / "${m.suggestedBottomText}"`
  ).join('\n');

  const prompt = `Critique these meme matches and fix any problems.

TWEET: "${tweet}"
Analysis: ${analysis.humorType} humor, ${analysis.sentiment} sentiment

CURRENT MATCHES:
${matchesSummary}

CRITIQUE CHECKLIST:
1. Is text TOO LONG (>8 words)? → Shorten it
2. Is text GENERIC ("Me:", "When you", "POV")? → Make it specific
3. Does the meme FORMAT match the tweet structure?
   - Comparison memes need TWO alternatives
   - Reaction memes need a cause→effect
4. Is the caption ACTUALLY FUNNY?

If ALL matches are good, reply: {"approved": true}

If ANY match needs fixing, reply with the FIXED version:
{
  "approved": false,
  "fixes": [
    {"templateId": "id", "newTopText": "fixed", "newBottomText": "fixed", "issue": "what was wrong"}
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
      const parsed = extractJson(content.text) as { approved?: boolean; fixes?: Array<{templateId: string; newTopText: string; newBottomText: string; issue: string}> } | null;
      
      if (parsed?.approved) {
        console.log('MM-004: Matches approved by self-critique');
        return matches;
      }

      if (parsed?.fixes && Array.isArray(parsed.fixes)) {
        console.log('MM-004: Applying fixes:', parsed.fixes.map(f => f.issue).join(', '));
        return matches.map(match => {
          const fix = parsed.fixes?.find(f => f.templateId === match.templateId);
          if (fix) {
            return {
              ...match,
              suggestedTopText: fix.newTopText || match.suggestedTopText,
              suggestedBottomText: fix.newBottomText || match.suggestedBottomText,
              textBoxes: [
                { position: 'top', text: fix.newTopText || match.suggestedTopText },
                { position: 'bottom', text: fix.newBottomText || match.suggestedBottomText },
              ],
            };
          }
          return match;
        });
      }
    }
  } catch (error) {
    console.error('Self-critique failed:', error);
  }

  return matches;
}

// Main two-step matching function with critique
async function generateMemeMatches(
  tweet: string,
  templates: MemeTemplate[],
  analysis: TweetAnalysis,
  excludeIds: string[] = [],
  feedback?: string
): Promise<MemeMatch[] | null> {
  const feedbackNote = feedback ? ` (User wants: ${feedback})` : '';
  
  console.log('MM-003 Step 1: Selecting templates...');
  const selectedIds = await selectBestTemplates(
    tweet + feedbackNote, 
    templates, 
    analysis, 
    excludeIds, 
    3
  );
  
  const selectedTemplates = selectedIds
    .map(id => templates.find(t => t.id === id))
    .filter((t): t is MemeTemplate => t !== undefined);
  
  if (selectedTemplates.length === 0) {
    console.log('No templates selected, using fallback');
    return null;
  }

  console.log('MM-003 Step 2: Generating captions...');
  let matches = await generateCaptions(tweet, selectedTemplates, analysis);
  
  if (matches.length === 0) {
    console.log('Caption generation failed');
    return null;
  }

  console.log('MM-004: Running self-critique...');
  matches = await critiqueAndRefine(tweet, matches, analysis, templates);

  return matches.length > 0 ? matches : null;
}

// Legacy function for compatibility (deprecated)
async function generateMemeMatchesLegacy(
  tweet: string,
  templates: MemeTemplate[],
  analysis: TweetAnalysis,
  excludeIds: string[] = [],
  feedback?: string
): Promise<MemeMatch[] | null> {
  const templateContext = getCuratedTemplates(templates, excludeIds);
  
  const feedbackLine = feedback
    ? `\nUser feedback: "${feedback}" - use this to pick DIFFERENT memes than before.\n`
    : '';
  
  const excludeLine = excludeIds.length > 0
    ? `\nDO NOT USE these template IDs (already shown): ${excludeIds.join(', ')}\n`
    : '';

  // Build analysis context for the prompt
  const analysisContext = `
## PRE-ANALYZED TWEET INFO:
- **Sentiment**: ${analysis.sentiment}
- **Humor Type**: ${analysis.humorType}${analysis.secondaryHumorType ? ` (secondary: ${analysis.secondaryHumorType})` : ''}
- **Key Subjects**: ${analysis.keyEntities.length > 0 ? analysis.keyEntities.join(', ') : 'general'}
- **Core Point**: "${analysis.corePoint}"
- **Has Two Alternatives**: ${analysis.hasTwoAlternatives ? 'YES - good for comparison memes' : 'NO - avoid Drake/comparison memes'}
- **Has Obvious Outcome**: ${analysis.hasObviousOutcome ? 'YES - good for Surprised Pikachu' : 'NO'}
- **Is Self-Sabotage**: ${analysis.isSelfSabotage ? 'YES - perfect for Bike Fall' : 'NO'}
`;

  const prompt = `You are an elite meme creator. Use the pre-analyzed tweet info to pick PERFECT template matches.

TWEET: "${tweet}"
${analysisContext}
${feedbackLine}${excludeLine}

## TEMPLATE MATCHING RULES (USE THE ANALYSIS!):

Based on humor type "${analysis.humorType}":
${analysis.humorType === 'comparison' ? '→ USE: Drake, Tuxedo Pooh, Buff Doge vs Cheems' : ''}
${analysis.humorType === 'irony' || analysis.humorType === 'sarcasm' ? '→ USE: This Is Fine, Bike Fall, Surprised Pikachu (if obvious outcome)' : ''}
${analysis.humorType === 'hot-take' ? '→ USE: Change My Mind, Scroll of Truth' : ''}
${analysis.humorType === 'complaint' ? '→ USE: Batman Slapping Robin, Y U No, First World Problems' : ''}
${analysis.humorType === 'self-deprecation' ? '→ USE: Clown Applying Makeup, Bike Fall, Hide the Pain Harold' : ''}
${analysis.humorType === 'roast' ? '→ USE: Batman Slapping Robin, Disaster Girl' : ''}
${analysis.humorType === 'observation' ? '→ USE: Roll Safe, Futurama Fry, Third World Skeptical Kid' : ''}

${!analysis.hasTwoAlternatives ? '⚠️ NO comparison memes (Drake, Tuxedo Pooh) - tweet lacks two alternatives!' : ''}
${!analysis.hasObviousOutcome ? '⚠️ Avoid Surprised Pikachu unless you can frame an obvious cause→effect' : ''}
${analysis.isSelfSabotage ? '✓ Bike Fall is a GREAT fit for this self-sabotage situation!' : ''}

## CAPTION RULES:
- MAX 6-8 words per text box
- NO generic phrases like "Me:", "When you...", "POV:", "Nobody:"
- Transform the core point: "${analysis.corePoint}" into meme format
- The caption should work even without seeing the original tweet

## AVAILABLE TEMPLATES:
${templateContext}

## OUTPUT FORMAT (JSON array only):
[
  {
    "templateId": "exact ID from list",
    "templateName": "template name", 
    "reasoning": "Why this format matches the ${analysis.humorType} humor type",
    "suggestedTopText": "short punchy text",
    "suggestedBottomText": "short punchy text"
  }
]

Return exactly 3 memes that match the analyzed humor type. Quality over generic choices.`;

  try {
    console.log('=== generateMemeMatches START ===');
    console.log('API Key present:', !!process.env.ANTHROPIC_API_KEY);
    console.log('API Key length:', process.env.ANTHROPIC_API_KEY?.length || 0);
    console.log('Tweet:', tweet.slice(0, 50));
    
    const anthropic = getAnthropic();
    console.log('Anthropic client created');
    
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });

    console.log('Claude response received');
    console.log('Response content type:', response.content[0]?.type);

    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('Non-text response from Claude');
      return null;
    }

    console.log('Response text length:', content.text.length);
    console.log('Response preview:', content.text.slice(0, 300));
    
    const parsed = extractJson(content.text);
    
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array. Parsed:', typeof parsed);
      console.error('Full response:', content.text);
      return null;
    }

    console.log('Parsed array length:', parsed.length);

    // Validate and enrich matches
    const validMatches: MemeMatch[] = [];
    
    for (const match of parsed) {
      console.log('Processing match:', JSON.stringify(match).slice(0, 100));
      
      if (!match.templateId || !match.suggestedTopText || !match.suggestedBottomText) {
        console.log('Skipping invalid match - missing fields');
        continue;
      }
      
      const template = templates.find((t) => t.id === match.templateId);
      if (!template) {
        console.log('Template not found:', match.templateId);
        // Try to find by name instead
        const byName = templates.find((t) => 
          t.name.toLowerCase().includes(match.templateName?.toLowerCase() || '')
        );
        if (byName) {
          console.log('Found by name instead:', byName.id);
          match.templateId = byName.id;
        } else {
          continue;
        }
      }
      
      const finalTemplate = templates.find((t) => t.id === match.templateId);
      if (!finalTemplate) continue;
      
      const formatInfo = getMemeFormatInfo(finalTemplate);
      
      validMatches.push({
        templateId: match.templateId,
        templateName: match.templateName || finalTemplate.name,
        reasoning: match.reasoning || 'Great match for this tweet',
        suggestedTopText: String(match.suggestedTopText).slice(0, 100),
        suggestedBottomText: String(match.suggestedBottomText).slice(0, 100),
        format: formatInfo.format,
        textBoxes: [
          { position: 'top', text: String(match.suggestedTopText).slice(0, 100) },
          { position: 'bottom', text: String(match.suggestedBottomText).slice(0, 100) },
        ],
      });
    }

    console.log(`Valid matches found: ${validMatches.length}`);
    console.log('=== generateMemeMatches END ===');
    return validMatches.length > 0 ? validMatches.slice(0, 3) : null;
  } catch (error) {
    console.error('=== generateMemeMatches ERROR ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : String(error));
    console.error('Full error:', error);
    return null;
  }
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
      temperature: 0.9,
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
