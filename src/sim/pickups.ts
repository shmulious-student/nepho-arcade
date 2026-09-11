// Pickups: what beaten enemies leave behind. A heart heals, a coin pays, a star charges the special.
// They bounce out of the enemy, sit on the floor for ten seconds (blinking towards the end) and are
// collected by any player who walks over them. Plain entities of kind 'pickup'; `ttl` counts down,
// and `st` mirrors the remaining time (capped to a byte) so the renderer can blink without new fields.
import { GRAVITY, METER_MAX } from './frameData';
import type { Entity } from './types';
import { makeEntity } from './entity';
import type { World } from './world';

export const PICKUPS = ['heart', 'coin', 'star'] as const;
export type PickupKind = typeof PICKUPS[number];

export const PICKUP_TTL = 600;
export const COIN_SCORE = 500;
export const PICKUP_VALUE = { heart: 0.3, coin: COIN_SCORE, star: 50 } as const; // heal fraction / score / meter

/** Roll a drop for a beaten enemy: about one in three drops something, coins most often. */
export function rollDrop(w: World, e: Entity): void {
  if (e.kind !== 'enemy' || !w.rng.chance(0.32)) return;
  const r = w.rng.next();
  const kind: PickupKind = r < 0.4 ? 'heart' : r < 0.85 ? 'coin' : 'star';
  spawnPickup(w, kind, e.x, e.y);
}

export function spawnPickup(w: World, kind: PickupKind, x: number, y: number): Entity {
  const p = makeEntity(w.nextEntityId(), 'pickup', kind, x, y, 1);
  p.z = 20; p.vz = 4.5; p.vx = w.rng.range(-1.2, 1.2);
  p.ttl = PICKUP_TTL; p.st = 255;
  w.entities.push(p);
  return p;
}

export function stepPickup(w: World, p: Entity): void {
  if (p.dead) return; // collected or expired; waiting for removal at the end of the tick
  // a little hop out of the enemy, then rest on the floor
  if (p.z > 0 || p.vz > 0) { p.z += p.vz; p.vz -= GRAVITY; p.x += p.vx; if (p.z <= 0) { p.z = 0; p.vz = 0; p.vx = 0; } }
  p.ttl--;
  p.st = Math.min(255, p.ttl);
  if (p.ttl <= 0) { p.dead = true; p.removeAt = w.tick + 1; return; }
  for (const h of w.heroes()) {
    if (h.state === 'ko' || h.z > 30) continue;
    if (Math.abs(h.x - p.x) > 28 || Math.abs(h.y - p.y) > 20) continue;
    collect(w, h, p);
    return;
  }
}

function collect(w: World, h: Entity, p: Entity): void {
  const kind = p.arch as PickupKind;
  if (kind === 'heart') h.hp = Math.min(h.maxHp, h.hp + h.maxHp * PICKUP_VALUE.heart);
  else if (kind === 'coin') w.addScore(h.slot, COIN_SCORE);
  else h.meter = Math.min(METER_MAX, h.meter + PICKUP_VALUE.star);
  w.emit({ type: 'pickup', x: p.x, y: p.y, z: 40, id: h.id, a: PICKUPS.indexOf(kind) });
  p.dead = true; p.removeAt = w.tick + 1;
}
