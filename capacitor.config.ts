import type { CapacitorConfig } from '@capacitor/cli';

// The Android wrapper around the web build: dist/ is packed into the APK as-is (every file in
// public/game/ ships verbatim, nothing is re-encoded) and served from https://localhost; a newer
// content pack is pulled from the server at boot (src/content/updater.ts).
const config: CapacitorConfig = {
  appId: 'com.shmulious.eviomri',
  appName: 'Nepho',
  webDir: 'dist',
  android: {
    backgroundColor: '#050711',
    // only a plain-http QA server (VITE_CONTENT_URL=http://…, debug builds) needs mixed content
    allowMixedContent: (process.env.VITE_CONTENT_URL ?? '').startsWith('http://'),
  },
  plugins: {
    // MainActivity runs the game edge-to-edge and immersive itself; Capacitor's own insets handling
    // would pad the WebView away from the camera cutout (a grey band beside the canvas).
    SystemBars: { insetsHandling: 'disable' },
  },
};

export default config;
