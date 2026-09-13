# Level 3 — BARCELONA CITY (`barcelona`) · ברצלונה

## The place

**Carrer de la Marina at Carrer de Mallorca, looking at the Nativity façade of the Sagrada Família — with Passeig de Gràcia (Casa Batlló block) as the second reference for the street itself.**

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=41.40403,2.17452 — face west from Carrer de la Marina for the Nativity façade; Passeig de Gràcia is 41.3917,2.1649
- Street View frames rendered with `node tools/streetview-ref.mjs` (reference only):
  - `docs/refs/locations/03-barcelona/sv-01-sagrada-from-mallorca.jpg`
  - `docs/refs/locations/03-barcelona/sv-02-eixample-street.jpg`
  (pano `Rj4vT0_qG1lc2NHv7jJr4g` at Carrer de Mallorca 422, the corner below the Passion façade)
- Reference photos (Wikimedia Commons, credits in [../refs/locations/CREDITS.md](../refs/locations/CREDITS.md)):
  - `docs/refs/locations/03-barcelona/ref-01.jpg`
  - `docs/refs/locations/03-barcelona/ref-02.jpg`

## What is actually there

The Sagrada Família's Nativity façade: sand-coloured stone towers with the openwork spires, cranes still up, the pond and
palms of Plaça de Gaudí in front. Around it Eixample blocks: six-storey beige buildings with wrought-iron balconies and
chamfered corners, plane trees along the street, modernista lampposts by Pere Falqués with trencadís benches (Passeig de
Gràcia), hexagonal Gaudí pavement tiles, yellow-and-black taxis.

## What the current plate shows (`public/game/levels/bg-03.webp`)

Sagrada Família in the distance with a Park Güell trencadís bench and café — the idea is right. Bring the basilica closer
and make the street a real Eixample street: chamfered-corner buildings, plane trees, the Falqués lampposts, hexagonal tiles.

## Prompt

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of a Barcelona Eixample street in warm sun: centre, the Nativity façade of the Sagrada Família with its openwork sand-stone spires and a construction crane, palms and the pond of Plaça de Gaudí in front; on both sides six-storey beige modernista buildings with wrought-iron balconies and chamfered corners, plane trees, a modernista wrought-iron lamppost with a trencadís mosaic bench. The ground plane's far edge is a straight horizontal line 58% down from the top, marked by a granite kerb and a row of plane-tree trunks so the walkable band reads as its own strip, and everything below it is empty pavement of grey hexagonal Gaudí tiles. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 4 of 10
- **Attach:** `public/game/levels/bg-03.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/03-barcelona/ref-01.jpg`
  - `docs/refs/locations/03-barcelona/ref-02.jpg`
  - `docs/refs/locations/03-barcelona/sv-01-sagrada-from-mallorca.jpg`
  - `docs/refs/locations/03-barcelona/sv-02-eixample-street.jpg`
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/03-barcelona/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same street goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/03-barcelona/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/03-barcelona/gen-left.png docs/refs/locations/03-barcelona/gen-right.png docs/refs/locations/03-barcelona/gen-plate.png
  node tools/place-backdrop.mjs 3 docs/refs/locations/03-barcelona/gen-plate.png --floor=71%
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-03.webp` shows the place described above across its whole width with no
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-03.webp` (for the
layout: "keep this composition, replace the place with the real one").

## Log

- attempt count: 2 (gen-left ok; gen-right retried with bolded no-Sagrada-spires rule to prevent duplicate background spires). ACCEPTED.

