# Brawler (`brawler`) — enemy, 10 files

## Status — queue position 7 of 11 · 11 image requests (Step A sheet + 10 action files)

Legacy — no per-action set exists; the old 6-frame grid ships. Needs the character sheet (Step A) and all
10 files (`idle walk attack heavy special guard hurt knockback getup defeat`), one session, one look (also gives `brawler-b` its palette variant for free).

Done means `npm run verify:character -- brawler` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The character
currently ships on its old 6-frame grid; this set replaces it completely. Deliver all 10 files in one
session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/enemies/enemy-02-orange-brawler-grid-1.png (identity)`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            brawler
RANK:          enemy
NAME:          Brawler
BUILD:         hugely muscular, bald, wide and heavy
FACE:          bald, heavy jaw, scowl, light-tan skin, small eyes
OUTFIT:        black tank top, orange work trousers, chains crossed over the chest, black boots, studded belt
PALETTE:       trousers #F07A2A, tank #16161A, chains #C0C6CE, skin #E0A87A
PROPS:         none — bare fists; the chest chains clank
FIGHTS WITH:   slow crushing punches and a two-fisted ground slam
EFFECT:        orange shockwave dust on his big hits
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Brawler —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/brawler-sheet.png`.

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

## Step B — the 10 action files (`public/assets/generated/actions/brawler/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a heavy breathing guard: 1 stance, fists up, 2 chest rises, 3 shoulders drop, 4 cracks the knuckles, 5 chains sway, 6 weight shifts, 7 exhales, 8 fists back up, 9 settles into frame 1. |
| `walk.png` | **walk** — a lumbering stomp forward: full 8-step stride plus a return frame, arms swinging heavy, chains bouncing; frame 9 leads into frame 1. |
| `attack.png` | **attack** — a straight hook: 1 stance, 2 hip loads, 3 fist starts, **4–5 the hook lands at full extension with an impact burst**, 6 pull back, 7–8 reset, 9 stance. |
| `heavy.png` | **heavy** — a two-fisted overhead slam: 1–3 both fists rise together high over the head, 4 rises onto the toes, **5–6 both fists crash down with a shockwave of orange dust**, 7–9 straightens slowly. |
| `special.png` | **special** — ARMOURED CHARGE: 1 crouches, 2 shoulder drops forward, **3–5 a three-frame shoulder-first charge with dust streaming behind**, 6 a slamming shoulder impact with a shockwave, 7 recoil, 8 straightens, 9 stance. Dust inside the cell. |
| `guard.png` | **guard** — a braced stance behind raised forearms, chin tucked, feet wide; small flinches on frames 3, 5 and 7. |
| `hurt.png` | **hurt** — **1–3 flinch**: head rocks back, jaw open, still on the feet; **4–6 heavy reel**: staggers back, arms wide, still on the feet; **7–9 airborne crumple**: knocked off the feet, body curling in the air. |
| `knockback.png` | **knockback** — 1 stagger, 2 thrown off the feet, 3–5 airborne and tumbling, **6 lands hard, 7 flat on the floor** (on his back, boots up), 8–9 either still flat or beginning to stir — never back on the feet. **There must be a frame lying flat.** |
| `getup.png` | **getup** — **frame 1 flat on the floor (the lowest frame)**, 2 head lifts, 3 pushes up onto the hands, 4 hands and knees, 5 one knee, 6 rising, 7 upright but hunched, 8 straightens, **9 standing at full height in the guard stance**. Rises monotonically — never dips. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches the gut, 3 drops to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (face down, arms spread). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Accept

```bash
npm run intake:character -- brawler        # container only: background → alpha, canvas → 2048²
npm run verify:character -- brawler
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names.
