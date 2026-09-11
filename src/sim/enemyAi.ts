import { GRAVITY } from './frameData';
import { LANE_H, LANE_TOL, VISIBLE_X0, VISIBLE_W, type Entity, type Hitbox } from './types';
import { setState, isHurt } from './entity';
import type { World } from './world';

export interface EnemyAttack { startup: number; active: number; recovery: number; range: number; hit: Hitbox; telegraph?: boolean; speed?: number; armor?: boolean }
export interface EnemyDef {
  id: string; name: string; hp: number; speed: number; weight: number;
  attack: EnemyAttack; heavy: EnemyAttack; special?: EnemyAttack;
  guard?: boolean; evasive?: boolean; heavyChance: number; specialChance: number; cooldown: [number, number];
  frames: number; // frames per row (6)
}

export const ENEMY_DEFS: Record<string, EnemyDef> = {
  punk: { id: 'punk', name: 'Punk', hp: 46, speed: 2.1, weight: 1, heavyChance: 0.25, specialChance: 0, cooldown: [56, 115], frames: 6,
    attack: { startup: 9, active: 3, recovery: 14, range: 58, hit: { dx: 34, dy: 0, w: 44, h: 90, dmg: 2, hitstun: 12, kb: 2 } },
    heavy: { startup: 16, active: 4, recovery: 22, range: 62, hit: { dx: 38, dy: 0, w: 48, h: 90, dmg: 3, hitstun: 20, kb: 5, knockdown: true } } },
  chainer: { id: 'chainer', name: 'Chainer', hp: 58, speed: 1.8, weight: 1.2, heavyChance: 0.3, specialChance: 0.15, cooldown: [78, 145], frames: 6,
    attack: { startup: 18, active: 4, recovery: 18, range: 130, telegraph: true, hit: { dx: 70, dy: 0, w: 120, h: 80, dmg: 3, hitstun: 14, kb: 3 } },
    heavy: { startup: 22, active: 6, recovery: 24, range: 90, telegraph: true, hit: { dx: 0, dy: 0, w: 0, h: 100, dmg: 4, hitstun: 22, kb: 5, knockdown: true, radius: 80 } },
    special: { startup: 20, active: 10, recovery: 24, range: 140, telegraph: true, hit: { dx: 0, dy: 0, w: 0, h: 100, dmg: 6, hitstun: 24, kb: 6, knockdown: true, radius: 110 } } },
  brawler: { id: 'brawler', name: 'Brawler', hp: 92, speed: 1.4, weight: 1.6, heavyChance: 0.45, specialChance: 0, cooldown: [70, 132], frames: 6,
    attack: { startup: 12, active: 4, recovery: 18, range: 62, hit: { dx: 36, dy: 0, w: 50, h: 90, dmg: 3, hitstun: 15, kb: 3 } },
    heavy: { startup: 24, active: 5, recovery: 26, range: 70, telegraph: true, armor: true, hit: { dx: 40, dy: 0, w: 56, h: 110, dmg: 5, hitstun: 26, kb: 4, launch: 7 } } },
  kicker: { id: 'kicker', name: 'Kicker', hp: 56, speed: 2.6, weight: 1.2, heavyChance: 0.3, specialChance: 0.3, cooldown: [48, 102], frames: 6, evasive: true,
    attack: { startup: 8, active: 3, recovery: 12, range: 60, hit: { dx: 36, dy: 0, w: 46, h: 90, dmg: 2, hitstun: 12, kb: 2 } },
    heavy: { startup: 14, active: 4, recovery: 18, range: 78, hit: { dx: 44, dy: 0, w: 60, h: 100, dmg: 3, hitstun: 20, kb: 5, knockdown: true } },
    special: { startup: 12, active: 12, recovery: 16, range: 220, telegraph: true, speed: 7, hit: { dx: 30, dy: 0, w: 60, h: 90, dmg: 4, hitstun: 20, kb: 6, knockdown: true } } },
  knight: { id: 'knight', name: 'Knight', hp: 82, speed: 1.6, weight: 1.5, heavyChance: 0.35, specialChance: 0.1, cooldown: [70, 132], frames: 6, guard: true,
    attack: { startup: 12, active: 4, recovery: 18, range: 76, hit: { dx: 44, dy: 0, w: 60, h: 100, dmg: 3, hitstun: 15, kb: 3 } },
    heavy: { startup: 20, active: 5, recovery: 24, range: 84, telegraph: true, hit: { dx: 46, dy: 0, w: 70, h: 110, dmg: 5, hitstun: 24, kb: 5, knockdown: true } },
    special: { startup: 18, active: 6, recovery: 22, range: 110, telegraph: true, hit: { dx: 60, dy: 0, w: 110, h: 100, dmg: 6, hitstun: 24, kb: 6, knockdown: true } } },
  shield: { id: 'shield', name: 'Shield Trooper', hp: 132, speed: 1.5, weight: 2.2, heavyChance: 0.4, specialChance: 0.3, cooldown: [86, 155], frames: 6, guard: true,
    attack: { startup: 12, active: 4, recovery: 18, range: 60, hit: { dx: 36, dy: 0, w: 48, h: 100, dmg: 3, hitstun: 15, kb: 3 } },
    heavy: { startup: 20, active: 5, recovery: 24, range: 66, telegraph: true, armor: true, hit: { dx: 38, dy: 0, w: 56, h: 110, dmg: 4, hitstun: 24, kb: 6, knockdown: true } },
    special: { startup: 24, active: 30, recovery: 24, range: 380, telegraph: true, speed: 8, armor: true, hit: { dx: 30, dy: 0, w: 60, h: 100, dmg: 7, hitstun: 24, kb: 7, knockdown: true } } },
};
// palette variants share behaviour
ENEMY_DEFS['punk-b'] = { ...ENEMY_DEFS.punk, id: 'punk-b', hp: 52, speed: 2.3 };
ENEMY_DEFS['brawler-b'] = { ...ENEMY_DEFS.brawler, id: 'brawler-b', hp: 104 };
ENEMY_DEFS['knight-b'] = { ...ENEMY_DEFS.knight, id: 'knight-b', hp: 96 };

const attackOf = (def: EnemyDef, state: string): EnemyAttack | null =>
  state === 'attack' ? def.attack : state === 'heavy' ? def.heavy : state === 'special' ? def.special || null : null;

export function enemyActiveHit(e: Entity): Hitbox | null {
  const def = ENEMY_DEFS[e.arch];
  if (!def) return null;
  const a = attackOf(def, e.state);
  if (!a) return null;
  if (e.st < a.startup || e.st >= a.startup + a.active) return null;
  return a.hit;
}

export function stepEnemy(w: World, e: Entity): void {
  const def = ENEMY_DEFS[e.arch];
  if (e.hitstop > 0) { e.hitstop--; return; }
  if (e.flash > 0) e.flash--;
  if (e.invuln > 0) e.invuln--;
  if (e.armor > 0) e.armor--;
  if (e.slow > 0) e.slow--;
  if (e.cooldown > 0) e.cooldown--;
  if (e.streakT > 0) { e.streakT--; if (e.streakT === 0) e.hitStreak = 0; }
  if (e.stunCd > 0) e.stunCd--;
  // A token is held only while genuinely mid-attack; release it the instant the enemy leaves that
  // state for any reason (finished, interrupted into hurt/launched, or killed) so an interrupted
  // attacker can never permanently starve the shared attack-token pool.
  if (e.state !== 'attack' && e.state !== 'heavy' && e.state !== 'special') w.releaseAttackToken(e.id);
  const slowMul = e.slow > 0 ? 0.6 : 1;
  const s = e.state;

  if (s === 'defeat') {
    e.x += e.vx; e.vx *= 0.9;
    if (!e.removeAt) e.removeAt = w.tick + 70;
    e.st++; return;
  }
  if (s === 'launched') {
    e.z += e.vz; e.vz -= GRAVITY; e.x += e.vx; e.vx *= 0.96;
    if (e.z <= 0) {
      e.z = 0; e.vz = 0;
      if (e.hp <= 0) { setState(e, 'defeat'); e.dead = true; w.emit({ type: 'ko', x: e.x, y: e.y, id: e.id }); }
      else setState(e, 'knockdown');
    }
    e.st++; clampEnemy(w, e, inView(w, e)); return;
  }
  if (s === 'knockdown') { e.invuln = 2; if (e.st >= 36) { setState(e, 'getup'); e.invuln = 14; } e.st++; return; }
  if (s === 'getup') { if (e.st >= 14) { setState(e, 'idle'); e.cooldown = 20; } e.st++; return; }
  if (s === 'stunned') { if (e.st >= e.aiT) { setState(e, 'idle'); e.cooldown = 30; } e.st++; return; }
  if (s === 'hurt') {
    e.x += e.vx; e.vx *= 0.85;
    const len = e.pdata >> 8 || 14;
    if (e.st >= len) { setState(e, 'idle'); e.pdata = 0; }
    e.st++; clampEnemy(w, e, inView(w, e)); return;
  }
  const atk = attackOf(def, s);
  if (atk) {
    const t = atk.startup + atk.active + atk.recovery;
    if (atk.armor && e.st < atk.startup + atk.active) e.armor = Math.max(e.armor, 1);
    if (atk.speed && e.st >= atk.startup && e.st < atk.startup + atk.active) e.x += e.facing * atk.speed * slowMul;
    if (e.st >= t) {
      setState(e, 'idle');
      const [a, b] = def.cooldown; e.cooldown = Math.round(w.rng.int(a, b) * 1.35);
      if (def.evasive) { e.ai = 1; e.aiT = 24; } // retreat
      w.releaseAttackToken(e.id);
    }
    e.st++; clampEnemy(w, e); return;
  }

  // ---- decision making (idle / walk) ----
  const target = w.nearestHero(e);
  if (!target) { setState(e, 'idle'); e.st++; return; }
  e.target = target.id;
  const dx = target.x - e.x, dy = target.y - e.y;
  const adx = Math.abs(dx);
  const spd = def.speed * slowMul;
  // flank side by id parity, preferred distance = attack range * 0.8
  const side = (e.id % 2 === 0) ? -1 : 1;
  const preferSide = adx > 200 ? (dx > 0 ? -1 : 1) : (Math.sign(-dx) || side);
  const desiredX = target.x + preferSide * def.attack.range * 0.68;
  const laneOffset = ((e.id * 37) % 21) - 10;
  const desiredY = Math.max(0, Math.min(LANE_H, target.y + laneOffset));
  let mx = 0, my = 0;
  if (e.ai === 1) { // evasive retreat
    mx = -Math.sign(dx); e.aiT--; if (e.aiT <= 0) e.ai = 0;
  } else {
    if (Math.abs(desiredX - e.x) > 2) mx = Math.sign(desiredX - e.x);
    if (Math.abs(desiredY - e.y) > 3) my = Math.sign(desiredY - e.y);
  }
  e.facing = dx >= 0 ? 1 : -1;
  e.x += mx * spd; e.y += my * spd * 0.6;
  setState(e, mx !== 0 || my !== 0 ? 'walk' : 'idle');

  // attack decision
  const inLane = Math.abs(dy) <= LANE_TOL;
  if (e.cooldown <= 0 && inLane && !isHurt(target) && target.state !== 'ko' && e.ai === 0) {
    let choice: string | null = null;
    if (def.special && adx <= def.special.range && adx > def.attack.range * 0.7 && w.rng.chance(def.specialChance)) choice = 'special';
    else if (adx <= def.heavy.range && w.rng.chance(def.heavyChance)) choice = 'heavy';
    else if (adx <= def.attack.range) choice = 'attack';
    if (choice && w.takeAttackToken(e.id)) {
      setState(e, choice);
      e.attackId++;
      const a = attackOf(def, choice)!;
      if (a.telegraph) w.emit({ type: 'telegraph', x: e.x + e.facing * (a.hit.radius ? 0 : a.range * 0.5), y: e.y, shape: a.hit.radius ? 'circle' : 'line', a: a.hit.radius || a.range, b: a.startup, colour: 0xff4f72, id: e.id });
    } else if (choice) {
      e.cooldown = 10; // wait for a token
    }
  }
  e.st++;
  clampEnemy(w, e);
}

/** True once the enemy has come inside the visible band (before that it is still walking in). */
const inView = (w: World, e: Entity) => e.x >= w.cameraX + VISIBLE_X0 - 30 && e.x <= w.cameraX + VISIBLE_X0 + VISIBLE_W + 30;

export function clampEnemy(w: World, e: Entity, tight = false): void {
  // an enemy being knocked around never leaves the visible band; one still walking in from
  // off-screen keeps the wide margin
  const minX = tight ? w.cameraX + VISIBLE_X0 - 50 : w.cameraX - 120;
  const maxX = tight ? w.cameraX + VISIBLE_X0 + VISIBLE_W + 50 : w.cameraX + 960 + 120;
  if (e.x < minX) e.x = minX; if (e.x > maxX) e.x = maxX;
  if (e.y < 0) e.y = 0; if (e.y > LANE_H) e.y = LANE_H;
}
