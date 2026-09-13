# Level 8 — THEATER (`theater`) · תיאטרון

## The place

**Imaginary (owner, 2026-09-13): no real theatre is referenced — invent one.** "Teatron HaMoshava": an old-fashioned
municipal theatre — a proscenium stage with a painted backcloth, seen from the boards on the night of the school show.

- Street View: none — the place is made up. No reference photos; the description below is the reference.

## What is there (invented, keep it consistent)

The camera stands on the stage looking across it. **Deep-red velvet curtains** with gold fringe are tied back on both
sides; behind the action a **painted backcloth of a city at night** — silhouetted rooftops, a full moon, lit windows.
Above, a **lighting rig** of warm spots and a couple of coloured gels (magenta, cyan) on black steel bars. In the wings:
**stacked scenery flats** (a painted forest, a castle wall), wooden crates, a props table with a crown and a sword, a
ladder, a rolling clothes rail of costumes, a piano at the far left. Along the front edge, **footlights**. The stage is
old **honey-brown wooden boards** with tape marks. Warm gold light from the front, cool blue from the backcloth.

## What the current plate shows (`public/game/levels/bg-08.webp`)

A red-curtain stage with a painted night-city backcloth and props in the wings — already this idea. Redo it with the
layout above (curtains framing both ends, backcloth spanning the middle, wings full of flats and props) at the plate's
full width.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of a theatre stage seen from stage level, warm gold stage lighting: deep-red velvet curtains with gold fringe tied back at both ends, a painted backcloth of a city at night with silhouetted rooftops, lit windows and a full moon spanning the middle, a lighting rig of warm spotlights and magenta and cyan gels on black bars above, stacked painted scenery flats, wooden crates, a props table with a crown and a sword, a ladder and a rail of costumes in the wings, an upright piano at the far left, footlights along the front edge. The bottom third is the empty honey-brown wooden stage floor. No people, no text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 9 of 10
- **Attach:** `public/game/levels/bg-08.webp` (the current plate — keep its composition, replace the place) and
  - (no photos — the place is imaginary; the "What is there" section above is the reference)
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-08.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 8 public/assets/generated/backdrops/level-08.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-08.webp` shows the place described above, the bottom third is a
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-08.webp` (for the
layout: "keep this composition, replace the place with the real one").
