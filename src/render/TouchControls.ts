import Phaser from 'phaser';
import { BTN, InputEdge, type InputFrame } from '../sim/input';
import { VIEW_H, VIEW_W } from '../sim/types';

/** Virtual stick (left) + 5 action buttons (right): DASH / BLOCK top corners, SPECIAL top center,
 * ATTACK / HEAVY bottom, matching the layout convention of classic arcade co-op cabinets. Pointer-id
 * tracked so multitouch doesn't fight itself. Keyboard input is handled separately in GameScene and
 * merged with this. */
export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private stickBase: Phaser.GameObjects.Arc;
  private stickNub: Phaser.GameObjects.Arc;
  private stickPointerId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private stickVec = { x: 0, y: 0 };
  private buttons: { g: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text; bit: number; pointerId: number | null; x: number; y: number; r: number }[] = [];
  private edge = new InputEdge();
  visible = true;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(40000).setScrollFactor(0);
    const stickX = 78, stickY = VIEW_H - 90;
    this.stickBase = scene.add.circle(stickX, stickY, 46, 0x0b1730, 0.5).setStrokeStyle(2, 0x344861);
    this.stickNub = scene.add.circle(stickX, stickY, 22, 0x14243d, 0.8).setStrokeStyle(2, 0x75f5dc);
    this.stickOrigin = { x: stickX, y: stickY };
    this.container.add([this.stickBase, this.stickNub]);

    const bx = VIEW_W - 104, by = VIEW_H - 96, spread = 42;
    const defs: [number, number, number, string, number][] = [
      [bx - spread, by, BTN.LIGHT, 'ATK', 0x75f5dc],
      [bx + spread, by, BTN.HEAVY, 'HVY', 0xff9357],
      [bx, by - spread, BTN.SPECIAL, 'SPC', 0xffcf5c],
      [bx - spread * 1.75, by - spread * 1.05, BTN.DASH, 'DSH', 0xa4ee42],
      [bx + spread * 1.75, by - spread * 1.05, BTN.BLOCK, 'BLK', 0x37aaff],
      [bx, by + spread * 0.95, BTN.ASSIST, 'FRD', 0xff76c8],
    ];
    for (const [x, y, bit, label, colour] of defs) {
      const g = scene.add.circle(x, y, 26, 0x0b1730, 0.55).setStrokeStyle(2, colour);
      const t = scene.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '10px', color: '#f3f4e8' }).setOrigin(0.5);
      this.container.add([g, t]);
      this.buttons.push({ g, label: t, bit, pointerId: null, x, y, r: 30 });
    }

    scene.input.addPointer(2);
    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.visible) return;
    const dStick = Phaser.Math.Distance.Between(p.x, p.y, this.stickOrigin.x, this.stickOrigin.y);
    if (this.stickPointerId === null && dStick < 70) { this.stickPointerId = p.id; this.updateStick(p); return; }
    for (const b of this.buttons) {
      if (b.pointerId !== null) continue;
      if (Phaser.Math.Distance.Between(p.x, p.y, b.x, b.y) < b.r) { b.pointerId = p.id; b.g.setFillStyle(0x1c2f4d, 0.9); }
    }
  }
  private onMove(p: Phaser.Input.Pointer): void { if (p.id === this.stickPointerId) this.updateStick(p); }
  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.stickPointerId) { this.stickPointerId = null; this.stickVec = { x: 0, y: 0 }; this.stickNub.setPosition(this.stickOrigin.x, this.stickOrigin.y); }
    for (const b of this.buttons) if (b.pointerId === p.id) { b.pointerId = null; b.g.setFillStyle(0x0b1730, 0.55); }
  }
  private updateStick(p: Phaser.Input.Pointer): void {
    const dx = p.x - this.stickOrigin.x, dy = p.y - this.stickOrigin.y;
    const d = Math.min(30, Math.hypot(dx, dy));
    const a = Math.atan2(dy, dx);
    this.stickNub.setPosition(this.stickOrigin.x + Math.cos(a) * d, this.stickOrigin.y + Math.sin(a) * d);
    this.stickVec = { x: (Math.hypot(dx, dy) > 8 ? Math.cos(a) : 0), y: (Math.hypot(dx, dy) > 8 ? Math.sin(a) : 0) };
  }

  setVisible(v: boolean): void { this.visible = v; this.container.setVisible(v); }

  poll(): InputFrame {
    let held = 0;
    if (this.stickVec.x < -0.35) held |= BTN.LEFT; if (this.stickVec.x > 0.35) held |= BTN.RIGHT;
    if (this.stickVec.y < -0.35) held |= BTN.UP; if (this.stickVec.y > 0.35) held |= BTN.DOWN;
    for (const b of this.buttons) if (b.pointerId !== null) held |= b.bit;
    return this.edge.next(held);
  }
}
