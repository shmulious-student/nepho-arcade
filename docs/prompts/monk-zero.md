# Monk Zero (`monk-zero`) — boss, level 4, 6 files

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-03-monk-zero-grid.png (identity) · public/game/portraits/monk-zero.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            monk-zero
RANK:          boss
NAME:          Monk Zero
BUILD:         tall, slender woman, long-limbed, poised
FACE:          long straight black hair to the waist, sharp calm eyes, pale skin, violet lips
OUTFIT:        a black high-slit dress with gold trim and a violet sash, gold gauntlets and shin guards, bare feet
PALETTE:       dress #121018, gold #E8B84A, sash #8A46D8, orb light #BD8CFF, beam #FF76C8
PROPS:         none — palms, feet, and floating violet orbs
FIGHTS WITH:   blink-fast palm strikes, orbiting void orbs, a void beam from the palms
EFFECT:        violet-pink light; small orbs that orbit her
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Monk Zero —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/monk-zero-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/monk-zero/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a still, centred stance: 1 stance, palms open, 2 hair drifts, 3 a small violet orb blinks in, 4 orb circles, 5 sash sways, 6 orb blinks out, 7 hands turn over, 8 hair settles, 9 settles into frame 1. |
| `approach.png` | **approach** — a gliding, silent advance: full 8-step stride plus a return frame, hair and sash trailing, feet barely lifting; frame 9 leads into frame 1. |
| `attack.png` | **attack** — BLINK STRIKE: 1 stance, **2 she blurs into a violet afterimage**, 3 reappears low, 4 palm chambers, **5–6 a driving double-palm strike with a violet shock burst**, 7 follow-through, 8 pulls back, 9 stance. |
| `special.png` | **special** — VOID BEAM: 1 hands draw to the chest, 2 violet light gathers between the palms, 3 the light swells, **4–6 both palms thrust forward and a pink-violet beam fires straight ahead, ending in a tapered point inside the cell**, 7 the beam fades, 8 hands lower, 9 stance. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, hair flying, still on the feet; **4–6 heavy reel**: staggers back, sash whipping, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 sinks, hands to the chest, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (on her side, hair fanned across the floor). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run verify:character -- monk-zero
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
