// Maps a sim entity's (state, st) to an atlas frame key ("row/index"), given the character's catalog
// rows. Heroes reuse the sim's own HERO_MOVES table so animation exactly tracks hit frames; enemies
// and bosses use generic pacing constants since their catalog row *is* their state name already.
import { HERO_MOVES, total as moveTotal } from '../sim/frameData';
import { ENEMY_DEFS } from '../sim/enemyAi';

interface Pacing { row: string; ticks: number; loop: boolean }

const ENEMY_PACING: Record<string, Pacing> = {
  idle: { row: 'idle', ticks: 48, loop: true },
  walk: { row: 'walk', ticks: 32, loop: true },
  hurt: { row: 'hurt', ticks: 14, loop: false },
  launched: { row: 'knockback', ticks: 40, loop: false },
  knockdown: { row: 'knockback', ticks: 36, loop: false },
  getup: { row: 'knockback', ticks: 14, loop: false },
  defeat: { row: 'defeat', ticks: 70, loop: false },
};

const BOSS_PACING: Record<string, Pacing> = {
  idle: { row: 'idle', ticks: 60, loop: true },
  approach: { row: 'approach', ticks: 40, loop: true },
  attack: { row: 'attack', ticks: 50, loop: false },
  special: { row: 'special', ticks: 70, loop: false },
  hurt: { row: 'hurt', ticks: 20, loop: false },
  defeat: { row: 'defeat', ticks: 150, loop: false },
};

function pick(frames: readonly number[], st: number, ticks: number, loop: boolean): number {
  const t = loop ? st % ticks : Math.min(st, ticks - 1);
  const idx = Math.min(frames.length - 1, Math.floor((t / ticks) * frames.length));
  return frames[idx];
}

export function heroFrameKey(state: string, st: number): string {
  const m = HERO_MOVES[state];
  if (!m) return 'idle/0';
  // idle/walk loop naturally; dash is now an open-ended sustained run (see fighter.ts) rather than a
  // fixed-duration burst, so it loops too instead of freezing on its last frame once st exceeds it.
  const loop = state === 'idle' || state === 'walk' || state === 'dash';
  return `${m.row}/${pick(m.frames, st, Math.max(1, moveTotal(m)), loop)}`;
}

const GENERIC6 = [0, 1, 2, 3, 4, 5] as const;

export function enemyFrameKey(arch: string, state: string, st: number): string {
  const def = ENEMY_DEFS[arch];
  if (def) {
    const a = state === 'attack' ? def.attack : state === 'heavy' ? def.heavy : state === 'special' ? def.special : null;
    if (a) return `${state}/${pick(GENERIC6, st, Math.max(1, a.startup + a.active + a.recovery), false)}`;
  }
  const p = ENEMY_PACING[state] || ENEMY_PACING.idle;
  return `${p.row}/${pick(GENERIC6, st, p.ticks, p.loop)}`;
}

const GENERIC8 = [0, 1, 2, 3, 4, 5, 6, 7] as const;

export function bossFrameKey(state: string, st: number): string {
  const p = BOSS_PACING[state] || BOSS_PACING.idle;
  return `${p.row}/${pick(GENERIC8, st, p.ticks, p.loop)}`;
}

export function frameKeyFor(kind: string, arch: string, state: string, st: number): string {
  if (kind === 'hero') return heroFrameKey(state, st);
  if (kind === 'boss' || kind === 'echo') return bossFrameKey(state, st);
  return enemyFrameKey(arch, state, st);
}
