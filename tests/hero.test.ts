import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { BTN, type InputFrame } from '../src/sim/input';
import { VISIBLE_X0, VISIBLE_W, LANE_H } from '../src/sim/types';
import { makeEntity } from '../src/sim/entity';
import { ENEMY_DEFS } from '../src/sim/enemyAi';

const NONE: InputFrame = { held: 0, pressed: 0 };
const press = (b: number): InputFrame => ({ held: b, pressed: b });
const hold = (b: number): InputFrame => ({ held: b, pressed: 0 });

function world(seed = 1) {
  const w = new World({ seed, level: 1, heroes: ['eviatar', null] });
  // skip the entry cinematic so the hero can act
  while (w.phase === 'entry') w.step([NONE, NONE]);
  return w;
}
function addEnemy(w: World, x: number, y: number) {
  const e = makeEntity(9000 + x, 'enemy', 'punk', x, y, ENEMY_DEFS.punk.hp);
  e.cooldown = 9999; // never attacks; it is a target
  w.entities.push(e);
  return e;
}

describe('hero', () => {
  it('can never leave the visible band of the zoomed view', () => {
    const w = world();
    const h = w.players[0]!;
    for (let i = 0; i < 400; i++) w.step([hold(BTN.LEFT), NONE]);
    expect(h.x).toBeGreaterThanOrEqual(w.cameraX + VISIBLE_X0);
    for (let i = 0; i < 800; i++) w.step([hold(BTN.RIGHT), NONE]);
    expect(h.x).toBeLessThanOrEqual(w.cameraX + VISIBLE_X0 + VISIBLE_W);
    expect(h.y).toBeGreaterThanOrEqual(0);
    expect(h.y).toBeLessThanOrEqual(LANE_H);
  });

  it('jumps: leaves the ground, comes back down, and a mid-air press turns into a flying kick that lands', () => {
    const w = world();
    const h = w.players[0]!;
    const punk = addEnemy(w, h.x + 50, h.y);
    w.step([press(BTN.JUMP), NONE]);
    expect(h.state).toBe('jump');
    let apex = 0;
    for (let i = 0; i < 8; i++) { w.step([NONE, NONE]); apex = Math.max(apex, h.z); }
    expect(apex).toBeGreaterThan(30);
    w.step([press(BTN.LIGHT), NONE]);
    expect(h.state).toBe('jumpAttack');
    const hp0 = punk.hp;
    let t = 0;
    while (h.state === 'jumpAttack' && t++ < 80) w.step([NONE, NONE]);
    expect(h.z).toBe(0);
    expect(h.state).toBe('idle');
    expect(punk.hp).toBeLessThan(hp0);
  });

  it('a light press buffered during a move starts the next hit the moment the move ends', () => {
    const w = world();
    const h = w.players[0]!;
    w.step([press(BTN.HEAVY), NONE]);
    expect(h.state).toBe('heavy');
    // press again mid-recovery, then release: the follow-up must fire without another press
    for (let i = 0; i < 20; i++) w.step([NONE, NONE]);
    w.step([press(BTN.LIGHT), NONE]);
    let sawLight = false;
    for (let i = 0; i < 20; i++) { w.step([NONE, NONE]); if (h.state === 'light1') sawLight = true; }
    expect(sawLight).toBe(true);
  });

  it('turns to face an enemy at its back when attacking with nothing in front', () => {
    const w = world();
    const h = w.players[0]!;
    h.facing = 1;
    addEnemy(w, h.x - 45, h.y);
    w.step([press(BTN.LIGHT), NONE]);
    expect(h.state).toBe('light1');
    expect(h.facing).toBe(-1);
  });

  it('a light hit connects on an enemy pressed against the hero from behind', () => {
    const w = world();
    const h = w.players[0]!;
    h.facing = 1;
    const front = addEnemy(w, h.x + 40, h.y);
    const back = addEnemy(w, h.x - 26, h.y + 8);
    const f0 = front.hp, b0 = back.hp;
    w.step([press(BTN.LIGHT), NONE]);
    for (let i = 0; i < 12; i++) w.step([NONE, NONE]);
    expect(front.hp).toBeLessThan(f0);
    expect(back.hp).toBeLessThan(b0);
  });
});

describe('level flow', () => {
  it('clearing a level reports victory in the snapshot, and the score carries into the next world', () => {
    const w = world(4);
    w.score = [1234, 0];
    w.bossDefeated = true;
    w.setPhase('boss');
    for (let i = 0; i < 70 && !w.isFinished(); i++) w.step([NONE, NONE]);
    for (let i = 0; i < 400 && !w.isFinished(); i++) w.step([NONE, NONE]);
    expect(w.isFinished()).toBe(true);
    expect(w.snapshot().phase).toBe('victory');
    // the clear bonus (time + best combo) is added on completion, then the total carries over
    expect(w.score[0]).toBeGreaterThan(1234);
    expect(w.levelBonus[0]).toBe(w.score[0] - 1234);
    const next = new World({ seed: 5, level: 2, heroes: ['eviatar', null], score: w.score });
    expect(next.level).toBe(2);
    expect(next.score).toEqual(w.score);
  });
});

describe('pickups', () => {
  it('a beaten enemy can drop a pickup that heals / pays / charges when walked over', async () => {
    const { spawnPickup } = await import('../src/sim/pickups');
    const w = world(21);
    const h = w.players[0]!;
    h.hp = Math.round(h.maxHp * 0.4); h.meter = 0;
    const heart = spawnPickup(w, 'heart', h.x + 60, h.y);
    const coin = spawnPickup(w, 'coin', h.x + 110, h.y);
    const star = spawnPickup(w, 'star', h.x + 160, h.y);
    expect(w.snapshot().entities.filter((e) => e.kind === 'pickup').length).toBe(3);
    const score0 = w.score[0];
    for (let i = 0; i < 40 && !star.dead; i++) w.step([hold(BTN.RIGHT), NONE]);
    for (let i = 0; i < 80 && !star.dead; i++) w.step([hold(BTN.RIGHT), NONE]);
    expect(heart.dead && coin.dead && star.dead).toBe(true);
    expect(h.hp).toBeGreaterThan(h.maxHp * 0.6);
    expect(w.score[0]).toBe(score0 + 500);
    expect(h.meter).toBeGreaterThanOrEqual(50);
  });

  it('an uncollected pickup expires', async () => {
    const { spawnPickup, PICKUP_TTL } = await import('../src/sim/pickups');
    const w = world(22);
    const p = spawnPickup(w, 'coin', w.players[0]!.x + 400, 0);
    for (let i = 0; i < PICKUP_TTL + 5; i++) w.step([NONE, NONE]);
    expect(w.entities.includes(p)).toBe(false);
  });
});

describe('dash chord', () => {
  it('runs only while DASH + a direction are held, and stops when either is released', () => {
    const w = world(31);
    const h = w.players[0]!;
    // a bare DASH press does nothing; DASH + RIGHT starts a run
    w.step([press(BTN.DASH), NONE]);
    expect(h.state).not.toBe('dash');
    for (let i = 0; i < 10; i++) w.step([hold(BTN.DASH | BTN.RIGHT), NONE]);
    expect(h.state).toBe('dash');
    const x0 = h.x;
    for (let i = 0; i < 10; i++) w.step([hold(BTN.DASH | BTN.RIGHT), NONE]);
    expect(h.x - x0).toBeGreaterThan(50);
    // let go of the direction: the run ends at once
    w.step([hold(BTN.DASH), NONE]);
    expect(h.state).not.toBe('dash');
    // reverse the chord: runs the other way
    for (let i = 0; i < 5; i++) w.step([hold(BTN.DASH | BTN.LEFT), NONE]);
    expect(h.state).toBe('dash');
    expect(h.facing).toBe(-1);
  });

  it('stops at the edge of the screen and when it reaches an enemy', () => {
    const w = world(32);
    const h = w.players[0]!;
    for (let i = 0; i < 300 && h.state !== 'idle'; i++) w.step([hold(BTN.DASH | BTN.RIGHT), NONE]);
    for (let i = 0; i < 300; i++) { w.step([hold(BTN.DASH | BTN.RIGHT), NONE]); if (h.state !== 'dash') break; }
    expect(h.state).not.toBe('dash'); // pinned at the band edge, the run ended
    // an enemy in the path turns the run into a dash attack
    const w2 = world(33);
    const h2 = w2.players[0]!;
    addEnemy(w2, h2.x + 120, h2.y);
    let sawAttack = false;
    for (let i = 0; i < 40; i++) { w2.step([hold(BTN.DASH | BTN.RIGHT), NONE]); if (h2.state === 'dashAttack') sawAttack = true; }
    expect(sawAttack).toBe(true);
  });
});
