# Level locations — one prompt file per backdrop

The ten levels are real places from the family's life (level order and names are authoritative in
`src/sim/levels.ts` / `public/game/catalog.json`). Each file below names the place, links its Street
View, lists the reference photos on disk, says what the current plate gets wrong and carries a
ready-to-paste prompt to redraw the backdrop so it looks like the real spot. Delivery is one image
per level — `node tools/place-backdrop.mjs <level> <image>` then `npm run build:assets`.

Status 2026-09-13 23:45: **10 requests** on a clean run, nothing left to confirm. Six places are real and pinned down
with Street View frames and photos (1–5, 10); four are **imaginary by decision of the owner** (6–9) — each file describes
the invented place in enough detail to be the reference itself.

| # | level | in-game name | place | refs on disk | needs the owner |
|---|---|---|---|---|---|
| 1 | [rishon](level-01-rishon.md) | RISHON LEZION | HaSarig St 31, Kiryat Krinitzi — the family's street | 3 Street View frames | — |
| 2 | [petah-tikva](level-02-petah-tikva.md) | REFAEL EITAN STREET | Refael Eitan St, Em HaMoshavot, Petah Tikva (confirmed) | 3 Street View frames + 3 photos | — |
| 3 | [barcelona](level-03-barcelona.md) | BARCELONA CITY | Carrer de Mallorca / Marina → Sagrada Família; Passeig de Gràcia | 2 Street View frames + 2 photos | — |
| 4 | [sant-cugat](level-04-sant-cugat.md) | SANT CUGAT TOWN | Plaça d'Octavià + the monastery | 2 Street View frames + 2 photos | — |
| 5 | [hatikva-school](level-05-hatikva-school.md) | HATIKVA SCHOOL | Col·legi Hatikva, Av. Mas Fuster 128, Valldoreix (Sant Cugat) | school-site photos + 1 Street View frame | — |
| 6 | [capoeira-gym](level-06-capoeira-gym.md) | CAPOEIRA BRAZILIAN GYM | imaginary — "Academia Ginga", Omri's group | described in the file | — |
| 7 | [basketball-gym](level-07-basketball-gym.md) | BASKETBALL GYM | imaginary — municipal hall, Eviatar's team | described in the file | — |
| 8 | [theater](level-08-theater.md) | THEATER | imaginary — old municipal theatre, from the stage | described in the file | — |
| 9 | [candy-factory](level-09-candy-factory.md) | CANDY FACTORY | imaginary — small old-school sweets factory | described in the file | — |
| 10 | [catalunya](level-10-catalunya.md) | CATALUNYA | Bunkers del Carmel panorama: city, sea, Tibidabo, Montserrat | 2 photos | — |

Reference photos live in `docs/refs/locations/NN-<id>/` (Wikimedia Commons, licences in
[CREDITS.md](../refs/locations/CREDITS.md)); they are drawing references only and never ship. Street
View screenshots go in the same folders. The Street View links use the Maps URL scheme
`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG` — open one, pan to the
described direction, screenshot.

**Getting a Street View frame onto disk:** open the level's Street View link in the browser pane, walk to the spot, and
read the pano id and yaw from the URL (`…!1s<PANOID>!…` and `…,<yaw>h,…`); then
`node tools/streetview-ref.mjs <PANOID> <yaw> docs/refs/locations/NN-<id>/sv-NN-<what>.jpg` renders a 2816×1000 frame
(add `--pitch=` / `--fov=` to tilt or widen). Only car/trekker panos work — user-uploaded photospheres (ids starting
`CIHM0ogK…`) are refused; nudge the viewpoint onto a road.
