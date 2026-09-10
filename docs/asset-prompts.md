# Asset regeneration prompts

This machine has no image-generation API, so these are written to hand to any image model (or the
same pipeline that produced the rest of the pack). Drop a corrected file into
`public/assets/generated/` at the path shown, run `npm run build:assets`, then `npm run test:assets`
— the pipeline picks it up automatically and the gate confirms it passes. Nothing else in the code
needs to change; character identity, row order, and frame count are all read from the file itself.

Every grid must meet `docs/asset-quality-standard.md`: true RGBA transparency (no checkerboard, no
colored matte baked into the pixels), large game-readable frames with clean separation between cells,
consistent anatomy/costume/palette/facing/bottom-center anchor across the whole grid, and clearly
distinct poses per action — no repeated idle frame standing in for a missing action.

## Required

### 1. `hero-byte-grid.png` — wrong character

The current file is a 2172×724 four-pose strip of the male orange-scarf character (same identity as
`hero-nepho-grid.png`'s reference sheet), not Byte. The game currently substitutes a hue-shifted Riva.

> Pixel-art fighting-game character sheet, 8 rows × 6 columns, true transparent RGBA background (no
> checkerboard, no matte color baked into the pixels). Character: "Byte" — a female boxer, pink/magenta
> hair in a undercut ponytail, black sports bra top, magenta fingerless boxing gloves with dark straps,
> dark athletic pants, confident stance. Match the render style, outline weight, and lighting of the
> attached reference (`hero-grid-quality-reference.png` in this repo, or row 5 of `hero-action-atlas-v2.png`
> and card 5 of `hero-roster-atlas.png` for her exact design). Character faces right in every frame;
> bottom-center anchor point identical across all 48 cells; generous empty margin between cells so
> effects never bleed into a neighboring frame. Row order top to bottom, 6 frames per row:
> 1. idle (subtle guard stance, 6-frame breathing loop)
> 2. walk (6-frame run cycle)
> 3. attack (jab-cross-hook combo, 6 frames)
> 4. heavy (a heavier haymaker with wind-up, 6 frames)
> 5. dash (a forward dash/step, 6 frames)
> 6. special — Byte's special is a ranged 4-shot volley: draw it as a punching-forward pose with a
>    pink energy projectile launching from the glove, 6 frames showing windup → 3 shots → recovery
> 7. hurt (flinch/recoil reactions, 6 frames)
> 8. defeat (knockdown → lying down, 6 frames)
>
> Output at roughly 1200–1300px square total canvas (~200×160px per cell), matching the resolution of
> the other three hero grids in this pack.

Save as `public/assets/generated/hero-byte-grid.png`.

### 2. `enemies/enemy-03-purple-fighter-grid.png` — baked checkerboard

Alpha is 255 (fully opaque) on every pixel — the "transparent" checkerboard is painted directly into
the RGB values, not real alpha. The pipeline attempts to un-bake it automatically (flood-fill +
bimodal-block detection) and falls back to a hue-shifted Brawler if that fails; either way, a clean
regeneration is preferable.

> Pixel-art fighting-game enemy sheet, 8 rows × 6 columns, true transparent RGBA background (real
> alpha channel — verify in an editor that shows an actual checkerboard for transparency, not one
> painted into the pixels). Character: a purple-haired female street fighter in fishnet leggings and
> a black jacket, fists raised, aggressive stance — same character design as the current
> `enemy-03-purple-fighter-grid.png` (do not redesign her, just fix the transparency). Facing right,
> consistent bottom-center anchor, generous margin between cells. Row order, 6 frames per row: idle,
> walk, attack, heavy, special, hurt, knockback, defeat.

Save as `public/assets/generated/enemies/enemy-03-purple-fighter-grid.png`.

## Optional polish

### 3. Six more enemy/mini-boss grids

`enemy-boss-atlas.png` (in this repo) has twelve full-body reference figures in a 4×3 grid; only the
first six (row 1 + row 2 cols 1–2) were ever turned into action grids. Slots 6–11 are unused designs:
a green bio-brawler, a dark-gold sorceress, a purple demon, a red flame samurai, a teal dragon mech,
and a rainbow queen. Turning any of these into an 8×6 action grid (same format as the existing enemy
grids) would add roster variety for later levels without any code changes beyond registering the new
id in `src/sim/enemyAi.ts` and `src/sim/levels.ts`.

### 4. Title wordmark / app icon / splash

The current logo (`public/assets/generated/ui/logo.svg`) is a placeholder line-art wordmark. A proper
title treatment (transparent PNG or SVG, ~800×240), a 512×512 and 192×192 app icon, and a 1080×1920
splash image would all drop in at `public/assets/generated/ui/` — reference the palette in
`docs/graphic-asset-map.md` (`#ffcf5c` accent, `#75f5dc` cyan, `#050711` background).

### 5. Real audio

The game currently ships with fully procedural Web Audio (see `src/audio/`) — no files needed to
function. If real SFX/music are ever produced, replace `src/audio/synth.ts`'s oscillator calls with
sample playback and `src/audio/sequencer.ts`'s pattern generator with authored tracks, one loop per
level plus a boss variant, in the style already established by each level's mood: e.g. Rishon LeZion
(bright, upbeat plaza pop), Barcelona (warm, brassy), the candy factory (playful, bouncy), Catalunya /
Ultra Signal (a climactic, orchestral-electronic hybrid theme).
