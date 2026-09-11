import { BTN, type InputFrame } from './input';
import { HERO_MOVES, HEROES, METER_MAX, GRAVITY, JUMP_VZ, HITSTUN_SHIFT, total, type MoveDef } from './frameData';
import { LANE_H, VISIBLE_X0, VISIBLE_W, HERO_EDGE, type Entity, type Hitbox, type HeroId } from './types';
import { setState } from './entity';
import { STUN_TICKS } from './combat';
import type { World } from './world';

const MOVE_STATES = new Set(['light1', 'light2', 'light3', 'heavy', 'dashAttack', 'special']);
// jumpAttack is an attack too, but airborne: it is stepped by the jump branch, not the move branch
export const isMove = (s: string) => MOVE_STATES.has(s);

export function heroSpecialHit(heroId: HeroId): Hitbox | null {
  switch (HEROES[heroId].special) {
    case 'burst': return { dx: 0, dy: 0, w: 0, h: 140, dmg: 50, hitstun: 30, kb: 7, launch: 8, radius: 150 };
    case 'volley': return null;
    // a fan of paint thrown forward: wide, floors the whole front line
    case 'splash': return { dx: 60, dy: 0, w: 190, h: 150, dmg: 58, hitstun: 32, kb: 9, knockdown: true };
    // a sonic shockwave in every direction, on the beat
    case 'wave': return { dx: 0, dy: 0, w: 0, h: 140, dmg: 46, hitstun: 30, kb: 7, launch: 9, radius: 170 };
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

/** Turns the hero toward the nearer live enemy when nothing is in reach in front but something is
 * behind — so a combo thrown with an enemy at your back lands instead of whiffing into thin air. */
function autoFace(w: World, e: Entity): void {
  let front = Infinity, back = Infinity;
  for (const t of w.entities) {
    if (t.dead || t.hp <= 0 || (t.kind !== 'enemy' && t.kind !== 'boss' && t.kind !== 'echo')) continue;
    if (Math.abs(t.y - e.y) > 24) continue;
    const d = (t.x - e.x) * e.facing;
    if (d >= 0) front = Math.min(front, d); else back = Math.min(back, -d);
  }
  if (front > 110 && back <= 110) e.facing = e.facing === 1 ? -1 : 1;
}

function startMove(w: World, e: Entity, state: string): void {
  if (state === 'light1' || state === 'heavy') autoFace(w, e);
  setState(e, state);
  e.attackId++;
  e.hits = 0;
  e.pdata = 0;
  if (state === 'special') {
    e.meter = 0;
    w.emit({ type: 'special', x: e.x, y: e.y, id: e.id, a: HERO_IDS_INDEX[e.arch as HeroId] });
  }
  if (state === 'dash') w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id });
}

const HERO_IDS_INDEX: Record<HeroId, number> = { eviatar: 0, omri: 1, nepho: 2, byte: 3 };

/** The dash chord: DASH held together with exactly one horizontal direction. Returns the direction
 * (1 right, -1 left) or 0 when the chord is not held. */
function dashChord(held: number): 1 | -1 | 0 {
  if (!(held & BTN.DASH)) return 0;
  const l = !!(held & BTN.LEFT), r = !!(held & BTN.RIGHT);
  if (l === r) return 0;
  return r ? 1 : -1;
}

/** True if a live enemy/boss/echo is close ahead of `e` in its current lane — used to auto-engage
 * (end the dash into a dash-attack) when running into someone, per the "dash doesn't end until you
 * turn around or hit something" design. */
function enemyAhead(w: World, e: Entity): boolean {
  for (const t of w.entities) {
    if (t.dead || t.hp <= 0) continue;
    if (t.kind !== 'enemy' && t.kind !== 'boss' && t.kind !== 'echo') continue;
    if (Math.abs(t.y - e.y) > 18) continue;
    const ahead = (t.x - e.x) * e.facing;
    if (ahead > 0 && ahead < 52) return true;
  }
  return false;
}

export function stepHero(w: World, e: Entity, input: InputFrame): void {
  if (e.hitstop > 0) { e.hitstop--; return; }
  if (e.invuln > 0) e.invuln--;
  if (e.armor > 0) e.armor--;
  if (e.flash > 0) e.flash--;
  if (e.slow > 0) e.slow--;
  if (e.comboTimer > 0) { e.comboTimer--; if (e.comboTimer === 0) e.combo = 0; }
  if (e.streakT > 0) { e.streakT--; if (e.streakT === 0) e.hitStreak = 0; }
  if (e.stunCd > 0) e.stunCd--;
  if (e.regenLock > 0) e.regenLock--;
  const def = HEROES[e.arch as HeroId];
  const held = input.held;
  const pressed = input.pressed;
  // buffer button presses during moves so cancels feel responsive
  e.pdata |= pressed & (BTN.LIGHT | BTN.HEAVY | BTN.SPECIAL | BTN.JUMP);

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
    const up = dashChord(held);
    if (e.st >= 8 && up) { e.pdata = 0; e.facing = up; startMove(w, e, 'dash'); return; }
    if (e.st >= total(HERO_MOVES.getup)) setState(e, 'idle');
    e.st++; return;
  }
  if (s === 'stunned') {
    // dazed: no input for two seconds, unless a hit knocks the hero out of it first
    if (e.st >= STUN_TICKS) { setState(e, 'idle'); e.pdata = 0; }
    e.st++; clampHero(w, e); return;
  }
  if (s === 'hurt' || s === 'hurtHeavy') {
    e.x += e.vx; e.vx *= 0.85;
    const len = e.pdata >> HITSTUN_SHIFT || total(move!); // hitstun stored in high bits
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

  if (s === 'dash') {
    // A dash is a held chord — DASH + a direction — and lasts exactly as long as the chord does. It
    // also ends by engaging an enemy (auto dash-attack on contact, or a buffered light/heavy), by
    // running into the edge of the screen, or by being hit. Combo presses buffered mid-dash land the
    // instant it ends.
    if (e.st < 10) e.invuln = Math.max(e.invuln, 1); // brief i-frames only at the start of the run
    const dir = dashChord(held);
    if (dir !== e.facing) { setState(e, 'idle'); e.st++; clampHero(w, e); return; } // released or reversed
    if (e.pdata & (BTN.LIGHT | BTN.HEAVY) || (e.st > 3 && enemyAhead(w, e))) { e.pdata = 0; startMove(w, e, 'dashAttack'); return; }
    if (e.pdata & BTN.SPECIAL && e.meter >= METER_MAX) { e.pdata = 0; startMove(w, e, 'special'); return; }
    if (e.pdata & BTN.JUMP) { e.pdata = 0; setState(e, 'jump'); e.vz = JUMP_VZ; e.z = 0.01; e.st++; clampHero(w, e); return; }
    const before = e.x;
    e.x += e.facing * HERO_MOVES.dash.speed! * slowMul;
    clampHero(w, e);
    if (Math.abs(e.x - before) < 1) { setState(e, 'idle'); e.st++; return; } // ran into the edge of the screen
    // Holding up/down actively steers the dash into a diagonal run, not just a light drift.
    if (held & BTN.UP) e.y -= 2.2 * slowMul; if (held & BTN.DOWN) e.y += 2.2 * slowMul;
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
    if (spd) e.x += e.facing * spd * slowMul;
    // byte volley spawns projectiles during the active window
    if (s === 'special' && def.special === 'volley' && e.st >= move.startup && e.st < move.startup + move.active && (e.st - move.startup) % 3 === 0) {
      w.spawnProjectile(e, 'bolt', e.x + e.facing * 30, e.y, e.z + 50, e.facing * 11, { dx: 0, dy: 0, w: 30, h: 40, dmg: 12, hitstun: 18, kb: 3, knockdown: (e.st - move.startup) >= 9 });
    }
    // eviatar's paint fan: splats land across the front line as the marker sweeps through the active window
    if (s === 'special' && def.special === 'splash' && e.st >= move.startup && e.st < move.startup + move.active && (e.st - move.startup) % 2 === 0) {
      const k = (e.st - move.startup) / 2;
      w.emit({ type: 'paint', x: e.x + e.facing * (40 + k * 24), y: e.y + ((k % 3) - 1) * 14, z: 30 + (k % 2) * 30, id: e.id, a: k });
    }
    // omri's sonic beat: three pulses on the beat, each a ring of sound from the microphone
    if (s === 'special' && def.special === 'wave' && e.st >= move.startup && e.st < move.startup + move.active && (e.st - move.startup) % 4 === 0) {
      w.emit({ type: 'note', x: e.x, y: e.y, z: 50, id: e.id, a: (e.st - move.startup) / 4 });
    }
    // cancels
    if (move.cancelFrom !== undefined && e.st >= move.cancelFrom && (e.pdata & BTN.LIGHT) && move.cancelTo) { e.pdata = 0; startMove(w, e, move.cancelTo); return; }
    if (move.specialCancel && e.st >= move.startup && (e.pdata & BTN.SPECIAL) && e.meter >= METER_MAX) { e.pdata = 0; startMove(w, e, 'special'); return; }
    if (e.st >= t - 1) {
      // A press buffered during recovery starts its move the instant this one ends, instead of being
      // thrown away — the difference between a chain that flows and one that needs perfect timing.
      const next = (e.pdata & BTN.SPECIAL && e.meter >= METER_MAX) ? 'special' : (e.pdata & BTN.LIGHT) ? 'light1' : (e.pdata & BTN.HEAVY) ? 'heavy' : null;
      e.pdata = 0;
      if (next) { startMove(w, e, next); return; }
      setState(e, 'idle');
    }
    e.st++; clampHero(w, e); return;
  }

  if (s === 'jump' || s === 'jumpAttack') {
    e.z += e.vz; e.vz -= GRAVITY;
    // steer in the air, at walking speed; the kick keeps the momentum it launched with
    let mx = 0;
    if (held & BTN.LEFT) mx -= 1; if (held & BTN.RIGHT) mx += 1;
    if (mx !== 0 && s === 'jump') e.facing = mx > 0 ? 1 : -1;
    e.x += mx * def.speed * 0.9 * slowMul;
    if (s === 'jump' && (e.pdata & (BTN.LIGHT | BTN.HEAVY))) { e.pdata = 0; setState(e, 'jumpAttack'); e.attackId++; e.hits = 0; }
    if (e.z <= 0) {
      e.z = 0; e.vz = 0;
      setState(e, 'idle');
      e.pdata &= ~BTN.JUMP;
    }
    e.st++; clampHero(w, e); return;
  }

  // idle / walk
  let mx = 0, my = 0;
  if (held & BTN.LEFT) mx -= 1; if (held & BTN.RIGHT) mx += 1;
  if (held & BTN.UP) my -= 1; if (held & BTN.DOWN) my += 1;
  if (mx !== 0) e.facing = mx > 0 ? 1 : -1;
  if (held & BTN.BLOCK) { e.pdata = 0; setState(e, 'block'); e.st++; clampHero(w, e); return; }
  // A friend walks no faster than the player it follows: a quicker friend would keep catching up
  // and stopping behind them, flickering between walk and idle all the way across the level.
  const owner = e.slot < 0 && e.owner >= 0 ? w.byId(e.owner) : null;
  const spd = (owner ? Math.min(def.speed, HEROES[owner.arch as HeroId].speed) : def.speed) * slowMul;
  e.x += mx * spd; e.y += my * spd * 0.55;
  if (pressed & BTN.SPECIAL && e.meter >= METER_MAX) { e.pdata = 0; startMove(w, e, 'special'); return; }
  if (e.pdata & BTN.JUMP) { e.pdata = 0; setState(e, 'jump'); e.vz = JUMP_VZ; e.z = 0.01; w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id }); e.st++; clampHero(w, e); return; }
  const chord = dashChord(held);
  if (chord) { e.pdata = 0; e.facing = chord; startMove(w, e, 'dash'); return; }
  if (pressed & BTN.HEAVY) { e.pdata = 0; startMove(w, e, 'heavy'); return; }
  if (pressed & BTN.LIGHT) { e.pdata = 0; startMove(w, e, 'light1'); return; }
  e.pdata = 0;
  setState(e, mx !== 0 || my !== 0 ? 'walk' : 'idle');
  e.st++;
  clampHero(w, e);
}

export function clampHero(w: World, e: Entity): void {
  const minX = w.cameraX + VISIBLE_X0 + HERO_EDGE, maxX = w.cameraX + VISIBLE_X0 + VISIBLE_W - HERO_EDGE;
  if (e.x < minX) e.x = minX; if (e.x > maxX) e.x = maxX;
  if (e.y < 0) e.y = 0; if (e.y > LANE_H) e.y = LANE_H;
}
