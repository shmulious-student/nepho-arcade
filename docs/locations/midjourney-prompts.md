# Midjourney V8.2 prompts — the ten level backdrops

Written for **V8.2** (default since 2026-07-24) and what it changes:

- **One generation per level at `--ar 4:1 --hd`.** HD renders natively at 2048 px on the long side and its aspect limit
  is exactly 4:1 — so a plate comes out **2048×512 in one go**, no halves, no stitching. `place-backdrop` scales it to
  2800×700 (1.37×, Lanczos — fine for these painted plates).
- **`--raw`** (V8 syntax — `--style raw` is V7): V8.2 "applies a bolder house style" otherwise; raw keeps it literal.
  `--q` is gone; `--no` works; `--exp` (0–100) adds detail/tone-mapping — keep it at 10; `--chaos 0` keeps the four
  variants close once a look is found; `--seed` is reliable enough on V8 to lock a composition and then edit words.
- **Natural-language, literal, in this order: subject → details → context → style → technical.** V8 executes what
  it reads and responds well to explicit spatial language — so the lane and the 58% line are written as plain
  instructions, not tags, and there are no filler words ("masterpiece", "8k").
- **`--sref` is native on V8** (`--sw` 0–1000, default 100): once level 1 is accepted, put its image URL in `--sref`
  on the other nine at `--sw 80` so all ten plates share one hand. Do not use `--oref` (it silently routes through V7)
  and do not use `--p` (personalisation would pull the plates toward your taste profile instead of the game's style).
- **Image prompts** (URLs at the very start of the prompt): the current plate `public/game/levels/bg-NN.webp` at
  `--iw 0.5` for layout, and for levels 1–5 the Street View / site photos from `docs/refs/locations/NN-*/` at `--iw 1`
  for the real place. Upload them to Midjourney first (or any public URL).
- **Draft mode** (`--draft`, V8.1 only, 24 images for 0.4 GPU-min) is a cheap way to find the composition; then rerun
  the chosen prompt on 8.2 with `--hd`. Pan / Zoom / Vary Region downscale HD to SD — don't edit the final, reroll it.

**Per level:** paste the prompt → pick the variant whose lane is clean and whose ground edge is a straight line near
58% down → download the HD PNG → measure the ground edge → `node tools/place-backdrop.mjs <N> file.png --floor=<NN>%`
→ `npm run build:assets && npm run test:assets` → look at it in the game → `npm run build && npm run content:deploy`.

**Parameter block** (append to every prompt; add `--sref <level-1 url> --sw 80` from level 2 on):

```
--ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, watermark, frame, border, blur, photograph
```

## The lane — written into every prompt

The characters only ever walk on the **lower 42%** of the plate. So every prompt says, in words V8 follows:

> The lower 42% of the image is the walkable fighting lane: one continuous, flat, evenly lit surface of *[material]*
> running the full width, with nothing standing on it. Its far edge is a straight horizontal line 58% down the image,
> **marked by a natural built element** — *[a red-and-white painted kerb / a low stone wall / the court's painted back
> line / the front edge of the stage]* — so the lane reads as its own band; the scenery stays behind that line.

That "natural element" is what makes the lane read on a phone without any HUD help: a kerb, a wall base, a change of
paving, a painted line, a row of planters — something a street or a hall really has.

---

## 1 · Rishon LeZion — HaSarig Street (expect `--floor` ≈ 60%)

A quiet residential cul-de-sac in Rishon LeZion, Israel, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of red-brown interlocking brick paving running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a red-and-white painted kerb, and everything else stays behind that kerb. Behind the kerb: a narrow road with cars parked nose-in, a small round turning circle with a hedge, then 6–8-storey white and cream apartment blocks with stacked balconies and light-blue glass balcony rails, entrance canopies, low red-brick garden walls with hedges, big old ficus trees and two palms. Bright hazy Mediterranean morning, sun from the left. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, watermark, frame, border, blur, photograph

## 2 · Petah Tikva — Refael Eitan Street

Refael Eitan Street in the new Em HaMoshavot neighbourhood of Petah Tikva, Israel, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of light-grey concrete paving slabs running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a grey kerb with a low clipped hedge behind it, and everything else stays behind that hedge. Behind it: a planted median with young ficus trees and a bike lane, cars parked nose-in along the far side, then tall cream-stone and white residential towers with stacked glass balconies and rooftop pergolas, a ground-floor clinic and small shops with awnings, palms, a green playground fence at the far right. Bright hazy afternoon, sun from the right. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, watermark, frame, border, blur, photograph

## 3 · Barcelona — Sagrada Família from the Eixample

A Barcelona Eixample street below the Sagrada Família, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of grey hexagonal Gaudí pavement tiles running the full width, evenly lit, with nothing standing on it — no pond, no fountain, no bench on the lane; its far edge is a straight horizontal line 58% down the image marked by a granite kerb and a row of plane-tree trunks with iron tree grates, and everything else stays behind that kerb. Behind it: the Nativity façade of the Sagrada Família rising in the centre with its openwork sand-stone spires and one construction crane, palms of Plaça de Gaudí at its foot, six-storey beige modernista buildings with wrought-iron balconies and chamfered corners on both sides, a modernista wrought-iron lamppost with a trencadís mosaic bench at the far left, behind the kerb. Warm Mediterranean afternoon sun. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, pond, fountain, water, watermark, frame, border, blur, photograph

## 4 · Sant Cugat — Plaça d'Octavià and the monastery

Plaça d'Octavià in Sant Cugat del Vallès, Catalonia, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of light granite paving slabs running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a low sand-stone wall with three tall cypresses growing behind it, and everything else stays behind that wall. Behind it: centre-right the Romanesque-Gothic monastery façade in sand-coloured stone with a large rose window, a sculpted pointed-arch portal, battlements and a square bell tower; left, pastel two- and three-storey town houses with iron balconies, a café terrace with white umbrellas under plane trees, a small stone fountain at the far edge behind the wall. Bright Catalan morning, soft shadows. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, watermark, frame, border, blur, photograph

## 5 · Hatikva School — the court at Col·legi Hatikva, Valldoreix

The sports court of a small school on a wooded hillside near Barcelona, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of grey asphalt with faint yellow and white court lines running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by the court's painted white back line and a low white wall with a blue-and-white geometric tile mural, and everything else stays behind that wall. Behind it: a white three-storey school building with rows of windows and an outside metal staircase, basketball hoops with glass backboards at both sides standing behind the line, a huge shade tree over wooden picnic tables at the far left, an olive tree by a glass entrance, umbrella pines and a green wooded ridge behind everything, clear blue sky. Sunny late morning. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, cars, watermark, frame, border, blur, photograph

## 6 · Capoeira gym — "Academia Ginga" (interior)

The inside of a capoeira academy hall, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of pale sprung wooden floorboards running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a painted white roda circle line and the base of the mirror wall, and everything else stays behind that line. Behind it: a long back wall with a huge hand-painted mural in Brazilian green, yellow and blue of silhouetted capoeira players in a roda under a crescent moon; three berimbaus, an atabaque drum and two pandeiros hung on hooks beside it; a low wooden stage at the far end with drums on it; a floor-to-ceiling mirror wall with a ballet bar on the left; on the right a rack of coloured cords, framed photos, a Brazilian flag and an Israeli flag, a bench with water bottles, a stack of blue mats and a standing fan against the far wall. Warm afternoon daylight through high frosted windows on the right. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, logos, people, figures, characters, watermark, frame, border, blur, photograph

## 7 · Basketball gym — municipal sports hall (interior)

The inside of a municipal basketball sports hall in Israel, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of honey-coloured parquet with blue and orange court lines and a big orange centre-circle shape running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by the court's painted blue sideline and the front edge of the bleachers, and everything else stays behind that line. Behind it: a long wall with a folding bleacher of blue seats, a red-digit scoreboard in the middle, blue-white-orange team banners hung from white steel roof trusses with strip lights, an Israeli flag at the far right, glass backboards with orange hoops and blue wall padding at both ends, a ball cart with orange balls, gym bags on a bench and a water cooler against the far wall at the left. Daylight through high mesh-covered windows. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, numbers, logos, people, figures, characters, watermark, frame, border, blur, photograph

## 8 · Theater — from the stage (interior)

A theatre stage seen from stage level, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of honey-brown wooden stage boards running the full width, evenly lit by warm footlights, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a row of tape marks and the bottom hem of the painted backcloth, and everything else stays behind that line. Behind it: deep-red velvet curtains with gold fringe tied back at both ends, a painted backcloth of a city at night with silhouetted rooftops, lit windows and a full moon spanning the middle, a lighting rig of warm spotlights with magenta and cyan gels on black bars above, stacked painted scenery flats, wooden crates, a props table with a crown and a sword, a ladder and a rail of costumes in the wings, an upright piano at the far left. Warm gold stage light from the front, cool blue from the backcloth. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, logos, people, figures, characters, audience, watermark, frame, border, blur, photograph

## 9 · Candy factory — "Mamtakei Savta" (interior)

A small old-fashioned candy factory production floor, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of grey sealed concrete running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a yellow-and-black safety stripe along the base of the machines, and everything else stays behind that stripe. Behind it: a big copper boiling kettle on a brick base with steam at the left, a taffy-pulling machine stretching red-and-white candy, a long conveyor belt carrying rows of brightly wrapped candies past a wrapping machine into a cooling tunnel, a tall glass gumball tower full of coloured balls, cartons stacked on wooden pallets and sacks of sugar against the far wall, pink, yellow and mint pipes running overhead, a glass-walled control room with round dials at the far right. Bright daylight from skylights. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, brand names, logos, people, figures, characters, watermark, frame, border, blur, photograph

## 10 · Catalunya — Bunkers del Carmel panorama

The view from the Bunkers del Carmel hilltop above Barcelona, painted as a 16-bit side-scrolling beat-em-up stage background. The lower 42% of the image is the walkable fighting lane: one continuous flat surface of weathered pale concrete terrace running the full width, evenly lit, with nothing standing on it; its far edge is a straight horizontal line 58% down the image marked by a low rough stone parapet wall, and everything else stays beyond that wall. Beyond it: the whole city spread far below in its street grid with the Sagrada Família's spires rising from it, the port and a blue Mediterranean beyond, Montjuïc hill at the right, the Collserola ridge with the Tibidabo church and communications tower at the left, the jagged Montserrat massif faint on the far horizon, a few pines, agaves and dry grass just beyond the parapet at the sides. Golden late-afternoon light from the right. Crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, wide panoramic eye-level view. --ar 4:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no text, letters, signs, logos, people, figures, characters, animals, cars, watermark, frame, border, blur, photograph

---

Tuning: if a result reads photographic, drop `--s` to 80 and keep `--raw`; if it reads flat or empty, raise `--s` to
250 and `--exp` to 25 (above ~50 `--exp` starts to override stylize). If V8.2 puts the ground edge lower than 58%, it is
still fine — measure it and pass `--floor`; the tool corrects up to ~15% cleanly. A variant with anything standing on
the lane (a car, a bench, a pond) is a reject, not a fix — reroll with `--chaos 20`.
