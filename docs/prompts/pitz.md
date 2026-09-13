# PITZ (`pitz`) — effect sprite, 3 files

## Status — queue position 1 of 11 · 1 image request (`run.png` only)

The redo with Shmuel (owner, 2026-09-13 21:00) is two-thirds in: **`leap.png` and `pounce.png` pass** the gate and are built
in (committed `3dce48c`, in the deployed pack). **`run.png` fails** — `npm run verify:character -- pitz`:

```
FAIL  run.png: frame 1 feet are 83 px off the row's baseline — identical bottom-centre anchor in all 9 cells
FAIL  run.png: frame 2 feet are 64 px off the row's baseline — identical bottom-centre anchor in all 9 cells
```

Regenerate **only `run.png`** (do not touch `leap` / `pounce`). Put this first and **bolded** in the request: "**All nine
cells share one baseline: the lowest paw in every frame sits on the same line about 60 px above the bottom of its cell — a
galloping cat rises and falls with its body, not by lifting the whole figure off the ground line; frames 1 and 2 must sit on
that line like frames 3–9.**" Attach the passing `leap.png` as the size and baseline reference. Then
`npm run intake:character -- pitz run` → `npm run verify:character -- pitz` → `npm run build:assets && npm run test:assets`.

Done means `npm run verify:character -- pitz` prints `PASS`, then `npm run build:assets && npm run test:assets` are clean.

Shmuel's cat: the body of his special. When the meter is spent Shmuel opens a cyan pixel portal and
Pitz bursts out of it, gallops down the lane flooring everyone in his way, then — at the far edge of
the screen — springs into a pounce, skids to a stop and dissolves back into portal pixels. The game
plays this from three 3×3 files (`leap` once, `run` looped, `pounce` once — 2.5–3 s on screen, see
`PITZ` in `src/sim/frameData.ts`), so he is an animated set under the
[character art standard](../character-art-standard.md) with the **`fx` rank**: three files instead
of twelve, no roster entry, no head rig, and his size is judged on his **length** (a running cat is
wider than he is tall).

Until this set is delivered the game shows the single pouncing pose cut from Shmuel's sheet
(`public/assets/generated/fx/pitz.png`); the animated set replaces it the moment it passes the gate.

**Attach to every request:** `public/assets/references/hero-grid-quality-reference.png` (render
style) and the identity references — the cat is already designed, this set must be the same cat:
`docs/refs/shmuel-2026-kit-sheet.png` (Pitz is the tabby in the bottom row — running and pouncing),
`public/assets/generated/actions/shmuel/special.png` (the 2026 set: Pitz leaping out of the portal),
the two passing files `public/assets/generated/actions/pitz/leap.png` and `pounce.png` (same cat, same size),
and the photos of the real Pitz in `docs/refs/shmuel-source/shmuel-cat-1.png`, `-2.png`, `-3.png`.
Keep the whole set in one chat/session.

## Character card

```
ID:            pitz
RANK:          fx
NAME:          Pitz
BUILD:         adult domestic shorthair tabby, athletic and lean, long tail, medium-large ears
FACE:          classic tabby "M" on the forehead, amber-yellow eyes, pink nose, white muzzle and chin, alert expression — mouth open in a yowl when striking
COAT:          grey-brown mackerel tabby: warm grey-taupe ground with dark charcoal stripes down the back, rings on the tail and legs; white chest, belly, paws and muzzle
PALETTE:       coat #9A8B78, stripes #4A3B2E, white #F3F1EA, eyes #FFC23A, nose #E38FA0, portal / effect #35E8FF
PROPS:         none
MOVES WITH:    a real cat's gallop — a bounding run (all four paws leave the ground each stride), an explosive spring, a claws-out pounce, a braced skid
EFFECT:        cyan pixel squares (#35E8FF) — small, few, trailing off the paws and tail; the game draws the portal and the wake itself, so keep them to a hint
```

## STYLE BLOCK (paste into every request)

> Pixel-art fighting-game creature sprite, in the exact render style, outline weight and lighting of
> the attached reference sheet (`hero-grid-quality-reference.png`): clean dark outlines, 3–4 tone cel
> shading, saturated colours, readable silhouette. The cat exactly as in the attached references —
> same markings, colours, build and face as Pitz on Shmuel's character sheet and in the photos. No
> portal, no text, labels, numbers, borders, grid lines, UI, watermark, background, floor, shadow,
> scenery, people or extra animals anywhere in the image.

## FRAME BLOCK (every action request)

> Pixel-art creature animation sheet: a **3×3 grid of 9 animation frames, read left to right then
> top to bottom, on a 2048×2048 canvas with a true transparent background (real alpha channel — not a
> painted checkerboard, not a matte colour, and no grid lines or cell borders drawn on the canvas)**.
> [STYLE BLOCK] The cat faces and moves RIGHT in every frame. **Identical bottom-centre anchor in all
> 9 cells: the paws' ground line on the same baseline, the body centred on the same vertical axis,
> the cat the same size as in every other file — nose to tail-tip about two thirds of the cell
> width. Generous empty margin inside each cell — paws, ears, tail and effects never touch or cross
> a cell boundary. No ground shadow or floor under the paws.** Each of the 9 frames is a distinct,
> fully drawn, solid pose of the whole cat — **no motion-blur frames, no semi-transparent ghost
> frames, no in-between smears, no partial cat** — and never a repeated frame. Action: **<ACTION>**
> — <the 9 beats>.

## The 3 action files (`public/assets/generated/actions/pitz/`)

| file | Action: **…** — the 9 beats |
|---|---|
| `run.png` | **run** — one full gallop cycle, a real cat's bounding run: 1 gathered, hind legs tucked under the body, 2 the push-off, hindquarters driving, 3 fully stretched in the air, forelegs reaching, tail streaming straight back, 4 forepaws touch down, back beginning to arch, 5 back arched high, hind legs swinging forward under the chest, 6 hind paws land ahead of where the forepaws were, forelegs gathering, 7 compressed, coiled to spring, 8 launching, forelegs lifting, 9 leads back into frame 1. Paws on the baseline in every grounded frame. Same size throughout. **The gait must visibly cycle through gathered → stretched → landing → gathered — nine variations of one running pose are not a run cycle.** A few cyan pixel squares trailing off the tail-tip, nothing more. |
| `leap.png` | **leap** — the burst out of the portal (drawn without the portal): 1 crouched low and compact, ears back, tail curled, 2 haunches loading, chest lifting, 3 forepaws leaving the ground, mouth opening, 4 the explosive push, hind legs straightening, 5 stretched long in the air, back flat, ears back, 6 the peak of the arc, forepaws reaching forward, 7 forepaws reaching down, 8 touch-down, back arching, 9 hind legs swinging under, gathering into the gallop (this frame leads into `run` frame 1). |
| `pounce.png` | **pounce** — the finish: 1 gathers, hindquarters wiggle, eyes locked ahead, 2 crouches low, ears forward, 3 springs, hind legs driving, 4 airborne, forelegs out, claws bared, mouth open in a yowl, 5 the strike — both forepaws slamming down and forward, claws out, a small cyan pixel flash at the paws, 6 lands hard on the forepaws, 7 skids, all four legs braced, body low, a few cyan pixel squares kicked up behind, 8 stops, sits up tall, 9 looks back over the shoulder, tail flicking up (the game fades him into portal pixels on these last frames). |

## Accept

```bash
npm run intake:character -- pitz        # normalizes the container (background → alpha, canvas → 2048²)
npm run verify:character -- pitz        # rank fx is picked from the three file names; must print PASS
npm run build:assets && npm run test:assets
```

Then `/showcase.html?row=run` (and `leap`, `pounce`) — the run must loop cleanly, and the cat must
be the same size in all three files. In the game: play Shmuel, fill the meter, press SPECIAL. The
build prints `fx pitz ok (actions)` once the set is complete; before that it prints
`fx pitz pending` and the static pose ships.
