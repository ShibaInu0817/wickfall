// ---------- input
const KEYMAP = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down',
  Space:'jump', KeyZ:'jump', KeyX:'attack', KeyJ:'attack', ShiftLeft:'dash', ShiftRight:'dash', KeyC:'dash', KeyK:'dash', KeyF:'heal', KeyV:'heal', KeyE:'skill', KeyL:'skill' };
const I = { down:{}, hit:{} };
function press(a) { if (!I.down[a]) I.hit[a] = true; I.down[a] = true; }
function release(a) { I.down[a] = false; }
function clearHits() { I.hit = {}; }
function releaseAll() { I.down = {}; I.hit = {}; document.querySelectorAll('.t.active').forEach(b => b.classList.remove('active')); padReset(); }
function padReset() {
  padId = null; padV = null; try { $('padzone').classList.remove('live'); } catch (_) {}
  for (const k in padDirs) { padDirs[k] = false; if (padEl) padEl.querySelector('.arr.' + k).classList.remove('on'); }
  if (nubEl) nubEl.style.transform = '';
  if (padEl) {
    padEl.classList.remove('live');
    if (PADREST) { padEl.style.left = PADREST.l; padEl.style.top = PADREST.t; padEl.style.bottom = 'auto'; }
    else { padEl.style.left = ''; padEl.style.top = ''; padEl.style.bottom = ''; }
  }
}
// keyboard or gamepad = "navigating": the selected button gets a bright ring. A tap or mouse click turns that off.
function navMode(on) { if (document.body.classList.contains('navmode') !== on) document.body.classList.toggle('navmode', on); }
window.addEventListener('pointerdown', e => { if (e.pointerType) navMode(false); }, true);
window.addEventListener('keydown', e => {
  navMode(true);
  { const sb = G.state === 'won' && overlay.querySelector('.sharebox'); if (sb) { if (e.code === 'Escape' || e.code === 'Backspace') { e.preventDefault(); sb.remove(); focusMenu(); } return; } }   // the score card keeps the keys while it is open
  if (G.story) { e.preventDefault(); if (!e.repeat) storyNext(e.code === 'Escape'); return; }
  if (G.descend) { e.preventDefault(); return; } // nothing interrupts the descent
  if (G.state === 'title' && (e.code === 'Escape' || e.code === 'Backspace')) { e.preventDefault(); if (G.menu === 'home' && G.homeFocus === 'party') goMenu('home'); else if (G.menu === 'chapter') goMenu('select'); else if (G.menu !== 'home') goMenu('home'); sfx('blip'); return; }
  if (e.code === 'KeyP' || e.code === 'Escape') { e.preventDefault(); if (!e.repeat) togglePause(); return; }
  if (e.code === 'KeyM') { if (!e.repeat) toggleMute(); return; }
  const a = KEYMAP[e.code];
  // plain menus: arrows walk the buttons, Enter presses the highlighted one
  const plain = (G.state === 'title' && (G.menu === 'chapter' || G.menu === 'howto' || G.menu === 'chars')) || G.state === 'paused' || G.state === 'won';
  if (plain && !overlay.hidden && (a === 'left' || a === 'right' || a === 'up' || a === 'down') && e.code.startsWith('Arrow')) { e.preventDefault(); initAudio(); menuNav(a); return; }
  if (plain && !overlay.hidden && (e.code === 'Enter' || e.code === 'Space') && menuFocused()) { e.preventDefault(); initAudio(); if (!e.repeat) menuFocused().click(); return; }
  if (G.state === 'title' && G.menu === 'chapter') {
    if (e.code === 'Enter' || a === 'jump' || a === 'attack') { e.preventDefault(); initAudio(); beginDescent(tutDone() ? 'ch1' : 'tut'); }
    else if (e.code === 'Digit1') { initAudio(); beginDescent('ch1'); } else if (e.code === 'Digit2') { initAudio(); beginDescent('ch2'); } else if (e.code === 'Digit3') { initAudio(); beginDescent('ch3'); } else if (e.code === 'KeyT') { initAudio(); beginDescent('tut'); }
    return;
  }
  if (G.state === 'title' && G.menu === 'home') {
    e.preventDefault(); initAudio();
    if (G.homeFocus === 'party') { if (a === 'left' || a === 'right') homeMove(a === 'left' ? -1 : 1); else if (e.code === 'Enter' || a === 'jump' || a === 'attack') { sfx('chime'); goMenu('chapter'); } return; }
    else if (a === 'up') homeMove(-1); else if (a === 'down') homeMove(1);
    else if (a === 'left' || a === 'right') { const o = ROSTER, k = o.indexOf(G.char); pickChar(o[(k + (a === 'left' ? o.length - 1 : 1)) % o.length]); sfx('blip'); }
    else if (e.code === 'Enter' || a === 'jump' || a === 'attack') homeAct(G.homeIdx || 0);
    return;
  }
  if (G.state === 'title' && G.menu !== 'select') { if (e.code === 'Enter' || a === 'jump' || a === 'attack') { e.preventDefault(); initAudio(); goMenu('chapter'); } return; }
  if (G.state === 'title' && (a === 'left' || a === 'right')) { e.preventDefault(); const order = ROSTER, n = order.length, i = Math.max(0, order.indexOf(G.char)); pickChar(order[(i + (a === 'left' ? n - 1 : 1)) % n]); return; }
  if (G.state === 'title' && (e.code === 'Enter' || a === 'jump' || a === 'attack')) { e.preventDefault(); initAudio(); goMenu('chapter'); return; }
  if (G.state === 'won' && e.code === 'Enter') { e.preventDefault(); beginDescent(G.rush ? (G.rush.practice ? 'fight:' + G.rush.practice : 'rush') : G.duel ? 'duel' : 'ch' + Math.min(3, (G.chapter || 1) + 1)); return; }
  if (!a) return;
  e.preventDefault(); if (e.repeat) return; initAudio(); press(a);
});
window.addEventListener('keyup', e => { const a = KEYMAP[e.code]; if (a) release(a); });
window.addEventListener('blur', () => { releaseAll(); if (G.state === 'play' && !LAB.on) togglePause(); }); // the lab keeps playing while you use its panel
document.addEventListener('visibilitychange', () => { if (document.hidden) { releaseAll(); if (G.state === 'play') togglePause(); } });

// action buttons: each finger is tracked on its own, so Jump + Slash + Dash can be held together.
// Slash can also be aimed by swiping on it: a flick up or down within 60 ms makes it an up- or down-slash.
const SWIPE_MS = 60, SWIPE_PX = 10;
document.querySelectorAll('#touch [data-act]').forEach(btn => {
  const act = btn.dataset.act; let sw = null;
  const fire = dir => { if (!sw) return; clearTimeout(sw.tm); if (dir) { sw.dir = dir; press(dir); } press(act); sw.fired = true; };
  btn.addEventListener('pointerdown', e => {
    e.preventDefault(); initAudio(); try { btn.setPointerCapture(e.pointerId); } catch (_) {}
    btn.classList.add('active'); buzz(8);
    if (G.state === 'title') return; // menus are driven by their own buttons
    if (act !== 'attack') { press(act); return; }
    sw = { y0:toLocal(btn, e.clientX, e.clientY).y, dir:null, fired:false, tm:0 }; sw.tm = setTimeout(() => fire(null), SWIPE_MS);
  });
  if (act === 'attack') btn.addEventListener('pointermove', e => {
    if (!sw || sw.fired) return; const dy = toLocal(btn, e.clientX, e.clientY).y - sw.y0;
    if (Math.abs(dy) > SWIPE_PX) fire(dy < 0 ? 'up' : 'down');
  });
  const up = () => {
    btn.classList.remove('active');
    if (sw) { if (!sw.fired) fire(null); if (sw.dir && !padDirs[sw.dir]) release(sw.dir); sw = null; }
    release(act);
  };
  btn.addEventListener('pointerup', up); btn.addEventListener('pointercancel', up); btn.addEventListener('lostpointercapture', up);
  btn.addEventListener('contextmenu', e => e.preventDefault());
});

// movement stick: in landscape the stick appears wherever the thumb lands on the left side, and follows if dragged far
padEl = $('pad'); nubEl = $('nub');
const zoneEl = $('padzone');
let padO = { x:0, y:0 };
const isRot = () => $('gameWrap').classList.contains('rot');
function toLocal(el, cx, cy) {
  const r = el.getBoundingClientRect();
  return isRot() ? { x:cy - r.top, y:r.right - cx } : { x:cx - r.left, y:cy - r.top };
}
function setPadDir(k, v) {
  if (padDirs[k] === v) return; padDirs[k] = v;
  if (v) press(k); else release(k);
  padEl.querySelector('.arr.' + k).classList.toggle('on', v);
}
function clampO() {
  const R = padEl.offsetWidth / 2, zw = zoneEl.offsetWidth, zh = zoneEl.offsetHeight;
  padO.x = clamp(padO.x, R, Math.max(R, zw - R)); padO.y = clamp(padO.y, R, Math.max(R, zh - R));
}
function placePad() { const R = padEl.offsetWidth / 2; padEl.style.left = (padO.x - R) + 'px'; padEl.style.top = (padO.y - R) + 'px'; padEl.style.bottom = 'auto'; }
function padMove(p) {
  const R = padEl.offsetWidth / 2, max = R * 0.55;
  let dx = p.x - padO.x, dy = p.y - padO.y, d = Math.hypot(dx, dy) || 1;
  if (d > R * 1.1) { const s = (d - R * 1.1) / d; padO.x += dx * s; padO.y += dy * s; clampO(); placePad(); dx = p.x - padO.x; dy = p.y - padO.y; d = Math.hypot(dx, dy) || 1; }
  const k = d > max ? max / d : 1;
  nubEl.style.transform = `translate(calc(-50% + ${dx * k}px), calc(-50% + ${dy * k}px))`;
  padV = { dx, dy, R }; padDirsFrom(padV);
}
// on the ground up/down need a clear push; in the air a shallow push is enough, so a down-slash works while drifting sideways
function padDirsFrom(v) {
  const dead = v.R * 0.2, ax = Math.abs(v.dx), ay = Math.abs(v.dy), air = !P.grounded;
  setPadDir('left', v.dx < -dead); setPadDir('right', v.dx > dead);
  setPadDir('up', v.dy < -dead * (air ? 1 : 1.2) && ay > ax * (air ? 0.5 : 0.7));
  setPadDir('down', v.dy > dead * (air ? 1 : 1.2) && ay > ax * (air ? 0.36 : 0.7));
}
let padV = null;
function padTick() { if (padId !== null && padV) padDirsFrom(padV); }
zoneEl.addEventListener('pointerdown', e => {
  e.preventDefault(); initAudio();
  if (G.state === 'title') return;
  if (padId !== null) return;
  padId = e.pointerId; try { zoneEl.setPointerCapture(e.pointerId); } catch (_) {}
  const p = toLocal(zoneEl, e.clientX, e.clientY);
  padO = { x:p.x, y:p.y }; clampO(); placePad(); padEl.classList.add('live'); zoneEl.classList.add('live');
  padMove(p);
});
zoneEl.addEventListener('pointermove', e => { if (e.pointerId === padId) padMove(toLocal(zoneEl, e.clientX, e.clientY)); });
const padEnd = e => { if (e.pointerId === padId) { for (const k in padDirs) setPadDir(k, false); padReset(); } };
zoneEl.addEventListener('pointerup', padEnd); zoneEl.addEventListener('pointercancel', padEnd); zoneEl.addEventListener('lostpointercapture', padEnd);
zoneEl.addEventListener('contextmenu', e => e.preventDefault());

document.querySelectorAll('#touch [data-ui]').forEach(b => b.addEventListener('click', e => {
  initAudio(); e.currentTarget.blur();
  if (EDIT) return;
  if (b.dataset.ui === 'pause') togglePause();
  else if (b.dataset.ui === 'cfg') openEditor();
  else toggleFullscreen();
}));
document.querySelectorAll('#touch [data-act], #padzone').forEach(el => el.addEventListener('touchstart', e => e.preventDefault(), { passive:false }));
window.addEventListener('touchstart', () => {
  TOUCH = true; $('touch').classList.add('on'); layout();
  if (autoFull && !document.fullscreenElement) { try { const de = document.documentElement; if (de.requestFullscreen) de.requestFullscreen({ navigationUI:'hide' }).then(() => { realFs = true; setTimeout(layout, 150); }).catch(() => {}); } catch (_) {} }
}, { once:true, passive:true });
cv.addEventListener('pointerdown', () => { initAudio(); });

let padPrev = {};
function pollPad() {
  const pads = navigator.getGamepads ? navigator.getGamepads() : null; if (!pads) return;
  let p = null; for (const x of pads) if (x) { p = x; break; } if (!p) return;
  const b = i => !!(p.buttons[i] && p.buttons[i].pressed), ax = p.axes[0] || 0, ay = p.axes[1] || 0;
  const s = { left:ax < -0.4 || b(14), right:ax > 0.4 || b(15), up:ay < -0.5 || b(12), down:ay > 0.5 || b(13),
    jump:b(0), attack:b(2), dash:b(5) || b(7) || b(4) || b(6), heal:b(1), skill:b(3), pause:b(9) };
  const inMenu = (G.state === 'title' && G.menu !== 'home') || G.state === 'paused' || G.state === 'won';
  for (const k in s) {
    if (s[k] && !padPrev[k]) {
      navMode(true);
      const sb = overlay.querySelector('.sharebox');
      if (sb && k === 'heal') { sb.remove(); focusMenu(); }
      else if (sb && (k === 'left' || k === 'right' || k === 'up' || k === 'down')) { const bs = [...sb.querySelectorAll('button')], i = bs.indexOf(document.activeElement); const nb = bs[(i + (k === 'left' || k === 'up' ? bs.length - 1 : 1)) % bs.length] || bs[0]; if (nb) nb.focus({ preventScroll:true }); }
      else if (sb && (k === 'jump' || k === 'attack')) { const f = document.activeElement; if (f && sb.contains(f)) f.click(); }
      else if (k === 'pause') togglePause();
      else if (G.state === 'title' && G.menu === 'home' && G.homeFocus !== 'party' && (k === 'up' || k === 'down')) homeMove(k === 'up' ? -1 : 1);
      else if (inMenu && G.menu !== 'select' && (k === 'up' || k === 'down' || ((k === 'left' || k === 'right') && G.menu !== 'home'))) menuNav(k);
      else if (inMenu && G.menu !== 'select' && (k === 'jump' || k === 'attack') && menuFocused()) menuFocused().click();
      else if (G.state === 'title' && (k === 'jump' || k === 'attack')) { initAudio(); if (G.menu === 'chapter') beginDescent(tutDone() ? 'ch1' : 'tut'); else if (G.menu === 'home') { if (G.homeFocus === 'party') goMenu('chapter'); else homeAct(G.homeIdx || 0); } else goMenu('chapter'); }
      else if (G.state === 'title' && (k === 'left' || k === 'right') && (G.menu === 'select' || G.menu === 'home')) { const order = ROSTER, n = order.length, i = Math.max(0, order.indexOf(G.char)); pickChar(order[(i + (k === 'left' ? n - 1 : 1)) % n]); }
      else if (G.state === 'title' && k === 'heal' && (G.menu !== 'home' || G.homeFocus === 'party')) goMenu(G.menu === 'chapter' ? 'select' : 'home');
      else press(k);
    } else if (!s[k] && padPrev[k] && k !== 'pause') release(k);
  }
  padPrev = s;
}

const ICON = {
  pause:'<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>',
  play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5l11 7-11 7z"/></svg>',
  fs:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></svg>',
  fsExit:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5"/></svg>',
  cfg:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h9M19 7h1M4 17h3M13 17h7"/><circle cx="16" cy="7" r="2.5"/><circle cx="10" cy="17" r="2.5"/></svg>'
};
document.querySelectorAll('[data-ui="cfg"]').forEach(b => b.innerHTML = ICON.cfg);
function setPauseLabels(t) {
  $('pauseBtn').textContent = t;
  document.querySelectorAll('[data-ui="pause"]').forEach(b => { b.innerHTML = t === 'Pause' ? ICON.pause : ICON.play; b.setAttribute('aria-label', t); });
}
document.querySelectorAll('[data-ui="fs"]').forEach(b => b.innerHTML = ICON.fs);
setPauseLabels('Pause');
function togglePause() {
  if (G.state === 'play') { G.state = 'paused'; setOverlay('paused'); setPauseLabels('Resume'); }
  else if (G.state === 'paused') { G.state = 'play'; setOverlay(null); releaseAll(); setPauseLabels('Pause'); }
}
// full screen always plays landscape: lock orientation when the browser allows it, otherwise rotate the game 90°
let realFs = false;
// sizing lives in CSS; this only switches the control layout, using the same orientation test the CSS uses
const mqPortrait = window.matchMedia ? matchMedia('(orientation: portrait)') : { matches:false };
// Which way is the phone itself held? (The artifact frame can be any shape, so ask the device, not the frame.)
function devicePortrait() {
  try { if (screen.orientation && screen.orientation.type) return screen.orientation.type.indexOf('portrait') === 0; } catch (_) {}
  if (typeof window.orientation === 'number') return window.orientation % 180 === 0;
  return (screen.height || 0) >= (screen.width || 0);
}
function stageScale() {
  const st = $('stage'); if (!st || !st.getBoundingClientRect) return;
  const w = st.getBoundingClientRect().width || 0; if (w) st.style.fontSize = Math.max(9, Math.min(44, w / 57)) + 'px';
}
try { new ResizeObserver(stageScale).observe($('stage')); } catch (_) {}
function layout() {
  const g = $('gameWrap'), gin = $('gin'), full = g.classList.contains('full');
  const fw = window.innerWidth, fh0 = window.innerHeight;
  cv.style.width = ''; cv.style.height = '';
  if (full) {
    // Size from the phone's real screen so the game is never squeezed into a short frame.
    const sw = screen.width || fw, sh = screen.height || fh0;
    const long = Math.max(sw, sh), short = Math.min(sw, sh);
    const rot = TOUCH && devicePortrait();
    const fh = rot ? Math.max(fh0, Math.min(Math.round(fw * 480 / 272), long))
                   : Math.max(fh0, Math.min(Math.round(fw * 272 / 480), TOUCH ? short : fh0));
    g.style.width = fw + 'px'; g.style.height = fh + 'px';
    if (rot) { gin.style.width = fh + 'px'; gin.style.height = fw + 'px'; gin.style.transform = `translateX(${fw}px) rotate(90deg)`; }
    else { gin.style.width = fw + 'px'; gin.style.height = fh + 'px'; gin.style.transform = ''; }
    // the stage is fitted to the game's exact shape and centred, so the menus, HUD and text sit on the picture, not on the black bars
    { const aw = rot ? fh : fw, ah = rot ? fw : fh, k = Math.min(aw / W, ah / H), sw2 = Math.floor(W * k), sh2 = Math.floor(H * k), st = cv.parentElement; if (st && st.style)
      st.style.left = Math.floor((aw - sw2) / 2) + 'px'; st.style.top = Math.floor((ah - sh2) / 2) + 'px'; st.style.width = sw2 + 'px'; st.style.height = sh2 + 'px'; st.style.right = 'auto'; st.style.bottom = 'auto'; }
    g.classList.toggle('rot', rot);
    const lock = fh <= fh0 + 2 ? 'hidden' : '';
    document.documentElement.style.overflow = lock; document.body.style.overflow = lock;
    try { window.scrollTo(0, 0); } catch (_) {}
  } else {
    g.style.width = ''; g.style.height = ''; gin.style.width = ''; gin.style.height = ''; gin.style.transform = '';
    { const st = cv.parentElement; if (st && st.style) st.style.left = st.style.top = st.style.width = st.style.height = st.style.right = st.style.bottom = ''; }
    g.classList.remove('rot');
    document.documentElement.style.overflow = ''; document.body.style.overflow = '';
  }
  g.classList.toggle('ov', full || (TOUCH && !mqPortrait.matches));
  if (autoFullCheck()) return;
  applyLayout(); stageScale();
  if (EDIT) syncEditor();
}

// phones always play full screen (held upright, the game turns sideways); the full-screen button only hides the browser's bars.
let autoFull = false;
const isPhone = () => TOUCH && Math.min(window.innerWidth, window.innerHeight) <= 560;
function autoFullCheck() {
  let lab = false; try { lab = LAB.on; } catch (_) {}
  if (lab || EDIT) return false;
  const full = $('gameWrap').classList.contains('full');
  if (isPhone() && !full) { autoFull = true; setFull(true); return true; }
  return false;
}
// the notch and rounded corners: controls are kept inside the safe area
function safeInsets() {
  let el = document.querySelector('.safeprobe'); if (!el) { el = document.createElement('div'); el.className = 'safeprobe'; document.body.appendChild(el); }
  const cs = getComputedStyle(el), n = v => parseFloat(v) || 0;
  return { t:n(cs.paddingTop), r:n(cs.paddingRight), b:n(cs.paddingBottom), l:n(cs.paddingLeft) };
}

// ---------- button layout (saved per viewer on this device)
const CTL_BASE = { stick:150, jump:84, attack:84, dash:64, heal:58, skill:58, bar:40 };
const CTL_NAME = { stick:'Movement stick', jump:'Jump', attack:'Slash', dash:'Dash', heal:'Focus', skill:'Skill', bar:'Menu buttons' };
const LAYOUT_V = 2;
const DEF_LAYOUT = () => ({ v:LAYOUT_V, s:1, o:0.45, ctl:{
  stick:{ x:0.13, y:0.74, s:1 }, jump:{ x:0.915, y:0.78, s:1 }, attack:{ x:0.80, y:0.83, s:1 },
  dash:{ x:0.925, y:0.50, s:1 }, heal:{ x:0.815, y:0.555, s:1 }, skill:{ x:0.72, y:0.64, s:1 }, bar:{ x:0.92, y:0.10, s:1 } } });
let LAYOUT = DEF_LAYOUT();
try {
  const j = JSON.parse(localStorage.getItem('wf-layout') || 'null');
  if (j && j.ctl && j.v === LAYOUT_V) { const d = DEF_LAYOUT(); LAYOUT = { v:LAYOUT_V, s:+j.s || 1, o:+j.o || 0.45, ctl:Object.assign(d.ctl, j.ctl) }; }   // older layouts give way to the new default
} catch (_) {}
function saveLayout() { try { localStorage.setItem('wf-layout', JSON.stringify(LAYOUT)); } catch (_) {} }
function ctlEl(k) { return k === 'stick' ? $('padzone') : k === 'bar' ? document.querySelector('#touch .topbar') : document.querySelector(`#touch [data-ctl="${k}"]`); }
function applyLayout() {
  const g = $('gameWrap'), tEl = $('touch'), ov = g.classList.contains('ov');
  g.style.setProperty('--ks', String(LAYOUT.s));
  tEl.style.setProperty('--cop', String(LAYOUT.o));
  const keys = Object.keys(CTL_BASE);
  if (!ov) {
    for (const k of keys) { const el = ctlEl(k); el.style.left = ''; el.style.top = ''; el.style.width = ''; el.style.height = ''; el.style.removeProperty('--ib'); }
    padEl.style.width = ''; padEl.style.height = ''; PADREST = null;
    if (padId === null) padReset();
    return;
  }
  const W = tEl.clientWidth, H = tEl.clientHeight; if (!W || !H) return;
  const si = g.classList.contains('rot') ? { t:0, r:0, b:0, l:0 } : safeInsets();
  for (const k of keys) {
    const c = LAYOUT.ctl[k], el = ctlEl(k), sz = Math.round(CTL_BASE[k] * c.s * LAYOUT.s);
    if (k === 'bar') {
      el.style.setProperty('--ib', sz + 'px');
      const bw = el.offsetWidth, bh = el.offsetHeight;
      const cx = clamp(c.x * W, si.l + bw / 2 + 4, W - si.r - bw / 2 - 4), cy = clamp(c.y * H, si.t + bh / 2 + 4, H - si.b - bh / 2 - 4);
      el.style.left = (cx - bw / 2) + 'px'; el.style.top = (cy - bh / 2) + 'px';
      continue;
    }
    const cx = clamp(c.x * W, si.l + sz / 2 + 4, W - si.r - sz / 2 - 4), cy = clamp(c.y * H, si.t + sz / 2 + 4, H - si.b - sz / 2 - 4);
    if (k === 'stick') {
      padEl.style.width = sz + 'px'; padEl.style.height = sz + 'px';
      // in play the whole left half catches the thumb (below the top strip), and the stick appears wherever it lands
      let zl, zt, zw, zh;
      if (EDIT) { zw = zh = sz; zl = clamp(cx - zw / 2, 0, Math.max(0, W - zw)); zt = clamp(cy - zh / 2, 0, Math.max(0, H - zh)); }
      else { zl = si.l; zt = Math.round(H * 0.16); zw = Math.max(sz, Math.round(W * 0.5) - si.l); zh = H - zt - si.b; }
      el.style.left = zl + 'px'; el.style.top = zt + 'px'; el.style.width = zw + 'px'; el.style.height = zh + 'px';
      PADREST = { l:(cx - zl - sz / 2) + 'px', t:(cy - zt - sz / 2) + 'px' };
      if (padId === null) padReset();
      continue;
    }
    el.style.width = sz + 'px'; el.style.height = sz + 'px';
    el.style.left = (cx - sz / 2) + 'px'; el.style.top = (cy - sz / 2) + 'px';
  }
}

// ---------- layout editor
let edSel = null, edPrev = 'paused', drag = null;
const edEl = $('editor'), touchEl = $('touch');
function markSel() { document.querySelectorAll('#touch [data-ctl]').forEach(el => el.classList.toggle('sel', el.dataset.ctl === edSel)); }
function syncEditor() {
  const ov = $('gameWrap').classList.contains('ov');
  if (!ov) edSel = null;
  $('edTitle').textContent = edSel ? CTL_NAME[edSel] : 'All buttons';
  $('edHint').textContent = !ov ? 'Turn your phone sideways or use full screen to move buttons. Size and opacity work here.'
    : edSel ? 'Drag to move it. The size slider now changes only this button.' : 'Drag any button to move it. Tap one to resize just that button.';
  const s = edSel ? LAYOUT.ctl[edSel].s : LAYOUT.s;
  $('edSize').value = Math.round(s * 100); $('edSizeV').textContent = Math.round(s * 100) + '%';
  $('edOp').value = Math.round(LAYOUT.o * 100); $('edOpV').textContent = Math.round(LAYOUT.o * 100) + '%';
  $('edAll').hidden = !edSel;
  markSel();
}
function openEditor() {
  if (EDIT) return;
  edPrev = G.state; G.state = 'editing'; setOverlay(null); releaseAll();
  EDIT = true; touchEl.classList.add('editing'); edEl.hidden = false; edSel = null;
  applyLayout(); syncEditor();
}
function closeEditor() {
  EDIT = false; drag = null; touchEl.classList.remove('editing'); edEl.hidden = true; edSel = null; markSel();
  saveLayout(); applyLayout();
  const back = edPrev === 'title' ? 'title' : edPrev === 'won' ? 'won' : 'paused';
  G.state = back; setOverlay(back); setPauseLabels(back === 'paused' ? 'Resume' : 'Pause');
}
touchEl.addEventListener('pointerdown', e => {
  if (!EDIT) return;
  e.preventDefault(); e.stopPropagation();
  const t = e.target.closest('[data-ctl]'); if (!t) return;
  if (!$('gameWrap').classList.contains('ov')) return;
  edSel = t.dataset.ctl; syncEditor();
  const p = toLocal(touchEl, e.clientX, e.clientY), c = LAYOUT.ctl[edSel], W = touchEl.clientWidth, H = touchEl.clientHeight;
  drag = { id:e.pointerId, k:edSel, ox:p.x - c.x * W, oy:p.y - c.y * H };
  try { t.setPointerCapture(e.pointerId); } catch (_) {}
}, true);
touchEl.addEventListener('pointermove', e => {
  if (!EDIT || !drag || e.pointerId !== drag.id) return;
  e.stopPropagation();
  const p = toLocal(touchEl, e.clientX, e.clientY), W = touchEl.clientWidth, H = touchEl.clientHeight, c = LAYOUT.ctl[drag.k];
  c.x = clamp((p.x - drag.ox) / W, 0, 1); c.y = clamp((p.y - drag.oy) / H, 0, 1);
  applyLayout();
}, true);
const dragEnd = e => { if (drag && e.pointerId === drag.id) { drag = null; saveLayout(); } if (EDIT) e.stopPropagation(); };
touchEl.addEventListener('pointerup', dragEnd, true); touchEl.addEventListener('pointercancel', dragEnd, true);
$('edSize').addEventListener('input', e => {
  const v = +e.target.value / 100;
  if (edSel) LAYOUT.ctl[edSel].s = v; else LAYOUT.s = v;
  $('edSizeV').textContent = Math.round(v * 100) + '%'; applyLayout(); saveLayout();
});
$('edOp').addEventListener('input', e => { LAYOUT.o = +e.target.value / 100; $('edOpV').textContent = e.target.value + '%'; applyLayout(); saveLayout(); });
$('edAll').addEventListener('click', () => { edSel = null; syncEditor(); });
$('edReset').addEventListener('click', () => { LAYOUT = DEF_LAYOUT(); edSel = null; saveLayout(); applyLayout(); syncEditor(); toast('Buttons reset to the default layout.', 2000); });
$('edDone').addEventListener('click', closeEditor);
try { screen.orientation && screen.orientation.addEventListener && screen.orientation.addEventListener('change', () => setTimeout(layout, 150)); } catch (_) {}
try { mqPortrait.addEventListener ? mqPortrait.addEventListener('change', layout) : mqPortrait.addListener(layout); } catch (_) {}
function setFull(on) {
  const g = $('gameWrap');
  g.classList.toggle('full', on);
  document.body.classList.toggle('full-on', on);
  document.documentElement.style.overflow = on ? 'hidden' : ''; document.body.style.overflow = on ? 'hidden' : '';
  $('fsBtn').textContent = on ? 'Exit full screen' : 'Full screen';
  fsIcons(); releaseAll(); layout();
}
// on phones the game is always full screen, so the button shows whether the browser's own bars are hidden
function fsIcons() {
  const on = $('gameWrap').classList.contains('full') && (!isPhone() || !!document.fullscreenElement);
  document.querySelectorAll('[data-ui="fs"]').forEach(b => { b.innerHTML = on ? ICON.fsExit : ICON.fs; b.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen'); });
}
function toggleFullscreen() {
  if ($('gameWrap').classList.contains('full') && (!isPhone() || document.fullscreenElement)) {
    if (!isPhone()) { autoFull = false; setFull(false); }
    try { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); } catch (_) {}
    try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (_) {}
    return;
  }
  setFull(true);
  try {
    const de = document.documentElement;
    if (de.requestFullscreen) de.requestFullscreen({ navigationUI:'hide' }).then(() => {
      realFs = true;
      try { screen.orientation && screen.orientation.lock && screen.orientation.lock('landscape').then(() => setTimeout(layout, 150)).catch(() => {}); } catch (_) {}
      setTimeout(layout, 150);
    }).catch(() => {});
  } catch (_) {}
}
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && realFs) { realFs = false; if ($('gameWrap').classList.contains('full') && !isPhone()) setFull(false); }
  fsIcons(); setTimeout(layout, 60);
});
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', () => setTimeout(layout, 150));
function toggleMute() { muted = !muted; $('muteBtn').textContent = muted ? 'Sound off' : 'Sound on'; updateBgm(); }
$('pauseBtn').addEventListener('click', e => { togglePause(); e.currentTarget.blur(); });
$('muteBtn').addEventListener('click', e => { initAudio(); toggleMute(); e.currentTarget.blur(); });
$('fsBtn').addEventListener('click', e => { e.currentTarget.blur(); toggleFullscreen(); });

