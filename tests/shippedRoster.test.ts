import { describe, it, expect, afterAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizeRoster, applyRoster, defaultRoster, composeLevels } from '../src/sim/roster';
import { World } from '../src/sim/world';
import { LEVEL_COUNT } from '../src/sim/levels';
import { makeBot, botInput } from '../src/sim/bot';
import type { InputFrame } from '../src/sim/input';

// The campaign players actually get is LEVELS re-composed by public/game/roster.json (the backoffice
// file that ships in the content pack), not the static tables campaign.test.ts plays. This gate
// applies that file and checks it composes without complaint and that every level is still won.
const shipped = normalizeRoster(JSON.parse(readFileSync('public/game/roster.json', 'utf8')));

function playLevel(seed: number, level: number) {
  const w = new World({ seed, level, heroes: ['eviatar', null] as any });
  const bot = makeBot();
  let t = 0, continues = 0;
  while (t < 60 * 60 * 6) {
    if (w.isFinished()) {
      if (w.result === 'gameover' && continues < 2 && w.continueRun()) { continues++; continue; }
      break;
    }
    const i0: InputFrame = botInput(w, 0, bot);
    w.step([i0, { held: 0, pressed: 0 }]);
    t++;
  }
  return { seconds: t / 60, finished: w.isFinished(), result: w.result, continues };
}

describe('shipped roster (public/game/roster.json)', () => {
  afterAll(() => applyRoster(defaultRoster()));

  it('composes every level without warnings and fields every enabled enemy and boss', () => {
    const warnings: string[] = [];
    const levels = composeLevels(shipped, warnings);
    expect(warnings).toEqual([]);
    const fielded = new Set(levels.flatMap((l) => [...l.waves, l.bonusWave].flatMap((w) => w.spawns.map((s) => s.arch))));
    const bosses = new Set(levels.map((l) => l.boss));
    for (const [id, e] of Object.entries(shipped.characters)) {
      if (e.rank === 'enemy' && e.enabled) expect(fielded.has(id), `${id} is enabled but never spawns`).toBe(true);
      if (e.rank === 'boss' && e.enabled) expect(bosses.has(id), `${id} is enabled but guards no level`).toBe(true);
      if (e.rank !== 'hero' && !e.enabled) { expect(fielded.has(id), `${id} is disabled but spawns`).toBe(false); expect(bosses.has(id), `${id} is disabled but guards a level`).toBe(false); }
    }
  });

  for (let level = 1; level <= LEVEL_COUNT; level++) {
    it(`level ${level}: 1P bot wins under the shipped roster`, () => {
      applyRoster(shipped);
      const r = playLevel(9000 + level, level);
      expect(r.finished, `level ${level} did not finish (${r.seconds}s)`).toBe(true);
      expect(r.result, `level ${level} ended in ${r.result}`).toBe('victory');
      expect(r.seconds).toBeGreaterThanOrEqual(30);
      expect(r.seconds).toBeLessThanOrEqual(260);
    }, 30000);
  }
});
