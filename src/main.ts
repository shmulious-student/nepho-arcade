import Phaser from 'phaser';
import { BootScene } from './render/scenes/BootScene';
import { LobbyScene } from './render/scenes/LobbyScene';
import { GameScene } from './render/scenes/GameScene';
import { ResultsScene } from './render/scenes/ResultsScene';
import { VIEW_W, VIEW_H } from './sim/types';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'app',
  width: VIEW_W,
  height: VIEW_H,
  backgroundColor: '#050711',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: undefined },
  scene: [BootScene, LobbyScene, GameScene, ResultsScene],
};

new Phaser.Game(config);
