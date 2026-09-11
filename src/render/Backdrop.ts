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
  private entry: Phaser.GameObjects.Container | null = null;
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
    // Level title card, drawn in-engine over the live backdrop. The generated entry strips are wider
    // than the view and their baked sign plate cropped off both edges at every viewport; a card built
    // from the level's own name, Hebrew name and accent colour fits any screen and matches the HUD.
    const accent = Phaser.Display.Color.HexStringToColor(this.level.accent).color;
    const cx = VIEW_W / 2, cy = VIEW_H * 0.42;
    const veil = this.scene.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x050711, 0.55).setOrigin(0, 0);
    const band = this.scene.add.rectangle(cx, cy, VIEW_W, 150, 0x0b1730, 0.92).setOrigin(0.5);
    const rule1 = this.scene.add.rectangle(cx, cy - 75, VIEW_W, 3, accent).setOrigin(0.5);
    const rule2 = this.scene.add.rectangle(cx, cy + 75, VIEW_W, 3, accent).setOrigin(0.5);
    const kicker = this.scene.add.text(cx, cy - 50, `LEVEL ${this.level.index}`, { fontFamily: 'monospace', fontSize: '14px', color: Phaser.Display.Color.IntegerToColor(accent).rgba, letterSpacing: 6 } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    const name = this.scene.add.text(cx, cy - 12, this.level.name, { fontFamily: 'Arial Black, Arial, sans-serif', fontSize: '40px', color: '#fff8d6', fontStyle: 'bold', stroke: '#10182b', strokeThickness: 6 }).setOrigin(0.5);
    const he = this.scene.add.text(cx, cy + 36, this.level.nameHe, { fontFamily: 'Arial, sans-serif', fontSize: '28px', color: '#fff8d6', stroke: '#10182b', strokeThickness: 5 }).setOrigin(0.5);
    const ready = this.scene.add.text(cx, cy + 108, 'GET READY', { fontFamily: 'monospace', fontSize: '16px', color: '#f3f4e8', letterSpacing: 4 } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    this.entry = this.scene.add.container(0, 0, [veil, band, rule1, rule2, kicker, name, he, ready]).setDepth(20000).setScrollFactor(0);
    // slide the band in, pulse the prompt
    band.setScale(1, 0); rule1.setAlpha(0); rule2.setAlpha(0); name.setAlpha(0); he.setAlpha(0); kicker.setAlpha(0);
    this.scene.tweens.add({ targets: band, scaleY: 1, duration: 260, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: [rule1, rule2, kicker, name, he], alpha: 1, duration: 300, delay: 180 });
    this.scene.tweens.add({ targets: ready, alpha: 0.25, duration: 420, yoyo: true, repeat: -1 });
  }
  hideEntry(): void {
    const c = this.entry;
    if (!c) return;
    this.entry = null;
    this.scene.tweens.add({ targets: c, alpha: 0, duration: 320, onComplete: () => c.destroy() });
  }
  entryVisible(): boolean { return !!this.entry; }

  setCameraX(x: number): void {
    this.lastCameraX = x;
    this.bg.setX(-x);
  }

  destroy(): void { this.bg.destroy(); this.entry?.destroy(); this.contrastBand.destroy(); }
}
