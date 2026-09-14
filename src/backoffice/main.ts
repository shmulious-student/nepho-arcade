// Roster backoffice (/backoffice.html on the dev server): every character in the runtime pack,
// animated from its real atlas, with the knobs the roster exposes — takes part or not, display
// name, and the levels it belongs to. Saving writes public/game/roster.json through the dev-server
// endpoint in vite.config.ts; the game reads that file at boot (src/sim/roster.ts).
//
// The pack is ~25 MB of atlases, so nothing is loaded or drawn until it is needed: one rank (tab)
// is mounted at a time, a card fetches its atlas only once it scrolls near the viewport, and only
// on-screen cards animate — each redrawing just when its idle frame actually changes.
import { loadCatalog, assetUrl, type Catalog, type CharacterEntry } from '../shared/catalog';
import { defaultRoster, normalizeRoster, composeLevels, loadRoster, readyRoster, LEVEL_COUNT, type Roster, type Rank, type Readiness } from '../sim/roster';
import { LEVELS } from '../sim/levels';

const $ = <T extends HTMLElement>(sel: string) => document.querySelector(sel) as T;
const SAVE_URL = '/__backoffice/roster';
const RANKS: Rank[] = ['hero', 'enemy', 'boss'];
type Tab = Rank | 'campaign';

let catalog: Catalog;
let roster: Roster;
let saved = '';
let tab: Tab = 'hero';
// readiness against the art standard, from the dev server (tools/readiness.mjs); null until it lands
interface ReadyInfo { status: 'ready' | 'failed' | 'legacy'; rank: Rank; present: number; need: number; fails: string[]; missing: string[]; files?: string[]; prompt: string; summary: string; variantOf?: string }
let ready: Record<string, ReadyInfo> | null = null;
let readyPending = false;
const cards: Record<string, { root: HTMLElement; refresh: () => void }> = {};

// ---------- lazy atlas loading ----------
interface Loaded { def: CharacterEntry; json: { frames: Record<string, { frame: { x: number; y: number; w: number; h: number }; spriteSourceSize: { x: number; y: number } }> }; img: HTMLImageElement }
const loads = new Map<string, Promise<Loaded>>();
function loadChar(def: CharacterEntry): Promise<Loaded> {
  let p = loads.get(def.id);
  if (!p) {
    p = Promise.all([
      fetch(assetUrl(def.data)).then((r) => r.json()),
      new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = assetUrl(def.atlas); }),
    ]).then(([json, img]) => ({ def, json, img }));
    loads.set(def.id, p);
  }
  return p;
}

// ---------- idle player: visible cards only, redraw on frame change only ----------
interface Player { cv: HTMLCanvasElement; def: CharacterEntry; loaded?: Loaded; last: number; row: string; cycle: boolean; setRow: (row: string) => void; draw: (t: number) => void }
const visible = new Set<Player>();
const FRAME_MS = 110;
const CYCLE_LOOPS = 2; // loops of a row before "play all" moves to the next

function makePlayer(def: CharacterEntry, cv: HTMLCanvasElement): Player {
  const rs = def.renderScale ?? 1;
  const W = Math.ceil(def.box.w * rs), H = Math.ceil(def.box.h * rs);
  const pad = 8;
  cv.width = W + pad * 2; cv.height = H + pad * 2;
  const ctx = cv.getContext('2d')!; ctx.imageSmoothingEnabled = false;
  const framesIn = (row: string) => def.frameCounts?.[row] ?? def.framesPerRow;
  let t0 = 0; // the row's start, so every row plays from its first frame
  const p: Player = { cv, def, last: -1, row: 'idle', cycle: false,
    setRow(row) { p.row = row; p.last = -1; t0 = performance.now(); },
    draw(t) {
      if (!p.loaded) return;
      const n = framesIn(p.row);
      const step = Math.floor((t - t0) / FRAME_MS);
      if (p.cycle && step >= n * CYCLE_LOOPS) { // play all: on to the next row
        const rows = def.rows; p.setRow(rows[(rows.indexOf(p.row) + 1) % rows.length]); p.cv.dispatchEvent(new Event('row'));
        return;
      }
      const frame = step % n;
      if (frame === p.last) return;
      p.last = frame;
      const fr = p.loaded.json.frames[`${p.row}/${frame}`];
    ctx.clearRect(0, 0, cv.width, cv.height);
    const ay = pad + def.anchor.y * rs;
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.beginPath(); ctx.ellipse(pad + def.anchor.x * rs, ay, W * 0.22, 6, 0, 0, Math.PI * 2); ctx.fill();
    if (fr) ctx.drawImage(p.loaded.img, fr.frame.x, fr.frame.y, fr.frame.w, fr.frame.h, pad + fr.spriteSourceSize.x * rs, pad + fr.spriteSourceSize.y * rs, fr.frame.w * rs, fr.frame.h * rs);
  } };
  return p;
}

// a card fetches its atlas when it comes within a screen of the viewport, and animates only while on screen
const watcher = new IntersectionObserver((entries) => {
  for (const e of entries) {
    const p = (e.target as any).__player as Player | undefined;
    if (!p) continue;
    if (e.isIntersecting) {
      if (!p.loaded) { p.cv.classList.add('loading'); loadChar(p.def).then((l) => { p.loaded = l; p.last = -1; p.cv.classList.remove('loading'); }).catch(() => p.cv.classList.add('failed')); }
      visible.add(p);
    } else visible.delete(p);
  }
}, { rootMargin: '400px 0px' });

requestAnimationFrame(function loop(t) { for (const p of visible) p.draw(t); requestAnimationFrame(loop); });

// ---------- cards ----------
const bossHolding = (level: number, except: string) => Object.entries(roster.characters).find(([id, e]) => id !== except && e.rank === 'boss' && e.enabled && e.levels.includes(level))?.[0];

function formatBadge(def: CharacterEntry): string {
  if (def.variantOf) return `<span class="badge variant">variant of ${def.variantOf}</span>`;
  const rows = def.rows.length;
  const fmt = def.sourceFormat === 'actions' ? `${rows}-action set` : def.sourceFormat === 'pair' ? `${rows}-row grid pair` : 'legacy grid';
  return `<span class="badge note">${fmt}</span>`;
}

function makeCard(def: CharacterEntry): HTMLElement {
  const id = def.id;
  const entry = roster.characters[id];
  const root = document.createElement('div'); root.className = 'card';
  const cv = document.createElement('canvas');
  const player = makePlayer(def, cv);
  (cv as any).__player = player;
  watcher.observe(cv);
  // action picker: any row of the atlas, or every row in turn
  const actions = document.createElement('div'); actions.className = 'actions';
  const sel = document.createElement('select');
  for (const row of def.rows) { const o = document.createElement('option'); o.value = row; o.textContent = `${row} · ${def.frameCounts?.[row] ?? def.framesPerRow}f`; sel.append(o); }
  sel.onchange = () => { player.cycle = false; all.classList.remove('on'); player.setRow(sel.value); };
  const all = document.createElement('button'); all.textContent = '▶ all'; all.title = 'play every action in turn';
  all.onclick = () => { player.cycle = !player.cycle; all.classList.toggle('on', player.cycle); player.setRow(player.cycle ? def.rows[0] : sel.value); };
  cv.addEventListener('row', () => { sel.value = player.row; });
  actions.append(sel, all);
  const head = document.createElement('div'); head.className = 'head';
  head.innerHTML = `<span class="id" title="${id}">${id}</span><span class="badges"><span class="badge ${entry.rank}">${entry.rank}</span>${formatBadge(def)}</span>`;
  // standing against the art standard: ready / failed (with the gate's list) / legacy (needs a set)
  const status = document.createElement('div'); status.className = 'status';
  const toggle = document.createElement('label'); toggle.className = 'toggle';
  const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = entry.enabled;
  toggle.append(cb, document.createTextNode(entry.rank === 'hero' ? 'in the lobby' : entry.rank === 'boss' ? 'can guard a level' : 'can spawn'));
  const name = document.createElement('input'); name.className = 'name'; name.value = entry.name; name.placeholder = 'display name'; name.maxLength = 24;
  const levels = document.createElement('div'); levels.className = 'levels';
  const hint = document.createElement('div'); hint.className = 'hint';
  const lvBtns: HTMLButtonElement[] = [];
  if (entry.rank !== 'hero') {
    for (let n = 1; n <= LEVEL_COUNT; n++) {
      const b = document.createElement('button'); b.textContent = String(n); b.title = `level ${n} — ${LEVELS[n - 1].id}`;
      b.onclick = () => {
        if (entry.rank === 'boss') {
          // one boss per level, but a boss may guard several: taking a level takes it from whoever
          // held it; clearing a level hands it back to its default boss (what the sim does anyway)
          const was = entry.levels.includes(n);
          entry.levels = was ? entry.levels.filter((l) => l !== n) : [...entry.levels, n].sort((a, b) => a - b);
          if (!was) { const holder = bossHolding(n, id); if (holder) roster.characters[holder].levels = roster.characters[holder].levels.filter((l) => l !== n); }
          if (was && !bossHolding(n, id)) { const base = roster.characters[LEVELS[n - 1].boss]; if (base?.enabled && base !== entry && !base.levels.includes(n)) base.levels = [...base.levels, n].sort((a, b) => a - b); }
        } else {
          entry.levels = entry.levels.includes(n) ? entry.levels.filter((l) => l !== n) : [...entry.levels, n].sort((a, b) => a - b);
        }
        changed();
      };
      levels.append(b); lvBtns.push(b);
    }
    hint.textContent = entry.rank === 'boss' ? 'the levels this boss ends — several means it is reused' : 'levels whose waves may include it';
  } else {
    hint.textContent = 'heroes have no level — they are picked in the lobby';
  }
  cb.onchange = () => { entry.enabled = cb.checked; changed(); };
  name.oninput = () => { entry.name = name.value; changed(); };
  root.append(cv, actions, head, status, toggle, name, levels, hint);
  const refresh = () => {
    root.classList.toggle('out', !entry.enabled || (entry.rank !== 'hero' && entry.levels.length === 0));
    const r = ready?.[id];
    root.dataset.ready = r ? r.status : readyPending ? 'checking' : 'unknown';
    if (!r) status.innerHTML = readyPending ? '<span class="pill checking">checking…</span>' : '<span class="pill unknown">readiness unknown</span>';
    else if (r.status === 'ready') status.innerHTML = `<span class="pill ready">READY</span> <span class="why">${r.summary}</span>`;
    else if (r.status === 'legacy') status.innerHTML = `<span class="pill legacy">LEGACY</span> <span class="why">${r.summary} · <code>${r.prompt}</code></span>`;
    else status.innerHTML = `<span class="pill failed">FAILED</span> <span class="why">${r.summary}</span><details><summary>${r.fails.length} gate failure(s)</summary><ul>${r.fails.map((f) => `<li>${f}</li>`).join('')}</ul></details>`;
    if (entry.rank === 'boss' && entry.levels.length > 1) status.innerHTML += ` <span class="pill reuse">reused ×${entry.levels.length}</span>`;
    cb.checked = entry.enabled; if (document.activeElement !== name) name.value = entry.name;
    lvBtns.forEach((b, i) => {
      const n = i + 1;
      b.classList.toggle('on', entry.levels.includes(n));
      b.classList.toggle('taken', entry.rank === 'boss' && !entry.levels.includes(n) && !!bossHolding(n, id));
    });
  };
  cards[id] = { root, refresh };
  refresh();
  return root;
}

// ---------- campaign board ----------
function renderBoard() {
  const warnings: string[] = [];
  const levels = composeLevels(roster, warnings);
  const board = $('#board'); board.innerHTML = '';
  for (const l of levels) {
    const meta = catalog.levels.find((m: { id: string }) => m.id === l.id) ?? catalog.levels[l.index - 1];
    const bossName = roster.characters[l.boss]?.name ?? l.boss;
    const portrait = catalog.bosses.find((b) => b.id === l.boss)?.portrait;
    const el = document.createElement('div'); el.className = 'lvl';
    const waves = l.waves.map((w, i) => `<div class="wave">w${i + 1}: ${w.spawns.map((s) => `<span class="${ready?.[s.arch]?.status ?? ''}">${roster.characters[s.arch]?.name ?? s.arch}</span>×${s.n}`).join(', ')}</div>`).join('');
    const alsoOn = levels.filter((o) => o.boss === l.boss && o.index !== l.index).map((o) => o.index);
    const reuse = alsoOn.length ? `<span class="pill reuse" title="also ends levels ${alsoOn.join(', ')}">also L${alsoOn.join(', L')}</span>` : '';
    const bossState = ready?.[l.boss] ? `<span class="pill ${ready[l.boss].status}">${ready[l.boss].status}</span>` : '';
    el.innerHTML = `<b>${l.index}. ${meta?.name ?? l.id}</b><div class="boss">${portrait ? `<img src="${assetUrl(portrait)}" alt="" loading="lazy">` : ''}<span>${bossName}</span>${bossState}${reuse}</div>${waves}`;
    board.append(el);
  }
  // heroes: fewer than two enabled means the lobby keeps them all
  const heroesOn = Object.values(roster.characters).filter((e) => e.rank === 'hero' && e.enabled).length;
  if (heroesOn < 2) warnings.push(`only ${heroesOn} hero(es) enabled — the lobby needs at least two, so all heroes stay in`);
  $('#warnings').textContent = warnings.join('\n');
  $<HTMLTextAreaElement>('#raw').value = JSON.stringify(roster, null, 1);
}

// ---------- tabs: one rank mounted at a time ----------
function mountTab() {
  visible.clear();
  watcher.disconnect();
  for (const id of Object.keys(cards)) delete cards[id];
  const grid = $('#grid'); grid.innerHTML = '';
  grid.hidden = tab === 'campaign';
  $('#campaign').hidden = tab !== 'campaign';
  document.querySelectorAll<HTMLButtonElement>('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  if (tab === 'campaign') return;
  for (const d of Object.values(catalog.characters)) if (roster.characters[d.id]?.rank === tab) grid.append(makeCard(d));
}

// ---------- state ----------
function changed() {
  for (const c of Object.values(cards)) c.refresh();
  for (const rank of RANKS) {
    const all = Object.entries(roster.characters).filter(([, e]) => e.rank === rank);
    const on = all.filter(([, e]) => e.enabled).length;
    const rd = ready ? all.filter(([id]) => ready![id]?.status === 'ready').length : null;
    $(`#c-${rank}`).textContent = `${on}/${all.length} in` + (rd === null ? '' : ` · ${rd} ready`);
  }
  const summary = $('#readiness');
  if (!ready) summary.textContent = readyPending ? 'checking every set against the art standard (first pass takes about a minute)…' : '';
  else {
    const all = Object.entries(ready).filter(([, r]) => !r.variantOf);
    const n = (st: string) => all.filter(([, r]) => r.status === st).length;
    summary.innerHTML = `<span class="pill ready">${n('ready')} ready</span> <span class="pill failed">${n('failed')} failed</span> <span class="pill legacy">${n('legacy')} legacy</span>` + (readyPending ? ' <span class="pill checking">re-checking changed sets…</span>' : '');
  }
  renderBoard();
  const dirty = JSON.stringify(roster) !== saved;
  $<HTMLButtonElement>('#save').disabled = !dirty;
  setStatus(dirty ? 'unsaved changes' : 'saved', '');
}
function setStatus(text: string, cls: string) { const s = $('#status'); s.textContent = text; s.className = cls; }

async function save() {
  roster = normalizeRoster(roster); // trims names, drops anything the sim would ignore
  const body = JSON.stringify(roster, null, 1);
  try {
    const res = await fetch(SAVE_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
    if (!res.ok) throw new Error(await res.text());
    saved = JSON.stringify(roster);
    mountTab(); changed(); // the cards hold the old entry objects
    setStatus('saved to public/game/roster.json', 'ok');
  } catch (err) {
    setStatus(`save failed — dev server only (${(err as Error).message.slice(0, 60)})`, 'err');
  }
}

/** Polls the dev server's readiness endpoint until the pass is complete, refreshing cards as it lands. */
async function pollReadiness() {
  try {
    const res = await fetch('/__backoffice/readiness', { cache: 'no-store' });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as { pending: boolean; result: { characters: Record<string, ReadyInfo>; error?: string } | null };
    readyPending = data.pending;
    if (data.result && !data.result.error) ready = data.result.characters;
    changed();
    if (data.pending) setTimeout(pollReadiness, 3000);
  } catch (err) {
    readyPending = false; changed();
    setStatus(`readiness unavailable — dev server only (${(err as Error).message.slice(0, 50)})`, 'err');
  }
}

async function main() {
  catalog = await loadCatalog();
  roster = await loadRoster();
  saved = JSON.stringify(roster);
  $('#save').onclick = save;
  $('#reset').onclick = () => { roster = defaultRoster(); mountTab(); changed(); };
  $('#auto').onclick = () => {
    if (!ready) return;
    roster = readyRoster(ready as Readiness, roster);
    mountTab(); changed();
    setStatus('roster set to ready characters only — save to apply', '');
  };
  readyPending = true; void pollReadiness();
  document.querySelectorAll<HTMLButtonElement>('#tabs button').forEach((b) => { b.onclick = () => { tab = b.dataset.tab as Tab; mountTab(); changed(); }; });
  mountTab(); changed();
  setStatus(JSON.stringify(roster) === saved ? 'loaded' : 'unsaved changes', '');
}

function showError(err: unknown) { setStatus(`failed: ${(err as Error).message}`, 'err'); console.error(err); }
main().catch(showError);
