import Phaser from 'phaser';
import type { Catalog } from '../../shared/catalog';
import { HEROES, HERO_IDS } from '../../sim/frameData';
import type { HeroId } from '../../sim/types';
import { openFaceCropper } from '../../face/cropper';
import { VIEW_W, VIEW_H } from '../../sim/types';

const PALETTE = { bg: 0x050711, panel: 0x0b1730, line: 0x344861, accent: 0xffcf5c, cyan: 0x75f5dc, text: 0xf3f4e8, muted: 0x9bb1c9 };

function addTextureFromDataUrl(scene: Phaser.Scene, key: string, dataUrl: string): Promise<void> {
  return new Promise((resolve) => {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.once(Phaser.Textures.Events.ADD, () => resolve());
    scene.textures.addBase64(key, dataUrl);
  });
}

export class LobbyScene extends Phaser.Scene {
  constructor() { super('Lobby'); }

  private catalog!: Catalog;
  private heroPick: [HeroId, HeroId | null] = ['nepho', null];
  private coop = false;
  private faceKeys: [string | null, string | null] = [null, null];
  private cards: Record<HeroId, Phaser.GameObjects.Container> = {} as any;
  private startLevel = 1;
  private statusText!: Phaser.GameObjects.Text;
  private netMode: 'local' | 'host' | 'guest' = 'local';
  private roomCode: string | null = null;

  create(): void {
    this.catalog = this.registry.get('catalog');
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, PALETTE.bg).setOrigin(0, 0);
    this.add.image(VIEW_W / 2, 46, 'logo').setDisplaySize(162, 48);
    this.add.text(VIEW_W / 2, 92, 'NEPHO: CIRCUIT BREAKERS', { fontFamily: 'monospace', fontSize: '16px', color: '#ffcf5c' }).setOrigin(0.5);

    this.add.text(24, 118, 'PLAYER 1 — PICK A HERO', { fontFamily: 'monospace', fontSize: '12px', color: '#9bb1c9' });
    HERO_IDS.forEach((id, i) => this.buildHeroCard(id, 24 + i * 116, 138, 0));

    const coopBtn = this.makeButton(VIEW_W - 150, 118, 126, 26, 'LAN CO-OP: OFF', () => {
      this.coop = !this.coop;
      coopBtn.text.setText(`LAN CO-OP: ${this.coop ? 'ON' : 'OFF'}`);
      netRow.setVisible(this.coop);
      if (!this.coop) { this.netMode = 'local'; this.roomCode = null; }
    });

    const netRow = this.add.container(0, 0).setVisible(false);
    const hostBtn = this.makeButton(VIEW_W - 260, 150, 110, 24, 'HOST GAME', () => this.startAsHost());
    const joinBtn = this.makeButton(VIEW_W - 140, 150, 110, 24, 'JOIN GAME', () => this.promptJoin());
    netRow.add([hostBtn.g, hostBtn.text, joinBtn.g, joinBtn.text]);

    this.add.text(24, 264, 'YOUR FACE (optional)', { fontFamily: 'monospace', fontSize: '12px', color: '#9bb1c9' });
    const faceBtn = this.makeButton(24, 284, 150, 30, 'SET FACE — P1', async () => {
      const skin = HEROES[this.heroPick[0]].colour;
      const outline = 0x1a1420;
      const res = await openFaceCropper(hexToRgb(0xd39178), hexToRgb(0x16121e));
      void skin; void outline;
      if (!res) return;
      const key = 'face-p1';
      await addTextureFromDataUrl(this, key, res.dataUrl);
      this.faceKeys[0] = key;
      faceBtn.text.setText('FACE SET — P1 ✓');
      this.refreshFacePreview();
    });

    this.statusText = this.add.text(VIEW_W / 2, VIEW_H - 96, '', { fontFamily: 'monospace', fontSize: '12px', color: '#75f5dc' }).setOrigin(0.5);

    this.add.text(24, VIEW_H - 70, 'LEVEL', { fontFamily: 'monospace', fontSize: '11px', color: '#9bb1c9' });
    const levelText = this.add.text(90, VIEW_H - 71, '1 — RISHON LEZION', { fontFamily: 'monospace', fontSize: '11px', color: '#f3f4e8' });
    this.makeButton(24, VIEW_H - 48, 26, 22, '◀', () => { this.startLevel = Math.max(1, this.startLevel - 1); levelText.setText(`${this.startLevel} — ${this.catalog.levels[this.startLevel - 1].name}`); });
    this.makeButton(58, VIEW_H - 48, 26, 22, '▶', () => { this.startLevel = Math.min(10, this.startLevel + 1); levelText.setText(`${this.startLevel} — ${this.catalog.levels[this.startLevel - 1].name}`); });

    const start = this.makeButton(VIEW_W / 2, VIEW_H - 30, 180, 34, 'START', () => this.tryStart(), 0x75f5dc, 0x0b1730);
    void start;

    this.highlightCard();
  }

  private buildHeroCard(id: HeroId, x: number, y: number, slot: number): void {
    const def = HEROES[id];
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 104, 118, PALETTE.panel).setOrigin(0, 0).setStrokeStyle(2, PALETTE.line).setInteractive({ useHandCursor: true });
    const img = this.add.image(52, 44, `card-${id}`).setDisplaySize(84, 64);
    const name = this.add.text(52, 84, def.name, { fontFamily: 'monospace', fontSize: '11px', color: '#f3f4e8' }).setOrigin(0.5);
    const bias = this.add.text(52, 100, def.bias, { fontFamily: 'monospace', fontSize: '7px', color: '#9bb1c9', align: 'center', wordWrap: { width: 96 } }).setOrigin(0.5, 0);
    c.add([bg, img, name, bias]);
    bg.on('pointerdown', () => { this.heroPick[0] = id; this.highlightCard(); });
    this.cards[id] = c;
    void slot;
  }

  private highlightCard(): void {
    for (const id of HERO_IDS) {
      const c = this.cards[id];
      const bg = c.list[0] as Phaser.GameObjects.Rectangle;
      bg.setStrokeStyle(2, id === this.heroPick[0] ? PALETTE.cyan : PALETTE.line);
    }
  }

  private refreshFacePreview(): void {}

  private makeButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void, fill = 0x14243d, textColour: number = PALETTE.text): { g: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const g = this.add.rectangle(x, y, w, h, fill).setOrigin(w > 150 ? 0.5 : 0, 0).setStrokeStyle(1, PALETTE.line).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + (w > 150 ? 0 : w / 2), y + h / 2, label, { fontFamily: 'monospace', fontSize: '11px', color: Phaser.Display.Color.IntegerToColor(textColour).rgba }).setOrigin(0.5);
    g.on('pointerdown', onClick);
    g.on('pointerover', () => g.setFillStyle(fill === 0x14243d ? 0x1c2f4d : fill));
    g.on('pointerout', () => g.setFillStyle(fill));
    return { g, text };
  }

  private async startAsHost(): Promise<void> {
    this.netMode = 'host';
    this.statusText.setText('starting host…');
    const { wsUrlFromLocation, HostSession } = await import('../../net/session');
    const seed = Math.floor(Math.random() * 1e9);
    const session = new HostSession(wsUrlFromLocation(), seed, this.startLevel, this.heroPick);
    session.events.onRoom = (code) => {
      this.roomCode = code;
      const joinUrl = `${location.origin}/?join=${code}`;
      this.statusText.setText(`Room ${code} — have your co-op partner open:\n${joinUrl}`);
      this.renderQr(joinUrl);
    };
    session.events.onPeer = (joined) => { if (joined) this.statusText.setText(`Player 2 connected! Press START.`); };
    session.events.onError = (m) => this.statusText.setText(`error: ${m}`);
    session.connect();
    this.registry.set('pendingHostSession', session);
  }

  private renderQr(url: string): void {
    import('qrcode').then((QR) => {
      QR.toDataURL(url, { margin: 1, width: 128, color: { dark: '#050711', light: '#f3f4e8' } }).then((dataUrl) => {
        addTextureFromDataUrl(this, 'qr', dataUrl).then(() => {
          this.children.getByName('qr')?.destroy();
          this.add.image(VIEW_W - 74, VIEW_H - 140, 'qr').setName('qr').setScale(0.75);
        });
      });
    }).catch(() => {});
  }

  private promptJoin(): void {
    const code = prompt('Enter the 4-letter room code shown on the host screen:');
    if (!code) return;
    this.netMode = 'guest';
    this.roomCode = code.toUpperCase();
    this.statusText.setText(`joining room ${this.roomCode}…`);
  }

  private tryStart(): void {
    const heroes: [HeroId, HeroId | null] = this.coop ? [this.heroPick[0], this.heroPick[1] || pickOther(this.heroPick[0])] : [this.heroPick[0], null];
    if (this.netMode === 'guest' && this.roomCode) {
      this.scene.start('Game', { mode: 'guest', roomCode: this.roomCode, heroId: heroes[0], faceKeys: this.faceKeys });
      return;
    }
    if (this.netMode === 'host') {
      const session = this.registry.get('pendingHostSession');
      this.scene.start('Game', { mode: 'host', session, level: this.startLevel, heroes, faceKeys: this.faceKeys });
      return;
    }
    this.scene.start('Game', { mode: 'local', level: this.startLevel, heroes, faceKeys: this.faceKeys, seed: Math.floor(Math.random() * 1e9) });
  }
}

function pickOther(a: HeroId): HeroId { return HERO_IDS.find((h) => h !== a) || 'riva'; }
function hexToRgb(hex: number): [number, number, number] { return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]; }
