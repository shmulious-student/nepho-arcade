import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const [,, inputPath, charId, actionName] = process.argv;
if (!inputPath || !charId || !actionName) {
  console.error('Usage: node tools/key-action-grid.mjs <inputPath> <charId> <actionName>');
  process.exit(1);
}

const outDir = join('public/assets/generated/actions', charId);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${actionName}.png`);

// The image model returns a softly varying magenta matte rather than one exact RGB value. Remove
// only unmistakably magenta-dominant pixels. The character palettes contain green/blue or red/white,
// so this does not collide with costume, skin, outlines, or effects. In particular, never treat white
// pixels as grid lines: Omri's outfit is intentionally white.
const { data, info } = await sharp(inputPath)
  .resize(2048, 2048, { fit: 'fill', kernel: sharp.kernel.nearest })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < info.width * info.height; i++) {
  const p = i * 4;
  const r = data[p], g = data[p + 1], b = data[p + 2];
  const magentaMatte = r > 170 && b > 170 && g < 120 && Math.abs(r - b) < 70;
  if (magentaMatte) data[p + 3] = 0;
}

await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
  .png({ compressionLevel: 9 })
  .toFile(outPath);

console.log(`Successfully keyed and saved ${outPath}`);
