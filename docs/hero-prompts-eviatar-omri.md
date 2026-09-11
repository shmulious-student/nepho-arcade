# Eviatar & Omri — art generation pack

Two new lead heroes, drawn from real photos. This is everything an image model (Gemini / GPT) needs,
in the order to run it. Output paths are what the build looks for; drop files in and run
`npm run build:assets && npm run test:assets` — the moment a character's set is complete the game
switches from the recoloured stand-in to the real art, with no code change.

```
public/assets/generated/heroes/eviatar-card.png          hero-select card (square)
public/assets/generated/actions/eviatar/<action>.png     12 files, one per action (list below)
public/assets/generated/heroes/omri-card.png
public/assets/generated/actions/omri/<action>.png
```

Review the result in motion at `/showcase.html` (dev server), e.g. `/showcase.html?row=special`.

---

## How to run it (read first)

1. **Attach two references to every request**: the boy's photo, and
   `public/assets/references/hero-grid-quality-reference.png` for the render style.
2. **Step A first — the character sheet.** Generate it once per boy, check the likeness, then
   **attach that sheet to every Step B request** as well. This is what keeps the costume, palette and
   face identical across the 12 action files; without it, models drift between images.
3. Run Step B one action at a time. Keep the same chat/session per hero. If a file comes back wrong,
   regenerate just that action — the pipeline gates each file on its own.
4. **Insist on a real alpha channel.** Ask for "PNG with transparent background (alpha), not a
   checkerboard drawn into the image, not a solid colour". GPT-image supports `background:
   transparent`; in Gemini say it explicitly and check the download. If a model cannot do alpha, ask
   for a flat **pure magenta #FF00FF** background instead and tell me — the build can key it out.
5. Ask for **2048×2048**. If the model caps lower, take 1024×1024 — the gate accepts any square
   power-of-two — but detail suffers; 2048 is the target.
6. `npm run test:assets` names the exact file and cell if a frame is cut at an edge or a cell is
   empty. Regenerate that action with the "generous margin" line repeated and bolded.

---

## The two characters

### EVIATAR (11) — power hero, green & blue

Tall and strong for his age, broad shoulders, athletic. **Face from the photo**: short dark-brown hair
cropped close at the sides with a soft textured fringe brushed forward, dark eyebrows, brown eyes, a
calm, slightly smirking half-smile, light-olive skin. Outfit: a **basketball kit** — sleeveless green
jersey with blue side panels and a blue number **11** on the chest, blue basketball shorts with a green
stripe, green-and-blue high-top sneakers, blue wrist sweatband on one arm. Props: a **basketball**
(orange, classic black seams) and a bundle of **magic paint markers** — fat markers in green and blue
that trail glowing paint. His attacks are ball-handling and marker strokes; the paint is his magic.

### OMRI (9) — speed hero, red & white

Medium height, thin and wiry, quick. **Face from the photo**: a big mop of curly dark-brown hair
sticking out in every direction, big warm brown eyes, a huge open-mouthed grin, light-olive skin.
Outfit: **capoeira clothes** — white abadá trousers with a red cord belt (cordão), a loose white
sleeveless top with a red stripe, barefoot or white soft shoes, a red bandana tied at the wrist. Prop:
a **microphone** — a handheld stage mic, red with a white grille, on a short trailing cable that
whips with his movement; sound comes off it as glowing red-and-white **music notes and sound rings**.
His attacks are capoeira kicks, spins and cartwheels; the music is his magic.

---

## Style block — paste into every request, verbatim

> Pixel-art fighting-game character, in the exact render style, outline weight, proportions and
> lighting of the attached reference sheet (`hero-grid-quality-reference.png`): clean dark outlines,
> 3–4 tone cel shading, saturated colours, readable silhouette, chunky hands and feet, head about
> 1/5 of body height. The face must be a clear pixel-art likeness of the boy in the attached photo —
> same hair shape, same eyebrows, same smile — kept coherent and unobstructed. No text, labels,
> numbers, borders, UI, watermark, background scenery or extra characters anywhere in the image.

---

## Step A — character sheet (one per boy)

Save as `docs/refs/eviatar-sheet.png` / `docs/refs/omri-sheet.png` (for your own re-use; not read
by the build).

### A · Eviatar

> Character design sheet, 2048×1024, transparent background. [style block] Character: EVIATAR — an
> 11-year-old boy, tall and strong for his age, broad shoulders. Face from the attached photo: short
> dark-brown hair cropped close at the sides with a soft textured fringe brushed forward, dark
> eyebrows, brown eyes, calm half-smile, light-olive skin. Outfit: sleeveless green basketball jersey
> with blue side panels and a blue number 11, blue basketball shorts with a green stripe, green-and-blue
> high-top sneakers, blue wristband on the right arm. Props: an orange basketball with black seams
> under his left arm; a fat glowing paint marker in his right hand — green — with a blue one tucked in
> his waistband; the marker leaves a trail of glowing green paint. Show, left to right: full-body
> front view, full-body three-quarter view facing right, full-body side view facing right, a large
> head close-up, and a swatch strip of his palette (jersey green #3DDC84, blue #37AAFF, skin, hair,
> ball orange). Identical proportions in every view.

### A · Omri

> Character design sheet, 2048×1024, transparent background. [style block] Character: OMRI — a
> 9-year-old boy, medium height, thin and wiry. Face from the attached photo: a big mop of curly
> dark-brown hair sticking out in every direction, big brown eyes, a huge open-mouthed grin,
> light-olive skin. Outfit: capoeira clothes — white abadá trousers with a red cord belt, a loose white
> sleeveless top with a red stripe down the side, barefoot, a red bandana tied at the left wrist.
> Prop: a red handheld stage microphone with a white grille in his right hand, on a short cable that
> trails and whips; glowing red-and-white music notes float off the mic. Show, left to right:
> full-body front view, full-body three-quarter view facing right, full-body side view facing right,
> a large head close-up, and a swatch strip of his palette (red #FF4F72, white #F3F4E8, skin, hair).
> Identical proportions in every view.

---

## Step B — the 12 action files (per boy)

Every file uses this frame, with the two lines in **bold** always included:

> Pixel-art fighting-game character animation sheet. A **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent background (real alpha
> channel — not a painted checkerboard, not a matte colour)**. [style block] Character exactly as in
> the attached character sheet — same face, hair, costume, colours and props in all 9 frames. The
> character faces RIGHT in every frame. **Identical bottom-centre anchor in all 9 cells: feet on the
> same baseline, body on the same vertical axis; generous empty margin inside each cell — hands,
> feet, hair, the ball, the marker, the mic, paint and sound effects must never touch or cross a cell
> boundary.** Each frame is a distinct pose. Action: **<ACTION>** — <the 9 beats>.

Below, `<ACTION> — <beats>` for each file. The filename is the action name.

### B · Eviatar (`actions/eviatar/`)

| file | ACTION — the 9 beats |
|---|---|
| `idle.png` | **idle** — guard stance, dribbling the ball low with his left hand while the green marker glows in his right: ball at hip, ball halfway down, ball at floor, ball rebounding, ball at hip, slight weight shift right, shoulders roll, marker flares brighter, back to start. Loops. |
| `walk.png` | **walk** — jogging forward dribbling the ball: a full 8-step jog cycle plus a return frame, ball bouncing in time with the steps, marker held ready. Loops. |
| `dash.png` | **dash** — crossover dribble sprint: crouch and plant, explosive push-off, low sprint with the ball crossing between the legs, three frames of blurred full-speed run with green paint streaks trailing behind, hard stop with the ball palmed, skid, upright. |
| `light1.png` | **light1** — quick marker jab: marker raised, short stab forward, contact with a small green paint splat, stroke pulled back, ready. Nine crisp beats of a fast jab. |
| `light2.png` | **light2** — follow-up cross with the blue marker: shoulder turn, blue marker whips across at head height leaving a blue arc of paint, contact splat, follow-through, recover. |
| `light3.png` | **light3** — chain finisher: a 360° spin with both markers out, drawing a full circle of green-and-blue paint around himself; the circle bursts outward as splats on the last frames. |
| `heavy.png` | **heavy** — slam dunk: raises the ball high with both hands, jumps, hangs at the peak, drives the ball down into the ground, a shockwave of green paint erupts from the impact point, ball rebounds up, catch, recover. Slow wind-up, big impact, long recovery. |
| `special.png` | **special** — PAINT SPLASH: plants his feet, uncaps both markers, draws a huge fan of green-and-blue paint in front of himself with a sweeping two-arm stroke (frames 3–6 are the sweep, the fan grows each frame), the fan bursts into flying splats, shakes the markers off, back to stance. |
| `block.png` | **block** — holds the basketball in front of his chest as a shield with both hands, elbows tucked; small flinches as hits land on the ball (three impact frames with blue paint sparks), feet planted throughout. |
| `hurt.png` | **hurt** — flinch (frames 1–3: head snaps back, ball nearly dropped), heavy reel (4–6: staggers backward, marker flies up), airborne crumple (7–9: knocked off his feet, curling). |
| `knockdown.png` | **knockdown** — stagger, fall backward, lands on his back with the ball bouncing away, lies flat, rolls to one side, pushes up to one knee, grabs the ball, rises, back on his feet. |
| `defeat.png` | **defeat** — final fall: drops to a knee, marker slips from his hand, topples sideways, lies flat on the ground on the last four frames with the ball rolling to a stop beside him. Stays down. |

### B · Omri (`actions/omri/`)

| file | ACTION — the 9 beats |
|---|---|
| `idle.png` | **idle** — capoeira ginga: the rocking base step, weight swinging left and right with the arms guarding, mic held loosely in the right hand, a faint red music note drifting up on frames 4 and 8. Loops. |
| `walk.png` | **walk** — a light, bouncy capoeira-style advance: a full 8-step cycle plus a return frame, springy on the toes, mic cable swinging. Loops. |
| `dash.png` | **dash** — aú (cartwheel) sprint: crouch, launch into a cartwheel, three frames of blurred cartwheel/roll travel with red-and-white note trails behind, land in a low crouch, spring up, ginga. |
| `light1.png` | **light1** — quick kick: meia-lua de frente — a fast front crescent kick with the right leg, foot whipping across at chest height, a small burst of white notes at contact, recover to ginga. |
| `light2.png` | **light2** — follow-up: armada — a spinning back kick, body turns, heel sweeps across leaving a red sound arc, contact, follow-through, recover. |
| `light3.png` | **light3** — chain finisher: a 360° spinning kick on one hand (a low spinning rasteira into a full spin), sweeping everything around him, a ring of red-and-white notes flying outward on the last frames. |
| `heavy.png` | **heavy** — martelo em pé: a slow, huge wind-up into a massive roundhouse kick, the mic cable whipping in a wide arc, a big red sound blast at the impact frame, long recovery with him landing back into ginga. |
| `special.png` | **special** — SONIC BEAT: plants his feet, raises the mic to his mouth, and shouts three beats — three expanding rings of red-and-white sound blast outward around him, each bigger than the last (frames 3, 5 and 7 are the three beats), music notes flying everywhere, drops the mic to his side, ginga. |
| `block.png` | **block** — the capoeira negativa/esquiva: sinks low into a defensive crouch with one hand on the ground and the mic arm raised across his face, three small flinches as hits glance off, then returns up. |
| `hurt.png` | **hurt** — flinch (frames 1–3: head snaps back, hair flying), heavy reel (4–6: staggers backward, mic cable whipping), airborne crumple (7–9: knocked off his feet, curling). |
| `knockdown.png` | **knockdown** — stagger, fall backward, lands on his back, lies flat with the mic beside him, rolls, kip-up (a capoeira-style spring back to his feet), lands crouched, back in ginga. |
| `defeat.png` | **defeat** — final fall: drops to a knee, mic slips from his hand, topples sideways, lies flat on the ground for the last four frames with the mic beside him. Stays down. |

---

## Step C — hero select cards

Save as `public/assets/generated/heroes/eviatar-card.png` and `…/omri-card.png`. Square, 1024×1024
(any square size works). These are shown at 84×64, so keep them bold and simple.

> Pixel-art hero-select portrait, 1024×1024 square, transparent background. [style block] Character
> exactly as in the attached character sheet. **Eviatar** — waist-up, three-quarter view facing right,
> grinning confidently, basketball tucked under one arm, glowing green paint marker raised in the
> other hand like a sword, a swirl of green-and-blue paint behind him. Big, readable, centred.

> Pixel-art hero-select portrait, 1024×1024 square, transparent background. [style block] Character
> exactly as in the attached character sheet. **Omri** — waist-up, three-quarter view facing right,
> huge grin, mic raised to his mouth mid-shout, red-and-white music notes and a sound ring bursting
> behind him, curly hair flying. Big, readable, centred.

---

## When it's in

- `npm run build:assets` prints `hero eviatar ok (actions)` / `hero omri ok (actions)` — anything else
  means a file is missing or misnamed.
- `npm run test:assets` fails with the file and cell if something is cut; regenerate that one action.
- Open `/showcase.html` and watch each row. If the feet slide between frames, the anchor drifted —
  regenerate that action with the anchor line bolded.
- A clean set writes no `public/game/debug/defects-<id>.png`; if one appears, it shows exactly which
  frames were rejected and why.
