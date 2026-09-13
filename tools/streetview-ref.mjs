// Renders a Street View panorama as a wide reference frame for a level prompt:
//   node tools/streetview-ref.mjs <panoid> <yaw°> <out.jpg> [--pitch=0] [--fov=100] [--w=2816] [--h=1000] [--zoom=3]
// panoid + yaw come from the Google Maps URL while looking at the spot (…!1s<PANOID>… and …,<yaw>h,…).
// Fetches the public pano tiles, stitches the equirect, and projects a rectilinear view facing `yaw`
// (compass degrees) — the same framing as the 2.82:1 level plates. Reference use only; never shipped.
import sharp from 'sharp';
import { writeFileSync } from 'node:fs';

const [, , panoid, yawArg, out, ...rest] = process.argv;
if (!panoid || !yawArg || !out) { console.error('usage: node tools/streetview-ref.mjs <panoid> <yaw> <out.jpg> [--pitch=0] [--fov=100] [--w=2816] [--h=1000] [--zoom=3]'); process.exit(1); }
const opt = Object.fromEntries(rest.map((a) => { const [k, v] = a.replace(/^--/, '').split('='); return [k, Number(v)]; }));
const yaw = Number(yawArg), pitch = opt.pitch ?? 0, fov = opt.fov ?? 100, W = opt.w ?? 2816, H = opt.h ?? 1000, zoom = opt.zoom ?? 3;
const HDR = { Referer: 'https://www.google.com/', 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Safari/537.36' };
const get = async (url) => { const r = await fetch(url, { headers: HDR }); if (!r.ok) throw new Error(`${r.status} ${url}`); return Buffer.from(await r.arrayBuffer()); };

// metadata: centre heading + per-zoom pano sizes
const pb = `!1m4!1smaps_sv.tactile!11m2!2m1!1b1!2m2!1sen!2sus!3m3!1m2!1e2!2s${panoid}!4m61!1e1!1e2!1e3!1e4!1e5!1e6!1e8!1e12!1e17!2m1!1e1!4m1!1i48!5m1!1e1!5m1!1e2!6m1!1e1!6m1!1e2!9m36!1m3!1e2!2b1!3e2!1m3!1e2!2b0!3e3!1m3!1e3!2b1!3e2!1m3!1e3!2b0!3e3!1m3!1e8!2b0!3e3!1m3!1e1!2b0!3e3!1m3!1e4!2b0!3e3!1m3!1e10!2b1!3e2!1m3!1e10!2b0!3e3!11m2!3m1!4b1`;
const metaText = (await get(`https://www.google.com/maps/photometa/v1?authuser=0&hl=en&gl=us&pb=${pb}`)).toString('utf8');
const meta = JSON.parse(metaText.slice(metaText.indexOf('\n') + 1));
const heading = meta[1][0][5][0][1][2][0];
const levels = meta[1][0][2][3][0]; // [[[h,w]],...] per zoom
const [PH, PW] = levels[zoom][0];
const place = (meta[1][0][3]?.[2] || []).map((x) => x[0]).join(', ');
console.log(`pano ${panoid} "${place}" heading ${heading.toFixed(1)}° · zoom ${zoom} = ${PW}×${PH}`);

// tiles → equirect
const cols = Math.ceil(PW / 512), rows = Math.ceil(PH / 512);
const tiles = [];
for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
  const buf = await get(`https://streetviewpixels-pa.googleapis.com/v1/tile?cb_client=maps_sv.tactile&panoid=${panoid}&x=${x}&y=${y}&zoom=${zoom}&nbt=1&fover=2`);
  tiles.push({ input: buf, left: x * 512, top: y * 512 });
}
const { data: equi, info } = await sharp({ create: { width: cols * 512, height: rows * 512, channels: 3, background: '#000' } }).composite(tiles).extract({ left: 0, top: 0, width: PW, height: PH }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const C = info.channels;

// rectilinear projection
const outBuf = Buffer.alloc(W * H * 3);
const rad = Math.PI / 180, tanH = Math.tan((fov / 2) * rad), aspect = H / W;
const cp = Math.cos(pitch * rad), sp = Math.sin(pitch * rad), cy = Math.cos(yaw * rad), sy = Math.sin(yaw * rad);
for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
  const xn = (2 * (i + 0.5) / W - 1) * tanH, yn = (1 - 2 * (j + 0.5) / H) * tanH * aspect;
  // camera looks down +z; pitch about x, then yaw about y (compass: 0 = north = +z, 90 = east = +x)
  let x = xn, y = yn * cp + sp, z = -yn * sp + cp;
  const wx = x * cy + z * sy, wz = -x * sy + z * cy, wy = y;
  const lon = Math.atan2(wx, wz) / rad, lat = Math.atan2(wy, Math.hypot(wx, wz)) / rad;
  let u = (((lon - heading) / 360 + 0.5) % 1 + 1) % 1 * PW, v = (0.5 - lat / 180) * PH;
  const u0 = Math.floor(u), v0 = Math.min(PH - 1, Math.max(0, Math.floor(v))), fu = u - u0, fv = Math.min(1, Math.max(0, v - v0));
  const u1 = (u0 + 1) % PW, v1 = Math.min(PH - 1, v0 + 1);
  const o = (j * W + i) * 3;
  for (let c = 0; c < 3; c++) {
    const a = equi[(v0 * PW + u0) * C + c], b = equi[(v0 * PW + u1) * C + c], d = equi[(v1 * PW + u0) * C + c], e = equi[(v1 * PW + u1) * C + c];
    outBuf[o + c] = (a * (1 - fu) + b * fu) * (1 - fv) + (d * (1 - fu) + e * fu) * fv;
  }
}
await sharp(outBuf, { raw: { width: W, height: H, channels: 3 } }).jpeg({ quality: 88 }).toFile(out);
writeFileSync(out.replace(/\.jpe?g$/i, '') + '.txt', `Google Street View pano ${panoid} (${place}), view yaw ${yaw}° pitch ${pitch}° fov ${fov}°; rendered ${new Date().toISOString()}. Reference only — © Google.\n`);
console.log(`→ ${out} (${W}×${H}, yaw ${yaw}°, pitch ${pitch}°, fov ${fov}°)`);
