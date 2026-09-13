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

> Wide 2.82:1 painted pixel-art backdrop of a Barcelona Eixample street in warm sun: centre, the Nativity façade of the Sagrada Família with its openwork sand-stone spires and a construction crane, palms and the pond of Plaça de Gaudí in front; on both sides six-storey beige modernista buildings with wrought-iron balconies and chamfered corners, plane trees, a modernista wrought-iron lamppost with a trencadís mosaic bench. The bottom third is empty pavement of grey hexagonal Gaudí tiles. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-03.webp` (for the
layout: "keep this composition, replace the place with the real one").
