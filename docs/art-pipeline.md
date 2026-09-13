# Art pipeline — the queue, unattended

`tools/art-pipeline.mjs` runs the regeneration queue in [docs/prompts/README.md](prompts/README.md)
end to end with nobody watching: it assembles every request from the character's prompt file, calls
the image model, runs intake and the gate, asks a vision model the questions the gate cannot answer,
retries with the offending rule bolded, builds, tests and commits each passing character on its own.

```bash
export OPENAI_API_KEY=…            # gpt-image (default provider)
export GEMINI_API_KEY=…            # Nano Banana Pro (--provider gemini) and the vision judge
npm run art:queue                  # the whole queue, 3 characters at a time
npm run art:pipeline -- pitz --only run          # one file of one character
npm run art:pipeline -- glass-warden --provider gemini
npm run art:pipeline -- --queue --dry-run        # print every assembled prompt, call nothing
```

**Run one orchestrator at a time.** The pipeline and a Codex session working the same queue will
overwrite each other's files mid-gate. Stop one before starting the other.

## What it does per character

1. Parses `docs/prompts/<id>.md`: card, STYLE BLOCK, FRAME BLOCK, Step A / Step C prompts, the beats
   table and the attach list. Nothing is retyped; the prompt file is the contract.
2. A full set first moves any existing files aside to `public/assets/backups/replaced/` (gitignored)
   so the gate never mixes two deliveries.
3. **Sheet** (Step A) with the quality reference and the identity references attached → the vision
   judge compares it to the identity references and the card; one retry with the rejection bolded.
   Saved to `docs/refs/<id>-sheet.png`.
4. **`idle.png` first** — it fixes the figure size — then the other files in parallel
   (`--concurrency`, default 4), every one with the quality reference, the sheet and the accepted
   `idle.png` attached.
5. Every file: save → `intake:character` → `verify-character` (only failures naming this file) → if
   clean, the judge (identity in every frame, both legs lead in `walk`/`approach`, legs cycle in
   `dash` 3–7, gait cycles in `run`, `defeat` 8–9 two drawn frames, floor rows lie flat, upright rows
   stay up). Any failure → regenerate that file with the rule bolded, up to `--max-retries` (3). Every
   attempt is kept under `public/assets/backups/attempts/<id>/` (gitignored).
6. A file still failing parks the character (the log says which rule); the queue moves on.
7. Whole-set gate → `build:assets` → `test:assets` → commit of that character's files only (explicit
   paths, plain message, no trailers). Build and commit are serialized across characters.
8. `docs/prompts/QUEUE-LOG.md` gets one line per request; the run ends with a macOS notification
   and a summary of ready vs parked.

## Providers

| | `--provider gpt` (default) | `--provider gemini` |
|---|---|---|
| model | `OPENAI_IMAGE_MODEL`, default `gpt-image-1.5` | `GEMINI_IMAGE_MODEL`, default `gemini-3-pro-image-preview` |
| output | 1024² with a real alpha channel; intake resamples to 2048² (nearest) | 2048² on a flat magenta matte; intake keys it out |
| references | quality ref + sheet + idle via the edits endpoint, `input_fidelity: high` | the same images inline |
| proven | yes — punk, ferryman, shmuel passed the gate on it | not yet on this gate; try it on one character first |

The judge uses `GEMINI_JUDGE_MODEL` (default `gemini-2.5-flash`) when a Gemini key is set, else
`OPENAI_JUDGE_MODEL` (default `gpt-5-mini`). `--no-judge` accepts on the gate alone. A judge error is
logged and never blocks a file.

## What stays manual

- Roster placement in `/backoffice.html` after a character is ready.
- Watching a new set once on `/showcase.html` — the judge catches the known failure modes, not taste.
- Parked characters: read the log line, decide whether to switch provider, change the prompt file, or
  accept the standard's rule as the problem (pitz's `run` baseline drift is the current example).
