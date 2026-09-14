# Legacy art queue — 2026-09-14

Claude is the verification and repair owner for this queue. Codex generates one image at a time in
the listed order, runs container intake only, and never retries. A generation or gate failure is
recorded here as `CLAUDE REVIEW REQUIRED`; Claude either repairs it or writes an explicit delegation
for Codex below the relevant item.

## Queue

| order | id | rank | requests | roster target | status |
|---:|---|---|---:|---|---|
| 1 | railmaw | boss | 7 | level 6 | Claude review required |
| 2 | crown-runner | boss | 7 | level 7 | Claude review required |
| 3 | the-null | boss | 7 | level 8 | Claude review required |
| 4 | vault-mother | boss | 7 | level 9 | Claude review required |
| 5 | ultra-signal | boss | 7 | level 10 | pending |
| 6 | brawler | enemy | 11 | levels 3–5 | pending |
| 7 | knight | enemy | 11 | levels 5–7 | pending |
| 8 | chainer | enemy | 11 | levels 2–4 | pending |
| 9 | kicker | enemy | 11 | levels 4–6 | pending |
| 10 | shield | enemy | 11 | levels 6–10 | pending |

## Live events

Append-only format:

`<timestamp> <id> <sheet|action> <file> → GENERATED | INTAKEN | CLAUDE REVIEW REQUIRED: <reason> | CLAUDE DELEGATION: <specific work>`

2026-09-14 queue created → 90 requests pending; single-file queue; retries disabled.

09:51 railmaw sheet → CLAUDE REVIEW REQUIRED: configured Gemini provider rejected the required 2:1 sheet aspect ratio before generating an image (HTTP 400); queue stopped.

09:51 crown-runner sheet → CLAUDE REVIEW REQUIRED: configured Gemini provider rejected the required 2:1 sheet aspect ratio before generating an image (HTTP 400); no image saved.

09:51 the-null sheet → CLAUDE REVIEW REQUIRED: configured Gemini provider rejected the required 2:1 sheet aspect ratio before generating an image (HTTP 400); no image saved.

09:51 vault-mother sheet → CLAUDE REVIEW REQUIRED: configured Gemini provider rejected the required 2:1 sheet aspect ratio before generating an image (HTTP 400); no image saved.

09:51 queue halted → CLAUDE REVIEW REQUIRED: select a provider or sheet format that supports the character-sheet request, then explicitly delegate the restart. No generated asset was changed.

09:54 railmaw sheet railmaw-sheet.png → GENERATED; saved for Claude verification.

09:56 railmaw action idle.png → GENERATED; INTAKEN; Claude verification pending.

10:10 railmaw action approach.png → GENERATED; INTAKEN; Claude verification pending.

10:21 railmaw action attack.png → GENERATED; INTAKEN; Claude verification pending.

10:33 railmaw action special.png → GENERATED; INTAKEN; Claude verification pending.

10:35 railmaw action hurt.png → GENERATED; INTAKEN; Claude verification pending.

10:47 railmaw action defeat.png → GENERATED; INTAKEN; Claude verification pending. Railmaw's seven requested images are complete; Claude must verify before any build or roster-art readiness change.

10:58 crown-runner sheet crown-runner-sheet.png → GENERATED; saved for Claude verification.

11:10 crown-runner action idle.png → GENERATED; INTAKEN; Claude verification pending.

11:21 crown-runner action approach.png → GENERATED; INTAKEN; Claude verification pending.

11:33 crown-runner action attack.png → GENERATED; INTAKEN; Claude verification pending.

11:44 crown-runner action special.png → GENERATED; INTAKEN; Claude verification pending.

11:55 crown-runner action hurt.png → GENERATED; INTAKEN; Claude verification pending.

12:07 crown-runner action defeat.png → GENERATED; INTAKEN; Claude verification pending. Crown Runner's seven requested images are complete; Claude must verify before any build or roster-art readiness change.

12:19 the-null sheet the-null-sheet.png → GENERATED; saved for Claude verification.

12:30 the-null action idle.png → GENERATED; INTAKEN; Claude verification pending.

12:42 the-null action approach.png → GENERATED; INTAKEN; Claude verification pending.

12:53 the-null action attack.png → GENERATED; INTAKEN; Claude verification pending.

13:05 the-null action special.png → GENERATED; INTAKEN; Claude verification pending.

13:17 the-null action hurt.png → GENERATED; INTAKEN; Claude verification pending.

13:29 the-null action defeat.png → GENERATED; INTAKEN; Claude verification pending. The Null's seven requested images are complete; Claude must verify before any build or roster-art readiness change.

## 2026-09-14T07:51:33.779Z — railmaw · provider gemini

- `09:51:33 railmaw         start — boss, 6 file(s), provider gemini`
- `09:51:34 railmaw         sheet attempt 1 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:35 railmaw         sheet attempt 2 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:35 railmaw         PARKED — no accepted character sheet`

**done — ready: none; parked: railmaw; spent $0.00 in 0 requests (ledger total $0.00)**
- railmaw: no accepted character sheet


## 2026-09-14T07:51:37.931Z — crown-runner · provider gemini

- `09:51:37 crown-runner    start — boss, 6 file(s), provider gemini`
- `09:51:38 crown-runner    sheet attempt 1 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:38 crown-runner    sheet attempt 2 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:38 crown-runner    PARKED — no accepted character sheet`

**done — ready: none; parked: crown-runner; spent $0.00 in 0 requests (ledger total $0.00)**
- crown-runner: no accepted character sheet


## 2026-09-14T07:51:41.526Z — the-null · provider gemini

- `09:51:41 the-null        start — boss, 6 file(s), provider gemini`
- `09:51:42 the-null        sheet attempt 1 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:42 the-null        sheet attempt 2 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:42 the-null        PARKED — no accepted character sheet`

**done — ready: none; parked: the-null; spent $0.00 in 0 requests (ledger total $0.00)**
- the-null: no accepted character sheet


## 2026-09-14T07:51:45.336Z — vault-mother · provider gemini

- `09:51:45 vault-mother    start — boss, 6 file(s), provider gemini`
- `09:51:45 vault-mother    sheet attempt 1 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:46 vault-mother    sheet attempt 2 → API error: HTTP 400: {
  "error": {
    "code": 400,
    "message": "* GenerateContentRequest.generation_config.image_config.aspect_ratio: aspect_ratio must be one of '1:1', '1:4', '1:8', '2:3', '3:2', '3:4', '4`
- `09:51:46 vault-mother    PARKED — no accepted character sheet`

**done — ready: none; parked: vault-mother; spent $0.00 in 0 requests (ledger total $0.00)**
- vault-mother: no accepted character sheet

## CLAUDE — 09:55 fix for the five PARKED bosses

- Cause: `tools/art-pipeline.mjs` sent `aspectRatio: '2:1'` for the Step A sheet; the Gemini image API only accepts 1:1, 1:4, 1:8, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9 (and 4:1/8:1). Nothing was generated; $0 spent.
- Fixed and committed (`art-pipeline: Gemini image requests ask for a 16:9 sheet`): the sheet is now requested at 16:9; action files stay 1:1. `--dry-run` passes.
- **CLAUDE DELEGATION → Codex:** re-run the five bosses from the top with the same command as before (`node tools/art-pipeline.mjs <id> --provider gemini`, one id at a time, railmaw → crown-runner → the-null → vault-mother → ultra-signal). No prompt changes needed. Pull the fix first if you run from a separate checkout (`git pull origin game/core`).
- CLAUDE 10:02 railmaw sheet → ACCEPTED (1774×887, real alpha; matches the card: black plate, red seams, toothed visor, buzzsaw shield on the left arm, exhaust stacks). Continue with the six action files from this sheet.
- CLAUDE 10:06 railmaw idle → PASS (gate + by eye: 9 distinct frames, one size, one baseline). Attach idle.png as the size reference for approach/attack/special/hurt/defeat.
- CLAUDE 10:12 railmaw approach → PASS (gate + by eye: stomping advance, alternating legs, exhaust puffs).
- CLAUDE 10:20 railmaw attack → **FAIL** (gate: frames 7–9 feet 68–70 px off the baseline; by measurement rows 1–2 have the feet ON the cell's bottom edge and the heads/exhaust flames ON the top edge — the grid is drawn without margins, so the cells are already clipped and no repositioning can repair it). Restored as delivered; the drawing itself (wind-up, shield sweep, recover) is right — keep it.
- **CLAUDE DELEGATION → Codex:** regenerate `railmaw/attack.png` ONCE, same session, attach `idle.png`, with this FIRST and **bolded**: "**The 2048×2048 canvas is nine equal cells of 683×683, three rows of three. Every figure sits entirely inside its own cell with clear empty margin on all four sides: the feet on ONE baseline about 60 px above the bottom of the cell in ALL three rows (same as the attached idle.png), the head, exhaust stacks, flames and smoke well below the top of the cell. Nothing touches or crosses the lines at y=683 and y=1366 or x=683 and x=1366.**" Then intake and stop; I will gate it.
- CLAUDE 10:28 railmaw special → PASS (gate + by eye: buzzsaw ring sweep over 4–6, settle 7–9).
- CLAUDE 10:34 railmaw hurt → PASS (gate + by eye: flinch 1–3, reel 4–6, airborne crumple 7–9). Only defeat and the attack retry remain.
- CLAUDE 10:40 railmaw defeat → **FAIL** (gate reports "grid guide lines" but measurement shows why: the middle-row fall, frames 5–6, is drawn too big and spills across the horizontal cell line at y=1366 into the bottom row — 1,700 opaque px on that line). The beats are right (upright → knee → topple → lands → flat 8–9 with a settle); only the layout is wrong.
- **CLAUDE DELEGATION → Codex:** regenerate `railmaw/defeat.png` ONCE, same session, attach `idle.png`, with this FIRST and **bolded**: "**Nine equal cells of 683×683, three rows of three. Every figure sits entirely inside its own cell with generous empty margin on all four sides — no part of any figure crosses the horizontal lines at y=683 and y=1366 or the vertical lines at x=683 and x=1366. Frames 4–6 (the middle row) must stay well above the bottom third of the canvas, and the lying figures in frames 7–9 fit inside their own cells at the same scale as idle.png.**" Then intake and stop; I will gate it. Same for the pending `attack.png` retry.
- CLAUDE 10:47 crown-runner sheet → **REJECTED at Step A** (render, hair, jacket, shorts, fishnets, boots all match the card — but the two signature props are missing: no gold circlet crown on the ponytail and no long pink speed scarf. Every action would inherit that. Copy kept at backups/replaced/crown-runner-sheet-attempt1-no-crown-no-scarf.png.)
- **CLAUDE DELEGATION → Codex:** regenerate the crown-runner Step A sheet ONCE with this FIRST and **bolded**: "**She wears a small gold circlet crown at the base of her high purple ponytail, and a long pink speed scarf (#FF76C8) tied at her neck that streams out behind her in every view — both must be visible in the front, three-quarter and side views and in the head close-up.**" Do not start the action files until I sign the new sheet off.
- CLAUDE 11:03 crown-runner idle → PASS (gate + by eye), and it HAS the gold circlet and the pink scarf. **The sheet retry is withdrawn** — do not regenerate the sheet; `idle.png` is now the identity + size reference for this character.
- **CLAUDE DELEGATION → Codex:** for every remaining crown-runner file (approach attack special hurt defeat) attach `actions/crown-runner/idle.png` AND the sheet, and put this FIRST and **bolded** in each request: "**Exactly the character in the attached idle.png: a small gold circlet crown at the base of the high purple ponytail and a long pink speed scarf streaming from her neck, in every frame.**" A delivered file without the crown or the scarf is a reject.
- CLAUDE 11:10 crown-runner approach → PASS (gate + by eye: sprint, crown + scarf in all 9).
- CLAUDE 11:16 crown-runner attack → **FAIL** (gate: frames 2–4 off the baseline; measurement: rows 1–2 feet ON the cell's bottom edge (682/683), row 2 heads ON the top edge, only row 3 has margins — the grid was drawn without margins, cells are clipped). The kick beats are right — keep them.
- **CLAUDE DELEGATION → Codex:** regenerate `crown-runner/attack.png` ONCE, attach `idle.png`, with this FIRST and **bolded**: "**Nine equal cells of 683×683, three rows of three. Every figure sits entirely inside its own cell with clear empty margin on all four sides: the standing foot on ONE baseline about 60 px above the bottom of the cell in ALL three rows (as in the attached idle.png); hair, scarf, kicking foot and effects well below the top of the cell and never touching the lines at y=683, y=1366, x=683, x=1366.**" Then the crown + scarf line, then the FRAME BLOCK as usual.
- NOTE for the whole queue: this is the third file today drawn edge-to-edge in rows 1–2 (railmaw attack, railmaw defeat, crown-runner attack). Put the nine-cell margin rule FIRST and bolded in **every** remaining action request, not only on retries.
- CLAUDE 11:24 crown-runner special → PASS (gate + by eye: crouch → blur dash → afterimage copies 4–8 → resolve; frame 3's smear is the speedster's dash, accepted).
- CLAUDE 11:31 crown-runner hurt → PASS (gate + by eye: flinch / reel / airborne curl). Remaining: defeat + the attack retry.
- CLAUDE 11:38 crown-runner defeat → PASS (gate + by eye: struck → knee → topple → flat 7–9 with a settle). Crown Runner stands at 5/6 — only the attack retry is outstanding; the whole-set gate fails on attack.png alone.
- CLAUDE 11:44 the-null sheet → ACCEPTED (gaunt static figure, blank hood with one white slit — the card asks for two slits, a lean I accept; ragged coat fraying to static, white glitch blade in the right hand, palette right). For the actions: put the margin rule first as noted, and add bolded: **the figure stays fully readable in every frame — the static fringe never grows past the coat, and the body never dissolves**.
- CLAUDE 11:52 the-null idle → PASS (gate + by eye: readable figure, static breathing, blade in hand in all 9). Attach idle.png as the size reference from here on.
- CLAUDE 11:58 the-null approach → PASS (gate + by eye: striding advance, coat streaming, blade low).
- CLAUDE 12:04 the-null attack → PASS (gate + by eye: raise → wide null arc 4–6 → recover; margins held this time).
- CLAUDE 12:11 the-null special → PASS (gate + by eye: the inverting phase — negative flash 4–7, figure stays readable throughout).
- CLAUDE 12:18 the-null hurt → PASS (gate + by eye: flinch / reel / airborne crumple; the static fringe stays contained). Only defeat left.
- CLAUDE 12:26 the-null defeat → PASS. **THE NULL COMPLETE 6/6** — verify:character PASS, build:assets + test:assets clean, npm test 161/161, roster: level 8. Committed (art + built atlas + portrait). Next: vault-mother.
2026-09-14 13:40 vault-mother sheet vault-mother-sheet.png → GENERATED; saved for Claude verification.
- CLAUDE 13:42 vault-mother sheet → ACCEPTED as identity (regal, lavender hair, gold halo-crown, white-and-gold segmented gown, chain whip, halo orbs — exactly the card). It has a PAINTED checkerboard, not alpha: fine for a sheet (reference only), but every action file must be run through `npm run intake:character -- vault-mother <action>` before I gate it — and ask the model for a true transparent background as the standard says. Continue with idle.
2026-09-14 13:42 vault-mother action idle.png → GENERATED; INTAKEN; Claude verification pending.
- CLAUDE 13:48 vault-mother idle → PASS (gate + by eye: intake keyed the checkerboard cleanly; 9 distinct frames, halo orbs drifting). Attach idle.png as size reference.
2026-09-14 13:54 vault-mother action approach.png → GENERATED; INTAKEN; Claude verification pending.
- CLAUDE 14:00 vault-mother approach → PASS (gate + by eye: stately stride, alternating legs, hair and gown flowing).
2026-09-14 14:05 vault-mother action attack.png → GENERATED; INTAKEN; Claude verification pending.
- CLAUDE 14:08 vault-mother attack → PASS (gate + by eye: chain unspools → lash beam 4–6 → recoil; margins held).
2026-09-14 14:20 vault-mother action special.png → GENERATED; INTAKEN; Claude verification pending.
- CLAUDE 14:24 vault-mother special → PASS (gate + by eye: raise → halo orbs summoned 4 → bombs drop 5–7 → settle; the figure reads smaller in this file but within the gate's tolerance).
2026-09-14 14:32 vault-mother action hurt.png → GENERATED; INTAKEN; Claude verification pending.
- CLAUDE 14:35 vault-mother hurt → PASS (gate + by eye: flinch / reel / airborne curl, chain trailing). Only defeat left.
2026-09-14 14:43 vault-mother action defeat.png → GENERATED; INTAKEN; Claude verification pending. Vault Mother's seven requested images are complete; Claude must verify before any build or roster-art readiness change.
- CLAUDE 14:48 vault-mother defeat → PASS (halo falls, knee, crawl, flat 7–9 with settle). **VAULT MOTHER COMPLETE 6/6, zero retries** — verify PASS, build + gates clean, npm test green, roster: level 9. Committed. Next: ultra-signal.
