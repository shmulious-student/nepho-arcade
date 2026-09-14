import Phaser from 'phaser';
import type { Snapshot } from '../sim/types';
import { HEROES } from '../sim/frameData';
import type { FriendSetup } from '../sim/friends';
import type { HeroId } from '../sim/types';
import { VIEW_W, VIEW_H } from '../sim/types';
import { BOSS_DEFS } from '../sim/bosses';

interface PlayerHud {
  root: Phaser.GameObjects.Container; hp: Phaser.GameObjects.Rectangle; hpGhost: Phaser.GameObjects.Rectangle;
  meter: Phaser.GameObjects.Rectangle; meterLabel: Phaser.GameObjects.Text; combo: Phaser.GameObjects.Text;
  friend: Phaser.GameObjects.Text | null; friendBar: Phaser.GameObjects.Rectangle | null; lives: Phaser.GameObjects.Text; friendMode: string; friendName: string; lastHp: number; wasReady: boolean;
}

const BAR_W = 220;
const FONT = 'monospace';

/** In-canvas arcade HUD, sized for a phone held sideways: a card per player (portrait chip, name, a fat
 * HP bar with a damage ghost, a special meter that lights up when ready, the friend chip and combo
 * counter), the level clock and wave in the middle, a named boss bar, GO prompt and level banners.
 * Drawn at UI scale, outside the zoomed world container. */
/** The boss's roster name (public/game/roster.json), falling back to its id. */
const bossName = (id: string) => (BOSS_DEFS[id]?.name || id.replace(/-/g, ' ')).toUpperCase();

export class Hud {
  private scene: Phaser.Scene;
  private players: PlayerHud[] = [];
  private bossBar: { root: Phaser.GameObjects.Container; fg: Phaser.GameObjects.Rectangle; name: Phaser.GameObjects.Text } | null = null;
  private timerText: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private goArrow: Phaser.GameObjects.Text;
  private container: Phaser.GameObjects.Container;
  private lastWave = -1;

  private touch: boolean;

  constructor(scene: Phaser.Scene, heroes: [HeroId, HeroId | null], friends?: FriendSetup, touch = false) {
    this.touch = touch;
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(30000).setScrollFactor(0);
    for (let slot = 0; slot < 2; slot++) {
      const hid = heroes[slot];
      if (!hid) continue;
      const def = HEROES[hid];
      const right = slot === 1;
      const x = right ? VIEW_W - 14 - (BAR_W + 62) : 14;
      const root = scene.add.container(x, 10);
      const panel = scene.add.rectangle(0, 0, BAR_W + 62, 58, 0x0b1730, 0.72).setOrigin(0, 0).setStrokeStyle(1, 0x344861);
      // portrait chip: the hero's card art
      const chipBg = scene.add.rectangle(29, 29, 44, 44, def.colour, 1).setStrokeStyle(2, 0xf3f4e8);
      const chip = scene.add.image(29, 29, def.cardKey).setDisplaySize(42, 42);
      const name = scene.add.text(58, 6, def.name, { fontFamily: FONT, fontSize: '13px', color: '#f3f4e8', fontStyle: 'bold' });
      const lives = scene.add.text(58 + BAR_W, 6, '', { fontFamily: FONT, fontSize: '11px', color: '#9bb1c9' }).setOrigin(1, 0);
      const hpBg = scene.add.rectangle(58, 22, BAR_W, 14, 0x050711, 0.9).setOrigin(0, 0).setStrokeStyle(1, 0x344861);
      const hpGhost = scene.add.rectangle(59, 23, BAR_W - 2, 12, 0xff4f72, 0.6).setOrigin(0, 0);
      const hp = scene.add.rectangle(59, 23, BAR_W - 2, 12, def.colour).setOrigin(0, 0);
      const meterBg = scene.add.rectangle(58, 40, BAR_W, 8, 0x050711, 0.9).setOrigin(0, 0).setStrokeStyle(1, 0x344861);
      const meter = scene.add.rectangle(59, 41, 0, 6, 0xffcf5c).setOrigin(0, 0);
      const meterLabel = scene.add.text(58 + BAR_W, 40, 'SPECIAL', { fontFamily: FONT, fontSize: '9px', color: '#ffcf5c', fontStyle: 'bold' }).setOrigin(1, 0).setVisible(false);
      const combo = scene.add.text(58, 62, '', { fontFamily: FONT, fontSize: '15px', color: '#ffcf5c', fontStyle: 'bold', stroke: '#0b1730', strokeThickness: 4 });
      let friend: Phaser.GameObjects.Text | null = null, friendBar: Phaser.GameObjects.Rectangle | null = null;
      const fid = friends && friends.mode !== 'off' ? friends.friends[slot] : null;
      if (fid) {
        friend = scene.add.text(58, 51, `${friends!.mode === 'assist' ? 'ASSIST' : 'SIDEKICK'} · ${HEROES[fid].name}`, { fontFamily: FONT, fontSize: '9px', color: '#9bb1c9' }).setOrigin(0, 0);
        friendBar = scene.add.rectangle(59, 62, 0, 3, HEROES[fid].colour).setOrigin(0, 0);
        panel.height = 68; combo.setY(72);
      }
      const friendMode = friends?.mode ?? 'off', friendName = fid ? HEROES[fid].name : '';
      root.add([panel, chipBg, chip, name, lives, hpBg, hpGhost, hp, meterBg, meter, meterLabel, combo, ...(friend ? [friend, friendBar!] : [])]);
      this.container.add(root);
      this.players.push({ root, hp, hpGhost, meter, meterLabel, combo, friend, friendBar, lives, friendMode, friendName, lastHp: 1, wasReady: false });
    }
    this.timerText = scene.add.text(VIEW_W / 2, 10, '0:00', { fontFamily: FONT, fontSize: '20px', color: '#f3f4e8', fontStyle: 'bold', stroke: '#0b1730', strokeThickness: 4 }).setOrigin(0.5, 0);
    this.waveText = scene.add.text(VIEW_W / 2, 34, '', { fontFamily: FONT, fontSize: '12px', color: '#9bb1c9', stroke: '#0b1730', strokeThickness: 3 }).setOrigin(0.5, 0);
    this.goArrow = scene.add.text(VIEW_W - 80, VIEW_H * 0.5, 'GO ►', { fontFamily: FONT, fontSize: '34px', color: '#ffcf5c', fontStyle: 'bold', stroke: '#0b1730', strokeThickness: 6 }).setOrigin(0.5).setVisible(false);
    this.container.add([this.timerText, this.waveText, this.goArrow]);
  }

  update(s: Snapshot): void {
    for (const p of s.entities.filter((e) => e.kind === 'hero' && e.slot >= 0)) {
      const hud = this.players[p.slot];
      if (!hud) continue;
      const hpNow = Math.max(0, p.hp);
      hud.hp.width = (BAR_W - 2) * hpNow;
      hud.hp.fillColor = hpNow > 0.3 ? HEROES[p.arch as HeroId].colour : 0xff4f72;
      // the ghost bar trails damage so a big hit reads as a red slice draining away
      if (hpNow < hud.lastHp) hud.hpGhost.width = (BAR_W - 2) * hud.lastHp;
      hud.hpGhost.width = Math.max(hud.hp.width, hud.hpGhost.width - 1.2);
      hud.lastHp = hpNow;
      hud.meter.width = (BAR_W - 2) * p.meter;
      const ready = p.meter >= 0.999;
      hud.meterLabel.setVisible(ready);
      if (ready) { hud.meter.fillColor = (s.tick >> 3) % 2 ? 0xfff2b0 : 0xffcf5c; hud.meterLabel.setAlpha(0.6 + 0.4 * Math.sin(s.tick / 4)); }
      else hud.meter.fillColor = 0xffcf5c;
      if (ready && !hud.wasReady) this.pop(hud.meterLabel);
      hud.wasReady = ready;
      hud.lives.setText(`♥ ×${s.lives[p.slot] ?? 0}`);
      hud.combo.setText(p.combo > 1 ? `${p.combo} HIT COMBO` : '');
      if (p.combo > 1) hud.combo.setScale(1 + 0.15 * Math.max(0, 1 - ((s.tick % 8) / 8)));
      if (hud.friendBar) {
        const r = s.assist[p.slot] ?? 0; hud.friendBar.width = (BAR_W - 2) * r; hud.friend!.setColor(r >= 1 ? '#f3f4e8' : '#6b7a99');
        // on touch the card itself is the call button: say so when it is ready
        if (this.touch && hud.friendMode === 'assist') hud.friend!.setText(r >= 1 ? `TAP HERE · CALL ${hud.friendName}` : `ASSIST · ${hud.friendName}`);
      }
    }
    if (s.bossId && s.bossMaxHp > 0) {
      if (!this.bossBar) {
        const root = this.scene.add.container(VIEW_W / 2, 66);
        const bg = this.scene.add.rectangle(0, 0, 460, 16, 0x050711, 0.9).setStrokeStyle(1, 0xff9357);
        const fg = this.scene.add.rectangle(-228, -6, 456, 12, 0xff4f72).setOrigin(0, 0);
        const name = this.scene.add.text(0, -24, '', { fontFamily: FONT, fontSize: '13px', color: '#ff9357', fontStyle: 'bold', stroke: '#0b1730', strokeThickness: 3 }).setOrigin(0.5);
        root.add([bg, fg, name]); this.container.add(root);
        this.bossBar = { root, fg, name };
      }
      this.bossBar.root.setVisible(s.phase === 'boss');
      this.bossBar.fg.width = 456 * Math.max(0, s.bossHp);
      this.bossBar.name.setText(bossName(s.bossId) + (s.enrage ? ' — ENRAGED' : ''));
    } else if (this.bossBar) { this.bossBar.root.setVisible(false); }
    const mins = Math.floor(s.timer / 60), secs = Math.floor(s.timer % 60);
    this.timerText.setText(`${mins}:${secs.toString().padStart(2, '0')}`);
    this.waveText.setText(s.phase === 'boss' ? 'BOSS' : s.phase === 'wave' ? `WAVE ${s.wave}` : s.phase === 'go' ? 'MOVE ON' : '');
    if (s.phase === 'wave' && s.wave !== this.lastWave) { this.lastWave = s.wave; if (s.wave > 1) this.banner(`WAVE ${s.wave}`); }
    if (s.phase === 'boss' && this.lastWave !== 99) { this.lastWave = 99; this.banner('BOSS', bossName(s.bossId)); }
    if (s.phase === 'clear' && this.lastWave !== 100) { this.lastWave = 100; this.banner('BOSS DOWN!', s.level >= 10 ? 'YOU FOUND THEM' : 'STAGE CLEAR'); }
    this.goArrow.setVisible(s.go);
    if (s.go) { this.goArrow.setAlpha(0.6 + 0.4 * Math.sin(s.tick / 6)); this.goArrow.setX(VIEW_W - 80 + 6 * Math.sin(s.tick / 5)); }
  }

  /** A big centre-screen banner that slides in and fades — wave starts, the boss, level clear. */
  banner(title: string, subtitle = ''): void {
    const cx = VIEW_W / 2, cy = VIEW_H * 0.36;
    const band = this.scene.add.rectangle(cx, cy, VIEW_W, 64, 0x0b1730, 0.8).setOrigin(0.5).setScale(1, 0);
    const t = this.scene.add.text(cx, cy - (subtitle ? 8 : 0), title, { fontFamily: FONT, fontSize: '30px', color: '#ffcf5c', fontStyle: 'bold', stroke: '#0b1730', strokeThickness: 6, letterSpacing: 4 } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5).setAlpha(0);
    const sub = this.scene.add.text(cx, cy + 20, subtitle, { fontFamily: FONT, fontSize: '13px', color: '#f3f4e8', stroke: '#0b1730', strokeThickness: 3 }).setOrigin(0.5).setAlpha(0);
    const group = this.scene.add.container(0, 0, [band, t, sub]).setDepth(31000).setScrollFactor(0);
    this.scene.tweens.add({ targets: band, scaleY: 1, duration: 180, ease: 'Back.Out' });
    this.scene.tweens.add({ targets: [t, sub], alpha: 1, duration: 200, delay: 120 });
    this.scene.tweens.add({ targets: group, alpha: 0, delay: 1500, duration: 400, onComplete: () => group.destroy() });
  }

  private pop(obj: Phaser.GameObjects.Text): void {
    obj.setScale(1.6);
    this.scene.tweens.add({ targets: obj, scale: 1, duration: 260, ease: 'Back.Out' });
  }

  destroy(): void { this.container.destroy(); }
}
