# Level 10 — CATALUNYA (`catalunya`) · קטלוניה

## The place

**A panorama of Catalunya from the Bunkers del Carmel viewpoint above Barcelona: the Eixample grid and the Sagrada Família, the port and the sea, Tibidabo and the Collserola hills, and the saw-tooth silhouette of Montserrat on the horizon.**

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.41920,2.16180 — face south-east for the city and sea, north-west for Collserola and Montserrat
- Street View at the bunkers is user-uploaded photospheres only (no car coverage), which `tools/streetview-ref.mjs` cannot fetch — open the link and screenshot by hand if the Commons photos are not enough.
- Reference photos (Wikimedia Commons, credits in [../refs/locations/CREDITS.md](../refs/locations/CREDITS.md)):
  - `docs/refs/locations/10-catalunya/ref-01.jpg`
  - `docs/refs/locations/10-catalunya/ref-02.jpg`
  (ref-01: aerial of Barcelona with the Collserola ridge and Montserrat's silhouette behind; ref-02: Tossa de Mar on the Costa Brava, an alternative if a coastal cove is preferred)

## What is actually there

From the hilltop: the whole city laid out in its grid, the Sagrada Família's spires standing above it, the Agbar tower,
the port and Mediterranean beyond, Montjuïc to the right; behind, the Collserola ridge with the Tibidabo church and the
Torre de Collserola, and far off the jagged grey-pink Montserrat massif. The viewpoint itself: old concrete gun
emplacements, dry grass, pines and agaves, a low stone wall.

## What the current plate shows (`public/game/levels/bg-10.webp`)

A coastal panorama from a terrace with the Sagrada Família and hills — the concept is right. Make it the real Bunkers
del Carmel view: the Eixample grid below, the sea, Tibidabo and Montserrat's silhouette, the concrete bunker terrace as
the lane.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop from the Bunkers del Carmel viewpoint above Barcelona, golden late afternoon: the whole city spread below in its street grid with the Sagrada Família's spires rising from it, the port and a blue Mediterranean beyond, Montjuïc hill at the right, the Collserola ridge with the Tibidabo church and communications tower at the left, and the jagged Montserrat massif faint on the far horizon; in the foreground pines, agaves and dry grass at the sides. The bottom third is the empty flat concrete terrace of the old bunkers with a low stone wall at its edge. No people, no text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 6 of 10
- **Attach:** `public/game/levels/bg-10.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/10-catalunya/ref-01.jpg`
  - `docs/refs/locations/10-catalunya/ref-02.jpg`
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-10.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 10 public/assets/generated/backdrops/level-10.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-10.webp` shows the place described above, the bottom third is a
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-10.webp` (for the
layout: "keep this composition, replace the place with the real one").
