# Regeneration prompts — one file per character, in queue order

Every character that still needs art, each with a complete, self-contained prompt file under the
[character art standard](../character-art-standard.md). **Work the queue top to bottom, one file at a
time, one image request at a time**; a character counts as done when
`npm run verify:character -- <id>` prints `PASS` and `npm run build:assets && npm run test:assets` are
clean. The queue runs unattended with `npm run art:queue` ([art-pipeline.md](../art-pipeline.md)); [codex-queue.md](codex-queue.md) is the equivalent brief for an agent doing it by hand.

Standing on 2026-09-13 (`npm run readiness`): 13 ready, 1 failed (nepho), 15 legacy, Shmuel's `walk` and
`dash` and Pitz's `run` were redelivered 2026-09-13 and are done.

## The queue — least work first

"Requests" = image-generation requests on a clean run: the Step A character sheet, one per action
file, and the hero-select card for heroes. Retries come on top.

| # | character | rank | requests | work |
|---|---|---|---|---|
| 1 | [glass-warden](glass-warden.md) | boss | 7 | Step A sheet + 6 action files |
| 2 | [kilnheart](kilnheart.md) | boss | 7 | Step A sheet + 6 action files |
| 3 | [monk-zero](monk-zero.md) | boss | 7 | Step A sheet + 6 action files |
| 4 | [market-king](market-king.md) | boss | 7 | Step A sheet + 6 action files |
| 5 | [railmaw](railmaw.md) | boss | 7 | Step A sheet + 6 action files |
| 6 | [crown-runner](crown-runner.md) | boss | 7 | Step A sheet + 6 action files |
| 7 | [the-null](the-null.md) | boss | 7 | Step A sheet + 6 action files |
| 8 | [vault-mother](vault-mother.md) | boss | 7 | Step A sheet + 6 action files |
| 9 | [ultra-signal](ultra-signal.md) | boss | 7 | Step A sheet + 6 action files |
| 10 | [brawler](brawler.md) | enemy | 11 | Step A sheet + 10 action files |
| 11 | [knight](knight.md) | enemy | 11 | Step A sheet + 10 action files |
| 12 | [chainer](chainer.md) | enemy | 11 | Step A sheet + 10 action files |
| 13 | [kicker](kicker.md) | enemy | 11 | Step A sheet + 10 action files |
| 14 | [shield](shield.md) | enemy | 11 | Step A sheet + 10 action files |
| 15 | [nepho](nepho.md) | hero | 14 | Step A sheet + 12 action files + hero card (the set is redone whole) |
| 16 | [byte](byte.md) | hero | 14 | Step A sheet + 12 action files + hero card |

**Total: 146 image requests** on a clean run (63 for the nine bosses · 55 for the five
enemies · 28 for the two heroes). Bosses come before enemies only because a boss set is 7 requests and
an enemy set is 11; within each group the order is level order (bosses) and pay-off (the two enemies
that also unlock a palette variant first). The two heroes are last: they are roster-disabled today,
so if the day runs out they are what slips.

## Delivered — nothing outstanding

- [pitz](pitz.md) — fx, 3/3 files; `run` redelivered 2026-09-13 (attempt 4, baseline rule first and bolded), approved
- [shmuel](shmuel.md) — hero, 12/12 files; `walk` and `dash` redelivered 2026-09-13, both stride correctly by eye
- [punk](punk.md) — enemy, 10/10 files, passes the gate and is built in
- [ferryman](ferryman.md) — boss, 6/6 files, passes the gate and is built in
- [abyss-dragon](abyss-dragon.md) — boss, 6/6 files, passes the gate and is built in
- [storm-colossus](storm-colossus.md) — boss, 6/6 files, passes the gate and is built in

Also ready with no prompt file (delivered before the per-file prompts existed): `eviatar`, `omri`
(heroes), `bio-brute`, `gold-sorceress`, `void-demon`, `rainbow-oracle` (enemies),
`flame-samurai`, `prism-queen` (bosses).

## Two rules every file now carries

- **Intake before verify.** `npm run intake:character -- <id> [action]` normalizes only the container
  (painted checkerboard or matte → real alpha, odd canvas → 2048²). A canvas-size or background
  complaint from the gate means intake was skipped, not that the art is wrong.
- **`defeat` frames 8–9 are two drawn frames, not one copied.** The renderer holds frame 9 while the
  body stays down, so the two frames show the same lying position — but the gate rejects any two
  identical cells (Nepho's `defeat` failed on exactly this). Every prompt asks for a small visible
  settle between 8 and 9.
