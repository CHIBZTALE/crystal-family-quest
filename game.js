(function () {
'use strict';
var W = 1280, H = 720, GY = 585;
var URLS = window.ASSET_URLS || {};
var FONT = '"Fredoka","Trebuchet MS",sans-serif';
var GOLD = 0xffd36f, CREAM = '#f6e3b4', DARKG = 0x10281c, EDGE = 0xb88a3e;
var COMBO_MS = 25000;

/* ================= save data ================= */
var store = {
  d: null,
  defaults: function () {
    return { bank: 0, stars: {}, upg: { dad: 0, mom: 0, son: 0, dau: 0 }, owned: [], equip: { pet: '', aura: '', trail: '' }, daily: { last: '', streak: 0 }, sound: true };
  },
  load: function () {
    var base = this.defaults(), raw = {};
    try { raw = JSON.parse(localStorage.getItem('cfq-save') || '{}') || {}; } catch (e) { raw = {}; }
    var d = base;
    if (typeof raw.bank === 'number') d.bank = raw.bank;
    if (raw.stars && typeof raw.stars === 'object') d.stars = raw.stars;
    if (raw.best && !d.stars[1]) d.stars[1] = raw.best;
    if (raw.upg) Object.keys(d.upg).forEach(function (k) { if (typeof raw.upg[k] === 'number') d.upg[k] = raw.upg[k]; });
    if (Array.isArray(raw.owned)) d.owned = raw.owned;
    if (raw.equip) Object.keys(d.equip).forEach(function (k) { if (typeof raw.equip[k] === 'string') d.equip[k] = raw.equip[k]; });
    if (raw.daily) { d.daily.last = raw.daily.last || ''; d.daily.streak = raw.daily.streak || 0; }
    if (raw.sound === false) d.sound = false;
    this.d = d;
    return d;
  },
  save: function () { try { localStorage.setItem('cfq-save', JSON.stringify(this.d)); } catch (e) {} }
};
store.load();

function dayKey(date) { var d = date || new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
function dayNum(key) { var p = key.split('-'); return Math.round(Date.UTC(+p[0], +p[1] - 1, +p[2]) / 86400000); }

/* ================= game data ================= */
var DAILY = [
  { g: 20 }, { g: 30 }, { g: 40 }, { g: 50 }, { g: 60 }, { g: 80 }, { g: 150, aura: 'aura_gold' }
];
function dailyStatus() {
  var dl = store.d.daily, today = dayKey();
  if (dl.last === today) return { can: false, day: ((dl.streak - 1) % 7) + 1, streak: dl.streak };
  var streak = dl.streak;
  if (!dl.last || dayNum(today) - dayNum(dl.last) !== 1) streak = 0;
  return { can: true, day: (streak % 7) + 1, streak: streak };
}
function dailyClaim() {
  var st = dailyStatus();
  if (!st.can) return null;
  var r = DAILY[st.day - 1], d = store.d, unlocked = null;
  d.bank += r.g; d.daily.last = dayKey(); d.daily.streak = st.streak + 1;
  if (r.aura && d.owned.indexOf(r.aura) < 0) { d.owned.push(r.aura); unlocked = r.aura; }
  store.save();
  return { day: st.day, g: r.g, unlocked: unlocked };
}

var SHOP = {
  pets: [
    { id: 'pet_bird', kind: 'pet', name: 'Songbird', desc: 'Shows hints much sooner.', cost: 60, tex: 'bird', sc: 0.7, tint: 0xffd9ec },
    { id: 'pet_butterfly', kind: 'pet', name: 'Sparkle wing', desc: 'Pulls crystals in from farther away.', cost: 90, tex: 'butterfly', sc: 0.75 },
    { id: 'pet_turtle', kind: 'pet', name: 'Shell guard', desc: 'Blocks the first lost heart each level.', cost: 140, tex: 'turtle', sc: 0.62 }
  ],
  auras: [
    { id: 'aura_gold', kind: 'aura', name: 'Gold glow', desc: 'A warm glow around your hero.', cost: 40, color: 0xffd36f },
    { id: 'aura_aqua', kind: 'aura', name: 'Aqua glow', desc: 'A cool glow around your hero.', cost: 40, color: 0x6fe3ff },
    { id: 'aura_rose', kind: 'aura', name: 'Rose glow', desc: 'A soft pink glow around your hero.', cost: 40, color: 0xff8fc0 }
  ],
  trails: [
    { id: 'trail_stardust', kind: 'trail', name: 'Stardust', desc: 'Golden sparkles behind every step.', cost: 50, colors: [0xffe9a0, 0xffffff, 0xffd36f] },
    { id: 'trail_beads', kind: 'trail', name: 'Bead trail', desc: 'Coral, green and gold beads.', cost: 50, colors: [0xff7b4a, 0x59d98e, 0xffd36f] },
    { id: 'trail_crystal', kind: 'trail', name: 'Crystal dust', desc: 'Blue and purple crystal dust.', cost: 80, colors: [0x6fd6ff, 0xc59bff, 0xffffff] }
  ],
  outfits: [
    { name: 'Red cap' }, { name: 'Beaded necklaces' }, { name: 'Wrapper fabrics' },
    { name: 'Braided hairstyles' }, { name: 'Beaded sandals' }, { name: 'Ornaments' }
  ]
};
function allItems() { return SHOP.pets.concat(SHOP.auras, SHOP.trails); }
function itemById(id) { return allItems().filter(function (i) { return i.id === id; })[0] || null; }
function owned(id) { return store.d.owned.indexOf(id) >= 0; }

var UPG = {
  dad: { title: 'Strength', desc: 'Pushes rocks faster.', costs: [40, 80, 140], now: ['Normal push', '25% faster pushes', '50% faster pushes', '75% faster pushes'] },
  mom: { title: 'Wisdom', desc: 'Free rune mistakes.', costs: [40, 80, 140], now: ['No free mistakes', '1 free mistake per level', '2 free mistakes per level', '3 free mistakes per level'] },
  son: { title: 'Quick hands', desc: 'Faster family, wider pickup.', costs: [40, 80, 140], now: ['Normal speed and reach', '10% faster, reach +14', '20% faster, reach +28', '30% faster, reach +42'] },
  dau: { title: 'Spirit', desc: 'The bird brings more crystals.', costs: [40, 80, 140], now: ['Bird brings 2 crystals', 'Bird brings 3 crystals', 'Bird brings 4 crystals', 'Bird brings 5 crystals'] }
};

var TYPES = {
  tablet: { key: 'tablet', who: 'mom', sc: 0.8, stand: -150, reward: 2 },
  bridge: { key: 'bridge', who: 'son', sc: 0.78, stand: -170, reward: 3 },
  bush: { key: 'bush', who: 'dau', sc: 0.8, stand: -130, reward: 2 },
  boulder: { key: 'boulder', who: 'dad', sc: 0.72, stand: -135, reward: 2 }
};
var LEVELS = [
  { name: 'Garden Gate', rune: 3, gain: 0.17, sc: 1, hint: 22000, tint: null,
    objs: [['tablet', 440], ['bridge', 690], ['bush', 895], ['boulder', 1060]] },
  { name: 'Golden Hour', rune: 4, gain: 0.15, sc: 0.95, hint: 20000, tint: { c: 0xffa84a, a: 0.18 },
    objs: [['bridge', 380], ['boulder', 620], ['tablet', 820], ['bush', 990]] },
  { name: 'Twin Rocks', rune: 4, gain: 0.14, sc: 0.85, hint: 20000, tint: { c: 0xff8a5c, a: 0.12 },
    objs: [['bush', 300], ['boulder', 480], ['tablet', 660], ['bridge', 840], ['boulder', 1020]] },
  { name: 'Moonlit Path', rune: 5, gain: 0.13, sc: 0.85, hint: 18000, tint: { c: 0x1a2a6a, a: 0.42 }, fireflies: true,
    objs: [['tablet', 300], ['boulder', 470], ['bush', 650], ['bridge', 830], ['tablet', 1010]] },
  { name: 'Family Festival', rune: 5, gain: 0.12, sc: 0.78, hint: 18000, tint: { c: 0xff5fa8, a: 0.1 }, fireflies: true,
    objs: [['tablet', 240], ['bridge', 390], ['boulder', 560], ['bush', 720], ['tablet', 870], ['boulder', 1020]] }
];
function gemXs(lv) {
  var pts = [100].concat(lv.objs.map(function (o) { return o[1]; }), [1185]), xs = [];
  for (var i = 0; i < pts.length - 1; i++) {
    var a = pts[i], b = pts[i + 1], g = b - a;
    if (g >= 180) { xs.push(Math.round(a + g / 3), Math.round(a + 2 * g / 3)); }
    else if (g >= 100) { xs.push(Math.round(a + g / 2)); }
  }
  return xs;
}
function levelUnlocked(n) { return n === 1 || (store.d.stars[n - 1] || 0) >= 1; }
function totalStars() { var t = 0; for (var i = 1; i <= LEVELS.length; i++) t += store.d.stars[i] || 0; return t; }

var CH = {
  dad: { name: 'Dad', skill: 'Push rocks', h: 282, idle: 'dad_idle', walk: 'dad_walk', act: 'dad_push', win: 'dad_celebrate', hurt: 'dad_hurt', speed: 230, x: 70, por: 'por_dad_active' },
  mom: { name: 'Mom', skill: 'Solve puzzles', h: 248, idle: 'mom_idle', walk: 'mom_walk', act: 'mom_reveal', win: 'mom_cheer', hurt: 'mom_hurt', speed: 220, x: 180, por: 'por_mom' },
  son: { name: 'Son', skill: 'Squeeze through gaps', h: 190, idle: 'son_idle', walk: 'son_run', act: 'son_squeeze', win: 'son_celebrate', hurt: 'son_hurt', collect: 'son_collect', speed: 330, x: 265, por: 'por_son' },
  dau: { name: 'Daughter', skill: 'Talk to spirits', h: 205, idle: 'dau_idle', walk: 'dau_walk', act: 'dau_talk', win: 'dau_celebrate', hurt: 'dau_hurt', magic: 'dau_magic', speed: 240, x: 345, por: 'por_daughter' }
};
var ORDER = ['dad', 'mom', 'son', 'dau'];
var HINTS = { tablet: 'read the glowing runes', bridge: 'squeeze under the bridge', bush: 'talk to the spirit bird', boulder: 'push the big rock' };
var WRONG = {
  tablet: 'The runes need Mom. Tap her portrait.',
  bridge: 'Only Son is small enough. Tap his portrait.',
  bush: 'The spirit bird will only talk to Daughter.',
  boulder: 'That rock is heavy. Switch to Dad.'
};

/* ================= sound ================= */
var Sfx = {
  ctx: null, on: store.d.sound,
  init: function () {
    if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} }
    if (this.ctx && this.ctx.state === 'suspended') { try { this.ctx.resume(); } catch (e) {} }
  },
  tone: function (f, d, type, v, slide, delay) {
    if (!this.ctx || !this.on) return;
    d = d || 0.12; v = v || 0.07; delay = delay || 0;
    var t = this.ctx.currentTime + delay;
    var o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(this.ctx.destination);
    o.start(t); o.stop(t + d + 0.03);
  },
  collect: function () { this.tone(880, 0.09, 'triangle', 0.07); this.tone(1320, 0.14, 'triangle', 0.07, 0, 0.07); },
  blip: function () { this.tone(520, 0.07, 'square', 0.035); },
  wrong: function () { this.tone(200, 0.28, 'sawtooth', 0.06, -90); },
  thud: function () { this.tone(120, 0.18, 'square', 0.08, -70); },
  key: function () { var s = this; [523, 659, 784].forEach(function (f, i) { s.tone(f, 0.2, 'triangle', 0.07, 0, i * 0.09); }); },
  win: function () { var s = this; [523, 659, 784, 1047, 1319].forEach(function (f, i) { s.tone(f, 0.3, 'triangle', 0.08, 0, i * 0.12); }); },
  combo: function () { var s = this; [660, 880, 1100].forEach(function (f, i) { s.tone(f, 0.16, 'square', 0.04, 0, i * 0.07); }); },
  rune: function (i) { this.tone([392, 440, 523, 659][i], 0.32, 'sine', 0.09); }
};

/* ================= ui helpers ================= */
function roundRect(scene, x, y, w, h, r, fill, alpha, stroke, sw) {
  var g = scene.add.graphics();
  g.fillStyle(fill, alpha == null ? 1 : alpha);
  g.fillRoundedRect(x, y, w, h, r);
  if (stroke != null) { g.lineStyle(sw || 3, stroke, 1); g.strokeRoundedRect(x, y, w, h, r); }
  return g;
}
function txt(scene, x, y, s, size, color, extra) {
  var st = Object.assign({ fontFamily: FONT, fontSize: size + 'px', color: color || '#ffffff', fontStyle: '600', align: 'center' }, extra || {});
  return scene.add.text(x, y, s, st).setOrigin(0.5);
}
function button(scene, x, y, w, h, label, cb, o) {
  o = o || {};
  var depth = o.depth || 50, fill = o.fill == null ? 0x2e8b57 : o.fill, stroke = o.stroke == null ? GOLD : o.stroke;
  var rad = Math.min(h / 2, 30);
  var g = scene.add.graphics().setDepth(depth);
  var draw = function (press) {
    g.clear();
    g.fillStyle(press ? 0x1c5a39 : fill, 1);
    g.fillRoundedRect(x - w / 2, y - h / 2, w, h, rad);
    g.lineStyle(3, stroke, 1);
    g.strokeRoundedRect(x - w / 2, y - h / 2, w, h, rad);
  };
  draw(false);
  var t = txt(scene, x, y, label, o.size || 28, o.color || '#ffffff').setDepth(depth + 1);
  var z = scene.add.zone(x, y, w, h).setDepth(depth + 2).setInteractive({ useHandCursor: true });
  var self = {
    g: g, t: t, z: z,
    destroy: function () { g.destroy(); t.destroy(); z.destroy(); },
    setLabel: function (s) { t.setText(s); },
    setFill: function (f) { fill = f; draw(false); }
  };
  z.on('pointerdown', function () {
    Sfx.init(); Sfx.blip(); draw(true);
    scene.time.delayedCall(100, function () { if (g.scene) draw(false); });
    cb();
  });
  return self;
}
function bankBar(scene, depth) {
  depth = depth || 60;
  var x = W - 24 - 220, y = 16;
  var bg = roundRect(scene, x, y, 220, 56, 28, DARKG, 0.82, EDGE, 2).setDepth(depth);
  var gem = scene.add.image(x + 34, y + 28, 'gem_blue').setScale(0.4).setDepth(depth + 1);
  var t = txt(scene, x + 132, y + 29, String(store.d.bank), 32, CREAM).setDepth(depth + 1);
  return { set: function (n) { t.setText(String(n)); scene.tweens.add({ targets: t, scale: 1.2, duration: 100, yoyo: true }); }, objs: [bg, gem, t] };
}
function softBg(scene, dim) {
  scene.add.image(W / 2, H / 2, 'bg').setDisplaySize(W, H).setDepth(-20);
  scene.add.rectangle(W / 2, H / 2, W, H, 0x06140d, dim == null ? 0.5 : dim).setDepth(-19);
}
function starShape(scene, x, y, on, r) {
  return scene.add.star(x, y, 5, r * 0.45, r, on ? GOLD : 0x2f4a3b).setStrokeStyle(3, on ? 0xb87a1e : 0x486a58);
}
function burst(scene, x, y, tints, n) {
  var em = scene.add.particles(x, y, 'spark', {
    speed: { min: 90, max: 280 }, angle: { min: 0, max: 360 }, lifespan: { min: 350, max: 750 },
    scale: { start: 1, end: 0 }, gravityY: 240, tint: tints || [0x6fd6ff, 0xc59bff, 0xffd36f], emitting: false
  }).setDepth(2000);
  em.explode(n || 16);
  scene.time.delayedCall(1000, function () { if (em.scene) em.destroy(); });
}
function toast(scene, msg, ms, depth) {
  if (scene._toast && scene._toast.scene) { scene._toast.destroy(); }
  var t = txt(scene, 0, 0, msg, 26, '#ffffff', { wordWrap: { width: 780 }, stroke: '#10281c', strokeThickness: 3 });
  var w = t.width + 56, h = t.height + 28;
  var bg = roundRect(scene, -w / 2, -h / 2, w, h, 22, DARKG, 0.88, EDGE, 2);
  var c = scene.add.container(W / 2, 150, [bg, t]).setDepth(depth || 3000).setAlpha(0);
  scene._toast = c;
  scene.tweens.add({ targets: c, alpha: 1, y: 160, duration: 220 });
  scene.time.delayedCall(ms || 2600, function () {
    if (!c.scene) return;
    scene.tweens.add({ targets: c, alpha: 0, duration: 300, onComplete: function () { if (c.scene) c.destroy(); } });
  });
}

/* ================= Boot ================= */
var Boot = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Boot() { Phaser.Scene.call(this, 'Boot'); },
  create: function () {
    var self = this, keys = Object.keys(URLS), left = keys.length, finished = false;
    txt(this, W / 2, H / 2 - 30, 'Loading the garden...', 34, CREAM);
    this.add.rectangle(W / 2, H / 2 + 24, 420, 18, 0x244a35).setOrigin(0.5);
    var bar = this.add.rectangle(W / 2 - 210, H / 2 + 24, 2, 18, GOLD).setOrigin(0, 0.5);
    var finish = function () {
      if (finished) return; finished = true;
      var g = self.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xffffff, 1); g.fillCircle(6, 6, 6); g.generateTexture('spark', 12, 12); g.destroy();
      var c = self.textures.createCanvas('glow', 128, 128);
      var ctx = c.getContext();
      var gr = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
      gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gr; ctx.fillRect(0, 0, 128, 128); c.refresh();
      self.scene.start('Title');
    };
    keys.forEach(function (k) {
      self.textures.once('addtexture-' + k, function () {
        left--; bar.width = Math.max(2, 420 * (1 - left / keys.length));
        if (left <= 0) finish();
      });
      self.textures.addBase64(k, URLS[k]);
    });
    this.time.delayedCall(20000, finish);
  }
});

/* ================= Title ================= */
var Title = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Title() { Phaser.Scene.call(this, 'Title'); },
  create: function () {
    var self = this, go = false;
    this.add.image(W / 2, H / 2, 'title').setDisplaySize(W, H);
    var start = function () {
      if (go) return; go = true;
      Sfx.init(); Sfx.key();
      self.cameras.main.fadeOut(350, 0, 0, 0);
      self.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
    };
    this.input.on('pointerdown', start);
    this.input.keyboard.on('keydown', start);
    this.cameras.main.fadeIn(400);
  }
});

/* ================= Hub ================= */
var hubDailyShown = false;
var Hub = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Hub() { Phaser.Scene.call(this, 'Hub'); },
  create: function () {
    var self = this;
    this.pop = [];
    softBg(this, 0.5);
    this.bank = bankBar(this);
    var title = txt(this, W / 2, 110, 'Crystal Family Quest', 76, '#ffd36f', { stroke: '#2a1808', strokeThickness: 10 });
    this.tweens.add({ targets: title, scale: 1.03, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    txt(this, W / 2, 178, 'Stars collected  ' + totalStars() + ' / ' + (LEVELS.length * 3), 26, '#bfe6cf');

    var fam = [['dad', 120], ['mom', 225], ['son', 1070], ['dau', 1175]];
    fam.forEach(function (f, i) {
      var d = CH[f[0]], th = self.textures.get(d.idle).getSourceImage().height;
      var s = self.add.image(f[1], 705, d.idle).setOrigin(0.5, 1).setScale(d.h / th);
      self.tweens.add({ targets: s, y: 701, duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    button(this, W / 2, 300, 380, 104, 'Play', function () { self.go('Levels'); }, { size: 48 });
    button(this, 400, 440, 220, 76, 'Shop', function () { self.go('Shop'); }, { fill: 0x244a35 });
    button(this, 640, 440, 220, 76, 'Upgrades', function () { self.go('Upgrades'); }, { fill: 0x244a35 });
    var dly = button(this, 880, 440, 220, 76, 'Daily reward', function () { self.openDaily(); }, { fill: 0x244a35, size: 25 });
    this.dot = this.add.circle(880 + 100, 440 - 32, 11, 0xe24b4a).setStrokeStyle(3, 0xffffff).setDepth(60);
    this.tweens.add({ targets: this.dot, scale: 1.3, duration: 500, yoyo: true, repeat: -1 });
    this.dot.setVisible(dailyStatus().can);
    this.soundBtn = button(this, W / 2, 560, 220, 58, Sfx.on ? 'Sound on' : 'Sound off', function () {
      Sfx.init(); Sfx.on = !Sfx.on; store.d.sound = Sfx.on; store.save();
      self.soundBtn.setLabel(Sfx.on ? 'Sound on' : 'Sound off');
    }, { fill: 0x244a35, size: 24 });

    this.cameras.main.fadeIn(350);
    if (dailyStatus().can && !hubDailyShown) {
      hubDailyShown = true;
      this.time.delayedCall(600, function () { self.openDaily(); });
    }
  },
  go: function (key) {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start(key); });
  },
  closePop: function () {
    this.pop.forEach(function (o) { if (o && o.destroy) o.destroy(); });
    this.pop = [];
  },
  openDaily: function () {
    var self = this;
    if (this.pop.length) return;
    var st = dailyStatus(), P = this.pop, D = 1000;
    var add = function (o) { P.push(o); return o; };
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.72).setDepth(D).setInteractive());
    add(roundRect(this, W / 2 - 520, 60, 1040, 600, 40, DARKG, 0.97, GOLD, 5).setDepth(D + 1));
    add(txt(this, W / 2, 118, 'Daily reward', 54, CREAM, { stroke: '#2a1808', strokeThickness: 6 }).setDepth(D + 2));
    add(txt(this, W / 2, 168, st.can ? 'Day ' + st.day + ' is ready. Come back every day to keep your streak.' : 'Claimed today. Come back tomorrow for the next gift.', 24, '#bfe6cf').setDepth(D + 2));
    var cur = st.day, tiles = [];
    for (var i = 0; i < 7; i++) {
      (function (i) {
        var row = i < 4 ? 0 : 1, col = i < 4 ? i : i - 4;
        var cx = i < 4 ? 270 + col * 247 : 393 + col * 247, cy = row === 0 ? 290 : 470;
        var day = i + 1, past = st.can ? day < cur : day <= cur, today = st.can && day === cur;
        var big = day === 7;
        var w = 220, h = 150;
        add(roundRect(self, cx - w / 2, cy - h / 2, w, h, 22, past ? 0x1d3b2c : (today ? 0x3a3012 : 0x183123), 1, today ? GOLD : (big ? 0xc59bff : 0x486a58), today ? 5 : 3).setDepth(D + 2));
        add(txt(self, cx, cy - 46, 'Day ' + day, 24, today ? '#ffd36f' : '#bfe6cf').setDepth(D + 3));
        add(self.add.image(cx - 34, cy + 6, big ? 'gem_gold' : 'gem_blue').setScale(0.4).setDepth(D + 3));
        add(txt(self, cx + 24, cy + 6, '+' + DAILY[i].g, 36, CREAM).setDepth(D + 3));
        if (big) add(txt(self, cx, cy + 48, 'plus a Gold glow', 19, '#e5d3ff').setDepth(D + 3));
        if (past) {
          var ck = add(self.add.graphics().setDepth(D + 4));
          ck.lineStyle(8, 0x59d98e, 1); ck.beginPath(); ck.moveTo(cx + 62, cy - 52); ck.lineTo(cx + 78, cy - 36); ck.lineTo(cx + 98, cy - 66); ck.strokePath();
        }
      })(i);
    }
    if (st.can) {
      add(button(this, W / 2 - 130, 590, 240, 66, 'Claim', function () {
        var r = dailyClaim();
        if (!r) return;
        Sfx.win(); self.bank.set(store.d.bank); self.dot.setVisible(false);
        burst(self, W / 2, 400, [0xffd36f, 0x6fd6ff, 0xc59bff], 40);
        toast(self, '+' + r.g + ' crystals' + (r.unlocked ? ' and the Gold glow' : ''), 2600, 1100);
        self.closePop(); self.time.delayedCall(450, function () { self.openDaily(); });
      }, { depth: D + 5, size: 32 }));
      add(button(this, W / 2 + 130, 590, 240, 66, 'Later', function () { self.closePop(); }, { depth: D + 5, fill: 0x244a35, size: 28 }));
    } else {
      add(button(this, W / 2, 590, 240, 66, 'Close', function () { self.closePop(); }, { depth: D + 5, fill: 0x244a35, size: 30 }));
    }
  }
});

/* ================= Levels ================= */
var Levels = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Levels() { Phaser.Scene.call(this, 'Levels'); },
  create: function () {
    var self = this;
    softBg(this, 0.55);
    bankBar(this);
    txt(this, W / 2, 80, 'Choose a level', 54, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    txt(this, W / 2, 132, 'Garden Realm', 26, '#bfe6cf');
    LEVELS.forEach(function (lv, i) {
      var n = i + 1, cx = 75 + 105 + i * 230, cy = 380, open = levelUnlocked(n), st = store.d.stars[n] || 0;
      roundRect(self, cx - 105, cy - 170, 210, 340, 28, open ? 0x16301f : 0x0e1c14, 0.92, open ? EDGE : 0x33493c, 3);
      txt(self, cx, cy - 90, String(n), 96, open ? '#ffd36f' : '#4a6355', { stroke: '#2a1808', strokeThickness: open ? 8 : 0 });
      txt(self, cx, cy + 10, lv.name, 26, open ? CREAM : '#4a6355', { wordWrap: { width: 180 } });
      for (var s = 0; s < 3; s++) starShape(self, cx + (s - 1) * 52, cy + 78, s < st, 20);
      if (open) {
        button(self, cx, cy + 135, 160, 52, st ? 'Replay' : 'Play', function () { self.start(n); }, { size: 26 });
      } else {
        txt(self, cx, cy + 135, 'Earn a star on level ' + (n - 1), 18, '#7d9486', { wordWrap: { width: 170 } });
      }
    });
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.cameras.main.fadeIn(300);
  },
  start: function (n) {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Level', { n: n }); });
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Shop ================= */
var Shop = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Shop() { Phaser.Scene.call(this, 'Shop'); },
  create: function () {
    var self = this;
    this.tabObjs = []; this.tab = 'pets';
    softBg(this, 0.58);
    this.bank = bankBar(this);
    txt(this, W / 2, 62, 'Shop', 54, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    var tabs = [['pets', 'Pets'], ['auras', 'Glows'], ['trails', 'Trails'], ['outfits', 'Outfits']];
    this.tabBtns = {};
    tabs.forEach(function (t, i) {
      self.tabBtns[t[0]] = button(self, 325 + i * 210, 140, 190, 54, t[1], function () { self.render(t[0]); }, { size: 26 });
    });
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.render('pets');
    this.cameras.main.fadeIn(300);
  },
  clearTab: function () {
    var tw = this.tweens;
    this.tabObjs.forEach(function (o) { if (o && o.scene) tw.killTweensOf(o); if (o && o.destroy) o.destroy(); });
    this.tabObjs = [];
  },
  render: function (tab) {
    var self = this, T = this.tabObjs;
    this.clearTab(); this.tab = tab;
    var cols = { pets: 0, auras: 1, trails: 2, outfits: 3 };
    Object.keys(this.tabBtns).forEach(function (k) {
      var b = self.tabBtns[k], on = k === tab;
      b.t.setColor(on ? '#10281c' : '#ffffff');
      b.setFill(on ? GOLD : 0x244a35);
    });
    if (tab === 'outfits') {
      SHOP.outfits.forEach(function (it, i) {
        var col = i % 3, row = Math.floor(i / 3), cx = 270 + col * 370, cy = 290 + row * 190;
        T.push(roundRect(self, cx - 170, cy - 85, 340, 170, 26, 0x16301f, 0.9, 0x33493c, 3));
        T.push(txt(self, cx, cy - 36, it.name, 30, CREAM));
        T.push(txt(self, cx, cy + 14, 'Coming soon', 24, '#9fb8a8'));
        T.push(txt(self, cx, cy + 52, 'Needs new character art', 18, '#7d9486'));
      });
      return;
    }
    var items = SHOP[tab];
    items.forEach(function (it, i) {
      var cx = 270 + i * 370, cy = 400;
      T.push(roundRect(self, cx - 170, cy - 215, 340, 430, 28, 0x16301f, 0.92, EDGE, 3));
      if (it.kind === 'pet') {
        var im = self.add.image(cx, cy - 100, it.tex).setScale(it.sc * 1.5).setDepth(5);
        if (it.tint) im.setTint(it.tint);
        T.push(im);
        self.tweens.add({ targets: im, y: im.y - 8, duration: 800, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else if (it.kind === 'aura') {
        T.push(self.add.image(cx, cy - 100, 'glow').setScale(2.4).setTint(it.color).setBlendMode(Phaser.BlendModes.ADD).setDepth(5));
        T.push(self.add.image(cx, cy - 100, 'por_dad_active').setScale(0.55).setDepth(6));
      } else {
        for (var k = 0; k < 7; k++) {
          T.push(self.add.image(cx - 90 + k * 30, cy - 100 + Math.sin(k * 1.2) * 24, 'spark').setTint(it.colors[k % it.colors.length]).setScale(1.4 - (k % 3) * 0.3).setDepth(5));
        }
      }
      T.push(txt(self, cx, cy + 4, it.name, 32, CREAM));
      T.push(txt(self, cx, cy + 62, it.desc, 21, '#bfe6cf', { wordWrap: { width: 290 } }));
      var have = owned(it.id), eq = store.d.equip[it.kind] === it.id;
      var label, fill, color = '#ffffff';
      if (!have) { label = 'Buy  ' + it.cost; fill = store.d.bank >= it.cost ? 0x2e8b57 : 0x4a5a50; }
      else if (eq) { label = 'Equipped'; fill = GOLD; color = '#10281c'; }
      else { label = 'Equip'; fill = 0x2e8b57; }
      if (!have) T.push(self.add.image(cx - 98, cy + 160, 'gem_blue').setScale(0.32).setDepth(62));
      var b = button(self, cx, cy + 160, 250, 62, label, function () { self.act(it); }, { fill: fill, color: color, size: 28 });
      T.push(b);
    });
  },
  act: function (it) {
    var d = store.d;
    if (!owned(it.id)) {
      if (d.bank < it.cost) { toast(this, 'Not enough crystals yet. Play a level to earn more.', 2400); Sfx.wrong(); return; }
      d.bank -= it.cost; d.owned.push(it.id); d.equip[it.kind] = it.id; store.save();
      this.bank.set(d.bank); Sfx.win(); burst(this, W / 2, 360, [0xffd36f, 0x6fd6ff, 0xc59bff], 30);
      toast(this, it.name + ' is yours and equipped.', 2200);
    } else if (d.equip[it.kind] === it.id) {
      d.equip[it.kind] = ''; store.save(); toast(this, it.name + ' put away.', 1600);
    } else {
      d.equip[it.kind] = it.id; store.save(); Sfx.key(); toast(this, it.name + ' equipped.', 1600);
    }
    this.render(this.tab);
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Upgrades ================= */
var Upgrades = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Upgrades() { Phaser.Scene.call(this, 'Upgrades'); },
  create: function () {
    var self = this;
    this.cardObjs = [];
    softBg(this, 0.58);
    this.bank = bankBar(this);
    txt(this, W / 2, 62, 'Upgrades', 54, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.render();
    this.cameras.main.fadeIn(300);
  },
  render: function () {
    var self = this, C = this.cardObjs;
    C.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.cardObjs = C = [];
    ORDER.forEach(function (id, i) {
      var u = UPG[id], lvl = store.d.upg[id], cx = 205 + i * 290, cy = 395;
      C.push(roundRect(self, cx - 135, cy - 260, 270, 520, 28, 0x16301f, 0.92, EDGE, 3));
      C.push(self.add.image(cx, cy - 175, CH[id].por).setScale(0.78).setDepth(5));
      C.push(txt(self, cx, cy - 78, CH[id].name, 30, CREAM));
      C.push(txt(self, cx, cy - 40, u.title, 28, '#ffd36f'));
      C.push(txt(self, cx, cy + 0, u.desc, 19, '#bfe6cf', { wordWrap: { width: 230 } }));
      for (var p = 0; p < 3; p++) C.push(self.add.circle(cx + (p - 1) * 40, cy + 48, 12, p < lvl ? GOLD : 0x2f4a3b).setStrokeStyle(3, p < lvl ? 0xb87a1e : 0x486a58).setDepth(5));
      C.push(txt(self, cx, cy + 90, 'Now: ' + u.now[lvl], 19, '#ffffff', { wordWrap: { width: 235 } }));
      if (lvl < 3) {
        C.push(txt(self, cx, cy + 135, 'Next: ' + u.now[lvl + 1], 19, '#8fe8ff', { wordWrap: { width: 235 } }));
        var cost = u.costs[lvl];
        C.push(self.add.image(cx - 78, cy + 212, 'gem_blue').setScale(0.3).setDepth(62));
        C.push(button(self, cx, cy + 212, 220, 58, 'Upgrade  ' + cost, function () { self.buy(id); }, { fill: store.d.bank >= cost ? 0x2e8b57 : 0x4a5a50, size: 25 }));
      } else {
        C.push(button(self, cx, cy + 212, 220, 58, 'Maxed', function () { toast(self, CH[id].name + ' is fully upgraded.', 1800); }, { fill: GOLD, color: '#10281c', size: 26 }));
      }
    });
  },
  buy: function (id) {
    var d = store.d, u = UPG[id], lvl = d.upg[id];
    if (lvl >= 3) return;
    var cost = u.costs[lvl];
    if (d.bank < cost) { toast(this, 'Not enough crystals yet. Play a level to earn more.', 2400); Sfx.wrong(); return; }
    d.bank -= cost; d.upg[id] = lvl + 1; store.save();
    this.bank.set(d.bank); Sfx.win(); burst(this, 205 + ORDER.indexOf(id) * 290, 300, [0xffd36f, 0xfff2b8], 26);
    toast(this, CH[id].name + ': ' + u.title + ' level ' + (lvl + 1), 2200);
    this.render();
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Level ================= */
var Level = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Level() { Phaser.Scene.call(this, 'Level'); },

  init: function (data) {
    this.n = (data && data.n) || 1;
    this.lv = LEVELS[this.n - 1] || LEVELS[0];
  },

  create: function () {
    var self = this, d = store.d;
    this.alive = true; this.busy = false; this.pushing = false; this.power = 0;
    this.hearts = 3; this.crystals = 0; this.over = false;
    this.active = 'dad'; this.lastProgress = this.time.now; this.hinted = false;
    this.chain = 0; this.chainAt = -1e9; this.lastWho = ''; this.trailT = 0;
    this.up = d.upg; this.free = d.upg.mom;
    this.petItem = itemById(d.equip.pet); this.auraItem = itemById(d.equip.aura); this.trailItem = itemById(d.equip.trail);
    this.shield = !!(this.petItem && this.petItem.id === 'pet_turtle');
    this.gain = this.lv.gain * (1 + 0.25 * d.upg.dad);
    this.speedMul = 1 + 0.1 * d.upg.son;
    this.reach = 55 + 14 * d.upg.son + ((this.petItem && this.petItem.id === 'pet_butterfly') ? 45 : 0);
    this.hintMs = (this.petItem && this.petItem.id === 'pet_bird') ? 9000 : this.lv.hint;
    this.events.once('shutdown', function () { self.alive = false; });

    this.add.image(W / 2, H / 2 - 2, 'bg').setDisplaySize(W, H + 4).setDepth(-10);
    if (this.lv.tint) this.add.rectangle(W / 2, H / 2, W, H, this.lv.tint.c, this.lv.tint.a).setDepth(-9);
    if (this.lv.fireflies) this.buildFireflies();
    this.buildWorld(); this.buildChars(); this.buildHud(); this.buildInput();
    this.cameras.main.fadeIn(500);
    this.time.delayedCall(800, function () { self.intro(); });
  },

  wait: function (ms) { var s = this; return new Promise(function (r) { s.time.delayedCall(ms, r); }); },
  tw: function (cfg) { var s = this; return new Promise(function (r) { cfg.onComplete = r; s.tweens.add(cfg); }); },

  buildFireflies: function () {
    for (var i = 0; i < 14; i++) {
      var f = this.add.image(Phaser.Math.Between(40, W - 40), Phaser.Math.Between(180, 560), 'glow').setScale(0.35).setAlpha(0.8).setTint(0xfff2a8).setBlendMode(Phaser.BlendModes.ADD).setDepth(-5);
      this.tweens.add({ targets: f, x: f.x + Phaser.Math.Between(-80, 80), y: f.y + Phaser.Math.Between(-50, 50), alpha: 0.25, duration: 1800 + i * 160, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
  },

  /* ----- world ----- */
  reward: function (type) { return TYPES[type].reward + (type === 'bush' ? this.up.dau : 0); },

  buildWorld: function () {
    var self = this, lv = this.lv;
    this.gate = this.add.image(1185, GY - 30, 'gate').setOrigin(0.5, 1).setScale(0.62).setDepth(GY - 40);
    this.gateGlow = this.add.image(1185, GY - 130, 'glow').setScale(0).setAlpha(0).setDepth(GY - 41).setTint(0xfff0b0).setBlendMode(Phaser.BlendModes.ADD);

    this.list = [];
    var total = 0;
    lv.objs.forEach(function (spec, i) {
      var t = TYPES[spec[0]], x = spec[1];
      var o = { id: spec[0] + i, type: spec[0], t: t, x: x, who: t.who, stand: x + t.stand * lv.sc, scale: t.sc * lv.sc, done: false };
      o.sprite = self.add.image(x, GY - 12, t.key).setOrigin(0.5, 1).setScale(o.scale).setDepth(GY - 12);
      o.sprite.setInteractive({ useHandCursor: true });
      o.sprite.on('pointerdown', function () { self.interact(o); });
      o.coin = self.add.image(x, GY - 12 - o.sprite.displayHeight - 34, CH[o.who].por).setScale(0.34).setDepth(800);
      self.tweens.add({ targets: o.coin, y: o.coin.y - 10, duration: 750, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      if (o.type === 'bush') {
        o.bird = self.add.image(x + 6, o.sprite.y - o.sprite.displayHeight + 30, 'bird').setScale(0.7 * Math.min(1, lv.sc + 0.1)).setDepth(GY - 8);
        o.birdHome = { x: o.bird.x, y: o.bird.y };
        self.tweens.add({ targets: o.bird, y: o.bird.y - 5, angle: 5, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      }
      total += self.reward(o.type);
      self.list.push(o);
    });

    var kinds = ['gem_blue', 'gem_purple', 'gem_pink', 'gem_gold'];
    this.gems = [];
    gemXs(lv).forEach(function (x, i) {
      var y = GY - 70 - ((i * 37) % 70);
      var glow = self.add.image(x, y, 'glow').setScale(0.9).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setDepth(GY - 6).setTint(0x9fe8ff);
      var sp = self.add.image(x, y, kinds[i % 4]).setScale(0.5).setDepth(GY - 5);
      self.tweens.add({ targets: [sp, glow], y: y - 9, duration: 900 + i * 60, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      self.gems.push({ x: x, sprite: sp, glow: glow, got: false });
      total += 1;
    });
    this.total = total;
  },

  /* ----- characters ----- */
  buildChars: function () {
    var self = this;
    this.ch = {};
    ORDER.forEach(function (id) {
      var d = CH[id];
      var th = self.textures.get(d.idle).getSourceImage().height;
      var c = { id: id, def: d, x: d.x, dir: 1, targetX: d.x, scale: d.h / th, lock: false, following: false, moving: false, waiters: [] };
      c.sprite = self.add.image(c.x, GY, d.idle).setOrigin(0.5, 1).setScale(c.scale);
      self.ch[id] = c;
    });
    this.marker = this.add.triangle(0, 0, 0, 0, 30, 0, 15, 22, GOLD).setDepth(900);
    this.markerTween = this.tweens.add({ targets: this.marker, scaleY: 0.85, duration: 450, yoyo: true, repeat: -1 });
    this.tapRing = this.add.ellipse(0, GY, 60, 20).setStrokeStyle(4, 0xffffff, 0.9).setAlpha(0).setDepth(2);

    this.aura = null; this.pet = null;
    if (this.auraItem) this.aura = this.add.image(0, GY - 110, 'glow').setScale(2.4).setAlpha(0.6).setTint(this.auraItem.color).setBlendMode(Phaser.BlendModes.ADD).setDepth(GY - 3);
    if (this.petItem) {
      var it = this.petItem, flat = it.id === 'pet_turtle';
      this.pet = this.add.image(120, flat ? GY : GY - 190, it.tex).setScale(it.sc).setDepth(GY - 2);
      if (flat) this.pet.setOrigin(0.5, 1);
      if (it.tint) this.pet.setTint(it.tint);
      this.petFlat = flat;
    }
  },

  pose: function (c, kind) { c.lock = true; c.sprite.setTexture(c.def[kind]); },
  unlock: function (c) { c.lock = false; },

  xMax: function () {
    var m = 1235;
    for (var i = 0; i < this.list.length; i++) {
      var o = this.list[i];
      if (o.type === 'boulder' && !o.done) m = Math.min(m, o.x - 120 * this.lv.sc);
    }
    return m;
  },

  walkTo: function (id, x) {
    var c = this.ch[id];
    c.targetX = Phaser.Math.Clamp(x, 60, this.xMax());
    c.following = false;
    if (Math.abs(c.x - c.targetX) < 2) return Promise.resolve();
    return new Promise(function (r) { c.waiters.push(r); });
  },

  stepChar: function (id, s, t) {
    var c = this.ch[id], sp = c.sprite, d = c.def;
    if (c.lock) { sp.x = c.x; sp.setFlipX(c.dir < 0); sp.setDepth(GY + 1); return; }
    var target = null, speed = d.speed * this.speedMul;
    if (id === this.active) { target = c.targetX; }
    else {
      var L = this.ch[this.active], me = this;
      var rank = ORDER.filter(function (k) { return k !== me.active; }).indexOf(id) + 1;
      var ft = Phaser.Math.Clamp(L.x - L.dir * 78 * rank, 60, this.xMax());
      var dist = Math.abs(c.x - ft);
      if (dist > 120) c.following = true;
      if (dist < 22) c.following = false;
      if (c.following) { target = ft; speed = speed * 0.95; }
    }
    c.moving = false;
    if (target !== null) {
      var diff = target - c.x;
      if (Math.abs(diff) > 1.5) {
        var step = Math.min(Math.abs(diff), speed * s);
        c.dir = diff > 0 ? 1 : -1; c.x += c.dir * step; c.moving = true;
      } else if (c.waiters.length) {
        var w = c.waiters; c.waiters = []; w.forEach(function (r) { r(); });
      }
    }
    sp.setTexture(c.moving ? d.walk : d.idle);
    sp.x = c.x; sp.setFlipX(c.dir < 0);
    sp.y = GY - (c.moving ? Math.abs(Math.sin(t * 0.018)) * 6 : 0);
    sp.setDepth(GY);
  },

  /* ----- HUD ----- */
  buildHud: function () {
    var self = this, n = this.list.length;
    this.add.image(24, 16, 'counter').setOrigin(0, 0).setDepth(600);
    this.counterText = txt(this, 218, 60, '0/' + this.total, 38, CREAM, { stroke: '#2a1808', strokeThickness: 5 }).setDepth(601);

    this.heartImgs = [];
    for (var i = 0; i < 3; i++) this.heartImgs.push(this.add.image(1075 + i * 75, 52, 'heart_full').setDepth(600));

    var pw = 62 * n + 36;
    roundRect(this, 640 - pw / 2, 18, pw, 66, 33, DARKG, 0.6, EDGE, 2).setDepth(590);
    this.keyCoins = {};
    this.list.forEach(function (o, i) {
      self.keyCoins[o.id] = self.add.image(640 + (i - (n - 1) / 2) * 62, 51, CH[o.who].por).setScale(0.31).setDepth(600).setTint(0x4a4a4a).setAlpha(0.7);
    });

    this.comboTxt = txt(this, 640, 112, '', 26, '#ffd36f', { stroke: '#2a1808', strokeThickness: 5 }).setDepth(600).setVisible(false);
    this.comboBar = this.add.graphics().setDepth(600);

    roundRect(this, 24, 118, 120, 40, 20, DARKG, 0.6, EDGE, 2).setDepth(590);
    this.soundTxt = txt(this, 84, 138, Sfx.on ? 'Sound on' : 'Sound off', 20, CREAM).setDepth(601);
    var zs = this.add.zone(84, 138, 120, 40).setDepth(602).setInteractive({ useHandCursor: true });
    zs.on('pointerdown', function () { Sfx.init(); Sfx.on = !Sfx.on; store.d.sound = Sfx.on; store.save(); self.soundTxt.setText(Sfx.on ? 'Sound on' : 'Sound off'); if (Sfx.on) Sfx.blip(); });
    roundRect(this, 158, 118, 120, 40, 20, DARKG, 0.6, EDGE, 2).setDepth(590);
    txt(this, 218, 138, 'Levels', 20, CREAM).setDepth(601);
    var zm = this.add.zone(218, 138, 120, 40).setDepth(602).setInteractive({ useHandCursor: true });
    zm.on('pointerdown', function () { Sfx.init(); self.leave('Levels'); });

    roundRect(this, 322, 600, 636, 124, 30, DARKG, 0.82, EDGE, 3).setDepth(550);
    this.ports = {};
    this.activeRing = this.add.graphics().setDepth(552);
    ORDER.forEach(function (id, i) {
      var x = 640 + (i - 1.5) * 150, y = 650;
      var im = self.add.image(x, y, CH[id].por).setScale(88 / 150).setDepth(560).setInteractive({ useHandCursor: true });
      var nm = txt(self, x, 706, CH[id].name, 17, CREAM).setDepth(561);
      im.on('pointerdown', function () { self.switchTo(id); });
      self.ports[id] = { img: im, name: nm, x: x, y: y };
    });
    this.refreshPorts();
  },

  leave: function (key) {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start(key); });
  },

  refreshPorts: function () {
    var self = this;
    ORDER.forEach(function (id) {
      var p = self.ports[id], on = id === self.active;
      p.img.setScale(on ? 100 / 150 : 86 / 150);
      p.name.setColor(on ? '#8fe8ff' : CREAM);
    });
    var a = this.ports[this.active];
    this.activeRing.clear();
    this.activeRing.lineStyle(5, 0x6fe3ff, 1);
    this.activeRing.strokeCircle(a.x, a.y, 55);
    this.activeRing.lineStyle(3, 0x6fe3ff, 0.35);
    this.activeRing.strokeCircle(a.x, a.y, 62);
  },

  pulsePortrait: function (id) {
    var p = this.ports[id];
    this.tweens.add({ targets: p.img, scale: p.img.scale * 1.22, duration: 280, yoyo: true, repeat: 4, ease: 'Sine.easeInOut' });
  },

  toast: function (msg, ms) { toast(this, msg, ms, 700); },

  banner: function (msg, color) {
    var self = this;
    var t = txt(this, W / 2, 300, msg, 62, color || '#ffd36f', { stroke: '#2a1808', strokeThickness: 8 }).setDepth(980).setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: t, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.time.delayedCall(1300, function () {
      self.tweens.add({ targets: t, alpha: 0, y: 250, duration: 400, onComplete: function () { if (t.scene) t.destroy(); } });
    });
  },

  /* ----- input ----- */
  buildInput: function () {
    var self = this;
    this.input.on('pointerdown', function (p, over) {
      Sfx.init();
      if (self.over) return;
      if (self.pushing) { self.pushTap(); return; }
      if (self.busy || over.length) return;
      if (p.y < 300 || p.y > 598) return;
      self.setTarget(p.x);
    });
    this.input.keyboard.on('keydown', function (e) {
      if (self.over || self.busy) return;
      var k = e.key, c = self.ch[self.active];
      if (k >= '1' && k <= '4') self.switchTo(ORDER[+k - 1]);
      else if (k === 'ArrowLeft') self.setTarget(c.x - 180);
      else if (k === 'ArrowRight') self.setTarget(c.x + 180);
    });
  },

  setTarget: function (x) {
    var c = this.ch[this.active];
    c.targetX = Phaser.Math.Clamp(x, 60, this.xMax());
    c.following = false;
    this.tapRing.setPosition(c.targetX, GY + 4).setAlpha(1).setScale(0.4);
    this.tweens.add({ targets: this.tapRing, scale: 1.2, alpha: 0, duration: 450 });
  },

  switchTo: function (id) {
    if (this.busy || this.over) return;
    Sfx.init();
    var d = CH[id];
    if (id === this.active) { this.toast(d.name + ': ' + d.skill, 1800); return; }
    var old = this.ch[this.active]; old.targetX = old.x;
    this.active = id;
    this.ch[id].targetX = this.ch[id].x;
    Sfx.blip(); this.refreshPorts();
    this.toast(d.name + ': ' + d.skill, 1800);
  },

  intro: function () {
    var self = this;
    if (this.n === 1) {
      this.toast('Tap the path to walk. Tap an object to use a power.', 4200);
      this.time.delayedCall(4800, function () { if (!self.over && !self.busy) self.toast('Switch family members with the portraits. Finish every task to open the gate.', 4400); });
    } else {
      this.toast('Level ' + this.n + ': ' + this.lv.name + '. Use different family members back to back for combos.', 4400);
    }
  },

  /* ----- progress, hearts, crystals, combos ----- */
  progress: function () { this.lastProgress = this.time.now; this.hinted = false; },

  nextNeeded: function () {
    var xm = this.xMax();
    for (var i = 0; i < this.list.length; i++) {
      var o = this.list[i];
      if (!o.done && o.stand <= xm + 8) return o;
    }
    return null;
  },

  loseHeart: function () {
    if (this.hearts <= 0 || this.over) return;
    if (this.shield) { this.shield = false; this.toast('Shell guard blocked the hit.', 2000); Sfx.thud(); this.cameras.main.shake(120, 0.003); return; }
    this.hearts--;
    var im = this.heartImgs[this.hearts];
    im.setTexture('heart_empty');
    this.tweens.add({ targets: im, scale: 1.4, duration: 120, yoyo: true });
    this.cameras.main.shake(180, 0.005);
    Sfx.wrong();
    if (this.hearts <= 0) this.time.delayedCall(700, this.gameOver, [], this);
  },

  updateCounter: function () {
    this.counterText.setText(this.crystals + '/' + Math.max(this.total, this.crystals));
    this.tweens.add({ targets: this.counterText, scale: 1.25, duration: 100, yoyo: true });
  },

  burst: function (x, y, tints, n) { burst(this, x, y, tints, n); },

  addCrystals: function (n, x, y) {
    var self = this, kinds = ['gem_blue', 'gem_purple', 'gem_pink', 'gem_gold'];
    this.burst(x, y);
    for (var i = 0; i < n; i++) {
      (function (i) {
        self.time.delayedCall(i * 120, function () {
          var g = self.add.image(x + (i - n / 2) * 18, y, kinds[(i + 1) % 4]).setScale(0.5).setDepth(960);
          self.tweens.add({
            targets: g, x: 70, y: 60, scale: 0.22, duration: 650, ease: 'Quad.easeIn',
            onComplete: function () { g.destroy(); self.crystals += 1; self.updateCounter(); Sfx.collect(); }
          });
        });
      })(i);
    }
  },

  registerAction: function (who) {
    var now = this.time.now;
    if (this.chain > 0 && now - this.chainAt <= COMBO_MS) { if (who !== this.lastWho) this.chain++; }
    else this.chain = 1;
    this.lastWho = who; this.chainAt = now;
    if (this.chain >= 2) this.comboFire();
  },

  comboFire: function () {
    var c = this.chain, bonus = Math.min(c, 4);
    Sfx.combo();
    if (c >= 4) {
      this.banner('UNITY MOVE!', '#8fe8ff');
      if (this.hearts < 3) { this.heartImgs[this.hearts].setTexture('heart_full'); this.hearts++; }
      this.burst(W / 2, 300, [0xffd36f, 0x6fd6ff, 0xc59bff, 0xff8fc0], 40);
    } else {
      this.banner('FAMILY COMBO x' + c, '#ffd36f');
    }
    this.addCrystals(bonus, W / 2, 330);
  },

  markDone: function (o) {
    o.done = true;
    if (o.coin && o.coin.scene) o.coin.destroy();
    var k = this.keyCoins[o.id];
    k.clearTint(); k.setAlpha(1);
    this.tweens.add({ targets: k, scale: 0.46, duration: 220, yoyo: true, ease: 'Back.easeOut' });
    this.burst(k.x, k.y, [0xffd36f, 0xfff2b8], 18);
    Sfx.key();
    this.progress();
    this.registerAction(o.who);
  },

  /* ----- interactions ----- */
  interact: async function (o) {
    if (this.busy || this.over || this.pushing) return;
    if (o.done) { this.toast('Already done. Great work!', 1600); return; }
    if (this.active !== o.who) {
      this.toast(WRONG[o.type], 2600); this.pulsePortrait(o.who); Sfx.blip(); return;
    }
    if (o.stand > this.xMax() + 8) {
      this.toast('A big rock blocks the way. Move it first.', 2600); this.pulsePortrait('dad'); Sfx.blip(); return;
    }
    this.busy = true;
    await this.walkTo(o.who, o.stand);
    if (!this.alive) return;
    this.ch[o.who].dir = 1;
    await this['do_' + o.type](o);
    if (!this.alive) return;
    this.busy = false;
    this.checkDone();
  },

  do_tablet: async function (o) {
    var c = this.ch.mom;
    this.pose(c, 'act');
    await this.wait(500);
    await this.runePuzzle();
    if (!this.alive || this.over) return;
    this.pose(c, 'win');
    o.sprite.setTint(0xcfe8ff);
    this.tweens.add({ targets: o.sprite, scale: o.scale * 1.04, duration: 220, yoyo: true, repeat: 2 });
    this.markDone(o);
    this.addCrystals(this.reward('tablet'), o.x, o.sprite.y - 140 * o.scale);
    await this.wait(1100);
    this.unlock(c);
  },

  do_bridge: async function (o) {
    var c = this.ch.son, br = o.sprite;
    this.pose(c, 'act');
    await this.tw({ targets: c, x: br.x - 30, duration: 700, ease: 'Sine.easeInOut' });
    await this.tw({ targets: c.sprite, alpha: 0, duration: 250 });
    Sfx.thud();
    await this.wait(500);
    this.addCrystals(this.reward('bridge'), br.x, GY - 70);
    await this.wait(900);
    c.x = Math.min(br.x + 150 * this.lv.sc, this.xMax()); c.targetX = c.x; c.dir = 1;
    c.sprite.alpha = 1;
    this.pose(c, 'collect');
    this.markDone(o);
    await this.wait(800);
    this.pose(c, 'win');
    await this.wait(700);
    this.unlock(c);
  },

  dialog: function (who, big, small) {
    var self = this;
    return new Promise(function (resolve) {
      var w = 760, h = 190;
      var bg = roundRect(self, -w / 2, -h / 2, w, h, 30, DARKG, 0.92, GOLD, 3);
      var t0 = txt(self, 0, -62, who, 22, '#8fe8ff');
      var t1 = txt(self, 0, -18, big, 44, CREAM);
      var t2 = txt(self, 0, 38, small, 26, '#ffffff', { wordWrap: { width: 680 } });
      var hint = txt(self, w / 2 - 74, h / 2 - 22, 'Tap to continue', 15, '#9fb8a8');
      var c = self.add.container(W / 2, 250, [bg, t0, t1, t2, hint]).setDepth(1200).setAlpha(0);
      self.tweens.add({ targets: c, alpha: 1, duration: 250 });
      var done = false;
      var finish = function () {
        if (done) return; done = true;
        self.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: function () { c.destroy(); resolve(); } });
      };
      self.time.delayedCall(500, function () { self.input.once('pointerdown', finish); });
      self.time.delayedCall(6500, finish);
    });
  },

  do_bush: async function (o) {
    var c = this.ch.dau, bird = o.bird;
    this.pose(c, 'act');
    this.tweens.add({ targets: bird, scale: bird.scale * 1.2, duration: 200, yoyo: true, repeat: 1 });
    Sfx.tone(988, 0.12, 'triangle', 0.06); Sfx.tone(1318, 0.16, 'triangle', 0.06, 0, 0.1);
    await this.wait(700);
    await this.dialog('Spirit bird says', 'Igwe bu ike.', 'There is strength in unity. Bring the whole family together.');
    if (!this.alive) return;
    this.pose(c, 'magic');
    var gx = this.gate.x, gy = this.gate.y - 150;
    await this.tw({ targets: bird, x: (bird.x + gx) / 2, y: bird.y - 140, duration: 650, ease: 'Sine.easeOut' });
    await this.tw({ targets: bird, x: gx, y: gy, duration: 650, ease: 'Sine.easeIn' });
    this.burst(gx, gy, [0xfff2b8, 0xffd36f, 0xc59bff], 22);
    this.addCrystals(this.reward('bush'), gx, gy);
    this.markDone(o);
    await this.tw({ targets: bird, x: o.birdHome.x, y: o.birdHome.y, duration: 1100, ease: 'Sine.easeInOut' });
    this.pose(c, 'win');
    await this.wait(700);
    this.unlock(c);
  },

  pushTap: function () {
    if (this.power >= 1) return;
    this.power = Math.min(1, this.power + this.gain);
    Sfx.thud();
    var c = this.ch.dad;
    this.tweens.add({ targets: c.sprite, scaleX: c.scale * 1.05, duration: 60, yoyo: true });
    if (this.power >= 1 && this.pushResolve) { var r = this.pushResolve; this.pushResolve = null; r(); }
  },

  do_boulder: async function (o) {
    var c = this.ch.dad, bo = o.sprite, baseX = bo.x, standX = c.x;
    this.pose(c, 'act');
    this.pushing = true; this.power = 0;
    this.pushBar = this.add.graphics().setDepth(990);
    this.pushTxt = txt(this, 0, 0, 'TAP! TAP! TAP!', 30, '#ffffff', { stroke: '#10281c', strokeThickness: 6 }).setDepth(991);
    this.pushBase = { baseX: baseX, standX: standX, bo: bo, c: c };
    this.toast('Dad pushes with all his might. Tap fast!', 3000);
    await new Promise(function (r) { this.pushResolve = r; }.bind(this));
    if (!this.alive) return;
    this.pushing = false;
    this.pushBar.destroy(); this.pushTxt.destroy();
    this.cameras.main.shake(450, 0.012);
    this.burst(bo.x + 40, GY - 8, [0xb9a27a, 0x8c7a56, 0xd7c8a3], 26);
    Sfx.thud(); this.time.delayedCall(180, function () { Sfx.thud(); });
    this.tweens.add({ targets: c, x: standX + 25, duration: 250, yoyo: true });
    this.addCrystals(this.reward('boulder'), bo.x, GY - 60);
    await this.tw({ targets: bo, x: bo.x + 150, y: bo.y + 230, scale: bo.scale * 1.3, angle: 200, alpha: 0, duration: 950, ease: 'Quad.easeIn' });
    bo.destroy();
    this.pose(c, 'win');
    this.markDone(o);
    await this.wait(900);
    this.unlock(c);
  },

  runePuzzle: function () {
    var self = this;
    return new Promise(function (resolve) {
      var D = 1300;
      var cont = [];
      var add = function (o) { cont.push(o); return o; };
      var dim = add(self.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.66).setDepth(D).setInteractive());
      add(roundRect(self, W / 2 - 400, 110, 800, 480, 36, DARKG, 0.96, GOLD, 4).setDepth(D + 1));
      add(txt(self, W / 2, 168, 'Mom reads the runes', 46, CREAM).setDepth(D + 2));
      var sub = add(txt(self, W / 2, 226, 'Watch the runes light up...', 28, '#ffffff').setDepth(D + 2));

      var cols = [0x59d98e, 0xffb347, 0x6ec6ff, 0xd48bff];
      var gfx = [];
      function drawShape(g, i, on) {
        g.clear();
        g.fillStyle(on ? cols[i] : 0x1d3b2c, 1); g.fillRoundedRect(-62, -62, 124, 124, 22);
        g.lineStyle(4, cols[i], on ? 1 : 0.7); g.strokeRoundedRect(-62, -62, 124, 124, 22);
        g.fillStyle(on ? 0xffffff : cols[i], 1);
        if (i === 0) g.fillCircle(0, 0, 32);
        else if (i === 1) g.fillTriangle(0, -34, 36, 28, -36, 28);
        else if (i === 2) g.fillRect(-28, -28, 56, 56);
        else g.fillPoints([{ x: 0, y: -38 }, { x: 34, y: 0 }, { x: 0, y: 38 }, { x: -34, y: 0 }], true);
      }
      for (var i = 0; i < 4; i++) {
        (function (i) {
          var x = W / 2 + (i - 1.5) * 160, y = 370;
          var g = add(self.add.graphics().setDepth(D + 3));
          g.setPosition(x, y);
          drawShape(g, i, false);
          gfx.push(g);
          var z = add(self.add.zone(x, y, 124, 124).setDepth(D + 4).setInteractive({ useHandCursor: true }));
          z.on('pointerdown', function () { press(i); });
        })(i);
      }
      add(roundRect(self, W / 2 - 110, 490, 220, 56, 28, 0x244a35, 1, EDGE, 2).setDepth(D + 2));
      add(txt(self, W / 2, 518, 'Show again', 24, CREAM).setDepth(D + 3));
      var againZ = add(self.add.zone(W / 2, 518, 220, 56).setDepth(D + 4).setInteractive({ useHandCursor: true }));
      var freeTxt = add(txt(self, W / 2, 570, self.free > 0 ? 'Mom\'s wisdom: ' + self.free + ' free mistake' + (self.free > 1 ? 's' : '') : '', 20, '#8fe8ff').setDepth(D + 3));

      var len = self.lv.rune, seq = [];
      for (var q = 0; q < len; q++) seq.push(Phaser.Math.Between(0, 3));
      var input = [], accept = false, playing = false, dead = false;
      var destroyAll = function () { cont.forEach(function (o) { if (o && o.scene) o.destroy(); }); };

      function light(i, on) { if (gfx[i] && gfx[i].scene) drawShape(gfx[i], i, on); }
      async function play() {
        if (playing) return; playing = true; accept = false; input = [];
        sub.setText('Watch the runes light up...');
        await self.wait(500);
        for (var k = 0; k < seq.length; k++) {
          if (dead) return;
          light(seq[k], true); Sfx.rune(seq[k]);
          await self.wait(560); light(seq[k], false); await self.wait(240);
        }
        sub.setText('Your turn! Tap them in the same order.');
        accept = true; playing = false;
      }
      async function press(i) {
        if (!accept || dead) return;
        light(i, true); Sfx.rune(i);
        self.time.delayedCall(260, function () { if (!dead) light(i, false); });
        input.push(i);
        if (seq[input.length - 1] !== i) {
          accept = false;
          self.pose(self.ch.mom, 'hurt');
          if (self.free > 0) {
            self.free--; Sfx.wrong();
            freeTxt.setText(self.free > 0 ? 'Mom\'s wisdom: ' + self.free + ' free mistake' + (self.free > 1 ? 's' : '') : 'No free mistakes left');
          } else self.loseHeart();
          if (self.hearts <= 0) { dead = true; return; }
          sub.setText('Not quite. Watch again.');
          await self.wait(1000);
          self.pose(self.ch.mom, 'act');
          play();
          return;
        }
        if (input.length === seq.length) {
          accept = false;
          sub.setText('Yes! The runes glow.');
          Sfx.key();
          await self.wait(900);
          dead = true; destroyAll(); resolve();
        }
      }
      againZ.on('pointerdown', function () { if (!playing) play(); });
      play();
    });
  },

  checkDone: function () {
    if (this.over) return;
    for (var i = 0; i < this.list.length; i++) if (!this.list[i].done) return;
    this.openGate();
  },

  openGate: async function () {
    this.busy = true; this.over = true;
    this.toast('Every task is done. The gate is opening!', 3000);
    await this.wait(900);
    Sfx.win();
    this.cameras.main.flash(500, 255, 244, 200);
    this.gateGlow.setAlpha(1);
    this.tweens.add({ targets: this.gateGlow, scale: 4.2, duration: 700, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.gate, alpha: 0.2, duration: 700 });
    this.burst(this.gate.x, this.gate.y - 120, [0xfff2b8, 0xffd36f, 0x6fd6ff], 40);
    var self = this;
    ORDER.forEach(function (id, i) {
      self.time.delayedCall(i * 160, function () { var c = self.ch[id]; self.pose(c, 'win'); self.tweens.add({ targets: c.sprite, y: GY - 26, duration: 180, yoyo: true, repeat: 2 }); });
    });
    await this.wait(2600);
    this.winPanel();
  },

  /* ----- end panels ----- */
  winPanel: function () {
    var self = this, n = this.n;
    var ratio = this.crystals / Math.max(1, this.total);
    var stars = (ratio >= 0.85 && this.hearts >= 2) ? 3 : (ratio >= 0.6 ? 2 : 1);
    var cont = [];
    var add = function (o) { cont.push(o); return o; };
    var D = 1500;
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.68).setDepth(D).setInteractive());
    add(roundRect(this, W / 2 - 380, 50, 760, 620, 40, DARKG, 0.97, GOLD, 5).setDepth(D + 1));
    add(txt(this, W / 2, 118, 'Level ' + n + ' clear!', 58, CREAM, { stroke: '#2a1808', strokeThickness: 6 }).setDepth(D + 2));
    for (var i = 0; i < 3; i++) {
      var on = i < stars;
      var st = add(starShape(this, W / 2 + (i - 1) * 120, 225, on, 52).setScale(0).setDepth(D + 2));
      (function (st, i, on) {
        self.time.delayedCall(500 + i * 380, function () {
          if (!st.scene) return;
          self.tweens.add({ targets: st, scale: on ? 1 : 0.8, angle: on ? 360 : 0, duration: 420, ease: 'Back.easeOut' });
          if (on) { Sfx.tone(660 + i * 220, 0.3, 'triangle', 0.08); self.burst(st.x, st.y, [0xffd36f, 0xfff2b8], 12); }
        });
      })(st, i, on);
    }
    add(txt(this, W / 2, 322, 'Crystals  ' + this.crystals + ' / ' + Math.max(this.total, this.crystals), 36, '#ffffff').setDepth(D + 2));
    add(txt(this, W / 2, 366, 'Hearts left  ' + this.hearts + ' / 3', 28, '#bfe6cf').setDepth(D + 2));
    var chest = add(this.add.image(W / 2 - 200, 480, 'chest').setScale(0.5).setDepth(D + 2));
    var bank = add(txt(this, W / 2 + 90, 440, 'Claim your crystals', 26, '#ffffff', { wordWrap: { width: 320 } }).setDepth(D + 2));
    var claim = add(button(this, W / 2 + 90, 510, 230, 66, 'Claim', function () {
      Sfx.init(); Sfx.win();
      var d = store.d;
      d.bank += self.crystals;
      d.stars[n] = Math.max(d.stars[n] || 0, stars);
      store.save();
      claim.destroy();
      bank.setText('Crystal bank: ' + d.bank + '\n+' + self.crystals + ' added');
      self.tweens.add({ targets: chest, scale: 0.6, duration: 200, yoyo: true });
      self.burst(chest.x, chest.y, [0xffd36f, 0x6fd6ff, 0xc59bff], 30);
      var by = 600, xs = n < LEVELS.length ? [W / 2 - 215, W / 2, W / 2 + 215] : [W / 2 - 110, W / 2 + 110];
      if (n < LEVELS.length) add(button(self, xs[0], by, 190, 62, 'Next level', function () { self.leave2('Level', { n: n + 1 }); }, { depth: D + 5, size: 25 }));
      add(button(self, n < LEVELS.length ? xs[1] : xs[0], by, 190, 62, 'Replay', function () { self.leave2('Level', { n: n }); }, { depth: D + 5, fill: 0x244a35, size: 25 }));
      add(button(self, n < LEVELS.length ? xs[2] : xs[1], by, 190, 62, 'Levels', function () { self.leave2('Levels'); }, { depth: D + 5, fill: 0x244a35, size: 25 }));
      if (n >= LEVELS.length) add(txt(self, W / 2, 565, 'You finished the Garden Realm!', 24, '#ffd36f').setDepth(D + 2));
    }, { depth: D + 5, size: 30 }));
  },

  leave2: function (key, data) {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start(key, data); });
  },

  gameOver: function () {
    if (this.over) return;
    this.over = true; this.busy = true;
    var self = this, D = 1500;
    this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setDepth(D).setInteractive();
    roundRect(this, W / 2 - 330, 170, 660, 380, 36, DARKG, 0.97, EDGE, 4).setDepth(D + 1);
    txt(this, W / 2, 245, 'Out of hearts', 54, CREAM).setDepth(D + 2);
    txt(this, W / 2, 325, 'Take a breath. The runes will wait for you.', 28, '#ffffff', { wordWrap: { width: 560 } }).setDepth(D + 2);
    button(this, W / 2 - 130, 445, 230, 66, 'Try again', function () { self.leave2('Level', { n: self.n }); }, { depth: D + 5, size: 28 });
    button(this, W / 2 + 130, 445, 230, 66, 'Levels', function () { self.leave2('Levels'); }, { depth: D + 5, fill: 0x244a35, size: 28 });
  },

  /* ----- frame ----- */
  update: function (time, delta) {
    if (!this.alive) return;
    var s = Math.min(delta, 50) / 1000, self = this;
    ORDER.forEach(function (id) { self.stepChar(id, s, time); });

    var a = this.ch[this.active];
    this.marker.setPosition(a.x, a.sprite.y - a.sprite.displayHeight - 22);
    this.marker.setVisible(!this.over);

    if (this.aura) { this.aura.setPosition(a.x, GY - a.sprite.displayHeight * 0.45); this.aura.setAlpha(0.5 + 0.12 * Math.sin(time / 300)); }
    if (this.pet) {
      var tx = a.x - a.dir * 95, ty = this.petFlat ? GY : GY - 175 + Math.sin(time / 280) * 12;
      var k = Math.min(1, s * 3.2);
      this.pet.x += (tx - this.pet.x) * k; this.pet.y += (ty - this.pet.y) * k;
      this.pet.setFlipX(a.dir < 0);
      this.pet.setDepth(GY - 2);
    }
    if (this.trailItem && a.moving) {
      this.trailT += delta;
      if (this.trailT > 85) {
        this.trailT = 0;
        var cols = this.trailItem.colors, col = cols[Math.floor(Math.random() * cols.length)];
        var sp = this.add.image(a.x - a.dir * 22 + (Math.random() - 0.5) * 18, GY - 6 - Math.random() * 14, 'spark').setTint(col).setDepth(GY - 1).setScale(0.9);
        this.tweens.add({ targets: sp, y: sp.y - 26, alpha: 0, scale: 0.1, duration: 600, onComplete: function () { sp.destroy(); } });
      }
    }

    var tnow = this.time.now;
    if (this.chain > 0) {
      var left = COMBO_MS - (tnow - this.chainAt);
      if (left <= 0) { this.chain = 0; this.comboTxt.setVisible(false); this.comboBar.clear(); }
      else if (this.chain >= 2) {
        this.comboTxt.setVisible(true).setText('Combo x' + this.chain);
        var g = this.comboBar; g.clear();
        g.fillStyle(0x10281c, 0.8); g.fillRoundedRect(560, 134, 160, 10, 5);
        g.fillStyle(GOLD, 1); g.fillRoundedRect(562, 136, 156 * (left / COMBO_MS), 6, 3);
      } else { this.comboTxt.setVisible(false); this.comboBar.clear(); }
    }

    if (!this.busy && !this.over) {
      for (var i = 0; i < this.gems.length; i++) {
        var g2 = this.gems[i];
        if (!g2.got && Math.abs(a.x - g2.x) < this.reach) {
          g2.got = true; g2.glow.destroy();
          this.crystals += 1; this.updateCounter(); Sfx.collect();
          this.burst(g2.sprite.x, g2.sprite.y, [0x6fd6ff, 0xc59bff, 0xffd36f], 12);
          this.tweens.add({ targets: g2.sprite, y: g2.sprite.y - 60, alpha: 0, scale: 0.9, duration: 350, onComplete: (function (sp) { return function () { sp.destroy(); }; })(g2.sprite) });
          this.progress();
        }
      }
      if (!this.hinted && tnow - this.lastProgress > this.hintMs) {
        var nx = this.nextNeeded();
        if (nx) { this.hinted = true; this.toast('Hint: ' + CH[nx.who].name + ' can ' + HINTS[nx.type] + '.', 3600); this.pulsePortrait(nx.who); }
      }
    }

    if (this.pushing && this.pushBase) {
      var pb = this.pushBase;
      this.power = Math.max(0, this.power - 0.2 * s);
      pb.bo.x = pb.baseX + this.power * 26;
      pb.c.x = pb.standX + this.power * 22;
      var bx = pb.c.x, by = GY - pb.c.sprite.displayHeight - 46;
      var gr = this.pushBar; gr.clear();
      gr.fillStyle(0x10281c, 0.85); gr.fillRoundedRect(bx - 90, by - 12, 180, 24, 12);
      gr.fillStyle(this.power > 0.7 ? 0xffd36f : 0x6fe3ff, 1);
      if (this.power > 0.02) gr.fillRoundedRect(bx - 86, by - 8, 172 * this.power, 16, 8);
      this.pushTxt.setPosition(bx, by - 34).setScale(1 + 0.06 * Math.sin(time / 90));
    }
  }
});

/* ================= start ================= */
function start() {
  window.__cfq = new Phaser.Game({
    type: Phaser.AUTO, width: W, height: H, parent: 'game', backgroundColor: '#10241a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 3 }, render: { antialias: true },
    scene: [Boot, Title, Hub, Levels, Shop, Upgrades, Level]
  });
}
var started = false;
function go() { if (started) return; started = true; start(); }
try {
  if (document.fonts && document.fonts.load) {
    Promise.all([document.fonts.load('600 30px Fredoka'), document.fonts.load('600 30px "Trebuchet MS"')]).then(go, go);
    setTimeout(go, 1800);
  } else go();
} catch (e) { go(); }
})();
