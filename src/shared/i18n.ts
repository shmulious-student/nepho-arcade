// The game's UI text in English and Hebrew, chosen by the TEXT toggle (shared/lang.ts). Everything
// the player reads outside the dialog script goes through t(): the lobby, the HUD, the pause menu,
// the title card, the results screen and the touch buttons. Hebrew strings never get Phaser's
// letter-spacing (it draws glyph by glyph and reverses right-to-left text) — see ls().
import { getLang, type Lang } from './lang';

const STR = {
  pickHero: ['PICK YOUR HERO', 'בחרו גיבור'],
  carouselHint: ['tap a card · swipe or ◀ ▶ for more', 'הקישו על קלף · החליקו או ◀ ▶ לעוד'],
  friend: ['FRIEND', 'חבר'],
  helpsAs: ['HELPS AS', 'עוזר בתור'],
  assist: ['ASSIST', 'סיוע'],
  sidekick: ['SIDEKICK', 'שותף'],
  off: ['OFF', 'כבוי'],
  on: ['ON', 'פועל'],
  startAtLevel: ['START AT LEVEL', 'התחלה בשלב'],
  players: ['PLAYERS', 'שחקנים'],
  lanCoop: ['LAN CO-OP', 'רשת'],
  twoPKeyboard: ['2P KEYBOARD', 'מקלדת ל-2'],
  controls: ['CONTROLS', 'שליטה'],
  player2: ['PLAYER 2', 'שחקן 2'],
  hostGame: ['HOST GAME', 'פתיחת חדר'],
  joinGame: ['JOIN GAME', 'הצטרפות'],
  start: ['START', 'התחלה'],
  difficulty: ['DIFFICULTY', 'קושי'],
  easy: ['EASY', 'קל'], normal: ['NORMAL', 'רגיל'], hard: ['HARD', 'קשה'], expert: ['EXPERT', 'מומחה'],
  startingHost: ['starting host…', 'פותחים חדר…'],
  roomOpen: ['Room {code} — have your co-op partner open:', 'חדר {code} — השותף פותח את הקישור:'],
  peerJoined: ['Player 2 connected! Press START.', 'שחקן 2 מחובר! לחצו התחלה.'],
  joiningRoom: ['joining room {code} — pick your hero and press START', 'מצטרפים לחדר {code} — בחרו גיבור ולחצו התחלה'],
  error: ['error', 'שגיאה'],
  wave: ['WAVE', 'גל'],
  boss: ['BOSS', 'בוס'],
  moveOn: ['MOVE ON', 'קדימה'],
  go: ['GO ►', 'קדימה ►'],
  bossDown: ['BOSS DOWN!', 'הבוס נפל!'],
  stageClear: ['STAGE CLEAR', 'השלב הושלם'],
  youFoundThem: ['YOU FOUND THEM', 'מצאתם אותם'],
  levelClear: ['LEVEL {n} CLEAR', 'שלב {n} הושלם'],
  tally: ['TIME {time} · BEST COMBO {combo} · BONUS +{bonus}', 'זמן {time} · קומבו שיא {combo} · בונוס +{bonus}'],
  hitCombo: ['{n} HIT COMBO', 'קומבו {n}'],
  special: ['SPECIAL', 'ספיישל'],
  enraged: ['ENRAGED', 'זועם'],
  tapToCall: ['TAP HERE · CALL {name}', 'הקישו כאן · קראו ל{name}'],
  paused: ['PAUSED', 'הפסקה'],
  resume: ['RESUME', 'המשך'],
  restartLevel: ['RESTART LEVEL', 'התחל שלב מחדש'],
  backToLobby: ['BACK TO LOBBY', 'חזרה ללובי'],
  sound: ['SOUND', 'צליל'],
  helpTouch: ['stick: move · hold DSH + stick sideways: run · ATK / HVY / JMP · SPC when lit · hold BLK · tap your card to call a friend', 'סטיק: תנועה · ריצה + סטיק הצידה: ריצה · מכה / כבד / קפיצה · ספיישל כשדולק · הגנה בלחיצה ארוכה · הקשה על הקלף קוראת לחבר'],
  helpKeys: ['WASD move · J light · K heavy · SPACE jump · hold L + direction: run · I special · U block · H friend · ESC pause', 'WASD תנועה · J מכה · K כבד · SPACE קפיצה · L + כיוון: ריצה · I ספיישל · U הגנה · H חבר · ESC הפסקה'],
  level: ['LEVEL', 'שלב'],
  getReady: ['GET READY', 'מוכנים?'],
  continueQ: ['CONTINUE?', 'להמשיך?'],
  pressAny: ['press any button', 'לחצו על כפתור'],
  waitingHost: ['waiting for the host…', 'מחכים למארח…'],
  waitingP2: ['waiting for player 2…', 'מחכים לשחקן 2…'],
  netLost: ['back to the lobby…', 'חוזרים ללובי…'],
  hintSolo: ['MOVE  WASD / ARROWS   LIGHT  J   HEAVY  K   JUMP  SPACE   DASH  hold L + dir   SPECIAL  I   BLOCK  U   FRIEND  H', 'תנועה WASD / חצים · מכה J · כבד K · קפיצה SPACE · ריצה L + כיוון · ספיישל I · הגנה U · חבר H'],
  hintP1: ['P1  move WASD · light J · heavy K · jump SPACE · dash L+dir · special I · block U · friend H', 'שחקן 1: תנועה WASD · מכה J · כבד K · קפיצה SPACE · ריצה L+כיוון · ספיישל I · הגנה U · חבר H'],
  hintP2: ['P2  move ARROWS · light NUM1 · heavy NUM2 · jump NUM6 · dash NUM3+dir · special NUM0 · block NUM4 · friend NUM5', 'שחקן 2: תנועה חצים · מכה NUM1 · כבד NUM2 · קפיצה NUM6 · ריצה NUM3+כיוון · ספיישל NUM0 · הגנה NUM4 · חבר NUM5'],
  campaignDone: ['YOU FOUND THEM!', 'מצאתם את אמא ואבא!'],
  levelClearTitle: ['LEVEL CLEAR', 'השלב הושלם'],
  gameOver: ['GAME OVER', 'המשחק נגמר'],
  score: ['SCORE', 'ניקוד'],
  best: ['BEST', 'שיא'],
  newBest: ['NEW BEST', 'שיא חדש'],
  epilogue: ['Every street, every clue, all the way to the lair —\nyou found them together, and nobody was ever in danger.', 'כל רחוב, כל רמז, עד המאורה —\nמצאתם אותם ביחד, ואף אחד אף פעם לא היה בסכנה.'],
  lanEnded: ['LAN game ended — host or join a new room from the lobby', 'משחק הרשת נגמר — פתחו או הצטרפו לחדר חדש מהלובי'],
  nextLevel: ['NEXT LEVEL: {n}', 'השלב הבא: {n}'],
  retryLevel: ['RETRY LEVEL', 'נסו שוב'],
  btnHeavy: ['HVY', 'כבד'], btnLight: ['ATK', 'מכה'], btnJump: ['JMP', 'קפיצה'], btnSpecial: ['SPC', 'ספיישל'], btnBlock: ['BLK', 'הגנה'], btnDash: ['DSH', 'ריצה'],
} as const;

export type StrKey = keyof typeof STR;

/** The UI string for the current language, with `{name}` placeholders filled from `vars`. */
export function t(key: StrKey, vars: Record<string, string | number> = {}): string {
  const lang: Lang = getLang();
  let s: string = STR[key][lang === 'he' ? 1 : 0];
  for (const [k, v] of Object.entries(vars)) s = s.replace(`{${k}}`, String(v));
  return s;
}

export const isHebrew = (): boolean => getLang() === 'he';
/** The UI typeface: the arcade monospace for English, a proportional Hebrew-capable face for Hebrew
 * (a monospace cell per Hebrew glyph reads as spaced-out letters). */
export const uiFont = (): string => (isHebrew() ? 'Arial, Helvetica, sans-serif' : 'monospace');
/** Hebrew runs 20% larger: a proportional face at the arcade monospace's sizes reads small. */
export const uiSize = (px: number): string => `${Math.round(px * (isHebrew() ? 1.2 : 1))}px`;
const BIAS: Record<string, string> = {
  eviatar: 'כוח · התזת צבע', omri: 'מהירות קפוארה · ביט סוני', shmuel: 'קשוח · זינוק חתול',
  'savta-orly': 'יציבה · סופת מרק', 'saba-kobi': 'מוצק · הלם שש-בש', noa: 'זריזה · צמיחת פוטוס',
};
/** A hero's one-line trait under the card, translated. */
export const heroBias = (id: string, en: string): string => (isHebrew() ? BIAS[id] || en : en);
/** Letter-spacing for a decorative label: none in Hebrew (Phaser would reverse the glyphs). */
export const ls = (n: number): number => (isHebrew() ? 0 : n);
/** Hero names read fine in both; the difficulty names are translated. */
export const difficultyName = (id: 'easy' | 'normal' | 'hard' | 'expert'): string => t(id);
