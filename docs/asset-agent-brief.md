# Asset Integration Brief for the Next Coding Agent

This repository now contains three generated source atlases under `public/assets/generated/`. Integrate them into the Phaser game without generating more art unless a quality gate below fails.

The active roster is now four selectable heroes: `nepho` and `bruiser` (male); `riva` and `byte` (female). The previous six-hero source files remain as historical references, but code must use only the four active IDs.

## Files

| File | Purpose | Source dimensions | Runtime treatment |
|---|---|---:|---|
| `/assets/generated/hero-actions-strip.png` | Player body/action source | 2172×724 RGBA | Slice into 8 equal source cells, trim transparent bounds, normalize all frames to 96×128 with bottom-center anchor. Use as the shared P1/P2 body. |
| `/assets/generated/enemy-boss-atlas.png` | Enemy/boss visual source | 1448×1086 RGBA | Use as an art reference atlas first; crop 4×3 slots, then normalize visible figures into `enemy-grunt`, `enemy-elite`, `boss`, and `ultra` textures. Use tint/accessory overlays for variants. |
| `/assets/generated/level-backdrop-atlas.png` | Ten district background source | 1182×1330 RGB | Crop 2×5 slots. Scale each crop to a 960×540 cover image and preserve a clear combat floor in the bottom 30%. Add a dark translucent gameplay read layer in Phaser. |
| `/assets/generated/hero-roster-atlas.png` | Six selectable hero body/face-area references | 1536×1024 RGBA | Crop 3×2 slots in manifest order: `nepho`, `bruiser`, `zero`, `riva`, `byte`, `sol`; use for hero select cards. |
| `/assets/generated/hero-action-atlas-v2.png` | Six complete hero action strips | 1402×1122 RGBA | Crop 6 rows × 8 columns in manifest order; normalize each row to 96×128 frames. |
| `/assets/generated/hero-nepho-grid.png` | Nepho full action grid | 1230×1278 RGBA | 8 action rows × 6 frames; normalize to 96×128 frames. |
| `/assets/generated/hero-bruiser-grid.png` | Bruiser full action grid | 1230×1278 RGBA | 8 action rows × 6 frames; normalize to 96×128 frames. |
| `/assets/generated/hero-riva-grid.png` | Riva full action grid | 1214×1295 RGBA | 8 action rows × 6 frames; normalize to 96×128 frames. |
| `/assets/generated/hero-byte-grid.png` | Byte full action grid | 2172×724 RGBA | Use the source as provided, then normalize into the same 8×6 runtime grid; verify the generated crop before shipping. |
| `/assets/generated/boss-action-atlas-v2.png` | Ten complete boss action strips | 1214×1295 RGBA | Crop 10 rows × 6 columns in manifest order; normalize each row to 144×176 frames. |
| `/assets/generated/manifest.json` | Stable source metadata | — | Load by manifest key, never hard-code filenames in gameplay systems. |

## Recommended Phaser loader

```ts
preload() {
  this.load.image('hero-actions-source', '/assets/generated/hero-actions-strip.png');
  this.load.image('enemy-boss-source', '/assets/generated/enemy-boss-atlas.png');
  this.load.image('level-backdrop-source', '/assets/generated/level-backdrop-atlas.png');
}
```

Do not make gameplay rules depend on source-atlas pixel dimensions. Put slicing and normalization in `src/assets/assetCatalog.ts` or a build-time preprocessing script. The runtime should consume stable keys such as `player.body.idle`, `enemy.grunt`, `boss.ferryman`, and `level.dockside`.

## Player roster and animation contract

- Present a four-card hero select screen: 2 male and 2 female heroes. Each card shows name, color identity, and a short move bias.
- Use one shared animation timing/state contract for all four heroes, but give each hero a distinct normalized body silhouette and palette. Do not recolor every hero into the same body.
- Active identities: Nepho (balanced burst), Bruiser (heavy damage), Riva (combo mobility), Byte (ranged special).
- P1/P2 may choose independently; their selected hero is a simulation `heroId`, never inferred from renderer state.
- Frame order from the strip: `idle`, `walk`, `attack`, `heavy`, `dash`, `special`, `hurt`, `defeat`.
- Hero action sources are separate full grids: `hero-nepho-grid.png`, `hero-bruiser-grid.png`, `hero-riva-grid.png`, `hero-byte-grid.png`. Each grid is 8 action rows × 6 frames; row and frame order are authoritative in `manifest.json`.
- Keep bottom-center at the same world coordinate for every frame.
- Face the character right in source art; mirror the display sprite when moving left.
- Use the portrait upload as a separate circular face texture positioned over the selected hero's face area. Do not bake a user portrait into sprite frames.
- Animate the face layer with the body state: idle blink/eye drift, attack squash, special scale pulse, hurt recoil.

## Enemy and boss contract

- Use one shared enemy state machine and one shared boss state machine.
- Start with four normalized runtime textures from the atlas: `grunt`, `elite`, `boss`, `ultra`.
- Create nine boss identities through palette, portrait, accessory overlay, attack telegraph, and data—not nine full animation rigs.
- Map bosses to levels: Ferryman, Glass Warden, Kilnheart, Monk Zero, Market King, Railmaw, Crown Runner, The Null, Vault Mother, Ultra Signal.
- Level 10 uses the `ultra` visual and a phase deck containing the nine boss attack patterns.
- Boss action source: `boss-action-atlas-v2.png`; each boss row is independently normalized but shares animation state names `idle`, `approach`, `attack`, `special`, `hurt`, `defeat`.
- Keep the boss row as the visual source for its matching boss ID; do not recolor one boss into all ten once these strips are integrated.

## Background contract

- Pre-slice all ten atlas cells into named textures.
- Render three stacked layers: backdrop, optional parallax decal strip, and procedural FX.
- Keep the central horizontal band readable for combat. Apply a 20–35% navy overlay behind characters where contrast is weak.
- Swap only the backdrop key and tint/FX profile between levels.

## Portrait upload contract

1. Accept image input locally; do not upload it to a server.
2. Crop to a centered oval/circle guide.
3. Downsample to at most 256×256 for memory safety.
4. Create a Phaser texture key `portrait.p1` or `portrait.p2` from the local object URL.
5. Mask it with a geometry mask and attach it to the player view, not the simulation state.
6. Revoke the previous object URL when replacing the portrait.

## Hero selection data shape

```ts
type HeroId = 'nepho'|'bruiser'|'zero'|'riva'|'byte'|'sol';
type HeroDefinition = { id: HeroId; gender: 'male'|'female'; displayName: string; bodyKey: string; palette: string; moveBias: string };
```

Keep the portrait attached to `player.face[slot]`; keep `heroId` and gameplay stats in simulation state. The uploaded image changes identity presentation, not hitboxes, animation timing, or network payload size.

## Low-cost asset rules

- Generate no new full-body character sets for individual bosses.
- Use Phaser Graphics for hit sparks, dash trails, special rings, telegraphs, shadows, and health bars.
- Use inline SVG/CSS for icons and DOM HUD.
- Convert the generated atlases to WebP only after validating transparency and crop quality; retain PNG masters.
- Lazy-load level backdrops after the current level is known.

## Acceptance checks

- P1 idle, attack, special, hurt, and defeat are visibly different in-game.
- At least three enemy figures and one boss figure are visible during play.
- All ten level names resolve to a distinct backdrop crop.
- Ultra Signal visibly combines nine color accents.
- Uploaded portrait remains masked to the face area and animates with attack/special/hurt states.
- No raw atlas image is displayed as a full-screen gameplay texture.
