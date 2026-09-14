# Level 11 — CAGA TIÓ'S LAIR (`tio-lair`) · המאורה של קאגה טיו

## The place

**Imaginary — plate delivered by the owner 2026-09-14** (`docs/backdrops_midjourney/cagatio.png`, Midjourney V8.2 from the prompt below). The Catalan Christmas log's hideout after he
takes the presents from the candy factory: think a Catalan masia barn at Christmas — stone walls, a log fire, a heap of
stolen wrapped presents and turrón boxes, the *caga tió* blanket and stick, festive garlands.


## Request card (for the agent)

- **Save as:** any size ≈ 4:1 or 2:1 (a Midjourney V8.2 `--ar 4:1 --hd` plate is ideal — see
  [midjourney-prompts.md](midjourney-prompts.md) for the style stem and parameter block).
- **Then:** `node tools/place-backdrop.mjs 11 <file> --floor=<measured %>` → `npm run build:assets && npm run test:assets`.
- The lane rule is the same as every level: the walkable band is rows 58–92%, marked by a natural built element
  (a flagstone edge, the hearth's stone kerb, a row of present boxes).

## The gauntlet

Level 11's waves are the campaign's bosses, in order, fielded as wave enemies (smaller, weaker copies fought with their
own patterns — `World.spawnWaveBoss`): Ferryman + Monk Zero · Kilnheart + Market King + Prism Queen · Railmaw + Crown
Runner + The Null · Vault Mother + Ultra Signal — then Caga Tió himself. A boss the roster disables drops out of the
gauntlet and the level's enemy pool fills its slot.

## Prompt (final, 2026-09-14)

Paste as one line. Add `--sref <level-1 plate url> --sw 80` to match the other ten plates.

> A Catalan farmhouse barn at Christmas, Caga Tió's hideout, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of worn grey flagstones running the full width, evenly lit by firelight, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a low stone hearth kerb, and everything else stays behind that kerb. Behind the kerb: rough golden stone walls hung with festive garlands and red ribbons, a big log fire in a wide stone fireplace at the centre, mountains of gift-wrapped presents and turrón boxes stacked to the wooden rafters on both sides, a red blanket and a wooden stick leaning by the hearth, cured hams and dried red peppers hanging from the beams, a small window at the far left with snow and a dark blue night outside, a wooden ladder and sacks at the far right. Warm gold and red firelight, cool blue from the window. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, faces, log with a face, watermark, frame, border, blur, photograph

## Prompt (earlier draft)

> A Catalan farmhouse barn at Christmas, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of
> the image is the walkable fighting lane: one continuous flat surface of worn flagstones running the full width, evenly
> lit by firelight, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a
> low stone hearth kerb, and everything else stays behind it. Behind: rough stone walls with festive garlands, a big log
> fire, mountains of gift-wrapped presents and turrón boxes stacked to the rafters, a red blanket and a wooden stick
> leaning by the hearth, hams and dried peppers hanging from beams, a small window with snow outside. Warm gold and red
> light. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level
> view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, watermark, frame, border, blur, photograph

## Log

- 2026-09-14 20:38 — Midjourney V8.2 plate `docs/backdrops_midjourney/cagatio.png` (3616×1344, ≈2.7:1) accepted: the hearth kerb at 62% → `place-backdrop 11 … --floor=62%` cuts an exact 4:1 window at full width (23% sky and 10% floor dropped) with the kerb at 58% of the lane window. Replaces the theatre placeholder.
