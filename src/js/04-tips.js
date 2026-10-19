// ---------- tips: a big panel that pauses the game and plays the move as a short scene drawn by the game itself
// Used only where players get stuck (brazier, wax floor, the Kiln Pit bosses on a retry) and for each new skill.
const TIPS = {
  brazier:{ head:'Light the brazier', move:'bolt', text:'Shoot the cold brazier to open the gate.' },
  crack1:{ head:'Dive through soft wax', move:'dive', text:'Stand on the white wax and dive through it.' },
  wyrm:{ head:'Stun the Wyrm', move:'dive', text:'Jump above its raised head and dive onto the wax cap to stun it.' },
  moth:{ head:'Bring the Moth down', move:'dive', text:'Get above it and dive onto its waxy back to bring it down.' }
};
// keycaps from a skill's input labels: '↓ + E' / 'Stick down + spark'
const tipKeys = s => s.split(' + ').map(k => `<span class="kc">${k.replace(/^Stick (down|up)$/i, (_, d) => 'STICK ' + (d.toLowerCase() === 'down' ? '↓' : '↑')).toUpperCase()}</span>`).join('+');
function tipHtml(id) {
  const sk = id.startsWith('skill:') && SK[id.slice(6)], t = sk ? null : TIPS[id], m = SK[sk ? id.slice(6) : t.move];
  const keys = tipKeys(TOUCH ? m.input.t : m.input.k);
  return `<div class="box${sk ? ' skill' : ''}"${sk ? ` style="--sk:${sk.col}"` : ''}>
    <div class="pic"><canvas width="480" height="272" aria-hidden="true"></canvas></div>
    <div class="body"><span class="tag">${sk ? 'New skill' : 'Tip'}</span><span class="head">${sk ? sk.name : t.head}</span>
      <span class="keys${TOUCH ? ' tk' : ''}">${keys}${sk ? '' : `<span>${m.name}</span>`}</span>
      <span class="txt">${sk ? sk.desc() : t.text}</span>${sk ? '<span class="cost">Costs 33 wax.</span>' : ''}
      <span class="cont">${TOUCH ? 'Tap to continue' : '<span class="kc">Space</span> Got it'}</span></div></div>`;
}
// once per run; waits (delay in seconds, then for a calm moment) before it pauses the game
function showTip(id, delay) {
  if (G.hinted[id] || G.gal || LAB.on || window.UW_NOTIPS) return;   // UW_NOTIPS: the bot tests run without them
  G.hinted[id] = true; (G.tipQ = G.tipQ || []).push({ id, t:delay || 0 });
}
function tickTips(dt) {
  const q = G.tipQ; if (!q || !q.length) return;
  q[0].t -= dt;
  if (q[0].t > 0 || G.cine || G.uent || P.dead || P.locked > 0 || G.fadeDir !== 0 || G.story) return;
  const el = $('tipCard'); G.tipId = q.shift().id; TIPSC = null; G.state = 'tip'; el.innerHTML = tipHtml(G.tipId); el.hidden = false; sfx('blip');
}
function closeTip() {
  if (G.state !== 'tip') return;
  $('tipCard').hidden = true; G.state = 'play'; TIPSC = null; releaseAll();  // the press that closed it is not a jump or slash
}
try { $('tipCard').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); closeTip(); }); } catch (_) {}

// ---- the scene: a 240x136 stage (drawn 2x into the 480x272 canvas) whose floor is the world floor, 13 tiles down
// The hero is always Wick, whoever you play; the real P with its own saved pose; the props are the real draw calls (drawGates, drawWyrm, drawMoth, drawSpells, drawFx).
const TFY = 13 * T, TTOP = TFY - 116;
let TIPSC = null;
const tLerp = (a, b, u) => a + (b - a) * u;
// a jump from (x0, foot f0) to (x1, f1) between times t0 and t1, h px above the straight line at its middle
function tArc(c, t0, t1, x0, x1, f0, f1, h) {
  const u = clamp((c - t0) / (t1 - t0), 0, 1), d = t1 - t0;
  return { x:tLerp(x0, x1, u), f:tLerp(f0, f1, u) - h * 4 * u * (1 - u), vx:(x1 - x0) / d, vy:((f1 - f0) - h * 4 * (1 - 2 * u)) / d };
}
function tPut(x, foot, vx, vy, gr, face) { P.x = x - P.w / 2; P.y = foot - P.h; P.vx = vx || 0; P.vy = vy || 0; P.grounded = !!gr; if (face) P.face = face; }
function tFloor(pal, gaps) {
  const g = ctx; g.fillStyle = pal[0]; g.fillRect(0, TFY, 240, 40);
  g.fillStyle = pal[1]; g.fillRect(0, TFY, 240, 1);
  for (const [a, b] of gaps || []) { g.fillStyle = '#050608'; g.fillRect(a, TFY, b - a, 40); }
}
function tDummy(x, hit) {   // the straw practice dummy from the party preview
  const g = ctx, rock = Math.sin(hit * 30) * hit * 0.6;
  g.save(); g.translate(x, TFY); g.rotate(rock); g.fillStyle = '#5a4126'; g.fillRect(-1, -22, 2, 22); g.fillStyle = hit > 0.15 ? '#fff1c1' : '#b08a4e'; g.fillRect(-5, -20, 10, 12); g.fillStyle = '#8a6a38'; g.fillRect(-5, -14, 10, 1); g.fillRect(-7, -18, 14, 2); g.fillStyle = '#c9a25e'; g.fillRect(-3, -26, 6, 6); g.restore();
}
const tWaxHit = (x, y) => { burst(x, y, 22, { spd:190, life:0.6, colors:[C.wax, C.waxHi, C.core], size:2, g:300, ang:-Math.PI / 2, spread:1.4 }); G.fx.push({ k:'ring', x, y, t:0.4, max:0.4, r:56, c:'239,227,194' }); G.spells.push({ k:'quake', x, y, life:0.4, max:0.4 }); };
const tBolt = () => G.spells.push({ k:'bolt', x:P.x + P.w, y:P.y, w:22, h:12, vx:300, life:2, t:0 });
const KILN = ['#1a0c08', '#5a2410'];
// each scene: L = loop length; run(S, c, hit, dt) poses the hero and props for loop time c; hit(t) is true on the frame that crosses t
const TIP_SCENES = {
  brazier:{ L:3.2, floor:['#141e28', '#2a4258'], init:S => { G.braziers = [S.bz = { x:178, y:TFY - 8, lit:false, t:0, key:'tip' }]; G.gates = [S.gate = { x:14, open:false, fade:0, id:'tip' }]; },
    run(S, c, hit, dt) {
      tPut(60, TFY, 0, 0, true, 1); if (hit(0.6)) tBolt();
      for (const s of G.spells) if (s.k === 'bolt' && s.x + s.w >= S.bz.x - 6 && !S.bz.lit) { s.life = 0; S.bz.lit = true; burst(S.bz.x, S.bz.y - 4, 24, { spd:120, life:0.7, colors:[C.flame, C.ember, C.core], size:2, g:-100 }); G.fx.push({ k:'ring', x:S.bz.x, y:S.bz.y, t:0.4, max:0.4, r:30, c:'242,165,65' }); S.openAt = c + 0.35; }
      if (S.openAt && c >= S.openAt && !S.gate.open) { S.gate.open = true; S.gate.fade = 1; }
      if (S.gate.open) S.gate.fade = Math.max(0, S.gate.fade - dt * 1.6);
    } },
  crack1:{ L:2.4, floor:['#1e1410', '#4a3020'], init:S => { G.cracks = new Set(['6,13', '7,13', '8,13']); },
    run(S, c, hit, dt) {
      if (c < 0.5) tPut(tLerp(50, 120, c / 0.5), TFY, 140, 0, true, 1);
      else if (c < 0.8) { const a = tArc(c, 0.5, 0.8, 120, 120, TFY, TFY - 28, 6); tPut(a.x, a.f, 0, a.vy, false); }
      else { const f = Math.min(TFY + 60, TFY - 28 + (c - 0.8) * 560); tPut(120, f, 0, 560, false); }
      if (hit(0.85)) { G.cracks = new Set(); tWaxHit(120, TFY); }
    } },
  wyrm:{ L:3.6, floor:KILN, init:S => { S.B = Object.assign(mkWyrm(160), { state:'under', rise:1, headUp:30, face:-1, cap:1 }); },
    run(S, c, hit, dt) {
      const B = S.B, hx = 156, cap = TFY - 30 - 16; B.anim = c;
      if (c < 0.4) tPut(50, TFY, 0, 0, true, 1);
      else if (c < 1.2) { const a = tArc(c, 0.4, 1.2, 50, hx, TFY, cap - 34, 22); tPut(a.x, a.f, a.vx, a.vy, false); }
      else if (c < 1.26) tPut(hx, tLerp(cap - 34, cap, (c - 1.2) / 0.06), 0, 560, false);
      else if (c < 1.9) { const a = tArc(c, 1.26, 1.9, hx, 92, cap, TFY, 30); tPut(a.x, a.f, a.vx, a.vy, false, -1); }
      else tPut(92, TFY, 0, 0, true, 1);
      if (hit(1.26)) { B.state = 'stun'; B.cap = 0; tWaxHit(hx, cap); }
    } },
  moth:{ L:3.6, floor:KILN, init:S => { S.B = Object.assign(mkMoth(160, TFY - 62), { state:'fly', face:-1, cap:1 }); S.B.x = 136; S.B.y = TFY - 62; },
    run(S, c, hit, dt) {
      const B = S.B, ledge = TFY - 70, back = TFY - 62; B.anim = c; B.wph = c * 7;
      ctx.fillStyle = KILN[0]; ctx.fillRect(0, ledge, 64, 8); ctx.fillStyle = KILN[1]; ctx.fillRect(0, ledge, 64, 1);
      if (c < 0.4) tPut(36, ledge, 0, 0, true, 1);
      else if (c < 1.1) { const a = tArc(c, 0.4, 1.1, 36, 160, ledge, back - 30, 16); tPut(a.x, a.f, a.vx, a.vy, false); }
      else if (c < 1.15) tPut(160, tLerp(back - 30, back, (c - 1.1) / 0.05), 0, 560, false);
      else if (c < 1.85) { const a = tArc(c, 1.15, 1.85, 160, 112, back, TFY, 28); tPut(a.x, a.f, a.vx, a.vy, false, -1); }
      else tPut(112, TFY, 0, 0, true, 1);
      if (hit(1.15)) { B.state = 'fall'; B.cap = 0; tWaxHit(160, back); }
      if (B.state === 'fall') { B.y = Math.min(TFY - 24, B.y + 140 * dt); if (B.y >= TFY - 24) B.state = 'stun'; }
    } },
  bolt:{ L:2.4, floor:['#141e28', '#2a4258'], init:S => { S.d = [{ x:140, hit:0 }, { x:196, hit:0 }]; },
    run(S, c, hit, dt) {
      tPut(44, TFY, 0, 0, true, 1); if (hit(0.5)) tBolt();
      for (const d of S.d) { d.hit = Math.max(0, d.hit - dt); for (const s of G.spells) if (s.k === 'bolt' && !d.done && s.x + s.w >= d.x) { d.done = true; d.hit = 0.3; burst(d.x, TFY - 14, 12, { spd:120, life:0.4, colors:[C.flame, C.core, C.ember], size:2, g:100 }); } tDummy(d.x, d.hit); }
    } },
  dive:{ L:2.2, floor:['#1e1410', '#4a3020'],
    run(S, c, hit, dt) {
      if (c < 0.4) tPut(120, TFY, 0, 0, true, 1);
      else if (c < 0.75) { const a = tArc(c, 0.4, 0.75, 120, 120, TFY, TFY - 44, 8); tPut(a.x, a.f, 0, a.vy, false); }
      else if (c < 0.83) tPut(120, tLerp(TFY - 44, TFY, (c - 0.75) / 0.08), 0, 560, false);
      else tPut(120, TFY, 0, 0, true);
      if (hit(0.83)) { G.spells.push({ k:'quake', x:120, y:TFY, life:0.4, max:0.4 }); burst(120, TFY - 2, 24, { spd:200, life:0.5, colors:[C.wax, C.eye, C.core], size:2, g:250, ang:-Math.PI / 2, spread:1.5 }); }
    } },
  flare:{ L:1.8, floor:['#141e28', '#2a4258'],
    run(S, c, hit, dt) {
      tPut(120, TFY, 0, 0, true, 1);
      if (hit(0.4)) { G.spells.push({ k:'flare', x:P.x + P.w / 2 - 20, y:P.y - 58, w:40, h:62, life:0.42, max:0.42 }); burst(120, TFY - 20, 18, { spd:150, life:0.6, colors:[C.flame, C.ember, C.core], size:2, g:-120, ang:-Math.PI / 2, spread:0.6 }); }
    } }
};
function drawTipScene(t, dt) {
  const cv = document.querySelector('#tipCard canvas'); if (!cv || !G.tipId) return;
  const kind = G.tipId.startsWith('skill:') ? G.tipId.slice(6) : G.tipId, sc = TIP_SCENES[kind]; if (!sc) return;
  const saveP = Object.assign({}, P), save = { ctx, muted, parts:G.parts, fx:G.fx, spells:G.spells, enemies:G.enemies, boss:G.boss, cam:G.cam.x, cine:G.cine, flash:Object.assign({}, G.flash),
    shake:G.shake, hitstop:G.hitstop, cracks:G.cracks, braziers:G.braziers, gates:G.gates, skills:G.skills, char:G.char };
  try {
    muted = true; G.char = 'wick'; G.enemies = []; G.boss = null; G.cam.x = 0; G.cine = null; G.skills = {}; G.flash = Object.assign({}, save.flash, { t:0 });
    let S = TIPSC;
    const fresh = () => { resetPlayer(); return { kind, t:0, p:Object.assign({}, P, { pose:{ lean:0, crouch:0, stride:0, hip:0, hop:0 }, atkHit:new Set() }), parts:[], fx:[], spells:[], cracks:new Set(), braziers:[], gates:[] }; };
    if (!S || S.kind !== kind) S = TIPSC = fresh();
    const c0 = S.t % sc.L; S.t += dt; let c1 = S.t % sc.L;
    if (c1 < c0) { const p = S.p; S = TIPSC = fresh(); S.p = p; S.t = c1; }   // each loop starts the props over
    G.parts = S.parts; G.fx = S.fx; G.spells = S.spells; G.cracks = S.cracks; G.braziers = S.braziers; G.gates = S.gates;
    if (!S.ready) { S.ready = true; if (sc.init) sc.init(S); S.cracks = G.cracks; S.braziers = G.braziers; S.gates = G.gates; }
    Object.assign(P, S.p);
    const g = cv.getContext('2d'); ctx = g;
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.fillStyle = '#0a0b10'; g.fillRect(0, 0, cv.width, cv.height);
    g.setTransform(2, 0, 0, 2, 0, -TTOP * 2);
    const gl = g.createRadialGradient(120, TFY - 50, 0, 120, TFY - 50, 140); gl.addColorStop(0, 'rgba(242,165,65,.10)'); gl.addColorStop(1, 'rgba(242,165,65,0)'); g.fillStyle = gl; g.fillRect(0, TTOP, 240, 136);
    tFloor(sc.floor, kind === 'crack1' && !G.cracks.size ? [[96, 144]] : null);
    sc.run(S, c1, at => c0 < at && c1 >= at, dt);
    S.cracks = G.cracks;
    P.dead = false; P.inv = 0; P.sit = false; P.hurtT = 0; P.healT = 0; P.atkT = 0; P.anim += dt; P.idleT = P.grounded && !P.vx ? (P.idleT || 0) + dt : 0;
    for (const s of G.spells) { s.life -= dt; if (s.k === 'bolt') { s.x += s.vx * dt; s.t += dt; for (let i = 0; i < 2; i++) G.parts.push({ x:s.x + s.w / 2 - rand(4, 12), y:s.y + rand(2, 10), vx:-s.vx * rand(0.05, 0.2), vy:rand(-30, 15), life:rand(0.2, 0.4), max:0.4, c:[C.core, C.flame, C.ember][(Math.random() * 3) | 0], s:2, g:0 }); } }
    S.spells = G.spells = G.spells.filter(s => s.life > 0 && s.x < 300);
    updateParticles(dt); updateFx(dt);
    drawGates(0, t);
    if (S.B) S.B.kind === 'wyrm' ? drawWyrm(0, t, S.B) : drawMoth(0, t, S.B);
    if (P.y < TTOP + 136) drawPlayer(0, t);
    drawSpells(0, t);
    for (const q of G.parts) { g.globalAlpha = clamp(q.life / q.max, 0, 1); g.fillStyle = q.c; g.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s); }
    g.globalAlpha = 1; drawFx(0); g.setTransform(1, 0, 0, 1, 0, 0);
    S.p = Object.assign({}, P); S.parts = G.parts; S.fx = G.fx;
  } catch (e) { console.error(e); }
  finally {
    Object.assign(P, saveP); ctx = save.ctx; muted = save.muted; G.parts = save.parts; G.fx = save.fx; G.spells = save.spells; G.enemies = save.enemies; G.boss = save.boss; G.cam.x = save.cam; G.cine = save.cine;
    G.flash = save.flash; G.shake = save.shake; G.hitstop = save.hitstop; G.cracks = save.cracks; G.braziers = save.braziers; G.gates = save.gates; G.skills = save.skills; G.char = save.char;
  }
}
