import Phaser from 'phaser';
import type { EntityView as EntityViewData } from '../sim/types';
import { worldToScreenX, worldToScreenY } from './EntityView';
import { FLOOR_TOP } from '../sim/types';

/** Draws the things bosses throw and lay down — projectiles (hook, shard, bolt) and hazards (blast,
 * ring, orb, fog, smoke, wall) — so nothing that can hurt the player is ever invisible. All in-engine
 * shapes: each has a footprint on the floor and a body at its height. A hazard's `scale` is its
 * radius (or width) and `phase` is 0 while it is still a telegraph, 1 once it is live. */
export class HazardView {
  readonly id: number;
  private g: Phaser.GameObjects.Graphics;
  private kind: string;
  private seenTick = 0;

  constructor(scene: Phaser.Scene, e: EntityViewData, container: Phaser.GameObjects.Container) {
    this.id = e.id;
    this.kind = e.arch;
    this.g = scene.add.graphics();
    container.add(this.g);
  }

  update(e: EntityViewData, cameraX: number, tick: number): void {
    this.seenTick = tick;
    const g = this.g;
    g.clear();
    const sx = worldToScreenX(e.x, cameraX);
    const floorY = FLOOR_TOP + e.y * 0.62;
    const sy = worldToScreenY(e.y, e.z);
    g.setDepth(floorY + (this.kind === 'fog' || this.kind === 'smoke' ? -200 : 2));
    const t = tick;
    switch (this.kind) {
      case 'hook': {
        // a chain from just behind the hook back toward the thrower, hook at the front
        g.lineStyle(3, 0x9bb1c9, 1);
        for (let i = 1; i <= 6; i++) g.strokeCircle(sx - e.facing * i * 9, sy + Math.sin(t / 3 + i) * 2, 3);
        g.fillStyle(0xd8e0ee, 1); g.lineStyle(2, 0x10182b, 1);
        g.fillCircle(sx, sy, 7); g.strokeCircle(sx, sy, 7);
        g.lineStyle(4, 0xd8e0ee, 1); g.beginPath(); g.arc(sx + e.facing * 6, sy - 4, 8, Math.PI * 0.2, Math.PI * 1.3, e.facing < 0); g.strokePath();
        break;
      }
      case 'shard': {
        g.fillStyle(0xbdf3ff, 0.95); g.lineStyle(2, 0x37aaff, 1);
        g.fillTriangle(sx + e.facing * 16, sy, sx - e.facing * 10, sy - 8, sx - e.facing * 10, sy + 8);
        g.strokeTriangle(sx + e.facing * 16, sy, sx - e.facing * 10, sy - 8, sx - e.facing * 10, sy + 8);
        break;
      }
      case 'bolt': {
        g.fillStyle(0xff76c8, 0.95); g.fillEllipse(sx, sy, 22, 10);
        g.fillStyle(0xfff2fb, 1); g.fillEllipse(sx + e.facing * 4, sy, 10, 4);
        break;
      }
      case 'blast': {
        const r = Math.max(20, e.scale);
        if (e.phase === 0) {
          // telegraph: a pulsing target on the floor, then it goes off
          const pulse = 0.55 + 0.45 * Math.sin(t / 3);
          g.lineStyle(3, 0xff4f72, pulse); g.strokeEllipse(sx, floorY, r * 2, r * 0.7);
          g.fillStyle(0xff4f72, 0.12 + 0.1 * pulse); g.fillEllipse(sx, floorY, r * 2, r * 0.7);
        } else {
          g.fillStyle(0xffcf5c, 0.5); g.fillEllipse(sx, floorY, r * 2, r * 0.7);
          g.fillStyle(0xff9357, 0.85);
          for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2 + t / 4; g.fillCircle(sx + Math.cos(a) * r * 0.5, floorY - 30 - Math.abs(Math.sin(a)) * 30, 10 + (i % 3) * 4); }
          g.fillStyle(0xfff2b0, 1); g.fillCircle(sx, floorY - 22, 16);
        }
        break;
      }
      case 'ring': {
        const r = Math.max(4, e.scale);
        g.lineStyle(6, 0x75f5dc, 0.9); g.strokeEllipse(sx, floorY, r * 2, r * 0.7);
        g.lineStyle(2, 0xffffff, 0.6); g.strokeEllipse(sx, floorY, r * 2 - 8, r * 0.7 - 3);
        break;
      }
      case 'orb': {
        g.fillStyle(0x000000, 0.25); g.fillEllipse(sx, floorY, 18, 6);
        g.fillStyle(0xb388ff, 0.9); g.fillCircle(sx, sy, 11);
        g.fillStyle(0xffffff, 0.9); g.fillCircle(sx - 3, sy - 3, 4);
        g.lineStyle(2, 0xd9c8ff, 0.5 + 0.4 * Math.sin(t / 4)); g.strokeCircle(sx, sy, 15);
        break;
      }
      case 'fog': case 'smoke': {
        const r = Math.max(40, e.scale);
        const c = this.kind === 'fog' ? 0x9bb1c9 : 0x2a2f45;
        g.fillStyle(c, 0.28); g.fillEllipse(sx, floorY - 20, r * 2, r * 0.8);
        g.fillStyle(c, 0.22); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + t / 40; g.fillCircle(sx + Math.cos(a) * r * 0.55, floorY - 30 + Math.sin(a) * r * 0.2, r * 0.35); }
        break;
      }
      case 'wall': {
        const w = Math.max(24, e.scale), h = 140;
        g.fillStyle(0xffcf5c, 0.35); g.fillRect(sx - w / 2, floorY - h, w, h);
        g.lineStyle(2, 0xffcf5c, 0.9); g.strokeRect(sx - w / 2, floorY - h, w, h);
        for (let i = 0; i < 4; i++) g.lineBetween(sx - w / 2, floorY - h + ((i * 37 + t * 2) % h), sx + w / 2, floorY - h + ((i * 37 + t * 2) % h));
        break;
      }
      default: {
        g.fillStyle(0xff4f72, 0.9); g.fillCircle(sx, sy, 8);
      }
    }
  }

  staleSince(tick: number): boolean { return tick - this.seenTick > 3; }
  destroy(): void { this.g.destroy(); }
}
