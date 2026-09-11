import Phaser from 'phaser';
import type { SimEvent } from '../sim/types';
import { worldToScreenX, worldToScreenY } from './EntityView';
import { HEROES, HERO_IDS } from '../sim/frameData';

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
      case 'hit': this.spark(sx, sy, ev.heavy ? 0xffcf5c : 0x75f5dc, ev.heavy ? 14 : 8); if (ev.heavy) this.shake(4); if (ev.a) this.floatText(sx, sy - 24, `${ev.a}`, ev.heavy ? '#ffcf5c' : '#f3f4e8', ev.heavy ? 15 : 12); break;
      case 'pickup': { const label = ['+HP', '+500', '+METER'][ev.a ?? 0] || '+'; const c = [0xff4f72, 0xffcf5c, 0x75f5dc][ev.a ?? 0] || 0xffffff; this.spark(sx, sy, c, 10); this.floatText(sx, sy - 20, label, Phaser.Display.Color.IntegerToColor(c).rgba, 14); break; }
      case 'block': this.spark(sx, sy, 0x9bb1c9, 6); break;
      case 'ko': this.burst(sx, sy, ev.a ? 0xff4f72 : 0xffcf5c, ev.a ? 22 : 14); this.shake(ev.a ? 8 : 3); break;
      case 'special': { const h = HEROES[HERO_IDS[ev.a ?? 0]]; this.ring(sx, sy, h?.colour ?? 0x75f5dc, 90); this.shake(6); break; }
      case 'paint': this.splat(sx, sy, (ev.a ?? 0) % 2 === 0 ? HEROES.eviatar.colour : HEROES.eviatar.colour2!); break;
      case 'note': { const c = (ev.a ?? 0) % 2 === 0 ? HEROES.omri.colour : HEROES.omri.colour2!; this.ring(sx, sy, c, 60 + (ev.a ?? 0) * 45); this.spark(sx, sy - 30, c, 6); this.shake(3); break; }
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
  // a blob of paint hitting the floor: a few fat, slow drops that hang around longer than sparks
  private splat(x: number, y: number, colour: number): void {
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2, speed = 0.6 + Math.random() * 1.8;
      this.particles.push({ g: this.newGfx(), x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed * 0.5 - 0.8, life: 0, total: 26 + Math.random() * 12, colour, r: 4 + Math.random() * 5 });
    }
  }
  private ring(x: number, y: number, colour: number, radius: number): void {
    this.telegraphs.push({ g: this.newGfx(), x, y, a: radius, shape: 'ring-fx', t: 0, total: 18, colour });
  }
  private trail(x: number, y: number): void {
    for (let i = 0; i < 5; i++) this.particles.push({ g: this.newGfx(), x: x - i * 4, y, vx: 0, vy: 0, life: i * 2, total: 12, colour: 0x75f5dc, r: 6 - i });
  }
  // a number / label that drifts up and fades — damage on hit, what a pickup gave
  private floatText(x: number, y: number, text: string, colour: string, size: number): void {
    const t = this.scene.add.text(x, y, text, { fontFamily: 'monospace', fontSize: `${size}px`, color: colour, fontStyle: 'bold', stroke: '#0b1730', strokeThickness: 4 }).setOrigin(0.5).setDepth(9600);
    this.container.add(t);
    this.scene.tweens.add({ targets: t, y: y - 34, alpha: 0, duration: 650, ease: 'Cubic.Out', onComplete: () => t.destroy() });
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
