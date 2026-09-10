import { BTN, type InputFrame } from './input';
import { HERO_MOVES, HEROES, METER_MAX, GRAVITY, total, type MoveDef } from './frameData';
import { LANE_H, type Entity, type Hitbox, type HeroId } from './types';
import { setState } from './entity';
import type { World } from './world';

const MOVE_STATES = new Set(['light1', 'light2', 'light3', 'heavy', 'dash', 'dashAttack', 'special']);
export const isMove = (s: string) => MOVE_STATES.has(s);

export function heroSpecialHit(heroId: HeroId): Hitbox | null {
  switch (HEROES[heroId].special) {
    case 'burst': return { dx: 0, dy: 0, w: 0, h: 140, dmg: 50, hitstun: 30, kb: 7, launch: 8, radius: 150 };
    case 'slam': return { dx: 0, dy: 0, w: 0, h: 140, dmg: 68, hitstun: 34, kb: 8, knockdown: true, radius: 125 };
    case 'line': return { dx: 30, dy: 0, w: 90, h: 120, dmg: 44, hitstun: 30, kb: 6, knockdown: true };
    case 'volley': return null;
  }
}

/** Returns the hitbox active on this tick for a hero, or null. */
export function heroActiveHit(e: Entity): Hitbox | null {
  const m = HERO_MOVES[e.state];
  if (!m || !m.hit) return null;
  if (e.st < m.startup || e.st >= m.startup + m.active) return null;
  if (e.state === 'special') return heroSpecialHit(e.arch as HeroId);
  return m.hit;
}

function startMove(w: World, e: Entity, state: string): void {
  setState(e, state);
  e.attackId++;
  e.hits = 0;
  e.pdata = 0;
  if (state === 'special') {
    e.meter = 0;
    w.emit({ type: 'special', x: e.x, y: e.y, id: e.id, a: HERO_IDS_INDEX[e.arch as HeroId] });
    if (HEROES[e.arch as HeroId].special === 'slam') e.armor = 40;
  }
  if (state === 'dash') w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id });
}

const HERO_IDS_INDEX: Record<HeroId, number> = { nepho: 0, bruiser: 1, riva: 2, byte: 3 };

export function stepHero(w: World, e: Entity, input: InputFrame): void {
  if (e.hitstop > 0) { e.hitstop--; return; }
  if (e.invuln > 0) e.invuln--;
  if (e.armor > 0) e.armor--;
  if (e.flash > 0) e.flash--;
  if (e.slow > 0) e.slow--;
  if (e.comboTimer > 0) { e.comboTimer--; if (e.comboTimer === 0) e.combo = 0; }
  const def = HEROES[e.arch as HeroId];
  const held = input.held;
  const pressed = input.pressed;
  // buffer button presses during moves so cancels feel responsive
  e.pdata |= pressed & (BTN.LIGHT | BTN.HEAVY | BTN.DASH | BTN.SPECIAL);

  const s = e.state;
  const move: MoveDef | undefined = HERO_MOVES[s];
  const slowMul = e.slow > 0 ? 0.6 : 1;

  if (s === 'ko') { e.st++; return; }

  if (s === 'launched') {
    e.z += e.vz; e.vz -= GRAVITY; e.x += e.vx; e.vx *= 0.96;
    if (e.z <= 0) {
      e.z = 0; e.vz = 0; e.vx = 0;
      if (e.hp <= 0) {
        if (!w.tryRevive(e)) { setState(e, 'ko'); w.emit({ type: 'ko', x: e.x, y: e.y, id: e.id }); }
      } else setState(e, 'knockdown');
    }
    e.st++; clampHero(w, e); return;
  }
  if (s === 'knockdown') {
    e.invuln = 2;
    if (e.st >= total(HERO_MOVES.knockdown)) { setState(e, 'getup'); e.invuln = 22; }
    e.st++; return;
  }
  if (s === 'getup') {
    if (e.st >= 8 && (e.pdata & BTN.DASH)) { e.pdata = 0; startMove(w, e, 'dash'); return; }
    if (e.st >= total(HERO_MOVES.getup)) setState(e, 'idle');
    e.st++; return;
  }
  if (s === 'hurt' || s === 'hurtHeavy') {
    e.x += e.vx; e.vx *= 0.85;
    const len = e.pdata >> 8 || total(move!); // hitstun stored in high bits
    if (e.st >= len) { setState(e, 'idle'); e.pdata = 0; }
    e.st++; clampHero(w, e); return;
  }
  if (s === 'block') {
    if (!(held & BTN.BLOCK)) { setState(e, 'idle'); e.st++; clampHero(w, e); return; }
    // Blocking still allows repositioning (at reduced speed) and free facing, so players can hold guard
    // while sidestepping into position rather than standing frozen.
    let mx = 0, my = 0;
    if (held & BTN.LEFT) mx -= 1; if (held & BTN.RIGHT) mx += 1;
    if (held & BTN.UP) my -= 1; if (held & BTN.DOWN) my += 1;
    if (mx !== 0) e.facing = mx > 0 ? 1 : -1;
    e.x += mx * def.speed * 0.5 * slowMul; e.y += my * def.speed * 0.5 * slowMul * 0.55;
    e.st++; clampHero(w, e); return;
  }

  if (move && isMove(s)) {
    const t = total(move);
    if (move.iframes && e.st >= move.iframes[0] && e.st <= move.iframes[1]) e.invuln = Math.max(e.invuln, 1);
    if (move.armor && e.st >= move.armor[0] && e.st <= move.armor[1]) e.armor = Math.max(e.armor, 1);
    // Facing is free to flip during recovery (after the active hit frames), so alternating combo taps
    // toward whichever side has an enemy reads instantly rather than needing to return to idle first.
    if (e.st >= move.startup + move.active) {
      if ((held & BTN.LEFT) && !(held & BTN.RIGHT)) e.facing = -1;
      else if ((held & BTN.RIGHT) && !(held & BTN.LEFT)) e.facing = 1;
    }
    // movement during moves
    let spd = move.speed || 0;
    if (s === 'special' && def.special === 'line') spd = e.st >= move.startup && e.st < move.startup + move.active ? 14 : 0;
    if (s === 'dash') spd = e.st < move.active ? move.speed! : 0;
    if (spd) {
      e.x += e.facing * spd * slowMul;
      if (s === 'dash') { // allow lane drift while dashing
        if (held & BTN.UP) e.y -= 1.2; if (held & BTN.DOWN) e.y += 1.2;
      }
    }
    // byte volley spawns projectiles during the active window
    if (s === 'special' && def.special === 'volley' && e.st >= move.startup && e.st < move.startup + move.active && (e.st - move.startup) % 3 === 0) {
      w.spawnProjectile(e, 'bolt', e.x + e.facing * 30, e.y, e.z + 50, e.facing * 11, { dx: 0, dy: 0, w: 30, h: 40, dmg: 12, hitstun: 18, kb: 3, knockdown: (e.st - move.startup) >= 9 });
    }
    // cancels
    if (move.cancelFrom !== undefined && e.st >= move.cancelFrom) {
      if (s === 'dash' && (e.pdata & (BTN.LIGHT | BTN.HEAVY))) { e.pdata = 0; startMove(w, e, 'dashAttack'); return; }
      if (s !== 'dash' && (e.pdata & BTN.LIGHT) && move.cancelTo) { e.pdata = 0; startMove(w, e, move.cancelTo); return; }
    }
    if (move.specialCancel && e.st >= move.startup && (e.pdata & BTN.SPECIAL) && e.meter >= METER_MAX) { e.pdata = 0; startMove(w, e, 'special'); return; }
    if (e.st >= t - 1) { setState(e, 'idle'); e.pdata = 0; }
    e.st++; clampHero(w, e); return;
  }

  // idle / walk
  let mx = 0, my = 0;
  if (held & BTN.LEFT) mx -= 1; if (held & BTN.RIGHT) mx += 1;
  if (held & BTN.UP) my -= 1; if (held & BTN.DOWN) my += 1;
  if (mx !== 0) e.facing = mx > 0 ? 1 : -1;
  if (held & BTN.BLOCK) { e.pdata = 0; setState(e, 'block'); e.st++; clampHero(w, e); return; }
  const spd = def.speed * slowMul;
  e.x += mx * spd; e.y += my * spd * 0.55;
  if (pressed & BTN.SPECIAL && e.meter >= METER_MAX) { e.pdata = 0; startMove(w, e, 'special'); return; }
  if (pressed & BTN.DASH) { e.pdata = 0; startMove(w, e, 'dash'); return; }
  if (pressed & BTN.HEAVY) { e.pdata = 0; startMove(w, e, 'heavy'); return; }
  if (pressed & BTN.LIGHT) { e.pdata = 0; startMove(w, e, 'light1'); return; }
  e.pdata = 0;
  setState(e, mx !== 0 || my !== 0 ? 'walk' : 'idle');
  e.st++;
  clampHero(w, e);
}

export function clampHero(w: World, e: Entity): void {
  const minX = w.cameraX + 24, maxX = w.cameraX + 960 - 24;
  if (e.x < minX) e.x = minX; if (e.x > maxX) e.x = maxX;
  if (e.y < 0) e.y = 0; if (e.y > LANE_H) e.y = LANE_H;
}
