// Copies the signed release APK out of Gradle's output tree into build/ under a versioned name.
import { copyFileSync, mkdirSync, statSync } from 'node:fs';
import { readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(root + 'package.json', 'utf8'));
const src = root + 'android/app/build/outputs/apk/release/app-release.apk';
const dst = `${root}build/Nepho-${version}-release.apk`;
mkdirSync(root + 'build', { recursive: true });
copyFileSync(src, dst);
console.log(`${dst} (${(statSync(dst).size / 1048576).toFixed(1)} MB)`);
