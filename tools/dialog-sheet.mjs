#!/usr/bin/env node
// The dialog sheet: one self-contained HTML file with every level's scenes (speaker + text, English
// and Hebrew) that opens straight from a phone's files with no server, lets you edit the lines, keeps
// the edits in the browser, and exports them as JSON. Bring the JSON back with --apply to rewrite the
// script in src/sim/dialogs.ts.
//
//   node tools/dialog-sheet.mjs                 -> docs/dialogs/dialog-sheet.html
//   node tools/dialog-sheet.mjs --apply x.json  -> rewrites the DIALOGS block of src/sim/dialogs.ts
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIALOGS_TS = join(ROOT, 'src/sim/dialogs.ts');
const LEVELS_TS = join(ROOT, 'src/sim/levels.ts');
const OUT = join(ROOT, 'docs/dialogs/dialog-sheet.html');
const TMP = join(ROOT, 'node_modules/.cache/dialog-sheet');

function loadSim() {
  mkdirSync(TMP, { recursive: true });
  const esbuild = join(ROOT, 'node_modules/.bin/esbuild');
  execSync(`"${esbuild}" "${DIALOGS_TS}" --bundle --format=cjs --platform=node --outfile="${join(TMP, 'dialogs.cjs')}" --log-level=error`);
  execSync(`"${esbuild}" "${LEVELS_TS}" --bundle --format=cjs --platform=node --outfile="${join(TMP, 'levels.cjs')}" --log-level=error`);
  const require = createRequire(import.meta.url);
  return { dialogs: require(join(TMP, 'dialogs.cjs')), levels: require(join(TMP, 'levels.cjs')) };
}

const LEVEL_NAMES = {
  rishon: ['Rishon LeZion', 'ראשון לציון'], 'petah-tikva': ['Refael Eitan Street', 'רחוב רפאל איתן'], 'capoeira-gym': ['Capoeira gym', 'מכון הקפוארה'],
  'sant-cugat': ['Sant Cugat', 'סנט קוגט'], barcelona: ['Barcelona', 'ברצלונה'], 'basketball-gym': ['Basketball gym', 'אולם הכדורסל'],
  'hatikva-school': ['Hatikva School', 'בית הספר התקווה'], catalunya: ['Catalunya', 'קטלוניה'], theater: ['Theater', 'התיאטרון'], 'candy-factory': ['Candy factory', 'מפעל הממתקים'],
};
const SCENE_NAMES = { start: 'Opening', boss: 'Before the boss', end: 'After the boss' };

/** The script as plain data: [{ id, index, name, boss, scenes: [{ key, title, hero, join, ifPlayed, lines: [{who, en, he}], swapLines }] }] */
function sheetData({ dialogs, levels }) {
  const { DIALOGS } = dialogs;
  const { LEVELS } = levels;
  return LEVELS.map((l) => {
    const d = DIALOGS[l.id];
    const scenes = [];
    const push = (key, title, def) => def && scenes.push({ key, title, hero: def.hero, join: !!def.join, ifPlayed: def.ifPlayed || 'keep', lines: def.lines, swapLines: def.swapLines || null });
    push('start', SCENE_NAMES.start, d.start);
    for (const [n, def] of Object.entries(d.afterWave || {}).sort((a, b) => +a[0] - +b[0])) push(`wave${n}`, `After wave ${n}`, def);
    push('boss', SCENE_NAMES.boss, d.boss);
    push('end', SCENE_NAMES.end, d.end);
    return { id: l.id, index: l.index, name: LEVEL_NAMES[l.id] || [l.id, l.id], boss: l.boss, waves: l.waves.length, scenes };
  });
}

function buildHtml(data, names) {
  const json = JSON.stringify({ data, names }).replace(/<\/script/gi, '<\\/script');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>EviOmri Dialog Sheet</title>
<style>
:root{--ground:#0b1730;--panel:#14243d;--line:#344861;--ink:#f3f4e8;--muted:#9bb1c9;--gold:#ffcf5c;--pink:#ff4f72;--cyan:#75f5dc}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:16px/1.5 -apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:0 16px 120px}
h1{font-size:22px;margin:24px 0 4px;color:var(--gold)}
.sub{color:var(--muted);font-size:13px;margin:0 0 16px}
.toolbar{position:sticky;top:0;z-index:5;background:rgba(11,23,48,.96);padding:10px 0;border-bottom:1px solid var(--line);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
button,select{font:inherit;font-size:14px;color:var(--ink);background:var(--panel);border:1px solid var(--line);border-radius:6px;padding:8px 12px}
button.primary{background:var(--gold);color:#10182b;border-color:var(--gold);font-weight:600}
.status{font-size:12px;color:var(--muted);flex-basis:100%}
.level{margin:22px 0 0;border:1px solid var(--line);border-left:5px solid var(--gold);border-radius:8px;background:var(--panel);padding:10px 12px 4px}
.level h2{font-size:18px;margin:2px 0 0}
.level .meta{font-size:12px;color:var(--muted);margin-bottom:8px}
details{border-top:1px solid #25395a;padding:8px 0}
summary{cursor:pointer;font-weight:600;font-size:15px}
summary .flags{font-weight:400;color:var(--muted);font-size:12px;margin-left:8px}
.line{margin:10px 0 14px;padding-left:10px;border-left:3px solid var(--line)}
.line.hero{border-color:var(--cyan)}.line.boss{border-color:var(--pink)}.line.pitz{border-color:#35e8ff}.line.player{border-color:#a4ee42}
.who{font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);display:flex;align-items:center;gap:8px}
.who select{padding:2px 6px;font-size:12px}
textarea{width:100%;min-height:52px;font:inherit;font-size:15px;color:var(--ink);background:var(--ground);border:1px solid var(--line);border-radius:6px;padding:8px 10px;margin-top:6px;resize:vertical}
textarea[dir=rtl]{text-align:right}
textarea.dirty{border-color:var(--gold)}
.hint{font-size:12px;color:var(--muted)}
.swap{margin-top:8px;padding:8px;border:1px dashed var(--line);border-radius:6px}
.swap .hint{margin-bottom:4px}
#out{width:100%;min-height:120px;font:12px/1.4 ui-monospace,Menlo,monospace;margin-top:8px}
.lang-he .en,.lang-en .he{display:none}
</style>
</head>
<body>
<h1>EviOmri dialog sheet</h1>
<p class="sub">Every scene of every level: who walks in and what they say. Edit any line — edits stay on this phone until you export them. Bring the exported JSON back to the project and run <code>node tools/dialog-sheet.mjs --apply file.json</code>.</p>
<div class="toolbar">
  <button type="button" id="langEn">English</button>
  <button type="button" id="langHe">עברית</button>
  <button type="button" id="langBoth">Both</button>
  <button type="button" class="primary" id="export">Export edits</button>
  <button type="button" id="copy">Copy</button>
  <button type="button" id="share">Share</button>
  <button type="button" id="reset">Reset all</button>
  <span class="status" id="status"></span>
</div>
<div id="root"></div>
<textarea id="out" readonly placeholder="Export edits fills this with JSON you can copy, share or save."></textarea>
<script id="data" type="application/json">${json}</script>
<script>
(function(){
  var SRC = JSON.parse(document.getElementById('data').textContent);
  var KEY = 'eviomri.dialog-sheet.edits';
  var SPEAKERS = ['hero','boss','pitz','player'];
  var edits = {};
  try { edits = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { edits = {}; }
  var root = document.getElementById('root'), status = document.getElementById('status'), out = document.getElementById('out');
  function heroName(id, lang){ var n = SRC.names.heroes[id]; return n ? n[lang] : id; }
  function bossName(id, lang){ return lang === 'he' ? (SRC.names.bossesHe[id] || id) : (SRC.names.bosses[id] || id); }
  function whoLabel(who, scene, lang){ return who === 'boss' ? bossName(scene.__boss, lang) : who === 'pitz' ? SRC.names.pitz[lang] : who === 'player' ? (lang === 'he' ? 'השחקן' : 'the player') : heroName(who, lang); }
  function path(level, scene, list, i, field){ return [level.id, scene.key, list, i, field].join('/'); }
  function val(p, orig){ return p in edits ? edits[p] : orig; }
  function save(){ try { localStorage.setItem(KEY, JSON.stringify(edits)); } catch (e) {} status.textContent = Object.keys(edits).length + ' edited field(s) kept on this device'; }
  function render(){
    root.innerHTML = '';
    SRC.data.forEach(function(level){
      var box = document.createElement('section'); box.className = 'level';
      box.innerHTML = '<h2>Level ' + level.index + ' · ' + level.name[0] + ' · ' + level.name[1] + '</h2><div class="meta">' + level.waves + ' waves · boss: ' + bossName(level.boss, 'en') + '</div>';
      level.scenes.forEach(function(scene){
        scene.__boss = level.boss;
        var det = document.createElement('details'); det.open = level.index === 1;
        var flags = heroName(scene.hero, 'en') + ' walks in' + (scene.join ? ' · stays to fight' : '') + (scene.ifPlayed === 'swap' ? ' · stand-in if played' : '');
        det.innerHTML = '<summary>' + scene.title + '<span class="flags">' + flags + '</span></summary>';
        renderLines(det, level, scene, 'lines', scene.lines);
        if (scene.swapLines) {
          var sw = document.createElement('div'); sw.className = 'swap';
          sw.innerHTML = '<div class="hint">When the player already picked ' + heroName(scene.hero, 'en') + ': {new} = the stand-in, {old} = ' + heroName(scene.hero, 'en') + '</div>';
          renderLines(sw, level, scene, 'swapLines', scene.swapLines);
          det.appendChild(sw);
        }
        box.appendChild(det);
      });
      root.appendChild(box);
    });
  }
  function renderLines(parent, level, scene, list, lines){
    lines.forEach(function(line, i){
      var who = val(path(level, scene, list, i, 'who'), line.who === scene.hero ? 'hero' : line.who);
      var div = document.createElement('div'); div.className = 'line ' + who;
      var whoRow = document.createElement('div'); whoRow.className = 'who';
      var sel = document.createElement('select');
      SPEAKERS.forEach(function(s){ var o = document.createElement('option'); o.value = s; o.textContent = s === 'hero' ? heroName(scene.hero, 'en') : s === 'boss' ? bossName(level.boss, 'en') : s === 'pitz' ? 'Pitz' : 'the player'; if (s === who) o.selected = true; sel.appendChild(o); });
      sel.addEventListener('change', function(){ var p = path(level, scene, list, i, 'who'); var orig = line.who === scene.hero ? 'hero' : line.who; if (sel.value === orig) delete edits[p]; else edits[p] = sel.value; div.className = 'line ' + sel.value; save(); });
      whoRow.appendChild(sel);
      var n = document.createElement('span'); n.textContent = 'page ' + (i + 1); whoRow.appendChild(n);
      div.appendChild(whoRow);
      ['en','he'].forEach(function(lang){
        var ta = document.createElement('textarea'); ta.className = lang; ta.value = val(path(level, scene, list, i, lang), line[lang]);
        if (lang === 'he') ta.dir = 'rtl';
        if (ta.value !== line[lang]) ta.classList.add('dirty');
        ta.addEventListener('input', function(){ var p = path(level, scene, list, i, lang); if (ta.value === line[lang]) { delete edits[p]; ta.classList.remove('dirty'); } else { edits[p] = ta.value; ta.classList.add('dirty'); } save(); });
        div.appendChild(ta);
      });
      parent.appendChild(div);
    });
  }
  function exportJson(){
    var levels = SRC.data.map(function(level){ return { id: level.id, scenes: level.scenes.map(function(scene){
      var conv = function(list, lines){ return lines.map(function(line, i){ var who = val(path(level, scene, list, i, 'who'), line.who === scene.hero ? 'hero' : line.who); return { who: who === 'hero' ? scene.hero : who, en: val(path(level, scene, list, i, 'en'), line.en), he: val(path(level, scene, list, i, 'he'), line.he) }; }); };
      return { key: scene.key, hero: scene.hero, join: scene.join, ifPlayed: scene.ifPlayed, lines: conv('lines', scene.lines), swapLines: scene.swapLines ? conv('swapLines', scene.swapLines) : null };
    }) }; });
    return JSON.stringify({ version: 1, exported: new Date().toISOString(), edits: Object.keys(edits).length, levels: levels }, null, 1);
  }
  document.getElementById('export').addEventListener('click', function(){ out.value = exportJson(); out.scrollIntoView({ block: 'nearest' }); status.textContent = 'Exported: copy, share, or select the text below.'; });
  document.getElementById('copy').addEventListener('click', function(){ var t = out.value || exportJson(); out.value = t; if (navigator.clipboard) navigator.clipboard.writeText(t).then(function(){ status.textContent = 'Copied to the clipboard.'; }, function(){ out.focus(); out.select(); status.textContent = 'Select the text and copy it.'; }); else { out.focus(); out.select(); status.textContent = 'Select the text and copy it.'; } });
  document.getElementById('share').addEventListener('click', function(){ var t = out.value || exportJson(); out.value = t; if (navigator.share) { var f; try { f = new File([t], 'eviomri-dialogs.json', { type: 'application/json' }); } catch (e) {} var payload = f && navigator.canShare && navigator.canShare({ files: [f] }) ? { files: [f], title: 'EviOmri dialogs' } : { title: 'EviOmri dialogs', text: t }; navigator.share(payload).catch(function(){}); } else status.textContent = 'Sharing is not available here — use Copy.'; });
  document.getElementById('reset').addEventListener('click', function(){ if (!confirm('Throw away every edit on this device?')) return; edits = {}; save(); render(); });
  function setLang(mode){ document.body.className = mode === 'both' ? '' : 'lang-' + mode; try { localStorage.setItem(KEY + '.lang', mode); } catch (e) {} }
  document.getElementById('langEn').addEventListener('click', function(){ setLang('en'); });
  document.getElementById('langHe').addEventListener('click', function(){ setLang('he'); });
  document.getElementById('langBoth').addEventListener('click', function(){ setLang('both'); });
  try { setLang(localStorage.getItem(KEY + '.lang') || 'both'); } catch (e) {}
  render(); save();
})();
</script>
</body>
</html>
`;
}

/** Rewrites the DIALOGS block of src/sim/dialogs.ts from an exported sheet. */
function apply(file, sim) {
  const sheet = JSON.parse(readFileSync(file, 'utf8'));
  const src = readFileSync(DIALOGS_TS, 'utf8');
  const at = src.indexOf('export const DIALOGS');
  if (at < 0) throw new Error('DIALOGS block not found');
  const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  const line = (l) => `      L(${q(l.who)}, ${q(l.en)}, ${q(l.he)}),`;
  const def = (d) => {
    const head = `{ hero: ${q(d.hero)}${d.join ? ', join: true' : ''}${d.ifPlayed === 'swap' ? ", ifPlayed: 'swap'" : ''}, lines: [\n${d.lines.map(line).join('\n')}\n    ]`;
    return d.swapLines ? `${head}, swapLines: [\n${d.swapLines.map(line).join('\n')}\n    ] }` : `${head} }`;
  };
  let out = 'export const DIALOGS: Record<string, LevelDialogs> = {\n';
  for (const level of sheet.levels) {
    const key = /^[a-z]+$/.test(level.id) ? level.id : `'${level.id}'`;
    out += `  ${key}: {\n`;
    const waves = level.scenes.filter((s) => s.key.startsWith('wave'));
    for (const s of level.scenes) {
      if (s.key === 'start' || s.key === 'boss' || s.key === 'end') out += `    ${s.key}: ${def(s)},\n`;
    }
    if (waves.length) out += `    afterWave: { ${waves.map((s) => `${s.key.slice(4)}: ${def(s)}`).join(', ')} },\n`;
    out += '  },\n';
  }
  out += '};\n';
  writeFileSync(DIALOGS_TS, src.slice(0, at) + out);
  console.log(`applied ${sheet.levels.length} levels from ${file} -> ${DIALOGS_TS} (${sheet.edits ?? '?'} edited fields)`);
  void sim;
}

const args = process.argv.slice(2);
const sim = loadSim();
if (args[0] === '--apply') {
  if (!args[1]) { console.error('usage: node tools/dialog-sheet.mjs --apply <exported.json>'); process.exit(1); }
  apply(args[1], sim);
} else {
  const { HERO_NAMES, BOSS_NAMES_HE, PITZ_NAME } = sim.dialogs;
  const bossesEn = Object.fromEntries(Object.keys(BOSS_NAMES_HE).map((id) => [id, id.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ')]));
  const names = { heroes: HERO_NAMES, bosses: bossesEn, bossesHe: BOSS_NAMES_HE, pitz: PITZ_NAME };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, buildHtml(sheetData(sim), names));
  console.log(`wrote ${OUT.replace(ROOT + '/', '')} (${(readFileSync(OUT).length / 1024).toFixed(0)} KB)`);
}
rmSync(TMP, { recursive: true, force: true });
