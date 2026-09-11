import Phaser from 'phaser';
import type { CharacterEntry } from '../shared/catalog';
import { heroFrameKey } from './anim';
import { FACE_TEXTURE_SIZE } from '../face/process';
import type { EntityView as SimEntityView } from '../sim/types';

/** Renders an uploaded-portrait face texture over a hero body, following the per-frame head anchor
 * baked by the asset pipeline and applying small per-state deformation so it reads as animated rather
 * than a pasted photo: idle blink + bob, attack squash, special pulse, hurt tilt, dash lean, KO flop. */
export class FaceRig {
  private img: Phaser.GameObjects.Image;
  private def: CharacterEntry;
  private blinkAt = Math.floor(Math.random() * 90);
  private lastState = '';

  constructor(scene: Phaser.Scene, textureKey: string, def: CharacterEntry, container: Phaser.GameObjects.Container) {
    this.def = def;
    this.img = scene.add.image(0, 0, textureKey);
    this.img.setOrigin(0.5, 0.55); // sits slightly above the image's vertical center on the head
    container.add(this.img);
  }

  update(e: SimEntityView, sx: number, sy: number, body: Phaser.GameObjects.Sprite): void {
    const key = heroFrameKey(e.state, e.st, this.def);
    const [row, idxStr] = key.split('/');
    const idx = Number(idxStr);
    const rowHeads = this.def.head?.[row];
    const h = rowHeads?.[idx];
    if (!h) { this.img.setVisible(false); return; }
    this.img.setVisible(true);
    const [dx, dy, w] = h;
    const s = body.scaleX;
    const flip = e.facing < 0;
    const fx = sx + (flip ? -dx : dx) * s;
    const fy = sy + dy * s;
    let scale = (w * 1.18 * s) / FACE_TEXTURE_SIZE; // 1.18x covers hair/hood edge softly
    let rot = 0;
    let squashX = 1, squashY = 1;
    let tintDark = 1;

    if (this.lastState !== e.state) { this.lastState = e.state; if (e.state === 'idle') this.blinkAt = e.st + 40 + Math.floor(Math.random() * 60); }

    let yOff = 0;
    switch (e.state) {
      case 'idle': {
        yOff = Math.sin(e.st / 22) * 1.4 * s;
        const sinceBlink = e.st - this.blinkAt;
        if (sinceBlink >= 0 && sinceBlink < 4) squashY = 0.22;
        if (sinceBlink >= 4 && this.blinkAt < e.st - 6) this.blinkAt = e.st + 70 + Math.floor(Math.random() * 80);
        break;
      }
      case 'walk':
        yOff = Math.sin(e.st / 6) * 1.6 * s;
        rot = (flip ? -1 : 1) * Math.sin(e.st / 6) * 0.03;
        break;
      case 'light1': case 'light2': case 'light3': case 'heavy':
        squashX = 1.1; squashY = 0.9; break;
      case 'special': {
        const pulse = 1 + Math.sin(e.st / 3) * 0.08; squashX = pulse; squashY = pulse; break;
      }
      case 'dash': case 'dashAttack':
        rot = flip ? 0.12 : -0.12; squashX = 1.06; squashY = 0.96; break;
      case 'hurt': case 'hurtHeavy': case 'launched':
        rot = flip ? -0.22 : 0.22; squashX = 0.92; squashY = 1.05; break;
      case 'knockdown': case 'getup':
        rot = flip ? -1.15 : 1.15; tintDark = 0.85; break;
      case 'ko':
        rot = flip ? -1.4 : 1.4; squashY = 0.001; tintDark = 0.7; break;
      default:
        break;
    }
    this.img.x = fx;
    this.img.y = fy + yOff;
    this.img.setScale(scale * squashX, scale * squashY);
    this.img.setRotation(rot);
    this.img.setFlipX(flip);
    this.img.setDepth(sy + 0.5);
    this.img.setTint(tintDark < 1 ? Phaser.Display.Color.GetColor(255 * tintDark, 255 * tintDark, 255 * tintDark) : 0xffffff);
    this.img.setAlpha(e.flash > 0 ? 0.6 : 1);
  }

  destroy(): void { this.img.destroy(); }
}
