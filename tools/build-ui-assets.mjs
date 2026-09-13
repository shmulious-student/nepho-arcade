// Builds all UI assets (icons, splash, logo, HUD glyphs, relics) for EviOmri: Circuit Breakers.
import sharp from 'sharp';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC_UI = join(ROOT, 'public/assets/generated/ui');
const OUT_UI = join(ROOT, 'public/game/ui');

mkdirSync(SRC_UI, { recursive: true });
mkdirSync(join(SRC_UI, 'relics'), { recursive: true });
mkdirSync(OUT_UI, { recursive: true });
mkdirSync(join(OUT_UI, 'relics'), { recursive: true });

// 1. Generate high-impact Vector Logo
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
  <defs>
    <linearGradient id="neonCyan" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#a4fbf0" />
      <stop offset="50%" stop-color="#75f5dc" />
      <stop offset="100%" stop-color="#24b69d" />
    </linearGradient>
    <linearGradient id="neonGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fff275" />
      <stop offset="60%" stop-color="#ffcf5c" />
      <stop offset="100%" stop-color="#ff9357" />
    </linearGradient>
    <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="4" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g id="circuit-background" opacity="0.35" stroke="#75f5dc" stroke-width="2" fill="none">
    <path d="M 40 40 H 160 L 190 70 H 320" />
    <circle cx="40" cy="40" r="4" fill="#75f5dc" />
    <circle cx="320" cy="70" r="4" fill="#75f5dc" />
    <path d="M 760 200 H 640 L 610 170 H 480" />
    <circle cx="760" cy="200" r="4" fill="#ffcf5c" />
    <circle cx="480" cy="170" r="4" fill="#ffcf5c" />
  </g>

  <!-- Outer Framing Brackets -->
  <path d="M 50 70 L 30 90 V 160 L 50 180" stroke="#75f5dc" stroke-width="4" fill="none" opacity="0.8" />
  <path d="M 750 70 L 770 90 V 160 L 750 180" stroke="#ffcf5c" stroke-width="4" fill="none" opacity="0.8" />

  <!-- Main Wordmark: EVIOMRI -->
  <g font-family="'Impact', 'Arial Black', sans-serif" font-size="104" font-weight="900" letter-spacing="6" text-anchor="middle">
    <!-- Drop Shadow / Glow -->
    <text x="400" y="128" fill="#040b17" stroke="#050711" stroke-width="16" stroke-linejoin="round">EVIOMRI</text>
    <text x="400" y="128" fill="none" stroke="#24b69d" stroke-width="10" filter="url(#cyanGlow)" stroke-linejoin="round">EVIOMRI</text>
    <text x="400" y="128" fill="url(#neonCyan)">EVIOMRI</text>
    <text x="400" y="128" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.7">EVIOMRI</text>
  </g>

  <!-- Subtitle Ribbon: CIRCUIT BREAKERS -->
  <g transform="translate(180, 150)">
    <polygon points="0,0 440,0 425,40 15,40" fill="#050711" stroke="#ffcf5c" stroke-width="3" filter="url(#goldGlow)" />
    <text x="220" y="27" font-family="'Arial Black', sans-serif" font-size="20" font-weight="900" fill="url(#neonGold)" letter-spacing="6" text-anchor="middle">
      CIRCUIT BREAKERS
    </text>
  </g>
</svg>`;

// 2. Control & HUD SVGs
const HUD_ICONS = {
  'attack.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#75f5dc" stroke-width="3"/>
    <path d="M 22 36 L 22 28 C 22 25 25 22 28 22 C 30 22 32 24 32 26 C 32 24 34 22 36 22 C 38 22 40 24 40 26 C 40 24 42 22 44 22 C 47 22 49 25 49 28 L 49 37 C 49 43 43 47 36 47 L 30 47 C 25 47 22 42 22 36 Z" fill="#75f5dc"/>
    <path d="M 12 18 L 18 24 M 10 32 L 18 32 M 12 46 L 18 40" stroke="#ffcf5c" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  'special.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#ffcf5c" stroke-width="3"/>
    <polygon points="32,12 37,25 51,27 41,37 44,51 32,44 20,51 23,37 13,27 27,25" fill="#ffcf5c"/>
    <polygon points="32,20 35,28 43,29 37,35 39,43 32,39 25,43 27,35 21,29 29,28" fill="#fff8d6"/>
  </svg>`,

  'dash.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#a4ee42" stroke-width="3"/>
    <path d="M 18 20 L 32 32 L 18 44" stroke="#a4ee42" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M 32 20 L 46 32 L 32 44" stroke="#a4ee42" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  'coop.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#75f5dc" stroke-width="3"/>
    <circle cx="24" cy="24" r="7" fill="#75f5dc"/>
    <circle cx="40" cy="24" r="7" fill="#ffcf5c"/>
    <path d="M 14 44 C 14 36 20 34 26 34 C 30 34 32 36 34 38" stroke="#75f5dc" stroke-width="3" stroke-linecap="round"/>
    <path d="M 50 44 C 50 36 44 34 38 34 C 35 34 33 35 32 37" stroke="#ffcf5c" stroke-width="3" stroke-linecap="round"/>
  </svg>`,

  'play.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#75f5dc" stroke-width="3"/>
    <polygon points="26,18 46,32 26,46" fill="#75f5dc"/>
  </svg>`,

  'pause.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#75f5dc" stroke-width="3"/>
    <rect x="22" y="20" width="7" height="24" rx="2" fill="#75f5dc"/>
    <rect x="35" y="20" width="7" height="24" rx="2" fill="#75f5dc"/>
  </svg>`,

  'retry.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" fill="#0b1730" stroke="#ff9357" stroke-width="3"/>
    <path d="M 44 32 A 13 13 0 1 1 38 21" stroke="#ff9357" stroke-width="4" stroke-linecap="round"/>
    <polygon points="38,14 46,21 37,27" fill="#ff9357"/>
  </svg>`,

  'face.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <rect x="4" y="4" width="56" height="56" rx="8" fill="#0b1730" stroke="#75f5dc" stroke-width="2"/>
    <circle cx="32" cy="26" r="12" stroke="#75f5dc" stroke-width="2"/>
    <path d="M 18 50 C 20 40 25 38 32 38 C 39 38 44 40 46 50" stroke="#75f5dc" stroke-width="2"/>
  </svg>`,

  'face-guide.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="28" stroke="#ffcf5c" stroke-width="2" stroke-dasharray="4 4"/>
    <line x1="32" y1="8" x2="32" y2="56" stroke="#ffcf5c" stroke-width="1" opacity="0.6"/>
    <line x1="8" y1="32" x2="56" y2="32" stroke="#ffcf5c" stroke-width="1" opacity="0.6"/>
  </svg>`,

  'face-fallback.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <rect x="8" y="8" width="48" height="48" rx="6" fill="#14243d"/>
    <circle cx="32" cy="27" r="10" fill="#ffd19a"/>
    <rect x="26" y="24" width="4" height="3" fill="#14243d"/>
    <rect x="34" y="24" width="4" height="3" fill="#14243d"/>
    <path d="M 28 32 Q 32 35 36 32" stroke="#14243d" stroke-width="2"/>
    <path d="M 20 22 C 22 14 42 14 44 22" fill="#ff7043"/>
  </svg>`,
};

// 3. Relic SVGs
const RELICS = {
  'guard.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <path d="M 32 8 L 48 14 V 32 C 48 44 32 54 32 54 C 32 54 16 44 16 32 V 14 Z" fill="#0b1730" stroke="#37aaff" stroke-width="3"/>
    <path d="M 32 16 L 42 21 V 32 C 42 40 32 46 32 46 C 32 46 22 40 22 32 V 21 Z" fill="#37aaff"/>
  </svg>`,

  'burst.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <polygon points="34,6 18,34 32,34 28,58 46,26 32,26" fill="#ffcf5c" stroke="#ff9357" stroke-width="2"/>
  </svg>`,

  'speed.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <path d="M 12 36 L 28 16 L 36 28 L 52 14 L 46 44 L 28 44 Z" fill="#a4ee42" stroke="#75f5dc" stroke-width="2"/>
    <line x1="8" y1="48" x2="56" y2="48" stroke="#a4ee42" stroke-width="3"/>
  </svg>`,

  'vitality.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <path d="M 32 18 C 26 8 10 12 10 26 C 10 38 28 50 32 54 C 36 50 54 38 54 26 C 54 12 38 8 32 18 Z" fill="#ff4f72" stroke="#fff" stroke-width="2"/>
  </svg>`,

  'combo.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <rect x="14" y="24" width="22" height="16" rx="8" stroke="#ff9357" stroke-width="4" fill="none"/>
    <rect x="28" y="24" width="22" height="16" rx="8" stroke="#ffcf5c" stroke-width="4" fill="none"/>
  </svg>`,

  'focus.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none">
    <circle cx="32" cy="32" r="22" stroke="#75f5dc" stroke-width="3" fill="none"/>
    <circle cx="32" cy="32" r="10" stroke="#ffcf5c" stroke-width="2" fill="#0b1730"/>
    <circle cx="32" cy="32" r="3" fill="#75f5dc"/>
    <line x1="32" y1="4" x2="32" y2="14" stroke="#75f5dc" stroke-width="3"/>
    <line x1="32" y1="50" x2="32" y2="60" stroke="#75f5dc" stroke-width="3"/>
    <line x1="4" y1="32" x2="14" y2="32" stroke="#75f5dc" stroke-width="3"/>
    <line x1="50" y1="32" x2="60" y2="32" stroke="#75f5dc" stroke-width="3"/>
  </svg>`,
};

async function main() {
  console.log('=== Building UI Assets ===\n');

  // 1. Write vector logo
  console.log('Writing logo.svg and generating logo.png...');
  writeFileSync(join(SRC_UI, 'logo.svg'), LOGO_SVG);
  writeFileSync(join(OUT_UI, 'logo.svg'), LOGO_SVG);
  await sharp(Buffer.from(LOGO_SVG)).png().toFile(join(SRC_UI, 'logo.png'));
  await sharp(Buffer.from(LOGO_SVG)).png().toFile(join(OUT_UI, 'logo.png'));

  // 2. Write HUD Icons
  console.log('Writing HUD icons...');
  for (const [name, content] of Object.entries(HUD_ICONS)) {
    writeFileSync(join(SRC_UI, name), content);
    writeFileSync(join(OUT_UI, name), content);
  }

  // 3. Write Relics
  console.log('Writing relic icons...');
  for (const [name, content] of Object.entries(RELICS)) {
    writeFileSync(join(SRC_UI, 'relics', name), content);
    writeFileSync(join(OUT_UI, 'relics', name), content);
  }

  // 4. App Icons (from test_app_icon)
  const brainDir = '/Users/shmuelvachnish-mbpr/.gemini/antigravity-ide/brain/cc103701-d5be-4445-8b86-f90137620148';
  const appIconSrc = join(brainDir, 'test_app_icon_1789020154559.jpg');
  if (existsSync(appIconSrc)) {
    console.log('Generating app icons (512x512 & 192x192)...');
    await sharp(appIconSrc).resize(512, 512).png().toFile(join(SRC_UI, 'icon-512.png'));
    await sharp(appIconSrc).resize(512, 512).png().toFile(join(OUT_UI, 'icon-512.png'));
    await sharp(appIconSrc).resize(192, 192).png().toFile(join(SRC_UI, 'icon-192.png'));
    await sharp(appIconSrc).resize(192, 192).png().toFile(join(OUT_UI, 'icon-192.png'));
  }

  // 5. Splash Screen (from nepho_splash_landscape)
  const splashSrc = join(brainDir, 'nepho_splash_landscape_1789025356927.jpg');
  if (existsSync(splashSrc)) {
    console.log('Generating landscape splash screen (1920x1080)...');
    await sharp(splashSrc).resize(1920, 1080).png().toFile(join(SRC_UI, 'splash.png'));
    await sharp(splashSrc).resize(1920, 1080).png().toFile(join(OUT_UI, 'splash.png'));
  }

  console.log('\nAll UI assets built successfully.');
}

main().catch((err) => {
  console.error('Error building UI assets:', err);
  process.exit(1);
});
