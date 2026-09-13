import { describe, it, expect } from 'vitest';
import { World } from '../src/sim/world';
import { makeBot, botInput } from '../src/sim/bot';
import type { InputFrame } from '../src/sim/input';

function runBotTicks(seed: number, level: number, heroes: ['eviatar', 'omri' | null], ticks: number) {
  const w = new World({ seed, level, heroes: heroes as any });
  const b0 = makeBot(); const b1 = makeBot();
  const hashes: number[] = [];
  for (let i = 0; i < ticks; i++) {
    const i0: InputFrame = w.players[0] ? botInput(w, 0, b0) : { held: 0, pressed: 0 };
    const i1: InputFrame = w.players[1] ? botInput(w, 1, b1) : { held: 0, pressed: 0 };
    w.step([i0, i1]);
    hashes.push(w.hash());
  }
  return hashes;
}

describe('sim determinism', () => {
  it('same seed + same inputs -> identical hash trajectory (1P)', () => {
    const a = runBotTicks(1234, 1, ['eviatar', null], 3000);
    const b = runBotTicks(1234, 1, ['eviatar', null], 3000);
    expect(a).toEqual(b);
  });

  it('same seed + same inputs -> identical hash trajectory (2P)', () => {
    const a = runBotTicks(555, 3, ['eviatar', 'omri'], 3000);
    const b = runBotTicks(555, 3, ['eviatar', 'omri'], 3000);
    expect(a).toEqual(b);
  });

  it('different seeds diverge', () => {
    const a = runBotTicks(1, 1, ['eviatar', null], 600);
    const b = runBotTicks(2, 1, ['eviatar', null], 600);
    expect(a).not.toEqual(b);
  });

  it('sim module never imports phaser', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const { join } = await import('node:path');
    const dir = join(__dirname, '../src/sim');
    for (const f of readdirSync(dir)) {
      if (!f.endsWith('.ts')) continue;
      const src = readFileSync(join(dir, f), 'utf8');
      expect(src.includes("from 'phaser'")).toBe(false);
    }
  });
});
