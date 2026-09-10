import { describe, it, expect } from 'vitest';
import { makeRGBA, skinCentroid, cropCircle, stylizeFace, buildFaceTexture, type RGBAImage } from '../src/face/process';

function fillRect(img: RGBAImage, x0: number, y0: number, w: number, h: number, r: number, g: number, b: number, a = 255) {
  for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
    const i = (y * img.width + x) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
  }
}

function samplePortrait(): RGBAImage {
  const img = makeRGBA(200, 200);
  fillRect(img, 0, 0, 200, 200, 40, 60, 90); // background
  fillRect(img, 60, 40, 80, 90, 224, 172, 130); // a skin-toned "face" block
  return img;
}

describe('face process', () => {
  it('skinCentroid finds the face block roughly centered', () => {
    const img = samplePortrait();
    const c = skinCentroid(img);
    expect(c).not.toBeNull();
    expect(c!.x).toBeGreaterThan(70);
    expect(c!.x).toBeLessThan(130);
    expect(c!.y).toBeGreaterThan(50);
    expect(c!.y).toBeLessThan(140);
  });

  it('cropCircle produces a circular alpha mask (corners transparent, center opaque)', () => {
    const img = samplePortrait();
    const circle = cropCircle(img, 100, 85, 50, 64);
    const corner = circle.data[3]; // top-left alpha
    const centerIdx = (32 * 64 + 32) * 4;
    expect(corner).toBe(0);
    expect(circle.data[centerIdx + 3]).toBe(255);
  });

  it('stylizeFace posterizes colour into few discrete levels and stamps an outline ring', () => {
    const img = samplePortrait();
    const circle = cropCircle(img, 100, 85, 50, 120);
    const skin: [number, number, number] = [210, 160, 120];
    const outline: [number, number, number] = [20, 18, 30];
    const styl = stylizeFace(circle, 20, 6, skin, outline, 0.3);
    // collect distinct (r,g,b) triples among opaque pixels — posterization + warmth blend should keep
    // this small relative to a 20x20 grid with continuous source colour
    const seen = new Set<string>();
    for (let i = 0; i < styl.data.length; i += 4) {
      if (styl.data[i + 3] === 0) continue;
      seen.add(`${styl.data[i]},${styl.data[i + 1]},${styl.data[i + 2]}`);
    }
    expect(seen.size).toBeLessThan(40);
    // the outline ring pixel (edge of the circle, middle row) should equal the outline colour
    const cx = 10, cy = 10, edgeX = cx + 9; // near the right edge of the 20x20 grid, radius 10
    const idx = (cy * 20 + edgeX) * 4;
    if (styl.data[idx + 3] > 0) {
      expect(styl.data[idx]).toBe(outline[0]);
      expect(styl.data[idx + 1]).toBe(outline[1]);
      expect(styl.data[idx + 2]).toBe(outline[2]);
    }
  });

  it('buildFaceTexture returns an opaque-at-center, transparent-at-corner square of the requested size', () => {
    const img = samplePortrait();
    const face = buildFaceTexture(img, 100, 85, 50, [210, 160, 120], [20, 18, 30], { outputSize: 64 });
    expect(face.width).toBe(64);
    expect(face.height).toBe(64);
    expect(face.data[3]).toBe(0); // corner transparent
    const centerIdx = (32 * 64 + 32) * 4;
    expect(face.data[centerIdx + 3]).toBe(255); // center opaque
  });
});
