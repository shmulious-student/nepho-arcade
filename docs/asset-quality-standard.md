# Character Grid Quality Standard

> **Superseded for new art by [character-art-standard.md](./character-art-standard.md)** — the single template every future character is generated from, with the machine gate `npm run verify:character -- <id>`. This page stays as the description of the older formats still in the tree.

Use [hero-grid-quality-reference.png](/assets/references/hero-grid-quality-reference.png) as the visual acceptance reference for every hero, enemy, and boss action set.

## Required bar

- Large, game-readable character frames with generous separation between cells.
- Real transparent RGBA background; no checkerboard, black, gray, white, or colored matte baked into pixels.
- Strong pose changes that clearly communicate idle, locomotion, attacks, specials, damage, knockback, and defeat.
- Consistent anatomy, costume, palette, facing direction, and bottom-center anchor across every file belonging to a character.
- Effects are attached to the action and remain readable without swallowing the character silhouette.
- Face area remains visually coherent and unobstructed for the uploaded portrait overlay on heroes.
- No repeated idle pose substituted for a missing action frame.
- No labels, text, UI, scenery, or extra characters inside a cell.

## Layout — current format

One image **per character per action**, at `public/assets/generated/actions/<id>/<action>.png`:

- 2048×2048 RGBA, square power-of-two canvas.
- A 3×3 grid of 9 animation frames, read row-major; 682×682 px per frame.
- Heroes: 12 actions — `idle`, `walk`, `dash`, `light1`, `light2`, `light3`, `heavy`, `special`, `block`, `hurt`, `knockdown`, `defeat`.
- Enemies: 10 actions — `idle`, `walk`, `attack`, `heavy`, `special`, `guard`, `hurt`, `knockback`, `getup`, `defeat`.
- Bosses: 6 actions — `idle`, `approach`, `attack`, `special`, `hurt`, `defeat`.

A character switches to this format only once **every** action file exists; until then the pipeline keeps using its older grid, so sets can be delivered one character at a time. Per-frame beats and the generation prompts live in [asset-prompts.md](./asset-prompts.md).

## Layout — older formats still in the tree

- Paired grids: two 2048×2048 files, each a 6×6 grid, together making 12 rows × 6 frames.
- Single grids: one auto-detected grid — heroes/enemies 8 rows × 6 frames, bosses 6 rows × 8 frames.

Both remain supported and are read automatically; neither should be used for new art.

## Runtime normalization

Frame size is never authored — `tools/build-assets.mjs` isolates the figure in each cell, scales every character to its runtime body height, aligns all frames to a shared bottom-center anchor, and packs a power-of-two atlas. Per-action art is packed supersampled and carries a `renderScale`, so its extra detail survives the game's world zoom.

## Rejection checks

Reject and regenerate if any of the following are true:

1. Background is not actual alpha transparency.
2. The character is too small to read at mobile gameplay scale.
3. Action poses are visually indistinguishable.
4. The silhouette, weapon, or costume changes unintentionally between frames — including between two action files of the same character.
5. Cropping cuts off hands, feet, weapons, effects, or hair in any intentional action, or art crosses a cell boundary.
6. The grid is a concept collage rather than a production animation sheet.

`npm run test:assets` enforces the mechanical half of this list: canvas shape, real transparency, and art staying inside its cell (a figure on the cell line or an effect chopped flat fails a per-action set). The rest is a human read against the reference — in motion, on `/showcase.html` with the dev server running.

The attached reference is a quality bar, not a requirement to copy the hero design. Preserve each character's own identity while matching this level of frame size, clarity, and action readability.
