# Crown Runner (`crown-runner`) — boss, level 7, 6 files

## Status — queue position 2 of 10 · 7 image requests (Step A sheet + 6 action files)

Legacy — no per-action set exists; the old 6×8 grid ships. Needs the character sheet (Step A) and all 6
files (`idle approach attack special hurt defeat`), one session, one look. Level 7 boss.

Done means `npm run verify:character -- crown-runner` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-06-crown-runner-grid.png (identity) · public/game/portraits/crown-runner.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            crown-runner
RANK:          boss
NAME:          Crown Runner
BUILD:         athletic young woman, taller and more muscular than Kicker — the boss version of that design
FACE:          long purple hair in a high ponytail with a small gold circlet crown, fierce grin, light skin
OUTFIT:        black leather jacket over a purple top, black shorts, fishnet leggings, purple boots, a long pink speed scarf streaming behind
PALETTE:       hair #7A2BD8, jacket #17141C, scarf #FF76C8, boots #5A1EB0, afterimage #FF76C8
PROPS:         the scarf; nothing else
FIGHTS WITH:   blinding dashes that leave afterimages, splitting into copies, and a crown kick
EFFECT:        pink afterimages and speed lines
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Crown Runner —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/crown-runner-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/crown-runner/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a coiled sprinter's stance: 1 stance, 2 scarf streams, 3 bounces on the toes, 4 circlet glints, 5 bounce, 6 hair swings, 7 scarf settles, 8 fists up, 9 settles into frame 1. |
| `approach.png` | **approach** — a fast, low run: full 8-step stride plus a return frame, scarf and ponytail horizontal behind her; frame 9 leads into frame 1. |
| `attack.png` | **attack** — CROWN KICK: 1 stance, 2 knee chambers high, 3 leans back, **4–5 a leaping crown-high kick with a pink arc off the boot**, 6 impact spark, 7 lands, 8 rises, 9 stance. |
| `special.png` | **special** — SPLIT: 1 plants, 2 crouches, 3 blurs, **4–6 two pink afterimage copies step out of her, one to each side, sharper each frame** (all three figures inside the cell, the copies translucent pink), 7 the copies solidify, 8 she straightens, 9 stance. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, ponytail and scarf flying, still on the feet; **4–6 heavy reel**: staggers back on one foot, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches her side, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (face down, scarf and ponytail across the floor). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run intake:character -- crown-runner        # container only: background → alpha, canvas → 2048²
npm run verify:character -- crown-runner
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
