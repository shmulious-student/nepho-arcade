import Phaser from 'phaser';
import { VIEW_W, VIEW_H } from '../sim/types';
import { synth } from '../audio/synth';

export interface PauseActions { resume: () => void; restart: () => void; lobby: () => void }

/** In-game pause overlay: RESUME / RESTART LEVEL / BACK TO LOBBY / SOUND, with the controls listed
 * underneath. Built from plain Phaser shapes and text on top of everything else, so it works the
 * same on desktop and phone. `canPause` is false for a LAN guest, who cannot freeze the host's
 * game: they still get the menu, minus RESTART. */
export class PauseMenu {
  private scene: Phaser.Scene;
  private root: Phaser.GameObjects.Container;
  private soundBtn!: Phaser.GameObjects.Text;
  open = false;

  constructor(scene: Phaser.Scene, actions: PauseActions, opts: { canPause: boolean; touch: boolean }) {
    this.scene = scene;
    const cx = VIEW_W / 2;
    const veil = scene.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x050711, 0.72).setOrigin(0, 0).setInteractive(); // eats clicks underneath
    const panel = scene.add.rectangle(cx, 250, 340, 300, 0x0b1730, 0.96).setStrokeStyle(2, 0x344861);
    const title = scene.add.text(cx, 128, 'PAUSED', { fontFamily: 'monospace', fontSize: '26px', color: '#ffcf5c', fontStyle: 'bold', letterSpacing: 6 } as Phaser.Types.GameObjects.Text.TextStyle).setOrigin(0.5);
    const items: Phaser.GameObjects.GameObject[] = [veil, panel, title];
    let y = 176;
    const button = (label: string, onClick: () => void, accent = false) => {
      const g = scene.add.rectangle(cx, y, 260, 36, accent ? 0x75f5dc : 0x14243d).setStrokeStyle(1, accent ? 0x75f5dc : 0x344861).setInteractive({ useHandCursor: true });
      const t = scene.add.text(cx, y, label, { fontFamily: 'monospace', fontSize: '14px', color: accent ? '#0b1730' : '#f3f4e8', fontStyle: 'bold' }).setOrigin(0.5);
      g.on('pointerdown', () => { synth.uiClick(); onClick(); });
      g.on('pointerover', () => g.setFillStyle(accent ? 0x9ffbe9 : 0x1c2f4d));
      g.on('pointerout', () => g.setFillStyle(accent ? 0x75f5dc : 0x14243d));
      items.push(g, t);
      y += 46;
      return t;
    };
    button('RESUME', actions.resume, true);
    if (opts.canPause) button('RESTART LEVEL', actions.restart);
    button('BACK TO LOBBY', actions.lobby);
    this.soundBtn = button(synth.muted ? 'SOUND: OFF' : 'SOUND: ON', () => { synth.setMuted(!synth.muted); this.soundBtn.setText(synth.muted ? 'SOUND: OFF' : 'SOUND: ON'); });
    const help = opts.touch
      ? 'stick: move · hold DSH + stick sideways: run · ATK / HVY / JMP · SPC when lit · hold BLK · tap your card to call a friend'
      : 'WASD move · J light · K heavy · SPACE jump · hold L + direction: run · I special · U block · H friend · ESC pause';
    items.push(scene.add.text(cx, y + 12, help, { fontFamily: 'monospace', fontSize: '9px', color: '#9bb1c9', align: 'center', wordWrap: { width: 320 } }).setOrigin(0.5, 0));
    this.root = scene.add.container(0, 0, items).setDepth(50000).setScrollFactor(0).setVisible(false);
  }

  show(): void { this.open = true; this.root.setVisible(true); }
  hide(): void { this.open = false; this.root.setVisible(false); }
  destroy(): void { this.root.destroy(); }
}
