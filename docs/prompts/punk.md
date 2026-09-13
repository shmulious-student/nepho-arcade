# Punk (`punk`) — enemy, 10 files

## Status — DELIVERED

Passes `npm run verify:character -- punk` (10/10 files) and is built in. Nothing outstanding; this file is
kept as the record of how the set was made and for any later single-file regeneration.

Full per-action set under [character-art-standard.md](../character-art-standard.md). This set replaced the old 6-frame grid. Deliver all 10 files in one
session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style), `public/assets/generated/enemies/enemy-00-red-punk-grid-1.png` (identity), and the size reference **`public/assets/generated/actions/punk/special.png` (the delivered flame look / size reference — standing height is ≈600 px)**. Do Step A (the character sheet) first and attach it to every action request too.

## Character card

```
ID:            punk
RANK:          enemy
NAME:          Punk
BUILD:         street thug, lean-athletic, tall
FACE:          tall spiked red hair, angry grin, light skin, thick brows
OUTFIT:        sleeveless dark-blue denim vest open over a bare chest, a chain at the hip, ripped blue jeans, red high-top sneakers, black fingerless gloves
PALETTE:       hair #E6323C, vest #2B4A8A, jeans #3B5FA8, sneakers #D8202A, flame #FF8A2A / #FFD34D
PROPS:         none — bare fists; the hip chain swings with him
FIGHTS WITH:   boxing — jabs, a big overhand haymaker, and a flaming lunge
EFFECT:        red-orange fire on the fists with yellow embers
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Punk —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/punk-sheet.png`.

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
> the figure the exact same size (≈600 px standing height) as in the delivered reference `special.png`, filling about two thirds (60–70%) of the cell height. Never shrink the character down to ~60% (~370 px). Generous empty margin inside each cell — hands, feet, hair, props and effects never
> touch or cross a cell boundary. No ground shadow or floor under the feet.** Each of the 9 frames
> is a distinct, fully drawn, solid pose — **no motion-blur frames, no semi-transparent ghost
> frames, no in-between smears** — and never a repeated frame. Action: **<ACTION>** — <the 9
> beats>.

## Step B — the 10 action files (`public/assets/generated/actions/punk/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a cocky boxer's bounce: 1 guard, 2 weight left, 3 shoulders roll, 4 fists tap together, 5 weight right, 6 chin lifts, 7 hip chain swings, 8 fists back up, 9 settles into frame 1. **Full standing height (≈600 px, matching `special.png`). Grounded on baseline.** |
| `walk.png` | **walk** — a swaggering advance, fists up: a full 8-step stride plus a return frame, chain swinging in time; frame 9 leads back into frame 1. **Full standing height (≈600 px, matching `special.png`). Every frame is a solid 100% opaque pose — no motion-blur smears or semi-transparent ghosting on steps 2/4/6/8.** |
| `attack.png` | **attack** — a quick jab: 1 guard, 2 shoulder loads, 3 fist snaps forward, **4–5 full extension with a small impact spark**, 6 pull back, 7–8 reset, 9 guard. **Full standing height (≈600 px, matching `special.png`). Every frame is a solid 100% opaque pose — no semi-transparent ghosting or motion blur.** |
| `heavy.png` | **heavy** — an overhand haymaker: 1–3 a long wind-up with the fist drawn behind the head, 4 steps in, **5–6 the fist crashes down and through with a big impact burst**, 7–9 a slow recovery. **Full standing height (≈600 px, matching `special.png`). Solid 100% opaque poses (no ghost smears). Red sneakers remain firmly attached to feet/legs in all frames — never severed or floating above the figure.** |
| `special.png` | **special** — FLAMING FISTS: 1 crouches and clenches, 2–3 both fists ignite in red-orange fire, 4 lunges, **5 a flaming haymaker leaving a flame streak**, 6 impact burst, 7 follow-through with embers, 8 shakes the fire out, 9 guard. Fire inside the cell. (Delivered & accepted size reference file). |
| `guard.png` | **guard** — **GROUNDED STANDING GUARD (NEVER AIRBORNE, NEVER TUMBLING)**: braced high guard standing on feet, both fists in front of the face, elbows tucked, feet planted on the baseline; small flinches on frames 3, 5 and 7 as hits land with white sparks. Frame 9 remains fully upright on feet at 100% height — never lying down. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, vest flaring, still on the feet; **4–6 heavy reel**: staggers back on his heels, arms flailing, still on the feet; **7–9 airborne crumple**: knocked off the feet, body curling in the air. |
| `knockback.png` | **knockback** — 1 stagger, 2 thrown off the feet, 3–5 airborne and tumbling, **6 lands hard, 7 flat on the floor** (on his back, sneakers up), 8–9 either still flat or beginning to stir — never back on the feet. **There must be a frame lying flat.** |
| `getup.png` | **getup** — **frame 1 flat on the floor (the lowest frame)**, 2 head lifts, 3 pushes up onto the hands, 4 hands and knees, 5 one knee, 6 rising, 7 upright but hunched, 8 straightens, **9 standing at full height in the guard stance**. Rises monotonically — never dips. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches his chest, 3 drops to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (face down, one arm out). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Accept

```bash
npm run intake:character -- punk        # container only: background → alpha, canvas → 2048²
npm run verify:character -- punk
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names.
