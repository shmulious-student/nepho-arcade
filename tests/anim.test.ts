import { describe, it, expect } from 'vitest';
import { frameKeyFor, heroFrameKey, enemyFrameKey, bossFrameKey } from '../src/render/anim';
import { HERO_MOVES } from '../src/sim/frameData';
import { ENEMY_DEFS } from '../src/sim/enemyAi';
import type { HeroState, EnemyState, BossState } from '../src/sim/types';

const HERO_STATES: HeroState[] = ['idle', 'walk', 'light1', 'light2', 'light3', 'heavy', 'dash', 'dashAttack', 'special', 'hurt', 'hurtHeavy', 'launched', 'knockdown', 'getup', 'ko'];
const ENEMY_STATES: EnemyState[] = ['idle', 'walk', 'attack', 'heavy', 'special', 'hurt', 'launched', 'knockdown', 'getup', 'defeat'];
const BOSS_STATES: BossState[] = ['idle', 'approach', 'attack', 'special', 'hurt', 'defeat'];

// Rows the asset pipeline emits for each source format (see tools/build-assets.mjs).
const HERO_ROWS = ['idle', 'walk', 'dash', 'light1', 'light2', 'light3', 'heavy', 'special', 'block', 'hurt', 'knockdown', 'defeat'];
const ENEMY_ROWS = ['idle', 'walk', 'approach', 'attack', 'combo', 'heavy', 'special', 'guard', 'hurt', 'knockback', 'getup', 'defeat'];

const parse = (key: string) => { const [row, i] = key.split('/'); return { row, index: Number(i) }; };

describe('animation frame keys', () => {
  it('every hero state maps to a row the hero atlas actually has', () => {
    for (const state of HERO_STATES) {
      const { row } = parse(heroFrameKey(state, 0));
      expect(HERO_ROWS, `${state} -> ${row}`).toContain(row);
    }
  });

  it('every enemy state maps to a row the enemy atlas actually has', () => {
    for (const arch of Object.keys(ENEMY_DEFS)) {
      for (const state of ENEMY_STATES) {
        const { row } = parse(enemyFrameKey(arch, state, 0));
        expect(ENEMY_ROWS, `${arch}/${state} -> ${row}`).toContain(row);
      }
    }
  });

  it('frame indices stay inside the row for 6- and 9-frame source art', () => {
    for (const framesPerRow of [6, 9]) {
      for (const state of HERO_STATES) {
        for (let st = 0; st < 200; st++) {
          const { index } = parse(heroFrameKey(state, st, framesPerRow));
          expect(index, `${state}@${st} (${framesPerRow}fpr)`).toBeGreaterThanOrEqual(0);
          expect(index, `${state}@${st} (${framesPerRow}fpr)`).toBeLessThan(framesPerRow);
        }
      }
      for (const state of ENEMY_STATES) {
        for (let st = 0; st < 200; st++) {
          const { index } = parse(enemyFrameKey('punk', state, st, framesPerRow));
          expect(index, `punk/${state}@${st}`).toBeGreaterThanOrEqual(0);
          expect(index, `punk/${state}@${st}`).toBeLessThan(framesPerRow);
        }
      }
      for (const state of BOSS_STATES) {
        for (let st = 0; st < 300; st++) {
          const { index } = parse(bossFrameKey(state, st, framesPerRow));
          expect(index, `boss/${state}@${st}`).toBeLessThan(framesPerRow);
        }
      }
    }
  });

  it('a wider row still covers the whole animation, first frame to last', () => {
    const seen = new Set<number>();
    for (let st = 0; st < 48; st++) seen.add(parse(heroFrameKey('idle', st, 9)).index);
    expect(seen.has(0)).toBe(true);
    expect(seen.has(8)).toBe(true);
  });

  it('every hero move row is one the pipeline emits', () => {
    for (const [name, m] of Object.entries(HERO_MOVES)) expect(HERO_ROWS, name).toContain(m.row);
  });

  it('frameKeyFor dispatches on kind', () => {
    expect(parse(frameKeyFor('hero', 'nepho', 'light1', 4)).row).toBe('light1');
    expect(parse(frameKeyFor('enemy', 'punk', 'walk', 4)).row).toBe('walk');
    expect(parse(frameKeyFor('boss', 'ferryman', 'approach', 4)).row).toBe('approach');
  });
});
