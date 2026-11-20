# Crystal Family Quest

Open `index.html` through a local server (for example `python3 -m http.server`) and visit http://localhost:8000.
A single-file build is in `dist/crystal-family-quest.html`.

Files
- `game.js`   all game code (Phaser 3). Data tables at the top: `LEVELS`, `SHOP`, `UPG`, `DAILY`, `TYPES`.
- `assets/`   art used by the game. Swap a file with the same name to change the look.
- `build.py`  run `python3 build.py` after changing art or code to rebuild `dist/` and `assets.js`.

Features
- 5 levels (Garden Realm). Add a level by adding an entry to `LEVELS`.
- Family combos: use different family members within 25 seconds for bonus crystals. Four in a row is a Unity Move and restores a heart.
- Daily reward: 7-day streak, resets if a day is missed. Day 7 unlocks the Gold glow.
- Shop: pets (Songbird, Sparkle wing, Shell guard), glows, trails. Outfits are placeholders until art exists.
- Upgrades: Strength, Wisdom, Quick hands, Spirit, 3 levels each.
- Progress is saved in the browser (localStorage key `cfq-save`).

Controls: tap the path to walk, tap an object to use a power, tap a portrait (or press 1 to 4) to switch family member.

## Build the Android APK with GitHub
1. Put these files in a GitHub repository (keep the `.github/workflows/android.yml` path).
2. Open the Actions tab, choose "Build Android APK", then Run workflow (it also runs on every push to main).
3. When it finishes, open the run and download `crystal-family-quest-apk`. Unzip it to get `app-debug.apk`.
4. Copy the APK to an Android phone and open it. Android asks you to allow installs from this source.


## Version 2 (full-screen, unlimited levels)

- Full screen: the page fills the whole screen. In the app the status and navigation bars are hidden (immersive mode). In a browser, the first tap asks for full screen; there is also a Full screen button.
- Unlimited levels: levels 1 to 5 are hand-made, every level after that is generated, and every 10th level is a Guardian level with big rewards.
- Ten worlds, one per level in rotation: Garden, Crystal Caves, Cloud Kingdom, Whisper Forest, Festival Night, Golden Savanna, Sunny Shore, Frost Peaks, Ember Mountain, Candy Land. Finish a level and the family walks through the gate into the next world.
- Voices: each family member has their own pitch and speed and says funny lines in speech bubbles (uses the phone's built-in text-to-speech; Voices can be turned off).
- Keep-playing features: daily gift, daily quests, awards, family Codex (Igbo words, proverbs, culture, nature), lucky spin, mystery chest, lucky gems, par-time bonus, combos and Unity Moves.
- Art: `tools/envs.py` paints the world backgrounds, `tools/logo.py` renders the logo and icon. To use your own AI-made backgrounds, replace `assets/env_*.jpg` (1280x720; keep the ground path near the bottom, y about 585).
