// Remote content pack for the app build. Everything the game loads at runtime lives under /game/
// (catalog.json, roster.json and every atlas, backdrop, sign, portrait, card and UI file the catalog
// names). The web build serves that folder from the site; the app ships a copy inside the APK and,
// at every boot, compares it with the pack published at CONTENT_URL. A newer pack is downloaded
// into the app's private data directory and served from there — so art, characters, the level
// list and the roster can change without shipping a new APK. Offline, or when the server is
// unreachable, the newest complete pack already on the device (downloaded or bundled) is used.
//
// A pack is described by manifest.json (tools/build-content-manifest.mjs): a content-hash `version`
// and every file's size + sha256, so only changed files are fetched. A server without a manifest
// still works — the pack is then derived from catalog.json + roster.json (the same file list
// BootScene queues) and versioned by the catalog's generatedAt, at the cost of a full re-download
// whenever it changes.
import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { GAME_BASE_BUNDLED, setGameBase, type Catalog } from '../shared/catalog';

/** Where the app looks for the content pack. Override at build time with VITE_CONTENT_URL. */
export const CONTENT_URL: string = ((import.meta.env.VITE_CONTENT_URL as string | undefined) ||
  'https://raw.githubusercontent.com/shmulious-student/nepho-arcade/game/core/public/game/').replace(/\/?$/, '/');

export interface Manifest {
  version: string;
  /** the version a server without a manifest would report for this same pack (see fetchManifest) */
  derived?: string;
  generatedAt?: string;
  /** size -1 / no sha256 = unknown (a pack derived from the catalog) */
  files: Record<string, { size: number; sha256?: string }>;
}

/** What is on the device: `version` is '' while a download is incomplete (never served, but the
 * files already fetched are reused on the next attempt). */
interface State { version: string; files: Record<string, string> }

export interface SyncResult {
  source: 'bundled' | 'installed' | 'downloaded';
  version: string;
  note?: string;
}
export type Progress = (label: string, fraction?: number) => void;

const STATE_PATH = 'content/state.json';
const FILES_PATH = 'content/files';
const FETCH_TIMEOUT_MS = 8000;

/** The files BootScene loads, listed the same way BootScene queues them. */
export function filesFromCatalog(catalog: Catalog): string[] {
  const files = new Set<string>(['catalog.json', 'roster.json', 'ui/logo.svg', 'fx/pitz.webp']);
  for (const c of Object.values(catalog.characters)) { files.add(c.atlas); files.add(c.data); }
  for (const l of catalog.levels) { files.add(l.bg); files.add(l.entry); files.add(l.sign); }
  for (const b of catalog.bosses) files.add(b.portrait);
  for (const h of catalog.heroes) files.add(`cards/${h}.webp`);
  return [...files];
}

/** Must match tools/build-content-manifest.mjs. */
export function derivedVersion(generatedAt: string, rosterText: string): string {
  return `derived:${generatedAt}:${fnv1a(rosterText)}`;
}

function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16);
}

async function fetchWithTimeout(url: string, ms = FETCH_TIMEOUT_MS): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try { return await fetch(url, { cache: 'no-store', signal: ctl.signal }); } finally { clearTimeout(t); }
}

/** The pack the server publishes, or null when it publishes nothing at all. Throws when unreachable. */
export async function fetchManifest(base: string): Promise<Manifest | null> {
  const bust = `?t=${Date.now()}`;
  const res = await fetchWithTimeout(base + 'manifest.json' + bust);
  if (res.ok) {
    const m = (await res.json()) as Manifest;
    if (m && typeof m.version === 'string' && m.files && typeof m.files === 'object') return m;
    throw new Error('manifest.json is not a content manifest');
  }
  if (res.status !== 404) throw new Error(`manifest.json ${res.status}`);
  // no manifest published: derive the pack from the catalog, versioned by generatedAt + roster
  const cat = await fetchWithTimeout(base + 'catalog.json' + bust);
  if (!cat.ok) return null;
  const catalog = (await cat.json()) as Catalog;
  const ros = await fetchWithTimeout(base + 'roster.json' + bust);
  const rosterText = ros.ok ? await ros.text() : '';
  const files: Manifest['files'] = {};
  for (const rel of filesFromCatalog(catalog)) files[rel] = { size: -1 };
  return { version: derivedVersion(catalog.generatedAt, rosterText), files };
}

async function readState(): Promise<State | null> {
  try {
    const r = await Filesystem.readFile({ path: STATE_PATH, directory: Directory.Data, encoding: Encoding.UTF8 });
    const s = JSON.parse(String(r.data)) as State;
    return s && typeof s.version === 'string' && s.files && typeof s.files === 'object' ? s : null;
  } catch { return null; }
}

async function writeState(s: State): Promise<void> {
  await Filesystem.writeFile({ path: STATE_PATH, directory: Directory.Data, encoding: Encoding.UTF8, data: JSON.stringify(s), recursive: true });
}

async function installedBase(): Promise<string> {
  const { uri } = await Filesystem.getUri({ path: FILES_PATH, directory: Directory.Data });
  return Capacitor.convertFileSrc(uri).replace(/\/?$/, '/');
}

/** downloadFile's `recursive` does not create parent folders on Android (ENOENT), so make them first. */
async function ensureDir(rel: string): Promise<void> {
  const dir = rel.includes('/') ? rel.slice(0, rel.lastIndexOf('/')) : '';
  try { await Filesystem.mkdir({ path: `${FILES_PATH}/${dir}`, directory: Directory.Data, recursive: true }); } catch { /* already there */ }
}

async function fileSize(rel: string): Promise<number> {
  try {
    const st = await Filesystem.stat({ path: `${FILES_PATH}/${rel}`, directory: Directory.Data });
    return Number(st.size);
  } catch { return -1; }
}

/** catalog.json and roster.json index everything else, so they are fetched last: an interrupted
 * download can never leave a new index pointing at files that are not there yet. */
function downloadOrder(rels: string[]): string[] {
  const index = (r: string) => (r === 'catalog.json' ? 2 : r === 'roster.json' ? 1 : 0);
  return [...rels].sort((a, b) => index(a) - index(b) || a.localeCompare(b));
}

/** Points the loader at the freshest complete pack. Never throws: any failure keeps the previous one. */
export async function syncContent(progress: Progress = () => {}): Promise<SyncResult> {
  if (!Capacitor.isNativePlatform()) return { source: 'bundled', version: 'web' };

  let bundled: Manifest | null = null;
  try {
    const r = await fetch(GAME_BASE_BUNDLED + 'manifest.json');
    if (r.ok) bundled = (await r.json()) as Manifest;
  } catch { /* the bundle carries no manifest */ }
  const installed = await readState();
  const complete = installed && installed.version ? installed : null;
  const serveInstalled = async (source: SyncResult['source'], version: string, note?: string): Promise<SyncResult> => {
    setGameBase(await installedBase());
    return { source, version, note };
  };
  const serveFallback = (note: string): Promise<SyncResult> =>
    complete ? serveInstalled('installed', complete.version, note) : Promise.resolve({ source: 'bundled', version: bundled?.version ?? 'unknown', note });

  let remote: Manifest | null;
  try {
    progress('checking for new content…');
    remote = await fetchManifest(CONTENT_URL);
  } catch (err) {
    console.warn('content: server unreachable', err);
    return serveFallback('offline');
  }
  if (!remote) return serveFallback('server has no pack');
  if (bundled && (remote.version === bundled.version || remote.version === bundled.derived)) return { source: 'bundled', version: bundled.version };
  if (complete && remote.version === complete.version) return serveInstalled('installed', complete.version);

  // fetch what changed (everything, when the hashes are unknown) into the data directory
  const rels = downloadOrder(Object.keys(remote.files));
  const next: State = { version: '', files: {} };
  try {
    for (let i = 0; i < rels.length; i++) {
      const rel = rels[i], want = remote.files[rel];
      progress(`updating content ${i + 1}/${rels.length}`, i / rels.length);
      const have = installed?.files[rel];
      if (have && want.sha256 && have === want.sha256 && (want.size < 0 || (await fileSize(rel)) === want.size)) {
        next.files[rel] = have;
        continue;
      }
      await ensureDir(rel);
      await Filesystem.downloadFile({
        url: CONTENT_URL + rel + `?v=${encodeURIComponent(remote.version)}`,
        path: `${FILES_PATH}/${rel}`,
        directory: Directory.Data,
        recursive: true,
      });
      if (want.size >= 0) {
        const got = await fileSize(rel);
        if (got !== want.size) throw new Error(`${rel}: got ${got} bytes, expected ${want.size}`);
      }
      next.files[rel] = want.sha256 ?? '';
      await writeState(next); // progress survives an interruption
    }
    next.version = remote.version;
    await writeState(next);
    progress('content updated', 1);
    if (installed) {
      for (const rel of Object.keys(installed.files)) {
        if (!(rel in next.files)) Filesystem.deleteFile({ path: `${FILES_PATH}/${rel}`, directory: Directory.Data }).catch(() => {});
      }
    }
    return serveInstalled('downloaded', remote.version);
  } catch (err) {
    console.warn('content: update failed, keeping the previous pack', err);
    await writeState(next).catch(() => {});
    return serveFallback('update failed');
  }
}
