// Minimal, anonymous runtime analytics: one Firestore document per play session (project
// nepho-eviomri, collection `sessions`), written straight to the Firestore REST API — no SDK. The
// document carries who (a random id the browser keeps, never a name), what device, and a short
// list of notable moments (`events`, compact strings) plus counters; it is re-written whole every
// few seconds while anything changed and once more when the tab goes to the background or closes.
// `tools/analytics-report.mjs` turns the collection into the report. Off on the dev server unless
// the page is opened with ?analytics=1; off for good with ?noanalytics (remembered).
import pkg from '../../package.json';

const PROJECT = 'nepho-eviomri';
const API_KEY = 'AIzaSyB43xwBxO7JLpoJ8ZHFPrqpYNmksgeFSuk'; // the web app's public key; rules do the guarding
const DOCS = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/sessions/`;
const MAX_EVENTS = 400; // the rules cap the array; typical sessions log a few dozen
const FLUSH_MS = 12000;

export type Props = Record<string, string | number | boolean | null | undefined>;

function rnd(n: number): string {
  const a = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < n; i++) s += a[Math.floor(Math.random() * a.length)];
  return s;
}
function stored(key: string): string | null { try { return localStorage.getItem(key); } catch { return null; } }
function store(key: string, v: string): void { try { localStorage.setItem(key, v); } catch { /* private mode */ } }

function platform(): Record<string, string | number | boolean> {
  const ua = navigator.userAgent;
  const os = /Android/.test(ua) ? 'android' : /iPhone|iPad|iPod/.test(ua) ? 'ios' : /Mac/.test(ua) ? 'mac' : /Windows/.test(ua) ? 'windows' : /Linux|CrOS/.test(ua) ? 'linux' : 'other';
  const app = !!(window as any).Capacitor?.isNativePlatform?.() || /; wv\)/.test(ua) ? 'apk' : 'web';
  let touch = false;
  try { touch = navigator.maxTouchPoints > 0 || matchMedia('(pointer: coarse)').matches; } catch { /* old browser */ }
  return { os, app, touch, lang: navigator.language || '', w: screen.width || 0, h: screen.height || 0, ua: ua.slice(0, 160) };
}

// Firestore's typed JSON
type FsValue = { stringValue: string } | { integerValue: string } | { doubleValue: number } | { booleanValue: boolean } | { nullValue: null } | { arrayValue: { values: FsValue[] } } | { mapValue: { fields: Record<string, FsValue> } };
function enc(v: unknown): FsValue {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'string') return { stringValue: v };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(enc) } };
  const fields: Record<string, FsValue> = {};
  for (const [k, x] of Object.entries(v as Record<string, unknown>)) fields[k] = enc(x);
  return { mapValue: { fields } };
}

class Analytics {
  readonly enabled: boolean;
  readonly uid: string;
  readonly sid = rnd(20);
  private t0 = Date.now();
  private events: string[] = [];
  private counts: Record<string, number> = {};
  private dropped = 0;
  private dirty = false;
  private inflight = false;
  private timer: number | null = null;
  private plat = platform();
  private visits: number;

  constructor() {
    const q = location.search;
    if (q.includes('noanalytics')) store('nepho.analytics', 'off');
    const optedOut = stored('nepho.analytics') === 'off';
    this.enabled = !optedOut && (!import.meta.env.DEV || q.includes('analytics=1'));
    let uid = stored('nepho.uid');
    if (!uid) { uid = rnd(12); store('nepho.uid', uid); store('nepho.firstSeen', new Date().toISOString()); }
    this.uid = uid;
    this.visits = (Number(stored('nepho.visits')) || 0) + 1;
    store('nepho.visits', String(this.visits));
    if (!this.enabled) return;
    window.addEventListener('error', (e) => { this.track('error', { msg: String(e.message).slice(0, 200), at: `${(e.filename || '').split('/').pop()}:${e.lineno}` }); this.flush(); });
    window.addEventListener('unhandledrejection', (e) => { this.track('error', { msg: String((e as PromiseRejectionEvent).reason?.message ?? (e as PromiseRejectionEvent).reason).slice(0, 200), at: 'promise' }); this.flush(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') { this.track('bg'); this.flush(true); } else this.track('fg'); });
    window.addEventListener('pagehide', () => { this.track('end'); this.flush(true); });
    this.timer = window.setInterval(() => { if (this.dirty) this.flush(); }, FLUSH_MS);
  }

  /** Seconds since the session began. */
  get t(): number { return Math.round((Date.now() - this.t0) / 100) / 10; }

  /** Records a moment. Props are flattened into the event string: `12.3|level_result|level=2;win=1`. */
  track(name: string, props?: Props): void {
    if (!this.enabled) return;
    this.counts[name] = (this.counts[name] || 0) + 1;
    const clean = (s: unknown) => String(s ?? '').replace(/[|;=\n]/g, ' ').slice(0, 80);
    const p = props ? Object.entries(props).filter(([, v]) => v !== undefined && v !== null).map(([k, v]) => `${k}=${typeof v === 'number' ? Math.round(v * 10) / 10 : clean(v)}`).join(';') : '';
    if (this.events.length >= MAX_EVENTS) { this.dropped++; this.dirty = true; return; }
    this.events.push(`${this.t}|${name}${p ? `|${p}` : ''}`);
    this.dirty = true;
    if (this.events.length % 25 === 0) this.flush();
  }

  private doc(): unknown {
    return {
      uid: this.uid, sid: this.sid, v: pkg.version, dev: import.meta.env.DEV, t0: new Date(this.t0).toISOString(), dur: this.t, visits: this.visits,
      plat: this.plat, events: this.events, n: this.events.length + this.dropped, dropped: this.dropped, counts: this.counts,
    };
  }

  /** Writes the whole session document; `final` uses a keepalive request that survives the page. */
  flush(final = false): void {
    if (!this.enabled || !this.dirty || (this.inflight && !final)) return;
    this.dirty = false; this.inflight = true;
    const body = JSON.stringify({ fields: (enc(this.doc()) as { mapValue: { fields: Record<string, FsValue> } }).mapValue.fields });
    fetch(`${DOCS}${this.sid}?key=${API_KEY}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body, keepalive: final })
      .catch(() => { this.dirty = true; })
      .finally(() => { this.inflight = false; });
  }
}

export const analytics = new Analytics();
