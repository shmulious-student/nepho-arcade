# Kilnheart (`kilnheart`) — boss, level 3, 6 files

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-02-kilnheart-grid.png (identity) · public/game/portraits/kilnheart.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            kilnheart
RANK:          boss
NAME:          Kilnheart
BUILD:         armoured samurai, broad and heavy, tall
FACE:          a red oni war-mask with glowing furnace eyes; horned kabuto helm
OUTFIT:        red lacquered samurai plate with gold trim, a furnace chest plate glowing orange through its grille, a torn dark-red cape, black hakama
PALETTE:       plate #B8202A, gold #F2B530, furnace #FF8F40, flame #FFD34D
PROPS:         a long katana wreathed in flame, held two-handed
FIGHTS WITH:   burning sword slashes, ground eruptions of fire, a furnace-driven charge
EFFECT:        orange-red flame with yellow tips, always trailing the blade
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Kilnheart —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/kilnheart-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/kilnheart/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a samurai ready stance: 1 stance, blade low, 2 flames lick the blade, 3 furnace pulses, 4 weight shifts, 5 flame flares, 6 mask eyes brighten, 7 cape drifts, 8 flames settle, 9 settles into frame 1. |
| `approach.png` | **approach** — a heavy advancing stride with the blade drawn back: full 8-step stride plus a return frame, flames trailing; frame 9 leads into frame 1. |
| `attack.png` | **attack** — FLAME SLASH: 1 stance, 2 the blade draws back, 3 flames build, **4–5 a wide horizontal flaming cut with a long fire arc**, 6 follow-through, 7 the arc burns out, 8 returns to guard, 9 stance. Arc inside the cell. |
| `special.png` | **special** — ERUPTION: 1 raises the blade overhead, 2 the furnace roars white-hot, 3 the blade comes down, **4–6 three pillars of fire erupt from the ground in front of him, one more each frame**, 7 they peak, 8 they collapse into embers, 9 stance. Fire inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: mask snaps back, flames guttering, still on the feet; **4–6 heavy reel**: staggers back, blade dragging, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the katana falls, its flame dying, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 flat on the ground, identical, staying down** (on his side, furnace dark, blade beside him inside the cell). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run verify:character -- kilnheart
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
