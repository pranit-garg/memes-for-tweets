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
// MASSIVE library for better AI matching
export const MEME_FORMAT_DATABASE: Record<string, Omit<MemeFormatInfo, 'id' | 'name'>> = {
  // === COMPARISON MEMES (A vs B, preferences) ===
  '181913649': { // Drake Hotline Bling
    boxCount: 2,
    format: 'comparison',
    description: 'Drake disapproving something (top), then approving alternative (bottom)',
    bestFor: 'Showing preference, rejecting one thing for another, ONLY when tweet has two alternatives to compare',
    textBoxes: [
      { position: 'top', purpose: 'Thing being rejected/disliked' },
      { position: 'bottom', purpose: 'Thing being preferred/approved' },
    ],
  },
  '161865971': { // Tuxedo Winnie the Pooh
    boxCount: 2,
    format: 'comparison',
    description: 'Regular Pooh vs Fancy Pooh',
    bestFor: 'Fancier/pretentious way of saying the SAME thing, upgrades, sophistication',
    textBoxes: [
      { position: 'top', purpose: 'Normal/basic version' },
      { position: 'bottom', purpose: 'Fancy/elevated version' },
    ],
  },
  '247375501': { // Buff Doge vs Cheems
    boxCount: 2,
    format: 'comparison',
    description: 'Strong doge (past) vs weak doge (present)',
    bestFor: 'Then vs now comparisons, things getting worse over time, nostalgia about how things used to be better',
    textBoxes: [
      { position: 'left', purpose: 'How things were (strong)' },
      { position: 'right', purpose: 'How things are now (weak)' },
    ],
  },
  '87743020': { // Two Buttons
    boxCount: 3,
    format: 'comparison',
    description: 'Person sweating while choosing between two buttons',
    bestFor: 'Impossible choices, dilemmas, when BOTH options are tempting or terrible',
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
    bestFor: 'Being distracted by something shiny/new, abandoning responsibilities, temptation pulling away from duties',
    textBoxes: [
      { position: 'left', purpose: 'Current thing being neglected (girlfriend)' },
      { position: 'center', purpose: 'Who/what is being distracted (boyfriend)' },
      { position: 'right', purpose: 'New tempting thing (other woman)' },
    ],
  },
  '135256802': { // Epic Handshake
    boxCount: 3,
    format: 'comparison',
    description: 'Two arms doing epic handshake, united by common ground',
    bestFor: 'Two different groups agreeing on something, unlikely allies, finding common ground between opposites',
    textBoxes: [
      { position: 'left', purpose: 'First group/person' },
      { position: 'center', purpose: 'What they agree on (handshake)' },
      { position: 'right', purpose: 'Second group/person' },
    ],
  },
  '217743513': { // UNO Draw 25
    boxCount: 2,
    format: 'comparison',
    description: 'UNO card: do X or draw 25 cards',
    bestFor: 'Refusing to do something reasonable/easy, extreme stubbornness, irrational choices',
    textBoxes: [
      { position: 'top', purpose: 'Reasonable thing to do' },
      { position: 'bottom', purpose: 'Who refuses to do it' },
    ],
  },
  '124822590': { // Left Exit 12 Off Ramp
    boxCount: 3,
    format: 'comparison',
    description: 'Car swerving to take exit at last second',
    bestFor: 'Choosing the unexpected/bad option over the sensible one, sudden irrational decisions',
    textBoxes: [
      { position: 'panel1', purpose: 'Expected/sensible path' },
      { position: 'panel2', purpose: 'Unexpected choice (exit)' },
      { position: 'panel3', purpose: 'Who is swerving (car)' },
    ],
  },

  // === REACTION MEMES (response to situation) ===
  '155067746': { // Surprised Pikachu
    boxCount: 2,
    format: 'reaction',
    description: 'Pikachu with shocked face',
    bestFor: 'ONLY for predictable outcomes - "does X" → "X happens" → shocked. The outcome must be OBVIOUS from the action',
    textBoxes: [
      { position: 'top', purpose: 'Action with obvious consequence' },
      { position: 'bottom', purpose: 'The obvious consequence happens' },
    ],
  },
  '252600902': { // Always Has Been
    boxCount: 2,
    format: 'reaction',
    description: 'Astronaut realizing truth, other astronaut with gun saying "Always has been"',
    bestFor: 'Revealing something was ALWAYS true, not a recent change. "Wait X is Y?" "Always has been"',
    textBoxes: [
      { position: 'top', purpose: 'The realization/question "Wait, its all X?"' },
      { position: 'bottom', purpose: '"Always has been" confirmation' },
    ],
  },
  '438680': { // Batman Slapping Robin
    boxCount: 2,
    format: 'reaction',
    description: 'Batman slapping Robin mid-sentence',
    bestFor: 'Shutting down bad takes/stupid comments, interrupting nonsense, hard corrections',
    textBoxes: [
      { position: 'top', purpose: 'Wrong/annoying thing being said' },
      { position: 'bottom', purpose: 'The slap/correction response' },
    ],
  },
  '21735': { // The Rock Driving
    boxCount: 2,
    format: 'reaction',
    description: 'The Rock smiling then looking concerned while driving',
    bestFor: 'Conversation that starts good then goes bad, unexpected concerning revelations',
    textBoxes: [
      { position: 'top', purpose: 'Normal/pleasant statement' },
      { position: 'bottom', purpose: 'Concerning follow-up that changes everything' },
    ],
  },
  '97984': { // Disaster Girl
    boxCount: 2,
    format: 'reaction',
    description: 'Girl smiling deviously while house burns behind her',
    bestFor: 'Causing chaos and enjoying it, evil satisfaction, watching destruction you caused',
    textBoxes: [
      { position: 'top', purpose: 'Setup/context' },
      { position: 'bottom', purpose: 'The chaotic thing you did/enjoying chaos' },
    ],
  },
  '119139145': { // Blank Nut Button
    boxCount: 2,
    format: 'reaction',
    description: 'Hand slamming down on button eagerly',
    bestFor: 'Cant resist doing something, enthusiastic agreement, instant reaction to trigger',
    textBoxes: [
      { position: 'top', purpose: 'What triggers the reaction' },
      { position: 'bottom', purpose: 'The irresistible response' },
    ],
  },
  '123999232': { // The Scroll of Truth
    boxCount: 2,
    format: 'reaction',
    description: 'Finding scroll of truth and throwing it away in disgust',
    bestFor: 'Rejecting uncomfortable truths, denial of reality, refusing to accept facts',
    textBoxes: [
      { position: 'top', purpose: 'The uncomfortable truth on scroll' },
      { position: 'bottom', purpose: 'Rejection reaction "NYEH!"' },
    ],
  },
  '196652226': { // Spongebob Ight Imma Head Out
    boxCount: 1,
    format: 'reaction',
    description: 'SpongeBob getting up to leave',
    bestFor: 'Leaving a situation, noping out, when youve had enough',
    textBoxes: [
      { position: 'top', purpose: 'Situation making you leave' },
    ],
  },
  '259237855': { // Laughing Leo
    boxCount: 2,
    format: 'reaction',
    description: 'Leonardo DiCaprio laughing and pointing',
    bestFor: 'Smug recognition, seeing something predictable happen, "I told you so" moments',
    textBoxes: [
      { position: 'top', purpose: 'What youre laughing at' },
      { position: 'bottom', purpose: 'Why its funny/predictable' },
    ],
  },
  '226297822': { // Monkey Puppet
    boxCount: 2,
    format: 'reaction',
    description: 'Puppet monkey looking away nervously',
    bestFor: 'Awkward avoidance, pretending not to notice, guilty side-eye',
    textBoxes: [
      { position: 'top', purpose: 'Awkward situation' },
      { position: 'bottom', purpose: 'Your nervous reaction' },
    ],
  },

  // === SELF-SABOTAGE / IRONY MEMES ===
  '79132341': { // Bike Fall
    boxCount: 3,
    format: 'multi-panel',
    description: 'Person puts stick in own bike wheel and falls',
    bestFor: 'Self-sabotage, causing your own problems then blaming others, ironic self-destruction',
    textBoxes: [
      { position: 'panel1', purpose: 'Action causing the problem' },
      { position: 'panel2', purpose: 'The self-sabotage' },
      { position: 'panel3', purpose: 'Blaming something else / confused reaction' },
    ],
  },
  '61544': { // This Is Fine
    boxCount: 2,
    format: 'reaction',
    description: 'Dog sitting in burning room saying "This is fine"',
    bestFor: 'Ignoring obvious problems, denial in crisis, pretending everything is okay when its not',
    textBoxes: [
      { position: 'top', purpose: 'The disaster/problem' },
      { position: 'bottom', purpose: '"This is fine" / acceptance' },
    ],
  },
  '178591752': { // Clown Applying Makeup
    boxCount: 4,
    format: 'multi-panel',
    description: 'Person progressively applying clown makeup',
    bestFor: 'Making yourself look like a fool step by step, escalating bad decisions, self-own',
    textBoxes: [
      { position: 'panel1', purpose: 'First bad decision' },
      { position: 'panel2', purpose: 'Second bad decision' },
      { position: 'panel3', purpose: 'Third bad decision' },
      { position: 'panel4', purpose: 'Full clown - the result' },
    ],
  },
  '89370399': { // Roll Safe Think About It
    boxCount: 2,
    format: 'reaction',
    description: 'Guy tapping head with clever/dumb expression',
    bestFor: 'Bad logic presented as genius, loopholes, "technically correct" thinking, galaxy brain but ironic',
    textBoxes: [
      { position: 'top', purpose: 'The problem/situation' },
      { position: 'bottom', purpose: 'The "clever" but dumb solution' },
    ],
  },
  '100777631': { // Is This a Pigeon
    boxCount: 3,
    format: 'reaction',
    description: 'Anime character pointing at butterfly asking "Is this a pigeon?"',
    bestFor: 'Misidentifying/mislabeling things, clueless observations, wrong categorization',
    textBoxes: [
      { position: 'top', purpose: 'Who is confused (the person)' },
      { position: 'center', purpose: 'The obvious thing being mislabeled (butterfly)' },
      { position: 'bottom', purpose: 'The wrong label "Is this X?"' },
    ],
  },

  // === LABEL/HOT TAKE MEMES ===
  '129242436': { // Change My Mind
    boxCount: 1,
    format: 'label',
    description: 'Steven Crowder sitting at table with sign saying "Change My Mind"',
    bestFor: 'Hot takes, controversial opinions stated as facts, confident assertions',
    textBoxes: [
      { position: 'center', purpose: 'Your controversial opinion' },
    ],
  },
  '224015000': { // Bernie Sanders Once Again Asking
    boxCount: 1,
    format: 'label',
    description: 'Bernie Sanders saying "I am once again asking..."',
    bestFor: 'Repeatedly asking for something, frustration with having to ask again',
    textBoxes: [
      { position: 'bottom', purpose: 'What youre asking for (again)' },
    ],
  },
  '101470': { // Ancient Aliens
    boxCount: 1,
    format: 'label',
    description: 'Ancient Aliens guy with wild hair gesturing',
    bestFor: 'Absurd explanations for everything, conspiracy-style reasoning, one-word answers',
    textBoxes: [
      { position: 'bottom', purpose: 'Your absurd explanation (usually one word like "Aliens")' },
    ],
  },
  '322841258': { // Anakin Padme 4 Panel
    boxCount: 4,
    format: 'multi-panel',
    description: 'Anakin tells Padme something, she asks follow-up, he stares ominously',
    bestFor: 'Revealing bad intentions, "right?" moments, when follow-up question exposes the truth',
    textBoxes: [
      { position: 'panel1', purpose: 'Initial statement' },
      { position: 'panel2', purpose: 'Follow-up question "Right?"' },
      { position: 'panel3', purpose: 'Ominous silence' },
      { position: 'panel4', purpose: '"Right??" with concern' },
    ],
  },

  // === MULTI-PANEL STORY MEMES ===
  '93895088': { // Expanding Brain
    boxCount: 4,
    format: 'multi-panel',
    description: 'Brain getting bigger with increasingly "enlightened" ideas',
    bestFor: 'Escalating absurdity on ONE topic, progression from normal to galaxy brain',
    textBoxes: [
      { position: 'panel1', purpose: 'Normal/basic approach' },
      { position: 'panel2', purpose: 'Slightly "smarter" approach' },
      { position: 'panel3', purpose: 'Big brain approach' },
      { position: 'panel4', purpose: 'Galaxy brain (absurd) approach' },
    ],
  },
  '131087935': { // Running Away Balloon
    boxCount: 3,
    format: 'multi-panel',
    description: 'Person running after balloon floating away, held back by something',
    bestFor: 'Losing something you want, things slipping away, priorities holding you back',
    textBoxes: [
      { position: 'panel1', purpose: 'Thing floating away (balloon)' },
      { position: 'panel2', purpose: 'Person chasing' },
      { position: 'panel3', purpose: 'What holds them back' },
    ],
  },
  '188390779': { // Panik Kalm Panik
    boxCount: 3,
    format: 'multi-panel',
    description: 'Three panel: panic, calm, panic again',
    bestFor: 'Emotional rollercoaster, false sense of security, relief turning to panic',
    textBoxes: [
      { position: 'panel1', purpose: 'Initial panic situation' },
      { position: 'panel2', purpose: 'Why you calm down' },
      { position: 'panel3', purpose: 'Why you panic again (worse)' },
    ],
  },
  '80707627': { // Sad Pablo Escobar
    boxCount: 3,
    format: 'multi-panel',
    description: 'Pablo Escobar standing alone looking sad and bored',
    bestFor: 'Loneliness despite success, boredom, waiting with nothing to do',
    textBoxes: [
      { position: 'panel1', purpose: 'Context for emptiness' },
      { position: 'panel2', purpose: 'More waiting' },
      { position: 'panel3', purpose: 'The sad/bored state' },
    ],
  },
  '114585149': { // Inhaling Seagull
    boxCount: 4,
    format: 'multi-panel',
    description: 'Seagull inhaling deeply then screaming',
    bestFor: 'Building up to yelling, escalating frustration leading to outburst',
    textBoxes: [
      { position: 'panel1', purpose: 'Calm observation' },
      { position: 'panel2', purpose: 'Getting worked up' },
      { position: 'panel3', purpose: 'Deep breath / inhale' },
      { position: 'panel4', purpose: 'SCREAMING outburst' },
    ],
  },
  '134797956': { // Grus Plan
    boxCount: 4,
    format: 'multi-panel',
    description: 'Gru presenting plan, last panel shows unexpected bad outcome',
    bestFor: 'Plans going wrong, unexpected consequences, "wait what" realizations',
    textBoxes: [
      { position: 'panel1', purpose: 'Step 1 of plan' },
      { position: 'panel2', purpose: 'Step 2 of plan' },
      { position: 'panel3', purpose: 'Unexpected bad outcome' },
      { position: 'panel4', purpose: 'Realizing the bad outcome' },
    ],
  },
  '91545132': { // Trump Bill Signing
    boxCount: 2,
    format: 'label',
    description: 'Trump holding up signed document',
    bestFor: 'Official declarations, making something official/law, proclamations',
    textBoxes: [
      { position: 'center', purpose: 'What is being declared/signed' },
    ],
  },
  '316433036': { // They're the Same Picture
    boxCount: 3,
    format: 'comparison',
    description: 'Pam from Office saying two pictures are the same',
    bestFor: 'Two things that seem different but are actually identical, calling out sameness',
    textBoxes: [
      { position: 'panel1', purpose: 'First thing' },
      { position: 'panel2', purpose: 'Second thing' },
      { position: 'panel3', purpose: '"Theyre the same picture"' },
    ],
  },

  // === TOP-BOTTOM TEXT CLASSICS ===
  '61579': { // One Does Not Simply
    boxCount: 2,
    format: 'top-bottom',
    description: 'Boromir saying "One does not simply..."',
    bestFor: 'Explaining why something is harder than people think, underestimated difficulty',
    textBoxes: [
      { position: 'top', purpose: '"One does not simply"' },
      { position: 'bottom', purpose: 'The thing thats actually difficult' },
    ],
  },
  '91538330': { // X, X Everywhere
    boxCount: 2,
    format: 'top-bottom',
    description: 'Buzz Lightyear showing Woody something is everywhere',
    bestFor: 'Something being ubiquitous/everywhere, overwhelming presence of X',
    textBoxes: [
      { position: 'top', purpose: '"X"' },
      { position: 'bottom', purpose: '"X everywhere"' },
    ],
  },
  '4087833': { // Waiting Skeleton
    boxCount: 2,
    format: 'top-bottom',
    description: 'Skeleton on bench, has been waiting forever',
    bestFor: 'Waiting forever for something that never happens, infinite patience required',
    textBoxes: [
      { position: 'top', purpose: 'What youre waiting for' },
      { position: 'bottom', purpose: 'Still waiting / how long' },
    ],
  },
  '27813981': { // Hide the Pain Harold
    boxCount: 2,
    format: 'top-bottom',
    description: 'Old man smiling but clearly in pain',
    bestFor: 'Hiding suffering, pretending to be okay, forced smile through pain',
    textBoxes: [
      { position: 'top', purpose: 'The painful situation' },
      { position: 'bottom', purpose: 'Pretending its fine' },
    ],
  },
  '102156234': { // Mocking SpongeBob
    boxCount: 2,
    format: 'top-bottom',
    description: 'SpongeBob mocking with alternating caps',
    bestFor: 'Mocking what someone said, sarcastic repetition',
    textBoxes: [
      { position: 'top', purpose: 'What they said (normal)' },
      { position: 'bottom', purpose: 'mOcKiNg VeRsIoN' },
    ],
  },
  '61520': { // Futurama Fry
    boxCount: 2,
    format: 'top-bottom',
    description: 'Fry squinting, not sure if X or Y',
    bestFor: 'Uncertainty between two interpretations, suspicious questioning',
    textBoxes: [
      { position: 'top', purpose: '"Not sure if X"' },
      { position: 'bottom', purpose: '"Or Y"' },
    ],
  },
  '5496396': { // Leonardo DiCaprio Cheers
    boxCount: 2,
    format: 'top-bottom',
    description: 'Leo raising glass in toast',
    bestFor: 'Toasting/saluting something, acknowledging achievement, cheers to X',
    textBoxes: [
      { position: 'top', purpose: 'Setup' },
      { position: 'bottom', purpose: 'What youre toasting to' },
    ],
  },
  '1035805': { // Boardroom Meeting Suggestion
    boxCount: 4,
    format: 'multi-panel',
    description: 'Boss asks for suggestions, throws person out window for bad answer',
    bestFor: 'Unpopular but correct opinions getting rejected, good ideas punished',
    textBoxes: [
      { position: 'panel1', purpose: 'The question/problem' },
      { position: 'panel2', purpose: 'Bad suggestion 1' },
      { position: 'panel3', purpose: 'Bad suggestion 2' },
      { position: 'panel4', purpose: 'Good suggestion that gets you thrown out' },
    ],
  },
  '61556': { // Grandma Finds The Internet
    boxCount: 2,
    format: 'top-bottom',
    description: 'Grandma at computer looking confused',
    bestFor: 'Tech confusion, discovering obvious internet things late, boomer moments',
    textBoxes: [
      { position: 'top', purpose: 'The discovery/question' },
      { position: 'bottom', purpose: 'The naive conclusion' },
    ],
  },
  '61527': { // Y U No
    boxCount: 2,
    format: 'top-bottom',
    description: 'Angry stick figure asking "Y U NO"',
    bestFor: 'Frustration at something not happening, demanding X happens',
    textBoxes: [
      { position: 'top', purpose: 'Topic' },
      { position: 'bottom', purpose: '"Y U NO X?!"' },
    ],
  },
  '61580': { // Too Damn High
    boxCount: 2,
    format: 'top-bottom',
    description: 'Jimmy McMillan saying "is too damn high"',
    bestFor: 'Complaining something is excessive, too much X',
    textBoxes: [
      { position: 'top', purpose: 'The number/amount of X' },
      { position: 'bottom', purpose: '"Is too damn high!"' },
    ],
  },
  '563423': { // That Would Be Great
    boxCount: 2,
    format: 'top-bottom',
    description: 'Office Space boss asking if you could do something',
    bestFor: 'Passive aggressive requests, asking for obvious things sarcastically',
    textBoxes: [
      { position: 'top', purpose: '"If you could X"' },
      { position: 'bottom', purpose: '"That would be great"' },
    ],
  },
  '61532': { // The Most Interesting Man
    boxCount: 2,
    format: 'top-bottom',
    description: 'Dos Equis guy saying he doesnt always X but when he does...',
    bestFor: 'Rare but specific behaviors, selective actions',
    textBoxes: [
      { position: 'top', purpose: '"I dont always X"' },
      { position: 'bottom', purpose: '"But when I do, Y"' },
    ],
  },
  '100947': { // Matrix Morpheus
    boxCount: 2,
    format: 'top-bottom',
    description: 'Morpheus presenting a mind-blowing truth',
    bestFor: 'Revealing truth, "what if I told you" revelations',
    textBoxes: [
      { position: 'top', purpose: '"What if I told you"' },
      { position: 'bottom', purpose: 'The revelation' },
    ],
  },
  '61533': { // Brace Yourselves
    boxCount: 2,
    format: 'top-bottom',
    description: 'Ned Stark saying brace yourselves, X is coming',
    bestFor: 'Warning about something approaching/imminent, preparing for X',
    textBoxes: [
      { position: 'top', purpose: '"Brace yourselves"' },
      { position: 'bottom', purpose: '"X is coming"' },
    ],
  },
  '61546': { // Pepperidge Farm Remembers
    boxCount: 2,
    format: 'top-bottom',
    description: 'Pepperidge Farm guy remembering the old days',
    bestFor: 'Nostalgia, remembering how things used to be, passive aggressive reminders',
    textBoxes: [
      { position: 'top', purpose: 'Remember when X?' },
      { position: 'bottom', purpose: '"Pepperidge Farm remembers"' },
    ],
  },
  '61585': { // Bad Luck Brian
    boxCount: 2,
    format: 'top-bottom',
    description: 'Awkward school photo kid with terrible luck',
    bestFor: 'Bad luck scenarios, things going wrong, unfortunate outcomes',
    textBoxes: [
      { position: 'top', purpose: 'Does something normal' },
      { position: 'bottom', purpose: 'Something terrible happens' },
    ],
  },
  '29617627': { // Look At Me Im The Captain Now
    boxCount: 2,
    format: 'top-bottom',
    description: 'Somali pirate saying look at me',
    bestFor: 'Taking over, becoming the new authority, power shifts',
    textBoxes: [
      { position: 'top', purpose: '"Look at me"' },
      { position: 'bottom', purpose: '"Im the X now"' },
    ],
  },
  '460541': { // Jack Sparrow Being Chased
    boxCount: 2,
    format: 'top-bottom',
    description: 'Jack Sparrow running away from crowd',
    bestFor: 'Being chased/attacked for unpopular opinion, running from consequences',
    textBoxes: [
      { position: 'top', purpose: 'What you said/did' },
      { position: 'bottom', purpose: 'Everyone coming for you' },
    ],
  },
  '28251713': { // Oprah You Get A
    boxCount: 2,
    format: 'top-bottom',
    description: 'Oprah giving things to everyone',
    bestFor: 'Everyone getting X, things being distributed widely, abundance',
    textBoxes: [
      { position: 'top', purpose: '"You get X! You get X!"' },
      { position: 'bottom', purpose: '"Everyone gets X!"' },
    ],
  },
  '99683372': { // Sleeping Shaq
    boxCount: 2,
    format: 'comparison',
    description: 'Shaq sleeping vs Shaq alert',
    bestFor: 'Ignoring important things but caring about trivial things',
    textBoxes: [
      { position: 'top', purpose: 'Important thing (sleeping/ignoring)' },
      { position: 'bottom', purpose: 'Trivial thing (wide awake/alert)' },
    ],
  },
  '180190441': { // Trade Offer
    boxCount: 3,
    format: 'comparison',
    description: 'TikTok trade offer guy presenting deal',
    bestFor: 'Proposing unfair trades, "deals" where one side clearly wins',
    textBoxes: [
      { position: 'panel1', purpose: 'I receive (what you want)' },
      { position: 'panel2', purpose: 'You receive (what you offer)' },
    ],
  },
  '309868304': { // Trade Offer (alt)
    boxCount: 2,
    format: 'comparison',
    description: 'Trade offer format',
    bestFor: 'Unfair exchanges, bad deals, asymmetric trades',
    textBoxes: [
      { position: 'top', purpose: 'I receive' },
      { position: 'bottom', purpose: 'You receive' },
    ],
  },
  '61539': { // First World Problems
    boxCount: 2,
    format: 'top-bottom',
    description: 'Woman crying about trivial problem',
    bestFor: 'Complaining about non-problems, privileged complaints, minor inconveniences',
    textBoxes: [
      { position: 'top', purpose: 'Privileged situation' },
      { position: 'bottom', purpose: 'The trivial "problem"' },
    ],
  },
  '6235864': { // Finding Neverland
    boxCount: 3,
    format: 'multi-panel',
    description: 'Johnny Depp comforting sad kid',
    bestFor: 'Delivering sad news gently, harsh truths told kindly',
    textBoxes: [
      { position: 'panel1', purpose: 'Question/hope' },
      { position: 'panel2', purpose: 'Sad answer' },
      { position: 'panel3', purpose: 'Comforting/accepting' },
    ],
  },
  '101288': { // Third World Skeptical Kid
    boxCount: 2,
    format: 'top-bottom',
    description: 'Skeptical African kid',
    bestFor: 'Calling BS, skeptical reactions to claims, "so youre telling me" disbelief',
    textBoxes: [
      { position: 'top', purpose: '"So youre telling me X"' },
      { position: 'bottom', purpose: '"And Y?" (skeptical)' },
    ],
  },
  '101716': { // Evil Kermit
    boxCount: 2,
    format: 'comparison',
    description: 'Kermit with hooded evil Kermit',
    bestFor: 'Inner voice telling you to do bad things, temptation vs conscience',
    textBoxes: [
      { position: 'top', purpose: 'Sensible thought (Kermit)' },
      { position: 'bottom', purpose: 'Bad temptation (Evil Kermit)' },
    ],
  },
  '124055727': { // Y'all Got Any More of Them
    boxCount: 2,
    format: 'top-bottom',
    description: 'Dave Chappelle scratching neck asking for more',
    bestFor: 'Craving/addiction, desperately wanting more of X',
    textBoxes: [
      { position: 'top', purpose: '"Yall got any more of them"' },
      { position: 'bottom', purpose: 'Thing youre craving' },
    ],
  },
  '163573': { // Imagination Spongebob
    boxCount: 2,
    format: 'top-bottom',
    description: 'SpongeBob making rainbow with hands saying "imagination"',
    bestFor: 'Wishful thinking, imaginary scenarios, things that only exist in dreams',
    textBoxes: [
      { position: 'top', purpose: 'What people think/imagine' },
      { position: 'bottom', purpose: '"Imagination" / the fantasy' },
    ],
  },
  '195515965': { // Clown makeup mirror
    boxCount: 2,
    format: 'reaction',
    description: 'Person looking in mirror seeing clown',
    bestFor: 'Realizing youre the fool, self-reflection showing youre wrong',
    textBoxes: [
      { position: 'top', purpose: 'What you thought/did' },
      { position: 'bottom', purpose: 'Realizing youre the clown' },
    ],
  },
  '222403160': { // Bernie I Am Once Again Asking
    boxCount: 2,
    format: 'label',
    description: 'Bernie asking for something again',
    bestFor: 'Repeatedly requesting something, having to ask again',
    textBoxes: [
      { position: 'top', purpose: '"I am once again asking"' },
      { position: 'bottom', purpose: 'What youre asking for' },
    ],
  },
  '370867422': { // Megamind no bitches
    boxCount: 1,
    format: 'label',
    description: 'Megamind with big forehead',
    bestFor: 'Calling out lack of X, "no X?" format',
    textBoxes: [
      { position: 'bottom', purpose: '"No X?"' },
    ],
  },
  '259680400': { // Soldier protecting sleeping child
    boxCount: 3,
    format: 'multi-panel',
    description: 'Soldier shielding sleeping child from threats',
    bestFor: 'Something protecting you from threats, unsung heroes',
    textBoxes: [
      { position: 'panel1', purpose: 'Threats/dangers' },
      { position: 'panel2', purpose: 'Protector' },
      { position: 'panel3', purpose: 'Protected (sleeping)' },
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

export function getCompactTemplateDescriptions(
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
      return `ID: ${t.id} | ${t.name} | ${format.format} | boxes: ${t.box_count} | best: ${format.bestFor}`;
    })
    .join('\n');
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
