// Tiny procedural chiptune sequencer — a bass + lead arpeggio pattern per level, generated from the
// level index rather than authored per-track, plus a faster/darker variant while fighting the boss.
// No audio files; shares the Synth's AudioContext so SFX and music mix through one master gain.
import { synth } from './synth';

const SCALES: number[][] = [
  [0, 2, 3, 5, 7, 8, 10], // natural minor-ish
  [0, 2, 4, 5, 7, 9, 11], // major-ish
  [0, 3, 5, 6, 7, 10], // blues-ish
];

function rootFreq(level: number): number {
  const roots = [220, 233.08, 246.94, 261.63, 220, 277.18, 246.94, 220, 233.08, 261.63];
  return roots[(level - 1) % roots.length];
}

function buildPattern(level: number, len: number, density: number): number[] {
  const scale = SCALES[level % SCALES.length];
  const out: number[] = [];
  let s = level * 7919 + 13;
  const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return (s / 0x7fffffff); };
  for (let i = 0; i < len; i++) out.push(rnd() < density ? scale[Math.floor(rnd() * scale.length)] : -1);
  return out;
}

export class Sequencer {
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private bass: number[] = [];
  private lead: number[] = [];
  private root = 220;
  private stepMs = 260;
  private bossMode = false;
  private currentLevel = 0;
  enabled = true;

  start(level: number): void {
    if (this.currentLevel === level && this.timer) return;
    this.stop();
    this.currentLevel = level;
    this.root = rootFreq(level);
    this.bass = buildPattern(level, 8, 0.85);
    this.lead = buildPattern(level + 31, 16, 0.45);
    this.stepMs = 230;
    this.step = 0;
    this.tick();
    this.timer = setInterval(() => this.tick(), this.stepMs);
  }
  setBossMode(active: boolean): void {
    if (this.bossMode === active) return;
    this.bossMode = active;
    if (!this.timer) return;
    this.stepMs = active ? 165 : 230;
    clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), this.stepMs);
  }
  stop(): void { if (this.timer) { clearInterval(this.timer); this.timer = null; } this.currentLevel = 0; }

  private tick(): void {
    if (!this.enabled) { this.step++; return; }
    const ctx = synth.ensure();
    if (!ctx || synth.muted) { this.step++; return; }
    const gain = (ctx as any)._nephoMaster || (() => { const g = ctx.createGain(); g.gain.value = 0.22; g.connect(ctx.destination); (ctx as any)._nephoMaster = g; return g; })();
    const bassDeg = this.bass[this.step % this.bass.length];
    if (bassDeg >= 0) this.pluck(ctx, gain, this.root * semis(bassDeg - 12), 0.16, this.bossMode ? 'sawtooth' : 'triangle', this.bossMode ? 0.16 : 0.12);
    const leadDeg = this.lead[this.step % this.lead.length];
    if (leadDeg >= 0 && this.step % 2 === 0) this.pluck(ctx, gain, this.root * semis(leadDeg), 0.11, 'square', this.bossMode ? 0.09 : 0.06);
    if (this.bossMode && this.step % 4 === 0) this.pluck(ctx, gain, this.root * semis(-24), 0.1, 'square', 0.08);
    this.step++;
  }
  private pluck(ctx: AudioContext, dest: GainNode, freq: number, dur: number, type: OscillatorType, level: number): void {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(level, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g); g.connect(dest);
    osc.start(); osc.stop(ctx.currentTime + dur + 0.02);
  }
}

const semis = (n: number) => Math.pow(2, n / 12);

export const sequencer = new Sequencer();
