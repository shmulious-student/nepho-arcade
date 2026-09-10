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

const HERO = { kind: 'hero', body: 128, rows: ['idle', 'walk', 'attack', 'heavy', 'dash', 'special', 'hurt', 'defeat'], frames: 6, head: true };
const ENEMY = { kind: 'enemy', body: 104, rows: ['idle', 'walk', 'attack', 'heavy', 'special', 'hurt', 'knockback', 'defeat'], frames: 6, head: false };
const BOSS = { kind: 'boss', body: 176, rows: ['idle', 'approach', 'attack', 'special', 'hurt', 'defeat'], frames: 8, head: false };

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
async function saveWebp(img, path, quality = 90) {
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.width, height: img.height, channels: 4 } })
    .webp({ quality, alphaQuality: 95, effort: 4 }).toFile(path);
}
async function savePng(img, path) {
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.width, height: img.height, channels: 4 } })
    .png({ compressionLevel: 6 }).toFile(path);
}
const median = (arr) => { const s = [...arr].sort((a, b) => a - b); return s.length ? s[(s.length / 2) | 0] : 0; };

function sourceStats(id, img) {
  const s = { width: img.width, height: img.height, opaqueRatio: +ops.opaqueRatio(img).toFixed(3), alphaValues: ops.alphaValues(img) };
  report.sources[id] = s;
  return s;
}

// ---------- character grids ----------
async function processCharacter(id, srcPath, spec, opts = {}) {
  let img = await loadRaw(srcPath);
  const stats = sourceStats(id, img);
  const notes = [];
  if (stats.opaqueRatio > 0.9) {
    img = ops.unbakeChecker(img);
    const after = ops.opaqueRatio(img);
    notes.push(`unbaked checker: opaque ${stats.opaqueRatio} -> ${after.toFixed(3)}`);
    if (after < 0.15 || after > 0.5) { warn(`${id}: checker unbake failed (opaque ${after.toFixed(3)})`); return null; }
  }
  if (stats.alphaValues <= 2) { img = ops.featherAlpha(img); notes.push('feathered binary alpha'); }
  img = ops.defringe(img, 2);

  const ov = overrides[id] || {};
  const det = ops.detectCells(img, spec.rows.length, spec.frames);
  if (ov.rowBounds) det.rowBounds = ov.rowBounds;
  if (ov.colBounds) det.colBounds = ov.colBounds;
  if (det.maxCutOcc > 0.35) warn(`${id}: grid cut occupancy ${det.maxCutOcc.toFixed(2)} (modes ${det.modes})`);

  // cut + isolate
  const cells = [];
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
  const mainH = (m) => (m ? m.y1 - m.y0 + 1 : 0);
  const refH = ov.refHeight || median(cells[0].map((f) => mainH(f.main)).filter(Boolean));
  const scale = spec.body / refH;

  // per-row baseline (median bottom of main figure) and per-frame x anchor (legs centre)
  const frames = [];
  for (let r = 0; r < spec.rows.length; r++) {
    const bottoms = cells[r].map((f) => (f.main ? f.main.y1 : 0));
    const baseline = median(bottoms);
    for (let c = 0; c < spec.frames; c++) {
      const f = cells[r][c];
      const { cell, main, labels } = f;
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
      const head = spec.head ? ops.headAnchor(cell, main, labels) : null;
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
      // fill gaps & clamp jumps against neighbours
      for (let i = 0; i < list.length; i++) {
        if (!list[i]) { const nb = list[i - 1] || list[i + 1] || { x: 0, y: -spec.body * 0.85, w: mw, method: 'default' }; list[i] = { ...nb, method: 'filled' }; }
      }
      for (let i = 1; i < list.length - 1; i++) {
        const p = list[i - 1], n = list[i + 1], c = list[i];
        const jump = Math.hypot(c.x - (p.x + n.x) / 2, c.y - (p.y + n.y) / 2);
        if (jump > mw * 1.1 && !(rowName === 'hurt' || rowName === 'defeat')) { c.x = (p.x + n.x) / 2; c.y = (p.y + n.y) / 2; c.method = 'smoothed'; }
      }
      const rowOv = ov.head && ov.head[rowName];
      headTable[rowName] = list.map((h, i) => {
        const o = rowOv && rowOv[i];
        return o ? [o[0], o[1], o[2] ?? h.w] : [+(h.x).toFixed(1), +(h.y).toFixed(1), +(h.w).toFixed(1)];
      });
    }
  }

  // pack
  const pack = ops.shelfPack(frames.map((f) => ({ key: f.key, w: f.img.width, h: f.img.height })));
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
  await saveWebp(atlas, join(OUT, 'chars', `${id}.webp`));
  writeFileSync(join(OUT, 'chars', `${id}.json`), JSON.stringify(json));

  // colours from idle/0 head region
  const idle0 = frames[0];
  const colours = spec.head ? ops.sampleColours(idle0.cellRef.cell, idle0.cellRef.main ? ops.headAnchor(idle0.cellRef.cell, idle0.cellRef.main, idle0.cellRef.labels) : null) : { skin: [0, 0, 0], outline: [0, 0, 0] };

  // contact sheet
  await contactSheet(id, frames, box, anchor, headTable, spec);

  const entry = {
    id, kind: spec.kind, atlas: `chars/${id}.webp`, data: `chars/${id}.json`, box, anchor, rows: spec.rows, framesPerRow: spec.frames,
    scale: +scale.toFixed(4), skin: colours.skin, outline: colours.outline, head: spec.head ? headTable : undefined, source: srcPath.replace(ROOT + '/', ''), notes,
  };
  report.characters[id] = { maxCutOcc: +det.maxCutOcc.toFixed(3), modes: det.modes, scale: entry.scale, box, notes, atlas: [pack.width, pack.height],
    headMethods: spec.head ? Object.fromEntries(Object.entries(headTable).map(([k]) => [k, frames.filter((f) => f.row === k).map((f) => f.head?.method || 'none')])) : undefined };
  return { entry, atlas, json };
}

async function contactSheet(id, frames, box, anchor, headTable, spec) {
  const cols = spec.frames, rows = spec.rows.length;
  const sheet = ops.makeImage(cols * (box.w + 4), rows * (box.h + 4));
  for (const f of frames) {
    const r = spec.rows.indexOf(f.row), c = f.index;
    const ox = c * (box.w + 4), oy = r * (box.h + 4);
    ops.drawRect(sheet, ox, oy, box.w, box.h, [60, 60, 90]);
    ops.blit(sheet, f.img, ox + Math.round(anchor.x + f.left), oy + Math.round(anchor.y + f.top));
    ops.drawLine(sheet, ox + anchor.x - 6, oy + anchor.y, ox + anchor.x + 6, oy + anchor.y, [255, 80, 80]);
    ops.drawLine(sheet, ox + anchor.x, oy + anchor.y - 6, ox + anchor.x, oy + anchor.y + 6, [255, 80, 80]);
    if (headTable[f.row]) {
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
async function processPortraits(catalog, bossResults) {
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
  // hero cards from the roster atlas (3x2, 512 cells): nepho(0,0) bruiser(1,0) riva(0,1) byte(1,1)
  const roster = join(SRC, 'hero-roster-atlas.png');
  const cards = { nepho: [0, 0], bruiser: [1, 0], riva: [0, 1], byte: [1, 1] };
  for (const [id, [cx, cy]] of Object.entries(cards)) {
    await sharp(roster).extract({ left: cx * 512, top: cy * 512, width: 512, height: 512 }).resize(256, 256).webp({ quality: 85 }).toFile(join(OUT, 'cards', `${id}.webp`));
  }
  await sharp(join(ROOT, 'public/assets/nepho-hero-keyart.png')).resize({ width: 640 }).webp({ quality: 80 }).toFile(join(OUT, 'ui', 'keyart.webp'));
  const logo = join(SRC, 'ui/logo.svg');
  if (existsSync(logo)) copyFileSync(logo, join(OUT, 'ui', 'logo.svg'));
}

// ---------- main ----------
async function main() {
  const catalog = { version: 2, generatedAt: report.generatedAt, characters: {}, heroes: ['nepho', 'bruiser', 'riva', 'byte'], enemies: [], bosses: [], levels: [] };
  const results = {};
  const want = (group) => !only || only === group;

  if (want('heroes')) {
    for (const id of ['nepho', 'bruiser', 'riva']) {
      results[id] = await processCharacter(id, join(SRC, `hero-${id}-grid.png`), HERO);
      console.log('hero', id, 'ok');
    }
    const byteSrc = join(SRC, 'hero-byte-grid.png');
    let byteRes = null;
    if (existsSync(byteSrc)) {
      const img = await loadRaw(byteSrc);
      if (looksLikeGrid(img, 8, 6)) byteRes = await processCharacter('byte', byteSrc, HERO);
      else warn('byte: hero-byte-grid.png is not an 8x6 grid; using riva hue-remapped to pink');
    }
    if (!byteRes) byteRes = await variantFrom(results.riva, 'byte', { h0: 55, h1: 170, delta: 205, minSat: 0.3 }, ['fallback: riva hue-remapped to pink until a real byte grid is supplied']);
    results.byte = byteRes;
    console.log('hero byte', byteRes.entry.variantOf ? '(variant)' : 'ok');
  }
  if (want('enemies')) {
    for (let i = 0; i < 6; i++) {
      const id = ENEMY_IDS[i];
      let res = await processCharacter(id, join(SRC, 'enemies', ENEMY_FILES[i]), ENEMY);
      results[id] = res;
      console.log('enemy', id, res ? 'ok' : 'FAILED');
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
      const res = await processCharacter(id, join(SRC, 'bosses', BOSS_FILES[i]), BOSS);
      results[id] = res; bossResults.push(res);
      console.log('boss', id, res ? 'ok' : 'FAILED');
    }
    catalog.bosses = BOSSES.map(([id, name], i) => ({ id, name, index: i, portrait: `portraits/${id}.webp` }));
    await processPortraits(catalog, bossResults);
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
