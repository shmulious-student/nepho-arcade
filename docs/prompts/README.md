# Regeneration prompts — one file per character, in queue order

Every character that still needs art, each with a complete, self-contained prompt file under the
[character art standard](../character-art-standard.md). **Work the queue top to bottom, one file at a
time, one image request at a time**; a character counts as done when
`npm run verify:character -- <id>` prints `PASS` and `npm run build:assets && npm run test:assets` are
clean. The queue runs unattended with `npm run art:queue` ([art-pipeline.md](../art-pipeline.md)); [codex-queue.md](codex-queue.md) is the equivalent brief for an agent doing it by hand.

Standing on 2026-09-13 21:15 (`npm run readiness`): **21 READY** — heroes eviatar, omri, shmuel, savta-orly,
saba-kobi, noa (all six in the lobby); fx pitz; 6 enemies; 8 bosses. 10 legacy remain: five bosses and five enemies.

"Requests" = image-generation requests on a clean run: the Step A character sheet, one per action
file, and the hero-select card for heroes. Retries come on top.

| # | character | rank | requests | work |
|---|---|---|---|---|
| 1 | [railmaw](railmaw.md) | boss | 7 | Step A sheet + 6 action files |
| 2 | [crown-runner](crown-runner.md) | boss | 7 | Step A sheet + 6 action files |
| 3 | [the-null](the-null.md) | boss | 7 | Step A sheet + 6 action files |
| 4 | [vault-mother](vault-mother.md) | boss | 7 | Step A sheet + 6 action files |
| 5 | [ultra-signal](ultra-signal.md) | boss | 7 | Step A sheet + 6 action files |
| 6 | [brawler](brawler.md) | enemy | 11 | Step A sheet + 10 action files |
| 7 | [knight](knight.md) | enemy | 11 | Step A sheet + 10 action files |
| 8 | [chainer](chainer.md) | enemy | 11 | Step A sheet + 10 action files |
| 9 | [kicker](kicker.md) | enemy | 11 | Step A sheet + 10 action files |
| 10 | [shield](shield.md) | enemy | 11 | Step A sheet + 10 action files |

**Total: 90 image requests** on a clean run (35 for the five remaining bosses · 55 for the five enemies). Bosses come before enemies only because a boss set is 7 requests and
an enemy set is 11; within each group the order is level order (bosses) and pay-off (the two enemies
that also unlock a palette variant first). **Nepho and Byte were retired from the game on 2026-09-13** — their prompt files stay as history only.

## Delivered — nothing outstanding

- [noa](noa.md) — hero, 12/12 + card, delivered 2026-09-13 19:30–20:50 (`de17117`); enabled in the lobby
- [saba-kobi](saba-kobi.md) — hero, 12/12 + card, round two delivered 2026-09-13 17:39–19:20 under the save protocol (`309f2f4`); enabled in the lobby
- [savta-orly](savta-orly.md) — hero, 12/12 + card, delivered 2026-09-13 15:48–16:19, every file first try (`5d82a1c`, card keyed `4a9af2b`)
- [glass-warden](glass-warden.md) — boss, 6/6, delivered 2026-09-13 (`2b82453`)
- [kilnheart](kilnheart.md) — boss, 6/6, delivered 2026-09-13 (`7ea259f`)
- [monk-zero](monk-zero.md) — boss, 6/6, delivered 2026-09-13 (`e2b09fe`)
- [market-king](market-king.md) — boss, 6/6 files, delivered 2026-09-13 14:06, passes the gate, built in and pushed
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
