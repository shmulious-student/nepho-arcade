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
