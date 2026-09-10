import Phaser from 'phaser';
import type { LevelEntry } from '../shared/catalog';
import { VIEW_W, VIEW_H } from '../sim/types';

/** Backdrop + entry reveal + contrast band. Levels are pre-sliced 941x334 WebP images scaled to fill
 * the 960x540 view; the bilingual sign SVG is loaded as its own small image and shown only during the
 * entry reveal, matching the asset brief's "entry-extensions slot + sign overlay, then pan into the
 * main backdrop" contract. */
export class Backdrop {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.TileSprite;
  private entry: Phaser.GameObjects.Image | null = null;
  private sign: Phaser.GameObjects.Image | null = null;
  private contrastBand: Phaser.GameObjects.Rectangle;
  private level: LevelEntry;
  private worldWidth: number;

  constructor(scene: Phaser.Scene, level: LevelEntry, worldWidth: number, container: Phaser.GameObjects.Container) {
    this.scene = scene; this.level = level; this.worldWidth = worldWidth;
    const bgScale = VIEW_H / level.size.h;
    const bgTexKey = `${level.id}-bg`;
    this.bg = scene.add.tileSprite(0, 0, worldWidth, VIEW_H, bgTexKey).setOrigin(0, 0);
    this.bg.setTileScale(bgScale, bgScale);
    // The single backdrop image is repeated/stretched across the level's scroll width via tileScaleX
    // being derived from the actual level image aspect so it doesn't look squashed.
    const srcAspect = level.size.w / level.size.h;
    const tileW = VIEW_H * srcAspect;
    this.bg.setSize(worldWidth, VIEW_H);
    this.bg.tileScaleX = tileW > 0 ? (level.size.w / tileW) * bgScale : bgScale;
    this.bg.tileScaleY = bgScale;
    container.add(this.bg);
    this.contrastBand = scene.add.rectangle(0, VIEW_H * 0.45, worldWidth, VIEW_H * 0.4, 0x0b1730, 0.24).setOrigin(0, 0);
    container.add(this.contrastBand);
  }

  showEntry(): void {
    if (this.entry) return;
    const scale = VIEW_H / this.level.size.h;
    const dispW = this.level.size.w * scale;
    this.entry = this.scene.add.image(0, 0, `${this.level.id}-entry`).setOrigin(0, 0).setDisplaySize(dispW, VIEW_H).setDepth(20000);
    this.sign = this.scene.add.image(dispW / 2, VIEW_H * (this.level.signY / this.level.size.h), `${this.level.id}-sign`).setDisplaySize(dispW, VIEW_H).setDepth(20001);
  }
  hideEntry(): void { this.entry?.destroy(); this.entry = null; this.sign?.destroy(); this.sign = null; }
  entryVisible(): boolean { return !!this.entry; }

  /** TileSprite scroll is expressed in *texture* pixels, not world pixels, so divide by the tile scale. */
  setCameraX(x: number): void { this.bg.tilePositionX = x / this.bg.tileScaleX; }

  destroy(): void { this.bg.destroy(); this.entry?.destroy(); this.sign?.destroy(); this.contrastBand.destroy(); }
}
