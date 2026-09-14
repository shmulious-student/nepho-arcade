# Level 11 — CAGA TIÓ'S LAIR (`tio-lair`) · המאורה של קאגה טיו

## The place

**Imaginary — the owner will provide the backdrop** (2026-09-14). The Catalan Christmas log's hideout after he
takes the presents from the candy factory: think a Catalan masia barn at Christmas — stone walls, a log fire, a heap of
stolen wrapped presents and turrón boxes, the *caga tió* blanket and stick, festive garlands.

- Until the plate arrives the build ships a copy of level 9 (theater) as a placeholder and warns about it
  (`tools/build-assets.mjs` EXTRA_LEVELS).

## Request card (for the agent)

- **Save as:** any size ≈ 4:1 or 2:1 (a Midjourney V8.2 `--ar 4:1 --hd` plate is ideal — see
  [midjourney-prompts.md](midjourney-prompts.md) for the style stem and parameter block).
- **Then:** `node tools/place-backdrop.mjs 11 <file> --floor=<measured %>` → `npm run build:assets && npm run test:assets`.
- The lane rule is the same as every level: the walkable band is rows 58–92%, marked by a natural built element
  (a flagstone edge, the hearth's stone kerb, a row of present boxes).

## Prompt (draft, for when the place is decided)

> A Catalan farmhouse barn at Christmas, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of
> the image is the walkable fighting lane: one continuous flat surface of worn flagstones running the full width, evenly
> lit by firelight, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a
> low stone hearth kerb, and everything else stays behind it. Behind: rough stone walls with festive garlands, a big log
> fire, mountains of gift-wrapped presents and turrón boxes stacked to the rafters, a red blanket and a wooden stick
> leaning by the hearth, hams and dried peppers hanging from beams, a small window with snow outside. Warm gold and red
> light. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level
> view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, watermark, frame, border, blur, photograph
