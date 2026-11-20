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
    return { bank: 0, stars: {}, upg: { dad: 0, mom: 0, son: 0, dau: 0 }, owned: [], equip: { pet: '', aura: '', trail: '' }, daily: { last: '', streak: 0 }, sound: true,
      voice: true, pvi: 0, acct: { email: '' }, village: { b: {}, last: 0, stash: 0 }, top: 0, quests: { day: '', items: [] }, ach: {}, stats: { levels: 0, combos: 0, unity: 0, crystals: 0, speedy: 0, spins: 0, perfect: 0 }, codex: [], spin: '' };
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
    if (raw.voice === false) d.voice = false;
    if (typeof raw.pvi === 'number') d.pvi = raw.pvi;
    if (raw.acct && typeof raw.acct.email === 'string') d.acct.email = raw.acct.email;
    if (raw.village && raw.village.b) d.village = { b: raw.village.b, last: raw.village.last || 0, stash: raw.village.stash || 0 };
    if (typeof raw.top === 'number') d.top = raw.top;
    if (raw.quests && Array.isArray(raw.quests.items)) d.quests = raw.quests;
    if (raw.ach && typeof raw.ach === 'object') d.ach = raw.ach;
    if (raw.stats) Object.keys(d.stats).forEach(function (k) { if (typeof raw.stats[k] === 'number') d.stats[k] = raw.stats[k]; });
    if (Array.isArray(raw.codex)) d.codex = raw.codex;
    if (typeof raw.spin === 'string') d.spin = raw.spin;
    this.d = d;
    return d;
  },
  save: function () { try { localStorage.setItem('cfq-save', JSON.stringify(this.d)); } catch (e) {} if (window.__cfqCloudSoon) window.__cfqCloudSoon(); },
  apply: function (obj) { try { localStorage.setItem('cfq-save', JSON.stringify(obj)); } catch (e) {} this.load(); }
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
var BASE = [
  { name: 'Garden Gate', rune: 3, gain: 0.17, sc: 1, hint: 22000, tint: null,
    objs: [['tablet', 440], ['bridge', 690], ['bush', 895], ['boulder', 1060]] },
  { name: 'Crystal Cave', rune: 4, gain: 0.15, sc: 0.95, hint: 20000, tint: { c: 0xffa84a, a: 0.18 },
    objs: [['bridge', 380], ['boulder', 620], ['tablet', 820], ['bush', 990]] },
  { name: 'Cloud Hop', rune: 4, gain: 0.14, sc: 0.85, hint: 20000, tint: { c: 0xff8a5c, a: 0.12 },
    objs: [['bush', 300], ['boulder', 480], ['tablet', 660], ['bridge', 840], ['boulder', 1020]] },
  { name: 'Whisper Woods', rune: 5, gain: 0.13, sc: 0.85, hint: 18000, tint: { c: 0x1a2a6a, a: 0.42 }, fireflies: true,
    objs: [['tablet', 300], ['boulder', 470], ['bush', 650], ['bridge', 830], ['tablet', 1010]] },
  { name: 'Festival Night', rune: 5, gain: 0.12, sc: 0.78, hint: 18000, tint: { c: 0xff5fa8, a: 0.1 }, fireflies: true,
    objs: [['tablet', 240], ['bridge', 390], ['boulder', 560], ['bush', 720], ['tablet', 870], ['boulder', 1020]] }
];

/* ---- worlds (each level gets its own place) ---- */
var THEMES = [
  { key: 'garden', bg: 'bg', realm: 'Garden Realm', tint: null, fx: 'petals', door: 0xfff0b0 },
  { key: 'caves', bg: 'env_caves', realm: 'Crystal Caves', tint: null, fx: 'sparks', door: 0xc59bff },
  { key: 'sky', bg: 'env_sky', realm: 'Cloud Kingdom', tint: null, fx: 'clouds', door: 0xffffff },
  { key: 'forest', bg: 'env_forest', realm: 'Whisper Forest', tint: null, fx: 'fireflies', door: 0xfff2a8 },
  { key: 'festival', bg: 'env_festival', realm: 'Festival Night', tint: null, fx: 'confetti', door: 0xff8fc0 },
  { key: 'savanna', bg: 'env_savanna', realm: 'Golden Savanna', tint: null, fx: 'dust', door: 0xffd36f },
  { key: 'beach', bg: 'env_beach', realm: 'Sunny Shore', tint: null, fx: 'bubbles', door: 0x9fe8ff },
  { key: 'snow', bg: 'env_snow', realm: 'Frost Peaks', tint: null, fx: 'snow', door: 0xd8f0ff },
  { key: 'ember', bg: 'env_ember', realm: 'Ember Mountain', tint: null, fx: 'embers', door: 0xffa040 },
  { key: 'sweet', bg: 'env_sweet', realm: 'Candy Land', tint: null, fx: 'confetti', door: 0xff9ad0 }
];
var ADJ = ['Sparkly', 'Giggling', 'Secret', 'Bouncy', 'Golden', 'Sleepy', 'Brave', 'Happy', 'Mighty', 'Dreamy', 'Cheeky', 'Shiny'];
var NOUN = ['Trail', 'Crossing', 'Meadow', 'Bend', 'Hideout', 'Gateway', 'Hollow', 'Lookout', 'Path', 'Passage', 'Clearing', 'Valley'];
var THEME_OF_BASE = [0, 1, 2, 3, 4];
function themeOf(n) { return THEMES[(n - 1) % THEMES.length]; }
function rng(seed) { var t = seed * 2654435761 % 4294967296; return function () { t = (t + 0x6D2B79F5) | 0; var r = Math.imul(t ^ (t >>> 15), 1 | t); r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r; return ((r ^ (r >>> 14)) >>> 0) / 4294967296; }; }
var _lvCache = {};
function getLevel(n) {
  if (_lvCache[n]) return _lvCache[n];
  var th = themeOf(n), lv;
  if (n <= BASE.length) {
    lv = Object.assign({}, BASE[n - 1]); lv.tint = null; lv.fireflies = false;
    lv.name = th.realm.split(' ')[0] + ' ' + BASE[n - 1].name; lv.name = BASE[n - 1].name;
  } else {
    var r = rng(n * 97 + 13), boss = n % 10 === 0;
    var cnt = Math.min(7, 4 + Math.floor((n - 6) / 8) + (boss ? 1 : 0));
    var sc = { 4: 1, 5: 0.88, 6: 0.8, 7: 0.74 }[cnt];
    var types = ['tablet', 'bridge', 'bush', 'boulder'], objs = [], x0 = 230, x1 = 1040, step = (x1 - x0) / (cnt - 1);
    var bag = [];
    for (var i = 0; i < cnt; i++) {
      if (!bag.length) { bag = types.slice(); for (var k = bag.length - 1; k > 0; k--) { var j = Math.floor(r() * (k + 1)); var tmp = bag[k]; bag[k] = bag[j]; bag[j] = tmp; } }
      objs.push([bag.pop(), Math.round(x0 + i * step + (r() - 0.5) * Math.min(24, step * 0.18))]);
    }
    lv = {
      name: (boss ? 'Guardian ' : ADJ[Math.floor(r() * ADJ.length)] + ' ') + NOUN[Math.floor(r() * NOUN.length)],
      rune: Math.min(7, 3 + Math.floor(n / 5)), gain: Math.max(0.085, 0.16 - n * 0.002), sc: sc,
      hint: Math.max(14000, 20000 - n * 100), objs: objs, boss: boss
    };
  }
  lv.n = n; lv.theme = th; lv.par = Math.round(lv.objs.length * 15 + 12);
  _lvCache[n] = lv;
  return lv;
}
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
function totalStars() { var t = 0, k; for (k in store.d.stars) t += store.d.stars[k] || 0; return t; }
function nextLevel() { var n = 1; while ((store.d.stars[n] || 0) >= 1) n++; return n; }

/* ---- voices and lines ---- */
var VOICE = { dad: { pitch: 0.55, rate: 0.92 }, mom: { pitch: 1.15, rate: 1.0 }, son: { pitch: 1.75, rate: 1.18 }, dau: { pitch: 1.5, rate: 1.08 } };
var LINES = {
  dad: {
    start: ['Nna ya! Let us go, family!', 'Dad is on the job!', 'Stand back, I am about to be impressive.', 'These shoulders have a purpose.'],
    push: ['Hnnnng! This rock owes me money!', 'I did not skip leg day for nothing!', 'Move, little rock. Move!'],
    win: ['Ha ha! Too easy! Do not tell my back.', 'Another rock, another legend.', 'Did you see that? Please say you saw that.'],
    wrong: ['Ah ah! That is not my kind of job.', 'I push things. Ask Mom about runes.'],
    hurt: ['Ouch! My dignity!', 'Who put that there?'],
    gem: ['Shiny! Dad likes shiny.', 'Ka m jide ya!'],
    combo: ['Family power! Ndi be anyi!', 'Teamwork makes the dream work!'],
    idle: ['Is anybody else hungry? Jollof, maybe?', 'I could carry this whole level. Just saying.']
  },
  mom: {
    start: ['Let Mom read the runes.', 'Ndewo! Quiet please, I am thinking.', 'Wisdom loading... please wait.'],
    push: ['Shapes, shapes, show yourselves.', 'I see it! The pattern is calling.'],
    win: ['Mother knows best. Always.', 'Easy. Next puzzle, please!', 'Did anyone doubt me? Nobody? Good.'],
    wrong: ['Oh no, wrong sign. Let us try again.', 'Hmm. Even I blink sometimes.'],
    hurt: ['Eh! That hurt.', 'My head wrap is crooked now!'],
    gem: ['Lovely little crystal!', 'Daalu, crystal.'],
    combo: ['Beautiful teamwork, my dears!', 'This family is on fire!'],
    idle: ['Who has been leaving crystals everywhere?', 'Nobody leaves my family behind.']
  },
  son: {
    start: ['Zoom zoom! Son is ready!', 'I can fit anywhere. Anywhere!', 'Race you to the gate!'],
    push: ['Squeeeeeze!', 'Tiny hero coming through!'],
    win: ['I am the best squeezer ever!', 'Nobody saw me, I am a ninja!', 'Yay! Can I have a snack now?'],
    wrong: ['That is too big for me!', 'I am small, not magic!'],
    hurt: ['Owwww!', 'That was not funny!'],
    gem: ['Mine! Mine! Mine!', 'Crystal get! Ha ha!'],
    combo: ['Family combo! Woo hoo!', 'High five, everybody!'],
    idle: ['Are we there yet? Are we there yet?', 'I can hear my tummy talking.']
  },
  dau: {
    start: ['Hello, spirits! It is me!', 'Daughter to the rescue!', 'Birdie, we need your help!'],
    push: ['Tweet tweet, tell me everything!', 'The little bird has a secret.'],
    win: ['The spirits love me!', 'Igwe bu ike! Unity is strength!', 'Birdie says thank you!'],
    wrong: ['The spirit is shy about that one.', 'That is not my job, silly.'],
    hurt: ['Oh no, oh no!', 'Ouchie!'],
    gem: ['Sparkly! Pretty!', 'I found one! I found one!'],
    combo: ['We did it together!', 'Best family in the whole world!'],
    idle: ['I can hear the wind giggling.', 'Everybody smile! Click!']
  }
};
var VOICE_EXTRA = { bird: { pitch: 1.9, rate: 1.05 } };
var Voice = {
  pick: null, warmed: false, tts: null, failed: 0,
  native: function () {
    try {
      var C = window.Capacitor;
      if (C && C.isNativePlatform && C.isNativePlatform() && C.registerPlugin) { if (!this.tts) this.tts = C.registerPlugin('TextToSpeech'); return this.tts; }
    } catch (e) {}
    return null;
  },
  web: function () { return typeof speechSynthesis !== 'undefined' && typeof SpeechSynthesisUtterance !== 'undefined'; },
  available: function () { return !!(this.native() || this.web()); },
  on: function () { return store.d.voice; },
  unlock: function () {
    if (this.warmed || !this.web()) return; this.warmed = true;
    try {
      var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u);
      if (speechSynthesis.addEventListener) speechSynthesis.addEventListener('voiceschanged', function () { Voice.pick = null; });
    } catch (e) {}
  },
  find: function () {
    if (this.pick !== null) return this.pick;
    var list = []; try { list = speechSynthesis.getVoices() || []; } catch (e) {}
    if (!list.length) return null;
    var pick = null, i;
    for (i = 0; i < list.length && !pick; i++) if (/^en[-_](NG|ZA|GB)/i.test(list[i].lang)) pick = list[i];
    for (i = 0; i < list.length && !pick; i++) if (/^en/i.test(list[i].lang)) pick = list[i];
    this.pick = pick || false; return this.pick;
  },
  speak: function (who, text) {
    if (!store.d.voice) return;
    var v = VOICE[who] || VOICE_EXTRA[who] || VOICE.dad, self = this, clean = text.replace(/[~]/g, '');
    var nat = this.native();
    if (nat) {
      try {
        var pr = nat.speak({ text: clean, lang: 'en-US', rate: v.rate, pitch: v.pitch, volume: 1.0, category: 'ambient', queueStrategy: 0 });
        if (pr && pr.catch) pr.catch(function () { Sfx.babble(who, clean); });
      } catch (e) { Sfx.babble(who, clean); }
      return;
    }
    if (this.web()) {
      try {
        var u = new SpeechSynthesisUtterance(clean), f = this.find();
        if (f) { u.voice = f; u.lang = f.lang; } else u.lang = 'en-US';
        u.pitch = v.pitch; u.rate = v.rate; u.volume = 1;
        u.onerror = function () { self.failed++; };
        if (speechSynthesis.speaking || speechSynthesis.pending) speechSynthesis.cancel();
        speechSynthesis.speak(u);
        if (speechSynthesis.resume) speechSynthesis.resume();
        return;
      } catch (e) {}
    }
    Sfx.babble(who, clean);
  },
  stop: function () { try { var n = this.native(); if (n && n.stop) n.stop(); else if (this.web()) speechSynthesis.cancel(); } catch (e) {} }
};
function pickLine(who, ev) {
  var a = (LINES[who] || {})[ev]; if (!a || !a.length) return '';
  var key = who + ev, i = (pickLine.last[key] = ((pickLine.last[key] || 0) + 1 + Math.floor(Math.random() * (a.length - 1 || 1))) % a.length);
  return a[i];
}
pickLine.last = {};

/* ---- proverbs the spirit bird tells (a different one each time) ---- */
var PROVERBS = [
  { ig: 'Igwe bụ ike.', en: 'There is strength in unity. Bring the whole family together.' },
  { ig: 'Egbe bere, ugo bere.', en: 'Let the kite perch and let the eagle perch. There is room for everyone, so share kindly.' },
  { ig: 'Onye aghala nwanne ya.', en: 'Let no one leave their sibling behind. We finish this together.' },
  { ig: 'Otu osisi anaghị abụ ọhịa.', en: 'One tree does not make a forest. We need each other.' },
  { ig: 'Nwata kwọọ aka, ya na ndị okenye rie nri.', en: 'A child who washes his hands can eat with the elders. Good habits open big doors.' },
  { ig: 'Onye kwe, chi ya ekwe.', en: 'When a person says yes with all their heart, their chi says yes too. Believe, and try!' },
  { ig: 'Aka nri kwọọ aka ekpe, aka ekpe akwọọ aka nri.', en: 'The right hand washes the left, and the left washes the right. Help each other and both stay clean.' },
  { ig: 'Onye ji onye n\'ala ji onwe ya n\'ala.', en: 'He who holds another down on the ground holds himself down too. Lift each other up.' },
  { ig: 'Ebe onye dara ka chi ya kwaturu ya.', en: 'Where a person falls is where his chi laid him down. So get up and try again!' },
  { ig: 'Aka ajaaja na-ebute onu mmanu mmanu.', en: 'Busy hands bring food to the mouth. Hard work brings sweet rewards.' }
];
function nextProverb() {
  var order = [], i, r = rng(11);
  for (i = 0; i < PROVERBS.length; i++) order.push(i);
  for (i = order.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)), t = order[i]; order[i] = order[j]; order[j] = t; }
  var idx = order[store.d.pvi % order.length]; store.d.pvi++; store.save();
  return PROVERBS[idx];
}

/* ---- codex: Igbo words, proverbs, culture and nature ---- */
var CODEX = [
  { t: 'Word', h: 'Nnọọ', b: 'Welcome. Said when guests arrive.' },
  { t: 'Word', h: 'Ndewo', b: 'A polite hello, and a way to say hope you are well.' },
  { t: 'Word', h: 'Daalụ', b: 'Thank you. Daalụ nke ukwuu means thank you very much.' },
  { t: 'Word', h: 'Biko', b: 'Please. A little word that opens many doors.' },
  { t: 'Family', h: 'Nna and Nne', b: 'Nna means father and nne means mother.' },
  { t: 'Family', h: 'Nwa and Ụmụ', b: 'Nwa is a child. Ụmụ means children.' },
  { t: 'Family', h: 'Nwanne', b: 'Sibling, or sometimes a dear relative or friend. It literally means mother\'s child.' },
  { t: 'Numbers', h: 'Otu, abụọ, atọ', b: 'One, two, three. Then anọ is four and ise is five.' },
  { t: 'Numbers', h: 'Isii to iri', b: 'Isii is six, asaa is seven, asatọ is eight, itoolu is nine and iri is ten.' },
  { t: 'Proverb', h: 'Igwe bụ ike', b: 'There is strength in unity. A family that works together can move big rocks.' },
  { t: 'Proverb', h: 'Egbe bere, ugo bere', b: 'Let the kite perch and let the eagle perch. Live and let live; there is room for everyone.' },
  { t: 'Proverb', h: 'Onye aghala nwanne ya', b: 'Let no one leave their sibling behind.' },
  { t: 'Culture', h: 'Kola nut (oji)', b: 'Sharing a kola nut is a traditional sign of welcome and respect for guests.' },
  { t: 'Culture', h: 'New Yam Festival', b: 'Iri ji celebrates the harvest of the first yams, with food, music and dance.' },
  { t: 'Culture', h: 'Uli art', b: 'Uli is a traditional Igbo art of flowing line patterns, painted on walls and on skin.' },
  { t: 'Culture', h: 'Nsibidi', b: 'Nsibidi is an old system of symbols from southeastern Nigeria, used long before many people wrote letters.' },
  { t: 'Culture', h: 'Igbo-Ukwu bronzes', b: 'Skilled artists in Igbo-Ukwu cast fine bronze works more than a thousand years ago.' },
  { t: 'Culture', h: 'Masquerades (mmanwu)', b: 'Colourful masquerades appear at festivals and represent spirits and ancestors.' },
  { t: 'Culture', h: 'Ikenga', b: 'Ikenga is a carved figure linked with strength, effort and achievement.' },
  { t: 'Culture', h: 'Beads and red caps', b: 'Coral beads and the red cap are proud parts of traditional dress.' },
  { t: 'Nature', h: 'Crystals', b: 'Real crystals grow slowly as minerals settle into neat repeating shapes.' },
  { t: 'Nature', h: 'African grey parrots', b: 'These clever birds can learn to copy many human words.' },
  { t: 'Nature', h: 'Fireflies', b: 'Fireflies make light inside their bodies with almost no heat.' },
  { t: 'Nature', h: 'Baobab trees', b: 'A baobab can store thousands of litres of water in its thick trunk.' },
  { t: 'Nature', h: 'Elephants', b: 'Elephants live in family herds led by an older mother, much like a close family.' },
  { t: 'Nature', h: 'Butterflies', b: 'Butterflies taste with their feet.' },
  { t: 'Nature', h: 'Tortoises', b: 'Tortoises can live for well over fifty years, and some far longer.' },
  { t: 'Nature', h: 'Harmattan', b: 'Harmattan is the dry, dusty wind that blows over West Africa in the cool season.' },
  { t: 'Word', h: 'Ka chi fo', b: 'Good night. It means may the day break, or until the morning.' },
  { t: 'Word', h: 'Ọ dị mma', b: 'It is good. A cheerful way to say all is well.' }
];

/* ---- daily quests and achievements ---- */
var QUEST_POOL = [
  { id: 'lv', text: 'Clear 2 levels', n: 2, g: 25, stat: 'levels' },
  { id: 'cr', text: 'Collect 30 crystals', n: 30, g: 20, stat: 'crystals' },
  { id: 'cb', text: 'Make 3 family combos', n: 3, g: 25, stat: 'combos' },
  { id: 'un', text: 'Do a Unity Move', n: 1, g: 30, stat: 'unity' },
  { id: 'sp', text: 'Beat the par time once', n: 1, g: 25, stat: 'speedy' },
  { id: 'pf', text: 'Finish a level with 3 hearts', n: 1, g: 30, stat: 'perfect' },
  { id: 'lv3', text: 'Clear 3 levels', n: 3, g: 40, stat: 'levels' }
];
var ACHS = [
  { id: 'a1', text: 'First steps: clear level 1', g: 20, ok: function () { return (store.d.stars[1] || 0) >= 1; } },
  { id: 'a2', text: 'Clear 10 levels', g: 60, ok: function () { return store.d.stats.levels >= 10; } },
  { id: 'a3', text: 'Clear 50 levels', g: 250, ok: function () { return store.d.stats.levels >= 50; } },
  { id: 'a4', text: 'Reach level 25', g: 120, ok: function () { return store.d.top >= 25; } },
  { id: 'a5', text: 'Collect 500 crystals', g: 80, ok: function () { return store.d.stats.crystals >= 500; } },
  { id: 'a6', text: 'Collect 3000 crystals', g: 300, ok: function () { return store.d.stats.crystals >= 3000; } },
  { id: 'a7', text: 'Make 20 combos', g: 60, ok: function () { return store.d.stats.combos >= 20; } },
  { id: 'a8', text: 'Do 5 Unity Moves', g: 80, ok: function () { return store.d.stats.unity >= 5; } },
  { id: 'a9', text: 'Earn 30 stars', g: 100, ok: function () { return totalStars() >= 30; } },
  { id: 'a10', text: 'Find 15 Codex entries', g: 100, ok: function () { return store.d.codex.length >= 15; } },
  { id: 'a11', text: 'Beat the par time 10 times', g: 90, ok: function () { return store.d.stats.speedy >= 10; } },
  { id: 'a12', text: 'Win 10 perfect levels', g: 150, ok: function () { return store.d.stats.perfect >= 10; } }
];
function ensureQuests() {
  var d = store.d, today = dayKey();
  if (d.quests.day === today && d.quests.items.length) return;
  var r = rng(dayNum(today) + 7), pool = QUEST_POOL.slice(), items = [];
  while (items.length < 3) { var i = Math.floor(r() * pool.length), q = pool.splice(i, 1)[0]; items.push({ id: q.id, base: d.stats[q.stat], done: false, claimed: false }); }
  d.quests = { day: today, items: items }; store.save();
}
function questDef(id) { return QUEST_POOL.filter(function (q) { return q.id === id; })[0]; }
function questProg(it) { var q = questDef(it.id); return Math.min(q.n, store.d.stats[q.stat] - it.base); }
function claimable() {
  ensureQuests(); var c = 0;
  store.d.quests.items.forEach(function (it) { if (!it.claimed && questProg(it) >= questDef(it.id).n) c++; });
  ACHS.forEach(function (a) { if (!store.d.ach[a.id] && a.ok()) c++; });
  return c;
}
function bump(stat, n) { store.d.stats[stat] = (store.d.stats[stat] || 0) + (n || 1); }

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
    Voice.unlock();
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
  rune: function (i) { this.tone([392, 440, 523, 659][i], 0.32, 'sine', 0.09); },
  babble: function (who, text) {
    if (!this.ctx || !store.d.voice) return;
    var base = { dad: 110, mom: 240, son: 420, dau: 340, bird: 700 }[who] || 200, n = Math.min(26, Math.max(6, Math.round(text.length / 2.2))), i;
    for (i = 0; i < n; i++) this.tone(base * (1 + 0.35 * Math.sin(i * 1.7) + (i % 3) * 0.12), 0.07, 'triangle', 0.045, 0, i * 0.085);
  }
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
    var self = this, go = false, i;
    var bgi = this.add.image(W / 2, H / 2, 'title').setDisplaySize(W, H).setDepth(0);
    bgi.setScale(bgi.scaleX * 1.12, bgi.scaleY * 1.12);
    this.tweens.add({ targets: bgi, scaleX: bgi.scaleX / 1.12, scaleY: bgi.scaleY / 1.12, duration: 5200, ease: 'Cubic.easeOut' });
    // golden light sweep across the name, repeating
    var sweep = this.add.rectangle(-300, 190, 130, 420, 0xfff2b8, 0.0).setRotation(0.35).setBlendMode(Phaser.BlendModes.ADD).setDepth(5);
    var runSweep = function () {
      if (!sweep.scene) return;
      sweep.x = 180; sweep.setAlpha(0);
      self.tweens.add({ targets: sweep, x: 1100, alpha: 0.38, duration: 900, ease: 'Sine.easeInOut', yoyo: false,
        onComplete: function () { self.tweens.add({ targets: sweep, alpha: 0, duration: 250 }); } });
      self.time.delayedCall(4200, runSweep);
    };
    this.time.delayedCall(1700, runSweep);
    // glow behind the title that breathes
    var halo = this.add.image(W / 2, 175, 'glow').setScale(6.5, 2.4).setTint(0xffd36f).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(3);
    this.tweens.add({ targets: halo, alpha: 0.4, duration: 1500, delay: 600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    // twinkling stars around the title
    for (i = 0; i < 26; i++) {
      var st = this.add.image(Phaser.Math.Between(180, 1100), Phaser.Math.Between(60, 300), 'spark').setTint(i % 3 ? 0xfff2b8 : 0xbfefff).setScale(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
      this.tweens.add({ targets: st, scale: 0.7 + (i % 4) * 0.25, alpha: 0.2, duration: 700 + (i % 5) * 220, delay: i * 140, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    }
    // crystals drifting up from below
    for (i = 0; i < 12; i++) {
      var gm = this.add.image(Phaser.Math.Between(40, 1240), 760 + i * 30, ['gem_blue', 'gem_purple', 'gem_pink', 'gem_gold'][i % 4]).setScale(0.22 + (i % 3) * 0.07).setAlpha(0.8).setDepth(4);
      this.tweens.add({ targets: gm, y: -80, angle: 25, duration: 9000 + i * 700, delay: i * 500, repeat: -1 });
    }
    // pulsing ring on the start button
    var ring = this.add.ellipse(654, 652, 330, 74).setStrokeStyle(4, 0xffe9a0, 0.9).setDepth(6);
    this.tweens.add({ targets: ring, scaleX: 1.12, scaleY: 1.3, alpha: 0, duration: 1100, repeat: -1 });
    // opening burst on the title
    this.time.delayedCall(500, function () { burst(self, W / 2, 170, [0xffe9a0, 0xffffff, 0x9fe8ff, 0xc59bff], 36); Sfx.tone(784, 0.2, 'triangle', 0.05); });
    // credit line at the very bottom
    var cj = txt(this, W / 2, 704, 'A GAME BY CJ\'S FAMILY', 17, '#ffe9a0', { stroke: '#2a1808', strokeThickness: 4, fontStyle: '700' }).setDepth(8).setAlpha(0);
    cj.setLetterSpacing && cj.setLetterSpacing(4);
    this.tweens.add({ targets: cj, alpha: 1, duration: 900, delay: 1200 });
    var start = function () {
      if (go) return; go = true;
      Sfx.init(); Sfx.key(); autoFull();
      Voice.speak('dad', 'Welcome, family! Let us go on an adventure!');
      self.cameras.main.fadeOut(350, 0, 0, 0);
      self.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
    };
    this.input.on('pointerdown', start);
    this.input.keyboard.on('keydown', start);
    this.cameras.main.fadeIn(900);
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
    ensureQuests();
    var logo = this.add.image(W / 2, 128, 'logo').setScale(0.52);
    this.tweens.add({ targets: logo, scale: 0.545, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    var nl = nextLevel();
    txt(this, W / 2, 262, 'Stars ' + totalStars() + '     Best level ' + Math.max(1, store.d.top) + '     Codex ' + store.d.codex.length + '/' + CODEX.length, 22, '#bfe6cf');

    var fam = [['dad', 110], ['mom', 215], ['son', 1075], ['dau', 1180]];
    fam.forEach(function (f, i) {
      var d = CH[f[0]], th = self.textures.get(d.idle).getSourceImage().height;
      var s = self.add.image(f[1], 710, d.idle).setOrigin(0.5, 1).setScale(d.h / th);
      self.tweens.add({ targets: s, y: 706, duration: 900 + i * 120, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
    });

    button(this, W / 2, 330, 420, 92, 'Play  Level ' + nl, function () { self.go('Level', { n: nl }); }, { size: 40 });
    var dot = function (x, y, on) {
      var c = self.add.circle(x, y, 11, 0xe24b4a).setStrokeStyle(3, 0xffffff).setDepth(60);
      self.tweens.add({ targets: c, scale: 1.3, duration: 500, yoyo: true, repeat: -1 });
      c.setVisible(!!on); return c;
    };
    var row = function (arr, y) {
      arr.forEach(function (it, i) {
        var x = W / 2 + (i - (arr.length - 1) / 2) * 215;
        button(self, x, y, 195, 62, it[0], it[1], { fill: 0x244a35, size: it[2] || 24 });
        if (it[3] !== undefined) { var c = dot(x + 90, y - 26, it[3]); if (it[4]) it[4](c); }
      });
    };
    var cl = claimable(), canSpin = store.d.spin !== dayKey(), vp = villagePending();
    row([['Levels', function () { self.go('Levels'); }], ['Village', function () { self.go('Village'); }, 24, vp >= 10], ['Shop', function () { self.go('Shop'); }], ['Upgrades', function () { self.go('Upgrades'); }]], 412);
    row([['Daily gift', function () { self.openDaily(); }, 24, dailyStatus().can, function (c) { self.dot = c; }], ['Quests', function () { self.go('Quests'); }, 24, cl > 0], ['Awards', function () { self.go('Quests', { tab: 'ach' }); }], ['Lucky spin', function () { self.go('Spin'); }, 23, canSpin]], 486);
    row([['Codex', function () { self.go('Codex'); }], ['Save progress', function () { self.go('Account'); }, 21], ['Credits', function () { self.go('About', { tab: 'credits' }); }], ['How to play', function () { self.go('About', { tab: 'how' }); }, 22]], 560);
    if (!this.dot) this.dot = dot(0, 0, false);
    var tg = function (x, label, cb) {
      var b = button(self, x, 638, 190, 48, label(), function () { cb(); b.setLabel(label()); }, { fill: 0x1a3a2a, size: 20 }); return b;
    };
    tg(W / 2 - 215, function () { return Sfx.on ? 'Sound on' : 'Sound off'; }, function () { Sfx.init(); Sfx.on = !Sfx.on; store.d.sound = Sfx.on; store.save(); });
    tg(W / 2, function () { return store.d.voice ? 'Voices on' : 'Voices off'; }, function () {
      Sfx.init(); store.d.voice = !store.d.voice; store.save();
      if (store.d.voice) { Voice.speak('mom', 'Hello family! Can you hear me?'); if (!Voice.available()) toast(self, 'This device has no speech voice, so you will hear chirps instead.', 3000, 900); } else Voice.stop();
    });
    tg(W / 2 + 215, function () { return isFull() ? 'Exit full screen' : 'Full screen'; }, function () { toggleFull(); });
    txt(this, W / 2, 696, 'A GAME BY CJ\'S FAMILY', 16, '#ffe9a0', { stroke: '#2a1808', strokeThickness: 4, fontStyle: '700' }).setDepth(70);

    this.cameras.main.fadeIn(350);
    if (dailyStatus().can && !hubDailyShown) {
      hubDailyShown = true;
      this.time.delayedCall(600, function () { self.openDaily(); });
    }
  },
  go: function (key, data) {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start(key, data); });
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
var levelsPage = -1;
var Levels = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Levels() { Phaser.Scene.call(this, 'Levels'); },
  create: function () {
    var self = this;
    this.objs = [];
    softBg(this, 0.55);
    bankBar(this);
    txt(this, W / 2, 62, 'Choose a level', 50, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    this.sub = txt(this, W / 2, 112, '', 24, '#bfe6cf');
    if (levelsPage < 0) levelsPage = Math.floor((nextLevel() - 1) / 5);
    this.page = levelsPage;
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.prev = button(this, 450, 660, 150, 58, '< Prev', function () { self.setPage(self.page - 1); }, { fill: 0x244a35, size: 24 });
    this.next = button(this, 830, 660, 150, 58, 'Next >', function () { self.setPage(self.page + 1); }, { fill: 0x244a35, size: 24 });
    this.pageTxt = txt(this, 640, 660, '', 24, CREAM);
    this.render();
    this.cameras.main.fadeIn(300);
  },
  setPage: function (p) {
    var max = Math.floor((nextLevel() - 1) / 5);
    if (p < 0 || p > max) { return; }
    levelsPage = this.page = p; this.render();
  },
  render: function () {
    var self = this;
    this.objs.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.objs = [];
    var O = this.objs, first = this.page * 5 + 1;
    this.sub.setText('Levels never end. Every level is a new place.');
    this.pageTxt.setText('Levels ' + first + ' - ' + (first + 4));
    this.prev.t.setAlpha(this.page > 0 ? 1 : 0.3);
    for (var i = 0; i < 5; i++) {
      (function (i) {
        var n = first + i, lv = getLevel(n), cx = 140 + i * 250, cy = 380, open = levelUnlocked(n), st = store.d.stars[n] || 0;
        O.push(roundRect(self, cx - 112, cy - 215, 224, 430, 28, open ? 0x16301f : 0x0e1c14, 0.94, open ? (lv.boss ? 0xc59bff : EDGE) : 0x33493c, 3));
        var im = self.add.image(cx, cy - 135, lv.theme.bg).setDisplaySize(200, 112).setDepth(2);
        if (!open) im.setTint(0x333333);
        O.push(im);
        O.push(txt(self, cx, cy - 40, String(n), 78, open ? (lv.boss ? '#e5d3ff' : '#ffd36f') : '#4a6355', { stroke: '#2a1808', strokeThickness: open ? 7 : 0 }));
        O.push(txt(self, cx, cy + 28, lv.name, 21, open ? CREAM : '#4a6355', { wordWrap: { width: 200 } }));
        O.push(txt(self, cx, cy + 58, lv.theme.realm + (lv.boss ? ' - Guardian' : ''), 16, open ? '#8fe8ff' : '#4a6355', { wordWrap: { width: 200 } }));
        for (var s2 = 0; s2 < 3; s2++) O.push(starShape(self, cx + (s2 - 1) * 48, cy + 100, s2 < st, 18));
        if (open) O.push(button(self, cx, cy + 158, 160, 52, st ? 'Replay' : 'Play', function () { self.start(n); }, { size: 25 }));
        else O.push(txt(self, cx, cy + 158, 'Earn a star on level ' + (n - 1), 16, '#7d9486', { wordWrap: { width: 190 } }));
      })(i);
    }
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

/* ================= Quests + Awards ================= */
var Quests = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Quests() { Phaser.Scene.call(this, 'Quests'); },
  init: function (data) { this.tab = (data && data.tab) || 'quests'; },
  create: function () {
    var self = this;
    this.objs = [];
    softBg(this, 0.6);
    this.bank = bankBar(this);
    txt(this, W / 2, 60, 'Quests and Awards', 48, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    this.tabs = {
      quests: button(this, 450, 130, 250, 54, 'Daily quests', function () { self.show('quests'); }, { size: 25 }),
      ach: button(this, 830, 130, 250, 54, 'Awards', function () { self.show('ach'); }, { size: 25 })
    };
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    ensureQuests();
    this.show(this.tab);
    this.cameras.main.fadeIn(300);
  },
  show: function (tab) {
    var self = this, O = this.objs, d = store.d;
    O.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.objs = O = [];
    this.tab = tab;
    Object.keys(this.tabs).forEach(function (k) { self.tabs[k].setFill(k === tab ? GOLD : 0x244a35); self.tabs[k].t.setColor(k === tab ? '#10281c' : '#ffffff'); });
    var rows = [];
    if (tab === 'quests') {
      O.push(txt(this, W / 2, 182, 'New quests arrive every day. Finish them for crystals.', 22, '#bfe6cf'));
      d.quests.items.forEach(function (it) {
        var q = questDef(it.id), pr = questProg(it);
        rows.push({ text: q.text, prog: pr, max: q.n, g: q.g, done: pr >= q.n, claimed: it.claimed, claim: function () { it.claimed = true; d.bank += q.g; } });
      });
    } else {
      O.push(txt(this, W / 2, 182, 'Awards are one-time rewards. Keep playing to earn them all.', 22, '#bfe6cf'));
      ACHS.forEach(function (a) { rows.push({ text: a.text, prog: a.ok() ? 1 : 0, max: 1, g: a.g, done: a.ok(), claimed: !!d.ach[a.id], claim: function () { d.ach[a.id] = true; d.bank += a.g; } }); });
    }
    var per = tab === 'quests' ? 3 : 6, y0 = tab === 'quests' ? 290 : 232, gap = tab === 'quests' ? 110 : 62;
    rows.slice(0, 12).forEach(function (r, i) {
      var col = tab === 'ach' ? i % 2 : 0, row = tab === 'ach' ? Math.floor(i / 2) : i;
      var cx = tab === 'ach' ? 340 + col * 600 : W / 2, cy = y0 + row * gap, w = tab === 'ach' ? 560 : 900, h = tab === 'ach' ? 54 : 90;
      O.push(roundRect(self, cx - w / 2, cy - h / 2, w, h, 20, r.claimed ? 0x12261b : 0x16301f, 0.95, r.done && !r.claimed ? GOLD : 0x33493c, 3));
      O.push(txt(self, cx - w / 2 + 16, cy - (tab === 'ach' ? 0 : 14), r.text, tab === 'ach' ? 19 : 28, r.claimed ? '#7d9486' : CREAM).setOrigin(0, 0.5));
      if (tab === 'quests') {
        O.push(roundRect(self, cx - w / 2 + 16, cy + 14, 460, 16, 8, 0x0e1c14, 1, 0x33493c, 2));
        if (r.prog > 0) O.push(roundRect(self, cx - w / 2 + 18, cy + 16, 456 * r.prog / r.max, 12, 6, r.done ? 0x59d98e : 0x6fe3ff, 1));
        O.push(txt(self, cx - w / 2 + 500, cy + 22, r.prog + '/' + r.max, 20, '#bfe6cf').setOrigin(0, 0.5));
      }
      var bx = cx + w / 2 - (tab === 'ach' ? 78 : 130);
      O.push(self.add.image(bx - 62, cy, 'gem_blue').setScale(0.28).setDepth(5));
      if (r.claimed) O.push(txt(self, bx + 16, cy, 'Done', tab === 'ach' ? 19 : 24, '#59d98e'));
      else if (r.done) O.push(button(self, bx + 20, cy, tab === 'ach' ? 100 : 130, tab === 'ach' ? 40 : 50, 'Claim ' + r.g, function () { r.claim(); store.save(); Sfx.win(); self.bank.set(d.bank); burst(self, bx, cy, [0xffd36f, 0xfff2b8], 18); self.show(self.tab); }, { size: tab === 'ach' ? 15 : 20 }));
      else O.push(txt(self, bx + 16, cy, '+' + r.g, tab === 'ach' ? 20 : 26, '#9fb8a8'));
    });
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Codex ================= */
var Codex = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Codex() { Phaser.Scene.call(this, 'Codex'); },
  create: function () {
    var self = this;
    this.page = 0; this.objs = [];
    softBg(this, 0.62);
    txt(this, W / 2, 56, 'Family Codex', 48, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    this.sub = txt(this, W / 2, 106, '', 22, '#bfe6cf');
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    button(this, 450, 660, 150, 58, '< Prev', function () { if (self.page > 0) { self.page--; self.render(); } }, { fill: 0x244a35, size: 24 });
    button(this, 830, 660, 150, 58, 'Next >', function () { if ((self.page + 1) * 6 < CODEX.length) { self.page++; self.render(); } }, { fill: 0x244a35, size: 24 });
    this.render();
    this.cameras.main.fadeIn(300);
  },
  render: function () {
    var O = this.objs, self = this;
    O.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.objs = O = [];
    this.sub.setText('Igbo words, proverbs, culture and nature. Clear levels to find new entries.  ' + store.d.codex.length + '/' + CODEX.length);
    for (var i = 0; i < 6; i++) {
      var idx = this.page * 6 + i; if (idx >= CODEX.length) break;
      var e = CODEX[idx], have = store.d.codex.indexOf(idx) >= 0, cx = 340 + (i % 2) * 600, cy = 220 + Math.floor(i / 2) * 150;
      O.push(roundRect(self, cx - 285, cy - 64, 570, 128, 22, have ? 0x16301f : 0x0e1c14, 0.95, have ? EDGE : 0x33493c, 3));
      if (have) {
        O.push(txt(self, cx - 268, cy - 40, e.t.toUpperCase(), 14, '#8fe8ff').setOrigin(0, 0.5));
        O.push(txt(self, cx - 268, cy - 12, e.h, 28, '#ffd36f').setOrigin(0, 0.5));
        O.push(txt(self, cx - 268, cy + 30, e.b, 18, '#ffffff', { wordWrap: { width: 535 }, align: 'left' }).setOrigin(0, 0.5));
      } else {
        O.push(txt(self, cx, cy, 'Locked  -  clear more levels', 22, '#4a6355'));
      }
    }
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Lucky spin ================= */
var SPIN = [5, 10, 15, 20, 30, 10, 50, 15];
var Spin = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Spin() { Phaser.Scene.call(this, 'Spin'); },
  create: function () {
    var self = this, cols = [0xff8fc0, 0x6fd6ff, 0xffd36f, 0xc59bff, 0x59d98e, 0xffb347, 0xff6b6b, 0x8fe8ff];
    softBg(this, 0.6);
    this.bank = bankBar(this);
    txt(this, W / 2, 62, 'Lucky spin', 52, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    this.msg = txt(this, W / 2, 118, store.d.spin === dayKey() ? 'You already spun today. Come back tomorrow!' : 'One free spin every day.', 24, '#bfe6cf');
    var R = 210, wheel = this.add.container(W / 2, 400);
    var g = this.add.graphics();
    for (var i = 0; i < 8; i++) {
      var a0 = Phaser.Math.DegToRad(i * 45 - 90 - 22.5), a1 = Phaser.Math.DegToRad(i * 45 - 90 + 22.5);
      g.fillStyle(cols[i], 1); g.slice(0, 0, R, a0, a1, false); g.fillPath();
      g.lineStyle(3, 0x10281c, 1); g.slice(0, 0, R, a0, a1, false); g.strokePath();
    }
    wheel.add(g);
    for (var j = 0; j < 8; j++) {
      var ang = Phaser.Math.DegToRad(j * 45 - 90);
      var t = txt(this, Math.cos(ang) * R * 0.68, Math.sin(ang) * R * 0.68, String(SPIN[j]), 34, '#10281c', { fontStyle: '800' }); t.setRotation(ang + Math.PI / 2);
      wheel.add(t);
    }
    wheel.add(this.add.circle(0, 0, 34, 0x10281c).setStrokeStyle(4, GOLD));
    this.add.triangle(W / 2, 400 - R - 12, 0, 0, 36, 0, 18, 34, 0xffd36f).setStrokeStyle(3, 0x2a1808).setDepth(5);
    this.wheel = wheel; this.spun = store.d.spin === dayKey();
    this.btn = button(this, W / 2, 660, 260, 62, this.spun ? 'Spun today' : 'Spin!', function () { self.go(); }, { size: 30, fill: this.spun ? 0x4a5a50 : 0x2e8b57 });
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.cameras.main.fadeIn(300);
  },
  go: function () {
    var self = this;
    if (this.spun) { toast(this, 'Come back tomorrow for another free spin.', 2200); return; }
    this.spun = true; store.d.spin = dayKey();
    var idx = Math.floor(Math.random() * 8), target = 360 * 5 - idx * 45;
    var win = SPIN[idx];
    store.d.bank += win; bump('spins'); store.save();
    this.btn.setLabel('Spinning...');
    this.tweens.add({ targets: this.wheel, angle: target, duration: 3600, ease: 'Cubic.easeOut', onComplete: function () {
      Sfx.win(); self.bank.set(store.d.bank); burst(self, W / 2, 400, [0xffd36f, 0xfff2b8, 0xc59bff], 40);
      self.msg.setText('You won ' + win + ' crystals!'); self.btn.setLabel('Spun today'); self.btn.setFill(0x4a5a50);
      Voice.speak('son', 'I won ' + win + ' crystals! Yay!');
    } });
    for (var k = 0; k < 18; k++) this.time.delayedCall(k * 190, function () { Sfx.tone(500 + Math.random() * 300, 0.05, 'square', 0.03); });
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Family Village ================= */
var BUILD = [
  { id: 'yam', name: 'Yam Farm', per: 4, cost: [30, 70, 130, 220, 340], col: 0xd8a24a, ch: 'Y', desc: 'Grows yams for the family.' },
  { id: 'kola', name: 'Kola Tree', per: 5, cost: [40, 90, 160, 260, 400], col: 0x59a860, ch: 'K', desc: 'Kola nuts to welcome guests.' },
  { id: 'drum', name: 'Drum Circle', per: 6, cost: [50, 110, 190, 300, 460], col: 0xc0613a, ch: 'D', desc: 'Music brings the village joy.' },
  { id: 'story', name: 'Story Hut', per: 7, cost: [60, 130, 220, 340, 520], col: 0x8a6ad0, ch: 'S', desc: 'Elders tell tales by the fire.' },
  { id: 'mine', name: 'Crystal Mine', per: 9, cost: [80, 160, 270, 420, 620], col: 0x4fb6e6, ch: 'C', desc: 'Digs real crystals.' },
  { id: 'market', name: 'Market Stall', per: 12, cost: [100, 200, 330, 500, 750], col: 0xe0558f, ch: 'M', desc: 'Trading earns the most.' }
];
function villageRate() { var r = 0; BUILD.forEach(function (b) { r += b.per * (store.d.village.b[b.id] || 0); }); return r; }
function villagePending() {
  var v = store.d.village, rate = villageRate();
  if (!v.last) return Math.floor(v.stash || 0);
  var h = Math.max(0, Math.min(8, (Date.now() - v.last) / 3600000));
  return Math.floor((v.stash || 0) + rate * h);
}
function villageFold() { var v = store.d.village; v.stash = villagePending(); v.last = Date.now(); }
var Village = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Village() { Phaser.Scene.call(this, 'Village'); },
  create: function () {
    var self = this;
    this.objs = [];
    softBg(this, 0.55);
    this.bank = bankBar(this);
    txt(this, W / 2, 56, 'Family Village', 50, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    txt(this, W / 2, 104, 'Build your village. It earns crystals for you, even while you are away (up to 8 hours).', 21, '#bfe6cf');
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.render();
    this.cameras.main.fadeIn(300);
  },
  render: function () {
    var self = this, O = this.objs, d = store.d;
    O.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.objs = O = [];
    var pend = villagePending(), rate = villageRate();
    O.push(txt(this, 470, 150, 'Earning ' + rate + ' crystals per hour', 24, '#ffd36f'));
    O.push(button(this, 880, 150, 300, 56, pend > 0 ? 'Collect ' + pend : 'Nothing to collect', function () { self.collect(); }, { size: 24, fill: pend > 0 ? 0x2e8b57 : 0x4a5a50 }));
    BUILD.forEach(function (b, i) {
      var col = i % 3, row = Math.floor(i / 3), cx = 245 + col * 395, cy = 305 + row * 250, lvl = d.village.b[b.id] || 0;
      O.push(roundRect(self, cx - 180, cy - 108, 360, 216, 26, 0x16301f, 0.94, lvl ? EDGE : 0x33493c, 3));
      var ic = self.add.circle(cx - 118, cy - 52, 36, b.col).setStrokeStyle(4, 0xffffff).setDepth(3); O.push(ic);
      O.push(txt(self, cx - 118, cy - 52, b.ch, 38, '#ffffff', { fontStyle: '800' }).setDepth(4));
      O.push(txt(self, cx + 30, cy - 66, b.name, 25, CREAM));
      O.push(txt(self, cx + 30, cy - 34, lvl ? '+' + (b.per * lvl) + ' per hour' : b.desc, 17, lvl ? '#8fe8ff' : '#bfe6cf', { wordWrap: { width: 230 } }));
      for (var p = 0; p < 5; p++) O.push(self.add.circle(cx - 100 + p * 28, cy + 6, 9, p < lvl ? GOLD : 0x2f4a3b).setStrokeStyle(2, p < lvl ? 0xb87a1e : 0x486a58).setDepth(3));
      if (lvl < 5) {
        var cost = b.cost[lvl];
        O.push(self.add.image(cx - 78, cy + 62, 'gem_blue').setScale(0.28).setDepth(62));
        O.push(button(self, cx + 10, cy + 62, 230, 52, (lvl ? 'Upgrade  ' : 'Build  ') + cost, function () { self.buy(b); }, { size: 23, fill: d.bank >= cost ? 0x2e8b57 : 0x4a5a50 }));
      } else O.push(button(self, cx, cy + 62, 230, 52, 'Fully built', function () { toast(self, b.name + ' is fully built.', 1600); }, { size: 22, fill: GOLD, color: '#10281c' }));
    });
  },
  collect: function () {
    var d = store.d, n = villagePending();
    if (n <= 0) { toast(this, 'Nothing yet. Build more and check back later.', 2000); return; }
    d.bank += n; d.village.stash = 0; d.village.last = Date.now(); store.save();
    this.bank.set(d.bank); Sfx.win(); burst(this, 880, 150, [0xffd36f, 0xfff2b8], 26);
    toast(this, '+' + n + ' crystals from the village', 2200); this.render();
  },
  buy: function (b) {
    var d = store.d, lvl = d.village.b[b.id] || 0;
    if (lvl >= 5) return;
    var cost = b.cost[lvl];
    if (d.bank < cost) { toast(this, 'Not enough crystals yet. Play a level to earn more.', 2200); Sfx.wrong(); return; }
    villageFold();
    d.bank -= cost; d.village.b[b.id] = lvl + 1; store.save();
    this.bank.set(d.bank); Sfx.win(); burst(this, W / 2, 360, [0xffd36f, 0x6fd6ff, 0xc59bff], 30);
    toast(this, b.name + (lvl ? ' upgraded to level ' + (lvl + 1) : ' built!'), 2200);
    this.render();
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= About / Credits / How to play ================= */
var ABOUT = {
  about: [
    ['Crystal Family Quest', 34, '#ffd36f'],
    ['A warm family adventure inspired by Igbo culture. A father, a mother, a son and a daughter travel through ever-changing worlds, using their different powers together to open magic gates.', 22, '#ffffff'],
    ['Every level is a new place, a new puzzle and a new chance to pick up a word, a proverb or a fact about culture and nature from the Family Codex.', 22, '#ffffff'],
    ['It is a game about teamwork. Igwe bụ ike: there is strength in unity.', 22, '#8fe8ff']
  ],
  credits: [
    ['Created by', 20, '#8fe8ff'],
    ['Ohizu Chibuike Paschal', 36, '#ffd36f'],
    ['A game by Cj\'s Family', 22, '#ffffff'],
    ['The family in the game', 20, '#8fe8ff'],
    ['Father: Ohizu Chibuike Paschal', 24, '#ffffff'],
    ['Mother: Zainab Joy Paschal', 24, '#ffffff'],
    ['Son: Jidenna Caleb Paschal', 24, '#ffffff'],
    ['Daughter: Habit Ijeoma Suleiman', 24, '#ffffff'],
    ['Made with Phaser 3 and Capacitor. Game code written with help from Claude by Anthropic.', 16, '#9fb8a8']
  ],
  how: [
    ['How to play', 34, '#ffd36f'],
    ['1. Tap the path to walk. Tap a portrait to switch family members.', 22, '#ffffff'],
    ['2. Dad pushes rocks (tap fast). Mom solves rune puzzles. Son squeezes under bridges. Daughter talks to the spirit bird.', 22, '#ffffff'],
    ['3. Finish every task to open the gate, then walk through the door into a brand new world.', 22, '#ffffff'],
    ['4. Use different family members back to back for combos. Four in a row is a Unity Move that heals a heart.', 22, '#ffffff'],
    ['5. Tap lucky gems, beat the par time, and keep your hearts for more stars. Spend crystals in the Shop, Upgrades and Village.', 22, '#ffffff']
  ]
};
var About = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function About() { Phaser.Scene.call(this, 'About'); },
  init: function (data) { this.tab = (data && data.tab) || 'about'; },
  create: function () {
    var self = this;
    this.objs = [];
    softBg(this, 0.62);
    this.tabs = {};
    [['about', 'The game', 400], ['credits', 'Credits', 640], ['how', 'How to play', 880]].forEach(function (t) {
      self.tabs[t[0]] = button(self, t[2], 70, 220, 54, t[1], function () { self.show(t[0]); }, { size: 24 });
    });
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    txt(this, W / 2, 696, 'A GAME BY CJ\'S FAMILY', 16, '#ffe9a0', { stroke: '#2a1808', strokeThickness: 4, fontStyle: '700' });
    this.show(this.tab);
    this.cameras.main.fadeIn(300);
  },
  show: function (tab) {
    var self = this, O = this.objs;
    O.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.objs = O = [];
    Object.keys(this.tabs).forEach(function (k) { self.tabs[k].setFill(k === tab ? GOLD : 0x244a35); self.tabs[k].t.setColor(k === tab ? '#10281c' : '#ffffff'); });
    O.push(roundRect(this, 170, 118, 940, 500, 36, DARKG, 0.92, EDGE, 3));
    var lines = ABOUT[tab], y = 160;
    lines.forEach(function (l) {
      var t = txt(self, W / 2, y, l[0], l[1], l[2], { wordWrap: { width: 840 }, align: 'center' }); t.setOrigin(0.5, 0); O.push(t);
      y += t.height + (l[1] > 30 ? 16 : 18);
    });
    if (tab === 'credits') {
      var im = ORDER.map(function (id, i) { return self.add.image(W / 2 + (i - 1.5) * 110, 590, CH[id].por).setScale(0.5).setDepth(3); });
      im.forEach(function (o) { O.push(o); });
    }
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true;
    this.cameras.main.fadeOut(250, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Hub'); });
  }
});

/* ================= Account: Google sign-in and backup ================= */
// To turn on Google sign-in, create an OAuth "Web application" client ID in Google Cloud
// (see README) and paste it here.
var GOOGLE_CLIENT_ID = '';
var Cloud = {
  token: '', email: '', fileId: '', timer: null, busy: false, msg: '',
  scoreOf: function (o) { var t = 0, k; for (k in (o.stars || {})) t += o.stars[k] || 0; return (o.top || 0) * 100000 + t * 100 + ((o.stats && o.stats.levels) || 0); },
  loadLib: function () {
    return new Promise(function (res, rej) {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) { res(); return; }
      var sc = document.createElement('script'); sc.src = 'https://accounts.google.com/gsi/client'; sc.async = true;
      sc.onload = function () { res(); }; sc.onerror = function () { rej(new Error('Could not load Google sign-in. Check your internet connection.')); };
      document.head.appendChild(sc);
    });
  },
  api: function (url, opt) {
    opt = opt || {}; opt.headers = Object.assign({ Authorization: 'Bearer ' + Cloud.token }, opt.headers || {});
    return fetch(url, opt).then(function (r) { if (!r.ok) throw new Error('Google said ' + r.status); return r; });
  },
  signIn: function () {
    if (!GOOGLE_CLIENT_ID) return Promise.reject(new Error('setup'));
    return Cloud.loadLib().then(function () {
      return new Promise(function (res, rej) {
        var tc = window.google.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID, scope: 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.email',
          callback: function (r) { if (r && r.access_token) { Cloud.token = r.access_token; res(); } else rej(new Error('Sign-in was cancelled.')); },
          error_callback: function () { rej(new Error('Sign-in was cancelled.')); }
        });
        tc.requestAccessToken({ prompt: '' });
      });
    }).then(function () { return Cloud.api('https://www.googleapis.com/oauth2/v3/userinfo').then(function (r) { return r.json(); }); })
      .then(function (u) { Cloud.email = u.email || 'your Google account'; store.d.acct.email = Cloud.email; store.save(); return Cloud.sync(); });
  },
  findFile: function () {
    return Cloud.api('https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=' + encodeURIComponent("name='cfq-save.json'") + '&fields=files(id)').then(function (r) { return r.json(); })
      .then(function (j) { Cloud.fileId = (j.files && j.files[0] && j.files[0].id) || ''; return Cloud.fileId; });
  },
  upload: function () {
    var meta = Cloud.fileId ? {} : { name: 'cfq-save.json', parents: ['appDataFolder'] };
    var body = '--cfq\r\nContent-Type: application/json\r\n\r\n' + JSON.stringify(meta) + '\r\n--cfq\r\nContent-Type: application/json\r\n\r\n' + JSON.stringify(store.d) + '\r\n--cfq--';
    var url = Cloud.fileId ? 'https://www.googleapis.com/upload/drive/v3/files/' + Cloud.fileId + '?uploadType=multipart' : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    return Cloud.api(url, { method: Cloud.fileId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'multipart/related; boundary=cfq' }, body: body }).then(function (r) { return r.json(); }).then(function (j) { if (j.id) Cloud.fileId = j.id; });
  },
  sync: function () {
    // newest progress wins: download the cloud copy, keep whichever has gone further
    return Cloud.findFile().then(function () {
      if (!Cloud.fileId) return Cloud.upload().then(function () { return 'Progress saved to your Google account.'; });
      return Cloud.api('https://www.googleapis.com/drive/v3/files/' + Cloud.fileId + '?alt=media').then(function (r) { return r.json(); }).then(function (cloud) {
        if (Cloud.scoreOf(cloud) > Cloud.scoreOf(store.d)) { cloud.acct = { email: Cloud.email }; store.apply(cloud); return 'Welcome back! Your saved progress was loaded.'; }
        return Cloud.upload().then(function () { return 'Progress saved to your Google account.'; });
      });
    });
  },
  soon: function () {
    if (!Cloud.token) return;
    clearTimeout(Cloud.timer);
    Cloud.timer = setTimeout(function () { Cloud.upload().catch(function () { Cloud.token = ''; }); }, 4000);
  },
  signOut: function () { Cloud.token = ''; Cloud.email = ''; store.d.acct.email = ''; store.save(); }
};
window.__cfqCloudSoon = function () { Cloud.soon(); };
function exportCode() { try { return 'CFQ1.' + btoa(unescape(encodeURIComponent(JSON.stringify(store.d)))); } catch (e) { return ''; } }
function importCode(code) {
  try {
    code = String(code || '').trim(); if (code.indexOf('CFQ1.') !== 0) return false;
    var o = JSON.parse(decodeURIComponent(escape(atob(code.slice(5))))); if (!o || typeof o !== 'object' || typeof o.bank !== 'number') return false;
    store.apply(o); return true;
  } catch (e) { return false; }
}
var Account = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function Account() { Phaser.Scene.call(this, 'Account'); },
  create: function () {
    var self = this;
    this.objs = [];
    softBg(this, 0.62);
    txt(this, W / 2, 60, 'Save your progress', 50, CREAM, { stroke: '#2a1808', strokeThickness: 6 });
    button(this, 120, 660, 180, 58, 'Back', function () { self.back(); }, { fill: 0x244a35, size: 26 });
    this.render();
    this.cameras.main.fadeIn(300);
  },
  setMsg: function (m) { Cloud.msg = m; if (!this.gone) this.render(); },
  render: function () {
    var self = this, O = this.objs;
    O.forEach(function (o) { if (o && o.destroy) o.destroy(); }); this.objs = O = [];
    var email = Cloud.email || store.d.acct.email, signed = !!Cloud.token;
    O.push(roundRect(this, 140, 110, 1000, 190, 30, DARKG, 0.93, EDGE, 3));
    O.push(txt(this, W / 2, 148, signed ? 'Signed in as ' + email : (email ? 'Last signed in as ' + email : 'Not signed in'), 28, signed ? '#59d98e' : CREAM));
    O.push(txt(this, W / 2, 186, 'Sign in with your Google (Gmail) account to keep your crystals, stars and village safe, and carry them to any phone.', 19, '#bfe6cf', { wordWrap: { width: 900 } }));
    if (!signed) O.push(button(this, W / 2, 252, 400, 58, 'Sign in with Google', function () { self.signIn(); }, { size: 25 }));
    else {
      O.push(button(this, W / 2 - 130, 252, 230, 54, 'Save now', function () { self.syncNow(); }, { size: 24 }));
      O.push(button(this, W / 2 + 130, 252, 230, 54, 'Sign out', function () { Cloud.signOut(); self.setMsg('Signed out.'); }, { size: 24, fill: 0x244a35 }));
    }
    O.push(roundRect(this, 140, 320, 1000, 190, 30, DARKG, 0.93, EDGE, 3));
    O.push(txt(this, W / 2, 352, 'Backup code (works without signing in)', 26, CREAM));
    O.push(txt(this, W / 2, 388, 'Copy your code and keep it somewhere safe. Paste it on another phone to restore everything.', 19, '#bfe6cf', { wordWrap: { width: 900 } }));
    O.push(button(this, W / 2 - 130, 450, 230, 54, 'Copy my code', function () { self.copy(); }, { size: 23 }));
    O.push(button(this, W / 2 + 130, 450, 230, 54, 'Restore from code', function () { self.restore(); }, { size: 22, fill: 0x244a35 }));
    O.push(txt(this, W / 2, 560, Cloud.msg || '', 22, '#ffd36f', { wordWrap: { width: 940 } }));
    O.push(txt(this, W / 2, 610, 'Your progress is also saved on this device automatically.', 17, '#9fb8a8'));
  },
  signIn: function () {
    var self = this; this.setMsg('Opening Google sign-in...');
    Cloud.signIn().then(function (m) { self.setMsg(m); Sfx.win(); }).catch(function (e) {
      if (e && e.message === 'setup') self.setMsg('Google sign-in is not switched on in this build yet. The owner needs to add a Google client ID (steps are in the README). Use the backup code meanwhile.');
      else self.setMsg((e && e.message) || 'Sign-in did not work. Try the backup code instead.');
    });
  },
  syncNow: function () { var self = this; Cloud.upload().then(function () { self.setMsg('Saved to your Google account.'); Sfx.key(); }).catch(function () { Cloud.token = ''; self.setMsg('Please sign in again to save.'); }); },
  copy: function () {
    var code = exportCode(), self = this;
    try { navigator.clipboard.writeText(code).then(function () { self.setMsg('Code copied. Keep it safe!'); }, function () { window.prompt('Copy your backup code:', code); }); }
    catch (e) { try { window.prompt('Copy your backup code:', code); } catch (e2) { self.setMsg('Could not copy on this device.'); } }
  },
  restore: function () {
    var code = ''; try { code = window.prompt('Paste your backup code:') || ''; } catch (e) {}
    if (!code) { this.setMsg('No code entered.'); return; }
    if (importCode(code)) { this.setMsg('Progress restored! Go back home to see it.'); Sfx.win(); } else this.setMsg('That code did not work. Check you copied all of it.');
  },
  back: function () {
    var self = this;
    if (this.leaving) return; this.leaving = true; this.gone = true;
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
    this.enter = !!(data && data.enter);
    this.lv = getLevel(this.n);
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

    this.add.image(W / 2, H / 2 - 2, this.lv.theme.bg).setDisplaySize(W, H + 4).setDepth(-10);
    this.startedAt = this.time.now; this.lastSay = -1e9; this.lastIdle = this.time.now; this.bubble = null;
    this.buildFx(this.lv.theme.fx);
    this.buildWorld(); this.buildChars(); this.buildHud(); this.buildInput();
    this.cameras.main.fadeIn(500);
    if (this.enter) this.emerge(); else this.time.delayedCall(800, function () { self.intro(); });
  },

  wait: function (ms) { var s = this; return new Promise(function (r) { s.time.delayedCall(ms, r); }); },
  tw: function (cfg) { var s = this; return new Promise(function (r) { cfg.onComplete = r; s.tweens.add(cfg); }); },

  buildFx: function (kind) {
    var self = this, i, n = 18, spec = {
      petals: { tint: [0xffb3d9, 0xfff2a8], vy: 40, vx: -15, sc: 0.35, add: false },
      sparks: { tint: [0x9fe8ff, 0xd9a8ff], vy: -10, vx: 0, sc: 0.3, add: true },
      clouds: { tint: [0xffffff], vy: 0, vx: -25, sc: 0.8, add: false },
      fireflies: { tint: [0xfff2a8], vy: -6, vx: 0, sc: 0.35, add: true },
      confetti: { tint: [0xff8fc0, 0xffd36f, 0x6fd6ff, 0xc59bff], vy: 70, vx: 10, sc: 0.4, add: false },
      dust: { tint: [0xffe2a0], vy: -4, vx: -40, sc: 0.3, add: true },
      bubbles: { tint: [0xffffff, 0xbfefff], vy: -35, vx: 0, sc: 0.3, add: true },
      snow: { tint: [0xffffff], vy: 55, vx: -12, sc: 0.28, add: false },
      embers: { tint: [0xff9a3a, 0xffd06a], vy: -50, vx: 8, sc: 0.3, add: true }
    }[kind] || { tint: [0xffffff], vy: 20, vx: 0, sc: 0.3, add: false };
    this.fxList = [];
    for (i = 0; i < n; i++) {
      var f = this.add.image(Phaser.Math.Between(0, W), Phaser.Math.Between(60, 560), spec.add || kind === 'clouds' ? 'glow' : 'spark').setScale(spec.sc * (0.6 + Math.random() * 0.8)).setAlpha(0.35 + Math.random() * 0.5).setTint(spec.tint[i % spec.tint.length]).setDepth(-5);
      if (spec.add) f.setBlendMode(Phaser.BlendModes.ADD);
      f.vx = spec.vx * (0.5 + Math.random()); f.vy = spec.vy * (0.5 + Math.random()); f.sway = Math.random() * 6;
      this.fxList.push(f);
    }
  },
  fxStep: function (s, t) {
    if (!this.fxList) return;
    for (var i = 0; i < this.fxList.length; i++) {
      var f = this.fxList[i];
      f.x += (f.vx + Math.sin(t / 700 + f.sway) * 14) * s; f.y += f.vy * s;
      if (f.x < -40) f.x = W + 40; if (f.x > W + 40) f.x = -40;
      if (f.y > 600) f.y = 40; if (f.y < 20) f.y = 590;
    }
  },

  /* speech bubbles + voice */
  say: function (who, ev, force) {
    var now = this.time.now;
    if (!force && now - this.lastSay < 3200) return;
    var line = pickLine(who, ev); if (!line) return;
    this.lastSay = now; this.lastIdle = now;
    var c = this.ch[who]; if (!c) return;
    if (this.bubble && this.bubble.scene) this.bubble.destroy();
    var t = txt(this, 0, 0, line, 22, '#2a1808', { wordWrap: { width: 300 }, fontStyle: '700' });
    var w = Math.max(120, t.width + 34), h = t.height + 22;
    var g = this.add.graphics(); g.fillStyle(0xfffbe8, 1); g.fillRoundedRect(-w / 2, -h / 2, w, h, 20); g.lineStyle(3, 0xb88a3e, 1); g.strokeRoundedRect(-w / 2, -h / 2, w, h, 20);
    g.fillStyle(0xfffbe8, 1); g.fillTriangle(-10, h / 2 - 1, 10, h / 2 - 1, 0, h / 2 + 14);
    var bx = Phaser.Math.Clamp(c.x, w / 2 + 10, W - w / 2 - 10), by = GY - c.sprite.displayHeight - 78 - h / 2;
    var b = this.add.container(bx, by, [g, t]).setDepth(1100).setAlpha(0).setScale(0.6);
    this.bubble = b;
    var self = this;
    this.tweens.add({ targets: b, alpha: 1, scale: 1, duration: 180, ease: 'Back.easeOut' });
    this.time.delayedCall(2800, function () { if (b.scene) self.tweens.add({ targets: b, alpha: 0, duration: 250, onComplete: function () { if (b.scene) b.destroy(); } }); });
    Voice.speak(who, line);
  },

  emerge: function () {
    var self = this, d = this.door;
    this.busy = true;
    var th = this.lv.theme;
    ORDER.forEach(function (id, i) {
      var c = self.ch[id]; c.lock = true; c.sprite.setAlpha(0); c.x = 62; c.sprite.x = 62; c.sprite.setTexture(c.def.walk);
      self.time.delayedCall(700 + i * 520, function () {
        if (!self.alive) return;
        Sfx.blip();
        c.sprite.setAlpha(1);
        self.tweens.add({ targets: c, x: CH[id].x + 60, duration: 600, ease: 'Sine.easeOut', onComplete: function () { c.lock = false; c.targetX = c.x; if (id === 'son') { self.busy = false; self.intro(); } } });
      });
    });
    this.tweens.add({ targets: this.doorGlow, alpha: 0, scale: 0.3, duration: 2600, delay: 400 });
    this.burst(70, GY - 120, [th.door, 0xffffff], 24);
  },

  /* ----- world ----- */
  reward: function (type) { return TYPES[type].reward + (type === 'bush' ? this.up.dau : 0); },

  buildWorld: function () {
    var self = this, lv = this.lv;
    this.gate = this.add.image(1185, GY - 30, 'gate').setOrigin(0.5, 1).setScale(0.62).setDepth(GY - 40);
    this.gateGlow = this.add.image(1185, GY - 130, 'glow').setScale(0).setAlpha(0).setDepth(GY - 41).setTint(lv.theme.door).setBlendMode(Phaser.BlendModes.ADD);
    this.door = null; this.doorGlow = null;
    if (this.enter) {
      this.door = this.add.image(70, GY - 30, 'gate').setOrigin(0.5, 1).setScale(0.62).setDepth(GY - 40).setFlipX(true);
      this.doorGlow = this.add.image(70, GY - 130, 'glow').setScale(3.4).setAlpha(1).setDepth(GY - 41).setTint(lv.theme.door).setBlendMode(Phaser.BlendModes.ADD);
    }
    this.lucky = null;

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
    if (this.n >= 2) {
      var lx = 260 + Math.floor(Math.random() * 700), ly = 330 + Math.floor(Math.random() * 60);
      var lg = this.add.image(lx, ly, 'glow').setScale(1.2).setAlpha(0.7).setTint(0xffe27a).setBlendMode(Phaser.BlendModes.ADD).setDepth(GY - 5);
      var ls = this.add.image(lx, ly, 'gem_gold').setScale(0.6).setDepth(GY - 4).setInteractive({ useHandCursor: true });
      this.tweens.add({ targets: [lg, ls], y: ly - 24, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      var lself = this;
      ls.on('pointerdown', function () {
        if (lself.lucky === 'got' || lself.over) return; lself.lucky = 'got';
        lself.burst(ls.x, ls.y, [0xffe27a, 0xffffff], 24); lself.addCrystals(5, ls.x, ls.y); lself.toast('Lucky gem! +5 crystals', 1800);
        lg.destroy(); ls.destroy(); lself.say('son', 'gem', true);
      });
      this.time.delayedCall(14000 + Math.random() * 8000, function () { if (lself.lucky !== 'got' && ls.scene) lself.tweens.add({ targets: [lg, ls], alpha: 0, duration: 400, onComplete: function () { if (ls.scene) { ls.destroy(); lg.destroy(); } } }); });
    }
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

    this.comboTxt = txt(this, 640, 124, '', 26, '#ffd36f', { stroke: '#2a1808', strokeThickness: 5 }).setDepth(600).setVisible(false);
    this.comboBar = this.add.graphics().setDepth(600);

    txt(this, 640, 96, 'Level ' + this.n + '  -  ' + this.lv.theme.realm, 17, '#bfe6cf', { stroke: '#10281c', strokeThickness: 3 }).setDepth(601);
    var mini = function (x, label, cb) {
      roundRect(self, x - 60, 118, 120, 40, 20, DARKG, 0.6, EDGE, 2).setDepth(590);
      var t = txt(self, x, 138, label, 20, CREAM).setDepth(601);
      var z = self.add.zone(x, 138, 120, 40).setDepth(602).setInteractive({ useHandCursor: true });
      z.on('pointerdown', function () { Sfx.init(); cb(t); });
      return t;
    };
    mini(84, Sfx.on ? 'Sound on' : 'Sound off', function (t) { Sfx.on = !Sfx.on; store.d.sound = Sfx.on; store.save(); t.setText(Sfx.on ? 'Sound on' : 'Sound off'); if (Sfx.on) Sfx.blip(); });
    mini(218, store.d.voice ? 'Voice on' : 'Voice off', function (t) { store.d.voice = !store.d.voice; store.save(); t.setText(store.d.voice ? 'Voice on' : 'Voice off'); if (store.d.voice) self.say(self.active, 'start', true); else Voice.stop(); });
    mini(352, 'Full screen', function () { toggleFull(); });
    mini(486, 'Levels', function () { self.leave('Levels'); });

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
      this.toast(this.lv.theme.realm + ': ' + this.lv.name + (this.lv.boss ? '  (Guardian level, big rewards!)' : '') + '. Switch family members back to back for combos.', 4400);
      this.say('dad', 'start', true);
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
    this.say(this.active, 'hurt', true);
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
    Sfx.combo(); bump('combos'); this.say(this.lastWho, 'combo', true);
    if (c >= 4) {
      bump('unity');
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
    this.say(o.who, 'win', true);
  },

  /* ----- interactions ----- */
  interact: async function (o) {
    if (this.busy || this.over || this.pushing) return;
    if (o.done) { this.toast('Already done. Great work!', 1600); return; }
    if (this.active !== o.who) {
      this.toast(WRONG[o.type], 2600); this.pulsePortrait(o.who); Sfx.blip(); this.say(this.active, 'wrong'); return;
    }
    if (o.stand > this.xMax() + 8) {
      this.toast('A big rock blocks the way. Move it first.', 2600); this.pulsePortrait('dad'); Sfx.blip(); return;
    }
    this.busy = true;
    this.say(o.who, 'start', true);
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
      var w = 860, h = 250;
      var bg = roundRect(self, -w / 2, -h / 2, w, h, 30, DARKG, 0.94, GOLD, 3);
      var t0 = txt(self, 0, -98, who, 22, '#8fe8ff');
      var t1 = txt(self, 0, -48, big, 36, CREAM, { wordWrap: { width: 800 } });
      var t2 = txt(self, 0, 34, small, 25, '#ffffff', { wordWrap: { width: 780 } });
      var hint = txt(self, w / 2 - 84, h / 2 - 20, 'Tap to continue', 15, '#9fb8a8');
      var c = self.add.container(W / 2, 270, [bg, t0, t1, t2, hint]).setDepth(1200).setAlpha(0);
      self.tweens.add({ targets: c, alpha: 1, duration: 250 });
      var done = false;
      var finish = function () {
        if (done) return; done = true;
        self.tweens.add({ targets: c, alpha: 0, duration: 250, onComplete: function () { c.destroy(); resolve(); } });
      };
      self.time.delayedCall(500, function () { self.input.once('pointerdown', finish); });
      self.time.delayedCall(9000, finish);
    });
  },

  do_bush: async function (o) {
    var c = this.ch.dau, bird = o.bird;
    this.pose(c, 'act');
    this.tweens.add({ targets: bird, scale: bird.scale * 1.2, duration: 200, yoyo: true, repeat: 1 });
    Sfx.tone(988, 0.12, 'triangle', 0.06); Sfx.tone(1318, 0.16, 'triangle', 0.06, 0, 0.1);
    await this.wait(700);
    var pv = nextProverb();
    Voice.speak('bird', 'Listen, little one. ' + pv.en);
    await this.dialog('Spirit bird says', pv.ig, pv.en);
    Voice.stop();
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
    this.tweens.add({ targets: this.gate, alpha: 0.35, duration: 700 });
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
    var self = this, n = this.n, d = store.d;
    var ratio = this.crystals / Math.max(1, this.total);
    var stars = (ratio >= 0.85 && this.hearts >= 2) ? 3 : (ratio >= 0.6 ? 2 : 1);
    var secs = Math.round((this.time.now - this.startedAt) / 1000), fast = secs <= this.lv.par;
    var cont = [];
    var add = function (o) { cont.push(o); return o; };
    var D = 1500;
    add(this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.68).setDepth(D).setInteractive());
    add(roundRect(this, W / 2 - 400, 40, 800, 650, 40, DARKG, 0.97, GOLD, 5).setDepth(D + 1));
    add(txt(this, W / 2, 100, (this.lv.boss ? 'Guardian beaten!' : 'Level ' + n + ' clear!'), 54, CREAM, { stroke: '#2a1808', strokeThickness: 6 }).setDepth(D + 2));
    add(txt(this, W / 2, 150, this.lv.theme.realm + '  -  ' + this.lv.name, 22, '#bfe6cf').setDepth(D + 2));
    for (var i = 0; i < 3; i++) {
      var on = i < stars;
      var st = add(starShape(this, W / 2 + (i - 1) * 120, 235, on, 50).setScale(0).setDepth(D + 2));
      (function (st, i, on) {
        self.time.delayedCall(500 + i * 380, function () {
          if (!st.scene) return;
          self.tweens.add({ targets: st, scale: on ? 1 : 0.8, angle: on ? 360 : 0, duration: 420, ease: 'Back.easeOut' });
          if (on) { Sfx.tone(660 + i * 220, 0.3, 'triangle', 0.08); self.burst(st.x, st.y, [0xffd36f, 0xfff2b8], 12); }
        });
      })(st, i, on);
    }
    var parBonus = fast ? 3 : 0, bossBonus = this.lv.boss ? 15 : 0;
    add(txt(this, W / 2, 322, 'Crystals  ' + this.crystals + ' / ' + Math.max(this.total, this.crystals), 34, '#ffffff').setDepth(D + 2));
    add(txt(this, W / 2, 364, 'Hearts ' + this.hearts + '/3     Time ' + secs + 's (par ' + this.lv.par + 's)', 24, '#bfe6cf').setDepth(D + 2));
    var extra = [];
    if (fast) extra.push('Speedy family +3');
    if (this.lv.boss) extra.push('Guardian bonus +15');
    if (this.hearts === 3) extra.push('Perfect run!');
    add(txt(this, W / 2, 400, extra.join('   '), 22, '#ffd36f').setDepth(D + 2));
    var entryIdx = -1;
    for (var k = 0; k < CODEX.length; k++) { var ci = (n - 1 + k) % CODEX.length; if (d.codex.indexOf(ci) < 0) { entryIdx = ci; break; } }
    var chest = add(this.add.image(W / 2 - 220, 495, 'chest').setScale(0.5).setDepth(D + 2));
    var bank = add(txt(this, W / 2 + 70, 465, 'Claim your crystals', 26, '#ffffff', { wordWrap: { width: 380 } }).setDepth(D + 2));
    var claim = add(button(this, W / 2 + 70, 530, 230, 66, 'Claim', function () {
      Sfx.init(); Sfx.win();
      var mystery = 2 + Math.floor(Math.random() * 11), total = self.crystals + parBonus + bossBonus + mystery;
      d.bank += total;
      d.stars[n] = Math.max(d.stars[n] || 0, stars);
      d.top = Math.max(d.top, n);
      bump('levels'); bump('crystals', self.crystals); if (fast) bump('speedy'); if (self.hearts === 3) bump('perfect');
      if (entryIdx >= 0) d.codex.push(entryIdx);
      store.save();
      claim.destroy();
      bank.setText('Crystal bank: ' + d.bank + '\n+' + total + ' added (mystery chest +' + mystery + ')');
      self.tweens.add({ targets: chest, scale: 0.62, duration: 200, yoyo: true });
      self.burst(chest.x, chest.y, [0xffd36f, 0x6fd6ff, 0xc59bff], 30);
      var by = 628, xs = [W / 2 - 230, W / 2, W / 2 + 230];
      add(button(self, xs[0], by, 210, 62, 'Next level', function () { self.passDoor(cont); }, { depth: D + 5, size: 26 }));
      add(button(self, xs[1], by, 190, 62, 'Replay', function () { self.leave2('Level', { n: n }); }, { depth: D + 5, fill: 0x244a35, size: 25 }));
      add(button(self, xs[2], by, 190, 62, 'Levels', function () { self.leave2('Levels'); }, { depth: D + 5, fill: 0x244a35, size: 25 }));
      if (entryIdx >= 0) add(txt(self, W / 2, 580, 'New Codex entry: ' + CODEX[entryIdx].h, 22, '#8fe8ff').setDepth(D + 2));
      var ready = claimable();
      if (ready > 0) add(txt(self, W / 2, 598, ready + ' quest or award reward' + (ready > 1 ? 's are' : ' is') + ' ready on the home screen', 17, '#ffd36f').setDepth(D + 2));
      self.say('dau', 'win', true);
    }, { depth: D + 5, size: 30 }));
  },

  passDoor: async function (cont) {
    if (this.leaving) return; this.leaving = true;
    var self = this, n = this.n;
    cont.forEach(function (o) { if (o && o.scene) o.destroy(); });
    this.toast('Through the door we go!', 2000);
    Sfx.key();
    this.gate.setAlpha(1);
    this.gateGlow.setAlpha(1).setScale(2.2);
    this.marker.setVisible(false);
    var gx = this.gate.x;
    var walkers = ORDER.map(function (id, i) {
      var c = self.ch[id]; c.lock = true; c.dir = 1; c.sprite.setTexture(c.def.walk); c.sprite.setFlipX(false);
      return self.wait(i * 380).then(function () {
        return self.tw({ targets: c, x: gx - 12, duration: 1500 + (3 - i) * 100, ease: 'Sine.easeInOut', onUpdate: function () { c.sprite.x = c.x; } });
      }).then(function () { return self.tw({ targets: c.sprite, alpha: 0, scale: c.scale * 0.8, duration: 260 }); }).then(function () { Sfx.blip(); self.burst(gx, GY - 100, [0xfff2b8, 0xffffff], 10); });
    });
    await Promise.all(walkers);
    if (!this.alive) return;
    this.tweens.add({ targets: this.gateGlow, scale: 9, duration: 700, ease: 'Quad.easeIn' });
    Sfx.win();
    this.cameras.main.flash(600, 255, 255, 255);
    await this.wait(650);
    this.cameras.main.fadeOut(300, 255, 255, 255);
    this.cameras.main.once('camerafadeoutcomplete', function () { self.scene.start('Level', { n: n + 1, enter: true }); });
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
    this.fxStep(s, time);
    if (!this.busy && !this.over && tnow - this.lastIdle > 11000) { this.lastIdle = tnow; this.say(ORDER[Math.floor(Math.random() * 4)], 'idle', true); }
    if (this.chain > 0) {
      var left = COMBO_MS - (tnow - this.chainAt);
      if (left <= 0) { this.chain = 0; this.comboTxt.setVisible(false); this.comboBar.clear(); }
      else if (this.chain >= 2) {
        this.comboTxt.setVisible(true).setText('Combo x' + this.chain);
        var g = this.comboBar; g.clear();
        g.fillStyle(0x10281c, 0.8); g.fillRoundedRect(560, 146, 160, 10, 5);
        g.fillStyle(GOLD, 1); g.fillRoundedRect(562, 148, 156 * (left / COMBO_MS), 6, 3);
      } else { this.comboTxt.setVisible(false); this.comboBar.clear(); }
    }

    if (!this.busy && !this.over) {
      for (var i = 0; i < this.gems.length; i++) {
        var g2 = this.gems[i];
        if (!g2.got && Math.abs(a.x - g2.x) < this.reach) {
          g2.got = true; g2.glow.destroy();
          this.crystals += 1; this.updateCounter(); Sfx.collect(); this.say(this.active, 'gem');
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

/* ================= fullscreen ================= */
function isFull() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
function toggleFull() {
  try {
    var el = document.documentElement;
    if (isFull()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); }
    else { var f = el.requestFullscreen || el.webkitRequestFullscreen; if (f) { var p = f.call(el, { navigationUI: 'hide' }); if (p && p.catch) p.catch(function () {}); } }
  } catch (e) {}
  try { if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e2) {}
}
function autoFull() { if (!isFull()) toggleFull(); }

/* ================= start ================= */
function start() {
  window.__cfq = new Phaser.Game({
    type: Phaser.AUTO, width: W, height: H, parent: 'game', backgroundColor: '#10241a',
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    input: { activePointers: 3 }, render: { antialias: true },
    scene: [Boot, Title, Hub, Levels, Quests, Codex, Spin, Village, About, Account, Shop, Upgrades, Level]
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
