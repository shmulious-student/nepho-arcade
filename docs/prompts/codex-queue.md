# Codex — legacy 09/14 queue (one image at a time)

You are working in `/Users/shmuelvachnish-mbpr/Projects/GitHub/Nepho`, branch `game/core`. Your job is to
regenerate exactly the ten legacy sprite sets in the new queue order. Run unattended, one image
request at a time, with a relaxed single-file queue. There are **no retries**: save the first delivery,
intake it, then flag any gate or visual failure for Claude in `docs/prompts/queue_log_091426.md` and
continue to the next request. Claude owns all verification and any repair; only act on a later explicit
Claude instruction. Work only `railmaw`, `crown-runner`, `the-null`, `vault-mother`, `ultra-signal`,
`brawler`, `knight`, `chainer`, `kicker`, and `shield` — five 7-request boss sets followed by five
11-request enemy sets.
Read these first, in this order, and do not start generating before you have:

1. `docs/character-art-standard.md` — the contract: format, anchor, margins, the 9 beats per action, the
   gate, and the failure catalogue (why every rule exists).
2. `docs/prompts/README.md` — the queue, ordered least work → most work. Work it top to bottom.
3. `docs/prompts/<id>.md` for the character you are on — its Status block (what is outstanding and the
   gate's exact output), character card, STYLE BLOCK, FRAME BLOCK, the beats per file, and the Accept
   commands. Every prompt you send is assembled from this file; do not improvise designs.

## Previous queue history (2026-09-13, 11:20)

A previous session of yours ran part of this queue. Its log is `docs/prompts/QUEUE-LOG.md` — keep
appending to it. Its outcomes, already verified on disk:

- **shmuel** — done. `walk` and `dash` were redelivered and pass; not in the queue any more.
- **glass-warden** — 4 of 6 files pass (`idle approach attack special`) from the sheet at
  `docs/refs/glass-warden-sheet.png`. **Do not redo them.** Generate `hurt` and `defeat` from the same
  sheet, attaching `idle.png` as the size reference, then run the whole-set gate.
- **pitz** `run.png` — parked after 3 attempts, every one on the same failure: the cat is placed at a
  different height in each row of the grid (paw line ~640 px in the top row, ~530 px in the bottom
  row). The other two files pass. It is first in the queue and it must land — see "when a file keeps
  failing" below.
- The first `glass-warden/idle` attempt failed with "canvas must be a square power of two" because
  **intake was skipped**. Intake runs after every save, before every verify, no exceptions.

## Hard rules

- **One image request in flight at a time. Never run two generations in parallel**, never batch two
  actions into one image, never move to the next request before the current file has been saved,
  intaken and verified.
- **Every frame is generated art.** You may not cut, zoom, copy, mirror, blend, interpolate, inpaint by
  script, or otherwise fabricate any frame or file from other frames, from the old grids, or from the
  reference sheet. No script touches the pixels inside a delivered file. The only pixel tool you run
  is `npm run intake:character` (container normalization) — nothing else, not even to "fix one cell".
  If you have no image-generation tool available, stop and say so; do not produce images any other way.
- **Never edit the gate, the intake, or the build to make something pass**
  (`tools/verify-character.mjs`, `tools/intake-character.mjs`, `tools/asset-ops.mjs`,
  `tools/build-assets.mjs`, `tools/check-assets.mjs`). If the gate is wrong, log it and move on.
- Do not edit the prompt files' cards, blocks or beats. You may append a short `## Log` section at the
  bottom of a character's file recording what needed a retry and which bolded rule fixed it.
- Do not touch `public/game/roster.json` — roster placement is done by the owner in `/backoffice.html`.
- Do not stage or commit anything outside the paths listed under "Commit" below; the working tree has
  unrelated work in progress.

## Per character

1. Read `docs/prompts/<id>.md` fully. Note the rank, the number of files, the identity references to
   attach and any special instructions in its Status block (Nepho: delete the four old files in
   `public/assets/generated/actions/nepho/` first; Pitz: only `run.png`, baseline rule bolded; Shmuel: only `dash.png`, leg-cycle rule bolded).
2. Keep the whole character in **one generation session** so the design does not drift between files.
3. **Step A — character sheet** (legacy characters and the two heroes): one request, 2048×1024 (or the
   largest the tool makes), transparent, from the file's Step A prompt, with
   `public/assets/references/hero-grid-quality-reference.png` and the identity reference(s) attached.
   Save it to `docs/refs/<id>-sheet.png`. Look at it: same character as the identity reference, palette
   from the card, one clean render style. If not, regenerate the sheet once with the drift named; do not
   proceed to actions on a sheet you would not sign off.
4. **Step B — one action per request**, in the order the file lists them. Each request is: the FRAME
   BLOCK verbatim with the STYLE BLOCK inlined where `[STYLE BLOCK]` appears, then
   `Action: **<action>** — <that file's 9 beats, verbatim from the table>`. Attach the quality
   reference, the character sheet, and — from the second action on — the first accepted action file
   (`idle.png`) as the size reference. Ask for 2048×2048 with a real alpha channel; if the tool cannot
   do 2048, take its largest square; if it cannot do alpha, ask for a flat pure magenta `#FF00FF`
   background and **never grid lines or cell borders**. Save as
   `public/assets/generated/actions/<id>/<action>.png`.
5. After **every** file:
   ```bash
   npm run intake:character -- <id> <action>
   npm run verify:character -- <id>
   ```
   Ignore "missing" failures for files you have not generated yet. Any other FAIL naming the file you
   just made: regenerate **only that file**, same session, with the offending rule repeated and
   **bolded** at the end of the prompt (use the gate's wording). Up to **3 retries per file**. If a file
   still fails after 3 retries, park the character *for now*: log it, leave what passed in place, move
   on to the next character — and **come back to it after the queue is exhausted, with a different
   approach** (below). Parking is a postponement, never an end state.
6. **By-eye checks the gate cannot do** — open the PNG and look before accepting:
   - `walk` (and `approach`, `run`): both legs lead once per loop — not one lunge repeated with small
     variations. `dash` 3–7: the legs cycle, not one sprint pose repeated.
   - identity: same face, costume, palette and props as the sheet in every file.
   - `defeat` 8–9: the same lying position, but two visibly different drawn frames (the gate rejects
     identical cells).
   A file that fails by eye is regenerated like a gate failure, with the rule bolded.
7. When the gate prints `PASS` for the whole set:
   ```bash
   npm run build:assets && npm run test:assets
   ```
   Both must be clean. Then **commit** that character alone (see below) and append a line to the log.

## When a file keeps failing (the same gate line 3 times)

The prompt is not the problem any more; change the approach, one step at a time, and log which one:

1. **Split the request's attention.** Put the failing rule first, alone, in its own sentence at the top
   of the prompt, bolded, before the FRAME BLOCK — then the block, then the beats.
2. **Change the references.** Attach the last *accepted* file of this character (its `idle.png`, or for
   pitz `leap.png`) and say "match the placement of the figure in each cell of the attached sheet
   exactly — same baseline, same size, same centre".
3. **Ask for the grid explicitly as a layout.** "Nine cells of equal size in three rows; in every cell
   the figure stands on the same invisible horizontal line, one third of the way up from the cell's
   bottom edge; the figure is horizontally centred in its cell."
4. **Regenerate the file at a different aspect of the model** — a different seed/variation, or, if
   your tool offers more than one image model, the other model. Same prompt, same references.
5. Only after all four: regenerate the *sheet* (Step A) and the file together in a fresh session.

Never, at any step, fix pixels by script: no shifting cells, no re-slicing, no compositing. The fix
is always a regenerated image.

## Commit (after each character passes and builds)

Stage only these paths, then commit:

```
public/assets/generated/actions/<id>/
public/assets/backups/intake/<id>/
docs/refs/<id>-sheet.png                 (if made)
public/assets/generated/heroes/<id>-card.png   (heroes only)
public/game/chars/<id>.json public/game/chars/<id>.webp
public/game/chars/<id>-b.json public/game/chars/<id>-b.webp   (brawler, knight — the palette variant)
public/game/portraits/<id>.webp          (bosses)
public/game/cards/<id>.webp              (heroes)
public/game/fx/pitz.webp                 (pitz)
public/game/catalog.json
docs/prompts/<id>.md
docs/prompts/QUEUE-LOG.md
```

Message: `<Name> (<n> files) regenerated by the image model passes the gate and is built in`. Plain
message, no trailers, no co-author lines. Never `git add -A`, never commit unrelated modified files.

## Progress log

Keep `docs/prompts/QUEUE-LOG.md` (create it): one line per request —
`<HH:MM> <id> <sheet|action|card> attempt <n> → <PASS | FAIL: gate line | parked>` — and one line per
character when it is committed. This is how the owner follows progress; keep it current after every
request, not at the end.

## Order and stopping condition

The queue in `docs/prompts/README.md` is the order: pitz `run` (1 request) → glass-warden `hurt` +
`defeat` (2) → the eight remaining legacy bosses in level order (7 each) → the five legacy enemies
(11 each) → nepho (14) → byte (14) — about 145 requests on a clean run, plus retries. Keep moving:
do not polish a passing file, do not stop to ask about anything the standard or the prompt file
already answers, do not summarise progress to the owner mid-run — the log is the progress report.

**You are finished only when `npm run readiness` prints every one of these as READY:** pitz (the
build prints `fx pitz ok (actions)`), glass-warden, kilnheart, monk-zero, market-king, railmaw,
crown-runner, the-null, vault-mother, ultra-signal, brawler, knight, chainer, kicker, shield, nepho,
byte. A parked character is not finished. Loop: queue → parked characters with the escalation above →
readiness → repeat until the list is clean.

## Finish

When `npm run readiness` is clean for the whole list, report: the readiness table, the number of
requests per character (from the log), anything that needed the escalation ladder and which step
fixed it, and the list of commits made. Do not push. If you are genuinely blocked by something outside
your control (the image tool is down, the repo's gate crashes), say exactly what and stop — that is
the only reason to stop early.
