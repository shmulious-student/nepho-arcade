# Level 2 — REFAEL EITAN STREET (`petah-tikva`) · רחוב רפאל איתן · פתח תקווה

## The place

**Refael Eitan Street, Em HaMoshavot HaHadasha neighbourhood (אם המושבות החדשה), Petah Tikva — postcode 4922366; no. 3 has the Meuhedet clinic at street level.**

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=32.10349,34.88255 — stand on the street and pan to the side the family's building is on
- Reference photos (Wikimedia Commons, credits in [../refs/locations/CREDITS.md](../refs/locations/CREDITS.md)):
  - `docs/refs/locations/02-petah-tikva/ref-01.jpg`
  - `docs/refs/locations/02-petah-tikva/ref-02.jpg`
  - `docs/refs/locations/02-petah-tikva/ref-03.jpg`
  (ref-03 is the tower skyline of the new neighbourhood — the look to paint; ref-01/02 are roundabouts in the older part of Em HaMoshavot, for the trees, paving and light only)

## What is actually there

A 2010s neighbourhood: rows of 15–25-storey white and cream residential towers with glass balconies and rooftop
pergolas, spaced on wide streets with a planted median; young ficus and palm trees, a bike lane and wide pavements, clinic
and shop frontages at ground level, green fences around a small park and playground, the Yarkon park's tree line on the
horizon. Cars parked along the kerb; bright hazy coastal-plain sky.

## What the current plate shows (`public/game/levels/bg-02.webp`)

Already a modern city road with towers and a jacaranda — the closest of the ten. Make the towers the real Em HaMoshavot
towers (white, tall, balcony-stacked), put the clinic/shop frontage at street level and the median with young trees.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of Refael Eitan Street in the Em HaMoshavot neighbourhood of Petah Tikva, Israel, bright afternoon. Behind a wide pavement with young ficus and palm trees, a row of tall white and cream residential towers with stacked glass balconies and rooftop pergolas, a ground-floor clinic and small shops with awnings, a planted median with a bike lane, a green playground fence at the far right. Hazy bright sky. The bottom third is an empty pavement / road in one flat plane. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-02.webp` (for the
layout: "keep this composition, replace the place with the real one").
