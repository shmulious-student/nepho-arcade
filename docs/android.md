# Android app (APK)

The game ships as a native Android app that wraps the web build: `com.shmulious.eviomri`, app
name **Nepho**. Nothing is re-encoded on the way in — `dist/` (the Vite build, with every file in
`public/game/` copied verbatim) is packed into the APK as-is, so the app renders exactly what the
web build renders. The wrapper is [Capacitor](https://capacitorjs.com) 8; the native project lives
in `android/` and is committed.

```bash
npm run android:apk     # build web → sync into android/ → gradlew assembleRelease → build/Nepho-<version>-release.apk
npm run android:run     # same, then install + launch on the connected device / running emulator
```

Requirements: JDK 21 (`/usr/libexec/java_home -v 21`), the Android SDK at `~/Library/Android/sdk`
with platform 36 + build-tools 36 (`ANDROID_HOME` may need exporting), Node 20+. Gradle itself is
downloaded by the wrapper on first use.

## Signing

Release builds are signed with the Shmulious keystore, which is **not** in the repo:

- keystore: `~/.android/shmulious-eviomri-release.jks` (PKCS12, alias `eviomri`, RSA 4096, valid to 2056)
- credentials: `~/.android/shmulious-eviomri-release.creds.txt` (mode 600)
- `android/keystore.properties` (gitignored) tells Gradle where the keystore is and its passwords.
  Recreate it on another machine from the creds file:

  ```
  storeFile=/Users/<you>/.android/shmulious-eviomri-release.jks
  storeType=PKCS12
  keyAlias=eviomri
  storePassword=…
  keyPassword=…
  ```

Without `keystore.properties` the release build is produced unsigned. Never lose the keystore: an
APK signed with any other key cannot update an installed copy in place.

Bump `versionCode` (must increase on every release) and `versionName` in
`android/app/build.gradle` before publishing a new build.

## Content comes from the server

Every runtime asset — `catalog.json` (characters, the level list, bosses and the art each one
uses), `roster.json` (who takes part, names, level assignments), atlases, backdrops, signs,
portraits, hero cards, UI art — lives in `public/game/` and is described by
`public/game/manifest.json` (`npm run build:manifest`, run automatically by `npm run build` and
`npm run build:assets`): a content-hash `version` plus each file's size and sha256.

At every boot the app (`src/content/updater.ts`, called from `BootScene` before anything loads):

1. reads the manifest bundled in the APK and the state of any pack it downloaded earlier;
2. fetches `manifest.json` from **`CONTENT_URL`** (8 s timeout). If the server has no manifest it
   falls back to `catalog.json` + `roster.json` there and derives the file list the way `BootScene`
   would, versioned by the catalog's `generatedAt` and the roster text;
3. if the server's version matches the bundled pack → plays from the APK; matches the last download
   → plays from that; otherwise downloads the files whose hash changed (all of them when the server
   has no manifest) into the app's private data directory (`content/files/`), `catalog.json` and
   `roster.json` last so an interrupted download never leaves an index pointing at missing files,
   verifies sizes, and then serves the game from there via `setGameBase()`;
4. offline, or on any failure, plays the newest *complete* pack it has (downloaded, else bundled).
   A half-finished download is kept and resumed next boot, never served.

`CONTENT_URL` defaults to the Firebase Hosting site of the `nepho-eviomri` project (Spark free
tier, owned by shmulious@gmail.com; console at
https://console.firebase.google.com/project/nepho-eviomri/hosting):

```
https://nepho-eviomri.web.app/game/
```

`firebase.json` serves only `public/game/` (masters, references, the showcase page and the debug
sheets are ignored) with CORS `*`, a 5-minute cache on art and `no-cache` on `manifest.json`,
`catalog.json` and `roster.json`. So **publishing content is one command**:

```bash
npm run content:deploy   # build:manifest, then firebase deploy --only hosting as shmulious@gmail.com
```

(run `npm run build:assets` first when masters changed). The account is passed with `--account`
on every call so the machine's default Firebase login is never switched. Anything else that serves
the same folder works too — set
`VITE_CONTENT_URL=https://host/path/game/` when running `npm run android:apk` to bake in a
different server (any static host; keep `manifest.json` alongside the files and serve CORS `*`).

What can change without a new APK: everything under `public/game/` — swap or add character art
(a new hero the sim already knows shows up once its atlas, card and catalog entry are there),
re-pick bosses and enemy pools per level and rename characters (roster), change backdrops, signs
and the level list (catalog). What still needs a new APK: game code — wave tables in
`src/sim/levels.ts`, frame data, new sim characters, and the renderer.

The web build is untouched by all this: `syncContent()` is a no-op outside Capacitor and the game
keeps loading from `/game/`.

## Native details

- `android/app/src/main/AndroidManifest.xml`: `sensorLandscape` (the game is landscape-only; both
  landscape orientations are allowed).
- `MainActivity.java`: immersive sticky full-screen (system bars hidden, swipe from an edge peeks
  them) and keep-screen-on.
- Icons and the splash are generated from `public/game/ui/icon-512.png` and `ui/splash.png` on the
  game's `#050711` background (`android/app/src/main/res/`).
- LAN co-op is not wired for the app yet: the relay address is derived from `location.host`, which
  is `localhost` inside the app.

## QA on an emulator

```bash
export ANDROID_HOME=~/Library/Android/sdk
$ANDROID_HOME/cmdline-tools/latest/bin/avdmanager create avd -n nepho -k "system-images;android-35;google_apis;arm64-v8a" -d pixel_6
$ANDROID_HOME/emulator/emulator -avd nepho &
adb install -r build/Nepho-*-release.apk
adb logcat -s chromium:I Capacitor:D   # the boot line "content: bundled|installed|downloaded pack <version>" shows which pack is playing
```
