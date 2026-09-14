// Core simulation types. No Phaser imports allowed in src/sim.

export type Kind = 'hero' | 'enemy' | 'boss' | 'echo' | 'projectile' | 'hazard' | 'pickup';

export type HeroId = 'eviatar' | 'omri' | 'shmuel' | 'savta-orly' | 'saba-kobi' | 'noa';

export const TICK_RATE = 60;
export const VIEW_W = 960;
export const VIEW_H = 540;
// Level scroll: the camera advances SEGMENT_STEP per wave (see levels.ts levelWidth) and a level may
// have up to MAX_WAVES waves, so LEVEL_W is the widest any level can be. Every backdrop is painted
// for that width.
export const SEGMENT_STEP = 200;
export const MAX_WAVES = 5;
export const LEVEL_W = VIEW_W + SEGMENT_STEP * (MAX_WAVES - 1); // 1760
export const LANE_H = 120; // depth band, world y in [0, LANE_H]
export const FLOOR_TOP = 380; // screen y of world y = 0
export const LANE_TOL = 16; // |dy| tolerance for hits
// The renderer zooms the world in around the combat band; only the middle VISIBLE_W of VIEW_W is on
// screen. The sim keeps players inside that band so they can never walk out of view.
export const VIEW_ZOOM = 1.7;
export const VISIBLE_W = Math.round(VIEW_W / VIEW_ZOOM); // 565
export const VISIBLE_X0 = Math.round((VIEW_W - VISIBLE_W) / 2); // 198
// The zoom pivots low on the combat band (GameScene), so vertically the canvas shows world y from
// VISIBLE_Y0 for VISIBLE_H — the top of the 540-tall world is never on screen.
export const VIEW_PIVOT_X = VIEW_W / 2;
export const VIEW_PIVOT_Y = FLOOR_TOP + 90; // 470
export const VISIBLE_Y0 = Math.round(VIEW_PIVOT_Y * (1 - 1 / VIEW_ZOOM)); // 194
export const VISIBLE_H = Math.round(VIEW_H / VIEW_ZOOM); // 318
// The rectangle a level's backdrop plate fills, in world space: exactly the band the view can ever
// show across a MAX_WAVES level plus a small bleed — so at least 90% of the art's height is on screen
// at any moment (VISIBLE_H / ART_BAND.h) and, over a full-length level, ~97% of its width. Plates are
// delivered at 4:1 (2800×700, docs/locations); legacy plates (941×334) keep their own rect (catalog).
export const ART_BAND = { x: VISIBLE_X0 - 18, y: VISIBLE_Y0 - 16, w: 1400, h: 350 };
// How far inside the visible band a character's centre must stay so its whole sprite is on screen:
// heroes are the widest and get the most room; enemies and bosses a little less, so a cornered
// player still has someone to hit on either side.
export const HERO_EDGE = 46;
export const ENEMY_EDGE = 16;
export const BOSS_EDGE = 36;

export type HeroState =
  | 'idle' | 'walk' | 'light1' | 'light2' | 'light3' | 'heavy' | 'dash' | 'dashAttack' | 'special'
  | 'jump' | 'jumpAttack'
  | 'hurt' | 'hurtHeavy' | 'stunned' | 'launched' | 'knockdown' | 'getup' | 'ko';

export type EnemyState = 'idle' | 'walk' | 'attack' | 'heavy' | 'special' | 'hurt' | 'stunned' | 'launched' | 'knockdown' | 'getup' | 'defeat';
export type BossState = 'idle' | 'approach' | 'attack' | 'special' | 'hurt' | 'stunned' | 'defeat';

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
  hitStreak: number; // hits taken in the current streak window (stun trigger)
  streakT: number; // ticks left before the streak forgets
  stunCd: number; // ticks before this entity can be stunned again
  regenLock: number; // heroes: ticks since the last damage before regen may resume
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
  friendly: boolean; // on the heroes' side: heroes, friends, and what they throw
}

export interface SimEvent {
  type: 'hit' | 'ko' | 'special' | 'telegraph' | 'spawn' | 'bossPhase' | 'levelPhase' | 'dash' | 'launch' | 'heal' | 'block' | 'shake' | 'summon' | 'paint' | 'note' | 'pickup' | 'stun';
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
  maxCombo: [number, number];
  /** The dialog scene on stage, if any: which script page of the level (see sim/dialogs.ts) and how
   * far it is typed; the renderer draws the page from the same script. */
  dialog?: DialogView | null;
  /** An opening scene handed a player another hero for this level: [the pick, the stand-in]. */
  swap?: [string, string] | null;
}

export interface DialogView { key: string; page: number; tick: number; stage: 0 | 1 | 2 }

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
  phase: number; // hazards: 0 telegraphing, 1 live; heroes/enemies unused
  combo: number;
  hitstop: number;
}
