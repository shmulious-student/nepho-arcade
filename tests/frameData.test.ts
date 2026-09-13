import { describe, it, expect } from 'vitest';
import { HERO_MOVES, PITZ, pitzFrame, pitzRunSpeed, pitzPounceSpeed, total } from '../src/sim/frameData';

describe('hero frame data invariants', () => {
  const OPEN_ENDED = new Set(['launched', 'ko', 'jump', 'jumpAttack']); // physics-driven (airborne until landing), not fixed-length
  const moves = Object.entries(HERO_MOVES);
  it('every combat move has startup >= 0 and total <= 60 ticks (arcade pace)', () => {
    for (const [name, m] of moves) {
      if (OPEN_ENDED.has(name)) continue;
      expect(m.startup, name).toBeGreaterThanOrEqual(0);
      expect(total(m), name).toBeLessThanOrEqual(60);
    }
  });
  it('cancel windows fall inside the move (before total length)', () => {
    for (const [name, m] of moves) {
      if (m.cancelFrom === undefined) continue;
      expect(m.cancelFrom, name).toBeLessThan(total(m));
      expect(m.cancelFrom, name).toBeGreaterThanOrEqual(m.startup);
    }
  });
  it('attack moves have startup >= 3 ticks (telegraphed, not instant)', () => {
    for (const [name, m] of moves) {
      if (!m.hit) continue;
      expect(m.startup, name).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("pitz's timeline (the frames the renderer plays against the speed the sim moves him)", () => {
  it('shows all 9 frames of leap, run and pounce, in order, with the run looping', () => {
    const leap = [...Array(PITZ.leap)].map((_, st) => pitzFrame(1, st));
    expect(leap.every((f) => f.row === 'leap')).toBe(true);
    expect([...new Set(leap.map((f) => f.frame))]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    const run = [...Array(PITZ.runLoop)].map((_, i) => pitzFrame(1, PITZ.leap + i));
    expect(run.every((f) => f.row === 'run')).toBe(true);
    expect([...new Set(run.map((f) => f.frame))]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    expect(pitzFrame(1, PITZ.leap + PITZ.runLoop)).toEqual({ row: 'run', frame: 0 }); // loops
    const pounce = [...Array(PITZ.pounce)].map((_, st) => pitzFrame(2, st));
    expect(pounce.every((f) => f.row === 'pounce')).toBe(true);
    expect([...new Set(pounce.map((f) => f.frame))]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
    for (const seq of [leap, run, pounce]) for (let i = 1; i < seq.length; i++) expect(seq[i].frame).toBeGreaterThanOrEqual(seq[i - 1].frame);
  });
  it('accelerates out of the portal, holds the gallop, and skids to a full stop inside the pounce', () => {
    expect(pitzRunSpeed(0)).toBe(PITZ.leapSpeed);
    for (let st = 1; st < PITZ.leap; st++) expect(pitzRunSpeed(st)).toBeGreaterThan(pitzRunSpeed(st - 1));
    expect(pitzRunSpeed(PITZ.leap)).toBe(PITZ.runSpeed);
    expect(pitzRunSpeed(PITZ.leap + 99)).toBe(PITZ.runSpeed);
    expect(pitzPounceSpeed(0)).toBe(PITZ.runSpeed);
    for (let st = 1; st < PITZ.pounce; st++) expect(pitzPounceSpeed(st)).toBeLessThanOrEqual(pitzPounceSpeed(st - 1));
    expect(pitzPounceSpeed(PITZ.pounce - 1)).toBe(0);
  });
});
