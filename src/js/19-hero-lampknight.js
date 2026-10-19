// ---------- Lampknight (Vigil): two-handed greatsword, posed body animation
// Every swing has a wind-up (lean back, draw the blade back), a strike (step in, drop low, blade whips through),
// then follow-through. Angles: 0 = forward, positive = down; drawn facing right and mirrored for the left.
const wrapAng = a => { a = (a + Math.PI) % (2 * Math.PI); if (a < 0) a += 2 * Math.PI; return a - Math.PI; };
const kseg = (p, a, b) => Math.max(0, Math.min(1, (p - a) / (b - a)));
const keo = x => 1 - Math.pow(1 - x, 3);
const klerp = (a, b, k) => a + (b - a) * k;
const KARM = 5, KBLADE = 15;
function knightSwing(dir, n, fin) {
  if (dir === 'up') return { a0:0.3, a1:-2.9, d:0.32, wE:0.28, sE:0.44 };
  if (dir === 'down') return { a0:-0.4, a1:2.9, d:0.3, wE:0.22, sE:0.4 };
  if (fin) return { slam:true, a0:-2.75, a1:0.85, d:0.62, wE:0.4, sE:0.5 };
  const arcs = [null, { a0:-1.55, a1:1.0 }, { a0:1.0, a1:-1.55 }, { a0:1.5, a1:-1.95 }];
  return Object.assign({ d:0.34, wE:0.3, sE:0.45 }, arcs[n] || arcs[1]);
}
// the blade only cuts during the strike, not the wind-up
function atkActive() {
  if (!CH().combo) return P.atkT > 0.1;
  if (G.char === 'hero') {
    if (P.atkT <= 0 || !P.swing) return false;
    const win = heroWindow(P.swing, 1 - P.atkT / P.atkDur);
    if (win >= 0 && win !== P.hWin) { P.hWin = win; P.atkHit = new Set(); } // the frost cross's second stroke can hit again
    return win >= 0;
  }
  if (P.atkT <= 0 || !P.swing) return false;
  const sw = P.swing, pp = 1 - P.atkT / P.atkDur;
  return pp >= sw.wE + (sw.sE - sw.wE) * 0.35 && pp <= sw.sE + 0.08;
}
function knightFrame(cx, by) {
  const Q = P.pose, hipX = cx + Q.hip, hipY = by - 3 + Q.crouch * 0.6 - Q.hop, shX = hipX + Q.lean, shY = hipY - 7;
  return { hipX, hipY, shX, shY, fy:by - Q.hop };
}
function knightTip() {
  const cx = P.x + P.w / 2, F = knightFrame(cx, P.y + P.h);
  const lx = F.shX + 2 + Math.cos(P.swAng) * (KARM + KBLADE), ly = F.shY + 1 + Math.sin(P.swAng) * (KARM + KBLADE);
  return { x:cx + P.face * (lx - cx), y:ly };
}
function updateKnightPose(dt) {
  const Q = P.pose, T = { lean:0, crouch:0, stride:0, hop:0 };
  let ang;
  P.smear = null;
  if (P.atkT > 0 && P.swing && !P.dead) {
    const sw = P.swing, p = 1 - P.atkT / P.atkDur, w = kseg(p, 0, sw.wE), st = kseg(p, sw.wE, sw.sE), fo = kseg(p, sw.sE, 0.85);
    const dir = Math.sign(sw.a1 - sw.a0), pull = sw.slam ? sw.a0 : sw.a0 - dir * 0.5, over = sw.a1 + dir * 0.14, air = !P.grounded;
    ang = p < sw.wE ? klerp(P.swFrom, pull, keo(w)) : p < sw.sE ? klerp(pull, over, keo(st)) : klerp(over, sw.a1, keo(fo));
    T.lean = p < sw.wE ? -2 * keo(w) : p < sw.sE ? klerp(-2, 3.5, keo(st)) : klerp(3.5, 1, keo(fo));
    if (air) T.crouch = 0.5;
    else if (sw.slam) T.crouch = p < 0.14 ? 2 * kseg(p, 0, 0.14) : p < sw.wE ? klerp(2, 0, kseg(p, 0.14, 0.26)) : p < sw.sE ? 3 * keo(st) : klerp(3, 0.6, keo(fo));
    else T.crouch = p < sw.wE ? 1.2 * w : p < sw.sE ? 1.2 + 1.6 * keo(st) : klerp(2.8, 0.6, keo(fo));
    T.stride = air ? 0 : p < sw.wE ? 0 : p < sw.sE ? 3 * keo(st) : klerp(3, 1.2, keo(fo));
    T.hop = sw.slam && !air ? Math.sin(kseg(p, 0.16, sw.sE) * Math.PI) * 5 : 0;
    if (p >= sw.wE && p < 0.95) P.smear = { a0:pull, a:ang, fade:p < sw.sE + 0.08 ? 1 : Math.max(0, 1 - (p - sw.sE - 0.08) / 0.32) };
    // the moment the blade starts moving: weight, sound and shake even on a miss
    if (!P.struck && p >= sw.wE) {
      P.struck = true; G.shake = Math.max(G.shake, P.fin ? 4 : 1.8);
      if (P.fin) sfx('kFireSwing'); else sfx('kSwing', P.combo);
    }
    // the fire cleave trails embers from the blade tip
    if (P.fin && p >= sw.wE && p < sw.sE + 0.1) {
      const tp = knightTip();
      for (let i = 0; i < 3; i++) G.parts.push({ x:tp.x + rand(-3, 3), y:tp.y + rand(-3, 3), vx:rand(-30, 30), vy:rand(-60, -10), life:0.5, max:0.5, c:[C.ember, C.flame, C.core][i], s:2, g:-80 });
    }
    // ...and sets the ground alight where it lands
    if (P.fin && !P.landed && p >= sw.sE) {
      P.landed = true;
      if (P.grounded) {
        const tp = knightTip(), fy = P.y + P.h;
        G.spells.push({ k:'burn', x:clamp(tp.x, 8, G.room.w * T - 8) - 16, y:fy - 12, w:32, h:12, life:0.9, max:0.9, hit:new Set() });
        G.shake = Math.max(G.shake, 7); screenFlash(0.3, 0.08, '255,190,120'); dust(tp.x, fy, 10); sfx('kFireBoom');
        burst(tp.x, fy - 2, 22, { spd:160, life:0.55, colors:[C.ember, C.flame, C.core], size:2, g:-40, ang:-Math.PI / 2, spread:1.3 });
        G.fx.push({ k:'ring', x:tp.x, y:fy - 4, t:0.3, max:0.3, r:30, c:'242,165,65' });
      }
    }
  } else {
    // the claymore is always carried behind: dragged with its tip on the floor when walking, held low behind when still,
    // rested on the shoulder now and then, and trailed level behind in the air
    const run = P.grounded && Math.abs(P.vx) > 20;
    const it = P.idleT || 0, shoulder = it > 3 && (it % 8) > 5.5 && (it % 8) < 7.2;
    const F0 = knightFrame(0, 0), drop = clamp((F0.fy - (F0.shY + 1)) / (KARM + KBLADE), 0, 1), floor = Math.PI - Math.asin(drop);
    const rest = P.sit ? floor : !P.grounded ? 2.95 : run ? floor + 0.02 : shoulder ? -2.25 : floor + 0.1 + (it > 0 ? 0.04 * Math.sin(it * 2.6) : 0);
    ang = P.swAng + wrapAng(rest - P.swAng) * Math.min(1, dt * (shoulder ? 6 : 10)); ang = wrapAng(ang);
    // dragging the tip scrapes sparks off the stone
    if (run && Math.abs(wrapAng(ang - floor)) < 0.2 && Math.random() < dt * 30) {
      const tp = knightTip();
      G.parts.push({ x:tp.x + rand(-1, 1), y:tp.y - 1, vx:-P.face * rand(20, 70) - P.vx * 0.2, vy:rand(-70, -25), life:0.25, max:0.25, c:Math.random() < 0.5 ? HP.lamp : Math.random() < 0.5 ? C.flame : '#ffffff', s:1, g:260 });
    }
    T.lean = run ? 1 : it > 0 ? 0.6 * Math.sin(it * 1.1) : 0;
    T.crouch = P.sit ? 3 : P.grounded ? (it > 0 ? 0.8 + 1.0 * Math.sin(it * 2.6) : 0.3) : 0;
  }
  P.swAng = ang;
  const k = Math.min(1, dt * 28);
  for (const key of ['lean', 'crouch', 'stride']) Q[key] += (T[key] - Q[key]) * k;
  Q.hip = Q.stride * 0.45; Q.hop = T.hop;
}
function knCrescent(ox, oy, r, start, end, sF, col) {
  if (Math.abs(end - start) < 0.04) return;
  const ccw = end < start, mid = (start + end) / 2, s = r * sF, cx = ox - Math.cos(mid) * s, cy = oy - Math.sin(mid) * s;
  const ex = ox + Math.cos(end) * r, ey = oy + Math.sin(end) * r, sx = ox + Math.cos(start) * r, sy = oy + Math.sin(start) * r;
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(ox, oy, r, start, end, ccw);
  ctx.arc(cx, cy, Math.hypot(ex - cx, ey - cy), Math.atan2(ey - cy, ex - cx), Math.atan2(sy - cy, sx - cx), !ccw);
  ctx.closePath(); ctx.fill();
}
// smear that trails the real blade; the finisher burns
function knightSmear(ox, oy, sm, fire, t) {
  const R = KARM + KBLADE, range = sm.a - sm.a0;
  if (Math.abs(range) < 0.06 || sm.fade <= 0) return;
  const f = sm.fade, start = sm.a0 + range * (0.08 + (1 - f) * 0.88);
  if (fire) {
    knCrescent(ox, oy, R + 6, start, sm.a, 1.25, `rgba(226,85,63,${0.5 * f})`);
    knCrescent(ox, oy, R + 3, start, sm.a, 1.05, `rgba(242,165,65,${0.78 * f})`);
    knCrescent(ox, oy, R, start, sm.a, 0.95, `rgba(255,241,193,${0.95 * f})`);
    if (f > 0.25) for (let i = 1; i <= 5; i++) {
      const aa = start + (sm.a - start) * i / 5.5;
      drawFlame(ox + Math.cos(aa) * (R + 4), oy + Math.sin(aa) * (R + 4), 0.7 + 0.5 * f * Math.abs(Math.sin(t * 9 + i)), t * 1.4 + i, C.ember, C.flame);
    }
  } else {
    knCrescent(ox, oy, R + 3, start, sm.a, 1.15, `rgba(255,217,160,${0.42 * f})`);
    knCrescent(ox, oy, R, start, sm.a, 0.95, `rgba(236,244,255,${0.95 * f})`);
  }
  ctx.strokeStyle = `rgba(255,255,255,${f})`; ctx.lineWidth = fire ? 2 : 1.4;
  ctx.beginPath(); ctx.arc(ox, oy, R + 0.5, start, sm.a, sm.a < start); ctx.stroke();
}
function kline(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
// Lampknight: steel helm with a flame crest and amber visor, crimson cape, lantern at the hip, greatsword in both hands
// greatsword: grip and pommel, crossguard, broad blade with a fuller
function knightBlade(hand, ux, uy, px, py, fire, t, nofx) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = HP.leather[1]; ctx.lineWidth = 1.5; kline(hand.x - ux * 3.5, hand.y - uy * 3.5, hand.x + ux, hand.y + uy);
  ctx.fillStyle = C.brass; ctx.fillRect(Math.round(hand.x - ux * 4) - 1, Math.round(hand.y - uy * 4) - 1, 2, 2);
  ctx.strokeStyle = C.brass; ctx.lineWidth = 1.5; kline(hand.x + ux * 1.5 + px * 3, hand.y + uy * 1.5 + py * 3, hand.x + ux * 1.5 - px * 3, hand.y + uy * 1.5 - py * 3);
  ctx.strokeStyle = fire ? HP.lamp : HP.steel[7]; ctx.lineWidth = 2.6; kline(hand.x + ux * 2, hand.y + uy * 2, hand.x + ux * KBLADE, hand.y + uy * KBLADE);
  ctx.strokeStyle = fire ? C.ember : HP.steel[5]; ctx.lineWidth = 0.8; kline(hand.x + ux * 3, hand.y + uy * 3, hand.x + ux * (KBLADE - 3), hand.y + uy * (KBLADE - 3));
  ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(hand.x + ux * KBLADE) - 0.5, Math.round(hand.y + uy * KBLADE) - 0.5, 1, 1);
  if (fire && !nofx) for (let i = 0; i < 3; i++) drawFlame(hand.x + ux * (5 + i * 4), hand.y + uy * (5 + i * 4), 0.7, t * 1.3 + i, C.ember, C.flame);
}
// one pass of the knight's solid parts: 'A' is everything behind the front blade, 'B' the front blade and arm
function knightPass(cx, by, f, t, sit, mode) {
  const Q = P.pose, hurt = P.hurtT > 0, fire = P.fin && P.atkT > 0;
  ctx.save(); ctx.translate(cx, 0); ctx.scale(f, 1); ctx.translate(-cx, 0);
  const F = knightFrame(cx, by), { hipX, hipY, shX, shY, fy } = F;
  const fs = { x:shX + 2, y:shY + 1 }, bs = { x:shX - 2, y:shY + 1 };
  const a = P.swAng, ux = Math.cos(a), uy = Math.sin(a), px = -uy, py = ux;
  const hand = { x:fs.x + ux * KARM, y:fs.y + uy * KARM }, hand2 = { x:hand.x - ux * 2.5, y:hand.y - uy * 2.5 };
  const behind = !(P.atkT > 0) && Math.cos(a) < -0.3;
  const hx = Math.round(shX + Q.lean * 0.25), hy = Math.round(shY - 7), lsw = Math.round(-Q.lean * 0.4);
  const R = { fs, hand, ux, uy, behind, fire, hurt, hx, hy, hipX, hipY, lsw };
  if (mode === 'B') {
    if (!behind) knightBlade(hand, ux, uy, px, py, fire, t, true);
    ctx.lineCap = 'round'; ctx.strokeStyle = HP.steel[4]; ctx.lineWidth = 2; kline(fs.x, fs.y, hand.x, hand.y);
    ctx.fillStyle = C.brass; ctx.fillRect(Math.round(hand.x - ux * 2) - 1, Math.round(hand.y - uy * 2) - 1, 2, 2);
    ctx.lineCap = 'butt'; ctx.restore(); return R;
  }
  if (behind) knightBlade(hand, ux, uy, px, py, fire, t, true);
  // cape trails behind the lean and the run
  ctx.fillStyle = HP.knight[1]; ctx.beginPath();
  ctx.moveTo(shX - 1, shY + 1); ctx.lineTo(shX - 4, shY + 1);
  ctx.lineTo(hipX - 7 - Q.lean * 1.3 + Math.sin(t * 7) * 0.6 - clamp(Math.abs(P.vx) / 60, 0, 2), hipY + 2 - Math.max(0, Q.lean) * 0.4);
  ctx.lineTo(hipX - 2, hipY + 1); ctx.fill();
  { const tipX = hipX - 7 - Q.lean * 1.3 + Math.sin(t * 7) * 0.6 - clamp(Math.abs(P.vx) / 60, 0, 2), tipY = hipY + 2 - Math.max(0, Q.lean) * 0.4;
    ctx.fillStyle = HP.knight[2]; ctx.beginPath(); ctx.moveTo(shX - 2, shY + 1); ctx.lineTo(shX - 3, shY + 1); ctx.lineTo(tipX + 2, tipY - 1); ctx.lineTo(hipX - 3, hipY); ctx.fill();
    ctx.fillStyle = HP.knight[0]; ctx.fillRect(Math.round(tipX), Math.round(tipY) - 1, 2, 1); ctx.fillRect(Math.round(tipX) + 3, Math.round(tipY), 1, 1); }
  // back arm reaches the lower grip
  ctx.lineCap = 'round'; ctx.strokeStyle = HP.steel[2]; ctx.lineWidth = 2; kline(bs.x, bs.y, hand2.x, hand2.y);
  // legs: back foot planted, front foot strides into the swing
  ctx.lineCap = 'butt'; ctx.strokeStyle = HP.steel[0]; ctx.lineWidth = 2;
  let ffx, bfx;
  if (P.grounded && Math.abs(P.vx) > 20 && !(P.atkT > 0)) { const sw = Math.sin(P.anim * 14) * 2; ffx = cx + 1 + sw; bfx = cx - 2 - sw; }
  else { ffx = cx + 1 + Q.stride; bfx = cx - 2 - Q.stride * 0.4; }
  const footY = P.grounded ? fy : fy - 1;
  if (!sit) { kline(hipX - 1.5, hipY, bfx, footY); kline(hipX + 1.5, hipY, ffx, footY);
    ctx.fillStyle = HP.steel[5]; ctx.fillRect(Math.round((hipX - 1.5 + bfx) / 2) - 1, Math.round((hipY + footY) / 2), 2, 1); ctx.fillRect(Math.round((hipX + 1.5 + ffx) / 2) - 1, Math.round((hipY + footY) / 2), 2, 1);
    ctx.fillStyle = HP.steel[1]; ctx.fillRect(Math.round(bfx) - 1, Math.round(footY) - 1, 3, 1); ctx.fillRect(Math.round(ffx) - 1, Math.round(footY) - 1, 3, 1); }
  // torso leans from the hips
  ctx.fillStyle = HP.steel[3]; ctx.beginPath();
  ctx.moveTo(hipX - 4, hipY); ctx.lineTo(hipX + 4, hipY); ctx.lineTo(shX + 4, shY); ctx.lineTo(shX - 4, shY); ctx.fill();
  ctx.fillStyle = HP.steel[5]; ctx.beginPath();
  ctx.moveTo(hipX + 2, hipY - 1); ctx.lineTo(hipX + 4, hipY - 1); ctx.lineTo(shX + 4, shY); ctx.lineTo(shX + 2, shY); ctx.fill();
  ctx.fillStyle = C.brass; ctx.fillRect(hipX - 4, hipY - 2, 8, 1);
  { const sy = Math.round(shY + (hipY - shY) * 0.5), sx = Math.round(shX - 3 + (hipX - shX) * 0.5); ctx.fillStyle = HP.steel[2]; ctx.fillRect(sx, sy, 5, 1); }
  ctx.fillStyle = HP.brass[3]; ctx.fillRect(hipX + 1, hipY - 2, 2, 1);
  ctx.fillStyle = HP.knight[1]; ctx.fillRect(hipX - 1, hipY - 1, 2, 3); ctx.fillStyle = HP.knight[2]; ctx.fillRect(hipX - 1, hipY - 1, 1, 3);
  ctx.fillStyle = HP.steel[5]; ctx.beginPath(); ctx.ellipse(shX + 1, shY + 1.5, 3, 2, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = HP.steel[6]; ctx.fillRect(shX, shY, 2, 1);
  // helm leads the body slightly
  ctx.fillStyle = HP.steel[4]; ctx.fillRect(hx - 4, hy + 1, 8, 6); ctx.fillRect(hx - 3, hy, 6, 1);
  ctx.fillStyle = HP.steel[2]; ctx.fillRect(hx - 4, hy + 1, 1, 6);
  ctx.fillStyle = HP.steel[5]; ctx.fillRect(hx + 3, hy + 1, 1, 5); ctx.fillRect(hx, hy + 1, 1, 2);
  ctx.fillStyle = HP.steel[1]; ctx.fillRect(hx - 4, hy + 6, 8, 1);
  ctx.fillStyle = HP.steel[2]; ctx.fillRect(hx, hy + 5, 1, 1); ctx.fillRect(hx + 2, hy + 5, 1, 1);
  ctx.fillStyle = hurt ? C.ember : C.flame; ctx.fillRect(hx - 1, hy + 3, 4, 1); ctx.fillStyle = C.core; ctx.fillRect(hx + 2, hy + 3, 1, 1);
  ctx.fillStyle = C.brass; ctx.fillRect(hx - 2, hy - 1, 5, 1); ctx.fillStyle = HP.brass[2]; ctx.fillRect(hx - 2, hy - 1, 1, 1);
  ctx.fillStyle = C.wax; ctx.fillRect(hx - 1, hy - 3, 3, 2); ctx.fillStyle = C.waxSh; ctx.fillRect(hx - 1, hy - 2, 1, 1); ctx.fillStyle = C.wax; ctx.fillRect(hx + 2, hy - 1, 1, 1);
  // lantern swings on the belt
  ctx.fillStyle = C.brass; ctx.fillRect(hipX + 4 + lsw, hipY - 4, 3, 4); ctx.fillStyle = C.core; ctx.fillRect(hipX + 5 + lsw, hipY - 3, 1, 2);
  ctx.fillStyle = HP.brass[0]; ctx.fillRect(hipX + 4 + lsw, hipY - 4, 3, 1); ctx.fillRect(hipX + 4 + lsw, hipY - 1, 3, 1); ctx.fillStyle = C.brass; ctx.fillRect(hipX + 5 + lsw, hipY - 5, 1, 1);
  ctx.lineCap = 'butt';
  ctx.restore();
  return R;
}
// Draw solid shapes into a scratch canvas, then make every edge pixel either fully solid or empty,
// so the knight's slanted plates and the rotated blade stay crisp instead of soft and blurry.
const KSNAP = { c:null, g:null }; let KNIGHT_OUTLINE = true;    // a selective dark outline around his silhouette
function knightSnap(fn, cx, by, pass) {
  const real = ctx;
  if (!real.canvas || !real.canvas.width || typeof real.getImageData !== 'function' || typeof real.getTransform !== 'function') return fn();
  const cw = real.canvas.width, ch = real.canvas.height;
  if (!KSNAP.c || KSNAP.c.width !== cw || KSNAP.c.height !== ch) { KSNAP.c = document.createElement('canvas'); KSNAP.c.width = cw; KSNAP.c.height = ch; KSNAP.g = KSNAP.c.getContext('2d', { willReadFrequently:true }); }
  const g = KSNAP.g, m = real.getTransform();
  const x0 = Math.max(0, Math.floor(m.a * (cx - 44) + m.e)), y0 = Math.max(0, Math.floor(m.d * (by - 60) + m.f));
  const x1 = Math.min(cw, Math.ceil(m.a * (cx + 44) + m.e)), y1 = Math.min(ch, Math.ceil(m.d * (by + 12) + m.f));
  if (x1 <= x0 || y1 <= y0) return fn();
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(x0, y0, x1 - x0, y1 - y0); g.setTransform(m); g.globalAlpha = real.globalAlpha; g.imageSmoothingEnabled = false;
  let r; ctx = g;
  try { r = fn(); } finally { ctx = real; }
  const im = g.getImageData(x0, y0, x1 - x0, y1 - y0), d = im.data;
  // and every solid pixel takes the nearest of the knight's own colours, so plates meet with clean steps, not smudges
  if (!KSNAP.pal) KSNAP.pal = [HP.knight[1], HP.knight[2], HP.knight[0], HP.steel[2], HP.steel[0], HP.steel[5], HP.steel[1], HP.steel[3], C.brass, HP.brass[3], HP.steel[6], HP.steel[4], C.flame, C.core, C.ember, HP.brass[2], C.wax, C.waxSh, HP.brass[0], HP.leather[1], HP.steel[7], HP.lamp, '#ffffff'].map(hexRgb);
  const pal = KSNAP.pal, cache = new Map();
  for (let k = 0; k < d.length; k += 4) {
    if (d[k + 3] < 96) { d[k + 3] = 0; continue; }
    d[k + 3] = 255;
    const key = (d[k] << 16) | (d[k + 1] << 8) | d[k + 2]; let c = cache.get(key);
    if (!c) { let best = 1e9; for (const p of pal) { const e = (p[0] - d[k]) ** 2 + (p[1] - d[k + 1]) ** 2 + (p[2] - d[k + 2]) ** 2; if (e < best) { best = e; c = p; } } cache.set(key, c); }
    d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2];
  }
  if (KNIGHT_OUTLINE) {
    // a selective outline: dark navy around steel, dark maroon around the cape, only on the outer edge,
    // and none on top edges, which his own flame lights from above
    const w = x1 - x0, h = y1 - y0, a0 = new Uint8Array(w * h);
    for (let p = 0; p < w * h; p++) a0[p] = d[p * 4 + 3];
    const prev = pass === 'B' && KSNAP.lastA && KSNAP.lastA.x0 === x0 && KSNAP.lastA.y0 === y0 && KSNAP.lastA.w === w ? KSNAP.lastA.a : null;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const p = y * w + x; if (a0[p] || (prev && prev[p])) continue;
      let src = -1;
      if (y > 0 && a0[p - w]) src = p - w;                 // solid above: bottom edge
      else if (x > 0 && a0[p - 1]) src = p - 1;            // side edges
      else if (x < w - 1 && a0[p + 1]) src = p + 1;
      if (src < 0) continue;                                // solid only below: a lit top edge, left open
      const r = d[src * 4], gg = d[src * 4 + 1], b = d[src * 4 + 2];
      const warm = r > gg + 30 && r > b + 10;
      d[p * 4] = warm ? 42 : 16; d[p * 4 + 1] = warm ? 14 : 22; d[p * 4 + 2] = warm ? 22 : 38; d[p * 4 + 3] = 255;
    }
    if (pass === 'A') { const keep = new Uint8Array(w * h); for (let p = 0; p < w * h; p++) keep[p] = d[p * 4 + 3]; KSNAP.lastA = { x0, y0, w, a:keep }; }
  }
  g.putImageData(im, x0, y0);
  real.save(); real.setTransform(1, 0, 0, 1, 0, 0); real.drawImage(KSNAP.c, x0, y0, x1 - x0, y1 - y0, x0, y0, x1 - x0, y1 - y0); real.restore();
  return r;
}
function drawKnightBody(cx, by, f, t, sit) {
  // the lantern's glow goes down first, behind him, so it lights the air but never smudges the armour
  { const F = knightFrame(cx, by), lsw = Math.round(-P.pose.lean * 0.4), lx = cx + f * (F.hipX - cx + 5.5 + lsw), ly = F.hipY - 2, lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 7);
    lg.addColorStop(0, 'rgba(255,200,110,.4)'); lg.addColorStop(1, 'rgba(255,180,90,0)'); ctx.fillStyle = lg; ctx.fillRect(lx - 7, ly - 7, 14, 14); }
  const R = knightSnap(() => knightPass(cx, by, f, t, sit, 'A'), cx, by, 'A');
  // the soft parts stay soft: the helm flame and the swing smear
  ctx.save(); ctx.translate(cx, 0); ctx.scale(f, 1); ctx.translate(-cx, 0);
  drawFlame(R.hx + 0.5, R.hy - 3, 0.85, t, R.hurt ? C.ember : C.flame, C.core);
  if (P.smear) knightSmear(R.fs.x, R.fs.y, P.smear, R.fire, t);
  ctx.restore();
  knightSnap(() => knightPass(cx, by, f, t, sit, 'B'), cx, by, 'B');
  if (R.fire) { ctx.save(); ctx.translate(cx, 0); ctx.scale(f, 1); ctx.translate(-cx, 0); for (let i = 0; i < 3; i++) drawFlame(R.hand.x + R.ux * (5 + i * 4), R.hand.y + R.uy * (5 + i * 4), 0.7, t * 1.3 + i, C.ember, C.flame); ctx.restore(); }
}

