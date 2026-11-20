// Collects the web game into www/ so Capacitor can wrap it as an Android app.
const fs = require('fs');
const path = require('path');
const out = 'www';
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

let html = fs.readFileSync('index.html', 'utf8');
html = html.replace(/<script src="https:\/\/cdnjs[^"]*phaser[^"]*"><\/script>/, '<script src="phaser.min.js"></script>');
html = html.replace('viewport-fit=cover', 'viewport-fit=cover, maximum-scale=1, user-scalable=no');
fs.writeFileSync(path.join(out, 'index.html'), html);

['game.js', 'assets.js'].forEach((f) => fs.copyFileSync(f, path.join(out, f)));
fs.cpSync('assets', path.join(out, 'assets'), { recursive: true });
fs.copyFileSync('node_modules/phaser/dist/phaser.min.js', path.join(out, 'phaser.min.js'));
console.log('web build ready in ' + out + '/');
