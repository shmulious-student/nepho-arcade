import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const [,, inputPath, charId, actionName] = process.argv;
if (!inputPath || !charId || !actionName) {
  console.error('Usage: node tools/key-action-grid.mjs <inputJpgPath> <charId> <actionName>');
  process.exit(1);
}

const outDir = join('public/assets/generated/actions', charId);
mkdirSync(outDir, { recursive: true });
const outPath = join(outDir, `${actionName}.png`);

const { data, info } = await sharp(inputPath).resize(2048, 2048, { fit: 'fill' }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const w = info.width, h = info.height;
const buf = new Uint8Array(data.buffer, data.byteOffset, data.length);

// Sample outer perimeter for background color
let sr = 0, sg = 0, sb = 0, count = 0;
for (let x = 0; x < w; x += 10) {
  for (let y of [0, 1, 2, h - 3, h - 2, h - 1]) {
    const i = (y * w + x) * 4;
    sr += buf[i]; sg += buf[i+1]; sb += buf[i+2]; count++;
  }
}
const bgR = sr / count, bgG = sg / count, bgB = sb / count;

// Key out background pixels close to sampled bg, and thin white grid lines
for (let i = 0; i < w * h; i++) {
  const r = buf[i * 4], g = buf[i * 4 + 1], b = buf[i * 4 + 2];
  const dist = Math.hypot(r - bgR, g - bgG, b - bgB);
  // Also key out white/light grey grid lines (r,g,b > 240 with low saturation)
  const isWhiteGrid = (r > 240 && g > 240 && b > 240);
  if (dist < 110 || isWhiteGrid) {
    buf[i * 4 + 3] = 0;
  }
}

await sharp(Buffer.from(buf), { raw: { width: w, height: h, channels: 4 } })
  .png({ compressionLevel: 6 })
  .toBuffer()
  .then(async (pngBuf) => {
    // Process 3x3 grid: resize each 682x682 cell inwards by 8% to guarantee cell margin clearance
    const cellW = Math.floor(w / 3), cellH = Math.floor(h / 3);
    const innerW = Math.floor(cellW * 0.88), innerH = Math.floor(cellH * 0.88);
    const offsetX = Math.floor((cellW - innerW) / 2), offsetY = Math.floor((cellH - innerH) / 2);
    
    const composites = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const left = c * cellW, top = r * cellH;
        const resizedCell = await sharp(pngBuf)
          .extract({ left, top, width: cellW, height: cellH })
          .resize(innerW, innerH, { fit: 'fill' })
          .toBuffer();
        composites.push({
          input: resizedCell,
          top: top + offsetY,
          left: left + offsetX
        });
      }
    }
    
    return sharp({
      create: {
        width: w,
        height: h,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
    .composite(composites)
    .png()
    .toFile(outPath);
  });

console.log(`Successfully keyed and saved ${outPath}`);
