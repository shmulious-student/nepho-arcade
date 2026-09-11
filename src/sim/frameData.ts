import type { Hitbox, HeroId } from './types';

export interface MoveDef {
  row: string; // animation row
  frames: number[]; // frame indices spread over the move duration
  startup: number;
  active: number;
  recovery: number;
  hit?: Hitbox;
  cancelFrom?: number; // tick from which the next chain move can be buffered
  cancelTo?: string; // next state in the chain
  iframes?: [number, number];
  armor?: [number, number];
  speed?: number; // forward movement per tick during the move
  specialCancel?: boolean;
}

export const total = (m: MoveDef) => m.startup + m.active + m.recovery;

export const HERO_MOVES: Record<string, MoveDef> = {
  // Rows are the 12-row hero grid (public/assets/generated/hero-*-grid-{1,2}.png): idle walk dash
  // light1 light2 light3 | heavy special block hurt knockdown defeat. Each light hit owns its own row.
  // Light chain is deliberately snappy and cancels the instant active frames begin (cancelFrom ==
  // startup), so tapping LIGHT on rhythm strings hits together smoothly instead of waiting out recovery.
  // Light hits reach a little behind the hero as well as in front (the box starts 30px behind the
  // body), so an enemy pressing from the back is caught by the combo without a deliberate turn.
  light1: { row: 'light1', frames: [0, 1, 2, 3, 4, 5], startup: 3, active: 4, recovery: 6, hit: { dx: 20, dy: 0, w: 100, h: 90, dmg: 12, hitstun: 14, kb: 1.6 }, cancelFrom: 3, cancelTo: 'light2', specialCancel: true },
  light2: { row: 'light2', frames: [0, 1, 2, 3, 4, 5], startup: 4, active: 4, recovery: 7, hit: { dx: 22, dy: 0, w: 104, h: 90, dmg: 13, hitstun: 16, kb: 1.8 }, cancelFrom: 4, cancelTo: 'light3', specialCancel: true },
  // Combo finisher: a 360 breaker — radius-based so it lands on attackers from both sides at once and
  // (like a special) bypasses enemy guard, rewarding a completed chain when surrounded.
  light3: { row: 'light3', frames: [0, 1, 2, 3, 4, 5], startup: 6, active: 6, recovery: 12, hit: { dx: 0, dy: 0, w: 0, h: 100, dmg: 22, hitstun: 22, kb: 5, knockdown: true, radius: 92 }, specialCancel: true },
  heavy: { row: 'heavy', frames: [0, 1, 2, 3, 4, 5], startup: 8, active: 5, recovery: 16, hit: { dx: 30, dy: 0, w: 116, h: 110, dmg: 24, hitstun: 26, kb: 2.5, launch: 7 }, specialCancel: true },
  // Dash row: 0 crouch-launch, 1-4 speed-blur run (looped while the dash is held), 5 lunge stop.
  dash: { row: 'dash', frames: [1, 2, 3, 4], startup: 0, active: 14, recovery: 4, iframes: [1, 9], speed: 7.5, cancelFrom: 4, cancelTo: 'dashAttack' },
  dashAttack: { row: 'dash', frames: [4, 5, 5], startup: 6, active: 5, recovery: 14, hit: { dx: 40, dy: 0, w: 70, h: 90, dmg: 17, hitstun: 24, kb: 6, knockdown: true }, speed: 3 },
  special: { row: 'special', frames: [0, 1, 2, 3, 4, 5], startup: 8, active: 12, recovery: 20, iframes: [0, 24], hit: { dx: 0, dy: 0, w: 0, h: 120, dmg: 50, hitstun: 30, kb: 7, launch: 8, radius: 150 } },
  // Jump: crouch-launch frame, then airborne on the dash row's run frames; a light/heavy in the air
  // is a flying kick (light2 row) that lands on anyone under its arc.
  jump: { row: 'dash', frames: [0, 1, 2, 2, 3], startup: 0, active: 0, recovery: 999 },
  jumpAttack: { row: 'light2', frames: [2, 3, 3, 4], startup: 4, active: 10, recovery: 999, hit: { dx: 24, dy: 0, w: 90, h: 70, dmg: 16, hitstun: 22, kb: 4, knockdown: true } },
  block: { row: 'block', frames: [0], startup: 0, active: 0, recovery: 1 },
  // Hurt row: 0-1 flinch, 2-3 heavy reel, 4-5 crumple (used while airborne after a launch).
  hurt: { row: 'hurt', frames: [0, 1], startup: 0, active: 0, recovery: 14 },
  hurtHeavy: { row: 'hurt', frames: [2, 3], startup: 0, active: 0, recovery: 22 },
  launched: { row: 'hurt', frames: [4, 5], startup: 0, active: 0, recovery: 999 },
  // Knockdown row is a fall-then-rise: 0 stagger, 1 kneel, 2-3 floor, 4 kneel, 5 back on feet.
  knockdown: { row: 'knockdown', frames: [1, 2, 3, 3], startup: 0, active: 0, recovery: 32 },
  getup: { row: 'knockdown', frames: [3, 4, 5, 5], startup: 0, active: 0, recovery: 16 },
  ko: { row: 'defeat', frames: [0, 1, 2, 3, 4, 5], startup: 0, active: 0, recovery: 999 },
  idle: { row: 'idle', frames: [0, 1, 2, 3, 4, 5], startup: 0, active: 0, recovery: 48 },
  walk: { row: 'walk', frames: [0, 1, 2, 3, 4, 5], startup: 0, active: 0, recovery: 36 },
};

export interface HeroDef {
  id: HeroId;
  name: string;
  gender: 'male' | 'female';
  bias: string;
  hp: number;
  speed: number;
  dmgMul: number;
  special: 'burst' | 'slam' | 'line' | 'volley' | 'splash' | 'wave';
  colour: number;
  /** second identity colour, used by effects that alternate (paint splats, music notes) */
  colour2?: number;
  cardKey: string;
}

export const HEROES: Record<HeroId, HeroDef> = {
  // Eviatar (11): tall and strong, green-and-blue basketball kit, fights with magic paint markers. Hits hard for his
  // speed; his special throws a wide fan of paint that floors everything in front of him.
  eviatar: { id: 'eviatar', name: 'EVIATAR', gender: 'male', bias: 'Power · paint splash', hp: 160, speed: 2.4, dmgMul: 1.2, special: 'splash', colour: 0x3ddc84, colour2: 0x37aaff, cardKey: 'card-eviatar' },
  // Omri (9): lean capoeira fighter in red and white, with a microphone. Fastest hero; his special is a three-beat
  // sonic shockwave that launches everyone around him.
  omri: { id: 'omri', name: 'OMRI', gender: 'male', bias: 'Capoeira speed · sonic beat', hp: 115, speed: 3.1, dmgMul: 0.9, special: 'wave', colour: 0xff4f72, colour2: 0xf3f4e8, cardKey: 'card-omri' },
  nepho: { id: 'nepho', name: 'NEPHO', gender: 'male', bias: 'Balanced · radial burst', hp: 130, speed: 2.6, dmgMul: 1, special: 'burst', colour: 0x75f5dc, cardKey: 'card-nepho' },
  bruiser: { id: 'bruiser', name: 'BRUISER', gender: 'male', bias: 'Heavy hitter · armored slam', hp: 165, speed: 2.2, dmgMul: 1.3, special: 'slam', colour: 0xff9357, cardKey: 'card-bruiser' },
  riva: { id: 'riva', name: 'RIVA', gender: 'female', bias: 'Combo mobility · line dash', hp: 120, speed: 3.0, dmgMul: 0.9, special: 'line', colour: 0xa4ee42, cardKey: 'card-riva' },
  byte: { id: 'byte', name: 'BYTE', gender: 'female', bias: 'Ranged · four-shot volley', hp: 120, speed: 2.7, dmgMul: 0.95, special: 'volley', colour: 0xff76c8, cardKey: 'card-byte' },
};

// Eviatar and Omri lead the roster; the other four are their friends — playable too, and the pool an
// assist / sidekick is chosen from.
export const HERO_IDS: HeroId[] = ['eviatar', 'omri', 'nepho', 'bruiser', 'riva', 'byte'];

export const METER_MAX = 100;
export const METER_PER_HIT = 8;
export const METER_PER_TAKEN = 3;
export const COMBO_WINDOW = 45;
export const HITSTOP_LIGHT = 3;
export const HITSTOP_HEAVY = 5;
export const GRAVITY = 0.5;
export const JUMP_VZ = 9.5; // ~85px apex, ~38 ticks in the air
