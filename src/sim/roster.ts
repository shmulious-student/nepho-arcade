// The roster: which characters take part in the campaign, under what name, and where. Edited on
// /backoffice.html, stored as public/game/roster.json, applied once at boot (applyRoster). Every
// character the sim knows (HEROES, ENEMY_DEFS, BOSS_DEFS) has an entry; a missing or partial file
// falls back to the defaults derived from the static tables, so the game always has a valid roster.
//
// A character's rank is fixed by its art: a 12-row hero set, a 10-row enemy set or a 6-row boss set
// each drive a different state machine and animation table, so the roster records the rank but
// never changes it.
import { HEROES, HERO_IDS } from './frameData';
import type { HeroId } from './types';
import { ENEMY_DEFS } from './enemyAi';
import { BOSS_DEFS } from './bosses';
import { LEVELS, ACTIVE, LEVEL_COUNT, type LevelDef, type WaveDef, type SpawnDef } from './levels';
import { getGameBase } from '../shared/catalog';

export type Rank = 'hero' | 'enemy' | 'boss';

export interface RosterEntry {
  name: string;
  rank: Rank;
  /** Takes part at all: a disabled hero leaves the lobby, a disabled enemy never spawns, a disabled
   * boss never guards a level. */
  enabled: boolean;
  /** Enemies: the levels whose waves may include them. Bosses: the level they end (at most one is
   * honoured). Heroes: unused. */
  levels: number[];
}

export interface Roster { version: 1; characters: Record<string, RosterEntry> }

export const ROSTER_VERSION = 1;
export { LEVEL_COUNT };

// the names the tables were authored with, captured before any roster renames them
const BASE_NAMES: Record<string, string> = {};
for (const id of HERO_IDS) BASE_NAMES[id] = HEROES[id].name;
for (const [id, d] of Object.entries(ENEMY_DEFS)) BASE_NAMES[id] = d.name;
for (const [id, d] of Object.entries(BOSS_DEFS)) BASE_NAMES[id] = d.name;

/** The roster the static tables describe: everyone enabled, enemies in the levels whose base waves
 * spawn them, bosses on the level LEVELS assigns them (a boss no level uses has none). */
export function defaultRoster(): Roster {
  const characters: Record<string, RosterEntry> = {};
  for (const id of HERO_IDS) characters[id] = { name: BASE_NAMES[id], rank: 'hero', enabled: true, levels: [] };
  for (const id of Object.keys(ENEMY_DEFS)) {
    const levels = LEVELS.filter((l) => [...l.waves, l.bonusWave].some((w) => w.spawns.some((s) => s.arch === id))).map((l) => l.index);
    characters[id] = { name: BASE_NAMES[id], rank: 'enemy', enabled: true, levels };
  }
  for (const id of Object.keys(BOSS_DEFS)) {
    characters[id] = { name: BASE_NAMES[id], rank: 'boss', enabled: true, levels: LEVELS.filter((l) => l.boss === id).map((l) => l.index) };
  }
  return { version: ROSTER_VERSION, characters };
}

/** Merges whatever was loaded onto the defaults: unknown ids are dropped, missing ones filled in,
 * and each field coerced to its type — so a hand-edited or stale file can never break the game. */
export function normalizeRoster(input: unknown): Roster {
  const base = defaultRoster();
  const chars = (input && typeof input === 'object' && (input as any).characters) || {};
  for (const [id, entry] of Object.entries(base.characters)) {
    const raw = (chars as any)[id];
    if (!raw || typeof raw !== 'object') continue;
    if (typeof raw.name === 'string' && raw.name.trim()) entry.name = raw.name.trim();
    if (typeof raw.enabled === 'boolean') entry.enabled = raw.enabled;
    if (Array.isArray(raw.levels) && entry.rank !== 'hero') {
      const lv = [...new Set(raw.levels.map((n: unknown) => Number(n)).filter((n: number) => Number.isInteger(n) && n >= 1 && n <= LEVEL_COUNT))] as number[];
      entry.levels = lv.sort((a, b) => a - b);
    }
  }
  return base;
}

export interface RosterResult {
  levels: LevelDef[];
  heroes: HeroId[];
  /** Places where the roster asked for something the game could not honour, and what it did instead. */
  warnings: string[];
}

/** Heroes the lobby offers. The lobby needs two (a second player and a friend are picked from the
 * rest), so fewer than two enabled heroes means everyone plays. */
export function heroPool(roster: Roster): { heroes: HeroId[]; warning?: string } {
  const heroes = HERO_IDS.filter((id) => roster.characters[id]?.enabled !== false);
  if (heroes.length >= 2) return { heroes };
  return { heroes: [...HERO_IDS], warning: `only ${heroes.length} hero(es) enabled — the lobby needs at least two, so all heroes stay in` };
}

const mergeSpawns = (spawns: SpawnDef[]): SpawnDef[] => {
  const out: SpawnDef[] = [];
  for (const s of spawns) { const m = out.find((o) => o.arch === s.arch); if (m) m.n += s.n; else out.push({ arch: s.arch, n: s.n }); }
  return out.filter((s) => s.n > 0);
};

/** Rebuilds one level's waves for the enemies the roster lets into it. Headcount and budgets are
 * kept: an archetype that is out is replaced in place, and a newcomer takes one slot of an existing
 * wave rather than adding bodies — the wave design (a couple at a time, never a mob) is tuned. */
function composeWaves(level: LevelDef, pool: string[], bosses: string[], warnings: string[]): { waves: WaveDef[]; bonusWave: WaveDef } {
  const all = [...level.waves, level.bonusWave];
  if (!pool.length) {
    warnings.push(`level ${level.index}: no enemies enabled for it — keeping its default waves`);
    return { waves: level.waves, bonusWave: level.bonusWave };
  }
  const present = new Set(all.flatMap((w) => w.spawns.map((s) => s.arch)).filter((a) => !BOSS_DEFS[a]));
  const newcomers = pool.filter((id) => !present.has(id));
  let subIdx = 0;
  const substitute = () => (newcomers.length ? newcomers[subIdx++ % newcomers.length] : pool[subIdx++ % pool.length]);
  const placed = new Set<string>();
  const rebuilt = all.map((w) => ({ budget: w.budget, spawns: w.spawns.map((s) => {
    // a boss fielded as a wave enemy (the finale's gauntlet) is part of the level's design, not the
    // pool: it stays as long as the roster has that boss enabled, otherwise the pool fills the slot
    if (BOSS_DEFS[s.arch] && bosses.includes(s.arch)) return { arch: s.arch, n: s.n };
    const arch = !BOSS_DEFS[s.arch] && pool.includes(s.arch) ? s.arch : substitute();
    placed.add(arch);
    return { arch, n: s.n };
  }) }));
  // newcomers nobody substituted in yet each borrow one body from a wave, round-robin over the real
  // waves — never from a boss's slot (the finale's gauntlet is fixed), so a level made only of bosses
  // simply has no room for them
  const left = newcomers.filter((id) => !placed.has(id));
  let cursor = 0;
  for (const id of left) {
    let taken = false;
    for (let k = 0; k < level.waves.length && !taken; k++) {
      const w = rebuilt[(cursor + k) % level.waves.length];
      const slots = w.spawns.filter((s) => !BOSS_DEFS[s.arch]);
      if (!slots.length) continue;
      const slot = slots[cursor % slots.length];
      if (slot.n > 1) { slot.n--; w.spawns.push({ arch: id, n: 1 }); } else slot.arch = id;
      taken = true; cursor++;
    }
  }
  const waves = rebuilt.map((w) => ({ budget: w.budget, spawns: mergeSpawns(w.spawns) }));
  return { waves: waves.slice(0, level.waves.length), bonusWave: waves[level.waves.length] };
}

/** The campaign a roster describes: LEVELS with each level's boss and enemy pool re-assigned. */
export function composeLevels(roster: Roster, warnings: string[] = []): LevelDef[] {
  const chars = roster.characters;
  const enemies = Object.keys(chars).filter((id) => chars[id].rank === 'enemy' && chars[id].enabled && ENEMY_DEFS[id]);
  const bosses = Object.keys(chars).filter((id) => chars[id].rank === 'boss' && chars[id].enabled && BOSS_DEFS[id]);
  return LEVELS.map((level) => {
    // a boss assigned to a level overrides the level's default boss; two overrides is a conflict
    const claimants = bosses.filter((id) => chars[id].levels.includes(level.index));
    const overrides = claimants.filter((id) => id !== level.boss);
    let boss = level.boss;
    if (overrides.length) {
      boss = overrides[0];
      if (overrides.length > 1) warnings.push(`level ${level.index}: ${overrides.join(', ')} all assigned — ${boss} takes it`);
    } else if (!claimants.length && !chars[level.boss]?.enabled) {
      warnings.push(`level ${level.index}: no boss assigned and ${level.boss} is disabled — it guards the level anyway`);
    }
    const pool = enemies.filter((id) => chars[id].levels.includes(level.index));
    return { ...level, boss, ...composeWaves(level, pool, bosses, warnings) };
  });
}

export type Readiness = Record<string, { status: 'ready' | 'failed' | 'legacy'; rank: Rank }>;

/** The roster that fields only characters that pass the art standard: ready heroes in the lobby,
 * ready enemies in every level's pool, ready bosses dealt round-robin across the ten levels (so a
 * boss is reused when there are fewer than ten — the backoffice shows the reuse). Names and any
 * other settings are kept from `base`. With no ready boss the default bosses stay. */
export function readyRoster(readiness: Readiness, base: Roster = defaultRoster()): Roster {
  const roster: Roster = { version: ROSTER_VERSION, characters: {} };
  const ready = (id: string) => readiness[id]?.status === 'ready';
  const readyBosses = Object.keys(base.characters).filter((id) => base.characters[id].rank === 'boss' && ready(id));
  for (const [id, e] of Object.entries(base.characters)) {
    const on = ready(id);
    let levels: number[] = e.rank === 'hero' ? [] : on ? LEVELS.map((l) => l.index) : [];
    if (e.rank === 'boss') levels = on ? LEVELS.map((l) => l.index).filter((n) => readyBosses[(n - 1) % readyBosses.length] === id) : [];
    roster.characters[id] = { ...e, enabled: on || (e.rank === 'boss' && !readyBosses.length && e.enabled), levels: e.rank === 'boss' && !readyBosses.length ? e.levels : levels };
  }
  return roster;
}

/** Points the sim at the roster: campaign levels, hero pool, display names. Call once at boot,
 * before any World exists; calling it again with defaultRoster() restores the static tables. */
export function applyRoster(roster: Roster): RosterResult {
  const warnings: string[] = [];
  const levels = composeLevels(roster, warnings);
  ACTIVE.levels = levels;
  const pool = heroPool(roster);
  if (pool.warning) warnings.push(pool.warning);
  ACTIVE_HEROES.splice(0, ACTIVE_HEROES.length, ...pool.heroes);
  for (const [id, entry] of Object.entries(roster.characters)) {
    if (entry.rank === 'hero' && HEROES[id as HeroId]) HEROES[id as HeroId].name = entry.name;
    else if (entry.rank === 'enemy' && ENEMY_DEFS[id]) ENEMY_DEFS[id].name = entry.name;
    else if (entry.rank === 'boss' && BOSS_DEFS[id]) BOSS_DEFS[id].name = entry.name;
  }
  return { levels, heroes: [...ACTIVE_HEROES], warnings };
}

/** Heroes the lobby currently offers (HERO_IDS until a roster narrows it). */
export const ACTIVE_HEROES: HeroId[] = [...HERO_IDS];

export const ROSTER_FILE = 'roster.json';

/** Fetches the saved roster from the active content pack; a missing or broken file yields the defaults. */
export async function loadRoster(): Promise<Roster> {
  try {
    const res = await fetch(getGameBase() + ROSTER_FILE, { cache: 'no-store' });
    if (!res.ok) return defaultRoster();
    return normalizeRoster(await res.json());
  } catch {
    return defaultRoster();
  }
}
