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
  { index: 5, id: 'hatikva-school', boss: 'market-king', hpMul: 1.05, waves: [W(32, ['punk-b', 2], ['kicker', 1]), W(36, ['knight', 1], ['punk-b', 2]), W(40, ['knight', 1], ['kicker', 2], ['punk-b', 2])], bonusWave: W(14, ['punk-b', 1]) },
  { index: 6, id: 'capoeira-gym', boss: 'railmaw', hpMul: 1.1, waves: [W(32, ['chainer', 2], ['knight', 1]), W(36, ['knight', 1], ['shield', 1], ['chainer', 1]), W(40, ['chainer', 2], ['knight', 1], ['shield', 1])], bonusWave: W(14, ['punk', 1]) },
  { index: 7, id: 'basketball-gym', boss: 'crown-runner', hpMul: 1.15, waves: [W(32, ['punk-b', 3], ['brawler-b', 1]), W(36, ['brawler-b', 1], ['knight', 1]), W(40, ['punk-b', 3], ['brawler-b', 1], ['knight', 1])], bonusWave: W(14, ['punk-b', 1]) },
  { index: 8, id: 'theater', boss: 'the-null', hpMul: 1.2, waves: [W(32, ['kicker', 2], ['chainer', 1]), W(36, ['shield', 1], ['kicker', 2]), W(40, ['kicker', 2], ['chainer', 2], ['shield', 1])], bonusWave: W(14, ['kicker', 1]) },
  { index: 9, id: 'candy-factory', boss: 'vault-mother', hpMul: 1.25, waves: [W(32, ['brawler-b', 1], ['knight-b', 1]), W(36, ['knight-b', 1], ['shield', 1]), W(40, ['brawler-b', 2], ['knight-b', 1], ['shield', 1])], bonusWave: W(14, ['punk-b', 1]) },
  { index: 10, id: 'catalunya', boss: 'ultra-signal', hpMul: 1.3, waves: [W(30, ['punk-b', 2], ['kicker', 1], ['chainer', 1]), W(34, ['knight-b', 1], ['brawler-b', 1], ['shield', 1])], bonusWave: W(12, ['punk', 1]) },
];

export const ENTRY_TICKS = 150;
export const CLEAR_TICKS = 300;
export const BOSS_ENRAGE_TICKS = 75 * 60;
export const BOSS_HP_BASE = 260;
export const BOSS_HP_PER_LEVEL = 34;
export const LEVEL_TARGET_SECONDS = 180;
export const SEGMENT_X = [0, 280, 560]; // camera x per wave
