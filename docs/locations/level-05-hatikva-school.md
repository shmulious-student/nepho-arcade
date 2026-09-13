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

> Wide 2.82:1 painted pixel-art backdrop of the sports court of Col·legi Hatikva in Valldoreix near Barcelona, sunny late morning: behind the court a white three-storey school building with rows of windows and an outside metal staircase, a low white wall with a blue-and-white geometric mural running along the court's edge, basketball hoops with glass backboards at both sides, a huge shade tree over wooden picnic tables at the far left, an olive tree by a glass entrance, umbrella pines and a green wooded ridge behind everything, clear blue sky. The bottom third is the empty asphalt court with faint yellow and white painted lines in one flat plane. No people, no text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 3 of 10
- **Attach:** `public/game/levels/bg-05.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/05-hatikva-school/building-entrance.jpg`
  - `docs/refs/locations/05-hatikva-school/library.png`
  - `docs/refs/locations/05-hatikva-school/logo.png`
  - `docs/refs/locations/05-hatikva-school/sv-01-street-and-fence.jpg`
  - `docs/refs/locations/05-hatikva-school/people-court-hoops.png`, `people-court-stairs-mural.png`, `people-yard-big-tree.png`
    (the court and yard — the most important ones; local-only files, present on this machine)
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-05.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 5 public/assets/generated/backdrops/level-05.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-05.webp` shows the place described above, the bottom third is a
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-05.webp` (for the
layout: "keep this composition, replace the place with the real one").
