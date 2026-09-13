import { VIEW_W, SEGMENT_STEP, MAX_WAVES } from './types';

export interface SpawnDef { arch: string; n: number }
export interface WaveDef { spawns: SpawnDef[]; budget: number /* seconds */ }
export interface LevelDef {
  index: number;
  id: string;
  boss: string;
  waves: WaveDef[];
  bonusWave: WaveDef; // inserted when players are far ahead of schedule
  hpMul: number; // enemy hp multiplier
}

const W = (budget: number, ...spawns: [string, number][]): WaveDef => ({ budget, spawns: spawns.map(([arch, n]) => ({ arch, n })) });

export const LEVELS: LevelDef[] = [
  // Waves are sized for a kid at the controls: a couple of enemies at a time, never a mob, with the
  // roster widening as the levels go on rather than the headcount.
  { index: 1, id: 'rishon', boss: 'ferryman', hpMul: 0.85, waves: [W(30, ['punk', 2]), W(36, ['punk', 3]), W(40, ['punk', 3], ['chainer', 1])], bonusWave: W(14, ['punk', 1]) },
  { index: 2, id: 'petah-tikva', boss: 'glass-warden', hpMul: 0.9, waves: [W(32, ['punk', 2], ['chainer', 1]), W(36, ['chainer', 2], ['punk', 2]), W(40, ['punk', 3], ['chainer', 2])], bonusWave: W(14, ['punk', 1]) },
  { index: 3, id: 'barcelona', boss: 'kilnheart', hpMul: 0.95, waves: [W(32, ['chainer', 1], ['brawler', 1]), W(36, ['punk', 3], ['brawler', 1]), W(40, ['chainer', 2], ['brawler', 2])], bonusWave: W(14, ['punk', 1]) },
  { index: 4, id: 'sant-cugat', boss: 'monk-zero', hpMul: 1.0, waves: [W(32, ['brawler', 1], ['kicker', 2]), W(36, ['kicker', 3], ['punk', 1]), W(40, ['brawler', 1], ['kicker', 2], ['chainer', 1])], bonusWave: W(14, ['kicker', 1]) },
  // The four per-action enemy sets (bio-brute, gold-sorceress, void-demon, rainbow-oracle) join from
  // level 5 on, taking the place of one older archetype per wave so the headcount stays the same.
  { index: 5, id: 'hatikva-school', boss: 'market-king', hpMul: 1.05, waves: [W(32, ['punk-b', 2], ['gold-sorceress', 1]), W(36, ['knight', 1], ['punk-b', 2]), W(40, ['knight', 1], ['kicker', 1], ['gold-sorceress', 1], ['punk-b', 2])], bonusWave: W(14, ['punk-b', 1]) },
  { index: 6, id: 'capoeira-gym', boss: 'railmaw', hpMul: 1.1, waves: [W(32, ['chainer', 1], ['bio-brute', 1], ['knight', 1]), W(36, ['knight', 1], ['shield', 1], ['chainer', 1]), W(40, ['chainer', 1], ['bio-brute', 1], ['knight', 1], ['shield', 1])], bonusWave: W(14, ['punk', 1]) },
  { index: 7, id: 'basketball-gym', boss: 'crown-runner', hpMul: 1.15, waves: [W(32, ['punk-b', 2], ['rainbow-oracle', 1], ['brawler-b', 1]), W(36, ['brawler-b', 1], ['rainbow-oracle', 1]), W(40, ['punk-b', 2], ['rainbow-oracle', 1], ['brawler-b', 1], ['knight', 1])], bonusWave: W(14, ['punk-b', 1]) },
  { index: 8, id: 'theater', boss: 'the-null', hpMul: 1.2, waves: [W(32, ['kicker', 1], ['void-demon', 1], ['chainer', 1]), W(36, ['shield', 1], ['kicker', 1], ['gold-sorceress', 1]), W(40, ['kicker', 1], ['void-demon', 1], ['chainer', 1], ['gold-sorceress', 1], ['shield', 1])], bonusWave: W(14, ['kicker', 1]) },
  { index: 9, id: 'candy-factory', boss: 'vault-mother', hpMul: 1.25, waves: [W(32, ['bio-brute', 1], ['knight-b', 1]), W(36, ['knight-b', 1], ['rainbow-oracle', 1]), W(40, ['brawler-b', 1], ['bio-brute', 1], ['knight-b', 1], ['void-demon', 1])], bonusWave: W(14, ['punk-b', 1]) },
  { index: 10, id: 'catalunya', boss: 'ultra-signal', hpMul: 1.3, waves: [W(30, ['punk-b', 1], ['gold-sorceress', 1], ['rainbow-oracle', 1], ['chainer', 1]), W(34, ['knight-b', 1], ['void-demon', 1], ['bio-brute', 1])], bonusWave: W(12, ['punk', 1]) },
];

// The campaign the sim actually runs. It starts as LEVELS and is replaced by applyRoster() when a
// roster (public/game/roster.json, edited on /backoffice.html) re-assigns bosses or enemy pools;
// read levels through levelDef() so the roster is honoured everywhere.
export const ACTIVE: { levels: LevelDef[] } = { levels: LEVELS };
export const levelDef = (index: number): LevelDef => ACTIVE.levels[index - 1];

export const ENTRY_TICKS = 150;
export const CLEAR_TICKS = 210; // the boss's fall and a beat to breathe before the tally
export const BOSS_ENRAGE_TICKS = 75 * 60;
export const BOSS_HP_BASE = 260;
export const BOSS_HP_PER_LEVEL = 34;
export const LEVEL_TARGET_SECONDS = 180;
/** How wide a level is: the camera scrolls SEGMENT_STEP per wave and the boss is fought where the
 * last wave was, so a 3-wave level is 1360 wide and a MAX_WAVES level fills the whole plate. */
export const levelWidth = (level: LevelDef): number => VIEW_W + SEGMENT_STEP * (Math.min(MAX_WAVES, level.waves.length) - 1);
/** Camera x for wave `index` (0-based), never past the level's end. */
export const segmentX = (level: LevelDef, index: number): number => Math.min(SEGMENT_STEP * index, levelWidth(level) - VIEW_W);
