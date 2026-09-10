import Phaser from 'phaser';
import type { LevelEntry } from '../shared/catalog';
import { VIEW_W, VIEW_H } from '../sim/types';

/** Backdrop + entry reveal + contrast band. Each level has exactly one (non-repeating) 941x334 WebP
 * backdrop; scaled to fill the 540px view height it comes out ~1521px wide — almost exactly LEVEL_W,
 * i.e. the whole level's scroll range is covered by one image with no tiling needed. It's rendered as
 * a plain Image positioned at screen-x = -cameraX (same "world minus camera" convention EntityView
 * and Fx use), not a scrolling TileSprite. */
export class Backdrop {
  private scene: Phaser.Scene;
  private bg: Phaser.GameObjects.Image;
  private entry: Phaser.GameObjects.Image | null = null;
  private sign: Phaser.GameObjects.Image | null = null;
  private contrastBand: Phaser.GameObjects.Rectangle;
  private level: LevelEntry;
  private dispW: number;
  private lastCameraX = 0;

  constructor(scene: Phaser.Scene, level: LevelEntry, _worldWidth: number, container: Phaser.GameObjects.Container) {
    this.scene = scene; this.level = level;
    const scale = VIEW_H / level.size.h;
    this.dispW = level.size.w * scale;
    this.bg = scene.add.image(0, 0, `${level.id}-bg`).setOrigin(0, 0).setDisplaySize(this.dispW, VIEW_H);
    container.add(this.bg);
    // Fixed screen-space readability overlay over the combat band — not part of the scrolling world.
    this.contrastBand = scene.add.rectangle(0, VIEW_H * 0.45, VIEW_W, VIEW_H * 0.4, 0x0b1730, 0.24).setOrigin(0, 0).setScrollFactor(0);
    container.add(this.contrastBand);
  }

  showEntry(): void {
    if (this.entry) return;
    // Centered, not left-anchored: the scaled image (dispW) is wider than the 960 view, and the sign
    // is drawn centered within it, so both must be centered on-screen or the sign crops off the edge.
    // The sign texture is the *same* 941xslotHeight frame as the entry backdrop (a transparent overlay
    // with the plate pre-drawn at its correct internal offset) — it must be positioned identically to
    // the entry image, not placed using signY, which only describes where the plate sits *inside* it.
    this.entry = this.scene.add.image(VIEW_W / 2, 0, `${this.level.id}-entry`).setOrigin(0.5, 0).setDisplaySize(this.dispW, VIEW_H).setDepth(20000);
    this.sign = this.scene.add.image(VIEW_W / 2, 0, `${this.level.id}-sign`).setOrigin(0.5, 0).setDisplaySize(this.dispW, VIEW_H).setDepth(20001);
  }
  hideEntry(): void { this.entry?.destroy(); this.entry = null; this.sign?.destroy(); this.sign = null; }
  entryVisible(): boolean { return !!this.entry; }

  setCameraX(x: number): void {
    this.lastCameraX = x;
    this.bg.setX(-x);
  }

  destroy(): void { this.bg.destroy(); this.entry?.destroy(); this.sign?.destroy(); this.contrastBand.destroy(); }
}
