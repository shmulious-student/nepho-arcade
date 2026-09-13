# Level 9 — CANDY FACTORY (`candy-factory`) · מפעל ממתקים

## The place

**Imaginary (owner, 2026-09-13): no real factory is referenced — invent one.** "Mamtakei Savta" (Grandma's Sweets): a
small old-school candy factory in an industrial zone — copper kettles and conveyor belts, playful but grounded.

- Street View: none — the place is made up. No reference photos; the description below is the reference.

## What is there (invented, keep it consistent)

One long production floor. Left to right: a **big copper boiling kettle** on a brick base with steam; a **taffy-pulling
machine** with red-and-white candy stretched between its arms; a long **conveyor belt** carrying rows of bright wrapped
candies (red, yellow, green, pink) past a **wrapping machine** and into a **cooling tunnel**; a **gumball tower** — a tall
glass cylinder full of coloured balls; **cartons stacked on wooden pallets** and sacks of sugar; **colour-coded pipes**
(pink, yellow, mint) running overhead under skylights; at the far right a **glass-walled control room** with a control
panel of round dials. The floor is **grey concrete with yellow-and-black safety stripes** along the machine bases and a
painted walkway. Bright, cheerful, no branded product.

## What the current plate shows (`public/game/levels/bg-09.webp`)

A pink-and-candy-striped fantasy factory with a giant gumball tube — fun, but it reads like a theme park. Keep the
gumball tower and the pink accents, make the rest a real factory floor: copper kettle, conveyor, wrapping machine,
pallets, safety stripes.

## Prompt

> Wide 2.82:1 painted pixel-art backdrop of a small old-fashioned candy factory production floor, bright daylight from skylights: a big copper boiling kettle on a brick base with steam at the left, a taffy-pulling machine stretching red-and-white candy, a long conveyor belt carrying rows of brightly wrapped candies past a wrapping machine into a cooling tunnel, a tall glass gumball tower full of coloured balls, cartons stacked on wooden pallets and sacks of sugar, pink, yellow and mint pipes running overhead, a glass-walled control room with round dials at the far right. The bottom third is an empty grey concrete floor with yellow-and-black safety stripes along the machine bases, in one flat plane. No people, no text or brand names. Saturated, crisp, no photo texture.

## Request card (for the agent)

- **Queue position:** 10 of 10
- **Attach:** `public/game/levels/bg-09.webp` (the current plate — keep its composition, replace the place) and
  - (no photos — the place is imaginary; the "What is there" section above is the reference)
- **Send:** the Prompt above, verbatim, then this line: "**Output 2816×1000 pixels, landscape, opaque, no text, no people; the bottom third is an empty flat ground plane.**"
- **Save as:** `public/assets/generated/backdrops/level-09.png`
- **Then:**
  ```bash
  node tools/place-backdrop.mjs 9 public/assets/generated/backdrops/level-09.png
  npm run build:assets && npm run test:assets
  ```
- **Accept when:** the built `public/game/levels/bg-09.webp` shows the place described above, the bottom third is a
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

Attach to the request: the reference photos listed above and the current plate `public/game/levels/bg-09.webp` (for the
layout: "keep this composition, replace the place with the real one").
