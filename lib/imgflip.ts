export interface MemeTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
}

// Detailed meme format info for better AI matching
export interface MemeFormatInfo {
  id: string;
  name: string;
  boxCount: number;
  format: 'top-bottom' | 'multi-panel' | 'reaction' | 'comparison' | 'label';
  description: string;
  bestFor: string;
  textBoxes: Array<{
    position: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'panel1' | 'panel2' | 'panel3' | 'panel4';
    purpose: string;
  }>;
}

// Curated meme database with format context for better matching
export const MEME_FORMAT_DATABASE: Record<string, Omit<MemeFormatInfo, 'id' | 'name'>> = {
  '181913649': { // Drake Hotline Bling
    boxCount: 2,
    format: 'comparison',
    description: 'Drake disapproving something (top), then approving alternative (bottom)',
    bestFor: 'Showing preference, rejecting one thing for another, hot takes',
    textBoxes: [
      { position: 'top', purpose: 'Thing being rejected/disliked' },
      { position: 'bottom', purpose: 'Thing being preferred/approved' },
    ],
  },
  '87743020': { // Two Buttons
    boxCount: 3,
    format: 'comparison',
    description: 'Person sweating while choosing between two buttons',
    bestFor: 'Impossible choices, dilemmas, when both options are tempting/terrible',
    textBoxes: [
      { position: 'panel1', purpose: 'First option (button)' },
      { position: 'panel2', purpose: 'Second option (button)' },
      { position: 'panel3', purpose: 'Who is deciding (optional)' },
    ],
  },
  '112126428': { // Distracted Boyfriend
    boxCount: 3,
    format: 'comparison',
    description: 'Guy looking at another woman while girlfriend looks disapprovingly',
    bestFor: 'Being distracted by something new, abandoning responsibilities, temptation',
    textBoxes: [
      { position: 'left', purpose: 'Current thing being neglected (girlfriend)' },
      { position: 'center', purpose: 'Who/what is being distracted (boyfriend)' },
      { position: 'right', purpose: 'New tempting thing (other woman)' },
    ],
  },
  '129242436': { // Change My Mind
    boxCount: 1,
    format: 'label',
    description: 'Steven Crowder sitting at table with sign saying "Change My Mind"',
    bestFor: 'Hot takes, controversial opinions, stating something confidently',
    textBoxes: [
      { position: 'center', purpose: 'Your controversial/confident opinion' },
    ],
  },
  '131087935': { // Running Away Balloon
    boxCount: 3,
    format: 'multi-panel',
    description: 'Person running after balloon floating away',
    bestFor: 'Losing something, things slipping away, missed opportunities',
    textBoxes: [
      { position: 'panel1', purpose: 'Thing floating away (balloon)' },
      { position: 'panel2', purpose: 'Person chasing (you/someone)' },
      { position: 'panel3', purpose: 'What\'s holding them back (optional)' },
    ],
  },
  '224015000': { // Bernie Sanders Once Again Asking
    boxCount: 1,
    format: 'label',
    description: 'Bernie Sanders saying "I am once again asking..."',
    bestFor: 'Repeatedly asking for something, frustration with repetition',
    textBoxes: [
      { position: 'bottom', purpose: 'What you\'re asking for (again)' },
    ],
  },
  '438680': { // Batman Slapping Robin
    boxCount: 2,
    format: 'reaction',
    description: 'Batman slapping Robin mid-sentence',
    bestFor: 'Shutting down bad takes, interrupting, correcting someone',
    textBoxes: [
      { position: 'top', purpose: 'Wrong/annoying thing being said' },
      { position: 'bottom', purpose: 'The correction/response' },
    ],
  },
  '61579': { // One Does Not Simply
    boxCount: 2,
    format: 'top-bottom',
    description: 'Boromir saying "One does not simply..."',
    bestFor: 'Explaining why something is harder than it looks',
    textBoxes: [
      { position: 'top', purpose: '"One does not simply"' },
      { position: 'bottom', purpose: 'The difficult thing' },
    ],
  },
  '101470': { // Ancient Aliens
    boxCount: 1,
    format: 'label',
    description: 'Ancient Aliens guy with wild hair',
    bestFor: 'Absurd explanations, conspiracy theories, over-the-top reasoning',
    textBoxes: [
      { position: 'bottom', purpose: 'Your absurd explanation (usually one word)' },
    ],
  },
  '93895088': { // Expanding Brain
    boxCount: 4,
    format: 'multi-panel',
    description: 'Brain getting bigger with increasingly "enlightened" ideas',
    bestFor: 'Escalating absurdity, showing progression from normal to galaxy brain',
    textBoxes: [
      { position: 'panel1', purpose: 'Normal/basic approach' },
      { position: 'panel2', purpose: 'Slightly smarter approach' },
      { position: 'panel3', purpose: 'Big brain approach' },
      { position: 'panel4', purpose: 'Galaxy brain (absurd) approach' },
    ],
  },
  '102156234': { // Mocking SpongeBob
    boxCount: 2,
    format: 'top-bottom',
    description: 'SpongeBob mocking with alternating caps text',
    bestFor: 'Mocking someone, sarcastic repetition of what someone said',
    textBoxes: [
      { position: 'top', purpose: 'What they said (normal)' },
      { position: 'bottom', purpose: 'Mocking version (aLtErNaTiNg CaPs)' },
    ],
  },
  '119139145': { // Blank Nut Button
    boxCount: 2,
    format: 'reaction',
    description: 'Hand slamming down on button',
    bestFor: 'Enthusiastic agreement, can\'t resist doing something',
    textBoxes: [
      { position: 'top', purpose: 'What the button does' },
      { position: 'bottom', purpose: 'Who/what is slamming it (optional)' },
    ],
  },
  '217743513': { // UNO Draw 25
    boxCount: 2,
    format: 'comparison',
    description: 'UNO card: do X or draw 25 cards',
    bestFor: 'Refusing to do something reasonable, stubbornness',
    textBoxes: [
      { position: 'top', purpose: 'Reasonable thing to do' },
      { position: 'bottom', purpose: 'Who refuses to do it' },
    ],
  },
  '124822590': { // Left Exit 12 Off Ramp
    boxCount: 3,
    format: 'comparison',
    description: 'Car swerving to take exit at last second',
    bestFor: 'Choosing the unexpected option, sudden change of plans',
    textBoxes: [
      { position: 'panel1', purpose: 'Expected/sensible path' },
      { position: 'panel2', purpose: 'Unexpected choice (exit)' },
      { position: 'panel3', purpose: 'Who is swerving (car)' },
    ],
  },
  '91538330': { // X, X Everywhere
    boxCount: 2,
    format: 'top-bottom',
    description: 'Buzz Lightyear showing Woody something everywhere',
    bestFor: 'Pointing out something is ubiquitous, overwhelming presence',
    textBoxes: [
      { position: 'top', purpose: 'Setup or "X"' },
      { position: 'bottom', purpose: '"X everywhere" or observation' },
    ],
  },
  '4087833': { // Waiting Skeleton
    boxCount: 2,
    format: 'top-bottom',
    description: 'Skeleton waiting on bench',
    bestFor: 'Waiting forever for something, things that never happen',
    textBoxes: [
      { position: 'top', purpose: 'What you\'re waiting for' },
      { position: 'bottom', purpose: 'How long you\'ve been waiting (optional)' },
    ],
  },
  '80707627': { // Sad Pablo Escobar
    boxCount: 3,
    format: 'multi-panel',
    description: 'Pablo Escobar standing alone looking sad',
    bestFor: 'Loneliness, waiting, boredom, having nothing to do',
    textBoxes: [
      { position: 'panel1', purpose: 'Context for sadness' },
      { position: 'panel2', purpose: 'More context' },
      { position: 'panel3', purpose: 'The sad realization' },
    ],
  },
  '188390779': { // Panik Kalm Panik
    boxCount: 3,
    format: 'multi-panel',
    description: 'Three panel: panic, calm, panic again',
    bestFor: 'Emotional rollercoaster, false sense of security',
    textBoxes: [
      { position: 'panel1', purpose: 'Initial panic situation' },
      { position: 'panel2', purpose: 'Why you calm down' },
      { position: 'panel3', purpose: 'Why you panic again' },
    ],
  },
  '252600902': { // Always Has Been
    boxCount: 2,
    format: 'reaction',
    description: 'Astronaut realizing truth, other astronaut with gun saying "Always has been"',
    bestFor: 'Revealing something was always true, plot twists',
    textBoxes: [
      { position: 'top', purpose: 'The realization/question' },
      { position: 'bottom', purpose: '"Always has been" or confirmation' },
    ],
  },
  '135256802': { // Epic Handshake
    boxCount: 3,
    format: 'comparison',
    description: 'Two arms doing epic handshake, united by common ground',
    bestFor: 'Two different groups agreeing on something, unlikely allies',
    textBoxes: [
      { position: 'left', purpose: 'First group/person' },
      { position: 'center', purpose: 'What they agree on (handshake)' },
      { position: 'right', purpose: 'Second group/person' },
    ],
  },
  '247375501': { // Buff Doge vs Cheems
    boxCount: 2,
    format: 'comparison',
    description: 'Strong doge (past) vs weak doge (present)',
    bestFor: 'Then vs now, things getting worse, nostalgia',
    textBoxes: [
      { position: 'left', purpose: 'How things were (strong)' },
      { position: 'right', purpose: 'How things are now (weak)' },
    ],
  },
  '97984': { // Disaster Girl
    boxCount: 2,
    format: 'reaction',
    description: 'Girl smiling while house burns behind her',
    bestFor: 'Causing chaos, enjoying destruction, evil satisfaction',
    textBoxes: [
      { position: 'top', purpose: 'Setup/context' },
      { position: 'bottom', purpose: 'The chaotic thing you did' },
    ],
  },
  '21735': { // The Rock Driving
    boxCount: 2,
    format: 'reaction',
    description: 'The Rock smiling then looking concerned while driving',
    bestFor: 'Conversation going wrong, unexpected turn',
    textBoxes: [
      { position: 'top', purpose: 'Normal/good start' },
      { position: 'bottom', purpose: 'Concerning follow-up' },
    ],
  },
  '27813981': { // Hide the Pain Harold
    boxCount: 2,
    format: 'top-bottom',
    description: 'Old man smiling through pain',
    bestFor: 'Hiding suffering, pretending everything is fine',
    textBoxes: [
      { position: 'top', purpose: 'The painful situation' },
      { position: 'bottom', purpose: 'How you\'re dealing with it (poorly)' },
    ],
  },
  '161865971': { // Tuxedo Winnie the Pooh
    boxCount: 2,
    format: 'comparison',
    description: 'Regular Pooh vs Fancy Pooh',
    bestFor: 'Fancier/pretentious way of saying something, upgrades',
    textBoxes: [
      { position: 'top', purpose: 'Normal/basic version' },
      { position: 'bottom', purpose: 'Fancy/elevated version' },
    ],
  },
  '222403160': { // Bernie I Am Once Again Asking
    boxCount: 2,
    format: 'label',
    description: 'Bernie asking for something again',
    bestFor: 'Repeatedly requesting something, persistence',
    textBoxes: [
      { position: 'top', purpose: '"I am once again asking"' },
      { position: 'bottom', purpose: 'What you\'re asking for' },
    ],
  },
  '123999232': { // The Scroll of Truth
    boxCount: 2,
    format: 'reaction',
    description: 'Finding scroll of truth and throwing it away',
    bestFor: 'Rejecting uncomfortable truths, denial',
    textBoxes: [
      { position: 'top', purpose: 'The uncomfortable truth' },
      { position: 'bottom', purpose: 'Reaction (usually "Nyeh!")' },
    ],
  },
  '155067746': { // Surprised Pikachu
    boxCount: 2,
    format: 'reaction',
    description: 'Pikachu with shocked face',
    bestFor: 'Obvious consequences, predictable outcomes, fake surprise',
    textBoxes: [
      { position: 'top', purpose: 'Action with obvious consequence' },
      { position: 'bottom', purpose: 'The obvious consequence happens' },
    ],
  },
  '79132341': { // Bike Fall
    boxCount: 3,
    format: 'multi-panel',
    description: 'Person puts stick in own bike wheel and falls',
    bestFor: 'Self-sabotage, causing your own problems, blaming others for your mistakes',
    textBoxes: [
      { position: 'panel1', purpose: 'You/the person' },
      { position: 'panel2', purpose: 'The self-sabotaging action' },
      { position: 'panel3', purpose: 'Blaming something else' },
    ],
  },
  '114585149': { // Inhaling Seagull
    boxCount: 4,
    format: 'multi-panel',
    description: 'Seagull inhaling deeply then screaming',
    bestFor: 'Building up to yelling, escalating frustration',
    textBoxes: [
      { position: 'panel1', purpose: 'Calm start' },
      { position: 'panel2', purpose: 'Starting to get worked up' },
      { position: 'panel3', purpose: 'Deep breath' },
      { position: 'panel4', purpose: 'SCREAMING' },
    ],
  },
};

interface ImgflipResponse {
  success: boolean;
  data: {
    memes: MemeTemplate[];
  };
}

interface CaptionResponse {
  success: boolean;
  data: {
    url: string;
    page_url: string;
  };
  error_message?: string;
}

// Cache for meme templates (they rarely change)
let cachedTemplates: MemeTemplate[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getMemeTemplates(): Promise<MemeTemplate[]> {
  // Return cached if valid
  if (cachedTemplates && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedTemplates;
  }

  const response = await fetch('https://api.imgflip.com/get_memes');
  const data: ImgflipResponse = await response.json();

  if (!data.success) {
    throw new Error('Failed to fetch meme templates');
  }

  cachedTemplates = data.data.memes;
  cacheTimestamp = Date.now();

  return cachedTemplates;
}

export async function captionImage(
  templateId: string,
  topText: string,
  bottomText: string
): Promise<string> {
  const username = process.env.IMGFLIP_USERNAME;
  const password = process.env.IMGFLIP_PASSWORD;

  if (!username || !password) {
    throw new Error('Imgflip credentials not configured');
  }

  const formData = new URLSearchParams();
  formData.append('template_id', templateId);
  formData.append('username', username);
  formData.append('password', password);
  formData.append('text0', topText);
  formData.append('text1', bottomText);

  const response = await fetch('https://api.imgflip.com/caption_image', {
    method: 'POST',
    body: formData,
  });

  const data: CaptionResponse = await response.json();

  if (!data.success) {
    throw new Error(data.error_message || 'Failed to caption image');
  }

  return data.data.url;
}

// Get template by ID
export function getTemplateById(
  templates: MemeTemplate[],
  id: string
): MemeTemplate | undefined {
  return templates.find((t) => t.id === id);
}

// Get meme format info for a template
export function getMemeFormatInfo(template: MemeTemplate): MemeFormatInfo {
  const formatData = MEME_FORMAT_DATABASE[template.id];
  
  if (formatData) {
    return {
      id: template.id,
      name: template.name,
      ...formatData,
    };
  }
  
  // Default format for unknown memes
  return {
    id: template.id,
    name: template.name,
    boxCount: template.box_count,
    format: template.box_count === 1 ? 'label' : 'top-bottom',
    description: `${template.name} meme template`,
    bestFor: 'General meme usage',
    textBoxes: template.box_count === 1 
      ? [{ position: 'center', purpose: 'Main text' }]
      : [
          { position: 'top', purpose: 'Setup or first part' },
          { position: 'bottom', purpose: 'Punchline or second part' },
        ],
  };
}

// Get rich template descriptions for LLM matching
function shuffleArray<T>(items: T[]): T[] {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

interface TemplateDescriptionOptions {
  maxTemplates?: number;
  excludeIds?: string[];
}

export function getTemplateDescriptions(
  templates: MemeTemplate[],
  options: TemplateDescriptionOptions = {}
): string {
  const { maxTemplates = 140, excludeIds = [] } = options;
  const excludeSet = new Set(excludeIds);

  const curatedIds = new Set(Object.keys(MEME_FORMAT_DATABASE));
  const curatedTemplates = templates.filter(
    (t) => curatedIds.has(t.id) && !excludeSet.has(t.id)
  );

  const remainingTemplates = templates.filter(
    (t) => !curatedIds.has(t.id) && !excludeSet.has(t.id)
  );

  // Use a mix of top templates + random sample for diversity
  const topSlice = remainingTemplates.slice(0, 120);
  const randomSlice = shuffleArray(remainingTemplates.slice(120)).slice(0, 60);

  const combined = [
    ...curatedTemplates,
    ...topSlice,
    ...randomSlice,
  ].slice(0, maxTemplates);

  return combined
    .map((t) => {
      const format = getMemeFormatInfo(t);
      const boxInfo = format.textBoxes.map((b) => `${b.position}: ${b.purpose}`).join('; ');
      return `ID: ${t.id} - "${t.name}" (${format.format}, ${t.box_count} text boxes)
  Best for: ${format.bestFor}
  Description: ${format.description}
  Text boxes: [${boxInfo}]`;
    })
    .join('\n\n');
}
