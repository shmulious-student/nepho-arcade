# Gemini (Antigravity) — redraw the ten level backdrops, one at a time

You are working in `/Users/shmuelvachnish-mbpr/Projects/GitHub/Nepho`, branch `game/core`. The game **EviOmri** has ten
side-scrolling levels; each one's backdrop is a single painted plate, and every plate is to be redrawn so it looks like
the real place the level is named after (or the invented place its file describes). Your job is to generate the ten
plates **one image request at a time**, in the order below, put each one into the build, check it, and commit it — and
not stop until all ten are in. There is no one to ask: the prompt files answer everything.

Read first, in this order:

1. `docs/locations/README.md` — the table of levels, the work order, the delivery rules.
2. `docs/locations/level-NN-<id>.md` for the level you are on — the place, its reference photos, what the current plate
   gets wrong, the **Prompt** to send verbatim, and the **Request card** (exactly what to attach, save and run).

## Work order

`1 rishon → 2 petah-tikva → 5 hatikva-school → 3 barcelona → 4 sant-cugat → 10 catalunya → 6 capoeira-gym → 7 basketball-gym → 8 theater → 9 candy-factory`

(the family's own places first, then the real Catalan ones, then the four imaginary interiors).

## Hard rules

- **One image request in flight at a time.** Never generate two plates in parallel, never put two levels in one image.
- **Every plate is generated art from the Prompt in its file.** Do not crop, stitch, upscale or paint over the
  reference photos or the existing plates, and do not edit the prompt text except to add the bolded retry line.
- **Never edit** `tools/place-backdrop.mjs`, `tools/build-assets.mjs`, `tools/check-assets.mjs` or anything under
  `src/`. If a tool errors, log it and move on to the next level.
- Do not touch `public/game/roster.json`, `public/assets/generated/actions/**`, or any character file.
- Attach the reference images listed in the level's Request card **as images** to the generation request; attach the
  current plate too (it fixes the composition). If the tool cannot take attachments, describe the references in one
  extra sentence and go on.
- **Set the image aspect ratio to 21:9 on every request** (the model supports it; the first run left it at 16:9 and
  the halves came out 1254×700, too narrow for a 4:1 plate). If your tool really cannot set 21:9, generate a **third
  tile** the same way ("continue this exact scene to the right", previous tile attached) and stitch all three.
- **A plate is two 21:9 generations, stitched.** The finished plate is 4:1 (2800×700) and no image model outputs that
  in one go, so every level is: request 1 = the Prompt as the left part at **21:9**; request 2 = *same session, request-1
  image attached*, the "continue this exact scene to the right" line from the Request card, also 21:9; then
  `node tools/stitch-backdrop.mjs left right plate` (it finds the overlap and blends the seam). If your tool can output
  4:1 or wider directly, do one request at 2800×700 and skip the stitch. Never accept portrait or square output.
- Rejects: any visible text or lettering, any person or figure, anything standing in the bottom third (cars, benches,
  furniture in the lane), night lighting on levels 1–5 and 10, photo texture instead of painted pixel-art.

## Per level

1. Read `docs/locations/level-NN-<id>.md` fully.
2. **Request 1:** the Prompt, verbatim, plus the 21:9 line from the Request card, with the listed attachments. Save it
   exactly as `docs/refs/locations/NN-<id>/gen-left.png`. Look at it before going on: right place, painted style, empty
   flat lane in the bottom third, no text, no people — if not, regenerate once with the failing rule first and bolded.
3. **Request 2:** in the same session, attach `gen-left.png`, send the "continue this exact scene to the right" line
   from the Request card. Save as `docs/refs/locations/NN-<id>/gen-right.png`. Its left third must visibly repeat the
   right third of `gen-left.png`; if it drew something unrelated, regenerate it once repeating that rule first and bolded.
4. Run:
   ```bash
   node tools/stitch-backdrop.mjs docs/refs/locations/NN-<id>/gen-left.png docs/refs/locations/NN-<id>/gen-right.png docs/refs/locations/NN-<id>/gen-plate.png
   node tools/place-backdrop.mjs <N> docs/refs/locations/NN-<id>/gen-plate.png
   npm run build:assets && npm run test:assets
   ```
   The stitch prints each join's overlap and mean pixel difference and flags **HIGH** when a tile did not repeat the
   previous one; it cuts at the best-matching column so nothing ghosts, but look at `gen-plate.png` for a hard seam
   before accepting. `place-backdrop` never crops height: a plate narrower than 4:1 is placed at the left and the rest
   is a blurred extension — it prints how many of the 5 waves the real art covers. **Accept only if that is ≥ the
   level's wave count** (3 for every level today) — otherwise add a third tile.
5. **Look at** `public/game/levels/bg-NN.webp` and judge it against the "Accept when" line in the Request card.
   If it fails, regenerate the half at fault **once** with the failing rule repeated first and **bolded**, re-stitch and
   re-place; if it fails again, delete `public/assets/generated/backdrops/level-NN.png` (the build falls back to the old
   plate), log it, and move on. Come back to parked levels after the tenth.
6. Commit that level only:
   ```bash
   git add public/assets/generated/backdrops/level-NN.png docs/refs/locations/NN-<id>/gen-*.png public/game/levels/bg-NN.webp public/game/catalog.json public/game/manifest.json docs/locations/level-NN-<id>.md
   git commit -m "Level N backdrop: <place> — generated by Gemini from docs/locations/level-NN-<id>.md"
   ```
   (append a short `## Log` line to the level file first: attempt count, what needed the bolded retry.)
7. Append one line to `docs/prompts/QUEUE-LOG.md`: `HH:MM backdrop level N attempt k → ACCEPTED | PARKED: <reason>`.

## When all ten are in

```bash
npm test
npm run build && npm run content:deploy
```

Do **not** build the APK or bump the Android version — the owner does that. Finish by printing the list of levels
accepted / parked with their attempt counts.
