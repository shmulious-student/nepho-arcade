import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { makeBot, botInput } from '../src/sim/bot';
import { BTN, type InputFrame } from '../src/sim/input';
import { ASSIST_COOLDOWN } from '../src/sim/friends';

const NONE: InputFrame = { held: 0, pressed: 0 };
const friendsOf = (w: World) => w.entities.filter((e) => e.kind === 'hero' && e.slot < 0);

function runUntil(w: World, pred: () => boolean, max: number, input: (t: number) => InputFrame = () => NONE): number {
  let t = 0;
  while (!pred() && t < max) { w.step([input(t), NONE]); t++; }
  return t;
}

describe('friends', () => {
  it('a friend can never be one of the players', () => {
    const w = new World({ seed: 1, level: 1, heroes: ['eviatar', 'omri'], friends: { friends: ['omri', 'eviatar'], mode: 'sidekick' } });
    expect(w.friendIds).toEqual([null, null]);
  });

  it('sidekick: joins once the level starts, fights as slot -1, and is not a player', () => {
    const w = new World({ seed: 3, level: 1, heroes: ['eviatar', null], friends: { friends: ['omri', null], mode: 'sidekick' } });
    runUntil(w, () => friendsOf(w).length > 0, 60 * 20);
    const f = friendsOf(w)[0];
    expect(f).toBeTruthy();
    expect(f.arch).toBe('omri');
    expect(f.slot).toBe(-1);
    expect(w.heroes()).not.toContain(f);
    expect(w.allies()).toContain(f);
    // it actually attacks: at some point it is mid-move
    const moved = runUntil(w, () => ['light1', 'light2', 'light3', 'heavy', 'special'].includes(f.state), 60 * 30);
    expect(f.state, `sidekick never attacked in ${moved} ticks`).toMatch(/light|heavy|special/);
    expect(w.snapshot().assist[0]).toBe(1);
  });

  it('sidekick: the game is not lost while the player stands, even if the friend is floored', () => {
    const w = new World({ seed: 3, level: 1, heroes: ['eviatar', null], friends: { friends: ['omri', null], mode: 'sidekick' } });
    runUntil(w, () => friendsOf(w).length > 0, 60 * 20);
    const f = friendsOf(w)[0];
    f.hp = 0; f.state = 'ko'; f.st = 0;
    w.step([NONE, NONE]);
    expect(w.isFinished()).toBe(false);
    expect(w.snapshot().assist[0]).toBe(0);
  });

  it('assist: the call summons the friend, they throw their special, leave, and the cooldown runs', () => {
    const w = new World({ seed: 5, level: 1, heroes: ['eviatar', null], friends: { friends: ['nepho', null], mode: 'assist' } });
    runUntil(w, () => w.phase !== 'entry', 60 * 20);
    expect(friendsOf(w).length).toBe(0);
    expect(w.snapshot().assist[0]).toBe(1);
    w.step([{ held: BTN.ASSIST, pressed: BTN.ASSIST }, NONE]);
    const f = friendsOf(w)[0];
    expect(f?.arch).toBe('nepho');
    let sawSpecial = false;
    const t = runUntil(w, () => { if (f.state === 'special') sawSpecial = true; return friendsOf(w).length === 0; }, 60 * 10);
    expect(sawSpecial, 'assist friend never used their special').toBe(true);
    expect(t).toBeLessThan(60 * 10);
    expect(w.assistCd[0]).toBeGreaterThanOrEqual(ASSIST_COOLDOWN - 1);
    expect(w.snapshot().assist[0]).toBeLessThan(0.01);
    // a second call during cooldown does nothing; after it, it works again
    w.step([{ held: BTN.ASSIST, pressed: BTN.ASSIST }, NONE]);
    expect(friendsOf(w).length).toBe(0);
    runUntil(w, () => w.assistCd[0] === 0, ASSIST_COOLDOWN + 5);
    w.step([{ held: BTN.ASSIST, pressed: BTN.ASSIST }, NONE]);
    expect(friendsOf(w).length).toBe(1);
  });

  it('a level is still winnable with a sidekick along (bot player)', () => {
    const w = new World({ seed: 9001, level: 1, heroes: ['omri', null], friends: { friends: ['nepho', null], mode: 'sidekick' } });
    const b = makeBot();
    let t = 0;
    while (!w.isFinished() && t < 60 * 60 * 6) { w.step([botInput(w, 0, b), NONE]); t++; }
    expect(w.result).toBe('victory');
  });
});

describe('sidekick balance', () => {
  it('a sidekick hits for less and never launches or floors with a normal hit', () => {
    const w = new World({ seed: 11, level: 1, heroes: ['eviatar', null], friends: { friends: ['nepho', null], mode: 'sidekick' } });
    runUntil(w, () => friendsOf(w).length > 0, 60 * 20);
    const f = friendsOf(w)[0];
    // count launch events on enemies while the sidekick swings for a while with the player idle
    // (a kill also sends an enemy flying, but that is not a 'launch' event)
    let launched = 0, hits = 0;
    for (let t = 0; t < 60 * 40; t++) {
      w.step([NONE, NONE]);
      for (const ev of w.events) {
        if (ev.type === 'hit' && ev.id !== w.players[0]!.id && ev.id !== f.id) hits++;
        if (ev.type === 'launch') launched++;
      }
    }
    expect(hits).toBeGreaterThan(0);
    // heavies alone can't launch anymore; only the special (rare, needs a crowd) could
    expect(launched).toBeLessThanOrEqual(2);
  });
});
