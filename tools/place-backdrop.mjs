// Accepts a delivered level backdrop:
//   node tools/place-backdrop.mjs <level 1-10> <image>
// The plate is 4:1 (2800×700) and fills ART_BAND (src/sim/types.ts). The image is scaled to 700 tall
// and NEVER cropped in height (the fighting lane is the bottom third — cropping it is the one thing
// that must not happen). A 4:1 image fills the plate; a narrower one (two 16:9 or 21:9 halves come
// out 2.9–3.9:1) is placed at the LEFT and the remainder to the right is filled with a blurred
// stretch of its last columns — a level with W waves only ever scrolls to 200·(W−1)+765 px of the
// 1400-wide band, so a 3-wave level never shows anything past 70% of the plate. The tool prints how
// many waves the real art covers. A wider image is centre-cropped to 4:1. Saved as
// public/assets/generated/backdrops/level-NN.png; `npm run build:assets` ships it. The previous master,
// if any, is kept under public/assets/backups/backdrops/.
import sharp from 'sharp';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public/assets/generated/backdrops');
const PLATE = { w: 2800, h: 700 };
// keep in sync with src/sim/types.ts: plate px per world px, band x-offset, visible width, step per wave
const PX_PER_WORLD = PLATE.w / 1400, BAND_X0 = 180, VISIBLE_X0 = 198, VISIBLE_W = 565, STEP = 200;
const [, , levelArg, image] = process.argv;
const level = Number(levelArg);
if (!(level >= 1 && level <= 10) || !image || !existsSync(image)) {
  console.error('usage: node tools/place-backdrop.mjs <level 1-10> <image>');
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
const src = sharp(image).rotate().removeAlpha();
const meta = await src.metadata();
const fitted = await src.resize({ height: PLATE.h }).png().toBuffer();
const fw = Math.round(meta.width * PLATE.h / meta.height);
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
console.log(`level ${level}: ${image} (${meta.width}×${meta.height}, ${note}) → ${out.replace(ROOT + '/', '')} (${PLATE.w}×${PLATE.h}). Now: npm run build:assets && npm run test:assets`);
