# Codex — finish Saba Kobi, then Noa

You are in `/Users/shmuelvachnish-mbpr/Projects/GitHub/Nepho`, branch `game/core`. Two heroes, in this order. Read
`docs/character-art-standard.md`, then `docs/prompts/saba-kobi.md` and `docs/prompts/noa.md` fully before generating.

## The save protocol — every single file, no exceptions

Earlier today six "new" action files turned out to be byte-copies of the previous generation: the save step wrote the
wrong image and the log said PASS. This sequence prevents it. Do it for every file, in this order, and log each step:

1. Generate ONE image for ONE action. The image tool returns a path (`~/.codex/generated_images/<session>/exec-<id>.png`).
   **Use that exact path, read fresh from the tool's result of THIS request** — never a path held over from an earlier step.
2. Copy it to `public/assets/generated/actions/<id>/<action>.png`.
3. `md5 -q` the saved file and the source path: they must be **equal**. Then `md5 -q` every other `.png` in
   `actions/<id>/`: the new file must be **different from all of them**. If either check fails, the save was wrong —
   fix the save (do not regenerate, do not proceed), and log what happened.
4. `npm run intake:character -- <id> <action>` — always, before any verify.
5. `npm run verify:character -- <id>` — only failures naming this file count while the set is incomplete.
6. Open the PNG and check by eye: the same character as the sheet and `idle.png` in every frame — for Kobi that means
   **dark BLUE jeans, cream tee, black strap, sandals, the younger face**; no olive trousers, no colour shift, no magenta
   or white fringe, no motion-blur ghost frame. `walk`: both legs lead. `defeat` 8–9: two different drawn frames.
7. Only now append to `docs/prompts/QUEUE-LOG.md`: `HH:MM <id> <action> attempt N → PASS (md5 <first 8 chars>)` with the
   real clock time. A FAIL line names the rule; retry only that file with the rule first and bolded (3 retries, then park).

Never write, copy, rename or "restore" one action's image to another action's path. Never restore a file from any
backup folder — everything under `public/assets/backups/replaced/` is rejected art. Never fix pixels by script.

## Saba Kobi (`saba-kobi`) — 9 requests

Accepted, do not touch: `docs/refs/saba-kobi-sheet.png`, `idle.png`, `walk.png`, `light1.png`, `light3.png`.
Make, one request each, attaching the quality reference + the sheet + `idle.png` (size lock) to every request:
`dash`, `light2`, `heavy`, `special`, `block`, `hurt`, `knockdown`, `defeat`, then the hero card. Put these first in
every prompt, bolded: **"dark blue jeans, cream t-shirt with the hexagon badge, black cross-body strap with sunglasses,
brown sandals — exactly as in the attached idle sheet; the figure exactly the same height as in the attached idle
sheet; every figure entirely inside its own cell with empty margin on all four sides; true transparent background."**
He reads as a fit early-60s man — few wrinkles, more dark than grey in the hair (see the card's FACE line).
For `defeat`: frames 8 and 9 are the same lying position drawn twice with a small settle — never identical — and the
middle row stays above the bottom third of the canvas. For the card: real alpha — check `hasAlpha` on the PNG; if it
came on a checkerboard, regenerate asking for a true transparent background. When all 12 pass: whole-set
`verify:character` → `npm run build:assets && npm run test:assets` → commit only Kobi's paths (see codex-queue.md).

## Noa (`noa`) — 14 requests

Requires `docs/refs/noa-source/noa-1.png` (or any image in that folder). **If the folder has no photo, stop and tell the
owner — do not generate Noa without it.** Then: Step A sheet with the photo attached, judged on likeness (long
honey-copper hair swept back, green-hazel eyes, small nose ring, berry-pink half-smile, gold hoops, pearl choker, gold
chain with a blue heart) — leopard-print outfit, cream apron, pothos vine round the left forearm, rolling pin. Then
`idle` first, then the other 11 with `idle.png` attached as the size lock, then the card with real alpha. Same save
protocol, same by-eye checks (walk stride; identity in every frame — leopard print never becomes plain fabric).
When all 12 pass: gate → build → test → commit Noa's paths only.

## Finish

Report: the readiness lines for saba-kobi and noa, the md5 list of each set, and the commits. Do not push.
