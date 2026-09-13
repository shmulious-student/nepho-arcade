# BYTE (`byte`) — hero, 12 files + hero card

## Status — queue position 14 of 14 · 14 image requests (Step A sheet + 12 action files + hero card)

Legacy — her current grids are a copy of Riva; this is her first real set. Needs the sheet, all 12 files
and the hero card, one session, one look.

Done means `npm run verify:character -- byte` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). Deliver all 12
files in one session, one look — a partial delivery is applied as row overrides on the old art and
ships two versions of the hero mixed. Heroes carry two extra rules: the **face stays clear and
unobstructed in every frame** (a player photo is composited over it and the head is auto-detected
from skin tones), and the **hero-select card** is a separate square image.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: public/assets/generated/hero-roster-atlas.png — Byte is the pink-haired boxer in the second row, second column (identity) · public/game/cards/byte.webp. Her current grids are a copy of another hero and must NOT be attached. Do Step A (the character sheet) first and attach it to
every action request too.

## Character card

```
ID:            byte
RANK:          hero
NAME:          BYTE
BUILD:         athletic young woman, medium height, boxer's shoulders, quick
FACE:          bright pink/magenta hair in an undercut with a high ponytail, sharp confident eyes, a smirk, light-tan skin — the face stays clear and unobstructed (a player photo is composited over it)
OUTFIT:        black sports-bra top, dark fitted athletic trousers with a pink side stripe, black-and-pink trainers, hand wraps under the gloves
PALETTE:       hair #FF3FA4, gloves #FF76C8, top #16161A, trousers #1E1E26, bolt light #FFB3E0
PROPS:         magenta fingerless boxing gloves with dark straps — on both hands in every frame
FIGHTS WITH:   boxing — a jab, a cross, a spinning hook finisher, a wind-up haymaker; her special fires pink energy bolts from the gloves
EFFECT:        pink energy — sparks off the gloves, short bolts that fly forward
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: BYTE —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/byte-sheet.png`.

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

## Step B — the 12 action files (`public/assets/generated/actions/byte/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a boxer's bounce: 1 guard, 2 bounce on the toes, 3 ponytail swings, 4 gloves tap together, 5 bounce, 6 weight back, 7 a pink glint on the gloves, 8 gloves up, 9 settles into frame 1. Same height throughout. |
| `walk.png` | **walk** — a light shuffling boxer's advance: a full 8-step stride plus a return frame, gloves up, ponytail bouncing; frame 9 leads back into frame 1. |
| `dash.png` | **dash** — **1–2** a crouch and an explosive push-off; **3–7 a blurred full-speed run**, gloves tucked, pink speed streaks behind her (never in front); **8–9** a lunging skid-stop with a pink flash on the lead glove. |
| `light1.png` | **light1** — a jab: 1 guard, 2 shoulder loads, **3–4 the lead glove snaps out with a small pink spark at contact**, 5 pull back, 6–8 reset, 9 guard. Nine crisp beats. |
| `light2.png` | **light2** — the cross that follows light1: 1 guard, 2 hips turn, **3–5 the rear glove drives across at head height leaving a short pink arc**, 6 contact, 7 follow-through, 8 recover, 9 guard. |
| `light3.png` | **light3** — chain finisher: 1 loads low, **2–7 a full 360° spinning hook that draws a complete ring of pink light around her**, the ring bursting into sparks on 7, 8 lands, 9 guard. Ring inside the cell. |
| `heavy.png` | **heavy** — HAYMAKER: **1–3** a slow, huge wind-up, the rear glove drawn far back and low, glowing pink, 4 steps in, **5–6 the haymaker swings up and through with a big pink impact burst**, 7–9 a long recovery back to guard. |
| `special.png` | **special** — FOUR-SHOT VOLLEY: 1 guard up, **2, 4, 6, 8 four rapid straight punches, alternating gloves, each launching a short pink energy bolt forward** — every bolt drawn just ahead of the glove and fully inside the cell, 3, 5, 7 the glove pulling back between shots, 9 guard. |
| `block.png` | **block** — **frame 1 is the held guard** — both gloves up in front of the face, elbows tucked, chin down, feet planted, full figure at full height (the game shows only frame 1 while blocking); 2–9 small flinches with pink sparks as hits land on the gloves; never leaves the ground. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, ponytail flying, still on the feet (a light hit shows frames 1 and 3); **4–6 heavy reel**: staggers back on her heels, gloves dropping, still on the feet (a heavy hit shows 4 and 6); **7–9 airborne crumple**: knocked off the feet, body curling in the air (a launch shows 7 and 9). |
| `knockdown.png` | **knockdown** — 1 stagger, 2 falls backward, **3–6 on the floor** — lands on the back, gloves up beside her head, **frame 6 flat and still** (the game holds it while down), 7 rolls, 8 pushes up to one knee, **9 back on the feet at full height** in the guard stance. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches her ribs, 3 drops to a knee, 4–6 topples sideways, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on her side, ponytail across the floor). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Step C — hero-select card (`public/assets/generated/heroes/byte-card.png`)

> Pixel-art hero-select portrait, 1024×1024 square, transparent background. [STYLE BLOCK] Character
> exactly as in the attached character sheet. BYTE — waist-up, three-quarter view facing right,
> confident expression, the signature effect (magenta-pink #FF76C8) swirling behind. Big, readable, centred,
> nothing touching the canvas edge.

## Accept

```bash
npm run intake:character -- byte        # container only: background → alpha, canvas → 2048²
npm run verify:character -- byte
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. The build prints `hero byte ok (actions)` once the
set is complete.
