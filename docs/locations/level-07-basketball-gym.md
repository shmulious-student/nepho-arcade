# Level 7 — BASKETBALL GYM (`basketball-gym`) · אולם כדורסל

## The place

**The sports hall Eviatar plays basketball in. The exact hall is not recorded in the repo.**

- Street View: (fill in once the address is known: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG)
- **TO CONFIRM BY THE OWNER:** which hall (name + address)? Paste it, add a Street View / photo into `docs/refs/locations/07-basketball-gym/`, and put its real floor and banner colours into the prompt.
- Reference photos: none yet — take 2–3 Street View screenshots of the spot into `docs/refs/locations/07-basketball-gym/` before the request.

## What is actually there

Typical of an Israeli municipal / school sports hall (to be replaced by the real one): a parquet court with painted
lines and a centre logo, glass backboards on both ends, a folding bleacher along one wall, team and league banners, a
scoreboard, high windows with wire mesh, a wall of blue padding, gym bags and a ball cart at the side.

## What the current plate shows (`public/game/levels/bg-07.webp`)

An evening gym with a sunset skyline through the windows — atmospheric, but not a real place. Once the hall is known,
match its colours (floor, wall padding, banners) and daylight it like the other levels.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of the inside of a basketball sports hall in Israel, daylight: a long wall with folding bleachers, team banners and a scoreboard, glass backboards with orange hoops at both far ends, high mesh-covered windows, blue wall padding under the hoops, a ball cart and gym bags at the side. The bottom third is an empty parquet floor with painted court lines in one flat plane. No people, no text on the banners. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-07.webp` (for the
layout: "keep this composition, replace the place with the real one").
