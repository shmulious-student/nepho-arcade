# Asset regeneration prompts

> For any **new character**, use [character-art-standard.md](./character-art-standard.md) — the canonical prompt kit and acceptance gate. This page keeps the per-file prompts for repairing the older grids.

This machine has no image-generation API, so these are written to hand to any image model (or the
same pipeline that produced the rest of the pack). Drop a corrected file into
`public/assets/generated/` at the path shown, run `npm run build:assets`, then `npm run test:assets`
— the pipeline picks it up automatically and the gate confirms it passes. Nothing else in the code
needs to change; character identity, row order, and frame count are all read from the files.

Every grid must meet `docs/asset-quality-standard.md`: true RGBA transparency (no checkerboard, no
colored matte baked into the pixels), large game-readable frames with clean separation between cells,
consistent anatomy/costume/palette/facing/bottom-center anchor across the whole set, and clearly
distinct poses per action — no repeated idle frame standing in for a missing action.

---

## The per-action format (current target)

One image per character **per action**, holding a **3×3 grid of 9 animation frames** read row-major
(top-left → top-right, then down). Each file is a **square power-of-two canvas** — **2048×2048**,
giving 682×682 px per frame, roughly the per-frame detail of
`public/assets/references/hero-grid-quality-reference.png` (543×724 per figure) with room for effects.

```
public/assets/generated/actions/<character-id>/<action>.png
```

Why per action: an action can be regenerated on its own without touching the rest of the character,
each file stays inside the resolution ceiling of most image models, and the 9 frames give visibly
smoother animation than the 6 the older grids carried.

**What the pipeline does with it.** `tools/build-assets.mjs` picks this format automatically the
moment `actions/<id>/` contains *every* action in that character's list. A partial set is applied as
row overrides on top of the character's older grid (that row gets 9 frames), which is how a single
broken action is repaired without regenerating the character. It cuts the 9 cells on fixed
thirds, isolates the figure, normalizes every frame to a shared bottom-center anchor, packs them into
a power-of-two atlas, and records a `renderScale` so the extra detail survives the game's 1.7× world
zoom instead of being thrown away at build time. Move timing is authored against a canonical 6-frame
row and remapped proportionally onto 9 — nothing needs re-authoring per character.

### Required action list

**Heroes** (12 files each, `actions/<hero>/…`):

| Action | Frames tell |
|---|---|
| `idle` | breathing guard-stance loop |
| `walk` | full walk/run cycle, loops seamlessly |
| `dash` | crouch-launch → speed-blurred run (frames 1–7 loop while held) → lunge stop |
| `light1` | first jab of the light chain |
| `light2` | second hit, a cross that reads as a follow-up to `light1` |
| `light3` | chain finisher: a 360° spinning breaker that hits all around |
| `heavy` | slow wind-up → committed power blow → long recovery |
| `special` | the hero's signature (see per-hero prompts), windup → release → recovery |
| `block` | guard held up, absorbing; small flinch, feet planted |
| `hurt` | flinch (frames 1–3), heavy reel (4–6), airborne crumple (7–9) |
| `knockdown` | stagger → fall → on the floor → rising to one knee → back on feet |
| `defeat` | final fall, ending flat on the ground and staying there |

**Bosses** (6 files each, `actions/<boss>/…`): `idle`, `approach`, `attack`, `special`, `hurt`,
`defeat`.

**Enemies** (10 files each, `actions/<enemy>/…`): `idle`, `walk`, `attack`, `heavy`, `special`,
`guard`, `hurt`, `knockback`, `getup`, `defeat`.

### Rules that apply to every file

- 2048×2048 RGBA, real alpha — background fully transparent, alpha 0, nothing painted in.
- 3×3 = 9 frames, read row-major. Every frame is a distinct pose; never pad with a repeated idle.
- The character faces **right** in every frame. The renderer mirrors for leftward movement.
- Identical bottom-center anchor in all 9 cells: feet land on the same baseline, body centered on the
  same vertical axis, so the figure does not slide or bob between frames.
- Generous empty margin inside each cell. Effects, hair, weapons, and trails must not touch or cross
  a cell boundary — the pipeline's gate rejects art that overlaps frame edges.
- Anatomy, costume, and palette identical to the character's other action files. Generate a character's
  actions in one session, from one description, so the design does not drift between files.
- The face stays visually coherent and unobstructed on heroes — an uploaded player portrait is
  composited over it at runtime, and the pipeline auto-detects the head position from the skin tones.
- No labels, text, UI, frame numbers, borders, scenery, or extra characters anywhere in the image.

### How a delivered set is verified

Drop the files in and run:

```bash
npm run build:assets && npm run test:assets
```

`build:assets` prints `hero <id> ok (actions)` when it picked the new set up (`(pair)`/`(grid)` mean
it is still on the older art — a file is missing or misnamed). `test:assets` then holds every
per-action file to the rules above and **fails the build**, naming the file and the cell, when:

- the canvas is not a square power-of-two, or the background is not real alpha transparency;
- a cell is empty;
- a cell's art is **cut off** — a figure pushed onto the cell line, or an effect ending in a hard
  straight edge near it (a slash arc chopped flat, a beam that stops dead, a fireball sliced in half).

The same defects in the older grids are listed as notes, not failures — that art is what ships until
it is regenerated, and this is the list of what regeneration fixes. The check was exercised both
ways: a clean synthetic set passes, and a set with one figure on the line and one sliced effect fails
on exactly those two cells.

What the build does with a defective frame it is forced to ship (older grids only): it never shows it.
The frame is replaced in the atlas by the nearest clean frame of the same row — a held pose instead of
a cut body — and the build writes `public/game/debug/defects-<id>.png` (rejected cell on the left,
its stand-in on the right) plus `defects-<id>.txt` listing why each was rejected. Slicing itself never
cuts anything: the sheet is segmented once, every blob of pixels goes whole to the frame that owns it,
and only debris the generator left behind (severed crumbs, a stray fragment behind the figure) is
discarded.

What none of this can judge is style and motion. Review a set in motion before accepting it:
`npm run dev` then open **`/showcase.html`** — every character plays each atlas row in turn at its
real anchor (`?row=knockback` starts everyone on one row), so sliding feet, popping and held frames
are obvious. `public/game/debug/anchors-<id>.png` is the same data as a static contact sheet.

### Prompt template

Fill in the character description and the per-frame beats:

> Pixel-art fighting-game character animation sheet. A 3×3 grid of 9 animation frames, read left to
> right then top to bottom, on a 2048×2048 canvas with a **true transparent RGBA background** (real
> alpha channel, not a painted checkerboard, not a matte color). Character: **<description —
> silhouette, hair, costume, palette, build>**. Match the render style, outline weight, and lighting
> of the attached reference (`public/assets/references/hero-grid-quality-reference.png`); the figure
> should fill roughly 70% of each cell's height. The character faces right in every frame. Identical
> bottom-center anchor in all 9 cells — feet on the same baseline, body on the same vertical axis.
> Generous empty margin inside each cell; effects and hair must never touch or cross a cell boundary.
> Action: **<action name>** — <the 9 beats, e.g. "wind-up shoulder drop, step in, fist cocked, launch,
> contact with impact flash, follow-through, over-extended, recovering, back to stance">. Every frame
> is a distinct pose. No text, labels, borders, UI, background scenery, or additional characters.

---

## Required now

**First: the two new lead heroes, Eviatar and Omri** — full pack with photo-based character sheets,
all 12 action prompts each and the hero cards in [hero-prompts-eviatar-omri.md](./hero-prompts-eviatar-omri.md).
They ship on recoloured stand-ins (Bruiser / Nepho) until their sets land.

**Second: the frames the quality pass rejected** — one per-action file per broken action (a partial
set patches just that row of the older grid) plus Byte in full: [fix-prompts-quality-pass.md](./fix-prompts-quality-pass.md).

Then three heroes and four bosses, at the per-action format above. Everything else keeps working on its
current art in the meantime — the pipeline falls back per character, so these can land one at a time.

Known defects in the art currently shipped (all baked into the source PNGs — the build hides them by
substituting a clean neighbouring frame, `npm run test:assets` lists them, and only regeneration
restores the missing frames):

- **Byte's grids are a copy of Riva's** (`hero-byte-grid-1/2.png` are pixel-identical to
  `hero-riva-grid-1/2.png`). The build detects this and hue-shifts her to pink so the roster stays
  distinct, but she needs her own set — see *Remaining characters* below for her description.
- Punk is the worst: `knockback` (5 of 6 frames — the flying body cropped by the cell, shoes severed),
  `defeat` (4 frames are legs only), `special`/`hurt` fireballs sliced in half. 15 frames held.
- Bruiser `knockdown`/`defeat`: bodies cut at the cell line with a detached glove drawn beside them
  (8 frames held). Knight `approach`: the thrust beam chopped flat (6 held).
- Nepho `heavy` frame 4 and `special` frames 3–4: the slash arc and the beam chopped flat.
- Every boss loses 1–3 frames whose figure is mostly missing (`ferryman attack/hurt/defeat`, …).

### Heroes

Match each hero's existing design; do not redesign them. Their current idle frames are the reference
for identity — `public/game/debug/anchors-<id>.png` shows every frame the game uses today.

**1. `actions/nepho/` — Nepho** (male, balanced, radial burst special)

> Character: a lean young male fighter, spiky black hair, sleeveless dark-navy tunic over dark
> trousers, wrapped forearms, a long teal scarf/cape that trails behind him, teal energy accents.

His `special` is a radial burst: hands drawn to the chest gathering teal energy, then a 360° shockwave
of teal light exploding outward from him, then recovery. His `light3` finisher is a spinning teal
crescent slash around his whole body.

**2. `actions/bruiser/` — Bruiser** (male, heavy hitter, armored slam)

> Character: a very broad, heavyset male brawler, curly brown hair, orange armored bodysuit with
> segmented shoulder and knee plates over a dark grey undersuit, a metal belt buckle, huge fists.

His `special` is an armored slam: he plants, gathers orange fire around both fists, then drives them
down into the ground, throwing a burst of orange flame forward. He is slow and weighty — wind-ups take
more frames than the recovery.

**3. `actions/riva/` — Riva** (female, combo mobility, line dash)

> Character: an athletic young woman, long dark-brown hair in a high ponytail, white sports top,
> lime-green cargo pants with a dark panel down one leg, white trainers, fingerless gloves, lime-green
> energy accents.

Her `special` is a line dash: she coils, then rockets forward wrapped in a lime-green energy spiral,
leaving a trail. Her animation is faster and lighter than the other two — more frames of travel, fewer
of wind-up.

### Bosses

The four the player meets first, in level order. Use the current boss art as the design reference
(`public/game/portraits/<id>.webp` and `public/game/debug/anchors-<id>.png`). Bosses are larger and
heavier on screen than heroes: telegraph every attack clearly, and make `special` unmistakably
different from `attack`.

**4. `actions/ferryman/` — Ferryman** (level 1) — a tall hooded figure in a blue armored bodysuit with a
glowing blue energy blade; `special` is a wide sweeping arc of blue light.

**5. `actions/glass-warden/` — Glass Warden** (level 2) — a heavy armored warden of translucent glass and
steel plates, refracted highlights; `special` shatters a wall of glass shards forward.

**6. `actions/kilnheart/` — Kilnheart** (level 3) — a red-and-gold armored samurai wreathed in flame with a
burning blade; `special` is a downward fire slash that erupts along the ground.

**7. `actions/monk-zero/` — Monk Zero** (level 4) — a robed martial-arts monk, spinning-staff and palm-strike
melee; `special` is a concentrated chi blast from an open palm.

---

## Optional polish

### Remaining characters

The same per-action spec covers everything else when it is worth regenerating: **Byte** (female,
ranged four-shot volley — pink/magenta hair in an undercut ponytail, black sports bra, magenta boxing
gloves; her `special` fires pink energy projectiles from the glove), the six enemies (`punk`,
`chainer`, `brawler`, `kicker`, `knight`, `shield`), and the six remaining bosses (`market-king`,
`railmaw`, `crown-runner`, `the-null`, `vault-mother`, `ultra-signal`). Each keeps working on its
current art until a complete `actions/<id>/` set exists.

### More enemy variety

`enemy-boss-atlas.png` has twelve full-body reference figures in a 4×3 grid; only the first six were
ever turned into action grids. Slots 6–11 are unused designs: a green bio-brawler, a dark-gold
sorceress, a purple demon, a red flame samurai, a teal dragon mech, and a rainbow queen. All six now
exist as per-action sets (`bio-brute`, `gold-sorceress`, `void-demon`, `rainbow-oracle` as enemies;
`abyss-dragon`, `flame-samurai`, `prism-queen`, `storm-colossus` as bosses). A new enemy needs an
id in `src/sim/enemyAi.ts` and `tools/build-assets.mjs` (`ENEMY_IDS`); a new boss an entry in
`src/sim/bosses.ts` and the `BOSSES` list of the build tool; both need a line in
`src/net/codec.ts`'s `ARCH_TABLE`. Which levels they appear in is then set on `/backoffice.html`.

### Title wordmark / app icon / splash

The current logo (`public/assets/generated/ui/logo.svg`) is a placeholder line-art wordmark. A proper
title treatment (transparent PNG or SVG, ~800×240), a 512×512 and 192×192 app icon, and a 1080×1920
splash image would all drop in at `public/assets/generated/ui/` — reference the palette in
`docs/graphic-asset-map.md` (`#ffcf5c` accent, `#75f5dc` cyan, `#050711` background).

### Real audio

The game currently ships with fully procedural Web Audio (see `src/audio/`) — no files needed to
function. If real SFX/music are ever produced, replace `src/audio/synth.ts`'s oscillator calls with
sample playback and `src/audio/sequencer.ts`'s pattern generator with authored tracks, one loop per
level plus a boss variant, in the style already established by each level's mood: e.g. Rishon LeZion
(bright, upbeat plaza pop), Barcelona (warm, brassy), the candy factory (playful, bouncy), Catalunya /
Ultra Signal (a climactic, orchestral-electronic hybrid theme).
