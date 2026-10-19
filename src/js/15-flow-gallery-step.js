// ---------- room load / flow
function loadRoom(i, entry) {
  G.secrets = []; G.lore = null;
  if (COMF.assist && G.state === 'play' && P.hp > 0 && entry !== 'S' && entry !== 'P' && i !== G.ri) P.hp = Math.min(P.maxHp, P.hp + 1);
  G.finish = null; G.ri = i; G.room = makeRoom(ROOM_DEFS[i]);
  G.enemies = []; G.drops = []; G.waves = []; G.boss = null; G.shrine = null; G.parts = []; G.spells = []; G.fx = []; G.relics = []; G.signs = []; G.signAct = null; G.gates = []; G.tutProg = {}; G.tutLast = ''; G.cine = null; G.coinL = []; G.smith = null; G.shots = []; G.puddles = []; G.braziers = []; G.cracks = new Set(G.room.cracks); G.crackHint = false; G.waxbits = []; G.ledges = null; G.kilnCool = 0; G.props = null; G.fpuffs = []; G.husk = null; G.zm = 1; G.lb = 0; G.blk = 0; G.abyss = null; G.umbraArena = false; G.uent = null; G.lastWords = null; G.drips = []; G.smog = 0; try { const hl = $('hudLayer'); if (hl) hl.style.opacity = ''; } catch (_) {}
  let spawn = null;
  for (const e of G.room.ents) {
    const px = e.x * T, py = e.y * T;
    if (e.type === entry) spawn = { x:px + 3, y:py + T - P.h };
    if (e.type === 'C') G.enemies.push(mkCrawler(px, py));
    if (e.type === 'F') G.enemies.push(mkFlyer(px, py));
    if (e.type === 'D' || e.type === 'H' || e.type === 'L' || e.type === 'W') G.enemies.push(mkDummy(px, py, e.type, e.data));
    if (e.type === 'G') G.gates.push({ x:e.x, id:e.data, open:false });
    if (e.type === 'T') G.signs.push({ x:px + 8, y:py + T, id:e.data });
    if (e.type === 'o') { const key = i + ':' + e.x + ':' + e.y; if (!G.coinGot[key]) G.coinL.push({ x:px + 8, y:py + 8, key, t:rand(0, 6) }); }
    if (e.type === 's') G.enemies.push(mkSpitter(px, py));
    if (e.type === 'A') G.enemies.push(Object.assign(mkCrawler(px, py), { armor:true, hp:4 }));
    if (e.type === 'z') G.braziers.push({ x:px + 8, y:py + 8, id:e.data, key:i + ':' + e.data, lit:false, t:0 });
    if (e.type === 'Q' && !G.bossDown) G.boss = mkChandler(px, py);
    if (e.type === 'Y' && !G.bossDown) G.boss = mkWyrm(px + 8);
    if (e.type === 'c') G.enemies.push(mkCocoon(px, py));
    if ('dwehgm'.includes(e.type) && e.type.length === 1) spawnFoe(e.type, px, py);
    if ((e.type === 'y' || e.type === 'x') && !G.gal) { const key = G.room.def.id + ':' + e.data; if (e.type === 'y' || !(G.embersGot || {})[key]) G.secrets.push({ k:e.type, key, x:px + 8, y:py + T, t:rand(0, 6), done:false }); }
    if (e.type === 'M') G.smith = { x:px, y:py, id:e.data, near:false, said:false, t:0 };
    if (e.type === 'S') { G.shrine = { x:px, y:py, lit:G.cp.room === i }; if (entry === 'S') spawn = { x:px + 20, y:py + T - P.h }; }
    if (e.type === 'K' && !G.bossDown) G.boss = mkBoss(px, py);
    if (e.type === 'R' && !G.skills[e.data]) G.relics.push({ x:px + 8, y:py + 8, id:e.data, t:0 });
  }
  for (const bz of G.braziers) if (G.lit[bz.key]) { bz.lit = true; for (const g of G.gates) if (g.id === bz.id) { g.open = true; g.fade = 0; for (let y = 1; y <= 12; y++) G.room.g[y][g.x] = 0; } }
  if (G.room.def.id === 'kiln') makeProps();
  if (G.room.def.id === 'kiln' && G.bossDown) { G.kilnCool = 1; G.ledges = KILN_LEDGES.map(([x, y, w]) => ({ x, y, w, k:1, d:0, on:true })); for (const L of G.ledges) for (let j = 0; j < L.w; j++) G.room.g[L.y][L.x + j] = 3; }
  if (G.broken[i]) { for (const k of G.cracks) { const [cx, cy] = k.split(',').map(Number); G.room.g[cy][cx] = 0; } G.cracks.clear(); }
  if (spawn) { P.x = spawn.x; P.y = spawn.y; }
  P.vy = 0; P.safe = { x:P.x, y:P.y };
  $('tutHud').hidden = !G.room.def.tut;
  G.theme = THEMES[G.room.def.theme != null ? G.room.def.theme : i] || THEMES[0];
  buildTiles(); buildVeil(); buildBg(i);
  G.camLead = 0; G.cam.x = clamp(P.x + P.w / 2 - W / 2 + camBias(), 0, G.room.w * T - W);
  if (G.state !== 'title') {
    showBanner(G.room.def.name, G.room.def.note);
    if (G.room.def.id === 'drip') setTimeout(() => hint('dash', tip('Tap the dash button to cross the wide gaps. In the air, hold the stick down and slash to bounce off spines and moths.', 'Dash with Shift across the wide gaps. Down-slash in the air to bounce off spines and moths.'), 5200), 1800);
    if (G.room.def.id === 'cinder' && !G.bossDown) setTimeout(() => hint('boss', 'Watch its eyes. They flare red right before it moves.', 4200), 1500);
    if (G.room.def.id === 'burrows') setTimeout(() => hint('cocoon', 'Pale cocoons hold wax. Cut them open, but now and then a moth is still inside.', 4600), 2600);
  }
}
function finishTutorial() {
  try { localStorage.setItem('wf-tut', '1'); } catch (_) {}
  startFade(() => {
    resetPlayer(); P.hp = P.maxHp; P.wax = 0; G.time = 0; G.deaths = 0; G.cp = { room:FIRST }; G.hinted = {}; G.tipQ = []; G.bossFalls = {}; $('tipCard').hidden = true;
    loadRoom(FIRST, 'P'); setTimeout(() => toast('Lesson done. Rest at shrines to save your progress.', 3600), 2900);
  });
}
function startFade(cb) { if (G.fadeDir === 1) return; G.fadeDir = 1; G.fadeCb = cb; }
function pickChar(id) {
  id = heroId(id);
  if (!CHARS[id]) return;
  G.char = id; try { localStorage.setItem('wf-char', id); } catch (_) {}
  if (G.state === 'title') setOverlay('title');
}
function toTitle(menu) {
  leaveGallery(); G.finish = null;
  G.descend = null; G.iris = null; G.campFade = 1; G.campIn = true; G.homeFocus = 'menu'; bgmReset();
  releaseAll(); resetPlayer(); G.winT = 0; G.fade = 0; G.fadeDir = 0;
  G.state = 'title'; G.menu = menu || 'home'; if (G.menu === 'select') { G.menu = 'home'; G.homeFocus = 'party'; G.pv = null; } loadRoom(FIRST, 'P'); setOverlay('title'); setPauseLabels('Pause');
}
// 'select' is the hero close-up at camp: step one of Descend
function goMenu(m) { if (m === 'select') { G.menu = 'home'; G.homeFocus = 'party'; G.pv = null; if (!CH_PREVIEW) setTimeout(() => { if (G.state === 'title' && !G.descend) chapterPreviews(); }, 700); } else { G.menu = m; G.homeFocus = 'menu'; } setOverlay('title'); }
// the camp's command list; Party moves the cursor into the roster
const HOME_ITEMS = [
  { id:'descend', label:'Descend', help:() => 'Choose your hero, then a chapter.' },
  { id:'gallery', label:'Gallery', help:() => 'Try every move and boss attack on demand.' },
  { id:'rush', label:'Boss Rush', help:() => 'Every boss back to back on one health bar. Fall once and the rush ends.' },
  { id:'badges', label:'Badges', help:() => achCount() + ' of ' + BADGES.length + ' earned. Small goals, kept in this browser.' },
  { id:'chars', label:'Characters (Beta)', help:() => 'Every hero, foe and boss, animated live, with stats, tells and how to beat them.' },
  { id:'howto', label:'How to Play', help:() => 'Controls, Focus, skills and shrines.' }
];
const HERO_STATS = { wick:{ Speed:4, Reach:3, Power:2 }, knight:{ Speed:2, Reach:3, Power:4 }, hero:{ Speed:5, Reach:4, Power:5 } };
const HERO_LINE = { wick:'pin, wide slash', knight:'two-handed greatsword', hero:'cold-flame blade' };
function homeAct(i) {
  const it = HOME_ITEMS[i]; sfx('chime');
  if (it.id === 'descend') goMenu('select');
  else if (it.id === 'gallery') beginDescent('gallery');
  else if (it.id === 'rush') beginDescent('rush');
  else if (it.id === 'howto') goMenu('howto');
  else if (it.id === 'badges') goMenu('badges');
  else if (it.id === 'chars') { G.cs = G.cs || { id:ROSTER[0], anim:'idle' }; G.cs.t0 = performance.now(); goMenu('chars'); }
}
function homeMove(d) {
  if (G.homeFocus === 'party') { const o = ROSTER, k = o.indexOf(G.char); pickChar(o[(k + d + o.length) % o.length]); }
  else { G.homeIdx = ((G.homeIdx || 0) + d + HOME_ITEMS.length) % HOME_ITEMS.length; setOverlay('title'); }
  sfx('blip');
}
// modes: 'tut' (chapter 1 with the lesson), 'ch1', 'ch2'. Coins and skills belong to the chapter.
// ---------- Gallery: a sandbox for checking every hero move and boss attack
// Moves are played as short scripted key presses, so they run through exactly the same code as real play.
function enterGallery() {
  releaseAll(); resetPlayer(); P.maxHp = heroMaxHp(); P.hp = P.maxHp; P.wax = 99;
  G.chapter = 0; G.coins = 0; G.coinGot = {}; G.lit = {}; G.broken = {}; G.bossDown = false; G.time = 0; G.deaths = 0; G.cp = { room:GAL_ROOM }; G.hinted = { start:1, shrine:1 };
  G.skills = { bolt:true, dive:true, flare:true }; G.winT = 0; G.fade = 0; G.fadeDir = 0;
  G.gal = { macro:[], mt:0, wax:true, god:true, passive:true, min:false };
  G.state = 'play'; setOverlay(null); setPauseLabels('Pause'); syncSkillUI();
  loadRoom(GAL_ROOM, 'P'); buildGalPanel();
}
function leaveGallery() { G.gal = null; const el = $('galPanel'); el.hidden = true; el.innerHTML = ''; }
function galRun(steps) { G.gal.macro = steps.map(([t, f]) => ({ t, f })); G.gal.mt = 0; releaseAll(); }
const K = { p:a => () => press(a), r:a => () => release(a), all:() => releaseAll() };
const GAL_MOVES = {
  'Slash':[[0, K.p('attack')], [0.06, K.r('attack')]],
  'Up slash':[[0, K.p('up')], [0.02, K.p('attack')], [0.1, K.all]],
  'Down slash':[[0, K.p('jump')], [0.22, K.p('down')], [0.24, K.p('attack')], [0.34, K.all]],
  'Combo ×4':[[0, K.p('attack')], [0.05, K.r('attack')], [0.32, K.p('attack')], [0.37, K.r('attack')], [0.66, K.p('attack')], [0.71, K.r('attack')], [1.02, K.p('attack')], [1.07, K.r('attack')]],
  'Jump':[[0, K.p('jump')], [0.3, K.r('jump')]],
  'Dash':[[0, K.p('dash')], [0.05, K.r('dash')]],
  'Ember Bolt':[[0, K.p('skill')], [0.05, K.r('skill')]],
  'Wax Dive':[[0, K.p('jump')], [0.25, K.r('jump')], [0.3, K.p('down')], [0.32, K.p('skill')], [0.4, K.all]],
  'Flare Burst':[[0, K.p('up')], [0.02, K.p('skill')], [0.1, K.all]],
  'Focus':[[0, () => { P.hp = Math.max(1, P.maxHp - 1); P.wax = 99; }], [0.02, K.p('heal')], [1.3, K.r('heal')]],
  'Focus, hit':[[0, () => { P.hp = Math.max(1, P.maxHp - 1); P.wax = 99; }], [0.02, K.p('heal')], [0.5, () => { const g = G.gal.god; G.gal.god = false; P.inv = 0; hurtPlayer(1, P.x + P.w / 2 + P.face * 20); G.gal.god = g; }], [0.6, K.r('heal')]]
};
const GAL_BOSS = {
  warden:{ name:'Tallow Warden', moves:['leap', 'charge', 'drip'] },
  chandler:{ name:'Hanging Chandler', moves:['volley', 'call', 'wave', 'cross', 'ward', 'rain'] },
  wyrm:{ name:'Tallow Wyrm', moves:['quake', 'bite', 'spread', 'dive', 'stun'] },
  moth:{ name:'Cinder Moth', moves:['rain', 'sweep', 'call', 'stun'] }
};
function galSpawn(kind) {
  G.enemies = G.enemies.filter(e => !e.wickling); G.drops = []; G.waves = []; G.shots = []; G.cine = null;
  if (kind === 'warden') { G.boss = mkBoss(26 * T, 12 * T); G.boss.state = 'idle'; G.boss.t = 0.5; }
  else if (kind === 'chandler') { const B = G.boss = mkChandler(26 * T, 6 * T); B.state = 'hover'; B.y = B.ty = 13 * T - B.h - 6; B.wardCD = 99; }
  else if (kind === 'wyrm') { const B = G.boss = mkWyrm(24 * T); B.state = 'under'; B.atk = 1; }
  else if (kind === 'moth') { const B = G.boss = mkMoth(24 * T, MOTH_CRUISE); B.state = 'fly'; B.y = B.ty = MOTH_CRUISE; }
  else G.boss = null;
  buildGalPanel();
}
function galBoss(move) {
  const B = G.boss; if (!B || B.state === 'dead' || B.state === 'downed' || G.finish) return;
  const p2 = B.hp <= B.maxHp / 2;
  if (B.kind === 'wyrm') { if (move === 'stun') { if (B.state !== 'under') return; B.state = 'stun'; B.t = 3; B.rise = 1; return; } if (B.state !== 'under') return; wyrmStart(B, move); return; }
  if (B.kind === 'moth') { if (move === 'stun') { if (B.state !== 'fly') return; B.state = 'fall'; B.vy = 40; return; } if (B.state !== 'fly') return; mothStart(B, move); return; }
  if (B.kind === 'chandler') {
    if (move === 'ward') { startWard(B); return; }
    if (['tired', 'rise', 'fly', 'land', 'enrage', 'windup'].includes(B.state)) return;
    B.state = 'hover'; startChandler(B, move, p2);
  } else { if (B.state !== 'idle') return; B.next = move; B.state = 'windup'; B.t = p2 ? 0.36 : 0.52; }
}
function galEntrance() {
  const B = G.boss; if (!B) return;
  setDoor(false);
  if (B.kind === 'moth') { B.state = 'hatch'; B.t = 1.8; B.y = 13 * T - 40; showBanner('The Cinder Moth', 'It was always going to fly', true); sfx('mScreech'); return; }
  if (B.kind === 'chandler') { B.y = B.ty = T + 2; startBossCine(B, 'The Hanging Chandler', 'It never comes close'); }
  else if (B.kind === 'wyrm') { B.introBurst = false; B.hx = 20 * T; startBossCine(B, 'The Tallow Wyrm', 'It swims beneath the crust'); }
  else startBossCine(B, 'Tallow Warden', 'Keeper of the last flame');
  B.state = 'intro'; B.t = CINE_T;
  setTimeout(() => { if (G.gal) setDoor(false); }, 50);
}
function buildGalPanel() {
  const el = $('galPanel'); if (!G.gal) return;
  const g = G.gal, B = G.boss, bk = B ? B.kind || 'warden' : null;
  const btn = (attr, label, on) => `<button type="button" ${attr}${on ? ' class="on"' : ''}>${label}</button>`;
  el.classList.toggle('min', g.min);
  el.innerHTML = `<div class="top"><h4>Gallery</h4>${btn('data-g="min"', g.min ? 'Show' : 'Hide')}</div>
  <div class="gb"><h4>Hero</h4><div class="gr">${ROSTER.map(id => btn(`data-g="char" data-v="${id}"`, CHARS[id].name, G.char === id)).join('')}</div></div>
  <div class="gb"><h4>Moves</h4><div class="gr">${Object.keys(GAL_MOVES).map(m => btn(`data-g="move" data-v="${m}"`, m)).join('')}</div></div>
  <div class="gb"><h4>Options</h4><div class="gr">${btn('data-g="opt" data-v="wax"', 'Endless wax', g.wax)}${btn('data-g="opt" data-v="god"', 'No damage', g.god)}${btn('data-g="opt" data-v="passive"', 'Boss waits', g.passive)}${btn('data-g="dummy"', 'Add dummy')}</div></div>
  <div class="gb"><h4>Boss</h4><div class="gr">${btn('data-g="boss" data-v="warden"', 'Warden', bk === 'warden')}${btn('data-g="boss" data-v="chandler"', 'Chandler', bk === 'chandler')}${btn('data-g="boss" data-v="wyrm"', 'Wyrm', bk === 'wyrm')}${btn('data-g="boss" data-v="moth"', 'Moth', bk === 'moth')}${btn('data-g="boss" data-v="none"', 'None', !B)}</div></div>
  ${B ? `<div class="gb"><h4>${GAL_BOSS[bk].name}</h4><div class="gr">${GAL_BOSS[bk].moves.map(m => btn(`data-g="bmove" data-v="${m}"`, m)).join('')}${btn('data-g="entrance"', 'Entrance')}${btn('data-g="finish"', 'Down it')}${btn('data-g="p2"', 'Phase 2')}${btn('data-g="bheal"', 'Full HP')}</div></div>` : ''}`;
  el.hidden = G.state === 'paused';
}
document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('#galPanel [data-g]'); if (!b || !G.gal) return;
  e.preventDefault(); initAudio();
  const k = b.dataset.g, v = b.dataset.v;
  if (k === 'min') G.gal.min = !G.gal.min;
  if (k === 'char') { const keep = { x:P.x, y:P.y }; G.char = v; resetPlayer(); Object.assign(P, keep); P.maxHp = heroMaxHp(); P.hp = P.maxHp; P.wax = 99; }
  if (k === 'move') galRun(GAL_MOVES[v]);
  if (k === 'opt') G.gal[v] = !G.gal[v];
  if (k === 'dummy') G.enemies.push(mkDummy(Math.floor((P.x + P.face * 60) / T) * T, 12 * T, 'D', 'side'));
  if (k === 'boss') galSpawn(v);
  if (k === 'bmove') galBoss(v);
  if (k === 'entrance') galEntrance();
  if (k === 'finish' && G.boss && !G.finish && !['dead', 'downed', 'dormant', 'intro', 'pupa'].includes(G.boss.state)) { if (isKinBoss(G.boss)) G.boss.state = G.boss.kind === 'moth' ? 'stun' : 'stun'; G.boss.hp = 0; bossDie(); }
  if (k === 'p2' && G.boss) G.boss.hp = Math.min(G.boss.hp, Math.floor(G.boss.maxHp / 2));
  if (k === 'bheal' && G.boss) G.boss.hp = G.boss.maxHp;
  buildGalPanel(); b.blur();
});
['pointerdown', 'touchstart'].forEach(ev => document.addEventListener(ev, e => { if (e.target.closest && e.target.closest('#galPanel')) e.stopPropagation(); }, true));
function updateGallery(dt) {
  const g = G.gal; if (!g) return;
  if (g.wax) P.wax = 99;
  if (g.macro.length) { g.mt += dt; while (g.macro.length && g.macro[0].t <= g.mt) g.macro.shift().f(); }
  if (G.winT > 0) { G.winT = 0; }
  if ((!G.boss && g.lastBoss) || (G.boss && g.lastKind && G.boss.kind !== g.lastKind)) buildGalPanel();
  g.lastBoss = !!G.boss; g.lastKind = G.boss ? G.boss.kind : null;
}
const DESCEND_T = 1.2, IRIS_T = 0.85;
const CAM_BIAS = 480 * 0.06;   // the hero rests about 44% of the way across the screen
const camBias = () => (TOUCH && $('gameWrap').classList.contains('ov')) ? -480 * 0.02 : CAM_BIAS;   // with the touch stick on the left, about 52%
// start a run with a transition: from camp the camera pushes into the shrine flame and the view closes to black,
// then the stage opens in a widening circle around the hero
function beginDescent(mode) {
  if (G.descend) return;
  initAudio();
  if (G.state !== 'title') { startRun(mode); return; }
  G.descend = { t:0, mode }; overlay.hidden = true; overlay.innerHTML = ''; overlay.classList.remove('home'); sfx('descend');
}
function startRun(mode) {
  if (mode === 'ch1' && !storySeen && !LAB.on) { startStory(mode); return; }
  runStart(mode);
}
function runStart(mode) {
  if (mode.startsWith('fight:')) startPractice(mode.slice(6));
  else if (mode.startsWith('gallery:')) { enterGallery(); galSpawn(mode.slice(8)); }
  else if (mode === 'gallery') enterGallery(); else if (mode === 'duel') startUmbraDuel(); else if (mode === 'rush') startRush(); else newGame(mode);
  G.iris = { t:0 }; sfx('arrive'); bgmReset();
}
function newGame(mode) {
  leaveGallery();
  const tut = mode === 'tut', ch = mode === 'ch3' ? 3 : mode === 'ch2' ? 2 : 1, first = tut ? 0 : CHAPTERS[ch].first;
  releaseAll(); resetPlayer(); P.maxHp = heroMaxHp(); P.hp = P.maxHp; P.wax = 0;
  G.chapter = ch; G.coins = 0; G.coinGot = {}; G.lit = {}; G.broken = {};
  G.assisted = COMF.assist; G.bossHits0 = null; G.embersGot = {};
  G.bossDown = false; G.time = 0; G.deaths = 0; G.hits = 0; G.rankRes = null; G.duel = false; G.rush = null; G.cp = { room:first }; G.hinted = {}; G.tipQ = []; G.bossFalls = {}; $('tipCard').hidden = true; G.winT = 0; G.fade = 0; G.fadeDir = 0;
  G.skills = Object.assign({}, CHAPTERS[ch].skills); G.vig = 0; G.flash.t = 0; syncSkillUI();
  G.state = 'play'; setOverlay(null); setPauseLabels('Pause');
  loadRoom(first, 'P');
  if (!tut && !LAB.on) showBanner(CHAPTERS[ch].name, 'Chapter ' + ch + ' · ' + STORY_CH[ch]);
  if (ch === 3) { P.wax = 66; if (!LAB.on) setTimeout(() => !G.duel && toast(tip('You carry Ember Bolt and Wax Dive. Hold the stick down and tap spark to dive.', 'You carry Ember Bolt (E) and Wax Dive (↓ + E). Each costs 33 wax.'), 4600), 2700); }
  if (ch === 2) { P.wax = 66; setTimeout(() => toast(tip('Ember Bolt is ready: tap the spark button. It costs 33 wax, so slash foes to refill.', 'Ember Bolt is ready: press E. It costs 33 wax, so slash foes to refill.'), 4600), 2700); }
  if (tut) { P.hp = P.maxHp - 1; setTimeout(() => toast(tip('Pause anytime to skip the lesson.', 'Press P anytime to skip the lesson.'), 3000), 2800); }
  else if (ch === 1) setTimeout(() => hint('start', tip('Touch and drag on the left to move. Jump, slash and dash are on the right.', 'Move with the arrows, jump with Space, slash with X.'), 4200), 3000);
  if (TOUCH && !$('gameWrap').classList.contains('full')) {
    try { $('gameWrap').scrollIntoView({ block:'center', behavior:'smooth' }); } catch (_) {}
    if (window.innerHeight > window.innerWidth) setTimeout(() => hint('rotate', 'Tap the full screen button at the top right to play sideways.', 3600), 5600);
  }
}

// ---------- main step
function step(dt) {
  padTick();
  if (G.slowT > 0) { G.slowT -= dt; dt *= 0.4; }
  if (G.floatT > 0) { G.floatT -= dt; G.floatAge = (G.floatAge || 0) + dt; if ((P.grounded || P.dive) && G.floatAge > 0.15) G.floatT = 0; }
  if (G.fadeDir === 1) {
    G.fade += dt * 7; updateParticles(dt);
    if (G.fade >= 1) { G.fade = 1; G.fadeDir = -1; const cb = G.fadeCb; G.fadeCb = null; cb && cb(); }
    return;
  }
  if (G.fadeDir === -1) { G.fade -= dt * 4; if (G.fade <= 0) { G.fade = 0; G.fadeDir = 0; } }
  updateFx(G.hitstop > 0 ? dt * 0.35 : dt);
  if (G.hitstop > 0) { G.hitstop -= dt; return; }
  updateGallery(dt); // scripted gallery presses land before the player reads input
  if ((G.winT <= 0 || G.boss) && !(G.abyss && (G.abyss.in != null || G.abyss.crackIn != null))) G.time += dt;
  if (P.locked > 0) {
    P.locked -= dt;
    if (P.locked <= 0) startFade(() => { P.x = P.safe.x; P.y = P.safe.y; P.vx = 0; P.vy = 0; P.inv = Math.max(P.inv, RESPAWN_INV); });
  } else {
    if (G.cine || G.uent || (G.boss && G.boss.state === 'pupa' && G.boss.pt > 2.6)) { I.hit = {}; for (const k in I.down) I.down[k] = false; }
    if (G.abyss && (G.abyss.in != null || G.abyss.crackIn != null)) { I.hit = {}; for (const k in I.down) I.down[k] = false; }
    if (G.finish) updateFinish(dt); else updatePlayer(dt);
    updateAbyss(dt);
  }
  updateCine(dt); updateUmbraEntrance(dt);
  { const idle = P.grounded && Math.abs(P.vx) < 10 && !(P.atkT > 0) && !(P.healT > 0) && !P.sit && !P.dead && !P.dive; P.idleT = idle ? (P.idleT || 0) + dt : 0; }
  if (G.char === 'knight') updateKnightPose(dt);
  else if (G.char === 'hero') updateHeroPose(dt);
  updateSigns(dt); updateWorld();
  updateEnemies(dt); updateDrips(dt); if (!G.finish) updateBoss(dt); updateHazards(dt); updateWaxbits(dt); updateSecrets(dt); updateLedges(dt); updateProps(dt); updateFirePuffs(dt); updateSpells(dt); updateRelics(dt); updateCoins(dt); updateParticles(dt);
  if (G.shrine && G.nearShrine && !P.sit) hint('shrine', tip('Push the stick up at the shrine to rest.', 'Press ↑ at the shrine to rest.'), 3000);
  // the hero sits a little left of centre (the deep runs left to right); a slow look-ahead leans the view the way you are running,
  // so turning round never swings the camera, and the room's edges are the only thing that moves the hero off that spot
  const leadT = P.dead ? 0 : clamp(P.vx * 0.2, -26, 34);
  G.camLead = (G.camLead || 0) + (leadT - (G.camLead || 0)) * Math.min(1, dt * (Math.abs(leadT) > Math.abs(G.camLead || 0) ? 1.6 : 0.9));
  const look = G.camLead + camBias(), cb = G.cine && G.cine.B, fb = G.finish && G.finish.B, ub = G.uent && G.uent.B, tx = ub ? ub.x + ub.w / 2 - W / 2 : fb ? (P.x + P.w / 2 + fb.x + fb.w / 2) / 2 - W / 2 : cb && G.cine.t < CINE_T - 0.5 ? cb.x + cb.w / 2 - W / 2 - 60 : P.x + P.w / 2 - W / 2 + look; // the entrance pans to the boss
  const pb = G.boss && G.boss.state === 'pupa' && G.boss.pt > 2.4 ? G.boss : null;
  { const goal = pb ? pb.px - W / 2 : tx, d = goal - G.cam.x;   // follow harder the further the hero gets from their spot, so a dash never runs off screen
    G.cam.x += d * Math.min(1, dt * (pb ? 3 : 4 + Math.min(10, Math.abs(d) / 18))); }
  G.cam.x = clamp(G.cam.x, 0, G.room.w * T - W);
  { // the hatch pushes the camera in on the shell, then snaps out when the wings open
    let zt = 1; const pt = pb ? pb.pt : 0;
    const Fz = G.finish;
    if (Fz && !pb) { const fk = clamp(Math.min(Fz.t / 0.35, (Fz.def.dur - Fz.t) / 0.5), 0, 1); zt = 1 + 0.2 * fk + 0.08 * Fz.punch; G.zf = { x:(P.x + P.w / 2 + Fz.bcx) / 2, y:Fz.gy - 30 }; }
    if (pb) { zt = pt < 2.8 ? 1 : pt < 3.6 ? 1 + 0.25 * (pt - 2.8) / 0.8 : pt < 5.0 ? 1.25 + 0.1 * (pt - 3.6) / 1.4 : pt < 6.0 ? 1.35 + 0.4 * (pt - 5) : 1.75; G.zf = { x:pb.px, y:13 * T - 30 - (pt > 5.9 ? Math.min(16, (pt - 5.9) * 14) : 0) }; }
    G.zm = (G.zm || 1) + (zt - (G.zm || 1)) * Math.min(1, dt * (zt < (G.zm || 1) ? (pb ? 7 : 3.5) : (Fz ? 6 : 2.5)));
    if (G.uent) { G.zm = uentZoom(G.uent.t); G.zf = uentFocus(G.uent.B, G.zm); }
    G.lb = approach(G.lb || 0, pb && pt > 2.6 ? 1 : 0, dt * (pb ? 1.6 : 2.5));
    if (G.husk) { G.husk.t += dt; if (G.husk.t > 7) G.husk = null; }
    if (G.blk > 0) G.blk -= dt;
  }
  if (G.lastWords) { G.lastWords.t += dt; if (G.lastWords.t > 3.6) G.lastWords = null; }
  G.shake = Math.max(0, G.shake - dt * (G.shake > 9 ? 15 : 22));   // big shakes linger a little longer
  if (G.jolt || G.joltV) { G.joltV = (G.joltV || 0) + (-260 * (G.jolt || 0) - 16 * (G.joltV || 0)) * dt; G.jolt = (G.jolt || 0) + G.joltV * dt; if (Math.abs(G.jolt) < 0.05 && Math.abs(G.joltV) < 1) G.jolt = G.joltV = 0; }
  if (G.winT > 0) { G.winT -= dt; if (G.winT <= 0) { if (G.rush && !G.rush.ended) rushNext(); else { G.state = 'won'; setOverlay('won'); } } }
  tickTips(dt);
}

