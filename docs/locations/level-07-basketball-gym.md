# Level 7 — BASKETBALL GYM (`basketball-gym`) · אולם כדורסל

## The place

**Imaginary (owner, 2026-09-13): no real hall is referenced — invent one.** "Ulam HaSport Kfar Ganim": the municipal
sports hall where Eviatar's youth team plays — the kind every Israeli neighbourhood has, next to the school.

- Street View: none — the place is made up. No reference photos; the description below is the reference.

## What is there (invented, keep it consistent)

A full-size indoor court with a **honey-coloured parquet floor**, the key and three-point arcs in **blue and orange**, a
large **orange-and-white centre logo**. Far wall: a **folding bleacher** (blue seats) that runs most of the width, a
**scoreboard** in the middle with red digits, **team and league banners** (blue-white-orange, no readable text) hung under
the roof trusses, and high windows with wire mesh letting in daylight. Both ends: **glass backboards with orange hoops**
and blue wall padding beneath. Left side: a ball cart, a stack of orange balls, gym bags on a bench, a water cooler. The
roof is white steel trusses with strip lights; a big Israeli flag hangs at the far right corner.

## What the current plate shows (`public/game/levels/bg-07.webp`)

An evening gym with a sunset skyline through the windows — atmospheric, but it's a night plate in a daytime campaign and
the bleachers are drawn too small. Redo it in daylight with the layout above.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of the inside of a municipal basketball sports hall in Israel, daylight through high mesh-covered windows: a long far wall with a folding bleacher of blue seats, a red-digit scoreboard in the middle, blue-white-orange team banners hung from white steel roof trusses with strip lights, an Israeli flag at the far right; glass backboards with orange hoops and blue wall padding at both ends; a ball cart with orange balls, gym bags on a bench and a water cooler at the left. The bottom third is an empty honey-coloured parquet floor with blue and orange court lines and a big orange centre logo, in one flat plane. No people, no legible text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 8 of 10
- **Attach:** `public/game/levels/bg-07.webp` (the current plate — keep its composition, replace the place) and
  - (no photos — the place is imaginary; the "What is there" section above is the reference)
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-07.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 7 public/assets/generated/backdrops/level-07.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-07.webp` shows the place described above, the bottom third is a
  clear flat lane with nothing standing in it, there is no text and no figure, and the style matches the other plates
  (painted pixel-art, daylight, saturated). Otherwise regenerate once with the failing rule first and **bolded**.

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
