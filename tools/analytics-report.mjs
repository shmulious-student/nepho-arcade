#!/usr/bin/env node
// Turns the game's anonymous play sessions (Firestore `sessions`, written by src/shared/analytics.ts)
// into a Markdown report: who plays, on what, how far they get, where they struggle or quit, what
// they enjoy, and what breaks. Reads as the project owner through the Firestore REST API with a
// Google access token — ANALYTICS_TOKEN, or `gcloud auth print-access-token` (gcloud must be logged
// in as the project owner, shmulious@gmail.com).
//
//   npm run analytics:report            # last 30 days → stdout + build/analytics-report.md
//   npm run analytics:report -- --days 7
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';

const PROJECT = 'nepho-eviomri';
const args = process.argv.slice(2);
const days = Number(args[args.indexOf('--days') + 1]) || 30;
const since = new Date(Date.now() - days * 864e5);

function token() {
  if (process.env.ANALYTICS_TOKEN) return process.env.ANALYTICS_TOKEN;
  try { return execSync('gcloud auth print-access-token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { console.error('No token: set ANALYTICS_TOKEN or run `gcloud auth login` as shmulious@gmail.com'); process.exit(1); }
}

// Firestore typed JSON → plain values
function dec(v) {
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
}

async function fetchSessions() {
  const tok = token();
  const out = [];
  let pageToken = '';
  do {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/sessions?pageSize=300${pageToken ? `&pageToken=${pageToken}` : ''}`;
    const r = await fetch(url, { headers: { Authorization: `Bearer ${tok}` } });
    if (!r.ok) { console.error(`Firestore ${r.status}: ${(await r.text()).slice(0, 300)}`); process.exit(1); }
    const j = await r.json();
    for (const d of j.documents || []) out.push(Object.fromEntries(Object.entries(d.fields || {}).map(([k, x]) => [k, dec(x)])));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out.filter((s) => s.t0 && new Date(s.t0) >= since && !s.dev); // dev-server sessions (?analytics=1) stay out
}

/** `12.3|level_result|level=2;win=true` → { t, e, level: '2', win: 'true' } */
function parseEvent(str) {
  const [t, e, rest] = str.split('|');
  const ev = { t: Number(t), e };
  if (rest) for (const kv of rest.split(';')) { const i = kv.indexOf('='); if (i > 0) ev[kv.slice(0, i)] = kv.slice(i + 1); }
  return ev;
}
const num = (v) => (v === undefined ? NaN : Number(v));
const pct = (a, b) => (b ? `${Math.round((100 * a) / b)}%` : '–');
const median = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '–');
const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–');
const count = (arr, key) => { const m = new Map(); for (const x of arr) { const k = key(x); if (k === undefined || k === null || k === '') continue; m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');

function report(sessions) {
  const L = [];
  const users = new Set(sessions.map((s) => s.uid));
  const returning = new Set(sessions.filter((s) => (s.visits || 1) > 1).map((s) => s.uid));
  const evs = sessions.flatMap((s) => (s.events || []).map((x) => ({ ...parseEvent(x), uid: s.uid, sid: s.sid, plat: s.plat || {}, v: s.v })));
  const by = (name) => evs.filter((e) => e.e === name);
  const durs = sessions.map((s) => Number(s.dur) || 0);

  L.push(`# EviOmri analytics — last ${days} days`, `_${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${sessions.length} sessions · ${evs.length} events_`, '');

  // ---- who and on what
  L.push('## Players', '');
  L.push(table(['Metric', 'Value'], [
    ['Distinct players', users.size], ['Returning players (2+ visits)', `${returning.size} (${pct(returning.size, users.size)})`],
    ['Sessions', sessions.length], ['Sessions per player', fmt(sessions.length / (users.size || 1), 1)],
    ['Median session', mmss(median(durs))], ['Longest session', mmss(Math.max(0, ...durs))],
    ['Sessions that reached a level', `${new Set(by('level_start').map((e) => e.sid)).size} (${pct(new Set(by('level_start').map((e) => e.sid)).size, sessions.length)})`],
  ]), '');
  const platRows = (key, label) => count(sessions, (s) => (s.plat || {})[key]).map(([k, n]) => [label, String(k), n, pct(n, sessions.length)]);
  L.push(table(['Facet', 'Value', 'Sessions', 'Share'], [...platRows('os', 'OS'), ...platRows('app', 'Surface'), ...platRows('touch', 'Touch'), ...count(sessions, (s) => s.v).map(([k, n]) => ['Version', k, n, pct(n, sessions.length)])]), '');
  const langSet = count(by('start'), (e) => e.lang);
  if (langSet.length) L.push(`Language at START: ${langSet.map(([k, n]) => `${k} ${n}`).join(' · ')}`, '');

  // ---- funnel
  L.push('## Funnel', '');
  const lobbies = new Set(by('lobby').map((e) => e.sid)).size, starts = by('start'), results = by('level_result');
  L.push(table(['Step', 'Sessions'], [
    ['Booted', sessions.length], ['Saw the lobby', lobbies], ['Pressed START', new Set(starts.map((e) => e.sid)).size],
    ['Finished a level (win or lose)', new Set(results.map((e) => e.sid)).size], ['Won a level', new Set(results.filter((e) => e.win === 'true').map((e) => e.sid)).size],
  ]), '');
  L.push(`Setups at START: hero ${count(starts, (e) => e.hero).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} · friend mode ${count(starts, (e) => e.mode).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} · difficulty ${count(starts, (e) => e.difficulty).map(([k, n]) => `${k} ${n}`).join(', ') || '–'} · players ${count(starts, (e) => e.players).map(([k, n]) => `${k} ${n}`).join(', ') || '–'}`, '');

  // ---- per level
  L.push('## Levels', '');
  const levelStarts = by('level_start'), quits = by('quit'), kos = by('ko'), conts = by('continue'), declined = by('continue_declined'), restarts = by('restart');
  const levels = [...new Set([...levelStarts, ...results].map((e) => num(e.level)))].filter(Number.isFinite).sort((a, b) => a - b);
  L.push(table(['Level', 'Starts', 'Wins', 'Losses', 'Win rate', 'Median time', 'KOs/start', 'Continues', 'Gave up', 'Quit mid-level', 'Restarts', 'Reached boss'], levels.map((lv) => {
    const st = levelStarts.filter((e) => num(e.level) === lv).length, rs = results.filter((e) => num(e.level) === lv);
    const wins = rs.filter((e) => e.win === 'true'), losses = rs.length - wins.length;
    return [lv, st, wins.length, losses, pct(wins.length, rs.length), mmss(median(wins.map((e) => num(e.t)))), fmt(kos.filter((e) => num(e.level) === lv).length / (st || 1), 1),
      conts.filter((e) => num(e.level) === lv).length, declined.filter((e) => num(e.level) === lv).length, quits.filter((e) => num(e.level) === lv).length, restarts.filter((e) => num(e.level) === lv).length,
      pct(rs.filter((e) => e.boss === 'true').length, rs.length)];
  })), '');

  // ---- frustration
  L.push('## Frustration signals', '');
  const fr = [];
  const koByWave = count(kos, (e) => `L${e.level} wave ${e.wave}${e.boss === 'true' ? ' (boss)' : ''}`).slice(0, 8);
  if (koByWave.length) fr.push(`- **Where players go down most:** ${koByWave.map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  const quitAt = count(quits, (e) => `L${e.level} wave ${e.wave}`).slice(0, 6);
  if (quitAt.length) fr.push(`- **Quit to lobby mid-level:** ${quits.length} times — ${quitAt.map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  const early = quits.filter((e) => num(e.t) < 40).length;
  if (quits.length) fr.push(`- **Quit within 40s of a level:** ${early} of ${quits.length} (bounce — controls, difficulty or a bug?)`);
  if (declined.length) fr.push(`- **CONTINUE? ran out / declined:** ${declined.length} of ${declined.length + conts.length} game-overs`);
  const lostLevels = levels.map((lv) => { const rs = results.filter((e) => num(e.level) === lv); return [lv, rs.filter((e) => e.win !== 'true').length, rs.length]; }).filter(([, l, n]) => n >= 3 && l / n >= 0.5);
  if (lostLevels.length) fr.push(`- **Levels lost at least half the time:** ${lostLevels.map(([lv, l, n]) => `L${lv} (${l}/${n})`).join(', ')}`);
  const slow = results.filter((e) => num(e.fpsMin) < 30);
  if (slow.length) fr.push(`- **Frame-rate dips under 30 fps:** ${slow.length} of ${results.length} levels — ${count(slow, (e) => `${e.plat.os}/${e.plat.app}`).map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  const skips = by('dialog_skip');
  if (skips.length) fr.push(`- **Dialog scenes skipped:** ${skips.length} (${pct(skips.length, results.reduce((a, e) => a + (num(e.dialogs) || 0), 0))} of scenes shown) — ${count(skips, (e) => e.key).slice(0, 5).map(([k, n]) => `${k} ×${n}`).join(', ')}`);
  const oneAndDone = [...users].filter((u) => sessions.filter((s) => s.uid === u).length === 1 && !results.some((e) => e.uid === u && e.win === 'true')).length;
  fr.push(`- **Played once and never won a level:** ${oneAndDone} of ${users.size} players`);
  L.push(...(fr.length ? fr : ['- nothing yet']), '');

  // ---- fun
  L.push('## Fun signals', '');
  const fun = [];
  const wins = results.filter((e) => e.win === 'true');
  fun.push(`- **Levels won:** ${wins.length} · **players who won:** ${new Set(wins.map((e) => e.uid)).size} · **campaign progress:** furthest level won ${wins.length ? Math.max(...wins.map((e) => num(e.level))) : '–'}`);
  const combos = results.map((e) => num(e.combo)).filter(Number.isFinite);
  if (combos.length) fun.push(`- **Combos:** median best ${fmt(median(combos))}, top ${Math.max(...combos)} · **specials per level:** ${fmt(results.reduce((a, e) => a + (num(e.specials) || 0), 0) / results.length, 1)} · **friend calls per level:** ${fmt(results.reduce((a, e) => a + (num(e.calls) || 0), 0) / results.length, 1)}`);
  const replays = by('retry').length + by('next_level').length + restarts.length;
  fun.push(`- **Kept playing from the results screen:** next level ${by('next_level').length} · retry ${by('retry').length} · restart from pause ${restarts.length} (${replays} total)`);
  const heroes = count(levelStarts, (e) => e.hero);
  if (heroes.length) fun.push(`- **Favourite heroes:** ${heroes.map(([k, n]) => `${k} ${n}`).join(', ')}`);
  const heroWin = heroes.map(([h]) => { const rs = results.filter((e) => e.hero === h); return rs.length ? `${h} ${pct(rs.filter((e) => e.win === 'true').length, rs.length)}` : null; }).filter(Boolean);
  if (heroWin.length) fun.push(`- **Win rate by hero:** ${heroWin.join(', ')}`);
  const longSessions = sessions.filter((s) => (Number(s.dur) || 0) > 600).length;
  fun.push(`- **Sessions over 10 minutes:** ${longSessions} (${pct(longSessions, sessions.length)})`);
  L.push(...fun, '');

  // ---- bugs
  L.push('## Bugs, issues, blockers', '');
  const errors = by('error'), netLost = by('net_lost');
  if (!errors.length && !netLost.length) L.push('- no errors reported', '');
  else {
    L.push(table(['Error', 'Where', 'Times', 'Sessions', 'Versions', 'Surfaces'], count(errors, (e) => `${e.msg}|${e.at}`).slice(0, 15).map(([k, n]) => {
      const [msg, at] = k.split('|'); const es = errors.filter((e) => `${e.msg}|${e.at}` === k);
      return [msg.replace(/\|/g, ' '), at, n, new Set(es.map((e) => e.sid)).size, [...new Set(es.map((e) => e.v))].join(' '), [...new Set(es.map((e) => `${e.plat.os}/${e.plat.app}`))].join(' ')];
    })), '');
    if (netLost.length) L.push(`- LAN link lost: ${netLost.length} — ${count(netLost, (e) => e.msg).slice(0, 4).map(([k, n]) => `"${k}" ×${n}`).join(', ')}`, '');
  }
  const dropped = sessions.filter((s) => (s.dropped || 0) > 0).length;
  if (dropped) L.push(`- ${dropped} sessions hit the event cap (events dropped) — a runaway loop?`, '');
  const bootOnly = sessions.filter((s) => !(s.events || []).some((x) => x.includes('|lobby'))).length;
  if (bootOnly) L.push(`- **Booted but never reached the lobby:** ${bootOnly} sessions (${pct(bootOnly, sessions.length)}) — a load failure or a bounce on the rotate card`, '');

  // ---- recent
  L.push('## Recent sessions', '');
  L.push(table(['When', 'Player', 'Surface', 'Length', 'Events', 'Story'], [...sessions].sort((a, b) => (a.t0 < b.t0 ? 1 : -1)).slice(0, 25).map((s) => {
    const es = (s.events || []).map(parseEvent);
    const story = es.filter((e) => ['start', 'level_result', 'quit', 'error', 'continue_declined', 'net_lost'].includes(e.e)).map((e) => e.e === 'level_result' ? `L${e.level} ${e.win === 'true' ? 'won' : 'lost'} ${mmss(num(e.t))}` : e.e === 'start' ? `start L${e.level} ${e.hero}` : e.e === 'error' ? `ERROR ${e.msg}` : e.e).slice(0, 8).join(' → ');
    return [String(s.t0).slice(0, 16).replace('T', ' '), String(s.uid).slice(0, 6), `${(s.plat || {}).os}/${(s.plat || {}).app}`, mmss(Number(s.dur)), s.n || 0, story || '(lobby only)'];
  })), '');
  return L.join('\n');
}

const sessions = await fetchSessions();
const md = report(sessions);
mkdirSync('build', { recursive: true });
writeFileSync('build/analytics-report.md', md);
console.log(md);
console.error(`\n→ build/analytics-report.md`);
