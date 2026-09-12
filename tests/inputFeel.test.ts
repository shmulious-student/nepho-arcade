import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { LocalSession } from '../src/net/session';
import { BTN, type InputFrame } from '../src/sim/input';
import { makeEntity } from '../src/sim/entity';
import { ENEMY_DEFS } from '../src/sim/enemyAi';

const NONE: InputFrame = { held: 0, pressed: 0 };
const press = (b: number): InputFrame => ({ held: b, pressed: b });
const hold = (b: number): InputFrame => ({ held: b, pressed: 0 });

function world(seed = 1) {
  const w = new World({ seed, level: 1, heroes: ['eviatar', null] });
  while (w.phase === 'entry') w.step([NONE, NONE]);
  return w;
}
function addEnemy(w: World, x: number, y: number, hp = 9999) {
  const e = makeEntity(9000 + x, 'enemy', 'punk', x, y, hp);
  e.cooldown = 9999;
  w.entities.push(e);
  return e;
}

describe('input feel', () => {
  it('a tap sampled on a frame that steps no tick is not lost, and one that steps two ticks starts only one attack', () => {
    const s = new LocalSession(1, 1, ['eviatar', null]);
    const w = s.world();
    while (w.phase === 'entry') s.update(1000 / 60);
    // 120Hz display: the press lands on a frame that accumulates less than a tick
    s.setInput(0, press(BTN.LIGHT)); s.update(8);
    expect(w.players[0]!.state).not.toBe('light1');
    s.setInput(0, hold(BTN.LIGHT)); s.update(9); // now a tick runs, with the earlier edge still queued
    expect(w.players[0]!.state).toBe('light1');
    // a long frame: two ticks from one press must not turn into light1 + a buffered light2
    let t = 0;
    while (w.players[0]!.state === 'light1' && t++ < 30) { s.setInput(0, NONE); s.update(1000 / 60); }
    expect(w.players[0]!.state).toBe('idle');
    s.setInput(0, press(BTN.LIGHT)); s.update(2 * 1000 / 60 + 1);
    expect(w.players[0]!.state).toBe('light1');
    expect(w.players[0]!.pdata & BTN.LIGHT).toBe(0);
  });

  it('a tap during hitstop lands the moment the hero can act again', () => {
    const w = world();
    const h = w.players[0]!;
    addEnemy(w, h.x + 45, h.y);
    w.step([press(BTN.LIGHT), NONE]);
    let t = 0;
    while (h.hitstop === 0 && t++ < 20) w.step([NONE, NONE]);
    expect(h.hitstop).toBeGreaterThan(0);
    w.step([press(BTN.LIGHT), NONE]); // pressed while frozen
    expect(h.pdata & BTN.LIGHT).toBe(BTN.LIGHT);
    let chained = false;
    for (let i = 0; i < 30 && !chained; i++) { w.step([NONE, NONE]); chained = h.state === 'light2'; }
    expect(chained).toBe(true);
  });

  it('mashing light lands all three hits of the chain', () => {
    const w = world();
    const h = w.players[0]!;
    const punk = addEnemy(w, h.x + 40, h.y);
    let hits = 0;
    for (let t = 0; t < 70; t++) {
      w.step([t % 4 === 0 ? press(BTN.LIGHT) : NONE, NONE]);
      for (const ev of w.events) if (ev.type === 'hit' && ev.id === punk.id) hits++;
    }
    expect(hits).toBeGreaterThanOrEqual(3);
  });

  it('jump pressed during an attack starts the moment the attack ends', () => {
    const w = world();
    const h = w.players[0]!;
    w.step([press(BTN.LIGHT), NONE]);
    expect(h.state).toBe('light1');
    w.step([press(BTN.JUMP), NONE]);
    let jumped = false;
    for (let i = 0; i < 20 && !jumped; i++) { w.step([NONE, NONE]); jumped = h.state === 'jump'; }
    expect(jumped).toBe(true);
  });

  it('light into heavy: a heavy tapped mid-chain comes out after the light hit frames', () => {
    const w = world();
    const h = w.players[0]!;
    w.step([press(BTN.LIGHT), NONE]);
    w.step([press(BTN.HEAVY), NONE]);
    let t = 1;
    while (h.state === 'light1' && t++ < 20) w.step([NONE, NONE]);
    expect(h.state).toBe('heavy');
    expect(t).toBeLessThan(10);
  });

  it('taps while guarding do not fire when the guard is released', () => {
    const w = world();
    const h = w.players[0]!;
    w.step([hold(BTN.BLOCK), NONE]);
    expect(h.state).toBe('block');
    w.step([{ held: BTN.BLOCK | BTN.LIGHT, pressed: BTN.LIGHT }, NONE]);
    w.step([NONE, NONE]); w.step([NONE, NONE]);
    expect(h.state).toBe('idle');
  });
});
