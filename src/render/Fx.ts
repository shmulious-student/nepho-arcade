import Phaser from 'phaser';
import type { SimEvent } from '../sim/types';
import { worldToScreenX, worldToScreenY } from './EntityView';

interface Telegraph { g: Phaser.GameObjects.Graphics; x: number; y: number; a: number; shape: string; t: number; total: number; colour: number }

/** Draws all procedural combat effects (hit sparks, dash trails, special rings, boss telegraphs,
 * screen shake, hit-stop flash) from a stream of SimEvents. No character art involved — pure
 * Phaser Graphics per the low-cost asset rules. */
export class Fx {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private telegraphs: Telegraph[] = [];
  private particles: { g: Phaser.GameObjects.Graphics; x: number; y: number; vx: number; vy: number; life: number; total: number; colour: number; r: number }[] = [];
  camera: Phaser.Cameras.Scene2D.Camera;

  constructor(scene: Phaser.Scene, container: Phaser.GameObjects.Container, camera: Phaser.Cameras.Scene2D.Camera) {
    this.scene = scene; this.container = container; this.camera = camera;
  }

  handle(ev: SimEvent, cameraX: number): void {
    const sx = worldToScreenX(ev.x, cameraX);
    const sy = worldToScreenY(ev.y, ev.z || 40);
    switch (ev.type) {
      case 'hit': this.spark(sx, sy, ev.heavy ? 0xffcf5c : 0x75f5dc, ev.heavy ? 14 : 8); if (ev.heavy) this.shake(4); break;
      case 'block': this.spark(sx, sy, 0x9bb1c9, 6); break;
      case 'ko': this.burst(sx, sy, ev.a ? 0xff4f72 : 0xffcf5c, ev.a ? 22 : 14); this.shake(ev.a ? 8 : 3); break;
      case 'special': this.ring(sx, sy, 0x75f5dc, 90); this.shake(6); break;
      case 'launch': this.spark(sx, sy, 0xa4ee42, 10); break;
      case 'dash': this.trail(sx, sy); break;
      case 'shake': this.shake(ev.a || 4); break;
      case 'heal': this.ring(sx, sy, 0xa4ee42, 40); break;
      case 'summon': this.ring(sx, sy, 0xffcf5c, 60); break;
      case 'telegraph': this.addTelegraph(ev, cameraX); break;
    }
  }

  private addTelegraph(ev: SimEvent, cameraX: number): void {
    const g = this.scene.add.graphics();
    this.container.add(g);
    g.setDepth(9000);
    this.telegraphs.push({ g, x: ev.x, y: ev.y, a: ev.a || 60, shape: ev.shape || 'circle', t: 0, total: Math.max(4, ev.b || 24), colour: ev.colour ?? 0xff4f72 });
    void cameraX;
  }

  private spark(x: number, y: number, colour: number, n: number): void {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.6 + Math.random() * 2.2;
      this.particles.push({ g: this.newGfx(), x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 1, life: 0, total: 14 + Math.random() * 6, colour, r: 2 + Math.random() * 2 });
    }
  }
  private burst(x: number, y: number, colour: number, n: number): void { this.spark(x, y, colour, n); }
  private ring(x: number, y: number, colour: number, radius: number): void {
    this.telegraphs.push({ g: this.newGfx(), x, y, a: radius, shape: 'ring-fx', t: 0, total: 18, colour });
  }
  private trail(x: number, y: number): void {
    for (let i = 0; i < 5; i++) this.particles.push({ g: this.newGfx(), x: x - i * 4, y, vx: 0, vy: 0, life: i * 2, total: 12, colour: 0x75f5dc, r: 6 - i });
  }
  private newGfx(): Phaser.GameObjects.Graphics { const g = this.scene.add.graphics(); this.container.add(g); g.setDepth(9500); return g; }
  private shake(amt: number): void { this.camera.shake(110, Math.min(0.02, amt * 0.0015)); }

  update(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life++;
      if (p.life < 0) continue;
      p.x += p.vx; p.y += p.vy; p.vy += 0.15;
      const t = p.life / p.total;
      p.g.clear();
      if (t < 1) { p.g.fillStyle(p.colour, 1 - t).fillCircle(p.x, p.y, p.r * (1 - t * 0.6)); }
      else { p.g.destroy(); this.particles.splice(i, 1); }
    }
    for (let i = this.telegraphs.length - 1; i >= 0; i--) {
      const tg = this.telegraphs[i];
      tg.t++;
      const t = tg.t / tg.total;
      tg.g.clear();
      if (t >= 1) { tg.g.destroy(); this.telegraphs.splice(i, 1); continue; }
      const alpha = tg.shape === 'ring-fx' ? 0.9 * (1 - t) : 0.35 + 0.4 * Math.sin(t * Math.PI * 6);
      tg.g.lineStyle(3, tg.colour, alpha);
      if (tg.shape === 'circle') tg.g.strokeCircle(tg.x, tg.y, tg.a * (0.6 + 0.4 * t));
      else if (tg.shape === 'ring-fx') tg.g.strokeCircle(tg.x, tg.y, tg.a * t);
      else if (tg.shape === 'line') tg.g.strokeRect(tg.x - tg.a / 2, tg.y - 70, tg.a, 140);
      else if (tg.shape === 'stripe') tg.g.strokeRect(tg.x - tg.a / 2, tg.y - 90, tg.a, 180);
    }
  }
}
