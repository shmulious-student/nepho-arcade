// Session abstraction: GameScene talks to a Session without caring whether play is local, host, or
// guest. Local/Host run the sim directly; Guest only renders snapshots received from the host.
import { World } from '../sim/world';
import { makeBot, botInput, type BotState } from '../sim/bot';
import { encodeSnapshot, decodeSnapshot, encodeInput, decodeInput } from './codec';
import type { Msg } from './protocol';
import type { HeroId, Snapshot, EntityView } from '../sim/types';
import type { FriendSetup } from '../sim/friends';
import type { InputFrame } from '../sim/input';
import { EMPTY_INPUT } from '../sim/input';

export interface SessionEvents {
  onSnapshot?: (s: Snapshot) => void;
  onPeer?: (joined: boolean) => void;
  onRoom?: (code: string) => void;
  onError?: (message: string) => void;
}

export interface Session {
  readonly localSlot: number;
  readonly mode: 'local' | 'host' | 'guest';
  setInput(slot: number, input: InputFrame): void;
  update(dtMs: number): void;
  snapshot(): Snapshot | null;
  /** Re-reads the snapshot from the world right now, without waiting for the next tick — for
   * changes made to the world from outside the tick loop (the CONTINUE? revive). */
  refreshSnapshot(): void;
  world(): World | null; // only present for local/host — guests have no authoritative world
  /** Freezes the simulation (local and host only; a guest cannot pause the host). */
  setPaused(paused: boolean): void;
  readonly paused: boolean;
  destroy(): void;
}

const TICK_MS = 1000 / 60;
const SNAPSHOT_EVERY = 2; // 30Hz broadcast from a 60Hz sim

abstract class BaseSession implements Session {
  abstract readonly localSlot: number;
  paused = false;
  setPaused(paused: boolean): void { this.paused = paused; }
  abstract readonly mode: 'local' | 'host' | 'guest';
  setInput(_slot: number, _input: InputFrame): void {}
  update(_dtMs: number): void {}
  snapshot(): Snapshot | null { return null; }
  refreshSnapshot(): void {}
  world(): World | null { return null; }
  destroy(): void {}
}

/** Solo or local-two-keyboard play. No network. */
export class LocalSession extends BaseSession {
  readonly localSlot = 0;
  readonly mode = 'local' as const;
  private w: World;
  private acc = 0;
  private inputs: [InputFrame, InputFrame] = [EMPTY_INPUT, EMPTY_INPUT];
  private snap: Snapshot;

  constructor(seed: number, level: number, heroes: [HeroId, HeroId | null], friends?: FriendSetup, score?: [number, number]) {
    super();
    this.w = new World({ seed, level, heroes, friends, score });
    this.snap = this.w.snapshot();
  }
  setInput(slot: number, input: InputFrame): void { this.inputs[slot] = input; }
  update(dtMs: number): void {
    if (this.paused) { this.acc = 0; return; }
    this.acc += dtMs;
    while (this.acc >= TICK_MS) {
      this.acc -= TICK_MS;
      this.w.step(this.inputs);
      this.snap = this.w.snapshot();
    }
  }
  snapshot(): Snapshot { return this.snap; }
  refreshSnapshot(): void { this.snap = this.w.snapshot(); }
  world(): World { return this.w; }
}

/** Host: runs the authoritative sim, drives P1 locally, applies the latest input received from the
 * guest for P2, and (if connected) broadcasts binary snapshots at 30Hz over a WebSocket.
 *
 * The World is intentionally NOT built in the constructor: a host can click "HOST GAME" (which opens
 * the room) well before the guest joins and reports which hero they picked, and the World needs a
 * concrete heroId for slot 1 at construction time. Building it early would either omit the guest's
 * hero entirely or bake in a guessed placeholder that never matches what the guest actually chose —
 * call start() once ready (typically when the host presses their own START), by which point guestHero
 * holds whatever the guest already sent, or will apply retroactively if it arrives a moment later. */
export class HostSession extends BaseSession {
  readonly localSlot = 0;
  readonly mode = 'host' as const;
  private w: World | null = null;
  private acc = 0;
  private tickCount = 0;
  private inputs: [InputFrame, InputFrame] = [EMPTY_INPUT, EMPTY_INPUT];
  private snap: Snapshot | null = null;
  private ws: WebSocket | null = null;
  private syncTimer = 0;
  private pendingHeroes: [number, number, [HeroId, HeroId | null], FriendSetup | undefined] | null = null; // [seed, level, heroes, friends] queued if start() was called before guestHero arrived
  guestHero: HeroId | null = null;
  events: SessionEvents = {};

  constructor(private wsUrl: string) { super(); }

  connect(): void {
    const ws = new WebSocket(this.wsUrl);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => this.send({ t: 'create' });
    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') this.onControl(JSON.parse(ev.data));
      else this.onInput(ev.data as ArrayBuffer);
    };
    ws.onerror = () => this.events.onError?.('could not reach the LAN server');
  }
  private send(msg: Msg) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg)); }
  private onControl(msg: Msg): void {
    if (msg.t === 'room') this.events.onRoom?.(msg.code);
    else if (msg.t === 'peer') this.events.onPeer?.(msg.joined);
    else if (msg.t === 'error') this.events.onError?.(msg.message);
    else if (msg.t === 'hero' && msg.slot === 1) {
      this.guestHero = msg.id;
      if (this.pendingHeroes) { const [seed, level, heroes, friends] = this.pendingHeroes; this.pendingHeroes = null; this.start(seed, level, [heroes[0], msg.id], friends); }
    }
  }
  private onInput(buf: ArrayBuffer): void {
    const { held, pressed } = decodeInput(buf);
    this.inputs[1] = { held, pressed };
  }
  setInput(slot: number, input: InputFrame): void { this.inputs[slot] = input; }
  setHero(slot: number, id: HeroId): void { this.send({ t: 'hero', slot, id }); }

  /** Builds the World. If coop is intended (heroes[1] set as a placeholder) but the guest's real pick
   * hasn't arrived yet, waits for it instead of starting with a guessed hero. */
  start(seed: number, level: number, heroes: [HeroId, HeroId | null], friends?: FriendSetup, score?: [number, number]): void {
    if (heroes[1] && !this.guestHero) { this.pendingHeroes = [seed, level, heroes, friends]; return; }
    const resolved: [HeroId, HeroId | null] = [heroes[0], heroes[1] ? (this.guestHero || heroes[1]) : null];
    this.w = new World({ seed, level, heroes: resolved, friends, score });
    this.snap = this.w.snapshot();
  }
  update(dtMs: number): void {
    if (!this.w) return;
    if (this.paused) { this.acc = 0; return; }
    this.acc += dtMs;
    while (this.acc >= TICK_MS) {
      this.acc -= TICK_MS;
      this.w.step(this.inputs);
      this.tickCount++;
      this.snap = this.w.snapshot();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        if (this.tickCount % SNAPSHOT_EVERY === 0) this.ws.send(encodeSnapshot(this.snap));
        this.syncTimer += TICK_MS;
        if (this.syncTimer > 2000) { this.syncTimer = 0; this.send({ t: 'sync', score: this.w.score, credits: this.w.credits, lives: this.w.lives }); }
      }
    }
  }
  snapshot(): Snapshot | null { return this.snap; }
  refreshSnapshot(): void { if (this.w) this.snap = this.w.snapshot(); }
  world(): World | null { return this.w; }
  destroy(): void { this.ws?.close(); }
}

interface Sample { t: number; ents: Map<number, EntityView> }

/** Guest: no authoritative world. Sends local input at 60Hz, renders host snapshots with a small
 * interpolation buffer so motion stays smooth despite the 30Hz broadcast and network jitter. */
export class GuestSession extends BaseSession {
  readonly localSlot = 1;
  readonly mode = 'guest' as const;
  private ws: WebSocket | null = null;
  private input: InputFrame = EMPTY_INPUT;
  private clientTick = 0;
  private acc = 0;
  private history: Sample[] = [];
  private latest: Snapshot | null = null;
  private renderSnap: Snapshot | null = null;
  events: SessionEvents = {};
  private readonly interpDelay = 100; // ms, ~3 broadcast intervals of buffer

  private closing = false;

  constructor(private wsUrl: string, private code: string) { super(); }

  connect(): void {
    const ws = new WebSocket(this.wsUrl);
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => this.send({ t: 'join', code: this.code });
    ws.onmessage = (ev) => {
      if (typeof ev.data === 'string') this.onControl(JSON.parse(ev.data));
      else this.onSnapshot(ev.data as ArrayBuffer);
    };
    // the host closing its room (or the Wi-Fi dropping) must not leave the guest staring at a
    // frozen frame with no explanation
    ws.onclose = () => { if (!this.closing) this.events.onError?.('connection to the host was lost'); };
    ws.onerror = () => { if (!this.closing) this.events.onError?.('could not reach the host'); };
  }
  private send(msg: Msg) { if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg)); }
  private onControl(msg: Msg): void {
    if (msg.t === 'room') this.events.onRoom?.(msg.code);
    else if (msg.t === 'peer') this.events.onPeer?.(msg.joined);
    else if (msg.t === 'error') this.events.onError?.(msg.message);
    else if (msg.t === 'sync' && this.latest) { this.latest = { ...this.latest, score: msg.score, credits: msg.credits }; }
  }
  private onSnapshot(buf: ArrayBuffer): void {
    const snap = decodeSnapshot(buf);
    this.latest = snap;
    const map = new Map(snap.entities.map((e) => [e.id, e] as const));
    this.history.push({ t: performance.now(), ents: map });
    while (this.history.length > 8) this.history.shift();
  }
  setHero(id: HeroId): void { this.send({ t: 'hero', slot: 1, id }); }
  setInput(_slot: number, input: InputFrame): void { this.input = input; }
  update(_dtMs: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(encodeInput(this.clientTick++, this.input.held, this.input.pressed));
    }
    if (!this.latest) return;
    const renderAt = performance.now() - this.interpDelay;
    let a: Sample | null = null, b: Sample | null = null;
    for (let i = 0; i < this.history.length - 1; i++) {
      if (this.history[i].t <= renderAt && this.history[i + 1].t >= renderAt) { a = this.history[i]; b = this.history[i + 1]; break; }
    }
    if (!a || !b) {
      this.renderSnap = this.latest;
      return;
    }
    const alpha = (renderAt - a.t) / Math.max(1, b.t - a.t);
    const entities: EntityView[] = [];
    for (const [id, be] of b.ents) {
      const ae = a.ents.get(id);
      if (!ae) { entities.push(be); continue; }
      entities.push({
        ...be,
        x: ae.x + (be.x - ae.x) * alpha,
        y: ae.y + (be.y - ae.y) * alpha,
        z: ae.z + (be.z - ae.z) * alpha,
        hp: ae.hp + (be.hp - ae.hp) * alpha,
      });
    }
    this.renderSnap = { ...this.latest, entities };
  }
  snapshot(): Snapshot | null { return this.renderSnap || this.latest; }
  destroy(): void { this.closing = true; this.ws?.close(); }
}

export function wsUrlFromLocation(): string {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}
export { makeBot, botInput };
export type { BotState };
