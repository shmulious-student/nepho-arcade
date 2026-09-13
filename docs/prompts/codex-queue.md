# Codex — run the character-art regeneration queue (one image at a time)

You are working in `/Users/shmuelvachnish-mbpr/Projects/GitHub/Nepho`, branch `game/core`. Your job today is to
regenerate every character sprite set that still needs art, in queue order, until `npm run readiness`
shows every enemy and boss READY, plus the fixes listed. Everything you need is in the repo — read
these first, in this order, and do not start generating before you have:

1. `docs/character-art-standard.md` — the contract: format, anchor, margins, the 9 beats per action, the
   gate, and the failure catalogue (why every rule exists).
2. `docs/prompts/README.md` — the queue, ordered least work → most work. Work it top to bottom.
3. `docs/prompts/<id>.md` for the character you are on — its Status block (what is outstanding and the
   gate's exact output), character card, STYLE BLOCK, FRAME BLOCK, the beats per file, and the Accept
   commands. Every prompt you send is assembled from this file; do not improvise designs.

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
   still fails after 3 retries, park the character: log it, leave what passed in place, and move on to
   the next character in the queue. Come back to parked characters after the queue is exhausted.
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

## Order and budget

The queue in `docs/prompts/README.md` is the order: pitz `run` (1 request) → shmuel `dash` (1) → the nine legacy
bosses in level order (7 each) → the five legacy enemies (11 each) → nepho (14) → byte (14) —
148 requests on a clean run, plus retries. The deadline is the end of today: keep moving, do not
polish a passing file, do not stop to ask about anything the standard or the prompt file already
answers. The two heroes are last on purpose; if the day runs out, they are what slips — every enemy
and boss must be done.

## Finish

When the queue is exhausted (and parked characters retried once more), run `npm run readiness` and
report: the readiness table, which characters were parked and the exact gate line that blocked them,
and the list of commits made. Do not push.
