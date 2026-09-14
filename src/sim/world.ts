// Deterministic simulation world. No Phaser import. step(inputs) advances exactly one 60Hz tick.
import { Rng } from './rng';
import { makeEntity, setState, isDown } from './entity';
import { stepHero, clampHero, stepPitz } from './fighter';
import { stepEnemy } from './enemyAi';
import { stepBoss, stepHazard, stepProjectile, BOSS_DEFS, setDeck } from './bosses';
import { stepFriends, assistReadiness, type FriendMode, type FriendSetup } from './friends';
import { rollDrop, stepPickup } from './pickups';
import { LEVEL_TARGET_SECONDS } from './levels';
import { resolveHits, registerProjectileHit, forgetProjectile, registerHazardHit, hazardHit as getHazardHit, forgetHazard } from './combat';
import { makeDirector, stepDirector, beginBoss, type DirectorState } from './director';
import { levelDef, levelWidth, ACTIVE, BOSS_HP_BASE, BOSS_HP_PER_LEVEL, BOSS_ENRAGE_TICKS } from './levels';
import { HEROES } from './frameData';
import { ACTIVE_HEROES } from './roster';
import { stepDialog, stepGuests, tryDialog, DIALOG_CAT, type DialogState } from './dialog';
import { dialogFor } from './dialogs';
import { DIFFICULTY_DEFS, DEFAULT_DIFFICULTY, type Difficulty, type DifficultyDef } from './difficulty';
import { ENEMY_DEFS } from './enemyAi';
import type { InputFrame } from './input';
import { LANE_H, VIEW_W, VISIBLE_X0, type Entity, type HeroId, type Snapshot, type EntityView, type SimEvent, type LevelPhase } from './types';

/** Hp a boss keeps when it is fielded as a wave enemy. */
export const WAVE_BOSS_HP = 0.16;

export interface WorldOptions { seed: number; level: number; heroes: [HeroId, HeroId | null]; friends?: FriendSetup; score?: [number, number]; /** false: no dialog scenes (unit tests of other mechanics) */ dialogs?: boolean; difficulty?: Difficulty }

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
  lives: [number, number] = [2, 2]; // extra lives per hero slot (difficulty.lives); after those it is the CONTINUE? countdown
  difficulty: Difficulty = DEFAULT_DIFFICULTY;
  diff: DifficultyDef = DIFFICULTY_DEFS[DEFAULT_DIFFICULTY];
  private phaseBeforeGameOver: LevelPhase = 'wave';
  /** The dialog scene on stage (sim/dialog.ts); the director and the players wait while it runs. */
  dialog: DialogState | null = null;
  dialogsPlayed = new Set<string>();
  dialogsEnabled = true;
  /** Heroes who stayed after a dialog to fight beside the players (slot -1, like sidekicks). */
  guests: Entity[] = [];
  /** The heroes the lobby picked, before an opening scene swapped one for this level. */
  chosenHeroes: [HeroId, HeroId | null];
  /** The swap an opening scene made: which player, who they picked, who they play this level. */
  swap: { slot: number; from: HeroId; to: HeroId } | null = null;

  constructor(opts: WorldOptions) {
    this.rng = new Rng(opts.seed);
    this.level = opts.level;
    this.chosenHeroes = [opts.heroes[0], opts.heroes[1]];
    this.dialogsEnabled = opts.dialogs !== false;
    this.difficulty = opts.difficulty ?? DEFAULT_DIFFICULTY;
    this.diff = DIFFICULTY_DEFS[this.difficulty] ?? DIFFICULTY_DEFS[DEFAULT_DIFFICULTY];
    this.lives = [this.diff.lives, this.diff.lives];
    // An opening scene marked `ifPlayed: swap` hands the player who picked its hero a random other
    // hero for this level (the script explains it); the lobby's pick comes back next level.
    const heroes: [HeroId, HeroId | null] = [opts.heroes[0], opts.heroes[1]];
    const opening = dialogFor(levelDef(opts.level).id, 'start');
    if (this.dialogsEnabled && opening?.ifPlayed === 'swap') {
      const slot = heroes.findIndex((h) => h === opening.hero);
      if (slot >= 0) {
        const pool = ACTIVE_HEROES.filter((h) => !heroes.includes(h) && h !== opening.hero && HEROES[h]);
        if (pool.length) {
          const to = pool[this.rng.int(0, pool.length - 1)];
          this.swap = { slot, from: opening.hero, to };
          heroes[slot] = to;
        }
      }
    }
    for (let slot = 0; slot < 2; slot++) {
      const hid = heroes[slot];
      if (!hid) continue;
      const def = HEROES[hid];
      // inside the zoomed view (the renderer shows roughly the middle 60% of VIEW_W), not at its edge
      const e = makeEntity(this.id(), 'hero', hid, 300 + slot * 40, LANE_H * 0.5, def.hp);
      e.slot = slot;
      this.entities.push(e);
      this.players[slot] = e;
    }
    this.maxAttackers = (this.playerCount() > 1 ? 2 : 1) + this.diff.extraAttackers;
    if (opts.score) this.score = [opts.score[0], opts.score[1]];
    if (opts.friends) {
      this.friendMode = opts.friends.mode;
      // a friend is never the same hero as either player
      this.friendIds = opts.friends.friends.map((f) => (f && !heroes.includes(f) ? f : null)) as [HeroId | null, HeroId | null];
    }
  }

  private id(): number { return this.nextId++; }
  nextEntityId(): number { return this.id(); }
  /** Heroes plus any live friends — what enemies pick their targets from. */
  allies(): Entity[] { return [...this.heroes(), ...this.friends.filter((f): f is Entity => !!f && f.state !== 'ko'), ...this.guests.filter((g) => !g.dead && g.state !== 'ko')]; }
  byId(id: number): Entity | undefined { return this.entities.find((e) => e.id === id); }
  playerCount(): number { return this.players.filter(Boolean).length; }
  heroes(): Entity[] { return this.players.filter((p): p is Entity => !!p); }
  boss(): Entity | undefined { return this.entities.find((e) => e.kind === 'boss'); }
  /** Wave enemies still up — including bosses fielded as wave enemies (echoes, see spawnEnemy). */
  livingEnemies(): number { return this.entities.filter((e) => (e.kind === 'enemy' || e.kind === 'echo') && !e.dead).length; }
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
    if (BOSS_DEFS[arch]) return this.spawnWaveBoss(arch, side);
    const def = ENEMY_DEFS[arch];
    const x = side === 'right' ? this.cameraX + VIEW_W + 40 + this.rng.range(0, 60) : this.cameraX - 40 - this.rng.range(0, 60);
    const e = makeEntity(this.id(), 'enemy', arch, x, this.rng.range(10, LANE_H - 10), Math.round(def.hp * levelDef(this.level).hpMul * this.diff.enemyHp));
    e.facing = side === 'right' ? -1 : 1;
    e.dmgMul = this.diff.enemyDmg;
    e.guard = !!def.guard;
    e.cooldown = 75; // sizes the player up for a beat before the first swing
    this.entities.push(e);
    return e;
  }

  /** A boss fielded as a wave enemy (the finale's gauntlet): a smaller copy with a fraction of its
   * hp that fights with the boss's own patterns, counted and cleared like any wave enemy — an echo,
   * the same kind Crown Runner splits into, so the HUD's named boss bar stays for the real boss. */
  spawnWaveBoss(arch: string, side: 'left' | 'right'): Entity {
    const def = BOSS_DEFS[arch];
    const x = side === 'right' ? this.cameraX + VIEW_W + 40 + this.rng.range(0, 60) : this.cameraX - 40 - this.rng.range(0, 60);
    const hp = Math.round(def.hp * WAVE_BOSS_HP * levelDef(this.level).hpMul * this.diff.enemyHp);
    const e = makeEntity(this.id(), 'echo', arch, x, this.rng.range(10, LANE_H - 10), hp);
    e.facing = side === 'right' ? -1 : 1;
    e.scale = 1.1; // the renderer draws echoes at 0.72 of the boss: this lands between an enemy and the boss
    e.dmgMul = this.diff.enemyDmg;
    e.cooldown = 75;
    this.entities.push(e);
    return e;
  }

  spawnBoss(arch: string, x: number, y: number): Entity {
    const def = BOSS_DEFS[arch];
    const hp = arch === 'ultra-signal' ? def.hp : BOSS_HP_BASE + BOSS_HP_PER_LEVEL * this.level;
    const scaledHp = Math.round(hp * (this.playerCount() > 1 ? 1.6 : 1) * this.diff.bossHp);
    const e = makeEntity(this.id(), 'boss', arch, x, y, scaledHp);
    e.facing = -1;
    e.dmgMul = this.diff.enemyDmg;
    this.entities.push(e);
    this.bossDefeated = false;
    if (arch === 'ultra-signal') this.buildUltraDeck(e);
    this.emit({ type: 'bossPhase', x, y, id: e.id, a: 0 });
    return e;
  }

  spawnEcho(arch: string, x: number, y: number, scale: number, hpFrac: number, tint: number): Entity {
    const def = BOSS_DEFS[arch];
    const e = makeEntity(this.id(), 'echo', arch, x, y, Math.round(def.hp * hpFrac * this.diff.bossHp));
    e.scale = scale; e.tint = tint; e.facing = -1; e.dmgMul = this.diff.enemyDmg;
    this.entities.push(e);
    return e;
  }

  spawnProjectile(owner: Entity, arch: string, x: number, y: number, z: number, vx: number, hit: import('./types').Hitbox): Entity {
    const e = makeEntity(this.id(), 'projectile', arch, x, y, 1);
    e.owner = owner.id; e.slot = owner.slot; e.friendly = owner.friendly; e.z = z; e.vx = vx; e.ttl = 90; e.facing = vx >= 0 ? 1 : -1;
    this.entities.push(e);
    registerProjectileHit(e.id, hit);
    return e;
  }

  spawnHazard(owner: Entity, arch: string, x: number, y: number, tele: number, active: number, hit: import('./types').Hitbox, colour: number, speed = 0, phase01 = 0): Entity {
    const e = makeEntity(this.id(), 'hazard', arch, x, y, 1);
    e.owner = owner.id; e.friendly = owner.friendly; e.pt = tele; e.aiT = tele + active; e.vx = speed; e.vy = phase01; e.pphase = tele > 0 ? 0 : 1;
    e.scale = hit.radius || hit.w || 1; // the renderer draws the hazard's footprint from this
    this.entities.push(e);
    registerHazardHit(e.id, hit);
    void colour;
    return e;
  }

  hazardHit(id: number) { return getHazardHit(id); }

  private buildUltraDeck(boss: Entity): void {
    // one stolen pattern from every other boss of the campaign as the roster composed it
    const others = [...new Set(ACTIVE.levels.map((l) => l.boss))].filter((id) => id !== 'ultra-signal' && BOSS_DEFS[id]);
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

  maxCombo: [number, number] = [0, 0];
  levelBonus: [number, number] = [0, 0]; // what completeLevel added, for the clear tally
  onEnemyKilled(e: Entity, _by?: Entity): void { this.credits += 5; rollDrop(this, e); }
  onBossKilled(e: Entity, _by?: Entity): void {
    this.credits += e.kind === 'boss' ? 50 : 20;
    if (e.kind === 'boss') this.bossDefeated = true;
  }

  /** CONTINUE? — the arcade continue: everyone back on their feet with full health and a fresh set
   * of lives, the fight resumes where it stopped. Score is kept. */
  continueRun(): boolean {
    if (!this.done || this.result !== 'gameover') return false;
    this.done = false; this.result = null;
    this.lives = [this.diff.lives, this.diff.lives];
    for (const h of this.heroes()) {
      h.hp = h.maxHp; h.meter = 0; h.invuln = 120; h.hitStreak = 0; h.regenLock = 0;
      h.x = this.cameraX + VISIBLE_X0 + 100 + h.slot * 40; h.y = LANE_H * 0.5; h.z = 0; h.vz = 0; h.vx = 0;
      setState(h, 'getup');
      this.emit({ type: 'heal', x: h.x, y: h.y, id: h.id });
    }
    this.setPhase(this.phaseBeforeGameOver === 'gameover' ? 'wave' : this.phaseBeforeGameOver);
    return true;
  }

  /** Dev helper: lose immediately (used by `?ko` on the dev server to see the CONTINUE? screen). */
  debugKnockOut(): void {
    this.lives = [0, 0];
    for (const h of this.heroes()) { h.hp = 0; setState(h, 'ko'); }
  }

  /** Dev helper: jump straight to the boss fight (used by `?boss` on the dev server). */
  debugSkipToBoss(): void {
    for (const e of this.entities) if (e.kind === 'enemy') { e.dead = true; e.removeAt = this.tick + 1; }
    this.cameraX = levelWidth(levelDef(this.level)) - VIEW_W;
    this.director.waveIndex = levelDef(this.level).waves.length - 1;
    this.director.queue = []; this.director.bonusUsed = true; // nothing left of the waves
    if (!tryDialog(this, 'boss')) beginBoss(this, this.director); // the boss-entrance scene first, as in play
  }

  completeLevel(): void {
    this.done = true;
    this.result = 'victory';
    // clear bonus: finishing under the target time pays, and so does the best combo of the level
    const seconds = this.director.levelTick / 60;
    const timeBonus = Math.max(0, Math.round(LEVEL_TARGET_SECONDS - seconds)) * 10;
    for (let slot = 0; slot < 2; slot++) {
      if (!this.players[slot]) continue;
      this.levelBonus[slot] = timeBonus + this.maxCombo[slot] * 40;
      this.score[slot] += this.levelBonus[slot];
    }
    this.setPhase('victory'); // the renderer keys the level-clear / next-level flow off the snapshot phase
  }

  isFinished(): boolean { return this.done; }


  step(inputs: [InputFrame, InputFrame]): void {
    this.tick++;
    this.events = [];
    if (this.director.bossTick > BOSS_ENRAGE_TICKS && this.phase === 'boss') this.enraged = true;

    if (this.dialog) {
      // A dialog scene: the players listen (their presses turn the pages), the friend on stage holds
      // still, and the director waits — everything else in the world keeps ticking.
      stepDialog(this, inputs);
      for (const f of this.friends) if (f && !f.dead) stepHero(this, f, { held: 0, pressed: 0 });
    } else {
      // A hero on the floor or out cold takes no input; one getting up does (the get-up dash).
      for (const h of this.heroes()) stepHero(this, h, (isDown(h) && h.state !== 'getup') || h.state === 'ko' ? { held: 0, pressed: 0 } : inputs[h.slot] || { held: 0, pressed: 0 });
      stepFriends(this, inputs);
    }
    // A slow trickle of HP, and only after five seconds without taking a hit — enough to recover
    // between waves, never enough to shrug off a fight. Losing has to stay possible.
    for (const h of this.heroes()) if (h.regenLock === 0 && (h.state === 'idle' || h.state === 'walk') && h.hp < h.maxHp) h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.0004 * this.diff.regen);
    stepGuests(this);

    for (const e of this.entities) {
      // a spent projectile / hazard / pickup is waiting for removal at the end of the tick: stepping
      // it again would push its removal tick out again, and it would never leave the world
      if (e.dead && (e.kind === 'projectile' || e.kind === 'hazard' || e.kind === 'pickup')) continue;
      if (e.kind === 'enemy') stepEnemy(this, e);
      else if (e.kind === 'boss' || e.kind === 'echo') stepBoss(this, e);
      else if (e.kind === 'projectile') { if (e.arch === 'cat') { if (e.pattern !== DIALOG_CAT) stepPitz(this, e); } else stepProjectile(this, e); } // the cat on stage for a dialog is moved by the dialog
      else if (e.kind === 'hazard') stepHazard(this, e);
      else if (e.kind === 'pickup') stepPickup(this, e);
    }
    for (const h of this.heroes()) if (h.combo > this.maxCombo[h.slot]) this.maxCombo[h.slot] = h.combo;

    resolveHits(this);
    if (!this.dialog) stepDirector(this, this.director);
    // The camera may have moved this tick, and a downed / KO'd hero skips its own clamp: keep every
    // player and friend inside the visible band no matter what state they are in.
    for (const h of this.allies()) clampHero(this, h);
    for (const h of this.heroes()) clampHero(this, h);
    this.guests = this.guests.filter((g) => !g.dead);

    if (!this.done && this.heroes().length > 0 && this.heroes().every((h) => h.state === 'ko')) {
      this.done = true;
      this.result = 'gameover';
      this.phaseBeforeGameOver = this.phase;
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
      lives: [this.lives[0], this.lives[1]],
      maxCombo: [this.maxCombo[0], this.maxCombo[1]],
      credits: this.credits,
      entities: this.entities.map(viewOf),
      events: this.events,
      go: this.phase === 'go',
      enrage: this.enraged,
      dialog: this.dialog ? { key: this.dialog.key, page: this.dialog.page, tick: this.dialog.tick, stage: this.dialog.stage === 'enter' ? 0 : this.dialog.stage === 'talk' ? 1 : 2 } : null,
      swap: this.swap ? [this.swap.from, this.swap.to] : null,
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
    if (this.dialog) { mix(this.dialog.page); mix(this.dialog.tick); mix(this.dialog.stage.length); }
    return h >>> 0;
  }
}

function stateCode(s: string): number { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function phaseCode(p: LevelPhase): number { return ['entry', 'wave', 'go', 'boss', 'clear', 'gameover', 'victory'].indexOf(p); }

function viewOf(e: Entity): EntityView {
  return {
    id: e.id, kind: e.kind, arch: e.arch, slot: e.slot, x: +e.x.toFixed(1), y: +e.y.toFixed(1), z: +e.z.toFixed(1),
    facing: e.facing, state: e.state, st: e.st, hp: e.maxHp > 0 ? e.hp / e.maxHp : 0, meter: e.meter / 100,
    flash: e.flash, invuln: e.invuln, scale: e.scale, tint: e.tint, combo: e.combo, hitstop: e.hitstop, phase: e.pphase,
  };
}

