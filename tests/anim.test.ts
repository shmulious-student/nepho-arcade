import { describe, it, expect } from 'vitest';
import { frameKeyFor, heroFrameKey, enemyFrameKey, bossFrameKey } from '../src/render/anim';
import { HERO_MOVES } from '../src/sim/frameData';
import { ENEMY_DEFS } from '../src/sim/enemyAi';
import type { HeroState, EnemyState, BossState } from '../src/sim/types';

const HERO_STATES: HeroState[] = ['idle', 'walk', 'light1', 'light2', 'light3', 'heavy', 'dash', 'dashAttack', 'special', 'jump', 'jumpAttack', 'hurt', 'hurtHeavy', 'stunned', 'launched', 'knockdown', 'getup', 'ko'];
const ENEMY_STATES: EnemyState[] = ['idle', 'walk', 'attack', 'heavy', 'special', 'hurt', 'stunned', 'launched', 'knockdown', 'getup', 'defeat'];
const BOSS_STATES: BossState[] = ['idle', 'approach', 'attack', 'special', 'hurt', 'stunned', 'defeat'];

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
    expect(parse(frameKeyFor('hero', 'eviatar', 'light1', 4)).row).toBe('light1');
    expect(parse(frameKeyFor('enemy', 'punk', 'walk', 4)).row).toBe('walk');
    expect(parse(frameKeyFor('boss', 'ferryman', 'approach', 4)).row).toBe('approach');
  });
});

describe('enemy knockback and hurt on per-action rows', () => {
  const nine = { framesPerRow: 9 };
  const measured = { framesPerRow: 9, poses: { knockback: { floor: [5, 6] as [number, number] } } };
  it('launched plays the fall up to the first floor frame, knockdown holds the floor frames', () => {
    for (let st = 0; st < 60; st++) {
      expect(parse(enemyFrameKey('bio-brute', 'launched', st, measured)).index).toBeLessThanOrEqual(5);
      const kd = parse(enemyFrameKey('bio-brute', 'knockdown', st, measured)).index;
      expect(kd).toBeGreaterThanOrEqual(5); expect(kd).toBeLessThanOrEqual(6);
    }
    expect(parse(enemyFrameKey('bio-brute', 'launched', 0, measured)).index).toBe(0);
    expect(parse(enemyFrameKey('bio-brute', 'knockdown', 500, measured)).index).toBe(6); // never the standing tail
  });
  it('falls back to the legacy 6-frame convention when the build measured nothing', () => {
    expect(parse(enemyFrameKey('punk', 'knockdown', 500, nine)).index).toBe(8);
    expect(parse(enemyFrameKey('punk', 'knockdown', 500, 6)).index).toBe(5);
    expect(parse(enemyFrameKey('punk', 'launched', 500, 6)).index).toBe(3);
  });
  it('a grounded hit on a 9-frame hurt row never reaches the airborne crumple', () => {
    for (let st = 0; st < 40; st++) expect(parse(enemyFrameKey('punk', 'hurt', st, nine)).index).toBeLessThan(6);
    expect(parse(enemyFrameKey('punk', 'hurt', 40, 6)).index).toBe(5);
  });
});

describe('enemy getup on a dipping legacy row', () => {
  it('plays only the rising half, lowest frame to last', () => {
    const dip = { framesPerRow: 6, poses: { getup: { rise: [3, 5] as [number, number] } } };
    const seen = new Set<number>();
    for (let st = 0; st < 30; st++) seen.add(parse(enemyFrameKey('kicker', 'getup', st, dip)).index);
    expect([...seen].sort()).toEqual([3, 4, 5]);
    expect(parse(enemyFrameKey('kicker', 'getup', 0, dip)).index).toBe(3);
    expect(parse(enemyFrameKey('kicker', 'getup', 0, 6)).index).toBe(0); // no hint: whole row
  });
});
