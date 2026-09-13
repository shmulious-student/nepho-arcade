// Joins two or more generated tiles of a wide backdrop, left to right, into one 4:1 plate:
//   node tools/stitch-backdrop.mjs <left.png> <right.png> [<more.png> ...] <out.png> [--overlap=0.3]
// Each tile is expected to start by repeating the right part of the previous one (that is what the
// "continue this scene to the right" request asks for). Tiles are scaled to the same height, the
// best-matching overlap is searched between 10% and 50% of the width (mean absolute pixel
// difference); then, inside that overlap, the single column where the two images agree best is chosen
// as the seam and the join is blended over a narrow band (--feather=48 px) around it — a wide feather
// across the whole overlap ghosts anything the halves drew differently (a tower half there, half not).
// The result is cropped to 4:1 around the centre only if it came out wider; if narrower,
// place-backdrop's cover-resize will crop height.
import sharp from 'sharp';

const args = process.argv.slice(2), rest = args.filter((a) => a.startsWith('--')), paths = args.filter((a) => !a.startsWith('--'));
const outPath = paths.pop();
if (paths.length < 2 || !outPath) { console.error('usage: node tools/stitch-backdrop.mjs <left> <right> [<more> ...] <out.png> [--overlap=0.3] [--feather=48]'); process.exit(1); }
const hint = Number((rest.find((a) => a.startsWith('--overlap=')) || '--overlap=0.3').split('=')[1]);
const feather = Number((rest.find((a) => a.startsWith('--feather=')) || '--feather=48').split('=')[1]);
const H = 700;
const load = async (p) => { const { data, info } = await sharp(p).rotate().resize({ height: H }).removeAlpha().raw().toBuffer({ resolveWithObject: true }); return { data, w: info.width, h: info.height, c: info.channels }; };

function stitchPair(L, R) {
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
  const colDiff = new Float64Array(ov);
  for (let x = 0; x < ov; x++) {
    let sum = 0;
    for (let y = 0; y < H; y += 2) {
      const lo = (y * L.w + (L.w - ov + x)) * L.c, ro = (y * R.w + x) * R.c;
      sum += Math.abs(L.data[lo] - R.data[ro]) + Math.abs(L.data[lo + 1] - R.data[ro + 1]) + Math.abs(L.data[lo + 2] - R.data[ro + 2]);
    }
    colDiff[x] = sum;
  }
  let seam = Math.round(ov / 2), seamScore = Infinity;
  const half = Math.max(1, Math.round(feather / 2));
  for (let x = half; x < ov - half; x++) { let a = 0; for (let k = -half; k <= half; k++) a += colDiff[x + k]; if (a < seamScore) { seamScore = a; seam = x; } }
  const seamX = L.w - ov + seam;
  const out = Buffer.alloc(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 3;
    const t = Math.min(1, Math.max(0, (x - (seamX - half)) / (2 * half)));
    const useL = t < 1 && x < L.w, useR = t > 0 && x >= L.w - ov;
    const lo = (y * L.w + x) * L.c, ro = (y * R.w + (x - L.w + ov)) * R.c;
    for (let k = 0; k < 3; k++) out[o + k] = useL && useR ? L.data[lo + k] * (1 - t) + R.data[ro + k] * t : useL ? L.data[lo + k] : R.data[ro + k];
  }
  console.log(`  ${L.w}+${R.w}: overlap ${ov}px (mean diff ${best.score.toFixed(1)}${best.score > 60 ? ' — HIGH, the tile did not repeat the previous one; check the seam' : ''}), seam at x=${seamX}, blend ${2 * half}px`);
  return { data: out, w: W, h: H, c: 3 };
}

let acc = await load(paths[0]);
for (const p of paths.slice(1)) acc = stitchPair(acc, await load(p));
const out = acc.data, W = acc.w;
let img = sharp(out, { raw: { width: W, height: H, channels: 3 } });
if (W > 4 * H) img = img.extract({ left: Math.round((W - 4 * H) / 2), top: 0, width: 4 * H, height: H });
await img.png().toFile(outPath);
console.log(`stitched ${paths.length} tiles → ${outPath} ${Math.min(W, 4 * H)}×${H}${W < 4 * H ? ` — ${(W / H).toFixed(2)}:1, narrower than 4:1; place-backdrop keeps the full height and fills the right side (fine for ≤3-wave levels); add a third tile for a full-width plate` : ''}`);
