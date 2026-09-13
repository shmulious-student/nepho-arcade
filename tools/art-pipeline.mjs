// Unattended character-art pipeline (docs/character-art-standard.md, docs/prompts/*.md).
//
//   node tools/art-pipeline.mjs --queue                 # the whole queue in docs/prompts/README.md
//   node tools/art-pipeline.mjs <id> [--only walk dash] # one character, or only the named files
//
// Options
//   --provider auto|gpt|gemini   image model family (default auto: gpt if OPENAI_API_KEY is set, else gemini;
//                           the other provider, when its key exists, takes the last retry of a stuck file)
//   --quality low|medium|high|xhigh|max   OpenAI quality (default high; xhigh for hero faces)
//   --budget USD            hard cap on this run's spend — no request is sent that would exceed it (default 60)
//   --char-budget USD       cap per character before it is parked (default 8)
//   --bench <id>            benchmark: sheet + idle + walk on every configured provider, scored on gate/judge/time/cost
//   --parallel N            characters generated at once in --queue mode (default 3)
//   --concurrency N         action files generated at once inside one character (default 4)
//   --max-retries N         regenerations per file before the character is parked (default 3)
//   --no-judge              skip the vision judge (identity, stride, defeat 8–9)
//   --no-commit             leave passing characters uncommitted
//   --dry-run               print the plan and the assembled prompts, call nothing
//   --smoke                 one small test image (and one judge call) with the chosen provider, then exit
//
// Env: OPENAI_API_KEY and/or GEMINI_API_KEY (GOOGLE_API_KEY) — an AI Studio key (AIza…) or a Vertex AI
// Express Mode key (AQ.…); AI Studio endpoint by default, GEMINI_ENDPOINT=vertex for aiplatform. Read from
// .env.local too. Never logged.
//
// The prompt files are the source of truth: the card, STYLE BLOCK, FRAME BLOCK, Step A / Step C
// prompts and the beats table are parsed from docs/prompts/<id>.md and assembled exactly as the
// standard says — nothing is retyped here. Per character: sheet → idle → the other files in
// parallel; each file → intake → verify-character → (vision judge) → retry with the offending rule
// bolded, up to --max-retries; PASS → build:assets + test:assets → commit that character alone →
// a line in docs/prompts/QUEUE-LOG.md. A file that still fails parks the character; the queue moves on.
//
// Every frame is generated art: this script never cuts, copies, blends or moves pixels. The only
// pixel step it runs is tools/intake-character.mjs (container normalization).
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync, renameSync, copyFileSync, rmSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { verifyCharacter, ACTIONS } from './verify-character.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACTIONS_DIR = join(ROOT, 'public/assets/generated/actions');
const PROMPTS_DIR = join(ROOT, 'docs/prompts');
const QUALITY_REF = join(ROOT, 'public/assets/references/hero-grid-quality-reference.png');
const LOG = join(PROMPTS_DIR, 'QUEUE-LOG.md');
const ATTEMPTS = join(ROOT, 'public/assets/backups/attempts'); // gitignored

// ---- args ----
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const OPTS = {
  queue: flag('queue'), dryRun: flag('dry-run'), judge: !flag('no-judge'), commit: !flag('no-commit'),
  provider: opt('provider', 'auto'), parallel: +opt('parallel', 3), concurrency: +opt('concurrency', 4), maxRetries: +opt('max-retries', 3),
  quality: opt('quality', 'high'), budget: +opt('budget', 60), charBudget: +opt('char-budget', 8), bench: opt('bench', null),
};
const positional = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1].match(/^--(provider|parallel|concurrency|max-retries|quality|budget|char-budget|bench)$/)));
const onlyIdx = argv.indexOf('--only');
const ONLY = onlyIdx >= 0 ? argv.slice(onlyIdx + 1).filter((a) => !a.startsWith('--')) : [];
const ID = OPTS.queue ? null : positional.filter((a) => !ONLY.includes(a))[0];
if (!OPTS.queue && !ID && !flag('smoke') && !OPTS.bench) { console.error('usage: node tools/art-pipeline.mjs --queue | <id> [--only <action> ...] [--provider gpt|gemini] [--dry-run]'); process.exit(2); }

// .env.local (gitignored) may hold the keys: KEY=value lines; the process environment wins
for (const envFile of ['.env.local', '.env']) {
  const f = join(ROOT, envFile); if (!existsSync(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) { const m = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2'); }
}
const OPENAI_KEY = process.env.OPENAI_API_KEY;
const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2.5-sunburst';
const GEMINI_IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';
const OPENAI_JUDGE_MODEL = process.env.OPENAI_JUDGE_MODEL || 'gpt-5-mini';
const GEMINI_JUDGE_MODEL = process.env.GEMINI_JUDGE_MODEL || 'gemini-flash-latest';
// two kinds of Gemini key: AI Studio (AIza…) → generativelanguage.googleapis.com with a header; Vertex AI
// Express Mode (AQ.…) → aiplatform.googleapis.com with ?key= — same request/response body either way
const GEMINI_EXPRESS = process.env.GEMINI_ENDPOINT === 'vertex'; // AQ.… keys work on AI Studio too when the project has that API enabled
const geminiCall = (model, body) => GEMINI_EXPRESS
  ? fetchRetry(`https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_KEY)}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  : fetchRetry(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_KEY }, body: JSON.stringify(body) });

if (OPTS.provider === 'auto') OPTS.provider = OPENAI_KEY ? 'gpt' : 'gemini';
const ALT_PROVIDER = OPTS.provider === 'gpt' ? (GEMINI_KEY ? 'gemini' : null) : (OPENAI_KEY ? 'gpt' : null);

// ---- prices (docs, 2026-09): the ledger estimates before a call and settles on the response's usage ----
// OpenAI: $30 / 1M image-output tokens; tokens per image by quality × size from the docs' calculator.
// $8 / 1M image-input tokens for references (~hundreds of tokens each) — folded in as a flat allowance.
const OPENAI_TOKENS = { low: { 1024: 196, 2048: 397, sheet: 158 }, medium: { 1024: 439, 2048: 892, sheet: 343 }, high: { 1024: 1756, 2048: 3568, sheet: 1372 }, xhigh: { 1024: 3122, 2048: 6343, sheet: 2459 }, max: { 1024: 7024, 2048: 14272, sheet: 5488 } };
// Gemini: image output $120 / 1M tokens on Pro (1K–2K = 1120 tokens ⇒ $0.134), $60 / 1M on 3.1 Flash Image (2K = 1680 ⇒ $0.101); image input $0.0011 each
const GEMINI_PER_IMAGE = { 'gemini-3-pro-image': 0.134, 'gemini-3.1-flash-image': 0.101, 'gemini-3.1-flash-lite-image': 0.034, 'gemini-2.5-flash-image': 0.039 };
function estimateCost(provider, kind, refs) {
  if (provider === 'gpt') { const q = OPENAI_TOKENS[OPTS.quality] || OPENAI_TOKENS.high; const tok = kind === 'sheet' ? q.sheet * 1.4 : q[2048]; return tok * 30 / 1e6 + refs * 0.004; }
  return (GEMINI_PER_IMAGE[GEMINI_IMAGE_MODEL] || 0.134) + refs * 0.0011;
}
const LEDGER = join(ROOT, 'public/assets/backups/spend.json'); // gitignored; survives restarts
const ledger = existsSync(LEDGER) ? JSON.parse(readFileSync(LEDGER, 'utf8')) : { total: 0, runs: [] };
const run = { started: new Date().toISOString(), spent: 0, requests: 0, byCharacter: {} };
ledger.runs.push(run);
function charge(id, usd) { run.spent += usd; run.requests++; run.byCharacter[id] = (run.byCharacter[id] || 0) + usd; ledger.total += usd; if (!OPTS.dryRun) writeFileSync(LEDGER, JSON.stringify(ledger, null, 1)); }
/** Throws before a request that would break the run or per-character budget — the hard cap. */
function assertBudget(id, est) {
  if (run.spent + est > OPTS.budget) throw new Error(`BUDGET: run spend \$${run.spent.toFixed(2)} + \$${est.toFixed(3)} would exceed --budget \$${OPTS.budget}`);
  if ((run.byCharacter[id] || 0) + est > OPTS.charBudget) throw new Error(`BUDGET: ${id} has used \$${(run.byCharacter[id] || 0).toFixed(2)} of its --char-budget \$${OPTS.charBudget}`);
}
// per-provider throttle: Gemini Tier 1 allows $10 per rolling 10 min (≈70 Pro images) — 6 in flight is safe; OpenAI 8
const inflight = { gpt: 0, gemini: 0 }; const LIMIT = { gpt: +(process.env.OPENAI_CONCURRENCY || 8), gemini: +(process.env.GEMINI_CONCURRENCY || 6) };
async function throttled(provider, fn) { while (inflight[provider] >= LIMIT[provider]) await sleep(500); inflight[provider]++; try { return await fn(); } finally { inflight[provider]--; } }

const ts = () => new Date().toTimeString().slice(0, 8);
function log(id, msg) { const line = `${ts()} ${id.padEnd(15)} ${msg}`; console.log(line); if (!OPTS.dryRun) appendFileSync(LOG, `- \`${line}\`\n`); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- prompt file parsing ----
function section(md, startsWith) {
  const re = /^## (.*)$/gm; let m; const heads = [];
  while ((m = re.exec(md))) heads.push({ title: m[1], at: m.index, end: m.index + m[0].length });
  const i = heads.findIndex((h) => h.title.startsWith(startsWith));
  if (i < 0) return null;
  return md.slice(heads[i].end, i + 1 < heads.length ? heads[i + 1].at : md.length);
}
const quote = (sec) => sec ? sec.split('\n').filter((l) => l.startsWith('>')).map((l) => l.replace(/^>\s?/, '')).join(' ').replace(/\s+/g, ' ').trim() : null;
const fenced = (sec) => sec ? (sec.match(/```[^\n]*\n([\s\S]*?)```/) || [])[1]?.trim() : null;
const pathsIn = (text) => [...new Set((text.match(/(?:public|docs)\/[\w./-]+\.(?:png|webp|jpe?g)/g) || []))].map((p) => join(ROOT, p)).filter(existsSync);

export function parsePromptFile(id) {
  const file = join(PROMPTS_DIR, `${id}.md`);
  if (!existsSync(file)) throw new Error(`no prompt file: docs/prompts/${id}.md`);
  const md = readFileSync(file, 'utf8');
  const card = fenced(section(md, 'Character card'));
  if (!card) throw new Error(`${id}.md: no character card`);
  const rank = (card.match(/RANK:\s*(\w+)/) || [])[1];
  if (!ACTIONS[rank]) throw new Error(`${id}.md: unknown rank ${rank}`);
  const name = (card.match(/NAME:\s*(.+)/) || [, id])[1].trim();
  const style = quote(section(md, 'STYLE BLOCK'));
  const frame = quote(section(md, 'FRAME BLOCK'));
  if (!style || !frame) throw new Error(`${id}.md: STYLE or FRAME block missing`);
  const beats = {};
  for (const m of md.matchAll(/^\| `([\w-]+)\.png` \| (.+?) \|\s*$/gm)) beats[m[1]] = m[2].trim();
  const attachPara = (md.match(/\*\*Attach to every request:\*\*[\s\S]*?(?=\n\n)/) || [''])[0];
  const attach = pathsIn(attachPara).filter((p) => p !== QUALITY_REF);
  const sheetPrompt = quote(section(md, 'Step A'));
  const cardPrompt = quote(section(md, 'Step C'));
  const sheetPath = join(ROOT, 'docs/refs', `${id}-sheet.png`);
  return { id, name, rank, card, style, frame, beats, attach, sheetPrompt, cardPrompt, sheetPath, actions: ACTIONS[rank] };
}

/** The queue from docs/prompts/README.md: [{ id, only[] }] in table order. */
function readQueue() {
  const md = readFileSync(join(PROMPTS_DIR, 'README.md'), 'utf8');
  const out = [];
  for (const m of md.matchAll(/^\| \d+ \| \[([\w-]+)\]\([\w-]+\.md\) \| \w+ \| \d+ \| (.+?) \|\s*$/gm)) {
    const only = [...m[2].matchAll(/`([\w-]+)\.png` only/g)].map((x) => x[1]);
    out.push({ id: m[1], only });
  }
  return out;
}

// ---- prompt assembly (the standard, verbatim from the file) ----
function actionPrompt(P, action, extra = []) {
  const beats = P.beats[action];
  if (!beats) throw new Error(`${P.id}.md: no beats row for ${action}.png`);
  let text = P.frame.replace('[STYLE BLOCK]', P.style);
  const tail = /Action:\s*\*\*<ACTION>\*\*\s*—\s*<the 9 beats>\.?/;
  text = tail.test(text) ? text.replace(tail, `Action: ${beats}`) : `${text} Action: ${beats}`;
  if (action !== 'idle' && P.actions.includes('idle')) text += ' The figure is exactly the same size and on the same baseline as in the attached accepted idle sheet of this character.';
  if (extra.length) text += `\n\nThe previous attempt was rejected. This is mandatory and non-negotiable: ${extra.map((e) => `**${e}**`).join(' ')}`;
  return text;
}
const sheetPromptText = (P) => P.sheetPrompt.replace('[STYLE BLOCK]', P.style).replace(/Save as `[^`]+`\.?/, '').trim() + `\n\nCharacter card:\n${P.card}`;
const cardPromptText = (P) => P.cardPrompt.replace('[STYLE BLOCK]', P.style);

// ---- image providers ----
async function refPart(path) {
  // webp refs go over as png; anything larger than 2048 on a side is downsampled (nearest) to keep requests small
  let s = sharp(path); const m = await s.metadata();
  if (Math.max(m.width, m.height) > 2048) s = s.resize({ width: 2048, height: 2048, fit: 'inside', kernel: 'nearest' });
  return { name: basename(path).replace(/\.\w+$/, '.png'), buf: await s.png().toBuffer() };
}

async function fetchRetry(url, init, tries = 4) {
  for (let i = 0; ; i++) {
    const r = await fetch(url, init);
    if (r.ok) return r;
    const body = await r.text();
    const retry = r.status === 429 || r.status >= 500;
    if (!retry || i >= tries - 1) throw new Error(`HTTP ${r.status}: ${body.slice(0, 400)}`);
    await sleep(2000 * 2 ** i);
  }
}

/** kind: 'action' (square, transparent) | 'sheet' (2:1) | 'card' (square, transparent) → PNG Buffer */
async function generateOpenAI(prompt, refs, kind) {
  if (!OPENAI_KEY) throw new Error('OPENAI_API_KEY not set');
  // GPT Image 2.5 takes custom WIDTHxHEIGHT (multiples of 16, ≤ 4K pixels): the standard's 2048² with a real
  // alpha channel, straight from the model — intake then has nothing to key or resample
  const is25 = /gpt-image-2/.test(OPENAI_IMAGE_MODEL);
  const size = kind === 'sheet' ? (is25 ? '2048x1024' : '1536x1024') : (is25 ? '2048x2048' : '1024x1024');
  const call = async (fidelity) => {
    const fd = new FormData();
    fd.append('model', OPENAI_IMAGE_MODEL); fd.append('prompt', prompt); fd.append('n', '1');
    fd.append('size', size); fd.append('quality', is25 ? OPTS.quality : 'high'); fd.append('output_format', 'png'); fd.append('background', 'transparent');
    if (fidelity) fd.append('input_fidelity', 'high'); // older models only; dropped if refused
    for (const r of refs) fd.append('image[]', new Blob([r.buf], { type: 'image/png' }), r.name);
    return fetchRetry('https://api.openai.com/v1/images/edits', { method: 'POST', headers: { Authorization: `Bearer ${OPENAI_KEY}` }, body: fd });
  };
  let r;
  try { r = await call(!is25); } catch (e) { if (/input_fidelity/.test(e.message)) r = await call(false); else throw e; }
  const j = await r.json();
  const b64 = j.data?.[0]?.b64_json; if (!b64) throw new Error('openai: no image in response');
  // settle the ledger on the real usage when the API reports it
  const u = j.usage; const usd = u ? ((u.output_tokens || 0) * 30 + (u.input_tokens_details?.image_tokens || 0) * 8 + (u.input_tokens_details?.text_tokens || 0) * 5) / 1e6 : null;
  return { buf: Buffer.from(b64, 'base64'), usd };
}

async function generateGemini(prompt, refs, kind) {
  if (!GEMINI_KEY) throw new Error('GEMINI_API_KEY not set');
  // Gemini has no alpha channel: the matte the standard allows, and intake keys it out
  const text = `${prompt}\n\nOutput requirement: the entire background is one flat, pure magenta #FF00FF — no checkerboard, no gradient, no grid lines, no cell borders, nothing drawn on the background.`;
  const parts = [{ text }, ...refs.map((r) => ({ inlineData: { mimeType: 'image/png', data: r.buf.toString('base64') } }))];
  const call = async (withSize) => geminiCall(GEMINI_IMAGE_MODEL, { contents: [{ role: 'user', parts }], generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: kind === 'sheet' ? '2:1' : '1:1', ...(withSize ? { imageSize: '2K' } : {}) } } });
  let r;
  try { r = await call(true); } catch (e) { if (/imageSize|image_size/i.test(e.message)) r = await call(false); else throw e; }
  const j = await r.json();
  const part = j.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error(`gemini: no image in response (${JSON.stringify(j).slice(0, 300)})`);
  return { buf: Buffer.from(part.inlineData.data, 'base64'), usd: null };
}
/** One image: budget check → throttle → provider → ledger. Returns { buf, usd, seconds, provider }. */
async function generate(prompt, refs, kind, id = '_', provider = OPTS.provider) {
  const est = estimateCost(provider, kind, refs.length);
  assertBudget(id, est);
  const t0 = Date.now();
  const out = await throttled(provider, () => (provider === 'gemini' ? generateGemini : generateOpenAI)(prompt, refs, kind));
  const usd = out.usd ?? est; charge(id, usd);
  return { buf: out.buf, usd, seconds: (Date.now() - t0) / 1000, provider };
}

// ---- vision judge: the checks the gate cannot make ----
function judgeChecklist(P, action) {
  const base = [
    `Identity: the same character as in the character sheet (image 1) in every frame — same face, hair, costume, colours and props; no accessory appears or disappears (e.g. sunglasses), no palette shift.`,
    `Every frame is a solid, fully drawn figure facing right; no semi-transparent or motion-blurred ghost frame; no floor, ground shadow or scenery.`,
  ];
  const per = {
    walk: `Stride: across the 9 frames BOTH legs lead at least once — in some frames the near leg is in front, in others the far leg is. Nine variations of one lunge with the same leg forward is a FAIL.`,
    approach: `Stride: across the 9 frames BOTH legs lead at least once. The same leg in front in every frame is a FAIL.`,
    run: `Gait: the cycle visibly passes through gathered → stretched → landing → gathered; nine variations of one running pose is a FAIL.`,
    dash: `Frames 3–7: the legs cycle (one leg driving, legs passing, the other leg driving). The same sprint pose repeated in frames 3–7 is a FAIL.`,
    defeat: `Frames 8 and 9: the figure lies flat in the same position in both, but they are two different drawings (a small settle) — not identical, and not shrunk compared with the standing frames.`,
    knockdown: `Frames 3–6 on the floor with frame 6 the flattest; frame 9 standing at full height.`,
    getup: `Frame 1 is the lowest (flat on the floor); the figure rises monotonically to frame 9 standing at full height; it never dips first.`,
    knockback: `At least one frame lies flat on the floor by frame 6 or 7.`,
    idle: `All 9 frames are one stance breathing — no attack, fall or crouch spliced in; same height throughout.`,
    block: `Frame 1 is a held guard at full height, feet planted.`,
    guard: `Every frame is a braced, upright stance on the feet — never a tumble or a crouch.`,
  };
  return [...base, ...(per[action] ? [per[action]] : [])];
}
async function judge(P, kind, imgPath, action) {
  if (!OPTS.judge) return { pass: true, problems: [] };
  const checklist = kind === 'sheet'
    ? [`This is meant to be a character design sheet (front, three-quarter, side, head close-up, palette swatches) of the character described in the card below, in one clean pixel-art style. It must be recognisably the same character as the identity reference image(s) that follow it: same face, hair, costume, colours and props, palette matching the card. Views must have identical proportions.\n\nCard:\n${P.card}`]
    : judgeChecklist(P, action);
  const text = `You are the art reviewer for a pixel-art fighting game. Image 1 is ${kind === 'sheet' ? 'the candidate character sheet' : `the character sheet (the identity reference)`}; ${kind === 'sheet' ? 'the following images are the identity references' : 'image 2 is a 3×3 animation sheet of 9 frames read left to right, top to bottom, for the action "' + action + '"'}.\nCheck ONLY these points, strictly:\n${checklist.map((c, i) => `${i + 1}. ${c}`).join('\n')}\n\nAnswer with JSON only: {"pass": true|false, "problems": ["one short sentence per failed point, naming the frame numbers"]}. Pass only if every point holds.`;
  const imgs = kind === 'sheet' ? [imgPath, ...P.attach] : [...(existsSync(P.sheetPath) ? [P.sheetPath] : P.attach.slice(0, 1)), imgPath];
  const parts = [];
  for (const p of imgs) parts.push((await sharp(p).resize({ width: 1024, height: 1024, fit: 'inside', kernel: 'nearest' }).flatten({ background: '#7f7f7f' }).png().toBuffer()).toString('base64'));
  try {
    let out;
    if (GEMINI_KEY) {
      const r = await geminiCall(GEMINI_JUDGE_MODEL, { contents: [{ role: 'user', parts: [{ text }, ...parts.map((d) => ({ inlineData: { mimeType: 'image/png', data: d } }))] }], generationConfig: { responseMimeType: 'application/json', temperature: 0 } });
      out = (await r.json()).candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('') || '';
    } else if (OPENAI_KEY) {
      const r = await fetchRetry('https://api.openai.com/v1/responses', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
        body: JSON.stringify({ model: OPENAI_JUDGE_MODEL, input: [{ role: 'user', content: [{ type: 'input_text', text }, ...parts.map((d) => ({ type: 'input_image', image_url: `data:image/png;base64,${d}` }))] }] }),
      });
      const j = await r.json();
      out = j.output_text || j.output?.flatMap((o) => o.content || []).map((c) => c.text || '').join('') || '';
    } else return { pass: true, problems: [] };
    const m = out.match(/\{[\s\S]*\}/); const v = m ? JSON.parse(m[0]) : null;
    if (!v || typeof v.pass !== 'boolean') throw new Error(`unparseable judge output: ${out.slice(0, 200)}`);
    return { pass: v.pass, problems: (v.problems || []).map(String).slice(0, 4) };
  } catch (e) {
    log(P.id, `judge unavailable for ${action || kind} (${e.message.slice(0, 120)}) — accepting on the gate alone`);
    return { pass: true, problems: [] };
  }
}

// ---- gate glue ----
function intake(id, action) {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools/intake-character.mjs'), id, action], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`intake failed: ${(r.stderr || r.stdout).slice(0, 300)}`);
  return r.stdout.split('\n').find((l) => l.startsWith(`${action}.png`)) || '';
}
/** Gate failures that name this file (a missing other file is not this file's problem). */
async function gateFor(P, action) {
  const res = await verifyCharacter(P.id, { rank: P.rank });
  return (res?.fails || []).filter((f) => f.startsWith(`${action}.png`) && !/missing/.test(f)).map((f) => f.replace(new RegExp(`^${action}\\.png[^:]*:\\s*`), ''));
}
function saveAttempt(id, action, n, buf) { const d = join(ATTEMPTS, id); mkdirSync(d, { recursive: true }); writeFileSync(join(d, `${action}-${n}.png`), buf); }

// ---- one file, with retries ----
async function produceAction(P, action, refs) {
  const dest = join(ACTIONS_DIR, P.id, `${action}.png`);
  let extra = []; let spent = 0;
  for (let attempt = 1; attempt <= OPTS.maxRetries + 1; attempt++) {
    const prompt = actionPrompt(P, action, extra);
    if (OPTS.dryRun) { console.log(`\n--- ${P.id}/${action}.png (refs: ${refs.map((r) => r.name).join(', ')}) ---\n${prompt}\n`); return { ok: true, dry: true }; }
    // the last retry goes to the other provider when there is one — a different model, not the same one again
    const provider = attempt === OPTS.maxRetries + 1 && ALT_PROVIDER ? ALT_PROVIDER : OPTS.provider;
    let g;
    try { g = await generate(prompt, refs, 'action', P.id, provider); } catch (e) { if (/^BUDGET/.test(e.message)) return { ok: false, why: e.message }; log(P.id, `${action} attempt ${attempt} → API error: ${e.message.slice(0, 200)}`); if (attempt > OPTS.maxRetries) return { ok: false, why: `API: ${e.message.slice(0, 200)}` }; await sleep(3000); continue; }
    const buf = g.buf; spent += g.usd; const cost = `\$${g.usd.toFixed(3)}, ${g.seconds.toFixed(0)} s${provider !== OPTS.provider ? ', ' + provider : ''}`;
    saveAttempt(P.id, action, attempt, buf);
    mkdirSync(dirname(dest), { recursive: true }); writeFileSync(dest, buf);
    const norm = intake(P.id, action);
    const fails = await gateFor(P, action);
    let problems = fails;
    if (!fails.length) { const j = await judge(P, 'action', dest, action); if (!j.pass) problems = j.problems.map((p) => `[by eye] ${p}`); }
    if (!problems.length) { log(P.id, `${action} attempt ${attempt} → PASS (${cost}${norm ? '; ' + norm.replace(/^[^:]+:\s*/, '') : ''})`); return { ok: true, attempts: attempt, usd: spent, seconds: g.seconds }; }
    log(P.id, `${action} attempt ${attempt} → FAIL (${cost}): ${problems.join(' | ').slice(0, 300)}`);
    extra = [...new Set([...extra, ...problems.map((p) => p.replace(/^\[by eye\] /, ''))])].slice(-4);
  }
  return { ok: false, why: extra.join(' | '), attempts: OPTS.maxRetries + 1, usd: spent };
}

// ---- one character ----
const buildLock = { p: Promise.resolve() };
const serial = (fn) => { const next = buildLock.p.then(fn, fn); buildLock.p = next.catch(() => {}); return next; };

async function produceCharacter(id, only = []) {
  const P = parsePromptFile(id);
  const dir = join(ACTIONS_DIR, id);
  let todo = only.length ? only : P.actions;
  // a partial set made from this character's sheet is resumed (same sheet → same look): the files
  // the gate passes stay, the missing and failing ones are generated; without a sheet the set is redone
  let resume = false;
  if (!only.length && existsSync(P.sheetPath) && existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.png'))) {
    const res = await verifyCharacter(id, { rank: P.rank });
    const bad = new Set(P.actions.filter((a) => !res.present.includes(a) || res.fails.some((f) => f.startsWith(`${a}.png`))));
    if (bad.size < P.actions.length) { resume = true; todo = P.actions.filter((a) => bad.has(a)); if (!OPTS.dryRun) for (const a of bad) if (existsSync(join(dir, `${a}.png`))) renameSync(join(dir, `${a}.png`), join(dir, `${a}.rejected.png.bak`)); log(id, `resuming a partial set from its sheet — keeping ${P.actions.filter((a) => !bad.has(a)).join(' ')}; generating ${todo.join(' ')}`); }
  }
  for (const a of todo) if (!P.beats[a]) throw new Error(`${id}.md has no beats for ${a}`);
  log(id, `start — ${P.rank}, ${todo.length} file(s)${only.length ? ` (only: ${only.join(' ')})` : ''}, provider ${OPTS.provider}`);

  // a full set replaces whatever is there: move the old files aside so the gate never mixes deliveries
  if (!only.length && !resume && existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.png'))) {
    const aside = join(ROOT, 'public/assets/backups/replaced', `${id}-${Date.now()}`);
    if (!OPTS.dryRun) { mkdirSync(aside, { recursive: true }); for (const f of readdirSync(dir)) if (f.endsWith('.png')) renameSync(join(dir, f), join(aside, f)); }
    log(id, `moved ${readdirSync(OPTS.dryRun ? dir : aside).length} old file(s) aside → ${aside.replace(ROOT + '/', '')}`);
  }

  const quality = await refPart(QUALITY_REF);
  const identity = await Promise.all(P.attach.map(refPart));

  // Step A — the sheet (full sets that have a Step A prompt; a partial job reuses the existing sheet)
  if (!only.length && !resume && P.sheetPrompt) {
    let extra = [], ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      const prompt = sheetPromptText(P) + (extra.length ? `\n\nThe previous sheet was rejected: ${extra.map((e) => `**${e}**`).join(' ')}` : '');
      if (OPTS.dryRun) { console.log(`\n--- ${id} sheet (refs: ${[quality, ...identity].map((r) => r.name).join(', ')}) ---\n${prompt}\n`); ok = true; break; }
      try {
        const g = await generate(prompt, [quality, ...identity], 'sheet', id);
        mkdirSync(dirname(P.sheetPath), { recursive: true }); writeFileSync(P.sheetPath, g.buf);
        const j = await judge(P, 'sheet', P.sheetPath);
        if (j.pass) { ok = true; log(id, `sheet attempt ${attempt} → accepted`); } else { extra = j.problems; log(id, `sheet attempt ${attempt} → rejected: ${j.problems.join(' | ')}`); }
      } catch (e) { if (/^BUDGET/.test(e.message)) return park(id, e.message); log(id, `sheet attempt ${attempt} → API error: ${e.message.slice(0, 200)}`); }
    }
    if (!ok) { if (!existsSync(P.sheetPath)) return park(id, 'no accepted character sheet'); log(id, 'sheet: proceeding with the last one (judge kept rejecting) — review docs/refs by eye'); }
  }
  const sheet = existsSync(P.sheetPath) ? [await refPart(P.sheetPath)] : identity;

  // Step B — idle first (it fixes the size for every other file), then the rest in parallel
  const order = [...todo].sort((a, b) => (a === 'idle' ? -1 : b === 'idle' ? 1 : 0));
  const accepted = [];
  const refsFor = async (action) => {
    const r = [quality, ...sheet];
    if (action !== 'idle' && existsSync(join(dir, 'idle.png'))) r.push(await refPart(join(dir, 'idle.png')));
    else if (action !== 'idle' && only.length) for (const a of P.actions) if (a !== action && existsSync(join(dir, `${a}.png`))) { r.push(await refPart(join(dir, `${a}.png`))); break; }
    return r;
  };
  if (order[0] === 'idle') {
    const r = await produceAction(P, 'idle', await refsFor('idle'));
    if (!r.ok) return park(id, `idle: ${r.why}`);
    accepted.push('idle'); order.shift();
  }
  const failed = [];
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(OPTS.concurrency, order.length) }, async () => {
    while (i < order.length) { const a = order[i++]; const r = await produceAction(P, a, await refsFor(a)); if (r.ok) accepted.push(a); else failed.push(`${a}: ${r.why}`); }
  }));
  if (failed.length) return park(id, failed.join(' || '));

  // Step C — hero card
  if (P.cardPrompt && !only.length && !existsSync(join(ROOT, 'public/assets/generated/heroes', `${id}-card.png`))) {
    const cardPath = join(ROOT, 'public/assets/generated/heroes', `${id}-card.png`);
    const prompt = cardPromptText(P);
    if (OPTS.dryRun) console.log(`\n--- ${id} card ---\n${prompt}\n`);
    else { try { const g = await generate(prompt, [quality, ...sheet], 'card', id); mkdirSync(dirname(cardPath), { recursive: true }); writeFileSync(cardPath, g.buf); log(id, `hero card → saved (\$${g.usd.toFixed(3)})`); } catch (e) { log(id, `hero card → API error: ${e.message.slice(0, 200)} (continuing without it)`); } }
  }
  if (OPTS.dryRun) { log(id, 'dry run complete'); return { id, status: 'dry' }; }

  // whole-set gate, then build + test + commit — one character at a time
  const res = await verifyCharacter(id, { rank: P.rank });
  if (res.fails.length) return park(id, `whole-set gate: ${res.fails.slice(0, 3).join(' | ')}`);
  mkdirSync(join(ATTEMPTS, id), { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith('.rejected.png.bak')) renameSync(join(dir, f), join(ATTEMPTS, id, f));
  log(id, 'PASS — verify:character clean');
  return serial(async () => {
    for (const script of ['build:assets', 'test:assets']) {
      const r = spawnSync('npm', ['run', script], { cwd: ROOT, encoding: 'utf8' });
      if (r.status !== 0) return park(id, `${script} failed: ${(r.stderr || r.stdout).split('\n').filter(Boolean).slice(-4).join(' / ').slice(0, 400)}`);
      log(id, `${script} clean`);
    }
    if (OPTS.commit) commit(P, todo.length);
    return { id, status: 'ready' };
  });
}

function park(id, why) { log(id, `PARKED — ${why.slice(0, 600)}`); return { id, status: 'parked', why }; }

function commit(P, n) {
  const id = P.id;
  const candidates = [
    `public/assets/generated/actions/${id}`, `docs/refs/${id}-sheet.png`, `public/assets/generated/heroes/${id}-card.png`,
    `public/game/chars/${id}.json`, `public/game/chars/${id}.webp`, `public/game/chars/${id}-b.json`, `public/game/chars/${id}-b.webp`,
    `public/game/portraits/${id}.webp`, `public/game/cards/${id}.webp`, id === 'pitz' ? 'public/game/fx/pitz.webp' : null,
    'public/game/catalog.json', 'docs/prompts/QUEUE-LOG.md',
  ].filter((p) => p && existsSync(join(ROOT, p)));
  const add = spawnSync('git', ['add', '--', ...candidates], { cwd: ROOT, encoding: 'utf8' });
  if (add.status !== 0) { log(id, `git add failed: ${add.stderr.slice(0, 200)}`); return; }
  const msg = `${P.name} (${n} file${n > 1 ? 's' : ''}) regenerated by the image model passes the gate and is built in`;
  const c = spawnSync('git', ['commit', '-q', '-m', msg], { cwd: ROOT, encoding: 'utf8' });
  if (c.status !== 0) log(id, `git commit failed: ${(c.stderr || c.stdout).slice(0, 200)}`);
  else log(id, `committed: ${spawnSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim()} ${msg}`);
}

// ---- --smoke: prove the provider works before touching the queue ----
async function smoke() {
  const prompt = 'Pixel-art sprite of a small orange tabby cat sitting, facing right, clean dark outlines, cel shading, on a flat pure magenta #FF00FF background. No text.';
  const refs = [await refPart(QUALITY_REF)];
  const out = join(ATTEMPTS, '_smoke'); mkdirSync(out, { recursive: true });
  const t0 = Date.now();
  const g = await generate(prompt, refs, 'action', '_smoke');
  const m = await sharp(g.buf).metadata();
  const file = join(out, `${OPTS.provider}-${Date.now()}.png`); writeFileSync(file, g.buf);
  console.log(`${OPTS.provider} (${OPTS.provider === 'gpt' ? OPENAI_IMAGE_MODEL : GEMINI_IMAGE_MODEL}) image OK — ${m.width}×${m.height}, ${m.channels} channels, alpha ${m.hasAlpha}, ${g.seconds.toFixed(0)} s, \$${g.usd.toFixed(3)} → ${file.replace(ROOT + '/', '')}`);
  if (OPTS.judge && (GEMINI_KEY || OPENAI_KEY)) {
    const P = { id: 'smoke', card: 'a small orange tabby cat', attach: [], sheetPath: QUALITY_REF };
    const j = await judge(P, 'action', file, 'idle');
    console.log(`judge OK — answered ${JSON.stringify(j)}`);
  }
}

// ---- --bench <id>: the same character on every configured provider, scored ----
async function bench(id) {
  const base = parsePromptFile(id);
  const providers = [OPTS.provider, ALT_PROVIDER].filter(Boolean);
  if (providers.length < 2) console.log('only one provider has a key — benchmarking it alone');
  const files = ['idle', base.actions.includes('walk') ? 'walk' : base.actions.includes('approach') ? 'approach' : base.actions[1]];
  const quality = await refPart(QUALITY_REF); const identity = await Promise.all(base.attach.map(refPart));
  const rows = [];
  for (const provider of providers) {
    const saved = OPTS.provider; OPTS.provider = provider;
    const tmp = `bench-${id}-${provider}`; const dir = join(ACTIONS_DIR, tmp); mkdirSync(dir, { recursive: true });
    const keep = join(ROOT, 'public/assets/backups/bench', id, provider); mkdirSync(keep, { recursive: true });
    const P = { ...base, id: tmp, sheetPath: join(keep, 'sheet.png') };
    const row = { provider, model: provider === 'gpt' ? `${OPENAI_IMAGE_MODEL} ${OPTS.quality}` : GEMINI_IMAGE_MODEL, sheet: '—', files: {}, usd: 0, seconds: 0 };
    try {
      if (base.sheetPrompt) {
        const g = await generate(sheetPromptText(base), [quality, ...identity], 'sheet', tmp); writeFileSync(P.sheetPath, g.buf); row.usd += g.usd; row.seconds += g.seconds;
        const j = await judge(P, 'sheet', P.sheetPath); row.sheet = j.pass ? `ok (${g.seconds.toFixed(0)} s)` : `judge: ${j.problems.join('; ').slice(0, 80)}`;
      }
      const sheetRef = existsSync(P.sheetPath) ? [await refPart(P.sheetPath)] : identity;
      for (const a of files) {
        const refs = [quality, ...sheetRef, ...(a !== 'idle' && existsSync(join(dir, 'idle.png')) ? [await refPart(join(dir, 'idle.png'))] : [])];
        const r = await produceAction(P, a, refs);
        row.files[a] = r.ok ? `PASS in ${r.attempts} attempt${r.attempts > 1 ? 's' : ''}` : `FAIL after ${r.attempts}: ${(r.why || '').slice(0, 90)}`;
        row.usd += r.usd || 0; row.seconds += r.seconds || 0;
        if (existsSync(join(dir, `${a}.png`))) copyFileSync(join(dir, `${a}.png`), join(keep, `${a}.png`));
      }
    } catch (e) { row.error = e.message.slice(0, 200); }
    rows.push(row); OPTS.provider = saved;
    for (const f of readdirSync(dir)) renameSync(join(dir, f), join(keep, f)); // nothing bench-made stays under actions/
    try { require_rm(dir); } catch {}
  }
  const md = `## ${new Date().toISOString().slice(0, 16)} — ${id}\n\n| provider | model | sheet | ${files.join(' | ')} | spend | model time |\n|---|---|---|${files.map(() => '---').join('|')}|---|---|\n${rows.map((r) => `| ${r.provider} | ${r.model} | ${r.sheet} | ${files.map((f) => r.files[f] || (r.error ? 'error: ' + r.error : '—')).join(' | ')} | \$${r.usd.toFixed(2)} | ${r.seconds.toFixed(0)} s |`).join('\n')}\n\nFiles under public/assets/backups/bench/${id}/<provider>/ — compare by eye on top of the numbers.\n\n`;
  const out = join(PROMPTS_DIR, 'BENCH.md'); appendFileSync(out, (existsSync(out) ? '' : '# Provider benchmark — same character, same prompts, every configured provider\n\n') + md);
  console.log(md);
}
function require_rm(dir) { rmSync(dir, { recursive: true, force: true }); }

// ---- main ----
async function main() {
  if (OPTS.bench) { await bench(OPTS.bench); return; }
  if (flag('smoke')) { await smoke(); return; }
  if (!OPTS.dryRun) {
    if (OPTS.provider === 'gemini' && !GEMINI_KEY) { console.error('GEMINI_API_KEY (or GOOGLE_API_KEY) is not set'); process.exit(2); }
    if (OPTS.provider === 'gpt' && !OPENAI_KEY) { console.error('OPENAI_API_KEY is not set'); process.exit(2); }
    if (!existsSync(LOG)) writeFileSync(LOG, '# Queue log — one line per request, written by tools/art-pipeline.mjs\n\n');
    appendFileSync(LOG, `\n## ${new Date().toISOString()} — ${OPTS.queue ? 'queue' : ID}${ONLY.length ? ` (only ${ONLY.join(' ')})` : ''} · provider ${OPTS.provider}\n\n`);
  }
  const jobs = OPTS.queue ? readQueue() : [{ id: ID, only: ONLY }];
  if (OPTS.queue) {
    // a character already READY with nothing named as outstanding needs no work
    const keep = [];
    for (const j of jobs) {
      if (j.only.length) { keep.push(j); continue; }
      const P = parsePromptFile(j.id); const res = await verifyCharacter(j.id, { rank: P.rank });
      if (res && !res.fails.length && P.actions.every((a) => res.present.includes(a))) log(j.id, 'already READY — skipped'); else keep.push(j);
    }
    jobs.splice(0, jobs.length, ...keep);
  }
  console.log(`${jobs.length} job(s): ${jobs.map((j) => j.id + (j.only.length ? `[${j.only.join(',')}]` : '')).join(' → ')}${OPTS.dryRun ? '  (dry run)' : ''}`);
  console.log(`provider ${OPTS.provider} (${OPTS.provider === 'gpt' ? OPENAI_IMAGE_MODEL + ' ' + OPTS.quality : GEMINI_IMAGE_MODEL}); alternate for last retries: ${ALT_PROVIDER || 'none'}; budget \$${OPTS.budget} run / \$${OPTS.charBudget} per character; ledger so far \$${ledger.total.toFixed(2)}`);
  const results = []; let k = 0;
  await Promise.all(Array.from({ length: Math.min(OPTS.queue ? OPTS.parallel : 1, jobs.length) }, async () => {
    while (k < jobs.length) { const j = jobs[k++]; try { results.push(await produceCharacter(j.id, j.only)); } catch (e) { results.push(park(j.id, e.message)); } }
  }));
  const ready = results.filter((r) => r.status === 'ready').map((r) => r.id);
  const parked = results.filter((r) => r.status === 'parked');
  const summary = `done — ready: ${ready.join(', ') || 'none'}; parked: ${parked.map((p) => p.id).join(', ') || 'none'}; spent \$${run.spent.toFixed(2)} in ${run.requests} requests (ledger total \$${ledger.total.toFixed(2)})`;
  console.log(`\n${summary}`); for (const p of parked) console.log(`  ${p.id}: ${p.why}`);
  if (!OPTS.dryRun) {
    appendFileSync(LOG, `\n**${summary}**\n${parked.map((p) => `- ${p.id}: ${p.why}\n`).join('')}\n`);
    spawnSync('osascript', ['-e', `display notification ${JSON.stringify(summary.slice(0, 200))} with title "Nepho art pipeline"`]);
    if (process.platform === 'darwin') spawnSync('afplay', ['/System/Library/Sounds/Glass.aiff']);
  }
  process.exit(parked.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(1); });
