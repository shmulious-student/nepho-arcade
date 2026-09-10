# Nepho: Circuit Breakers

Mobile-first 2D arcade action prototype. Run `npm install`, then `npm run dev`.

## Product plan

- **Core loop:** enter a 3-minute stage, clear three pressure waves, build Special meter through clean hits, defeat the stage boss, bank a relic, and push to the next district. Level 10 merges all boss patterns into the Ultra Boss.
- **Player verbs:** move, basic strike, launch/air juggle, dash-cancel, and Nepho Burst. Co-op shares boss aggro and enables combo assists.
- **Portraits:** upload is handled in the DOM; production implementation should crop to a face guide, run a landmark/segmentation pass, and bind the portrait to a reusable face rig (eyes, brows, mouth, hurt/effort poses) over the body sprite. Never bake the photo into every animation frame.
- **LAN co-op:** host-authoritative lockstep over WebRTC DataChannel with a small signaling page; inputs are timestamped action packets, while simulation remains deterministic and renderer-local.
- **Ten levels:** Dockside, Skyline, Furnace, Temple, Neon Market, Subway, Rooftops, Null Lab, Core Vault, Last Light. Each ends with a bespoke boss; the final level uses all nine boss moves as a phase deck.

## Next production slices

1. Replace rectangles with normalized sprite strips and a face-rig layer.
2. Add hitboxes, juggle state, boss phase scripts, relic progression, pause/settings, and touch joystick.
3. Add deterministic net session, reconnect, and match-end validation.
4. Add audio, accessibility, reduced-motion mode, and browser/mobile playtest coverage.
