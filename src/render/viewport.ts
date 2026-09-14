import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../sim/types';

/** The canvas is the 960×540 design frame widened to the screen's aspect (capped), so a phone's wide
 * screen gets no side bars. The sim and every UI layout stay in the 960 frame, centred on the canvas:
 * GameScene draws the world through a full-width camera and the UI through a second, 960-wide one;
 * the other scenes just centre their main camera on the frame (the canvas colour fills the sides). */
let lastWidth = 0;
export function gameWidth(): number {
  // the visual viewport is what the player actually sees (the browser's address bar excluded);
  // a phone held upright sits behind the "turn your phone" card, so keep the last landscape answer
  // then — the canvas is only ever sized for landscape play
  const vv = window.visualViewport;
  const w = vv?.width ?? innerWidth, h = vv?.height ?? innerHeight;
  if (w < h && lastWidth) return lastWidth;
  const aspect = Math.max(w, h) / Math.max(1, Math.min(w, h));
  // cap well past any phone (a 19.5:9 screen with the address bar showing is ~2.5:1): a wider canvas
  // only shows more scenery — spawns sit beyond VIEW_W and the mirrored plate edges cover the ends
  lastWidth = Math.min(1700, Math.max(VIEW_W, Math.round(VIEW_H * aspect)));
  return lastWidth;
}

/** Keeps the canvas sized to the viewport for as long as the page lives: a rotation, the address bar
 * collapsing, a window resize — anything that changes the visible aspect re-sizes the game (the scale
 * manager's 'resize' then lets every scene re-anchor its UI, see onViewportResize) or, when the width
 * is already right, just re-fits it. iOS reports the post-rotation size late, so a turn re-checks. */
export function keepCanvasFitted(game: Phaser.Game): void {
  const sync = () => {
    const w = gameWidth();
    if (w !== game.scale.gameSize.width) game.scale.resize(w, VIEW_H); else game.scale.refresh();
  };
  window.visualViewport?.addEventListener('resize', sync);
  window.addEventListener('resize', sync);
  window.addEventListener('orientationchange', () => { sync(); setTimeout(sync, 250); setTimeout(sync, 800); });
  const so = (screen as any).orientation;
  so?.addEventListener?.('change', () => { sync(); setTimeout(sync, 250); });
}

/** Runs `layout` now and again on every canvas resize until the scene shuts down. */
export function onViewportResize(scene: Phaser.Scene, layout: () => void): void {
  layout();
  scene.scale.on('resize', layout);
  scene.events.once('shutdown', () => scene.scale.off('resize', layout));
}

/** Where the 960 frame starts on the canvas. Raw pointer coordinates are canvas coordinates; subtract
 * this before comparing them with anything laid out in the frame. */
export const uiOffsetX = (scene: Phaser.Scene): number => Math.round((scene.scale.width - VIEW_W) / 2);

/** The screen's edges in frame coordinates — what corner-anchored UI (HUD cards, pause, the touch
 * stick and cluster) hangs from, so it sits in the real corners of a wide phone screen. */
export const uiLeft = (scene: Phaser.Scene): number => -uiOffsetX(scene);
export const uiRight = (scene: Phaser.Scene): number => VIEW_W + uiOffsetX(scene);

export function centreUiCamera(scene: Phaser.Scene): void {
  scene.cameras.main.setViewport(uiOffsetX(scene), 0, VIEW_W, VIEW_H);
}
