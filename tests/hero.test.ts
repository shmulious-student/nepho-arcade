import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { BTN, type InputFrame } from '../src/sim/input';
import { VISIBLE_X0, VISIBLE_W, LANE_H } from '../src/sim/types';
import { makeEntity } from '../src/sim/entity';
import { ENEMY_DEFS } from '../src/sim/enemyAi';
import { PITZ } from '../src/sim/frameData';

const NONE: InputFrame = { held: 0, pressed: 0 };
const press = (b: number): InputFrame => ({ held: b, pressed: b });
const hold = (b: number): InputFrame => ({ held: b, pressed: 0 });

function world(seed = 1) {
  const w = new World({ seed, level: 1, heroes: ['eviatar', null], dialogs: false }); // the dialog scenes have their own test
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
  it("shmuel's special sends the cat hunting: one piercing projectile that chases every enemy in view — ahead, behind, in another lane — and floors each once", () => {
    const w = new World({ seed: 3, level: 1, heroes: ['shmuel', null] });
    while (w.phase === 'entry') w.step([NONE, NONE]);
    const h = w.players[0]!;
    h.facing = 1; h.meter = 100;
    const near = addEnemy(w, h.x + 140, h.y), far = addEnemy(w, h.x + 420, Math.min(LANE_H, h.y + 70)), behind = addEnemy(w, h.x - 120, h.y);
    const hp = [near.hp, far.hp, behind.hp];
    w.step([press(BTN.SPECIAL), NONE]);
    expect(h.state).toBe('special');
    let cat: any = null;
    for (let i = 0; i < 120; i++) {
      w.step([NONE, NONE]);
      cat ||= w.entities.find((e) => e.kind === 'projectile' && e.arch === 'cat') || null;
    }
    expect(cat, 'no cat was released').not.toBeNull();
    expect(cat.friendly).toBe(true);
    expect(near.hp).toBeLessThan(hp[0]);
    expect(far.hp).toBeLessThan(hp[1]); // reached by changing lane
    expect(behind.hp).toBeLessThan(hp[2]); // turned round for it
    // one bite each: the damage on all three is the same single hit, not a hit per tick of overlap
    expect(hp[0] - near.hp).toBe(hp[1] - far.hp);
    expect(hp[0] - near.hp).toBe(hp[2] - behind.hp);
    expect(['knockdown', 'getup', 'idle', 'walk', 'defeat'].includes(near.state) || near.hp <= 0).toBe(true);
  });

  it("pitz's run is leap → gallop → pounce at the far edge of the view, all of it on screen, then he is gone", () => {
    const w = new World({ seed: 3, level: 1, heroes: ['shmuel', null] });
    while (w.phase === 'entry') w.step([NONE, NONE]);
    const h = w.players[0]!;
    h.facing = 1; h.meter = 100;
    w.step([press(BTN.SPECIAL), NONE]);
    let cat: any = null, pounceAt = -1, maxX = -Infinity, ticks = 0;
    for (let i = 0; i < 400; i++) {
      w.step([NONE, NONE]);
      const c = w.entities.find((e) => e.kind === 'projectile' && e.arch === 'cat');
      if (c) {
        cat = c; ticks++;
        maxX = Math.max(maxX, c.x);
        if (c.pphase === 2 && pounceAt < 0) pounceAt = ticks;
        if (c.pphase === 1) expect(c.vx).toBeGreaterThan(0);
      } else if (cat) break;
    }
    expect(cat, 'no cat was released').not.toBeNull();
    expect(pounceAt, 'the run never turned into a pounce').toBeGreaterThan(PITZ.leap);
    // the pounce happens inside the visible band, and he stops before its edge
    expect(maxX).toBeLessThanOrEqual(w.cameraX + VISIBLE_X0 + VISIBLE_W);
    // on screen for the leap, at least one gallop loop, and the whole pounce — but never past the cap
    expect(ticks).toBeGreaterThanOrEqual(PITZ.leap + PITZ.runLoop + PITZ.pounce);
    expect(ticks).toBeLessThanOrEqual(PITZ.leap + PITZ.run + PITZ.pounce + 2);
    expect(w.entities.some((e) => e.arch === 'cat' && !e.dead)).toBe(false);
  });

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

describe('block', () => {
  it('stops an attack from the side the hero faces, and not one from behind', () => {
    const w = world(41);
    const h = w.players[0]!;
    h.facing = 1;
    const front = addEnemy(w, h.x + 40, h.y);
    front.cooldown = 0; front.facing = -1;
    const hp0 = h.hp;
    // hold block facing the enemy while it swings
    let blocked = 0;
    for (let i = 0; i < 240; i++) {
      w.step([hold(BTN.BLOCK), NONE]);
      for (const ev of w.events) if (ev.type === 'block' && ev.id === h.id) blocked++;
    }
    expect(blocked).toBeGreaterThan(0);
    expect(h.hp).toBe(hp0);
    expect(h.state).toBe('block');
    // same swings from behind connect
    front.dead = true; front.removeAt = w.tick + 1; w.step([NONE, NONE]);
    const back = addEnemy(w, h.x - 40, h.y);
    back.cooldown = 0; back.facing = 1;
    for (let i = 0; i < 240; i++) w.step([hold(BTN.BLOCK), NONE]);
    expect(h.hp).toBeLessThan(hp0);
  });
});

describe('stun', () => {
  it('a long unbroken streak of hits dazes an enemy for two seconds, then not again for a while', async () => {
    const { STUN_TICKS } = await import('../src/sim/combat');
    const w = world(51);
    const h = w.players[0]!;
    const punk = addEnemy(w, h.x + 40, h.y);
    punk.hp = punk.maxHp = 10000; // survives the streak
    let stunAt = -1, stuns = 0;
    for (let t = 0; t < 60 * 14; t++) {
      w.step([t % 8 === 0 ? press(BTN.LIGHT) : NONE, NONE]);
      for (const ev of w.events) if (ev.type === 'stun' && ev.id === punk.id) { stuns++; if (stunAt < 0) stunAt = t; }
      if (stunAt >= 0 && t === stunAt + 1) expect(punk.state).toBe('stunned');
      if (stunAt >= 0 && t === stunAt + STUN_TICKS + 40) expect(punk.state).not.toBe('stunned');
    }
    expect(stuns).toBeGreaterThanOrEqual(1);
    expect(stuns).toBeLessThanOrEqual(2); // 14s of constant hitting: at most once per cooldown window
    expect(stunAt).toBeGreaterThan(30); // it takes a real streak, not a couple of hits
  });
});

describe('regen and continue', () => {
  it('HP does not regenerate for five seconds after a hit, then only trickles', () => {
    const w = world(61);
    const h = w.players[0]!;
    h.hp = h.maxHp * 0.5; h.regenLock = 300;
    // nobody around to interfere: clear the wave so only regen moves the number
    const quiet = () => { w.director.queue = []; for (const e of w.entities) if (e.kind === 'enemy') { e.dead = true; e.removeAt = w.tick + 1; } };
    for (let i = 0; i < 299; i++) { quiet(); w.step([NONE, NONE]); }
    expect(h.hp).toBeLessThanOrEqual(h.maxHp * 0.5 + 0.01);
    for (let i = 0; i < 600; i++) { quiet(); w.step([NONE, NONE]); }
    expect(h.hp).toBeGreaterThan(h.maxHp * 0.5);
    expect(h.hp).toBeLessThan(h.maxHp * 0.85); // ten seconds of standing still: nowhere near full
  });

  it('CONTINUE? puts a KO\'d player back in the same fight with fresh lives', () => {
    const w = world(62);
    const h = w.players[0]!;
    w.lives = [0, 0];
    h.hp = 0; h.state = 'ko';
    w.step([NONE, NONE]);
    expect(w.isFinished()).toBe(true);
    expect(w.snapshot().phase).toBe('gameover');
    expect(w.continueRun()).toBe(true);
    expect(w.isFinished()).toBe(false);
    expect(w.snapshot().phase).not.toBe('gameover');
    expect(h.hp).toBe(h.maxHp);
    expect(w.lives[0]).toBe(2);
    expect(w.continueRun()).toBe(false); // nothing to continue from
  });
});
