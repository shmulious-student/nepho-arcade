import Phaser from 'phaser';
import type { Catalog } from '../../shared/catalog';
import { LocalSession, HostSession, GuestSession, wsUrlFromLocation, type Session } from '../../net/session';
import { BTN, InputEdge, type InputFrame } from '../../sim/input';
import { EntityView } from '../EntityView';
import { FaceRig } from '../FaceRig';
import { Backdrop } from '../Backdrop';
import { Hud } from '../Hud';
import { Fx } from '../Fx';
import { TouchControls } from '../TouchControls';
import { LEVEL_W, type HeroId } from '../../sim/types';

interface StartData {
  mode: 'local' | 'host' | 'guest';
  level?: number;
  heroes?: [HeroId, HeroId | null];
  seed?: number;
  session?: HostSession;
  roomCode?: string;
  heroId?: HeroId;
  faceKeys: [string | null, string | null];
}

export class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  private catalog!: Catalog;
  private session!: Session;
  private world!: Phaser.GameObjects.Container;
  private views = new Map<number, EntityView>();
  private backdrop!: Backdrop;
  private hud!: Hud;
  private fx!: Fx;
  private touch!: TouchControls;
  private p1Edge = new InputEdge();
  private p2Edge = new InputEdge();
  private heroes: [HeroId, HeroId | null] = ['nepho', null];
  private faceKeys: [string | null, string | null] = [null, null];
  private levelIndex = 1;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private finished = false;
  private entryShown = false;

  create(data: StartData): void {
    this.catalog = this.registry.get('catalog');
    this.faceKeys = data.faceKeys || [null, null];
    this.finished = false;
    this.entryShown = false;
    this.views.clear();

    if (data.mode === 'local') {
      this.heroes = data.heroes!; this.levelIndex = data.level!;
      this.session = new LocalSession(data.seed!, data.level!, data.heroes!);
    } else if (data.mode === 'host') {
      this.heroes = data.heroes!; this.levelIndex = data.level!;
      this.session = data.session!;
    } else {
      this.heroes = [data.heroId!, null];
      const guest = new GuestSession(wsUrlFromLocation(), data.roomCode!);
      guest.events.onRoom = () => guest.setHero(data.heroId!);
      guest.connect();
      this.session = guest;
      this.levelIndex = 1; // guest learns the real level from the first snapshot
    }

    const level = this.catalog.levels[this.levelIndex - 1];
    this.world = this.add.container(0, 0);
    this.backdrop = new Backdrop(this, level, LEVEL_W, this.world);
    this.fx = new Fx(this, this.world, this.cameras.main);
    this.hud = new Hud(this, this.heroes, this.faceKeys);
    this.touch = new TouchControls(this);
    this.touch.setVisible(this.sys.game.device.input.touch);

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,J,K,L,I,U,UP,DOWN,LEFT,RIGHT,NUMPAD_ONE,NUMPAD_TWO,NUMPAD_THREE,NUMPAD_ZERO,NUMPAD_FOUR') as any;
    this.showKeyboardHint(!!this.heroes[1]);

    this.events.once('shutdown', () => this.cleanup());
  }

  private showKeyboardHint(withP2: boolean): void {
    if (this.sys.game.device.input.touch) return; // touch controls cover this on mobile
    const lines = withP2
      ? ['P1  move WASD · light J · heavy K · dash L · special I · block U', 'P2  move ARROWS · light NUM1 · heavy NUM2 · dash NUM3 · special NUM0 · block NUM4']
      : ['MOVE  WASD / ARROWS   LIGHT  J   HEAVY  K   DASH  L   SPECIAL  I   BLOCK  U'];
    const hint = this.add.text(this.scale.width / 2, this.scale.height - 10, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '10px', color: '#9bb1c9', align: 'center', backgroundColor: '#0b1730cc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(35000).setScrollFactor(0);
    this.tweens.add({ targets: hint, alpha: 0.25, delay: 5000, duration: 1200 });
  }

  private cleanup(): void {
    for (const v of this.views.values()) v.destroy();
    this.views.clear();
    this.backdrop?.destroy();
    this.hud?.destroy();
    this.touch?.setVisible(false);
  }

  private pollP1(): InputFrame {
    const k = this.keys;
    let held = 0;
    if (k.A.isDown || k.LEFT.isDown) held |= BTN.LEFT;
    if (k.D.isDown || k.RIGHT.isDown) held |= BTN.RIGHT;
    if (k.W.isDown || k.UP.isDown) held |= BTN.UP;
    if (k.S.isDown || k.DOWN.isDown) held |= BTN.DOWN;
    if (k.J.isDown) held |= BTN.LIGHT;
    if (k.K.isDown) held |= BTN.HEAVY;
    if (k.L.isDown) held |= BTN.DASH;
    if (k.I.isDown) held |= BTN.SPECIAL;
    if (k.U.isDown) held |= BTN.BLOCK;
    const touch = this.touch.poll();
    held |= touch.held;
    const frame = this.p1Edge.next(held);
    frame.pressed |= touch.pressed;
    return frame;
  }
  private pollP2(): InputFrame {
    const k = this.keys;
    let held = 0;
    // local co-op P2: arrow keys move, numpad 1/2/3/0 for light/heavy/dash/special
    if (k.NUMPAD_ONE?.isDown) held |= BTN.LIGHT;
    if (k.NUMPAD_TWO?.isDown) held |= BTN.HEAVY;
    if (k.NUMPAD_THREE?.isDown) held |= BTN.DASH;
    if (k.NUMPAD_ZERO?.isDown) held |= BTN.SPECIAL;
    if (k.NUMPAD_FOUR?.isDown) held |= BTN.BLOCK;
    return this.p2Edge.next(held);
  }

  update(_time: number, dtMs: number): void {
    if (this.session.mode !== 'guest') {
      this.session.setInput(0, this.pollP1());
      if (this.heroes[1] && this.session.mode === 'local') this.session.setInput(1, this.pollP2());
    } else {
      this.session.setInput(1, this.pollP1());
    }
    this.session.update(Math.min(dtMs, 50));
    this.fx.update();

    const snap = this.session.snapshot();
    if (!snap) return;
    if (snap.level !== this.levelIndex && this.session.mode === 'guest') {
      this.levelIndex = snap.level;
      const level = this.catalog.levels[this.levelIndex - 1];
      this.backdrop.destroy();
      this.backdrop = new Backdrop(this, level, LEVEL_W, this.world);
    }

    this.backdrop.setCameraX(snap.cameraX);
    if (snap.phase === 'entry') { if (!this.entryShown) { this.backdrop.showEntry(); this.entryShown = true; } }
    else if (this.entryShown) { this.backdrop.hideEntry(); this.entryShown = false; }

    const seen = new Set<number>();
    for (const e of snap.entities) {
      seen.add(e.id);
      let view = this.views.get(e.id);
      if (!view) {
        const def = this.catalog.characters[e.arch];
        if (!def) continue;
        view = new EntityView(this, e.id, def, this.world);
        this.views.set(e.id, view);
        if (e.kind === 'hero' && this.faceKeys[e.slot]) {
          view.attachFace(new FaceRig(this, this.faceKeys[e.slot]!, def, this.world));
        }
      }
      view.update(e, snap.cameraX, snap.tick);
    }
    for (const [id, view] of this.views) {
      if (!seen.has(id) || view.staleSince(snap.tick)) { view.destroy(); this.views.delete(id); }
    }
    for (const ev of snap.events) this.fx.handle(ev, snap.cameraX);

    this.hud.update(snap);

    if (!this.finished && (snap.phase === 'victory' || snap.phase === 'gameover')) {
      this.finished = true;
      const world = this.session.world();
      this.time.delayedCall(900, () => {
        this.scene.start('Results', {
          result: snap.phase, level: this.levelIndex, score: world ? world.score : snap.score,
          heroes: this.heroes, faceKeys: this.faceKeys, isLastLevel: this.levelIndex >= 10,
        });
      });
    }
  }
}
