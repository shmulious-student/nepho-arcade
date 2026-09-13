# Railmaw (`railmaw`) — boss, level 6, 6 files

## Status — queue position 2 of 11 · 7 image requests (Step A sheet + 6 action files)

Legacy — no per-action set exists; the old 6×8 grid ships. Needs the character sheet (Step A) and all 6
files (`idle approach attack special hurt defeat`), one session, one look. Level 6 boss.

Done means `npm run verify:character -- railmaw` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-05-railmaw-grid.png (identity) · public/game/portraits/railmaw.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            railmaw
RANK:          boss
NAME:          Railmaw
BUILD:         massive armoured trooper, squat and enormously wide — the boss version of the Shield Trooper
FACE:          a rail-mask helm: a red-lit horizontal visor slot and a toothed steel jaw guard
OUTFIT:        black heavy plate with red light seams, exhaust vents on the back, a tall red-lit riot shield fused to the left arm
PALETTE:       plate #17161B, seams #FF4F72, shield glow #FF6A5A, exhaust #9BB1C9
PROPS:         the arm-shield with a spinning buzzsaw rim; back exhaust vents that vent grey smoke
FIGHTS WITH:   a rail-straight charging dash, a spinning buzzsaw sweep of the shield, clouds of exhaust
EFFECT:        red light streaks and grey exhaust smoke
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Railmaw —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/railmaw-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/railmaw/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a hunkered shield stance: 1 stance, 2 vents puff, 3 seams pulse, 4 the saw rim ticks, 5 weight shifts, 6 visor brightens, 7 vents puff again, 8 seams dim, 9 settles into frame 1. |
| `approach.png` | **approach** — a ground-shaking advance behind the shield: full 8-step stride plus a return frame, smoke trailing from the vents; frame 9 leads into frame 1. |
| `attack.png` | **attack** — RAIL DASH: 1 braces, 2 vents fire, **3–5 a three-frame shield-first charge with red light streaking off the rim and smoke behind**, 6 a slamming impact with a red shockwave, 7 recoil, 8 straightens, 9 stance. Effects inside the cell. |
| `special.png` | **special** — BUZZSAW SPIN: 1 plants, 2 the shield rim starts to spin, 3 sparks fly, **4–6 he spins on the spot, the shield sweeping a full circle of red sparks around him at chest height**, 7 slows, 8 the rim stops, 9 stance. Sparks inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: helm snaps back, vents sputtering, still on the feet; **4–6 heavy reel**: staggers back, shield swinging wide, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the shield arm drops, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his back, shield flat, vents dead). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run intake:character -- railmaw        # container only: background → alpha, canvas → 2048²
npm run verify:character -- railmaw
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
