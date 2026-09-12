# Ferryman (`ferryman`) — boss, level 1, 6 files

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style), `public/assets/generated/bosses/boss-00-ferryman-grid.png` (identity), and the size reference **`public/assets/generated/actions/ferryman/idle.png` (the size reference — standing height is ≈600–650 px)**. Do Step A (the character sheet) first and attach it to every action request too.

## Character card

```
ID:            ferryman
RANK:          boss
NAME:          Ferryman
BUILD:         tall, lean, hooded — a head taller than the enemies, long arms
FACE:          face lost in the hood's shadow, two cyan eye-glows, a lantern-lit jaw
OUTFIT:        dark charcoal hooded coat with cyan light seams down the arms and hem, dark trousers, cyan-soled boots, a small lantern hanging at the belt
PALETTE:       coat #141B26, seams #75F5DC, hook #B8C4D6, lantern fog #37AAFF
PROPS:         a long chain with a heavy iron hook, carried in the right hand; a belt lantern that leaks cyan fog
FIGHTS WITH:   throwing and slashing with the hook chain, pulling victims in, and flooding the ground with lantern fog
EFFECT:        cyan light trails off the hook; pale cyan fog
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Ferryman —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/ferryman-sheet.png`.

## STYLE BLOCK (paste into every request)

> Pixel-art fighting-game character, in the exact render style, outline weight, proportions and
> lighting of the attached reference sheet (`hero-grid-quality-reference.png`): clean dark outlines,
> 3–4 tone cel shading, saturated colours, readable silhouette, chunky hands and feet, head about
> 1/5 of body height. Character exactly as in the attached character sheet — same face, hair,
> costume, colours and props. No text, labels, numbers, borders, grid lines, UI, watermark,
> background, floor, shadow, scenery or extra characters anywhere in the image.

## FRAME BLOCK (every action request)

> Pixel-art fighting-game character animation sheet: a **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent background (real
> alpha channel — not a painted checkerboard, not a matte colour, and no grid lines or cell borders
> drawn on the canvas)**. [STYLE BLOCK] The character faces RIGHT in every frame. **Identical
> bottom-centre anchor in all 9 cells: feet on the same baseline, body on the same vertical axis,
> the figure the exact same size (≈600–650 px standing height) as in the reference `idle.png`, filling about two thirds (60–70%) of the cell height. Never shrink the character down.** Generous empty margin inside each cell — hands, feet, hair, props and effects never
> touch or cross a cell boundary. No ground shadow or floor under the feet.** Each of the 9 frames
> is a distinct, fully drawn, solid pose — **no motion-blur frames, no semi-transparent ghost
> frames, no in-between smears** — and never a repeated frame. Action: **<ACTION>** — <the 9
> beats>.

## Step B — the 6 action files (`public/assets/generated/actions/ferryman/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a looming stance, chain swaying: 1 stance, 2 the hook swings, 3 lantern flickers, 4 shoulders roll, 5 hook swings back, 6 eye-glow brightens, 7 fog wisps from the lantern, 8 hook stills, 9 settles into frame 1. **Full standing height (≈600–650 px). Grounded on baseline.** |
| `approach.png` | **approach** — a slow, heavy stalk forward dragging the chain: a full 8-step stride plus a return frame, the hook scraping behind; frame 9 leads into frame 1. **Full standing height (≈600–650 px). Solid 100% opaque poses — no motion-blur smears or semi-transparent ghosting.** |
| `attack.png` | **attack** — HOOK SLASH: 1 stance, 2 the hook draws back over the shoulder, 3 the chain arcs, **4–5 the hook whips forward in a wide cyan-trailed arc at full reach**, 6 the hook bites, 7 yanks it back, 8 gathers the chain, 9 stance. Arc inside the cell. **Full standing height (≈600–650 px). Solid 100% opaque poses — no semi-transparent ghost frames.** |
| `special.png` | **special** — LANTERN FOG: 1 plants, 2 raises the lantern, 3 it flares cyan, **4–6 a spreading pool of pale cyan fog rolls out around his feet, wider each frame**, 7 the fog thickens, 8 he lowers the lantern, 9 stance. Fog inside the cell. **Full standing height (≈600–650 px). Solid 100% opaque poses — no ghosting on the character figure.** |
| `hurt.png` | **hurt** — **STARTS FULLY UPRIGHT ON FEET (FRAME 1)**: **1–3 flinch**: standing upright, feet planted on baseline, hood thrown back, eye-glow flaring; **4–6 heavy reel**: staggers back, chain flailing, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. **Full standing height (≈600–650 px when upright, matching `idle.png`). Never undersized, frame 1 must start standing upright on feet.** |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the hook slips from his grip, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (face down, hood over his head, chain across the floor, lantern out). Full length across the cell, same size as standing (≈600–650 px full length across the cell) — never shrunk, never faded away. |

## Accept

```bash
npm run verify:character -- ferryman
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
