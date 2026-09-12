import { GRAVITY } from './frameData';
import { LANE_H, LANE_TOL, VISIBLE_X0, VISIBLE_W, BOSS_EDGE, type Entity, type Hitbox } from './types';
import { setState } from './entity';
import { applyHit, attackerOf } from './combat';
import type { World } from './world';

export type PatternType = 'melee' | 'projectile' | 'dash' | 'aoe' | 'ring' | 'summon' | 'orbit' | 'blink' | 'beam' | 'zone' | 'armor' | 'split' | 'wall' | 'reflect' | 'pull';

export interface Pattern {
  type: PatternType;
  name: string;
  tele: number; // telegraph ticks (>= 24)
  active: number;
  recover: number;
  cooldown: number;
  weight: number;
  range?: number; // required distance to start (melee-ish)
  dmg: number;
  hitstun: number;
  kb: number;
  launch?: number;
  knockdown?: boolean;
  radius?: number;
  count?: number;
  speed?: number;
  colour: number;
  row?: 'attack' | 'special';
  arch?: string; // summon archetype
}

export interface BossDef { id: string; name: string; hp: number; speed: number; poise: number; patterns: Pattern[]; scale?: number }

const P = (p: Partial<Pattern> & { type: PatternType; name: string; colour: number }): Pattern => ({
  tele: 28, active: 20, recover: 24, cooldown: 60, weight: 1, dmg: 7, hitstun: 24, kb: 5, row: 'attack', ...p,
});

export const BOSS_DEFS: Record<string, BossDef> = {
  ferryman: { id: 'ferryman', name: 'Ferryman', hp: 1000, speed: 1.6, poise: 8, patterns: [
    P({ type: 'projectile', name: 'Hook Throw', tele: 26, active: 30, recover: 20, dmg: 9, count: 1, speed: 9, colour: 0x75f5dc, knockdown: true }),
    P({ type: 'zone', name: 'Lantern Fog', tele: 30, active: 240, recover: 10, cooldown: 240, dmg: 1, radius: 230, colour: 0x75f5dc, row: 'special', weight: 0.6 }),
    P({ type: 'pull', name: 'Chain Pull', tele: 30, active: 24, recover: 24, dmg: 10, range: 320, colour: 0x37aaff, knockdown: true }),
    P({ type: 'melee', name: 'Hook Slash', tele: 24, active: 8, recover: 22, dmg: 9, range: 110, radius: 0, colour: 0x75f5dc }),
  ] },
  'glass-warden': { id: 'glass-warden', name: 'Glass Warden', hp: 1120, speed: 1.5, poise: 9, patterns: [
    P({ type: 'projectile', name: 'Shard Fan', tele: 26, active: 24, recover: 24, dmg: 6, count: 3, speed: 7, colour: 0x37aaff }),
    P({ type: 'wall', name: 'Crystal Wall', tele: 30, active: 180, recover: 12, cooldown: 150, dmg: 7, colour: 0x37aaff, row: 'special', knockdown: true, weight: 0.7 }),
    P({ type: 'reflect', name: 'Reflect Stance', tele: 24, active: 90, recover: 12, cooldown: 200, dmg: 4, colour: 0xedf6ff, row: 'special', weight: 0.6 }),
    P({ type: 'melee', name: 'Shard Smash', tele: 26, active: 8, recover: 24, dmg: 10, range: 120, colour: 0x37aaff, knockdown: true }),
  ] },
  kilnheart: { id: 'kilnheart', name: 'Kilnheart', hp: 1240, speed: 1.3, poise: 12, patterns: [
    P({ type: 'melee', name: 'Flame Slash', tele: 28, active: 10, recover: 26, dmg: 10, range: 150, colour: 0xff8f40, knockdown: true }),
    P({ type: 'aoe', name: 'Eruption', tele: 40, active: 12, recover: 26, cooldown: 120, dmg: 12, count: 3, radius: 70, colour: 0xff8f40, row: 'special', launch: 8 }),
    P({ type: 'dash', name: 'Furnace Charge', tele: 34, active: 40, recover: 30, dmg: 12, speed: 8, colour: 0xff4f72, knockdown: true }),
  ] },
  'monk-zero': { id: 'monk-zero', name: 'Monk Zero', hp: 1000, speed: 1.9, poise: 6, patterns: [
    P({ type: 'orbit', name: 'Orbit Orbs', tele: 26, active: 160, recover: 12, cooldown: 180, dmg: 4, count: 4, radius: 95, colour: 0xbd8cff, row: 'special', weight: 0.5 }),
    P({ type: 'blink', name: 'Blink Strike', tele: 24, active: 14, recover: 22, dmg: 9, colour: 0xbd8cff, knockdown: true }),
    P({ type: 'beam', name: 'Void Beam', tele: 36, active: 14, recover: 30, dmg: 13, colour: 0xff76c8, row: 'special', launch: 7 }),
  ] },
  'market-king': { id: 'market-king', name: 'Market King', hp: 1300, speed: 1.2, poise: 10, patterns: [
    P({ type: 'aoe', name: 'Coin Rain', tele: 36, active: 10, recover: 24, cooldown: 100, dmg: 8, count: 5, radius: 55, colour: 0xffcf5c, row: 'special' }),
    P({ type: 'summon', name: 'Hired Muscle', tele: 30, active: 10, recover: 30, cooldown: 420, dmg: 1, count: 2, arch: 'punk', colour: 0xa4ee42, row: 'special', weight: 0.5 }),
    P({ type: 'ring', name: 'Stomp Shockwave', tele: 30, active: 40, recover: 30, dmg: 10, speed: 6, colour: 0xffcf5c, knockdown: true }),
    P({ type: 'melee', name: 'Scepter Swing', tele: 26, active: 8, recover: 26, dmg: 9, range: 130, colour: 0xffcf5c }),
  ] },
  railmaw: { id: 'railmaw', name: 'Railmaw', hp: 1360, speed: 1.4, poise: 14, patterns: [
    P({ type: 'dash', name: 'Rail Dash', tele: 36, active: 50, recover: 30, dmg: 13, speed: 10, colour: 0xff4f72, knockdown: true }),
    P({ type: 'melee', name: 'Buzzsaw Spin', tele: 28, active: 20, recover: 30, dmg: 9, range: 110, radius: 105, colour: 0xff4f72, row: 'special' }),
    P({ type: 'zone', name: 'Exhaust Cloud', tele: 26, active: 200, recover: 12, cooldown: 220, dmg: 1, radius: 170, colour: 0x9bb1c9, row: 'special', weight: 0.6 }),
  ] },
  'crown-runner': { id: 'crown-runner', name: 'Crown Runner', hp: 1100, speed: 2.4, poise: 6, patterns: [
    P({ type: 'dash', name: 'Afterimage Dash', tele: 24, active: 26, recover: 14, cooldown: 40, dmg: 8, speed: 12, count: 3, colour: 0xff76c8, knockdown: true }),
    P({ type: 'split', name: 'Split', tele: 30, active: 10, recover: 20, cooldown: 900, dmg: 1, count: 2, colour: 0xff76c8, row: 'special', weight: 0.4 }),
    P({ type: 'melee', name: 'Crown Kick', tele: 24, active: 8, recover: 20, dmg: 9, range: 120, colour: 0xff76c8, knockdown: true }),
  ] },
  'the-null': { id: 'the-null', name: 'The Null', hp: 1400, speed: 1.5, poise: 10, patterns: [
    P({ type: 'ring', name: 'Void Ring', tele: 32, active: 44, recover: 24, dmg: 11, speed: 5, colour: 0xedf6ff, knockdown: true }),
    P({ type: 'melee', name: 'Null Arc', tele: 28, active: 10, recover: 26, dmg: 12, range: 170, colour: 0xedf6ff, knockdown: true }),
    P({ type: 'armor', name: 'Invert Phase', tele: 30, active: 300, recover: 90, cooldown: 600, dmg: 1, colour: 0x14243d, row: 'special', weight: 0.5 }),
  ] },
  'vault-mother': { id: 'vault-mother', name: 'Vault Mother', hp: 1500, speed: 1.3, poise: 12, patterns: [
    P({ type: 'beam', name: 'Chain Lash', tele: 30, active: 12, recover: 28, dmg: 11, colour: 0xffcf5c, knockdown: true }),
    P({ type: 'aoe', name: 'Halo Bombs', tele: 44, active: 12, recover: 26, cooldown: 110, dmg: 11, count: 3, radius: 75, colour: 0xffcf5c, row: 'special', launch: 7 }),
    P({ type: 'armor', name: 'Armor Lock', tele: 26, active: 240, recover: 120, cooldown: 480, dmg: 1, colour: 0xffcf5c, row: 'special', weight: 0.5 }),
  ] },
  'ultra-signal': { id: 'ultra-signal', name: 'Ultra Signal', hp: 560, speed: 1.7, poise: 16, patterns: [
    P({ type: 'aoe', name: 'Rainbow Pillar', tele: 40, active: 14, recover: 24, cooldown: 120, dmg: 13, count: 3, radius: 80, colour: 0xff76c8, row: 'special', launch: 8 }),
    P({ type: 'melee', name: 'Signal Sweep', tele: 26, active: 10, recover: 24, dmg: 10, range: 150, colour: 0xbd8cff, knockdown: true }),
  ] },
  // The four per-action boss sets (public/assets/generated/actions/<id>/). Same pattern vocabulary
  // as the ten above so Ultra Signal can steal from them too.
  'abyss-dragon': { id: 'abyss-dragon', name: 'Abyss Dragon', hp: 1200, speed: 1.7, poise: 9, patterns: [
    P({ type: 'projectile', name: 'Void Bolt', tele: 26, active: 26, recover: 22, dmg: 8, count: 2, speed: 8, colour: 0x8a5cff }),
    P({ type: 'orbit', name: 'Abyss Orbs', tele: 26, active: 150, recover: 12, cooldown: 190, dmg: 4, count: 3, radius: 100, colour: 0x8a5cff, row: 'special', weight: 0.5 }),
    P({ type: 'blink', name: 'Wing Blink', tele: 24, active: 14, recover: 22, dmg: 9, colour: 0xc08cff, knockdown: true }),
    P({ type: 'beam', name: 'Abyss Breath', tele: 36, active: 14, recover: 30, dmg: 13, colour: 0x8a5cff, row: 'special', launch: 7 }),
  ] },
  'flame-samurai': { id: 'flame-samurai', name: 'Flame Samurai', hp: 1280, speed: 1.5, poise: 11, patterns: [
    P({ type: 'melee', name: 'Ember Cut', tele: 26, active: 10, recover: 24, dmg: 10, range: 150, colour: 0xff7a2a, knockdown: true }),
    P({ type: 'dash', name: 'Blazing Draw', tele: 34, active: 36, recover: 30, dmg: 12, speed: 10, colour: 0xff4f2a, knockdown: true }),
    P({ type: 'aoe', name: 'Cinder Field', tele: 40, active: 12, recover: 26, cooldown: 120, dmg: 11, count: 3, radius: 70, colour: 0xff7a2a, row: 'special', launch: 7 }),
    P({ type: 'zone', name: 'Heat Haze', tele: 28, active: 200, recover: 12, cooldown: 230, dmg: 1, radius: 180, colour: 0xffb060, row: 'special', weight: 0.5 }),
  ] },
  'prism-queen': { id: 'prism-queen', name: 'Prism Queen', hp: 1160, speed: 1.6, poise: 8, patterns: [
    P({ type: 'projectile', name: 'Prism Volley', tele: 26, active: 24, recover: 24, dmg: 6, count: 3, speed: 7, colour: 0xd6b8ff }),
    P({ type: 'reflect', name: 'Mirror Veil', tele: 24, active: 90, recover: 12, cooldown: 210, dmg: 4, colour: 0xf4ecff, row: 'special', weight: 0.6 }),
    P({ type: 'wall', name: 'Crystal Bloom', tele: 30, active: 170, recover: 12, cooldown: 160, dmg: 7, colour: 0xd6b8ff, row: 'special', knockdown: true, weight: 0.6 }),
    P({ type: 'melee', name: 'Scepter Lance', tele: 26, active: 8, recover: 24, dmg: 10, range: 140, colour: 0xd6b8ff, knockdown: true }),
  ] },
  'storm-colossus': { id: 'storm-colossus', name: 'Storm Colossus', hp: 1480, speed: 1.2, poise: 14, patterns: [
    P({ type: 'melee', name: 'Hammer Slam', tele: 30, active: 12, recover: 30, dmg: 12, range: 130, radius: 110, colour: 0x5ce6ff, knockdown: true }),
    P({ type: 'ring', name: 'Thunder Stomp', tele: 32, active: 42, recover: 26, dmg: 10, speed: 6, colour: 0x5ce6ff, knockdown: true }),
    P({ type: 'aoe', name: 'Lightning Fall', tele: 42, active: 12, recover: 26, cooldown: 120, dmg: 11, count: 3, radius: 70, colour: 0x9cf2ff, row: 'special', launch: 8 }),
    P({ type: 'armor', name: 'Storm Plating', tele: 26, active: 240, recover: 110, cooldown: 500, dmg: 1, colour: 0x5ce6ff, row: 'special', weight: 0.5 }),
  ] },
};

// The ten campaign bosses in level order (the four per-action sets are placed by the roster, see roster.ts).
export const BOSS_ORDER = ['ferryman', 'glass-warden', 'kilnheart', 'monk-zero', 'market-king', 'railmaw', 'crown-runner', 'the-null', 'vault-mother', 'ultra-signal'];

// runtime pattern list per entity id (ultra composes a deck)
const decks: Record<number, Pattern[]> = {};
export function setDeck(id: number, patterns: Pattern[]) { decks[id] = patterns; }
export function getPatterns(e: Entity): Pattern[] { return decks[e.id] || BOSS_DEFS[e.arch].patterns; }
export function currentPattern(e: Entity): Pattern | null { return e.pattern >= 0 ? getPatterns(e)[e.pattern] || null : null; }

export function bossActiveHit(e: Entity): Hitbox | null {
  const p = currentPattern(e);
  if (!p || e.pphase !== 1) return null;
  const base = { dy: 0, dmg: p.dmg, hitstun: p.hitstun, kb: p.kb, launch: p.launch, knockdown: p.knockdown };
  switch (p.type) {
    case 'melee': return p.radius ? { ...base, dx: 0, w: 0, h: 140, radius: p.radius } : { ...base, dx: (p.range || 100) * 0.5, w: p.range || 100, h: 140 };
    case 'dash': return { ...base, dx: 20, w: 90 * (e.scale || 1), h: 140 };
    case 'blink': return e.pt >= 6 ? { ...base, dx: 50, w: 90, h: 140 } : null;
    case 'beam': return { ...base, dx: 190, w: 380, h: 70 };
    case 'pull': return e.pt >= 12 ? { ...base, dx: 60, w: 120, h: 140 } : null;
    default: return null;
  }
}

/** Damage/hit reaction for bosses and echoes (poise instead of hitstun). */
export function bossOnHit(w: World, tgt: Entity, att: Entity, hit: Hitbox, dmg: number, dir: 1 | -1): void {
  const p = currentPattern(tgt);
  if (p?.type === 'reflect' && tgt.pphase === 1) {
    // The blow comes back at whoever threw it, as a real hit: it goes through the ordinary damage
    // path so a hero at low health is knocked out properly instead of being left standing at
    // negative HP, untargetable and unkillable.
    const owner = attackerOf(w, att);
    if (owner && owner.kind === 'hero' && owner.invuln <= 0) applyHit(w, tgt, { dx: 0, dy: 0, w: 0, h: 0, dmg: dmg * 0.5, hitstun: 12, kb: 2 }, owner);
    tgt.flash = 3;
    return;
  }
  const owner = attackerOf(w, att);
  // Active armor (e.g. The Null's Invert Phase) heavily mitigates damage but must still be able to
  // finish the boss off — chip damage that crosses zero has to go through the same death check below,
  // not return early, or the entity goes to negative HP without ever being marked dead.
  if (p?.type === 'armor' && tgt.pphase === 1) {
    tgt.flash = 3; tgt.hp -= dmg * 0.1;
    if (tgt.hp <= 0) bossDeath(w, tgt, owner);
    return;
  }
  const staggered = p?.type === 'armor' && tgt.pphase === 2;
  tgt.hp -= dmg * (staggered ? 2 : 1);
  tgt.flash = 6;
  tgt.hitstop = Math.max(tgt.hitstop, hit.launch ? 5 : 3);
  if (owner && owner.kind === 'hero') owner.hitstop = Math.max(owner.hitstop, hit.launch ? 5 : 3);
  tgt.hits++;
  const def = BOSS_DEFS[tgt.arch];
  const poise = tgt.kind === 'echo' ? 3 : def.poise;
  const interrupt = tgt.hits % poise === 0 || (hit.launch && tgt.pphase !== 1) || staggered;
  if (interrupt && tgt.state !== 'defeat') {
    if (tgt.pphase === 0 || tgt.pphase === 2 || tgt.pattern < 0 || staggered) { // cancel telegraphs / recovery
      tgt.pattern = -1; tgt.pphase = 0; tgt.pt = 0;
      setState(tgt, 'hurt'); tgt.aiT = staggered ? 30 : 20; tgt.vx = dir * 3;
    }
  }
  if (tgt.hp <= 0) bossDeath(w, tgt, owner);
}

export function bossDeath(w: World, tgt: Entity, owner: Entity | undefined): void {
  tgt.hp = 0; tgt.dead = true; tgt.pattern = -1;
  setState(tgt, 'defeat'); tgt.removeAt = w.tick + (tgt.kind === 'boss' ? 150 : 60);
  w.emit({ type: 'ko', x: tgt.x, y: tgt.y, id: tgt.id, a: tgt.kind === 'boss' ? 1 : 0 });
  w.onBossKilled(tgt, owner);
}

function choosePattern(w: World, e: Entity, target: Entity): number {
  const list = getPatterns(e);
  const adx = Math.abs(target.x - e.x);
  const inLane = Math.abs(target.y - e.y) <= LANE_TOL;
  const cands: number[] = [];
  const weights: number[] = [];
  list.forEach((p, i) => {
    if (i === e.pdata && list.length > 1) return; // don't repeat
    if (p.range && !(adx <= p.range && inLane)) return;
    if ((p.type === 'dash' || p.type === 'beam' || p.type === 'projectile') && !inLane) return;
    // splitting is the boss's trick, not its echoes' — an echo that split again would multiply
    // without end; summoning is the same story
    if ((p.type === 'split' || p.type === 'summon') && (e.kind === 'echo' || (p.type === 'split' && e.hp > e.maxHp * 0.6))) return;
    cands.push(i); weights.push(p.weight);
  });
  if (!cands.length) return -1;
  let r = w.rng.next() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < cands.length; i++) { r -= weights[i]; if (r <= 0) return cands[i]; }
  return cands[cands.length - 1];
}

export function stepBoss(w: World, e: Entity): void {
  if (e.hitstop > 0) { e.hitstop--; return; }
  if (e.flash > 0) e.flash--;
  if (e.invuln > 0) e.invuln--;
  if (e.cooldown > 0) e.cooldown--;
  if (e.slow > 0) e.slow--;
  const def = BOSS_DEFS[e.arch];
  const enrage = w.enraged ? 1.25 : 1;
  const spd = def.speed * enrage * (e.kind === 'echo' ? 1.1 : 1);
  if (e.streakT > 0) { e.streakT--; if (e.streakT === 0) e.hitStreak = 0; }
  if (e.stunCd > 0) e.stunCd--;
  if (e.state === 'defeat') { e.st++; return; }
  if (e.state === 'stunned') { if (e.st >= e.aiT) { setState(e, 'idle'); e.cooldown = 30; e.pattern = -1; } e.st++; clampBoss(w, e); return; }
  if (e.state === 'hurt') {
    e.x += e.vx; e.vx *= 0.85;
    if (e.st >= e.aiT) { setState(e, 'idle'); e.cooldown = 20; }
    e.st++; clampBoss(w, e); return;
  }
  const target = w.nearestHero(e);
  if (!target) { setState(e, 'idle'); e.st++; return; }
  const dx = target.x - e.x, dy = target.y - e.y;

  if (e.pattern >= 0) {
    runPattern(w, e, target, enrage);
    e.st++; clampBoss(w, e); return;
  }
  // approach / choose
  if (e.cooldown <= 0 && e.aiT <= 0) {
    const pi = choosePattern(w, e, target);
    if (pi >= 0) { beginPattern(w, e, pi, target); e.st++; return; }
    e.aiT = 12; // retry soon
  }
  if (e.aiT > 0) e.aiT--;
  e.facing = dx >= 0 ? 1 : -1;
  const want = 110 * (e.scale || 1);
  let mx = 0, my = 0;
  const bandMin = w.cameraX + VISIBLE_X0 + BOSS_EDGE, bandMax = w.cameraX + VISIBLE_X0 + VISIBLE_W - BOSS_EDGE;
  // still off screen (walking in from its spawn point, or pushed out): come into view first
  if (e.x > bandMax) mx = -1; else if (e.x < bandMin) mx = 1;
  else if (Math.abs(dx) > want) mx = Math.sign(dx); else if (Math.abs(dx) < want * 0.6) mx = -Math.sign(dx);
  if (Math.abs(dy) > 4) my = Math.sign(dy);
  e.x += mx * spd; e.y += my * spd * 0.6;
  setState(e, mx !== 0 || my !== 0 ? 'approach' : 'idle');
  e.st++;
  clampBoss(w, e);
}

function beginPattern(w: World, e: Entity, pi: number, target: Entity): void {
  const p = getPatterns(e)[pi];
  e.pattern = pi; e.pphase = 0; e.pt = 0; e.attackId++; e.hits = e.hits; e.pdata = pi;
  e.facing = target.x >= e.x ? 1 : -1;
  setState(e, p.row === 'special' ? 'special' : 'attack');
  const sc = e.scale || 1;
  // telegraph
  switch (p.type) {
    case 'melee': w.emit({ type: 'telegraph', shape: p.radius ? 'circle' : 'line', x: e.x + (p.radius ? 0 : e.facing * (p.range || 100) * 0.5), y: e.y, a: p.radius || (p.range || 100), b: p.tele, colour: p.colour, id: e.id }); break;
    case 'dash': case 'beam': case 'projectile': case 'pull':
      w.emit({ type: 'telegraph', shape: 'stripe', x: e.x, y: e.y, a: p.type === 'beam' ? 380 : 1100, b: p.tele, colour: p.colour, id: e.id }); break;
    case 'aoe': {
      const pts = aoePoints(w, e, p, target);
      e.pdata = pi;
      pts.forEach(([x, y]) => w.spawnHazard(e, 'blast', x, y, p.tele, p.active, { dx: 0, dy: 0, w: 0, h: 140, dmg: p.dmg, hitstun: p.hitstun, kb: p.kb, launch: p.launch, knockdown: p.knockdown, radius: (p.radius || 60) * sc }, p.colour));
      break;
    }
    case 'ring': w.emit({ type: 'telegraph', shape: 'circle', x: e.x, y: e.y, a: 60, b: p.tele, colour: p.colour, id: e.id }); break;
    case 'blink': w.emit({ type: 'telegraph', shape: 'circle', x: target.x - target.facing * 70, y: target.y, a: 70, b: p.tele, colour: p.colour, id: e.id }); break;
    case 'wall': w.emit({ type: 'telegraph', shape: 'circle', x: target.x + target.facing * 90, y: target.y, a: 50, b: p.tele, colour: p.colour, id: e.id }); break;
    case 'zone': case 'armor': case 'reflect': case 'split': case 'summon': case 'orbit':
      w.emit({ type: 'telegraph', shape: 'circle', x: e.x, y: e.y, a: (p.radius || 90) * sc, b: p.tele, colour: p.colour, id: e.id }); break;
  }
}

function aoePoints(w: World, e: Entity, p: Pattern, target: Entity): [number, number][] {
  const n = p.count || 3;
  const pts: [number, number][] = [];
  if (p.name === 'Coin Rain') {
    for (let i = 0; i < n; i++) pts.push([w.cameraX + VISIBLE_X0 + 40 + (i + 0.5) * ((VISIBLE_W - 80) / n) + w.rng.range(-30, 30), w.rng.range(10, LANE_H - 10)]);
  } else if (p.name === 'Rainbow Pillar' || p.name === 'Eruption') {
    for (let i = 0; i < n; i++) pts.push([target.x + (i - (n - 1) / 2) * 150 + w.rng.range(-20, 20), target.y]);
  } else {
    for (let i = 0; i < n; i++) { const t = w.heroes()[i % Math.max(1, w.heroes().length)] || target; pts.push([t.x + w.rng.range(-60, 60), t.y + w.rng.range(-20, 20)]); }
  }
  // every blast lands where the player can see it coming
  return pts.map(([x, y]) => [Math.max(w.cameraX + VISIBLE_X0 + 30, Math.min(w.cameraX + VISIBLE_X0 + VISIBLE_W - 30, x)), Math.max(0, Math.min(LANE_H, y))]);
}

function runPattern(w: World, e: Entity, target: Entity, enrage: number): void {
  const p = currentPattern(e)!;
  const sc = e.scale || 1;
  e.pt++;
  if (e.pphase === 0) {
    if (p.type === 'dash' || p.type === 'beam') { /* hold facing */ }
    if (e.pt >= p.tele) { e.pphase = 1; e.pt = 0; onActiveStart(w, e, p, target); }
    return;
  }
  if (e.pphase === 1) {
    switch (p.type) {
      case 'dash': {
        e.x += e.facing * (p.speed || 8) * enrage;
        if (e.x < w.cameraX + VISIBLE_X0 + BOSS_EDGE || e.x > w.cameraX + VISIBLE_X0 + VISIBLE_W - BOSS_EDGE) { e.facing = e.facing === 1 ? -1 : 1; }
        if (p.count && e.pt % Math.floor(p.active / p.count) === 0 && e.pt < p.active) { e.attackId++; w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id }); }
        break;
      }
      case 'blink': if (e.pt === 1) { e.invuln = 0; } break;
      case 'orbit': {
        // orbs are hazards following the boss; nothing to do here
        break;
      }
      case 'armor': e.armor = 2; break;
      case 'zone': e.slow = 0; break;
      case 'pull': {
        if (e.pt < 12) { // drag target toward the boss
          const t = w.nearestHero(e);
          if (t && t.invuln <= 0 && t.state !== 'dash') { t.x += Math.sign(e.x - t.x) * 14; t.y += Math.sign(e.y - t.y) * 2; }
        }
        break;
      }
    }
    if (e.pt >= p.active) { e.pphase = 2; e.pt = 0; if (p.type === 'armor') { setState(e, 'hurt'); e.aiT = p.recover; e.pattern = -1; e.cooldown = p.cooldown; w.emit({ type: 'bossPhase', x: e.x, y: e.y, id: e.id, a: 2 }); return; } }
    return;
  }
  if (e.pphase === 2) {
    if (e.pt >= p.recover) { e.pattern = -1; e.pphase = 0; e.pt = 0; e.cooldown = Math.round(p.cooldown / enrage); setState(e, 'idle'); }
  }
}

function onActiveStart(w: World, e: Entity, p: Pattern, target: Entity): void {
  const sc = e.scale || 1;
  const hit = (extra: Partial<Hitbox> = {}): Hitbox => ({ dx: 0, dy: 0, w: 30, h: 60, dmg: p.dmg, hitstun: p.hitstun, kb: p.kb, launch: p.launch, knockdown: p.knockdown, ...extra });
  switch (p.type) {
    case 'projectile': {
      const n = p.count || 1;
      for (let i = 0; i < n; i++) {
        const dy = n > 1 ? (i - (n - 1) / 2) * 22 : 0;
        w.spawnProjectile(e, p.name === 'Hook Throw' ? 'hook' : 'shard', e.x + e.facing * 40 * sc, e.y + dy, 60 * sc, e.facing * (p.speed || 8), hit({ w: 34, h: 50 }));
      }
      break;
    }
    case 'ring': w.spawnHazard(e, 'ring', e.x, e.y, 0, p.active, hit({ radius: 0, h: 22 }), p.colour, p.speed || 5); break;
    case 'summon': for (let i = 0; i < (p.count || 2); i++) w.spawnEnemy(p.arch || 'punk', i % 2 === 0 ? 'left' : 'right'); w.emit({ type: 'summon', x: e.x, y: e.y }); break;
    case 'orbit': for (let i = 0; i < (p.count || 4); i++) w.spawnHazard(e, 'orb', e.x, e.y, 0, p.active, hit({ radius: 22, h: 120 }), p.colour, (p.radius || 90) * sc, i / (p.count || 4)); break;
    case 'blink': { e.x = target.x - target.facing * 70; e.y = target.y; e.facing = target.facing; e.invuln = 4; w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id }); break; }
    case 'zone': w.spawnHazard(e, p.name === 'Lantern Fog' ? 'fog' : 'smoke', e.x, e.y, 0, p.active, hit({ radius: (p.radius || 200) * sc, h: 200, dmg: 1 }), p.colour); break;
    case 'wall': w.spawnHazard(e, 'wall', target.x + target.facing * 90, target.y, 0, p.active, hit({ w: 40, h: 140 }), p.colour); break;
    case 'split': for (let i = 0; i < (p.count || 2); i++) w.spawnEcho(e.arch, e.x + (i === 0 ? -90 : 90), e.y, 0.7, 0.12, i + 1); break;
    case 'reflect': w.emit({ type: 'bossPhase', x: e.x, y: e.y, id: e.id, a: 1 }); break;
    case 'armor': w.emit({ type: 'bossPhase', x: e.x, y: e.y, id: e.id, a: 3 }); break;
    case 'beam': w.emit({ type: 'shake', x: e.x, y: e.y, a: 6 }); break;
    case 'dash': w.emit({ type: 'dash', x: e.x, y: e.y, id: e.id }); break;
  }
}

/** True once the boss has walked into the visible band from its spawn point off the right edge. */
const bossInView = (w: World, e: Entity) => e.x >= w.cameraX + VISIBLE_X0 - 30 && e.x <= w.cameraX + VISIBLE_X0 + VISIBLE_W + 30;

export function clampBoss(w: World, e: Entity): void {
  // once on screen a boss stays on screen: no pattern starts from where the player cannot see it
  const tight = bossInView(w, e);
  const minX = tight ? w.cameraX + VISIBLE_X0 + BOSS_EDGE : w.cameraX + 40;
  const maxX = tight ? w.cameraX + VISIBLE_X0 + VISIBLE_W - BOSS_EDGE : w.cameraX + 920;
  if (e.x < minX) e.x = minX; if (e.x > maxX) e.x = maxX;
  if (e.y < 0) e.y = 0; if (e.y > LANE_H) e.y = LANE_H;
}

/** Hazards: blasts (telegraphed AoE), rings, orbs, fog/smoke zones, walls. */
export function stepHazard(w: World, e: Entity): void {
  e.st++;
  const owner = w.byId(e.owner);
  if (e.arch === 'blast') {
    if (e.pphase === 0 && e.st >= e.pt) { e.pphase = 1; e.ttl = e.aiT; w.emit({ type: 'hit', x: e.x, y: e.y, z: 20, a: 0, heavy: true, id: e.id }); w.emit({ type: 'shake', x: e.x, y: e.y, a: 4 }); }
    else if (e.pphase === 1 && --e.ttl <= 0) { e.dead = true; e.removeAt = w.tick + 1; }
    return;
  }
  if (e.arch === 'ring') {
    e.pphase = 1; e.scale = e.st * e.vx; // radius
    const hit = w.hazardHit(e.id); if (hit) { hit.radius = e.scale; }
    if (e.st >= e.aiT) { e.dead = true; e.removeAt = w.tick + 1; }
    return;
  }
  if (e.arch === 'orb') {
    e.pphase = 1;
    if (!owner || owner.dead) { e.dead = true; e.removeAt = w.tick + 1; return; }
    const ang = (e.st / 90) * Math.PI * 2 + e.vy * Math.PI * 2;
    e.x = owner.x + Math.cos(ang) * e.vx; e.y = owner.y + Math.sin(ang) * e.vx * 0.35; e.z = 40 + Math.sin(ang) * 10;
    if (e.st % 34 === 0) e.attackId++; // re-hit periodically (spaced out so mercy-invuln can't be perpetually skipped by 4 staggered orbs)
    if (e.st >= e.aiT) { e.dead = true; e.removeAt = w.tick + 1; }
    return;
  }
  if (e.arch === 'fog' || e.arch === 'smoke') {
    e.pphase = 0;
    const hit = w.hazardHit(e.id);
    for (const h of w.heroes()) if (hit && Math.hypot(h.x - e.x, (h.y - e.y) * 1.6) < hit.radius!) h.slow = 8;
    if (e.st >= e.aiT) { e.dead = true; e.removeAt = w.tick + 1; }
    return;
  }
  if (e.arch === 'wall') {
    e.pphase = 1;
    if (e.st % 30 === 0) e.attackId++;
    if (e.st >= e.aiT) { e.dead = true; e.removeAt = w.tick + 1; }
    return;
  }
}

export function stepProjectile(w: World, e: Entity): void {
  e.st++;
  e.pphase = 1;
  e.x += e.vx; e.y += e.vy; e.z += e.vz;
  if (e.arch === 'hook' && e.st > 24) { e.vx = -e.vx; e.arch = 'hook-return'; e.attackId++; }
  if (e.arch === 'hook-return' && e.st > 52) e.ttl = 0;
  if (e.z < 0) e.z = 0;
  if (e.arch === 'shard') e.vz -= GRAVITY * 0.1;
  if (--e.ttl <= 0 || e.x < w.cameraX - 80 || e.x > w.cameraX + 1040) { e.dead = true; e.removeAt = w.tick + 1; }
}
