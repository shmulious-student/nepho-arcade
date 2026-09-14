import { describe, it, expect } from 'vitest';
import { World, WAVE_BOSS_HP } from '../src/sim/world';
import { LEVELS, LEVEL_COUNT, levelDef } from '../src/sim/levels';
import { BOSS_DEFS } from '../src/sim/bosses';
import { ENTRY_TICKS } from '../src/sim/levels';
import { defaultRoster, composeLevels } from '../src/sim/roster';

const NONE = { held: 0, pressed: 0 };

describe('the finale gauntlet', () => {
  it('level 11 fields every boss of levels 1–10, in campaign order, before Caga Tió', () => {
    const last = levelDef(LEVEL_COUNT);
    expect(last.id).toBe('tio-lair');
    expect(last.boss).toBe('caga-tio');
    const fielded = last.waves.flatMap((w) => w.spawns.map((s) => s.arch)).filter((a) => BOSS_DEFS[a]);
    expect(fielded).toEqual(LEVELS.slice(0, LEVEL_COUNT - 1).map((l) => l.boss));
  });
  it('a boss in a wave spawns as a smaller, weaker copy that counts as a wave enemy', () => {
    const w = new World({ seed: 5, level: LEVEL_COUNT, heroes: ['eviatar', null], dialogs: false });
    const e = w.spawnEnemy('ferryman', 'right');
    expect(e.kind).toBe('echo');
    expect(e.arch).toBe('ferryman');
    expect(e.maxHp).toBe(Math.round(BOSS_DEFS.ferryman.hp * WAVE_BOSS_HP * levelDef(LEVEL_COUNT).hpMul));
    expect(e.maxHp).toBeLessThan(BOSS_DEFS.ferryman.hp * 0.25);
    expect(w.livingEnemies()).toBe(1);
    expect(w.boss()).toBeUndefined(); // the HUD's named boss bar is only for the real boss
    e.hp = 0; e.dead = true;
    expect(w.livingEnemies()).toBe(0);
  });
  it('the first wave of the finale brings the first two bosses back, one each even in co-op', () => {
    for (const heroes of [['eviatar', null], ['eviatar', 'omri']] as const) {
      const w = new World({ seed: 8, level: LEVEL_COUNT, heroes: heroes as any, dialogs: false });
      for (let t = 0; t < ENTRY_TICKS + 45 + 70 * 3; t++) w.step([NONE, NONE]);
      const echoes = w.entities.filter((e) => e.kind === 'echo');
      expect(echoes.map((e) => e.arch).sort()).toEqual(['ferryman', 'monk-zero']);
    }
  });
  it('the roster keeps the gauntlet as designed', () => {
    const levels = composeLevels(defaultRoster());
    expect(levels[LEVEL_COUNT - 1].waves).toEqual(LEVELS[LEVEL_COUNT - 1].waves);
  });
  it('a boss the roster disables leaves the gauntlet and the pool fills its slot', () => {
    const r = defaultRoster();
    r.characters.ferryman.enabled = false;
    const last = composeLevels(r)[LEVEL_COUNT - 1];
    const archs = last.waves.flatMap((w) => w.spawns.map((s) => s.arch));
    expect(archs).not.toContain('ferryman');
    expect(archs).toContain('monk-zero');
    expect(last.waves[0].spawns.reduce((a, s) => a + s.n, 0)).toBe(LEVELS[LEVEL_COUNT - 1].waves[0].spawns.reduce((a, s) => a + s.n, 0));
  });
});
