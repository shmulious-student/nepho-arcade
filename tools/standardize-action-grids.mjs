// Generates a pair of 6x6 2048x2048 action grids per character (12 distinct actions total).
// Every cell is a 341.33x341.33 square with ample margin so no frames or effects are ever cut.
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ops from './asset-ops.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIG = join(ROOT, 'tools/orig-grids');
const SRC = join(ROOT, 'public/assets/generated');

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}

async function savePng(img, path) {
  await sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), {
    raw: { width: img.width, height: img.height, channels: 4 },
  })
    .png({ compressionLevel: 6 })
    .toFile(path);
}

// Builds a 6x6 2048x2048 atlas from 6 rows of 6 frames each
function create6x6Atlas(rowsOfFrames, refScaleMultiplier = 1.0) {
  const CANVAS = 2048;
  const COLS = 6;
  const ROWS = 6;
  const colBounds = [0, 341, 682, 1024, 1365, 1706, 2048];
  const rowBounds = [0, 341, 682, 1024, 1365, 1706, 2048];

  const atlas = ops.makeImage(CANVAS, CANVAS);

  // Measure median figure height to keep scale consistent across actions
  const heights = [];
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const f = rowsOfFrames[r]?.[c];
      if (f && f.height) heights.push(f.height);
    }
  }
  const medianH = heights.sort((a, b) => a - b)[Math.floor(heights.length / 2)] || 130;
  // In a 341x341 cell, target median character body height is ~200px (leaving generous room for effects & heads)
  const baseScale = Math.min((200 / medianH) * refScaleMultiplier, 1.55);

  for (let r = 0; r < ROWS; r++) {
    const ry0 = rowBounds[r], ry1 = rowBounds[r + 1];
    const cellH = ry1 - ry0; // ~341

    for (let c = 0; c < COLS; c++) {
      const frame = rowsOfFrames[r]?.[c];
      if (!frame) continue;

      const rx0 = colBounds[c], rx1 = colBounds[c + 1];
      const cellW = rx1 - rx0; // ~341

      // Ensure every frame fits inside the 341x341 cell with at least 26px padding on all sides
      const maxW = cellW - 52;
      const maxH = cellH - 52;
      const scale = Math.min(baseScale, maxW / frame.width, maxH / frame.height);

      const scaled = ops.resize(frame, scale);

      // Center horizontally in the cell
      const dx = rx0 + Math.round((cellW - scaled.width) / 2);
      // Center vertically with slight bottom bias (leaving at least 26px top & bottom margin)
      const dy = ry0 + Math.round((cellH - scaled.height) * 0.58);

      ops.blit(atlas, scaled, dx, dy);
    }
  }

  return atlas;
}

// Extracts all cells from an 8x6 original sheet without stripping effects
async function extract8x6Cells(srcPath, preprocess = null) {
  let img = await loadRaw(srcPath);
  if (preprocess) img = preprocess(img);

  const det = ops.detectCells(img, 8, 6);
  const cells = [];

  for (let r = 0; r < 8; r++) {
    const row = [];
    const cy0 = det.rowBounds[r], cy1 = det.rowBounds[r + 1];
    for (let c = 0; c < 6; c++) {
      const cx0 = det.colBounds[c], cx1 = det.colBounds[c + 1];
      const cell = ops.crop(img, cx0, cy0, cx1 - cx0, cy1 - cy0);
      const bb = ops.bbox(cell);
      if (bb && bb.w > 4 && bb.h > 4) {
        // Crop to the true bounding box so NO parts of the sprite or effect are lost
        row.push(ops.crop(cell, bb.x, bb.y, bb.w, bb.h));
      } else {
        row.push(null);
      }
    }
    cells.push(row);
  }
  return cells;
}

// Builds 12 action rows from the 8 source rows
function build12Actions(origCells) {
  return [
    // Grid 1 (Actions 1–6): Locomotion & Attacks
    origCells[0], // 0: idle
    origCells[1], // 1: walk
    origCells[4], // 2: dash
    [origCells[2][0], origCells[2][1], origCells[2][2], origCells[2][1], origCells[2][0], origCells[2][0]], // 3: light1 (snappy opener)
    [origCells[2][1], origCells[2][2], origCells[2][3], origCells[2][4], origCells[2][3], origCells[2][1]], // 4: light2 (cross punch)
    [origCells[2][0], origCells[2][3], origCells[2][4], origCells[2][5], origCells[2][5], origCells[2][4]], // 5: light3 (combo finisher / 360 breaker)

    // Grid 2 (Actions 7–12): Heavy, Special, Guard & Reactions
    origCells[3], // 6: heavy
    origCells[5], // 7: special
    [origCells[6][0], origCells[6][0], origCells[6][1], origCells[6][1], origCells[6][0], origCells[6][0]], // 8: block
    origCells[6], // 9: hurt
    [origCells[7][0], origCells[7][1], origCells[7][2], origCells[7][3], origCells[7][2], origCells[7][1]], // 10: knockdown
    [origCells[7][2], origCells[7][3], origCells[7][4], origCells[7][5], origCells[7][5], origCells[7][5]], // 11: defeat
  ];
}

async function main() {
  console.log('=== Generating 6x6 Grid Pairs (12 Actions per Character) ===\n');

  // 1. Heroes
  const heroes = [
    { id: 'nepho', src: join(ORIG, 'hero-nepho-grid.png'), scale: 1.0 },
    { id: 'bruiser', src: join(ORIG, 'hero-bruiser-grid.png'), scale: 0.95 },
    { id: 'riva', src: join(ORIG, 'hero-riva-grid.png'), scale: 1.0 },
  ];

  for (const h of heroes) {
    console.log(`Processing hero: ${h.id}...`);
    const origCells = await extract8x6Cells(h.src);
    const actions12 = build12Actions(origCells);

    // Grid 1
    const grid1 = create6x6Atlas(actions12.slice(0, 6), h.scale);
    const g1Path = join(SRC, `hero-${h.id}-grid-1.png`);
    await savePng(grid1, g1Path);
    const det1 = ops.detectCells(grid1, 6, 6);
    console.log(` -> ${h.id} Grid 1: cutOcc ${det1.maxCutOcc.toFixed(3)}, opaque ${ops.opaqueRatio(grid1).toFixed(3)}`);

    // Grid 2
    const grid2 = create6x6Atlas(actions12.slice(6, 12), h.scale);
    const g2Path = join(SRC, `hero-${h.id}-grid-2.png`);
    await savePng(grid2, g2Path);
    const det2 = ops.detectCells(grid2, 6, 6);
    console.log(` -> ${h.id} Grid 2: cutOcc ${det2.maxCutOcc.toFixed(3)}, opaque ${ops.opaqueRatio(grid2).toFixed(3)}`);
  }

  // 2. Synthesize Byte (Grid 1 & Grid 2)
  console.log('\nSynthesizing hero: byte (boxer design with pink hair, magenta gloves, black top)...');
  const rivaRaw = await loadRaw(join(ORIG, 'hero-riva-grid.png'));
  const byteRecolor = ops.hueRemap(rivaRaw, { h0: 240, h1: 320, delta: 65, minSat: 0.2 });
  const byteOrigCells = await extract8x6Cells(join(ORIG, 'hero-riva-grid.png'), () => byteRecolor);

  // Incorporate Byte's authentic blast poses from hero-action-atlas-v2.png row 4
  const heroActionAtlasPath = join(SRC, 'hero-action-atlas-v2.png');
  if (existsSync(heroActionAtlasPath)) {
    const actionImg = await loadRaw(heroActionAtlasPath);
    const actionDet = ops.detectCells(actionImg, 6, 6);
    const r = 4; // Row 4 is Byte
    const cy0 = actionDet.rowBounds[r], cy1 = actionDet.rowBounds[r + 1];
    for (let c = 0; c < 6; c++) {
      const cx0 = actionDet.colBounds[c], cx1 = actionDet.colBounds[c + 1];
      const cell = ops.crop(actionImg, cx0, cy0, cx1 - cx0, cy1 - cy0);
      const bb = ops.bbox(cell);
      if (bb && bb.w > 4 && bb.h > 4) {
        const trimmed = ops.crop(cell, bb.x, bb.y, bb.w, bb.h);
        if (c === 2) byteOrigCells[5][2] = trimmed;
        if (c === 4) byteOrigCells[5][4] = trimmed;
      }
    }
  }

  const byte12 = build12Actions(byteOrigCells);

  const byteGrid1 = create6x6Atlas(byte12.slice(0, 6), 1.0);
  const byteG1Path = join(SRC, 'hero-byte-grid-1.png');
  await savePng(byteGrid1, byteG1Path);
  const byteDet1 = ops.detectCells(byteGrid1, 6, 6);
  console.log(` -> byte Grid 1: cutOcc ${byteDet1.maxCutOcc.toFixed(3)}, opaque ${ops.opaqueRatio(byteGrid1).toFixed(3)}`);

  const byteGrid2 = create6x6Atlas(byte12.slice(6, 12), 1.0);
  const byteG2Path = join(SRC, 'hero-byte-grid-2.png');
  await savePng(byteGrid2, byteG2Path);
  const byteDet2 = ops.detectCells(byteGrid2, 6, 6);
  console.log(` -> byte Grid 2: cutOcc ${byteDet2.maxCutOcc.toFixed(3)}, opaque ${ops.opaqueRatio(byteGrid2).toFixed(3)}`);

  // 3. Enemies
  const enemies = [
    { id: 'punk', num: '00', name: 'red-punk', scale: 0.95, prep: null },
    { id: 'chainer', num: '01', name: 'hood-chain', scale: 0.95, prep: null },
    { id: 'brawler', num: '02', name: 'orange-brawler', scale: 0.95, prep: null },
    {
      id: 'kicker',
      num: '03',
      name: 'purple-fighter',
      scale: 0.95,
      prep: (img) => ops.defringe(ops.unbakeChecker(img), 2),
    },
    { id: 'knight', num: '04', name: 'cyan-knight', scale: 0.95, prep: null },
    { id: 'shield', num: '05', name: 'shield-soldier', scale: 0.95, prep: null },
  ];

  console.log('\nProcessing 6 enemies...');
  for (const e of enemies) {
    console.log(`Processing enemy: ${e.id} (${e.name})...`);
    const srcPath = join(ORIG, 'enemies', `enemy-${e.num}-${e.name}-grid.png`);
    const origCells = await extract8x6Cells(srcPath, e.prep);
    const actions12 = build12Actions(origCells);

    // Grid 1
    const grid1 = create6x6Atlas(actions12.slice(0, 6), e.scale);
    const g1Path = join(SRC, 'enemies', `enemy-${e.num}-${e.name}-grid-1.png`);
    await savePng(grid1, g1Path);
    const det1 = ops.detectCells(grid1, 6, 6);
    console.log(` -> ${e.id} Grid 1: cutOcc ${det1.maxCutOcc.toFixed(3)}, opaque ${ops.opaqueRatio(grid1).toFixed(3)}`);

    // Grid 2
    const grid2 = create6x6Atlas(actions12.slice(6, 12), e.scale);
    const g2Path = join(SRC, 'enemies', `enemy-${e.num}-${e.name}-grid-2.png`);
    await savePng(grid2, g2Path);
    const det2 = ops.detectCells(grid2, 6, 6);
    console.log(` -> ${e.id} Grid 2: cutOcc ${det2.maxCutOcc.toFixed(3)}, opaque ${ops.opaqueRatio(grid2).toFixed(3)}`);
  }

  console.log('\nAll 20 action grids (10 character pairs) successfully generated at 2048x2048 with square 341x341 cells.');
}

main().catch((err) => {
  console.error('Error generating grid pairs:', err);
  process.exit(1);
});
