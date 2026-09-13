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

> Wide 2.82:1 painted pixel-art backdrop of HaSarig Street in Rishon LeZion, Israel, bright morning: a quiet residential street paved in red-brown brick with red-and-white kerbs, lined on both sides by 6–8-storey white and cream apartment blocks with stacked balconies and light-blue glass balcony rails, entrance canopies, low red-brick garden walls with hedges, big old ficus trees and a couple of palms, cars parked nose-in along the far kerb, a small round turning circle at the end of the street. The bottom third is the empty brick-paved road in one flat plane. No people, no text, no cars in the lane. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 1 of 10
- **Attach:** `public/game/levels/bg-01.webp` (the current plate — keep its composition, replace the place) and
  - `docs/refs/locations/01-rishon/sv-01-down-the-street.jpg`
  - `docs/refs/locations/01-rishon/sv-02-block-entrances.jpg`
  - `docs/refs/locations/01-rishon/sv-03-towers-and-turning-circle.jpg`
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-01.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 1 public/assets/generated/backdrops/level-01.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-01.webp` shows the place described above, the bottom third is a
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-01.webp` (for the
layout: "keep this composition, replace the place with the real one").
