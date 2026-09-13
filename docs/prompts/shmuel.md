# SHMUEL (`shmuel`) — hero, 12 files

## Status — DELIVERED (redo from scratch, 2026-09-13 21:31–21:46; committed `3dce48c`)

The whole set was regenerated in the 2026 kit from the new sheet `docs/refs/shmuel-2026-kit-sheet.png`; all 12 files pass
`npm run verify:character -- shmuel`, `build:assets` + `test:assets` are clean, and the set is in the lobby and in the deployed
content pack. **Nothing to do — do not regenerate his files.** This file is kept as the record of how the set was made; the
notes below the card about the earlier walk/dash stride fix are history from the first set.

**Attach to every request (if a file is ever redone):** `public/assets/references/hero-grid-quality-reference.png` (render
style) and `docs/refs/shmuel-2026-kit-sheet.png` (identity — the character sheet this set was made from; the older
`docs/refs/shmuel-sheet.png` is the previous look and must not be used).

## Character card

```
ID:            shmuel
RANK:          hero
NAME:          SHMUEL
BUILD:         adult man, medium-tall, broad and muscular, thick forearms and calves
FACE:          thick dark-brown hair swept up and back, full dark beard, heavy brows, intense eyes, light-olive skin — the face stays clear and unobstructed
OUTFIT:        short-sleeved football jersey in vertical blue-and-garnet stripes with a dark collar, plain black shorts, black fingerless gloves, black socks, black-and-white high-top sneakers
PALETTE:       jersey blue #0E3983, jersey garnet #B91D30, skin #EA9559, hair / dark #282125, white #F6ECDF, effect cyan #35E8FF
PROPS:         none — bare knuckles
FIGHTS WITH:   a boxer — jabs, crosses, a spinning back-fist, a haymaker
EFFECT:        cyan pixel squares and a cyan pixel portal (his special); on walk and dash only a hint of cyan pixels off the fists
```

## STYLE BLOCK (paste into every request)

> Pixel-art fighting-game character, in the exact render style, outline weight, proportions and
> lighting of the attached reference sheet (`hero-grid-quality-reference.png`): clean dark outlines,
> 3–4 tone cel shading, saturated colours, readable silhouette, chunky hands and feet, head about
> 1/5 of body height. Character exactly as in the attached character sheet — same face, hair,
> beard, costume, colours. The face stays coherent and unobstructed. No text, labels, numbers,
> borders, grid lines, UI, watermark, background, floor, shadow, scenery or extra characters
> anywhere in the image.

## FRAME BLOCK (every request)

> Pixel-art fighting-game character animation sheet: a **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent background (real
> alpha channel — not a painted checkerboard, not a matte colour, and no grid lines or cell borders
> drawn on the canvas)**. [STYLE BLOCK] The character faces RIGHT in every frame. **Identical
> bottom-centre anchor in all 9 cells: feet on the same baseline, body on the same vertical axis,
> the figure the same size as in every other file of this character, filling about two thirds of the
> cell height. Generous empty margin inside each cell — hands, feet, hair and effects never touch or
> cross a cell boundary. No ground shadow or floor under the feet.** Each of the 9 frames is a
> distinct, fully drawn, solid pose — **no motion-blur frames, no semi-transparent ghost frames, no
> in-between smears** — and never a repeated frame. Action: **<ACTION>** — <the 9 beats>.

## The two files (`public/assets/generated/actions/shmuel/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `walk.png` | **walk** — a boxer's purposeful advance, fists up: one full stride cycle in which **the two legs take turns leading — frames 1–4 the LEFT leg swings forward, plants and passes; frames 5–8 the RIGHT leg swings forward, plants and passes; frame 9 returns to frame 1. Both legs must lead once per cycle; the same leg must never be in front in every frame.** 1 left foot planted ahead, right behind, 2 right foot swinging past, feet together, 3 right foot reaching forward, 4 right foot planted ahead, left behind, 5 left foot swinging past, feet together, 6 left foot reaching forward, 7 left foot planted ahead, 8 right foot swinging through, 9 leads back into 1. Arms counter-swing with the legs (right fist forward when the left foot is), shoulders rolling. Feet on the baseline, full height throughout, a couple of cyan pixels off the fists. |
| `dash.png` | **dash** — 1 a low crouch, 2 an explosive push-off, **3–7 a full-speed sprint in which the legs cycle — 3 right leg driving forward, 4 legs passing under the body, 5 LEFT leg driving forward, 6 legs passing, 7 right leg driving forward again — never the same stride pose repeated; cyan speed streaks behind him (never in front)**, 8 a lunging skid-stop with the lead fist thrown, 9 stopped, fists up. |

## Accept

```bash
npm run intake:character -- shmuel dash
npm run verify:character -- shmuel
npm run build:assets && npm run test:assets
```

Then `/showcase.html?row=walk` and `?row=dash`: watch the legs — left and right must each lead
once per loop. The gate cannot judge this; only the eye can.
