// Asset gates: verifies the runtime pack under public/game is complete and consistent.
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as ops from './asset-ops.mjs';
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/assets/generated');
const OUT = join(ROOT, 'public/game');
const fail = [];
const notes = [];
const check = (cond, msg) => { if (!cond) fail.push(msg); };

// Source-art gate. Which files to validate is read from the catalog's own `sourceFormat`/`source`
// fields rather than a hard-coded list, so a character that has moved to the per-action format is
// checked as 3x3 action grids and one still on an older grid is checked in its own format.
const po2 = (n) => (n & (n - 1)) === 0;
const loadSrc = async (path) => {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
};

// `strict` (the per-action format) turns art problems into failures; older formats only report them,
// since their art predates the standard and is what the game ships with until it is regenerated.
/** Share of the pixels in a thin ring around the sheet's edge that are transparent. */
function borderTransparency(img, margin = 4) {
  let clear = 0, n = 0;
  const at = (x, y) => img.data[(y * img.width + x) * 4 + 3] < 8;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (x >= margin && x < img.width - margin && y >= margin && y < img.height - margin) continue;
    n++; if (at(x, y)) clear++;
  }
  return n ? clear / n : 0;
}

async function checkSourceGrid(id, path, rows, cols, { square = false, strict = false } = {}) {
  if (!existsSync(path)) { fail.push(`${id}: source grid missing at ${path}`); return; }
  let img = await loadSrc(path);
  const keyed = ops.keyOutFlat(img); // a magenta matte counts as transparent — the build keys it
  if (keyed && keyed.keyed > 0.3) img = keyed.img;
  if (square) {
    check(img.width === img.height && po2(img.width), `${id}: must be a square power-of-two canvas (got ${img.width}x${img.height})`);
  }
  const opaque = ops.opaqueRatio(img);
  // Dense per-action sprites can legitimately occupy just over 40% of a cell (especially heavy
  // enemies with wide armor), and a boss set fills more than half of it. A baked checker or matte
  // covers the sheet's border too, so the border ring settles what a high ratio means: transparent
  // border → big figures, allowed up to 70%; opaque border → a background that was never removed.
  const borderClear = borderTransparency(img) > 0.95;
  check(opaque > 0.03 && opaque < (borderClear ? 0.7 : 0.45), `${id}: background must be true RGBA transparent (opaque ratio ${opaque.toFixed(3)}${borderClear ? '' : ', border not transparent'})`);
  const problems = [];
  const cells = ops.sliceFixed(img, rows, cols);
  cells.forEach((row, r) => row.forEach((f, c) => {
    if (!f.main) problems.push(`cell ${r},${c} is empty`);
    else if (f.clipped.length) problems.push(`cell ${r},${c} art is cut off at its ${f.clipped.join('/')} edge`);
  }));
  if (strict) for (const p of problems) fail.push(`${id}: ${p}`);
  else for (const p of problems) notes.push(`${id}: ${p}`);
}

async function checkSourcesFor(id, c) {
  if (c.variantOf) return; // recolours share their base's source art
  if (c.sourceFormat === 'actions') {
    for (const row of c.rows) await checkSourceGrid(`${id}/${row}`, join(SRC, 'actions', id, `${row}.png`), 3, 3, { square: true, strict: true });
    return;
  }
  // per-action overrides on an older grid are held to the same standard as a full set
  for (const row of Object.keys(c.frameCounts || {})) {
    const p = join(SRC, 'actions', id, `${row}.png`);
    if (existsSync(p)) await checkSourceGrid(`${id}/${row}`, p, 3, 3, { square: true, strict: true });
  }
  if (c.sourceFormat === 'pair') {
    for (const [i, rel] of c.source.split(' + ').entries()) {
      const path = join(ROOT, rel);
      if (!existsSync(path)) { fail.push(`${id}:${i + 1}: source grid missing at ${path}`); continue; }
      const img = await loadSrc(path);
      check(img.width === 2048 && img.height === 2048, `${id}:${i + 1}: paired masters must be 2048x2048 (got ${img.width}x${img.height})`);
      await checkSourceGrid(`${id}:${i + 1}`, path, 6, 6);
    }
  }
  // legacy single grids predate this gate and are covered by the build's own cut-occupancy warning
}

const catalogPath = join(OUT, 'catalog.json');
check(existsSync(catalogPath), 'catalog.json missing (run npm run build:assets)');
if (existsSync(catalogPath)) {
  const cat = JSON.parse(readFileSync(catalogPath, 'utf8'));
  check(cat.heroes.length >= 4, 'at least the four founding heroes expected'); // plus every later hero whose set is complete
  check(cat.enemies.length >= 6, 'at least six enemies expected');
  check(cat.bosses.length >= 10, 'the ten campaign bosses expected'); // plus any extra sets the roster can place
  check(cat.levels.length === 10, 'ten levels expected');
  let total = 0;
  for (const id of [...cat.heroes, ...cat.enemies, ...cat.bosses.map((b) => b.id)]) {
    const c = cat.characters[id];
    check(!!c, `character ${id} missing from catalog`);
    if (!c) continue;
    await checkSourcesFor(id, c);
    const atlas = join(OUT, c.atlas), data = join(OUT, c.data);
    check(existsSync(atlas), `${id}: atlas missing`);
    check(existsSync(data), `${id}: atlas json missing`);
    if (existsSync(atlas)) total += statSync(atlas).size;
    if (existsSync(data)) {
      const j = JSON.parse(readFileSync(data, 'utf8'));
      check(po2(j.meta.size.w) && po2(j.meta.size.h), `${id}: atlas ${j.meta.size.w}x${j.meta.size.h} is not power-of-two`);
      const countOf = (row) => c.frameCounts?.[row] ?? c.framesPerRow;
      const want = c.rows.reduce((a, row) => a + countOf(row), 0);
      const n = Object.keys(j.frames).length;
      check(n === want, `${id}: ${n} frames, expected ${want}`);
      for (const row of c.rows) for (let i = 0; i < countOf(row); i++) check(!!j.frames[`${row}/${i}`], `${id}: frame ${row}/${i} missing`);
      for (const f of Object.values(j.frames)) check(f.frame.w > 8 && f.frame.h > 8, `${id}: degenerate frame`);
    }
    if (c.kind === 'hero') {
      check(!!c.head, `${id}: head anchors missing`);
      for (const row of c.rows) check(c.head?.[row]?.length === (c.frameCounts?.[row] ?? c.framesPerRow), `${id}: head anchors for ${row}`);
    }
  }
  for (const l of cat.levels) for (const k of ['bg', 'entry', 'sign']) {
    const p = join(OUT, l[k]); check(existsSync(p), `level ${l.index}: ${k} missing`);
    if (existsSync(p)) total += statSync(p).size;
  }
  for (const b of cat.bosses) check(existsSync(join(OUT, b.portrait)), `portrait ${b.id} missing`);
  for (const h of cat.heroes) check(existsSync(join(OUT, 'cards', `${h}.webp`)), `card ${h} missing`);
  // 56 MB: every character on a per-action set (12 heroes/enemies/bosses at 2048×4096 webp q85 ≈ 1.0–1.6 MB each) —
  // the full planned roster of ~30 lands near 42 MB plus ~8 MB of levels/ui. Raised from 28 MB on 2026-09-13 when the
  // fifth regenerated boss (market-king) tipped it; the alternative, lower webp quality, shows on pixel art.
  check(total < 56 * 1024 * 1024, `runtime pack too large: ${(total / 1048576).toFixed(1)} MB`);
  console.log(`runtime pack: ${(total / 1048576).toFixed(1)} MB across characters+levels`);
  const fallbacks = Object.values(cat.characters).filter((c) => (c.notes || []).some((n) => n.startsWith('fallback')));
  for (const f of fallbacks) console.log(`NOTE ${f.id}: ${f.notes.find((n) => n.startsWith('fallback'))}`);
}
if (notes.length) {
  console.log(`${notes.length} source-art defect(s) in legacy grids (not gating; fixed only by regeneration, see docs/asset-prompts.md):`);
  for (const n of notes) console.log(' -', n);
}
if (fail.length) { console.error('ASSET GATE FAILED'); for (const f of fail) console.error(' -', f); process.exit(1); }
console.log('asset gates passed');
