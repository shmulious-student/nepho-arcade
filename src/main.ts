import Phaser from 'phaser';
import { BootScene } from './render/scenes/BootScene';
import { LobbyScene } from './render/scenes/LobbyScene';
import { GameScene } from './render/scenes/GameScene';
import { ResultsScene } from './render/scenes/ResultsScene';
import { VIEW_H } from './sim/types';
import { gameWidth } from './render/viewport';

// Android WebViews (the Capacitor app, BlueStacks) mis-render the WebGL path — the Redmi Note 13 smeared
// the last-uploaded texture over every sprite, BlueStacks painted an opaque cream slab over the play
// area and froze. The game uses no shaders or FX pipelines, so Canvas 2D renders it identically.
const isAndroid = /Android/.test(navigator.userAgent);

const config: Phaser.Types.Core.GameConfig = {
  type: isAndroid ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'app',
  width: gameWidth(), // the 960 design frame, widened to the screen (render/viewport.ts)
  height: VIEW_H,
  backgroundColor: '#050711',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: undefined },
  scene: [BootScene, LobbyScene, GameScene, ResultsScene],
};

const game = new Phaser.Game(config);

// iOS Safari's collapsible toolbar resizes the *visible* viewport after the page has already
// finished its first layout pass, without necessarily firing the events Phaser's ScaleManager
// already listens to in time — without this, bottom-anchored UI (e.g. the lobby's START button)
// can end up sized off-screen with no way to scroll to it. visualViewport's own resize event is the
// most reliable signal mobile Safari gives for this; refresh the fit whenever it (or a plain window
// resize/orientation change, for everything else) fires.
const refit = () => game.scale.refresh();
window.visualViewport?.addEventListener('resize', refit);
window.addEventListener('resize', refit);
window.addEventListener('orientationchange', refit);
