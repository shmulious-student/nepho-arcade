# Level 6 — CAPOEIRA BRAZILIAN GYM (`capoeira-gym`) · חדר קפוארה ואומנויות לחימה

## The place

**The capoeira academy Omri trains at. The exact gym is not recorded in the repo.**

- Street View: (fill in once the address is known: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG)
- **TO CONFIRM BY THE OWNER:** which gym (name + address)? Paste it, add the Street View / a photo of the hall into `docs/refs/locations/06-capoeira-gym/`, and put the real mural and logo into the prompt.
- Reference photos: none yet — take 2–3 Street View screenshots of the spot into `docs/refs/locations/06-capoeira-gym/` before the request.

## What is actually there

Typical of a capoeira / martial-arts studio (to be replaced by the real one): a hall with a sprung wooden or rubber
floor, one mirrored wall, a Brazilian-themed mural (green–yellow–blue, the group's logo), berimbaus, atabaques and
pandeiros hung on the wall, a Brazilian flag, a rack of coloured cords (belts), a bench with water bottles, high windows.

## What the current plate shows (`public/game/levels/bg-06.webp`)

A wooden-floor hall with a capoeira mural, drums and a Brazilian flag — the right kind of place; the mural is
invented. Once the real gym is known, use its actual mural / logo, floor colour and window wall.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of the inside of a capoeira academy hall, daylight through high windows: a long back wall with a big painted mural in Brazilian green, yellow and blue showing a capoeira kick silhouette, berimbaus and atabaque drums hung beside it, a Brazilian flag, a rack of coloured cords, a mirrored section on the right, a bench with water bottles at the far left. The bottom third is an empty pale wooden sprung floor. No people, no text, no logos. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-06.webp` (for the
layout: "keep this composition, replace the place with the real one").
