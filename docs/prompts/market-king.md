# Market King (`market-king`) — boss, level 5, 6 files

## Status — queue position 5 of 17 · 7 image requests (Step A sheet + 6 action files)

Legacy — no per-action set exists; the old 6×8 grid ships. Needs the character sheet (Step A) and all 6
files (`idle approach attack special hurt defeat`), one session, one look. Level 5 boss.

Done means `npm run verify:character -- market-king` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-04-market-king-grid.png (identity) · public/game/portraits/market-king.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            market-king
RANK:          boss
NAME:          Market King
BUILD:         huge bio-brawler, wide, top-heavy, a crown on top
FACE:          green mohawk, goggles pushed up, a wide grin with a gold tooth, ruddy skin
OUTFIT:        a tarnished gold crown, a long open lime-green trader's coat over armour plating with glowing green tubes and vials strapped across it, heavy boots
PALETTE:       coat #7ED321, plating #2E3A2A, tubes #A4EE42, gold #FFCF5C
PROPS:         a heavy gold sceptre topped with a coin, in the right hand; coins spill from his pockets
FIGHTS WITH:   sceptre swings, ground-shaking stomps, and a rain of gold coins
EFFECT:        lime-green chemical glow and glinting gold coins
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Market King —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/market-king-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/market-king/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a swaggering stance: 1 stance, sceptre on the shoulder, 2 tubes bubble, 3 coins jingle, 4 chest puffs, 5 crown tilts, 6 sceptre taps the ground, 7 tubes glow, 8 grin widens, 9 settles into frame 1. |
| `approach.png` | **approach** — a heavy, swaggering stomp forward: full 8-step stride plus a return frame, coat swinging, coins bouncing; frame 9 leads into frame 1. |
| `attack.png` | **attack** — SCEPTRE SWING: 1 stance, 2 the sceptre draws back, 3 shoulders turn, **4–5 the sceptre sweeps across in a wide gold-glinting arc**, 6 impact with a coin burst, 7 follow-through, 8 shoulders the sceptre, 9 stance. |
| `special.png` | **special** — COIN RAIN: 1 plants, 2 raises the sceptre high, 3 the coin at its top flares gold, **4–6 a shower of gold coins rains down around him, thicker each frame, bouncing off the ground**, 7 the last coins fall, 8 lowers the sceptre, 9 stance. Coins inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: crown knocked askew, head snaps back, still on the feet; **4–6 heavy reel**: staggers back, coins spilling, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the crown falls off, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his back, coins scattered around him inside the cell). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run intake:character -- market-king        # container only: background → alpha, canvas → 2048²
npm run verify:character -- market-king
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
