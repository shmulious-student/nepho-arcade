// Pure pixel processing for the portrait-upload face rig. Operates on ImageData so it is testable
// under vitest without a real canvas: callers pass in {width,height,data:Uint8ClampedArray}.
// Portrait contract: everything here runs client-side only; the photo never leaves the device.

export interface RGBAImage { width: number; height: number; data: Uint8ClampedArray }

/** Canonical baked size of a face texture — FaceRig.ts scales on-screen size from this, so every
 * caller must build (and every consumer must read) textures at exactly this size, not a hardcoded
 * literal that can silently drift out of sync (as 96 vs. 128 did before this constant existed). */
export const FACE_TEXTURE_SIZE = 128;

export function makeRGBA(width: number, height: number): RGBAImage {
  return { width, height, data: new Uint8ClampedArray(width * height * 4) };
}

/** Finds a rough face center via a skin-tone centroid, for the default crop-oval placement. */
export function skinCentroid(img: RGBAImage): { x: number; y: number; r: number } | null {
  const { width, height, data } = img;
  let sx = 0, sy = 0, n = 0, minX = width, maxX = 0, minY = height, maxY = 0;
  const step = Math.max(1, Math.floor(Math.min(width, height) / 200));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (isSkinTone(r, g, b)) { sx += x; sy += y; n++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
  }
  if (n < 8) return null;
  const r = Math.max(maxX - minX, maxY - minY) / 2;
  return { x: sx / n, y: sy / n, r: Math.max(r, Math.min(width, height) * 0.2) };
}

function isSkinTone(r: number, g: number, b: number): boolean {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx < 60 || mx - mn < 12) return false;
  return r > 60 && g > 30 && b > 10 && r > g && r > b && r - b > 12 && r - g < 90;
}

/** Crops a centered circle from src (given center + radius in src pixel coords) into a square RGBA of
 * `size`x`size`, with alpha=0 outside the circle. */
export function cropCircle(src: RGBAImage, cx: number, cy: number, r: number, size: number): RGBAImage {
  const out = makeRGBA(size, size);
  const scale = (2 * r) / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - size / 2, dy = y - size / 2;
      const o = (y * size + x) * 4;
      if (dx * dx + dy * dy > (size / 2) * (size / 2)) { out.data[o + 3] = 0; continue; }
      const sx = Math.round(cx + dx * scale), sy = Math.round(cy + dy * scale);
      if (sx < 0 || sy < 0 || sx >= src.width || sy >= src.height) { out.data[o + 3] = 0; continue; }
      const si = (sy * src.width + sx) * 4;
      out.data[o] = src.data[si]; out.data[o + 1] = src.data[si + 1]; out.data[o + 2] = src.data[si + 2]; out.data[o + 3] = 255;
    }
  }
  return out;
}

/** "Embeds" a photo into the sprite's pixel-art idiom: downsample to a small grid, posterize colour
 * levels, push toward the sprite's own skin tone, and stamp a solid outline ring in the sprite's
 * outline colour — so it reads as part of the character rather than a pasted photo. */
export function stylizeFace(circle: RGBAImage, gridSize: number, levels: number, skin: [number, number, number], outline: [number, number, number], warmth = 0.28): RGBAImage {
  const small = downsample(circle, gridSize);
  const out = makeRGBA(gridSize, gridSize);
  const cx = gridSize / 2, cy = gridSize / 2, rad = gridSize / 2;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const i = (y * gridSize + x) * 4;
      const dx = x - cx + 0.5, dy = y - cy + 0.5;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > rad) { out.data[i + 3] = 0; continue; }
      if (small.data[i + 3] < 40) { out.data[i + 3] = 0; continue; }
      let r = posterize(small.data[i], levels), g = posterize(small.data[i + 1], levels), b = posterize(small.data[i + 2], levels);
      r = r * (1 - warmth) + skin[0] * warmth;
      g = g * (1 - warmth) + skin[1] * warmth;
      b = b * (1 - warmth) + skin[2] * warmth;
      // 1px outline ring at the circle boundary
      if (d > rad - 1.4) { r = outline[0]; g = outline[1]; b = outline[2]; }
      out.data[i] = clamp255(r); out.data[i + 1] = clamp255(g); out.data[i + 2] = clamp255(b); out.data[i + 3] = 255;
    }
  }
  return out;
}

function downsample(src: RGBAImage, size: number): RGBAImage {
  const out = makeRGBA(size, size);
  const bw = src.width / size, bh = src.height / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      const x0 = Math.floor(x * bw), x1 = Math.max(x0 + 1, Math.floor((x + 1) * bw));
      const y0 = Math.floor(y * bh), y1 = Math.max(y0 + 1, Math.floor((y + 1) * bh));
      for (let sy = y0; sy < y1 && sy < src.height; sy++) {
        for (let sx = x0; sx < x1 && sx < src.width; sx++) {
          const si = (sy * src.width + sx) * 4;
          const aa = src.data[si + 3];
          r += src.data[si] * aa; g += src.data[si + 1] * aa; b += src.data[si + 2] * aa; a += aa; n++;
        }
      }
      const o = (y * size + x) * 4;
      if (a > 0) { out.data[o] = r / a; out.data[o + 1] = g / a; out.data[o + 2] = b / a; }
      out.data[o + 3] = n ? a / n : 0;
    }
  }
  return out;
}

const posterize = (v: number, levels: number) => Math.round(Math.round((v / 255) * (levels - 1)) / (levels - 1) * 255);
const clamp255 = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

export interface FacePipelineOptions { gridSize?: number; levels?: number; warmth?: number; outputSize?: number }

/** Full pipeline: source image + crop center/radius -> final stylized RGBA at outputSize (nearest-
 * upscaled from the low-res grid so it stays crisp like the sprite art, not blurry). */
export function buildFaceTexture(src: RGBAImage, cx: number, cy: number, r: number, skin: [number, number, number], outline: [number, number, number], opts: FacePipelineOptions = {}): RGBAImage {
  const gridSize = opts.gridSize ?? 20;
  const levels = opts.levels ?? 6;
  const outputSize = opts.outputSize ?? FACE_TEXTURE_SIZE;
  const circle = cropCircle(src, cx, cy, r, gridSize * 6);
  const stylized = stylizeFace(circle, gridSize, levels, skin, outline, opts.warmth);
  return upscaleNearest(stylized, outputSize);
}

function upscaleNearest(src: RGBAImage, size: number): RGBAImage {
  const out = makeRGBA(size, size);
  const scale = src.width / size;
  for (let y = 0; y < size; y++) {
    const sy = Math.min(src.height - 1, Math.floor(y * scale));
    for (let x = 0; x < size; x++) {
      const sx = Math.min(src.width - 1, Math.floor(x * scale));
      const si = (sy * src.width + sx) * 4, di = (y * size + x) * 4;
      out.data[di] = src.data[si]; out.data[di + 1] = src.data[si + 1]; out.data[di + 2] = src.data[si + 2]; out.data[di + 3] = src.data[si + 3];
    }
  }
  return out;
}
