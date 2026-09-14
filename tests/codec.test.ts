import { describe, it, expect } from 'vitest';
import { encodeSnapshot, decodeSnapshot, encodeInput, decodeInput } from '../src/net/codec';
import { Rng } from '../src/sim/rng';
import type { Snapshot, EntityView, Kind, LevelPhase } from '../src/sim/types';

const KINDS: Kind[] = ['hero', 'enemy', 'boss', 'echo', 'projectile', 'hazard'];
const PHASES: LevelPhase[] = ['entry', 'wave', 'go', 'boss', 'clear', 'gameover', 'victory'];
const ARCHES = ['eviatar', 'punk', 'ferryman', 'shard', 'ring'];
const STATES = ['idle', 'walk', 'light1', 'hurt', 'attack', 'approach'];

function randomSnapshot(rng: Rng): Snapshot {
  const n = rng.int(0, 12);
  const entities: EntityView[] = [];
  for (let i = 0; i < n; i++) {
    entities.push({
      id: i, kind: rng.pick(KINDS), arch: rng.pick(ARCHES), slot: rng.chance(0.3) ? -1 : rng.int(0, 1),
      x: Math.round(rng.range(-2000, 2000)), y: rng.int(0, 120), z: rng.int(0, 200),
      facing: rng.chance(0.5) ? 1 : -1, state: rng.pick(STATES), st: rng.int(0, 60),
      hp: rng.next(), meter: rng.next(), flash: rng.chance(0.5) ? 1 : 0, invuln: rng.chance(0.5) ? 1 : 0,
      scale: rng.chance(0.5) ? 1 : +rng.range(0.5, 200).toFixed(2), tint: rng.int(0, 9), combo: rng.int(0, 30), hitstop: rng.chance(0.3) ? 1 : 0, phase: rng.int(0, 2),
    });
  }
  return {
    tick: rng.int(0, 1e6), level: rng.int(1, 11), phase: rng.pick(PHASES), wave: rng.int(0, 3),
    cameraX: rng.int(0, 1500), timer: +rng.range(0, 200).toFixed(1), bossHp: rng.next(), bossMaxHp: rng.int(0, 5000),
    bossId: rng.pick(ARCHES), score: [0, 0], credits: 0, entities, events: [], go: rng.chance(0.5), enrage: rng.chance(0.5),
    assist: [rng.next(), rng.next()],
    lives: [rng.int(0, 5), rng.int(0, 5)],
    maxCombo: [rng.int(0, 40), rng.int(0, 40)],
  };
}

describe('net codec', () => {
  it('snapshot round-trips entity fields within quantization tolerance', () => {
    const rng = new Rng(42);
    for (let i = 0; i < 200; i++) {
      const s = randomSnapshot(rng);
      const decoded = decodeSnapshot(encodeSnapshot(s));
      expect(decoded.tick).toBe(s.tick >>> 0);
      expect(decoded.level).toBe(s.level);
      expect(decoded.phase).toBe(s.phase);
      expect(decoded.entities.length).toBe(Math.min(s.entities.length, 40));
      expect(Math.abs(decoded.assist[0] - s.assist[0])).toBeLessThan(0.01);
      expect(Math.abs(decoded.assist[1] - s.assist[1])).toBeLessThan(0.01);
      expect(decoded.lives).toEqual(s.lives);
      for (let j = 0; j < decoded.entities.length; j++) {
        const a = s.entities[j], b = decoded.entities[j];
        expect(b.kind).toBe(a.kind);
        expect(b.arch).toBe(a.arch);
        expect(Math.abs(b.x - a.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(b.hp - a.hp)).toBeLessThan(0.01);
        expect(Math.abs(b.scale - a.scale)).toBeLessThan(0.07);
        expect(b.phase).toBe(a.phase);
      }
    }
  });

  it('snapshot payload stays within the documented byte budget', () => {
    const rng = new Rng(7);
    const s = randomSnapshot(rng);
    // pad to the max entity/event counts to test the worst case
    while (s.entities.length < 24) s.entities.push(s.entities[0] || ({} as EntityView));
    const buf = encodeSnapshot(s);
    expect(buf.byteLength).toBeLessThanOrEqual(520);
  });

  it('input round-trips exactly (10-button u16 mask)', () => {
    for (let held = 0; held < 1024; held += 31) {
      for (let pressed = 0; pressed < 512; pressed += 61) {
        const buf = encodeInput(1234, held, pressed);
        const d = decodeInput(buf);
        expect(d.clientTick).toBe(1234);
        expect(d.held).toBe(held);
        expect(d.pressed).toBe(pressed);
      }
    }
  });
});
