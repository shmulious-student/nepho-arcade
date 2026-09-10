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
  { index: 1, id: 'rishon', boss: 'ferryman', hpMul: 1.0, waves: [W(30, ['punk', 4]), W(36, ['punk', 5], ['chainer', 1]), W(40, ['punk', 5], ['chainer', 2])], bonusWave: W(14, ['punk', 2]) },
  { index: 2, id: 'petah-tikva', boss: 'glass-warden', hpMul: 1.05, waves: [W(32, ['punk', 3], ['chainer', 2]), W(36, ['chainer', 3], ['punk', 3]), W(40, ['punk', 4], ['chainer', 3], ['brawler', 1])], bonusWave: W(14, ['punk', 2]) },
  { index: 3, id: 'barcelona', boss: 'kilnheart', hpMul: 1.1, waves: [W(32, ['chainer', 2], ['brawler', 2]), W(36, ['punk', 4], ['brawler', 2]), W(40, ['chainer', 3], ['brawler', 3])], bonusWave: W(14, ['punk', 2]) },
  { index: 4, id: 'sant-cugat', boss: 'monk-zero', hpMul: 1.15, waves: [W(32, ['brawler', 2], ['kicker', 2]), W(36, ['kicker', 4], ['punk', 2]), W(40, ['brawler', 2], ['kicker', 3], ['chainer', 2])], bonusWave: W(14, ['kicker', 2]) },
  { index: 5, id: 'hatikva-school', boss: 'market-king', hpMul: 1.2, waves: [W(32, ['punk-b', 3], ['kicker', 2]), W(36, ['knight', 2], ['punk-b', 3]), W(40, ['knight', 2], ['kicker', 3], ['punk-b', 3])], bonusWave: W(14, ['punk-b', 2]) },
  { index: 6, id: 'capoeira-gym', boss: 'railmaw', hpMul: 1.25, waves: [W(32, ['chainer', 3], ['knight', 1]), W(36, ['knight', 2], ['shield', 1], ['chainer', 2]), W(40, ['chainer', 3], ['knight', 2], ['shield', 1])], bonusWave: W(14, ['punk', 2]) },
  { index: 7, id: 'basketball-gym', boss: 'crown-runner', hpMul: 1.3, waves: [W(32, ['punk-b', 4], ['brawler-b', 1]), W(36, ['brawler-b', 2], ['knight', 2]), W(40, ['punk-b', 4], ['brawler-b', 2], ['knight', 2])], bonusWave: W(14, ['punk-b', 2]) },
  { index: 8, id: 'theater', boss: 'the-null', hpMul: 1.35, waves: [W(32, ['kicker', 3], ['chainer', 2]), W(36, ['shield', 1], ['kicker', 3], ['chainer', 1]), W(40, ['kicker', 3], ['chainer', 3], ['shield', 2])], bonusWave: W(14, ['kicker', 2]) },
  { index: 9, id: 'candy-factory', boss: 'vault-mother', hpMul: 1.4, waves: [W(32, ['brawler-b', 2], ['knight-b', 2]), W(36, ['knight-b', 2], ['shield', 2]), W(40, ['brawler-b', 3], ['knight-b', 2], ['shield', 2])], bonusWave: W(14, ['punk-b', 2]) },
  { index: 10, id: 'catalunya', boss: 'ultra-signal', hpMul: 1.45, waves: [W(30, ['punk-b', 3], ['kicker', 2], ['chainer', 1]), W(34, ['knight-b', 2], ['brawler-b', 2], ['shield', 1])], bonusWave: W(12, ['punk', 2]) },
];

export const ENTRY_TICKS = 120;
export const CLEAR_TICKS = 300;
export const BOSS_ENRAGE_TICKS = 75 * 60;
export const BOSS_HP_BASE = 380;
export const BOSS_HP_PER_LEVEL = 48;
export const LEVEL_TARGET_SECONDS = 180;
export const SEGMENT_X = [0, 280, 560]; // camera x per wave
