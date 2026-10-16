// ---------- Wick Hero (Coldflame): blade of cold blue fire, sheathed draw cuts, the Severance finisher
// The beginner-friendly hero: big damage, long reach, 9 embers, double wax gain, invulnerable during its big moves.
const HBLADE = 17;
function heroSwing(dir, n, fin) {
  if (dir === 'up') return { a0:0.3, a1:-2.9, d:0.3, wE:0.24, sE:0.42, dmg:3, gash:-1.4 };
  if (dir === 'down') return { a0:-0.4, a1:2.9, d:0.28, wE:0.2, sE:0.4, dmg:3, gash:1.4 };
  if (fin) return { sev:true, d:1.1, wE:0.12, sE:0.19, dmg:0 };
  return [null,
    { iai:true, a0:2.75, a1:-0.25, d:0.34, wE:0.28, sE:0.37, dmg:3, gash:0.08 },
    { a0:2.3, a1:-2.4, d:0.38, wE:0.24, sE:0.42, dmg:3, gash:-1.1 },
    { cross:true, d:0.5, wins:[[0.2, 0.34], [0.48, 0.62]], dmg:2, gash:[0.75, -0.75] }][n];
}
function heroWindow(sw, pp) {
  if (sw.sev) return -1;
  if (sw.wins) { for (let i = 0; i < sw.wins.length; i++) if (pp >= sw.wins[i][0] + 0.03 && pp <= sw.wins[i][1] + 0.06) return i; return -1; }
  return pp >= sw.wE + (sw.sE - sw.wE) * 0.3 && pp <= sw.sE + 0.08 ? 0 : -1;
}
function hlens(x0, y0, x1, y1, w, col) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, mx = x0 + dx * 0.42, my = y0 + dy * 0.42;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x0, y0);
  ctx.quadraticCurveTo(mx + nx * w, my + ny * w, x1, y1); ctx.quadraticCurveTo(mx - nx * w * 0.3, my - ny * w * 0.3, x0, y0); ctx.fill();
}
function heroFrostSmear(ox, oy, a0, aCur, R, fade) {
  const range = aCur - a0; if (Math.abs(range) < 0.06 || fade <= 0) return;
  const start = a0 + range * (0.1 + (1 - fade) * 0.85);
  knCrescent(ox, oy, R + 2.5, start, aCur, 0.7, `rgba(120,200,255,${0.32 * fade})`);
  knCrescent(ox, oy, R + 1, start, aCur, 0.45, `rgba(160,220,255,${0.72 * fade})`);
  knCrescent(ox, oy, R, start, aCur, 0.28, `rgba(255,255,255,${0.95 * fade})`);
  ctx.strokeStyle = `rgba(255,255,255,${0.6 * fade})`; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.arc(ox, oy, R + 1.8, start, aCur, aCur < start); ctx.stroke();
}
// Severance reaches a sphere just ahead of Wick Hero: bigger than a slash, far smaller than the screen
const SEV_R = 58;
function sevCenter() { return { x:P.x + P.w / 2 + P.face * 30, y:P.y + P.h / 2 - 6 }; }
function heroInArea() {
  const c = G.sev ? { x:G.sev.cx, y:G.sev.cy } : sevCenter();
  return spellTargets().filter(e => Math.hypot(e.x + e.w / 2 - c.x, e.y + e.h / 2 - c.y) <= SEV_R + Math.max(e.w, e.h) / 2);
}
function heroHitAll(dmg, big) {
  for (const e of heroInArea()) {
    hitEnemy(e, dmg, { hero:true, sev:true, combo:!big, dir:(e.x + e.w / 2) < P.x + P.w / 2 ? -1 : 1, x:e.x + e.w / 2 + rand(-4, 4), y:e.y + e.h / 2 + rand(-4, 4) });
    if (big) for (let i = 0; i < 10; i++) { const a = rand(0, TAU), sp = rand(50, 140);
      G.fx.push({ k:'shard', x:e.x + e.w / 2, y:e.y + e.h / 2, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 30, rot:rand(0, TAU), vr:rand(-20, 20), s:rand(1.5, 3.5), t:0.7, max:0.7 }); }
  }
}
function updateHeroPose(dt) {
  const Q = P.pose, T = { lean:0, crouch:0, stride:0, hop:0 };
  let ang;
  P.smear = null; P.heroIai = null; P.sheathing = null;
  if (P.sheathT > 0) P.sheathT -= dt;
  if (P.atkT > 0 && P.swing && !P.dead) {
    const sw = P.swing, p = 1 - P.atkT / P.atkDur, air = !P.grounded;
    P.sheathed = false; P.bladeVis = 1;
    if (sw.sev) {
      if (p >= 0.3 && p < 0.8) P.sheathing = kseg(p, 0.3, 0.8); // the blade is carried back and slid home into the saya
      // one flick, then a slow sheathe while cuts fill the screen; the click lands them all
      const fl = kseg(p, 0.12, 0.19), sl = kseg(p, 0.3, 0.8);
      ang = p < 0.12 ? klerp(P.swFrom, 2.75, keo(kseg(p, 0, 0.12))) : p < 0.19 ? klerp(2.75, -0.45, keo(fl)) : p < 0.3 ? -0.45 : p < 0.8 ? klerp(-0.45, 2.75, sl * sl * (3 - 2 * sl)) : 2.75;
      P.sheathed = p < 0.12 || p >= 0.8; P.bladeVis = p >= 0.3 && p < 0.8 ? 1 - Math.pow(sl, 4) : 1;
      T.crouch = air ? 0.5 : p < 0.12 ? 1.6 : p < 0.3 ? 2.4 : klerp(2.4, 0.6, sl);
      T.lean = p < 0.12 ? -0.8 : p < 0.3 ? 3.5 : klerp(3.5, -0.4, sl);
      T.stride = air ? 0 : p < 0.12 ? 1 : p < 0.3 ? 3.5 : klerp(3.5, 0.8, sl);
      if (p >= 0.12 && p < 0.34) P.smear = { a0:2.3, a:ang, fade:p < 0.22 ? 1 : 1 - (p - 0.22) / 0.12 };
      P.inv = Math.max(P.inv, 0.1);
      const S = G.sev;
      if (S) {
        S.p = p;
        // each cut appears with a tiny slice tick
        while (S.next < S.cuts.length && p >= S.cuts[S.next].at) { S.next++; if (S.next % 3 === 0) sfx('hTick'); }
        for (let i = 0; i < S.hits.length; i++) if (!S.done[i] && p >= S.hits[i]) {
          S.done[i] = true;
          const last = i === S.hits.length - 1;
          if (!last) { heroHitAll(1, false); G.hitstop = Math.max(G.hitstop, 0.05); G.shake = Math.max(G.shake, 2); }
          else { P.sheathT = 0.25; heroHitAll(5, true); sfx('hClick'); sfx('hShatter'); G.hitstop = Math.max(G.hitstop, 0.2); G.shake = Math.max(G.shake, 9); screenFlash(0.6, 0.2, '220,240,255'); S.flashAll = 0.32; }
        }
      }
    } else if (sw.cross) {
      const w1 = kseg(p, 0, 0.2), s1 = kseg(p, 0.2, 0.32), w2 = kseg(p, 0.42, 0.48), s2 = kseg(p, 0.48, 0.6), fo = kseg(p, 0.6, 1);
      ang = p < 0.2 ? klerp(P.swFrom, -2.3, keo(w1)) : p < 0.32 ? klerp(-2.3, 1.25, keo(s1)) : p < 0.42 ? 1.25 : p < 0.48 ? klerp(1.25, 1.5, w2) : p < 0.6 ? klerp(1.5, -1.9, keo(s2)) : klerp(-1.9, -1.4, fo);
      T.lean = p < 0.2 ? -1.2 * w1 : p < 0.32 ? klerp(-1.2, 3.5, keo(s1)) : p < 0.48 ? klerp(3.5, 0.5, kseg(p, 0.32, 0.48)) : p < 0.6 ? klerp(0.5, 3, keo(s2)) : klerp(3, 0.8, fo);
      T.crouch = air ? 0.5 : p < 0.2 ? w1 : p < 0.32 ? 1 + 1.5 * keo(s1) : p < 0.48 ? 2 : p < 0.6 ? 2.3 : klerp(2.3, 0.5, fo);
      T.stride = air ? 0 : p < 0.2 ? 0 : p < 0.6 ? 3 : klerp(3, 1, fo);
      if (p >= 0.2 && p < 0.44) P.smear = { a0:-2.3, a:ang, fade:p < 0.34 ? 1 : 1 - (p - 0.34) / 0.1 };
      if (p >= 0.48 && p < 0.75) P.smear = { a0:1.5, a:ang, fade:p < 0.62 ? 1 : 1 - (p - 0.62) / 0.13 };
      if ((!P.struck && p >= 0.2) || (P.struck === 1 && p >= 0.48)) { P.struck = P.struck ? 2 : 1; sfx('hSwing'); G.shake = Math.max(G.shake, 1.6); }
    } else {
      const w = kseg(p, 0, sw.wE), st = kseg(p, sw.wE, sw.sE), fo = kseg(p, sw.sE, 0.9);
      const dir = Math.sign(sw.a1 - sw.a0), pull = sw.iai ? 2.75 : sw.a0 - dir * 0.4, over = sw.a1 + dir * 0.12;
      ang = p < sw.wE ? klerp(P.swFrom, pull, keo(w)) : p < sw.sE ? klerp(pull, over, keo(st)) : klerp(over, sw.a1, keo(fo));
      if (sw.iai) P.sheathed = p < sw.wE;
      T.lean = p < sw.wE ? (sw.iai ? -0.6 : -1.5) * keo(w) : p < sw.sE ? klerp(-1.5, 3.5, keo(st)) : klerp(3.5, 1, keo(fo));
      T.crouch = air ? 0.5 : p < sw.wE ? (sw.iai ? 2.2 : 1.2) * w : p < sw.sE ? 2.5 : klerp(2.5, 0.6, keo(fo));
      T.stride = air ? 0 : p < sw.wE ? 0 : p < sw.sE ? 3.5 : klerp(3.5, 1.2, keo(fo));
      if (p >= sw.wE && p < 0.92) P.smear = { a0:sw.iai ? 2.4 : pull, a:ang, fade:p < sw.sE + 0.08 ? 1 : Math.max(0, 1 - (p - sw.sE - 0.08) / 0.3) };
      if (sw.iai && p >= sw.wE && p < 0.75) P.heroIai = { fade:p < 0.45 ? 1 : 1 - (p - 0.45) / 0.3 };
      if (!P.struck && p >= sw.wE) { P.struck = 1; sfx('hSwing'); G.shake = Math.max(G.shake, 1.6); }
      if (sw.iai && p >= sw.wE) P.inv = Math.max(P.inv, P.atkT + 0.2); // untouchable from the draw until just after the swing ends
    }
    // frost drifts off the fading smear
    if (P.smear && P.smear.fade < 0.95 && Math.random() < 0.6) {
      const aa = P.smear.a0 + (P.smear.a - P.smear.a0) * Math.random(), F = knightFrame(P.x + P.w / 2, P.y + P.h), lx = F.shX + 2 + Math.cos(aa) * 25, cx = P.x + P.w / 2;
      G.parts.push({ x:cx + P.face * (lx - cx), y:F.shY + 1 + Math.sin(aa) * 25, vx:rand(-8, 8), vy:rand(-10, -3), life:0.5, max:0.5, c:Math.random() < 0.5 ? '#cfeeff' : '#ffffff', s:1, g:10 });
    }
  } else {
    // between combo strikes the blade stays drawn in a low guard; once the combo window closes it goes back
    // into the saya in one flick with a glint at the mouth
    const rest = 2.75, guard = P.comboT > 0 && !P.sit && P.swing && !P.swing.sev;
    if (guard) { ang = wrapAng(P.swAng + wrapAng(0.55 - P.swAng) * Math.min(1, dt * 14)); P.sheathed = false; }
    else { if (!P.sheathed) P.sheathT = 0.18; ang = rest; P.sheathed = true; }
    P.bladeVis = 1;
    const run = P.grounded && Math.abs(P.vx) > 20, it = P.idleT || 0;
    // a still, composed stance: no side-to-side sway, just a slow, shallow breath
    T.lean = run ? 1.2 : guard ? 0.8 : 0.3;
    T.crouch = P.sit ? 3 : P.grounded ? (guard ? 1.2 : it > 0 ? 0.55 + 0.3 * Math.sin(it * 1.5) : 0.4) : 0;
  }
  P.swAng = ang;
  const k = Math.min(1, dt * 28);
  for (const key of ['lean', 'crouch', 'stride']) Q[key] += (T[key] - Q[key]) * k;
  Q.hip = Q.stride * 0.45; Q.hop = T.hop;
  if (G.sev && !(P.atkT > 0 && P.swing && P.swing.sev)) { if (G.sev.flashAll > 0) G.sev.flashAll -= dt; else G.sev = null; }
}
function startSeverance() {
  const c = sevCenter(), cuts = [];
  for (let i = 0; i < 34; i++) { const r = Math.sqrt(Math.random()) * SEV_R * 0.9, a = rand(0, TAU); cuts.push({ x:c.x + Math.cos(a) * r, y:c.y + Math.sin(a) * r * 0.85, a:rand(0, Math.PI), l:rand(12, 28), at:rand(0.2, 0.78) }); }
  for (const e of heroInArea()) for (let i = 0; i < 5; i++) cuts.push({ x:e.x + e.w / 2 + rand(-8, 8), y:e.y + e.h / 2 + rand(-8, 8), a:rand(0, Math.PI), l:rand(12, 22), at:rand(0.22, 0.76) });
  for (let i = 0; i < 4; i++) { const a = rand(0, Math.PI); cuts.push({ x:c.x + rand(-10, 10), y:c.y + rand(-10, 10), a, l:SEV_R * 1.8, at:0.32 + i * 0.1 }); }
  cuts.sort((a, b) => a.at - b.at);
  G.sev = { cx:c.x, cy:c.y, cuts, next:0, p:0, hits:[0.34, 0.46, 0.58, 0.82], done:[], flashAll:0 };
  sfx('hDrone');
}
// screen-space overlay: the world dims, cuts flash into place and hang until the click
function drawSeverance() {
  const S = G.sev; if (!S) return;
  const p = S.p, cx = S.cx - Math.round(G.cam.x), cy = S.cy;
  const dim = p > 0.12 && p < 0.84 ? Math.min(kseg(p, 0.12, 0.3), 1 - kseg(p, 0.82, 0.84)) : 0;
  if (dim > 0) {
    ctx.fillStyle = `rgba(3,6,16,${0.3 * dim})`; ctx.fillRect(0, 0, W, H);
  }
  const ox = -Math.round(G.cam.x);
  if (S.flashAll > 0) {
    const k = S.flashAll / 0.32;
    for (const c of S.cuts) { const dx = Math.cos(c.a) * c.l / 2, dy = Math.sin(c.a) * c.l / 2, x = c.x + ox;
      hlens(x - dx, c.y - dy, x + dx, c.y + dy, 3.5 * k + 0.5, `rgba(120,200,255,${0.6 * k})`); hlens(x - dx, c.y - dy, x + dx, c.y + dy, 1.4 * k + 0.3, `rgba(255,255,255,${k})`); }
    return;
  }
  for (let i = 0; i < S.next; i++) {
    const c = S.cuts[i], age = p - c.at, dx = Math.cos(c.a) * c.l / 2, dy = Math.sin(c.a) * c.l / 2, x = c.x + ox;
    if (age < 0.02) { hlens(x - dx, c.y - dy, x + dx, c.y + dy, 3, 'rgba(120,200,255,.7)'); hlens(x - dx, c.y - dy, x + dx, c.y + dy, 1.2, '#ffffff'); }
    else hlens(x - dx, c.y - dy, x + dx, c.y + dy, 0.6, `rgba(220,240,255,${Math.max(0.25, 0.65 - age * 1.2)})`);
  }
}
// the draw cut leaves a needle-thin streak behind the hero
function drawHeroWorld(cx0) {
  if (!P.heroIai) return;
  const f = P.heroIai.fade, F = knightFrame(P.x + P.w / 2, P.y + P.h), y = F.shY + 0.5, front = P.x + P.w / 2 + P.face * 20 - cx0, back = front - P.face * 60;
  const x0 = Math.min(front, back), x1 = Math.max(front, back);
  hlens(x0, y, x1, y, 2.4 * f + 0.3, `rgba(120,200,255,${0.5 * f})`); hlens(x0 + 3, y, x1, y, 0.9 * f + 0.2, `rgba(255,255,255,${f})`);
}
// a polished katana: wrapped grip, round guard, a curved steel blade with a bright edge and a glint that runs along it
function drawKatana(hand, ux, uy, px, py, len, t) {
  ctx.lineCap = 'butt';
  ctx.strokeStyle = '#1a2233'; ctx.lineWidth = 1.8; kline(hand.x - ux * 5, hand.y - uy * 5, hand.x + ux * 0.6, hand.y + uy * 0.6);
  ctx.fillStyle = '#9fb8d8'; for (const k of [1.6, 3.4]) ctx.fillRect(Math.round(hand.x - ux * k), Math.round(hand.y - uy * k), 1, 1);
  ctx.fillStyle = '#e6eef8'; ctx.fillRect(Math.round(hand.x - ux * 5.4), Math.round(hand.y - uy * 5.4), 1, 1);
  ctx.strokeStyle = '#8fb3d9'; ctx.lineWidth = 1.3; kline(hand.x + ux * 1.1 + px * 2.1, hand.y + uy * 1.1 + py * 2.1, hand.x + ux * 1.1 - px * 2.1, hand.y + uy * 1.1 - py * 2.1);
  if (len < 1) return;
  // the blade curves gently toward its spine (sori); edge on +p, spine on -p
  const b0x = hand.x + ux * 1.8, b0y = hand.y + uy * 1.8, tx = hand.x + ux * (len + 1.8), ty = hand.y + uy * (len + 1.8);
  const cx = (b0x + tx) / 2 - px * 1.1, cy = (b0y + ty) / 2 - py * 1.1;
  const curve = (o1, o2, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(b0x + px * o1, b0y + py * o1); ctx.quadraticCurveTo(cx + px * o2, cy + py * o2, tx, ty); ctx.stroke(); };
  curve(0, 0, 3.6, 'rgba(140,210,255,.16)');
  ctx.fillStyle = '#b4c3d8'; ctx.beginPath(); ctx.moveTo(b0x + px * 1.35, b0y + py * 1.35); ctx.quadraticCurveTo(cx + px * 1.1, cy + py * 1.1, tx, ty);
  ctx.quadraticCurveTo(cx - px * 1.0, cy - py * 1.0, b0x - px * 1.1, b0y - py * 1.1); ctx.closePath(); ctx.fill();
  curve(-0.75, -0.75, 0.7, '#55657f');           // spine ridge
  curve(1.05, 0.85, 0.8, '#ffffff');           // the honed edge catches the light
  ctx.fillStyle = '#d9b46a'; ctx.fillRect(Math.round(b0x) - 0.5, Math.round(b0y) - 0.5, 1, 1); // habaki collar
  // a glint slides along the edge from guard to tip every couple of seconds: a short bright streak on the steel, no halo
  const g = (t * 0.75) % 1.6;
  if (g < 0.9) {
    const at = q => ({ x:(1 - q) * (1 - q) * b0x + 2 * (1 - q) * q * cx + q * q * tx + px * 0.6, y:(1 - q) * (1 - q) * b0y + 2 * (1 - q) * q * cy + q * q * ty + py * 0.6 });
    const A = at(Math.max(0, g - 0.12)), B = at(g);
    ctx.strokeStyle = 'rgba(255,255,255,.95)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
  }
}
// Wick Hero's head: a white wax head with a stern, grown-up face, crowned by a blue fire spirit (dark rim, blue body, cyan core)
const COLD_CROWN = {
  top:[['....o....', '....oo...', '..o.obo..'], ['...o.....', '....oo.o.', '...oobo..'], ['.....o...', '.....oo..', '..o.obo..']],
  body:['...obbo..', '..obblbo.', '.obbllbo.', '.oblcclbo', '..olccco.']
};
function drawColdHead(hx, hy, t, hurt, sit) {
  const pal = hurt ? { o:'#5a1a12', b:'#c2412a', l:'#f2a541', c:'#ffe6a8' } : { o:'#123a6b', b:'#2f78d8', l:'#5cb2ff', c:'#b4f4ff' };
  // a cold glow that breathes with the fire
  const pulse = 0.85 + 0.15 * Math.sin(t * 4.2), gc = hurt ? '242,120,60' : '90,175,255', bloom = !P._noBloom;   // the Black Wick draws without the cold bloom
  ctx.globalCompositeOperation = bloom ? 'lighter' : 'destination-over';
  let g = ctx.createRadialGradient(hx, hy - 4, 0, hx, hy - 4, 24); g.addColorStop(0, `rgba(${gc},${0.34 * pulse})`); g.addColorStop(0.45, `rgba(${gc},${0.12 * pulse})`); g.addColorStop(1, `rgba(${gc},0)`);
  ctx.fillStyle = g; ctx.fillRect(hx - 24, hy - 28, 48, 48);
  ctx.globalCompositeOperation = 'source-over';
  // wax head: lit rim, shaded side and jaw
  ctx.fillStyle = '#e8ecf2'; ctx.fillRect(hx - 4, hy, 8, 8);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(hx - 3, hy, 6, 1); ctx.fillRect(hx + 3, hy + 1, 1, 4);
  ctx.fillStyle = '#b9c2cf'; ctx.fillRect(hx - 4, hy + 1, 1, 7); ctx.fillRect(hx - 3, hy + 7, 6, 1);
  ctx.fillStyle = '#d3dae4'; ctx.fillRect(hx - 2, hy + 6, 1, 1);
  // stern brows that dip toward the nose, narrow eyes with cold blue irises, a firm mouth
  const blink = sit || idleBlink() || (t % 4.1) < 0.08, fierce = P.atkT > 0 || P.dashT > 0, ink = '#121826';
  ctx.fillStyle = ink;
  ctx.fillRect(hx - 3, hy + 2, 2, 1); ctx.fillRect(hx - 1, hy + 3, 1, 1);
  ctx.fillRect(hx + 2, hy + 2, 2, 1); ctx.fillRect(hx + 1, hy + 3, 1, 1);
  if (blink) { ctx.fillRect(hx - 3, hy + 4, 2, 1); ctx.fillRect(hx + 1, hy + 4, 3, 1); }
  else {
    ctx.fillRect(hx - 3, hy + 4, 2, 1); ctx.fillRect(hx + 2, hy + 4, 2, 1);
    ctx.fillStyle = fierce ? '#e6fbff' : '#4aa8ff'; ctx.fillRect(hx - 2, hy + 4, 1, 1); ctx.fillRect(hx + 2, hy + 4, 1, 1);
  }
  ctx.fillStyle = '#8a93a3'; ctx.fillRect(hx, hy + 6, 2, 1);
  // a faint blue scar of old frostbite under the left eye
  ctx.fillStyle = 'rgba(80,150,230,.55)'; ctx.fillRect(hx - 3, hy + 5, 1, 1);
  // the blue fire spirit burning on top; its cyan core sits right on the wax
  const rows = COLD_CROWN.top[Math.floor(t * 6) % 3].concat(COLD_CROWN.body), x0 = hx - 4, y0 = hy - rows.length + 1;
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < 9; c++) { const ch = rows[r][c]; if (ch === '.') continue; ctx.fillStyle = pal[ch]; ctx.fillRect(x0 + c, y0 + r, 1, 1); }
  // bloom over the core so the flame reads as a light source
  ctx.globalCompositeOperation = bloom ? 'lighter' : 'destination-over';
  g = ctx.createRadialGradient(hx, hy - 3, 0, hx, hy - 3, 8); g.addColorStop(0, hurt ? `rgba(255,220,160,${0.5 * pulse})` : `rgba(190,240,255,${0.55 * pulse})`); g.addColorStop(1, 'rgba(120,200,255,0)');
  ctx.fillStyle = g; ctx.fillRect(hx - 8, hy - 11, 16, 16);
  ctx.globalCompositeOperation = 'source-over';
  // two loose sparks drift up from the crown
  for (let i = 0; i < 2; i++) { const k = (t * 0.9 + i * 0.5) % 1; ctx.fillStyle = k < 0.5 ? pal.l : pal.o;
    ctx.fillRect(Math.round(hx - 4 + i * 8 + Math.sin((t + i) * 4) * 1.5), Math.round(hy - 6 - k * 8), 1, 1); }
}
function drawHeroBody(cx, by, f, t, sit) {
  const Q = P.pose, hurt = P.hurtT > 0;
  ctx.save(); ctx.translate(cx, 0); ctx.scale(f, 1); ctx.translate(-cx, 0);
  const F = knightFrame(cx, by), { hipX, hipY, shX, shY, fy } = F;
  const fs = { x:shX + 2, y:shY + 1 }, bs = { x:shX - 2, y:shY + 1 };
  const a = P.swAng, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
  const hand = { x:fs.x + ux * KARM, y:fs.y + uy * KARM };
  const hx = Math.round(shX + Q.lean * 0.25), hy = Math.round(shY - 7);
  // long scarf streaming behind
  const sp = clamp(Math.abs(P.vx) / 60, 0, 2);
  const scarf = () => { ctx.beginPath(); ctx.moveTo(hx - 2, hy + 7); ctx.lineTo(hx + 3, hy + 7);
    ctx.quadraticCurveTo(hx - 8 - Q.lean * 1.5 - sp, hy + 6 + Math.sin(t * 9) * 1.5, hx - 15 - Q.lean * 2 - sp * 2, hy + 9 + Math.sin(t * 7 + 1) * 2.5);
    ctx.lineTo(hx - 13 - Q.lean * 2 - sp * 2, hy + 11 + Math.sin(t * 7 + 1) * 2.5); ctx.quadraticCurveTo(hx - 6, hy + 10, hx - 2, hy + 9); };
  ctx.fillStyle = '#123a6b'; ctx.save(); ctx.translate(0, 0.8); scarf(); ctx.fill(); ctx.restore();
  ctx.fillStyle = '#2f78d8'; scarf(); ctx.fill();
  ctx.strokeStyle = '#7cc8ff'; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(hx + 2, hy + 7.3);
  ctx.quadraticCurveTo(hx - 8 - Q.lean * 1.5 - sp, hy + 6.3 + Math.sin(t * 9) * 1.5, hx - 15 - Q.lean * 2 - sp * 2, hy + 9.3 + Math.sin(t * 7 + 1) * 2.5); ctx.stroke();
  // back arm
  ctx.lineCap = 'round'; ctx.strokeStyle = '#1a2030'; ctx.lineWidth = 2; kline(bs.x, bs.y, bs.x + Math.cos(1.2) * KARM, bs.y + Math.sin(1.2) * KARM);
  // legs
  ctx.lineCap = 'butt'; ctx.strokeStyle = '#1c2230'; ctx.lineWidth = 2;
  let ffx, bfx;
  if (P.grounded && Math.abs(P.vx) > 20 && !(P.atkT > 0)) { const s = Math.sin(P.anim * 15) * 2; ffx = cx + 1 + s; bfx = cx - 2 - s; }
  else { ffx = cx + 1 + Q.stride; bfx = cx - 2 - Q.stride * 0.4; }
  const footY = P.grounded ? fy : fy - 1;
  if (!sit) { kline(hipX - 1.5, hipY, bfx, footY); kline(hipX + 1.5, hipY, ffx, footY); }
  // torso
  ctx.fillStyle = '#1a2440'; ctx.beginPath(); ctx.moveTo(hipX - 4, hipY); ctx.lineTo(hipX + 4, hipY); ctx.lineTo(shX + 4, shY); ctx.lineTo(shX - 4, shY); ctx.fill();
  ctx.fillStyle = '#2b3d66'; ctx.beginPath(); ctx.moveTo(hipX + 2, hipY - 1); ctx.lineTo(hipX + 4, hipY - 1); ctx.lineTo(shX + 4, shY); ctx.lineTo(shX + 2, shY); ctx.fill();
  ctx.strokeStyle = '#5cb2ff'; ctx.lineWidth = 0.8; kline(shX + 1, shY + 0.5, hipX - 1, hipY - 2.5);   // the coat's crossed lapel
  ctx.fillStyle = '#2f78d8'; ctx.fillRect(hipX - 4, hipY - 2, 8, 1); ctx.fillStyle = '#7cc8ff'; ctx.fillRect(hipX - 4, hipY - 2, 3, 1);
  // head of living blue fire with two narrow, glowing eyes
  drawColdHead(hx, hy, t, hurt, sit);
  // saya (scabbard) worn at the hip: black lacquer, silver mouth ring and end cap
  const mx = hipX - 2, my = hipY - 3, su = Math.cos(2.75), sv = Math.sin(2.75);
  ctx.lineCap = 'butt'; ctx.strokeStyle = '#0e121c'; ctx.lineWidth = 2.2; kline(mx, my, mx + su * 13, my + sv * 13);
  ctx.strokeStyle = '#3d4c68'; ctx.lineWidth = 0.6; kline(mx + su * 2 - sv * 0.7, my + sv * 2 + su * 0.7, mx + su * 12 - sv * 0.7, my + sv * 12 + su * 0.7);
  ctx.fillStyle = '#c9d6e8'; ctx.fillRect(Math.round(mx + su * 13) - 1, Math.round(my + sv * 13) - 1, 2, 2); ctx.fillRect(Math.round(mx) - 1, Math.round(my) - 1, 1, 2);
  if (P.sheathed) {
    // the hilt rides at the saya's mouth: guard, wrapped grip, pommel cap
    const gx = mx - su * 0.8, gy = my - sv * 0.8;
    ctx.strokeStyle = '#8fb3d9'; ctx.lineWidth = 1.2; kline(gx + sv * 1.8, gy - su * 1.8, gx - sv * 1.8, gy + su * 1.8);
    ctx.strokeStyle = '#1a2233'; ctx.lineWidth = 1.7; kline(gx - su * 0.6, gy - sv * 0.6, gx - su * 5, gy - sv * 5);
    ctx.fillStyle = '#9fb8d8'; ctx.fillRect(Math.round(gx - su * 2.2), Math.round(gy - sv * 2.2), 1, 1); ctx.fillRect(Math.round(gx - su * 3.8), Math.round(gy - sv * 3.8), 1, 1);
    ctx.fillStyle = '#e6eef8'; ctx.fillRect(Math.round(gx - su * 5.4), Math.round(gy - sv * 5.4), 1, 1);
    if (P.sheathT > 0) { const k = P.sheathT / 0.18, g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 6); g.addColorStop(0, `rgba(230,246,255,${0.9 * k})`); g.addColorStop(1, 'rgba(160,215,255,0)'); ctx.fillStyle = g; ctx.fillRect(gx - 6, gy - 6, 12, 12);
      ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.fillRect(Math.round(gx), Math.round(gy) - 3, 1, 7); ctx.fillRect(Math.round(gx) - 3, Math.round(gy), 7, 1); }
  }
  // frost smear, then the katana itself
  if (P.smear) heroFrostSmear(fs.x, fs.y, P.smear.a0, P.smear.a, KARM + HBLADE + 2, P.smear.fade);
  let armHand = null;
  if (P.sheathing != null) {
    // swing the blade over and line it up with the saya, then slide it home; the tip meets the saya's mouth
    const k = P.sheathing, L = HBLADE;
    if (k < 0.4) {
      const q = keo(k / 0.4), a0 = -0.45, aa = a0 + wrapAng(2.75 - a0) * q, h0x = fs.x + Math.cos(a0) * KARM, h0y = fs.y + Math.sin(a0) * KARM;
      armHand = { x:klerp(h0x, mx - su * (L + 2), q), y:klerp(h0y, my - sv * (L + 2), q) };
      drawKatana(armHand, Math.cos(aa), Math.sin(aa), -Math.sin(aa), Math.cos(aa), L, t);
    } else {
      const q = kseg(k, 0.4, 1), ins = L * q * q * (3 - 2 * q);
      armHand = { x:mx - su * (L + 2 - ins), y:my - sv * (L + 2 - ins) };
      drawKatana(armHand, su, sv, -sv, su, L - ins, t);
    }
  } else if (!P.sheathed) drawKatana(hand, ux, uy, px, py, HBLADE * (P.bladeVis == null ? 1 : P.bladeVis), t);
  // front arm
  ctx.lineCap = 'round'; ctx.strokeStyle = '#2a3348'; ctx.lineWidth = 2; kline(fs.x, fs.y, armHand ? armHand.x : P.sheathed ? mx - su * 1.5 : hand.x, armHand ? armHand.y : P.sheathed ? my - sv * 1.5 : hand.y);
  ctx.lineCap = 'butt';
  ctx.restore();
}

