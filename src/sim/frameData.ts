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
  light1: { row: 'attack', frames: [0, 1, 2, 3], startup: 4, active: 3, recovery: 8, hit: { dx: 44, dy: 0, w: 52, h: 90, dmg: 9, hitstun: 14, kb: 1.6 }, cancelFrom: 7, cancelTo: 'light2', specialCancel: true },
  light2: { row: 'attack', frames: [1, 3, 4], startup: 5, active: 3, recovery: 10, hit: { dx: 46, dy: 0, w: 54, h: 90, dmg: 10, hitstun: 16, kb: 1.8 }, cancelFrom: 8, cancelTo: 'light3', specialCancel: true },
  light3: { row: 'attack', frames: [0, 4, 5, 5], startup: 7, active: 4, recovery: 16, hit: { dx: 52, dy: 0, w: 64, h: 90, dmg: 17, hitstun: 22, kb: 5, knockdown: true }, specialCancel: true },
  heavy: { row: 'heavy', frames: [0, 1, 2, 3, 4, 5], startup: 10, active: 4, recovery: 20, hit: { dx: 46, dy: 0, w: 66, h: 110, dmg: 19, hitstun: 26, kb: 2.5, launch: 7 }, specialCancel: true },
  dash: { row: 'dash', frames: [0, 1, 2, 2], startup: 0, active: 14, recovery: 4, iframes: [1, 9], speed: 7.5, cancelFrom: 4, cancelTo: 'dashAttack' },
  dashAttack: { row: 'dash', frames: [3, 4, 5], startup: 6, active: 5, recovery: 14, hit: { dx: 40, dy: 0, w: 70, h: 90, dmg: 17, hitstun: 24, kb: 6, knockdown: true }, speed: 3 },
  special: { row: 'special', frames: [0, 1, 2, 3, 4, 5], startup: 8, active: 12, recovery: 20, iframes: [0, 24], hit: { dx: 0, dy: 0, w: 0, h: 120, dmg: 50, hitstun: 30, kb: 7, launch: 8, radius: 150 } },
  hurt: { row: 'hurt', frames: [0, 1], startup: 0, active: 0, recovery: 14 },
  hurtHeavy: { row: 'hurt', frames: [2, 3], startup: 0, active: 0, recovery: 22 },
  launched: { row: 'hurt', frames: [4, 5], startup: 0, active: 0, recovery: 999 },
  knockdown: { row: 'defeat', frames: [1, 2, 3, 3], startup: 0, active: 0, recovery: 32 },
  getup: { row: 'defeat', frames: [3, 2, 1, 0], startup: 0, active: 0, recovery: 16 },
  ko: { row: 'defeat', frames: [3, 4, 5, 5], startup: 0, active: 0, recovery: 999 },
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
  special: 'burst' | 'slam' | 'line' | 'volley';
  colour: number;
  cardKey: string;
}

export const HEROES: Record<HeroId, HeroDef> = {
  nepho: { id: 'nepho', name: 'NEPHO', gender: 'male', bias: 'Balanced · radial burst', hp: 110, speed: 2.6, dmgMul: 1, special: 'burst', colour: 0x75f5dc, cardKey: 'card-nepho' },
  bruiser: { id: 'bruiser', name: 'BRUISER', gender: 'male', bias: 'Heavy hitter · armored slam', hp: 140, speed: 2.2, dmgMul: 1.3, special: 'slam', colour: 0xff9357, cardKey: 'card-bruiser' },
  riva: { id: 'riva', name: 'RIVA', gender: 'female', bias: 'Combo mobility · line dash', hp: 100, speed: 3.0, dmgMul: 0.9, special: 'line', colour: 0xa4ee42, cardKey: 'card-riva' },
  byte: { id: 'byte', name: 'BYTE', gender: 'female', bias: 'Ranged · four-shot volley', hp: 100, speed: 2.7, dmgMul: 0.95, special: 'volley', colour: 0xff76c8, cardKey: 'card-byte' },
};

export const HERO_IDS: HeroId[] = ['nepho', 'bruiser', 'riva', 'byte'];

export const METER_MAX = 100;
export const METER_PER_HIT = 8;
export const METER_PER_TAKEN = 3;
export const COMBO_WINDOW = 45;
export const HITSTOP_LIGHT = 3;
export const HITSTOP_HEAVY = 5;
export const GRAVITY = 0.5;
