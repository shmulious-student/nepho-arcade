# SABA KOBI (`saba-kobi`) — hero, 12 files + hero card

## Status — queue position 1 of 12 · round two in progress · 9 image requests left

**Accepted and verified (blue jeans, younger look, unique files, gate-clean):** `docs/refs/saba-kobi-sheet.png`,
`idle.png`, `walk.png`, `light1.png`, `light3.png`. **To make:** `dash light2 heavy special block hurt knockdown defeat`
and the hero card. Round one (older face) is under `backups/replaced/saba-kobi-round1-*/`; round-two rejects
(olive trousers, byte-copies) under `saba-kobi-round2-bad-*/` — reuse nothing from either.

**Why round two stalled:** six times a "new" action file was a byte-copy of the previous generation — the save step
wrote the wrong image. The protocol in `codex-kobi-noa.md` exists to make that impossible: save from the path the
image tool just returned, then md5 the saved file against the source and against every sibling before intake.

Done means `npm run verify:character -- saba-kobi` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render style) and the
identity reference: `docs/refs/saba-kobi-source/kobi-1.png` (frontal, grinning — the face to match; one clear frontal photo is sufficient, and any further stills in that folder are attached too). Do Step A (the character sheet) first and attach it to every action request too.

## Character card

```
ID:            saba-kobi
RANK:          hero
NAME:          SABA KOBI
BUILD:         man in his early sixties, medium height, broad chest and shoulders, a solid comfortable build, straight-backed and vigorous — **draw him younger than the photo reads: fit, not frail**
FACE:          short cropped salt-and-pepper hair (more pepper than salt), thick dark brows over bright deep-set eyes, a huge warm grin with dimples, tanned skin with laugh lines but **few wrinkles — smooth forehead and cheeks, no sagging; he should read as a strong 60, not 75**, strong jaw — the face stays clear and unobstructed (a player photo is composited over it)
OUTFIT:        cream off-white crew-neck t-shirt with a small stitched hexagon badge on the chest (as in the photo), a black cross-body bag strap with a pair of sunglasses hooked on it, dark blue jeans with a brown belt, brown leather sandals
PALETTE:       shirt #F2EBDD, strap #1C1C1E, jeans #2B3F73, belt / board wood #8B5A2B, skin #C98E63, hair #9A9A9A, effect orange #FF8C42 with cream dice #F6F0E4
PROPS:         a tightly rolled newspaper in the right hand (his weapon); a folding shesh-besh (backgammon) board appears for the special and the block; two dice
FIGHTS WITH:   newspaper swats and pokes (light chain), a bear-hug slam — he grabs the air and slams down (heavy), the folded board held up as a shield (block), and SHESH-BESH — he slams the open board on the ground and a shockwave of orange light and flying dice rings out (special)
EFFECT:        warm orange shock rings and bouncing cream dice with black pips; a big laugh is part of every move
```

## Step A — character sheet

> Character design sheet, 2048×1024, transparent background. [STYLE BLOCK] Character: SABA KOBI — as in the card
> above, and **the face, hair and expression of the person in the attached photos, drawn a decade younger — fit and vigorous, few wrinkles, more dark in the hair** — a saba, warm and unbeatable. Show, left to right:
> full-body front view, full-body three-quarter view facing right, full-body side view facing right, a large head
> close-up, and a swatch strip of the palette. Identical proportions in every view. Save as `docs/refs/saba-kobi-sheet.png`.

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

## Step B — the 12 action files (`public/assets/generated/actions/saba-kobi/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `idle.png` | **idle** — a saba's relaxed guard: 1 feet apart, newspaper resting on the shoulder, 2 breath in, 3 taps the paper on his palm, 4 the grin widens, 5 weight shifts, 6 rolls a shoulder, 7 a die flicks up and lands back in his hand, 8 breath out, 9 settles into frame 1. Same height throughout. |
| `walk.png` | **walk** — an easy, confident stroll, newspaper swinging: one full stride cycle in which **the two legs take turns leading — frames 1–4 the LEFT leg swings forward, plants and passes; frames 5–8 the RIGHT leg; frame 9 returns to frame 1. Both legs must lead once per cycle.** Sandals on the baseline, arms counter-swinging. |
| `dash.png` | **dash** — **1–2** a crouch and an explosive push-off; **3–7 a full-speed run in which the legs cycle — 3 right leg driving, 4 legs passing, 5 LEFT leg driving, 6 passing, 7 right again — never one stride pose repeated**, orange speed streaks behind him (never in front); **8–9** a skidding stop, newspaper thrust forward like a sword. |
| `light1.png` | **light1** — the newspaper poke: 1 guard, 2 shoulder loads, **3–4 the rolled paper jabs straight out with a small orange spark at the tip**, 5 pulls back, 6–8 reset, 9 guard. Nine crisp beats. |
| `light2.png` | **light2** — the swat that follows: 1 guard, 2 arm rises, **3–5 the newspaper whips across at head height leaving a short orange arc**, 6 contact, 7 follow-through, 8 recover, 9 guard. |
| `light3.png` | **light3** — chain finisher: 1 drops low, **2–7 a full 360° spinning swat drawing a complete ring of orange light around him**, the ring bursting into flying dice on 7, 8 lands, 9 guard. Ring inside the cell. |
| `heavy.png` | **heavy** — THE BEAR HUG: **1–3** slow wind-up — arms spread wide, grinning, leaning back, **4** he lunges, **5–6 both arms slam down and together in a crushing hug with a big orange impact burst at chest height**, 7–9 a long recovery, straightening up and dusting his hands. |
| `special.png` | **special** — SHESH-BESH: **1–2** plants his feet and unfolds a backgammon board over his head, orange light gathering on it, 3 it swings down, **4–7 the board slams the ground and a 360° shockwave of orange light explodes outward with cream dice flying, the ring growing each frame but never reaching the cell edge**, 8 the light fades, dice landing, 9 guard, newspaper back in hand. |
| `block.png` | **block** — **frame 1 is the held guard** — the folded board held up in front of him like a shield, chin tucked, feet planted, full figure at full height (the game shows only frame 1 while blocking); 2–9 small flinches with orange sparks as hits knock on the board; never leaves the ground. |
| `hurt.png` | **hurt** — **1–3 flinch**: head snaps back, grin gone, still on the feet (a light hit shows frames 1 and 3); **4–6 heavy reel**: staggers back on his heels, arms wide, still on the feet (a heavy hit shows 4 and 6); **7–9 airborne crumple**: knocked off the feet, curling in the air (a launch shows 7 and 9). |
| `knockdown.png` | **knockdown** — 1 stagger, 2 falls backward, **3–6 on the floor** — on his back, newspaper beside him, **frame 6 flat and still** (the game holds it while down), 7 rolls to a side, 8 pushes up to one knee, **9 back on the feet at full height** in the guard stance, grinning again. |
| `defeat.png` | **defeat** — 1 upright, struck, 2 clutches his chest, 3 drops to a knee, 4–6 topples sideways, 7 lands, **8–9 both flat on the ground in the same lying position, staying down — drawn as two separate frames with a small visible settle between them (the head drops, an arm slumps), never a copied frame: the gate rejects two identical cells** (on his side, newspaper and dice on the floor beside him). The lying figure is the same size as the standing one — full length across the cell, never shrunk. |

## Step C — hero-select card (`public/assets/generated/heroes/saba-kobi-card.png`)

> Pixel-art hero-select portrait, 1024×1024 square, transparent background. [STYLE BLOCK] Character exactly as in
> the attached character sheet. SABA KOBI — waist-up, three-quarter view facing right, huge grin, rolled newspaper on the shoulder, an orange shock ring (#FF8C42) and a pair of cream dice flying behind. Big, readable, centred, nothing touching the canvas edge.

## Accept

```bash
npm run intake:character -- saba-kobi        # container only: background → alpha, canvas → 2048²
npm run verify:character -- saba-kobi
npm run build:assets && npm run test:assets
```

Then every row on `/showcase.html?row=<action>`. `verify:character` must print `PASS` before the build is run;
regenerate only the file it names. The build prints `hero saba-kobi ok (actions)` once the set is complete.
