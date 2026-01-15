import Anthropic from '@anthropic-ai/sdk';
import { MemeTemplate, getTemplateDescriptions, getMemeFormatInfo } from './imgflip';

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

interface MemeRewrite {
  memePremise: string;
  setup: string;
  punchline: string;
  tone: string;
  tags: string[];
}

export interface MatchResult {
  matches: MemeMatch[];
  modified: boolean;
  modifiedTweet?: string;
  message?: string;
}

// Popular versatile memes that work for almost any situation
const FALLBACK_TEMPLATE_IDS = [
  '181913649', // Drake Hotline Bling
  '87743020',  // Two Buttons
  '112126428', // Distracted Boyfriend
  '129242436', // Change My Mind
  '131087935', // Running Away Balloon
  '224015000', // Bernie Sanders Once Again Asking
];

function pickRandomTemplates(
  templates: MemeTemplate[],
  count: number,
  excludeIds: string[] = []
): MemeTemplate[] {
  const excludeSet = new Set(excludeIds);
  const eligible = templates.filter((t) => !excludeSet.has(t.id));
  const shuffled = eligible.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function getFallbackMatches(
  templates: MemeTemplate[],
  tweet: string,
  previousIds: string[] = [],
  rewrite?: MemeRewrite | null
): MemeMatch[] {
  const fallbackTemplates = templates.filter((t) =>
    FALLBACK_TEMPLATE_IDS.includes(t.id)
  );

  const templatesToUse =
    fallbackTemplates.length >= 3
      ? pickRandomTemplates(fallbackTemplates, 3, previousIds)
      : pickRandomTemplates(templates.slice(0, 80), 3, previousIds);

  const topText = rewrite?.setup || tweet;
  const bottomText = rewrite?.punchline || 'Me, apparently';

  return templatesToUse.map((t) => {
    const format = getMemeFormatInfo(t);
    return {
      templateId: t.id,
      templateName: t.name,
      reasoning: 'A versatile meme that works well for expressing this idea',
      suggestedTopText:
        topText.length > 50 ? topText.substring(0, 50) + '...' : topText,
      suggestedBottomText: bottomText,
      textBoxes: format.textBoxes.map((box, i) => ({
        text:
          i === 0
            ? topText.length > 50
              ? topText.substring(0, 50) + '...'
              : topText
            : bottomText,
        position: box.position,
      })),
      format: format.format,
    };
  });
}

function extractJsonArray(text: string): string | null {
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function extractJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }
  return text.slice(start, end + 1);
}

function normalizeMatch(match: MemeMatch): MemeMatch {
  const topFromBoxes = match.textBoxes?.find((box) => box.position === 'top')?.text;
  const bottomFromBoxes = match.textBoxes?.find((box) => box.position === 'bottom')?.text;

  return {
    ...match,
    suggestedTopText: match.suggestedTopText || topFromBoxes || '',
    suggestedBottomText: match.suggestedBottomText || bottomFromBoxes || '',
    textBoxes: match.textBoxes && match.textBoxes.length > 0
      ? match.textBoxes
      : [
          { position: 'top', text: match.suggestedTopText || '' },
          { position: 'bottom', text: match.suggestedBottomText || '' },
        ],
  };
}

async function rewriteTweetForMeme(tweet: string): Promise<MemeRewrite | null> {
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Rewrite this tweet into a meme-ready premise.

Rules:
- Keep the meaning, but make it sharper and meme-appropriate.
- Provide a short setup + punchline that could fit top/bottom text.
- Each line must be under 60 characters.
- Use short, punchy fragments (not full sentences).

Return ONLY JSON:
{
  "memePremise": "One-line meme-ready rewrite",
  "setup": "Top text candidate",
  "punchline": "Bottom text candidate",
  "tone": "tone label",
  "tags": ["tag1", "tag2"]
}

Tweet: "${tweet}"`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const extracted = extractJsonObject(jsonText) || jsonText;
    const rewrite = JSON.parse(extracted) as MemeRewrite;

    if (!rewrite.memePremise || !rewrite.setup || !rewrite.punchline) {
      return null;
    }

    return rewrite;
  } catch {
    return null;
  }
}

async function tryMatchWithPrompt(
  tweet: string,
  templates: MemeTemplate[],
  feedback?: string,
  previousIds?: string[],
  options: { maxTemplates?: number; compact?: boolean; rewrite?: MemeRewrite | null } = {}
): Promise<MemeMatch[] | null> {
  const { maxTemplates = 150, compact = false, rewrite = null } = options;
  const templateDescriptions = getTemplateDescriptions(templates, {
    maxTemplates,
    excludeIds: previousIds,
  });

  const excludeClause = previousIds?.length
    ? `\n\nIMPORTANT: Do NOT suggest these template IDs as they were already shown: ${previousIds.join(', ')}`
    : '';

  const feedbackClause = feedback
    ? `\n\nUser feedback on previous suggestions: "${feedback}". Take this into account when selecting new memes.`
    : '';

  const rewriteClause = rewrite
    ? `\nMeme-ready rewrite: "${rewrite.memePremise}"\nSuggested setup: "${rewrite.setup}"\nSuggested punchline: "${rewrite.punchline}"\nTone: ${rewrite.tone}\nTags: ${rewrite.tags?.join(', ') || ''}\n`
    : '';

  const prompt = compact
    ? `You are a meme expert. Pick the 3 funniest meme templates for the tweet below.

Tweet: "${tweet}"
${rewriteClause}${feedbackClause}${excludeClause}

Available templates:
${templateDescriptions}

Rules:
- Prefer 2-box memes unless a multi-panel is PERFECT.
- Avoid generic defaults (Drake, Two Buttons, Distracted Boyfriend) unless truly the best.
- 6-8 words per text box max.
- Transform the tweet into a clear meme joke (do not restate).

Return ONLY a JSON array with exactly 3 items:
[
  {
    "templateId": "ID from list above",
    "templateName": "Meme name",
    "reasoning": "Why it fits",
    "format": "comparison|top-bottom|multi-panel|reaction|label",
    "textBoxes": [
      {"position": "top|bottom|left|right|center|panel1|panel2|etc", "text": "Short punchy text"}
    ],
    "suggestedTopText": "Text for top (for 2-box memes)",
    "suggestedBottomText": "Text for bottom (for 2-box memes)"
  }
]`
    : `You are a legendary meme lord with encyclopedic knowledge of internet culture. Your job is to create HILARIOUS, VIRAL-WORTHY meme suggestions that make people actually laugh out loud.

## THE TWEET TO MEME-IFY:
"${tweet}"
${rewriteClause}${feedbackClause}${excludeClause}

## AVAILABLE MEME TEMPLATES:
${templateDescriptions}

## YOUR MISSION:
Create 3 meme suggestions that are genuinely FUNNY. Not just relevant - FUNNY. The kind of meme someone would actually share.

## QUALITY RULES:
1. Prefer 2-box memes (top/bottom) unless a multi-panel format is PERFECT.
2. Avoid the generic defaults (Drake, Two Buttons, Distracted Boyfriend) unless they are truly the best fit.
3. Each pick must feel distinct — different format, different joke structure, different vibe.
4. Text must be short and punchy (6-8 words per box max).
5. Do NOT restate the tweet — transform it into a meme format with a clear joke.
6. Be specific and internet-native. If you can't think of a strong angle, pick a better template.

## RESPONSE FORMAT (JSON array, no markdown):
[
  {
    "templateId": "ID from list above",
    "templateName": "Meme name",
    "reasoning": "Why this meme format perfectly captures the tweet's vibe",
    "format": "comparison|top-bottom|multi-panel|reaction|label",
    "textBoxes": [
      {"position": "top|bottom|left|right|center|panel1|panel2|etc", "text": "Short punchy text"},
      ...
    ],
    "suggestedTopText": "Text for top (for 2-box memes)",
    "suggestedBottomText": "Text for bottom (for 2-box memes)"
  }
]

Respond ONLY with the JSON array.`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

    // Try to extract JSON from the response (handle markdown code blocks)
    let jsonText = content.text.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
    }

    const extracted = extractJsonArray(jsonText) || jsonText;
    const rawMatches = JSON.parse(extracted);

    // Enrich matches with format info and validate
    const matches: MemeMatch[] = rawMatches
      .map((match: MemeMatch) => {
      const template = templates.find(t => t.id === match.templateId);
      if (!template) return null;
      
      const formatInfo = getMemeFormatInfo(template);
      
      return normalizeMatch({
        ...match,
        format: match.format || formatInfo.format,
        textBoxes: match.textBoxes || [
          { position: 'top', text: match.suggestedTopText },
          { position: 'bottom', text: match.suggestedBottomText },
        ],
      });
    })
      .filter(Boolean);

    if (matches.length === 0) {
      return null;
    }

    return matches.slice(0, 3);
  } catch (error) {
    console.error('Match attempt failed:', error);
    return null;
  }
}

async function simplifyTweet(tweet: string): Promise<{ simplified: string; original: string } | null> {
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 256,
      messages: [
        {
          role: 'user',
          content: `Simplify this tweet into a clear, meme-friendly statement that captures the core meaning. Keep it under 100 characters. Just respond with the simplified text, nothing else.

Tweet: "${tweet}"`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return null;
    }

    return {
      simplified: content.text.trim(),
      original: tweet,
    };
  } catch {
    return null;
  }
}

export async function matchTweetToMemes(
  tweet: string,
  templates: MemeTemplate[],
  feedback?: string,
  previousIds?: string[]
): Promise<MatchResult> {
  const rewrite = await rewriteTweetForMeme(tweet);
  const primaryTweet = rewrite?.memePremise || tweet;
  const rewriteMessage = rewrite
    ? `We rewrote your tweet to improve meme fit: "${rewrite.memePremise}"`
    : undefined;

  // First attempt: try with rewritten meme premise (if available)
  console.log('Attempting match with meme-ready rewrite...');
  const firstAttempt = await tryMatchWithPrompt(
    primaryTweet,
    templates,
    feedback,
    previousIds,
    { rewrite }
  );

  if (firstAttempt && firstAttempt.length >= 1) {
    return {
      matches: firstAttempt,
      modified: Boolean(rewrite) && primaryTweet !== tweet,
      modifiedTweet: rewrite?.memePremise,
      message: rewriteMessage,
    };
  }

  // Retry with a smaller template set + compact prompt to avoid formatting issues
  const retryAttempt = await tryMatchWithPrompt(
    primaryTweet,
    templates,
    feedback,
    previousIds,
    { maxTemplates: 90, compact: true, rewrite }
  );

  if (retryAttempt && retryAttempt.length >= 1) {
    return {
      matches: retryAttempt,
      modified: Boolean(rewrite) && primaryTweet !== tweet,
      modifiedTweet: rewrite?.memePremise,
      message: rewriteMessage,
    };
  }

  // If rewrite failed to match, try original tweet directly
  if (rewrite && primaryTweet !== tweet) {
    const originalAttempt = await tryMatchWithPrompt(
      tweet,
      templates,
      feedback,
      previousIds,
      { maxTemplates: 120 }
    );

    if (originalAttempt && originalAttempt.length >= 1) {
      return {
        matches: originalAttempt,
        modified: false,
      };
    }
  }

  // Second attempt: simplify the tweet and try again
  console.log('First attempt failed, trying with simplified tweet...');
  const simplified = await simplifyTweet(primaryTweet);

  if (simplified) {
    const secondAttempt = await tryMatchWithPrompt(
      simplified.simplified,
      templates,
      feedback,
      previousIds,
      { maxTemplates: 120, rewrite }
    );

    if (secondAttempt && secondAttempt.length >= 1) {
      return {
        matches: secondAttempt,
        modified: true,
        modifiedTweet: simplified.simplified,
        message: `We simplified your tweet to better match meme formats: "${simplified.simplified}"`,
      };
    }
  }

  // Final fallback: return popular versatile memes
  console.log('All attempts failed, using fallback memes...');
  return {
    matches: getFallbackMatches(templates, primaryTweet, previousIds, rewrite),
    modified: true,
    message:
      rewriteMessage ||
      "We couldn't find a perfect match, so here are some versatile memes that might work. Try the feedback button for different options!",
  };
}
