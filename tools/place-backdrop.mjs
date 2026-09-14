// Accepts a delivered level backdrop:
//   node tools/place-backdrop.mjs <level 1-11> <image> [--floor=58%] [--trim-bottom=0%]
// The plate is 4:1 (2800×700) and fills ART_BAND (src/sim/types.ts). The image is scaled to 700 tall
// and NEVER cropped in height (the fighting lane is the bottom third — cropping it is the one thing
// that must not happen). A 4:1 image fills the plate; a narrower one (two 16:9 or 21:9 halves come
// out 2.9–3.9:1) is placed at the LEFT and the remainder to the right is filled with a blurred
// stretch of its last columns — a level with W waves only ever scrolls to 200·(W−1)+765 px of the
// 1400-wide band, so a 3-wave level never shows anything past 70% of the plate. The tool prints how
// many waves the real art covers. A wider image is centre-cropped to 4:1. Saved as
// public/assets/generated/backdrops/level-NN.png; `npm run build:assets` ships it. The previous master,
// if any, is kept under public/assets/backups/backdrops/.
//
// --floor=<percent|row> is where the pavement's far edge is in the delivered image (the line the
// characters' feet stand on when they are as far back as they can go). The fighting lane is world
// y 380..500, i.e. plate rows 404..644 — 58% to 92% of the height — so the far edge must be at row
// 404. If the image has it elsewhere, the content is shifted so it is: shifted up, the exposed bottom
// is filled by tiling the last 64 rows of the pavement (flipped every other tile so nothing seams);
// shifted down, the exposed top is the top row stretched (sky). Measure it on the image, do not guess:
// the prompts ask for 58% but models tend to put the ground at 65–70%.
// An image narrower than 4:1 (2:1, 21:9 …) is not squeezed to the plate height: a 4:1 window is cut
// out of it at full width, placed vertically so the measured ground line lands on the lane's far
// edge (58%) — surplus sky above and surplus pavement below are what gets dropped. Only when the
// window cannot be placed that way (ground too near the top or bottom) does the shift/tile fallback
// below make up the difference.
// --trim-bottom=<percent> cuts that much off the bottom of the delivered image first — for plates
// whose bottom edge is a lip, a border or a fade that must not be tiled up into the lane.
import sharp from 'sharp';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public/assets/generated/backdrops');
const PLATE = { w: 2800, h: 700 };
// keep in sync with src/sim/types.ts: plate px per world px, band x-offset, visible width, step per wave
const PX_PER_WORLD = PLATE.w / 1400, BAND_X0 = 180, BAND_Y0 = 178, VISIBLE_X0 = 198, VISIBLE_W = 565, STEP = 200, FLOOR_TOP = 380;
const FLOOR_ROW = Math.round((FLOOR_TOP - BAND_Y0) * PX_PER_WORLD); // 404
const argv = process.argv.slice(2), flags = argv.filter((a) => a.startsWith('--')), [levelArg, image] = argv.filter((a) => !a.startsWith('--'));
const floorArg = (flags.find((a) => a.startsWith('--floor=')) || '--floor=58%').slice(8);
const trimBottom = parseFloat((flags.find((a) => a.startsWith('--trim-bottom=')) || '--trim-bottom=0').slice(14)) || 0;
const level = Number(levelArg);
if (!(level >= 1 && level <= 11) || !image || !existsSync(image)) {
  console.error('usage: node tools/place-backdrop.mjs <level 1-11> <image> [--floor=58%] [--trim-bottom=0%]');
  process.exit(1);
}
const nn = String(level).padStart(2, '0');
const out = join(OUT_DIR, `level-${nn}.png`);
mkdirSync(OUT_DIR, { recursive: true });
if (existsSync(out)) {
  const bk = join(ROOT, 'public/assets/backups/backdrops');
  mkdirSync(bk, { recursive: true });
  copyFileSync(out, join(bk, `level-${nn}-${Date.now()}.png`));
}
let src = sharp(image).rotate().removeAlpha();
let meta = await src.metadata();
if (trimBottom > 0) {
  const keep = Math.round(meta.height * (1 - trimBottom / 100));
  src = sharp(await src.extract({ left: 0, top: 0, width: meta.width, height: keep }).png().toBuffer());
  meta = await src.metadata();
}
// floor as a fraction of the (trimmed) source height
let floorFrac = floorArg.endsWith('%') ? parseFloat(floorArg) / 100 : parseFloat(floorArg) / meta.height;
let cropNote = '';
const ratio = meta.width / meta.height;
if (ratio < PLATE.w / PLATE.h - 0.05) {
  // 4:1 window at full width, ground line at 58% of the window if the image allows
  const winH = Math.round(meta.width / (PLATE.w / PLATE.h));
  const floorPx = floorFrac * meta.height;
  const top = Math.round(Math.max(0, Math.min(meta.height - winH, floorPx - (FLOOR_ROW / PLATE.h) * winH)));
  src = sharp(await src.extract({ left: 0, top, width: meta.width, height: winH }).png().toBuffer());
  floorFrac = (floorPx - top) / winH;
  cropNote = `4:1 window rows ${top}–${top + winH} of ${meta.height} (${(100 * top / meta.height).toFixed(0)}% sky and ${(100 * (meta.height - top - winH) / meta.height).toFixed(0)}% ground dropped); `;
  meta = await src.metadata();
}
let fitted = await src.resize({ height: PLATE.h }).png().toBuffer();
const fw = Math.round(meta.width * PLATE.h / meta.height);
// align the pavement's far edge to the lane
const floorRow = Math.round(PLATE.h * floorFrac);
const shift = FLOOR_ROW - floorRow; // >0 = content moves down (floor was too high), <0 = moves up
let floorNote = `${cropNote}floor at row ${floorRow} (${(100 * floorRow / PLATE.h).toFixed(0)}%)`;
if (shift !== 0) {
  const layers = [];
  if (shift < 0) {
    const up = -shift, TILE = 64;
    const strip = await sharp(fitted).extract({ left: 0, top: PLATE.h - TILE, width: fw, height: TILE }).png().toBuffer();
    const stripFlip = await sharp(strip).flip().png().toBuffer();
    for (let y = PLATE.h - up, k = 0; y < PLATE.h; y += TILE, k++) layers.push({ input: k % 2 ? stripFlip : strip, left: 0, top: y });
    layers.unshift({ input: await sharp(fitted).extract({ left: 0, top: up, width: fw, height: PLATE.h - up }).png().toBuffer(), left: 0, top: 0 });
    floorNote += ` → content moved up ${up} px, bottom ${up} px tiled from the pavement`;
  } else {
    const sky = await sharp(fitted).extract({ left: 0, top: 0, width: fw, height: 1 }).resize(fw, shift, { fit: 'fill' }).png().toBuffer();
    layers.push({ input: sky, left: 0, top: 0 }, { input: fitted, left: 0, top: shift });
    floorNote += ` → content moved down ${shift} px, top ${shift} px stretched sky`;
  }
  fitted = await sharp({ create: { width: fw, height: PLATE.h, channels: 3, background: '#000' } }).composite(layers).png().toBuffer();
}
let plate, note;
if (fw >= PLATE.w) {
  plate = await sharp(fitted).extract({ left: Math.round((fw - PLATE.w) / 2), top: 0, width: PLATE.w, height: PLATE.h }).png().toBuffer();
  note = fw > PLATE.w ? `wider than 4:1 — centre-cropped ${fw - PLATE.w} px of width` : 'exact 4:1';
} else {
  // left-aligned art, right remainder = the last 24 columns stretched and blurred (never seen on ≤3-wave levels)
  const edge = await sharp(fitted).extract({ left: fw - 24, top: 0, width: 24, height: PLATE.h }).resize(PLATE.w - fw + 40, PLATE.h, { fit: 'fill' }).blur(30).png().toBuffer();
  plate = await sharp({ create: { width: PLATE.w, height: PLATE.h, channels: 3, background: '#000' } })
    .composite([{ input: edge, left: fw - 40, top: 0 }, { input: fitted, left: 0, top: 0 }]).png().toBuffer();
  // how far a level can scroll before the camera's right edge passes the real art
  const artWorldRight = BAND_X0 + fw / PX_PER_WORLD;
  const waves = Math.max(1, Math.floor((artWorldRight - VISIBLE_X0 - VISIBLE_W) / STEP) + 1);
  note = `${(fw / PLATE.h).toFixed(2)}:1 — real art covers the first ${Math.min(5, waves)} wave(s) of 5; the right ${PLATE.w - fw} px is a blurred extension`;
}
await sharp(plate).toFile(out);
console.log(`level ${level}: ${image} (${meta.width}×${meta.height}, ${note}; ${floorNote}) → ${out.replace(ROOT + '/', '')} (${PLATE.w}×${PLATE.h}). Now: npm run build:assets && npm run test:assets`);
