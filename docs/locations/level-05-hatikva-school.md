# Level 5 — HATIKVA SCHOOL (`hatikva-school`) · בית ספר התקווה

## The place

**HaTikva School (בית ספר התקווה) — the family's school. The exact school and city are not recorded in the repo.**

- Street View: (fill in once the address is known: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG)
- **TO CONFIRM BY THE OWNER:** which school (city + street)? Paste the address, fill the Street View link, screenshot the entrance and the yard into `docs/refs/locations/05-hatikva-school/`, and replace 'white two-storey building with blue railings' in the prompt with what is actually there.
- Reference photos: none yet — take 2–3 Street View screenshots of the spot into `docs/refs/locations/05-hatikva-school/` before the request.

## What is actually there

Typical of an Israeli elementary school of this kind (to be replaced by the real one): two- or three-storey white or
beige buildings with blue or green railings, a paved yard with a painted basketball / dodgeball court, big shade sails on
steel poles, a large ficus tree, a wall mural painted by pupils, bike racks, a gate with the school sign, drinking-water
troughs, benches. Sunny; the yard is the lane.

## What the current plate shows (`public/game/levels/bg-05.webp`)

A white school building, a court and a shade pergola — generic but the right kind of place. Once the real school is
known, redraw it with its actual entrance, colours, mural and yard layout.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of the yard of HaTikva elementary school in Israel, sunny late morning: behind the yard a white two-storey school building with blue railings and a covered walkway, a colourful pupils' mural on one wall, a big ficus tree, shade sails on steel poles, a basketball hoop at the side, bike racks and benches by the fence, the school's entrance gate at the far left. The bottom third is the empty paved yard with faint painted court lines. No people, no text, no cars. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-05.webp` (for the
layout: "keep this composition, replace the place with the real one").
