import { it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { makeBot, botInput } from '../src/sim/bot';
import { VISIBLE_X0, VISIBLE_W } from '../src/sim/types';

// Every level, in several hero / co-op / friend configurations, played by the reference bot with
// the sim's invariants checked on every tick: nothing goes NaN, nothing dies without being marked
// dead (or lingers past its removal tick), a hero at zero HP is always on the way down or out, and an
// enemy or boss that has entered the visible band never slips back out of it — plus the level is won.

const modes = ['off', 'assist', 'sidekick'] as const;
for (let level = 1; level <= 10; level++) {
  for (let k = 0; k < 4; k++) {
    const coop = k % 2 === 1, mode = modes[k % 3], seed = 1234 + level * 17 + k * 101;
    it(`sweep L${level} seed=${seed} ${coop ? '2P' : '1P'} ${mode}`, () => {
      // every hero gets played, partnered with and called in as a friend somewhere in the sweep:
      // four distinct picks off one rotating list, so no slot ever doubles up
      const all = ['eviatar', 'omri', 'shmuel', 'savta-orly', 'saba-kobi', 'noa'];
      const pick = (i: number) => all[(level + k + i) % all.length];
      const heroes: any = [pick(0), coop ? pick(1) : null];
      const friends = { friends: [pick(2), coop ? pick(3) : null] as any, mode };
      const w = new World({ seed, level, heroes, friends });
      const b0 = makeBot(), b1 = makeBot();
      let t = 0, cont = 0, maxEnts = 0;
      const problems: string[] = [];
      const seen = new Set<number>();
      while (t < 60 * 60 * 6) {
        if (w.isFinished()) { if (w.result === 'gameover' && cont < 2 && w.continueRun()) { cont++; continue; } break; }
        w.step([botInput(w, 0, b0), w.players[1] ? botInput(w, 1, b1) : { held: 0, pressed: 0 }]);
        t++;
        maxEnts = Math.max(maxEnts, w.entities.length);
        for (const e of w.entities) {
          if (!Number.isFinite(e.x + e.y + e.z + e.hp)) problems.push(`t=${t} NaN ${e.kind}/${e.arch}`);
          if ((e.kind === 'enemy' || e.kind === 'boss' || e.kind === 'echo') && e.hp <= 0 && !e.dead) problems.push(`t=${t} ${e.kind}/${e.arch} hp=${e.hp} not dead (${e.state})`);
          if (e.kind === 'hero' && e.hp <= 0 && !['launched', 'ko', 'getup', 'knockdown'].includes(e.state)) problems.push(`t=${t} hero ${e.arch} hp=${e.hp} in ${e.state}`);
          if (e.dead && e.removeAt && w.tick > e.removeAt + 1) problems.push(`t=${t} ${e.kind}/${e.arch} overdue removal`);
          if (e.kind === 'enemy' && !e.dead) {
            const inBand = e.x >= w.cameraX + VISIBLE_X0 - 30 && e.x <= w.cameraX + VISIBLE_X0 + VISIBLE_W + 30;
            if (inBand) seen.add(e.id);
            else if (seen.has(e.id)) problems.push(`t=${t} enemy ${e.arch} left the band x=${e.x.toFixed(0)} cam=${w.cameraX} st=${e.state}`);
          }
          if (e.kind === 'boss' && !e.dead && seen.has(e.id) && (e.x < w.cameraX + VISIBLE_X0 - 30 || e.x > w.cameraX + VISIBLE_X0 + VISIBLE_W + 30)) problems.push(`t=${t} boss left the band x=${e.x.toFixed(0)} st=${e.state}`);
          if (e.kind === 'boss' && !e.dead && e.x >= w.cameraX + VISIBLE_X0 - 30 && e.x <= w.cameraX + VISIBLE_X0 + VISIBLE_W + 30) seen.add(e.id);
        }
        if (problems.length > 20) break;
      }
      const uniq = [...new Set(problems.map((p) => p.replace(/t=\d+ /, '')))].slice(0, 6);
      expect(uniq, `L${level} problems: ${uniq.join(' | ')} (maxEnts ${maxEnts})`).toEqual([]);
      expect(w.result, `L${level} ended ${w.result} after ${(t / 60).toFixed(0)}s, ${cont} continues, maxEnts ${maxEnts}`).toBe('victory');
      expect(maxEnts).toBeLessThan(60);
    }, 60000);
  }
}
