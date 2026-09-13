# NOA (`noa`) — hero, 12 files + hero card

## Status — DELIVERED

Sheet, 12 files and the card delivered 2026-09-13 19:30–20:50; four files needed one retry each (light2 ×2, light3,
heavy, knockdown), every file md5-unique, whole-set gate PASS. Committed (`de17117`), built, enabled in the lobby.

Done means `npm run verify:character -- noa` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render style) and the
identity reference: `docs/refs/noa-source/noa-1.png` (frontal, smiling — the face to match). Do Step A (the
character sheet) first and attach it to every action request too.

## Character card

```
ID:            noa
RANK:          hero
NAME:          NOA
BUILD:         woman in her early thirties, medium height, slim and athletic, quick on her feet
FACE:          long honey-copper hair swept back off the forehead and falling past the shoulders, green-hazel eyes with dark lashes, a small gold nose ring, berry-pink lips in a knowing half-smile, a few freckles, fair skin — chunky gold hoop earrings, a pearl choker and a fine gold chain with a small blue heart pendant — the face stays clear and unobstructed (a player photo is composited over it)
OUTFIT:        leopard-print everything — a leopard-print wrap blouse with rolled sleeves and a short leopard-print skirt over black bike shorts, a cream baker's half-apron dusted with flour tied at the waist, white chunky sneakers; a living pothos vine wound around her left forearm like a bracelet
PALETTE:       leopard tan #D8A85A with rosettes #1A1A1A, apron #F3E7C9, hair #C98A4B, skin #E8B896, lips #B5456A, pothos green #4CAF50 / lime #A8E063, crumb gold #F2C46B
PROPS:         a wooden rolling pin in the right hand (her weapon); a pothos vine that lashes out from the left forearm; a baking tray of cookies for the heavy and the block; a terracotta pot with a pothos for the special
FIGHTS WITH:   rolling-pin pokes and vine lashes (light chain), SHEET-PAN SLAM — a tray of cookies brought down overhead (heavy), the tray held up as a shield (block), and POTHOS OVERGROWTH — she slams a plant pot down and a ring of vines and heart-shaped leaves erupts around her (special)
EFFECT:        curling green pothos vines with heart-shaped leaves, and warm gold flour-sparkle and crumbs — leafy and sweet, never sharp
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: NOA — as in the card above, and
> **the face, hair and expression of the person in the attached photo** — a baker who grows plants, playful and sharp.
> Show, left to right: full-body front view, full-body three-quarter view facing right, full-body side view facing
> right, a large head close-up, and a swatch strip of the palette. Identical proportions in every view. Save as
> `docs/refs/noa-sheet.png`.

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

## Step B — the 12 action files (`public/assets/generated/actions/noa/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a relaxed baker's guard, rolling pin in the right hand, a pothos vine curled loosely around the left forearm: 1 stance, 2 breath in, 3 taps the rolling pin on her palm, 4 the vine's leaves lift, 5 weight shifts, 6 a hoop earring catches a glint, 7 a puff of flour off the pin, 8 breath out, 9 settles into frame 1. Same height throughout. |
| `walk.png` | **walk** — a light, confident walk, rolling pin swinging, vine trailing: one full stride cycle in which **the two legs take turns leading — frames 1–4 the LEFT leg swings forward, plants and passes; frames 5–8 the RIGHT leg; frame 9 returns to frame 1. Both legs must lead once per cycle; the same leg is never in front in every frame.** Sneakers on the baseline, arms counter-swinging, hair bouncing. |
| `dash.png` | **dash** — **1–2** a crouch and an explosive push-off, hair flying; **3–7 a full-speed run in which the legs cycle — 3 right leg driving, 4 legs passing, 5 LEFT leg driving, 6 passing, 7 right again — never one stride pose repeated**, green leaf-streaks behind her (never in front); **8–9** a skidding stop with the rolling pin thrust forward. |
| `light1.png` | **light1** — the rolling-pin poke: 1 guard, 2 shoulder loads, **3–4 the rolling pin jabs straight out with a small puff of flour and a gold spark at the tip**, 5 pulls back, 6–8 reset, 9 guard. Nine crisp beats. |
| `light2.png` | **light2** — the vine lash that follows: 1 guard, 2 the left arm rises, **3–5 a pothos vine whips out from her forearm across at head height leaving a short green arc of heart-shaped leaves**, 6 contact, 7 the vine recoils, 8 recover, 9 guard. The vine stays inside the cell. |
| `light3.png` | **light3** — chain finisher: 1 drops low, **2–7 a full 360° spin with the vine swung out, drawing a complete ring of green leaves around her**, the ring bursting into leaves and gold crumbs on 7, 8 lands, 9 guard. Ring inside the cell. |
| `heavy.png` | **heavy** — SHEET-PAN SLAM: **1–3** slow wind-up — she pulls a baking tray of golden cookies from behind her back and raises it overhead with both hands, **4** the body uncoils, **5–6 the tray slams down in front of her with a big gold crumb-burst, cookies flying**, 7–9 long recovery, catching one cookie and tucking the tray away. |
| `special.png` | **special** — POTHOS OVERGROWTH: **1–2** plants her feet and lifts a small terracotta pot with a pothos in it, green light glowing in the leaves, 3 slams the pot down, **4–7 a 360° ring of pothos vines and heart-shaped leaves erupts outward from her feet, the ring growing each frame but never reaching the cell edge**, flour-gold sparkles in it, 8 the vines settle, 9 guard, rolling pin in hand. |
| `block.png` | **block** — **frame 1 is the held guard** — the baking tray held up in front of her like a shield, chin tucked, feet planted, full figure at full height (the game shows only frame 1 while blocking); 2–9 small flinches with gold sparks and a few crumbs as hits ring off the tray; never leaves the ground. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, hair flying, still on the feet (a light hit shows frames 1 and 3); **4–6 heavy reel**: staggers back on her heels, arms wide, vine flailing, still on the feet (a heavy hit shows 4 and 6); **7–9 airborne crumple**: knocked off the feet, curling in the air (a launch shows 7 and 9). |
| `knockdown.png` | **knockdown** — 1 stagger, 2 falls backward, **3–6 on the floor** — on her back, hair spread, rolling pin beside her, **frame 6 flat and still** (the game holds it while down), 7 rolls to a side, 8 pushes up to one knee, **9 back on the feet at full height** in the guard stance. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches her chest, 3 drops to a knee, 4–6 topples sideways, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on her side, rolling pin and a few leaves on the floor beside her). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Step C — hero-select card (`public/assets/generated/heroes/noa-card.png`)

> Pixel-art hero-select portrait, 1024×1024 square, **true transparent background (real alpha channel — not a painted
> checkerboard)**. [STYLE BLOCK] Character exactly as in the attached character sheet. NOA — waist-up, three-quarter
> view facing right, the knowing half-smile, rolling pin on the shoulder, a pothos vine curling up her arm and green
> leaves (#4CAF50) with gold crumbs (#F2C46B) swirling behind. Big, readable, centred, nothing touching the canvas edge.

## Accept

```bash
npm run intake:character -- noa        # container only: background → alpha, canvas → 2048²
npm run verify:character -- noa
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the build is run;
regenerate only the file it names. The build prints `hero noa ok (actions)` once the set is complete.
