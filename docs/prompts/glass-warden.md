# Glass Warden (`glass-warden`) — boss, level 2, 6 files

## Status — queue position 1 of 16 · 7 image requests (Step A sheet + 6 action files)

Legacy — no per-action set exists; the old 6×8 grid ships. Needs the character sheet (Step A) and all 6
files (`idle approach attack special hurt defeat`), one session, one look. Level 2 boss.

Done means `npm run verify:character -- glass-warden` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). The boss
currently ships on its old 6×8 grid; this set replaces it completely. Bosses are larger and heavier
on screen than enemies: every attack telegraphs clearly, and `special` is unmistakably different from
`attack`. Deliver all 6 files in one session, one look.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: `public/assets/generated/bosses/boss-01-glass-warden-grid.png (identity) · public/game/portraits/glass-warden.webp`. Do Step A (the character sheet) first and attach it
to every action request too.

## Character card

```
ID:            glass-warden
RANK:          boss
NAME:          Glass Warden
BUILD:         heavy armoured warden, huge shoulders, a head and a half taller than the enemy knight
FACE:          full helm with a glowing blue visor, crystal spikes crowning the helm
OUTFIT:        dark-blue plate armour with translucent glass-crystal shoulder plates and chest facets that refract light, a long blue cape
PALETTE:       plate #14245A, crystal #9BE8FF / #37AAFF, cape #2350C8, blade #5CE6FF
PROPS:         a wide blue energy greatsword in both hands
FIGHTS WITH:   crushing greatsword blows, fans of glass shards, walls of crystal, a reflecting stance
EFFECT:        blue light with refracted white glints; glass shards
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: Glass Warden —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/glass-warden-sheet.png`.

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

## Step B — the 6 action files (`public/assets/generated/actions/glass-warden/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a towering guard: 1 stance, sword point down, 2 crystals catch light, 3 cape drifts, 4 shoulders square, 5 blade glow pulses, 6 visor brightens, 7 crystals glint, 8 cape settles, 9 settles into frame 1. |
| `approach.png` | **approach** — a slow armoured march, greatsword resting on the shoulder: full 8-step stride plus a return frame, cape swinging; frame 9 leads into frame 1. |
| `attack.png` | **attack** — SHARD SMASH: 1 stance, 2–3 the greatsword rises high, 4 steps in, **5–6 the blade slams down and shatters into a burst of glass shards on impact**, 7 shards fall, 8 lifts the blade, 9 stance. Shards inside the cell. |
| `special.png` | **special** — CRYSTAL WALL: 1 plants the blade point-down, 2 crystal light gathers at the tip, **3–5 a jagged wall of blue crystal erupts from the ground in front of him, taller each frame**, 6 the wall gleams at full height, 7 it cracks, 8 it crumbles into shards, 9 stance. Wall inside the cell. |
| `hurt.png` | **hurt** — **1–3 flinch**: helm snaps back, crystals flashing, still on the feet; **4–6 heavy reel**: staggers back, blade dropping, still on the feet; **7–9 airborne crumple**: knocked off the feet, curling in the air. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 the greatsword falls, 3 sinks to a knee, 4–6 topples, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his back, crystal shoulders cracked, blade beside him inside the cell). Full length across the cell, same size as standing — never shrunk, never faded away. |

## Accept

```bash
npm run intake:character -- glass-warden        # container only: background → alpha, canvas → 2048²
npm run verify:character -- glass-warden
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. Once the set is in, the boss's portrait is rebuilt
from its new `idle` frame automatically.
