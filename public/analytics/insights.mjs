// The analytics brain, shared by the hosted dashboard (public/analytics/index.html) and the
// command-line report (tools/analytics-report.mjs): plain ES module, no imports, so it runs in a
// browser and in node alike. Input: session documents as written by src/shared/analytics.ts.

/** Firestore's typed JSON → plain values (the REST API; the JS SDK already returns plain data). */
export function dec(v) {
  if (v === null || v === undefined) return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return v.doubleValue;
  if ('booleanValue' in v) return v.booleanValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(dec);
  if ('mapValue' in v) return Object.fromEntries(Object.entries(v.mapValue.fields || {}).map(([k, x]) => [k, dec(x)]));
  return null;
}
export const docToSession = (doc) => Object.fromEntries(Object.entries(doc.fields || {}).map(([k, x]) => [k, dec(x)]));

/** `12.3|level_result|level=2;win=true` → { t: 12.3, e: 'level_result', level: '2', win: 'true' } */
export function parseEvent(str) {
  const [t, e, rest] = String(str).split('|');
  const ev = { t: Number(t), e };
  if (rest) for (const kv of rest.split(';')) { const i = kv.indexOf('='); if (i > 0) ev[kv.slice(0, i)] = kv.slice(i + 1); }
  return ev;
}

const num = (v) => (v === undefined || v === null || v === '' ? NaN : Number(v));
export const pct = (a, b) => (b ? Math.round((100 * a) / b) : null);
export const median = (xs) => { if (!xs.length) return NaN; const s = [...xs].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };
export const mmss = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '–');
const count = (arr, key) => { const m = new Map(); for (const x of arr) { const k = key(x); if (k === undefined || k === null || k === '' || k === 'undefined') continue; m.set(k, (m.get(k) || 0) + 1); } return [...m.entries()].sort((a, b) => b[1] - a[1]); };
const surfaceOf = (s) => `${(s.plat || {}).os || '?'}/${(s.plat || {}).app || '?'}`;

/** Everything the report and the dashboard show, from the sessions in range. */
export function analyze(all, { days = 30, includeDev = false, now = Date.now() } = {}) {
  const since = now - days * 864e5;
  const sessions = all.filter((s) => s.t0 && new Date(s.t0).getTime() >= since && (includeDev || !s.dev));
  const users = new Set(sessions.map((s) => s.uid));
  const returning = new Set(sessions.filter((s) => (s.visits || 1) > 1).map((s) => s.uid));
  const evs = sessions.flatMap((s) => (s.events || []).map((x) => ({ ...parseEvent(x), uid: s.uid, sid: s.sid, plat: s.plat || {}, geo: s.geo || {}, v: s.v })));
  const by = (name) => evs.filter((e) => e.e === name);
  const durs = sessions.map((s) => Number(s.dur) || 0);
  const starts = by('start'), results = by('level_result'), levelStarts = by('level_start'), quits = by('quit'), kos = by('ko');
  const conts = by('continue'), declined = by('continue_declined'), restarts = by('restart'), skips = by('dialog_skip'), errors = by('error'), netLost = by('net_lost');
  const wins = results.filter((e) => e.win === 'true');
  const sidSet = (xs) => new Set(xs.map((e) => e.sid)).size;

  // per day
  const dayMap = new Map();
  for (const s of sessions) { const d = String(s.t0).slice(0, 10); const o = dayMap.get(d) || { day: d, sessions: 0, players: new Set() }; o.sessions++; o.players.add(s.uid); dayMap.set(d, o); }
  const perDay = [...dayMap.values()].sort((a, b) => (a.day < b.day ? -1 : 1)).map((o) => ({ day: o.day, sessions: o.sessions, players: o.players.size }));

  // geo
  const geoSessions = sessions.filter((s) => s.geo && (s.geo.country || s.geo.tz));
  const pointMap = new Map();
  for (const s of geoSessions) { const g = s.geo; if (!Number.isFinite(g.lat)) continue; const k = `${g.city || g.region || g.country}`; const o = pointMap.get(k) || { city: k, country: g.country, lat: g.lat, lon: g.lon, sessions: 0, players: new Set() }; o.sessions++; o.players.add(s.uid); pointMap.set(k, o); }

  // levels
  const levels = [...new Set([...levelStarts, ...results].map((e) => num(e.level)))].filter(Number.isFinite).sort((a, b) => a - b).map((lv) => {
    const st = levelStarts.filter((e) => num(e.level) === lv).length, rs = results.filter((e) => num(e.level) === lv), w = rs.filter((e) => e.win === 'true');
    return {
      level: lv, starts: st, wins: w.length, losses: rs.length - w.length, winRate: pct(w.length, rs.length), medianWin: median(w.map((e) => num(e.t))),
      kosPerStart: st ? kos.filter((e) => num(e.level) === lv).length / st : 0, continues: conts.filter((e) => num(e.level) === lv).length, declined: declined.filter((e) => num(e.level) === lv).length,
      quits: quits.filter((e) => num(e.level) === lv).length, restarts: restarts.filter((e) => num(e.level) === lv).length, bossRate: pct(rs.filter((e) => e.boss === 'true').length, rs.length),
      medianCombo: median(rs.map((e) => num(e.combo)).filter(Number.isFinite)), fpsMin: median(rs.map((e) => num(e.fpsMin)).filter(Number.isFinite)),
    };
  });

  // frustration
  const frustration = [];
  const koByWave = count(kos, (e) => `L${e.level} wave ${e.wave}${e.boss === 'true' ? ' (boss)' : ''}`).slice(0, 8);
  if (koByWave.length) frustration.push({ label: 'Where players go down most', detail: koByWave.map(([k, n]) => `${k} ×${n}`).join(', ') });
  if (quits.length) {
    frustration.push({ label: 'Quit to lobby mid-level', detail: `${quits.length} times — ${count(quits, (e) => `L${e.level} wave ${e.wave}`).slice(0, 6).map(([k, n]) => `${k} ×${n}`).join(', ')}` });
    frustration.push({ label: 'Quit within 40 s of a level', detail: `${quits.filter((e) => num(e.t) < 40).length} of ${quits.length} — a bounce: controls, difficulty or a bug?` });
  }
  if (declined.length + conts.length) frustration.push({ label: 'CONTINUE? ran out or was declined', detail: `${declined.length} of ${declined.length + conts.length} game-overs` });
  const lostLevels = levels.filter((l) => l.wins + l.losses >= 3 && l.losses / (l.wins + l.losses) >= 0.5);
  if (lostLevels.length) frustration.push({ label: 'Levels lost at least half the time', detail: lostLevels.map((l) => `L${l.level} (${l.losses}/${l.wins + l.losses})`).join(', ') });
  const slow = results.filter((e) => num(e.fpsMin) < 30);
  if (slow.length) frustration.push({ label: 'Frame rate dipped under 30 fps', detail: `${slow.length} of ${results.length} levels — ${count(slow, (e) => `${e.plat.os}/${e.plat.app}`).map(([k, n]) => `${k} ×${n}`).join(', ')}` });
  const shown = results.reduce((a, e) => a + (num(e.dialogs) || 0), 0);
  if (skips.length) frustration.push({ label: 'Dialog scenes skipped', detail: `${skips.length}${shown ? ` (${pct(skips.length, shown)}% of scenes shown)` : ''} — ${count(skips, (e) => e.key).slice(0, 5).map(([k, n]) => `${k} ×${n}`).join(', ')}` });
  const oneAndDone = [...users].filter((u) => sessions.filter((s) => s.uid === u).length === 1 && !wins.some((e) => e.uid === u)).length;
  if (users.size) frustration.push({ label: 'Played once and never won a level', detail: `${oneAndDone} of ${users.size} players` });
  const bootOnly = sessions.filter((s) => !(s.events || []).some((x) => x.includes('|lobby'))).length;
  if (bootOnly) frustration.push({ label: 'Booted but never reached the lobby', detail: `${bootOnly} sessions (${pct(bootOnly, sessions.length)}%) — a load failure, or a bounce on the rotate card` });

  // fun
  const fun = [];
  fun.push({ label: 'Levels won', detail: `${wins.length} by ${new Set(wins.map((e) => e.uid)).size} players · furthest level won: ${wins.length ? Math.max(...wins.map((e) => num(e.level))) : '–'}` });
  const combos = results.map((e) => num(e.combo)).filter(Number.isFinite);
  if (combos.length) fun.push({ label: 'Combos', detail: `median best ${median(combos)}, top ${Math.max(...combos)}` });
  if (results.length) fun.push({ label: 'Per level', detail: `${(results.reduce((a, e) => a + (num(e.specials) || 0), 0) / results.length).toFixed(1)} specials · ${(results.reduce((a, e) => a + (num(e.calls) || 0), 0) / results.length).toFixed(1)} friend calls · ${(results.reduce((a, e) => a + (num(e.hits) || 0), 0) / results.length).toFixed(1)} hits taken` });
  fun.push({ label: 'Kept playing from the results screen', detail: `next level ${by('next_level').length} · retry ${by('retry').length} · restart from pause ${restarts.length}` });
  const heroes = count(levelStarts, (e) => e.hero);
  if (heroes.length) fun.push({ label: 'Favourite heroes', detail: heroes.map(([k, n]) => `${k} ${n}`).join(', ') });
  const heroWin = heroes.map(([h]) => { const rs = results.filter((e) => e.hero === h); return rs.length ? `${h} ${pct(rs.filter((e) => e.win === 'true').length, rs.length)}%` : null; }).filter(Boolean);
  if (heroWin.length) fun.push({ label: 'Win rate by hero', detail: heroWin.join(', ') });
  const long = sessions.filter((s) => (Number(s.dur) || 0) > 600).length;
  fun.push({ label: 'Sessions over 10 minutes', detail: `${long} (${pct(long, sessions.length) ?? 0}%)` });

  // bugs
  const errKey = (e) => `${e.msg} @ ${e.at}`;
  const errorRows = count(errors, errKey).slice(0, 20).map(([k, n]) => {
    const es = errors.filter((e) => errKey(e) === k);
    return { msg: es[0].msg, at: es[0].at, n, sessions: sidSet(es), versions: [...new Set(es.map((e) => e.v))].join(' '), surfaces: [...new Set(es.map((e) => `${e.plat.os}/${e.plat.app}`))].join(' ') };
  });
  const notes = [];
  if (netLost.length) notes.push(`LAN link lost ${netLost.length} times — ${count(netLost, (e) => e.msg).slice(0, 4).map(([k, n]) => `"${k}" ×${n}`).join(', ')}`);
  const dropped = sessions.filter((s) => (s.dropped || 0) > 0).length;
  if (dropped) notes.push(`${dropped} sessions hit the event cap (events dropped) — a runaway loop?`);

  // recent
  const recent = [...sessions].sort((a, b) => (a.t0 < b.t0 ? 1 : -1)).slice(0, 40).map((s) => {
    const es = (s.events || []).map(parseEvent);
    const story = es.filter((e) => ['start', 'level_result', 'quit', 'error', 'continue_declined', 'net_lost'].includes(e.e))
      .map((e) => (e.e === 'level_result' ? `L${e.level} ${e.win === 'true' ? 'won' : 'lost'} ${mmss(num(e.t))}` : e.e === 'start' ? `start L${e.level} ${e.hero}` : e.e === 'error' ? `ERROR ${e.msg}` : e.e)).slice(0, 8).join(' → ');
    const g = s.geo || {};
    return { when: String(s.t0).slice(0, 16).replace('T', ' '), uid: String(s.uid).slice(0, 6), surface: surfaceOf(s), geo: [g.city, g.country].filter(Boolean).join(', ') || g.tz || '', len: mmss(Number(s.dur)), n: s.n || 0, v: s.v, story: story || '(lobby only)', dev: !!s.dev };
  });

  return {
    days, includeDev, generated: new Date(now).toISOString(), sessions: sessions.length, events: evs.length,
    players: { distinct: users.size, returning: returning.size, sessions: sessions.length, perPlayer: users.size ? sessions.length / users.size : 0, medianSession: median(durs), longest: Math.max(0, ...durs), reachedLevel: sidSet(levelStarts) },
    perDay,
    surfaces: { os: count(sessions, (s) => (s.plat || {}).os), app: count(sessions, (s) => (s.plat || {}).app), touch: count(sessions, (s) => String((s.plat || {}).touch)), version: count(sessions, (s) => s.v), lang: count(starts, (e) => e.lang), screen: count(sessions, (s) => `${(s.plat || {}).w}×${(s.plat || {}).h}`).slice(0, 8) },
    geo: { covered: geoSessions.length, countries: count(geoSessions, (s) => s.geo.country || s.geo.tz), cities: count(geoSessions, (s) => [s.geo.city, s.geo.country].filter(Boolean).join(', ') || s.geo.tz), points: [...pointMap.values()].map((o) => ({ ...o, players: o.players.size })) },
    funnel: [['Booted', sessions.length], ['Saw the lobby', sidSet(by('lobby'))], ['Pressed START', sidSet(starts)], ['Finished a level', sidSet(results)], ['Won a level', sidSet(wins)]].map(([step, n]) => ({ step, n })),
    setups: { hero: count(starts, (e) => e.hero), mode: count(starts, (e) => e.mode), difficulty: count(starts, (e) => e.difficulty), players: count(starts, (e) => e.players), controls: count(by('set').filter((e) => e.k === 'controls'), (e) => e.v) },
    levels, frustration, fun, errors: errorRows, notes, recent,
  };
}
