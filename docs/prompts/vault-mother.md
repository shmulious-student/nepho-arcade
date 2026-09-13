# Vault Mother (`vault-mother`) — boss, level 9, 6 files

## Status — queue position 4 of 10 · 7 image requests (Step A sheet + 6 action files)

Legacy — no per-action set exists; the old 6×8 grid ships. Needs the character sheet (Step A) and all 6
files (`idle approach attack special hurt defeat`), one session, one look. Level 9 boss.

Done means `npm run verify:character -- vault-mother` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-08-vault-mother-grid.png (identity) · public/game/portraits/vault-mother.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            vault-mother
RANK:          boss
NAME:          Vault Mother
BUILD:         tall, regal woman, statuesque, upright
FACE:          long pale-lavender hair to the hips, a gold halo-crown, serene eyes, pale skin
OUTFIT:        a white-and-gold segmented armour gown — gold plates in bands down the bodice and skirt, white silk beneath, gold gauntlets
PALETTE:       gown #F3F4E8, gold #FFCF5C, hair #C9B8F0, chain #FFCF5C, halo #FFF3B0
PROPS:         a gold chain whip that unspools from her gauntlet; small gold halo orbs
FIGHTS WITH:   a lashing chain beam, halo bombs dropped from above, locking her armour
EFFECT:        warm gold light
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Vault Mother —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/vault-mother-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/vault-mother/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a regal standing pose: 1 stance, 2 the halo turns, 3 hair drifts, 4 gauntlet lifts, 5 halo orbs blink in, 6 gown plates shift, 7 orbs fade, 8 gauntlet lowers, 9 settles into frame 1. |
| `approach.png` | **approach** — a slow, gliding advance: full 8-step stride plus a return frame, gown plates swaying, hair trailing; frame 9 leads into frame 1. |
| `attack.png` | **attack** — CHAIN LASH: 1 stance, 2 the gauntlet rises, 3 the chain unspools, **4–5 the gold chain lashes straight forward as a beam of gold light, ending in a tapered point inside the cell**, 6 it snaps taut, 7 it recoils, 8 spools back, 9 stance. |
| `special.png` | **special** — HALO BOMBS: 1 plants, 2 raises both hands, 3 the halo flares, **4–6 three gold halo orbs rise above her and drop, one striking the ground each frame with a gold burst**, 7 the last burst fades, 8 hands lower, 9 stance. Bursts inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: halo knocked crooked, head snaps back, still on the feet; **4–6 heavy reel**: staggers back, chain flailing, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the halo falls, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on her side, hair fanned out, chain across the floor). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run intake:character -- vault-mother        # container only: background → alpha, canvas → 2048²
npm run verify:character -- vault-mother
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
