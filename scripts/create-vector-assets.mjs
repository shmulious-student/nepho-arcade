import { mkdir, writeFile } from 'node:fs/promises';

const root = new URL('../public/assets/generated/', import.meta.url);
const icons = {
  dash: '<path d="M5 9h10M3 14h9M6 19h8M16 5l10 11-10 11M22 5l10 11-10 11"/>',
  special: '<path d="m18 2-13 17h10l-1 11 13-18H17z"/>',
  attack: '<path d="m7 24 3-10 4 1V7a2 2 0 0 1 4 0v7-9a2 2 0 0 1 4 0v10-7a2 2 0 0 1 4 0v9-3a2 2 0 0 1 4 0v9l-6 7H12z"/>',
  coop: '<circle cx="11" cy="10" r="5"/><circle cx="25" cy="10" r="4"/><path d="M2 29v-5a9 9 0 0 1 18 0v5M23 19a7 7 0 0 1 9 7v3"/>',
  face: '<rect x="3" y="3" width="28" height="28" rx="9"/><path d="M11 13h1m10 0h1M11 21q6 7 12 0"/>',
  pause: '<path d="M10 6v22M24 6v22" stroke-width="6"/>',
  retry: '<path d="M7 11a12 12 0 1 1-1 13M7 3v9H1"/>',
  play: '<path d="m10 5 19 12-19 12z"/>',
};
const svg = (body, viewBox = '0 0 34 34') => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="#75f5dc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${body}</svg>\n`;
async function save(path, body) {
  await mkdir(new URL(path.slice(0, path.lastIndexOf('/') + 1), root), { recursive: true });
  await writeFile(new URL(path, root), body);
}
for (const [name, body] of Object.entries(icons)) await save(`ui/${name}.svg`, svg(body));
await save('ui/ui-icons.svg', svg(Object.entries(icons).map(([name, body], i) => `<g id="${name}" transform="translate(${i * 40} 0)">${body}</g>`).join(''), '0 0 320 34'));
await save('ui/logo.svg', svg('<path d="M8 56V8l34 48V8M64 8H48v48h20M48 31h16M82 56V8h18l10 12-10 12H82M124 8v48m0-24h28M152 8v48M171 8h27l9 9v30l-9 9h-27l-9-9V17z" stroke="#ffcf5c" stroke-width="5"/>', '0 0 216 64'));
await save('ui/face-guide.svg', svg('<ellipse cx="32" cy="30" rx="23" ry="27" stroke-dasharray="4 4"/><path d="M22 25h2m16 0h2M23 40q9 7 18 0"/>', '0 0 64 64'));
await save('ui/face-fallback.svg', svg('<circle cx="32" cy="32" r="30" fill="#14243d"/><path d="M14 26 21 12h23l8 15-12-8-8 7-8-7z" fill="#75f5dc"/><path d="M21 32h5m12 0h5M25 44q7 5 14 0" stroke="#ffcf5c"/>', '0 0 64 64'));

const props = {
  crate: '<rect x="8" y="8" width="48" height="48" rx="3" fill="#935d3d"/><path d="M12 12h40v40H12zM12 12l40 40M52 12 12 52" stroke="#e5ad68" stroke-width="4"/>',
  barrel: '<path d="M15 9q17-6 34 0v46q-17 6-34 0z" fill="#52647c"/><path d="M14 20h36M14 44h36" stroke="#ffcf5c" stroke-width="5"/><ellipse cx="32" cy="9" rx="17" ry="5"/>',
  terminal: '<path d="M16 4h32l5 42H11zM23 46h18v10h9v5H14v-5h9z" fill="#344861"/><path d="M21 11h23v20H21z" fill="#14243d"/><path d="m25 16 5 5-5 5m9 0h7M20 38h24" stroke="#75f5dc"/>',
  barrier: '<path d="M8 17h48v26H8z" fill="#ffcf5c"/><path d="m12 40 14-20m0 20 14-20m0 20 12-18" stroke="#14243d" stroke-width="6"/><path d="M14 43v16m36-16v16"/>',
  door: '<path d="M9 3h46v58H9z" fill="#344861"/><path d="M15 9h34v52H15z" fill="#14243d"/><path d="M32 9v52M20 16h7m10 0h7M20 25h7m10 0h7" stroke="#75f5dc"/>',
};
for (const [name, body] of Object.entries(props)) await save(`environment/${name}.svg`, svg(body, '0 0 64 64'));
await save('environment/floor.svg', svg('<path fill="#14243d" stroke="#344861" d="M0 0h64v64H0zM0 32h64M32 0v32M16 32v32M48 32v32"/>', '0 0 64 64'));
const decals = {
  pipe: '<path d="M8 56V20a12 12 0 0 1 12-12h36M18 56V23a5 5 0 0 1 5-5h33M5 45h16M44 5v16"/>',
  vent: '<rect x="6" y="10" width="52" height="44" rx="3"/><path d="M14 18h36M14 26h36M14 34h36M14 42h36"/>',
  lamp: '<path d="M32 60V10m-15 0h30l-5 19H22zM20 35l-6 8m30-8 6 8M32 37v10"/>',
  arrow: '<path d="M6 23h29V9l23 23-23 23V41H6z"/>',
  cable: '<path d="M0 9q32 48 64 0M0 18q32 48 64 0"/>',
  fan: '<circle cx="32" cy="32" r="27"/><circle cx="32" cy="32" r="5"/><path d="M32 27q-20-28-20 0l15 5M37 32q28-20 0-20l-5 15M32 37q20 28 20 0l-15-5M27 32q-28 20 0 20l5-15"/>',
  drain: '<path d="M6 23h52v18H6zM12 27v10m8-10v10m8-10v10m8-10v10m8-10v10m8-10v10"/>',
  bollard: '<path d="M23 59V15a9 9 0 0 1 18 0v44M18 59h28M23 24h18"/>',
  antenna: '<path d="M32 60V17M13 59h38M20 28l12-11 12 11M20 14a17 17 0 0 1 24 0M11 7a30 30 0 0 1 42 0"/>',
  warning: '<path d="m32 5 29 52H3zM32 22v16m0 8v2"/>',
  window: '<path d="M8 6h48v52H8zM32 6v52M8 32h48"/>',
  poster: '<path d="M12 5h40v54H12zM20 15h24M20 49h24m-19-9 7-19 7 19"/>',
};
for (const [name, body] of Object.entries(decals)) await save(`environment/decals/${name}.svg`, svg(body, '0 0 64 64'));
const relics = {
  burst: icons.special,
  vitality: '<path d="M17 29 4 16A8 8 0 0 1 17 7a8 8 0 0 1 13 9z"/>',
  guard: '<path d="m17 3 12 5v10q-2 9-12 13Q7 27 5 18V8z"/>',
  speed: icons.dash,
  focus: '<circle cx="17" cy="17" r="10"/><path d="M17 1v10m0 12v10M1 17h10m12 0h10"/>',
  combo: '<path d="m6 24 8-8-6-6 6-6m6 24 8-8-6-6 6-6"/>',
};
for (const [name, body] of Object.entries(relics)) await save(`ui/relics/${name}.svg`, svg(body));
for (const [name, heights] of Object.entries({ skyline: [90, 120, 70, 140, 100, 65, 115, 85], industrial: [60, 90, 75, 120, 80, 100, 60, 110], rooftops: [50, 65, 45, 70, 55, 60, 75, 45] })) {
  const body = heights.map((h, i) => `<path d="M${i * 120} 180V${180 - h}h110v${h}z" fill="#14243d" stroke="#285273"/>`).join('');
  await save(`environment/parallax-${name}.svg`, svg(body, '0 0 960 180'));
}
await save('fx/ultra-aura.svg', svg(['#75f5dc','#37aaff','#ff8f40','#bd8cff','#a4ee42','#ff4f72','#ff76c8','#edf6ff','#ffcf5c'].map((color, i) => `<ellipse cx="88" cy="104" rx="${74 - i * 5}" ry="${96 - i * 6}" stroke="${color}" stroke-width="3" opacity="0.75"/>`).join(''), '0 0 176 208'));
console.log('Created reusable vector controls, props, decals, relics, floor, parallax and aura.');
