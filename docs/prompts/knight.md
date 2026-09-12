# Knight (`knight`) — enemy, 10 files

Full per-action set under [character-art-standard.md](../character-art-standard.md). The character
currently ships on its old 6-frame grid; this set replaces it completely. Deliver all 10 files in one
session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/enemies/enemy-04-cyan-knight-grid-1.png (identity)`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            knight
RANK:          enemy
NAME:          Knight
BUILD:         armoured soldier, tall, upright, medium-heavy
FACE:          full helm with a glowing blue visor slit — no face visible
OUTFIT:        dark-blue plate armour with lighter blue trim, a flowing blue cape, gauntlets and greaves
PALETTE:       plate #1D2E6E, trim #3C6BE0, cape #2350C8, blade #5CE6FF
PROPS:         a glowing blue energy sword in the right hand
FIGHTS WITH:   disciplined sword cuts, an overhead cleave, and a lunging thrust
EFFECT:        cyan-blue light arcs off the blade
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Knight —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/knight-sheet.png`.

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

## Step B — the 10 action files (`public/assets/generated/actions/knight/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a sword guard stance: 1 stance, blade low and forward, 2 cape drifts, 3 blade glow pulses, 4 shoulders square, 5 cape settles, 6 blade tip dips, 7 glow brightens, 8 blade tip lifts, 9 settles into frame 1. |
| `walk.png` | **walk** — a measured armoured march, blade held ready: full 8-step stride plus a return frame, cape swinging; frame 9 leads into frame 1. |
| `attack.png` | **attack** — a horizontal cut: 1 stance, 2 blade draws back, 3 shoulders turn, **4–5 the blade sweeps across with a blue arc of light**, 6 follow-through, 7–8 returns to guard, 9 stance. Arc inside the cell. |
| `heavy.png` | **heavy** — an overhead cleave: 1–3 the blade rises high over the head, glow building, 4 steps in, **5–6 the blade comes down in a long blue arc with an impact burst on the ground**, 7–9 recovers to guard. |
| `special.png` | **special** — LUNGING THRUST: 1 blade pulled back to the hip, 2 crouches, **3–5 a three-frame lunge forward, the blade extended, a cyan beam growing from the tip and ending in a tapered point inside the cell**, 6 impact, 7 pulls back, 8–9 guard. |
| `guard.png` | **guard** — blade held vertical in front of the visor, cape wrapped forward, feet planted; small flinches with blue sparks on frames 3, 5 and 7. |
| `hurt.png` | **hurt** — **1–3 flinch**: helm snaps back, cape flaring, still on the feet; **4–6 heavy reel**: staggers back, blade dropping low, still on the feet; **7–9 airborne crumple**: knocked off the feet, body curling in the air. |
| `knockback.png` | **knockback** — 1 stagger, 2 thrown off the feet, 3–5 airborne and tumbling, **6 lands hard, 7 flat on the floor** (the sword landing beside him), 8–9 either still flat or beginning to stir — never back on the feet. **There must be a frame lying flat.** |
| `getup.png` | **getup** — **frame 1 flat on the floor (the lowest frame)**, 2 head lifts, 3 pushes up onto the hands, 4 hands and knees, 5 one knee, 6 rising, 7 upright but hunched, 8 straightens, **9 standing at full height in the guard stance**. Rises monotonically — never dips. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the sword slips from his hand, 3 drops to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (on his back, blade lying beside him inside the cell). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Accept

```bash
npm run verify:character -- knight
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names.
