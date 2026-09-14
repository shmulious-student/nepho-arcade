# EviOmri — rebrand, icon and marketing art (Midjourney V8.2)

One session, twelve generations. Every prompt is natural-language in V8 order, ends with the same parameter
block, and **contains no text request except the wordmark** — V8 renders short words well but garbles anything
longer, so every piece that needs "EVIOMRI" asks for exactly that one word (and "CIRCUIT BREAKERS" as a second,
smaller line where noted), spelled out letter by letter in the prompt. Anything text-heavy (store listing, feature
bullets) is composited later in code, not generated.

**Cast reference — attach to every prompt that shows the heroes** (upload once, reuse the URLs at the start of the
prompt, `--iw 1.5`): `public/game/cards/eviatar.webp`, `omri.webp`, `shmuel.webp`, `savta-orly.webp`,
`saba-kobi.webp`, `noa.webp`. They are the faces and outfits; the descriptions below repeat them so the model keeps
them even when the reference is weak:

- **Eviatar** — boy, green basketball kit #11, magic paint markers, paint-splash energy
- **Omri** — boy, red-and-black striped capoeira top, microphone, sound-wave energy
- **Shmuel** — bearded man, blue-and-garnet striped football jersey, black shorts, fingerless gloves; his tabby cat **Pitz** beside him
- **Savta Orly** — grandmother, apron, big ladle, warm gold
- **Saba Kobi** — fit early-60s grandfather, white polo, cross-body bag, shesh-besh (backgammon) pieces
- **Noa** — young woman, leopard-print top, rolling pin, a pothos vine

**Style stem** (every prompt starts with it): *16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat
cel shading with light dithering, saturated colours, neon cyan (#75f5dc) and gold (#ffcf5c) accents on deep navy
(#050711)*

**Parameter block:**

```
--raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos
```

Accept level 1 (the wordmark) first, then `--sref <its url> --sw 80` on everything else so the set shares one hand.

---

## 1 · Wordmark / logo — transparent-ready

*(replaces `public/assets/generated/ui/logo.svg` as a raster; keep the SVG as fallback)*

16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a game logo on a plain flat solid black background: the single word "EVIOMRI" in heavy condensed blocky arcade capitals, spelled E-V-I-O-M-R-I, filled with a cyan-to-teal gradient, a dark navy outline and a soft cyan glow, sitting on a small gold ribbon banner that reads "CIRCUIT BREAKERS" in smaller gold capitals; thin circuit-board traces and two small glowing nodes behind the letters, nothing else. Centered, wide, lots of empty black around it. --ar 3:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 2 · App icon — 1:1

*(→ `public/assets/generated/ui/icon-512.png`, then the Android mipmaps via `docs/prompts/brand-eviomri.md`)*

16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a mobile app icon filling the whole square: a rounded deep-navy square with a thin cyan rim; in the centre a raised fist in cyan-and-gold cyber armour with a lightning crack of energy around it, seen straight on, big and readable at 48 px; below the fist the single word "EVIOMRI" in small heavy arcade capitals, spelled E-V-I-O-M-R-I, cyan on navy. No other text. Flat, bold, no gradients bleeding off the edge. --ar 1:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 3 · App icon, alternate — Pitz

16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a mobile app icon filling the whole square: a rounded deep-navy square with a thin cyan rim; in the centre the head of a grey-brown mackerel tabby cat with amber eyes and a white muzzle, mid-yowl, bursting out of a ring of cyan pixel-portal squares, big and readable at 48 px. No text. --ar 1:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 4 · Splash / title screen — 16:9

*(→ `public/assets/generated/ui/splash.png` and `android/.../drawable-xxhdpi/splash_art.png`)*

[cards] 16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a title screen: a night street in a Tel Aviv-style neighbourhood, wet paving, palm trees, neon shop signs glowing cyan and gold, a red-brick kerb in the foreground. Front and centre in fighting stances, the six heroes exactly as in the attached cards: a boy in a green basketball kit holding paint markers, a boy in a red-and-black striped capoeira top with a microphone, a bearded man in a blue-and-garnet striped football jersey and fingerless gloves with a tabby cat leaping beside him, a grandmother in an apron raising a ladle, a fit grandfather in a white polo with a cross-body bag, a young woman in a leopard-print top with a rolling pin and a green vine. Across the top third, large: the single word "EVIOMRI" in heavy condensed arcade capitals, spelled E-V-I-O-M-R-I, cyan gradient with a glow, and under it a smaller gold line "CIRCUIT BREAKERS". No other text. Nothing important in the outer 5%. --ar 16:9 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 5 · Play Store feature graphic — 1024×500 (≈2:1)

[cards] 16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a wide banner: on the left third the single word "EVIOMRI" in heavy condensed arcade capitals, spelled E-V-I-O-M-R-I, cyan gradient with a glow, stacked over a smaller gold "CIRCUIT BREAKERS"; the right two thirds a dynamic pile-up of the six heroes from the attached cards charging right in a V-formation with paint splashes, sound waves, a leaping tabby cat and gold sparks, against a neon night-street backdrop. No other text. --ar 2:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 6 · Hero line-up poster — 2:3 (print / social)

[cards] 16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a portrait poster: the six heroes from the attached cards standing shoulder to shoulder facing the viewer on a neon night street, each in a signature pose (paint markers raised, capoeira kick, bare-knuckle guard with a tabby cat at the feet, ladle held high, backgammon piece flicked, rolling pin over the shoulder with a vine curling around it), heroic low angle, spotlights. Across the bottom the single word "EVIOMRI" in heavy arcade capitals, spelled E-V-I-O-M-R-I, cyan with a glow. No other text. --ar 2:3 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 7 · Villains poster — 2:3

16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a portrait poster of the bosses looming out of darkness, lit from below: a massive black-armoured trooper with a red-lit buzzsaw shield, a purple-haired speedster with a gold circlet and a long pink scarf, a gaunt figure of black static with a white glitch blade, a regal woman in white-and-gold segmented armour with a gold chain whip, a rainbow-haired queen with nine-colour aura wings, and at the front, grinning, a short stocky Catalan figurine in a red beret with a basket of presents. No text. --ar 2:3 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

## 8 · Hero spotlight ×6 — 1:1 each (social carousel)

Run six times, swapping the bracket. Attach only that hero's card, `--iw 2`.

[card] 16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a square character spotlight: {HERO} exactly as in the attached card, three-quarter view, mid-special-move, filling the frame, on a dark navy background with a single bold accent colour burst behind them ({COLOUR}) and pixel sparks. No text. --ar 1:1 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

| {HERO} | {COLOUR} |
|---|---|
| a boy in a green basketball kit #11 throwing a paint splash from magic markers | green #3ddc84 |
| a boy in a red-and-black striped capoeira top spinning a kick with a sound wave from his microphone | red #ff4f72 |
| a bearded man in a blue-and-garnet striped football jersey and fingerless gloves opening a cyan pixel portal as a tabby cat pounces out | cyan #35e8ff |
| a grandmother in an apron swinging a giant ladle in a storm of soup | gold #ffc246 |
| a fit early-60s grandfather in a white polo and cross-body bag flicking a backgammon piece with a shockwave | orange #ff8c42 |
| a young woman in a leopard-print top swinging a rolling pin as a pothos vine bursts around her | green #4caf50 |

## 9 · Store screenshot frames — 9:16 phone (optional)

Real screenshots come from the game; if a painted mock is wanted for the first slot:

[cards] 16-bit arcade beat-em-up key art, crisp clean pixel-art edges, flat cel shading with light dithering, saturated colours, neon cyan and gold accents on deep navy — a tall phone-shaped composition: a landscape phone rendered at an angle showing a side-scrolling beat-em-up fight on a red-brick street (a bearded man in a striped football jersey punching a black-armoured trooper, a tabby cat mid-leap), the phone floating over a deep-navy background with cyan circuit traces; above it the single word "EVIOMRI" in heavy arcade capitals, spelled E-V-I-O-M-R-I, cyan with a glow. No other text. --ar 9:16 --hd --raw --s 150 --exp 10 --chaos 0 --v 8.2 --no watermark, signature, frame, border, blur, photograph, extra text, gibberish letters, logos

---

## Delivery

Save each accepted image under `docs/brand/midjourney/` with these names, then start the new session and say
"brand art is in docs/brand/midjourney — place it":

| # | file |
|---|---|
| 1 | `wordmark.png` |
| 2 | `icon.png` (and `icon-pitz.png` for 3) |
| 4 | `splash.png` |
| 5 | `feature-graphic.png` |
| 6 | `poster-heroes.png` |
| 7 | `poster-villains.png` |
| 8 | `spotlight-eviatar.png` … `spotlight-noa.png` |
| 9 | `store-mock.png` |

That session will: key the wordmark to alpha and drop it into `ui/logo.png` (the lobby uses the SVG at 176×52 —
we'll switch it to the raster), cut the icon into `icon-512/192` and the five Android mipmaps, place the splash into
`ui/splash.png` and the Android drawable, and put the posters, feature graphic and spotlights under
`docs/brand/` and `public/marketing/` with a README of sizes for the store listing. Text-heavy store assets get
their copy composited in code from the accepted art.
