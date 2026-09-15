import Phaser from 'phaser';
import { BootScene } from './render/scenes/BootScene';
import { LobbyScene } from './render/scenes/LobbyScene';
import { GameScene } from './render/scenes/GameScene';
import { ResultsScene } from './render/scenes/ResultsScene';
import { VIEW_H } from './sim/types';
import { gameWidth, keepCanvasFitted } from './render/viewport';
import { analytics } from './shared/analytics';

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
// already listens to in time, and a rotation changes the aspect the canvas was sized for; both are
// handled by re-sizing/re-fitting the canvas on every viewport change (render/viewport.ts).
keepCanvasFitted(game);
analytics.track('boot', { renderer: isAndroid ? 'canvas' : 'auto', w: gameWidth() });
