// Accepts a delivered level backdrop:
//   node tools/place-backdrop.mjs <level 1-10> <image>
// The image is any size at (about) 4:1 — it is cover-resized to 2800×700 and saved as
// public/assets/generated/backdrops/level-NN.png, which `npm run build:assets` then ships in place of the
// legacy atlas slot (catalog `art` = ART_BAND). The previous master, if any, is kept under
// public/assets/backups/backdrops/. Paint at 2800×700 (or two 21:9 halves stitched with
// tools/stitch-backdrop.mjs) and keep the action in the middle band — see docs/locations/README.md.
import sharp from 'sharp';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public/assets/generated/backdrops');
const PLATE = { w: 2800, h: 700 };
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
const meta = await sharp(image).metadata();
const ratio = meta.width / meta.height;
if (ratio < 3.6 || ratio > 4.4) console.warn(`warning: ${meta.width}×${meta.height} is ${ratio.toFixed(2)}:1, not ~4:1 — cover-resize will crop ${ratio < 4 ? 'top and bottom' : 'the sides'}`);
const plate = await sharp(image).rotate().resize(PLATE.w, PLATE.h, { fit: 'cover', position: 'centre' }).removeAlpha().png().toBuffer();
await sharp(plate).toFile(out);
console.log(`level ${level}: ${image} (${meta.width}×${meta.height}) → ${out.replace(ROOT + '/', '')} (${PLATE.w}×${PLATE.h}). Now: npm run build:assets && npm run test:assets`);
