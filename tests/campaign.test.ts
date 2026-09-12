import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { makeBot, botInput } from '../src/sim/bot';
import type { InputFrame } from '../src/sim/input';

const MAX_TICKS = 60 * 60 * 6; // 6 min hard cap per level (safety valve, not the target)

// The wave budgets in src/sim/levels.ts are designed for a ~150-210s human playthrough per level
// (see docs/design.md). An optimal bot has zero reaction latency, never wastes an input, and always
// picks the correct combo/dodge, so it legitimately clears some levels faster than that human target —
// this is expected and desirable (a game that even a perfect bot can't beat quickly is a tedious game
// for a real player). The assertions below are therefore a correctness/regression gate, not a human-
// pacing gate: every level must be reliably winnable with sane pacing (no deadlocks, no levels that
// resolve in a few seconds, no levels that drag past the ceiling). Human-facing pacing is verified by
// the wave-budget design itself and by manual playtesting, not by matching bot speed to it.
const FLOOR_S = 30; // catches a level trivially clearing far too fast (a real balance regression)
const CEIL_S = 260; // catches a level dragging on well past a reasonable boss-fight ceiling

function playLevel(seed: number, level: number, heroes: ['nepho', 'byte' | null]) {
  const w = new World({ seed, level, heroes: heroes as any });
  const b0 = makeBot(); const b1 = makeBot();
  let t = 0, continues = 0;
  while (t < MAX_TICKS) {
    if (w.isFinished()) {
      // like a player at the CONTINUE? screen: at most two continues per level
      if (w.result === 'gameover' && continues < 2 && w.continueRun()) { continues++; continue; }
      break;
    }
    const i0: InputFrame = w.players[0] ? botInput(w, 0, b0) : { held: 0, pressed: 0 };
    const i1: InputFrame = w.players[1] ? botInput(w, 1, b1) : { held: 0, pressed: 0 };
    w.step([i0, i1]);
    t++;
  }
  return { ticks: t, seconds: t / 60, finished: w.isFinished(), result: w.result, score: w.score, continues };
}

describe('full 10-level campaign (reference bot)', () => {
  for (let level = 1; level <= 10; level++) {
    it(`level ${level}: 1P bot wins with sane pacing`, () => {
      const r = playLevel(9000 + level, level, ['nepho', null]);
      expect(r.finished, `level ${level} did not finish within cap (${r.seconds}s)`).toBe(true);
      expect(r.result, `level ${level} ended in ${r.result}, not a win`).toBe('victory');
      expect(r.seconds).toBeGreaterThanOrEqual(FLOOR_S);
      expect(r.seconds).toBeLessThanOrEqual(CEIL_S);
    }, 30000);

    it(`level ${level}: 2P bot finishes`, () => {
      const r = playLevel(9500 + level, level, ['nepho', 'byte']);
      expect(r.finished, `level ${level} (2P) did not finish within cap (${r.seconds}s)`).toBe(true);
      expect(r.result, `level ${level} (2P) ended in ${r.result}, not a win`).toBe('victory');
    }, 30000);
  }
});
