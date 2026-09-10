import Phaser from 'phaser';
import type { HeroId } from '../../sim/types';
import { VIEW_W, VIEW_H } from '../../sim/types';

interface ResultsData {
  result: 'victory' | 'gameover';
  level: number;
  score: [number, number];
  heroes: [HeroId, HeroId | null];
  faceKeys: [string | null, string | null];
  isLastLevel: boolean;
}

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(data: ResultsData): void {
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x050711).setOrigin(0, 0);
    const won = data.result === 'victory';
    const campaignDone = won && data.isLastLevel;
    const title = campaignDone ? 'CIRCUIT BREAKERS RESTORED' : won ? 'LEVEL CLEAR' : 'GAME OVER';
    this.add.text(VIEW_W / 2, 150, title, { fontFamily: 'monospace', fontSize: '26px', color: won ? '#75f5dc' : '#ff4f72', fontStyle: 'bold' }).setOrigin(0.5);
    const scoreLine = data.heroes[1] ? `P1 ${data.score[0]}   ·   P2 ${data.score[1]}` : `SCORE ${data.score[0]}`;
    this.add.text(VIEW_W / 2, 200, scoreLine, { fontFamily: 'monospace', fontSize: '16px', color: '#f3f4e8' }).setOrigin(0.5);
    if (campaignDone) {
      this.add.text(VIEW_W / 2, 240, 'Every ferried signal, every shard, every flame —\nyou answered them all as one.', {
        fontFamily: 'monospace', fontSize: '11px', color: '#9bb1c9', align: 'center',
      }).setOrigin(0.5);
    }

    const btn = (x: number, y: number, label: string, cb: () => void) => {
      const g = this.add.rectangle(x, y, 200, 36, 0x14243d).setStrokeStyle(1, 0x344861).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, { fontFamily: 'monospace', fontSize: '13px', color: '#f3f4e8' }).setOrigin(0.5);
      g.on('pointerdown', cb);
      g.on('pointerover', () => g.setFillStyle(0x1c2f4d));
      g.on('pointerout', () => g.setFillStyle(0x14243d));
      return { g, t };
    };

    if (won && !campaignDone) {
      btn(VIEW_W / 2, 300, `NEXT LEVEL: ${data.level + 1}`, () => {
        this.scene.start('Game', { mode: 'local', level: data.level + 1, heroes: data.heroes, faceKeys: data.faceKeys, seed: Math.floor(Math.random() * 1e9) });
      });
    } else if (!won) {
      btn(VIEW_W / 2, 300, 'RETRY LEVEL', () => {
        this.scene.start('Game', { mode: 'local', level: data.level, heroes: data.heroes, faceKeys: data.faceKeys, seed: Math.floor(Math.random() * 1e9) });
      });
    }
    btn(VIEW_W / 2, 346, 'BACK TO LOBBY', () => this.scene.start('Lobby'));
  }
}
