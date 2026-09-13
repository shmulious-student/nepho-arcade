# NEPHO (`nepho`) — hero, 12 files + hero card

## Status — queue position 15 of 16 · 14 image requests (Step A sheet + 12 action files + hero card (the set is redone whole))

FAILED — 4 of 12 files present (`heavy special knockdown defeat`), delivered in an earlier round as row
overrides. `heavy` and `special` pass; the gate's exact output for the rest:

```
FAIL  knockdown.png cell 1,2 (frame 6): the figure ends in a straight left edge — a cropped or re-sliced frame
FAIL  defeat.png: frames 7 and 9 are the same pose — every frame must be distinct, never pad with a repeat
FAIL  defeat.png: frames 8 and 9 are the same pose — every frame must be distinct, never pad with a repeat
+ idle walk dash light1 light2 light3 block hurt: missing
```

Per the standard (one delivery, one look) the set is **redone whole**: a new sheet, all 12 files and the
card in one session. Delete the four old files from `public/assets/generated/actions/nepho/` before the
first new one lands so the gate never mixes the two deliveries.

Done means `npm run verify:character -- nepho` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Full per-action set under [character-art-standard.md](../character-art-standard.md). Deliver all 12
files in one session, one look — a partial delivery is applied as row overrides on the old art and
ships two versions of the hero mixed. Heroes carry two extra rules: the **face stays clear and
unobstructed in every frame** (a player photo is composited over it and the head is auto-detected
from skin tones), and the **hero-select card** is a separate square image.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity reference: public/assets/generated/hero-nepho-grid-1.png (identity — the current in-game design) · public/game/cards/nepho.webp (the current hero card) Do Step A (the character sheet) first and attach it to
every action request too.

## Character card

```
ID:            nepho
RANK:          hero
NAME:          NEPHO
BUILD:         lean young male fighter, medium height, quick and balanced
FACE:          spiky black hair swept up and back, sharp dark eyes, a thin determined mouth, light skin — the face stays clear and unobstructed (a player photo is composited over it)
OUTFIT:        sleeveless dark-navy tunic with a high collar over dark fitted trousers, wrapped forearms and shins in grey cloth, dark boots, a long teal scarf-cape that trails behind him
PALETTE:       tunic #14243D, trousers #0B1730, wraps #9BB1C9, scarf / energy #75F5DC, hair #101018
PROPS:         none — bare hands; the scarf-cape moves with every action
FIGHTS WITH:   clean martial-arts strikes — a jab, a cross, a spinning breaker — a spinning crescent slash of teal light for his heavy, and a radial burst of teal light for his special
EFFECT:        teal light — arcs off his hands and feet, rings out from his body
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: NEPHO —
> as in the card above. Show, left to right: full-body front view, full-body three-quarter view
> facing right, full-body side view facing right, a large head close-up, and a swatch strip of the
> palette. Identical proportions in every view. Save as `docs/refs/nepho-sheet.png`.

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

## Step B — the 12 action files (`public/assets/generated/actions/nepho/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a balanced fighter's guard: 1 stance, 2 breath in, 3 scarf drifts, 4 fists tighten, 5 weight shifts, 6 scarf settles, 7 a teal glint on the hands, 8 breath out, 9 settles into frame 1. Same height throughout. |
| `walk.png` | **walk** — a light, quick advance on the balls of the feet: a full 8-step stride plus a return frame, scarf streaming; frame 9 leads back into frame 1. |
| `dash.png` | **dash** — **1–2** a crouch and an explosive push-off; **3–7 a blurred full-speed run**, body low, scarf horizontal, teal speed streaks behind him (never in front); **8–9** a lunging skid-stop with a teal flash on the lead hand. |
| `light1.png` | **light1** — a fast jab: 1 guard, 2 shoulder loads, **3–4 the lead fist snaps out with a small teal spark at contact**, 5 pull back, 6–8 reset, 9 guard. Nine crisp beats. |
| `light2.png` | **light2** — the cross that follows light1: 1 guard, 2 hips turn, **3–5 the rear fist drives across at head height leaving a short teal arc**, 6 contact, 7 follow-through, 8 recover, 9 guard. |
| `light3.png` | **light3** — chain finisher: 1 drops low, **2–7 a full 360° spinning back-fist that draws a complete ring of teal light around him**, the ring bursting outward into sparks on 7, 8 lands, 9 guard. Ring inside the cell. |
| `heavy.png` | **heavy** — CRESCENT SLASH: **1–3** a slow wind-up, the hand drawn back over the shoulder gathering teal light, 4 the body uncoils, **5–6 a huge spinning crescent blade of teal light sweeps across in front of him** (ending in a tapered tip inside the cell), 7–9 a long recovery back to guard. |
| `special.png` | **special** — RADIAL BURST: **1–2** plants the feet and draws both hands to the chest, teal light gathering between them, 3 the light swells, **4–7 a 360° shockwave of teal light explodes outward from his body, the ring growing each frame but never reaching the cell edge**, 8 the light fades, 9 guard. |
| `block.png` | **block** — **frame 1 is the held guard** — forearms crossed in front of the face, chin tucked, feet planted, full figure at full height (the game shows only frame 1 while blocking); 2–9 small flinches with teal sparks as hits land on the forearms; never leaves the ground. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, scarf flaring up, still on the feet (a light hit shows frames 1 and 3); **4–6 heavy reel**: staggers back on his heels, arms wide, still on the feet (a heavy hit shows 4 and 6); **7–9 airborne crumple**: knocked off the feet, body curling in the air (a launch shows 7 and 9). |
| `knockdown.png` | **knockdown** — 1 stagger, 2 falls backward, **3–6 on the floor** — lands on the back, scarf spread under him, **frame 6 flat and still** (the game holds it while down), 7 rolls, 8 pushes up to one knee, **9 back on the feet at full height** in the guard stance. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches his chest, 3 drops to a knee, 4–6 topples sideways, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his side, scarf across the floor). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Step C — hero-select card (`public/assets/generated/heroes/nepho-card.png`)

> Pixel-art hero-select portrait, 1024×1024 square, transparent background. [STYLE BLOCK] Character
> exactly as in the attached character sheet. NEPHO — waist-up, three-quarter view facing right,
> confident expression, the signature effect (teal #75F5DC) swirling behind. Big, readable, centred,
> nothing touching the canvas edge.

## Accept

```bash
npm run intake:character -- nepho        # container only: background → alpha, canvas → 2048²
npm run verify:character -- nepho
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the
build is run; regenerate only the file it names. The build prints `hero nepho ok (actions)` once the
set is complete.
