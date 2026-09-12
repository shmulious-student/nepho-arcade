// Pre-build acceptance gate for a delivered per-action character set (docs/character-art-standard.md).
//
//   node tools/verify-character.mjs <id> [--rank hero|enemy|boss] [--lenient]
//
// Reads public/assets/generated/actions/<id>/*.png and holds every file and every cell to the
// standard the game and the build actually depend on — the things that, when they were missed,
// cost a regeneration: a missing or misnamed action, a canvas that is not 2048² with real alpha,
// grid guide lines, a painted ground shadow, an empty or half-missing cell, art cut at a cell line,
// duplicated or near-identical frames, a figure whose size or baseline drifts between cells or
// between files, and rows whose beats do not match what the renderer plays (a walk that does not
// loop, a knockback that does not end on the floor, a getup that does not rise, a defeat that does
// not settle). Exit code 1 on any failure; the report names the file and the cell.
//
// Nothing here is heuristic-free: thresholds are set from the accepted sets (eviatar, the four
// per-action enemy sets, the four boss sets). --lenient downgrades the motion checks to warnings
// for art that is being reviewed by eye anyway.
import { existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as ops from './asset-ops.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
const rankArg = args.includes('--rank') ? args[args.indexOf('--rank') + 1] : null;
const lenient = args.includes('--lenient');
if (!id) { console.error('usage: node tools/verify-character.mjs <id> [--rank hero|enemy|boss] [--lenient]'); process.exit(2); }

const ACTIONS = {
  hero: ['idle', 'walk', 'dash', 'light1', 'light2', 'light3', 'heavy', 'special', 'block', 'hurt', 'knockdown', 'defeat'],
  enemy: ['idle', 'walk', 'attack', 'heavy', 'special', 'guard', 'hurt', 'knockback', 'getup', 'defeat'],
  boss: ['idle', 'approach', 'attack', 'special', 'hurt', 'defeat'],
};
const dir = join(ROOT, 'public/assets/generated/actions', id);
if (!existsSync(dir)) { console.error(`no such set: ${dir}`); process.exit(2); }
const present = readdirSync(dir).filter((f) => f.endsWith('.png')).map((f) => f.replace(/\.png$/, ''));
// rank from the files when not given: the set that matches best
const rank = rankArg || Object.keys(ACTIONS).sort((a, b) => ACTIONS[b].filter((x) => present.includes(x)).length - ACTIONS[a].filter((x) => present.includes(x)).length)[0];
const actions = ACTIONS[rank];

const fails = [], warns = [];
const fail = (m) => fails.push(m);
const warn = (m) => (lenient ? warns : fails).push(m);
const note = (m) => warns.push(m);

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}
const po2 = (n) => (n & (n - 1)) === 0;
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[(s.length / 2) | 0] : 0; };

/** Share of the pixels in a 4px ring around the sheet that are transparent. */
function borderClear(img) {
  let n = 0, clear = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) {
    if (x >= 4 && x < img.width - 4 && y >= 4 && y < img.height - 4) continue;
    n++; if (img.data[(y * img.width + x) * 4 + 3] < 8) clear++;
  }
  return clear / n;
}

/** 32×32 alpha thumbnail of the figure's bounding box — a cheap pose signature for duplicate detection. */
function signature(cell, main) {
  const w = main.x1 - main.x0 + 1, h = main.y1 - main.y0 + 1;
  const sig = new Float32Array(32 * 32);
  for (let y = main.y0; y <= main.y1; y++) for (let x = main.x0; x <= main.x1; x++) {
    if (cell.data[(y * cell.width + x) * 4 + 3] < 40) continue;
    const sx = Math.min(31, Math.floor(((x - main.x0) / w) * 32)), sy = Math.min(31, Math.floor(((y - main.y0) / h) * 32));
    sig[sy * 32 + sx] += 1;
  }
  const cellArea = (w / 32) * (h / 32);
  for (let i = 0; i < sig.length; i++) sig[i] = Math.min(1, sig[i] / cellArea);
  return sig;
}
const diff = (a, b) => { let d = 0; for (let i = 0; i < a.length; i++) d += Math.abs(a[i] - b[i]); return d / a.length; };

const perFile = {};
const binaryAlpha = [];
for (const action of actions) {
  const path = join(dir, `${action}.png`);
  if (!existsSync(path)) { fail(`${action}.png: missing — the set is incomplete (${rank} needs ${actions.length} files)`); continue; }
  let img = await loadRaw(path);
  const tag = `${action}.png`;
  // canvas
  if (img.width !== img.height || !po2(img.width)) fail(`${tag}: canvas must be a square power of two (got ${img.width}×${img.height})`);
  else if (img.width < 2048) warn(`${tag}: ${img.width}² — the standard is 2048² (detail suffers below it)`);
  // transparency
  const keyed = ops.keyOutFlat(img);
  if (keyed && keyed.keyed > 0.3) { img = keyed.img; note(`${tag}: flat matte rgb(${keyed.key}) keyed out — deliver real alpha next time`); }
  const alphaVals = ops.alphaValues(img);
  const opaque = ops.opaqueRatio(img);
  const ring = borderClear(img);
  if (opaque > 0.9) fail(`${tag}: background is not transparent (${(opaque * 100).toFixed(0)}% opaque — a painted checkerboard or matte)`);
  else if (ring < 0.95) fail(`${tag}: the outer border is not transparent (${(ring * 100).toFixed(0)}% clear) — something is painted up to the canvas edge`);
  if (alphaVals <= 2) binaryAlpha.push(action);
  // grid guide lines
  const stripped = ops.stripGridLines(img, 3, 3);
  if (stripped.cleared > 500) { fail(`${tag}: grid guide lines drawn along the cell boundaries (${stripped.cleared} px) — the canvas must contain only the 9 frames`); img = stripped.img; }
  // cells
  const cells = ops.sliceFixed(img, 3, 3).flat();
  const cw = img.width / 3;
  const info = [];
  cells.forEach((f, i) => {
    const c = `${tag} cell ${Math.floor(i / 3)},${i % 3} (frame ${i + 1})`;
    if (!f.main || f.main.size < cw * cw * 0.01) { fail(`${c}: empty — every cell must hold a distinct frame`); info.push(null); return; }
    if (f.clipped.length) fail(`${c}: art is cut off at its ${f.clipped.join('/')} edge — keep a generous margin, nothing may touch a cell line`);
    const m = f.main;
    const h = m.y1 - m.y0 + 1, w = m.x1 - m.x0 + 1;
    // a painted ground shadow: a wide, dark, colourless blob detached under the feet (dust, sparks
    // and paint at foot level are effects and are fine)
    for (const o of f.comps) {
      if (o === m || o.size < 300 || o.size > m.size * 0.15) continue;
      if (o.y0 < m.y1 - h * 0.08 || o.x1 <= m.x0 || o.x0 >= m.x1 || (o.x1 - o.x0) < w * 0.3) continue;
      let lum = 0, sat = 0, n = 0;
      for (let y = o.y0; y <= o.y1; y++) for (let x = o.x0; x <= o.x1; x++) {
        const i = y * f.cell.width + x; if (f.labels[i] !== o.id) continue;
        const r = f.cell.data[i * 4], g = f.cell.data[i * 4 + 1], b = f.cell.data[i * 4 + 2];
        lum += (r + g + b) / 3; sat += Math.max(r, g, b) - Math.min(r, g, b); n++;
      }
      if (n && lum / n < 110 && sat / n < 50) { warn(`${c}: a dark flat blob is painted under the feet (${o.size} px) — no ground shadow; the game draws its own`); break; }
    }
    info.push({ h, w, bottom: m.y1, cx: m.sx / m.size, sig: signature(f.cell, m), size: m.size });
  });
  perFile[action] = { info, cw };
}

// ---- cross-frame checks (per file) ----
for (const action of actions) {
  const pf = perFile[action]; if (!pf) continue;
  const rows = pf.info; const tag = `${action}.png`;
  const valid = rows.filter(Boolean);
  if (valid.length < 9) continue;
  // a frame drawn at a fraction of the others' size: a figure lying down keeps most of its pixel
  // area, so a big drop means the generator shrank the figure (the build would reject the frame)
  const medArea = median(valid.map((r) => r.size));
  rows.forEach((r, i) => { if (r && r.size < medArea * 0.45) fail(`${tag}: frame ${i + 1} is drawn far smaller than the rest of the row (${Math.round((r.size / medArea) * 100)}% of the median area) — same figure size in every frame; a fallen figure lies flat, it does not shrink`); });
  // duplicates: a repeated frame is the generator padding the row
  for (let i = 0; i < 9; i++) for (let j = i + 1; j < 9; j++) {
    if (Math.abs(rows[i].h - rows[j].h) <= 2 && Math.abs(rows[i].w - rows[j].w) <= 2 && diff(rows[i].sig, rows[j].sig) < 0.015) {
      fail(`${tag}: frames ${i + 1} and ${j + 1} are the same pose — every frame must be distinct, never pad with a repeat`);
    }
  }
  // baseline: feet on one line in the grounded rows
  // rows whose feet never leave the ground (heavy/special/light3 may jump or spin)
  const grounded = ['idle', 'walk', 'attack', 'light1', 'light2', 'block', 'guard', 'approach'].includes(action);
  if (grounded) {
    const bottoms = valid.map((r) => r.bottom); const medB = median(bottoms);
    valid.forEach((r, i) => { if (Math.abs(r.bottom - medB) > pf.cw * 0.08) warn(`${tag}: frame ${i + 1} feet are ${Math.round(r.bottom - medB)} px off the row's baseline — identical bottom-centre anchor in all 9 cells`); });
    const xs = valid.map((r) => r.cx); const medX = median(xs);
    valid.forEach((r, i) => { if (Math.abs(r.cx - medX) > pf.cw * 0.18) warn(`${tag}: frame ${i + 1} is ${Math.round(r.cx - medX)} px off the row's centre axis — the body stays on one vertical axis`); });
  }
}

// ---- cross-file checks: one character, one size ----
const upright = actions.filter((a) => ['idle', 'walk', 'attack', 'heavy', 'light1', 'light2', 'block', 'guard', 'approach'].includes(a) && perFile[a]);
const refH = median(upright.flatMap((a) => perFile[a].info.filter(Boolean).map((r) => r.h)));
for (const a of upright) {
  const hs = perFile[a].info.filter(Boolean).map((r) => r.h); const m = median(hs);
  if (Math.abs(m - refH) > refH * 0.12) fail(`${a}.png: the figure is ${m > refH ? 'larger' : 'smaller'} than in the other files (${Math.round(m)} vs ${Math.round(refH)} px tall) — one character, one size, in every file`);
}
if (refH && refH < perFile[upright[0]]?.cw * 0.45) warn(`figure is small in its cell (${Math.round(refH)} px of ${Math.round(perFile[upright[0]].cw)}) — fill 55–75% of the cell height`);

// ---- row semantics: what the renderer will do with each row ----
const H = (a) => perFile[a]?.info.map((r) => (r ? r.h : 0));
const S = (a) => perFile[a]?.info;
if (S('walk') && S('walk').every(Boolean)) {
  const s = S('walk'); if (diff(s[0].sig, s[8].sig) > 0.4) note('walk.png: frame 9 looks far from frame 1 — the walk loops; confirm on /showcase.html?row=walk that the last frame leads back into the first');
}
if (S('idle') && S('idle').every(Boolean)) {
  const s = S('idle'); const spread = Math.max(...s.map((r) => r.h)) - Math.min(...s.map((r) => r.h));
  if (spread > refH * 0.2) warn(`idle.png: the figure's height varies ${spread} px across the loop — idle is a subtle breathing loop, not a set of different poses`);
}
if (H('defeat')) {
  const h = H('defeat'); const flat = Math.min(...h);
  if (h[8] > refH * 0.55 || h[7] > flat * 1.35) warn('defeat.png: the last two frames must be flat on the ground and settled — the renderer holds the final frame for as long as the body stays');
  if (h[0] < refH * 0.7) warn('defeat.png: frame 1 must still be upright — the fall is the animation');
}
if (rank === 'enemy' && H('knockback')) {
  const h = H('knockback'); const flat = Math.min(...h); const at = h.indexOf(flat);
  if (flat > refH * 0.75) warn('knockback.png: no frame lies flat on the floor — the fall must end with the figure down (the renderer holds that frame while the enemy is knocked down)');
  if (h[8] > flat * 1.5 && at < 8) note(`knockback.png: the row rises again after the floor frame (frame ${at + 1}) — allowed, the renderer stops on the floor; getup.png is the rise`);
}
if (rank === 'enemy' && H('getup')) {
  const h = H('getup'); const at = h.indexOf(Math.min(...h));
  if (at > 2) warn(`getup.png: the lowest frame is frame ${at + 1} — a getup starts on the floor and rises; it must not dip first`);
  if (h[8] < refH * 0.85) warn('getup.png: frame 9 must be back on its feet at full height');
}
if (rank === 'hero' && H('knockdown')) {
  const h = H('knockdown'); const flat = Math.min(...h);
  if (flat > refH * 0.75) warn('knockdown.png: no frame lies flat — stagger → fall → on the floor → rising → on feet');
  if (h[8] < refH * 0.85) warn('knockdown.png: frame 9 must be back on its feet');
}
if (H('hurt')) {
  const h = H('hurt');
  if (Math.min(...h.slice(0, 3)) < refH * 0.75) warn('hurt.png: frames 1–3 are the flinch and stay upright (a light hit only shows these)');
}

if (binaryAlpha.length) note(`binary (hard-edged) alpha in ${binaryAlpha.length} file(s) — acceptable, the build feathers the edge`);

// ---- report ----
console.log(`verify-character ${id} (${rank}, ${actions.length} actions, ${present.length} files present)`);
for (const w of warns) console.log('  note  ' + w);
for (const f of fails) console.log('  FAIL  ' + f);
if (fails.length) { console.log(`\n${fails.length} failure(s) — regenerate the named files/cells, then run again.`); process.exit(1); }
console.log(`\nPASS — ${id} meets the standard. Next: npm run build:assets && npm run test:assets, then watch it on /showcase.html.`);
