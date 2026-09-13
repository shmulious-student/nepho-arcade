# Level 5 — HATIKVA SCHOOL (`hatikva-school`) · בית ספר התקווה

## The place

**Col·legi Hatikva (Escola Sefardí Hatikva), Av. Mas Fuster 128, 08197 Valldoreix, Sant Cugat del Vallès** — the family's
school (owner, 2026-09-13). Website: https://fundacionhatikva.org/instalaciones/

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.4546424,2.0547125 — from the street the
  school is only a white wall with a dark corrugated-metal fence and a rust-brown gate (`sv-01`); everything that matters
  is inside, so the references are the school's own public photos.
- Reference photos (from the school's website, URLs in the `.txt` next to each; reference only):
  - `docs/refs/locations/05-hatikva-school/building-entrance.jpg` — the main building: white three-storey block with rows of
    windows, an old olive tree in a planter by the glass entrance, a blue-tiled mosaic wall, wooden fence
  - `docs/refs/locations/05-hatikva-school/library.png` — the library: white shelves, wooden floor
  - `docs/refs/locations/05-hatikva-school/logo.png` — the school's olive-leaf logo (for the sign / a wall crest)
  - `docs/refs/locations/05-hatikva-school/people-*.png` — the yard and the court (**local only, gitignored: they show
    pupils**; re-fetch from the URLs in the `.txt` files): the covered yard under one huge tree with picnic tables and a
    wooden play structure; the open court with painted lines, two basketball hoops, a white low wall with a blue-and-white
    geometric mural, the building's outside metal stairs, umbrella pines and the Collserola hills behind
  - `docs/refs/locations/05-hatikva-school/sv-01-street-and-fence.jpg` — the street outside (Street View)

## What is actually there

A small private school on a wooded hillside in Valldoreix: a **white three-storey main building** with regular rows of
windows and an outside metal staircase, an **open sports court** (grey-brown asphalt, yellow and white painted lines,
basketball hoops with glass boards) bounded by a **low white wall with a blue-white geometric mural** and a high fence,
umbrella pines and the green Collserola ridge right behind, a **big shade tree** over a yard with wooden picnic tables and
a play structure, an olive tree by the glass entrance, a wall of blue mosaic tiles. Mediterranean light.

## What the current plate shows (`public/game/levels/bg-05.webp`)

A generic Israeli school yard with a court and a shade pergola. Right idea, wrong place: make it this court, with the
white building, the mural wall, the pines and the hills.

## Prompt

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of the sports court of Col·legi Hatikva in Valldoreix near Barcelona, sunny late morning: behind the court a white three-storey school building with rows of windows and an outside metal staircase, a low white wall with a blue-and-white geometric mural running along the court's edge, basketball hoops with glass backboards at both sides, a huge shade tree over wooden picnic tables at the far left, an olive tree by a glass entrance, umbrella pines and a green wooded ridge behind everything, clear blue sky. The bottom third is the empty asphalt court with faint yellow and white painted lines in one flat plane. No people, no text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 3 of 10
- **Attach:** `public/game/levels/bg-05.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/05-hatikva-school/building-entrance.jpg`
  - `docs/refs/locations/05-hatikva-school/library.png`
  - `docs/refs/locations/05-hatikva-school/logo.png`
  - `docs/refs/locations/05-hatikva-school/sv-01-street-and-fence.jpg`
  - `docs/refs/locations/05-hatikva-school/people-court-hoops.png`, `people-court-stairs-mural.png`, `people-yard-big-tree.png`
    (the court and yard — the most important ones; local-only files, present on this machine)
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/05-hatikva-school/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same place goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/05-hatikva-school/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/05-hatikva-school/gen-left.png docs/refs/locations/05-hatikva-school/gen-right.png docs/refs/locations/05-hatikva-school/gen-plate.png
  node tools/place-backdrop.mjs 5 docs/refs/locations/05-hatikva-school/gen-plate.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-05.webp` shows the place described above across its whole width with no
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-05.webp` (for the
layout: "keep this composition, replace the place with the real one").

## Log

- attempt count: 1 (gen-left ok, gen-right ok, seam diff 32.6). ACCEPTED.

