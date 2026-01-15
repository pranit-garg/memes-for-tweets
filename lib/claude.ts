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

  const prompt = `You are a meme expert. Your job: turn this tweet into 3 hilarious memes.

TWEET:
"${tweet}"
${feedbackLine}${excludeLine}
AVAILABLE TEMPLATES:
${templateContext}

YOUR TASK:
1. Understand what the tweet is REALLY saying (the joke, the frustration, the insight)
2. Pick 3 DIFFERENT templates that fit the tweet's vibe
3. Write SHORT, PUNCHY captions (5-8 words max per line)
4. Make it FUNNY - transform the tweet, don't just restate it

CRITICAL RULES:
- Each meme must use a DIFFERENT template
- Captions must be SHORT (under 8 words each)
- The text must match how the meme format works (e.g., Drake = reject top, approve bottom)
- NO generic text like "Me:" or "When you..." - be specific to the tweet
- Make people actually want to share these memes

RESPONSE FORMAT (JSON array only, no other text):
[
  {
    "templateId": "exact ID from list",
    "templateName": "template name",
    "reasoning": "one sentence why this format fits",
    "suggestedTopText": "short top text",
    "suggestedBottomText": "short bottom text"
  },
  {
    "templateId": "different ID",
    "templateName": "template name",
    "reasoning": "one sentence why",
    "suggestedTopText": "top text",
    "suggestedBottomText": "bottom text"
  },
  {
    "templateId": "third different ID",
    "templateName": "template name",
    "reasoning": "one sentence why",
    "suggestedTopText": "top text",
    "suggestedBottomText": "bottom text"
  }
]`;

  try {
    console.log('Calling Claude API for meme matching...');
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      temperature: 0.8,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      console.error('Non-text response from Claude');
      return null;
    }

    console.log('Claude response received, parsing...');
    const parsed = extractJson(content.text);
    
    if (!Array.isArray(parsed)) {
      console.error('Response is not an array:', content.text.slice(0, 200));
      return null;
    }

    // Validate and enrich matches
    const validMatches: MemeMatch[] = [];
    
    for (const match of parsed) {
      if (!match.templateId || !match.suggestedTopText || !match.suggestedBottomText) {
        console.log('Skipping invalid match:', match);
        continue;
      }
      
      const template = templates.find((t) => t.id === match.templateId);
      if (!template) {
        console.log('Template not found:', match.templateId);
        continue;
      }
      
      const formatInfo = getMemeFormatInfo(template);
      
      validMatches.push({
        templateId: match.templateId,
        templateName: match.templateName || template.name,
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

    console.log(`Found ${validMatches.length} valid matches`);
    return validMatches.length > 0 ? validMatches.slice(0, 3) : null;
  } catch (error) {
    console.error('Claude API error:', error);
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
  const fallbackConfigs = [
    {
      id: '181913649',
      name: 'Drake Hotline Bling',
      format: 'comparison' as const,
      topTransform: (t: string) => extractFirstPart(t) || 'The old way',
      bottomTransform: (t: string) => extractSecondPart(t) || 'The new way',
    },
    {
      id: '161865971',
      name: 'Tuxedo Winnie the Pooh',
      format: 'comparison' as const,
      topTransform: (t: string) => extractFirstPart(t) || 'Normal approach',
      bottomTransform: (t: string) => extractSecondPart(t) || 'Sophisticated approach',
    },
    {
      id: '129242436',
      name: 'Change My Mind',
      format: 'label' as const,
      topTransform: (t: string) => truncate(t, 60),
      bottomTransform: () => 'Change my mind',
    },
    {
      id: '155067746',
      name: 'Surprised Pikachu',
      format: 'reaction' as const,
      topTransform: (t: string) => truncate(t, 50),
      bottomTransform: () => '*surprised face*',
    },
    {
      id: '438680',
      name: 'Batman Slapping Robin',
      format: 'reaction' as const,
      topTransform: (t: string) => extractFirstPart(t) || truncate(t, 40),
      bottomTransform: (t: string) => extractSecondPart(t) || 'No.',
    },
  ];

  const excludeSet = new Set(excludeIds);
  const available = fallbackConfigs.filter(
    (c) => !excludeSet.has(c.id) && templates.some((t) => t.id === c.id)
  );

  const selected = available.slice(0, 3);
  if (selected.length < 3) {
    // Add any available templates
    const remaining = templates
      .filter((t) => !excludeSet.has(t.id) && !selected.some((s) => s.id === t.id))
      .slice(0, 3 - selected.length);
    
    for (const t of remaining) {
      selected.push({
        id: t.id,
        name: t.name,
        format: 'top-bottom' as const,
        topTransform: (tw: string) => truncate(tw, 50),
        bottomTransform: () => 'Me, trying my best',
      });
    }
  }

  return selected.map((config) => ({
    templateId: config.id,
    templateName: config.name,
    reasoning: 'A versatile meme for this type of content',
    suggestedTopText: config.topTransform(tweet),
    suggestedBottomText: config.bottomTransform(tweet),
    format: config.format,
    textBoxes: [
      { position: 'top', text: config.topTransform(tweet) },
      { position: 'bottom', text: config.bottomTransform(tweet) },
    ],
  }));
}

// Helper: extract first part of a comparison tweet (before vs/vs./|/→)
function extractFirstPart(tweet: string): string | null {
  // Common patterns: "X vs Y", "Tired: X / Wired: Y", "Before: X / After: Y"
  const patterns = [
    /tired[:\s]+(.+?)\s*[\/\|]\s*wired/i,
    /before[:\s]+(.+?)\s*[\/\|]\s*after/i,
    /old[:\s]+(.+?)\s*[\/\|]\s*new/i,
    /(.+?)\s+vs\.?\s+/i,
    /(.+?)\s*[→→]\s*/,
    /(.+?)\s*[\/\|]\s*/,
  ];
  
  for (const pattern of patterns) {
    const match = tweet.match(pattern);
    if (match?.[1]) {
      return truncate(match[1].trim(), 50);
    }
  }
  
  // If tweet has line breaks, use first line
  const lines = tweet.split(/[\n\r]+/).filter((l) => l.trim());
  if (lines.length >= 2) {
    return truncate(lines[0].trim(), 50);
  }
  
  return null;
}

// Helper: extract second part of a comparison tweet
function extractSecondPart(tweet: string): string | null {
  const patterns = [
    /wired[:\s]+(.+)/i,
    /after[:\s]+(.+)/i,
    /new[:\s]+(.+)/i,
    /vs\.?\s+(.+)/i,
    /[→→]\s*(.+)/,
    /[\/\|]\s*(.+)/,
  ];
  
  for (const pattern of patterns) {
    const match = tweet.match(pattern);
    if (match?.[1]) {
      // Clean up any trailing patterns
      let result = match[1].trim();
      result = result.replace(/\s*[\/\|].+$/, '').trim();
      return truncate(result, 50);
    }
  }
  
  // If tweet has line breaks, use last line
  const lines = tweet.split(/[\n\r]+/).filter((l) => l.trim());
  if (lines.length >= 2) {
    return truncate(lines[lines.length - 1].trim(), 50);
  }
  
  return null;
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
