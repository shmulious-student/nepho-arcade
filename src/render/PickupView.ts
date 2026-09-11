import Phaser from 'phaser';
import type { EntityView as EntityViewData } from '../sim/types';
import { worldToScreenX, worldToScreenY } from './EntityView';
import { FLOOR_TOP } from '../sim/types';

const COLOURS: Record<string, number> = { heart: 0xff4f72, coin: 0xffcf5c, star: 0x75f5dc };

/** A dropped pickup, drawn in-engine (a heart, a coin, a star) with a bob, a shadow, and a blink in
 * its last two seconds. No sprite sheet involved — the shapes are simple enough to draw. */
export class PickupView {
  readonly id: number;
  private g: Phaser.GameObjects.Graphics;
  private shadow: Phaser.GameObjects.Ellipse;
  private kind: string;
  private seenTick = 0;

  constructor(scene: Phaser.Scene, e: EntityViewData, container: Phaser.GameObjects.Container) {
    this.id = e.id;
    this.kind = e.arch;
    this.shadow = scene.add.ellipse(0, 0, 22, 8, 0x000000, 0.3);
    this.g = scene.add.graphics();
    container.add([this.shadow, this.g]);
    this.draw(COLOURS[e.arch] ?? 0xffffff);
  }

  private draw(colour: number): void {
    const g = this.g;
    g.clear();
    g.lineStyle(2, 0x10182b, 1);
    if (this.kind === 'heart') {
      g.fillStyle(colour, 1);
      g.fillCircle(-5, -4, 6); g.fillCircle(5, -4, 6);
      g.fillTriangle(-10, -1, 10, -1, 0, 11);
      g.strokeCircle(-5, -4, 6); g.strokeCircle(5, -4, 6);
    } else if (this.kind === 'coin') {
      g.fillStyle(colour, 1); g.fillCircle(0, 0, 9); g.strokeCircle(0, 0, 9);
      g.fillStyle(0xfff2b0, 1); g.fillRect(-2, -5, 4, 10);
    } else {
      g.fillStyle(colour, 1);
      const pts: Phaser.Math.Vector2[] = [];
      for (let i = 0; i < 10; i++) { const r = i % 2 ? 4.5 : 11; const a = -Math.PI / 2 + (i * Math.PI) / 5; pts.push(new Phaser.Math.Vector2(Math.cos(a) * r, Math.sin(a) * r)); }
      g.fillPoints(pts, true); g.strokePoints(pts, true);
    }
  }

  update(e: EntityViewData, cameraX: number, tick: number): void {
    this.seenTick = tick;
    const sx = worldToScreenX(e.x, cameraX);
    const bob = e.z > 0 ? 0 : Math.sin(tick / 8) * 3;
    const sy = worldToScreenY(e.y, e.z + 12) + bob;
    this.g.setPosition(sx, sy).setDepth(sy);
    this.shadow.setPosition(sx, FLOOR_TOP + e.y * 0.62).setDepth(sy - 1);
    // `st` mirrors the time left: blink in the final two seconds
    const fading = e.st < 120 && (tick >> 2) % 2 === 0;
    this.g.setAlpha(fading ? 0.25 : 1);
  }

  staleSince(tick: number): boolean { return tick - this.seenTick > 3; }
  destroy(): void { this.g.destroy(); this.shadow.destroy(); }
}
