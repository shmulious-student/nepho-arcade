# Level 9 — CANDY FACTORY (`candy-factory`) · מפעל ממתקים

## The place

**Imaginary (owner, 2026-09-13): no real factory is referenced — invent one.** "Mamtakei Savta" (Grandma's Sweets): a
small old-school candy factory in an industrial zone — copper kettles and conveyor belts, playful but grounded.

- Street View: none — the place is made up. No reference photos; the description below is the reference.

## What is there (invented, keep it consistent)

One long production floor. Left to right: a **big copper boiling kettle** on a brick base with steam; a **taffy-pulling
machine** with red-and-white candy stretched between its arms; a long **conveyor belt** carrying rows of bright wrapped
candies (red, yellow, green, pink) past a **wrapping machine** and into a **cooling tunnel**; a **gumball tower** — a tall
glass cylinder full of coloured balls; **cartons stacked on wooden pallets** and sacks of sugar; **colour-coded pipes**
(pink, yellow, mint) running overhead under skylights; at the far right a **glass-walled control room** with a control
panel of round dials. The floor is **grey concrete with yellow-and-black safety stripes** along the machine bases and a
painted walkway. Bright, cheerful, no branded product.

## What the current plate shows (`public/game/levels/bg-09.webp`)

A pink-and-candy-striped fantasy factory with a giant gumball tube — fun, but it reads like a theme park. Keep the
gumball tower and the pink accents, make the rest a real factory floor: copper kettle, conveyor, wrapping machine,
pallets, safety stripes.

## Prompt

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of a small old-fashioned candy factory production floor, bright daylight from skylights: a big copper boiling kettle on a brick base with steam at the left, a taffy-pulling machine stretching red-and-white candy, a long conveyor belt carrying rows of brightly wrapped candies past a wrapping machine into a cooling tunnel, a tall glass gumball tower full of coloured balls, cartons stacked on wooden pallets and sacks of sugar, pink, yellow and mint pipes running overhead, a glass-walled control room with round dials at the far right. The bottom third is an empty grey concrete floor with yellow-and-black safety stripes along the machine bases, in one flat plane. No people, no text or brand names. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 10 of 10
- **Attach:** `public/game/levels/bg-09.webp` (the current plate — keep its composition, replace the place) and
  - (no photos — the place is imaginary; the "What is there" section above is the reference)
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/09-candy-factory/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same place goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/09-candy-factory/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/09-candy-factory/gen-left.png docs/refs/locations/09-candy-factory/gen-right.png docs/refs/locations/09-candy-factory/gen-plate.png
  node tools/place-backdrop.mjs 9 docs/refs/locations/09-candy-factory/gen-plate.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-09.webp` shows the place described above across its whole width with no
  visible seam or repeated detail where the halves meet, the bottom third is a clear flat lane with nothing standing in it,
  there is no text and no figure, and the style matches the other plates (painted pixel-art, daylight, saturated). Otherwise regenerate once with the failing rule first and **bolded**.

## Delivery (same for every level)

- **The plate is 4:1 — shipped at 2800×700.** It fills the band the zoomed view can actually show: over a full
  five-wave level the camera scrolls across ~97% of its width, and at any moment ≥90% of its height is on screen (the top
  and bottom 16 px of 700 are bleed). Anything outside a 4:1 crop is lost.
- **Bottom third = the fighting lane**: an open, flat, evenly lit ground plane (paving, floor, road) with nothing standing
  in it — no people, no cars, no furniture below the horizon line; props stay at the sides or behind the lane. The renderer
  darkens this band a little for readability, so keep it mid-tone, not black.
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-09.webp` (for the
layout: "keep this composition, replace the place with the real one").
