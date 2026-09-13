# Level 8 — THEATER (`theater`) · תיאטרון

## The place

**The theatre of the story — a stage seen from the boards. The exact theatre is not recorded in the repo.**

- Street View: (fill in once the address is known: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG)
- **TO CONFIRM BY THE OWNER:** which theatre (name + address)? Paste it, add a photo of its stage into `docs/refs/locations/08-theater/`, and adjust the curtain colour and backcloth to match.
- Reference photos: none yet — take 2–3 Street View screenshots of the spot into `docs/refs/locations/08-theater/` before the request.

## What is actually there

Typical of a municipal theatre / cultural hall (to be replaced by the real one): a proscenium stage with red velvet
curtains tied back, a painted city-at-night backcloth, footlights, a lighting rig with warm spots, stacked scenery flats
and crates in the wings, a piano or a props table, the dark auditorium seats in the distance if the camera faces out.

## What the current plate shows (`public/game/levels/bg-08.webp`)

A red-curtain stage with a painted night-city backcloth and props in the wings — the right idea. Once the theatre is
known (e.g. the local Heichal HaTarbut), use its real stage, curtain colour and auditorium.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of a theatre stage seen from stage level, warm stage lighting: red velvet curtains tied back on both sides, a painted backcloth of a city at night with a moon, a lighting rig with warm spotlights above, stacked scenery flats, wooden crates and a props table in the wings, footlights along the front edge. The bottom third is the empty wooden stage floor. No people, no text. Saturated, crisp, no photo texture.

## Delivery (same for every level)

- One image, **2816×1000** (2.82:1 — the plate is shown at 941×334, scaled to the 540 px view height, and covers the
  whole level's scroll range with no tiling; anything outside a 2.82:1 crop is lost).
- **Bottom third = the fighting lane**: an open, flat, evenly lit ground plane (paving, floor, road) with nothing standing
  in it — no people, no cars, no furniture below the horizon line; props stay at the sides or behind the lane. The renderer
  darkens this band a little for readability, so keep it mid-tone, not black.
- **Daylight**, saturated, clean painted pixel-art like the existing plates (`public/game/levels/bg-01…10.webp`) — crisp
  edges, no photo texture, no lens blur, no text anywhere (the game draws the bilingual sign itself).
- **No characters** in the plate. No watermark.
- Then: `node tools/place-backdrop.mjs <level> <image>` → `npm run build:assets && npm run test:assets` → look at the level
  on the dev server (`npm run dev`, pick the level in the lobby) → `npm run build && npm run content:deploy`.

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-08.webp` (for the
layout: "keep this composition, replace the place with the real one").
