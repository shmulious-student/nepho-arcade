import { defineConfig, type Plugin } from 'vite';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

// Dev-server endpoint for /backoffice.html: POST /__backoffice/roster writes the roster JSON to
// public/game/roster.json, which the game reads at boot. Dev only — the built game is static.
function backofficeApi(): Plugin {
  return {
    name: 'nepho-backoffice',
    configureServer(server) {
      server.middlewares.use('/__backoffice/roster', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end('POST only'); return; }
        let body = '';
        req.on('data', (chunk) => { body += chunk; if (body.length > 1_000_000) req.destroy(); });
        req.on('end', () => {
          try {
            const roster = JSON.parse(body);
            if (!roster || typeof roster !== 'object' || typeof roster.characters !== 'object') throw new Error('not a roster');
            writeFileSync(join(server.config.root, 'public/game/roster.json'), JSON.stringify(roster, null, 1) + '\n');
            res.setHeader('Content-Type', 'application/json'); res.end('{"ok":true}');
          } catch (err) {
            res.statusCode = 400; res.end(String((err as Error).message));
          }
        });
      });
    },
  };
}

export default defineConfig({
  plugins: [backofficeApi()],
  server: { host: true, port: Number(process.env.PORT) || 5173 },
  build: { target: 'es2020', chunkSizeWarningLimit: 2000 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);
