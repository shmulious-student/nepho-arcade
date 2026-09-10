// Asset gates: verifies the runtime pack under public/game is complete and consistent.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/game');
const fail = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };
const catalogPath = join(OUT, 'catalog.json');
check(existsSync(catalogPath), 'catalog.json missing (run npm run build:assets)');
if (existsSync(catalogPath)) {
  const cat = JSON.parse(readFileSync(catalogPath, 'utf8'));
  check(cat.heroes.length === 4, 'four heroes expected');
  check(cat.enemies.length >= 6, 'at least six enemies expected');
  check(cat.bosses.length === 10, 'ten bosses expected');
  check(cat.levels.length === 10, 'ten levels expected');
  let total = 0;
  for (const id of [...cat.heroes, ...cat.enemies, ...cat.bosses.map((b) => b.id)]) {
    const c = cat.characters[id];
    check(!!c, `character ${id} missing from catalog`);
    if (!c) continue;
    const atlas = join(OUT, c.atlas), data = join(OUT, c.data);
    check(existsSync(atlas), `${id}: atlas missing`);
    check(existsSync(data), `${id}: atlas json missing`);
    if (existsSync(atlas)) total += statSync(atlas).size;
    if (existsSync(data)) {
      const j = JSON.parse(readFileSync(data, 'utf8'));
      const n = Object.keys(j.frames).length;
      check(n === c.rows.length * c.framesPerRow, `${id}: ${n} frames, expected ${c.rows.length * c.framesPerRow}`);
      for (const row of c.rows) for (let i = 0; i < c.framesPerRow; i++) check(!!j.frames[`${row}/${i}`], `${id}: frame ${row}/${i} missing`);
      for (const f of Object.values(j.frames)) check(f.frame.w > 8 && f.frame.h > 8, `${id}: degenerate frame`);
    }
    if (c.kind === 'hero') {
      check(!!c.head, `${id}: head anchors missing`);
      for (const row of c.rows) check(c.head?.[row]?.length === c.framesPerRow, `${id}: head anchors for ${row}`);
    }
  }
  for (const l of cat.levels) for (const k of ['bg', 'entry', 'sign']) {
    const p = join(OUT, l[k]); check(existsSync(p), `level ${l.index}: ${k} missing`);
    if (existsSync(p)) total += statSync(p).size;
  }
  for (const b of cat.bosses) check(existsSync(join(OUT, b.portrait)), `portrait ${b.id} missing`);
  for (const h of cat.heroes) check(existsSync(join(OUT, 'cards', `${h}.webp`)), `card ${h} missing`);
  check(total < 16 * 1024 * 1024, `runtime pack too large: ${(total / 1048576).toFixed(1)} MB`);
  console.log(`runtime pack: ${(total / 1048576).toFixed(1)} MB across characters+levels`);
  const fallbacks = Object.values(cat.characters).filter((c) => c.variantOf && !['punk-b', 'brawler-b', 'knight-b'].includes(c.id));
  for (const f of fallbacks) console.log(`NOTE ${f.id} is a fallback variant of ${f.variantOf}: ${f.notes.at(-1)}`);
}
if (fail.length) { console.error('ASSET GATE FAILED'); for (const f of fail) console.error(' -', f); process.exit(1); }
console.log('asset gates passed');
