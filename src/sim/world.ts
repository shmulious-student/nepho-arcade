// Deterministic simulation world. No Phaser import. step(inputs) advances exactly one 60Hz tick.
import { Rng } from './rng';
import { makeEntity, setState, isDown } from './entity';
import { stepHero } from './fighter';
import { stepEnemy } from './enemyAi';
import { stepBoss, stepHazard, stepProjectile, BOSS_DEFS, BOSS_ORDER, setDeck } from './bosses';
import { stepFriends, assistReadiness, type FriendMode, type FriendSetup } from './friends';
import { resolveHits, registerProjectileHit, forgetProjectile, registerHazardHit, hazardHit as getHazardHit, forgetHazard } from './combat';
import { makeDirector, stepDirector, type DirectorState } from './director';
import { LEVELS, BOSS_HP_BASE, BOSS_HP_PER_LEVEL, BOSS_ENRAGE_TICKS } from './levels';
import { HEROES } from './frameData';
import { ENEMY_DEFS } from './enemyAi';
import type { InputFrame } from './input';
import { LANE_H, LEVEL_W, VIEW_W, type Entity, type HeroId, type Snapshot, type EntityView, type SimEvent, type LevelPhase } from './types';

export interface WorldOptions { seed: number; level: number; heroes: [HeroId, HeroId | null]; friends?: FriendSetup; score?: [number, number] }

export class World {
  tick = 0;
  rng: Rng;
  level: number;
  phase: LevelPhase = 'entry';
  cameraX = 0;
  entities: Entity[] = [];
  players: (Entity | null)[] = [null, null];
  friendMode: FriendMode = 'off';
  friendIds: [HeroId | null, HeroId | null] = [null, null];
  friends: (Entity | null)[] = [null, null]; // live friend entity per player slot
  assistCd: [number, number] = [0, 0];
  events: SimEvent[] = [];
  score: [number, number] = [0, 0];
  credits = 0;
  director: DirectorState = makeDirector();
  enraged = false;
  bossDefeated = false; // sticky flag: the boss entity itself may be removed from `entities` before the director notices
  private nextId = 1;
  private attackTokens = new Set<number>(); // enemy ids currently "allowed" to attack (limits simultaneous attackers)
  private maxAttackers = 2;
  private done = false;
  result: 'victory' | 'gameover' | null = null;
  lives: [number, number] = [5, 5]; // extra continues beyond the current life, per hero slot — generous margin for human play, not just bot viability

  constructor(opts: WorldOptions) {
    this.rng = new Rng(opts.seed);
    this.level = opts.level;
    for (let slot = 0; slot < 2; slot++) {
      const hid = opts.heroes[slot];
      if (!hid) continue;
      const def = HEROES[hid];
      // inside the zoomed view (the renderer shows roughly the middle 60% of VIEW_W), not at its edge
      const e = makeEntity(this.id(), 'hero', hid, 300 + slot * 40, LANE_H * 0.5, def.hp);
      e.slot = slot;
      this.entities.push(e);
      this.players[slot] = e;
    }
    this.maxAttackers = this.playerCount() > 1 ? 2 : 1;
    if (opts.score) this.score = [opts.score[0], opts.score[1]];
    if (opts.friends) {
      this.friendMode = opts.friends.mode;
      // a friend is never the same hero as either player
      this.friendIds = opts.friends.friends.map((f) => (f && !opts.heroes.includes(f) ? f : null)) as [HeroId | null, HeroId | null];
    }
  }

  private id(): number { return this.nextId++; }
  nextEntityId(): number { return this.id(); }
  /** Heroes plus any live friends — what enemies pick their targets from. */
  allies(): Entity[] { return [...this.heroes(), ...this.friends.filter((f): f is Entity => !!f && f.state !== 'ko')]; }
  byId(id: number): Entity | undefined { return this.entities.find((e) => e.id === id); }
  playerCount(): number { return this.players.filter(Boolean).length; }
  heroes(): Entity[] { return this.players.filter((p): p is Entity => !!p); }
  boss(): Entity | undefined { return this.entities.find((e) => e.kind === 'boss'); }
  livingEnemies(): number { return this.entities.filter((e) => e.kind === 'enemy' && !e.dead).length; }
  setPhase(p: LevelPhase): void { this.phase = p; this.director.phaseTick = 0; }
  addScore(slot: number, v: number): void { if (slot >= 0) this.score[slot] += v; }
  emit(ev: SimEvent): void { this.events.push(ev); }

  nearestHero(from: Entity): Entity | undefined {
    let best: Entity | undefined, bd = Infinity;
    for (const h of this.allies()) {
      if (h.state === 'ko') continue;
      const d = Math.hypot(h.x - from.x, (h.y - from.y) * 1.6);
      if (d < bd) { bd = d; best = h; }
    }
    return best || this.heroes()[0];
  }

  takeAttackToken(id: number): boolean {
    if (this.attackTokens.size >= this.maxAttackers) return this.attackTokens.has(id);
    this.attackTokens.add(id);
    return true;
  }
  releaseAttackToken(id: number): void { this.attackTokens.delete(id); }

  spawnEnemy(arch: string, side: 'left' | 'right'): Entity {
    const def = ENEMY_DEFS[arch];
    const x = side === 'right' ? this.cameraX + VIEW_W + 40 + this.rng.range(0, 60) : this.cameraX - 40 - this.rng.range(0, 60);
    const e = makeEntity(this.id(), 'enemy', arch, x, this.rng.range(10, LANE_H - 10), Math.round(def.hp * LEVELS[this.level - 1].hpMul));
    e.facing = side === 'right' ? -1 : 1;
    e.guard = !!def.guard;
    this.entities.push(e);
    return e;
  }

  spawnBoss(arch: string, x: number, y: number): Entity {
    const def = BOSS_DEFS[arch];
    const hp = arch === 'ultra-signal' ? def.hp : BOSS_HP_BASE + BOSS_HP_PER_LEVEL * this.level;
    const scaledHp = Math.round(hp * (this.playerCount() > 1 ? 1.6 : 1));
    const e = makeEntity(this.id(), 'boss', arch, x, y, scaledHp);
    e.facing = -1;
    this.entities.push(e);
    this.bossDefeated = false;
    if (arch === 'ultra-signal') this.buildUltraDeck(e);
    this.emit({ type: 'bossPhase', x, y, id: e.id, a: 0 });
    return e;
  }

  spawnEcho(arch: string, x: number, y: number, scale: number, hpFrac: number, tint: number): Entity {
    const def = BOSS_DEFS[arch];
    const e = makeEntity(this.id(), 'echo', arch, x, y, Math.round(def.hp * hpFrac));
    e.scale = scale; e.tint = tint; e.facing = -1;
    this.entities.push(e);
    return e;
  }

  spawnProjectile(owner: Entity, arch: string, x: number, y: number, z: number, vx: number, hit: import('./types').Hitbox): Entity {
    const e = makeEntity(this.id(), 'projectile', arch, x, y, 1);
    e.owner = owner.id; e.slot = owner.slot; e.z = z; e.vx = vx; e.ttl = 90; e.facing = vx >= 0 ? 1 : -1;
    this.entities.push(e);
    registerProjectileHit(e.id, hit);
    return e;
  }

  spawnHazard(owner: Entity, arch: string, x: number, y: number, tele: number, active: number, hit: import('./types').Hitbox, colour: number, speed = 0, phase01 = 0): Entity {
    const e = makeEntity(this.id(), 'hazard', arch, x, y, 1);
    e.owner = owner.id; e.pt = tele; e.aiT = tele + active; e.vx = speed; e.vy = phase01; e.pphase = tele > 0 ? 0 : 1;
    this.entities.push(e);
    registerHazardHit(e.id, hit);
    void colour;
    return e;
  }

  hazardHit(id: number) { return getHazardHit(id); }

  private buildUltraDeck(boss: Entity): void {
    const others = BOSS_ORDER.filter((id) => id !== 'ultra-signal');
    const shuffled = [...others];
    for (let i = shuffled.length - 1; i > 0; i--) { const j = this.rng.int(0, i); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; }
    const deck = [];
    const own = BOSS_DEFS['ultra-signal'].patterns;
    for (const id of shuffled) deck.push(...BOSS_DEFS[id].patterns.slice(0, 1));
    deck.push(...own);
    setDeck(boss.id, deck);
    (boss as any).stolenOrder = shuffled;
  }

  tryRevive(hero: Entity): boolean {
    const slot = hero.slot;
    if (slot < 0 || this.lives[slot] <= 0) return false;
    this.lives[slot]--;
    hero.hp = Math.round(hero.maxHp * 0.6);
    hero.meter = 0;
    hero.invuln = 90;
    hero.x = this.cameraX + 300 + slot * 30;
    hero.y = LANE_H * 0.5;
    hero.combo = 0; hero.comboTimer = 0;
    setState(hero, 'getup');
    this.emit({ type: 'heal', x: hero.x, y: hero.y, id: hero.id });
    return true;
  }

  onEnemyKilled(_e: Entity, _by?: Entity): void { this.credits += 5; }
  onBossKilled(e: Entity, _by?: Entity): void {
    this.credits += e.kind === 'boss' ? 50 : 20;
    if (e.kind === 'boss') this.bossDefeated = true;
  }

  completeLevel(): void {
    this.done = true;
    this.result = 'victory';
    this.setPhase('victory'); // the renderer keys the level-clear / next-level flow off the snapshot phase
  }

  isFinished(): boolean { return this.done; }


  step(inputs: [InputFrame, InputFrame]): void {
    this.tick++;
    this.events = [];
    if (this.director.bossTick > BOSS_ENRAGE_TICKS && this.phase === 'boss') this.enraged = true;

    for (const h of this.heroes()) if (!isDown(h) && h.state !== 'ko') stepHero(this, h, inputs[h.slot] || { held: 0, pressed: 0 });
    for (const h of this.heroes()) if (isDown(h) || h.state === 'ko') stepHero(this, h, { held: 0, pressed: 0 });
    // Modest passive regen while safely idle/walking (not mid-attack, mid-hitstun, or downed) — a
    // forgiving-arcade convention so a level is rarely lost to slow chip damage between real threats.
    for (const h of this.heroes()) if ((h.state === 'idle' || h.state === 'walk') && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.002);
    stepFriends(this, inputs);

    for (const e of this.entities) {
      if (e.kind === 'enemy') stepEnemy(this, e);
      else if (e.kind === 'boss' || e.kind === 'echo') stepBoss(this, e);
      else if (e.kind === 'projectile') stepProjectile(this, e);
      else if (e.kind === 'hazard') stepHazard(this, e);
    }

    resolveHits(this);
    stepDirector(this, this.director);

    if (!this.done && this.heroes().length > 0 && this.heroes().every((h) => h.state === 'ko')) {
      this.done = true;
      this.result = 'gameover';
      this.setPhase('gameover');
    }

    // remove dead/expired non-hero entities
    this.entities = this.entities.filter((e) => {
      if (e.kind === 'hero' && e.slot >= 0) return true;
      if (e.removeAt && this.tick >= e.removeAt) { if (e.kind === 'projectile') forgetProjectile(e.id); if (e.kind === 'hazard') forgetHazard(e.id); return false; }
      return true;
    });

    if (this.phase === 'clear' && this.director.phaseTick >= 1) {
      // completeLevel is invoked by director; nothing else to do here
    }
  }

  /** Produces a compact renderer/network view of the current tick. */
  snapshot(): Snapshot {
    const boss = this.boss();
    return {
      tick: this.tick,
      level: this.level,
      phase: this.phase,
      wave: this.director.waveIndex + 1,
      cameraX: Math.round(this.cameraX),
      timer: +(this.director.levelTick / 60).toFixed(1),
      bossHp: boss ? boss.hp / boss.maxHp : 0,
      bossMaxHp: boss?.maxHp || 0,
      bossId: boss?.arch || '',
      score: this.score,
      assist: assistReadiness(this),
      credits: this.credits,
      entities: this.entities.map(viewOf),
      events: this.events,
      go: this.phase === 'go',
      enrage: this.enraged,
    };
  }

  /** Deterministic hash of world state (for determinism tests / desync detection). */
  hash(): number {
    let h = 2166136261 ^ this.tick;
    const mix = (v: number) => { h = Math.imul(h ^ (v | 0), 16777619) >>> 0; };
    for (const e of this.entities) {
      mix(e.id); mix(Math.round(e.x * 4)); mix(Math.round(e.y * 4)); mix(Math.round(e.z * 4));
      mix(Math.round(e.hp)); mix(e.st); mix(stateCode(e.state));
    }
    mix(this.score[0]); mix(this.score[1]); mix(this.director.waveIndex); mix(phaseCode(this.phase));
    return h >>> 0;
  }
}

function stateCode(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function phaseCode(p: LevelPhase): number { return ['entry', 'wave', 'go', 'boss', 'clear', 'gameover', 'victory'].indexOf(p); }

function viewOf(e: Entity): EntityView {
  return {
    id: e.id, kind: e.kind, arch: e.arch, slot: e.slot, x: +e.x.toFixed(1), y: +e.y.toFixed(1), z: +e.z.toFixed(1),
    facing: e.facing, state: e.state, st: e.st, hp: e.maxHp > 0 ? e.hp / e.maxHp : 0, meter: e.meter / 100,
    flash: e.flash, invuln: e.invuln, scale: e.scale, tint: e.tint, combo: e.combo, hitstop: e.hitstop,
  };
}

