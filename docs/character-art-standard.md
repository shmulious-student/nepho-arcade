# Character art standard — the one template for every future character

This is the canonical spec and prompt kit for generating a character (hero, enemy or boss) for
Nepho. It replaces guesswork with the exact rules the build, the gate and the renderer depend on,
distilled from the set that came out right first time — **Eviatar** (`actions/eviatar/`, 12 files) —
and from every fix that was needed on the sets that did not.

Two things are non-negotiable:

1. Every set is generated **from this document**, with the blocks below pasted verbatim.
2. Every set is accepted only when it passes the machine gate **before** anything is built:

```bash
npm run verify:character -- <id>       # holds every file and every cell to this standard
npm run build:assets && npm run test:assets
```

then watched in motion on `/showcase.html?row=<action>` or `/backoffice.html` (action picker).
Eviatar passes `verify:character` clean; that is the bar.

---

## 1. Delivery format

```
public/assets/generated/actions/<id>/<action>.png
```

| | |
|---|---|
| Canvas | **2048×2048** PNG, square power of two. (1024² is accepted by the gate but visibly softer — do not settle for it.) |
| Layout | **3×3 grid = 9 frames**, read left→right, top→bottom. Each cell is 682×682. Nothing else on the canvas: no lines, borders, labels, numbers, swatches. |
| Alpha | **Real alpha channel.** The outer 4 px ring of the canvas is fully transparent, the background is alpha 0 everywhere. No painted checkerboard, no white/grey/black/coloured matte. If a model truly cannot output alpha, use flat **pure magenta #FF00FF** and say so — the build keys it — but never a magenta **grid**: guide lines drawn on the matte survive keying and land inside frames. |
| Files per rank | **Hero 12**: `idle walk dash light1 light2 light3 heavy special block hurt knockdown defeat` · **Enemy 10**: `idle walk attack heavy special guard hurt knockback getup defeat` · **Boss 6**: `idle approach attack special hurt defeat` |
| Completeness | A set is one delivery, one style, one session. The build switches to the per-action format only when **every** file is present; a partial delivery is applied as row overrides on the old art and the character ships with **two outfits mixed** (this happened to Omri). Deliver all files, in one look, or none. |
| Figure size | The standing figure fills **55–75 % of the cell height** and is the **same size in every file** (the gate allows ±12 %; Omri's old `block.png` was 24 % smaller than his other files and was caught). |
| Anchor | **Identical bottom-centre anchor in all 9 cells**: feet on one baseline, body on one vertical axis. The renderer aligns frames on their feet; a drifting baseline reads as sliding or bobbing. |
| Facing | The character faces **right** in every frame of every file. The renderer mirrors. |
| Margin | Generous empty margin inside every cell. Hands, feet, hair, weapons, trails, blasts, splats: **nothing touches or crosses a cell line.** Art that ends in a hard straight edge at a cell line is rejected cell by cell (rainbow-oracle's `heavy` beam was cut in 4 of 9 cells and had to be repaired by hand). |
| Ground | **No painted ground shadow, no floor, no dust ellipse under the feet.** The game draws the shadow itself; a painted one becomes a detached blob that slides with the frame (kicker). |
| Effects | Attached to the action, contained in the cell, never swallowing the silhouette. Detached props are fine when they are part of the action (a dropped marker, a thrown ball, flying notes). |
| Frames | **9 distinct poses.** Never pad a row by repeating a frame (abyss-dragon and storm-colossus `idle` each shipped duplicate frames — the gate now catches identical frames). |
| Identity | Same face, hair, costume, palette and props in all 9 frames of all files. The face stays coherent and unobstructed on heroes: a player photo is composited over it and the head is auto-detected from skin tones. |

---

## 2. Session protocol (how to run the generation)

1. **Write the character card** (section 3). Fix the palette in hex. Fix the props. Fix the attack
   style. Do not improvise later.
2. **Attach `public/assets/references/hero-grid-quality-reference.png` to every request** — it is
   the render style. For a hero drawn from a photo, attach the photo to every request too.
3. **Step A — character sheet first.** One request, 2048×1024, transparent: front, three-quarter
   facing right, side facing right, head close-up, palette swatch strip. Check the likeness and the
   costume. Save it under `docs/refs/<id>-sheet.png`.
4. **Attach the sheet to every Step B request.** This is what stops the design drifting between
   files. Keep the whole character in one chat/session.
5. **Step B — one action per request**, filename = action name, the FRAME BLOCK verbatim plus that
   action's beats from section 4. Never ask for two actions in one image.
6. After each file: `npm run verify:character -- <id>`. It names the file and the cell. Regenerate
   only that file, with the offending rule repeated and **bolded** in the prompt.
7. When all files pass: `npm run build:assets && npm run test:assets`, then watch every row on
   `/showcase.html`. Only then commit.

---

## 3. Character card (fill in, keep for every request)

```
ID:            <id>                      (lowercase, hyphens; this is the folder and the code id)
RANK:          hero | enemy | boss
NAME:          <display name>
BUILD:         <age if a kid, height, build — e.g. "9-year-old boy, medium height, thin and wiry">
FACE:          <hair shape and colour, brows, eyes, expression, skin tone — from the photo if any>
OUTFIT:        <every garment, its colour, and the accent details>
PALETTE:       <3–5 hex values: primary, secondary, skin, hair, effect colour>
PROPS:         <each prop, colour, which hand, how it moves>
FIGHTS WITH:   <the attack vocabulary — what light/heavy/special physically are>
EFFECT:        <what the magic/effect looks like and its colour — one idea, used everywhere>
```

Eviatar, for reference: 11-year-old, tall and strong; short dark-brown hair cropped at the sides with a
textured fringe, calm half-smile, light-olive skin; sleeveless green jersey (#3DDC84) with blue side
panels (#37AAFF) and a blue 11, blue shorts with a green stripe, green-and-blue high-tops, blue
wristband; props: orange basketball, fat green and blue paint markers; fights with ball handling and
marker strokes; effect: glowing green/blue paint.

---

## 4. The prompt blocks — paste verbatim

### STYLE BLOCK (every request)

> Pixel-art fighting-game character, in the exact render style, outline weight, proportions and
> lighting of the attached reference sheet (`hero-grid-quality-reference.png`): clean dark outlines,
> 3–4 tone cel shading, saturated colours, readable silhouette, chunky hands and feet, head about
> 1/5 of body height. Character exactly as in the attached character sheet — same face, hair,
> costume, colours and props. The face stays coherent and unobstructed. No text, labels, numbers,
> borders, grid lines, UI, watermark, background, floor, shadow, scenery or extra characters
> anywhere in the image.

### FRAME BLOCK (every action request — the bold lines are the ones models drop)

> Pixel-art fighting-game character animation sheet: a **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent background (real
> alpha channel — not a painted checkerboard, not a matte colour, and no grid lines or cell borders
> drawn on the canvas)**. [STYLE BLOCK] The character faces RIGHT in every frame. **Identical
> bottom-centre anchor in all 9 cells: feet on the same baseline, body on the same vertical axis,
> the figure the same size as in every other file of this character, filling about two thirds of the
> cell height. Generous empty margin inside each cell — hands, feet, hair, props and effects never
> touch or cross a cell boundary. No ground shadow or floor under the feet.** Each of the 9 frames
> is a distinct pose; never repeat a frame. Action: **<ACTION>** — <the 9 beats from section 4>.

### The 9 beats per action — and what the game does with each row

The renderer plays rows by position, so the beat structure is part of the contract, not a
suggestion. "Frames 1–9" below are the 9 cells in reading order.

**Every rank**

| action | beats | the game |
|---|---|---|
| `idle` | a subtle breathing/guard loop: small weight shifts, prop movement, an effect flicker; frame 9 leads back into frame 1. Same height throughout. | loops all 9 |
| `walk` | a full stride cycle: 8 steps plus a return frame, springy, props moving in time; frame 9 leads back into frame 1. Feet on the baseline. | loops all 9 |
| `hurt` | **1–3 flinch** (upright, head snaps back), **4–6 heavy reel** (staggers back, still on feet), **7–9 airborne crumple** (knocked off the feet, curling). | hero: light hit 1+3, heavy hit 4+6, stunned 1·3·1·4, launched 7+9 · enemy: grounded hit 1–6, stunned 1–2, launch uses `knockback` |
| `defeat` | upright in frame 1 → drops → topples → **frames 8–9 flat on the ground and settled**, identical pose, staying down. **The lying figure is the same size as the standing one — it lies flat, it does not shrink or move away.** | plays through, holds frame 9 for as long as the body stays |

**Hero (12)**

| action | beats |
|---|---|
| `dash` | **1–2** crouch-and-plant, explosive push-off; **3–7 a blurred full-speed run** (speed streaks behind, never in front) — the game loops these while the dash is held; **8–9** the lunge/skid stop — the game shows 7 and 9 as the dash-attack hit. |
| `light1` | the first jab of the chain: raise, stab, contact with a small effect burst, pull back, ready. Fast and crisp. |
| `light2` | the follow-up cross: shoulder turn, the strike whips across at head height leaving an arc, contact, follow-through, recover. Reads as a continuation of `light1`. |
| `light3` | chain finisher: a 360° spinning breaker drawing a full circle of effect around the character, bursting outward on the last frames. Hits all around. |
| `heavy` | slow wind-up (1–3) → committed power blow with the big impact on frame 5–6 → long recovery (7–9). May leave the ground. |
| `special` | the signature move from the card: plant (1–2), release grows over 3–7, burst, recover. The effect is this character's colour. |
| `block` | **frame 1 is the held guard** — prop as a shield if there is one, feet planted, full height (the game shows only frame 1 while blocking); frames 2–9 small flinches as hits land, for later use. Never leaves the ground. |
| `knockdown` | **1–2** stagger and fall backward, **3–6 on the floor** (frame 6 the flattest — the game holds it while down), **7–8** rolling up to one knee, **frame 9 back on the feet at full height** (the game plays 6·7·9 as the get-up). |

**Enemy (10)**

| action | beats |
|---|---|
| `attack` | the basic strike: wind-up (1–3), active hit on 4–5 with a contact effect, recovery (6–9). |
| `heavy` | the slow telegraphed blow: long wind-up (1–4), impact 5–6, long recovery. |
| `special` | the enemy's one trick (a charge, a whip, a blast): telegraph, release, recover. |
| `guard` | braced defensive stance held; small flinches as hits land; feet planted. |
| `knockback` | stagger → thrown off the feet → airborne (1–5) → **lands and lies flat on the floor by frame 6–7**. Frames after the floor may start to rise or stay flat — the game holds the floor frame while the enemy is down; the rise is `getup`. **There must be a flat frame.** |
| `getup` | **starts on the floor (frame 1 is the lowest frame)** and rises monotonically: floor → hands and knees → one knee → **frame 9 standing at full height**. Never dip first (the older enemies were drawn kneel→flat→kneel and had to be remapped). |

**Boss (6)**

| action | beats |
|---|---|
| `approach` | the boss's advance: a heavy walk, a hover, a stalk — a loop, frame 9 leading into frame 1. |
| `attack` | the main strike: telegraph clearly (1–3), hit (4–6), recover (7–9). Big and readable at a distance. |
| `special` | unmistakably different from `attack`: a wider, slower, more spectacular release with its own effect. |

---

## 5. Acceptance checklist

Automated — `npm run verify:character -- <id>` fails on any of these, naming the file and cell:

- missing or misnamed action file; canvas not square/power-of-two; background not real alpha or
  border not clear; grid guide lines on the canvas
- an empty cell; art cut off at a cell edge; a dark flat blob painted under the feet
- two frames in one file that are the same pose; a frame drawn at a fraction of the row's size (a
  fallen figure lies flat, it does not shrink)
- feet off the row's baseline or the body off the row's axis in a grounded row
- the figure a different size in one file than in the others
- `defeat` not ending flat and settled; enemy `knockback` with no flat frame; `getup` dipping before
  it rises or not ending upright; hero `knockdown` never flat or not ending upright; `hurt` frames 1–3
  not upright

Then `npm run build:assets && npm run test:assets` (the build's own gate: shape, alpha, cut cells,
atlas integrity, pack size).

By eye, on `/showcase.html` (every row, at speed) — the things no gate can judge:

- **Likeness and identity**: same person/creature in every file; face readable; costume never
  changes between files.
- **Motion**: idle breathes, walk strides (no moonwalk, no popping), dash reads as speed, each attack
  has a clear wind-up → hit → recover, the special is obviously the special.
- **Style**: matches the reference sheet's outline weight and shading; no photo-real or painterly
  drift; no blur.
- **Effects**: the character's colour, attached to the action, not hiding the figure.

---

## 6. Why each rule exists — the failure catalogue

Everything above was learned the hard way. Keep this list; every new failure gets a rule and, where
the machine can see it, a check.

| what shipped | rule it produced | caught by |
|---|---|---|
| Magenta grid guide lines on punk's `special`/`getup`/`defeat` → 181-px crosshair boxes in the first frame of each row | "no grid lines or cell borders drawn on the canvas"; build strips them | `verify-character`, build |
| Baked checkerboard on the original kicker grid, then a grey halo after keying | real alpha only; light-matte fringe scrub per character | `verify-character`, `art-overrides.json` |
| Painted ground shadows under kicker's feet, sliding with the frame | "no ground shadow or floor"; legacy grids drop foot-level debris | `verify-character`, build |
| rainbow-oracle `heavy`: beam cut flat at the cell edge in 4 cells → held frames | "generous margin, nothing touches a cell line"; the gate rejects cut cells | `test:assets`, `verify-character` |
| Per-action `knockback` rows ending with the enemy standing again → shown standing while "down", then snapping to a lying getup | floor frame required; build measures it, renderer holds it | `verify-character`, build `poses` |
| Legacy `getup` rows drawn kneel → flat → kneel → snap to idle | "starts on the floor and rises"; renderer plays only the rise | `verify-character`, build `poses` |
| `hurt` rows ending in an airborne crumple shown on every light tap | flinch/reel/crumple structure; renderer plays 1–6 for grounded hits | `verify-character`, renderer |
| Omri delivered 3 of 12 files in a new outfit → two outfits in one atlas | one delivery, one look, all files | protocol |
| Omri's old `block.png` figure 24 % smaller than his other files | same size in every file (±12 %) | `verify-character` |
| abyss-dragon / storm-colossus `idle` padded with repeated frames | 9 distinct poses | `verify-character` |
| prism-queen `defeat` never lies down → boss "dies" standing | defeat ends flat and settled | `verify-character` |
| prism-queen `defeat` regenerated with frames 7–9 drawn at a quarter of the size | same figure size in every frame of a row; the build rejects a frame under 55 % of the row's area | `verify-character`, build |
| Legacy 6-frame rows with 3 distinct poses drawn twice each | 9 distinct frames per row | `verify-character` |
| Byte's grids delivered as a copy of another hero | identity from a character sheet, checked at review | build warns, review |
| Bosses on legacy grids losing 1–3 frames whose figure is mostly missing (`partial-figure`) | every cell holds the whole figure; empty/partial cells rejected | `verify-character`, build |
| Figures too small to read at game scale | fill 55–75 % of the cell height | `verify-character` (note) |
| A matte colour requested from a model that cannot do alpha, delivered with grid lines on the matte | magenta matte only as a last resort, and never with lines | `verify-character` |

---

## 7. Worked example — a new enemy in one sitting

```
ID: ash-wraith   RANK: enemy   NAME: Ash Wraith
BUILD: tall, gaunt, hunched, floats an inch off the ground on a trail of embers
FACE: hollow hood, two ember eyes, no visible mouth
OUTFIT: tattered charcoal-grey shroud (#3A3A44) with glowing orange cracks (#FF7A2A), ash-white bandaged hands (#E8E4DC)
PALETTE: #3A3A44 #FF7A2A #E8E4DC #1B1B22 #FFC470
PROPS: none — the embers are the weapon
FIGHTS WITH: raking claws (attack), a two-handed slam (heavy), a lunge that leaves an ember trail (special)
EFFECT: orange embers and grey ash puffs, always trailing right-to-left behind the movement
```

Step A: the sheet. Step B: ten requests — `idle` … `defeat` — each `[FRAME BLOCK] Action: **idle** —
<beats>`. After each: `npm run verify:character -- ash-wraith`. When it prints `PASS`, the id goes
into `src/sim/enemyAi.ts` (stats), `tools/build-assets.mjs` (`ENEMY_IDS`) and `src/net/codec.ts`
(`ARCH_TABLE`), the build runs, and the character is placed on levels in `/backoffice.html`.
