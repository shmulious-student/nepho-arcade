// The dialog scripts: who walks in and what they say on every level, in English and Hebrew. Pure
// data plus the few helpers the sim and the renderer share so both resolve a script identically —
// the sim decides timing and who is on stage, the renderer only draws the page the snapshot names.
//
// Keyed by level id (not campaign position) so the campaign can be reordered without touching this
// file. The story: Eviatar and Omri are following clues to Adi (mom) and Abir (dad), who are always
// safe — every level ends with the next clue, and Shmuel, the tutor, says from the first screen that
// none of this is real and nobody has to play. Each level has an opening (`start`), an optional dialog after a given wave (`afterWave`,
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
  'abyss-dragon': 'דרקון התהום', 'flame-samurai': 'סמוראי הלהבה', 'prism-queen': 'מלכת הפריזמה', 'storm-colossus': 'ענק הסערה',
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
      L('shmuel', 'Hi. I am Shmuel, and before anything else: this is a game. Nothing here is real. Not the punks, not the bosses, not the bruises.', 'היי. אני שמואל, ולפני הכול: זה משחק. שום דבר פה לא אמיתי. לא הפאנקים, לא הבוסים, לא המכות.'),
      L('shmuel', 'You do not have to like it, and you do not have to play it. Stop whenever you want. Nothing bad happens.', 'לא חייבים לאהוב אותו, ולא חייבים לשחק בו. אפשר להפסיק מתי שרוצים. שום דבר רע לא קורה.'),
      L('shmuel', 'The story: Eviatar and Omri are looking for Adi and Abir, their mom and dad. They are safe.', 'הסיפור: אביתר ועומרי מחפשים את עדי ואביר, אמא ואבא. הם בטוחים.'),
      L('shmuel', 'They are just somewhere along this road, and we will find them, one clue at a time.', 'הם פשוט איפשהו לאורך הדרך, ואנחנו נמצא אותם, רמז אחרי רמז.'),
      L('shmuel', 'This is HaSarig Street, our street. Light is J, heavy is K, three lights in a row spin all the way round. Go on, clear the road.', 'זה רחוב השריג, הרחוב שלנו. מכה קלה ב-J, כבדה ב-K, שלוש קלות ברצף מסתובבות סביב. קדימה, לפנות את הדרך.'),
      L('player', 'On it!', 'על זה!'),
    ] },
    boss: { hero: 'shmuel', join: true, lines: [
      L('shmuel', 'Hold on. The ground is shaking. That is not a punk, that is the first boss. Remember: just a game.', 'רגע. הרצפה רועדת. זה לא פאנק, זה הבוס הראשון. תזכרו: רק משחק.'),
      L('boss', 'Looking for your mother and father? The Ferryman knows every road. Pay the toll and I might tell you.', 'מחפשים את אמא ואבא? המעבורן מכיר כל דרך. שלמו את האגרה ואולי אספר.'),
      L('shmuel', 'We do not pay on our street. I am staying for this one. Let\'s go!', 'אצלנו ברחוב לא משלמים. אני נשאר לקרב הזה. קדימה!'),
    ] },
    end: { hero: 'noa', lines: [
      L('boss', 'Fine... the clinic... Refael Eitan Street... she was there...', 'טוב... קופת החולים... רחוב רפאל איתן... היא הייתה שם...'),
      L('pitz', 'Meow. Meow-meow.', 'מיאו. מיאו-מיאו.'),
      L('noa', 'Pitz says the Ferryman dropped a note. A clinic receipt with Adi\'s name, and a smiley on it. She is fine.', 'פיץ אומר שהמעבורן הפיל פתק. קבלה מהקופה עם השם של עדי, וסמיילי עליה. היא בסדר.'),
      L('noa', 'First clue! Next stop, Refael Eitan Street. Saba Kobi is waiting there with the newspaper.', 'רמז ראשון! התחנה הבאה, רחוב רפאל איתן. סבא קובי מחכה שם עם העיתון.'),
    ] },
  },
  'petah-tikva': {
    start: { hero: 'saba-kobi', lines: [
      L('saba-kobi', 'Refael Eitan Street! Adi was at the clinic this morning. Perfectly healthy, the nurse said. She just went on ahead.', 'רחוב רפאל איתן! עדי הייתה בקופת החולים הבוקר. בריאה לגמרי, אמרה האחות. היא פשוט המשיכה הלאה.'),
      L('saba-kobi', 'And Abir? Abir called from somewhere with drums. We will get to that. First, these punks, and a Gold Sorceress who throws things.', 'ואביר? אביר התקשר ממקום עם תופים. נגיע לזה. קודם, הפאנקים האלה, ומכשפת זהב שזורקת דברים.'),
      L('saba-kobi', 'Dash out of her way: hold L and push sideways. Ha!', 'תתחמקו ממנה בריצה: מחזיקים L ודוחפים הצידה. חה!'),
    ] },
    boss: { hero: 'savta-orly', lines: [
      L('savta-orly', 'Wait, wait, I brought soup. Nobody fights a boss on an empty stomach. And I have news: Adi left me a message. She is fine, she is with Abir.', 'רגע, רגע, הבאתי מרק. אף אחד לא נלחם בבוס על בטן ריקה. ויש לי חדשות: עדי השאירה לי הודעה. היא בסדר, היא עם אביר.'),
      L('boss', 'Monk Zero needs no soup. Only silence. Your parents passed my street. I let them. You, I will not.', 'מונק זירו לא צריך מרק. רק שקט. ההורים שלכם עברו ברחוב שלי. להם נתתי. לכם לא.'),
      L('savta-orly', 'Silence? In this family? Good luck with that. Watch his orbs, sweetheart.', 'שקט? במשפחה הזאת? בהצלחה עם זה. תיזהרו מהכדורים שלו, מותק.'),
    ] },
    end: { hero: 'noa', lines: [
      L('boss', '...so loud... the gym... they went to the gym with the drums...', '...כל כך רועש... המכון... הם הלכו למכון עם התופים...'),
      L('noa', 'Drums! That is Omri\'s capoeira gym. Abir forgot his gym bag there, he always does.', 'תופים! זה מכון הקפוארה של עומרי. אביר שכח שם את תיק הספורט שלו, הוא תמיד שוכח.'),
      L('noa', 'Second clue. Off to Academia Ginga. Eviatar wants to show you something on the way.', 'רמז שני. יוצאים לאקדמיה ז\'ינגה. אביתר רוצה להראות לכם משהו בדרך.'),
    ] },
  },
  'capoeira-gym': {
    start: { hero: 'eviatar', ifPlayed: 'swap', lines: [
      L('eviatar', 'Omri\'s gym, Academia Ginga. Look: Abir\'s bag on the bench, and a note. "Went to buy pastries with Adi. Back soon. Love you."', 'המכון של עומרי, אקדמיה ז\'ינגה. תראו: התיק של אביר על הספסל, ופתק. "הלכנו לקנות מאפים עם עדי. חוזרים. אוהבים."'),
      L('eviatar', 'See? Safe. We just keep following. Bio-Brutes are slow but hit like a truck. Jump kicks floor them: SPACE, then J in the air.', 'רואים? בטוחים. פשוט ממשיכים לעקוב. ביו-ברוטים איטיים אבל מכים כמו משאית. בעיטה מקפיצה מפילה אותם: SPACE ואז J באוויר.'),
    ], swapLines: [
      L('eviatar', 'Omri\'s gym, Academia Ginga. Look: Abir\'s bag on the bench, and a note. "Went to buy pastries with Adi. Back soon. Love you."', 'המכון של עומרי, אקדמיה ז\'ינגה. תראו: התיק של אביר על הספסל, ופתק. "הלכנו לקנות מאפים עם עדי. חוזרים. אוהבים."'),
      L('eviatar', 'I am reading the clues on this level, so {new} takes the floor. You get me back next level.', 'אני קורא את הרמזים בשלב הזה, אז {new} על הרצפה. בשלב הבא אני חוזר אליכם.'),
      L('eviatar', 'Bio-Brutes are slow but hit like a truck. Jump kicks floor them: SPACE, then J in the air.', 'ביו-ברוטים איטיים אבל מכים כמו משאית. בעיטה מקפיצה מפילה אותם: SPACE ואז J באוויר.'),
    ] },
    boss: { hero: 'eviatar', lines: [
      L('eviatar', 'Feel that heat? Something is coming through the back wall.', 'מרגישים את החום? משהו עובר דרך הקיר האחורי.'),
      L('boss', 'Kilnheart. I turn gyms into ovens. Your parents bought their pastries and left. Lucky them.', 'קילנהארט. אני הופך מכונים לתנורים. ההורים שלכם קנו מאפים והלכו. מזל שלהם.'),
      L('eviatar', 'Pastries. Got it. When he charges, jump. When the floor glows, move.', 'מאפים. הבנתי. כשהוא מסתער, קופצים. כשהרצפה זוהרת, זזים.'),
    ] },
    end: { hero: 'omri', lines: [
      L('boss', '...cooling... down...', '...מתקרר...'),
      L('omri', 'MY GYM! You saved my gym! Axé! And look what fell out of his pocket: a pastry-shop receipt from Sant Cugat.', 'המכון שלי! הצלתם את המכון שלי! אשה! ותראו מה נפל לו מהכיס: קבלה מקונדיטוריה בסנט קוגט.'),
      L('omri', 'Third clue! Sant Cugat. The big square, the monastery, and the best xuixos in the world.', 'רמז שלישי! סנט קוגט. הכיכר הגדולה, המנזר, והשוישו הכי טוב בעולם.'),
    ] },
  },
  'sant-cugat': {
    start: { hero: 'eviatar', lines: [
      L('eviatar', 'Plaça d\'Octavià. The waiter says Adi and Abir sat right here an hour ago, laughing, with two coffees. They are fine.', 'פלאסה ד\'אוקטביה. המלצר אומר שעדי ואביר ישבו ממש כאן לפני שעה, צוחקים, עם שני קפה. הם בסדר.'),
      L('eviatar', 'Then Rainbow Oracles filled the square. They dodge a lot. Do not chase. Wait for them to come to you, then land the third light.', 'ואז אורקלי קשת מילאו את הכיכר. הם מתחמקים המון. לא לרדוף. חכו שיבואו אליכם, ואז המכה השלישית.'),
    ] },
    boss: { hero: 'omri', join: true, lines: [
      L('omri', 'Hey! Sorry I am late, I was doing cartwheels down Carrer Major. I asked everyone: they went towards Barcelona!', 'היי! סליחה שאיחרתי, עשיתי גלגלונים לאורך קאראר מז\'ור. שאלתי את כולם: הם הלכו לכיוון ברצלונה!'),
      L('boss', 'The Market King buys everything. Even this square. Even the way to Barcelona.', 'מלך השוק קונה הכול. גם את הכיכר הזאת. גם את הדרך לברצלונה.'),
      L('omri', 'Not for sale. I am in. Two on one, let\'s dance!', 'לא למכירה. אני בפנים. שניים על אחד, בואו נרקוד!'),
    ] },
    end: { hero: 'savta-orly', lines: [
      L('boss', '...my coins... my beautiful coins...', '...המטבעות שלי... המטבעות היפים שלי...'),
      L('savta-orly', 'Bravo! Sit, eat something, you earned a xuixo. And Adi texted me a photo: the two of them in front of the Sagrada Família, waving.', 'בראבו! שבו, תאכלו משהו, הרווחתם שוישו. ועדי שלחה לי תמונה: שניהם מול הסגרדה פמיליה, מנפנפים.'),
      L('savta-orly', 'Fourth clue, and it is a good one. Barcelona, here we come.', 'רמז רביעי, וטוב. ברצלונה, אנחנו באים.'),
    ] },
  },
  barcelona: {
    start: { hero: 'shmuel', lines: [
      L('shmuel', 'Carrer de Mallorca, and there she is: the Sagrada Família. Adi and Abir were here an hour ago. They are fine, they are just ahead of us.', 'קארר דה מיורקה, והנה היא: הסגרדה פמיליה. עדי ואביר היו פה לפני שעה. הם בסדר, הם פשוט לפנינו.'),
      L('shmuel', 'Halfway through. Quick reminder: it is a game. If it stops being fun, stop. Nobody minds.', 'חצי דרך. תזכורת קטנה: זה משחק. אם זה מפסיק להיות כיף, מפסיקים. אף אחד לא כועס.'),
      L('shmuel', 'If you are in: four waves this time. Pace yourselves, block with U when it gets crowded, grab the hearts.', 'אם אתם בפנים: ארבעה גלים הפעם. תחלקו כוחות, חוסמים עם U כשנהיה צפוף, אוספים לבבות.'),
    ] },
    end: { hero: 'saba-kobi', lines: [
      L('boss', '...my crystals... shattered... they had tickets... a basketball game...', '...הגבישים שלי... מנופצים... היו להם כרטיסים... משחק כדורסל...'),
      L('saba-kobi', 'The Prism Queen, in front of Gaudí\'s church! And two tickets in her crown: Eviatar\'s hall, tonight.', 'מלכת הפריזמה, מול הכנסייה של גאודי! ושני כרטיסים בכתר שלה: האולם של אביתר, הערב.'),
      L('saba-kobi', 'Fifth clue. Abir never misses a game. To the basketball hall!', 'רמז חמישי. אביר לא מפספס משחק. לאולם הכדורסל!'),
    ] },
  },
  'basketball-gym': {
    start: { hero: 'omri', ifPlayed: 'swap', lines: [
      L('omri', 'Eviatar\'s hall! Abir\'s scarf is on the bleachers, still warm from cheering. They were here, they are fine, they moved on.', 'האולם של אביתר! הצעיף של אביר על הטריבונות, עוד חם מהעידוד. הם היו פה, הם בסדר, הם המשיכו.'),
      L('omri', 'Then the Void Demons showed up under the hoop. That is a foul, right? They are the heavy ones. Get behind them and hit the back.', 'ואז שדי החלל הופיעו מתחת לסל. זו עבירה, נכון? הם הכבדים. מאחוריהם ולהכות בגב.'),
    ], swapLines: [
      L('omri', 'Eviatar\'s hall! Abir\'s scarf is on the bleachers, still warm from cheering. They were here, they are fine, they moved on.', 'האולם של אביתר! הצעיף של אביר על הטריבונות, עוד חם מהעידוד. הם היו פה, הם בסדר, הם המשיכו.'),
      L('omri', 'I have the mic this game, so {new} gets the ball. I sub back in next level.', 'המיקרופון אצלי במשחק הזה, אז {new} מקבל את הכדור. אני חוזר לחמישייה בשלב הבא.'),
      L('omri', 'Void Demons are the heavy ones. Do not stand in front of them. Get behind and hit the back.', 'שדי החלל הם הכבדים. לא לעמוד מולם. מאחוריהם ולהכות בגב.'),
    ] },
    boss: { hero: 'omri', lines: [
      L('omri', 'Uh. The scoreboard just melted.', 'אה. לוח התוצאות בדיוק נמס.'),
      L('boss', 'From the deep I rise. The Abyss Dragon takes the court. Your parents left at half time. Wise.', 'מהמעמקים אני עולה. דרקון התהום לוקח את המגרש. ההורים שלכם יצאו במחצית. חכמים.'),
      L('omri', 'Then we take it back. Keep moving. He cannot hit what he cannot catch!', 'אז אנחנו לוקחים אותו בחזרה. תמשיכו לזוז. הוא לא יכול להכות מה שהוא לא תופס!'),
    ] },
    end: { hero: 'eviatar', lines: [
      L('boss', '...back... to the deep...', '...חזרה... למעמקים...'),
      L('eviatar', 'That is my court. And that is Adi\'s handwriting on the scoreboard: "Picking up your drawings at school. Love, Mom."', 'זה המגרש שלי. וזה כתב היד של עדי על לוח התוצאות: "אוספים את הציורים שלכם בבית הספר. אוהבת, אמא."'),
      L('eviatar', 'Sixth clue. Hatikva School. Omri knows the way: through the yard, past the big tree.', 'רמז שישי. בית הספר התקווה. עומרי מכיר את הדרך: דרך החצר, ליד העץ הגדול.'),
    ] },
  },
  'hatikva-school': {
    start: { hero: 'omri', lines: [
      L('omri', 'Col·legi Hatikva! The court, the big tree, the blue mosaic wall. Adi took our drawings from the classroom, the teacher saw her. Fine and smiling.', 'קולז\' התקווה! המגרש, העץ הגדול, קיר הפסיפס הכחול. עדי לקחה את הציורים שלנו מהכיתה, המורה ראתה אותה. בסדר ומחייכת.'),
      L('omri', 'Four waves, then something big. When the meter is full press I: the special clears the whole yard.', 'ארבעה גלים, ואז משהו גדול. כשהמד מלא לוחצים I: הספיישל מנקה את כל החצר.'),
    ] },
    afterWave: { 2: { hero: 'eviatar', join: true, lines: [
      L('eviatar', 'Two waves down. Recess is over. I found Abir\'s coffee cup by the olive tree, still warm. I am joining you for the rest of this one.', 'שני גלים ירדו. ההפסקה נגמרה. מצאתי את כוס הקפה של אביר ליד עץ הזית, עוד חמה. אני מצטרף אליכם לשאר השלב.'),
      L('eviatar', 'Stick together. The Bio-Brutes come from both sides now.', 'תישארו ביחד. הביו-ברוטים מגיעים עכשיו משני הצדדים.'),
    ] } },
    end: { hero: 'saba-kobi', lines: [
      L('boss', '...the deep... calls me home... they went up... the hill...', '...המעמקים... קוראים לי הביתה... הם עלו... לגבעה...'),
      L('saba-kobi', 'The dragon came back for a second round and left with a second bruise. Ha! And a clue: the hill above Barcelona.', 'הדרקון חזר לסיבוב שני ויצא עם חבורה שנייה. חה! ורמז: הגבעה מעל ברצלונה.'),
      L('saba-kobi', 'Seventh clue. Noa is waiting at the bunkers. Bring a jacket, it is windy.', 'רמז שביעי. נועה מחכה בבונקרים. תביאו ז\'קט, יש רוח.'),
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
      L('boss', 'Monk Zero returns. Petah Tikva was practice. Your parents are at the theatre. I am here.', 'מונק זירו חוזר. פתח תקווה הייתה אימון. ההורים שלכם בתיאטרון. אני כאן.'),
      L('noa', 'So was that. I am bringing the rolling pin. Let\'s finish him together, then the theatre.', 'גם זה היה. אני מביאה את המערוך. בואו נסיים אותו ביחד, ואז התיאטרון.'),
    ] },
    end: { hero: 'noa', lines: [
      L('boss', '...zero...', '...אפס...'),
      L('noa', 'Twice. He lost to this family twice. And he was telling the truth: two theatre tickets, front row, in Abir\'s handwriting.', 'פעמיים. הוא הפסיד למשפחה הזאת פעמיים. והוא אמר את האמת: שני כרטיסים לתיאטרון, שורה ראשונה, בכתב היד של אביר.'),
      L('noa', 'Eighth clue. Two levels left. Saba Kobi got us seats too. On the stage.', 'רמז שמיני. נשארו שני שלבים. סבא קובי השיג גם לנו מקומות. על הבמה.'),
    ] },
  },
  theater: {
    start: { hero: 'saba-kobi', ifPlayed: 'swap', lines: [
      L('saba-kobi', 'Teatron HaMoshava! Red curtains, footlights. Adi and Abir were in the front row, the usher saw them clapping.', 'תיאטרון המושבה! וילונות אדומים, אורות במה. עדי ואביר ישבו בשורה הראשונה, הסדרן ראה אותם מוחאים כפיים.'),
      L('saba-kobi', 'Then the Void Demon came on. Places, everyone!', 'ואז עלה שד החלל. כולם למקומות!'),
      L('saba-kobi', 'Mind the props table, and when the lights go magenta, that is a Sorceress winding up.', 'תיזהרו משולחן האביזרים, וכשהאורות נהיים מג\'נטה, זו מכשפה שמתכוננת.'),
    ], swapLines: [
      L('saba-kobi', 'Teatron HaMoshava! Red curtains, footlights. Adi and Abir were in the front row, the usher saw them clapping.', 'תיאטרון המושבה! וילונות אדומים, אורות במה. עדי ואביר ישבו בשורה הראשונה, הסדרן ראה אותם מוחאים כפיים.'),
      L('saba-kobi', 'Then the Void Demon came on. Places, everyone!', 'ואז עלה שד החלל. כולם למקומות!'),
      L('saba-kobi', 'Tonight I am the narrator, so {new} plays the lead. Do not worry, I am back on stage next level.', 'הערב אני הקריין, אז {new} בתפקיד הראשי. אל דאגה, אני חוזר לבמה בשלב הבא.'),
      L('saba-kobi', 'Mind the props table, and when the lights go magenta, that is a Sorceress winding up.', 'תיזהרו משולחן האביזרים, וכשהאורות נהיים מג\'נטה, זו מכשפה שמתכוננת.'),
    ] },
    afterWave: { 1: { hero: 'omri', join: true, lines: [
      L('omri', 'Psst. I found a mic in the props, and a program with a note: "Meet us at Savta\'s factory. Surprise!" Mind if I join the show?', 'פסט. מצאתי מיקרופון באביזרים, ותוכנייה עם פתק: "תפגשו אותנו במפעל של סבתא. הפתעה!" אכפת לכם אם אני מצטרף להצגה?'),
      L('omri', 'Act two. Let\'s give them a finale.', 'מערכה שנייה. בואו ניתן להם פינאלה.'),
    ] } },
    end: { hero: 'eviatar', lines: [
      L('boss', '...the glass... goes dark...', '...הזכוכית... מחשיכה...'),
      L('eviatar', 'The Glass Warden, shattered, on opening night. Take a bow.', 'שומר הזכוכית, מנופץ, בערב הבכורה. קידה.'),
      L('eviatar', 'Last clue, last level. Savta Orly\'s candy factory. Adi and Abir are waiting there with a surprise. Let\'s go find them.', 'רמז אחרון, שלב אחרון. מפעל הממתקים של סבתא אורלי. עדי ואביר מחכים שם עם הפתעה. בואו נמצא אותם.'),
    ] },
  },
  'candy-factory': {
    start: { hero: 'savta-orly', lines: [
      L('savta-orly', 'Mamtakei Savta, my factory! The copper kettle, the taffy puller, the gumball tower. Adi and Abir are in the control room, safe, waving. See?', 'ממתקי סבתא, המפעל שלי! קומקום הנחושת, מכונת הטופי, מגדל הגומי. עדי ואביר בחדר הבקרה, בטוחים, מנפנפים. רואים?'),
      L('savta-orly', 'Between us and them: five waves, the biggest yet. Everything you learned, all at once. I am right behind you with the pot.', 'בינינו לבינם: חמישה גלים, הכי גדול עד עכשיו. כל מה שלמדתם, בבת אחת. אני ממש מאחוריכם עם הסיר.'),
    ] },
    afterWave: { 1: { hero: 'saba-kobi', join: true, lines: [
      L('saba-kobi', 'Room for one more? I closed the shesh-besh board. This is more important. Abir just gave me a thumbs up through the glass.', 'יש מקום לעוד אחד? סגרתי את לוח השש-בש. זה יותר חשוב. אביר בדיוק עשה לי לייק דרך הזכוכית.'),
      L('saba-kobi', 'Watch the conveyor belt. The wrapping machine is not on our side.', 'תיזהרו מהמסוע. מכונת האריזה לא בצד שלנו.'),
    ] } },
    end: { hero: 'shmuel', lines: [
      L('boss', '...the flame... goes out...', '...הלהבה... כבה...'),
      L('shmuel', 'The Flame Samurai, in a candy factory. He picked the wrong family.', 'סמוראי הלהבה, במפעל ממתקים. הוא בחר את המשפחה הלא נכונה.'),
      L('shmuel', 'And there they are: Adi and Abir, out of the control room, with gumballs for everyone.', 'והנה הם: עדי ואביר, יוצאים מחדר הבקרה, עם גומיות לכולם.'),
      L('pitz', 'Purrrr.', 'פררר.'),
      L('shmuel', 'They were safe the whole way, just like I said. Rishon, Petah Tikva, Barcelona, all the way here. Every clue found.', 'הם היו בטוחים כל הדרך, בדיוק כמו שאמרתי. ראשון, פתח תקווה, ברצלונה, כל הדרך עד לכאן. כל רמז נמצא.'),
      L('shmuel', 'Wait. Adi says the presents are gone. All of them. And there are little brown footprints leading out the back door...', 'רגע. עדי אומרת שהמתנות נעלמו. כולן. ויש עקבות חומות קטנות שמובילות מהדלת האחורית...'),
    ] },
  },
  // Level 11 — Caga Tió's lair: the Catalan Christmas log took the presents and will only give
  // them back the way tradition says he does. Placeholder script until the owner writes the finale.
  'tio-lair': {
    start: { hero: 'eviatar', lines: [
      L('eviatar', 'Caga Tió! The Christmas log from Sant Cugat. He took every present from the factory and he is grinning about it.', 'קאגה טיו! בול העץ של חג המולד מסנט קוגט. הוא לקח כל מתנה מהמפעל והוא מחייך על זה.'),
      L('eviatar', 'You know how it works in Catalunya: you hit the Tió and he... gives the presents back. From behind. Watch where you stand.', 'אתם יודעים איך זה עובד בקטלוניה: מרביצים לטיו והוא... מחזיר את המתנות. מאחור. תיזהרו איפה אתם עומדים.'),
    ] },
    boss: { hero: 'eviatar', lines: [
      L('boss', 'Caga tió, caga torró! You want them? Come and knock them out of me!', 'קאגה טיו, קאגה טורו! רוצים אותן? בואו תוציאו אותן ממני!'),
    ] },
    end: { hero: 'shmuel', lines: [
      L('boss', 'Oof... take them... take them all...', 'אוף... קחו אותן... קחו את כולן...'),
      L('shmuel', 'Every present back, every turrón accounted for. Adi and Abir are already opening theirs.', 'כל מתנה חזרה, כל טורון נספר. עדי ואביר כבר פותחים את שלהם.'),
      L('pitz', 'Purrrr.', 'פררר.'),
      L('shmuel', 'And that is the whole game. Nothing here was real, except the fun. Thank you for playing, and well done.', 'וזה כל המשחק. שום דבר פה לא היה אמיתי, חוץ מהכיף. תודה ששיחקתם, וכל הכבוד.'),
    ] },
  },
};
