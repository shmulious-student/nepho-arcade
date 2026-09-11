// Friends: the heroes a player did not pick can still fight beside them. Two ways, chosen in the lobby:
//   assist   — press the ASSIST button and the friend runs in, lands their special, and runs off again;
//              recharges on a cooldown. The friend cannot be hurt while visiting.
//   sidekick — the friend fights alongside the player for the whole level as an AI ally, drawing
//              enemy attention like a second hero. If floored for good they get back up a while later.
// A friend is a plain hero entity (same moves, same art) with slot -1: no HUD bars, lives or score,
// and never part of the win/lose check. `pattern` holds the owning player's slot, `pphase`/`pt` the
// assist script, `aiT` the previous input mask so press edges can be synthesised.
import { BTN, type InputFrame } from './input';
import { HEROES, METER_MAX } from './frameData';
import { LANE_H, type Entity, type HeroId } from './types';
import { makeEntity, setState, isDown, isHurt } from './entity';
import { stepHero } from './fighter';
import type { World } from './world';

export type FriendMode = 'off' | 'assist' | 'sidekick';
export interface FriendSetup { friends: [HeroId | null, HeroId | null]; mode: FriendMode }

export const ASSIST_COOLDOWN = 900; // ticks between calls (15s)
const ASSIST_APPROACH = 45; // max ticks spent closing in before the special is thrown regardless
const ASSIST_LINGER = 40; // ticks spent running off after the special
const SIDEKICK_REVIVE = 240; // ticks a floored sidekick stays down

const ENEMY_KINDS = new Set(['enemy', 'boss', 'echo']);

function nearestEnemy(w: World, from: Entity): Entity | null {
  let best: Entity | null = null, bd = Infinity;
  for (const t of w.entities) {
    if (t.dead || t.hp <= 0 || !ENEMY_KINDS.has(t.kind) || t.state === 'defeat') continue;
    if (t.x < w.cameraX - 40 || t.x > w.cameraX + 1000) continue;
    const d = Math.hypot(t.x - from.x, (t.y - from.y) * 1.6);
    if (d < bd) { bd = d; best = t; }
  }
  return best;
}

export function spawnFriend(w: World, slot: number, id: HeroId): Entity {
  const owner = w.players[slot]!;
  const def = HEROES[id];
  const e = makeEntity(w.nextEntityId(), 'hero', id, owner.x - owner.facing * 70, Math.max(6, Math.min(LANE_H - 6, owner.y + 8)), def.hp);
  e.slot = -1;
  e.owner = owner.id;
  e.pattern = slot;
  e.facing = owner.facing;
  e.x = Math.max(w.cameraX + 24, Math.min(w.cameraX + 936, e.x));
  w.entities.push(e);
  w.friends[slot] = e;
  w.emit({ type: 'summon', x: e.x, y: e.y, id: e.id });
  return e;
}

/** Steers toward (tx, ty) and returns the direction bits, leaving the pointer at `stop` px short. */
function moveTo(e: Entity, tx: number, ty: number, stop: number): number {
  let held = 0;
  const dx = tx - e.x, dy = ty - e.y;
  if (Math.abs(dx) > stop) held |= dx > 0 ? BTN.RIGHT : BTN.LEFT;
  if (Math.abs(dy) > 6) held |= dy > 0 ? BTN.DOWN : BTN.UP;
  return held;
}

/** How far from the player a sidekick will go to pick a fight; beyond it they fall back to them. */
const LEASH = 240;

function fightInput(w: World, e: Entity, aggressive: boolean): number {
  const owner = w.byId(e.owner);
  let target = nearestEnemy(w, e);
  // a sidekick fights *beside* the player: only enemies near the player are fair game
  if (target && owner && Math.abs(target.x - owner.x) > LEASH) target = null;
  if (!target || !aggressive) {
    // Nothing to do: shadow the player, a step behind. `ai` latches whether the friend is on the
    // move — it sets off once it has fallen well behind and keeps walking until it is right on the
    // spot, rather than stuttering between walk and idle at the edge of a narrow band.
    if (!owner) return 0;
    const tx = owner.x - owner.facing * 60;
    const ddx = Math.abs(tx - e.x), ddy = Math.abs(owner.y - e.y);
    if (ddx > 36 || ddy > 16) e.ai = 1; else if (ddx <= 8 && ddy <= 6) e.ai = 0;
    return e.ai ? moveTo(e, tx, owner.y, 6) : 0;
  }
  const dx = target.x - e.x, dy = target.y - e.y;
  const inRange = Math.abs(dx) <= 58 && Math.abs(dy) <= 12;
  if (!inRange) return moveTo(e, target.x - Math.sign(dx || 1) * 44, target.y, 8);
  // In range and facing. A sidekick jabs at an unhurried pace — about one swing a second, a heavy
  // now and then — so the player, not the helper, is the one clearing the screen. The special only
  // comes out when there is a crowd worth it.
  let held = 0;
  if ((dx > 0 && e.facing < 0) || (dx < 0 && e.facing > 0)) held |= dx > 0 ? BTN.RIGHT : BTN.LEFT;
  const crowd = w.entities.filter((t) => !t.dead && t.hp > 0 && ENEMY_KINDS.has(t.kind) && Math.abs(t.x - e.x) < 140 && Math.abs(t.y - e.y) < 30).length;
  if (e.meter >= METER_MAX && crowd >= 3) return held | BTN.SPECIAL;
  const beat = w.tick % 26 < 3;
  if (beat) held |= (w.tick % 130) < 26 ? BTN.HEAVY : BTN.LIGHT;
  return held;
}

/** Turns a held mask into an InputFrame with press edges, using aiT as the previous mask. */
function frame(e: Entity, held: number): InputFrame {
  const pressed = held & ~e.aiT;
  e.aiT = held;
  return { held, pressed };
}

function retire(w: World, slot: number, e: Entity): void {
  e.dead = true;
  e.removeAt = w.tick + 1;
  w.friends[slot] = null;
}

export function stepFriends(w: World, inputs: [InputFrame, InputFrame]): void {
  if (w.friendMode === 'off') return;
  for (let slot = 0; slot < 2; slot++) {
    const owner = w.players[slot];
    const id = w.friendIds[slot];
    if (!owner || !id) continue;
    let e = w.friends[slot];

    if (w.friendMode === 'sidekick') {
      if (!e && w.phase !== 'entry') e = spawnFriend(w, slot, id);
      if (!e) continue;
      if (e.state === 'ko') {
        // floored for good — count down and get back up beside the player, at partial health
        if (++e.pt >= SIDEKICK_REVIVE && owner.state !== 'ko') {
          e.hp = Math.round(e.maxHp * 0.6); e.invuln = 90; e.pt = 0;
          e.x = owner.x - owner.facing * 50; e.y = owner.y;
          setState(e, 'getup');
          w.emit({ type: 'heal', x: e.x, y: e.y, id: e.id });
        }
        stepHero(w, e, { held: 0, pressed: 0 });
        continue;
      }
      stepHero(w, e, frame(e, isHurt(e) ? 0 : fightInput(w, e, true)));
      if (e.regenLock === 0 && (e.state === 'idle' || e.state === 'walk') && e.hp < e.maxHp) e.hp = Math.min(e.maxHp, e.hp + e.maxHp * 0.0006);
      continue;
    }

    // assist
    if (w.assistCd[slot] > 0 && !e) w.assistCd[slot]--;
    if (!e) {
      const want = !!(inputs[slot].pressed & BTN.ASSIST);
      if (want && w.assistCd[slot] === 0 && owner.state !== 'ko' && w.phase !== 'entry') {
        e = spawnFriend(w, slot, id);
        e.pphase = 0; e.pt = 0;
      } else continue;
    }
    e.invuln = Math.max(e.invuln, 2); // a visiting friend is never hurt
    e.pt++;
    const target = nearestEnemy(w, e);
    let held = 0;
    if (e.pphase === 0) {
      // close in; throw the special as soon as someone is in reach, or after a beat regardless
      const near = target && Math.abs(target.x - e.x) <= 90 && Math.abs(target.y - e.y) <= 16;
      held = target ? fightInput(w, e, true) & (BTN.LEFT | BTN.RIGHT | BTN.UP | BTN.DOWN) : 0;
      if (near || e.pt >= ASSIST_APPROACH) { e.meter = METER_MAX; held = BTN.SPECIAL; e.pphase = 1; e.pt = 0; }
    } else if (e.pphase === 1) {
      // waiting for the special to start: keep the meter full and tap again until it takes
      if (e.state === 'special') { e.pphase = 2; e.pt = 0; }
      else { e.meter = METER_MAX; held = e.pt % 2 ? BTN.SPECIAL : 0; if (e.pt > 30) { e.pphase = 3; e.pt = 0; } }
    } else if (e.pphase === 2) {
      if (e.state !== 'special') { e.pphase = 3; e.pt = 0; }
    } else {
      // leave: run back the way the player is not facing, then vanish
      held = owner.facing > 0 ? BTN.LEFT : BTN.RIGHT;
      if (e.pt >= ASSIST_LINGER || isDown(e)) { w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id }); retire(w, slot, e); w.assistCd[slot] = ASSIST_COOLDOWN; continue; }
    }
    stepHero(w, e, frame(e, held));
  }
}

/** 0..1 readiness of each player's assist call for the HUD (1 = ready; sidekicks read as 1 while up). */
export function assistReadiness(w: World): [number, number] {
  const out: [number, number] = [0, 0];
  for (let slot = 0; slot < 2; slot++) {
    if (w.friendMode === 'off' || !w.friendIds[slot]) { out[slot] = 0; continue; }
    if (w.friendMode === 'sidekick') { const f = w.friends[slot]; out[slot] = f && f.state !== 'ko' ? 1 : 0; continue; }
    out[slot] = w.friends[slot] ? 0 : 1 - w.assistCd[slot] / ASSIST_COOLDOWN;
  }
  return out;
}
