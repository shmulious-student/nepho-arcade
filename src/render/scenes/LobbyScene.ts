import Phaser from 'phaser';
import { catalogLevel } from '../../shared/catalog';
import { getLang, setLang, langLabel } from '../../shared/lang';
import { centreUiCamera, uiOffsetX } from '../viewport';
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
  private heroPick: [HeroId, HeroId | null] = [HERO_IDS[0], null];
  private coop = false; // LAN co-op
  private local2p = false; // two players on one keyboard (no touch equivalent)
  private p2Text!: Phaser.GameObjects.Text;
  private p2Row!: Phaser.GameObjects.Container;
  private cards: Record<HeroId, Phaser.GameObjects.Container> = {} as any;
  private startLevel = 1;
  private friendPick: HeroId | null = HERO_IDS[1] ?? null;
  private friendMode: FriendMode = 'assist';
  private friendText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private netMode: 'local' | 'host' | 'guest' = 'local';
  private roomCode: string | null = null;

  // ---- carousel layout: three cards per page, snapping ----
  private static readonly CARD_W = 236;
  private static readonly CARD_H = 292;
  private static readonly CARD_GAP = 18;
  private static readonly PER_PAGE = 3;
  private static readonly CAROUSEL_Y = 66;
  private strip!: Phaser.GameObjects.Container;
  private page = 0;
  private pageDots: Phaser.GameObjects.Arc[] = [];
  private pageText!: Phaser.GameObjects.Text;
  private badges: Record<HeroId, Phaser.GameObjects.Text> = {} as any;
  private dragStartX = 0;
  private dragStripX = 0;
  private dragging = false;
  private dragMoved = false;

  private get pageCount(): number { return Math.max(1, Math.ceil(HERO_IDS.length / LobbyScene.PER_PAGE)); }
  private get pageW(): number { return LobbyScene.PER_PAGE * (LobbyScene.CARD_W + LobbyScene.CARD_GAP); }
  private get stripX0(): number { return Math.round((VIEW_W - (this.pageW - LobbyScene.CARD_GAP)) / 2); }

  create(): void {
    centreUiCamera(this);
    this.catalog = this.registry.get('catalog');
    this.add.rectangle(0, 0, VIEW_W, VIEW_H, PALETTE.bg).setOrigin(0, 0);
    // header: the wordmark (it already says EVIOMRI · CIRCUIT BREAKERS) and the section title
    this.add.image(VIEW_W / 2, 30, 'logo').setDisplaySize(176, 52);
    this.add.text(this.stripX0, LobbyScene.CAROUSEL_Y - 14, t('pickHero'), { fontFamily: uiFont(), fontSize: uiSize(12), color: '#9bb1c9', fontStyle: 'bold' }).setOrigin(0, 0.5);
    this.add.text(this.stripX0 + this.pageW - LobbyScene.CARD_GAP, LobbyScene.CAROUSEL_Y - 14, t('carouselHint'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#5f7391' }).setOrigin(1, 0.5);

    // play on phone: a QR of the address a phone can open, top-left
    const qrBtn = this.makeButton(24, 8, 132, 22, t('playOnPhone'), () => this.togglePhoneQr());
    void qrBtn;
    // dialog text language, top-right
    const langBtn = this.makeButton(VIEW_W - 24 - 112, 8, 112, 22, langLabel(getLang()), () => { setLang(getLang() === 'he' ? 'en' : 'he'); langBtn.text.setText(langLabel(getLang())); this.scene.restart(); }); // the whole lobby re-renders in the other language

    this.buildCarousel();

    // ---- settings row ----
    const rowY = LobbyScene.CAROUSEL_Y + LobbyScene.CARD_H + 30; // 388
    const panel = this.add.rectangle(24, rowY, VIEW_W - 48, 62, PALETTE.panel, 0.7).setOrigin(0, 0).setStrokeStyle(1, PALETTE.line);
    void panel;
    // friend
    this.add.text(36, rowY + 8, t('friend'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9' });
    this.makeButton(36, rowY + 26, 28, 26, '◀', () => this.cycleFriend(-1));
    this.friendText = this.add.text(70, rowY + 39, '', { fontFamily: uiFont(), fontSize: uiSize(11), color: '#f3f4e8' }).setOrigin(0, 0.5);
    this.makeButton(222, rowY + 26, 28, 26, '▶', () => this.cycleFriend(1));
    const modeBtn = this.makeButton(258, rowY + 26, 112, 26, '', () => {
      this.friendMode = this.friendMode === 'assist' ? 'sidekick' : this.friendMode === 'sidekick' ? 'off' : 'assist';
      modeBtn.text.setText(t(this.friendMode));
      this.refreshBadges();
    });
    modeBtn.text.setText(t(this.friendMode));
    this.add.text(258, rowY + 8, t('helpsAs'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9' });
    // level
    this.add.text(400, rowY + 8, t('startAtLevel'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9' });
    this.makeButton(400, rowY + 26, 28, 26, '◀', () => this.setLevel(this.startLevel - 1));
    const levelText = this.add.text(434, rowY + 39, '', { fontFamily: uiFont(), fontSize: uiSize(11), color: '#f3f4e8' }).setOrigin(0, 0.5);
    this.makeButton(606, rowY + 26, 28, 26, '▶', () => this.setLevel(this.startLevel + 1));
    this.setLevel = (n: number) => { this.startLevel = Math.max(1, Math.min(LEVEL_COUNT, n)); levelText.setText(`${this.startLevel} · ${isHebrew() ? catalogLevel(this.catalog, this.startLevel).nameHe : catalogLevel(this.catalog, this.startLevel).name}`); };
    this.setLevel(this.startLevel);
    // players / co-op toggles
    this.add.text(656, rowY + 8, t('players'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9' });
    const coopBtn = this.makeButton(656, rowY + 26, 132, 26, `${t('lanCoop')}: ${t('off')}`, () => {
      this.coop = !this.coop;
      coopBtn.text.setText(`${t('lanCoop')}: ${this.coop ? t('on') : t('off')}`);
      netRow.setVisible(this.coop);
      if (this.coop && this.local2p) setLocal2p(false);
      if (!this.coop) {
        this.netMode = 'local'; this.roomCode = null;
        this.registry.get('pendingHostSession')?.destroy(); this.registry.remove('pendingHostSession');
        this.children.getByName('qr')?.destroy(); this.statusText.setText('');
      }
    });
    // Two players on one keyboard (arrows + numpad for P2): a keyboard-only option, so it is not
    // offered on a phone. Exclusive with LAN co-op.
    let local2pBtn: { g: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } | null = null;
    const setLocal2p = (on: boolean) => {
      this.local2p = on;
      local2pBtn?.text.setText(`${t('twoPKeyboard')}: ${on ? t('on') : t('off')}`);
      this.p2Row.setVisible(on);
      if (on && !this.heroPick[1]) this.heroPick[1] = pickOther(this.heroPick[0]);
      if (!on) this.heroPick[1] = null;
      this.cycleP2(0); this.cycleFriend(0);
    };
    if (!isTouchDevice(this)) {
      local2pBtn = this.makeButton(796, rowY + 26, 132, 26, `${t('twoPKeyboard')}: ${t('off')}`, () => {
        setLocal2p(!this.local2p);
        if (this.local2p && this.coop) coopBtn.g.emit('pointerdown');
      });
    } else {
      // touch control size, for phones
      const sizes: ('S' | 'M' | 'L')[] = ['S', 'M', 'L'];
      const sizeBtn = this.makeButton(796, rowY + 26, 132, 26, '', () => {
        const next = sizes[(sizes.indexOf(TouchControls.sizeSetting()) + 1) % sizes.length];
        try { localStorage.setItem(TouchControls.SIZE_KEY, next); } catch { /* private mode */ }
        sizeBtn.text.setText(`${t('controls')}: ${next}`);
      });
      sizeBtn.text.setText(`${t('controls')}: ${TouchControls.sizeSetting()}`);
    }

    // ---- bottom: P2 pick / net buttons on the sides, status + START in the middle ----
    const botY = rowY + 76; // 464
    this.p2Row = this.add.container(0, 0).setVisible(false);
    const p2Label = this.add.text(36, botY, t('player2'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9' });
    const p2Prev = this.makeButton(36, botY + 16, 28, 26, '◀', () => this.cycleP2(-1));
    this.p2Text = this.add.text(70, botY + 29, '', { fontFamily: uiFont(), fontSize: uiSize(11), color: '#f3f4e8' }).setOrigin(0, 0.5);
    const p2Next = this.makeButton(222, botY + 16, 28, 26, '▶', () => this.cycleP2(1));
    this.p2Row.add([p2Label, p2Prev.g, p2Prev.text, this.p2Text, p2Next.g, p2Next.text]);

    const netRow = this.add.container(0, 0).setVisible(false);
    const hostBtn = this.makeButton(656, botY + 16, 132, 26, t('hostGame'), () => this.startAsHost());
    const joinBtn = this.makeButton(796, botY + 16, 132, 26, t('joinGame'), () => this.promptJoin());
    netRow.add([hostBtn.g, hostBtn.text, joinBtn.g, joinBtn.text]);

    // Arriving through the host's QR code / join link (?join=CODE): the room is already known, so
    // the guest only has to pick a hero and press START.
    const joinCode = new URLSearchParams(location.search).get('join')?.trim().toUpperCase().replace(/[^A-Z0-9]/g, '') ?? '';
    if (joinCode.length === 4) {
      this.coop = true; coopBtn.text.setText(`${t('lanCoop')}: ${t('on')}`); netRow.setVisible(true);
      this.netMode = 'guest'; this.roomCode = joinCode;
    }

    this.statusText = this.add.text(VIEW_W / 2, botY + 2, '', { fontFamily: uiFont(), fontSize: uiSize(10), color: '#75f5dc', align: 'center' }).setOrigin(0.5, 0);
    if (this.netMode === 'guest' && this.roomCode) this.statusText.setText(t('joiningRoom', { code: this.roomCode }));

    const start = this.makeButton(VIEW_W / 2, botY + 22, 300, 46, t('start'), () => this.tryStart(), 0x75f5dc, 0x0b1730);
    start.text.setFontSize(16).setFontStyle('bold');
    // difficulty, beside START: EASY is the game as tuned, each step up is a harder campaign
    this.add.text(VIEW_W / 2 - 160, botY + 2, t('difficulty'), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9' }).setOrigin(1, 0);
    const diffBtn = this.makeButton(VIEW_W / 2 - 160 - 132, botY + 22, 132, 26, '', () => {
      const next = DIFFICULTIES[(DIFFICULTIES.indexOf(getDifficulty()) + 1) % DIFFICULTIES.length];
      setDifficulty(next); diffBtn.text.setText(difficultyName(next));
    });
    diffBtn.text.setText(difficultyName(getDifficulty()));
    if (import.meta.env.DEV) {
      // dev shortcuts: /?level=11&difficulty=hard lands the lobby on that level and setting
      const q = new URLSearchParams(location.search);
      const lv = Number(q.get('level'));
      if (lv >= 1 && lv <= LEVEL_COUNT) this.setLevel(lv);
      const d = q.get('difficulty');
      if (isDifficulty(d)) { setDifficulty(d); diffBtn.text.setText(difficultyName(d)); }
    }

    this.cycleFriend(0);
    this.highlightCard();
  }

  private setLevel: (n: number) => void = () => {};

  /** The hero cards: a strip of all of them, clipped to one page of three, dragged/swiped or paged
   * with the arrows, and snapped to a page on release. A tap (no drag) on a card picks it. */
  private buildCarousel(): void {
    const { CARD_W, CARD_H, CARD_GAP, CAROUSEL_Y } = LobbyScene;
    const x0 = this.stripX0, viewW = this.pageW - CARD_GAP;
    this.strip = this.add.container(x0, CAROUSEL_Y);
    HERO_IDS.forEach((id, i) => this.buildHeroCard(id, i * (CARD_W + CARD_GAP), 0, i));
    // clip to the page
    const maskG = this.make.graphics({}, false);
    maskG.fillStyle(0xffffff).fillRect(x0 - 6, CAROUSEL_Y - 8, viewW + 12, CARD_H + 16);
    this.strip.setMask(maskG.createGeometryMask());
    // drag / swipe on the whole page area
    const zone = this.add.zone(x0, CAROUSEL_Y, viewW, CARD_H).setOrigin(0, 0).setInteractive({ draggable: false });
    zone.on('pointerdown', (p: Phaser.Input.Pointer) => { this.dragging = true; this.dragMoved = false; this.dragStartX = p.x; this.dragStripX = this.strip.x; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!this.dragging || !p.isDown) return;
      const dx = p.x - this.dragStartX;
      if (Math.abs(dx) > 8) this.dragMoved = true;
      const min = x0 - (this.pageCount - 1) * this.pageW, max = x0;
      // rubber-band past the ends
      let nx = this.dragStripX + dx;
      if (nx > max) nx = max + (nx - max) * 0.3; if (nx < min) nx = min + (nx - min) * 0.3;
      this.strip.x = nx;
    });
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.dragging) return;
      this.dragging = false;
      const dx = p.x - this.dragStartX;
      if (this.dragMoved) {
        // a flick of 50px+ turns the page; otherwise snap to the nearest
        let target = this.page;
        if (dx < -50) target = this.page + 1; else if (dx > 50) target = this.page - 1;
        else target = Math.round((x0 - this.strip.x) / this.pageW);
        this.goToPage(target);
      } else {
        // a tap: which card is under it?
        const local = p.x - uiOffsetX(this) - this.strip.x; // pointer coordinates are canvas ones
        const i = Math.floor(local / (CARD_W + CARD_GAP));
        if (i >= 0 && i < HERO_IDS.length && local - i * (CARD_W + CARD_GAP) <= CARD_W && p.y >= CAROUSEL_Y && p.y <= CAROUSEL_Y + CARD_H) this.pickHero(HERO_IDS[i]);
      }
    });
    // arrows, page dots and counter
    const ay = CAROUSEL_Y + CARD_H / 2;
    this.makeButton(x0 - 52, ay - 30, 40, 60, '◀', () => this.goToPage(this.page - 1));
    this.makeButton(x0 + viewW + 12, ay - 30, 40, 60, '▶', () => this.goToPage(this.page + 1));
    const dotsY = CAROUSEL_Y + CARD_H + 14;
    for (let i = 0; i < this.pageCount; i++) this.pageDots.push(this.add.circle(VIEW_W / 2 + (i - (this.pageCount - 1) / 2) * 16, dotsY, 4, PALETTE.line));
    this.pageText = this.add.text(x0 + viewW, dotsY, '', { fontFamily: uiFont(), fontSize: uiSize(10), color: '#5f7391' }).setOrigin(1, 0.5);
    this.goToPage(Math.floor(HERO_IDS.indexOf(this.heroPick[0]) / LobbyScene.PER_PAGE), true);
  }

  private goToPage(n: number, instant = false): void {
    this.page = Math.max(0, Math.min(this.pageCount - 1, n));
    const x = this.stripX0 - this.page * this.pageW;
    this.tweens.killTweensOf(this.strip);
    if (instant) this.strip.x = x; else this.tweens.add({ targets: this.strip, x, duration: 220, ease: 'Cubic.easeOut' });
    this.pageDots.forEach((d, i) => d.setFillStyle(i === this.page ? PALETTE.cyan : PALETTE.line));
    this.pageText.setText(`${this.page + 1} / ${this.pageCount}`);
  }

  private pickHero(id: HeroId): void {
    synth.unlock(); synth.uiClick();
    this.heroPick[0] = id;
    if (this.heroPick[1] === id) this.heroPick[1] = pickOther(id);
    this.highlightCard(); this.cycleP2(0); this.cycleFriend(0);
  }

  private buildHeroCard(id: HeroId, x: number, y: number, slot: number): void {
    const { CARD_W, CARD_H } = LobbyScene;
    const def = HEROES[id];
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, CARD_W, CARD_H, PALETTE.panel).setOrigin(0, 0).setStrokeStyle(2, PALETTE.line);
    // square art shown square, nearly the card's full width, so the character reads at a glance
    const art = CARD_W - 20;
    const img = this.add.image(CARD_W / 2, 10 + art / 2, `card-${id}`).setDisplaySize(art, art);
    const tint = this.add.rectangle(CARD_W / 2, 14 + art, art, 3, def.colour).setOrigin(0.5, 0);
    const name = this.add.text(CARD_W / 2, 32 + art, def.name, { fontFamily: uiFont(), fontSize: uiSize(16), color: '#f3f4e8', fontStyle: 'bold' }).setOrigin(0.5);
    const bias = this.add.text(CARD_W / 2, 48 + art, heroBias(id, def.bias), { fontFamily: uiFont(), fontSize: uiSize(10), color: '#9bb1c9', align: 'center', wordWrap: { width: CARD_W - 16 } }).setOrigin(0.5, 0);
    // role badge (P1 / P2 / FRIEND) in the top-left corner
    const badge = this.add.text(10, 10, '', { fontFamily: uiFont(), fontSize: uiSize(11), color: '#0b1730', fontStyle: 'bold', backgroundColor: '#75f5dc', padding: { x: 6, y: 3 } }).setOrigin(0, 0).setVisible(false);
    c.add([bg, img, tint, name, bias, badge]);
    this.strip.add(c);
    this.cards[id] = c;
    this.badges[id] = badge;
    void slot;
  }

  /** Moves P2's hero by `dir` among the heroes P1 is not playing. */
  private cycleP2(dir: number): void {
    if (!this.local2p) { this.refreshBadges(); return; }
    const pool = HERO_IDS.filter((h) => h !== this.heroPick[0]);
    let i = pool.indexOf(this.heroPick[1]!);
    if (i < 0) i = 0; else i = (i + dir + pool.length) % pool.length;
    this.heroPick[1] = pool[i];
    this.p2Text.setText(HEROES[this.heroPick[1]].name);
    this.refreshBadges();
  }

  /** Moves the friend pick by `dir` among the heroes nobody is playing. */
  private cycleFriend(dir: number): void {
    const pool = HERO_IDS.filter((h) => h !== this.heroPick[0] && h !== this.heroPick[1]);
    // with only two heroes in the roster there is nobody left to be the friend in a 2P game
    if (!pool.length) { this.friendPick = null; this.friendText.setText('— nobody left'); this.refreshBadges(); return; }
    let i = this.friendPick ? pool.indexOf(this.friendPick) : -1;
    if (i < 0) i = 0; else i = (i + dir + pool.length) % pool.length;
    this.friendPick = pool[i];
    this.friendText.setText(`${HEROES[this.friendPick].name} · ${heroBias(this.friendPick, HEROES[this.friendPick].bias).split(' · ')[1] || ''}`.slice(0, 24));
    this.refreshBadges();
  }

  private refreshBadges(): void {
    for (const id of HERO_IDS) {
      const b = this.badges[id];
      if (!b) continue;
      const role = id === this.heroPick[0] ? 'P1' : id === this.heroPick[1] ? 'P2' : id === this.friendPick && this.friendMode !== 'off' ? t(this.friendMode) : '';
      b.setText(role).setVisible(!!role);
      b.setStyle({ backgroundColor: role === 'P1' ? '#75f5dc' : role === 'P2' ? '#ffcf5c' : '#9bb1c9' });
    }
  }

  private highlightCard(): void {
    for (const id of HERO_IDS) {
      const c = this.cards[id];
      const bg = c.list[0] as Phaser.GameObjects.Rectangle;
      const on = id === this.heroPick[0];
      bg.setStrokeStyle(on ? 3 : 2, on ? PALETTE.cyan : PALETTE.line);
      bg.setFillStyle(on ? 0x102240 : PALETTE.panel);
    }
    this.refreshBadges();
  }

  private makeButton(x: number, y: number, w: number, h: number, label: string, onClick: () => void, fill = 0x14243d, textColour: number = PALETTE.text): { g: Phaser.GameObjects.Rectangle; text: Phaser.GameObjects.Text } {
    const g = this.add.rectangle(x, y, w, h, fill).setOrigin(w > 150 ? 0.5 : 0, 0).setStrokeStyle(1, PALETTE.line).setInteractive({ useHandCursor: true });
    const text = this.add.text(x + (w > 150 ? 0 : w / 2), y + h / 2, label, { fontFamily: uiFont(), fontSize: uiSize(11), color: Phaser.Display.Color.IntegerToColor(textColour).rgba }).setOrigin(0.5);
    g.on('pointerdown', () => { synth.unlock(); synth.uiClick(); onClick(); });
    g.on('pointerover', () => g.setFillStyle(fill === 0x14243d ? 0x1c2f4d : fill));
    g.on('pointerout', () => g.setFillStyle(fill));
    return { g, text };
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
          this.add.image(96, VIEW_H - 50, 'qr').setName('qr').setScale(0.7);
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
