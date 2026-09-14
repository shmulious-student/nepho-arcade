# Caga Tió (`caga-tio`) — final boss, level 11, 6 files

## Status — 7 image requests

Needs a character sheet plus `idle`, `approach`, `attack`, `special`, `hurt`, and `defeat`. Claude owns every gate and visual verification.

## Character card

```
ID:            caga-tio
RANK:          boss
NAME:          Caga Tió
BUILD:         short, stocky Catalan figurine villain; broad head, large expressive eyes, wide toothy grin
FACE:          warm peach skin, rosy cheeks, prominent rounded nose, thick dark brows, black hair
OUTFIT:        worn red beret, cream rolled-sleeve shirt, charcoal vest, brown trousers, dark brown boots
PALETTE:       beret #A52A2A, shirt #F0DEC5, vest #4A4742, trousers #5E4032, boots #34251F
PROPS:         wicker basket and small wrapped surprise parcels
FIGHTS WITH:   the Tió de Nadal tradition — he squats, strains with a comic effort face and 'poops' wrapped presents and turrón (nougat bars) out behind him; a log-roll charge; a basket swing
EFFECT:        warm red-and-gold festive sparks, gold confetti, a comic strain puff — every 'poop' is a wrapped present or a turrón bar, never anything else
```

Use the supplied photos as identity references only: capture the red beret, delighted oversized grin, squat figurine proportions, vest, cream shirt, brown trousers, and boots. The joke is the Catalan Tió de Nadal: he squats and strains and PRESENTS come out. Keep it a kids' cartoon: trousers stay on, nothing is exposed, and what comes out is always a gift-wrapped present or a turrón bar with gold sparks — never waste, never anything brown or smeared.

## Step A — character sheet

Create a 2048×1024 pixel-art fighting-game character sheet with true transparent background. Match `public/assets/references/hero-grid-quality-reference.png`: clean dark outlines, 3–4 tone cel shading, saturated colours, readable silhouette and chunky hands and feet. Show left to right: full-body front view, three-quarter view facing right, side view facing right, a large head close-up, and palette swatches. No text, labels, grid lines, border, UI, watermark, floor, shadow, scenery, or extra characters. Save as `docs/refs/caga-tio-sheet.png`.

## Step B — actions

Every action is a 2048×2048 true-alpha PNG with a 3×3 grid of nine frames. Caga Tio faces RIGHT. All cells have the same bottom-centre anchor, scale, baseline, and generous clear margin. No grid lines, floor, shadow, scenery, text, UI, watermark, motion blur, transparent ghosts, smears, or repeated frames.

| file | Nine beats |
|---|---|
| `idle.png` | 1 stance, 2 beret bob, 3 grin widens, 4 rubs his belly, 5 a little strain-wince with rosy cheeks, 6 grin returns, 7 basket lifts with a sparkle, 8 boots settle, 9 returns to stance. |
| `approach.png` | Eight purposeful waddling stomps toward the player, basket swinging and beret bouncing, belly leading; frame 9 returns to frame 1. |
| `attack.png` | PRESENT DROP: 1 stance, 2 turns his back three-quarters to the player, 3 squats down, 4–5 strains with a comic effort face (eyes squeezed, cheeks red, a small puff), 6 a gift-wrapped present with a bow pops out from under him with gold sparks and shoots off behind him (fully inside the cell), 7 he stands with a relieved grin, 8 turns back to face right, 9 stance. |
| `special.png` | TURRÓN BARRAGE: 1 plants his feet, 2 squats, 3 huge strain — cheeks scarlet, beret jumps, 4–6 a stream of turrón bars and wrapped sweets shoots out behind him in an arc, one more each frame with gold confetti (all inside the cell), 7 the stream ends with a final present, 8 stands up beaming and wipes his brow, 9 stance. |
| `hurt.png` | 1–3 flinch while standing: beret tilts, grin drops open in surprise; 4–6 heavy reel while standing: staggers back, basket swinging, a present falls out of the basket; 7–9 airborne crumple, knocked off his feet and curling in the air, beret flying just above his head. |
| `defeat.png` | 1 upright struck, 2 beret slips over one eye, 3 drops to one knee, 4–6 topples forward, 7 lands on his side, 8–9 flat on his side in the same lying position with a small visible settle (a last present rolls out beside him), distinct drawings; basket tipped beside him. |

After each saved action, run only `npm run intake:character -- caga-tio`. Claude handles `verify:character`, build, and tests.
