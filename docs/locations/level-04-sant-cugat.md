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

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of Plaça d'Octavià in Sant Cugat del Vallès, Catalonia, bright morning: centre-right the Romanesque-Gothic monastery façade in sand-coloured stone with a large rose window, a sculpted pointed-arch portal, battlements and a square bell tower, tall cypresses along its wall; left, pastel two- and three-storey town houses with iron balconies, a café terrace with umbrellas and plane trees, a small stone fountain. The ground plane's far edge is a straight horizontal line 58% down from the top, marked by a low sand-stone wall with cypresses behind it so the walkable band reads as its own strip, and everything below it is empty light-granite paving. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 5 of 10
- **Attach:** `public/game/levels/bg-04.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/04-sant-cugat/ref-01.jpg`
  - `docs/refs/locations/04-sant-cugat/ref-02.jpg`
  - `docs/refs/locations/04-sant-cugat/sv-01-monastery.jpg`
  - `docs/refs/locations/04-sant-cugat/sv-02-square.jpg`
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/04-sant-cugat/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same street goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/04-sant-cugat/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/04-sant-cugat/gen-left.png docs/refs/locations/04-sant-cugat/gen-right.png docs/refs/locations/04-sant-cugat/gen-plate.png
  node tools/place-backdrop.mjs 4 docs/refs/locations/04-sant-cugat/gen-plate.png --floor=<measured %, e.g. 66%>
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-04.webp` shows the place described above across its whole width with no
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-04.webp` (for the
layout: "keep this composition, replace the place with the real one").
