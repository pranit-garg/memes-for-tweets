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

function getFallbackMatches(templates: MemeTemplate[], tweet: string): MemeMatch[] {
  const fallbackTemplates = templates.filter(t =>
    FALLBACK_TEMPLATE_IDS.includes(t.id)
  ).slice(0, 3);

  // If we can't find our preferred fallbacks, just use the first 3 popular ones
  const templatesToUse = fallbackTemplates.length >= 3
    ? fallbackTemplates
    : templates.slice(0, 3);

  return templatesToUse.map(t => {
    const format = getMemeFormatInfo(t);
    return {
      templateId: t.id,
      templateName: t.name,
      reasoning: 'A versatile meme that works well for expressing this idea',
      suggestedTopText: tweet.length > 50 ? tweet.substring(0, 50) + '...' : tweet,
      suggestedBottomText: 'Me:',
      textBoxes: format.textBoxes.map((box, i) => ({
        text: i === 0 ? (tweet.length > 50 ? tweet.substring(0, 50) + '...' : tweet) : 'Me:',
        position: box.position,
      })),
      format: format.format,
    };
  });
}

async function tryMatchWithPrompt(
  tweet: string,
  templates: MemeTemplate[],
  feedback?: string,
  previousIds?: string[]
): Promise<MemeMatch[] | null> {
  const templateDescriptions = getTemplateDescriptions(templates);

  const excludeClause = previousIds?.length
    ? `\n\nIMPORTANT: Do NOT suggest these template IDs as they were already shown: ${previousIds.join(', ')}`
    : '';

  const feedbackClause = feedback
    ? `\n\nUser feedback on previous suggestions: "${feedback}". Take this into account when selecting new memes.`
    : '';

  const prompt = `You are a legendary meme lord with encyclopedic knowledge of internet culture. Your job is to create HILARIOUS, VIRAL-WORTHY meme suggestions that make people actually laugh out loud.

## THE TWEET TO MEME-IFY:
"${tweet}"
${feedbackClause}${excludeClause}

## AVAILABLE MEME TEMPLATES:
${templateDescriptions}

## YOUR MISSION:
Create 3 meme suggestions that are genuinely FUNNY. Not just relevant - FUNNY. The kind of meme someone would actually share.

## RULES FOR GREAT MEMES:

1. **UNDERSTAND THE MEME FORMAT**: Each template has a specific joke structure. Use it correctly!
   - Drake: Reject thing A, embrace thing B (the contrast is the joke)
   - Distracted Boyfriend: Being tempted by something while neglecting another
   - Change My Mind: Hot take stated confidently
   - Two Buttons: Impossible choice between two options
   - Expanding Brain: Escalating absurdity (normal → galaxy brain)

2. **TEXT MUST BE SHORT & PUNCHY**: 
   - Maximum 8-10 words per text box
   - No full sentences - memes use fragments
   - ALL CAPS works for emphasis but don't overdo it

3. **THE JOKE STRUCTURE MATTERS**:
   - Setup → Punchline (most memes)
   - Contrast/comparison (Drake, Boyfriend, etc.)
   - Escalation (Expanding Brain)
   - Self-deprecating humor works great

4. **DON'T JUST RESTATE THE TWEET**: Transform the tweet's idea into the meme format. The meme should AMPLIFY the humor, not just repeat it.

5. **BE SPECIFIC**: Vague memes aren't funny. Specific, relatable details are.

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

Remember: A meme that makes someone exhale sharply through their nose > a meme that's just "relevant"

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

    const rawMatches = JSON.parse(jsonText);

    // Enrich matches with format info and validate
    const matches: MemeMatch[] = rawMatches.map((match: MemeMatch) => {
      const template = templates.find(t => t.id === match.templateId);
      if (!template) return null;
      
      const formatInfo = getMemeFormatInfo(template);
      
      return {
        ...match,
        format: match.format || formatInfo.format,
        textBoxes: match.textBoxes || [
          { position: 'top', text: match.suggestedTopText },
          { position: 'bottom', text: match.suggestedBottomText },
        ],
      };
    }).filter(Boolean);

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
  // First attempt: try with original tweet
  console.log('Attempting match with original tweet...');
  const firstAttempt = await tryMatchWithPrompt(tweet, templates, feedback, previousIds);

  if (firstAttempt && firstAttempt.length >= 1) {
    return {
      matches: firstAttempt,
      modified: false,
    };
  }

  // Second attempt: simplify the tweet and try again
  console.log('First attempt failed, trying with simplified tweet...');
  const simplified = await simplifyTweet(tweet);

  if (simplified) {
    const secondAttempt = await tryMatchWithPrompt(
      simplified.simplified,
      templates,
      feedback,
      previousIds
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
    matches: getFallbackMatches(templates, tweet),
    modified: true,
    message: "We couldn't find a perfect match, so here are some versatile memes that might work. Try the feedback button for different options!",
  };
}
