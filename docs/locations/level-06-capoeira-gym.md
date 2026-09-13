# Level 6 — CAPOEIRA BRAZILIAN GYM (`capoeira-gym`) · חדר קפוארה ואומנויות לחימה

## The place

**Imaginary (owner, 2026-09-13): no real gym is referenced — invent one.** "Academia Ginga Petah Tikva": Omri's capoeira
group, a converted ground-floor workshop off a side street in Petah Tikva, painted up by the group itself.

- Street View: none — the place is made up. No reference photos; the description below is the reference.

## What is there (invented, keep it consistent)

A long hall with a **pale sprung-wood floor** and a **low stage at the far end** where the bateria sits. Back wall: a huge
hand-painted mural in **Brazilian green, yellow and blue** — a roda of silhouetted players, a crescent moon, the group's
name in curly lettering — with three **berimbaus, an atabaque and two pandeiros** hung on hooks beside it. Left wall:
**floor-to-ceiling mirrors** with a ballet bar. Right wall: high frosted windows with the afternoon sun coming through,
a **rack of coloured cords** (the belts), a wall of framed batizado photos, a Brazilian flag and an Israeli flag side by
side. Near the entrance a bench with water bottles and gym bags, a big fan, a stack of blue mats, a whiteboard with the
week's roda times. Warm wood tones against the flag colours.

## What the current plate shows (`public/game/levels/bg-06.webp`)

A wooden-floor hall with a capoeira mural, drums and a Brazilian flag — already this idea. Redo it with the layout above
(stage at the far end, mirror wall left, windows and cord rack right) so the whole width of the level reads as one room.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of the inside of a capoeira academy hall, warm afternoon light through high frosted windows on the right: a long back wall with a huge hand-painted mural in Brazilian green, yellow and blue of silhouetted capoeira players in a roda under a crescent moon, three berimbaus, an atabaque drum and two pandeiros hung on hooks beside it, a low wooden stage at the far end with drums on it; a floor-to-ceiling mirror wall with a ballet bar on the left; on the right a rack of coloured cords, framed photos, a Brazilian flag and an Israeli flag, a bench with water bottles, a stack of blue mats and a standing fan. The bottom third is an empty pale sprung wooden floor in one flat plane. No people, no legible text. Saturated, crisp, no photo texture.

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
