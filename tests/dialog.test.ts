import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { BTN, type InputFrame } from '../src/sim/input';
import { ENTRY_TICKS, LEVELS, levelDef } from '../src/sim/levels';
import { DIALOGS, dialogFor, resolveLines, revealTicks, fillNames, HOLD_SKIP_TICKS, MIN_PAGE_TICKS, AUTO_ADVANCE_TICKS } from '../src/sim/dialogs';
import { encodeSnapshot, decodeSnapshot } from '../src/net/codec';
import { HERO_IDS } from '../src/sim/frameData';

const NONE: InputFrame = { held: 0, pressed: 0 };
const TAP: InputFrame = { held: BTN.LIGHT, pressed: BTN.LIGHT };
const HOLD: InputFrame = { held: BTN.LIGHT, pressed: 0 };
const step = (w: World, i: InputFrame = NONE, n = 1) => { for (let k = 0; k < n; k++) w.step([i, NONE]); };
const stage = (w: World) => w.entities.find((e) => e.kind === 'hero' && e.slot < 0 && !e.dead);

describe('dialog scripts', () => {
  it('every level has an opening and a closing scene, every page fits two lines, every speaker exists', () => {
    for (const l of LEVELS) {
      const d = DIALOGS[l.id];
      expect(d, `${l.id} has no script`).toBeTruthy();
      const defs = [d.start, d.end, d.boss, ...Object.values(d.afterWave ?? {})].filter(Boolean);
      for (const def of defs) {
        expect(HERO_IDS).toContain(def!.hero);
        for (const line of [...def!.lines, ...(def!.swapLines ?? [])]) {
          expect(line.en.length, `${l.id}: "${line.en.slice(0, 30)}…"`).toBeLessThanOrEqual(150);
          expect(line.he.length, `${l.id}: "${line.he.slice(0, 30)}…"`).toBeLessThanOrEqual(125);
          if (line.who !== 'boss' && line.who !== 'player' && line.who !== 'pitz') expect(line.who, `${l.id}: a hero line must be spoken by the hero on stage`).toBe(def!.hero);
        }
        if (def!.ifPlayed === 'swap') expect(def!.swapLines?.some((x) => x.en.includes('{new}')), `${l.id}: swap lines must name the stand-in`).toBe(true);
      }
    }
  });
  it('resolves player lines only when another player is there, and fills names', () => {
    const def = dialogFor('rishon', 'start')!;
    expect(resolveLines(def, false, ['eviatar', null]).some((l) => l.who === 'player')).toBe(true);
    expect(resolveLines(def, false, ['shmuel', null]).some((l) => l.who === 'player')).toBe(false);
    expect(fillNames('{new} takes it from {old}', 'en', { new: 'noa', old: 'eviatar' })).toBe('Noa takes it from Eviatar');
    expect(fillNames('{new}', 'he', { new: 'savta-orly' })).toBe('סבתא אורלי');
  });
});

describe('dialog scene', () => {
  it('opens after the title card: the hero walks in from the right, the players wait, pages turn on a press or by themselves, and the wave starts after', () => {
    const w = new World({ seed: 7, level: 1, heroes: ['eviatar', null] });
    step(w, NONE, ENTRY_TICKS);
    expect(w.dialog?.key).toBe('start');
    expect(w.dialog?.stage).toBe('enter');
    const s = stage(w)!;
    expect(s.arch).toBe('shmuel');
    expect(s.x).toBeGreaterThan(w.players[0]!.x + 300);
    // the player cannot move while the scene runs
    const x0 = w.players[0]!.x;
    step(w, { held: BTN.RIGHT, pressed: 0 }, 30);
    expect(w.players[0]!.x).toBe(x0);
    let t = 0;
    while (w.dialog?.stage === 'enter' && t++ < 400) step(w);
    expect(w.dialog?.stage).toBe('talk');
    expect(s.x).toBeLessThan(w.players[0]!.x + 120);
    expect(s.facing).toBe(-1);
    expect(w.players[0]!.facing).toBe(1);
    expect(w.snapshot().dialog).toEqual({ key: 'start', page: 0, tick: 0, stage: 1 });
    // a press while typing finishes the page; the next press turns it
    const line = w.dialog!.lines[0];
    step(w, NONE, MIN_PAGE_TICKS + 1);
    step(w, TAP);
    expect(w.dialog!.page).toBe(0);
    expect(w.dialog!.tick).toBeGreaterThanOrEqual(revealTicks(line));
    step(w, NONE, 2);
    step(w, TAP);
    expect(w.dialog!.page).toBe(1);
    // left alone, a page turns on its own once it is typed out
    step(w, NONE, revealTicks(w.dialog!.lines[1]) + AUTO_ADVANCE_TICKS + 2);
    expect(w.dialog!.page).toBe(2);
    // …through to the end: the hero runs off and the first wave starts
    t = 0;
    while (w.dialog && t++ < 6000) step(w);
    expect(w.dialog).toBeNull();
    expect(stage(w)).toBeUndefined();
    expect(w.phase).toBe('wave');
    expect(w.dialogsPlayed.has('start')).toBe(true);
  });

  it('holding a button skips the whole scene', () => {
    const w = new World({ seed: 7, level: 1, heroes: ['eviatar', null] });
    step(w, NONE, ENTRY_TICKS);
    let t = 0;
    while (w.dialog?.stage === 'enter' && t++ < 400) step(w);
    step(w, HOLD, HOLD_SKIP_TICKS + 1);
    expect(w.dialog?.stage ?? 'gone').not.toBe('talk');
    t = 0;
    while (w.dialog && t++ < 600) step(w);
    expect(w.phase).toBe('wave');
  });

  it('the boss only walks in after the boss-entrance scene, and a hero who joins stays as an ally', () => {
    const w = new World({ seed: 9, level: 1, heroes: ['eviatar', null] });
    step(w, NONE, ENTRY_TICKS);
    let t = 0;
    while (w.dialog && t++ < 6000) step(w, HOLD);
    w.debugSkipToBoss(); // arrives at the boss spot: the scene plays first
    expect(w.dialog?.key).toBe('boss');
    expect(w.boss()).toBeUndefined();
    t = 0;
    while (w.dialog && t++ < 6000) step(w, HOLD);
    expect(w.phase).toBe('boss');
    expect(w.boss()).toBeTruthy();
    expect(w.guests.length).toBe(1);
    expect(w.guests[0].arch).toBe('shmuel');
    expect(w.allies()).toContain(w.guests[0]);
  });

  it('a played hero speaks in place; a swap level hands the player a stand-in and the lobby pick comes back', () => {
    const keep = new World({ seed: 3, level: 1, heroes: ['shmuel', null] });
    step(keep, NONE, ENTRY_TICKS + 1);
    expect(keep.dialog?.origin).toBe('player');
    expect(keep.dialog?.stage).toBe('talk');
    expect(stage(keep)).toBeUndefined();
    expect(keep.dialog?.lines.some((l) => l.who === 'player')).toBe(false);

    const swapLevel = LEVELS.find((l) => DIALOGS[l.id].start.ifPlayed === 'swap')!;
    const hero = DIALOGS[swapLevel.id].start.hero;
    const w = new World({ seed: 3, level: swapLevel.index, heroes: [hero, null] });
    expect(w.swap?.from).toBe(hero);
    expect(w.players[0]!.arch).not.toBe(hero);
    expect(w.players[0]!.arch).toBe(w.swap!.to);
    expect(w.chosenHeroes).toEqual([hero, null]);
    expect(w.snapshot().swap).toEqual([hero, w.swap!.to]);
    step(w, NONE, ENTRY_TICKS + 1);
    expect(w.dialog?.lines).toEqual(DIALOGS[swapLevel.id].start.swapLines);
    const other = new World({ seed: 3, level: swapLevel.index, heroes: ['noa', null] });
    expect(other.swap).toBeNull();
  });

  it('the closing scene plays once the boss is down, then the level completes', () => {
    const w = new World({ seed: 4, level: 1, heroes: ['eviatar', null] });
    step(w, NONE, ENTRY_TICKS);
    let t = 0;
    while (w.dialog && t++ < 6000) step(w, HOLD);
    w.bossDefeated = true;
    w.setPhase('boss');
    t = 0;
    while (w.phase !== 'clear' && t++ < 200) step(w);
    t = 0;
    while (!w.dialog && t++ < 200) step(w);
    expect(w.dialog?.key).toBe('end');
    expect(w.isFinished()).toBe(false);
    t = 0;
    while (w.dialog && t++ < 6000) step(w, HOLD);
    t = 0;
    while (!w.isFinished() && t++ < 400) step(w);
    expect(w.isFinished()).toBe(true);
    expect(w.result).toBe('victory');
  });

  it('a world without dialogs never plays one', () => {
    const w = new World({ seed: 4, level: 1, heroes: ['eviatar', null], dialogs: false });
    step(w, NONE, ENTRY_TICKS + 5);
    expect(w.dialog).toBeNull();
    expect(w.phase).toBe('wave');
  });

  it('the dialog page and the swap survive the wire format', () => {
    const w = new World({ seed: 3, level: LEVELS.find((l) => DIALOGS[l.id].start.ifPlayed === 'swap')!.index, heroes: [DIALOGS[levelDef(3).id].start.hero, null] });
    step(w, NONE, ENTRY_TICKS + 40);
    const s = w.snapshot();
    const back = decodeSnapshot(encodeSnapshot(s));
    expect(back.dialog).toEqual(s.dialog);
    expect(back.swap).toEqual(s.swap);
    const plain = decodeSnapshot(encodeSnapshot(new World({ seed: 1, level: 1, heroes: ['eviatar', null] }).snapshot()));
    expect(plain.dialog).toBeNull();
    expect(plain.swap).toBeNull();
  });
});
