// Types + loader for public/game/catalog.json, the runtime asset manifest produced by
// tools/build-assets.mjs. Shared between the sim (for id lists) and the renderer (for atlas keys).

export type CharKind = 'hero' | 'enemy' | 'boss';

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
}

export interface BossEntry { id: string; name: string; index: number; portrait: string }

export interface Catalog {
  version: number;
  generatedAt: string;
  characters: Record<string, CharacterEntry>;
  heroes: string[];
  enemies: string[];
  bosses: BossEntry[];
  levels: LevelEntry[];
}

export const GAME_BASE = '/game/';

export async function loadCatalog(): Promise<Catalog> {
  const res = await fetch(GAME_BASE + 'catalog.json');
  if (!res.ok) throw new Error(`catalog.json fetch failed: ${res.status}`);
  return res.json();
}

export function assetUrl(rel: string): string {
  return GAME_BASE + rel;
}
