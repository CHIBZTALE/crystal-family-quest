import base64, json, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
PHASER = 'https://cdnjs.cloudflare.com/ajax/libs/phaser/3.80.1/phaser.min.js'
FONTS = 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600&display=swap'
NOTE = 'Tap the path to walk. Tap an object to use a power. Tap a portrait to switch family members.'

CSS = """:root { --bg: #0b1a12; --ink: #f3e6c4; --gold: #ffd36f; color-scheme: dark; }
html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; background: var(--bg); overscroll-behavior: none; touch-action: manipulation; -webkit-user-select: none; user-select: none; -webkit-tap-highlight-color: transparent; }
body { font-family: Fredoka, "Trebuchet MS", sans-serif; color: var(--ink); }
#game { position: fixed; inset: 0; width: 100vw; height: 100vh; height: 100dvh; background: var(--bg); }
#game canvas { display: block; }
#rotate { display: none; position: fixed; left: 0; right: 0; top: 0; z-index: 5; margin: 0; padding: 10px 16px; text-align: center; font-size: 15px; color: #10281c; background: var(--gold); pointer-events: none; }
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
<p id="rotate">Turn your phone sideways for the full game.</p>
<script src="%s"></script>
<script>window.ASSET_URLS = %s;</script>
<script>
%s
</script>
""" % (FONTS, CSS, PHASER, json.dumps(urls), game_js)
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
<p id="rotate">Turn your phone sideways for the full game.</p>
<script src="%s"></script>
<script src="assets.js"></script>
<script src="game.js"></script>
</body>
</html>
""" % (FONTS, CSS, PHASER)
with open(os.path.join(HERE, 'index.html'), 'w', encoding='utf-8') as f:
    f.write(dev)

print('single file KB:', os.path.getsize(os.path.join(HERE, 'dist', 'crystal-family-quest.html')) // 1024)
