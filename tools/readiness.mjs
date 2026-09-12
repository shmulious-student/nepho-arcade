// Readiness of every character in the runtime pack against docs/character-art-standard.md — what the
// backoffice shows next to each card and what its "ready only" auto-roster is built from.
//
//   node tools/readiness.mjs          prints the table
//
// Per character: 'ready' (a complete per-action set that passes the gate), 'failed' (a set exists
// but the gate rejects it — the failures are listed), or 'legacy' (no per-action set; the old grid
// ships, and the character needs a full set from docs/prompts/<id>.md). A palette variant follows
// its base.
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { verifyCharacter, ACTIONS } from './verify-character.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ACTIONS_DIR = join(ROOT, 'public/assets/generated/actions');

/** A cheap fingerprint of one set: file count, sizes and newest mtime — enough to know it changed. */
export function fingerprint(id) {
  const dir = join(ACTIONS_DIR, id);
  if (!existsSync(dir)) return 'none';
  const files = readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
  return files.map((f) => { const st = statSync(join(dir, f)); return `${f}:${st.size}:${Math.round(st.mtimeMs)}`; }).join('|') || 'empty';
}

/** `cache` (optional, mutable) keeps { [id]: { fp, res } } so an unchanged set is not re-verified —
 * a full pass over the roster takes ~40 s, a cached one is instant. */
export async function readiness(cache = null) {
  const catalog = JSON.parse(readFileSync(join(ROOT, 'public/game/catalog.json'), 'utf8'));
  const out = {};
  const bases = Object.values(catalog.characters).filter((c) => !c.variantOf);
  for (const c of bases) {
    const fp = fingerprint(c.id);
    let res;
    if (cache && cache[c.id] && cache[c.id].fp === fp) res = cache[c.id].res;
    else { res = await verifyCharacter(c.id, { rank: c.kind }); if (cache) cache[c.id] = { fp, res }; }
    const need = ACTIONS[c.kind];
    if (!res) {
      out[c.id] = { status: 'legacy', rank: c.kind, present: 0, need: need.length, fails: [], missing: need, prompt: `docs/prompts/${c.id}.md`, summary: `no per-action set — needs all ${need.length} files` };
      continue;
    }
    const missing = need.filter((a) => !res.present.includes(a));
    const files = [...new Set(res.fails.map((f) => (f.match(/^([a-z0-9]+)\.png/) || [])[1]).filter(Boolean))];
    out[c.id] = {
      status: res.fails.length ? 'failed' : 'ready', rank: c.kind, present: res.present.length, need: need.length,
      fails: res.fails, missing, files, prompt: `docs/prompts/${c.id}.md`,
      summary: res.fails.length ? `${res.fails.length} failure(s) in ${files.join(', ') || 'the set'}${missing.length ? `; missing ${missing.join(', ')}` : ''}` : `passes — ${res.present.length}/${need.length} files`,
    };
  }
  for (const c of Object.values(catalog.characters)) if (c.variantOf && out[c.variantOf]) out[c.id] = { ...out[c.variantOf], variantOf: c.variantOf, summary: `follows ${c.variantOf} (${out[c.variantOf].status})` };
  return { checkedAt: new Date().toISOString(), characters: out };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const r = await readiness();
  const pad = (s, n) => String(s).padEnd(n);
  for (const status of ['ready', 'failed', 'legacy']) {
    const rows = Object.entries(r.characters).filter(([, v]) => v.status === status && !v.variantOf);
    if (!rows.length) continue;
    console.log(`\n${status.toUpperCase()} (${rows.length})`);
    for (const [id, v] of rows) console.log(`  ${pad(id, 16)} ${pad(v.rank, 6)} ${v.summary}`);
  }
}
