import { describe, it, expect } from 'vitest';
import { HERO_MOVES, total } from '../src/sim/frameData';

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
