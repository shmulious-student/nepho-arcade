// Procedural Web Audio SFX — no audio files. One shared AudioContext, unlocked on first user gesture
// (required by every mobile browser). Each hit/special/ko/ui sound is a short envelope over an
// oscillator or filtered noise burst, kept cheap enough to fire many times a second in combat.
export class Synth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private unlocked = false;
  muted = false;

  ensure(): AudioContext | null {
    if (this.unlocked) return this.ctx;
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.5;
    this.master.connect(this.ctx.destination);
    this.unlocked = true;
    return this.ctx;
  }
  /** Call from a real user gesture (tap/click) — resumes a suspended context on iOS/Safari. */
  unlock(): void {
    const ctx = this.ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  }
  setMuted(m: boolean): void { this.muted = m; if (this.master) this.master.gain.value = m ? 0 : 0.5; }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, glideTo?: number): void {
    const ctx = this.ctx; if (!ctx || !this.master || this.muted) return;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (glideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, glideTo), ctx.currentTime + dur);
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(g); g.connect(this.master);
    osc.start(); osc.stop(ctx.currentTime + dur + 0.02);
  }
  private noise(dur: number, gain: number, filterFreq: number): void {
    const ctx = this.ctx; if (!ctx || !this.master || this.muted) return;
    const n = ctx.sampleRate * dur;
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(); src.buffer = buf;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = filterFreq;
    const g = ctx.createGain(); g.gain.setValueAtTime(gain, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    src.connect(filt); filt.connect(g); g.connect(this.master);
    src.start(); src.stop(ctx.currentTime + dur + 0.02);
  }

  hitLight(): void { this.tone(320, 0.08, 'square', 0.18, 140); this.noise(0.05, 0.12, 2400); }
  hitHeavy(): void { this.tone(160, 0.16, 'sawtooth', 0.22, 60); this.noise(0.1, 0.2, 1200); }
  block(): void { this.tone(500, 0.05, 'square', 0.14, 480); }
  dash(): void { this.tone(700, 0.08, 'sine', 0.12, 1100); }
  launch(): void { this.tone(220, 0.22, 'sawtooth', 0.18, 640); }
  special(heroIdx = 0): void {
    const base = [220, 246, 262, 294][heroIdx % 4];
    this.tone(base, 0.35, 'sawtooth', 0.22, base * 2.4);
    this.noise(0.3, 0.14, 3000);
  }
  ko(): void { this.tone(180, 0.4, 'square', 0.24, 40); this.noise(0.3, 0.18, 900); }
  bossPhase(): void { this.tone(90, 0.6, 'sawtooth', 0.28, 260); }
  heal(): void { this.tone(440, 0.15, 'sine', 0.14, 660); this.tone(660, 0.18, 'sine', 0.1, 880); }
  uiClick(): void { this.tone(600, 0.05, 'square', 0.1, 900); }
  uiConfirm(): void { this.tone(500, 0.06, 'square', 0.12, 760); this.tone(760, 0.08, 'square', 0.08, 1000); }
  victory(): void {
    const notes = [392, 494, 587, 784];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.3, 'square', 0.16), i * 110));
  }
  gameOver(): void {
    const notes = [220, 196, 175, 147];
    notes.forEach((f, i) => setTimeout(() => this.tone(f, 0.4, 'sawtooth', 0.16), i * 140));
  }
}

export const synth = new Synth();
