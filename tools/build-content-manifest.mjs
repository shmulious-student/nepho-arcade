// Writes public/game/manifest.json: the content pack's file list with sizes and sha256 hashes and a
// content-hash `version`. The app (src/content/updater.ts) compares the manifest it ships with the
// one on the server and fetches only the files whose hash changed. Re-run after anything under
// public/game/ changes (npm run build:assets and npm run build both do).
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = new URL('../public/game/', import.meta.url).pathname;
const SKIP = new Set(['debug', 'manifest.json']); // inspection sheets never ship; the manifest does not list itself

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name) || entry.name.startsWith('.')) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out); else out.push(full);
  }
  return out;
}

const files = {};
for (const path of walk(ROOT).sort()) {
  const buf = readFileSync(path);
  files[relative(ROOT, path).split(sep).join('/')] = { size: buf.length, sha256: createHash('sha256').update(buf).digest('hex') };
}
// the version a server publishing this pack without a manifest reports (src/content/updater.ts derivedVersion)
function fnv1a(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h.toString(16); }
const derived = `derived:${JSON.parse(readFileSync(join(ROOT, 'catalog.json'), 'utf8')).generatedAt}:${fnv1a(readFileSync(join(ROOT, 'roster.json'), 'utf8'))}`;
const version = createHash('sha256').update(Object.entries(files).map(([rel, f]) => `${rel}:${f.sha256}`).join('\n')).digest('hex').slice(0, 16);
const total = Object.values(files).reduce((n, f) => n + f.size, 0);
writeFileSync(join(ROOT, 'manifest.json'), JSON.stringify({ version, derived, generatedAt: new Date().toISOString(), files }, null, 1) + '\n');
console.log(`content manifest: ${Object.keys(files).length} files, ${(total / 1048576).toFixed(1)} MB, version ${version}`);
