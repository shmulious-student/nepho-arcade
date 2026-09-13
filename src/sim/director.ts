// Wave director: spawns waves, scrolls between segments, brings in the boss and rubber-bands pacing
// toward the 3-minute level target.
import { levelDef, ENTRY_TICKS, CLEAR_TICKS, levelWidth, segmentX, type WaveDef } from './levels';
import { VIEW_W, LANE_H } from './types';
import type { World } from './world';

export interface DirectorState {
  waveIndex: number; // 0-based, -1 before the first wave
  waveTick: number;
  phaseTick: number;
  levelTick: number;
  queue: { arch: string; side: 'left' | 'right'; at: number }[];
  goTarget: number;
  plannedTicks: number; // cumulative planned ticks at the end of the current wave
  hpMod: number; // rubber-band hp modifier for the next wave
  bonusUsed: boolean;
  skipOptional: boolean;
  bossTick: number;
}

export function makeDirector(): DirectorState {
  return { waveIndex: -1, waveTick: 0, phaseTick: 0, levelTick: 0, queue: [], goTarget: 0, plannedTicks: 0, hpMod: 1, bonusUsed: false, skipOptional: false, bossTick: 0 };
}

function queueWave(w: World, d: DirectorState, wave: WaveDef): void {
  const mul = w.playerCount() > 1 ? 1.5 : 1;
  let i = 0;
  const list: string[] = [];
  for (const s of wave.spawns) for (let k = 0; k < Math.ceil(s.n * mul); k++) list.push(s.arch);
  // interleave archetypes so the wave feels mixed
  // Spawns trickle in, mostly from the front, with a beat between them: the wave builds up rather
  // than storming the players the moment it starts.
  for (const arch of shuffle(w, list)) {
    d.queue.push({ arch, side: i % 3 === 2 ? 'left' : 'right', at: w.tick + 45 + i * 70 });
    i++;
  }
}

function shuffle(w: World, arr: string[]): string[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = w.rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function startWave(w: World, d: DirectorState, index: number): void {
  const level = levelDef(w.level);
  d.waveIndex = index;
  d.waveTick = 0;
  d.queue = [];
  d.plannedTicks += level.waves[index].budget * 60;
  queueWave(w, d, level.waves[index]);
  w.cameraX = segmentX(level, index);
  w.setPhase('wave');
  w.emit({ type: 'levelPhase', x: 0, y: 0, a: index + 1 });
}

export function stepDirector(w: World, d: DirectorState): void {
  d.levelTick++;
  d.phaseTick++;
  const level = levelDef(w.level);
  switch (w.phase) {
    case 'entry':
      if (d.phaseTick >= ENTRY_TICKS) startWave(w, d, 0);
      break;
    case 'wave': {
      d.waveTick++;
      // release queued spawns
      while (d.queue.length && d.queue[0].at <= w.tick) {
        const s = d.queue.shift()!;
        const e = w.spawnEnemy(s.arch, s.side);
        e.hp = e.maxHp = Math.round(e.maxHp * d.hpMod);
      }
      const living = w.livingEnemies();
      const budget = level.waves[d.waveIndex].budget * 60;
      const overBudget = d.waveTick > budget * 1.4 && living <= 2;
      if (d.queue.length === 0 && (living === 0 || overBudget)) {
        // rubber band against the plan
        const drift = (d.levelTick - d.plannedTicks) / Math.max(1, d.plannedTicks);
        d.hpMod = drift > 0.25 ? 0.85 : 1;
        const lastWave = d.waveIndex >= level.waves.length - 1;
        if (lastWave) {
          if (drift < -0.2 && !d.bonusUsed) { // players are fast: bonus mini-wave
            d.bonusUsed = true;
            d.plannedTicks += level.bonusWave.budget * 60;
            queueWave(w, d, level.bonusWave);
            w.emit({ type: 'levelPhase', x: 0, y: 0, a: 99 });
          } else {
            beginGo(w, d, levelWidth(level) - VIEW_W, true);
          }
        } else {
          beginGo(w, d, segmentX(level, d.waveIndex + 1), false);
        }
      }
      break;
    }
    case 'go': {
      const lead = Math.max(...w.heroes().map((h) => h.x), w.cameraX);
      let cam = Math.max(w.cameraX, Math.min(d.goTarget, lead - 420));
      if (d.phaseTick > 360) cam = Math.min(d.goTarget, w.cameraX + 3); // auto-scroll if players stall
      w.cameraX = cam;
      if (w.cameraX >= d.goTarget - 0.5) {
        w.cameraX = d.goTarget;
        if (d.goTarget >= levelWidth(level) - VIEW_W && d.waveIndex >= level.waves.length - 1) beginBoss(w, d);
        else startWave(w, d, d.waveIndex + 1);
      }
      break;
    }
    case 'boss': {
      d.bossTick++;
      // Use the sticky flag, not w.boss() — the defeated boss entity is itself removed from
      // `entities` a few seconds after death, at which point a live lookup would go missing forever.
      if (w.bossDefeated && d.phaseTick > 60 && w.livingEnemies() === 0 && w.entities.every((e) => e.kind !== 'echo' || e.dead)) {
        w.setPhase('clear');
        for (const h of w.heroes()) { h.hp = Math.min(h.maxHp, h.hp + h.maxHp * 0.35); w.emit({ type: 'heal', x: h.x, y: h.y, id: h.id }); }
      }
      break;
    }
    case 'clear':
      if (d.phaseTick >= CLEAR_TICKS) w.completeLevel();
      break;
  }
}

function beginGo(w: World, d: DirectorState, target: number, toBoss: boolean): void {
  d.goTarget = target;
  w.setPhase('go');
  w.emit({ type: 'levelPhase', x: 0, y: 0, a: toBoss ? 50 : 10 + d.waveIndex });
  if (target <= w.cameraX + 0.5) { // nothing to scroll (level 10 short path)
    if (toBoss) beginBoss(w, d); else startWave(w, d, d.waveIndex + 1);
  }
}

export function beginBoss(w: World, d: DirectorState): void {
  d.bossTick = 0;
  w.setPhase('boss');
  // Top up heroes before the fight — after three waves of attrition a player can be down to single-digit
  // HP, which combined with an immediate boss attack would be an unavoidable, unfair KO.
  for (const h of w.heroes()) {
    if (h.hp < h.maxHp * 0.55) { h.hp = Math.round(h.maxHp * 0.55); w.emit({ type: 'heal', x: h.x, y: h.y, id: h.id }); }
  }
  w.spawnBoss(levelDef(w.level).boss, w.cameraX + VIEW_W - 120, LANE_H * 0.5);
  w.emit({ type: 'levelPhase', x: 0, y: 0, a: 100 });
}
