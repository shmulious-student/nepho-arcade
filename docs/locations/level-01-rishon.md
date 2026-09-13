# Level 1 — RISHON LEZION (`rishon`) · ראשון לציון

## The place

**HaSarig Street 31 (השריג 31), Kiryat Krinitzi / Kiryat Karmim, Rishon LeZion** — the family's street (owner, 2026-09-13).

- Street View: https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=31.9719046,34.7769897 — the nearest pano is at
  no. 25 (`djKZv-bN-yleA3b8uMcj5g`); yaw 5° looks down the street, 95° at the block entrances, 275° at the towers by the
  turning circle.
- Reference frames rendered from that pano with `node tools/streetview-ref.mjs` (Google Street View, reference only):
  - `docs/refs/locations/01-rishon/sv-01-down-the-street.jpg`
  - `docs/refs/locations/01-rishon/sv-02-block-entrances.jpg`
  - `docs/refs/locations/01-rishon/sv-03-towers-and-turning-circle.jpg`

## What is actually there

A quiet residential cul-de-sac paved in **red-brown interlocking brick**, with red-and-white painted kerbs and a small
roundabout / turning circle at the end. Both sides: 6–9-storey white and cream apartment blocks with rows of balconies
(some with light-blue glass rails, some with white bars), entrance canopies with blue-and-white signs, low red-brick
boundary walls with hedges and shrubs, tall old ficus and eucalyptus trees, a couple of palms, cars parked nose-in along
the kerb. Overcast-bright coastal light in the panos; paint it sunny.

## What the current plate shows (`public/game/levels/bg-01.webp`)

A generic modern plaza — fountain, palms, a sculpture, glass towers behind. Nothing of the real street. Replace it entirely.

## Prompt

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of HaSarig Street in Rishon LeZion, Israel, bright morning: a quiet residential street paved in red-brown brick with red-and-white kerbs, lined on both sides by 6–8-storey white and cream apartment blocks with stacked balconies and light-blue glass balcony rails, entrance canopies, low red-brick garden walls with hedges, big old ficus trees and a couple of palms, cars parked nose-in along the far kerb, a small round turning circle at the end of the street. The bottom third is the empty brick-paved road in one flat plane. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 1 of 10
- **Attach:** `public/game/levels/bg-01.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/01-rishon/sv-01-down-the-street.jpg`
  - `docs/refs/locations/01-rishon/sv-02-block-entrances.jpg`
  - `docs/refs/locations/01-rishon/sv-03-towers-and-turning-circle.jpg`
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/01-rishon/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same street goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/01-rishon/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/01-rishon/gen-left.png docs/refs/locations/01-rishon/gen-right.png docs/refs/locations/01-rishon/gen-plate.png
  node tools/place-backdrop.mjs 1 docs/refs/locations/01-rishon/gen-plate.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-01.webp` shows the place described above across its whole width with no
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-01.webp` (for the
layout: "keep this composition, replace the place with the real one").
