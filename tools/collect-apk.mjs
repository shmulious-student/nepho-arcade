// Copies the signed release APK out of Gradle's output tree into build/ under a versioned name.
// Moves (not copies) so the APK exists once, and drops any stale debug APK next to it.
import { mkdirSync, readFileSync, renameSync, rmSync, statSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const { version } = JSON.parse(readFileSync(root + 'package.json', 'utf8'));
const src = root + 'android/app/build/outputs/apk/release/app-release.apk';
const dst = `${root}build/EviOmri-${version}-release.apk`;
mkdirSync(root + 'build', { recursive: true });
renameSync(src, dst);
rmSync(root + 'android/app/build/outputs/apk/debug', { recursive: true, force: true });
console.log(`${dst} (${(statSync(dst).size / 1048576).toFixed(1)} MB)`);
