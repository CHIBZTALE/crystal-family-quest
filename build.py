import base64, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
PHASER = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js'
FONTS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&display=swap'
NOTE = 'Tap the path to walk. Tap an object to use a power. Tap a portrait to switch family members.'

CSS = """:root { --bg: #0e2217; --ink: #f3e6c4; --muted: #9fb8a8; --gold: #ffd36f; color-scheme: dark; }
html, body { height: 100%; }
body { margin: 0; background: var(--bg); color: var(--ink); font-family: Fredoka, "Trebuchet MS", sans-serif;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  padding-block: 8px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
#game { width: min(100%, calc((100dvh - 72px) * 1.7778)); aspect-ratio: 16 / 9; max-width: 100%; background: #10241a; border-radius: 10px; overflow: hidden; }
#game canvas { display: block; }
#note, #rotate { margin: 0; font-size: 14px; color: var(--muted); text-align: center; max-width: 60ch; }
#rotate { display: none; color: var(--gold); font-size: 15px; }
@media (orientation: portrait) { #rotate { display: block; } }
"""

def data_uri(path):
    ext = os.path.splitext(path)[1].lower()
    mime = 'image/jpeg' if ext in ('.jpg', '.jpeg') else 'image/png'
    with open(path, 'rb') as f:
        return 'data:%s;base64,%s' % (mime, base64.b64encode(f.read()).decode())

files = sorted(os.listdir(ASSETS))
game_js = open(os.path.join(HERE, 'game.js'), encoding='utf-8').read()

# single file (for the artifact)
urls = {os.path.splitext(f)[0]: data_uri(os.path.join(ASSETS, f)) for f in files}
body = """<title>Crystal Family Quest</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="%s">
<style>
%s</style>
<div id="game"></div>
<p id="rotate">Turn your phone sideways for a bigger game.</p>
<p id="note">%s</p>
<script src="%s"></script>
<script>window.ASSET_URLS = %s;</script>
<script>
%s
</script>
""" % (FONTS, CSS, NOTE, PHASER, json.dumps(urls), game_js)
os.makedirs(os.path.join(HERE, 'dist'), exist_ok=True)
with open(os.path.join(HERE, 'dist', 'crystal-family-quest.html'), 'w', encoding='utf-8') as f:
    f.write(body)

# dev project files (assets loaded from the assets folder)
paths = {os.path.splitext(f)[0]: 'assets/' + f for f in files}
with open(os.path.join(HERE, 'assets.js'), 'w') as f:
    f.write('window.ASSET_URLS = ' + json.dumps(paths, indent=1) + ';\n')
dev = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Crystal Family Quest</title>
<link rel="stylesheet" href="%s">
<style>
%s</style>
</head>
<body>
<div id="game"></div>
<p id="rotate">Turn your phone sideways for a bigger game.</p>
<p id="note">%s</p>
<script src="%s"></script>
<script src="assets.js"></script>
<script src="game.js"></script>
</body>
</html>
""" % (FONTS, CSS, NOTE, PHASER)
with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(dev)

print('single file KB:', os.path.getsize(os.path.join(HERE, 'dist', 'crystal-family-quest.html')) // 1024)
