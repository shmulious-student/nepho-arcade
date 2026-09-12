// Maps a sim entity's (state, st) to an atlas frame key ("row/index"), given the character's catalog
// rows. Heroes reuse the sim's own HERO_MOVES table so animation exactly tracks hit frames; enemies
// and bosses use generic pacing constants since their catalog row *is* their state name already.
import { HERO_MOVES, total as moveTotal } from '../sim/frameData';
import { ENEMY_DEFS } from '../sim/enemyAi';

interface Pacing { row: string; ticks: number; loop: boolean; frames?: readonly number[] }

// Enemy rows come from the 12-row enemy grid: idle walk approach attack combo heavy special guard
// hurt knockback getup defeat. The knockback row is airborne (0-3) then landing flat (4-5), so the
// launched/knockdown states split it; getup has its own row.
const ENEMY_PACING: Record<string, Pacing> = {
  idle: { row: 'idle', ticks: 48, loop: true },
  walk: { row: 'walk', ticks: 32, loop: true },
  hurt: { row: 'hurt', ticks: 14, loop: false },
  stunned: { row: 'hurt', ticks: 24, loop: true, frames: [0, 1] },
  launched: { row: 'knockback', ticks: 24, loop: false, frames: [0, 1, 2, 3] },
  knockdown: { row: 'knockback', ticks: 36, loop: false, frames: [3, 4, 5, 5] },
  getup: { row: 'getup', ticks: 14, loop: false },
  defeat: { row: 'defeat', ticks: 70, loop: false },
};

const BOSS_PACING: Record<string, Pacing> = {
  idle: { row: 'idle', ticks: 60, loop: true },
  approach: { row: 'approach', ticks: 40, loop: true },
  attack: { row: 'attack', ticks: 50, loop: false },
  special: { row: 'special', ticks: 70, loop: false },
  hurt: { row: 'hurt', ticks: 20, loop: false },
  stunned: { row: 'hurt', ticks: 30, loop: true },
  defeat: { row: 'defeat', ticks: 150, loop: false },
};

function pick(frames: readonly number[], st: number, ticks: number, loop: boolean): number {
  const t = loop ? st % ticks : Math.min(st, ticks - 1);
  const idx = Math.min(frames.length - 1, Math.floor((t / ticks) * frames.length));
  return frames[idx];
}

// Move tables are authored against a canonical 6-frame row. A character whose source art has more (or
// fewer) frames per row keeps the same timing: frame f is remapped proportionally onto the row it
// actually has, so 9-frame rows play all 9 and nothing has to be re-authored per character.
const CANONICAL_FRAMES = 6;
function remap(index: number, framesPerRow: number): number {
  if (framesPerRow === CANONICAL_FRAMES) return index;
  return Math.round((index * (framesPerRow - 1)) / (CANONICAL_FRAMES - 1));
}
const range = (n: number): readonly number[] => Array.from({ length: n }, (_, i) => i);

/** How many frames a character's atlas has for `row`: a number for every row, or a per-row table
 * (a per-action override carries 9 frames while the rest of the grid has 6). */
export type FrameCount = number | { framesPerRow: number; frameCounts?: Record<string, number>; poses?: { knockback?: { floor: [number, number] }; getup?: { rise: [number, number] } } };
function framesIn(fc: FrameCount | undefined, row: string, fallback: number): number {
  if (fc === undefined) return fallback;
  if (typeof fc === 'number') return fc;
  return fc.frameCounts?.[row] ?? fc.framesPerRow;
}
/** The frames of an enemy's knockback row on which the figure lies on the floor, as measured by the
 * asset build (catalog `poses`), or the legacy 6-frame grid's convention (airborne 0-3, flat 4-5). */
function knockbackFloor(fc: FrameCount | undefined, framesPerRow: number): [number, number] {
  const measured = typeof fc === 'object' ? fc.poses?.knockback?.floor : undefined;
  if (measured) return measured;
  return [remap(3, framesPerRow), remap(5, framesPerRow)];
}

export function heroFrameKey(state: string, st: number, fc?: FrameCount): string {
  const m = HERO_MOVES[state];
  if (!m) return 'idle/0';
  const framesPerRow = framesIn(fc, m.row, CANONICAL_FRAMES);
  // idle/walk loop naturally; dash is now an open-ended sustained run (see fighter.ts) rather than a
  // fixed-duration burst, so it loops too instead of freezing on its last frame once st exceeds it.
  const loop = state === 'idle' || state === 'walk' || state === 'dash';
  // launched/ko hold their state open-endedly (recovery 999); play their frames at a real pace and
  // rest on the last one rather than stretching them across ~17s.
  const ticks = state === 'ko' ? 48 : state === 'launched' ? 20 : Math.max(1, moveTotal(m));
  // a move that plays its whole row plays every frame the row actually has; a move that plays a
  // subset keeps its subset, remapped proportionally
  const frames = m.frames.length === CANONICAL_FRAMES ? range(framesPerRow) : m.frames.map((f) => remap(f, framesPerRow));
  return `${m.row}/${pick(frames, st, ticks, loop)}`;
}

export function enemyFrameKey(arch: string, state: string, st: number, fc?: FrameCount): string {
  const def = ENEMY_DEFS[arch];
  if (def) {
    const a = state === 'attack' ? def.attack : state === 'heavy' ? def.heavy : state === 'special' ? def.special : null;
    if (a) return `${state}/${pick(range(framesIn(fc, state, CANONICAL_FRAMES)), st, Math.max(1, a.startup + a.active + a.recovery), false)}`;
  }
  const p = ENEMY_PACING[state] || ENEMY_PACING.idle;
  const framesPerRow = framesIn(fc, p.row, CANONICAL_FRAMES);
  let frames: readonly number[];
  if (state === 'launched' || state === 'knockdown') {
    // the fall plays up to the first floor frame; on the floor the figure holds the flat frames —
    // never the row's tail, which on a per-action set is the enemy already standing again
    const [a, b] = knockbackFloor(fc, framesPerRow);
    frames = state === 'launched' ? range(a + 1) : range(b - a + 1).map((i) => a + i);
  } else if (state === 'getup' && typeof fc === 'object' && fc.poses?.getup) {
    // an older getup row dips before it rises: play only the rising half, lowest frame to last
    const [a, b] = fc.poses.getup.rise;
    frames = range(b - a + 1).map((i) => a + i);
  } else if (state === 'hurt' && framesPerRow > CANONICAL_FRAMES) {
    // a 9-frame hurt row is flinch (0-2), heavy reel (3-5), airborne crumple (6-8): a grounded hit
    // shows the first two thirds; the crumple belongs to a launch, which has its own row
    frames = range(6);
  } else {
    frames = p.frames ? p.frames.map((f) => remap(f, framesPerRow)) : range(framesPerRow);
  }
  return `${p.row}/${pick(frames, st, p.ticks, p.loop)}`;
}

export function bossFrameKey(state: string, st: number, fc?: FrameCount): string {
  const p = BOSS_PACING[state] || BOSS_PACING.idle;
  return `${p.row}/${pick(range(framesIn(fc, p.row, 8)), st, p.ticks, p.loop)}`;
}

export function frameKeyFor(kind: string, arch: string, state: string, st: number, fc?: FrameCount): string {
  if (kind === 'hero') return heroFrameKey(state, st, fc);
  if (kind === 'boss' || kind === 'echo') return bossFrameKey(state, st, fc);
  return enemyFrameKey(arch, state, st, fc);
}
