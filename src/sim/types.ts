// Core simulation types. No Phaser imports allowed in src/sim.

export type Kind = 'hero' | 'enemy' | 'boss' | 'echo' | 'projectile' | 'hazard';

export type HeroId = 'eviatar' | 'omri' | 'nepho' | 'bruiser' | 'riva' | 'byte';

export const TICK_RATE = 60;
export const LEVEL_W = 1520; // world width of one level (backdrop scaled to 540 tall)
export const VIEW_W = 960;
export const VIEW_H = 540;
export const LANE_H = 120; // depth band, world y in [0, LANE_H]
export const FLOOR_TOP = 380; // screen y of world y = 0
export const LANE_TOL = 16; // |dy| tolerance for hits
// The renderer zooms the world in around the combat band; only the middle VISIBLE_W of VIEW_W is on
// screen. The sim keeps players inside that band so they can never walk out of view.
export const VIEW_ZOOM = 1.7;
export const VISIBLE_W = Math.round(VIEW_W / VIEW_ZOOM); // 565
export const VISIBLE_X0 = Math.round((VIEW_W - VISIBLE_W) / 2); // 198

export type HeroState =
  | 'idle' | 'walk' | 'light1' | 'light2' | 'light3' | 'heavy' | 'dash' | 'dashAttack' | 'special'
  | 'jump' | 'jumpAttack'
  | 'hurt' | 'hurtHeavy' | 'launched' | 'knockdown' | 'getup' | 'ko';

export type EnemyState = 'idle' | 'walk' | 'attack' | 'heavy' | 'special' | 'hurt' | 'launched' | 'knockdown' | 'getup' | 'defeat';
export type BossState = 'idle' | 'approach' | 'attack' | 'special' | 'hurt' | 'defeat';

export interface Hitbox {
  dx: number; // offset in facing direction from entity x
  dy: number;
  w: number;
  h: number; // vertical extent in z (0 = ground level)
  dmg: number;
  hitstun: number;
  kb: number; // knockback velocity x
  launch?: number; // upward z velocity
  knockdown?: boolean;
  radius?: number; // if set: circular AoE around entity (ignores dx/w)
  pierce?: boolean; // projectiles that continue after hitting
}

export interface Entity {
  id: number;
  kind: Kind;
  arch: string; // hero id, enemy id, boss id, projectile type
  slot: number; // hero slot 0/1 or -1
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  facing: 1 | -1;
  hp: number; maxHp: number;
  meter: number;
  state: string;
  st: number; // ticks in current state
  hitstop: number;
  invuln: number;
  armor: number; // ticks of armor
  flash: number;
  attackId: number; // increments per attack start; targets remember last attackId that hit them
  hitBy: Record<number, number>; // attackerId -> attackId
  combo: number; // hero combo counter
  comboTimer: number;
  comboStep: number; // hero: which light in the chain
  cooldown: number; // enemy/boss attack cooldown
  ai: number; // ai sub-state / pattern index
  aiT: number; // ai timer
  target: number; // target entity id
  dead: boolean;
  removeAt: number; // tick to remove (0 = never)
  scale: number;
  tint: number; // 0 = none, else hue index for echoes
  owner: number; // projectile owner id
  ttl: number; // projectile lifetime
  dmgMul: number;
  slow: number; // ticks of slow
  pattern: number; // boss: current pattern index (-1 none)
  pphase: number; // boss: 0 telegraph, 1 active, 2 recover
  pt: number; // boss pattern tick
  pdata: number; // boss pattern scratch
  phase: number; // boss hp phase
  hits: number; // hits landed in current attack
  guard: boolean; // knight blocks frontal hits
}

export interface SimEvent {
  type: 'hit' | 'ko' | 'special' | 'telegraph' | 'spawn' | 'bossPhase' | 'levelPhase' | 'dash' | 'launch' | 'heal' | 'block' | 'shake' | 'summon' | 'paint' | 'note';
  x: number; y: number; z?: number;
  a?: number; // param a (e.g. damage, radius)
  b?: number; // param b (e.g. ticks)
  shape?: 'circle' | 'line' | 'stripe' | 'ring';
  colour?: number;
  id?: number;
  heavy?: boolean;
}

export type LevelPhase = 'entry' | 'wave' | 'go' | 'boss' | 'clear' | 'gameover' | 'victory';

export interface Snapshot {
  tick: number;
  level: number; // 1..10
  phase: LevelPhase;
  wave: number;
  cameraX: number;
  timer: number; // seconds elapsed in level
  bossHp: number; // 0..1
  bossMaxHp: number;
  bossId: string;
  score: [number, number];
  credits: number;
  entities: EntityView[];
  events: SimEvent[];
  go: boolean; // show GO arrow
  enrage: boolean;
  assist: [number, number]; // per player: friend readiness 0..1 (assist cooldown / sidekick up)
  lives: [number, number]; // continues left per player
}

export interface EntityView {
  id: number;
  kind: Kind;
  arch: string;
  slot: number;
  x: number; y: number; z: number;
  facing: 1 | -1;
  state: string;
  st: number;
  hp: number; // 0..1
  meter: number; // 0..1
  flash: number;
  invuln: number;
  scale: number;
  tint: number;
  combo: number;
  hitstop: number;
}
