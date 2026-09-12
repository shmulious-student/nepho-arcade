# Abyss Dragon (`abyss-dragon`) — boss, 6 files (only `idle.png` outstanding)

Full per-action set under [character-art-standard.md](../character-art-standard.md). This set is already delivered and accepted
except for `idle.png`, whose row pads with repeated frames — regenerate ONLY that file; every other
file stays as delivered and is the identity/size reference. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `the delivered public/assets/generated/actions/abyss-dragon/attack.png (identity and size — match it exactly) · docs/refs/abyss-dragon-seed.png`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            abyss-dragon
RANK:          boss
NAME:          Abyss Dragon
BUILD:         tall, slender dragon-sorceress, long-limbed, a great feathered wing-cape
FACE:          pale violet skin, glowing white eyes, two curved dark horns, long dark-violet hair
OUTFIT:        black-and-violet scaled bodysuit with gold filigree, clawed gauntlets and greaves, a huge cape of dark-blue-to-violet feathers spread like wings
PALETTE:       scales #1E1636, violet #6B2BD8, feathers #3A2A8A / #8A5CFF, gold #E8B84A, void flame #C08CFF / #FFFFFF
PROPS:         none — a ball of violet void-flame burns in her raised hand
FIGHTS WITH:   hurled void bolts, orbs that orbit her, a wing-borne blink, and a breath of void-fire
EFFECT:        violet-white void flame with dark sparks
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Abyss Dragon —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/abyss-dragon-sheet.png`.

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
> is a distinct pose; never repeat a frame. Action: **<ACTION>** — <the 9 beats>.

## Step B — the 6 action files (`public/assets/generated/actions/abyss-dragon/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a slow hovering menace loop, **nine distinct poses**: 1 wings half-spread, 2 wings lift, 3 wings at the top of the beat, 4 wings sweep down, 5 wings low, tail curls, 6 head turns slightly toward the viewer, 7 the void-flame in the raised hand flares, 8 the flame settles, 9 wings back to half-spread leading into frame 1. Same height in every frame. **Never repeat a frame.** |
| `approach.png` | **approach** — a gliding advance an inch off the ground, wings beating slowly: full 8-beat glide cycle plus a return frame, feathers trailing; frame 9 leads into frame 1. |
| `attack.png` | **attack** — VOID BOLT: 1 stance, 2 the flame hand draws back, 3 the void-flame swells, **4–5 she hurls it forward as a streaking violet bolt with a dark spark trail** (the bolt inside the cell), 6 follow-through, 7 the trail fades, 8 hand lowers, 9 stance. |
| `special.png` | **special** — ABYSS BREATH: 1 plants, 2 wings spread wide, 3 the horns and eyes flare white, **4–6 she breathes a stream of violet-white void-fire straight ahead, ending in a tapered point inside the cell**, 7 the stream breaks into sparks, 8 wings fold, 9 stance. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, wings flaring open, still on the feet; **4–6 heavy reel**: staggers back, feathers scattering, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the void-flame gutters out, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (on her side, wings collapsed around her, feathers settling). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run verify:character -- abyss-dragon
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
