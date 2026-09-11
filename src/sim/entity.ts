import type { Entity, Kind } from './types';

export function makeEntity(id: number, kind: Kind, arch: string, x: number, y: number, hp: number): Entity {
  return {
    id, kind, arch, slot: -1, x, y, z: 0, vx: 0, vy: 0, vz: 0, facing: 1, hp, maxHp: hp, meter: 0,
    state: 'idle', st: 0, hitstop: 0, invuln: 0, armor: 0, flash: 0, attackId: 0, hitBy: {},
    combo: 0, comboTimer: 0, comboStep: 0, cooldown: 0, hitStreak: 0, streakT: 0, stunCd: 0, regenLock: 0, ai: 0, aiT: 0, target: -1, dead: false, removeAt: 0,
    scale: 1, tint: 0, owner: -1, ttl: 0, dmgMul: 1, slow: 0, pattern: -1, pphase: 0, pt: 0, pdata: 0, phase: 0, hits: 0, guard: false,
  };
}

export function setState(e: Entity, state: string): void {
  if (e.state !== state) { e.state = state; e.st = 0; }
}

export const isDown = (e: Entity) => e.state === 'knockdown' || e.state === 'getup' || e.state === 'ko' || e.state === 'defeat' || e.state === 'launched';
export const isHurt = (e: Entity) => e.state === 'hurt' || e.state === 'hurtHeavy' || e.state === 'stunned' || isDown(e);
export const isActor = (e: Entity) => e.kind === 'hero' || e.kind === 'enemy' || e.kind === 'boss' || e.kind === 'echo';
export const dist = (a: Entity, b: Entity) => Math.hypot(a.x - b.x, a.y - b.y);
