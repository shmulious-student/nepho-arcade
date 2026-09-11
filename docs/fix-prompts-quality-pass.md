# Fix pack — regenerating the frames the quality pass rejected

The build currently hides 63 defective source frames across 17 characters by holding a neighbouring
clean frame instead (see `public/game/debug/defects-<id>.txt`). This pack regenerates exactly those
actions — **one 3×3 file per broken action, nothing else** — plus Byte in full, because her delivered
grids are a copy of Riva's.

You do not regenerate whole characters. A single per-action file dropped at

```
public/assets/generated/actions/<id>/<action>.png
```

replaces just that row of the character's existing grid (9 frames where it had 6). Run
`npm run build:assets && npm run test:assets`; the build prints `<id>: N action override(s) …`, the
gate fails on the exact file and cell if a frame is cut, and `/showcase.html?row=<action>` shows it in
motion. Byte's 12 files make a complete set and switch her over entirely.

**Priority order** (what players see most): Punk → Nepho → Bruiser → Byte → Knight → Ferryman → the
rest. 41 files in total; Punk alone fixes the ugliest thing in the game.

---

## How to run it

1. Attach `public/assets/references/hero-grid-quality-reference.png` (render style) **and a reference
   of the character** to every request. For the character reference use the build's own contact
   sheet, `public/game/debug/anchors-<id>.png` — it is the character exactly as they are in the game.
   (Byte has no valid sheet; use the description and `public/game/cards/byte.webp`.)
2. Say the character must match the reference sheet **exactly** — same design, palette, proportions —
   this is a repair, not a redesign.
3. One action per request. If it comes back cut at an edge, regenerate with the margin line bolded.
4. Real alpha transparency, 2048×2048 (1024 acceptable). If the model cannot do alpha, ask for a flat
   pure magenta `#FF00FF` background — the build keys it out.

## Style block — paste into every request, verbatim

> Pixel-art fighting-game character, in the exact render style, outline weight, proportions and
> lighting of the attached reference sheet: clean dark outlines, 3–4 tone cel shading, saturated
> colours, readable silhouette. The character must match the attached character sheet exactly — same
> face, hair, costume, colours, props and body proportions in every frame; this is the same character,
> not a redesign. No text, labels, numbers, borders, UI, watermark, background scenery or extra
> characters anywhere in the image.

## Frame block — every action file

> Pixel-art fighting-game character animation sheet. A **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent background (real alpha
> channel — not a painted checkerboard, not a matte colour)**. [style block] The character faces RIGHT
> in every frame. **Identical bottom-centre anchor in all 9 cells: feet on the same baseline, body on
> the same vertical axis; generous empty margin inside each cell — hands, feet, hair, weapons and
> every effect must never touch or cross a cell boundary.** Each frame is a distinct pose. Action:
> **<ACTION>** — <the 9 beats>.

---

## The 9 beats per action (fill `<ACTION> — <beats>` from here)

Heroes and enemies share the same action names where they overlap; a character's own special is
described in their entry below.

| action | the 9 beats |
|---|---|
| **approach** (enemy) | advance on the player: two steps in, drops into a threat pose, lunging step, wind-up of their weapon or fists, a short feint, reset stance, two more steps. Menacing, readable. |
| **attack** (enemy / boss) | their standard strike: wind-up, step in, the strike lands (one impact frame with a small effect), follow-through, over-extended, pull back, recover, stance. |
| **combo** (enemy) | a two-hit follow-up: quick first hit, transition, heavier second hit with impact, recovery. |
| **heavy** | slow, committed power blow: long wind-up over three frames, launch, a big impact frame, long recovery. |
| **dash** | crouch and plant, explosive push-off, three frames of blurred full-speed run with a motion trail behind, hard stop, skid, upright. |
| **guard** (enemy) | weapon or arms raised in a block, three small flinches as hits land (spark at each), holds, lowers. |
| **hurt** | flinch (frames 1–3: head snaps back), heavy reel (4–6: staggers backward), airborne crumple (7–9: knocked off their feet, curling). |
| **knockback** (enemy) / **knockdown** (hero) | thrown backward off their feet, tumbling through the air (frames 1–4 airborne, body fully inside the cell), lands on their back, lies flat, rolls, pushes up to a knee, back on their feet. |
| **getup** (enemy) | from lying flat: stirs, rolls to the side, pushes up on one hand, kneels, rises, stance. |
| **defeat** | final fall: drops to a knee, weapon slips, topples sideways, lies flat on the ground for the last four frames — **the whole body inside the cell every frame**. Stays down. |
| **special** | see the character's entry. |

---

## Characters and the files each needs

### punk — 5 files (`actions/punk/`)

Street thug: tall spiked red hair, sleeveless dark-blue denim vest over a bare chest, a chain at the
hip, ripped blue jeans, red high-top sneakers, big fists. His fire: red-orange flames on his fists.

- `special.png` — **special** — FLAMING FISTS: crouches and clenches, both fists ignite in red-orange fire, two frames of gathering flame, a lunging haymaker with the fist wreathed in fire leaving a flame streak, impact burst, follow-through with embers, shakes the fire out, stance. The fire must stay inside the cell.
- `hurt.png`, `knockback.png`, `getup.png`, `defeat.png` — beats from the table.

### nepho — 4 files (`actions/nepho/`)

Lean young male fighter, spiky black hair, sleeveless dark-navy tunic over dark trousers, wrapped
forearms, a long teal scarf-cape trailing behind him, teal energy.

- `heavy.png` — **heavy** — a spinning teal crescent slash: wind-up over the shoulder, the blade of teal light sweeps in a full arc that stays inside the cell, impact, follow-through, recover.
- `special.png` — **special** — RADIAL BURST: hands drawn to the chest gathering teal light (frames 1–3), a 360° shockwave of teal light explodes outward from him (frames 4–6, the ring growing but never reaching the cell edge), the light fades (7–8), stance.
- `knockdown.png`, `defeat.png` — beats from the table.

### bruiser — 4 files (`actions/bruiser/`)

Very broad, heavyset male brawler, curly brown hair, orange armoured bodysuit with segmented
shoulder and knee plates over a dark-grey undersuit, metal belt buckle, huge fists.

- `dash.png` — **dash** — a lumbering charge: heavy crouch, shoulder-first launch, three frames of a thundering run with dust behind, skidding stop, upright.
- `special.png` — **special** — ARMOURED SLAM: plants, both fists gather orange fire (1–3), leaps, drives both fists into the ground (5), a burst of orange flame erupts forward along the floor (6–7, inside the cell), recovers (8–9).
- `knockdown.png`, `defeat.png` — beats from the table. **No detached glove**: both hands stay attached to the body in every frame.

### riva — 1 file (`actions/riva/`)

Athletic young woman, long dark-brown hair in a high ponytail, white sports top, lime-green cargo
trousers with a dark panel, white trainers, fingerless gloves, lime-green energy.

- `defeat.png` — beats from the table.

### byte — 12 files, full set (`actions/byte/`)

Female boxer: pink/magenta hair in an undercut ponytail, black sports-bra top, magenta fingerless
boxing gloves with dark straps, dark athletic trousers, pink energy. Generate her **character sheet
first** (front, three-quarter, side, head close-up, palette: magenta #FF76C8, black, skin) with the
style block, attach it to every action, then all twelve: `idle`, `walk`, `dash`, `light1` (jab),
`light2` (cross), `light3` (spinning hook finisher that hits all around), `heavy` (wind-up haymaker),
`special`, `block`, `hurt`, `knockdown`, `defeat`.

- `special.png` — **special** — FOUR-SHOT VOLLEY: guard up, then four rapid punches forward (frames 2, 4, 6, 8) each launching a pink energy bolt from the glove — the bolts drawn just ahead of the glove, inside the cell — recovery on 9.

### knight — 4 files (`actions/knight/`)

Armoured knight in dark-blue plate with a flowing blue cape, glowing blue energy sword, blue visor.

- `approach.png` — **approach** — advances with the blade low, then a thrusting lunge: the blue energy beam extends from the sword tip **and ends inside the cell with a tapered point, never cut flat**.
- `knockback.png`, `getup.png`, `defeat.png` — beats from the table (the sword stays in hand or lands beside him, inside the cell).

### shield — 1 file (`actions/shield/`)

Heavy armoured trooper in black plate with red light seams, a tall red-lit riot shield on the left
arm, red visor.

- `special.png` — **special** — SHIELD CHARGE: braces behind the shield, three frames of a charging run with red light streaking off the shield's edge, a slamming impact with a red shockwave (inside the cell), recoil, reset.

### brawler — 1 file (`actions/brawler/`)

Bald, hugely muscular brawler, black tank top, orange trousers, chains across the chest, black boots.

- `approach.png` — beats from the table.

### kicker — 1 file (`actions/kicker/`)

Purple-haired female street fighter, high ponytail, black jacket, fishnet leggings, purple boots.

- `approach.png` — beats from the table.

### Bosses (`actions/<boss>/`) — 6-action characters; only the listed files

- **ferryman** — 3 files: `attack.png`, `hurt.png`, `defeat.png`. A tall hooded figure in a dark hoodie with teal light seams, swinging a chain with a hook on the end. **attack** — the chain hook whipped forward in an arc that stays inside the cell.
- **glass-warden** — 1 file: `defeat.png`. Armoured knight in dark-blue plate with a blue cape and a blue energy blade (larger, heavier build than the enemy knight).
- **monk-zero** — 2 files: `attack.png`, `defeat.png`. A tall woman with long black hair in a black dress with gold trim and gold gauntlets, martial-arts palm strikes and spinning kicks.
- **market-king** — 1 file: `defeat.png`. A bio-brawler with a green mohawk, glowing green tubes and vials strapped to his armour, green energy.
- **railmaw** — 2 files: `special.png`, `defeat.png`. Armoured shield trooper in black plate with red light seams and a red-lit riot shield (the boss version of Shield). **special** — a charging shield rush ending in a red shockwave, inside the cell.
- **crown-runner** — 1 file: `defeat.png`. Purple-haired female fighter in a black jacket and fishnets (the boss version of Kicker).
- **ultra-signal** — 2 files: `attack.png`, `defeat.png`. A rainbow-haired queen in a white-and-gold gown with a prismatic aura. **attack** — a sweeping wave of rainbow light from her hand, inside the cell.
- **the-null** — optional, 2 files: `special.png`, `defeat.png`. A black glitch-static figure with a jagged blade. Its rejected frames are it dissolving into static, which may be intended; regenerate only if the held frames look wrong in play, and keep the figure recognisable in every frame.

---

## After it lands

```bash
npm run build:assets && npm run test:assets
```

- `build:assets` prints `<id>: N action override(s) on top of the older grid: …` for each character
  and `hero byte ok (actions)` once her set is complete.
- `test:assets` must end with `asset gates passed`; a cut frame fails with the file and cell.
- A character's `public/game/debug/defects-<id>.txt` should no longer list the replaced actions;
  the file disappears entirely once nothing is rejected.
- `/showcase.html?row=<action>` — watch the new row across the roster.
