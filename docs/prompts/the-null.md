# The Null (`the-null`) — boss, level 8, 6 files

## Status — queue position 3 of 10 · 7 image requests (Step A sheet + 6 action files)

Legacy — no per-action set exists; the old 6×8 grid ships. Needs the character sheet (Step A) and all 6
files (`idle approach attack special hurt defeat`), one session, one look. Level 8 boss.

Done means `npm run verify:character -- the-null` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-07-the-null-grid.png (identity) · public/game/portraits/the-null.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            the-null
RANK:          boss
NAME:          The Null
BUILD:         tall, gaunt, humanoid — a figure made of black glitch-static, edges crawling
FACE:          no face: a blank static void with two white glitch-slits for eyes
OUTFIT:        a ragged black coat that frays into static at every edge, white glitch outlines
PALETTE:       body #050711, static #EDF6FF, inverted flash #14243D, blade #FFFFFF
PROPS:         a jagged white glitch blade in the right hand
FIGHTS WITH:   expanding void rings, a wide null arc with the blade, and an inverting phase that turns him negative
EFFECT:        white static, inverted (negative) flashes — but the figure must stay readable in every frame; never dissolve away
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: The Null —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/the-null-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/the-null/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a hovering static stance: 1 stance, 2 edges crawl, 3 blade flickers, 4 head tilts, 5 static ripples up the coat, 6 eye-slits widen, 7 blade steadies, 8 edges calm, 9 settles into frame 1. The silhouette stays whole throughout. |
| `approach.png` | **approach** — a gliding, juddering advance: full 8-step stride plus a return frame, static tearing off behind him; frame 9 leads into frame 1. |
| `attack.png` | **attack** — NULL ARC: 1 stance, 2 the blade draws back, 3 static gathers on it, **4–5 a huge horizontal arc of white glitch-light sweeps across in front of him**, 6 follow-through, 7 the arc breaks into static, 8 returns to guard, 9 stance. Arc inside the cell. |
| `special.png` | **special** — INVERT PHASE: 1 plants, 2 arms spread, 3 the static goes still, **4–6 he inverts — body turning white, outlines turning black, a negative flash pulsing outward each frame**, 7 the inversion holds, 8 it snaps back to black, 9 stance. Figure whole in every frame. |
| `hurt.png` | **hurt** — **1–3 flinch**: static bursts from the head, body snaps back, still on the feet; **4–6 heavy reel**: staggers back, coat tearing into static, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the blade dissolves, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his back, still a whole figure, static settling). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run intake:character -- the-null        # container only: background → alpha, canvas → 2048²
npm run verify:character -- the-null
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
