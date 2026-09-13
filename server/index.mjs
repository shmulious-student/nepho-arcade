// LAN co-op server: serves the built game over the local network and relays a two-peer WebSocket
// room between a host and a guest. Game-agnostic — it only tracks room membership and forwards
// messages (JSON control or binary snapshot/input frames) between the two peers in a room.
//
// Usage: npm run lan   (serves dist/ if present, else public/ + a dev note)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { networkInterfaces } from 'node:os';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(ROOT, 'dist');
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp',
  '.woff2': 'font/woff2', '.ico': 'image/x-icon',
};

function lanIp() {
  for (const list of Object.values(networkInterfaces())) {
    for (const info of list || []) {
      if (info.family === 'IPv4' && !info.internal) return info.address;
    }
  }
  return 'localhost';
}

async function serveStatic(req, res) {
  const url = new URL(req.url, 'http://x');
  if (url.pathname === '/api/info') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ lanIp: lanIp(), port: PORT }));
    return;
  }
  let rel = url.pathname === '/' ? '/index.html' : url.pathname;
  rel = normalize(rel).replace(/^(\.\.[/\\])+/, '');
  let root = DIST;
  try { await stat(DIST); } catch { root = join(ROOT, 'public'); }
  let path = join(root, rel);
  try {
    const st = await stat(path);
    if (st.isDirectory()) path = join(path, 'index.html');
  } catch {
    // SPA-style fallback to index.html for unknown paths (client-side routing / QR deep links)
    path = join(root, 'index.html');
  }
  try {
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': MIME[extname(path)] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404); res.end('not found');
  }
}

const server = createServer((req, res) => { serveStatic(req, res).catch(() => { res.writeHead(500); res.end('error'); }); });
const wss = new WebSocketServer({ server, path: '/ws' });

/** @type {Map<string, {host: import('ws').WebSocket|null, guest: import('ws').WebSocket|null}>} */
const rooms = new Map();
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function makeCode() { let c = ''; for (let i = 0; i < 4; i++) c += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]; return c; }

function send(ws, obj) { if (ws && ws.readyState === ws.OPEN) ws.send(JSON.stringify(obj)); }
function other(ws) {
  const room = rooms.get(ws.roomCode);
  if (!room) return null;
  return ws.role === 'host' ? room.guest : room.host;
}

wss.on('connection', (ws) => {
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      const peer = other(ws);
      if (peer && peer.readyState === peer.OPEN) peer.send(data, { binary: true });
      return;
    }
    let msg;
    try { msg = JSON.parse(data.toString()); } catch { return; }
    if (msg.t === 'create') {
      let code = makeCode();
      while (rooms.has(code)) code = makeCode();
      rooms.set(code, { host: ws, guest: null });
      ws.roomCode = code; ws.role = 'host';
      send(ws, { t: 'room', code, slot: 0 });
      return;
    }
    if (msg.t === 'join') {
      const code = String(msg.code || '').toUpperCase();
      const room = rooms.get(code);
      if (!room || room.guest) { send(ws, { t: 'error', message: room ? 'room full' : 'room not found' }); return; }
      room.guest = ws; ws.roomCode = code; ws.role = 'guest';
      send(ws, { t: 'room', code, slot: 1 });
      send(room.host, { t: 'peer', slot: 1, joined: true });
      return;
    }
    // everything else (hero picks, start, sync) is just relayed to the other peer
    const peer = other(ws);
    if (peer) send(peer, msg);
  });
  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;
    if (ws.role === 'host') { send(room.guest, { t: 'peer', slot: 0, joined: false }); rooms.delete(ws.roomCode); }
    else if (ws.role === 'guest') { room.guest = null; send(room.host, { t: 'peer', slot: 1, joined: false }); }
  });
});

server.listen(PORT, () => {
  const ip = lanIp();
  console.log(`EviOmri LAN server running.`);
  console.log(`  On this machine: http://localhost:${PORT}/`);
  console.log(`  On your LAN:     http://${ip}:${PORT}/`);
  console.log(`  A second device on the same Wi-Fi can open the LAN URL and join with the room code shown in the lobby.`);
});
