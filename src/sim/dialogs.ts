// The dialog scripts: who walks in and what they say on every level, in English and Hebrew. Pure
// data plus the few helpers the sim and the renderer share so both resolve a script identically —
// the sim decides timing and who is on stage, the renderer only draws the page the snapshot names.
//
// Keyed by level id (not campaign position) so the campaign can be reordered without touching this
// file. The story (the owner's synopsis): it is only a game, Shmuel says so up front; Eviatar and Omri —
// the players — search the world for Dad (Abir) and Mom (Adi), who are always fine and always one clue
// ahead; Saba and Savta are freed on the first street and the family joins in level by level; Pitz the
// cat sniffs out the clues; the candy factory ends with the presents stolen and Caga Tió's lair is the
// finale. The kids say Mom and Dad, the grown-ups say Adi and Abir; nobody names keyboard keys. Each level has an opening (`start`), an optional dialog after a given wave (`afterWave`,
// 1-based), an optional one just before the boss walks in (`boss`, the boss itself answers from
// off-screen and only enters once the talking is done) and a closing one (`end`, the boss gets its
// last words first). A page is at most two lines of the text box; longer speeches are more pages.
import type { HeroId } from './types';

/** Who says a line: the visiting hero (its id), the level's boss (off-stage until the fight), Pitz the
 * cat (card only — someone on stage translates), or whichever player is not the visiting hero. */
export type Speaker = HeroId | 'boss' | 'player' | 'pitz';
export interface DialogLine { who: Speaker; en: string; he: string }
export interface DialogDef {
  /** The hero who walks in from the right and does the talking. */
  hero: HeroId;
  lines: DialogLine[];
  /** After the last page the hero stays and fights beside the players for the rest of the level. */
  join?: boolean;
  /** Opening dialogs only — what happens when a player already picked this hero: `keep` (default)
   * lets that player's own hero say the lines from where they stand; `swap` hands the player a
   * random other hero for this level and the hero explains it (`swapLines` replace `lines`). */
  ifPlayed?: 'keep' | 'swap';
  swapLines?: DialogLine[];
}
export interface LevelDialogs { start: DialogDef; afterWave?: Record<number, DialogDef>; boss?: DialogDef; end: DialogDef }

export type DialogKey = 'start' | 'boss' | 'end' | `wave${number}`;

/** Characters revealed per tick by the typewriter (both sim and renderer). */
export const REVEAL_CPT = 0.6;
/** Ticks a fully revealed page waits before turning on its own. */
export const AUTO_ADVANCE_TICKS = 210;
/** Ticks a button must be held to skip the whole scene. */
export const HOLD_SKIP_TICKS = 45;
/** A page ignores presses for this long after it opens, so a mash from the fight does not skip it. */
export const MIN_PAGE_TICKS = 12;

export const HERO_NAMES: Record<HeroId, { en: string; he: string }> = {
  eviatar: { en: 'Eviatar', he: 'אביתר' },
  omri: { en: 'Omri', he: 'עומרי' },
  shmuel: { en: 'Shmuel', he: 'שמואל' },
  'savta-orly': { en: 'Savta Orly', he: 'סבתא אורלי' },
  'saba-kobi': { en: 'Saba Kobi', he: 'סבא קובי' },
  noa: { en: 'Noa', he: 'נועה' },
};
export const PITZ_NAME = { en: 'Pitz', he: 'פיץ' };
export const BOSS_NAMES_HE: Record<string, string> = {
  ferryman: 'המעבורן', 'glass-warden': 'שומר הזכוכית', kilnheart: 'קילנהארט', 'monk-zero': 'מונק זירו', 'market-king': 'מלך השוק',
  railmaw: 'ריילמו', 'crown-runner': 'קראון ראנר', 'the-null': 'האפס', 'vault-mother': 'אם הכספת', 'ultra-signal': 'אולטרה סיגנל',
  'abyss-dragon': 'דרקון התהום', 'caga-tio': 'קאגה טיו', 'flame-samurai': 'סמוראי הלהבה', 'prism-queen': 'מלכת הפריזמה', 'storm-colossus': 'ענק הסערה',
};

/** Ticks until a page is fully typed out — the longer of the two languages, so a host and a guest
 * reading different languages still turn the page on the same tick. */
export const revealTicks = (line: DialogLine): number => Math.ceil(Math.max(line.en.length, line.he.length) / REVEAL_CPT);

/** The pages a dialog actually plays: the swap variant when the player was handed another hero, and
 * `player` lines only when a player who is not the visiting hero exists to say them. */
export function resolveLines(def: DialogDef, swapped: boolean, playerArches: (string | null)[]): DialogLine[] {
  const src = swapped && def.swapLines ? def.swapLines : def.lines;
  const other = playerArches.some((a) => a && a !== def.hero);
  return src.filter((l) => l.who !== 'player' || other);
}

/** Fills `{new}` / `{old}` / `{p1}` with hero names in the given language. */
export function fillNames(text: string, lang: 'en' | 'he', vars: { new?: HeroId | null; old?: HeroId | null; p1?: HeroId | null }): string {
  return text.replace(/\{(new|old|p1)\}/g, (_, k: 'new' | 'old' | 'p1') => { const id = vars[k]; return id ? HERO_NAMES[id][lang] : ''; });
}

/** Which dialog (if any) a level defines under a key. */
export function dialogFor(levelId: string, key: DialogKey): DialogDef | undefined {
  const d = DIALOGS[levelId];
  if (!d) return undefined;
  if (key === 'start' || key === 'boss' || key === 'end') return d[key];
  const n = Number(key.slice(4));
  return d.afterWave?.[n];
}

const L = (who: Speaker, en: string, he: string): DialogLine => ({ who, en, he });

export const DIALOGS: Record<string, LevelDialogs> = {
  rishon: {
    start: { hero: 'shmuel', lines: [
      L('shmuel', 'Hi! I am Shmuel, and before anything else: this is a game. Nothing here is real. Not the story, not the punches.', 'היי! אני שמואל, ולפני הכול: זה משחק. שום דבר פה לא אמיתי. לא העלילה ולא המכות.'),
      L('shmuel', 'You do not have to like it, and you do not have to play it. Stop whenever you want. Nothing bad happens.', 'לא חייבים לאהוב אותו, ולא חייבים לשחק בו. אפשר להפסיק מתי שרוצים. שום דבר רע לא קורה.'),
      L('shmuel', 'So there is some action, the story goes like this: Eviatar and Omri, that is you, are looking for Dad Abir and Mom Adi all over the world.', 'כדי שיהיה קצת אקשן, העלילה של המשחק תהיה כזאת: אביתר ועומרי, אתם, מחפשים את אבא אביר ואמא עדי ברחבי העולם.'),
      L('shmuel', 'Do not worry, they are totally fine. They are just somewhere along the way, and we will find them, one clue at a time.', 'אל תדאגו, הם בסדר גמור. הם פשוט איפשהו לאורך הדרך, ואנחנו נמצא אותם, רמז אחרי רמז.'),
      L('shmuel', 'This is HaSarig Street in Rishon LeZion, Saba and Savta\'s house. The bad guys are holding them.', 'זה רחוב השריג בראשון לציון, הבית של סבא וסבתא. הרעים מחזיקים אותם.'),
      L('shmuel', 'Beat the bad guys to free them, and they will come along with you to the next clue. Good luck!', 'נצחו את הרעים כדי לשחרר אותם, והם ימשיכו איתכם לרמז הבא. בהצלחה!'),
      L('pitz', 'Mrrp! (Pitz is coming too. Obviously.)', 'מררפ! (פיץ בא גם. ברור.)'),
      L('player', 'We are on it, bro!', 'אנחנו על זה bro!'),
    ] },
    boss: { hero: 'shmuel', join: true, lines: [
      L('shmuel', 'Hold on. The ground is shaking. That is not a punk, that is the first boss. Remember: just a game.', 'רגע. הרצפה רועדת. זה לא פאנק, זה הבוס הראשון. תזכרו: רק משחק.'),
      L('boss', 'Looking for Saba and Savta? For Mom and Dad? The Ferryman knows every road. Pay the toll and maybe I will tell you.', 'מחפשים את סבא וסבתא? את אמא ואבא? המעבורן מכיר כל דרך. שלמו את האגרה ואולי אספר.'),
      L('shmuel', 'Nobody pays on our street. I am staying for this one. Let\'s go!', 'אצלנו ברחוב לא משלמים. אני נשאר לקרב הזה. קדימה!'),
    ] },
    end: { hero: 'noa', lines: [
      L('boss', 'Fine... Refael Eitan Street... that is the only clue I have...', 'טוב... רחוב רפאל איתן... זה הרמז היחיד שיש לי...'),
      L('pitz', 'Meow. Meow-meow.', 'מיאו. מיאו-מיאו.'),
      L('noa', 'Pitz says the Ferryman dropped a note. A supermarket receipt with Adi\'s name, and a smiley on it. She is fine.', 'פיץ אומר שהמעבורן הפיל פתק. קבלה מהסופר עם השם של עדי, וסמיילי עליה. היא בסדר.'),
      L('noa', 'And Saba and Savta are free! First clue: Refael Eitan Street. Saba Kobi is already on his way there with the newspaper.', 'וסבא וסבתא חופשיים! רמז ראשון: רחוב רפאל איתן. סבא קובי כבר בדרך לשם עם העיתון.'),
    ] },
  },
  'petah-tikva': {
    start: { hero: 'saba-kobi', lines: [
      L('saba-kobi', 'Refael Eitan Street! Thanks for the rescue, kids. Adi was here at the supermarket this morning, she just went on ahead.', 'רחוב רפאל איתן! תודה על החילוץ, ילדים. עדי הייתה פה בסופר הבוקר, היא פשוט המשיכה הלאה.'),
      L('pitz', 'Mrrp. Bag of milk, two bourekas. Mom-smell. Fresh.', 'מררפ. שקית חלב, שני בורקסים. ריח של אמא. טרי.'),
      L('saba-kobi', 'And Abir? Abir called from somewhere with drums. We will get to that. First these punks, and a Gold Sorceress who throws things.', 'ואביר? אביר התקשר ממקום עם תופים. נגיע לזה. קודם הפאנקים האלה, ומכשפת זהב שזורקת דברים.'),
      L('saba-kobi', 'Dash out of her way: hold the run button and push sideways 😉', 'תתחמקו ממנה בריצה: מחזיקים את כפתור הריצה ודוחפים הצידה 😉'),
    ] },
    boss: { hero: 'savta-orly', lines: [
      L('savta-orly', 'Wait, wait, I brought soup. Nobody fights a boss on an empty stomach.', 'רגע, רגע, הבאתי מרק. אף אחד לא נלחם בבוס על בטן ריקה.'),
      L('savta-orly', 'And news: Adi left me a message. She is fine, she is with Abir.', 'וחדשות: עדי השאירה לי הודעה. היא בסדר, היא עם אביר.'),
      L('boss', 'Monk Zero needs no soup. Only silence. Your parents passed my street. Them I let through. You, I will not.', 'מונק זירו לא צריכה מרק. רק שקט. ההורים שלכם עברו ברחוב שלי. להם נתתי לעבור. לכם לא.'),
      L('savta-orly', 'Silence? In this family? Good luck with that. Watch out for this Monk Zero, sweethearts!', 'שקט? במשפחה הזאת? בהצלחה עם זה. תיזהרו מהמונק זירו הזאת, מתוקים!'),
    ] },
    end: { hero: 'noa', lines: [
      L('boss', '...so loud... the gym... they went to the gym with the drums...', '...כל כך רועש... המכון... הם הלכו למכון עם התופים...'),
      L('noa', 'Drums! That is Omri\'s capoeira gym. And Abir forgot his gym bag there, I am sure of it!', 'תופים! זה מכון הקפוארה של עומרי. ואביר שכח שם את תיק הספורט שלו, אני בטוחה!'),
      L('noa', 'Second clue. Off to Academia Ginga. Eviatar is already there, and he wants to show you something.', 'רמז שני. יוצאים לאקדמיה ז\'ינגה. אביתר כבר שם, והוא רוצה להראות לכם משהו.'),
    ] },
  },
  'capoeira-gym': {
    start: { hero: 'eviatar', ifPlayed: 'swap', lines: [
      L('eviatar', 'Omri\'s gym, Academia Ginga. Look: Dad\'s bag on the bench, and a note. "Went to buy pastries with Mom. Back soon. Love you."', 'המכון של עומרי, אקדמיה ז\'ינגה. תראו: התיק של אבא על הספסל, ופתק. "הלכנו לקנות מאפים עם אמא. חוזרים. אוהבים."'),
      L('eviatar', 'See? They are totally fine. We just keep following. Bio-Brutes are slow but hit like a truck: jump, then attack in the air, and they go down.', 'רואים? הכול טוב איתם. פשוט ממשיכים לעקוב. ביו-ברוטים איטיים אבל מכים כמו משאית: קופצים ומכים באוויר, והם נופלים.'),
      L('eviatar', 'But... where is Omri?', 'אבל... איפה עומרי?'),
    ], swapLines: [
      L('eviatar', 'Omri\'s gym, Academia Ginga. Look: Dad\'s bag on the bench, and a note. "Went to buy pastries with Mom. Back soon. Love you."', 'המכון של עומרי, אקדמיה ז\'ינגה. תראו: התיק של אבא על הספסל, ופתק. "הלכנו לקנות מאפים עם אמא. חוזרים. אוהבים."'),
      L('eviatar', 'I am reading the clues on this level, so {new} steps in for me. Next level I am back with you.', 'אני קורא את הרמזים בשלב הזה, אז {new} נכנס במקומי. בשלב הבא אני חוזר אליכם.'),
      L('eviatar', 'Bio-Brutes are slow but hit like a truck: jump, then attack in the air, and they go down. But... where is Omri?', 'ביו-ברוטים איטיים אבל מכים כמו משאית: קופצים ומכים באוויר, והם נופלים. אבל... איפה עומרי?'),
    ] },
    boss: { hero: 'eviatar', lines: [
      L('eviatar', 'Feel that heat? Something is coming through the back wall.', 'מרגישים את החום? משהו עובר דרך הקיר האחורי.'),
      L('pitz', 'HSSSS. (Pitz does not like ovens.)', 'הסססס. (פיץ לא אוהב תנורים.)'),
      L('boss', 'Kilnheart. I turn gyms into ovens. Your parents bought their pastries and left. Lucky them.', 'קילנהארט. אני הופך מכונים לתנורים. ההורים שלכם קנו מאפים והלכו. מזל שלהם.'),
      L('eviatar', 'Pastries. Got it. When he charges, jump. When the floor glows, move.', 'מאפים. הבנתי. כשהוא מסתער, קופצים. כשהרצפה זוהרת, זזים.'),
    ] },
    end: { hero: 'omri', lines: [
      L('boss', '...cooling... down...', '...מתקרר...'),
      L('omri', 'MY GYM! You saved my gym! And here I am, sorry, I was upside down the whole time. Look what fell out of his pocket: a receipt from Sant Cugat.', 'המכון שלי! הצלתם את המכון שלי! והנה אני, סליחה, הייתי הפוך כל הזמן. תראו מה נפל לו מהכיס: קבלה מסנט קוגט.'),
      L('omri', 'Third clue! Sant Cugat. The big square, the monastery, and the shops! I bet that is where they went!', 'רמז שלישי! סנט קוגט. הכיכר הגדולה, המנזר, והחנויות! בטוח שלשם הם הלכו!'),
    ] },
  },
  'sant-cugat': {
    start: { hero: 'eviatar', lines: [
      L('pitz', 'Mrrp. Plaça d\'Octavià. Two chairs by the café, still warm.', 'מררפ. פלאסה ד\'אוקטביה. שני כיסאות ליד הקפה, עוד חמים.'),
      L('pitz', 'Mom-smell, Dad-smell, two coffees, one hour ago. They laughed. They are fine.', 'ריח של אמא, ריח של אבא, שני קפה, לפני שעה. הם צחקו. הם בסדר.'),
      L('eviatar', 'Pitz, you are the best detective in Catalunya.', 'פיץ, אתה הבלש הכי טוב בקטלוניה.'),
      L('eviatar', 'Then Rainbow Oracles filled the square. They dodge a lot. Do not chase, let them come to you, then the third hit.', 'ואז אורקלי קשת מילאו את הכיכר. הם מתחמקים המון. לא לרדוף, שיבואו אליכם, ואז המכה השלישית.'),
      L('pitz', 'Mrrow. (Translation: obviously.)', 'מררוו. (תרגום: ברור.)'),
    ] },
    boss: { hero: 'omri', join: true, lines: [
      L('omri', 'Hey! Sorry I am late, I was doing cartwheels down Carrer Major. I asked everyone: they went towards Barcelona!', 'היי! סליחה שאיחרתי, עשיתי גלגלונים לאורך קאראר מז\'ור. שאלתי את כולם: הם הלכו לכיוון ברצלונה!'),
      L('boss', 'The Market King buys everything. Even this square. Even the way to Barcelona.', 'מלך השוק קונה הכול. גם את הכיכר הזאת. גם את הדרך לברצלונה.'),
      L('omri', 'Not for sale. I am in. Two on one, let\'s dance!', 'לא למכירה. אני בפנים. שניים על אחד, בואו נרקוד!'),
    ] },
    end: { hero: 'savta-orly', lines: [
      L('boss', '...my coins... my beautiful coins...', '...המטבעות שלי... המטבעות היפים שלי...'),
      L('savta-orly', 'Bravo! Sit, eat something, you earned a xuixo. And Adi texted me a photo: the two of them in front of the Sagrada Família, waving.', 'בראבו! שבו, תאכלו משהו, הרווחתם שוישו. ועדי שלחה לי תמונה: שניהם מול הסגרדה פמיליה, מנפנפים.'),
      L('savta-orly', 'Fourth clue, and a good one. Barcelona, here we come.', 'רמז רביעי, וטוב. ברצלונה, אנחנו באים.'),
    ] },
  },
  barcelona: {
    start: { hero: 'shmuel', lines: [
      L('shmuel', 'Carrer de Mallorca, and there she is: the Sagrada Família. Adi and Abir were here an hour ago. They are fine, they are just ahead of us.', 'קארר דה מיורקה, והנה היא: הסגרדה פמיליה. עדי ואביר היו פה לפני שעה. הם בסדר, הם פשוט לפנינו.'),
      L('pitz', 'Mrrp. A padel ball under the bench. Dad-smell.', 'מררפ. כדור פאדל מתחת לספסל. ריח של אבא.'),
      L('shmuel', 'Halfway through. Quick reminder: it is a game. If it stops being fun, stop. Nobody minds.', 'חצי דרך. תזכורת קטנה: זה משחק. אם זה מפסיק להיות כיף, מפסיקים. אף אחד לא כועס.'),
      L('shmuel', 'If you are in: four waves this time. Pace yourselves, you can also block hits when it gets crowded, and grab the hearts.', 'אם אתם בפנים: ארבעה גלים הפעם. תחלקו כוחות, אפשר גם לחסום מכות כשנהיה צפוף, ואוספים לבבות.'),
    ] },
    end: { hero: 'saba-kobi', lines: [
      L('boss', '...my crystals... shattered... they had tickets... the sports hall...', '...הגבישים שלי... מנופצים... היו להם כרטיסים... אולם הספורט...'),
      L('saba-kobi', 'The Prism Queen, in front of Gaudí\'s church! And two tickets in her crown: Eviatar\'s hall, tonight.', 'מלכת הפריזמה, מול הכנסייה של גאודי! ושני כרטיסים בכתר שלה: האולם של אביתר, הערב.'),
      L('saba-kobi', 'Fifth clue. Abir has probably started a padel tournament there already. To the basketball hall!', 'רמז חמישי. אביר בטח כבר התחיל שם טורניר פאדל. לאולם הכדורסל!'),
    ] },
  },
  'basketball-gym': {
    start: { hero: 'omri', ifPlayed: 'swap', lines: [
      L('omri', 'Eviatar\'s hall! Dad\'s scarf is on the bleachers, still warm from cheering. They were here, they are fine, they moved on.', 'האולם של אביתר! הצעיף של אבא על הטריבונות, עוד חם מהעידוד. הם היו פה, הם בסדר, הם המשיכו.'),
      L('omri', 'Then the Void Demons showed up under the hoop. That is a foul, right? They are the slow ones. Sneak behind them and hit the back.', 'ואז שדי החלל הופיעו מתחת לסל. זו עבירה, נכון? הם האיטיים יותר. להתגנב מאחוריהם ולהכות בגב.'),
    ], swapLines: [
      L('omri', 'Eviatar\'s hall! Dad\'s scarf is on the bleachers, still warm from cheering. They were here, they are fine, they moved on.', 'האולם של אביתר! הצעיף של אבא על הטריבונות, עוד חם מהעידוד. הם היו פה, הם בסדר, הם המשיכו.'),
      L('omri', 'I have the mic this game, so {new} gets the ball. I sub back in next level.', 'המיקרופון אצלי במשחק הזה, אז {new} מקבל את הכדור. אני חוזר לחמישייה בשלב הבא.'),
      L('omri', 'Void Demons are the slow ones. Do not stand in front of them. Sneak behind and hit the back.', 'שדי החלל הם האיטיים. לא לעמוד מולם. להתגנב מאחוריהם ולהכות בגב.'),
    ] },
    boss: { hero: 'omri', lines: [
      L('omri', 'Uh. The scoreboard just melted.', 'אה. לוח התוצאות בדיוק נמס.'),
      L('boss', 'From the deep I rise. The Abyss Dragon takes the court. Your parents left at half time. Wise.', 'מהמעמקים אני עולה. דרקון התהום לוקח את המגרש. ההורים שלכם יצאו במחצית. חכמים.'),
      L('omri', 'Then we take it back. Keep moving, he cannot hit what he cannot catch! But... where is Eviatar?', 'אז אנחנו לוקחים אותו בחזרה. תמשיכו לזוז, הוא לא יכול להכות מה שהוא לא תופס! אבל... איפה אביתר?'),
    ] },
    end: { hero: 'eviatar', lines: [
      L('boss', '...back... to the deep...', '...חזרה... למעמקים...'),
      L('eviatar', 'Here! I was on the roof fixing the scoreboard. That is my court, nobody dunks on it but me.', 'פה! הייתי על הגג מתקן את לוח התוצאות. זה המגרש שלי, אף אחד לא עושה בו דאנק חוץ ממני.'),
      L('eviatar', 'And that is Mom\'s handwriting on the scoreboard: "Picking up your drawings at school. Love, Mom."', 'וזה כתב היד של אמא על לוח התוצאות: "אוספים את הציורים שלכם בבית הספר. אוהבת, אמא."'),
      L('pitz', 'Purr. (Pitz found the marker she wrote it with.)', 'פררר. (פיץ מצא את הטוש שהיא כתבה איתו.)'),
      L('eviatar', 'Sixth clue. Hatikva School. Omri knows the way: through the yard, past the big tree.', 'רמז שישי. בית הספר התקווה. עומרי מכיר את הדרך: דרך החצר, ליד העץ הגדול.'),
    ] },
  },
  'hatikva-school': {
    start: { hero: 'omri', lines: [
      L('omri', 'Hatikva School! The court, the big tree, the blue mosaic wall. Mom took our drawings from the classroom, the teacher saw her.', 'בית ספר התקווה! המגרש, העץ הגדול, קיר הפסיפס הכחול. אמא לקחה את הציורים שלנו מהכיתה, המורה ראתה אותה.'),
      L('omri', 'Four waves this time, then something big. When the meter is full, press the special and it clears the whole yard.', 'הפעם יש ארבעה גלים, ואז משהו גדול. כשהמד מלא לוחצים על הספיישל והוא מנקה את כל החצר.'),
    ] },
    afterWave: { 2: { hero: 'eviatar', join: true, lines: [
      L('eviatar', 'Two waves down. Recess is over. I found Dad\'s coffee cup by the olive tree, so they are close.', 'שני גלים ירדו. ההפסקה נגמרה. מצאתי את כוס הקפה של אבא ליד עץ הזית, אז הם בסביבה.'),
      L('eviatar', 'I am joining you for the rest of this one.', 'אני מצטרף אליכם לשאר השלב.'),
      L('pitz', 'Mrrp. Still warm. (Pitz checked. With his nose.)', 'מררפ. עוד חמה. (פיץ בדק. עם האף.)'),
      L('eviatar', 'Stick together. The Bio-Brutes come from both sides now.', 'תישארו ביחד. הביו-ברוטים מגיעים עכשיו משני הצדדים.'),
    ] } },
    end: { hero: 'saba-kobi', lines: [
      L('boss', '...the deep... calls me home... they went up... the hill...', '...המעמקים... קוראים לי הביתה... הם עלו... לגבעה...'),
      L('saba-kobi', 'The dragon came back for a second round and left with a second bruise. Ha! And a clue: the hill above Barcelona.', 'הדרקון חזר לסיבוב שני ויצא עם חבורה שנייה. חה! ורמז: הגבעה מעל ברצלונה.'),
      L('saba-kobi', 'Seventh clue. Noa is waiting at the bunkers. Bring a little jacket, it is windy.', 'רמז שביעי. נועה מחכה בבונקרים. תביאו ז\'קטיקו, יש רוח.'),
    ] },
  },
  catalunya: {
    start: { hero: 'noa', lines: [
      L('noa', 'Bunkers del Carmel. The whole city, the sea, Montserrat on the horizon. And Adi\'s picnic blanket, folded, with two cups. They were just here.', 'בונקרס דל כרמל. כל העיר, הים, מונסראט באופק. והשמיכה של עדי, מקופלת, עם שתי כוסות. הם היו פה ממש עכשיו.'),
      L('noa', 'It is windy up here. Watch the edge, and watch the Sorceress\'s bolts. Dash through them.', 'יש פה רוח. תיזהרו מהקצה, ומהברקים של המכשפה. רצים דרכם.'),
    ] },
    afterWave: { 2: { hero: 'noa', lines: [
      L('noa', 'Nice. See down there? The Sagrada Família, the gym, the school. You have followed them across the whole map.', 'יפה. רואים שם למטה? הסגרדה פמיליה, המכון, בית הספר. עקבתם אחריהם על פני כל המפה.'),
      L('pitz', 'Mrrrp. Meow!', 'מררפ. מיאו!'),
      L('noa', 'Pitz smells someone familiar at the top of the hill. And someone not familiar at all. One more wave first.', 'פיץ מריח מישהו מוכר בראש הגבעה. ומישהו בכלל לא מוכר. קודם עוד גל אחד.'),
    ] } },
    boss: { hero: 'noa', join: true, lines: [
      L('noa', 'There it is. The not-familiar one.', 'הנה זה. הלא-מוכר.'),
      L('boss', 'I am back, and stronger. Petah Tikva was practice. Your parents are at the theatre. I am here.', 'אני חוזרת, וחזקה יותר. פתח תקווה הייתה אימון. ההורים שלכם בתיאטרון. אני כאן.'),
      L('noa', 'So was that. I am bringing the rolling pin. Let\'s finish her together, then the theatre.', 'גם זה היה אימון. אני מביאה את המערוך. בואו נסיים אותה ביחד, ואז התיאטרון.'),
    ] },
    end: { hero: 'noa', lines: [
      L('boss', '...zero...', '...אפס...'),
      L('noa', 'Twice. She lost to this family twice. And she was telling the truth: two theatre tickets, front row, in Abir\'s handwriting.', 'פעמיים. היא הפסידה למשפחה הזאת פעמיים. והיא אמרה את האמת: שני כרטיסים לתיאטרון, שורה ראשונה, בכתב היד של אביר.'),
      L('noa', 'Eighth clue. The Liceu, in Barcelona. Saba Kobi got us seats too. On the stage.', 'רמז שמיני. הליסאו, בברצלונה. סבא קובי השיג גם לנו מקומות. על הבמה.'),
    ] },
  },
  theater: {
    start: { hero: 'saba-kobi', ifPlayed: 'swap', lines: [
      L('saba-kobi', 'The Liceu theatre! Red curtains, footlights. Adi and Abir were in the front row, the usher saw them clapping.', 'תיאטרון ליסאו! וילונות אדומים, אורות במה. עדי ואביר ישבו בשורה הראשונה, הסדרן ראה אותם מוחאים כפיים.'),
      L('saba-kobi', 'Then the Void Demon came on. Places, everyone!', 'ואז עלה שד החלל. כולם למקומות!'),
      L('saba-kobi', 'Mind the props table, and when the lights go purple, that is a Sorceress winding up.', 'תיזהרו משולחן האביזרים, וכשהאורות נהיים סגולים, זו מכשפה שמתכוננת.'),
    ], swapLines: [
      L('saba-kobi', 'The Liceu theatre! Red curtains, footlights. Adi and Abir were in the front row, the usher saw them clapping.', 'תיאטרון ליסאו! וילונות אדומים, אורות במה. עדי ואביר ישבו בשורה הראשונה, הסדרן ראה אותם מוחאים כפיים.'),
      L('saba-kobi', 'Then the Void Demon came on. Places, everyone!', 'ואז עלה שד החלל. כולם למקומות!'),
      L('saba-kobi', 'Tonight I am the narrator, so {new} plays the lead. Do not worry, I am back on stage next level.', 'הערב אני הקריין, אז {new} בתפקיד הראשי. אל דאגה, אני חוזר לבמה בשלב הבא.'),
      L('saba-kobi', 'Mind the props table, and when the lights go purple, that is a Sorceress winding up.', 'תיזהרו משולחן האביזרים, וכשהאורות נהיים סגולים, זו מכשפה שמתכוננת.'),
    ] },
    afterWave: { 1: { hero: 'omri', join: true, lines: [
      L('omri', 'Psst. I found a mic in the props, and a program with a note: "Meet us at Savta\'s factory. Surprise!" Mind if I join the show?', 'פסט. מצאתי מיקרופון באביזרים, ותוכנייה עם פתק: "תפגשו אותנו במפעל של סבתא. הפתעה!" אכפת לכם אם אני מצטרף להצגה?'),
      L('pitz', 'Mrrp. (Pitz is in the orchestra pit. He is the drums.)', 'מררפ. (פיץ בבור התזמורת. הוא התופים.)'),
      L('omri', 'Act two. Let\'s give them a finale.', 'מערכה שנייה. בואו ניתן להם פינאלה.'),
    ] } },
    end: { hero: 'eviatar', lines: [
      L('boss', '...the glass... goes dark...', '...הזכוכית... מחשיכה...'),
      L('eviatar', 'The Glass Warden, shattered, on opening night. That was worth a bow.', 'שומר הזכוכית, מנופץ, בערב הבכורה. ממש שווה שנקוד לו קידה.'),
      L('eviatar', 'Last clue: Savta Orly\'s candy factory. Mom and Dad are waiting there with a surprise. Let\'s go find them!', 'הרמז האחרון: מפעל הממתקים של סבתא אורלי. אמא ואבא מחכים שם עם הפתעה. בואו נמצא אותם!'),
    ] },
  },
  'candy-factory': {
    start: { hero: 'savta-orly', lines: [
      L('savta-orly', 'Mamtakei Savta, my factory! The copper kettle, the taffy puller, the gumball tower.', 'ממתקי סבתא, המפעל שלי! קומקום הנחושת, מכונת הטופי, מגדל הגומי.'),
      L('savta-orly', 'And Adi and Abir in the control room, safe, waving. See?', 'ועדי ואביר בחדר הבקרה, בטוחים, מנפנפים. רואים?'),
      L('pitz', 'MEOW! MEOW! (Pitz saw them first. He wants it noted.)', 'מיאו! מיאו! (פיץ ראה אותם ראשון. שיירשם.)'),
      L('savta-orly', 'Between us and them: five waves, the biggest yet. Everything you learned, all at once. I am right behind you with the pot.', 'בינינו לבינם: חמישה גלים, הכי גדול עד עכשיו. כל מה שלמדתם, בבת אחת. אני ממש מאחוריכם עם הסיר.'),
    ] },
    afterWave: { 1: { hero: 'saba-kobi', join: true, lines: [
      L('saba-kobi', 'Room for one more? I closed the shesh-besh board. This is more important. Abir just gave me a thumbs up through the glass.', 'יש מקום לעוד אחד? סגרתי את לוח השש-בש. זה יותר חשוב. אביר בדיוק עשה לי לייק דרך הזכוכית.'),
      L('saba-kobi', 'Watch the conveyor belt. The wrapping machine is not on our side.', 'תיזהרו מהמסוע. מכונת האריזה לא בצד שלנו.'),
    ] } },
    end: { hero: 'shmuel', lines: [
      L('boss', '...the flame... goes out...', '...הלהבה... כבה...'),
      L('shmuel', 'The Flame Samurai, in a candy factory. He picked the wrong family. And the control room door is opening!', 'סמוראי הלהבה, במפעל ממתקים. הוא בחר את המשפחה הלא נכונה. ודלת חדר הבקרה נפתחת!'),
      L('shmuel', 'Rishon, Petah Tikva, Barcelona, Sant Cugat... all the way here. Every clue found. I am proud of you.', 'ראשון, פתח תקווה, ברצלונה, סאנט קוגאט... כל הדרך עד לכאן. כל רמז נמצא. אני גאה בכם.'),
      L('pitz', 'HSSS! (Pitz is staring at the back door.)', 'הססס! (פיץ בוהה בדלת האחורית.)'),
      L('shmuel', 'Wait. Adi says the presents are gone. All of them. And there are little brown footprints leading out the back door...', 'רגע. עדי אומרת שהמתנות נעלמו. כולן. ויש עקבות חומות קטנות שמובילות מהדלת האחורית...'),
      L('shmuel', 'One more level, then. The footprints go up into the hills. Pitz, lead the way.', 'אז עוד שלב אחד. העקבות עולות להרים. פיץ, תוביל.'),
    ] },
  },
  // Level 11 — Caga Tió's lair: the Catalan Christmas log took the presents and gives them back the
  // way tradition says he does. The finale: the family together, and Shmuel closes the game.
  'tio-lair': {
    start: { hero: 'omri', lines: [
      L('pitz', 'Mrrp. Footprints end here. Log-smell. Turrón-smell. Presents. Lots.', 'מררפ. העקבות נגמרות פה. ריח של בול עץ. ריח של טורון. מתנות. הרבה.'),
      L('omri', 'Caga Tió! The Christmas log from Catalunya. He took every present from Savta\'s factory and he is grinning about it.', 'קאגה טיו! בול העץ של חג המולד מקטלוניה. הוא לקח כל מתנה מהמפעל של סבתא והוא מחייך על זה.'),
      L('omri', 'You know how it works here: you hit the Tió and he... gives the presents back. From behind. Watch where you stand 😉', 'אתם יודעים איך זה עובד פה: מרביצים לטיו והוא... מחזיר את המתנות. מאחור. תיזהרו איפה אתם עומדים 😉'),
      L('omri', 'Four waves of his helpers first. Last level, everyone is here. Let\'s go!', 'קודם ארבעה גלים של העוזרים שלו. שלב אחרון, כולם פה. קדימה!'),
    ] },
    afterWave: { 2: { hero: 'savta-orly', join: true, lines: [
      L('savta-orly', 'Nobody takes presents from my factory. I brought the big pot. Move over, sweethearts, Savta is joining.', 'אף אחד לא לוקח מתנות מהמפעל שלי. הבאתי את הסיר הגדול. זוזו, מתוקים, סבתא מצטרפת.'),
      L('savta-orly', 'Two waves left. Then we knock the turrón out of that log.', 'נשארו שני גלים. ואז אנחנו מוציאים את הטורון מבול העץ הזה.'),
    ] } },
    boss: { hero: 'eviatar', join: true, lines: [
      L('eviatar', 'There he is. The log. He is bigger than in the pictures.', 'הנה הוא. בול העץ. הוא יותר גדול מאשר בתמונות.'),
      L('boss', 'Caga tió, caga torró! You want them? Come and knock them out of me!', 'קאגה טיו, קאגה טורו! רוצים אותן? בואו תוציאו אותן ממני!'),
      L('pitz', 'HSSSSS. (That is the loudest Pitz has ever been.)', 'הסססססס. (זה הכי חזק שפיץ אי פעם נשמע.)'),
      L('eviatar', 'Mom and Dad are right behind him. Everyone in: Omri, Pitz, Saba, Savta, Noa, me. Let\'s finish this!', 'אמא ואבא ממש מאחוריו. כולם בפנים: עומרי, פיץ, סבא, סבתא, נועה, אני. בואו נסיים את זה!'),
    ] },
    end: { hero: 'shmuel', lines: [
      L('boss', 'Oof... take them... take them all...', 'אוף... קחו אותן... קחו את כולן...'),
      L('shmuel', 'Every present back, every turrón accounted for.', 'כל מתנה חזרה, כל טורון נספר.'),
      L('shmuel', 'And there they are: Adi and Abir, out from behind the log, with gumballs for everyone.', 'והנה הם: עדי ואביר, יוצאים מאחורי בול העץ, עם גומיות לכולם.'),
      L('pitz', 'Purrrrrr. (Pitz is on Adi\'s shoulder. He is not coming down.)', 'פרררררר. (פיץ על הכתף של עדי. הוא לא יורד.)'),
      L('shmuel', 'They were fine the whole way, just like I said. Rishon, Petah Tikva, Barcelona, Sant Cugat... all the way here.', 'הם היו בסדר כל הדרך, בדיוק כמו שאמרתי. ראשון, פתח תקווה, ברצלונה, סאנט קוגאט... כל הדרך עד לכאן.'),
      L('shmuel', 'And that is the whole game. Nothing here was real, except the fun. Thank you for playing, and well done.', 'וזה כל המשחק. שום דבר פה לא היה אמיתי, חוץ מהכיף. תודה ששיחקתם, וכל הכבוד.'),
      L('shmuel', 'If you want a sequel with more characters, just call me 🤘🏼♥️', 'אם תרצו משחק המשך עם דמויות נוספות, פשוט תתקשרו אליי🤘🏼♥️'),
    ] },
  },
};
