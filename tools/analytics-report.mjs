#!/usr/bin/env node
// The analytics report on the command line: fetches the game's play sessions (Firestore
// `sessions`, written by src/shared/analytics.ts) as the project owner and prints the insights
// (public/analytics/insights.mjs — the same brain as the hosted dashboard) as Markdown, saved to
// build/analytics-report.md. Token: ANALYTICS_TOKEN, or `gcloud auth print-access-token` (gcloud
// logged in as the owner, shmulious@gmail.com).
//
//   npm run analytics:report                    # last 30 days
//   npm run analytics:report -- --days 7 --dev  # a week, dev-server sessions included
//   npm run analytics:report -- --dump          # also writes public/analytics/data.json for the
//                                               # dashboard's local mode (/analytics/?local=1 on vite)
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { analyze, docToSession, mmss } from '../public/analytics/insights.mjs';

const PROJECT = 'nepho-eviomri';
const args = process.argv.slice(2);
const days = Number(args[args.indexOf('--days') + 1]) || 30;
const includeDev = args.includes('--dev');

function token() {
  if (process.env.ANALYTICS_TOKEN) return process.env.ANALYTICS_TOKEN;
  try { return execSync('gcloud auth print-access-token', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim(); }
  catch { console.error('No token: set ANALYTICS_TOKEN or run `gcloud auth login` as shmulious@gmail.com'); process.exit(1); }
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
    for (const d of j.documents || []) out.push(docToSession(d));
    pageToken = j.nextPageToken || '';
  } while (pageToken);
  return out;
}

const fmt = (n, d = 0) => (Number.isFinite(n) ? n.toFixed(d) : '–');
const P = (n) => (n === null || n === undefined ? '–' : `${n}%`);
const pctOf = (x, n) => (n ? Math.round((100 * x) / n) : null);
const table = (head, rows) => [`| ${head.join(' | ')} |`, `| ${head.map(() => '---').join(' | ')} |`, ...rows.map((r) => `| ${r.join(' | ')} |`)].join('\n');
const pairs = (xs) => (xs.length ? xs.map(([k, n]) => `${k} ${n}`).join(', ') : '–');

function markdown(a) {
  const L = [];
  L.push(`# EviOmri analytics — last ${a.days} days`, `_${a.generated.slice(0, 16).replace('T', ' ')} · ${a.sessions} sessions · ${a.events} events${a.includeDev ? ' · dev sessions included' : ''}_`, '');
  const p = a.players;
  L.push('## Players', '', table(['Metric', 'Value'], [
    ['Distinct players', p.distinct], ['Returning players (2+ visits)', `${p.returning} (${P(pctOf(p.returning, p.distinct))})`], ['Sessions', p.sessions], ['Sessions per player', fmt(p.perPlayer, 1)],
    ['Median session', mmss(p.medianSession)], ['Longest session', mmss(p.longest)], ['Sessions that reached a level', `${p.reachedLevel} (${P(pctOf(p.reachedLevel, p.sessions))})`],
  ]), '');
  L.push(table(['Facet', 'Value', 'Sessions'], [...a.surfaces.os.map(([k, n]) => ['OS', k, n]), ...a.surfaces.app.map(([k, n]) => ['Surface', k, n]), ...a.surfaces.touch.map(([k, n]) => ['Touch', k, n]), ...a.surfaces.version.map(([k, n]) => ['Version', k, n])]), '');
  if (a.surfaces.lang.length) L.push(`Language at START: ${pairs(a.surfaces.lang)}`, '');
  L.push('## Where', '', a.geo.covered ? table(['Place', 'Sessions'], a.geo.cities.slice(0, 15)) : '- no location data yet', '');
  L.push('## Funnel', '', table(['Step', 'Sessions'], a.funnel.map((f) => [f.step, f.n])), '');
  L.push(`Setups at START: hero ${pairs(a.setups.hero)} · friend mode ${pairs(a.setups.mode)} · difficulty ${pairs(a.setups.difficulty)} · players ${pairs(a.setups.players)}`, '');
  L.push('## Levels', '', table(['Level', 'Starts', 'Wins', 'Losses', 'Win rate', 'Median win time', 'KOs/start', 'Continues', 'Gave up', 'Quit mid-level', 'Restarts', 'Reached boss'],
    a.levels.map((l) => [l.level, l.starts, l.wins, l.losses, P(l.winRate), mmss(l.medianWin), fmt(l.kosPerStart, 1), l.continues, l.declined, l.quits, l.restarts, P(l.bossRate)])), '');
  L.push('## Frustration signals', '', ...(a.frustration.length ? a.frustration.map((f) => `- **${f.label}:** ${f.detail}`) : ['- nothing yet']), '');
  L.push('## Fun signals', '', ...a.fun.map((f) => `- **${f.label}:** ${f.detail}`), '');
  L.push('## Bugs, issues, blockers', '');
  if (a.errors.length) L.push(table(['Error', 'Where', 'Times', 'Sessions', 'Versions', 'Surfaces'], a.errors.map((e) => [e.msg, e.at, e.n, e.sessions, e.versions, e.surfaces])), '');
  L.push(...(a.notes.length ? a.notes.map((n) => `- ${n}`) : a.errors.length ? [] : ['- no errors reported']), '');
  L.push('## Recent sessions', '', table(['When', 'Player', 'Surface', 'Where', 'Length', 'Events', 'Story'], a.recent.slice(0, 25).map((r) => [r.when, r.uid, r.surface, r.geo, r.len, r.n, r.story])), '');
  return L.join('\n');
}

const all = await fetchSessions();
if (args.includes('--dump')) { mkdirSync('public/analytics', { recursive: true }); writeFileSync('public/analytics/data.json', JSON.stringify(all)); console.error(`→ public/analytics/data.json (${all.length} sessions, for /analytics/?local=1)`); }
const md = markdown(analyze(all, { days, includeDev }));
mkdirSync('build', { recursive: true });
writeFileSync('build/analytics-report.md', md);
console.log(md);
console.error('\n→ build/analytics-report.md');
