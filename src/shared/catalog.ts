// Types + loader for public/game/catalog.json, the runtime asset manifest produced by
// tools/build-assets.mjs. Shared between the sim (for id lists) and the renderer (for atlas keys).

/** 'fx' is an animated effect sprite the renderer draws over a sim projectile (Pitz), built from a
 * per-action set like a character but with no roster entry, state machine or head rig. */
export type CharKind = 'hero' | 'enemy' | 'boss' | 'fx';

export interface CharacterEntry {
  id: string;
  kind: CharKind;
  atlas: string; // relative to /game/
  data: string;
  box: { w: number; h: number };
  anchor: { x: number; y: number };
  rows: string[];
  framesPerRow: number;
  scale: number;
  /** Extra factor the renderer must apply to the sprite: per-action grids are packed at a
   * supersampled resolution so detail survives the world zoom, and this scales them back to the
   * gameplay size the sim expects. Absent (treat as 1) for grids packed at 1:1. */
  renderScale?: number;
  /** Rows whose frame count differs from framesPerRow (a per-action override carries 9 frames). */
  frameCounts?: Record<string, number>;
  /** Pose hints measured by the build: the knockback frames on which an enemy lies on the floor. */
  poses?: { knockback?: { floor: [number, number] }; getup?: { rise: [number, number] } };
  skin: [number, number, number];
  outline: [number, number, number];
  head?: Record<string, ([number, number, number] | null)[]>; // per-row array of [dx,dy,width] in box-space (null = no figure in frame, hide the face), heroes only
  sourceFormat?: 'actions' | 'pair' | 'grid';
  variantOf?: string;
  notes: string[];
}

export interface LevelEntry {
  index: number;
  id: string;
  name: string;
  nameHe: string;
  accent: string;
  bg: string;
  entry: string;
  sign: string;
  signY: number;
  boss: string;
  size: { w: number; h: number };
  /** World rectangle the plate fills (sim/types ART_BAND for band plates, the legacy full-height
   * rect for old 941×334 plates). Absent in catalogs built before the band existed. */
  art?: { x: number; y: number; w: number; h: number };
}

export interface BossEntry { id: string; name: string; index: number; portrait: string }

export interface Catalog {
  version: number;
  generatedAt: string;
  characters: Record<string, CharacterEntry>;
  heroes: string[];
  /** effect sprites built from a per-action set (Pitz); absent in packs built before them */
  fx?: string[];
  enemies: string[];
  bosses: BossEntry[];
  levels: LevelEntry[];
}

/** Where the web build (and the copy packed into the app) serves the content pack from. */
export const GAME_BASE_BUNDLED = '/game/';

// The base every runtime load resolves against. The app build may repoint it at a newer content
// pack downloaded from the server (src/content/updater.ts) before anything is loaded; on the web it
// is always the bundled folder.
let gameBase = GAME_BASE_BUNDLED;

/** Repoints every subsequent asset URL (catalog, roster, atlases, backdrops…) at `base` (must end with '/'). */
export function setGameBase(base: string): void {
  gameBase = base.endsWith('/') ? base : base + '/';
}

export function getGameBase(): string {
  return gameBase;
}

export async function loadCatalog(): Promise<Catalog> {
  const res = await fetch(gameBase + 'catalog.json', { cache: 'no-store' });
  if (!res.ok) throw new Error(`catalog.json fetch failed: ${res.status}`);
  return res.json();
}

export function assetUrl(rel: string): string {
  return gameBase + rel;
}
