// Reference bot: plays a hero slot with simple heuristics. Used by the campaign tests and as an
// optional AI teammate. Deterministic given the world state.
import { BTN, type InputFrame } from './input';
import { METER_MAX } from './frameData';
import { LANE_TOL, type Entity } from './types';
import type { World } from './world';

export interface BotState { prevHeld: number; jitter: number }
export function makeBot(): BotState { return { prevHeld: 0, jitter: 0 }; }

export function botInput(w: World, slot: number, bs: BotState): InputFrame {
  const me = w.players[slot];
  const out = (held: number): InputFrame => { const pressed = held & ~bs.prevHeld; bs.prevHeld = held; return { held, pressed }; };
  if (!me || me.state === 'ko') return out(0);
  // a dialog scene: keep a button held and the scene skips itself (dialog.ts HOLD_SKIP_TICKS)
  if (w.dialog) return out(BTN.LIGHT);
  const foes = w.entities.filter((e) => !e.dead && e.hp > 0 && (e.kind === 'enemy' || e.kind === 'boss' || e.kind === 'echo'));
  let held = 0;
  if (w.phase === 'go' || (w.phase === 'wave' && foes.length === 0)) {
    // walk right toward the next segment
    held |= BTN.RIGHT;
    if (me.y > 70) held |= BTN.UP; else if (me.y < 50) held |= BTN.DOWN;
    return out(held);
  }
  if (!foes.length) return out(0);
  // nearest foe, bosses preferred when close
  let target: Entity = foes[0], best = Infinity;
  for (const f of foes) { const d = Math.hypot(f.x - me.x, (f.y - me.y) * 2) - (f.kind === 'boss' ? 40 : 0); if (d < best) { best = d; target = f; } }
  const dx = target.x - me.x, dy = target.y - me.y;
  const range = target.kind === 'boss' ? 95 : 52;
  // dodge boss telegraphs: when a boss is telegraphing and we're in its lane, change lane / dash
  const bossTele = target.kind !== 'enemy' && target.pattern >= 0 && target.pphase === 0 && target.pt > 8;
  // Telegraphed blasts, orbiting damage-over-time orbs (Monk Zero et al.), and standing walls all
  // deal continuous or delayed contact damage that a melee-approach bot would otherwise walk straight into.
  const danger = w.entities.some((h) => h.kind === 'hazard' && !h.dead && (h.arch === 'blast' || h.arch === 'orb' || h.arch === 'wall') && Math.hypot(h.x - me.x, (h.y - me.y) * 1.6) < 95);
  const incomingRing = w.entities.some((h) => h.kind === 'hazard' && !h.dead && h.arch === 'ring' && Math.abs(Math.hypot(h.x - me.x, (h.y - me.y) * 1.6) - h.scale) < 40);
  const st = me.state;
  const canAct = st === 'idle' || st === 'walk'; // guarantees a pressed edge is actually consumed this tick
  if (incomingRing && st !== 'dash' && canAct) return out(BTN.DASH | (dx > 0 ? BTN.LEFT : BTN.RIGHT));
  if (danger) { held |= me.y > 60 ? BTN.UP : BTN.DOWN; held |= dx > 0 ? BTN.LEFT : BTN.RIGHT; return out(held); }
  if (bossTele && Math.abs(dy) <= LANE_TOL + 10) {
    held |= me.y > 60 ? BTN.UP : BTN.DOWN;
    if (canAct && Math.abs(dx) < 140 && (w.tick % 30 === 0)) held |= BTN.DASH | (dx > 0 ? BTN.LEFT : BTN.RIGHT);
    return out(held);
  }
  // special when meter full and enemies are near — only requested from an actionable state, so the
  // press always lands on this exact tick (meter resets to 0 immediately); never held across ticks,
  // which would otherwise starve the edge detector and freeze the hero holding an unconsumed input.
  const near = foes.filter((f) => Math.hypot(f.x - me.x, (f.y - me.y) * 1.6) < 150).length;
  if (canAct && me.meter >= METER_MAX && (near >= 2 || target.kind === 'boss') && Math.abs(dx) < 140 && Math.abs(dy) <= LANE_TOL + 6) {
    return out(BTN.SPECIAL);
  }
  // align lane
  if (Math.abs(dy) > LANE_TOL - 4) held |= dy > 0 ? BTN.DOWN : BTN.UP;
  // approach
  if (Math.abs(dx) > range) {
    held |= dx > 0 ? BTN.RIGHT : BTN.LEFT;
    if (canAct && Math.abs(dx) > 260 && w.tick % 20 === 0) held |= BTN.DASH;
    return out(held);
  }
  // face the target
  if ((dx > 0 && me.facing !== 1) || (dx < 0 && me.facing !== -1)) held |= dx > 0 ? BTN.RIGHT : BTN.LEFT;
  // attack rhythm: press light on alternating ticks while idle/walk or during cancel windows
  const guardedTarget = target.kind === 'enemy' && target.guard;
  if (canAct) {
    // guard blocks ordinary hits (light/heavy alike) — chain lights into the light3 finisher, which
    // is flagged knockdown and breaks guard, rather than spamming a heavy that will just get chip-blocked
    if (guardedTarget) held |= BTN.LIGHT;
    else if (w.tick % 9 === 0) held |= BTN.HEAVY; else held |= BTN.LIGHT;
  } else if ((st === 'light1' || st === 'light2') && me.st >= 6) {
    held |= BTN.LIGHT; // continue the chain toward light3
  } else if (st === 'dash' && me.st >= 4) held |= BTN.LIGHT;
  return out(held);
}
