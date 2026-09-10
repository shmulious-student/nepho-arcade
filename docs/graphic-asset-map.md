# Nepho: Circuit Breakers — Low-Cost Graphic Asset Map

## Cost strategy

- Ship one shared player body rig and one shared enemy rig; vary palette, accessories, silhouettes, and attack FX through texture swaps and code-driven overlays.
- Use generated raster art only for hero key art, boss portraits, and a small set of approved sprite seeds. Build hit sparks, shadows, glows, bars, icons, and UI from Phaser Graphics/CSS.
- Author sprite strips at 2x target resolution, normalize to a shared bottom-center anchor, and export WebP/PNG only when transparency is required.
- Keep gameplay assets separate from promotional art. Never use a large key-art image as an in-game animation source.
- Target initial graphic payload: 8–12 MB compressed; individual gameplay sprites under 150 KB where possible.

## Required asset inventory

| ID | Asset | Qty | Format / target size | Reuse plan | Priority |
|---|---|---:|---|---|---|
| `player.body.base` | Shared player body sprite set | 1 set / 8 actions | transparent PNG/WebP, 96×128 frames | All players use the same body; recolor jacket/scarf and attach face layer | P0 |
| `player.body.p2` | P2 accent palette | 1 palette | CSS/Phaser tint | No second body set | P0 |
| `player.face.mask` | Face crop mask + guide | 1 | SVG/Phaser geometry | Circular/oval crop for every portrait | P0 |
| `player.face.rig` | Face animation overlay | 1 rig | Phaser canvas shapes + uploaded portrait | Animate scale, angle, eye/mouth proxy, hurt/effort expressions; do not bake per frame | P0 |
| `player.face.fallback` | Default hero face | 1 | 64×64 transparent PNG | Used when no upload exists | P0 |
| `player.action.strip` | Idle / walk / attack / heavy / hurt / dash / special / defeat | 8 strips | 4–8 frames each, 96×128 | One shared body rig for P1/P2 | P0 |
| `enemy.grunt` | Standard enemy | 1 strip set / 5 actions | 64×96 frames | Palette tint creates 3 enemy variants | P0 |
| `enemy.elite` | Elite enemy silhouette | 1 strip set / 5 actions | 80×112 frames | Add armor/accessory overlays instead of new full character | P1 |
| `boss.base` | Shared boss body rig | 1 strip set / 6 actions | 144×176 frames | All 9 bosses use the same rig with silhouette and palette variants | P0 |
| `boss.portraits` | Boss portrait cards | 9 + 1 ultra | 256×256 WebP | One portrait per boss for HUD, intro, and victory; no animation required | P1 |
| `boss.overlays` | Boss costume/accessory overlays | 9 | transparent PNG, 144×176 | Reuse base body; each overlay communicates identity | P1 |
| `ultra.composite` | Ultra Boss overlay | 1 | transparent PNG, 176×208 | Layer nine boss color bands, masks, and aura over `boss.base` | P1 |
| `level.backdrop` | District background plates | 10 | 960×540 WebP | One plate per level; parallax by cropping and tinting | P0 |
| `level.parallax` | Background depth strips | 3 reusable layers | 960×180 WebP | Recombine across all 10 districts with tint/scroll speed | P1 |
| `level.floor` | Ground/floor tile strip | 1 reusable set | 64 px tiles / SVG or PNG | Tint and decals create district identity | P0 |
| `level.decals` | District signage, pipes, crates, lamps, vents | 12 reusable decals | 64–256 px transparent PNG/SVG | Mix across levels; CSS/Phaser tint | P1 |
| `level.props` | Breakable props | 4 | 64×64 transparent PNG | Crate, barrel, terminal, street barrier; reuse across stages | P1 |
| `fx.hit` | Hit spark family | 1 procedural family | Phaser Graphics | 4 shapes: light, heavy, launch, blocked | P0 |
| `fx.special` | Nepho Burst effect | 1 procedural family | Phaser particles/Graphics | Color-shift by player palette | P0 |
| `fx.boss` | Boss telegraph/impact family | 1 procedural family | Phaser Graphics | Rings, cones, warning stripes, phase bursts | P0 |
| `fx.environment` | Rain, steam, dust, embers, scanlines | 1 procedural family | Phaser particles/CSS | Reuse with per-level tint and rate | P1 |
| `ui.logo` | Nepho wordmark | 1 | SVG | Title, loading, pause, result screen | P0 |
| `ui.icons` | Attack, special, dash, co-op, portrait, pause, retry | 8 | SVG inline | Single-color icon set with CSS color | P0 |
| `ui.hud.frames` | Health/meter frames and boss bar | 3 | CSS/SVG | DOM/CSS; no raster exports | P0 |
| `ui.control.glyphs` | Keyboard/touch glyphs | 6 | SVG/CSS | DOM buttons and help screen | P0 |
| `ui.level.cards` | Level intro/result cards | 10 data-driven layouts | DOM/CSS | Text + reused portrait/backdrop; no 10 unique graphics | P1 |
| `ui.relics` | Progression relic icons | 6 | SVG | Color and label variants | P2 |
| `promo.keyart` | Hero key art | 1 | 1024×1536 WebP/PNG | Menu, README, repository preview only | P1 |

## Level graphic mapping

Each level needs only one unique visual package:

| Level | Unique treatment | Reused assets |
|---:|---|---|
| 1 Dockside | teal/orange rain, containers | base parallax, floor, props |
| 2 Skyline | magenta signage, rooftop edge | base parallax, lamps, barriers |
| 3 Furnace | orange heat, steam | base parallax, pipes, vents |
| 4 Temple | indigo lanterns, tiled floor | base parallax, decals |
| 5 Neon Market | lime/magenta signs | base parallax, signage, crates |
| 6 Subway | red signal lights, rails | base parallax, floor, terminals |
| 7 Rooftops | moon haze, antenna silhouettes | base parallax, barriers |
| 8 Null Lab | white/blue scanlines | base parallax, terminals |
| 9 Core Vault | gold alarm strips, heavy doors | base parallax, vents, props |
| 10 Last Light | all previous colors in controlled blend | all prior assets + ultra overlay |

## Boss graphic mapping

| Boss | Cheap differentiator | New art required |
|---|---|---|
| The Ferryman | hood + hook overlay, cyan palette | portrait + overlay |
| Glass Warden | crystal shoulder overlay, blue palette | portrait + overlay |
| Kilnheart | furnace chest plate, orange palette | portrait + overlay |
| Monk Zero | robe sash overlay, violet palette | portrait + overlay |
| Market King | crown + coat overlay, lime palette | portrait + overlay |
| Railmaw | rail-mask overlay, red palette | portrait + overlay |
| Crown Runner | speed scarf overlay, pink palette | portrait + overlay |
| The Null | negative-space mask, white/black palette | portrait + overlay |
| Vault Mother | segmented armor overlay, gold palette | portrait + overlay |
| Ultra Signal | layered nine-color aura and boss masks | 1 composite overlay |

## Asset production order

1. `player.action.strip`, `enemy.grunt`, `boss.base`, `level.backdrop` seed.
2. `player.face.mask`, `player.face.fallback`, portrait rig, and upload crop flow.
3. Procedural FX and HUD icons; these should not wait on an artist.
4. Boss overlays and portraits.
5. Parallax/decal reuse pass for all ten districts.
6. Ultra composite, relic icons, and promotional key art polish.

## Quality gates

- Every animated strip uses the same frame size, scale, facing direction, and bottom-center anchor.
- Face portraits stay inside a protected mask and animate as a separate layer over the body.
- All gameplay sprites remain readable at mobile display scale.
- No level requires a new full tileset or a new full-body rig.
- Transparent assets contain no baked background or UI text.
- Large promotional art is never loaded into the gameplay scene.
