# Storm Colossus (`storm-colossus`) — boss, 6 files (only `idle.png` outstanding)

Full per-action set under [character-art-standard.md](../character-art-standard.md). This set is already delivered and accepted
except for `idle.png`, whose row pads with repeated frames — regenerate ONLY that file; every other
file stays as delivered and is the identity/size reference. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `the delivered public/assets/generated/actions/storm-colossus/attack.png (identity and size — match it exactly) · docs/refs/storm-colossus-seed.png`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            storm-colossus
RANK:          boss
NAME:          Storm Colossus
BUILD:         enormous armoured colossus, squat and massively wide, short legs, huge arms
FACE:          a horned teal helm with a glowing cyan visor slit — no face
OUTFIT:        teal-and-gold plate armour over every inch, a round glowing cyan core in the chest, storm-cloud patterns etched in the plates
PALETTE:       plate #1F6F7A, gold #E8B84A, core / lightning #5CE6FF / #9CF2FF, dark seams #0F2A30
PROPS:         a giant war hammer crackling with lightning, held in the right hand
FIGHTS WITH:   crushing hammer slams, a stomp that sends a ring of thunder out, lightning called down from above, and locking his armour
EFFECT:        cyan-white lightning and thunder rings
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Storm Colossus —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/storm-colossus-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/storm-colossus/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a heavy armoured guard loop, **nine distinct poses**: 1 stance, hammer resting on the shoulder, 2 chest plate rises with a breath, 3 shoulders roll, 4 the hammer head sparks, 5 lightning crawls up the haft, 6 the chest core pulses bright, 7 head turns a fraction, 8 core dims, 9 weight settles back leading into frame 1. Same height in every frame. **Real alpha channel, not a magenta matte. Never repeat a frame.** |
| `approach.png` | **approach** — a ground-shaking stomp forward, hammer on the shoulder: full 8-step stride plus a return frame, sparks off the hammer; frame 9 leads into frame 1. |
| `attack.png` | **attack** — HAMMER SLAM: 1 stance, 2–3 the hammer rises high over the head, lightning building, 4 he rises onto the toes, **5–6 the hammer crashes down with a cyan lightning burst on impact**, 7 sparks scatter, 8 lifts the hammer, 9 stance. Burst inside the cell. |
| `special.png` | **special** — LIGHTNING FALL: 1 plants, 2 raises the free hand to the sky, 3 the core blazes white, **4–6 three bolts of cyan lightning strike down in front of him, one more each frame, each with a ground burst**, 7 the last bolt fades, 8 the hand lowers, 9 stance. Bolts inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: helm snaps back, core flickering, still on the feet; **4–6 heavy reel**: staggers back, hammer dragging, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the hammer falls, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (on his back, core dark, hammer beside him inside the cell). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run verify:character -- storm-colossus
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
