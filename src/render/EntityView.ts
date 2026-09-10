import Phaser from 'phaser';
import type { CharacterEntry } from '../shared/catalog';
import { frameKeyFor } from './anim';
import type { EntityView as SimEntityView } from '../sim/types';
import { FLOOR_TOP } from '../sim/types';
import { FaceRig } from './FaceRig';

const TINTS = [0xffffff, 0x75f5dc, 0x37aaff, 0xff8f40, 0xbd8cff, 0xffcf5c, 0xff4f72, 0xff76c8, 0xa4ee42, 0xedf6ff];

export function worldToScreenX(x: number, cameraX: number): number { return x - cameraX; }
export function worldToScreenY(y: number, z: number): number { return FLOOR_TOP + y * 0.62 - z; }

/** One rendered character: body sprite (+ shadow), and for heroes an attached FaceRig. */
export class EntityView {
  readonly id: number;
  private scene: Phaser.Scene;
  private def: CharacterEntry;
  body: Phaser.GameObjects.Sprite;
  shadow: Phaser.GameObjects.Ellipse;
  face: FaceRig | null = null;
  hpBar?: Phaser.GameObjects.Graphics;
  private lastKey = '';
  private seenTick = 0;

  constructor(scene: Phaser.Scene, id: number, def: CharacterEntry, container: Phaser.GameObjects.Container) {
    this.scene = scene; this.id = id; this.def = def;
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
    const key = frameKeyFor(e.kind, e.arch, e.state, e.st);
    if (key !== this.lastKey) { this.body.setFrame(key); this.lastKey = key; }
    this.body.setScale((e.scale || 1) * (e.kind === 'echo' ? 0.72 : 1));
    this.body.setDepth(sy);
    this.shadow.setDepth(sy - 1);
    if (e.flash > 0) this.body.setTintFill(0xffffff); else if (e.tint > 0) this.body.setTint(TINTS[e.tint % TINTS.length]); else this.body.clearTint();
    this.body.setAlpha(e.invuln > 0 && (e.kind === 'hero') ? (Math.floor(tick / 3) % 2 === 0 ? 0.5 : 1) : 1);
    if (this.hpBar) {
      this.hpBar.clear();
      if (e.hp > 0 && e.hp < 1) {
        const w = this.def.kind === 'boss' ? 56 : 30;
        this.hpBar.fillStyle(0x10182b, 0.8).fillRect(sx - w / 2, sy - this.def.box.h * (this.def.kind === 'boss' ? 0.62 : 0.72), w, 5);
        this.hpBar.fillStyle(e.hp > 0.35 ? 0x75f5dc : 0xff4f72, 1).fillRect(sx - w / 2, sy - this.def.box.h * (this.def.kind === 'boss' ? 0.62 : 0.72), w * e.hp, 5);
      }
      this.hpBar.setDepth(sy);
    }
    if (this.face) this.face.update(e, sx, sy, this.body);
  }

  attachFace(rig: FaceRig): void { this.face = rig; }
  staleSince(tick: number): boolean { return tick - this.seenTick > 3; }
  destroy(): void { this.body.destroy(); this.shadow.destroy(); this.hpBar?.destroy(); this.face?.destroy(); }
}
