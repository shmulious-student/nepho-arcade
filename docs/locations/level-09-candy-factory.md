# Level 9 — CANDY FACTORY (`candy-factory`) · מפעל ממתקים

## The place

**The candy factory of the story — a production floor. The exact factory (a visited one, or a favourite brand's) is not recorded in the repo.**

- Street View: (fill in once the address is known: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG)
- **TO CONFIRM BY THE OWNER:** which factory (name + address, or a brand)? Paste it, add a photo of its floor into `docs/refs/locations/09-candy-factory/`, and name its real products in the prompt.
- Reference photos: none yet — take 2–3 Street View screenshots of the spot into `docs/refs/locations/09-candy-factory/` before the request.

## What is actually there

Typical of a sweets factory floor (to be replaced by the real one): stainless-steel machines and pipes, a conveyor
belt carrying wrapped candies, a big kettle and a cooling tunnel, sacks and drums of sugar and syrup, colour-coded pipes,
yellow-and-black safety stripes on the floor, a glass-walled control room, cartons stacked on pallets, bright strip lights.

## What the current plate shows (`public/game/levels/bg-09.webp`)

A pink-and-candy-striped fantasy factory with a giant gumball tube — fun, and the least real of the ten. Once the
factory is known, ground it: real machines, real product colours, real signage shapes, but keep it playful.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of a candy factory production floor, bright strip lighting: a long conveyor belt carrying colourful wrapped candies past stainless-steel machines, a big copper kettle and a cooling tunnel, colour-coded pipes overhead, drums and sacks of sugar, cartons on pallets, a glass-walled control room at the far right, pink and yellow accents on the machinery. The bottom third is an empty grey factory floor with yellow-and-black safety stripes along the edges. No people, no text or brand names. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-09.webp` (for the
layout: "keep this composition, replace the place with the real one").
