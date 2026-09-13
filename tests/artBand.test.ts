import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { ART_BAND, LEVEL_W, VIEW_W, VIEW_H, VIEW_ZOOM, VISIBLE_X0, VISIBLE_W, VISIBLE_Y0, VISIBLE_H, SEGMENT_STEP, MAX_WAVES } from '../src/sim/types';
import { LEVELS, levelWidth, segmentX } from '../src/sim/levels';

// The backdrop band is the contract between the art (docs/locations: 4:1 plates) and the zoomed view:
// the whole band the camera can ever show must lie inside the plate, and the plate must not be much
// taller than the view shows — the owner's rule is "at least 90% of the art's height on screen".
describe('backdrop art band', () => {
  it('covers everything the view can show over a MAX_WAVES level', () => {
    const camMax = LEVEL_W - VIEW_W;
    expect(camMax).toBe(SEGMENT_STEP * (MAX_WAVES - 1));
    expect(ART_BAND.x).toBeLessThanOrEqual(VISIBLE_X0);
    expect(ART_BAND.x + ART_BAND.w).toBeGreaterThanOrEqual(camMax + VISIBLE_X0 + VISIBLE_W);
    expect(ART_BAND.y).toBeLessThanOrEqual(VISIBLE_Y0);
    expect(ART_BAND.y + ART_BAND.h).toBeGreaterThanOrEqual(VISIBLE_Y0 + VISIBLE_H);
  });
  it('shows at least 90% of the plate height at any moment and is the 4:1 the prompts ask for', () => {
    expect(VISIBLE_H / ART_BAND.h).toBeGreaterThanOrEqual(0.9);
    expect(VISIBLE_H).toBe(Math.round(VIEW_H / VIEW_ZOOM));
    expect(ART_BAND.w / ART_BAND.h).toBe(4);
  });
  it('levels scroll one step per wave and never past the plate', () => {
    for (const l of LEVELS) {
      expect(l.waves.length).toBeLessThanOrEqual(MAX_WAVES);
      expect(levelWidth(l)).toBeLessThanOrEqual(LEVEL_W);
      for (let i = 0; i < l.waves.length; i++) expect(segmentX(l, i)).toBe(Math.min(SEGMENT_STEP * i, levelWidth(l) - VIEW_W));
    }
  });
  it('the built catalog places every plate in a rect that covers the band (band or legacy)', () => {
    const catalog = JSON.parse(readFileSync('public/game/catalog.json', 'utf8'));
    for (const lv of catalog.levels) {
      expect(lv.art, `level ${lv.index} has no art rect — rebuild assets`).toBeTruthy();
      expect(lv.art.y).toBeLessThanOrEqual(VISIBLE_Y0);
      expect(lv.art.y + lv.art.h).toBeGreaterThanOrEqual(VISIBLE_Y0 + VISIBLE_H);
      if (lv.size.w === 2800) expect(lv.art).toEqual(ART_BAND);
    }
  });
});
