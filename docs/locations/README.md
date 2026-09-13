# Level locations — one prompt file per backdrop

The ten levels are real places from the family's life (level order and names are authoritative in
`src/sim/levels.ts` / `public/game/catalog.json`). Each file below names the place, links its Street
View, lists the reference photos on disk, says what the current plate gets wrong and carries a
ready-to-paste prompt to redraw the backdrop so it looks like the real spot. Delivery is one image
per level — `node tools/place-backdrop.mjs <level> <image>` then `npm run build:assets`.

Status 2026-09-13: **10 requests** on a clean run. Five places are pinned down with photos; five are
generic names whose exact spot only the owner knows — each of those files has a **TO CONFIRM** line
saying exactly what to paste in.

| # | level | in-game name | place | refs on disk | needs the owner |
|---|---|---|---|---|---|
| 1 | [rishon](level-01-rishon.md) | RISHON LEZION | Founders' Square + Rothschild mall, old Rishon | 3 photos | confirm it's the old centre and not another Rishon spot |
| 2 | [petah-tikva](level-02-petah-tikva.md) | REFAEL EITAN STREET | Refael Eitan St, Em HaMoshavot, Petah Tikva | 3 photos | which side of the street / the family's building |
| 3 | [barcelona](level-03-barcelona.md) | BARCELONA CITY | Carrer de la Marina → Sagrada Família Nativity façade; Passeig de Gràcia | 2 photos | — |
| 4 | [sant-cugat](level-04-sant-cugat.md) | SANT CUGAT TOWN | Plaça d'Octavià + the monastery | 2 photos | — |
| 5 | [hatikva-school](level-05-hatikva-school.md) | HATIKVA SCHOOL | *the family's school* | none | **which school (city + street)** |
| 6 | [capoeira-gym](level-06-capoeira-gym.md) | CAPOEIRA BRAZILIAN GYM | *Omri's academy* | none | **which gym** |
| 7 | [basketball-gym](level-07-basketball-gym.md) | BASKETBALL GYM | *Eviatar's hall* | none | **which hall** |
| 8 | [theater](level-08-theater.md) | THEATER | *the theatre* | none | **which theatre** |
| 9 | [candy-factory](level-09-candy-factory.md) | CANDY FACTORY | *the factory* | none | **which factory / brand** |
| 10 | [catalunya](level-10-catalunya.md) | CATALUNYA | Bunkers del Carmel panorama: city, sea, Tibidabo, Montserrat | 2 photos | — |

For the five generic levels the prompt files still run as written (they describe the typical
Israeli school / gym / hall / stage / factory floor), so they can be generated tonight as a first
pass and re-done once the real place is named.

Reference photos live in `docs/refs/locations/NN-<id>/` (Wikimedia Commons, licences in
[CREDITS.md](../refs/locations/CREDITS.md)); they are drawing references only and never ship. Street
View screenshots go in the same folders. The Street View links use the Maps URL scheme
`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=LAT,LNG` — open one, pan to the
described direction, screenshot.
