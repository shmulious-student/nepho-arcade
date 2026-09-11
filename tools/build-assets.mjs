// Asset pipeline: slices the generated source atlases in public/assets/generated into the runtime pack
// under public/game. Run with `npm run build:assets`. Re-run whenever a corrected master is dropped in.
import sharp from 'sharp';
import { mkdirSync, existsSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ops from './asset-ops.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/assets/generated');
const OUT = join(ROOT, 'public/game');
const DEBUG = join(OUT, 'debug');
for (const d of ['chars', 'levels', 'portraits', 'cards', 'ui', 'debug']) mkdirSync(join(OUT, d), { recursive: true });

const overridesPath = join(ROOT, 'art-overrides.json');
const overrides = existsSync(overridesPath) ? JSON.parse(readFileSync(overridesPath, 'utf8')) : {};
const only = process.argv.includes('--only') ? process.argv[process.argv.indexOf('--only') + 1] : null;
const report = { generatedAt: new Date().toISOString(), sources: {}, characters: {}, warnings: [] };
const warn = (m) => { console.warn('WARN', m); report.warnings.push(m); };

// `body` is the runtime figure height in world px (what the sim/camera is tuned for). Legacy grids
// are downsampled straight to it; per-action grids (see ACTION_GRID) keep SUPERSAMPLE× more pixels
// in the atlas and the renderer scales them back down, so the extra source detail survives the 1.7×
// world zoom instead of being thrown away at build time.
const HERO = { kind: 'hero', body: 128, rows: ['idle', 'walk', 'attack', 'heavy', 'dash', 'special', 'hurt', 'defeat'], frames: 6, head: true };
const ENEMY = { kind: 'enemy', body: 104, rows: ['idle', 'walk', 'attack', 'heavy', 'special', 'hurt', 'knockback', 'defeat'], frames: 6, head: false };
const BOSS = { kind: 'boss', body: 176, rows: ['idle', 'approach', 'attack', 'special', 'hurt', 'defeat'], frames: 8, head: false };
const SUPERSAMPLE = 1.7;

// Per-action source format (docs/asset-prompts.md): public/assets/generated/actions/<id>/<action>.png,
// one square power-of-two image per action holding a 3×3 grid of 9 frames read row-major. A character
// switches to this format only when every action in its list is present, so a half-delivered set never
// mixes two art styles in one atlas.
const ACTION_GRID = { rows: 3, cols: 3 };
const HERO_ACTIONS = ['idle', 'walk', 'dash', 'light1', 'light2', 'light3', 'heavy', 'special', 'block', 'hurt', 'knockdown', 'defeat'];
const ENEMY_ACTIONS = ['idle', 'walk', 'attack', 'heavy', 'special', 'guard', 'hurt', 'knockback', 'getup', 'defeat'];
const BOSS_ACTIONS = ['idle', 'approach', 'attack', 'special', 'hurt', 'defeat'];

// Heroes whose art has not been delivered yet ship as a recolour of an older hero's grid, so the
// roster is playable end to end while the real sets are generated (docs/hero-prompts-eviatar-omri.md).
// Eviatar (tall, strong; green + blue) stands in on Bruiser's build shifted to green; Omri (lean,
// fast; red + white) on Nepho's shifted to red.
const HERO_STAND_INS = {
  eviatar: { from: 'bruiser', remap: { h0: 5, h1: 55, delta: 110 } },
  omri: { from: 'nepho', remap: { h0: 150, h1: 200, delta: 180 } },
};
const hasAnySource = (src) => src.kind !== 'grid' || existsSync(src.file);

const BOSSES = [
  ['ferryman', 'Ferryman'], ['glass-warden', 'Glass Warden'], ['kilnheart', 'Kilnheart'], ['monk-zero', 'Monk Zero'],
  ['market-king', 'Market King'], ['railmaw', 'Railmaw'], ['crown-runner', 'Crown Runner'], ['the-null', 'The Null'],
  ['vault-mother', 'Vault Mother'], ['ultra-signal', 'Ultra Signal'],
];
const BOSS_FILES = ['boss-00-ferryman-grid.png', 'boss-01-glass-warden-grid.png', 'boss-02-kilnheart-grid.png', 'boss-03-monk-zero-grid.png',
  'boss-04-market-king-grid.png', 'boss-05-railmaw-grid.png', 'boss-06-crown-runner-grid.png', 'boss-07-the-null-grid.png',
  'boss-08-vault-mother-grid.png', 'boss-09-ultra-signal-grid.png'];
const ENEMY_FILES = ['enemy-00-red-punk-grid.png', 'enemy-01-hood-chain-grid.png', 'enemy-02-orange-brawler-grid.png',
  'enemy-03-purple-fighter-grid.png', 'enemy-04-cyan-knight-grid.png', 'enemy-05-shield-soldier-grid.png'];
const ENEMY_IDS = ['punk', 'chainer', 'brawler', 'kicker', 'knight', 'shield'];

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}
async function saveWebp(img, path, quality = 85) {
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.width, height: img.height, channels: 4 } })
    .webp({ quality, alphaQuality: 95, effort: 4 }).toFile(path);
}
async function savePng(img, path) {
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.width, height: img.height, channels: 4 } })
    .png({ compressionLevel: 6 }).toFile(path);
}
const nextPo2 = (n) => 2 ** Math.ceil(Math.log2(Math.max(1, n)));
const median = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[(s.length / 2) | 0] : 0; };

function sourceStats(id, img) {
  const s = { width: img.width, height: img.height, opaqueRatio: +ops.opaqueRatio(img).toFixed(3), alphaValues: ops.alphaValues(img) };
  report.sources[id] = s;
  return s;
}

const HERO_ROWS_12 = ['idle', 'walk', 'dash', 'light1', 'light2', 'light3', 'heavy', 'special', 'block', 'hurt', 'knockdown', 'defeat'];
const ENEMY_ROWS_12 = ['idle', 'walk', 'approach', 'attack', 'combo', 'heavy', 'special', 'guard', 'hurt', 'knockback', 'getup', 'defeat'];

// ---------- character grids ----------
// Resolves the best available source for a character, most detailed format first:
//   { kind: 'actions', files: [[action, path], ...] }  per-action 3×3 grids
//   { kind: 'pair', files: [part1, part2] }            two 6×6 2048px grids = 12 rows
//   { kind: 'grid', file }                             one auto-detected legacy grid
function resolveSource(id, actions, pairFiles, gridFile) {
  const dir = join(SRC, 'actions', id);
  if (existsSync(dir)) {
    const files = actions.map((a) => [a, join(dir, `${a}.png`)]);
    const missing = files.filter(([, p]) => !existsSync(p)).map(([a]) => a);
    if (!missing.length) return { kind: 'actions', files };
    // a partial set patches the older grid row by row — the way to fix just the broken actions
    const overrides = files.filter(([, p]) => existsSync(p));
    if (overrides.length) console.log(`${id}: ${overrides.length} action override(s) on top of the older grid: ${overrides.map(([a]) => a).join(', ')}`);
    const base = pairFiles && pairFiles.every((p) => existsSync(p)) ? { kind: 'pair', files: pairFiles } : { kind: 'grid', file: gridFile };
    return { ...base, overrides };
  }
  if (pairFiles && pairFiles.every((p) => existsSync(p))) return { kind: 'pair', files: pairFiles };
  return { kind: 'grid', file: gridFile };
}

async function loadCleaned(path, id, notes, { strict = false } = {}) {
  let img = await loadRaw(path);
  const stats = sourceStats(id, img);
  if (stats.opaqueRatio > 0.9) {
    // a flat matte (magenta from a model without alpha) is keyed; anything else is a baked checker
    const keyed = ops.keyOutFlat(img);
    if (keyed && keyed.keyed > 0.3) { img = keyed.img; notes.push(`keyed out flat matte rgb(${keyed.key})`); return ops.defringe(img, 2); }
    img = ops.unbakeChecker(img);
    const after = ops.opaqueRatio(img);
    notes.push(`unbaked checker: opaque ${stats.opaqueRatio} -> ${after.toFixed(3)}`);
    if (strict && (after < 0.15 || after > 0.5)) { warn(`${id}: checker unbake failed (opaque ${after.toFixed(3)})`); return null; }
  }
  if (stats.alphaValues <= 2) { img = ops.featherAlpha(img); notes.push('feathered binary alpha'); }
  return ops.defringe(img, 2);
}

function frameDefects(f, rowMedianSize, { allowDetached = false } = {}) {
  const out = [];
  if (!f.main) return ['empty'];
  if (f.clipped?.length) out.push(`cut-${f.clipped.join('+')}`);
  if (f.main.size < rowMedianSize * 0.55) out.push('partial-figure');
  // a second blob a good fraction of the figure's size, detached from it: a severed limb or shoe
  const gap = (m) => Math.hypot(Math.max(0, m.x0 - f.main.x1, f.main.x0 - m.x1), Math.max(0, m.y0 - f.main.y1, f.main.y0 - m.y1));
  const cellW = f.cell.width / (1 + 2 * 0.35);
  if (!allowDetached) for (const m of f.comps || []) {
    if (m === f.main) continue;
    if (m.size >= f.main.size * 0.08 && gap(m) > cellW * 0.04) { out.push('severed-part'); break; }
  }
  return out;
}

function substituteDefectiveFrames(cells, rowNames, options) {
  const replaced = [];
  const rejected = []; // the original cells, for the review sheet
  cells.forEach((row, r) => {
    const sizes = row.map((f) => (f.main ? f.main.size : 0)).filter(Boolean);
    const med = median(sizes);
    const bad = row.map((f) => frameDefects(f, med, options));
    const cleanIdx = bad.map((d, i) => (d.length ? -1 : i)).filter((i) => i >= 0);
    if (!cleanIdx.length) { replaced.push(`${rowNames[r]}:no-clean-frame-kept-as-is`); return; }
    row.forEach((f, c) => {
      if (!bad[c].length) return;
      const src = cleanIdx.reduce((a, i) => (Math.abs(i - c) < Math.abs(a - c) ? i : a), cleanIdx[0]);
      rejected.push({ key: `${rowNames[r]}/${c}`, why: bad[c].join(','), cell: f.cell, from: row[src].cell });
      row[c] = { ...row[src], substituteFor: c, defects: bad[c] };
      replaced.push(`${rowNames[r]}/${c}(${bad[c].join(',')})->${src}`);
    });
  });
  return Object.assign(replaced, { rejected });
}

// Review sheet: every rejected source cell (left) beside the clean frame that stands in for it (right).
async function defectSheet(id, rejected) {
  if (!rejected.length) return;
  const cw = Math.max(...rejected.map((r) => r.cell.width)), ch = Math.max(...rejected.map((r) => r.cell.height));
  const sheet = ops.makeImage(2 * cw + 12, rejected.length * (ch + 4));
  rejected.forEach((r, i) => {
    const oy = i * (ch + 4);
    ops.drawRect(sheet, 0, oy, cw, ch, [120, 40, 40]);
    ops.drawRect(sheet, cw + 12, oy, cw, ch, [40, 100, 60]);
    ops.blit(sheet, r.cell, 0, oy);
    ops.blit(sheet, r.from, cw + 12, oy);
  });
  await savePng(sheet, join(DEBUG, `defects-${id}.png`));
  writeFileSync(join(DEBUG, `defects-${id}.txt`), rejected.map((r) => `${r.key}: ${r.why}`).join('\n') + '\n');
}

// `emit: false` builds the atlas in memory only — for a grid that is just the base of a recolour.
async function processCharacter(id, source, baseSpec, { emit = true } = {}) {
  const notes = [];
  let spec = baseSpec;
  let cells = [];
  let det = null;
  let supersample = 1;

  if (source.kind === 'actions') {
    // one 3×3 grid per action: the 9 cells of each file become one animation row
    spec = { ...baseSpec, rows: source.files.map(([a]) => a), frames: ACTION_GRID.rows * ACTION_GRID.cols };
    supersample = SUPERSAMPLE;
    for (const [action, path] of source.files) {
      const img = await loadCleaned(path, `${id}/${action}`, notes);
      cells.push(ops.sliceFixed(img, ACTION_GRID.rows, ACTION_GRID.cols).flat());
    }
  } else if (source.kind === 'pair') {
    // two 6×6 grids: rows 0-5 in part 1, rows 6-11 in part 2
    for (let part = 0; part < 2; part++) {
      const img = await loadCleaned(source.files[part], `${id}-p${part + 1}`, notes);
      cells.push(...ops.sliceFixed(img, 6, 6, spec.frames));
    }
  } else {
    const img = await loadCleaned(source.file, id, notes, { strict: true });
    if (!img) return null;
    const ov = overrides[id] || {};
    det = ops.detectCells(img, spec.rows.length, spec.frames);
    if (ov.rowBounds) det.rowBounds = ov.rowBounds;
    if (ov.colBounds) det.colBounds = ov.colBounds;
    if (det.maxCutOcc > 0.35) warn(`${id}: grid cut occupancy ${det.maxCutOcc.toFixed(2)} (modes ${det.modes})`);
    for (let r = 0; r < spec.rows.length; r++) {
      const row = [];
      for (let c = 0; c < spec.frames; c++) {
        const cx = det.colBounds[c], cy = det.rowBounds[r];
        const cell = ops.crop(img, cx, cy, det.colBounds[c + 1] - cx, det.rowBounds[r + 1] - cy);
        const iso = ops.isolateMain(cell);
        row.push({ cell: iso.img, main: iso.main, labels: iso.labels });
      }
      cells.push(row);
    }
  }
  // Per-action overrides: a 3x3 file under actions/<id>/ replaces that one row of the older grid
  // (9 frames where the grid had 6 — the catalog records the count per row).
  const overriddenRows = new Set();
  for (const [action, path] of source.overrides || []) {
    const r = spec.rows.indexOf(action);
    if (r < 0) { warn(`${id}: actions/${id}/${action}.png does not match a row of this character (${spec.rows.join(', ')})`); continue; }
    const img = await loadCleaned(path, `${id}/${action}`, notes);
    cells[r] = ops.sliceFixed(img, ACTION_GRID.rows, ACTION_GRID.cols).flat();
    overriddenRows.add(r);
    notes.push(`${action}: row replaced by actions/${id}/${action}.png`);
  }

  // Defective frames — art the generator cut at a cell line, a figure most of which is missing, or a
  // severed body part floating on its own — are never shown. Each is replaced, in place, by the
  // nearest clean frame of the same row: the animation gets a held frame instead of a cut body.
  // Per-action sheets intentionally use detached props and effects (balls, microphones, paint and
  // sound bursts). Only legacy grids treat a detached component as a likely severed body part.
  const replaced = substituteDefectiveFrames(cells, spec.rows, { allowDetached: source.kind === 'actions' });
  if (replaced.length) notes.push(`${replaced.length} defective source frame(s) replaced by a neighbour: ${replaced.join(' ')}`);
  if (emit) await defectSheet(id, replaced.rejected);

  const ov = overrides[id] || {};
  const mainH = (m) => (m ? m.y1 - m.y0 + 1 : 0);
  const refH = ov.refHeight || median(cells[0].map((f) => mainH(f.main)).filter(Boolean));
  const scale = (spec.body * supersample) / refH;

  // Override rows come from 682px cells drawn at their own size, not the older grid's, so they need
  // their own scale. Measure the figure on the first frame of every override row whose first pose is
  // upright (a flinch, a wind-up, a stance — never a lying getup/defeat) and fit that to the body
  // height; rows without an upright first frame borrow the character's median override scale.
  const UPRIGHT_FIRST = new Set(['idle', 'walk', 'dash', 'light1', 'light2', 'light3', 'heavy', 'special', 'block', 'hurt', 'knockback', 'knockdown', 'approach', 'attack', 'combo', 'guard']);
  const rowScale = spec.rows.map(() => scale);
  if (overriddenRows.size) {
    const measured = [...overriddenRows].filter((r) => UPRIGHT_FIRST.has(spec.rows[r]) && cells[r][0].main).map((r) => (spec.body * supersample) / mainH(cells[r][0].main));
    const fallback = measured.length ? median(measured) : scale * 0.5; // 0.5: a 682px cell next to a 341px one
    for (const r of overriddenRows) {
      rowScale[r] = UPRIGHT_FIRST.has(spec.rows[r]) && cells[r][0].main ? (spec.body * supersample) / mainH(cells[r][0].main) : fallback;
    }
    notes.push(`override rows scaled to body height (${[...overriddenRows].map((r) => `${spec.rows[r]}:${rowScale[r].toFixed(3)}`).join(' ')}; base ${scale.toFixed(3)})`);
  }

  // reference face (size/width) from the idle row, so every other pose can be scored against it
  let headRef = null;
  if (spec.head) {
    const refs = cells[0].map((f) => (f.main ? ops.headAnchor(f.cell, f.main, f.labels) : null)).filter((h) => h && h.method === 'skin');
    if (refs.length) headRef = { size: median(refs.map((h) => h.size)), w: median(refs.map((h) => h.w)) };
    else warn(`${id}: no reference face found on the idle row`);
  }

  // per-row baseline (median bottom of main figure) and per-frame x anchor (legs centre)
  const frames = [];
  for (let r = 0; r < spec.rows.length; r++) {
    const scale = rowScale[r];
    const bottoms = cells[r].map((f) => (f.main ? f.main.y1 : 0));
    const rowBaseline = median(bottoms);
    for (let c = 0; c < cells[r].length; c++) {
      const f = cells[r][c];
      const { cell, main, labels } = f;
      // Feet stay on the floor: a frame whose figure sits a little above or below the row's median
      // bottom is anchored on its own bottom (the generator's baseline drifts a few px between cells,
      // which otherwise reads as the character floating or sinking). Only a clearly airborne pose —
      // feet more than ~15% of the body above the median — keeps the row baseline and its height.
      let baseline = rowBaseline;
      if (main) {
        const lift = rowBaseline - main.y1;
        if (lift < 0.15 * (spec.body / scale)) baseline = main.y1;
      }
      let ax = cell.width / 2;
      if (main) {
        const legTop = main.y1 - Math.round((main.y1 - main.y0 + 1) * 0.35);
        let sx = 0, n = 0;
        for (let y = legTop; y <= main.y1; y++) for (let x = main.x0; x <= main.x1; x++) {
          const i = y * cell.width + x;
          if (labels[i] === main.id && cell.data[i * 4 + 3] > 200) { sx += x; n++; }
        }
        if (n) ax = sx / n;
      }
      const head = spec.head ? ops.headAnchor(cell, main, labels, headRef) : null;
      const scaled = ops.resize(cell, scale);
      const bb = ops.bbox(scaled) || { x: 0, y: 0, w: 1, h: 1 };
      const trimmed = ops.crop(scaled, bb.x, bb.y, bb.w, bb.h);
      frames.push({
        row: spec.rows[r], index: c, key: `${spec.rows[r]}/${c}`, img: trimmed,
        left: bb.x - ax * scale, top: bb.y - (baseline + 1) * scale,
        head: head ? { x: (head.x - ax) * scale, y: (head.y - baseline - 1) * scale, w: head.w * scale, method: head.method } : null,
        cellRef: f,
      });
    }
  }
  // source box
  let maxL = 0, maxR = 0, maxUp = 0, maxDown = 0;
  for (const f of frames) {
    maxL = Math.max(maxL, -f.left); maxR = Math.max(maxR, f.left + f.img.width);
    maxUp = Math.max(maxUp, -f.top); maxDown = Math.max(maxDown, f.top + f.img.height);
  }
  const half = Math.ceil(Math.max(maxL, maxR)) + 1;
  const box = { w: half * 2, h: Math.ceil(maxUp) + Math.ceil(maxDown) + 2 };
  const anchor = { x: half, y: Math.ceil(maxUp) + 1 };

  // head smoothing per row (heroes)
  const headTable = {};
  const headMethods = {};
  if (spec.head) {
    for (const rowName of spec.rows) {
      const rf = frames.filter((f) => f.row === rowName);
      const ws = rf.map((f) => (f.head ? f.head.w : 0)).filter(Boolean);
      const mw = median(ws) || spec.body * 0.2;
      const list = rf.map((f) => {
        if (!f.head) return null;
        const w = Math.min(Math.max(f.head.w, mw * 0.75), mw * 1.3);
        return { x: f.head.x, y: f.head.y, w, method: f.head.method };
      });
      // Frames with no figure in them (a projectile-only special frame: headAnchor found no skin at
      // all) get no head so the face rig hides rather than floating over the effect. Detected
      // positions are used as-is — poses legitimately move the head a lot between frames.
      for (let i = 0; i < list.length; i++) if (!list[i]) list[i] = { method: 'none' };
      const rowOv = ov.head && ov.head[rowName];
      headMethods[rowName] = list.map((h) => h.method);
      headTable[rowName] = list.map((h, i) => {
        const o = rowOv && rowOv[i];
        if (o) return [o[0], o[1], o[2] ?? h.w ?? mw];
        return h.method === 'none' ? null : [+(h.x).toFixed(1), +(h.y).toFixed(1), +(h.w).toFixed(1)];
      });
    }
  }

  // pack into a power-of-two atlas: try each width and keep the smallest po2 canvas that fits
  const items = frames.map((f) => ({ key: f.key, w: f.img.width, h: f.img.height }));
  let pack = null;
  for (const w of [1024, 2048, 4096]) {
    const p = ops.shelfPack(items, w);
    const po2 = { ...p, width: w, height: nextPo2(p.height) };
    if (po2.height > 4096) continue;
    if (!pack || po2.width * po2.height < pack.width * pack.height) pack = po2;
  }
  if (!pack) throw new Error(`${id}: frames do not fit a 4096x4096 atlas`);
  const atlas = ops.makeImage(pack.width, pack.height);
  const json = { frames: {}, meta: { app: 'nepho-build-assets', image: `${id}.webp`, size: { w: pack.width, h: pack.height }, scale: '1' } };
  for (const f of frames) {
    const p = pack.places[f.key];
    ops.blit(atlas, f.img, p.x, p.y);
    json.frames[f.key] = {
      frame: { x: p.x, y: p.y, w: f.img.width, h: f.img.height }, rotated: false, trimmed: true,
      spriteSourceSize: { x: Math.round(anchor.x + f.left), y: Math.round(anchor.y + f.top), w: f.img.width, h: f.img.height },
      sourceSize: { w: box.w, h: box.h },
    };
  }
  if (emit) {
    await saveWebp(atlas, join(OUT, 'chars', `${id}.webp`));
    writeFileSync(join(OUT, 'chars', `${id}.json`), JSON.stringify(json));
  }

  // colours from idle/0 head region
  const idle0 = frames[0];
  const colours = spec.head ? ops.sampleColours(idle0.cellRef.cell, idle0.cellRef.main ? ops.headAnchor(idle0.cellRef.cell, idle0.cellRef.main, idle0.cellRef.labels) : null) : { skin: [0, 0, 0], outline: [0, 0, 0] };

  // contact sheet
  if (emit) await contactSheet(id, frames, box, anchor, headTable, spec);

  const rel = (p) => p.replace(ROOT + '/', '');
  const srcStr = source.kind === 'actions' ? rel(dirname(source.files[0][1])) + '/{' + source.files.map(([a]) => a).join(',') + '}.png'
    : source.kind === 'pair' ? source.files.map(rel).join(' + ') : rel(source.file);
  // rows that do not have the character's usual frame count (per-action overrides carry 9)
  const frameCounts = Object.fromEntries(spec.rows.map((row, r) => [row, cells[r].length]).filter(([, n]) => n !== spec.frames));
  const entry = {
    id, kind: spec.kind, atlas: `chars/${id}.webp`, data: `chars/${id}.json`, box, anchor, rows: spec.rows, framesPerRow: spec.frames,
    frameCounts: Object.keys(frameCounts).length ? frameCounts : undefined,
    scale: +scale.toFixed(4), renderScale: supersample === 1 ? undefined : +(1 / supersample).toFixed(4),
    skin: colours.skin, outline: colours.outline, head: spec.head ? headTable : undefined, source: srcStr, sourceFormat: source.kind, notes,
  };
  report.characters[id] = { format: source.kind, maxCutOcc: det ? +det.maxCutOcc.toFixed(3) : 0, modes: det ? det.modes : undefined, scale: entry.scale, box, notes, atlas: [pack.width, pack.height],
    headMethods: spec.head ? headMethods : undefined };
  return { entry, atlas, json };
}

async function contactSheet(id, frames, box, anchor, headTable, spec) {
  const cols = Math.max(spec.frames, ...frames.map((f) => f.index + 1)), rows = spec.rows.length;
  const sheet = ops.makeImage(cols * (box.w + 4), rows * (box.h + 4));
  for (const f of frames) {
    const r = spec.rows.indexOf(f.row), c = f.index;
    const ox = c * (box.w + 4), oy = r * (box.h + 4);
    ops.drawRect(sheet, ox, oy, box.w, box.h, [60, 60, 90]);
    ops.blit(sheet, f.img, ox + Math.round(anchor.x + f.left), oy + Math.round(anchor.y + f.top));
    ops.drawLine(sheet, ox + anchor.x - 6, oy + anchor.y, ox + anchor.x + 6, oy + anchor.y, [255, 80, 80]);
    ops.drawLine(sheet, ox + anchor.x, oy + anchor.y - 6, ox + anchor.x, oy + anchor.y + 6, [255, 80, 80]);
    if (headTable[f.row] && headTable[f.row][c]) {
      const [hx, hy, hw] = headTable[f.row][c];
      ops.drawCircle(sheet, ox + anchor.x + hx, oy + anchor.y + hy, hw * 0.55, [80, 255, 120]);
    }
  }
  await savePng(sheet, join(DEBUG, `anchors-${id}.png`));
}

async function variantFrom(base, id, remap, notes) {
  const img = ops.hueRemap(base.atlas, remap);
  await saveWebp(img, join(OUT, 'chars', `${id}.webp`));
  const json = { ...base.json, meta: { ...base.json.meta, image: `${id}.webp` } };
  writeFileSync(join(OUT, 'chars', `${id}.json`), JSON.stringify(json));
  const entry = { ...base.entry, id, atlas: `chars/${id}.webp`, data: `chars/${id}.json`, variantOf: base.entry.id, notes: [...(base.entry.notes || []), ...notes] };
  if (remap.skin) entry.skin = remap.skin;
  return { entry, atlas: img, json };
}

// True when two sources are the same art (mean per-channel difference of a 64px thumbnail under 8/255).
async function nearDuplicate(a, b) {
  const files = (src) => (src.kind === 'actions' ? src.files.map(([, p]) => p) : src.kind === 'pair' ? src.files : [src.file]);
  const fa = files(a), fb = files(b);
  if (fa.length !== fb.length) return false;
  for (let i = 0; i < fa.length; i++) {
    const [x, y] = await Promise.all([fa[i], fb[i]].map((f) => sharp(f).resize(64, 64, { fit: 'fill' }).ensureAlpha().raw().toBuffer()));
    let d = 0;
    for (let k = 0; k < x.length; k++) d += Math.abs(x[k] - y[k]);
    if (d / x.length > 8) return false;
  }
  return true;
}

function looksLikeGrid(img, rows, cols) {
  const det = ops.detectCells(img, rows, cols);
  const aspect = img.width / img.height;
  return det.maxCutOcc < 0.35 && aspect > 0.6 && aspect < 1.7 && ops.opaqueRatio(img) < 0.6;
}

// ---------- levels ----------
const LEVELS = [
  { id: 'rishon', boss: 'ferryman' }, { id: 'petah-tikva', boss: 'glass-warden' }, { id: 'barcelona', boss: 'kilnheart' },
  { id: 'sant-cugat', boss: 'monk-zero' }, { id: 'hatikva-school', boss: 'market-king' }, { id: 'capoeira-gym', boss: 'railmaw' },
  { id: 'basketball-gym', boss: 'crown-runner' }, { id: 'theater', boss: 'the-null' }, { id: 'candy-factory', boss: 'vault-mother' },
  { id: 'catalunya', boss: 'ultra-signal' },
];

function parseSigns(svgText) {
  const groups = [...svgText.matchAll(/<g transform="translate\(470 (\d+)\)">([\s\S]*?)<\/g>/g)];
  return groups.map((m) => {
    const y = +m[1];
    const texts = [...m[2].matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map((t) => t[1]);
    const rect = m[2].match(/<rect[^>]*>/)[0];
    const accent = (rect.match(/stroke="(#[0-9a-f]{6})"/i) || [])[1] || '#ffcf5c';
    return { y, latin: texts[0] || '', hebrew: texts[1] || '', body: m[2], accent };
  });
}

async function processLevels(catalog) {
  const slot = 1672 / 5;
  const tops = [0, 1, 2, 3, 4, 5].map((k) => Math.round(k * slot));
  const signsA = parseSigns(readFileSync(join(SRC, 'entry-signs-01-05-v2.svg'), 'utf8'));
  const signsB = parseSigns(readFileSync(join(SRC, 'entry-signs-06-10-v2.svg'), 'utf8'));
  const signs = [...signsA, ...signsB];
  catalog.levels = [];
  for (let i = 0; i < 10; i++) {
    const atlasIdx = i < 5 ? 0 : 1, s = i % 5;
    const bgFile = join(SRC, atlasIdx === 0 ? 'level-backdrops-01-05.png' : 'level-backdrops-06-10.png');
    const entryFile = join(SRC, atlasIdx === 0 ? 'entry-extensions-01-05.png' : 'entry-extensions-06-10.png');
    const region = { left: 0, top: tops[s], width: 941, height: tops[s + 1] - tops[s] };
    const nn = String(i + 1).padStart(2, '0');
    await sharp(bgFile).extract(region).webp({ quality: 82 }).toFile(join(OUT, 'levels', `bg-${nn}.webp`));
    await sharp(entryFile).extract(region).webp({ quality: 80 }).toFile(join(OUT, 'levels', `entry-${nn}.webp`));
    const sg = signs[i];
    const localY = sg.y - tops[s];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="941" height="${region.height}" viewBox="0 0 941 ${region.height}"><g font-family="Arial,sans-serif" text-anchor="middle" fill="#fff8d6" stroke="#10182b" stroke-width="7" paint-order="stroke"><g transform="translate(470 ${localY})">${sg.body}</g></g></svg>`;
    writeFileSync(join(OUT, 'levels', `sign-${nn}.svg`), svg);
    catalog.levels.push({
      index: i + 1, id: LEVELS[i].id, name: sg.latin.replace(/\s+·.*$/, ''), nameHe: sg.hebrew, accent: sg.accent,
      bg: `levels/bg-${nn}.webp`, entry: `levels/entry-${nn}.webp`, sign: `levels/sign-${nn}.svg`, signY: localY,
      boss: LEVELS[i].boss, size: { w: 941, h: region.height },
    });
  }
}

// ---------- portraits & cards ----------
async function processPortraits(catalog, bossResults, heroResults) {
  for (const [i, res] of bossResults.entries()) {
    if (!res) continue;
    const key = 'idle/0';
    const fr = res.json.frames[key];
    const img = ops.crop(res.atlas, fr.frame.x, fr.frame.y, fr.frame.w, fr.frame.h);
    const s = 160 / Math.max(img.width, img.height);
    const small = ops.resize(img, s);
    const boxImg = ops.makeImage(160, 160);
    ops.blit(boxImg, small, Math.round((160 - small.width) / 2), 160 - small.height);
    await saveWebp(boxImg, join(OUT, 'portraits', `${BOSSES[i][0]}.webp`));
  }
  // hero select cards. A dedicated card image wins (public/assets/generated/heroes/<id>-card.png,
  // square, any size); otherwise riva/byte come from the roster atlas (3x2, 512 cells) and anyone
  // else gets a crop of their own idle frame so a new hero is never card-less.
  const roster = join(SRC, 'hero-roster-atlas.png');
  const rosterCells = { nepho: [0, 0], byte: [1, 1] };
  for (const id of catalog.heroes) {
    const out = join(OUT, 'cards', `${id}.webp`);
    const dedicated = join(SRC, 'heroes', `${id}-card.png`);
    if (existsSync(dedicated)) { await sharp(dedicated).resize(512, 512, { fit: 'cover' }).webp({ quality: 88 }).toFile(out); continue; }
    const cell = rosterCells[id];
    if (cell) { await sharp(roster).extract({ left: cell[0] * 512, top: cell[1] * 512, width: 512, height: 512 }).webp({ quality: 88 }).toFile(out); continue; }
    const res = heroResults[id];
    if (!res) continue;
    const fr = res.json.frames['idle/0'];
    const img = ops.crop(res.atlas, fr.frame.x, fr.frame.y, fr.frame.w, fr.frame.h);
    const sc = 200 / Math.max(img.width, img.height);
    const small = ops.resize(img, sc);
    const boxImg = ops.makeImage(256, 256);
    ops.blit(boxImg, small, Math.round((256 - small.width) / 2), 236 - small.height);
    await saveWebp(boxImg, out);
  }
  await sharp(join(ROOT, 'public/assets/nepho-hero-keyart.png')).resize({ width: 640 }).webp({ quality: 80 }).toFile(join(OUT, 'ui', 'keyart.webp'));
  const logo = join(SRC, 'ui/logo.svg');
  if (existsSync(logo)) copyFileSync(logo, join(OUT, 'ui', 'logo.svg'));
}

// ---------- main ----------
async function main() {
  const catalog = { version: 2, generatedAt: report.generatedAt, characters: {}, heroes: ['eviatar', 'omri', 'nepho', 'byte'], enemies: [], bosses: [], levels: [] };
  const results = {};
  const want = (group) => !only || only === group;

  if (want('heroes')) {
    const heroSrc = {};
    const heroSource = (id) => resolveSource(id, HERO_ACTIONS, [join(SRC, `hero-${id}-grid-1.png`), join(SRC, `hero-${id}-grid-2.png`)], join(SRC, `hero-${id}-grid.png`));
    for (const id of ['nepho', 'byte', 'eviatar', 'omri']) {
      const src = heroSource(id);
      const stand = HERO_STAND_INS[id];
      if (stand && !hasAnySource(src)) {
        // no art delivered yet: build the stand-in's grid in memory and recolour it into this hero's palette
        const base = await processCharacter(stand.from, heroSource(stand.from), { ...HERO, rows: HERO_ROWS_12 }, { emit: false });
        results[id] = await variantFrom(base, id, stand.remap, [`placeholder: ${stand.from} recoloured until a real ${id} set is supplied (docs/hero-prompts-eviatar-omri.md)`]);
        warn(`${id}: no source art yet — shipping a recoloured ${stand.from} as a stand-in`);
        console.log('hero', id, `stand-in (${stand.from})`);
        continue;
      }
      heroSrc[id] = src;
      results[id] = await processCharacter(id, src, src.kind === 'pair' ? { ...HERO, rows: HERO_ROWS_12 } : HERO);
      console.log('hero', id, results[id] ? `ok (${src.kind})` : 'FAILED');
    }
    // Byte's delivered grids have so far been copies of Riva's. Until a real Byte set lands, keep the
    // roster visually distinct by hue-shifting the duplicate to her pink rather than shipping two Rivas.
    // Byte's delivered grids are a copy of Riva's (a retired hero whose grids stay in the tree as the
    // reference for this check).
    if (heroSrc.byte && await nearDuplicate(heroSrc.byte, heroSource('riva'))) {
      warn('byte: source grids are a duplicate of riva\'s — hue-remapped to pink; see docs/asset-prompts.md');
      const notes = ['fallback: source is a duplicate of riva, hue-remapped to pink until a real byte set is supplied'];
      results.byte = await variantFrom(results.byte, 'byte', { h0: 55, h1: 170, delta: 205, minSat: 0.3 }, notes);
      delete results.byte.entry.variantOf; // it is byte's own (duplicated) art, not a derived atlas
    }
  }
  if (want('enemies')) {
    for (let i = 0; i < 6; i++) {
      const id = ENEMY_IDS[i];
      const pair = [1, 2].map((n) => join(SRC, 'enemies', ENEMY_FILES[i].replace('-grid.png', `-grid-${n}.png`)));
      const src = resolveSource(id, ENEMY_ACTIONS, pair, join(SRC, 'enemies', ENEMY_FILES[i]));
      results[id] = await processCharacter(id, src, src.kind === 'pair' ? { ...ENEMY, rows: ENEMY_ROWS_12 } : ENEMY);
      console.log('enemy', id, results[id] ? `ok (${src.kind})` : 'FAILED');
    }
    if (!results.kicker) {
      results.kicker = await variantFrom(results.brawler, 'kicker', { h0: 5, h1: 55, delta: 240 }, ['fallback: brawler hue-shifted to purple because enemy-03 could not be unbaked']);
    }
    results['punk-b'] = await variantFrom(results.punk, 'punk-b', { h0: 335, h1: 25, delta: 120 }, ['green variant of punk']);
    results['brawler-b'] = await variantFrom(results.brawler, 'brawler-b', { h0: 5, h1: 55, delta: 200 }, ['blue variant of brawler']);
    results['knight-b'] = await variantFrom(results.knight, 'knight-b', { h0: 170, h1: 260, delta: 150 }, ['crimson variant of knight']);
    catalog.enemies = ['punk', 'chainer', 'brawler', 'kicker', 'knight', 'shield', 'punk-b', 'brawler-b', 'knight-b'];
  }
  const bossResults = [];
  if (want('bosses')) {
    for (let i = 0; i < 10; i++) {
      const id = BOSSES[i][0];
      const src = resolveSource(id, BOSS_ACTIONS, null, join(SRC, 'bosses', BOSS_FILES[i]));
      const res = await processCharacter(id, src, BOSS);
      results[id] = res; bossResults.push(res);
      console.log('boss', id, res ? `ok (${src.kind})` : 'FAILED');
    }
    catalog.bosses = BOSSES.map(([id, name], i) => ({ id, name, index: i, portrait: `portraits/${id}.webp` }));
    await processPortraits(catalog, bossResults, results);
  }
  if (want('levels')) await processLevels(catalog);

  for (const [id, res] of Object.entries(results)) if (res) catalog.characters[id] = res.entry;
  if (only) {
    // merge into an existing catalog to keep other groups
    const prev = existsSync(join(OUT, 'catalog.json')) ? JSON.parse(readFileSync(join(OUT, 'catalog.json'), 'utf8')) : {};
    const merged = { ...prev, ...catalog, characters: { ...(prev.characters || {}), ...catalog.characters } };
    if (!want('levels')) merged.levels = prev.levels || [];
    if (!want('bosses')) merged.bosses = prev.bosses || [];
    if (!want('enemies')) merged.enemies = prev.enemies || [];
    writeFileSync(join(OUT, 'catalog.json'), JSON.stringify(merged, null, 1));
  } else {
    writeFileSync(join(OUT, 'catalog.json'), JSON.stringify(catalog, null, 1));
  }
  writeFileSync(join(DEBUG, 'report.json'), JSON.stringify(report, null, 1));
  console.log(`done. warnings: ${report.warnings.length}`);
  for (const w of report.warnings) console.log(' -', w);
}

main().catch((e) => { console.error(e); process.exit(1); });
