import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../sim/types';

/** The canvas is the 960×540 design frame widened to the screen's aspect (capped), so a phone's wide
 * screen gets no side bars. The sim and every UI layout stay in the 960 frame, centred on the canvas:
 * GameScene draws the world through a full-width camera and the UI through a second, 960-wide one;
 * the other scenes just centre their main camera on the frame (the canvas colour fills the sides). */
export function gameWidth(): number {
  // assume landscape play: a phone booting in portrait (behind the "turn your phone" card) must not
  // size the canvas for the upright screen it will not be played on
  const aspect = Math.max(innerWidth, innerHeight) / Math.max(1, Math.min(innerWidth, innerHeight));
  return Math.min(1280, Math.max(VIEW_W, Math.round(VIEW_H * aspect)));
}

/** Where the 960 frame starts on the canvas. Raw pointer coordinates are canvas coordinates; subtract
 * this before comparing them with anything laid out in the frame. */
export const uiOffsetX = (scene: Phaser.Scene): number => Math.round((scene.scale.width - VIEW_W) / 2);

export function centreUiCamera(scene: Phaser.Scene): void {
  scene.cameras.main.setViewport(uiOffsetX(scene), 0, VIEW_W, VIEW_H);
}
