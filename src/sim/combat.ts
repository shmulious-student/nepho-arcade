import { HEROES, HITSTOP_HEAVY, HITSTOP_LIGHT, METER_MAX, METER_PER_HIT, METER_PER_TAKEN, COMBO_WINDOW } from './frameData';
import { LANE_TOL, type Entity, type Hitbox, type HeroId } from './types';
import { setState } from './entity';
import { heroActiveHit } from './fighter';
import { enemyActiveHit } from './enemyAi';
import { bossActiveHit, bossOnHit } from './bosses';
import type { World } from './world';

export function activeHitbox(e: Entity): Hitbox | null {
  switch (e.kind) {
    case 'hero': return heroActiveHit(e);
    case 'enemy': return enemyActiveHit(e);
    case 'boss': case 'echo': return bossActiveHit(e);
    case 'projectile': return e.ttl > 0 && e.pphase === 1 ? projectileHit(e) : null;
    case 'hazard': return e.pphase === 1 ? (hazardHit(e.id) || null) : null;
  }
}

const projHits: Record<number, Hitbox> = {};
export function registerProjectileHit(id: number, hit: Hitbox) { projHits[id] = hit; }
export function projectileHit(e: Entity): Hitbox | null { return projHits[e.id] || null; }
export function forgetProjectile(id: number) { delete projHits[id]; }

const hazardHits: Record<number, Hitbox> = {};
export function registerHazardHit(id: number, hit: Hitbox) { hazardHits[id] = hit; }
export function hazardHit(id: number): Hitbox | undefined { return hazardHits[id]; }
export function forgetHazard(id: number) { delete hazardHits[id]; }

function overlaps(att: Entity, hit: Hitbox, tgt: Entity): boolean {
  const tw = tgt.kind === 'boss' ? 70 : tgt.kind === 'echo' ? 52 : 40;
  const th = tgt.kind === 'boss' ? 170 : 110;
  if (hit.radius) {
    const d = Math.hypot(tgt.x - att.x, (tgt.y - att.y) * 1.6);
    return d <= hit.radius + tw * 0.5 && tgt.z < hit.h;
  }
  // heroes get a more forgiving depth tolerance than enemies: a hit that looks like it connects should
  const laneTol = LANE_TOL + (hit.h > 100 ? 4 : 0) + (att.kind === 'hero' ? 10 : 0);
  if (Math.abs(tgt.y - (att.y + hit.dy)) > laneTol) return false;
  const x0 = att.facing === 1 ? att.x + hit.dx - hit.w * 0.5 : att.x - hit.dx - hit.w * 0.5;
  const x1 = x0 + hit.w;
  if (tgt.x + tw * 0.5 < x0 || tgt.x - tw * 0.5 > x1) return false;
  // vertical: attack covers z from att.z to att.z + h; target body from tgt.z to tgt.z + th
  return tgt.z <= att.z + hit.h && tgt.z + th >= att.z;
}

function targetsOf(w: World, att: Entity): Entity[] {
  const hostileToHeroes = att.kind === 'enemy' || att.kind === 'boss' || att.kind === 'echo' || ((att.kind === 'projectile' || att.kind === 'hazard') && att.slot < 0);
  return w.entities.filter((t) => !t.dead && t.id !== att.id && t.hp > 0 && (hostileToHeroes ? t.kind === 'hero' : (t.kind === 'enemy' || t.kind === 'boss' || t.kind === 'echo')));
}

export function resolveHits(w: World): void {
  for (const att of w.entities) {
    if (att.dead && att.kind !== 'hazard') continue;
    if (att.hitstop > 0) continue;
    const hit = activeHitbox(att);
    if (!hit) continue;
    for (const tgt of targetsOf(w, att)) {
      if (tgt.hitBy[att.id] === att.attackId) continue;
      if (tgt.state === 'ko' || tgt.state === 'defeat') continue;
      if (tgt.invuln > 0 && tgt.kind === 'hero') continue;
      if ((tgt.state === 'knockdown' || tgt.state === 'getup') && !hit.radius) continue;
      if (!overlaps(att, hit, tgt)) continue;
      tgt.hitBy[att.id] = att.attackId;
      applyHit(w, att, hit, tgt);
      if (att.kind === 'projectile' && !hit.pierce) { att.ttl = 0; att.dead = true; att.removeAt = w.tick + 1; break; }
    }
  }
}

export function applyHit(w: World, att: Entity, hit: Hitbox, tgt: Entity): void {
  const owner = att.owner >= 0 ? w.byId(att.owner) : att;
  // A friend's hits are support, not the main event: less damage, half the shove, and no launching
  // or flooring outside their special — so they soften enemies up for the player instead of
  // punting them off the screen.
  if (owner?.kind === 'hero' && owner.slot < 0 && att.state !== 'special') {
    hit = { ...hit, dmg: hit.dmg * 0.6, kb: hit.kb * 0.5, launch: undefined, knockdown: hit.radius ? hit.knockdown : false };
  }
  const heavy = !!(hit.launch || hit.knockdown || hit.dmg >= 12);
  let dmg = hit.dmg * (owner?.dmgMul ?? 1);
  if (owner?.kind === 'hero') dmg *= HEROES[owner.arch as HeroId].dmgMul;
  const dirToTarget: 1 | -1 = tgt.x >= att.x ? 1 : -1;

  // knight / shield guard: frontal, non-launching hero hits are blocked
  // Guard blocks ordinary and launching hits alike; only a deliberate guard-break (knockdown-flagged
  // moves: light3, dash-attack, special) or an AoE gets through. This stops heavy-spam from trivially
  // bypassing knight/shield enemies.
  if (tgt.guard && owner?.kind === 'hero' && !hit.knockdown && !hit.radius && tgt.facing === -dirToTarget && tgt.state !== 'hurt') {
    const chip = dmg * 0.45;
    tgt.hp -= chip;
    tgt.x += dirToTarget * 6;
    tgt.flash = 4;
    w.emit({ type: 'block', x: tgt.x, y: tgt.y, z: 50, id: tgt.id });
    if (owner) owner.hitstop = 4;
    // Chip damage can still finish off a guarding enemy — do not return before checking death, or the
    // entity goes to negative HP without ever being marked dead, permanently blocking wave/boss clearance.
    if (tgt.hp <= 0) {
      tgt.hp = 0;
      setState(tgt, 'launched'); tgt.vz = 3; tgt.vx = dirToTarget * 3; tgt.dead = true;
      w.onEnemyKilled(tgt, owner);
      if (owner?.kind === 'hero') rewardHero(w, owner, tgt, chip, false);
    }
    return;
  }
  // Hero block: facing the attack while holding BLOCK cuts most damage through, mirroring the enemy
  // guard rule above (knockdown-flagged "breaker" hits and AoEs still get through).
  if (tgt.kind === 'hero' && tgt.state === 'block' && !hit.knockdown && !hit.radius && tgt.facing === -dirToTarget) {
    const chip = dmg * 0.25;
    tgt.hp -= chip;
    tgt.x += dirToTarget * 3;
    tgt.flash = 4;
    w.emit({ type: 'block', x: tgt.x, y: tgt.y, z: 50, id: tgt.id });
    if (tgt.hp <= 0) {
      tgt.hp = 0;
      if (!w.tryRevive(tgt)) { setState(tgt, 'ko'); w.emit({ type: 'ko', x: tgt.x, y: tgt.y, id: tgt.id }); }
    }
    return;
  }
  if (tgt.kind === 'boss' || tgt.kind === 'echo') {
    bossOnHit(w, tgt, att, hit, dmg, dirToTarget);
    if (owner?.kind === 'hero') rewardHero(w, owner, tgt, dmg, heavy);
    w.emit({ type: 'hit', x: tgt.x, y: tgt.y, z: tgt.z + 80, a: Math.round(dmg), heavy, id: tgt.id });
    return;
  }
  tgt.hp -= dmg;
  tgt.flash = 6;
  const stunned = tgt.armor <= 0;
  if (tgt.kind === 'hero') tgt.meter = Math.min(METER_MAX, tgt.meter + METER_PER_TAKEN);
  w.emit({ type: 'hit', x: tgt.x, y: tgt.y, z: tgt.z + (tgt.kind === 'hero' ? 70 : 60), a: Math.round(dmg), heavy, id: tgt.id });
  const stop = heavy ? HITSTOP_HEAVY : HITSTOP_LIGHT;
  if (owner && owner.kind !== 'projectile') owner.hitstop = Math.max(owner.hitstop, stop);
  tgt.hitstop = Math.max(tgt.hitstop, stop);

  if (tgt.hp <= 0) {
    tgt.hp = 0;
    if (tgt.kind === 'hero') {
      setState(tgt, 'launched'); tgt.vz = 6; tgt.vx = dirToTarget * 4;
    } else {
      setState(tgt, 'launched'); tgt.vz = Math.max(4, hit.launch || 5); tgt.vx = dirToTarget * Math.max(3, hit.kb); tgt.dead = true;
      w.onEnemyKilled(tgt, owner);
    }
    if (owner?.kind === 'hero') rewardHero(w, owner, tgt, dmg, heavy);
    return;
  }
  if (stunned) {
    if (hit.launch) { setState(tgt, 'launched'); tgt.vz = hit.launch; tgt.vx = dirToTarget * hit.kb; tgt.z = Math.max(tgt.z, 1); w.emit({ type: 'launch', x: tgt.x, y: tgt.y, id: tgt.id }); }
    else if (hit.knockdown) { setState(tgt, 'launched'); tgt.vz = 3.5; tgt.vx = dirToTarget * hit.kb; tgt.z = Math.max(tgt.z, 1); }
    else {
      const st = tgt.kind === 'hero' && hit.hitstun > 20 ? 'hurtHeavy' : 'hurt';
      setState(tgt, st); tgt.vx = dirToTarget * hit.kb * 0.8; tgt.pdata = hit.hitstun << 8;
      // Brief mercy invulnerability on entering hurtstun: without it, an overlapping multi-hit source
      // (e.g. several orbiting hazards) can chain-stun a hero from full HP to zero with no way to escape.
      // 30 ticks (0.5s) — deliberately longer than a 34-tick hazard re-hit interval (orbiting damage
      // orbs etc.), so a hero who gets clipped once has a real window to reposition before the next
      // hazard cycle, rather than being chain-stunned by overlapping periodic sources.
      if (tgt.kind === 'hero') tgt.invuln = Math.max(tgt.invuln, 30);
      if (tgt.z > 0) { setState(tgt, 'launched'); tgt.vz = 2; } // juggle
    }
    if (tgt.kind === 'enemy') w.releaseAttackToken(tgt.id);
  } else {
    tgt.x += dirToTarget * 2;
  }
  if (owner?.kind === 'hero') rewardHero(w, owner, tgt, dmg, heavy);
}

function rewardHero(w: World, hero: Entity, tgt: Entity, dmg: number, heavy: boolean): void {
  hero.meter = Math.min(METER_MAX, hero.meter + METER_PER_HIT * (heavy ? 1.4 : 1));
  hero.combo++; hero.comboTimer = COMBO_WINDOW; hero.hits++;
  w.addScore(hero.slot, Math.round(dmg * 10 * (1 + Math.min(hero.combo, 20) * 0.05)));
  void tgt;
}
