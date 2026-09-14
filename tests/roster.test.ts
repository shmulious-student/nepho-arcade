import { describe, it, expect, afterEach } from 'vitest';
import { defaultRoster, normalizeRoster, composeLevels, applyRoster, heroPool, readyRoster, ACTIVE_HEROES } from '../src/sim/roster';
import { LEVEL_COUNT } from '../src/sim/levels';
import { LEVELS, ACTIVE, levelDef } from '../src/sim/levels';
import { ENEMY_DEFS } from '../src/sim/enemyAi';
import { BOSS_DEFS } from '../src/sim/bosses';
import { HERO_IDS } from '../src/sim/frameData';
import { World } from '../src/sim/world';

const headcount = (l: { waves: { spawns: { n: number }[] }[] }) => l.waves.map((w) => w.spawns.reduce((a, s) => a + s.n, 0));

afterEach(() => applyRoster(defaultRoster()));

describe('roster defaults', () => {
  it('covers every hero, enemy and boss the sim knows', () => {
    const r = defaultRoster();
    for (const id of HERO_IDS) expect(r.characters[id]?.rank).toBe('hero');
    for (const id of Object.keys(ENEMY_DEFS)) expect(r.characters[id]?.rank).toBe('enemy');
    for (const id of Object.keys(BOSS_DEFS)) expect(r.characters[id]?.rank).toBe('boss');
  });
  it('reproduces the static campaign exactly', () => {
    expect(composeLevels(defaultRoster())).toEqual(LEVELS);
  });
  it('places every fielded enemy archetype on its levels and every campaign boss on its level', () => {
    const r = defaultRoster();
    const fielded = new Set(LEVELS.flatMap((l) => [...l.waves, l.bonusWave].flatMap((w) => w.spawns.map((s) => s.arch))));
    for (const id of Object.keys(ENEMY_DEFS)) {
      if (fielded.has(id)) expect(r.characters[id].levels.length, id).toBeGreaterThan(0);
      else expect(r.characters[id].levels, id).toEqual([]); // legacy-art archetypes wait outside the campaign
    }
    for (const l of LEVELS) expect(r.characters[l.boss].levels).toContain(l.index);
    // a boss no level uses ships registered but unplaced
    for (const id of Object.keys(BOSS_DEFS)) if (!LEVELS.some((l) => l.boss === id)) expect(r.characters[id].levels, id).toEqual([]);
  });
});

describe('normalizeRoster', () => {
  it('fills in missing characters, drops unknown ones and coerces fields', () => {
    const r = normalizeRoster({ characters: { punk: { name: '  Street Punk ', enabled: false, levels: ['2', 99, 2, 0] }, ghost: { name: 'x' } } });
    expect(r.characters.punk).toEqual({ name: 'Street Punk', rank: 'enemy', enabled: false, levels: [2] });
    expect(r.characters.ghost).toBeUndefined();
    expect(r.characters.ferryman.levels).toEqual([1]);
  });
  it('survives garbage', () => {
    expect(normalizeRoster(null)).toEqual(defaultRoster());
    expect(normalizeRoster('<!doctype html>')).toEqual(defaultRoster());
  });
});

describe('composeLevels', () => {
  it('puts an assigned boss on its level and leaves the rest alone', () => {
    const r = defaultRoster();
    r.characters['flame-samurai'].levels = [3];
    const levels = composeLevels(r);
    expect(levels[2].boss).toBe('flame-samurai');
    expect(levels.filter((l) => l.boss === 'kilnheart')).toHaveLength(0);
    expect(levels.map((l) => l.boss).filter((b, i) => i !== 2)).toEqual(LEVELS.map((l) => l.boss).filter((b, i) => i !== 2));
  });
  it('never spawns a disabled enemy and keeps every wave the same size', () => {
    const r = defaultRoster();
    r.characters.punk.enabled = false;
    const levels = composeLevels(r);
    for (const [i, l] of levels.entries()) {
      for (const w of [...l.waves, l.bonusWave]) expect(w.spawns.map((s) => s.arch)).not.toContain('punk');
      expect(headcount(l)).toEqual(headcount(LEVELS[i]));
      expect(l.waves.map((w) => w.budget)).toEqual(LEVELS[i].waves.map((w) => w.budget));
    }
  });
  it('works a newcomer into a level without adding bodies', () => {
    const r = defaultRoster();
    r.characters['void-demon'].levels = [1];
    const [l1] = composeLevels(r);
    expect(l1.waves.some((w) => w.spawns.some((s) => s.arch === 'void-demon'))).toBe(true);
    expect(headcount(l1)).toEqual(headcount(LEVELS[0]));
  });
  it('an enemy removed from a level is replaced by another enemy allowed there', () => {
    const r = defaultRoster();
    r.characters.punk.levels = [2, 3]; // out of level 1, where every wave is punks
    r.characters['bio-brute'].levels.push(1);
    const [l1] = composeLevels(r);
    const archs = new Set([...l1.waves, l1.bonusWave].flatMap((w) => w.spawns.map((s) => s.arch)));
    expect(archs.has('punk')).toBe(false);
    expect(archs.has('bio-brute')).toBe(true);
    expect(headcount(l1)).toEqual(headcount(LEVELS[0]));
  });
  it('warns and keeps the defaults when a level is left with nobody', () => {
    const r = defaultRoster();
    for (const id of Object.keys(r.characters)) if (r.characters[id].rank === 'enemy') r.characters[id].levels = r.characters[id].levels.filter((n) => n !== 1);
    const warnings: string[] = [];
    const [l1] = composeLevels(r, warnings);
    expect(l1.waves).toEqual(LEVELS[0].waves);
    expect(warnings.some((w) => w.startsWith('level 1'))).toBe(true);
  });
  it('a level with two overrides takes the first and warns', () => {
    const r = defaultRoster();
    r.characters['prism-queen'].levels = [10];
    r.characters['abyss-dragon'].levels = [10];
    const warnings: string[] = [];
    const levels = composeLevels(r, warnings);
    expect(levels[9].boss).toBe('abyss-dragon'); // roster (BOSS_DEFS) order
    expect(warnings.some((w) => w.includes('prism-queen'))).toBe(true);
  });
});

describe('applyRoster', () => {
  it('drives the sim: the assigned boss actually spawns on its level', () => {
    const r = defaultRoster();
    r.characters['storm-colossus'].levels = [2];
    r.characters['storm-colossus'].name = 'Big Tesla';
    applyRoster(r);
    expect(levelDef(2).boss).toBe('storm-colossus');
    expect(BOSS_DEFS['storm-colossus'].name).toBe('Big Tesla');
    const w = new World({ seed: 1, level: 2, heroes: ['eviatar', null], dialogs: false });
    w.debugSkipToBoss();
    for (let i = 0; i < 400 && !w.boss(); i++) w.step([{ held: 0, pressed: 0 }, { held: 0, pressed: 0 }]);
    expect(w.boss()?.arch).toBe('storm-colossus');
  });
  it('narrows the lobby to the enabled heroes, but never below two', () => {
    const r = defaultRoster();
    r.characters.noa.enabled = false;
    applyRoster(r);
    expect(ACTIVE_HEROES).toEqual(HERO_IDS.filter((h) => h !== 'noa'));
    r.characters.omri.enabled = false; r.characters.shmuel.enabled = false;
    r.characters['savta-orly'].enabled = false; r.characters['saba-kobi'].enabled = false;
    const res = applyRoster(r);
    expect(ACTIVE_HEROES).toEqual(HERO_IDS);
    expect(res.warnings.join()).toMatch(/at least two/);
    expect(heroPool(r).heroes).toEqual(HERO_IDS);
  });
  it('restores the static tables when given the defaults again', () => {
    const r = defaultRoster();
    r.characters.punk.name = 'Renamed';
    r.characters['abyss-dragon'].levels = [1];
    applyRoster(r);
    applyRoster(defaultRoster());
    expect(ACTIVE.levels).toEqual(LEVELS);
    expect(ENEMY_DEFS.punk.name).toBe('Punk');
  });
});

describe('readyRoster', () => {
  const rd = (ids: string[]) => Object.fromEntries(Object.entries(defaultRoster().characters).map(([id, e]) => [id, { status: ids.includes(id) ? 'ready' : 'legacy', rank: e.rank }])) as any;
  it('fields only ready characters and deals ready bosses across every level', () => {
    const r = readyRoster(rd(['eviatar', 'omri', 'bio-brute', 'void-demon', 'flame-samurai', 'prism-queen', 'abyss-dragon', 'storm-colossus']));
    expect(Object.entries(r.characters).filter(([, e]) => e.enabled).map(([id]) => id).sort()).toEqual(['abyss-dragon', 'bio-brute', 'eviatar', 'flame-samurai', 'omri', 'prism-queen', 'storm-colossus', 'void-demon']);
    expect(r.characters['bio-brute'].levels).toEqual(Array.from({ length: LEVEL_COUNT }, (_, i) => i + 1));
    const levels = composeLevels(r);
    const four = ['abyss-dragon', 'flame-samurai', 'prism-queen', 'storm-colossus'];
    expect(levels.map((l) => l.boss)).toEqual(Array.from({ length: LEVEL_COUNT }, (_, i) => four[i % 4]));
    for (const l of levels) for (const w of [...l.waves, l.bonusWave]) for (const s of w.spawns) expect(['bio-brute', 'void-demon']).toContain(s.arch);
    expect(heroPool(r).heroes).toEqual(['eviatar', 'omri']);
  });
  it('keeps the default bosses when no boss is ready', () => {
    const r = readyRoster(rd(['eviatar', 'omri', 'bio-brute']));
    expect(composeLevels(r).map((l) => l.boss)).toEqual(LEVELS.map((l) => l.boss));
  });
});
