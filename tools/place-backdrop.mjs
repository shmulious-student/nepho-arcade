// Drops a delivered level backdrop into its atlas slot:
//   node tools/place-backdrop.mjs <level 1-10> <image>
// The image is any size at (about) 941:334 — it is cover-resized to the slot, so paint at 2816×1000
// or 1882×668 and keep the action in the middle band. The previous slot is saved to
// public/assets/backups/backdrops/level-NN-<timestamp>.png. Then: npm run build:assets.
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/assets/generated');
const [, , levelArg, image] = process.argv;
const level = Number(levelArg);
if (!(level >= 1 && level <= 10) || !image || !existsSync(image)) {
  console.error('usage: node tools/place-backdrop.mjs <level 1-10> <image>');
  process.exit(1);
}
const atlas = join(SRC, level <= 5 ? 'level-backdrops-01-05.png' : 'level-backdrops-06-10.png');
const slot = 1672 / 5, s = (level - 1) % 5;
const top = Math.round(s * slot), height = Math.round((s + 1) * slot) - top; // matches build-assets processLevels
const nn = String(level).padStart(2, '0');
const bk = join(ROOT, 'public/assets/backups/backdrops');
mkdirSync(bk, { recursive: true });
await sharp(atlas).extract({ left: 0, top, width: 941, height }).toFile(join(bk, `level-${nn}-${Date.now()}.png`));
const plate = await sharp(image).rotate().resize(941, height, { fit: 'cover', position: 'centre' }).removeAlpha().png().toBuffer();
const out = await sharp(atlas).composite([{ input: plate, left: 0, top }]).png().toBuffer();
await sharp(out).toFile(atlas);
console.log(`level ${level}: ${image} → ${atlas} slot y=${top}..${top + height} (941×${height}). Now: npm run build:assets`);
