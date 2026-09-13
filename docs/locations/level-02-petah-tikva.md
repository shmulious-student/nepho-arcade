# Level 2 — REFAEL EITAN STREET (`petah-tikva`) · רחוב רפאל איתן · פתח תקווה

## The place

**Refael Eitan Street, Em HaMoshavot HaHadasha neighbourhood (אם המושבות החדשה), Petah Tikva — postcode 4922366; no. 3 has the Meuhedet clinic at street level.**

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=32.10349,34.88255 — stand on the street and pan to the side the family's building is on
- Street View frames rendered with `node tools/streetview-ref.mjs` (reference only):
  - `docs/refs/locations/02-petah-tikva/sv-01-down-the-street.jpg`
  - `docs/refs/locations/02-petah-tikva/sv-02-other-way.jpg`
  - `docs/refs/locations/02-petah-tikva/sv-03-tower-entrance.jpg`
  (panos `tV5LyR5CpqaoLy8tfuDmPA` at no. 2–10 and `lRrWPoWKUnJUw18bse3smg`; the owner confirmed this is the right street — 2019 imagery, the towers are cream stone with glass balconies, the street is a two-lane road with nose-in parking and young trees)
- Reference photos (Wikimedia Commons, credits in [../refs/locations/CREDITS.md](../refs/locations/CREDITS.md)):
  - `docs/refs/locations/02-petah-tikva/ref-01.jpg`
  - `docs/refs/locations/02-petah-tikva/ref-02.jpg`
  - `docs/refs/locations/02-petah-tikva/ref-03.jpg`
  (ref-03 is the tower skyline of the new neighbourhood — the look to paint; ref-01/02 are roundabouts in the older part of Em HaMoshavot, for the trees, paving and light only)

## What is actually there

A 2010s neighbourhood: rows of 15–25-storey white and cream residential towers with glass balconies and rooftop
pergolas, spaced on wide streets with a planted median; young ficus and palm trees, a bike lane and wide pavements, clinic
and shop frontages at ground level, green fences around a small park and playground, the Yarkon park's tree line on the
horizon. Cars parked along the kerb; bright hazy coastal-plain sky.

## What the current plate shows (`public/game/levels/bg-02.webp`)

Already a modern city road with towers and a jacaranda — the closest of the ten. Make the towers the real Em HaMoshavot
towers (white, tall, balcony-stacked), put the clinic/shop frontage at street level and the median with young trees.

## Prompt

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of Refael Eitan Street in the Em HaMoshavot neighbourhood of Petah Tikva, Israel, bright afternoon. Behind a wide pavement with young ficus and palm trees, a row of tall white and cream residential towers with stacked glass balconies and rooftop pergolas, a ground-floor clinic and small shops with awnings, a planted median with a bike lane, a green playground fence at the far right. Hazy bright sky. The bottom third is an empty pavement / road in one flat plane. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 2 of 10
- **Attach:** `public/game/levels/bg-02.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/02-petah-tikva/ref-01.jpg`
  - `docs/refs/locations/02-petah-tikva/ref-02.jpg`
  - `docs/refs/locations/02-petah-tikva/ref-03.jpg`
  - `docs/refs/locations/02-petah-tikva/sv-01-down-the-street.jpg`
  - `docs/refs/locations/02-petah-tikva/sv-02-other-way.jpg`
  - `docs/refs/locations/02-petah-tikva/sv-03-tower-entrance.jpg`
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/02-petah-tikva/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same street goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/02-petah-tikva/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/02-petah-tikva/gen-left.png docs/refs/locations/02-petah-tikva/gen-right.png docs/refs/locations/02-petah-tikva/gen-plate.png
  node tools/place-backdrop.mjs 2 docs/refs/locations/02-petah-tikva/gen-plate.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-02.webp` shows the place described above across its whole width with no
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-02.webp` (for the
layout: "keep this composition, replace the place with the real one").
