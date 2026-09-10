# Asset Integration Brief for the Next Coding Agent

This repository now contains three generated source atlases under `public/assets/generated/`. Integrate them into the Phaser game without generating more art unless a quality gate below fails.

## Files

| File | Purpose | Source dimensions | Runtime treatment |
|---|---|---:|---|
| `/assets/generated/hero-actions-strip.png` | Player body/action source | 2172×724 RGBA | Slice into 8 equal source cells, trim transparent bounds, normalize all frames to 96×128 with bottom-center anchor. Use as the shared P1/P2 body. |
| `/assets/generated/enemy-boss-atlas.png` | Enemy/boss visual source | 1448×1086 RGBA | Use as an art reference atlas first; crop 4×3 slots, then normalize visible figures into `enemy-grunt`, `enemy-elite`, `boss`, and `ultra` textures. Use tint/accessory overlays for variants. |
| `/assets/generated/level-backdrop-atlas.png` | Ten district background source | 1182×1330 RGB | Crop 2×5 slots. Scale each crop to a 960×540 cover image and preserve a clear combat floor in the bottom 30%. Add a dark translucent gameplay read layer in Phaser. |
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

## Player animation contract

- Use one shared body animation set for P1 and P2.
- Frame order from the strip: `idle`, `walk`, `attack`, `heavy`, `dash`, `special`, `hurt`, `defeat`.
- Keep bottom-center at the same world coordinate for every frame.
- Face the character right in source art; mirror the display sprite when moving left.
- Use the portrait upload as a separate circular face texture positioned over the head. Do not bake a user portrait into sprite frames.
- Animate the face layer with the body state: idle blink/eye drift, attack squash, special scale pulse, hurt recoil.

## Enemy and boss contract

- Use one shared enemy state machine and one shared boss state machine.
- Start with four normalized runtime textures from the atlas: `grunt`, `elite`, `boss`, `ultra`.
- Create nine boss identities through palette, portrait, accessory overlay, attack telegraph, and data—not nine full animation rigs.
- Map bosses to levels: Ferryman, Glass Warden, Kilnheart, Monk Zero, Market King, Railmaw, Crown Runner, The Null, Vault Mother, Ultra Signal.
- Level 10 uses the `ultra` visual and a phase deck containing the nine boss attack patterns.

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
