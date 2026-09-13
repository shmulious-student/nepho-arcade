// Joins two generated halves of a wide backdrop into one 4:1 plate:
//   node tools/stitch-backdrop.mjs <left.png> <right.png> <out.png> [--overlap=0.3]
// The right image is expected to start by repeating the right part of the left image (that is what
// the "continue this scene to the right" request asks for). Both are scaled to the same height, the
// best-matching overlap is searched between 10% and 50% of the width (mean absolute pixel
// difference), and the seam is feathered across the overlap. The result is cropped to 4:1 around the
// centre only if it came out wider; if narrower, place-backdrop's cover-resize will crop height.
import sharp from 'sharp';

const [, , leftPath, rightPath, outPath, ...rest] = process.argv;
if (!leftPath || !rightPath || !outPath) { console.error('usage: node tools/stitch-backdrop.mjs <left> <right> <out.png> [--overlap=0.3]'); process.exit(1); }
const hint = Number((rest.find((a) => a.startsWith('--overlap=')) || '--overlap=0.3').split('=')[1]);
const H = 700;
const load = async (p) => { const { data, info } = await sharp(p).rotate().resize({ height: H }).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height, c: info.channels }; };
const L = await load(leftPath), R = await load(rightPath);
const minOv = Math.round(0.1 * Math.min(L.w, R.w)), maxOv = Math.round(0.5 * Math.min(L.w, R.w));
let best = { ov: Math.round(hint * Math.min(L.w, R.w)), score: Infinity };
for (let ov = minOv; ov <= maxOv; ov += 4) {
  let sum = 0, n = 0;
  for (let y = 0; y < H; y += 3) for (let x = 0; x < ov; x += 3) {
    const lo = (y * L.w + (L.w - ov + x)) * L.c, ro = (y * R.w + x) * R.c;
    sum += Math.abs(L.data[lo] - R.data[ro]) + Math.abs(L.data[lo + 1] - R.data[ro + 1]) + Math.abs(L.data[lo + 2] - R.data[ro + 2]); n++;
  }
  const score = sum / n;
  if (score < best.score) best = { ov, score };
}
const ov = best.ov, W = L.w + R.w - ov;
const out = Buffer.alloc(W * H * 3);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const o = (y * W + x) * 3;
  if (x < L.w - ov) { const lo = (y * L.w + x) * L.c; out[o] = L.data[lo]; out[o + 1] = L.data[lo + 1]; out[o + 2] = L.data[lo + 2]; }
  else if (x >= L.w) { const ro = (y * R.w + (x - L.w + ov)) * R.c; out[o] = R.data[ro]; out[o + 1] = R.data[ro + 1]; out[o + 2] = R.data[ro + 2]; }
  else {
    const t = (x - (L.w - ov)) / ov, lo = (y * L.w + x) * L.c, ro = (y * R.w + (x - L.w + ov)) * R.c;
    for (let k = 0; k < 3; k++) out[o + k] = L.data[lo + k] * (1 - t) + R.data[ro + k] * t;
  }
}
let img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
if (W > 4 * H) img = img.extract({ left: Math.round((W - 4 * H) / 2), top: 0, width: 4 * H, height: H });
await img.png().toFile(outPath);
console.log(`stitched ${L.w}+${R.w} with overlap ${ov}px (mean diff ${best.score.toFixed(1)}) → ${outPath} ${Math.min(W, 4 * H)}×${H}${W < 4 * H ? ` — narrower than 4:1 (${(W / H).toFixed(2)}:1); place-backdrop will crop height` : ''}`);
