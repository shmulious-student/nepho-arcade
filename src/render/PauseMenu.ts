import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../sim/types';
import { uiOffsetX } from './viewport';
import { synth } from '../audio/synth';
import { getLang, setLang, langLabel } from '../shared/lang';
import { t, ls, uiFont, uiSize } from '../shared/i18n';

export interface PauseActions { resume: () => void; restart: () => void; lobby: () => void; language?: () => void }

/** In-game pause overlay: RESUME / RESTART LEVEL / BACK TO LOBBY / SOUND, with the controls listed
 * underneath. Built from plain Phaser shapes and text on top of everything else, so it works the
 * same on desktop and phone. `canPause` is false for a LAN guest, who cannot freeze the host's
 * game: they still get the menu, minus RESTART. */
export class PauseMenu {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private soundBtn!: Phaser.GameObjects.Text;
  open = false;
  private veil: Phaser.GameObjects.Rectangle;

  constructor(scene: Phaser.Scene, actions: PauseActions, opts: { canPause: boolean; touch: boolean }) {
    this.scene = scene;
    const cx = VIEW_W / 2;
    const veil = this.veil = scene.add.rectangle(-uiOffsetX(scene), 0, scene.scale.width, VIEW_H, 0x050711, 0.72).setOrigin(0, 0).setInteractive(); // the whole canvas — eats clicks underneath
    const panel = scene.add.rectangle(cx, 262, 340, 350, 0x0b1730, 0.96).setStrokeStyle(2, 0x344861);
    const title = scene.add.text(cx, 128, t('paused'), { fontFamily: uiFont(), fontSize: uiSize(26), color: '#ffcf5c', fontStyle: 'bold', letterSpacing: ls(6) } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [veil, panel, title];
    let y = 176;
    const button = (label: string, onClick: () => void, accent = false) => {
      const g = scene.add.rectangle(cx, y, 260, 36, accent ? 0x75f5dc : 0x14243d).setStrokeStyle(1, accent ? 0x75f5dc : 0x344861).setInteractive({ useHandCursor: true });
      const t = scene.add.text(cx, y, label, { fontFamily: uiFont(), fontSize: uiSize(14), color: accent ? '#0b1730' : '#f3f4e8', fontStyle: 'bold' }).setOrigin(0.5);
      g.on('pointerdown', () => { synth.uiClick(); onClick(); });
      g.on('pointerover', () => g.setFillStyle(accent ? 0x9ffbe9 : 0x1c2f4d));
      g.on('pointerout', () => g.setFillStyle(accent ? 0x75f5dc : 0x14243d));
      items.push(g, t);
      y += 46;
      return t;
    };
    button(t('resume'), actions.resume, true);
    if (opts.canPause) button(t('restartLevel'), actions.restart);
    button(t('backToLobby'), actions.lobby);
    const soundLabel = () => `${t('sound')}: ${synth.muted ? t('off') : t('on')}`;
    this.soundBtn = button(soundLabel(), () => { synth.setMuted(!synth.muted); this.soundBtn.setText(soundLabel()); });
    // the language of the dialog text
    const langBtn = button(langLabel(getLang()), () => { setLang(getLang() === 'he' ? 'en' : 'he'); langBtn.setText(langLabel(getLang())); actions.language?.(); });
    const help = opts.touch ? t('helpTouch') : t('helpKeys');
    items.push(scene.add.text(cx, y + 12, help, { fontFamily: uiFont(), fontSize: uiSize(9), color: '#9bb1c9', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5, 0));
    this.root = scene.add.container(0, 0, items).setDepth(50000).setVisible(false);
  }

  show(): void { this.open = true; this.root.setVisible(true); }
  /** The canvas changed width: the veil over all of it again. */
  relayout(): void { this.veil.setX(-uiOffsetX(this.scene)); this.veil.width = this.scene.scale.width; }
  hide(): void { this.open = false; this.root.setVisible(false); }
  destroy(): void { this.root.destroy(); }
}
