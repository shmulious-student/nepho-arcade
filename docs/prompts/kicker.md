# Kicker (`kicker`) — enemy, 10 files

Full per-action set under [character-art-standard.md](../character-art-standard.md). The character
currently ships on its old 6-frame grid; this set replaces it completely. Deliver all 10 files in one
session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/enemies/enemy-03-purple-fighter-grid-1.png (identity — regenerate the design in the reference style, do not copy its blurry render)`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            kicker
RANK:          enemy
NAME:          Kicker
BUILD:         athletic young woman, medium height, long legs
FACE:          long purple hair in a high ponytail, sharp eyes, smirk, light skin
OUTFIT:        cropped black leather jacket over a purple sports top, black shorts, fishnet leggings, purple lace-up boots, fingerless gloves
PALETTE:       hair #7A2BD8, jacket #17141C, top #B04BFF, boots #5A1EB0
PROPS:         none — she fights with her legs
FIGHTS WITH:   fast kicks, a spinning heel, and a flying kick that carries her forward
EFFECT:        purple light trails off her boots on fast kicks
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Kicker —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/kicker-sheet.png`.

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

## Step B — the 10 action files (`public/assets/generated/actions/kicker/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a light bouncing fight stance: 1 stance, 2 bounces on the toes, 3 ponytail swings, 4 guard shifts, 5 bounce, 6 weight back, 7 hair settles, 8 fists up, 9 settles into frame 1. |
| `walk.png` | **walk** — a quick springy advance on the toes: full 8-step stride plus a return frame, ponytail whipping; frame 9 leads into frame 1. |
| `attack.png` | **attack** — a snap front kick: 1 stance, 2 knee chambers, **3–4 the leg snaps out at hip height with a purple trail**, 5 impact spark, 6 re-chambers, 7–8 foot down, 9 stance. |
| `heavy.png` | **heavy** — a spinning heel kick: 1 stance, 2 shoulder turns, 3 back to the viewer mid-spin, **4–5 the heel sweeps across at head height leaving a purple arc**, 6 contact, 7 follow-through, 8 lands, 9 stance. |
| `special.png` | **special** — FLYING KICK: 1 crouches, 2 launches, **3–5 a three-frame flying side-kick carrying her forward, boot first, purple trail behind**, 6 impact burst, 7 lands in a crouch, 8 rises, 9 stance. Trail inside the cell. |
| `guard.png` | **guard** — a tight guard, forearms up, one knee slightly raised, feet planted; small flinches on frames 3, 5 and 7. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, ponytail flying, still on the feet; **4–6 heavy reel**: staggers back on one foot, still on the feet; **7–9 airborne crumple**: knocked off the feet, body curling in the air. |
| `knockback.png` | **knockback** — 1 stagger, 2 thrown off the feet, 3–5 airborne and tumbling, **6 lands hard, 7 flat on the floor** (on her side, hair fanned out), 8–9 either still flat or beginning to stir — never back on the feet. **There must be a frame lying flat.** |
| `getup.png` | **getup** — **frame 1 flat on the floor (the lowest frame)**, 2 head lifts, 3 pushes up onto the hands, 4 hands and knees, 5 one knee, 6 rising, 7 upright but hunched, 8 straightens, **9 standing at full height in the guard stance**. Rises monotonically — never dips. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches her side, 3 drops to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (face down, ponytail across the floor). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Accept

```bash
npm run verify:character -- kicker
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names.
