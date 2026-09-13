# Level 1 — RISHON LEZION (`rishon`) · ראשון לציון

## The place

**Founders' Square (Kikar HaMeyasdim / כיכר המייסדים) and the Rothschild Street pedestrian mall — the historic centre of Rishon LeZion.**

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=31.96439,34.80718 — the square in front of the Great Synagogue; turn to face south-west for the synagogue, north for the Rothschild mall
- **TO CONFIRM BY THE OWNER:** this assumes the 'Rishon LeZion' level means the old town centre; if the family's own Rishon spot (a neighbourhood, a street, the beach) is meant, paste its address here and swap the references.
- Reference photos (Wikimedia Commons, credits in [../refs/locations/CREDITS.md](../refs/locations/CREDITS.md)):
  - `docs/refs/locations/01-rishon/ref-01.jpg`
  - `docs/refs/locations/01-rishon/ref-02.jpg`
  - `docs/refs/locations/01-rishon/ref-03.jpg`
  (ref-01/02: the Great Synagogue on Founders' Square; ref-03: the Rothschild pedestrian mall)

## What is actually there

The Great Synagogue (1885): a white-plastered two-storey façade with a triangular gable topped by a menorah, tall arched
windows, a black iron fence and a small forecourt with palms. Around the square: low one- and two-storey First Aliyah
buildings in cream and ochre plaster with red-tile roofs and green shutters, the Village Well courtyard (Be'er HaMeyasdim),
heritage plaques on stone, old-fashioned street lamps, ficus and palm trees. Rothschild Street runs off it as a pedestrian
mall: light stone paving, café terraces under white umbrellas, small shopfronts, planters and benches.

## What the current plate shows (`public/game/levels/bg-01.webp`)

A generic modern plaza — fountain, palms, a sculpture, glass towers behind. Nothing of the real square. Keep the wide
open paving in the lane and the palms; replace everything behind it with the real Founders' Square.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of Founders' Square in Rishon LeZion, Israel, in bright midday sun. Centre-left: the white Great Synagogue with its triangular gable, menorah on top, tall arched windows and black iron fence, palms in front. Right: low cream and ochre 19th-century buildings with red-tile roofs and green shutters, the entrance to the Rothschild pedestrian mall with café umbrellas and small shopfronts, old lampposts, a ficus tree. The bottom third is empty light-stone paving. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-01.webp` (for the
layout: "keep this composition, replace the place with the real one").
