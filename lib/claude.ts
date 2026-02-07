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

// Tweet Analysis Types
export type HumorType =
  | 'sarcasm' | 'irony' | 'hot-take' | 'complaint' | 'self-deprecation'
  | 'observation' | 'flex' | 'roast' | 'absurdist' | 'wholesome' | 'comparison';

export type Sentiment = 'positive' | 'negative' | 'neutral' | 'sarcastic' | 'mixed';

export type TweetTopic =
  | 'tech' | 'work' | 'relationships' | 'food' | 'money' | 'health'
  | 'gaming' | 'social-media' | 'education' | 'politics' | 'universal';

export interface TweetAnalysis {
  sentiment: Sentiment;
  humorType: HumorType;
  secondaryHumorType?: HumorType;
  keyEntities: string[];
  corePoint: string;
  hasTwoAlternatives: boolean;
  hasObviousOutcome: boolean;
  isSelfSabotage: boolean;
  topics?: TweetTopic[];
  hasMultipleSteps?: boolean;
}

// ─── Local tweet analysis (zero tokens, instant) ───

function analyzeTweet(tweet: string): TweetAnalysis {
  const lower = tweet.toLowerCase();

  let sentiment: Sentiment = 'neutral';
  if (/worst|hate|bad|sucks|terrible|awful/i.test(lower)) sentiment = 'negative';
  else if (/love|best|amazing|great|awesome/i.test(lower)) sentiment = 'positive';
  else if (/apparently|shocking|surprising/i.test(lower)) sentiment = 'sarcastic';

  let humorType: HumorType = 'observation';
  if (/\bvs\b|\bor\b|instead/i.test(lower)) humorType = 'comparison';
  else if (/turns out|apparently/i.test(lower)) humorType = 'irony';
  else if (/i think|unpopular opinion|hot take|change my mind/i.test(lower)) humorType = 'hot-take';
  else if (/why do i|me:|myself/i.test(lower)) humorType = 'self-deprecation';
  else if (sentiment === 'negative') humorType = 'complaint';

  const entities = tweet.split(/\s+/).filter(w => /^[A-Z][a-zA-Z]+/.test(w) && w.length > 2).slice(0, 3);
  const hasTwoAlternatives = /\bvs\b|\bor\b|instead of|rather than/i.test(tweet);
  const hasObviousOutcome = /turns out|shocking|surprised|obviously/i.test(tweet);
  const isSelfSabotage = /blame|fault|caused|my own/i.test(tweet);
  const hasMultipleSteps = /first|then|finally|step|1\.|2\.|3\./i.test(tweet);

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

  const firstSentence = tweet.split(/[.!?]/)[0]?.trim() || tweet;
  const corePoint = firstSentence.length > 60 ? firstSentence.slice(0, 57) + '...' : firstSentence;

  return {
    sentiment, humorType, keyEntities: entities, corePoint,
    hasTwoAlternatives, hasObviousOutcome, isSelfSabotage, topics, hasMultipleSteps,
  };
}

// ─── JSON extraction from LLM output ───

function extractJson(text: string): unknown | null {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/```(?:json)?\n?/g, '').replace(/```$/g, '').trim();
  }

  const arrayStart = cleaned.indexOf('[');
  const arrayEnd = cleaned.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    try { return JSON.parse(cleaned.slice(arrayStart, arrayEnd + 1)); } catch { /* continue */ }
  }

  const objStart = cleaned.indexOf('{');
  const objEnd = cleaned.lastIndexOf('}');
  if (objStart !== -1 && objEnd > objStart) {
    try { return JSON.parse(cleaned.slice(objStart, objEnd + 1)); } catch { /* continue */ }
  }

  try { return JSON.parse(cleaned); } catch { return null; }
}

// ─── System prompt (static, cached by Anthropic after first call) ───

const SYSTEM_PROMPT = `You pick 3 meme templates for a tweet and write SHORT, FUNNY captions.

RULES:
- Max 8 words per text box. Fewer is better.
- NEVER repeat the tweet verbatim. Adapt the concept to fit the meme format.
- Be specific — use exact entities from the tweet, not generic filler.
- The image IS the punchline. Don't describe what it shows.
- Multi-panel: each panel must ESCALATE. Fill ALL panels.
- Comparison memes: make the contrast EXTREME.
- No "When you", "Me:", "POV:", "Nobody:" — just the content.
- Before outputting, verify each caption is funny STANDALONE (without seeing the tweet).

GOOD examples:
"3hrs debugging a typo" → Clown Makeup: "Quick script" / "Why won't it work" / "Refactoring everything" / "It was a semicolon"
"Docs vs ChatGPT" → Drake: "Reading the docs" / "Pasting error into ChatGPT"
"Deploy Friday, go home" → Surprised Pikachu: "Deploy Friday, go home" / "Everything breaks"

Reply with JSON array ONLY — no explanation:
[{"templateId":"ID","templateName":"name","reasoning":"why this is funny","suggestedTopText":"...","suggestedBottomText":"...","panel1":"...","panel2":"...","panel3":"...","panel4":"..."}]
Omit panel1-4 for 2-box memes. Omit top/bottom for multi-panel.`;

// ─── Core: single API call to select templates + write captions ───

async function selectAndCaption(
  tweet: string,
  templates: MemeTemplate[],
  analysis: TweetAnalysis,
  excludeIds: string[] = [],
  count: number = 3
): Promise<MemeMatch[]> {
  const available = templates.filter(t => !excludeIds.includes(t.id));

  // Compact 1-line template format
  const templateList = available.map(t => {
    const info = getMemeFormatInfo(t);
    const boxes = info.textBoxes.map(b => `${b.position}:${b.purpose}`).join('; ');
    const multi = info.textBoxes.length > 2 ? ' [MULTI-PANEL]' : '';
    return `${t.id}: ${t.name} (${info.format}, ${t.box_count}box${multi}) — ${info.bestFor} | ${boxes}`;
  }).join('\n');

  // Compact analysis — only the signals that matter
  const signals = [
    `Humor: ${analysis.humorType}`,
    analysis.hasTwoAlternatives ? 'Has A/B comparison' : null,
    analysis.hasObviousOutcome ? 'Has obvious outcome' : null,
    analysis.isSelfSabotage ? 'Self-sabotage' : null,
    analysis.hasMultipleSteps ? 'Multi-step progression' : null,
    `Topics: ${analysis.topics?.join(', ') || 'general'}`,
  ].filter(Boolean).join(' | ');

  const userMessage = `Tweet: "${tweet}"
${signals}

Pick ${count} templates (DIFFERENT formats) and write captions:
${templateList}`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      temperature: 0.7,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
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

        // Enforce diversity — max 2 of same format
        const diverseMatches = enforceDiversity(matches, templates, excludeIds);
        if (diverseMatches.length > 0) {
          console.log('Selected:', diverseMatches.map(m => m.templateName).join(', '));
          return diverseMatches;
        }
      }
    }
  } catch (error) {
    console.error('Select + caption failed:', error);
  }

  return [];
}

// ─── Diversity enforcement ───

function enforceDiversity(
  matches: MemeMatch[],
  allTemplates: MemeTemplate[],
  excludeIds: string[]
): MemeMatch[] {
  const formatCounts: Record<string, number> = {};
  const diverse: MemeMatch[] = [];

  for (const match of matches) {
    const currentCount = formatCounts[match.format] || 0;
    if (currentCount < 2) {
      diverse.push(match);
      formatCounts[match.format] = currentCount + 1;
    }
  }

  // Fill gaps from other templates if needed
  if (diverse.length < 3) {
    const usedFormats = new Set(Object.keys(formatCounts).filter(f => formatCounts[f] >= 2));
    const alternatives = allTemplates
      .filter(t =>
        !diverse.some(d => d.templateId === t.id) &&
        !excludeIds.includes(t.id) &&
        !usedFormats.has(getMemeFormatInfo(t).format)
      )
      .slice(0, 3 - diverse.length);

    for (const alt of alternatives) {
      diverse.push({
        templateId: alt.id,
        templateName: alt.name,
        reasoning: 'Alternative format for variety',
        suggestedTopText: '', suggestedBottomText: '',
        format: getMemeFormatInfo(alt).format,
        textBoxes: [],
      });
    }
  }

  return diverse;
}

// ─── Fallback: simpler AI prompt if primary fails ───

async function generateFallbackMatches(
  tweet: string,
  templates: MemeTemplate[],
  excludeIds: string[] = [],
  analysis?: TweetAnalysis
): Promise<MemeMatch[]> {
  const simpleTemplates = [
    { id: '181913649', name: 'Drake Hotline Bling', hint: 'reject A, prefer B', types: ['comparison'] },
    { id: '161865971', name: 'Tuxedo Winnie the Pooh', hint: 'basic vs fancy', types: ['comparison'] },
    { id: '155067746', name: 'Surprised Pikachu', hint: 'obvious outcome', types: ['irony', 'sarcasm'] },
    { id: '129242436', name: 'Change My Mind', hint: 'hot take', types: ['hot-take', 'observation'] },
    { id: '438680', name: 'Batman Slapping Robin', hint: 'shut down bad take', types: ['roast', 'complaint'] },
    { id: '252600902', name: 'Always Has Been', hint: 'was always true', types: ['irony', 'observation'] },
    { id: '79132341', name: 'Bike Fall', hint: 'self-sabotage', types: ['self-deprecation', 'irony'] },
    { id: '178591752', name: 'Clown Applying Makeup', hint: 'escalating bad decisions', types: ['self-deprecation'] },
    { id: '61544', name: 'This Is Fine', hint: 'ignoring problems', types: ['irony', 'sarcasm'] },
  ].filter(t => !excludeIds.includes(t.id));

  // Sort by humor type match
  if (analysis) {
    simpleTemplates.sort((a, b) => {
      const aMatch = a.types.includes(analysis.humorType) ? -1 : 0;
      const bMatch = b.types.includes(analysis.humorType) ? -1 : 0;
      return aMatch - bMatch;
    });
  }

  const prompt = `Pick 3 memes for this tweet. Be funny, max 8 words per text.${analysis ? ` (${analysis.humorType} humor)` : ''}

Tweet: "${tweet}"

Memes:
${simpleTemplates.slice(0, 6).map(t => `${t.id}: ${t.name} — ${t.hint}`).join('\n')}

JSON array only:
[{"templateId":"ID","templateName":"name","suggestedTopText":"top","suggestedBottomText":"bottom","reasoning":"why"}]`;

  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      temperature: 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const parsed = extractJson(content.text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 3).map(m => {
          const template = templates.find(t => t.id === m.templateId);
          const formatInfo = template ? getMemeFormatInfo(template) : null;
          return {
            templateId: m.templateId || '181913649',
            templateName: m.templateName || 'Meme',
            reasoning: m.reasoning || 'A good fit',
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
    console.error('Fallback AI failed:', error);
  }

  console.log('Using hardcoded fallback');
  return generateHardcodedFallback(tweet, templates, excludeIds);
}

// ─── Last resort: hardcoded templates with tweet-derived captions ───

function generateHardcodedFallback(
  tweet: string,
  templates: MemeTemplate[],
  excludeIds: string[] = []
): MemeMatch[] {
  const essence = extractTweetEssence(tweet);

  const configs = [
    { id: '181913649', name: 'Drake Hotline Bling', format: 'comparison' as const,
      top: () => essence.badThing || truncate(tweet, 40),
      bottom: () => essence.goodThing || 'This instead', reason: 'Classic A/B format' },
    { id: '155067746', name: 'Surprised Pikachu', format: 'reaction' as const,
      top: () => essence.action || truncate(tweet, 45),
      bottom: () => essence.result || 'Everyone: *shocked*', reason: 'Obvious outcome' },
    { id: '129242436', name: 'Change My Mind', format: 'label' as const,
      top: () => essence.hotTake || truncate(tweet, 50),
      bottom: () => 'Change my mind', reason: 'Hot take format' },
    { id: '252600902', name: 'Always Has Been', format: 'reaction' as const,
      top: () => `Wait, it's ${essence.quality || 'like this'}?`,
      bottom: () => 'Always has been', reason: 'Reveal truth' },
    { id: '438680', name: 'Batman Slapping Robin', format: 'reaction' as const,
      top: () => essence.badTake || truncate(tweet, 35),
      bottom: () => essence.correction || 'No.', reason: 'Shut down bad take' },
    { id: '161865971', name: 'Tuxedo Winnie the Pooh', format: 'comparison' as const,
      top: () => essence.basicVersion || truncate(tweet, 40),
      bottom: () => essence.fancyVersion || 'The sophisticated way', reason: 'Basic vs fancy' },
  ];

  const excludeSet = new Set(excludeIds);
  const available = configs
    .filter(c => !excludeSet.has(c.id) && templates.some(t => t.id === c.id))
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  return available.map(c => {
    const top = c.top();
    const bottom = c.bottom();
    return {
      templateId: c.id, templateName: c.name, reasoning: c.reason,
      suggestedTopText: top, suggestedBottomText: bottom, format: c.format,
      textBoxes: [{ position: 'top', text: top }, { position: 'bottom', text: bottom }],
    };
  });
}

function extractTweetEssence(tweet: string): {
  subject?: string; action?: string; result?: string; quality?: string;
  hotTake?: string; badThing?: string; goodThing?: string;
  badTake?: string; correction?: string; basicVersion?: string;
  fancyVersion?: string; punchline?: string;
} {
  const essence: ReturnType<typeof extractTweetEssence> = {};

  const vsMatch = tweet.match(/(.+?)\s+vs\.?\s+(.+)/i);
  if (vsMatch) {
    essence.badThing = truncate(vsMatch[1].trim(), 40);
    essence.goodThing = truncate(vsMatch[2].trim(), 40);
    essence.basicVersion = essence.badThing;
    essence.fancyVersion = essence.goodThing;
  }

  const isMatch = tweet.match(/^(.{10,50})\s+is\s+(.{5,30})/i);
  if (isMatch) {
    essence.subject = truncate(isMatch[1].trim(), 35);
    essence.quality = truncate(isMatch[2].trim(), 25);
    essence.hotTake = truncate(`${isMatch[1].trim()} is ${isMatch[2].trim()}`, 50);
  }

  const sentences = tweet.split(/[.!?\n]+/).filter(s => s.trim().length > 5);
  if (sentences.length >= 2) {
    essence.action = truncate(sentences[0].trim(), 45);
    essence.result = truncate(sentences[sentences.length - 1].trim(), 45);
    essence.punchline = essence.result;
  }

  const negativeMatch = tweet.match(/(worst|bad|terrible|awful|sucks|hate|stupid|dumb)/i);
  if (negativeMatch) {
    const beforeNeg = tweet.slice(0, tweet.indexOf(negativeMatch[0])).trim();
    essence.badTake = truncate(beforeNeg || tweet, 35);
    essence.correction = 'Facts though';
  }

  return essence;
}

function truncate(text: string, maxLen: number): string {
  return text.length <= maxLen ? text : text.slice(0, maxLen - 3) + '...';
}

// ─── Main export ───

export async function matchTweetToMemes(
  tweet: string,
  templates: MemeTemplate[],
  feedback?: string,
  previousIds?: string[]
): Promise<MatchResult> {
  const excludeIds = previousIds || [];

  console.log('=== Meme matching ===');
  console.log('Tweet:', tweet);

  // Step 1: Local analysis (instant, zero tokens)
  const analysis = analyzeTweet(tweet);
  console.log('Analysis:', analysis.humorType, analysis.sentiment);

  // Step 2: Score templates locally
  const scoringInput: ScoringInput = {
    humorType: analysis.humorType,
    secondaryHumorType: analysis.secondaryHumorType,
    hasTwoAlternatives: analysis.hasTwoAlternatives,
    hasObviousOutcome: analysis.hasObviousOutcome,
    isSelfSabotage: analysis.isSelfSabotage,
    sentiment: analysis.sentiment,
    topics: analysis.topics,
    hasMultipleSteps: analysis.hasMultipleSteps,
  };

  const filteredTemplates = templates.filter(t => !excludeIds.includes(t.id));
  const topTemplates = getTopScoredTemplates(filteredTemplates, scoringInput, 12);

  // Step 3: Single AI call — select + caption (with quality self-check baked in)
  const feedbackNote = feedback ? ` (User wants: ${feedback})` : '';
  console.log('AI selecting + captioning...');
  const matches = await selectAndCaption(
    tweet + feedbackNote, topTemplates, analysis, excludeIds, 3
  );

  if (matches.length > 0) {
    console.log('Done:', matches.map(m => m.templateName).join(', '));
    return { matches, modified: false };
  }

  // Fallback: simpler AI call
  console.log('Primary failed, trying fallback...');
  const fallbackMatches = await generateFallbackMatches(tweet, templates, excludeIds, analysis);

  return {
    matches: fallbackMatches,
    modified: true,
    message: "We generated some meme options for you. Click 'Try again' for different choices!",
  };
}
