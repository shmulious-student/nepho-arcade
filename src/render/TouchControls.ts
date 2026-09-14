import Phaser from 'phaser';
import { t, uiFont } from '../shared/i18n';
import { BTN, InputEdge, type InputFrame } from '../sim/input';
import { VIEW_H, VIEW_W } from '../sim/types';
import { uiLeft, uiOffsetX, uiRight } from './viewport';

/** Touch layer, built on what the good mobile brawlers settled on (Dead Cells' port notes, SoR4's
 * mobile reviews): a floating stick that plants under the thumb; a few LARGE buttons with hit areas
 * bigger than their art, spaced so adjacent ones cannot be mis-tapped, sticky while the thumb drifts;
 * no swipe-plus-button combos; and the rarely used actions moved off the cluster.
 *
 *   right thumb   SPC (top, lights up when the meter is full)
 *                 HVY · ATK · JMP  in an arc under it
 *                 BLK  small, tucked top-right (hold); DSH small, top-left of the cluster (hold +
 *                 push the stick sideways to run); CALL further left, lit when the friend is ready
 *                 (assist mode only — the HUD's friend chip still answers a tap too)
 *   left thumb    stick
 *
 * A player can pick S / M / L controls in the lobby (persisted). Keyboard input is handled separately
 * in GameScene and merged with this. */
export class TouchControls {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private stickBase: Phaser.GameObjects.Arc;
  private stickNub: Phaser.GameObjects.Arc;
  private stickPointerId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private stickHome = { x: 0, y: 0 };
  private stickVec = { x: 0, y: 0 };
  private buttons: { g: Phaser.GameObjects.Arc; label: Phaser.GameObjects.Text; bit: number; colour: number; pointerId: number | null; x: number; y: number; r: number; hit: number }[] = [];
  private offX: number; // the 960 frame's left edge on the canvas (render/viewport.ts)
  private assistZone: { x: number; y: number; w: number; h: number; pointerId: number | null };
  private edge = new InputEdge();
  private lit = new Set<number>(); // buttons drawn filled because their action is ready (SPC, CALL)
  visible = true;

  static readonly SIZE_KEY = 'nepho.touchSize';
  static sizeSetting(): 'S' | 'M' | 'L' {
    try { const v = localStorage.getItem(TouchControls.SIZE_KEY); return v === 'S' || v === 'L' ? v : 'M'; } catch { return 'M'; }
  }

  constructor(scene: Phaser.Scene, withFriend = false) {
    this.scene = scene;
    this.offX = uiOffsetX(scene);
    this.container = scene.add.container(0, 0).setDepth(40000);
    const k = { S: 0.85, M: 1, L: 1.2 }[TouchControls.sizeSetting()];

    // floating stick, resting bottom-left when idle
    const stickX = uiLeft(scene) + 100 * k, stickY = VIEW_H - 100 * k; // the screen's own corners, not the frame's
    this.stickHome = { x: stickX, y: stickY };
    this.stickBase = scene.add.circle(stickX, stickY, 58 * k, 0x0b1730, 0.35).setStrokeStyle(2, 0x344861).setAlpha(0.6);
    this.stickNub = scene.add.circle(stickX, stickY, 26 * k, 0x14243d, 0.85).setStrokeStyle(2, 0x75f5dc);
    this.stickOrigin = { x: stickX, y: stickY };
    this.container.add([this.stickBase, this.stickNub]);

    // right cluster: three big buttons in an arc under the thumb, special above, block tucked away.
    // Hit radius is well beyond the drawn circle; gaps between centres exceed two hit radii.
    const cx = uiRight(scene) - 120 * k, cy = VIEW_H - 92 * k, big = 36 * k, bigHit = 48 * k;
    const defs: [number, number, number, string, number, number, number][] = [
      [cx - 92 * k, cy - 18 * k, BTN.HEAVY, t('btnHeavy'), 0xff9357, big, bigHit],
      [cx, cy + 12 * k, BTN.LIGHT, t('btnLight'), 0x75f5dc, big * 1.1, bigHit * 1.1],
      [cx + 92 * k, cy - 18 * k, BTN.JUMP, t('btnJump'), 0xf3f4e8, big, bigHit],
      [cx, cy - 92 * k, BTN.SPECIAL, t('btnSpecial'), 0xffcf5c, big * 0.95, bigHit],
      [cx + 92 * k, cy - 108 * k, BTN.BLOCK, t('btnBlock'), 0x37aaff, 24 * k, 34 * k],
      [cx - 92 * k, cy - 108 * k, BTN.DASH, t('btnDash'), 0xa4ee42, 26 * k, 36 * k],
    ];
    // the friend call, beside the cluster where the right thumb reaches it (assist mode only)
    if (withFriend) defs.push([cx - 176 * k, cy - 56 * k, BTN.ASSIST, t('btnFriend'), 0xc58cff, 26 * k, 36 * k]);
    for (const [x, y, bit, label, colour, r, hit] of defs) {
      const g = scene.add.circle(x, y, r, 0x0b1730, 0.45).setStrokeStyle(3, colour);
      const t = scene.add.text(x, y, label, { fontFamily: uiFont(), fontSize: `${Math.round(13 * k)}px`, color: '#f3f4e8', fontStyle: 'bold' }).setOrigin(0.5).setAlpha(0.9);
      this.container.add([g, t]);
      this.buttons.push({ g, label: t, bit, colour, pointerId: null, x, y, r, hit });
    }
    // the friend call lives on the HUD card (top-left), not on the cluster
    this.assistZone = { x: uiLeft(scene) + 14, y: 10, w: 290, h: 80, pointerId: null };

    scene.input.addPointer(4); // stick + up to four fingers on the buttons
    scene.input.on('pointerdown', this.onDown, this);
    scene.input.on('pointermove', this.onMove, this);
    scene.input.on('pointerup', this.onUp, this);
    scene.input.on('pointerupoutside', this.onUp, this);
  }

  /** Lights the special button when the meter is full, so the affordance is visible at a glance. */
  setSpecialReady(ready: boolean): void { this.setReady(BTN.SPECIAL, ready); }
  /** Lights the friend button when the assist bar is full. */
  setAssistReady(ready: boolean): void { this.setReady(BTN.ASSIST, ready); }
  private setReady(bit: number, ready: boolean): void {
    if (ready === this.lit.has(bit)) return;
    if (ready) this.lit.add(bit); else this.lit.delete(bit);
    const b = this.buttons.find((x) => x.bit === bit);
    if (!b) return;
    this.paint(b, false);
    b.label.setColor(ready ? '#0b1730' : '#f3f4e8');
    if (ready) { b.g.setScale(1.35); this.scene.tweens.add({ targets: b.g, scale: 1, duration: 260, ease: 'Back.Out' }); }
  }

  private onDown(p: Phaser.Input.Pointer): void {
    if (!this.visible) return;
    const z = this.assistZone, x = p.x - this.offX, y = p.y;
    if (x >= z.x && x <= z.x + z.w && y >= z.y && y <= z.y + z.h) { z.pointerId = p.id; return; }
    const overButton = this.buttons.some((b) => Phaser.Math.Distance.Between(x, y, b.x, b.y) < b.hit);
    if (!overButton && this.stickPointerId === null && x < uiLeft(this.scene) + this.scene.scale.width * 0.42 && y > VIEW_H * 0.22) {
      // plant the stick under the thumb
      this.stickPointerId = p.id;
      this.stickOrigin = { x, y };
      this.stickBase.setPosition(p.x, p.y).setAlpha(1);
      this.updateStick(p);
      return;
    }
    this.pressAt(p);
  }
  private onMove(p: Phaser.Input.Pointer): void {
    if (!p.isDown) return; // a hovering mouse must never press anything
    if (p.id === this.stickPointerId) { this.updateStick(p); return; }
    // sticky buttons: a press survives a drifting thumb, and sliding well onto a neighbour switches
    for (const b of this.buttons) if (b.pointerId === p.id && Phaser.Math.Distance.Between(p.x - this.offX, p.y, b.x, b.y) >= b.hit + 18) { b.pointerId = null; this.paint(b, false); }
    this.pressAt(p);
  }
  private pressAt(p: Phaser.Input.Pointer): void {
    if (this.buttons.some((b) => b.pointerId === p.id)) return;
    let best: typeof this.buttons[number] | null = null, bd = Infinity;
    for (const b of this.buttons) {
      if (b.pointerId !== null) continue;
      const d = Phaser.Math.Distance.Between(p.x - this.offX, p.y, b.x, b.y);
      if (d < b.hit && d < bd) { bd = d; best = b; }
    }
    if (best) { best.pointerId = p.id; this.paint(best, true); }
  }
  private paint(b: typeof this.buttons[number], down: boolean): void {
    if (this.lit.has(b.bit)) { b.g.setFillStyle(b.colour, down ? 0.95 : 0.6); b.g.setScale(down ? 0.92 : 1); return; }
    b.g.setFillStyle(down ? 0x1c2f4d : 0x0b1730, down ? 0.95 : 0.45);
    b.g.setScale(down ? 0.92 : 1);
  }
  private onUp(p: Phaser.Input.Pointer): void {
    if (p.id === this.stickPointerId) {
      this.stickPointerId = null; this.stickVec = { x: 0, y: 0 };
      this.stickOrigin = { ...this.stickHome };
      this.stickBase.setPosition(this.stickHome.x, this.stickHome.y).setAlpha(0.6);
      this.stickNub.setPosition(this.stickHome.x, this.stickHome.y);
    }
    if (this.assistZone.pointerId === p.id) this.assistZone.pointerId = null;
    for (const b of this.buttons) if (b.pointerId === p.id) { b.pointerId = null; this.paint(b, false); }
  }
  private updateStick(p: Phaser.Input.Pointer): void {
    const dx = p.x - this.offX - this.stickOrigin.x, dy = p.y - this.stickOrigin.y;
    const len = Math.hypot(dx, dy);
    const throwMax = this.stickBase.radius * 0.7;
    const d = Math.min(throwMax, len);
    const a = Math.atan2(dy, dx);
    this.stickNub.setPosition(this.stickOrigin.x + Math.cos(a) * d, this.stickOrigin.y + Math.sin(a) * d);
    const dead = 10;
    this.stickVec = len > dead ? { x: Math.cos(a), y: Math.sin(a) } : { x: 0, y: 0 };
  }

  setVisible(v: boolean): void { this.visible = v; this.container.setVisible(v); }

  poll(): InputFrame {
    let held = 0;
    if (this.stickVec.x < -0.38) held |= BTN.LEFT; if (this.stickVec.x > 0.38) held |= BTN.RIGHT;
    if (this.stickVec.y < -0.5) held |= BTN.UP; if (this.stickVec.y > 0.5) held |= BTN.DOWN;
    for (const b of this.buttons) if (b.pointerId !== null) held |= b.bit;
    if (this.assistZone.pointerId !== null) held |= BTN.ASSIST;
    return this.edge.next(held);
  }
}
