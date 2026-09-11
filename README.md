# Nepho: Circuit Breakers

A browser-based mobile 2D arcade beat-em-up starring **Eviatar** (basketball kit, magic paint
markers, paint-splash special) and **Omri** (capoeira, a microphone, sonic-beat special), with Nepho,
Bruiser, Riva and Byte as the friends who fight beside them — all six playable. Old-school side-scrolling co-op action — light/heavy
combos, dashes, blocks, meter-fueled specials, ten real-world levels each ending in a boss, and a
final Ultra Boss that combines every pattern from the whole run. 1–2 players; a second player joins
over LAN from their own phone. Upload a photo and your face rides on your character's head, animated
with the body — blinking, flinching, pulsing on your special.

```bash
npm install
npm run dev        # solo/local play at http://localhost:5173
npm run lan        # LAN co-op — builds nothing itself, serves dist/ (run `npm run build` first)
```

## Controls

- **Move:** WASD or arrow keys (P1) / D-pad on touch.
- **Light / Heavy:** `J` / `K` (touch: ATK / HVY). Light chains up to 3 hits; the third hit is a
  360° "breaker" that lands on both sides at once and beats enemy guard.
- **Dash:** `L`, or double-tap a direction. A dash is a sustained run, not a burst — it keeps going
  until you tap the opposite direction, run into an enemy (auto-attacks on contact), or cancel into
  an attack. Hold up/down while dashing to angle it diagonally.
- **Jump:** `SPACE` (touch: JMP). Press light/heavy in the air for a flying kick that floors whoever is
  under it.
- **Special:** `I` (touch: SPC) once the meter is full.
- **Block:** `U` (touch: BLK), held. Cuts incoming damage to ~25% while you face the attack; a
  guard-breaker or AoE still gets through.
- **Friend:** `H` (touch: FRD). In the lobby you pick one of the other heroes as your friend and how
  they help — **ASSIST** (press to call them in: they run on, land their special and run off; recharges
  in 15s) or **SIDEKICK** (they fight beside you the whole level as an AI ally and get back up if
  floored) — or **OFF**.
- **Local 2-player:** P2 uses arrow keys + Numpad `1`/`2`/`3`/`0`/`4`/`5`/`6` (light/heavy/dash/special/block/friend/jump).
- Attacks are forgiving on purpose: light hits reach a little behind you, a press during a move is
  buffered and fires the instant it ends, and swinging with an enemy at your back turns you toward it.
  Beating a boss rolls straight into the next level.
- **LAN co-op:** from the lobby, turn on **LAN CO-OP**, host or join with the 4-letter room code (or
  scan the QR code) — see below.

## Architecture

```
src/sim/       deterministic simulation — fixed 60Hz tick, seeded RNG, no Phaser import (enforced by
               a test). Fighters, 6 enemy archetypes, 10 bosses with data-driven patterns, the wave
               director, and world.step(inputs) -> Snapshot. This is the single source of truth for
               both local play and the network host.
src/render/    Phaser 3 scenes and view layer. Reads Snapshots only — never touches sim internals
               directly. EntityView/FaceRig/Fx/Backdrop/Hud/TouchControls/anim.ts.
src/net/       binary snapshot/input codec + Local/Host/Guest Session classes.
src/face/      local-only portrait processing (crop, posterize, skin-tone blend, outline) and the
               DOM upload/crop modal. The photo never leaves the device.
src/audio/     procedural Web Audio — SFX and a per-level chiptune sequencer. No audio files.
src/shared/    catalog.ts — types + loader for the asset pipeline's manifest.
tools/         asset pipeline (build-assets.mjs, asset-ops.mjs) and CI-style gates (check-assets.mjs).
server/        LAN relay + static server (server/index.mjs).
tests/         vitest: determinism, frame-data invariants, codec round-trip, face-pixel assertions,
               and a full 10-level bot campaign that verifies every level is actually won (not just
               finished) in both 1P and 2P.
```

Run `npm run verify` to do everything CI would: rebuild the asset pack, run its gates, run every
vitest suite, and produce a production build.

## Asset pipeline

`public/assets/generated/` holds the hand-authored/generated PNG masters (hero and enemy action
grids, ten boss grids, backdrops, bilingual sign SVGs). `npm run build:assets` slices and normalizes
them into `public/game/` — the only thing the running game ever loads. Re-run it any time a master is
replaced; the pipeline auto-detects grid layout (even inconsistent cell sizes), trims per-frame boxes,
defringes matte halos, and computes a per-frame head anchor for the face rig. `public/game/debug/`
gets a labeled contact sheet per character for a human to sanity-check the head anchors — it's
gitignored and stripped from `dist/` (see `tools/prune-dist.mjs`).

A few source masters have known defects the pipeline works around automatically (documented in
`docs/asset-prompts.md`, which also has ready-to-paste prompts for regenerating them properly):
`hero-byte-grid.png` is currently the wrong character and is substituted with a hue-shifted Riva;
`enemy-03-purple-fighter-grid.png` has a baked (non-transparent) checkerboard background that the
pipeline attempts to un-bake. Drop in a corrected master and rebuild — nothing else needs to change.

## LAN co-op, in detail

`npm run lan` starts `server/index.mjs`, a small generic two-peer WebSocket room relay plus a static
file server (serves `dist/` if built, else falls back to `public/`). It prints both a `localhost` and
a LAN IP URL. The **host** picks HOST GAME to get a 4-letter room code and a QR code encoding the LAN
join URL; the **guest**, on the same Wi-Fi, opens that URL (or types the code under JOIN GAME) and
picks a hero. The host is authoritative: it runs the real simulation and broadcasts compact binary
snapshots at 30Hz; the guest sends 60Hz input and interpolates between snapshots for smooth motion.
Solo and local-2P play need no server at all.

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
