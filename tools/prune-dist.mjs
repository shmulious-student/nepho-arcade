// Strips build-time-only / non-runtime content out of dist/ after a Vite build. Vite copies all of
// public/ verbatim, but the runtime only ever loads public/game/** (minus debug/) — the PNG masters,
// anchor-inspection contact sheets, and promo art must never ship.
import { rmSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist', import.meta.url);
const toPrune = [
  'assets/generated', // PNG masters (source atlases)
  'assets/backups', // intake/replaced/brand backups of those masters (gitignored, hundreds of MB)
  'assets/nepho-hero-keyart.png', // promo key art — never loaded in-scene per the asset brief
  'assets/references', // quality-reference art, build-time only
  'game/debug', // anchor contact sheets + report.json, inspection-only
  'showcase.html', // dev-only animation review page
];

let prunedBytes = 0;
function dirSize(p) {
  let total = 0;
  for (const entry of readdirSync(p, { withFileTypes: true })) {
    const full = join(p, entry.name);
    total += entry.isDirectory() ? dirSize(full) : statSync(full).size;
  }
  return total;
}

for (const rel of toPrune) {
  const target = new URL(rel, DIST + '/');
  const path = target.pathname;
  if (!existsSync(path)) continue;
  const size = statSync(path).isDirectory() ? dirSize(path) : statSync(path).size;
  prunedBytes += size;
  rmSync(path, { recursive: true, force: true });
  console.log(`pruned dist/${rel} (${(size / 1048576).toFixed(1)} MB)`);
}
console.log(`total pruned: ${(prunedBytes / 1048576).toFixed(1)} MB`);
