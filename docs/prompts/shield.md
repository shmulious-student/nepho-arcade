# Shield Trooper (`shield`) — enemy, 10 files

## Status — queue position 14 of 16 · 11 image requests (Step A sheet + 10 action files)

Legacy — no per-action set exists; the old 6-frame grid ships. Needs the character sheet (Step A) and all
10 files (`idle walk attack heavy special guard hurt knockback getup defeat`), one session, one look.

Done means `npm run verify:character -- shield` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The character
currently ships on its old 6-frame grid; this set replaces it completely. Deliver all 10 files in one
session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/enemies/enemy-05-shield-soldier-grid-1.png (identity)`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            shield
RANK:          enemy
NAME:          Shield Trooper
BUILD:         heavy armoured trooper, broad, squat, thick limbs
FACE:          full helm with a glowing red visor — no face visible
OUTFIT:        black plate armour with red light seams along every plate edge, heavy boots
PALETTE:       plate #17161B, seams #FF2A3A, shield #262229, glow #FF6A5A
PROPS:         a tall red-lit riot shield strapped to the left arm; a short baton mace in the right hand
FIGHTS WITH:   baton strikes from behind the shield, a shield bash, and a shield-first charge
EFFECT:        red light streaks off the shield's edge
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Shield Trooper —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/shield-sheet.png`.

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

## Step B — the 10 action files (`public/assets/generated/actions/shield/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a braced shield stance: 1 stance, shield forward, 2 seams pulse, 3 baton taps the shield rim, 4 weight shifts, 5 shield lifts slightly, 6 visor glow brightens, 7 shield settles, 8 seams dim, 9 settles into frame 1. |
| `walk.png` | **walk** — a heavy advancing stomp behind the shield: full 8-step stride plus a return frame, shield steady, baton ready; frame 9 leads into frame 1. |
| `attack.png` | **attack** — a baton strike over the shield: 1 stance, 2 baton draws back, **3–4 the baton swings over the shield's top edge with a red spark at contact**, 5 impact, 6 pulls back, 7–8 reset, 9 stance. |
| `heavy.png` | **heavy** — a shield bash: 1–3 the shield draws back and the body coils, 4 steps in, **5–6 the shield slams forward with a red shockwave off its face**, 7–9 resets behind the shield. |
| `special.png` | **special** — SHIELD CHARGE: 1 braces behind the shield, 2 leans in, **3–5 a three-frame charging run with red light streaking off the shield's edge**, 6 a slamming impact with a red shockwave, 7 recoil, 8 straightens, 9 stance. Shockwave inside the cell. |
| `guard.png` | **guard** — crouched fully behind the shield, only the visor showing over the rim, feet planted; small flinches with red sparks on frames 3, 5 and 7. |
| `hurt.png` | **hurt** — **1–3 flinch**: helm snaps back, shield dipping, still on the feet; **4–6 heavy reel**: staggers back, shield swinging wide, still on the feet; **7–9 airborne crumple**: knocked off the feet, body curling in the air. |
| `knockback.png` | **knockback** — 1 stagger, 2 thrown off the feet, 3–5 airborne and tumbling, **6 lands hard, 7 flat on the floor** (the shield landing flat beside him), 8–9 either still flat or beginning to stir — never back on the feet. **There must be a frame lying flat.** |
| `getup.png` | **getup** — **frame 1 flat on the floor (the lowest frame)**, 2 head lifts, 3 pushes up onto the hands, 4 hands and knees, 5 one knee, 6 rising, 7 upright but hunched, 8 straightens, **9 standing at full height in the guard stance**. Rises monotonically — never dips. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the baton drops, 3 drops to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his back, shield across his chest). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Accept

```bash
npm run intake:character -- shield        # container only: background → alpha, canvas → 2048²
npm run verify:character -- shield
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names.
