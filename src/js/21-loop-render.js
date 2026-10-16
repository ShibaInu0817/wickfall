// ---------- loop
let last = performance.now(), acc = 0; const STEP = 1 / 120;
// hero-select previews: each card keeps its own copy of the player state; the game's own drawing code renders it
const cardSt = {};
function drawCardHeroes(t, dt) {
  const els = overlay.querySelectorAll('canvas.hc'); if (!els.length) return;
  const saveP = Object.assign({}, P), save = { char:G.char, ctx, shake:G.shake, parts:G.parts, fx:G.fx, muted, hitstop:G.hitstop, flash:Object.assign({}, G.flash) };
  try {
    muted = true; G.parts = []; G.fx = [];
    for (const c of els) {
      const id = c.dataset.char, sel = id === save.char;
      let st = cardSt[id];
      if (!st) { resetPlayer(); st = cardSt[id] = { p:Object.assign({}, P, { pose:{ lean:0, crouch:0, stride:0, hip:0, hop:0 }, atkHit:new Set() }), next:1 + Math.random() * 2, n:0 }; }
      Object.assign(P, st.p);
      G.char = id; P.x = 15; P.y = 21; P.vx = 0; P.vy = 0; P.grounded = true; P.face = 1; P.dead = false; P.inv = 0; P.sit = false; P.hurtT = 0; P.healT = 0;
      P.anim += dt; P.atkT -= dt; P.idleT = P.atkT > 0 ? 0 : (P.idleT || 0) + dt;
      // the chosen hero practises a swing every couple of seconds
      st.next -= dt;
      if (sel && st.next <= 0 && P.atkT <= 0) {
        st.n = st.n % 3 + 1; st.next = 2.4; P.atkDir = 'side'; P.atkHit = new Set();
        if (id === 'knight') { const sw = knightSwing('side', st.n, false); Object.assign(P, { swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:false, combo:st.n, fin:false }); }
        else if (id === 'hero') { const sw = heroSwing('side', st.n, false); Object.assign(P, { swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:0, hWin:-1, combo:st.n, fin:false }); }
        else { P.atkT = id === 'snuff' ? SN.dur : 0.2; P.alt = !P.alt; P.fin = false; }
      }
      if (id === 'knight') updateKnightPose(dt); else if (id === 'hero') updateHeroPose(dt);
      const g = c.getContext('2d'); ctx = g;
      g.clearRect(0, 0, c.width, c.height);
      const glow = g.createRadialGradient(20, 26, 0, 20, 26, 22), col = id === 'hero' ? '143,216,255' : '242,165,65';
      glow.addColorStop(0, `rgba(${col},${sel ? 0.3 : 0.14})`); glow.addColorStop(1, `rgba(${col},0)`); g.fillStyle = glow; g.fillRect(0, 0, c.width, c.height);
      g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(11, 35, 18, 2);
      // two-frame breathing bob, like a pixel-art idle
      g.save();
      drawPlayer(0, t);
      g.restore();
      st.p = Object.assign({}, P);
    }
  } catch (_) {}
  finally {
    Object.assign(P, saveP); G.char = save.char; ctx = save.ctx; G.shake = save.shake; G.parts = save.parts; G.fx = save.fx; muted = save.muted; G.hitstop = save.hitstop; G.flash = save.flash;
  }
}
const PV_MOVES = {
  wick:[['side', 1, 'Slash'], ['side', 1, 'Slash'], ['up', 1, 'Up-slash']],
  snuff:[['side', 1, 'Sweep'], ['side', 2, 'Back-sweep'], ['up', 1, 'Up-sweep']],
  knight:[['side', 1, 'Forehand'], ['side', 2, 'Backhand'], ['side', 3, 'Rising cut'], ['up', 1, 'Overhead']],
  hero:[['side', 1, 'Draw cut'], ['side', 2, 'Rising crescent'], ['side', 3, 'Frost cross'], ['up', 1, 'Sky cut']]
};
function drawPartyPreview(t, dt) {
  const c = overlay.querySelector('canvas.pv'); if (!c) return;
  const id = G.char, saveP = Object.assign({}, P), save = { ctx, shake:G.shake, parts:G.parts, fx:G.fx, muted, hitstop:G.hitstop, flash:Object.assign({}, G.flash) };
  try {
    muted = true; G.parts = []; G.fx = [];
    if (!G.pv || G.pv.id !== id) { resetPlayer(); G.pv = { id, p:Object.assign({}, P, { pose:{ lean:0, crouch:0, stride:0, hip:0, hop:0 }, atkHit:new Set() }), i:-1, wait:0.5, hit:0, label:'' }; }
    const pv = G.pv; Object.assign(P, pv.p);
    P.x = 28; P.y = 36 - P.h; P.vx = 0; P.vy = 0; P.grounded = true; P.face = 1; P.dead = false; P.inv = 0; P.sit = false; P.hurtT = 0; P.healT = 0;
    P.anim += dt; P.atkT -= dt; P.idleT = P.atkT > 0 ? 0 : (P.idleT || 0) + dt;
    if (P.atkT <= 0) {
      pv.wait -= dt;
      if (pv.wait <= 0) {
        const list = PV_MOVES[id]; pv.i = (pv.i + 1) % list.length; const [dir, n, name] = list[pv.i];
        P.atkDir = dir; P.atkHit = new Set(); P.combo = n; P.fin = false;
        if (id === 'knight') { const sw = knightSwing(dir, n, false); Object.assign(P, { swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:false }); }
        else if (id === 'hero') { const sw = heroSwing(dir, n, false) || heroSwing('side', 1, false); Object.assign(P, { swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:0, hWin:-1 }); }
        else { P.atkT = id === 'snuff' ? SN.dur : 0.2; P.alt = id === 'snuff' && n === 2; }
        pv.wait = pv.i === list.length - 1 ? 1.1 : 0.28; pv.label = name; if (dir === 'side') pv.hit = 0.3;
        const l = document.getElementById('pvl'); if (l) l.textContent = name;
      }
    }
    if (id === 'knight') updateKnightPose(dt); else if (id === 'hero') updateHeroPose(dt);
    const g = c.getContext('2d'); ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, c.width, c.height); g.setTransform(2, 0, 0, 2, 0, 0);
    const col = id === 'hero' ? '143,216,255' : '242,165,65', gl = g.createRadialGradient(34, 32, 0, 34, 32, 40);
    gl.addColorStop(0, `rgba(${col},.22)`); gl.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gl; g.fillRect(0, 0, c.width, c.height);
    g.fillStyle = '#1a2a24'; g.fillRect(0, 36, 100, 8); g.fillStyle = '#2f4a3c'; g.fillRect(0, 36, 100, 1);
    // a straw practice dummy that rocks when a side swing lands
    pv.hit = Math.max(0, pv.hit - dt); const rock = Math.sin(pv.hit * 30) * pv.hit * 0.6, dx = 58 + Math.round((CHARS[id].reach - 1) * 20);
    g.save(); g.translate(dx, 36); g.rotate(rock); g.fillStyle = '#5a4126'; g.fillRect(-1, -22, 2, 22); g.fillStyle = '#b08a4e'; g.fillRect(-5, -20, 10, 12); g.fillStyle = '#8a6a38'; g.fillRect(-5, -14, 10, 1); g.fillRect(-7, -18, 14, 2); g.fillStyle = '#c9a25e'; g.fillRect(-3, -26, 6, 6); g.restore();
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(P.x - 2, 36, P.w + 4, 2);
    drawPlayer(0, t); g.setTransform(1, 0, 0, 1, 0, 0);
    pv.p = Object.assign({}, P);
  } catch (_) {}
  finally { Object.assign(P, saveP); ctx = save.ctx; G.shake = save.shake; G.parts = save.parts; G.fx = save.fx; muted = save.muted; G.hitstop = save.hitstop; G.flash = save.flash; }
}
// arrow keys move between the buttons of any plain menu (chapter, how-to, pause, results)
function menuNav(dir) {
  const bs = [...overlay.querySelectorAll('button:not([disabled])')].filter(b => b.offsetParent !== null); if (!bs.length) return;
  const cur = document.activeElement && bs.includes(document.activeElement) ? document.activeElement : null;
  if (!cur) { (overlay.querySelector('.btn.primary') || bs[0]).focus({ preventScroll:true }); sfx('blip'); return; }
  const r0 = cur.getBoundingClientRect(), cx = r0.left + r0.width / 2, cy = r0.top + r0.height / 2;
  const v = { left:[-1, 0], right:[1, 0], up:[0, -1], down:[0, 1] }[dir];
  let best = null, bs2 = 1e9;
  for (const b of bs) { if (b === cur) continue; const r = b.getBoundingClientRect(), dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
    const along = dx * v[0] + dy * v[1], side = Math.abs(dx * v[1] - dy * v[0]); if (along <= 2 || side > along * 1.6) continue; const sc = along + side * 2.2; if (sc < bs2) { bs2 = sc; best = b; } }
  if (!best) return;
  best.focus({ preventScroll:true }); sfx('blip');
}
function menuFocused() { const f = document.activeElement; return f && overlay.contains(f) && f.tagName === 'BUTTON' ? f : null; }
