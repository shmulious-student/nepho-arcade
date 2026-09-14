import Phaser from 'phaser';
import { catalogLevel } from '../../shared/catalog';
import { getLang, setLang, langLabel } from '../../shared/lang';
import { centreUiCamera, onViewportResize } from '../viewport';
import { t, isHebrew, difficultyName, heroBias, uiFont, uiSize } from '../../shared/i18n';
import { getDifficulty, setDifficulty } from '../../shared/difficultySetting';
import { CONTENT_URL } from '../../content/updater';
import { DIFFICULTIES, isDifficulty } from '../../sim/difficulty';
import type { Catalog } from '../../shared/catalog';
import { HEROES } from '../../sim/frameData';
import { ACTIVE_HEROES as HERO_IDS } from '../../sim/roster';
import type { FriendMode } from '../../sim/friends';
import { isTouchDevice } from './GameScene';
import { TouchControls } from '../TouchControls';
import type { HeroId } from '../../sim/types';
import { VIEW_W, VIEW_H } from '../../sim/types';
import { synth } from '../../audio/synth';
import { LEVEL_COUNT } from '../../sim/levels';

const PALETTE = { bg: 0x050711, panel: 0x0b1730, field: 0x14243d, hover: 0x1c2f4d, line: 0x344861, accent: 0xffcf5c, cyan: 0x75f5dc, purple: 0xc58cff, text: 0xf3f4e8, muted: 0x9bb1c9 };
const rgba = (c: number): string => Phaser.Display.Color.IntegerToColor(c).rgba;

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

/** A flat button: a box with a centred label; `active` paints it in the accent colour. */
function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, label: string, onClick: () => void, size = 11, active = false): { g: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text; setActive: (on: boolean) => void } {
  const g = scene.add.rectangle(x, y, w, h, PALETTE.field).setOrigin(0, 0).setStrokeStyle(1, PALETTE.line).setInteractive({ useHandCursor: true });
  const text = scene.add.text(x + w / 2, y + h / 2, label, { fontFamily: uiFont(), fontSize: uiSize(size), color: rgba(PALETTE.text), fontStyle: 'bold' }).setOrigin(0.5);
  let isActive = active;
  const paint = (hover = false) => {
    if (isActive) { g.setFillStyle(PALETTE.cyan).setStrokeStyle(1, PALETTE.cyan); text.setColor(rgba(PALETTE.panel)); }
    else { g.setFillStyle(hover ? PALETTE.hover : PALETTE.field).setStrokeStyle(1, PALETTE.line); text.setColor(rgba(PALETTE.text)); }
  };
  g.on('pointerdown', () => { synth.unlock(); synth.uiClick(); onClick(); });
  g.on('pointerover', () => paint(true));
  g.on('pointerout', () => paint(false));
  paint();
  return { g, text, setActive: (on) => { isActive = on; paint(); } };
}

/** A row of equal buttons where exactly one is lit — the lobby's way of showing every choice at
 * once (difficulty, friend mode, players, control size) instead of a button that cycles. */
class Segmented<T extends string> {
  private buttons = new Map<T, ReturnType<typeof button>>();
  readonly root: Phaser.GameObjects.Container;
  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, options: { v: T; label: string }[], current: T, onPick: (v: T) => void, size = 11) {
    this.root = scene.add.container(0, 0);
    const gap = 4, bw = (w - gap * (options.length - 1)) / options.length;
    options.forEach((o, i) => {
      const b = button(scene, x + i * (bw + gap), y, bw, h, o.label, () => onPick(o.v), size, o.v === current);
      this.buttons.set(o.v, b);
      this.root.add([b.g, b.text]);
    });
  }
  set(v: T): void { for (const [k, b] of this.buttons) b.setActive(k === v); }
}

/** A hero's face as a tappable chip; a coloured ring and a small tag say whose it is. */
interface ChipState { ring: number | null; tag: string; disabled?: boolean }
class ChipRow {
  readonly root: Phaser.GameObjects.Container;
  private chips: { id: HeroId; bg: Phaser.GameObjects.Rectangle; img: Phaser.GameObjects.Image; tag: Phaser.GameObjects.Text }[] = [];
  constructor(scene: Phaser.Scene, x: number, y: number, size: number, gap: number, onPick: (id: HeroId) => void) {
    this.root = scene.add.container(0, 0);
    HERO_IDS.forEach((id, i) => {
      const cx = x + i * (size + gap);
      const bg = scene.add.rectangle(cx, y, size, size, PALETTE.field).setOrigin(0, 0).setStrokeStyle(2, PALETTE.line).setInteractive({ useHandCursor: true });
      const img = scene.add.image(cx + size / 2, y + size / 2, `card-${id}`).setDisplaySize(size - 6, size - 6);
      const tag = scene.add.text(cx + 2, y + 2, '', { fontFamily: uiFont(), fontSize: uiSize(Math.max(8, Math.round(size / 6))), color: rgba(PALETTE.panel), fontStyle: 'bold', backgroundColor: rgba(PALETTE.cyan), padding: { x: 3, y: 1 } }).setOrigin(0, 0).setVisible(false);
      bg.on('pointerdown', () => { if (bg.alpha < 1) return; synth.unlock(); synth.uiClick(); onPick(id); });
      this.root.add([bg, img, tag]);
      this.chips.push({ id, bg, img, tag });
    });
  }
  setState(state: (id: HeroId) => ChipState): void {
    for (const c of this.chips) {
      const s = state(c.id);
      const a = s.disabled ? 0.35 : 1;
      c.bg.setAlpha(a); c.img.setAlpha(a);
      c.bg.setStrokeStyle(s.ring ? 3 : 2, s.ring ?? PALETTE.line).setFillStyle(s.ring ? PALETTE.hover : PALETTE.field);
      c.tag.setText(s.tag).setVisible(!!s.tag).setStyle({ backgroundColor: rgba(s.ring ?? PALETTE.muted) });
    }
  }
}

/** The big card: the hero's art, name, style line and three stat bars, for whoever is picked. */
class BigCard {
  private img: Phaser.GameObjects.Image;
  private name: Phaser.GameObjects.Text;
  private bias: Phaser.GameObjects.Text;
  private role: Phaser.GameObjects.Text;
  private bars: Phaser.GameObjects.Rectangle[] = [];
  private static readonly ART = 160;
  private static readonly BAR_W = 186;
  constructor(scene: Phaser.Scene, x: number, y: number) {
    const A = BigCard.ART;
    scene.add.rectangle(x, y, A, A, PALETTE.field).setOrigin(0, 0).setStrokeStyle(2, PALETTE.line);
    this.img = scene.add.image(x + A / 2, y + A / 2, `card-${HERO_IDS[0]}`).setDisplaySize(A - 4, A - 4);
    this.role = scene.add.text(x + 6, y + 6, '', { fontFamily: uiFont(), fontSize: uiSize(11), color: rgba(PALETTE.panel), fontStyle: 'bold', backgroundColor: rgba(PALETTE.cyan), padding: { x: 6, y: 3 } }).setOrigin(0, 0);
    const tx = x + A + 14;
    this.name = scene.add.text(tx, y + 2, '', { fontFamily: uiFont(), fontSize: uiSize(20), color: rgba(PALETTE.text), fontStyle: 'bold' }).setOrigin(0, 0);
    this.bias = scene.add.text(tx, y + 32, '', { fontFamily: uiFont(), fontSize: uiSize(10), color: rgba(PALETTE.muted), wordWrap: { width: 250 } }).setOrigin(0, 0);
    const labels = [t('statHp'), t('statSpeed'), t('statPower')];
    labels.forEach((l, i) => {
      const by = y + 76 + i * 26;
      scene.add.text(tx, by, l, { fontFamily: uiFont(), fontSize: uiSize(9), color: rgba(PALETTE.muted) }).setOrigin(0, 0.5);
      scene.add.rectangle(tx + 66, by, BigCard.BAR_W, 8, PALETTE.field).setOrigin(0, 0.5).setStrokeStyle(1, PALETTE.line);
      this.bars.push(scene.add.rectangle(tx + 66, by, 0, 8, PALETTE.cyan).setOrigin(0, 0.5));
    });
  }
  /** `id` null = nobody (the friend is off): the card goes quiet. */
  show(id: HeroId | null, role: string, colour = PALETTE.cyan): void {
    this.role.setText(role).setVisible(!!role).setStyle({ backgroundColor: rgba(colour) });
    if (!id) {
      this.img.setVisible(false); this.name.setText('—'); this.bias.setText('');
      for (const b of this.bars) b.width = 0;
      return;
    }
    const def = HEROES[id];
    this.img.setTexture(`card-${id}`).setDisplaySize(BigCard.ART - 4, BigCard.ART - 4).setVisible(true);
    this.name.setText(def.name); this.bias.setText(heroBias(id, def.bias));
    // each bar is the hero's place in the roster's range, so the differences read at a glance
    const stats: [number, number][] = [[def.hp, 0], [def.speed, 1], [def.dmgMul, 2]];
    const all = HERO_IDS.map((h) => HEROES[h]);
    const ranges = [[Math.min(...all.map((d) => d.hp)), Math.max(...all.map((d) => d.hp))], [Math.min(...all.map((d) => d.speed)), Math.max(...all.map((d) => d.speed))], [Math.min(...all.map((d) => d.dmgMul)), Math.max(...all.map((d) => d.dmgMul))]];
    for (const [v, i] of stats) {
      const [lo, hi] = ranges[i];
      const f = hi > lo ? (v - lo) / (hi - lo) : 0.5;
      this.bars[i].width = Math.round(BigCard.BAR_W * (0.3 + 0.7 * f));
      this.bars[i].setFillStyle(colour);
    }
  }
}

export class LobbyScene extends Phaser.Scene {
  constructor() { super('Lobby'); }

  private catalog!: Catalog;
  private heroPick: [HeroId, HeroId | null] = [HERO_IDS[0], null];
  private coop = false; // LAN co-op
  private local2p = false; // two players on one keyboard (no touch equivalent)
  private startLevel = 1;
  private friendPick: HeroId | null = HERO_IDS[1] ?? null;
  private friendMode: FriendMode = 'assist';
  private statusText!: Phaser.GameObjects.Text;
  private netMode: 'local' | 'host' | 'guest' = 'local';
  private roomCode: string | null = null;

  private heroCard!: BigCard;
  private friendCard!: BigCard;
  private heroChips!: ChipRow;
  private p2Chips!: ChipRow;
  private friendChips!: ChipRow;
  private p2Block!: Phaser.GameObjects.Container;
  private tapHint!: Phaser.GameObjects.Text;
  private modeSeg!: Segmented<FriendMode>;
  private modeHint!: Phaser.GameObjects.Text;
  private playersSeg!: Segmented<'solo' | '2p' | 'lan'>;
  private netRow!: Phaser.GameObjects.Container;
  private levelText!: Phaser.GameObjects.Text;

  /** The lobby is two big panels — YOUR HERO on the left, FRIEND on the right, each a large card
   * with the pick's art and stats over a row of every hero's face to tap — then two rows of labelled
   * controls that show every option at once (level, difficulty, control size; players and the LAN
   * buttons) and START. Everything is laid out in the 960×540 frame, centred on the canvas. */
  create(): void {
    onViewportResize(this, () => centreUiCamera(this));
    this.catalog = this.registry.get('catalog');
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, PALETTE.bg).setOrigin(0, 0);
    const touch = isTouchDevice(this);

    // ---- top bar: play-on-phone QR, the wordmark, the language toggle ----
    this.add.image(VIEW_W / 2, 22, 'logo').setDisplaySize(150, 44);
    button(this, 24, 8, 150, 28, t('playOnPhone'), () => this.togglePhoneQr());
    const langBtn = button(this, VIEW_W - 24 - 150, 8, 150, 28, langLabel(getLang()), () => { setLang(getLang() === 'he' ? 'en' : 'he'); langBtn.text.setText(langLabel(getLang())); this.scene.restart(); }); // the whole lobby re-renders in the other language

    // ---- the two panels ----
    const PY = 48, PH = 310, PW = 448, LX = 24, RX = VIEW_W - 24 - PW;
    for (const px of [LX, RX]) this.add.rectangle(px, PY, PW, PH, PALETTE.panel, 0.8).setOrigin(0, 0).setStrokeStyle(1, PALETTE.line);
    this.label(LX + 12, PY + 12, t('pickHero'), 11, true);
    this.label(RX + 12, PY + 12, t('friend'), 11, true);
    this.heroCard = new BigCard(this, LX + 12, PY + 30);
    this.friendCard = new BigCard(this, RX + 12, PY + 30);
    this.heroChips = new ChipRow(this, LX + 12, PY + 198, 56, 10, (id) => this.pickHero(id));
    this.friendChips = new ChipRow(this, RX + 12, PY + 198, 56, 10, (id) => { this.friendPick = id; this.refresh(); });
    // under the hero: a tap hint, or the second player's pick in a two-player game
    this.tapHint = this.label(LX + 12, PY + 278, t('tapFace'), 9);
    this.p2Block = this.add.container(0, 0).setVisible(false);
    const p2Label = this.label(LX + 12, PY + 278, t('player2'), 10, true);
    this.p2Chips = new ChipRow(this, LX + 12 + 88, PY + 262, 32, 6, (id) => { this.heroPick[1] = id; this.refresh(); });
    this.p2Block.add([p2Label, this.p2Chips.root]);
    // under the friend: how they help, every mode a button, the lit one explained underneath
    this.modeSeg = new Segmented<FriendMode>(this, RX + 12, PY + 262, PW - 24, 28, [
      { v: 'off', label: t('off') }, { v: 'assist', label: t('assist') }, { v: 'sidekick', label: t('sidekick') },
    ], this.friendMode, (m) => { this.friendMode = m; this.refresh(); });
    this.modeHint = this.label(RX + 12, PY + 296, '', 9).setWordWrapWidth(PW - 24);

    // ---- settings row A: level · difficulty · control size ----
    const AY = 366, ACY = 380, CH = 30;
    this.label(24, AY, t('startAtLevel'), 10);
    button(this, 24, ACY, 30, CH, '◀', () => this.setLevel(this.startLevel - 1));
    this.add.rectangle(58, ACY, 216, CH, PALETTE.panel).setOrigin(0, 0).setStrokeStyle(1, PALETTE.line);
    this.levelText = this.add.text(58 + 108, ACY + CH / 2, '', { fontFamily: uiFont(), fontSize: uiSize(11), color: rgba(PALETTE.text), fontStyle: 'bold' }).setOrigin(0.5);
    button(this, 278, ACY, 30, CH, '▶', () => this.setLevel(this.startLevel + 1));
    this.label(324, AY, t('difficulty'), 10);
    const diffSeg = new Segmented(this, 324, ACY, 312, CH, DIFFICULTIES.map((d) => ({ v: d, label: difficultyName(d) })), getDifficulty(), (d) => { setDifficulty(d); diffSeg.set(d); });
    if (touch) {
      // touch control size, for phones
      this.label(652, AY, t('controls'), 10);
      const sizeSeg = new Segmented<'S' | 'M' | 'L'>(this, 652, ACY, 160, CH, (['S', 'M', 'L'] as const).map((s) => ({ v: s, label: s })), TouchControls.sizeSetting(), (s) => {
        try { localStorage.setItem(TouchControls.SIZE_KEY, s); } catch { /* private mode */ }
        sizeSeg.set(s);
      });
    }

    // ---- settings row B: players · LAN buttons · status ----
    const BY = 418, BCY = 432;
    this.label(24, BY, t('players'), 10);
    // Two players on one keyboard (arrows + numpad for P2) is keyboard-only, so a phone is not offered it.
    const playerOptions: { v: 'solo' | '2p' | 'lan'; label: string }[] = [{ v: 'solo', label: t('solo') }, ...(touch ? [] : [{ v: '2p' as const, label: t('twoPKeyboard') }]), { v: 'lan', label: t('lanCoop') }];
    this.playersSeg = new Segmented(this, 24, BCY, touch ? 240 : 360, CH, playerOptions, 'solo', (v) => this.setPlayers(v));
    this.netRow = this.add.container(0, 0).setVisible(false);
    const hostBtn = button(this, 400, BCY, 120, CH, t('hostGame'), () => this.startAsHost());
    const joinBtn = button(this, 528, BCY, 120, CH, t('joinGame'), () => this.promptJoin());
    this.netRow.add([hostBtn.g, hostBtn.text, joinBtn.g, joinBtn.text]);
    this.statusText = this.add.text(664, BY, '', { fontFamily: uiFont(), fontSize: uiSize(9), color: rgba(PALETTE.cyan), wordWrap: { width: 272 } }).setOrigin(0, 0);

    // Arriving through the host's QR code / join link (?join=CODE): the room is already known, so
    // the guest only has to pick a hero and press START.
    const joinCode = new URLSearchParams(location.search).get('join')?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
    if (joinCode.length === 4) {
      this.setPlayers('lan');
      this.netMode = 'guest'; this.roomCode = joinCode;
      this.statusText.setText(t('joiningRoom', { code: this.roomCode }));
    } else if (this.coop) this.playersSeg.set('lan'); else if (this.local2p) this.playersSeg.set('2p'); // a language toggle restarts the scene

    // ---- START ----
    const start = button(this, VIEW_W / 2 - 160, 474, 320, 48, t('start'), () => this.tryStart(), 16, true);
    void start;

    if (import.meta.env.DEV) {
      // dev shortcuts: /?level=11&difficulty=hard lands the lobby on that level and setting
      const q = new URLSearchParams(location.search);
      const lv = Number(q.get('level'));
      if (lv >= 1 && lv <= LEVEL_COUNT) this.startLevel = lv;
      const d = q.get('difficulty');
      if (isDifficulty(d)) { setDifficulty(d); diffSeg.set(d); }
    }
    this.setLevel(this.startLevel);
    this.refresh();
  }

  private label(x: number, y: number, text: string, size: number, bold = false): Phaser.GameObjects.Text {
    return this.add.text(x, y, text, { fontFamily: uiFont(), fontSize: uiSize(size), color: rgba(PALETTE.muted), fontStyle: bold ? 'bold' : 'normal' }).setOrigin(0, 0);
  }

  private setLevel(n: number): void {
    this.startLevel = Math.max(1, Math.min(LEVEL_COUNT, n));
    const lv = catalogLevel(this.catalog, this.startLevel);
    this.levelText.setText(`${this.startLevel} · ${isHebrew() ? lv.nameHe : lv.name}`);
  }

  private setPlayers(v: 'solo' | '2p' | 'lan'): void {
    this.coop = v === 'lan'; this.local2p = v === '2p';
    // only a shared keyboard picks P2 here; a LAN guest picks on their own device
    if (v === '2p') { if (!this.heroPick[1]) this.heroPick[1] = pickOther(this.heroPick[0]); } else this.heroPick[1] = null;
    if (!this.coop) {
      this.netMode = 'local'; this.roomCode = null;
      this.registry.get('pendingHostSession')?.destroy(); this.registry.remove('pendingHostSession');
      this.children.getByName('qr')?.destroy(); this.statusText.setText('');
    }
    this.playersSeg.set(v);
    this.refresh();
  }

  private pickHero(id: HeroId): void {
    this.heroPick[0] = id;
    if (this.heroPick[1] === id) this.heroPick[1] = pickOther(id);
    this.refresh();
  }

  /** Every control reads from the picks; this paints them all — cards, chips, modes, rows. */
  private refresh(): void {
    const [p1, p2] = this.heroPick;
    const friendOn = this.friendMode !== 'off';
    // the friend is whoever is not playing
    if (!this.friendPick || this.friendPick === p1 || this.friendPick === p2) this.friendPick = HERO_IDS.find((h) => h !== p1 && h !== p2) ?? null;
    this.heroCard.show(p1, 'P1');
    if (friendOn) this.friendCard.show(this.friendPick, t(this.friendMode), PALETTE.purple); else this.friendCard.show(null, t('off'), PALETTE.muted);
    this.heroChips.setState((id) => ({ ring: id === p1 ? PALETTE.cyan : id === p2 ? PALETTE.accent : null, tag: id === p1 ? 'P1' : id === p2 ? 'P2' : '' }));
    this.p2Chips.setState((id) => ({ ring: id === p2 ? PALETTE.accent : null, tag: '', disabled: id === p1 }));
    this.friendChips.setState((id) => ({ ring: friendOn && id === this.friendPick ? PALETTE.purple : null, tag: id === p1 ? 'P1' : id === p2 ? 'P2' : '', disabled: !friendOn || id === p1 || id === p2 }));
    this.modeSeg.set(this.friendMode);
    this.modeHint.setText(t(this.friendMode === 'assist' ? 'assistHint' : this.friendMode === 'sidekick' ? 'sidekickHint' : 'offHint'));
    this.p2Block.setVisible(this.local2p); this.tapHint.setVisible(!this.local2p);
    this.netRow.setVisible(this.coop);
  }

  private async startAsHost(): Promise<void> {
    this.netMode = 'host';
    this.statusText.setText(t('startingHost'));
    const { wsUrlFromLocation, HostSession } = await import('../../net/session');
    const session = new HostSession(wsUrlFromLocation());
    session.events.onRoom = (code) => {
      this.roomCode = code;
      const joinUrl = `${location.origin}/?join=${code}`;
      this.statusText.setText(`${t('roomOpen', { code })}\n${joinUrl}`);
      this.renderQr(joinUrl);
    };
    session.events.onPeer = (joined) => { if (joined) this.statusText.setText(t('peerJoined')); };
    session.events.onError = (m) => this.statusText.setText(`${t('error')}: ${m}`);
    session.connect();
    this.registry.set('pendingHostSession', session);
  }

  /** The address a phone should open: this page's own origin when it is reachable (the LAN server,
   * the published site), the machine's LAN address when this is the dev server opened as localhost,
   * and the published site when nothing better is known. */
  private async phoneUrl(): Promise<string> {
    const local = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(location.hostname);
    if (!local) return `${location.origin}/`;
    if (import.meta.env.DEV) {
      try {
        const { ip } = await (await fetch('/__dev/lan-ip')).json();
        if (ip) return `${location.protocol}//${ip}${location.port ? `:${location.port}` : ''}/`;
      } catch { /* not the dev server */ }
    }
    return CONTENT_URL.replace(/game\/$/, '');
  }

  private phoneQr: Phaser.GameObjects.Container | null = null;
  private async togglePhoneQr(): Promise<void> {
    if (this.phoneQr) { this.phoneQr.destroy(); this.phoneQr = null; return; }
    const url = await this.phoneUrl();
    const QR = await import('qrcode');
    const dataUrl = await QR.toDataURL(url, { margin: 1, width: 256, color: { dark: '#050711', light: '#f3f4e8' } });
    await addTextureFromDataUrl(this, 'qr-phone', dataUrl);
    if (this.phoneQr) return;
    const cx = VIEW_W / 2, cy = VIEW_H / 2 - 10;
    const veil = this.add.rectangle(0, 0, VIEW_W, VIEW_H, 0x050711, 0.82).setOrigin(0, 0).setInteractive();
    const panel = this.add.rectangle(cx, cy, 340, 360, 0x0b1730, 0.98).setStrokeStyle(2, 0x75f5dc);
    const title = this.add.text(cx, cy - 158, t('playOnPhone'), { fontFamily: uiFont(), fontSize: uiSize(14), color: '#75f5dc', fontStyle: 'bold' }).setOrigin(0.5);
    const img = this.add.image(cx, cy - 10, 'qr-phone').setDisplaySize(240, 240);
    const link = this.add.text(cx, cy + 128, url, { fontFamily: uiFont(), fontSize: uiSize(11), color: '#f3f4e8', wordWrap: { width: 310 }, align: 'center' }).setOrigin(0.5, 0);
    const hint = this.add.text(cx, cy + 156, `${t('scanHint')} · ${t('tapToClose')}`, { fontFamily: uiFont(), fontSize: uiSize(9), color: '#9bb1c9', wordWrap: { width: 310 }, align: 'center' }).setOrigin(0.5, 0);
    this.phoneQr = this.add.container(0, 0, [veil, panel, title, img, link, hint]).setDepth(1000);
    veil.on('pointerdown', () => { this.phoneQr?.destroy(); this.phoneQr = null; });
  }

  private renderQr(url: string): void {
    import('qrcode').then((QR) => {
      QR.toDataURL(url, { margin: 1, width: 128, color: { dark: '#050711', light: '#f3f4e8' } }).then((dataUrl) => {
        addTextureFromDataUrl(this, 'qr', dataUrl).then(() => {
          this.children.getByName('qr')?.destroy();
          this.add.image(VIEW_W - 72, VIEW_H - 48, 'qr').setName('qr').setScale(0.6);
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
      this.statusText.setText(t('joiningRoom', { code: this.roomCode }));
      close();
    };
    input.addEventListener('input', () => { input.value = input.value.toUpperCase().replace(/[^A-Z0-9]/g, ''); });
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    panel.querySelector('#nepho-join-ok')!.addEventListener('click', submit);
    panel.querySelector('#nepho-join-cancel')!.addEventListener('click', close);
    input.focus();
  }

  private tryStart(): void {
    // On a phone, START is the user gesture that lets us go full screen and lock to landscape
    // (both best-effort: browsers that refuse simply carry on windowed).
    if (isTouchDevice(this)) {
      try { if (!this.scale.isFullscreen) this.scale.startFullscreen(); } catch { /* not allowed here */ }
      const o = (screen as any).orientation;
      if (o && typeof o.lock === 'function') o.lock('landscape').catch(() => {});
    }
    const twoPlayers = this.coop || this.local2p;
    const heroes: [HeroId, HeroId | null] = twoPlayers ? [this.heroPick[0], this.heroPick[1] || pickOther(this.heroPick[0])] : [this.heroPick[0], null];
    // P2's friend is whoever is left over once both players and P1's friend are taken
    const p2Friend = heroes[1] ? HERO_IDS.find((h) => h !== heroes[0] && h !== heroes[1] && h !== this.friendPick) || null : null;
    const friends = { friends: [this.friendPick, p2Friend] as [HeroId | null, HeroId | null], mode: this.friendMode };
    if (this.netMode === 'guest' && this.roomCode) {
      this.scene.start('Game', { mode: 'guest', roomCode: this.roomCode, heroId: heroes[0] });
      return;
    }
    if (this.netMode === 'host') {
      const session = this.registry.get('pendingHostSession');
      session.start(Math.floor(Math.random() * 1e9), this.startLevel, heroes, friends, undefined, getDifficulty());
      this.scene.start('Game', { mode: 'host', session, level: this.startLevel, heroes, friends, difficulty: getDifficulty() });
      return;
    }
    this.scene.start('Game', { mode: 'local', level: this.startLevel, heroes, seed: Math.floor(Math.random() * 1e9), friends, difficulty: getDifficulty() });
  }
}

function pickOther(a: HeroId): HeroId { return HERO_IDS.find((h) => h !== a) || HERO_IDS[0]; }
