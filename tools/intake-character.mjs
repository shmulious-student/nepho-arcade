// Intake normalizer for a delivered action file (docs/character-art-standard.md, "Intake").
//
//   node tools/intake-character.mjs <id> [action ...]
//
// Image models rarely hand over exactly what the standard asks for: the canvas comes back at an odd
// size (1024, 1254, 1536), the "transparent" background is a painted checkerboard or a magenta matte,
// there is no alpha channel at all. None of that is a drawing problem, so none of it should cost a
// regeneration. This step takes the delivered PNG and normalizes only its container — keys or
// unbakes the background into real alpha, resamples the whole sheet to 2048² — and writes it back in
// place. It never touches the frames themselves: nothing is cut, copied, blended or moved, so the
// gate (verify-character) still judges the art exactly as the model drew it.
import { existsSync, readdirSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import * as ops from './asset-ops.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const [id, ...only] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!id) { console.error('usage: node tools/intake-character.mjs <id> [action ...]'); process.exit(2); }
const dir = join(ROOT, 'public/assets/generated/actions', id);
if (!existsSync(dir)) { console.error(`no such set: ${dir}`); process.exit(2); }
const TARGET = 2048;

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, data: new Uint8Array(data.buffer, data.byteOffset, data.length) };
}
const toSharp = (img) => sharp(Buffer.from(img.data.buffer, img.data.byteOffset, img.data.length), { raw: { width: img.width, height: img.height, channels: 4 } });

const files = readdirSync(dir).filter((f) => f.endsWith('.png') && (!only.length || only.includes(f.replace(/\.png$/, ''))));
for (const file of files) {
  const path = join(dir, file);
  const meta = await sharp(path).metadata();
  let img = await loadRaw(path);
  const steps = [];
  // background → real alpha
  const opaque = ops.opaqueRatio(img);
  if (opaque > 0.9) {
    const keyed = ops.keyOutFlat(img);
    if (keyed && keyed.keyed > 0.3) { img = keyed.img; steps.push(`keyed flat matte rgb(${keyed.key})`); }
    else {
      const auto = ops.unbakeCheckerAuto(img);
      img = auto ? auto.img : ops.scrubLightFringe(ops.unbakeChecker(img), 2);
      steps.push(`unbaked painted checkerboard${auto ? ` (greys ${auto.levels.join('/')})` : ''} (opaque ${opaque.toFixed(2)} → ${ops.opaqueRatio(img).toFixed(2)})`);
    }
  }
  // canvas → 2048² (a non-square delivery is padded, never stretched)
  let s = toSharp(img);
  if (img.width !== img.height) {
    const side = Math.max(img.width, img.height);
    s = s.extend({ top: 0, left: 0, bottom: side - img.height, right: side - img.width, background: { r: 0, g: 0, b: 0, alpha: 0 } });
    steps.push(`padded ${img.width}×${img.height} to ${side}²`);
  }
  if (Math.max(img.width, img.height) !== TARGET) {
    // nearest-neighbour: pixel art stays crisp (the build resamples to game scale itself); a
    // smoothing kernel here softens every outline before the build ever sees it
    s = s.resize(TARGET, TARGET, { kernel: 'nearest', fit: 'fill' });
    steps.push(`resampled to ${TARGET}² (nearest)`);
  }
  if (!steps.length && meta.hasAlpha) { console.log(`${file}: already normalized`); continue; }
  // keep the exact delivery next to the tree, for the record
  const keep = join(ROOT, 'public/assets/backups/intake', id); mkdirSync(keep, { recursive: true });
  copyFileSync(path, join(keep, file));
  await s.png({ compressionLevel: 6 }).toFile(path + '.tmp');
  const { renameSync } = await import('node:fs'); renameSync(path + '.tmp', path);
  console.log(`${file}: ${steps.join('; ')}`);
}
console.log(`\nnext: npm run verify:character -- ${id}`);
