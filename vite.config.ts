import { defineConfig } from 'vite';

export default defineConfig({
  server: { host: true, port: Number(process.env.PORT) || 5173 },
  build: { target: 'es2020', chunkSizeWarningLimit: 2000 },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
} as any);
