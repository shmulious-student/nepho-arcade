import Phaser from 'phaser';
import type { HeroId } from '../../sim/types';
import { VIEW_W, VIEW_H } from '../../sim/types';
import { t, uiFont, uiSize } from '../../shared/i18n';
import { centreUiCamera } from '../viewport';

interface ResultsData {
  result: 'victory' | 'gameover';
  level: number;
  score: [number, number];
  heroes: [HeroId, HeroId | null];
  friends?: import('../../sim/friends').FriendSetup;
  isLastLevel: boolean;
  mode?: 'local' | 'host' | 'guest'; // a LAN run cannot be retried from here: only the lobby can start a new room
  difficulty?: import('../../sim/difficulty').Difficulty;
}

const BEST_KEY = 'nepho.best';

export class ResultsScene extends Phaser.Scene {
  constructor() { super('Results'); }

  create(data: ResultsData): void {
    centreUiCamera(this);
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x050711).setOrigin(0, 0);
    const won = data.result === 'victory';
    const campaignDone = won && data.isLastLevel;
    const title = campaignDone ? t('campaignDone') : won ? t('levelClearTitle') : t('gameOver');
    this.add.text(VIEW_W / 2, 150, title, { fontFamily: uiFont(), fontSize: uiSize(26), color: won ? '#75f5dc' : '#ff4f72', fontStyle: 'bold' }).setOrigin(0.5);
    const scoreLine = data.heroes[1] ? `P1 ${data.score[0]}   ·   P2 ${data.score[1]}` : `${t('score')} ${data.score[0]}`;
    this.add.text(VIEW_W / 2, 200, scoreLine, { fontFamily: uiFont(), fontSize: uiSize(16), color: '#f3f4e8' }).setOrigin(0.5);
    // the run's total against the best one this browser has seen
    const total = data.score[0] + data.score[1];
    let best = 0;
    try { best = Number(localStorage.getItem(BEST_KEY)) || 0; } catch { /* private mode */ }
    const newBest = total > best;
    if (newBest) { best = total; try { localStorage.setItem(BEST_KEY, String(best)); } catch { /* private mode */ } }
    this.add.text(VIEW_W / 2, 222, newBest ? `${t('newBest')}  ${best}` : `${t('best')}  ${best}`, { fontFamily: uiFont(), fontSize: uiSize(12), color: newBest ? '#ffcf5c' : '#9bb1c9' }).setOrigin(0.5);
    if (campaignDone) {
      this.add.text(VIEW_W / 2, 248, t('epilogue'), {
        fontFamily: uiFont(), fontSize: uiSize(11), color: '#9bb1c9', align: 'center',
      }).setOrigin(0.5);
    }

    const btn = (x: number, y: number, label: string, cb: () => void) => {
      const g = this.add.rectangle(x, y, 200, 36, 0x14243d).setStrokeStyle(1, 0x344861).setInteractive({ useHandCursor: true });
      const t = this.add.text(x, y, label, { fontFamily: uiFont(), fontSize: uiSize(13), color: '#f3f4e8' }).setOrigin(0.5);
      g.on('pointerdown', cb);
      g.on('pointerover', () => g.setFillStyle(0x1c2f4d));
      g.on('pointerout', () => g.setFillStyle(0x14243d));
      return { g, t };
    };

    const local = (data.mode ?? 'local') === 'local';
    if (!local) {
      this.add.text(VIEW_W / 2, 262, t('lanEnded'), { fontFamily: uiFont(), fontSize: uiSize(11), color: '#9bb1c9' }).setOrigin(0.5);
    } else if (won && !campaignDone) {
      btn(VIEW_W / 2, 300, t('nextLevel', { n: data.level + 1 }), () => {
        this.scene.start('Game', { mode: 'local', level: data.level + 1, heroes: data.heroes, friends: data.friends, seed: Math.floor(Math.random() * 1e9), difficulty: data.difficulty });
      });
    } else if (!won && local) {
      btn(VIEW_W / 2, 300, t('retryLevel'), () => {
        this.scene.start('Game', { mode: 'local', level: data.level, heroes: data.heroes, friends: data.friends, seed: Math.floor(Math.random() * 1e9), difficulty: data.difficulty });
      });
    }
    btn(VIEW_W / 2, 346, t('backToLobby'), () => this.scene.start('Lobby'));
  }
}
