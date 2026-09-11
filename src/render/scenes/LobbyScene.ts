import Phaser from 'phaser';
import type { Catalog } from '../../shared/catalog';
import { HEROES, HERO_IDS } from '../../sim/frameData';
import type { FriendMode } from '../../sim/friends';
import type { HeroId } from '../../sim/types';
import { openFaceCropper } from '../../face/cropper';
import { VIEW_W, VIEW_H } from '../../sim/types';
import { synth } from '../../audio/synth';

const PALETTE = { bg: 0x050711, panel: 0x0b1730, line: 0x344861, accent: 0xffcf5c, cyan: 0x75f5dc, text: 0xf3f4e8, muted: 0x9bb1c9 };

function addTextureFromDataUrl(scene: Phaser.Scene, key: string, dataUrl: string): Promise<void> {
  return new Promise((resolve) => {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.once(Phaser.Textures.Events.ADD, (addedKey: string) => {
      // pixelArt:true in the game config sets the default filter for textures loaded through the
      // normal preload pipeline, but a texture added dynamically via addBase64 needs it set
      // explicitly, or WebGL falls back to LINEAR — smoothing the deliberately blocky, posterized
      // face texture into a blurry smear when FaceRig scales it down onto a hero's head.
      if (addedKey === key) scene.textures.get(key).setFilter(Phaser.Textures.FilterMode.NEAREST);
      resolve();
    });
    scene.textures.addBase64(key, dataUrl);
  });
}

export class LobbyScene extends Phaser.Scene {
  constructor() { super('Lobby'); }

  private catalog!: Catalog;
  private heroPick: [HeroId, HeroId | null] = ['eviatar', null];
  private coop = false;
  private faceKeys: [string | null, string | null] = [null, null];
  private cards: Record<HeroId, Phaser.GameObjects.Container> = {} as any;
  private startLevel = 1;
  private friendPick: HeroId = 'omri';
  private friendMode: FriendMode = 'assist';
  private friendText!: Phaser.GameObjects.Text;
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

    // Friend: one of the other heroes fights beside you — called in for their special (ASSIST) or
    // along for the whole level as an AI ally (SIDEKICK).
    this.add.text(200, 264, 'FRIEND (helps you)', { fontFamily: 'monospace', fontSize: '12px', color: '#9bb1c9' });
    this.makeButton(200, 284, 26, 22, '◀', () => this.cycleFriend(-1));
    this.friendText = this.add.text(234, 290, '', { fontFamily: 'monospace', fontSize: '10px', color: '#f3f4e8' });
    this.makeButton(392, 284, 26, 22, '▶', () => this.cycleFriend(1));
    const modeBtn = this.makeButton(430, 284, 130, 22, '', () => {
      this.friendMode = this.friendMode === 'assist' ? 'sidekick' : this.friendMode === 'sidekick' ? 'off' : 'assist';
      modeBtn.text.setText(`MODE: ${this.friendMode.toUpperCase()}`);
    });
    modeBtn.text.setText(`MODE: ${this.friendMode.toUpperCase()}`);
    this.cycleFriend(0);

    // Everything below used to be pinned to the very bottom few pixels (VIEW_H-96..VIEW_H-30) with a
    // large empty gap above it — fragile even without a viewport bug, since it left almost no margin
    // for the most important control (START) before the edge of the canvas. Spread across the middle
    // instead, so a few pixels of viewport miscalculation can never crop it off-screen entirely.
    this.statusText = this.add.text(VIEW_W / 2, 356, '', { fontFamily: 'monospace', fontSize: '12px', color: '#75f5dc', align: 'center' }).setOrigin(0.5);

    this.add.text(24, 398, 'LEVEL', { fontFamily: 'monospace', fontSize: '11px', color: '#9bb1c9' });
    const levelText = this.add.text(90, 397, '1 — RISHON LEZION', { fontFamily: 'monospace', fontSize: '11px', color: '#f3f4e8' });
    this.makeButton(24, 420, 26, 22, '◀', () => { this.startLevel = Math.max(1, this.startLevel - 1); levelText.setText(`${this.startLevel} — ${this.catalog.levels[this.startLevel - 1].name}`); });
    this.makeButton(58, 420, 26, 22, '▶', () => { this.startLevel = Math.min(10, this.startLevel + 1); levelText.setText(`${this.startLevel} — ${this.catalog.levels[this.startLevel - 1].name}`); });

    const start = this.makeButton(VIEW_W / 2, 466, 180, 34, 'START', () => this.tryStart(), 0x75f5dc, 0x0b1730);
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
    bg.on('pointerdown', () => { this.heroPick[0] = id; this.highlightCard(); this.cycleFriend(0); });
    this.cards[id] = c;
    void slot;
  }

  /** Moves the friend pick by `dir` among the heroes the player is not playing. */
  private cycleFriend(dir: number): void {
    const pool = HERO_IDS.filter((h) => h !== this.heroPick[0]);
    let i = pool.indexOf(this.friendPick);
    if (i < 0) i = 0; else i = (i + dir + pool.length) % pool.length;
    this.friendPick = pool[i];
    this.friendText.setText(`${HEROES[this.friendPick].name} · ${HEROES[this.friendPick].bias.split(' · ')[1] || ''}`.slice(0, 24));
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
    g.on('pointerdown', () => { synth.unlock(); synth.uiClick(); onClick(); });
    g.on('pointerover', () => g.setFillStyle(fill === 0x14243d ? 0x1c2f4d : fill));
    g.on('pointerout', () => g.setFillStyle(fill));
    return { g, text };
  }

  private async startAsHost(): Promise<void> {
    this.netMode = 'host';
    this.statusText.setText('starting host…');
    const { wsUrlFromLocation, HostSession } = await import('../../net/session');
    const session = new HostSession(wsUrlFromLocation());
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
          this.add.image(VIEW_W - 74, 280, 'qr').setName('qr').setScale(0.75);
        });
      });
    }).catch(() => {});
  }

  private promptJoin(): void {
    // A DOM modal instead of window.prompt(): native prompt() is unreliable in embedded/mobile
    // webviews and can't be driven by automated testing, and a real on-screen keypad is friendlier
    // for a 4-character code on a touch device anyway.
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(5,7,17,.88);z-index:9999;display:flex;align-items:center;justify-content:center;font-family:monospace;color:#f3f4e8;';
    const panel = document.createElement('div');
    panel.style.cssText = 'background:#0b1730;border:2px solid #344861;border-radius:10px;padding:22px;width:min(90vw,300px);text-align:center;';
    panel.innerHTML = `
      <div style="font-size:13px;color:#ffcf5c;margin-bottom:12px;letter-spacing:.06em;">ROOM CODE</div>
      <input id="nepho-join-code" maxlength="4" autocomplete="off" autocapitalize="characters"
        style="width:100%;font:700 28px monospace;letter-spacing:.3em;text-align:center;background:#14243d;
        border:1px solid #344861;color:#75f5dc;border-radius:6px;padding:10px 0;text-transform:uppercase;" />
      <div style="display:flex;gap:8px;justify-content:center;margin-top:14px;">
        <button id="nepho-join-cancel" style="background:#14243d;border:1px solid #344861;color:#f3f4e8;padding:8px 14px;border-radius:6px;font-family:monospace;">CANCEL</button>
        <button id="nepho-join-ok" style="background:#75f5dc;border:none;color:#0b1730;padding:8px 14px;border-radius:6px;font-family:monospace;font-weight:bold;">JOIN</button>
      </div>`;
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    const input = panel.querySelector('#nepho-join-code') as HTMLInputElement;
    const close = () => document.body.removeChild(overlay);
    const submit = () => {
      const code = input.value.trim().toUpperCase();
      if (code.length !== 4) { input.focus(); return; }
      this.netMode = 'guest';
      this.roomCode = code;
      this.statusText.setText(`joining room ${this.roomCode}…`);
      close();
    };
    input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    panel.querySelector('#nepho-join-ok')!.addEventListener('click', submit);
    panel.querySelector('#nepho-join-cancel')!.addEventListener('click', close);
    input.focus();
  }

  private tryStart(): void {
    const heroes: [HeroId, HeroId | null] = this.coop ? [this.heroPick[0], this.heroPick[1] || pickOther(this.heroPick[0])] : [this.heroPick[0], null];
    // P2's friend is whoever is left over once both players and P1's friend are taken
    const p2Friend = heroes[1] ? HERO_IDS.find((h) => h !== heroes[0] && h !== heroes[1] && h !== this.friendPick) || null : null;
    const friends = { friends: [this.friendPick, p2Friend] as [HeroId | null, HeroId | null], mode: this.friendMode };
    if (this.netMode === 'guest' && this.roomCode) {
      this.scene.start('Game', { mode: 'guest', roomCode: this.roomCode, heroId: heroes[0], faceKeys: this.faceKeys });
      return;
    }
    if (this.netMode === 'host') {
      const session = this.registry.get('pendingHostSession');
      session.start(Math.floor(Math.random() * 1e9), this.startLevel, heroes, friends);
      this.scene.start('Game', { mode: 'host', session, level: this.startLevel, heroes, faceKeys: this.faceKeys, friends });
      return;
    }
    this.scene.start('Game', { mode: 'local', level: this.startLevel, heroes, faceKeys: this.faceKeys, seed: Math.floor(Math.random() * 1e9), friends });
  }
}

function pickOther(a: HeroId): HeroId { return HERO_IDS.find((h) => h !== a) || 'riva'; }
function hexToRgb(hex: number): [number, number, number] { return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff]; }
