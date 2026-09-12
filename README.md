# Nepho: Circuit Breakers

A browser-based mobile 2D arcade beat-em-up starring **Eviatar** (basketball kit, magic paint
markers, paint-splash special) and **Omri** (capoeira, a microphone, sonic-beat special), with Nepho
and Byte as the friends who fight beside them — all four playable. Old-school side-scrolling co-op action — light/heavy
combos, dashes, blocks, meter-fueled specials, ten real-world levels each ending in a boss, and a
final Ultra Boss that combines every pattern from the whole run. 1–2 players; a second player joins
over LAN from their own phone.

```bash
npm install
npm run dev        # solo/local play at http://localhost:5173
npm run lan        # LAN co-op — builds nothing itself, serves dist/ (run `npm run build` first)
```

## Controls

- **Move:** WASD or arrow keys (P1) / D-pad on touch.
- **Light / Heavy:** `J` / `K` (touch: ATK / HVY). Light chains up to 3 hits; the third hit is a
  360° "breaker" that lands on both sides at once and beats enemy guard.
- **Dash:** hold `L` **plus a direction** (touch: hold DSH and push the stick sideways). The run lasts
  exactly as long as the chord is held, and also ends when you reach an enemy (auto dash-attack on
  contact), hit the edge of the screen, or get hit. Tap light/heavy mid-run to cancel into an attack.
- **Jump:** `SPACE` (touch: JMP). Press light/heavy in the air for a flying kick that floors whoever is
  under it.
- **Special:** `I` (touch: SPC) once the meter is full.
- **Block:** `U` (touch: BLK), held. Stops every attack from the side you face — no damage, no stun —
  and you can still shuffle and turn while holding it. Explosions around you get through at a third;
  anything from behind lands in full.
- **Pause:** `ESC` / `P`, or the ❚❚ button top-right: resume, restart level, back to lobby, sound
  (the sound setting and your best score are remembered by the browser).
- **Lives & CONTINUE?:** two extra lives per level, then a CONTINUE? countdown — press anything to get
  back into the same fight with full health; let it run out and the run ends. HP only trickles back
  after five seconds without taking a hit, so a bad fight can be lost.
- **Stun:** a long unbroken streak of hits (seven-plus in a couple of seconds) dazes anyone —
  enemies, bosses, or you — for two seconds, wide open to 1.5× damage. Rare, and never twice in a
  row on the same target.
- **Pickups:** beaten enemies sometimes drop a heart (heals 30%), a coin (+500) or a star (+50% meter);
  walk over them. Clearing a level pays a time bonus and a best-combo bonus.
- **Friend:** `H` (touch: tap your HUD card). In the lobby you pick one of the other heroes as your friend and how
  they help — **ASSIST** (press to call them in: they run on, land their special and run off; recharges
  in 15s) or **SIDEKICK** (they fight beside you the whole level as an AI ally and get back up if
  floored) — or **OFF**.
- **Local 2-player:** turn on **2P KEYBOARD** in the lobby and pick P2's hero. P2 uses arrow keys +
  Numpad `1`/`2`/`3`/`0`/`4`/`5`/`6` (light/heavy/dash/special/block/friend/jump).
- Attacks are forgiving on purpose: light hits reach a little behind you; any button pressed during
  a move (or during the freeze after a landed hit) is remembered and fires the instant you can act —
  a light chains on as soon as its hit frames are over, a heavy ends the string; and swinging with
  an enemy at your back turns you toward it. Taps are never lost between frames, whatever the
  display's refresh rate.
  Beating a boss rolls straight into the next level.
- **On a phone:** hold it sideways (portrait shows a rotate prompt). START goes full screen. The
  stick plants itself wherever your left thumb lands; hold DSH (above it) and push sideways to run. The right
  thumb gets three big buttons — HVY · ATK · JMP — with SPC above (it lights up when the meter is
  full) and a small BLK tucked in the corner. To call your friend, tap their chip on your HUD card.
  Pick S / M / L controls in the lobby.
- **LAN co-op:** from the lobby, turn on **LAN CO-OP**, host or join with the 4-letter room code (or
  scan the QR code) — see below.

## Architecture

```
src/sim/       deterministic simulation — fixed 60Hz tick, seeded RNG, no Phaser import (enforced by
               a test). Fighters, 6 enemy archetypes, 10 bosses with data-driven patterns, the wave
               director, and world.step(inputs) -> Snapshot. This is the single source of truth for
               both local play and the network host.
src/render/    Phaser 3 scenes and view layer. Reads Snapshots only — never touches sim internals
               directly. EntityView/Fx/Backdrop/Hud/TouchControls/PauseMenu/PickupView/anim.ts.
src/net/       binary snapshot/input codec + Local/Host/Guest Session classes.
src/audio/     procedural Web Audio — SFX and a per-level chiptune sequencer. No audio files.
src/shared/    catalog.ts — types + loader for the asset pipeline's manifest.
tools/         asset pipeline (build-assets.mjs, asset-ops.mjs) and CI-style gates (check-assets.mjs).
server/        LAN relay + static server (server/index.mjs).
tests/         vitest: determinism, frame-data invariants, codec round-trip, friends, pickups, fuzz,
               a full 10-level bot campaign that verifies every level is actually won (not just
               finished) in both 1P and 2P, and an invariants sweep (every level in several
               hero / co-op / friend configurations) that checks the sim on every tick: no NaN, no
               entity left alive at zero HP or lingering past removal, no hero standing at zero HP,
               and no enemy or boss slipping back out of the visible band once it has entered it.
```

Run `npm run verify` to do everything CI would: rebuild the asset pack, run its gates, run every
vitest suite, and produce a production build.

## Asset pipeline

`public/assets/generated/` holds the hand-authored/generated PNG masters (hero and enemy action
grids, ten boss grids plus per-action sets for four more bosses, backdrops, bilingual sign SVGs). `npm run build:assets` slices and normalizes
them into `public/game/` — the only thing the running game ever loads. Re-run it any time a master is
replaced; the pipeline auto-detects grid layout (even inconsistent cell sizes), trims per-frame boxes,
defringes matte halos, and computes a per-frame head anchor (kept in the catalog for future use). `public/game/debug/`
gets a labeled contact sheet per character for a human to sanity-check the head anchors — it's
gitignored and stripped from `dist/` (see `tools/prune-dist.mjs`).

A few source masters have known defects the pipeline works around automatically (documented in
`docs/asset-prompts.md`, which also has ready-to-paste prompts for regenerating them properly):
`hero-byte-grid.png` is currently the wrong character and is substituted with a hue-shifted Riva;
`enemy-03-purple-fighter-grid.png` has a baked (non-transparent) checkerboard background that the
pipeline attempts to un-bake. Drop in a corrected master and rebuild — nothing else needs to change.

The build also repairs the frame-level damage generated sheets tend to carry: grid guide lines drawn
along the cell boundaries are stripped, a ground shadow painted under a legacy-grid figure is dropped
(the renderer draws its own), a light halo left by keying a light matte is peeled off (per character,
`art-overrides.json` → `scrubFringe`), and per row it records pose hints in the catalog (`poses`) —
which knockback frames are the floor, where a dipping getup row starts to rise — so the renderer
plays a fall as airborne → flat → rising regardless of how many frames the artist gave it.

## Adding a character

`docs/character-art-standard.md` is the one template: the delivery format, the session protocol,
the prompt blocks to paste verbatim, the 9-beat structure of every action and what the renderer does
with each row, and the failure catalogue behind every rule. A delivered set is accepted only when
`npm run verify:character -- <id>` passes (every file and every cell, before anything is built), then
`npm run build:assets && npm run test:assets`, then a look at every row on `/showcase.html`. The
characters still on legacy art each have a ready-to-run prompt file in `docs/prompts/`.

## Roster backoffice

`public/game/roster.json` decides who takes part: every hero, enemy and boss the sim knows, with a
display name, an enabled flag and (for enemies) the levels whose waves may include it or (for a
boss) the level it ends. The game reads it once at boot (`src/sim/roster.ts`); a missing or broken
file means the static defaults in `src/sim/levels.ts` / `enemyAi.ts` / `bosses.ts`. Edit it on the
dev server at **`/backoffice.html`** — every character animates from its real atlas, grouped by
rank, with the campaign each level would field shown underneath; **Save** writes the file through a
dev-only endpoint (`vite.config.ts`). A boss assigned to a level replaces that level's default boss;
an enemy added to a level takes one slot of an existing wave rather than adding bodies, and a
disabled enemy is swapped for another one allowed there, so wave sizes and budgets never change.
Rank is fixed by the art (12-row hero set, 10-row enemy set, 6-row boss set) and is shown, not edited.
Every card also carries the character's standing against `docs/character-art-standard.md` — READY,
FAILED (with the gate's list of what to regenerate) or LEGACY (no per-action set yet; the prompt file
to run) — computed live by the dev server (`tools/readiness.mjs`, cached per set). **Ready only**
builds the roster from that: only passing heroes in the lobby, only passing enemies in the waves, and
the passing bosses dealt round-robin across the ten levels, reused when there are fewer than ten (the
cards and the campaign board say so). `public/game/roster.json` is currently that ready-only roster.

## LAN co-op, in detail

`npm run lan` starts `server/index.mjs`, a small generic two-peer WebSocket room relay plus a static
file server (serves `dist/` if built, else falls back to `public/`). It prints both a `localhost` and
a LAN IP URL. The **host** picks HOST GAME to get a 4-letter room code and a QR code encoding the LAN
join URL; the **guest**, on the same Wi-Fi, opens that URL (the room is filled in for them — or they
type the code under JOIN GAME), picks a hero and presses START. If the host's room goes away
mid-game the guest is told and returned to the lobby. The host is authoritative: it runs the real simulation and broadcasts compact binary
snapshots at 30Hz; the guest sends 60Hz input and interpolates between snapshots for smooth motion.
Solo and local-2P play need no server at all.

On the dev server (`npm run dev`) two query flags help with testing: `?boss` skips straight to the
level's boss and `?ko` opens the CONTINUE? screen; the live sim is reachable from the console as
`__nephoWorld()` and `window.__nephoHeld = <BTN mask>` forces P1 input.

## Known gaps / next steps

- `hero-byte-grid.png` and `enemy-03-purple-fighter-grid.png` should be regenerated — see
  `docs/asset-prompts.md` for exact prompts. The game plays correctly today via the pipeline's
  fallbacks; this is a visual polish item, not a blocker.
- Difficulty has been tuned twice: once against a bot playing at optimal efficiency, then eased
  substantially further for real human play (see the git history on `src/sim/enemyAi.ts` and
  `src/sim/bosses.ts` for the reasoning). If a level still feels too hard or too easy, the wave
  rosters live in `src/sim/levels.ts` and boss HP/patterns in `src/sim/bosses.ts`.
- No accessibility pass (reduced-motion, colorblind-safe telegraph colors) yet.
- `docs/asset-prompts.md` also lists optional art (a title logo, six unused enemy/mini-boss designs
  already sitting in `enemy-boss-atlas.png` slots 6–11, real SFX/music to replace the procedural
  audio) that would add polish but aren't required for the game to work.
