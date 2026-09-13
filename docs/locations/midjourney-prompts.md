# Midjourney prompts — the ten level backdrops

Midjourney takes any aspect ratio, so each level is **one generation at `--ar 4:1`** (no halves, no
stitching). Workflow per level:

1. Paste the prompt below (one line) with the parameter block at its end.
2. Pick the variant whose ground begins as a straight line at roughly 58% down and has nothing standing in
   the lower part; if none does, reroll or use *Vary (Subtle)* on the closest.
3. **Upscale (Subtle)**, download the PNG.
4. Measure where the walkable ground starts (percent of the height), then
   `node tools/place-backdrop.mjs <level> <file>.png --floor=<NN>%` → `npm run build:assets && npm run test:assets`.
5. Look at it in the game; then `npm run build && npm run content:deploy`.

Image prompts help composition: drag the current plate `public/game/levels/bg-NN.webp` in as an image
prompt with `--iw 0.5` (layout only), and for levels 1–5 the Street View frames in
`docs/refs/locations/NN-*/` at `--iw 1` for the real look. `--sref` with one finished plate keeps the
ten in one style once the first is accepted.

**Parameter block** (append to every prompt):

```
--ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars in front, animals, watermark, frame, border, blur, photo
```

**Style stem** (every prompt begins with it): *painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it*

---

## 1 · Rishon LeZion — HaSarig Street (`--floor` expected ~62%)

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — a quiet residential cul-de-sac in Rishon LeZion, Israel: red-brown interlocking brick paving, red-and-white painted kerbs, a small round turning circle at the far end, both sides lined with 6–8-storey white and cream apartment blocks with stacked balconies and light-blue glass balcony rails, entrance canopies, low red-brick garden walls with hedges, big old ficus trees and a couple of palms, cars parked nose-in along the far kerb only, hazy coastal sky --ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars in front, animals, watermark, frame, border, blur, photo

## 2 · Petah Tikva — Refael Eitan Street

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — Refael Eitan Street in the new Em HaMoshavot neighbourhood of Petah Tikva, Israel: a wide two-lane road with a planted median and bike lane, tall cream-stone and white residential towers with stacked glass balconies and rooftop pergolas, a ground-floor clinic and small shops with awnings, young ficus and palm trees along wide pavements, a green playground fence at the far right, cars parked nose-in along the far kerb only, bright hazy afternoon sky --ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars in front, animals, watermark, frame, border, blur, photo

## 3 · Barcelona — Sagrada Família from the Eixample

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — a Barcelona Eixample street in warm sun: centre, the Nativity façade of the Sagrada Família with its openwork sand-stone spires and a construction crane, palms of Plaça de Gaudí in front of it, six-storey beige modernista buildings with wrought-iron balconies and chamfered corners on both sides, plane trees, a modernista wrought-iron lamppost with a trencadís mosaic bench at the far left, the ground is grey hexagonal Gaudí pavement tiles, no pond, no water --ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars in front, animals, watermark, frame, border, blur, photo, pond, fountain, water

## 4 · Sant Cugat — Plaça d'Octavià and the monastery

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — Plaça d'Octavià in Sant Cugat del Vallès, Catalonia, bright morning: centre-right the Romanesque-Gothic monastery façade in sand-coloured stone with a large rose window, a sculpted pointed-arch portal, battlements and a square bell tower, three tall cypresses along its old stone wall, left, pastel two- and three-storey town houses with iron balconies, a café terrace with umbrellas and plane trees, a small stone fountain at the far edge, the ground is light granite paving --ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars in front, animals, watermark, frame, border, blur, photo

## 5 · Hatikva School — Col·legi Hatikva, Valldoreix

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — the sports court of a small school on a wooded hillside near Barcelona, sunny late morning: behind the court a white three-storey school building with rows of windows and an outside metal staircase, a low white wall with a blue-and-white geometric tile mural running along the court's edge, basketball hoops with glass backboards at both sides, a huge shade tree over wooden picnic tables at the far left, an olive tree by a glass entrance, umbrella pines and a green wooded ridge behind everything, clear blue sky, the ground is grey asphalt with faint yellow and white court lines --ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars, animals, watermark, frame, border, blur, photo

## 6 · Capoeira gym — "Academia Ginga" (interior)

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, warm daylight through high frosted windows, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — the inside of a capoeira academy hall: a long back wall with a huge hand-painted mural in Brazilian green, yellow and blue of silhouetted capoeira players in a roda under a crescent moon, three berimbaus, an atabaque drum and two pandeiros hung on hooks beside it, a low wooden stage at the far end with drums on it, a floor-to-ceiling mirror wall with a ballet bar on the left, on the right a rack of coloured cords, framed photos, a Brazilian flag and an Israeli flag, a bench with water bottles, a stack of blue mats and a standing fan against the far wall, the ground is a pale sprung wooden floor --ar 4:1 --style raw --s 120 --v 7 --no text, letters, logos, people, figures, characters, watermark, frame, border, blur, photo

## 7 · Basketball gym — municipal sports hall (interior)

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, daylight through high mesh-covered windows, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — the inside of a municipal basketball sports hall in Israel: a long far wall with a folding bleacher of blue seats, a red-digit scoreboard in the middle, blue-white-orange team banners hung from white steel roof trusses with strip lights, an Israeli flag at the far right, glass backboards with orange hoops and blue wall padding at both ends, a ball cart with orange balls, gym bags on a bench and a water cooler against the far wall at the left, the ground is honey-coloured parquet with blue and orange court lines and a big orange centre logo shape --ar 4:1 --style raw --s 120 --v 7 --no text, letters, numbers on banners, logos, people, figures, characters, watermark, frame, border, blur, photo

## 8 · Theater — from the stage (interior)

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, warm gold stage lighting, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — a theatre stage seen from stage level: deep-red velvet curtains with gold fringe tied back at both ends, a painted backcloth of a city at night with silhouetted rooftops, lit windows and a full moon spanning the middle, a lighting rig of warm spotlights and magenta and cyan gels on black bars above, stacked painted scenery flats, wooden crates, a props table with a crown and a sword, a ladder and a rail of costumes in the wings, an upright piano at the far left, footlights along the front edge, the ground is honey-brown wooden stage boards --ar 4:1 --style raw --s 120 --v 7 --no text, letters, logos, people, figures, characters, audience, watermark, frame, border, blur, photo

## 9 · Candy factory — "Mamtakei Savta" (interior)

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, bright daylight from skylights, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — a small old-fashioned candy factory production floor: a big copper boiling kettle on a brick base with steam at the left, a taffy-pulling machine stretching red-and-white candy, a long conveyor belt carrying rows of brightly wrapped candies past a wrapping machine into a cooling tunnel, a tall glass gumball tower full of coloured balls, cartons stacked on wooden pallets and sacks of sugar against the far wall, pink, yellow and mint pipes running overhead, a glass-walled control room with round dials at the far right, the ground is grey concrete with yellow-and-black safety stripes along the machine bases --ar 4:1 --style raw --s 120 --v 7 --no text, letters, brand names, logos, people, figures, characters, watermark, frame, border, blur, photo

## 10 · Catalunya — Bunkers del Carmel panorama

painted pixel-art side-scrolling beat-em-up stage background, 16-bit arcade style, crisp clean edges, flat cel shading with light dithering, saturated colours, golden late-afternoon light, wide panoramic view, eye level, horizon line at 58% from the top, the lower 42% of the image is one open flat empty ground plane with nothing on it — the view from the Bunkers del Carmel hilltop above Barcelona: the whole city spread below in its street grid with the Sagrada Família's spires rising from it, the port and a blue Mediterranean beyond, Montjuïc hill at the right, the Collserola ridge with the Tibidabo church and communications tower at the left, the jagged Montserrat massif faint on the far horizon, pines, agaves and dry grass at the sides, a low stone wall along the edge, the ground is the flat weathered concrete terrace of the old bunkers --ar 4:1 --style raw --s 120 --v 7 --no text, letters, signs, logos, people, figures, characters, cars, animals, watermark, frame, border, blur, photo

---

Notes: keep `--style raw` (the default aesthetic adds painterly softness the pixel plates do not have); if
a result looks too photographic push `--s` down to 50, if too plain up to 250. `--no cars` on the street
levels sometimes removes the parked cars in the background too — that is fine. The 58% line is the
*ground's far edge* (kerb / wall base / back line), not the sky horizon; if MJ ignores it, measure and pass
`--floor` — the tool corrects up to ~15% of shift cleanly.
