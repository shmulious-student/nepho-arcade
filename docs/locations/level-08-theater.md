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

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of a theatre stage seen from stage level, warm gold stage lighting: deep-red velvet curtains with gold fringe tied back at both ends, a painted backcloth of a city at night with silhouetted rooftops, lit windows and a full moon spanning the middle, a lighting rig of warm spotlights and magenta and cyan gels on black bars above, stacked painted scenery flats, wooden crates, a props table with a crown and a sword, a ladder and a rail of costumes in the wings, an upright piano at the far left, footlights along the front edge. The ground plane's far edge is a straight horizontal line 58% down from the top, marked by a row of tape marks and the bottom hem of the painted backcloth so the walkable band reads as its own strip, and everything below it is the empty honey-brown wooden stage floor. No people, no text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 9 of 10
- **Attach:** `public/game/levels/bg-08.webp` (the current plate — keep its composition, replace the place) and
  - (no photos — the place is imaginary; the "What is there" section above is the reference)
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/08-theater/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same place goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/08-theater/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/08-theater/gen-left.png docs/refs/locations/08-theater/gen-right.png docs/refs/locations/08-theater/gen-plate.png
  node tools/place-backdrop.mjs 8 docs/refs/locations/08-theater/gen-plate.png --floor=<measured %, e.g. 66%>
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-08.webp` shows the place described above across its whole width with no
  visible seam or repeated detail where the halves meet, the bottom third is a clear flat lane with nothing standing in it,
  there is no text and no figure, and the style matches the other plates (painted pixel-art, daylight, saturated). Otherwise regenerate once with the failing rule first and **bolded**.

## Delivery (same for every level)

- **The plate is 4:1 — shipped at 2800×700.** It fills the band the zoomed view can actually show: over a full
  five-wave level the camera scrolls across ~97% of its width, and at any moment ≥90% of its height is on screen (the top
  and bottom 16 px of 700 are bleed). Anything outside a 4:1 crop is lost.
- **The fighting lane is rows 58%–92% of the plate** (world y 380–500 — the characters walk only there): the ground plane's
  far edge (kerb, wall base, back line of the court) must be a straight horizontal line at **58% of the height**, and
  everything below it an open, flat, evenly lit ground plane with nothing standing in it — no people, cars, benches,
  ponds or planters; props stay above that line or at the far sides. **The lane must be visibly marked by a natural built
  element at its far edge** (a kerb, a wall base, a painted line, a change of paving) so a player sees where they can walk. Models tend to put the ground at 65–70% anyway —
  measure it on the delivered image and pass it as `--floor=NN%` to `place-backdrop`, which shifts the content and tiles
  the pavement to fill; do not accept a plate whose ground has objects in the lane band.
- **Daylight**, saturated, clean painted pixel-art like the existing plates (`public/game/levels/bg-01…10.webp`) — crisp
  edges, no photo texture, no lens blur, no text anywhere (the game draws the bilingual sign itself).
- **No characters** in the plate. No watermark.
- **Image models stop at 21:9, so a plate is two requests**: (1) the Prompt as the **left** part of the scene at 21:9;
  (2) the same session, with request 1's image attached: "continue this exact scene to the **right** as a 21:9 image —
  the left third of the new image repeats the right third of the attached one exactly, then the same street/hall goes on
  with new details in the same style, light and horizon; no text, no people, the bottom third stays an empty flat
  ground plane". Then `node tools/stitch-backdrop.mjs left.png right.png plate.png` finds the overlap and blends the seam
  (two 21:9 halves with a one-third overlap come out ~3.9:1 — `place-backdrop` cover-fits the rest). A model that can
  output 4:1 or wider in one go needs only request 1 with "4:1, 2800×700".
- Then: `node tools/place-backdrop.mjs <level> plate.png` (writes `public/assets/generated/backdrops/level-NN.png`) →
  `npm run build:assets && npm run test:assets` → look at the level on the dev server (`npm run dev`, pick it in the
  lobby) → `npm run build && npm run content:deploy`.

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-08.webp` (for the
layout: "keep this composition, replace the place with the real one").
