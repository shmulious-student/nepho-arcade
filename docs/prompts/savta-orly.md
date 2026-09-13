# SAVTA ORLY (`savta-orly`) — hero, 12 files + hero card

## Status — queue position 1 of 14 · 14 image requests (Step A sheet + 12 action files + hero card)

New hero, drawn from photos of a real person — added to the queue on 2026-09-13, next in line. No art exists yet.
**Likeness is the point**: the face on the sheet must be recognisably Orly from the photos in
`docs/refs/savta-orly-source/` (`orly-1.png` is there — one clear frontal photo is sufficient for likeness; any further stills dropped in that folder are attached too). Heroes carry two extra rules: the **face stays clear and unobstructed in every frame** (a player photo
can be composited over it), and the **hero-select card** is a separate square image.

Done means `npm run verify:character -- savta-orly` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render style) and the
identity references: the photos in `docs/refs/savta-orly-source/` (`docs/refs/savta-orly-source/orly-1.png`, `docs/refs/savta-orly-source/orly-2.png`, … — as many stills as there are; a frontal smiling one and a three-quarter one at minimum). Do Step A (the character sheet) first and attach it to every action request too.

## Character card

```
ID:            savta-orly
RANK:          hero
NAME:          SAVTA ORLY
BUILD:         woman in her late sixties, short-to-medium height, soft rounded build, upright and energetic
FACE:          shoulder-length layered honey-blonde hair with a full straight fringe, thin gold-rimmed round glasses, a warm gentle smile with soft laugh lines, light-tan skin, small silver hoop earrings — the face stays clear and unobstructed (a player photo is composited over it)
OUTFIT:        dusty-blue short-sleeved V-neck blouse (as in the photo), a cream apron with a thin gold trim and a big front pocket tied over it, dark comfortable trousers, soft beige house slippers
PALETTE:       blouse #5B84B1, apron #F3E7C9, trim / soup gold #FFC246, hair #C9A46A, skin #D9A27A, effect gold #FFC246 with white steam
PROPS:         a long wooden spoon in the right hand (her weapon); one slipper comes off the foot for the heavy; a big steel soup pot with a lid appears for the special and the block
FIGHTS WITH:   spoon pokes and whacks (light chain), a flying-slipper slap (heavy), a pot-lid held up as a shield (block), and SOUP STORM — a pot of golden chicken soup she swings in a full circle, splashing everyone around her (special)
EFFECT:        golden soup splashes and white steam curls, always warm and round, never sharp
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: SAVTA ORLY — as in the card
> above, and **the face, hair and expression of the person in the attached photos** — a savta, kind and formidable. Show, left to right:
> full-body front view, full-body three-quarter view facing right, full-body side view facing right, a large head
> close-up, and a swatch strip of the palette. Identical proportions in every view. Save as `docs/refs/savta-orly-sheet.png`.

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

## Step B — the 12 action files (`public/assets/generated/actions/savta-orly/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a grandmother's ready stance: 1 feet apart, spoon held like a baton, 2 breath in, 3 taps the spoon on her palm, 4 glasses catch a glint, 5 weight shifts, 6 apron settles, 7 a little steam curl off the spoon, 8 breath out, 9 settles into frame 1. Same height throughout. |
| `walk.png` | **walk** — a brisk, purposeful walk, spoon swinging: one full stride cycle in which **the two legs take turns leading — frames 1–4 the LEFT leg swings forward, plants and passes; frames 5–8 the RIGHT leg; frame 9 returns to frame 1. Both legs must lead once per cycle.** Slippers on the baseline, arms counter-swinging, apron bouncing. |
| `dash.png` | **dash** — **1–2** a crouch and an explosive push-off, apron flying; **3–7 a full-speed run in which the legs cycle — 3 right leg driving, 4 legs passing, 5 LEFT leg driving, 6 passing, 7 right again — never one stride pose repeated**, gold steam streaks behind her (never in front); **8–9** a skidding stop with the spoon thrust forward. |
| `light1.png` | **light1** — the spoon poke: 1 guard, 2 shoulder loads, **3–4 the spoon jabs straight out with a small gold splash at the tip**, 5 pulls back, 6–8 reset, 9 guard. Nine crisp beats. |
| `light2.png` | **light2** — the spoon whack that follows: 1 guard, 2 arm rises, **3–5 the spoon whips down and across at head height leaving a short gold arc**, 6 contact, 7 follow-through, 8 recover, 9 guard. |
| `light3.png` | **light3** — chain finisher: 1 drops low, **2–7 a full 360° spin with the spoon out, drawing a complete ring of gold soup-drops around her**, bursting into splashes on 7, 8 lands, 9 guard. Ring inside the cell. |
| `heavy.png` | **heavy** — THE SLIPPER: **1–3** slow wind-up — she slips the right slipper off into her hand and rears back, **4** the body uncoils, **5–6 the slipper flies forward in a straight line with a gold impact star where it lands** (slipper inside the cell), 7–9 long recovery, hopping to put the slipper back on. |
| `special.png` | **special** — SOUP STORM: **1–2** plants her feet and lifts a big steaming soup pot in both hands, gold light in it, 3 the pot swings back, **4–7 a full circle of golden soup flies out around her, the splash ring growing each frame but never reaching the cell edge**, white steam everywhere, 8 the pot empties, 9 guard, spoon back in hand. |
| `block.png` | **block** — **frame 1 is the held guard** — the pot lid held up in front of her like a shield, chin tucked, feet planted, full figure at full height (the game shows only frame 1 while blocking); 2–9 small flinches with gold sparks as hits ring off the lid; never leaves the ground. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, glasses slipping, still on the feet (a light hit shows frames 1 and 3); **4–6 heavy reel**: staggers back, arms wide, spoon flailing, still on the feet (a heavy hit shows 4 and 6); **7–9 airborne crumple**: knocked off the feet, curling in the air (a launch shows 7 and 9). |
| `knockdown.png` | **knockdown** — 1 stagger, 2 falls backward, **3–6 on the floor** — on her back, apron spread, **frame 6 flat and still** (the game holds it while down), 7 rolls to a side, 8 pushes up to one knee with the spoon, **9 back on the feet at full height** in the guard stance. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches her chest, 3 drops to a knee, 4–6 topples sideways, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on her side, spoon on the floor beside her). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Step C — hero-select card (`public/assets/generated/heroes/savta-orly-card.png`)

> Pixel-art hero-select portrait, 1024×1024 square, transparent background. [STYLE BLOCK] Character exactly as in
> the attached character sheet. SAVTA ORLY — waist-up, three-quarter view facing right, big warm smile, wooden spoon raised, golden soup splash (#FFC246) and steam swirling behind. Big, readable, centred, nothing touching the canvas edge.

## Accept

```bash
npm run intake:character -- savta-orly        # container only: background → alpha, canvas → 2048²
npm run verify:character -- savta-orly
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the build is run;
regenerate only the file it names. The build prints `hero savta-orly ok (actions)` once the set is complete.
