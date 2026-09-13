# Regeneration prompts — one file per character, in queue order

Every character that still needs art, each with a complete, self-contained prompt file under the
[character art standard](../character-art-standard.md). **Work the queue top to bottom, one file at a
time, one image request at a time**; a character counts as done when
`npm run verify:character -- <id>` prints `PASS` and `npm run build:assets && npm run test:assets` are
clean. The queue runs unattended with `npm run art:queue` ([art-pipeline.md](../art-pipeline.md)); [codex-queue.md](codex-queue.md) is the equivalent brief for an agent doing it by hand.

Standing on 2026-09-13 23:00 (`npm run readiness`): **20 READY** — heroes eviatar, omri, shmuel (2026-kit redo),
savta-orly, saba-kobi, noa (all six in the lobby); 6 enemies (punk + its punk-b palette variant, bio-brute, gold-sorceress,
void-demon, rainbow-oracle); 9 bosses. **1 FAILED** — pitz (one file). **10 LEGACY** — five bosses and five enemies.
Shipped roster: `public/game/roster.json` fields every READY enemy and boss, ordered by strength across the ten levels
(`tests/shippedRoster.test.ts` plays it).

"Requests" = image-generation requests on a clean run: the Step A character sheet, one per action
file, and the hero-select card for heroes. Retries come on top.

**Queue order = least work first.** One file, then the five 7-request boss sets (level order), then the five 11-request
enemy sets (the two that also unlock a palette variant first).

| # | character | rank | requests | work | unlocks |
|---|---|---|---|---|---|
| 1 | [pitz](pitz.md) | fx | **1** | regenerate `run.png` only — frames 1–2 sit 83/64 px off the baseline; leap + pounce pass | Shmuel's special plays the animated cat instead of the sheet cut-out |
| 2 | [railmaw](railmaw.md) | boss | 7 | Step A sheet + 6 action files | level 6's own boss (today: Ferryman rematch) |
| 3 | [crown-runner](crown-runner.md) | boss | 7 | Step A sheet + 6 action files | level 7's own boss |
| 4 | [the-null](the-null.md) | boss | 7 | Step A sheet + 6 action files | level 8's own boss |
| 5 | [vault-mother](vault-mother.md) | boss | 7 | Step A sheet + 6 action files | level 9's own boss |
| 6 | [ultra-signal](ultra-signal.md) | boss | 7 | Step A sheet + 6 action files | the level-10 Ultra Boss that steals every other boss's patterns |
| 7 | [brawler](brawler.md) | enemy | 11 | Step A sheet + 10 action files | brawler **and** brawler-b (blue variant) — two enemies |
| 8 | [knight](knight.md) | enemy | 11 | Step A sheet + 10 action files | knight **and** knight-b (crimson variant) — two enemies |
| 9 | [chainer](chainer.md) | enemy | 11 | Step A sheet + 10 action files | ranged chain enemy from level 2 |
| 10 | [kicker](kicker.md) | enemy | 11 | Step A sheet + 10 action files | fast evasive enemy from level 4 |
| 11 | [shield](shield.md) | enemy | 11 | Step A sheet + 10 action files | the armoured wall from level 6 |

**Total: 91 image requests** on a clean run (1 for Pitz · 35 for the five bosses · 55 for the five enemies). After each
delivery, add the character to `public/game/roster.json` on `/backoffice.html` (or by hand — enemies get the levels their
strength fits, a boss takes the level it was designed for) and run `npm test` (the `shippedRoster` gate plays every level).
**Nepho and Byte were retired from the game on 2026-09-13** — their prompt files stay as history only.

### Not a character, also open

- [brand-eviomri](brand-eviomri.md) — the game was renamed **EviOmri** on 2026-09-13. The lobby logo is vector and already
  reads EVIOMRI; the launcher icon and the Android splash are the old NEPHO paintings with the wordmark repainted by a script
  (`public/assets/backups/brand-nepho/` holds the originals). 2 image requests to regenerate them properly.
- Level backdrops — see [../locations/README.md](../locations/README.md): one prompt file per level to redraw each
  backdrop from the real place (10 requests).

## Delivered — nothing outstanding

- [shmuel](shmuel.md) — hero, redone from scratch in the 2026 kit, 12/12 + card, delivered 2026-09-13 21:31–21:46 (`3dce48c`); in the lobby
- [noa](noa.md) — hero, 12/12 + card, delivered 2026-09-13 19:30–20:50 (`de17117`); enabled in the lobby
- [saba-kobi](saba-kobi.md) — hero, 12/12 + card, round two delivered 2026-09-13 17:39–19:20 under the save protocol (`309f2f4`); enabled in the lobby
- [savta-orly](savta-orly.md) — hero, 12/12 + card, delivered 2026-09-13 15:48–16:19, every file first try (`5d82a1c`, card keyed `4a9af2b`)
- [glass-warden](glass-warden.md) — boss, 6/6, delivered 2026-09-13 (`2b82453`)
- [kilnheart](kilnheart.md) — boss, 6/6, delivered 2026-09-13 (`7ea259f`)
- [monk-zero](monk-zero.md) — boss, 6/6, delivered 2026-09-13 (`e2b09fe`)
- [market-king](market-king.md) — boss, 6/6 files, delivered 2026-09-13 14:06, passes the gate, built in and pushed
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
