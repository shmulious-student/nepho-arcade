# Fix round 2 — art issues found in play (Gemini)

Everything below is art; the code-side bugs found in the same pass (override rows drawn 3–5× too
big, swapped hero cards, squashed card images, floating frames, the sidekick punting enemies off
screen) are already fixed in the game and need nothing from the image model.

Same rules as the other packs: **2048×2048 PNG, real alpha transparency, 3×3 grid of 9 frames read
row-major, character faces right, identical bottom-centre anchor in all 9 cells, generous margin**.
Attach the character sheet (`docs/refs/<id>-sheet.png` or `public/game/debug/anchors-<id>.png`) and
the style reference `public/assets/references/hero-grid-quality-reference.png` to every request.
Drop each file over the existing one and run `npm run build:assets && npm run test:assets`, then
watch it on `/showcase.html?row=walk`.

## Style block — paste verbatim

> Pixel-art fighting-game character, in the exact render style, outline weight, proportions and
> lighting of the attached reference sheet. The character must match the attached character sheet
> exactly — same face, hair, costume, colours, props and body proportions in every frame; this is a
> repair of one animation, not a redesign. No text, labels, numbers, borders, UI, watermark,
> background scenery or extra characters anywhere in the image.

---

## 0. White fill in enclosed gaps — applies to BOTH walk files (and any redo)

The current walk files paint flat white into every enclosed pocket of background: the gap between
Eviatar's arm and torso, the inside of Omri's microphone-cable loops. In the game these read as
white blobs flashing on every step. Add this line, bold, to every request below:

> **Every enclosed gap — between an arm and the body, between the legs, inside the microphone cable
> loop, inside the ball-and-hand — is transparent background, never filled white or any colour.**

## 1. `actions/eviatar/walk.png` — the walk cycle does not step

Problem in the current file: only one leg moves; the other stays planted, so in motion he hops on
one foot. A walk cycle has to alternate legs.

> Pixel-art fighting-game character animation sheet. A **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent RGBA background**.
> [style block] Character: EVIATAR, exactly as in the attached sheet, jogging to the RIGHT while
> dribbling the basketball with his left hand, green paint marker in his right hand. This is a
> **full, seamless run cycle in which BOTH legs alternate** — the nine frames, in order:
> 1. right foot forward on the ground, left leg trailing behind, ball at knee height;
> 2. passing position, legs together under the body, ball hits the floor;
> 3. left foot forward on the ground, right leg trailing, ball rebounding;
> 4. left foot planted, right knee lifting high in front, ball at hip;
> 5. right foot forward on the ground, left leg trailing, ball at knee height;
> 6. passing position, legs together under the body, ball hits the floor;
> 7. left foot forward on the ground, right leg trailing, ball rebounding;
> 8. left foot planted, right knee lifting, ball at hip;
> 9. same pose as frame 1, so the loop closes.
> **Each frame must show a clearly different leg position from the frame before it; the left and
> right legs swap roles every two frames.** Arms swing opposite to the legs. Body bobs up a few
> pixels on the passing frames (2, 6) and down on the contact frames (1, 3, 5, 7). Identical
> bottom-centre anchor in all 9 cells — the grounded foot always lands on the same baseline. Generous
> empty margin inside each cell; nothing touches a cell boundary. **Every enclosed gap — between the
> arm and the body, between the legs, between ball and hand — is transparent background, never filled
> white.**

## 2. `actions/omri/walk.png` — the walk cycle does not step

Same problem. Omri's walk is the capoeira ginga-step advance: springy, on the toes, mic cable
swinging — but it must still alternate legs.

> Pixel-art fighting-game character animation sheet. A **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent RGBA background**.
> [style block] Character: OMRI, exactly as in the attached sheet, advancing to the RIGHT with a
> light, bouncy capoeira step, microphone in his right hand on its short cable, barefoot. This is a
> **full, seamless walk cycle in which BOTH legs alternate** — the nine frames, in order:
> 1. right foot forward on the ground, left leg trailing behind, arms in loose guard;
> 2. passing position, legs together, up on the toes, mic cable swinging back;
> 3. left foot forward on the ground, right leg trailing;
> 4. left foot planted, right knee lifting high, a small red music note drifting off the mic;
> 5. right foot forward on the ground, left leg trailing;
> 6. passing position, legs together, up on the toes;
> 7. left foot forward on the ground, right leg trailing;
> 8. left foot planted, right knee lifting, cable swinging forward;
> 9. same pose as frame 1, so the loop closes.
> **Each frame must show a clearly different leg position from the frame before it; the left and
> right legs swap roles every two frames.** Curly hair bounces with the step. Identical bottom-centre
> anchor in all 9 cells — the grounded foot always on the same baseline. Generous empty margin inside
> each cell; nothing touches a cell boundary. **Every enclosed gap — between an arm and the body,
> between the legs, and the inside of every microphone-cable loop — is transparent background, never
> filled white.**

## 2b. `actions/omri/idle.png` — attack poses crept into the idle loop

Problem: frames 5 and 6 of the current file are a high kick and a lunge. Idle must be a loop the
character can sit in forever.

> Pixel-art fighting-game character animation sheet. A **3×3 grid of 9 animation frames, read left
> to right then top to bottom, on a 2048×2048 canvas with a true transparent RGBA background**.
> [style block] Character: OMRI, exactly as in the attached sheet, standing and facing RIGHT in the
> capoeira **ginga** — the rocking ready stance — holding the microphone loosely in his right hand.
> This is a **calm, seamless idle loop with NO kicks, NO punches and NO lunges**: the nine frames
> rock his weight from the back foot to the front foot and back, arms swaying in a loose guard, hair
> bouncing a little, the mic cable swinging gently, a faint red music note drifting up on frames 4
> and 8. Frame 9 matches frame 1 so the loop closes. Both feet stay on the ground in every frame.
> Identical bottom-centre anchor in all 9 cells; generous empty margin; nothing touches a cell
> boundary.

## 3. Check after the walk files land

Play `/showcase.html?row=walk` and `?row=idle`. If either boy still hops, regenerate with the bold
line repeated twice. If any other row drifts (feet at different heights between frames, a limb cut
at a cell edge), the pack in `docs/fix-prompts-quality-pass.md` has the per-row beats — use the
same frame block and name the row.

## 4. Still open from the quality-pass pack (unchanged)

Byte (full set), Knight (approach, knockback, getup, defeat), Shield/Brawler/Kicker (1 each) and
the boss rows in `docs/fix-prompts-quality-pass.md` — Nepho's and Punk's were delivered and are in.
Bruiser and Riva have left the roster; skip theirs.
