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
import { LEVEL_W, VIEW_W, VIEW_ZOOM, FLOOR_TOP, type HeroId } from '../../sim/types';
import type { FriendSetup } from '../../sim/friends';
import { synth } from '../../audio/synth';
import { sequencer } from '../../audio/sequencer';

/** Phaser's boot-time touch flag misses some browsers/emulations; ask the platform too. */
export function isTouchDevice(scene: Phaser.Scene): boolean {
  if (scene.sys.game.device.input.touch) return true;
  try { return navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches; } catch { return false; }
}

interface StartData {
  mode: 'local' | 'host' | 'guest';
  level?: number;
  heroes?: [HeroId, HeroId | null];
  seed?: number;
  session?: HostSession;
  roomCode?: string;
  heroId?: HeroId;
  faceKeys: [string | null, string | null];
  friends?: FriendSetup;
  score?: [number, number]; // carried over from the previous level
}

/** Converts a quick double-press of the same direction into a synthesized DASH, the classic
 * beat-em-up alternative to a dedicated dash button. */
class DoubleTapDash {
  private lastDir = 0;
  private lastTime = 0;
  check(pressed: number, nowMs: number): boolean {
    for (const dir of [BTN.LEFT, BTN.RIGHT]) {
      if (!(pressed & dir)) continue;
      if (this.lastDir === dir && nowMs - this.lastTime < 280) { this.lastDir = 0; this.lastTime = 0; return true; }
      this.lastDir = dir; this.lastTime = nowMs;
    }
    return false;
  }
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
  private p1Dash = new DoubleTapDash();
  private p2Dash = new DoubleTapDash();
  private heroes: [HeroId, HeroId | null] = ['eviatar', null];
  private faceKeys: [string | null, string | null] = [null, null];
  private levelIndex = 1;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private finished = false;
  private entryShown = false;
  private waitingText?: Phaser.GameObjects.Text;
  private heroesResolved = false;
  private friends?: FriendSetup;
  private startData!: StartData;

  create(data: StartData): void {
    this.catalog = this.registry.get('catalog');
    this.faceKeys = data.faceKeys || [null, null];
    this.friends = data.friends;
    this.startData = data;
    this.finished = false;
    this.entryShown = false;
    this.heroesResolved = false;
    this.views.clear();

    if (data.mode === 'local') {
      this.heroes = data.heroes!; this.levelIndex = data.level!;
      this.session = new LocalSession(data.seed!, data.level!, data.heroes!, data.friends, data.score);
    } else if (data.mode === 'host') {
      this.heroes = data.heroes!; this.levelIndex = data.level!;
      this.session = data.session!;
    } else {
      this.heroes = [data.heroId!, null]; // corrected to the true per-slot identity once the first snapshot arrives
      // The lobby's face-upload UI always writes the local player's face to faceKeys[0] ("SET FACE —
      // P1"), but a guest is always simulation slot 1, not 0 — remap before EntityView ever reads it,
      // or the guest's own face would try to attach to the host's hero instead of their own.
      this.faceKeys = [null, (data.faceKeys && data.faceKeys[0]) || null];
      const guest = new GuestSession(wsUrlFromLocation(), data.roomCode!);
      guest.events.onRoom = () => guest.setHero(data.heroId!);
      guest.connect();
      this.session = guest;
      this.levelIndex = 1; // guest learns the real level from the first snapshot
    }

    const level = this.catalog.levels[this.levelIndex - 1];
    this.world = this.add.container(0, 0);
    // Zoom the game world in (characters/faces read far better on a phone screen) while leaving the
    // HUD and touch controls — separate top-level objects, not children of this container — at normal
    // UI scale. Anchored on the combat band (roughly where sprite feet land, not the container's
    // top-left corner), or zooming would push the floor mostly below the visible canvas.
    const zoom = VIEW_ZOOM; // the sim clamps players to the band this leaves visible (VISIBLE_X0..)
    const pivotX = VIEW_W / 2, pivotY = FLOOR_TOP + 40;
    this.world.setScale(zoom).setPosition(pivotX * (1 - zoom), pivotY * (1 - zoom));
    this.backdrop = new Backdrop(this, level, LEVEL_W, this.world);
    this.fx = new Fx(this, this.world, this.cameras.main);
    this.hud = new Hud(this, this.heroes, this.faceKeys, this.friends);
    this.touch = new TouchControls(this);
    this.touch.setVisible(isTouchDevice(this));

    this.keys = this.input.keyboard!.addKeys('W,A,S,D,J,K,L,I,U,H,SPACE,UP,DOWN,LEFT,RIGHT,NUMPAD_ONE,NUMPAD_TWO,NUMPAD_THREE,NUMPAD_ZERO,NUMPAD_FOUR,NUMPAD_FIVE,NUMPAD_SIX') as any;
    this.showKeyboardHint(!!this.heroes[1]);
    this.input.once('pointerdown', () => synth.unlock());
    this.input.keyboard!.once('keydown', () => synth.unlock());

    this.events.once('shutdown', () => { sequencer.stop(); this.cleanup(); });
  }

  private showKeyboardHint(withP2: boolean): void {
    if (isTouchDevice(this)) return; // touch controls cover this on mobile
    const lines = withP2
      ? ['P1  move WASD · light J · heavy K · jump SPACE · dash L · special I · block U · friend H', 'P2  move ARROWS · light NUM1 · heavy NUM2 · jump NUM6 · dash NUM3 · special NUM0 · block NUM4 · friend NUM5']
      : ['MOVE  WASD / ARROWS   LIGHT  J   HEAVY  K   JUMP  SPACE   DASH  L   SPECIAL  I   BLOCK  U   FRIEND  H'];
    const hint = this.add.text(this.scale.width / 2, this.scale.height - 10, lines.join('\n'), {
      fontFamily: 'monospace', fontSize: '10px', color: '#9bb1c9', align: 'center', backgroundColor: '#0b1730cc', padding: { x: 8, y: 4 },
    }).setOrigin(0.5, 1).setDepth(35000).setScrollFactor(0);
    this.tweens.add({ targets: hint, alpha: 0.25, delay: 5000, duration: 1200 });
  }

  private playSfx(ev: import('../../sim/types').SimEvent): void {
    switch (ev.type) {
      case 'hit': if (ev.heavy) synth.hitHeavy(); else synth.hitLight(); break;
      case 'block': synth.block(); break;
      case 'dash': synth.dash(); break;
      case 'launch': synth.launch(); break;
      case 'special': synth.special(ev.a); break;
      case 'ko': synth.ko(); break;
      case 'bossPhase': synth.bossPhase(); break;
      case 'heal': synth.heal(); break;
    }
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
    // Arrow keys double as P1 movement only in solo play; once a local P2 is present they're P2's
    // exclusive movement keys (see pollP2), or the same physical key press would move both heroes.
    const soloArrows = !this.heroes[1] || this.session.mode !== 'local';
    let held = 0;
    if (k.A.isDown || (soloArrows && k.LEFT.isDown)) held |= BTN.LEFT;
    if (k.D.isDown || (soloArrows && k.RIGHT.isDown)) held |= BTN.RIGHT;
    if (k.W.isDown || (soloArrows && k.UP.isDown)) held |= BTN.UP;
    if (k.S.isDown || (soloArrows && k.DOWN.isDown)) held |= BTN.DOWN;
    if (k.J.isDown) held |= BTN.LIGHT;
    if (k.K.isDown) held |= BTN.HEAVY;
    if (k.L.isDown) held |= BTN.DASH;
    if (k.I.isDown) held |= BTN.SPECIAL;
    if (k.U.isDown) held |= BTN.BLOCK;
    if (k.H.isDown) held |= BTN.ASSIST;
    if (k.SPACE.isDown) held |= BTN.JUMP;
    const touch = this.touch.poll();
    held |= touch.held;
    const frame = this.p1Edge.next(held);
    frame.pressed |= touch.pressed;
    if (this.p1Dash.check(frame.pressed, this.time.now)) { frame.held |= BTN.DASH; frame.pressed |= BTN.DASH; }
    return frame;
  }
  private pollP2(): InputFrame {
    const k = this.keys;
    let held = 0;
    if (k.LEFT.isDown) held |= BTN.LEFT;
    if (k.RIGHT.isDown) held |= BTN.RIGHT;
    if (k.UP.isDown) held |= BTN.UP;
    if (k.DOWN.isDown) held |= BTN.DOWN;
    // local co-op P2: arrow keys move, numpad 1/2/3/0 for light/heavy/dash/special
    if (k.NUMPAD_ONE?.isDown) held |= BTN.LIGHT;
    if (k.NUMPAD_TWO?.isDown) held |= BTN.HEAVY;
    if (k.NUMPAD_THREE?.isDown) held |= BTN.DASH;
    if (k.NUMPAD_ZERO?.isDown) held |= BTN.SPECIAL;
    if (k.NUMPAD_FOUR?.isDown) held |= BTN.BLOCK;
    if (k.NUMPAD_FIVE?.isDown) held |= BTN.ASSIST;
    if (k.NUMPAD_SIX?.isDown) held |= BTN.JUMP;
    const frame = this.p2Edge.next(held);
    if (this.p2Dash.check(frame.pressed, this.time.now)) { frame.held |= BTN.DASH; frame.pressed |= BTN.DASH; }
    return frame;
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
    if (!snap) {
      // Host is waiting on the guest's hero pick before the World can be built (see HostSession.start).
      if (!this.waitingText) this.waitingText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'waiting for player 2…', { fontFamily: 'monospace', fontSize: '13px', color: '#9bb1c9' }).setOrigin(0.5).setDepth(35000);
      return;
    }
    if (this.waitingText) { this.waitingText.destroy(); this.waitingText = undefined; }
    if (this.session.mode !== 'local' && !this.heroesResolved) {
      // Host: the World was built once the guest's real hero pick arrived (see HostSession.start),
      // which may differ from the placeholder `data.heroes` guess the lobby passed in before that
      // happened. Guest: it only ever knew its own pick (`this.heroes` was seeded as [ownHero, null],
      // and the guest is actually slot 1, not slot 0) — it has never known the host's hero at all.
      // Either way, read the true per-slot identity back out of the entities themselves.
      this.heroesResolved = true;
      const p0 = snap.entities.find((e) => e.kind === 'hero' && e.slot === 0);
      const p1 = snap.entities.find((e) => e.kind === 'hero' && e.slot === 1);
      const real: [HeroId, HeroId | null] = [(p0?.arch as HeroId) || this.heroes[0], (p1?.arch as HeroId) || null];
      if (real[0] !== this.heroes[0] || real[1] !== this.heroes[1]) {
        this.heroes = real;
        this.hud.destroy();
        this.hud = new Hud(this, this.heroes, this.faceKeys, this.friends);
        this.showKeyboardHint(!!this.heroes[1]);
      }
    }
    if (snap.level !== this.levelIndex && this.session.mode === 'guest') {
      // the host rolled into the next level: rebuild the stage and arm the finish logic again
      this.levelIndex = snap.level;
      this.finished = false;
      this.entryShown = false;
      for (const v of this.views.values()) v.destroy();
      this.views.clear(); // entity ids restart at 1 in the new world; a stale view would wear the wrong sprite
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
    for (const ev of snap.events) { this.fx.handle(ev, snap.cameraX); this.playSfx(ev); }
    sequencer.start(this.levelIndex);
    sequencer.setBossMode(snap.phase === 'boss');

    this.hud.update(snap);

    if (!this.finished && (snap.phase === 'victory' || snap.phase === 'gameover')) {
      this.finished = true;
      sequencer.stop();
      if (snap.phase === 'victory') synth.victory(); else synth.gameOver();
      const world = this.session.world();
      const score = world ? world.score : snap.score;
      if (snap.phase === 'victory' && this.levelIndex < 10) {
        // Beating the boss rolls straight into the next level — a banner, then the next stage's title
        // card — rather than dropping back to a menu between every level.
        this.hud.banner(`LEVEL ${this.levelIndex} CLEAR`, this.catalog.levels[this.levelIndex].name);
        if (this.session.mode !== 'guest') this.time.delayedCall(2200, () => this.nextLevel(score));
        return;
      }
      this.time.delayedCall(900, () => {
        this.scene.start('Results', {
          result: snap.phase, level: this.levelIndex, score,
          heroes: this.heroes, faceKeys: this.faceKeys, friends: this.friends, isLastLevel: this.levelIndex >= 10,
        });
      });
    }
  }

  private nextLevel(score: [number, number]): void {
    const level = this.levelIndex + 1;
    const seed = Math.floor(Math.random() * 1e9);
    if (this.session.mode === 'host') {
      const session = this.session as HostSession;
      session.start(seed, level, this.heroes, this.friends, score);
      this.scene.start('Game', { ...this.startData, mode: 'host', session, level, heroes: this.heroes, score });
      return;
    }
    this.scene.start('Game', { ...this.startData, mode: 'local', level, heroes: this.heroes, seed, score });
  }
}
