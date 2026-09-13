# Level 6 — CAPOEIRA BRAZILIAN GYM (`capoeira-gym`) · חדר קפוארה ואומנויות לחימה

## The place

**Imaginary (owner, 2026-09-13): no real gym is referenced — invent one.** "Academia Ginga Petah Tikva": Omri's capoeira
group, a converted ground-floor workshop off a side street in Petah Tikva, painted up by the group itself.

- Street View: none — the place is made up. No reference photos; the description below is the reference.

## What is there (invented, keep it consistent)

A long hall with a **pale sprung-wood floor** and a **low stage at the far end** where the bateria sits. Back wall: a huge
hand-painted mural in **Brazilian green, yellow and blue** — a roda of silhouetted players, a crescent moon, the group's
name in curly lettering — with three **berimbaus, an atabaque and two pandeiros** hung on hooks beside it. Left wall:
**floor-to-ceiling mirrors** with a ballet bar. Right wall: high frosted windows with the afternoon sun coming through,
a **rack of coloured cords** (the belts), a wall of framed batizado photos, a Brazilian flag and an Israeli flag side by
side. Near the entrance a bench with water bottles and gym bags, a big fan, a stack of blue mats, a whiteboard with the
week's roda times. Warm wood tones against the flag colours.

## What the current plate shows (`public/game/levels/bg-06.webp`)

A wooden-floor hall with a capoeira mural, drums and a Brazilian flag — already this idea. Redo it with the layout above
(stage at the far end, mirror wall left, windows and cord rack right) so the whole width of the level reads as one room.

## Prompt

> Wide 21:9 painted pixel-art backdrop (the left part of a longer scene that continues to the right) of the inside of a capoeira academy hall, warm afternoon light through high frosted windows on the right: a long back wall with a huge hand-painted mural in Brazilian green, yellow and blue of silhouetted capoeira players in a roda under a crescent moon, three berimbaus, an atabaque drum and two pandeiros hung on hooks beside it, a low wooden stage at the far end with drums on it; a floor-to-ceiling mirror wall with a ballet bar on the left; on the right a rack of coloured cords, framed photos, a Brazilian flag and an Israeli flag, a bench with water bottles, a stack of blue mats and a standing fan. The bottom third is an empty pale sprung wooden floor in one flat plane. No people, no legible text. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 7 of 10
- **Attach:** `public/game/levels/bg-06.webp` (the current plate — keep its composition, replace the place) and
  - (no photos — the place is imaginary; the "What is there" section above is the reference)
- **Request 1 (left):** the Prompt above, verbatim, then: "**Output 21:9 landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**" Save as `docs/refs/locations/06-capoeira-gym/gen-left.png`.
- **Request 2 (right), same session, request-1 image attached:** "**Continue this exact scene to the right as a 21:9 image: the left third of the new image repeats the right third of the attached image exactly, then the same place goes on to the right with new details in the same style, light and horizon. No text, no people, the bottom third stays an empty flat ground plane.**" Save as `docs/refs/locations/06-capoeira-gym/gen-right.png`.
- **Then:**
  ```bash
  node tools/stitch-backdrop.mjs docs/refs/locations/06-capoeira-gym/gen-left.png docs/refs/locations/06-capoeira-gym/gen-right.png docs/refs/locations/06-capoeira-gym/gen-plate.png
  node tools/place-backdrop.mjs 6 docs/refs/locations/06-capoeira-gym/gen-plate.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-06.webp` shows the place described above across its whole width with no
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-06.webp` (for the
layout: "keep this composition, replace the place with the real one").
