// The dialog scene, run inside the sim so every player (host and LAN guest alike) sees the same
// thing on the same tick: the players are frozen, the level's hero walks in from the right and stops
// in front of them, and the script (dialogs.ts) plays page by page in the renderer's text box. A
// press (light / heavy / jump / special / dash) finishes typing the page or turns it; a page turns on
// its own after a while; holding a button skips the scene. When the last page is done the hero runs
// off to the right, or stays and fights beside the players when the script says `join`.
//
// Who does the talking on stage: normally a fresh hero entity (slot -1, like a friend). If a player
// already picked that hero, their own hero says the lines from where they stand (`ifPlayed: keep`) —
// or, for an opening scene marked `ifPlayed: swap`, that player was handed a random other hero when
// the world was built and the script explains it. A live sidekick or an earlier `join` guest of the
// same hero is borrowed rather than duplicated.
import { BTN, type InputFrame } from './input';
import { HEROES } from './frameData';
import { LANE_H, VISIBLE_X0, VISIBLE_W, HERO_EDGE, type Entity, type HeroId } from './types';
import { makeEntity, setState, isHurt } from './entity';
import { stepHero, clampHero } from './fighter';
import { fightInput, frameFor } from './friends';
import { levelDef } from './levels';
import { dialogFor, resolveLines, revealTicks, AUTO_ADVANCE_TICKS, HOLD_SKIP_TICKS, MIN_PAGE_TICKS, type DialogDef, type DialogKey, type DialogLine } from './dialogs';
import type { World } from './world';

export type DialogStage = 'enter' | 'talk' | 'leave';

export interface DialogState {
  key: DialogKey;
  def: DialogDef;
  lines: DialogLine[];
  stage: DialogStage;
  page: number;
  tick: number; // ticks into the current page (talk) / stage (enter, leave)
  hold: number; // consecutive ticks a button has been held during talk
  speaker: Entity | null; // the hero on stage; null when a player's own hero speaks in place
  origin: 'new' | 'friend' | 'guest' | 'player';
  tx: number; ty: number; // where the speaker stands
}

const PRESS = BTN.LIGHT | BTN.HEAVY | BTN.JUMP | BTN.SPECIAL | BTN.DASH | BTN.ASSIST;
const ENTER_TIMEOUT = 300; // ticks before a straggling speaker is simply placed on the mark
const SIDEKICK_REVIVE = 240;

/** Starts the dialog `key` for the current level if it exists and has not played yet. */
export function tryDialog(w: World, key: DialogKey): boolean {
  if (!w.dialogsEnabled || w.dialog || w.dialogsPlayed.has(key)) return false;
  const def = dialogFor(levelDef(w.level).id, key);
  if (!def) return false;
  beginDialog(w, key, def);
  return true;
}

function beginDialog(w: World, key: DialogKey, def: DialogDef): void {
  w.dialogsPlayed.add(key);
  const players = w.heroes();
  for (const h of players) clampHero(w, h); // the mark is set from where the players stand on screen
  const swapped = key === 'start' && !!w.swap;
  const lines = resolveLines(def, swapped, w.players.map((p) => p?.arch ?? null));
  if (!lines.length) return;
  const maxX = Math.max(...players.map((p) => p.x));
  const avgY = players.reduce((s, p) => s + p.y, 0) / players.length;
  const tx = Math.min(maxX + 100, w.cameraX + VISIBLE_X0 + VISIBLE_W - HERO_EDGE - 6);
  const ty = Math.max(8, Math.min(LANE_H - 8, avgY));
  let speaker: Entity | null = null;
  let origin: DialogState['origin'] = 'new';
  if (players.some((p) => p.arch === def.hero)) {
    origin = 'player';
  } else {
    const friend = w.friendMode === 'sidekick' ? w.friends.find((f): f is Entity => !!f && f.arch === def.hero && f.state !== 'ko') : undefined;
    const guest = w.guests.find((g) => g.arch === def.hero && g.state !== 'ko');
    if (friend) { speaker = friend; origin = 'friend'; }
    else if (guest) { speaker = guest; origin = 'guest'; w.guests = w.guests.filter((g) => g !== guest); }
    else {
      const hero = HEROES[def.hero];
      speaker = makeEntity(w.nextEntityId(), 'hero', def.hero, w.cameraX + VISIBLE_X0 + VISIBLE_W + 70, ty, hero.hp); // just past the visible band's right edge
      speaker.slot = -1;
      speaker.facing = -1;
      w.entities.push(speaker);
    }
  }
  w.dialog = { key, def, lines, stage: origin === 'player' ? 'talk' : 'enter', page: 0, tick: 0, hold: 0, speaker, origin, tx, ty };
  w.emit({ type: 'levelPhase', x: 0, y: 0, a: 200 });
}

/** Moves the speaker toward (tx, ty) on foot; true once there. Done by hand rather than through the
 * hero state machine so the walk starts off-screen (the band clamp would snap it to the edge). */
function walkTo(e: Entity, tx: number, ty: number, speed: number): boolean {
  const dx = tx - e.x, dy = ty - e.y;
  if (Math.abs(dx) <= speed && Math.abs(dy) <= speed) { e.x = tx; e.y = ty; return true; }
  if (Math.abs(dx) > speed) { e.x += Math.sign(dx) * speed; e.facing = dx > 0 ? 1 : -1; } else e.x = tx;
  if (Math.abs(dy) > speed * 0.6) e.y += Math.sign(dy) * speed * 0.6; else e.y = ty;
  if (e.state !== 'walk') setState(e, 'walk');
  e.st++;
  e.invuln = 2;
  return false;
}

export function stepDialog(w: World, inputs: [InputFrame, InputFrame]): void {
  const d = w.dialog!;
  const players = w.heroes();
  d.tick++;
  // the players hold still and face the speaker
  for (const h of players) {
    stepHero(w, h, { held: 0, pressed: 0 });
    if (d.speaker && (h.state === 'idle' || h.state === 'walk')) h.facing = d.speaker.x >= h.x ? 1 : -1;
  }
  const s = d.speaker;
  if (d.stage === 'enter') {
    const speed = HEROES[s!.arch as HeroId].speed * 1.6;
    if (walkTo(s!, d.tx, d.ty, speed) || d.tick > ENTER_TIMEOUT) {
      s!.x = d.tx; s!.y = d.ty; s!.facing = -1; setState(s!, 'idle');
      d.stage = 'talk'; d.page = 0; d.tick = 0; d.hold = 0;
    }
    return;
  }
  if (d.stage === 'talk') {
    if (s) { s.st++; s.invuln = 2; if (s.state !== 'idle') setState(s, 'idle'); }
    const line = d.lines[d.page];
    const reveal = revealTicks(line);
    const pressed = (inputs[0].pressed | inputs[1].pressed) & PRESS;
    const held = (inputs[0].held | inputs[1].held) & PRESS;
    d.hold = held ? d.hold + 1 : 0;
    if (d.hold >= HOLD_SKIP_TICKS) { endTalk(w, d); return; }
    if (pressed && d.tick >= MIN_PAGE_TICKS) {
      if (d.tick < reveal) d.tick = reveal; // finish typing
      else { d.page++; d.tick = 0; }
    } else if (d.tick >= reveal + AUTO_ADVANCE_TICKS) { d.page++; d.tick = 0; }
    if (d.page >= d.lines.length) endTalk(w, d);
    return;
  }
  // leave: run off to the right, then vanish
  if (!s) { finish(w, d); return; }
  const speed = HEROES[s.arch as HeroId].speed * 2;
  const gone = w.cameraX + VISIBLE_X0 + VISIBLE_W + 80;
  walkTo(s, gone + 10, s.y, speed);
  if (s.x >= gone || d.tick > ENTER_TIMEOUT) {
    s.dead = true; s.removeAt = w.tick + 1;
    finish(w, d);
  }
}

function endTalk(w: World, d: DialogState): void {
  const s = d.speaker;
  d.page = d.lines.length;
  if (!s) { finish(w, d); return; }
  if (d.origin === 'friend') { finish(w, d); return; } // a borrowed sidekick goes back to its duty
  if (d.def.join || d.origin === 'guest') {
    // stays for the rest of the level as an AI ally
    s.owner = w.players[0]!.id; s.pattern = 0; s.aiT = 0; s.pt = 0;
    setState(s, 'idle');
    w.guests.push(s);
    finish(w, d);
    return;
  }
  d.stage = 'leave'; d.tick = 0;
  setState(s, 'walk');
  w.emit({ type: 'dash', x: s.x, y: s.y, id: s.id });
}

function finish(w: World, d: DialogState): void {
  void d;
  w.dialog = null;
  w.emit({ type: 'levelPhase', x: 0, y: 0, a: 201 });
}

/** Heroes who joined after a dialog fight beside player 1 like a sidekick and get back up when floored. */
export function stepGuests(w: World): void {
  const owner = w.players[0];
  for (const g of w.guests) {
    if (g.dead) continue;
    if (!owner) { stepHero(w, g, { held: 0, pressed: 0 }); continue; }
    if (g.state === 'ko') {
      if (++g.pt >= SIDEKICK_REVIVE && owner.state !== 'ko') {
        g.hp = Math.round(g.maxHp * 0.6); g.invuln = 90; g.pt = 0;
        g.x = owner.x - owner.facing * 50; g.y = owner.y;
        setState(g, 'getup');
        w.emit({ type: 'heal', x: g.x, y: g.y, id: g.id });
      }
      stepHero(w, g, { held: 0, pressed: 0 });
      continue;
    }
    stepHero(w, g, frameFor(g, isHurt(g) ? 0 : (w.dialog ? 0 : fightInput(w, g, true))));
    if (g.regenLock === 0 && (g.state === 'idle' || g.state === 'walk') && g.hp < g.maxHp) g.hp = Math.min(g.maxHp, g.hp + g.maxHp * 0.0006);
  }
}
