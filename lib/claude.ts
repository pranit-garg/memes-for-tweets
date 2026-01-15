import Anthropic from '@anthropic-ai/sdk';
import { MemeTemplate, getMemeFormatInfo, MEME_FORMAT_DATABASE } from './imgflip';

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

// Single, robust matching function
async function generateMemeMatches(
  tweet: string,
  templates: MemeTemplate[],
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

  const prompt = `You are an elite meme creator who understands EXACTLY how each meme format works.

TWEET TO MEME:
"${tweet}"
${feedbackLine}${excludeLine}
## STEP 1: ANALYZE THE TWEET
First, identify what type of content this is:
- Is it a HOT TAKE or opinion? (good for: Change My Mind, Sign memes)
- Is it IRONIC/SARCASTIC observation? (good for: This Is Fine, Bike Fall, Galaxy Brain)
- Is it a COMPARISON between two things? (good for: Drake, Tuxedo Pooh - ONLY if comparing)
- Is it a PREDICTABLE OUTCOME? (good for: Surprised Pikachu - "did X, got X result, shocked")
- Is it SELF-DEPRECATION? (good for: Clown applying makeup, Bike Fall)
- Is it a FRUSTRATION or complaint? (good for: Batman Slap, Angry Lady Cat)

## STEP 2: FORMAT MATCHING RULES (CRITICAL!)
ONLY use a format if the tweet ACTUALLY fits its structure:

• Drake/Tuxedo Pooh: ONLY for "I prefer B over A" tweets. The tweet MUST have two alternatives.
  ❌ BAD: "Grok is bad" → Drake doesn't work because there's no preference choice
  ✓ GOOD: "Reading docs vs asking ChatGPT" → Drake works because it's comparing two options

• Surprised Pikachu: ONLY for "obvious cause → obvious effect → surprise" 
  ❌ BAD: Generic "X happens" → "reaction"  
  ✓ GOOD: "Train AI on garbage → AI outputs garbage → *shocked*"

• Bike Fall: Perfect for "X causes Y but they blame Z" or self-sabotage
  ✓ GOOD: "Grok trains on Twitter brainrot → produces brainrot → X is confused"

• This Is Fine: For ignoring obvious problems or chaos
• Change My Mind: For controversial opinions stated as facts
• Always Has Been: For "wait, X was always Y?" revelations
• Expanding Brain: For increasingly absurd takes on one topic
• Distracted Boyfriend: ONLY when there's literally "thing I should want" vs "temptation"

## STEP 3: CAPTION RULES
- MAX 6-8 words per text box
- NO generic phrases like "Me:", "When you...", "POV:", "Nobody:"
- Transform the tweet's IDEA, don't just copy its words
- The caption should work even without seeing the original tweet

## AVAILABLE TEMPLATES:
${templateContext}

## OUTPUT FORMAT (JSON array, no markdown):
[
  {
    "templateId": "exact ID from list",
    "templateName": "template name", 
    "reasoning": "Specific reason why this format's structure matches the tweet's structure",
    "suggestedTopText": "short punchy text",
    "suggestedBottomText": "short punchy text"
  }
]

Return exactly 3 memes that ACTUALLY fit their format. Quality over forcing a format.`;

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

// Intelligent fallback - still uses AI but with a simpler prompt
async function generateFallbackMatches(
  tweet: string,
  templates: MemeTemplate[],
  excludeIds: string[] = []
): Promise<MemeMatch[]> {
  // Try a simpler, more constrained prompt
  const simpleTemplates = [
    { id: '181913649', name: 'Drake Hotline Bling', hint: 'reject A, prefer B' },
    { id: '161865971', name: 'Tuxedo Winnie the Pooh', hint: 'basic vs fancy' },
    { id: '155067746', name: 'Surprised Pikachu', hint: 'obvious result is obvious' },
    { id: '129242436', name: 'Change My Mind', hint: 'hot take statement' },
    { id: '438680', name: 'Batman Slapping Robin', hint: 'shut down bad take' },
    { id: '252600902', name: 'Always Has Been', hint: 'reveal something was always true' },
  ].filter((t) => !excludeIds.includes(t.id));

  const simplePrompt = `Turn this tweet into 3 memes. Be creative and funny.

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

  // First attempt: full matching
  const matches = await generateMemeMatches(tweet, templates, excludeIds, feedback);
  
  if (matches && matches.length > 0) {
    console.log('Primary matching succeeded');
    return {
      matches,
      modified: false,
    };
  }

  console.log('Primary matching failed, trying fallback...');
  
  // Second attempt: simpler fallback with AI
  const fallbackMatches = await generateFallbackMatches(tweet, templates, excludeIds);
  
  return {
    matches: fallbackMatches,
    modified: true,
    message: "We generated some meme options for you. Click 'Try again' for different choices!",
  };
}
