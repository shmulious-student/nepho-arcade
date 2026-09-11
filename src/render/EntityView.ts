import Phaser from 'phaser';
import type { CharacterEntry } from '../shared/catalog';
import { frameKeyFor } from './anim';
import type { EntityView as SimEntityView } from '../sim/types';
import { FLOOR_TOP } from '../sim/types';

const TINTS = [0xffffff, 0x75f5dc, 0x37aaff, 0xff8f40, 0xbd8cff, 0xffcf5c, 0xff4f72, 0xff76c8, 0xa4ee42, 0xedf6ff];

export function worldToScreenX(x: number, cameraX: number): number { return x - cameraX; }
export function worldToScreenY(y: number, z: number): number { return FLOOR_TOP + y * 0.62 - z; }

/** One rendered character: body sprite (+ shadow), plus an hp bar for enemies and bosses. */
export class EntityView {
  readonly id: number;
  private scene: Phaser.Scene;
  private holder: Phaser.GameObjects.Container;
  private def: CharacterEntry;
  body: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  hpBar?: Phaser.GameObjects.Graphics;
  private lastKey = '';
  private seenTick = 0;

  constructor(scene: Phaser.Scene, id: number, def: CharacterEntry, container: Phaser.GameObjects.Container) {
    this.scene = scene; this.id = id; this.def = def; this.holder = container;
    this.shadow = scene.add.ellipse(0, 0, 40, 14, 0x000000, 0.35);
    this.body = scene.add.sprite(0, 0, def.id, `${def.rows[0]}/0`);
    this.body.setOrigin(def.anchor.x / def.box.w, def.anchor.y / def.box.h);
    container.add([this.shadow, this.body]);
    if (def.kind === 'enemy' || def.kind === 'boss') {
      this.hpBar = scene.add.graphics();
      container.add(this.hpBar);
    }
  }

  update(e: SimEntityView, cameraX: number, tick: number): void {
    this.seenTick = tick;
    const sx = worldToScreenX(e.x, cameraX);
    const sy = worldToScreenY(e.y, e.z);
    this.body.setPosition(sx, sy);
    this.shadow.setPosition(sx, FLOOR_TOP + e.y * 0.62);
    this.shadow.setScale(Math.max(0.3, 1 - e.z / 220));
    this.shadow.setAlpha(e.hp > 0 ? 0.35 : 0);
    this.body.setFlipX(e.facing < 0);
    const key = frameKeyFor(e.kind, e.arch, e.state, e.st, this.def);
    if (key !== this.lastKey) { this.body.setFrame(key); this.lastKey = key; }
    this.body.setScale((e.scale || 1) * (this.def.renderScale ?? 1) * (e.kind === 'echo' ? 0.72 : 1));
    this.body.setDepth(sy);
    this.shadow.setDepth(sy - 1);
    if (e.flash > 0) this.body.setTintFill(0xffffff); else if (e.tint > 0) this.body.setTint(TINTS[e.tint % TINTS.length]); else this.body.clearTint();
    this.body.setAlpha(e.invuln > 0 && (e.kind === 'hero') ? (Math.floor(tick / 3) % 2 === 0 ? 0.5 : 1) : 1);
    this.drawStars(e, sx, sy, tick);
    if (this.hpBar) {
      this.hpBar.clear();
      // a boss has the named bar in the HUD; the little floating one is for enemies and echoes
      if (e.hp > 0 && e.hp < 1 && e.kind !== 'boss') {
        const w = this.def.kind === 'boss' ? 56 : 30;
        const top = sy - this.def.box.h * (this.def.renderScale ?? 1) * (this.def.kind === 'boss' ? 0.62 : 0.72);
        this.hpBar.fillStyle(0x10182b, 0.8).fillRect(sx - w / 2, top, w, 5);
        this.hpBar.fillStyle(e.hp > 0.35 ? 0x75f5dc : 0xff4f72, 1).fillRect(sx - w / 2, top, w * e.hp, 5);
      }
      this.hpBar.setDepth(sy);
    }
  }

  staleSince(tick: number): boolean { return tick - this.seenTick > 3; }
  private stars: Phaser.GameObjects.Graphics | null = null;
  /** Little orbiting stars over a dazed character's head. */
  private drawStars(e: SimEntityView, sx: number, sy: number, tick: number): void {
    if (e.state !== 'stunned') { if (this.stars) { this.stars.destroy(); this.stars = null; } return; }
    if (!this.stars) { this.stars = this.scene.add.graphics(); this.holder.add(this.stars); }
    const g = this.stars;
    g.clear();
    const headY = sy - this.def.box.h * (this.def.renderScale ?? 1) * (this.def.kind === 'boss' ? 0.95 : 0.9) * (e.scale || 1);
    for (let i = 0; i < 3; i++) {
      const a = tick / 6 + (i * Math.PI * 2) / 3;
      const x = sx + Math.cos(a) * 18, y = headY + Math.sin(a) * 5;
      g.fillStyle(0xffcf5c, 1); g.lineStyle(1, 0x10182b, 1);
      const pts: Phaser.Math.Vector2[] = [];
      for (let k = 0; k < 10; k++) { const r = k % 2 ? 2.2 : 5; const t = -Math.PI / 2 + (k * Math.PI) / 5; pts.push(new Phaser.Math.Vector2(x + Math.cos(t) * r, y + Math.sin(t) * r)); }
      g.fillPoints(pts, true); g.strokePoints(pts, true);
    }
    g.setDepth(sy + 2);
  }

  destroy(): void { this.body.destroy(); this.shadow.destroy(); this.hpBar?.destroy(); this.stars?.destroy(); }
}
