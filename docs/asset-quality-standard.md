# Character Grid Quality Standard

Use [hero-grid-quality-reference.png](/assets/references/hero-grid-quality-reference.png) as the visual acceptance reference for every hero and enemy action grid.

## Required bar

- Large, game-readable character frames with generous separation between cells.
- Real transparent RGBA background; no checkerboard, black, gray, white, or colored matte baked into pixels.
- Strong pose changes that clearly communicate idle, locomotion, attacks, specials, damage, knockback, and defeat.
- Consistent anatomy, costume, palette, facing direction, and bottom-center anchor across the complete grid.
- Effects are attached to the action and remain readable without swallowing the character silhouette.
- Face area remains visually coherent and unobstructed for the uploaded portrait overlay on heroes.
- No repeated idle pose substituted for a missing action frame.
- No labels, text, UI, scenery, or extra characters inside a grid.

## Grid layout

- Heroes: 8 action rows × 6 frames per row.
- Regular enemies: 8 action rows × 6 frames per row.
- Bosses: 6 action rows × 6 frames per row.
- Each cell must have the same source dimensions and be normalized to the runtime frame size by the asset pipeline.

## Rejection checks

Reject and regenerate if any of the following are true:

1. Background is not actual alpha transparency.
2. The character is too small to read at mobile gameplay scale.
3. Action poses are visually indistinguishable.
4. The silhouette, weapon, or costume changes unintentionally between frames.
5. Cropping cuts off hands, feet, weapons, effects, or hair in any intentional action.
6. The grid is a concept collage rather than a production animation sheet.

The attached reference is a quality bar, not a requirement to copy the hero design. Preserve each character's own identity while matching this level of frame size, clarity, and action readability.
