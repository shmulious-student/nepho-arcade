import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { Rng } from '../src/sim/rng';
import { BTN } from '../src/sim/input';
import { VISIBLE_X0, VISIBLE_W, LANE_H } from '../src/sim/types';

const ALL = BTN.LEFT | BTN.RIGHT | BTN.UP | BTN.DOWN | BTN.LIGHT | BTN.HEAVY | BTN.DASH | BTN.SPECIAL | BTN.BLOCK | BTN.ASSIST | BTN.JUMP;

/** Mashes random buttons for a minute per configuration and checks the sim never breaks its own
 * invariants: no NaN, players inside the visible band, entities bounded, snapshot encodable. */
describe('random-input fuzz', () => {
  const configs: [number, 'off' | 'assist' | 'sidekick', boolean][] = [[1, 'off', false], [2, 'assist', false], [5, 'sidekick', true], [10, 'sidekick', false], [7, 'assist', true]];
  for (const [level, mode, coop] of configs) {
    it(`level ${level}, friends ${mode}, ${coop ? '2P' : '1P'}`, () => {
      const rng = new Rng(100 + level);
      const w = new World({ seed: 500 + level, level, heroes: ['eviatar', coop ? 'omri' : null], friends: { friends: ['nepho', coop ? 'byte' : null], mode } });
      let prev = [0, 0];
      for (let t = 0; t < 60 * 60 && !w.isFinished(); t++) {
        const held = [0, 1].map((i) => (rng.chance(0.15) ? rng.int(0, ALL) : prev[i]));
        const inputs = [0, 1].map((i) => ({ held: held[i], pressed: held[i] & ~prev[i] })) as [any, any];
        prev = held;
        w.step(inputs);
        for (const e of w.entities) {
          expect(Number.isFinite(e.x) && Number.isFinite(e.y) && Number.isFinite(e.z) && Number.isFinite(e.hp), `${e.kind}/${e.arch} has NaN at tick ${t}`).toBe(true);
        }
        for (const h of w.heroes()) {
          expect(h.x, `hero left the band at tick ${t}`).toBeGreaterThanOrEqual(w.cameraX + VISIBLE_X0);
          expect(h.x, `hero left the band at tick ${t}`).toBeLessThanOrEqual(w.cameraX + VISIBLE_X0 + VISIBLE_W);
          expect(h.y).toBeGreaterThanOrEqual(0); expect(h.y).toBeLessThanOrEqual(LANE_H);
        }
        expect(w.entities.length).toBeLessThan(80);
      }
      const snap = w.snapshot();
      expect(snap.entities.length).toBeGreaterThan(0);
    });
  }
});
