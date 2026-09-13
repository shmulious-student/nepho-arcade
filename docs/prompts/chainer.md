# Chainer (`chainer`) — enemy, 10 files

## Status — queue position 14 of 18 · 11 image requests (Step A sheet + 10 action files)

Legacy — no per-action set exists; the old 6-frame grid ships. Needs the character sheet (Step A) and all
10 files (`idle walk attack heavy special guard hurt knockback getup defeat`), one session, one look.

Done means `npm run verify:character -- chainer` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The character
currently ships on its old 6-frame grid; this set replaces it completely. Deliver all 10 files in one
session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/enemies/enemy-01-hood-chain-grid-1.png (identity)`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            chainer
RANK:          enemy
NAME:          Chainer
BUILD:         tall, lean, hunched in a hood
FACE:          face in shadow under the hood, glowing teal eye seams, dark skin, stubble
OUTFIT:        dark charcoal hoodie with teal light seams along the sleeves and hood, dark cargo trousers, teal-soled black sneakers
PALETTE:       hoodie #1C2230, seams #37E0D8, trousers #262B38, chain #B8C4D6
PROPS:         a heavy steel chain with a weighted end, held in the right hand, trailing on the ground
FIGHTS WITH:   whipping and swinging the chain at range, a spinning chain sweep
EFFECT:        teal light trails off the chain when it moves fast
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Chainer —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/chainer-sheet.png`.

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

## Step B — the 10 action files (`public/assets/generated/actions/chainer/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a low, ready crouch: 1 stance, chain hanging, 2 chain sways, 3 shoulders shift, 4 rolls the chain in the hand, 5 seams pulse brighter, 6 head turns, 7 chain sways back, 8 seams dim, 9 settles into frame 1. |
| `walk.png` | **walk** — a loping hunched advance dragging the chain: full 8-step stride plus a return frame, the chain snaking behind; frame 9 leads into frame 1. |
| `attack.png` | **attack** — a forward chain whip: 1 stance, 2 arm loads back, 3 the chain arcs overhead, **4–5 the weighted end snaps forward at full reach with a teal trail** (the chain inside the cell), 6 recoil, 7–8 gathers the chain, 9 stance. |
| `heavy.png` | **heavy** — an overhead chain slam: 1–3 the chain swings up and behind in a growing arc, 4 the body drives forward, **5–6 the weight smashes down with an impact burst**, 7–9 the chain drags back. |
| `special.png` | **special** — CHAIN SPIN: 1 plants, 2 starts the chain spinning at his side, 3–4 the spin widens into a full circle around him, **5–6 the fastest spin, a ring of teal light all around at chest height**, 7 slows, 8 catches the chain, 9 stance. The ring stays inside the cell. |
| `guard.png` | **guard** — crouched behind crossed forearms with the chain wrapped around them, feet planted; small flinches on frames 3, 5 and 7 as hits land. |
| `hurt.png` | **hurt** — **1–3 flinch**: hood flies back, head snaps, still on the feet; **4–6 heavy reel**: staggers back, chain flailing, still on the feet; **7–9 airborne crumple**: knocked off the feet, body curling in the air. |
| `knockback.png` | **knockback** — 1 stagger, 2 thrown off the feet, 3–5 airborne and tumbling, **6 lands hard, 7 flat on the floor** (chain sprawled beside him), 8–9 either still flat or beginning to stir — never back on the feet. **There must be a frame lying flat.** |
| `getup.png` | **getup** — **frame 1 flat on the floor (the lowest frame)**, 2 head lifts, 3 pushes up onto the hands, 4 hands and knees, 5 one knee, 6 rising, 7 upright but hunched, 8 straightens, **9 standing at full height in the guard stance**. Rises monotonically — never dips. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 drops the chain, 3 drops to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (hood over the face, chain across the floor). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Accept

```bash
npm run intake:character -- chainer        # container only: background → alpha, canvas → 2048²
npm run verify:character -- chainer
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names.
