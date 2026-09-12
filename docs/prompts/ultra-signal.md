# Ultra Signal (`ultra-signal`) — boss, level 10, 6 files

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-09-ultra-signal-grid.png (identity) · public/game/portraits/ultra-signal.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            ultra-signal
RANK:          boss
NAME:          Ultra Signal
BUILD:         tall, imperious queen, upright, long-limbed
FACE:          hair in every colour of the spectrum flowing to the waist, a prismatic crown, pale skin, glowing white eyes
OUTFIT:        a white-and-gold gown with a high collar, a layered nine-colour aura that fans out behind her like wings
PALETTE:       gown #F3F4E8, gold #FFCF5C, aura rainbow #FF4F72 #FF9357 #FFCF5C #A4EE42 #75F5DC #37AAFF #BD8CFF #FF76C8 #EDF6FF
PROPS:         none — her hands and the aura
FIGHTS WITH:   a sweeping wave of rainbow light, pillars of rainbow light from the ground
EFFECT:        banded rainbow light, always in spectrum order
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Ultra Signal —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/ultra-signal-sheet.png`.

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
> the figure the same size as in every other file of this character, filling about two thirds of the
> cell height. Generous empty margin inside each cell — hands, feet, hair, props and effects never
> touch or cross a cell boundary. No ground shadow or floor under the feet.** Each of the 9 frames
> is a distinct, fully drawn, solid pose — **no motion-blur frames, no semi-transparent ghost
> frames, no in-between smears** — and never a repeated frame. Action: **<ACTION>** — <the 9
> beats>.

## Step B — the 6 action files (`public/assets/generated/actions/ultra-signal/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a radiant standing pose: 1 stance, 2 the aura fans wider, 3 hair drifts, 4 a hand rises, 5 the aura's colours cycle, 6 crown glints, 7 hand lowers, 8 aura narrows, 9 settles into frame 1. Aura inside the cell. |
| `approach.png` | **approach** — a slow floating advance: full 8-step stride plus a return frame, aura streaming behind, hair flowing; frame 9 leads into frame 1. |
| `attack.png` | **attack** — SIGNAL SWEEP: 1 stance, 2 the right hand draws across the body, 3 rainbow light gathers in the palm, **4–5 a wide sweeping wave of banded rainbow light arcs out from her hand across the front of the cell**, 6 the wave peaks, 7 it fades, 8 hand lowers, 9 stance. |
| `special.png` | **special** — RAINBOW PILLAR: 1 plants, 2 both hands rise, 3 the aura blazes, **4–6 three pillars of banded rainbow light erupt from the ground in front of her, one more each frame**, 7 they peak, 8 they fade, 9 stance. Pillars inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: crown flashes, head snaps back, still on the feet; **4–6 heavy reel**: staggers back, aura flickering, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the crown slips, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (on her side, hair fanned in a rainbow across the floor, aura out). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run verify:character -- ultra-signal
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
