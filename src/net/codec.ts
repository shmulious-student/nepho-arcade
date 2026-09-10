// Binary wire format for LAN co-op. Snapshots (host -> guests, 30Hz) and inputs (guest -> host, 60Hz).
// Kept deliberately small: header + fixed-size entity/event records, little-endian, no JSON overhead.
import type { Snapshot, EntityView, SimEvent, LevelPhase, Kind } from '../sim/types';

const PHASES: LevelPhase[] = ['entry', 'wave', 'go', 'boss', 'clear', 'gameover', 'victory'];
const KINDS: Kind[] = ['hero', 'enemy', 'boss', 'echo', 'projectile', 'hazard'];
const EVENT_TYPES: SimEvent['type'][] = ['hit', 'ko', 'special', 'telegraph', 'spawn', 'bossPhase', 'levelPhase', 'dash', 'launch', 'heal', 'block', 'shake', 'summon'];
const SHAPES: NonNullable<SimEvent['shape']>[] = ['circle', 'line', 'stripe', 'ring'];

// arch strings are interned to small integers so entity records stay fixed-size.
const ARCH_TABLE = [
  'nepho', 'bruiser', 'riva', 'byte',
  'punk', 'chainer', 'brawler', 'kicker', 'knight', 'shield', 'punk-b', 'brawler-b', 'knight-b',
  'ferryman', 'glass-warden', 'kilnheart', 'monk-zero', 'market-king', 'railmaw', 'crown-runner', 'the-null', 'vault-mother', 'ultra-signal',
  'hook', 'hook-return', 'shard', 'bolt', 'blast', 'ring', 'orb', 'fog', 'smoke', 'wall',
];
const archIndex = (a: string) => { const i = ARCH_TABLE.indexOf(a); return i < 0 ? 255 : i; };
const archName = (i: number) => ARCH_TABLE[i] || 'unknown';

const MAX_ENTITIES = 40;
const MAX_EVENTS = 20;

export function encodeSnapshot(s: Snapshot): ArrayBuffer {
  const entities = s.entities.slice(0, MAX_ENTITIES);
  const events = s.events.slice(0, MAX_EVENTS);
  const buf = new ArrayBuffer(19 + entities.length * 15 + events.length * 6); // header(19) + entity(15 each) + event(6 each)
  const dv = new DataView(buf);
  let o = 0;
  dv.setUint8(o, 0x53); o += 1; // 'S'
  dv.setUint32(o, s.tick >>> 0); o += 4;
  dv.setUint8(o, s.level); o += 1;
  dv.setUint8(o, PHASES.indexOf(s.phase)); o += 1;
  dv.setUint8(o, Math.max(0, s.wave)); o += 1;
  dv.setUint16(o, Math.max(0, Math.min(65535, s.cameraX))); o += 2;
  let flags = 0; if (s.go) flags |= 1; if (s.enrage) flags |= 2;
  dv.setUint8(o, flags); o += 1;
  dv.setUint16(o, Math.round(s.timer * 10)); o += 2; // deciseconds
  dv.setUint8(o, Math.round(s.bossHp * 255)); o += 1;
  dv.setUint16(o, Math.min(65535, s.bossMaxHp)); o += 2;
  dv.setUint8(o, archIndex(s.bossId)); o += 1;
  dv.setUint8(o, entities.length); o += 1;
  dv.setUint8(o, events.length); o += 1;
  for (const e of entities) {
    dv.setUint8(o, e.id & 0xff); o += 1;
    dv.setUint8(o, KINDS.indexOf(e.kind)); o += 1;
    dv.setUint8(o, archIndex(e.arch)); o += 1;
    dv.setInt16(o, Math.round(e.x)); o += 2;
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(e.y)))); o += 1;
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(e.z)))); o += 1;
    dv.setUint8(o, stateCode(e.state)); o += 1;
    dv.setUint8(o, Math.min(255, e.st)); o += 1;
    let bits = 0; if (e.facing < 0) bits |= 1; if (e.flash > 0) bits |= 2; if (e.invuln > 0) bits |= 4; if (e.hitstop > 0) bits |= 8; bits |= (e.tint & 0xf) << 4;
    dv.setUint8(o, bits); o += 1;
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(e.hp * 255)))); o += 1;
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(e.meter * 255)))); o += 1;
    dv.setUint8(o, Math.min(255, e.combo)); o += 1;
    dv.setUint8(o, e.slot < 0 ? 255 : e.slot); o += 1;
  }
  for (const ev of events) {
    dv.setUint8(o, EVENT_TYPES.indexOf(ev.type)); o += 1;
    dv.setInt16(o, Math.round(ev.x)); o += 2;
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(ev.y)))); o += 1;
    dv.setUint8(o, Math.max(0, Math.min(255, Math.round(ev.a ?? 0)))); o += 1;
    dv.setUint8(o, ev.shape ? SHAPES.indexOf(ev.shape) + 1 : 0); o += 1;
  }
  return buf;
}

export function decodeSnapshot(buf: ArrayBuffer): Snapshot {
  const dv = new DataView(buf);
  let o = 1; // skip magic
  const tick = dv.getUint32(o); o += 4;
  const level = dv.getUint8(o); o += 1;
  const phase = PHASES[dv.getUint8(o)]; o += 1;
  const wave = dv.getUint8(o); o += 1;
  const cameraX = dv.getUint16(o); o += 2;
  const flags = dv.getUint8(o); o += 1;
  const timer = dv.getUint16(o) / 10; o += 2;
  const bossHp = dv.getUint8(o) / 255; o += 1;
  const bossMaxHp = dv.getUint16(o); o += 2;
  const bossId = archName(dv.getUint8(o)); o += 1;
  const nEntities = dv.getUint8(o); o += 1;
  const nEvents = dv.getUint8(o); o += 1;
  const entities: EntityView[] = [];
  for (let i = 0; i < nEntities; i++) {
    const id = dv.getUint8(o); o += 1;
    const kind = KINDS[dv.getUint8(o)]; o += 1;
    const arch = archName(dv.getUint8(o)); o += 1;
    const x = dv.getInt16(o); o += 2;
    const y = dv.getUint8(o); o += 1;
    const z = dv.getUint8(o); o += 1;
    const state = stateName(dv.getUint8(o)); o += 1;
    const st = dv.getUint8(o); o += 1;
    const bits = dv.getUint8(o); o += 1;
    const hp = dv.getUint8(o) / 255; o += 1;
    const meter = dv.getUint8(o) / 255; o += 1;
    const combo = dv.getUint8(o); o += 1;
    const slotRaw = dv.getUint8(o); o += 1;
    entities.push({
      id, kind, arch, slot: slotRaw === 255 ? -1 : slotRaw, x, y, z, facing: bits & 1 ? -1 : 1, state, st, hp, meter,
      flash: bits & 2 ? 1 : 0, invuln: bits & 4 ? 1 : 0, hitstop: bits & 8 ? 1 : 0, scale: 1, tint: (bits >> 4) & 0xf, combo,
    });
  }
  const events: SimEvent[] = [];
  for (let i = 0; i < nEvents; i++) {
    const type = EVENT_TYPES[dv.getUint8(o)]; o += 1;
    const x = dv.getInt16(o); o += 2;
    const y = dv.getUint8(o); o += 1;
    const a = dv.getUint8(o); o += 1;
    const shapeIdx = dv.getUint8(o); o += 1;
    events.push({ type, x, y, a, shape: shapeIdx > 0 ? SHAPES[shapeIdx - 1] : undefined });
  }
  return { tick, level, phase, wave, cameraX, timer, bossHp, bossMaxHp, bossId, score: [0, 0], credits: 0, entities, events, go: !!(flags & 1), enrage: !!(flags & 2) };
}

const STATES = [
  'idle', 'walk', 'light1', 'light2', 'light3', 'heavy', 'dash', 'dashAttack', 'special', 'hurt', 'hurtHeavy',
  'launched', 'knockdown', 'getup', 'ko', 'attack', 'approach', 'defeat',
];
const stateCode = (s: string) => { const i = STATES.indexOf(s); return i < 0 ? 255 : i; };
const stateName = (i: number) => STATES[i] || 'idle';

// Input packet: guest -> host, 60Hz. 5 bytes.
export function encodeInput(clientTick: number, held: number, pressed: number): ArrayBuffer {
  const buf = new ArrayBuffer(5);
  const dv = new DataView(buf);
  dv.setUint8(0, 0x49); // 'I'
  dv.setUint16(1, clientTick & 0xffff);
  dv.setUint8(3, held & 0xff);
  dv.setUint8(4, pressed & 0xff);
  return buf;
}

export function decodeInput(buf: ArrayBuffer): { clientTick: number; held: number; pressed: number } {
  const dv = new DataView(buf);
  return { clientTick: dv.getUint16(1), held: dv.getUint8(3), pressed: dv.getUint8(4) };
}
