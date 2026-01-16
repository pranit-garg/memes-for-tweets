/**
 * Expanded Meme Library System
 * 
 * Multiple sources to 10x+ our meme template options:
 * 1. Imgflip API - 100+ popular templates
 * 2. Memegen.link - 200+ additional templates  
 * 3. Custom curated trending memes
 * 4. Community favorites
 */

export interface UnifiedMemeTemplate {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  boxCount: number;
  source: 'imgflip' | 'memegen' | 'custom';
  category?: MemeCategory;
  tags?: string[];
  popularity?: number; // 1-100 score
  yearPopular?: number; // When did this meme peak?
}

export type MemeCategory = 
  | 'reaction'
  | 'comparison'
  | 'label'
  | 'multi-panel'
  | 'animal'
  | 'movie-tv'
  | 'cartoon'
  | 'classic'
  | 'modern'
  | 'wholesome'
  | 'dark-humor'
  | 'relatable'
  | 'niche';

// Memegen.link templates - curated list of their best
// Full list at: https://api.memegen.link/templates/
export const MEMEGEN_TEMPLATES: Omit<UnifiedMemeTemplate, 'source'>[] = [
  // Classic memes not on imgflip
  { id: 'aag', name: 'Ancient Aliens Guy', url: 'https://api.memegen.link/images/aag.png', width: 500, height: 437, boxCount: 2, category: 'classic', tags: ['aliens', 'explanation'], popularity: 75 },
  { id: 'ackbar', name: "It's a Trap", url: 'https://api.memegen.link/images/ackbar.png', width: 650, height: 433, boxCount: 2, category: 'reaction', tags: ['star-wars', 'warning'], popularity: 70 },
  { id: 'afraid', name: 'Afraid to Ask Andy', url: 'https://api.memegen.link/images/afraid.png', width: 650, height: 433, boxCount: 2, category: 'reaction', tags: ['parks-rec', 'confused'], popularity: 80 },
  { id: 'agnes', name: 'Agnes Harkness Winking', url: 'https://api.memegen.link/images/agnes.png', width: 828, height: 822, boxCount: 2, category: 'reaction', tags: ['marvel', 'wink'], popularity: 65 },
  { id: 'aint', name: "Ain't Nobody Got Time", url: 'https://api.memegen.link/images/aint.png', width: 550, height: 413, boxCount: 2, category: 'reaction', tags: ['aint-nobody', 'busy'], popularity: 75 },
  { id: 'ams', name: 'Awkward Monkey', url: 'https://api.memegen.link/images/ams.png', width: 814, height: 500, boxCount: 2, category: 'reaction', tags: ['awkward', 'side-eye'], popularity: 85 },
  { id: 'astronaut', name: 'Always Has Been', url: 'https://api.memegen.link/images/astronaut.png', width: 960, height: 686, boxCount: 2, category: 'reaction', tags: ['space', 'revelation'], popularity: 90 },
  { id: 'bad', name: 'Bad Luck Brian', url: 'https://api.memegen.link/images/bad.png', width: 500, height: 641, boxCount: 2, category: 'classic', tags: ['bad-luck', 'unfortunate'], popularity: 70 },
  { id: 'bd', name: 'Butthurt Dweller', url: 'https://api.memegen.link/images/bd.png', width: 625, height: 475, boxCount: 2, category: 'classic', tags: ['neckbeard', 'geek'], popularity: 55 },
  { id: 'bender', name: 'Bender Blackjack', url: 'https://api.memegen.link/images/bender.png', width: 625, height: 429, boxCount: 2, category: 'cartoon', tags: ['futurama', 'gambling'], popularity: 65 },
  { id: 'biw', name: 'Baby Insanity Wolf', url: 'https://api.memegen.link/images/biw.png', width: 600, height: 600, boxCount: 2, category: 'animal', tags: ['wolf', 'mild'], popularity: 50 },
  { id: 'blb', name: 'Bad Luck Brian', url: 'https://api.memegen.link/images/blb.png', width: 500, height: 641, boxCount: 2, category: 'classic', tags: ['bad-luck', 'unfortunate'], popularity: 70 },
  { id: 'boat', name: 'Boat Stuck', url: 'https://api.memegen.link/images/boat.png', width: 1010, height: 663, boxCount: 2, category: 'modern', tags: ['evergreen', 'stuck'], popularity: 60 },
  { id: 'both', name: 'Why Not Both', url: 'https://api.memegen.link/images/both.png', width: 500, height: 370, boxCount: 1, category: 'reaction', tags: ['both', 'choice'], popularity: 80 },
  { id: 'bs', name: 'Black Science Guy', url: 'https://api.memegen.link/images/bs.png', width: 500, height: 380, boxCount: 2, category: 'reaction', tags: ['neil-degrasse', 'science'], popularity: 65 },
  { id: 'buzz', name: 'Buzz Lightyear Everywhere', url: 'https://api.memegen.link/images/buzz.png', width: 520, height: 386, boxCount: 2, category: 'movie-tv', tags: ['toy-story', 'everywhere'], popularity: 80 },
  { id: 'captain', name: "I'm the Captain Now", url: 'https://api.memegen.link/images/captain.png', width: 620, height: 387, boxCount: 2, category: 'movie-tv', tags: ['captain-phillips', 'takeover'], popularity: 75 },
  { id: 'cb', name: 'Cash Me Outside', url: 'https://api.memegen.link/images/cb.png', width: 500, height: 502, boxCount: 2, category: 'modern', tags: ['cash-me', 'fight'], popularity: 55 },
  { id: 'cbg', name: 'Comic Book Guy', url: 'https://api.memegen.link/images/cbg.png', width: 548, height: 411, boxCount: 2, category: 'cartoon', tags: ['simpsons', 'worst-ever'], popularity: 60 },
  { id: 'center', name: 'Center for Ants', url: 'https://api.memegen.link/images/center.png', width: 650, height: 433, boxCount: 2, category: 'movie-tv', tags: ['zoolander', 'small'], popularity: 65 },
  { id: 'ch', name: 'Captain Hindsight', url: 'https://api.memegen.link/images/ch.png', width: 509, height: 382, boxCount: 2, category: 'cartoon', tags: ['south-park', 'hindsight'], popularity: 55 },
  { id: 'cheems', name: 'Cheems', url: 'https://api.memegen.link/images/cheems.png', width: 949, height: 1024, boxCount: 2, category: 'animal', tags: ['doge', 'bonk'], popularity: 85 },
  { id: 'chosen', name: 'You Were the Chosen One', url: 'https://api.memegen.link/images/chosen.png', width: 1024, height: 768, boxCount: 2, category: 'movie-tv', tags: ['star-wars', 'betrayal'], popularity: 75 },
  { id: 'cmm', name: 'Change My Mind', url: 'https://api.memegen.link/images/cmm.png', width: 750, height: 483, boxCount: 1, category: 'label', tags: ['crowder', 'hot-take'], popularity: 90 },
  { id: 'crazypills', name: 'I Feel Like I\'m Taking Crazy Pills', url: 'https://api.memegen.link/images/crazypills.png', width: 650, height: 433, boxCount: 2, category: 'movie-tv', tags: ['zoolander', 'crazy'], popularity: 65 },
  { id: 'cryingfloor', name: 'Crying on Floor', url: 'https://api.memegen.link/images/cryingfloor.png', width: 645, height: 370, boxCount: 2, category: 'reaction', tags: ['crying', 'sad'], popularity: 70 },
  { id: 'db', name: 'Distracted Boyfriend', url: 'https://api.memegen.link/images/db.png', width: 1200, height: 800, boxCount: 3, category: 'comparison', tags: ['distracted', 'temptation'], popularity: 95 },
  { id: 'dg', name: 'Disaster Girl', url: 'https://api.memegen.link/images/dg.png', width: 500, height: 375, boxCount: 2, category: 'reaction', tags: ['fire', 'evil'], popularity: 80 },
  { id: 'disastergirl', name: 'Disaster Girl', url: 'https://api.memegen.link/images/disastergirl.png', width: 500, height: 375, boxCount: 2, category: 'reaction', tags: ['fire', 'evil'], popularity: 80 },
  { id: 'dodgson', name: 'Dodgson', url: 'https://api.memegen.link/images/dodgson.png', width: 512, height: 384, boxCount: 2, category: 'movie-tv', tags: ['jurassic-park', 'nobody-cares'], popularity: 65 },
  { id: 'doge', name: 'Doge', url: 'https://api.memegen.link/images/doge.png', width: 640, height: 640, boxCount: 5, category: 'animal', tags: ['doge', 'wow', 'shiba'], popularity: 90 },
  { id: 'dragon', name: 'Boardroom Suggestion', url: 'https://api.memegen.link/images/dragon.png', width: 500, height: 649, boxCount: 4, category: 'multi-panel', tags: ['meeting', 'thrown-out'], popularity: 75 },
  { id: 'drake', name: 'Drake Hotline Bling', url: 'https://api.memegen.link/images/drake.png', width: 717, height: 717, boxCount: 2, category: 'comparison', tags: ['drake', 'preference'], popularity: 95 },
  { id: 'drowning', name: 'Drowning High Five', url: 'https://api.memegen.link/images/drowning.png', width: 680, height: 544, boxCount: 3, category: 'multi-panel', tags: ['drowning', 'ignore'], popularity: 70 },
  { id: 'ds', name: 'Dat Boi', url: 'https://api.memegen.link/images/ds.png', width: 748, height: 711, boxCount: 2, category: 'classic', tags: ['frog', 'here-come'], popularity: 60 },
  { id: 'dsm', name: "Didn't See Nothing", url: 'https://api.memegen.link/images/dsm.png', width: 457, height: 305, boxCount: 2, category: 'reaction', tags: ['blind', 'ignore'], popularity: 55 },
  { id: 'dwight', name: 'Dwight False', url: 'https://api.memegen.link/images/dwight.png', width: 625, height: 573, boxCount: 2, category: 'movie-tv', tags: ['office', 'false'], popularity: 75 },
  { id: 'elmo', name: 'Elmo Fire', url: 'https://api.memegen.link/images/elmo.png', width: 1113, height: 1200, boxCount: 2, category: 'cartoon', tags: ['sesame', 'fire', 'chaos'], popularity: 80 },
  { id: 'exit', name: 'Left Exit 12 Off Ramp', url: 'https://api.memegen.link/images/exit.png', width: 565, height: 510, boxCount: 3, category: 'comparison', tags: ['car', 'choice'], popularity: 75 },
  { id: 'expanding', name: 'Expanding Brain', url: 'https://api.memegen.link/images/expanding.png', width: 857, height: 1202, boxCount: 4, category: 'multi-panel', tags: ['brain', 'escalation'], popularity: 85 },
  { id: 'facepalm', name: 'Captain Picard Facepalm', url: 'https://api.memegen.link/images/facepalm.png', width: 300, height: 299, boxCount: 2, category: 'reaction', tags: ['star-trek', 'facepalm'], popularity: 80 },
  { id: 'fancy', name: 'Fancy Pooh', url: 'https://api.memegen.link/images/fancy.png', width: 636, height: 695, boxCount: 2, category: 'comparison', tags: ['pooh', 'fancy'], popularity: 90 },
  { id: 'fbt', name: 'Friendship Ended', url: 'https://api.memegen.link/images/fbt.png', width: 539, height: 390, boxCount: 2, category: 'modern', tags: ['friendship', 'ended'], popularity: 70 },
  { id: 'fine', name: 'This is Fine', url: 'https://api.memegen.link/images/fine.png', width: 580, height: 282, boxCount: 2, category: 'reaction', tags: ['fire', 'fine', 'denial'], popularity: 90 },
  { id: 'fry', name: 'Futurama Fry', url: 'https://api.memegen.link/images/fry.png', width: 552, height: 414, boxCount: 2, category: 'cartoon', tags: ['futurama', 'not-sure'], popularity: 85 },
  { id: 'gandalf', name: 'Confused Gandalf', url: 'https://api.memegen.link/images/gandalf.png', width: 609, height: 428, boxCount: 2, category: 'movie-tv', tags: ['lotr', 'confused'], popularity: 70 },
  { id: 'genie', name: 'Genie Rules', url: 'https://api.memegen.link/images/genie.png', width: 680, height: 680, boxCount: 4, category: 'multi-panel', tags: ['aladdin', 'rules', 'wishes'], popularity: 75 },
  { id: 'ggg', name: 'Good Guy Greg', url: 'https://api.memegen.link/images/ggg.png', width: 430, height: 469, boxCount: 2, category: 'classic', tags: ['good-guy', 'nice'], popularity: 60 },
  { id: 'grim', name: 'Grim Reaper Knocking', url: 'https://api.memegen.link/images/grim.png', width: 576, height: 767, boxCount: 4, category: 'multi-panel', tags: ['death', 'knocking'], popularity: 75 },
  { id: 'grumpycat', name: 'Grumpy Cat', url: 'https://api.memegen.link/images/grumpycat.png', width: 625, height: 475, boxCount: 2, category: 'animal', tags: ['cat', 'grumpy', 'no'], popularity: 75 },
  { id: 'gru', name: "Gru's Plan", url: 'https://api.memegen.link/images/gru.png', width: 700, height: 950, boxCount: 4, category: 'multi-panel', tags: ['despicable-me', 'plan', 'backfire'], popularity: 85 },
  { id: 'hagrid', name: "I Should Not Have Said That", url: 'https://api.memegen.link/images/hagrid.png', width: 625, height: 502, boxCount: 2, category: 'movie-tv', tags: ['harry-potter', 'regret'], popularity: 70 },
  { id: 'harold', name: 'Hide the Pain Harold', url: 'https://api.memegen.link/images/harold.png', width: 640, height: 640, boxCount: 2, category: 'reaction', tags: ['harold', 'pain', 'smile'], popularity: 85 },
  { id: 'happening', name: "It's Happening", url: 'https://api.memegen.link/images/happening.png', width: 411, height: 411, boxCount: 2, category: 'reaction', tags: ['ron-paul', 'happening'], popularity: 65 },
  { id: 'headache', name: 'NPC Wojak', url: 'https://api.memegen.link/images/headache.png', width: 500, height: 654, boxCount: 2, category: 'modern', tags: ['wojak', 'npc'], popularity: 75 },
  { id: 'here', name: 'Obi-Wan Hello There', url: 'https://api.memegen.link/images/here.png', width: 650, height: 433, boxCount: 2, category: 'movie-tv', tags: ['star-wars', 'hello'], popularity: 80 },
  { id: 'highfive', name: 'Epic High Five', url: 'https://api.memegen.link/images/highfive.png', width: 640, height: 426, boxCount: 3, category: 'comparison', tags: ['handshake', 'agree'], popularity: 85 },
  { id: 'home', name: 'Spiderman Presentation', url: 'https://api.memegen.link/images/home.png', width: 1280, height: 720, boxCount: 2, category: 'label', tags: ['spiderman', 'presentation'], popularity: 80 },
  { id: 'icanhas', name: 'I Can Has Cheezburger', url: 'https://api.memegen.link/images/icanhas.png', width: 500, height: 375, boxCount: 2, category: 'animal', tags: ['cat', 'classic'], popularity: 55 },
  { id: 'imsorry', name: "I'm Sorry I Can't Hear You", url: 'https://api.memegen.link/images/imsorry.png', width: 478, height: 359, boxCount: 2, category: 'reaction', tags: ['money', 'rich'], popularity: 60 },
  { id: 'interesting', name: 'Leonardo DiCaprio Cheers', url: 'https://api.memegen.link/images/interesting.png', width: 500, height: 669, boxCount: 2, category: 'movie-tv', tags: ['leo', 'cheers', 'gatsby'], popularity: 80 },
  { id: 'ive', name: "I've Won But At What Cost", url: 'https://api.memegen.link/images/ive.png', width: 640, height: 360, boxCount: 2, category: 'reaction', tags: ['megamind', 'pyrrhic'], popularity: 75 },
  { id: 'iw', name: 'Insanity Wolf', url: 'https://api.memegen.link/images/iw.png', width: 500, height: 500, boxCount: 2, category: 'animal', tags: ['wolf', 'insane'], popularity: 60 },
  { id: 'jd', name: 'Jack Sparrow', url: 'https://api.memegen.link/images/jd.png', width: 500, height: 500, boxCount: 2, category: 'movie-tv', tags: ['pirates', 'but-why'], popularity: 70 },
  { id: 'jetpack', name: 'Jetpack Abandonment', url: 'https://api.memegen.link/images/jetpack.png', width: 500, height: 649, boxCount: 4, category: 'multi-panel', tags: ['abandon', 'meeting'], popularity: 65 },
  { id: 'joker', name: 'Joker Chaos', url: 'https://api.memegen.link/images/joker.png', width: 650, height: 433, boxCount: 2, category: 'movie-tv', tags: ['joker', 'chaos'], popularity: 70 },
  { id: 'karmawhore', name: 'Karma Whore', url: 'https://api.memegen.link/images/karmawhore.png', width: 500, height: 549, boxCount: 2, category: 'classic', tags: ['reddit', 'karma'], popularity: 50 },
  { id: 'keanu', name: 'Keanu Wholesome', url: 'https://api.memegen.link/images/keanu.png', width: 680, height: 511, boxCount: 2, category: 'wholesome', tags: ['keanu', 'wholesome'], popularity: 80 },
  { id: 'kermit', name: "But That's None of My Business", url: 'https://api.memegen.link/images/kermit.png', width: 620, height: 436, boxCount: 2, category: 'reaction', tags: ['kermit', 'tea', 'shade'], popularity: 85 },
  { id: 'kk', name: 'Excited Kitten', url: 'https://api.memegen.link/images/kk.png', width: 472, height: 349, boxCount: 2, category: 'animal', tags: ['cat', 'excited'], popularity: 55 },
  { id: 'kombucha', name: 'Kombucha Girl', url: 'https://api.memegen.link/images/kombucha.png', width: 1200, height: 640, boxCount: 2, category: 'modern', tags: ['reaction', 'disgust'], popularity: 75 },
  { id: 'krabs', name: 'Mr. Krabs Blur', url: 'https://api.memegen.link/images/krabs.png', width: 696, height: 538, boxCount: 2, category: 'cartoon', tags: ['spongebob', 'confused', 'blur'], popularity: 70 },
  { id: 'leo', name: 'Laughing Leo', url: 'https://api.memegen.link/images/leo.png', width: 625, height: 626, boxCount: 2, category: 'movie-tv', tags: ['leo', 'laughing', 'pointing'], popularity: 85 },
  { id: 'live', name: 'Kalm Panik', url: 'https://api.memegen.link/images/live.png', width: 640, height: 640, boxCount: 3, category: 'multi-panel', tags: ['panik', 'kalm'], popularity: 85 },
  { id: 'll', name: 'Laughing Lizard', url: 'https://api.memegen.link/images/ll.png', width: 500, height: 362, boxCount: 2, category: 'animal', tags: ['lizard', 'laughing'], popularity: 55 },
  { id: 'loud', name: 'Loud Noises', url: 'https://api.memegen.link/images/loud.png', width: 500, height: 381, boxCount: 2, category: 'movie-tv', tags: ['anchorman', 'loud'], popularity: 60 },
  { id: 'mb', name: 'Money Baby', url: 'https://api.memegen.link/images/mb.png', width: 500, height: 333, boxCount: 2, category: 'reaction', tags: ['money', 'success'], popularity: 65 },
  { id: 'michael-scott', name: "No God Please No", url: 'https://api.memegen.link/images/michael-scott.png', width: 625, height: 352, boxCount: 2, category: 'movie-tv', tags: ['office', 'michael', 'no'], popularity: 80 },
  { id: 'millers', name: "Those Bastards Lied to Me", url: 'https://api.memegen.link/images/millers.png', width: 460, height: 457, boxCount: 2, category: 'movie-tv', tags: ['lied', 'betrayal'], popularity: 70 },
  { id: 'mini-keanu', name: 'Mini Keanu', url: 'https://api.memegen.link/images/mini-keanu.png', width: 1200, height: 800, boxCount: 2, category: 'wholesome', tags: ['keanu', 'mini'], popularity: 65 },
  { id: 'mmm', name: "My Mom's Memes", url: 'https://api.memegen.link/images/mmm.png', width: 680, height: 369, boxCount: 2, category: 'relatable', tags: ['mom', 'facebook'], popularity: 60 },
  { id: 'money', name: 'Shut Up and Take My Money', url: 'https://api.memegen.link/images/money.png', width: 510, height: 405, boxCount: 2, category: 'reaction', tags: ['futurama', 'money', 'buy'], popularity: 80 },
  { id: 'mordor', name: 'One Does Not Simply', url: 'https://api.memegen.link/images/mordor.png', width: 599, height: 399, boxCount: 2, category: 'movie-tv', tags: ['lotr', 'boromir'], popularity: 80 },
  { id: 'morpheus', name: 'Matrix Morpheus', url: 'https://api.memegen.link/images/morpheus.png', width: 380, height: 280, boxCount: 2, category: 'movie-tv', tags: ['matrix', 'what-if'], popularity: 75 },
  { id: 'noidea', name: 'No Idea Dog', url: 'https://api.memegen.link/images/noidea.png', width: 460, height: 330, boxCount: 2, category: 'animal', tags: ['dog', 'no-idea'], popularity: 70 },
  { id: 'ntot', name: 'Not The Hero We Deserved', url: 'https://api.memegen.link/images/ntot.png', width: 460, height: 323, boxCount: 2, category: 'movie-tv', tags: ['batman', 'hero'], popularity: 65 },
  { id: 'officespace', name: 'That Would Be Great', url: 'https://api.memegen.link/images/officespace.png', width: 420, height: 315, boxCount: 2, category: 'movie-tv', tags: ['office-space', 'boss'], popularity: 75 },
  { id: 'oprah', name: 'Oprah You Get A', url: 'https://api.memegen.link/images/oprah.png', width: 620, height: 397, boxCount: 2, category: 'reaction', tags: ['oprah', 'you-get'], popularity: 80 },
  { id: 'patrick', name: 'Patrick Not My Wallet', url: 'https://api.memegen.link/images/patrick.png', width: 512, height: 384, boxCount: 4, category: 'multi-panel', tags: ['spongebob', 'denial'], popularity: 75 },
  { id: 'persian', name: 'Persian Cat Guardian', url: 'https://api.memegen.link/images/persian.png', width: 480, height: 500, boxCount: 2, category: 'animal', tags: ['cat', 'guardian'], popularity: 55 },
  { id: 'philosoraptor', name: 'Philosoraptor', url: 'https://api.memegen.link/images/philosoraptor.png', width: 470, height: 478, boxCount: 2, category: 'classic', tags: ['dinosaur', 'philosophy'], popularity: 65 },
  { id: 'pigeon', name: 'Is This a Pigeon', url: 'https://api.memegen.link/images/pigeon.png', width: 853, height: 480, boxCount: 3, category: 'reaction', tags: ['anime', 'misidentify'], popularity: 85 },
  { id: 'ptj', name: 'Put It Somewhere Else Patrick', url: 'https://api.memegen.link/images/ptj.png', width: 500, height: 372, boxCount: 2, category: 'cartoon', tags: ['spongebob', 'solution'], popularity: 60 },
  { id: 'puffin', name: 'Unpopular Opinion Puffin', url: 'https://api.memegen.link/images/puffin.png', width: 500, height: 500, boxCount: 2, category: 'animal', tags: ['unpopular', 'opinion'], popularity: 60 },
  { id: 'red', name: 'Red Forman Dumbass', url: 'https://api.memegen.link/images/red.png', width: 465, height: 580, boxCount: 2, category: 'movie-tv', tags: ['that-70s', 'dumbass'], popularity: 65 },
  { id: 'regret', name: 'I Immediately Regret This Decision', url: 'https://api.memegen.link/images/regret.png', width: 500, height: 268, boxCount: 2, category: 'movie-tv', tags: ['anchorman', 'regret'], popularity: 70 },
  { id: 'remembers', name: 'Pepperidge Farm Remembers', url: 'https://api.memegen.link/images/remembers.png', width: 625, height: 475, boxCount: 2, category: 'classic', tags: ['nostalgia', 'remember'], popularity: 70 },
  { id: 'right', name: 'This Is Where I Would Put My Trophy', url: 'https://api.memegen.link/images/right.png', width: 1200, height: 900, boxCount: 2, category: 'cartoon', tags: ['fairly-odd', 'trophy'], popularity: 65 },
  { id: 'rollsafe', name: 'Roll Safe Think', url: 'https://api.memegen.link/images/rollsafe.png', width: 702, height: 395, boxCount: 2, category: 'reaction', tags: ['think', 'pointing', 'smart'], popularity: 85 },
  { id: 'sad-biden', name: 'Sad Joe Biden', url: 'https://api.memegen.link/images/sad-biden.png', width: 620, height: 398, boxCount: 2, category: 'modern', tags: ['biden', 'sad'], popularity: 60 },
  { id: 'sad-obama', name: 'Sad Obama', url: 'https://api.memegen.link/images/sad-obama.png', width: 550, height: 375, boxCount: 2, category: 'modern', tags: ['obama', 'sad'], popularity: 60 },
  { id: 'saltbae', name: 'Salt Bae', url: 'https://api.memegen.link/images/saltbae.png', width: 680, height: 680, boxCount: 2, category: 'modern', tags: ['salt', 'sprinkle'], popularity: 75 },
  { id: 'same', name: 'They\'re the Same Picture', url: 'https://api.memegen.link/images/same.png', width: 500, height: 500, boxCount: 3, category: 'comparison', tags: ['office', 'pam', 'same'], popularity: 85 },
  { id: 'sarcasticbear', name: 'Sarcastic Bear', url: 'https://api.memegen.link/images/sarcasticbear.png', width: 675, height: 450, boxCount: 2, category: 'animal', tags: ['bear', 'sarcastic'], popularity: 55 },
  { id: 'sb', name: 'SpongeBob Mocking', url: 'https://api.memegen.link/images/sb.png', width: 502, height: 353, boxCount: 2, category: 'cartoon', tags: ['spongebob', 'mocking'], popularity: 90 },
  { id: 'scc', name: 'Sudden Clarity Clarence', url: 'https://api.memegen.link/images/scc.png', width: 450, height: 318, boxCount: 2, category: 'classic', tags: ['clarity', 'realization'], popularity: 60 },
  { id: 'sf', name: 'Success Kid', url: 'https://api.memegen.link/images/sf.png', width: 500, height: 500, boxCount: 2, category: 'classic', tags: ['success', 'kid', 'win'], popularity: 70 },
  { id: 'sfia', name: 'So I Got That Going For Me', url: 'https://api.memegen.link/images/sfia.png', width: 460, height: 459, boxCount: 2, category: 'movie-tv', tags: ['caddyshack', 'positive'], popularity: 60 },
  { id: 'shaq', name: 'Sleeping Shaq', url: 'https://api.memegen.link/images/shaq.png', width: 626, height: 626, boxCount: 2, category: 'reaction', tags: ['shaq', 'sleeping', 'priorities'], popularity: 80 },
  { id: 'silly', name: 'Silly Patrick', url: 'https://api.memegen.link/images/silly.png', width: 728, height: 1063, boxCount: 2, category: 'cartoon', tags: ['spongebob', 'silly'], popularity: 60 },
  { id: 'simply', name: 'One Does Not Simply', url: 'https://api.memegen.link/images/simply.png', width: 700, height: 366, boxCount: 2, category: 'movie-tv', tags: ['lotr', 'boromir'], popularity: 80 },
  { id: 'skeletor', name: 'Skeletor Facts', url: 'https://api.memegen.link/images/skeletor.png', width: 640, height: 360, boxCount: 2, category: 'cartoon', tags: ['skeletor', 'facts'], popularity: 75 },
  { id: 'ski', name: 'Super Cool Ski Instructor', url: 'https://api.memegen.link/images/ski.png', width: 480, height: 480, boxCount: 2, category: 'classic', tags: ['ski', 'gonna-have-bad-time'], popularity: 65 },
  { id: 'slowpoke', name: 'Slowpoke', url: 'https://api.memegen.link/images/slowpoke.png', width: 500, height: 500, boxCount: 2, category: 'animal', tags: ['pokemon', 'slow', 'late'], popularity: 60 },
  { id: 'snek', name: 'Snek', url: 'https://api.memegen.link/images/snek.png', width: 720, height: 711, boxCount: 2, category: 'animal', tags: ['snake', 'snek'], popularity: 65 },
  { id: 'soa', name: 'Seal of Approval', url: 'https://api.memegen.link/images/soa.png', width: 625, height: 413, boxCount: 2, category: 'animal', tags: ['seal', 'approval'], popularity: 55 },
  { id: 'spongebob', name: 'Ight Imma Head Out', url: 'https://api.memegen.link/images/spongebob.png', width: 680, height: 680, boxCount: 1, category: 'cartoon', tags: ['spongebob', 'leaving'], popularity: 85 },
  { id: 'spongebob-rainbow', name: 'SpongeBob Rainbow', url: 'https://api.memegen.link/images/spongebob-rainbow.png', width: 520, height: 386, boxCount: 2, category: 'cartoon', tags: ['spongebob', 'imagination'], popularity: 75 },
  { id: 'squidward', name: 'Squidward Window', url: 'https://api.memegen.link/images/squidward.png', width: 600, height: 573, boxCount: 2, category: 'cartoon', tags: ['spongebob', 'squidward', 'envy'], popularity: 80 },
  { id: 'ss', name: 'Scumbag Steve', url: 'https://api.memegen.link/images/ss.png', width: 500, height: 604, boxCount: 2, category: 'classic', tags: ['scumbag', 'jerk'], popularity: 55 },
  { id: 'stew', name: 'Pointing Wrestler', url: 'https://api.memegen.link/images/stew.png', width: 639, height: 482, boxCount: 2, category: 'reaction', tags: ['wrestling', 'pointing'], popularity: 65 },
  { id: 'stonks', name: 'Stonks', url: 'https://api.memegen.link/images/stonks.png', width: 720, height: 540, boxCount: 1, category: 'modern', tags: ['stonks', 'stocks', 'money'], popularity: 90 },
  { id: 'success', name: 'Success Kid', url: 'https://api.memegen.link/images/success.png', width: 500, height: 500, boxCount: 2, category: 'classic', tags: ['success', 'win'], popularity: 70 },
  { id: 'tenguy', name: '10 Guy', url: 'https://api.memegen.link/images/tenguy.png', width: 480, height: 640, boxCount: 2, category: 'classic', tags: ['stoned', 'high'], popularity: 55 },
  { id: 'toohigh', name: 'Too Damn High', url: 'https://api.memegen.link/images/toohigh.png', width: 338, height: 256, boxCount: 2, category: 'classic', tags: ['too-high', 'prices'], popularity: 70 },
  { id: 'tried', name: 'At Least You Tried', url: 'https://api.memegen.link/images/tried.png', width: 800, height: 600, boxCount: 2, category: 'reaction', tags: ['tried', 'fail'], popularity: 65 },
  { id: 'trump', name: 'Trump Executive Order', url: 'https://api.memegen.link/images/trump.png', width: 1200, height: 799, boxCount: 2, category: 'modern', tags: ['trump', 'order'], popularity: 65 },
  { id: 'ugandanknuck', name: 'Ugandan Knuckles', url: 'https://api.memegen.link/images/ugandanknuck.png', width: 1024, height: 1024, boxCount: 2, category: 'modern', tags: ['knuckles', 'da-wae'], popularity: 55 },
  { id: 'uno', name: 'UNO Draw 25', url: 'https://api.memegen.link/images/uno.png', width: 641, height: 531, boxCount: 2, category: 'modern', tags: ['uno', 'draw-25'], popularity: 90 },
  { id: 'whatyear', name: 'What Year Is It', url: 'https://api.memegen.link/images/whatyear.png', width: 650, height: 433, boxCount: 2, category: 'movie-tv', tags: ['jumanji', 'time'], popularity: 65 },
  { id: 'winter', name: 'Brace Yourselves', url: 'https://api.memegen.link/images/winter.png', width: 382, height: 379, boxCount: 2, category: 'movie-tv', tags: ['got', 'ned-stark', 'coming'], popularity: 70 },
  { id: 'wkh', name: 'Who Killed Hannibal', url: 'https://api.memegen.link/images/wkh.png', width: 500, height: 500, boxCount: 3, category: 'multi-panel', tags: ['eric-andre', 'blame'], popularity: 75 },
  { id: 'woman-cat', name: 'Woman Yelling at Cat', url: 'https://api.memegen.link/images/woman-cat.png', width: 680, height: 387, boxCount: 2, category: 'modern', tags: ['woman', 'cat', 'yelling'], popularity: 95 },
  { id: 'wonka', name: 'Condescending Wonka', url: 'https://api.memegen.link/images/wonka.png', width: 490, height: 358, boxCount: 2, category: 'movie-tv', tags: ['wonka', 'condescending'], popularity: 75 },
  { id: 'worst', name: 'Worst Day of My Life', url: 'https://api.memegen.link/images/worst.png', width: 500, height: 368, boxCount: 2, category: 'cartoon', tags: ['simpsons', 'worst-day'], popularity: 75 },
  { id: 'xy', name: 'X, X Everywhere', url: 'https://api.memegen.link/images/xy.png', width: 520, height: 386, boxCount: 2, category: 'movie-tv', tags: ['toy-story', 'everywhere'], popularity: 80 },
  { id: 'yallgot', name: "Y'all Got Any More", url: 'https://api.memegen.link/images/yallgot.png', width: 600, height: 471, boxCount: 2, category: 'movie-tv', tags: ['chappelle', 'craving'], popularity: 75 },
  { id: 'yodawg', name: 'Yo Dawg', url: 'https://api.memegen.link/images/yodawg.png', width: 600, height: 450, boxCount: 2, category: 'classic', tags: ['yo-dawg', 'inception'], popularity: 60 },
  { id: 'yuno', name: 'Y U No', url: 'https://api.memegen.link/images/yuno.png', width: 500, height: 413, boxCount: 2, category: 'classic', tags: ['y-u-no', 'frustration'], popularity: 70 },
  { id: 'zero', name: 'Office Zero Productivity', url: 'https://api.memegen.link/images/zero.png', width: 516, height: 500, boxCount: 2, category: 'movie-tv', tags: ['office', 'zero'], popularity: 60 },
];

// Additional trending/niche memes that aren't on major platforms
export const CUSTOM_MEME_TEMPLATES: Omit<UnifiedMemeTemplate, 'source'>[] = [
  // 2024-2025 trending memes
  { id: 'custom-erm', name: 'Erm What The Sigma', url: '/memes/erm-sigma.jpg', width: 500, height: 500, boxCount: 1, category: 'modern', tags: ['sigma', 'gen-z', 'brainrot'], popularity: 85 },
  { id: 'custom-skibidi', name: 'Skibidi Ohio', url: '/memes/skibidi.jpg', width: 500, height: 500, boxCount: 2, category: 'modern', tags: ['skibidi', 'ohio', 'brainrot'], popularity: 80 },
  { id: 'custom-lowqualitysoyjak', name: 'Low Quality Soyjak', url: '/memes/soyjak-lowquality.jpg', width: 400, height: 400, boxCount: 1, category: 'modern', tags: ['soyjak', 'reaction'], popularity: 75 },
];

// Category definitions with icons
export const MEME_CATEGORIES: { id: MemeCategory; name: string; icon: string; description: string }[] = [
  { id: 'reaction', name: 'Reactions', icon: '😱', description: 'Express emotions and reactions' },
  { id: 'comparison', name: 'Comparisons', icon: '⚖️', description: 'A vs B, preferences, choices' },
  { id: 'label', name: 'Label Memes', icon: '🏷️', description: 'Put text on things' },
  { id: 'multi-panel', name: 'Multi-Panel', icon: '📊', description: 'Story-based, sequential' },
  { id: 'animal', name: 'Animal Memes', icon: '🐕', description: 'Cats, dogs, and friends' },
  { id: 'movie-tv', name: 'Movies & TV', icon: '🎬', description: 'From your favorite shows' },
  { id: 'cartoon', name: 'Cartoons', icon: '📺', description: 'SpongeBob, Simpsons, etc' },
  { id: 'classic', name: 'Classic Memes', icon: '🏛️', description: 'The OG templates' },
  { id: 'modern', name: 'Modern Memes', icon: '🔥', description: 'Recent and trending' },
  { id: 'wholesome', name: 'Wholesome', icon: '💝', description: 'Feel-good content' },
  { id: 'relatable', name: 'Relatable', icon: '🤝', description: 'Universal experiences' },
  { id: 'niche', name: 'Niche', icon: '🎯', description: 'Specific communities' },
];

// Convert memegen templates to unified format
export function getMemegenTemplates(): UnifiedMemeTemplate[] {
  return MEMEGEN_TEMPLATES.map(t => ({
    ...t,
    source: 'memegen' as const,
  }));
}

// Search/filter memes
export interface MemeSearchFilters {
  query?: string;
  categories?: MemeCategory[];
  tags?: string[];
  source?: ('imgflip' | 'memegen' | 'custom')[];
  minPopularity?: number;
}

export function searchMemes(
  templates: UnifiedMemeTemplate[],
  filters: MemeSearchFilters
): UnifiedMemeTemplate[] {
  return templates.filter(t => {
    // Text search
    if (filters.query) {
      const q = filters.query.toLowerCase();
      const matchesName = t.name.toLowerCase().includes(q);
      const matchesTags = t.tags?.some(tag => tag.toLowerCase().includes(q));
      if (!matchesName && !matchesTags) return false;
    }

    // Category filter
    if (filters.categories && filters.categories.length > 0) {
      if (!t.category || !filters.categories.includes(t.category)) return false;
    }

    // Tag filter
    if (filters.tags && filters.tags.length > 0) {
      if (!t.tags || !filters.tags.some(tag => t.tags?.includes(tag))) return false;
    }

    // Source filter
    if (filters.source && filters.source.length > 0) {
      if (!filters.source.includes(t.source)) return false;
    }

    // Popularity filter
    if (filters.minPopularity) {
      if (!t.popularity || t.popularity < filters.minPopularity) return false;
    }

    return true;
  });
}

// Sort memes by various criteria
export type MemeSortOption = 'popularity' | 'name' | 'recent';

export function sortMemes(
  templates: UnifiedMemeTemplate[],
  sortBy: MemeSortOption
): UnifiedMemeTemplate[] {
  return [...templates].sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return (b.popularity || 0) - (a.popularity || 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'recent':
        return (b.yearPopular || 2020) - (a.yearPopular || 2020);
      default:
        return 0;
    }
  });
}
