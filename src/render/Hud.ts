import Phaser from 'phaser';
import type { Snapshot } from '../sim/types';
import { HEROES } from '../sim/frameData';
import type { HeroId } from '../sim/types';
import { VIEW_W } from '../sim/types';

interface PlayerHud { root: Phaser.GameObjects.Container; hpBg: Phaser.GameObjects.Rectangle; hp: Phaser.GameObjects.Rectangle; meterBg: Phaser.GameObjects.Rectangle; meter: Phaser.GameObjects.Rectangle; name: Phaser.GameObjects.Text; combo: Phaser.GameObjects.Text; face: Phaser.GameObjects.Image | null }

/** In-canvas arcade HUD: per-player HP/meter bars with a small face chip, boss health bar, wave/timer,
 * combo readout, and a "GO" arrow during camera transitions. Inline Graphics/Text, no image UI. */
export class Hud {
  private scene: Phaser.Scene;
  private players: PlayerHud[] = [];
  private bossBar: { root: Phaser.GameObjects.Container; bg: Phaser.GameObjects.Rectangle; fg: Phaser.GameObjects.Rectangle; name: Phaser.GameObjects.Text } | null = null;
  private timerText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private goArrow: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, heroes: [HeroId, HeroId | null], faceTextureKeys: [string | null, string | null]) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(30000).setScrollFactor(0);
    for (let slot = 0; slot < 2; slot++) {
      const hid = heroes[slot];
      if (!hid) continue;
      const def = HEROES[hid];
      const x = slot === 0 ? 14 : VIEW_W - 214;
      const root = scene.add.container(x, 10);
      const hpBg = scene.add.rectangle(28, 6, 172, 12, 0x0b1730, 0.85).setOrigin(0, 0).setStrokeStyle(1, 0x344861);
      const hp = scene.add.rectangle(29, 7, 170, 10, def.colour).setOrigin(0, 0);
      const meterBg = scene.add.rectangle(28, 20, 172, 6, 0x0b1730, 0.85).setOrigin(0, 0).setStrokeStyle(1, 0x344861);
      const meter = scene.add.rectangle(29, 21, 0, 4, 0xffcf5c).setOrigin(0, 0);
      const name = scene.add.text(28, -10, def.name, { fontFamily: 'monospace', fontSize: '11px', color: '#f3f4e8' });
      const combo = scene.add.text(28, 28, '', { fontFamily: 'monospace', fontSize: '11px', color: '#ffcf5c' });
      let face: Phaser.GameObjects.Image | null = null;
      const faceKey = faceTextureKeys[slot];
      if (faceKey) { face = scene.add.image(12, 12, faceKey).setDisplaySize(24, 24); }
      else { face = scene.add.image(12, 12, '__WHITE').setDisplaySize(24, 24).setTint(def.colour); }
      root.add([hpBg, hp, meterBg, meter, name, combo, face]);
      this.container.add(root);
      this.players.push({ root, hpBg, hp, meterBg, meter, name, combo, face });
    }
    this.timerText = scene.add.text(VIEW_W / 2, 12, '0:00', { fontFamily: 'monospace', fontSize: '16px', color: '#f3f4e8' }).setOrigin(0.5, 0);
    this.waveText = scene.add.text(VIEW_W / 2, 32, '', { fontFamily: 'monospace', fontSize: '11px', color: '#9bb1c9' }).setOrigin(0.5, 0);
    this.goArrow = scene.add.text(VIEW_W / 2, VIEW_H_HALF, 'GO ►', { fontFamily: 'monospace', fontSize: '28px', color: '#ffcf5c', fontStyle: 'bold' }).setOrigin(0.5).setVisible(false);
    this.container.add([this.timerText, this.waveText, this.goArrow]);
  }

  update(s: Snapshot): void {
    for (const p of s.entities.filter((e) => e.kind === 'hero')) {
      const hud = this.players[p.slot];
      if (!hud) continue;
      hud.hp.width = 170 * Math.max(0, p.hp);
      hud.hp.fillColor = p.hp > 0.3 ? hud.hp.fillColor : 0xff4f72;
      hud.meter.width = 170 * p.meter;
      hud.combo.setText(p.combo > 1 ? `${p.combo} HIT` : '');
    }
    if (s.bossId && s.bossMaxHp > 0) {
      if (!this.bossBar) {
        const root = this.scene.add.container(VIEW_W / 2, 46);
        const bg = this.scene.add.rectangle(0, 0, 420, 14, 0x0b1730, 0.85).setStrokeStyle(1, 0x344861);
        const fg = this.scene.add.rectangle(-208, -5, 416, 10, 0xff4f72).setOrigin(0, 0);
        const name = this.scene.add.text(0, -22, '', { fontFamily: 'monospace', fontSize: '13px', color: '#ff9357' }).setOrigin(0.5);
        root.add([bg, fg, name]); this.container.add(root);
        this.bossBar = { root, bg, fg, name };
      }
      this.bossBar.root.setVisible(s.phase === 'boss');
      this.bossBar.fg.width = 416 * Math.max(0, s.bossHp);
      this.bossBar.name.setText(s.bossId.replace(/-/g, ' ').toUpperCase() + (s.enrage ? ' — ENRAGED' : ''));
    } else if (this.bossBar) { this.bossBar.root.setVisible(false); }
    const mins = Math.floor(s.timer / 60), secs = Math.floor(s.timer % 60);
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    this.waveText.setText(s.phase === 'boss' ? 'BOSS' : s.phase === 'wave' ? `WAVE ${s.wave}` : '');
    this.goArrow.setVisible(s.go);
    if (s.go) this.goArrow.setAlpha(0.6 + 0.4 * Math.sin(s.tick / 6));
  }

  destroy(): void { this.container.destroy(); }
}

const VIEW_H_HALF = 270;
