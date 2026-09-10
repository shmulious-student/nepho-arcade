// Removes the PNG masters (public/assets/generated) from dist/ after a Vite build.
// The runtime only loads public/game/**, so the ~70 MB of source atlases must not ship.
import { rmSync, existsSync } from 'node:fs';
const target = new URL('../dist/assets/generated', import.meta.url);
if (existsSync(target)) { rmSync(target, { recursive: true, force: true }); console.log('pruned dist/assets/generated'); }
