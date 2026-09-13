# Level 4 — SANT CUGAT TOWN (`sant-cugat`) · סנט קוגט

## The place

**Plaça d'Octavià with the Monestir de Sant Cugat, Sant Cugat del Vallès — the monastery's main façade and the square in front of it.**

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.47345,2.08426 — stand in the square and face the monastery façade
- Street View frames rendered with `node tools/streetview-ref.mjs` (reference only):
  - `docs/refs/locations/04-sant-cugat/sv-01-monastery.jpg`
  - `docs/refs/locations/04-sant-cugat/sv-02-square.jpg`
  (pano `UPUA1mpcXgYmriXvDtaX9Q` on Plaça d'Octavià — the monastery's stone wall with the rose window above it and three cypresses, and the square's granite paving, plane trees, café terrace and the 1930s pastry-shop corner)
- Reference photos (Wikimedia Commons, credits in [../refs/locations/CREDITS.md](../refs/locations/CREDITS.md)):
  - `docs/refs/locations/04-sant-cugat/ref-01.jpg`
  - `docs/refs/locations/04-sant-cugat/ref-02.jpg`

## What is actually there

The monastery: a Romanesque–Gothic sand-stone façade with a huge rose window, a pointed-arch portal with sculpted
archivolts, a battlemented wall and a square bell tower with a small spire; cypress trees along the wall. The square:
light granite paving, plane trees, café terraces, two- and three-storey pastel town houses with balconies, a stone drinking
fountain, the Carrer Major leading off to shops and bunting.

## What the current plate shows (`public/game/levels/bg-04.webp`)

Already a monastery with a rose window and arcades — close. Match the real façade (rose window proportions, portal,
battlements, bell tower on the right), keep the paved square and cypresses, drop the invented arcade on the left.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of Plaça d'Octavià in Sant Cugat del Vallès, Catalonia, bright morning: centre-right the Romanesque-Gothic monastery façade in sand-coloured stone with a large rose window, a sculpted pointed-arch portal, battlements and a square bell tower, tall cypresses along its wall; left, pastel two- and three-storey town houses with iron balconies, a café terrace with umbrellas and plane trees, a small stone fountain. The bottom third is empty light-granite paving. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 5 of 10
- **Attach:** `public/game/levels/bg-04.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/04-sant-cugat/ref-01.jpg`
  - `docs/refs/locations/04-sant-cugat/ref-02.jpg`
  - `docs/refs/locations/04-sant-cugat/sv-01-monastery.jpg`
  - `docs/refs/locations/04-sant-cugat/sv-02-square.jpg`
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-04.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 4 public/assets/generated/backdrops/level-04.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-04.webp` shows the place described above, the bottom third is a
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-04.webp` (for the
layout: "keep this composition, replace the place with the real one").
