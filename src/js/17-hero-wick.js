// ---------- Wick: a little candle-spirit with a pin (short sword); a wide, flat, nail-style crescent on every swing.
const SN = { dur:0.2, cd:0.3 };
function wickSlashGeom(dir, cx, by, f) {
  // local space: the crescent opens toward +x; mirrored and rotated into place
  if (dir === 'up') return { ox:cx, oy:by - 9, rot:-Math.PI / 2, sx:1, sy:f, Rx:28, Ry:23 };
  if (dir === 'down') return { ox:cx, oy:by - 6, rot:Math.PI / 2, sx:1, sy:-f, Rx:28, Ry:23 };
  return { ox:cx - f * 5, oy:by - 8, rot:0, sx:f, sy:P.alt ? -1 : 1, Rx:35, Ry:18 };
}
function drawWickSlash(cx, by, f) {
  const p = clamp(1 - P.atkT / SN.dur, 0, 1); if (p >= 0.92) return;
  const g = wickSlashGeom(P.atkDir, cx, by, f);
  const A0 = -1.35, A1 = 1.35, span = A1 - A0;
  const head = A0 + span * Math.min(1, p * 4.2);                // the edge whips across in the first quarter
  const tail = A0 + span * Math.max(0, (p - 0.3) / 0.62);       // then the crescent thins away toward its tip
  if (head - tail < 0.05) return;
  const fade = p < 0.55 ? 1 : 1 - (p - 0.55) / 0.37, thick = 9.5 * (p < 0.3 ? 1 : 1 - (p - 0.3) * 0.9);
  ctx.save(); ctx.translate(g.ox, g.oy); ctx.rotate(g.rot); ctx.scale(g.sx, g.sy);
  const band = (Rx, Ry, th, col) => {
    const N = 22; ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i <= N; i++) { const a = tail + (head - tail) * i / N; ctx.lineTo(Math.cos(a) * Rx, Math.sin(a) * Ry); }
    for (let i = N; i >= 0; i--) {
      const a = tail + (head - tail) * i / N, u = (a - A0) / span, w = th * Math.pow(Math.sin(Math.PI * u), 0.8);
      ctx.lineTo(Math.cos(a) * (Rx - w), Math.sin(a) * (Ry - w * 0.8));
    }
    ctx.closePath(); ctx.fill();
  };
  band(g.Rx + 3, g.Ry + 2.5, thick + 4, `rgba(170,150,210,${0.32 * fade})`);   // soft outer haze
  band(g.Rx, g.Ry, thick, `rgba(250,250,255,${0.96 * fade})`);                // the white crescent
  band(g.Rx - thick * 0.55, g.Ry - thick * 0.45, thick * 0.35, `rgba(205,214,236,${0.55 * fade})`); // inner shading
  // speed lines just outside the edge
  ctx.strokeStyle = `rgba(255,255,255,${0.7 * fade})`; ctx.lineWidth = 0.8;
  for (const [dr, s0, s1] of [[5, 0.2, 0.75], [8, 0.4, 0.9]]) {
    const a0 = Math.max(tail, A0 + span * s0), a1 = Math.min(head, A0 + span * s1); if (a1 <= a0) continue;
    ctx.beginPath(); for (let i = 0; i <= 10; i++) { const a = a0 + (a1 - a0) * i / 10; ctx.lineTo(Math.cos(a) * (g.Rx + dr), Math.sin(a) * (g.Ry + dr * 0.8)); } ctx.stroke();
  }
  // bright tip on the leading edge while it is still travelling
  if (p < 0.3) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(Math.cos(head) * (g.Rx - 1.5), Math.sin(head) * (g.Ry - 1.2), 2.2, 0, TAU); ctx.fill(); }
  ctx.restore();
}
// Wick's short sword: leather grip, brass pommel and guard, a steel blade with a fuller and a bright edge, pointed tip
function drawWickSword(hx, hy, dx, dy) {
  const px = -dy, py = dx, L = 9;
  ctx.lineCap = 'butt'; ctx.strokeStyle = HP.leather[1]; ctx.lineWidth = 1.4; kline(hx - dx * 2.5, hy - dy * 2.5, hx + dx * 0.6, hy + dy * 0.6);
  ctx.fillStyle = C.brass; ctx.fillRect(Math.round(hx - dx * 3.2) - 0.5, Math.round(hy - dy * 3.2) - 0.5, 1, 1);
  ctx.strokeStyle = C.brass; ctx.lineWidth = 1.2; kline(hx + dx * 1.1 + px * 2, hy + dy * 1.1 + py * 2, hx + dx * 1.1 - px * 2, hy + dy * 1.1 - py * 2);
  const b0x = hx + dx * 1.6, b0y = hy + dy * 1.6, sx = hx + dx * (L - 0.5), sy = hy + dy * (L - 0.5), tx = hx + dx * (L + 1.6), ty = hy + dy * (L + 1.6);
  ctx.fillStyle = HP.steel[6]; ctx.beginPath(); ctx.moveTo(b0x + px * 0.85, b0y + py * 0.85); ctx.lineTo(sx + px * 0.75, sy + py * 0.75); ctx.lineTo(tx, ty);
  ctx.lineTo(sx - px * 0.75, sy - py * 0.75); ctx.lineTo(b0x - px * 0.85, b0y - py * 0.85); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = HP.steel[4]; ctx.lineWidth = 0.5; kline(b0x, b0y, hx + dx * (L - 2), hy + dy * (L - 2));        // fuller
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.5; kline(b0x + px * 0.6, b0y + py * 0.6, tx, ty);                  // edge catching the candlelight
}

// Crisp pass for Wick and Wick Hero (test): their solid parts snap to their own colours with hard edges and a
// selective outline; fire, glow, streaks and smears are left exactly as drawn.
const CRISP = { c:null, g:null, pal:{} };
const CRISP_PAL = {
  wick:[HP.ink, HP.leather[0], HP.soot, HP.wick[0], HP.leather[1], HP.wick[1], HP.wick[2], HP.steel[4], HP.wick[3], C.waxSh, HP.steel[6], C.waxMid, C.wax, HP.brass[2], C.waxHi, '#ffffff', C.brass],
  hero:[HP.ink, HP.hero[0], HP.heroCoat[0], HP.heroCoat[1], HP.steel[0], HP.heroCoat[2], HP.hero[1], HP.steel[1], HP.hero[2], HP.steel[2], HP.hero[3], HP.steel[4], HP.steel[5], HP.steel[6], HP.hero[4], HP.coldWax[0], HP.steel[7], HP.coldWax[1], C.brass, '#ffffff', HP.coldWax[2]]
};
function crispChar(id, fn, cx, by) {
  const real = ctx;
  if (!real.canvas || !real.canvas.width || typeof real.getImageData !== 'function' || typeof real.getTransform !== 'function') return fn();
  const cw = real.canvas.width, ch = real.canvas.height;
  if (!CRISP.c || CRISP.c.width !== cw || CRISP.c.height !== ch) { CRISP.c = document.createElement('canvas'); CRISP.c.width = cw; CRISP.c.height = ch; CRISP.g = CRISP.c.getContext('2d', { willReadFrequently:true }); }
  const g = CRISP.g, m = real.getTransform();
  const x0 = Math.max(0, Math.floor(m.a * (cx - 48) + m.e)), y0 = Math.max(0, Math.floor(m.d * (by - 60) + m.f));
  const x1 = Math.min(cw, Math.ceil(m.a * (cx + 48) + m.e)), y1 = Math.min(ch, Math.ceil(m.d * (by + 12) + m.f));
  if (x1 <= x0 || y1 <= y0) return fn();
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(x0, y0, x1 - x0, y1 - y0); g.setTransform(m); g.globalAlpha = real.globalAlpha;
  let r; ctx = g;
  try { r = fn(); } finally { ctx = real; }
  const w = x1 - x0, h = y1 - y0, im = g.getImageData(x0, y0, w, h), d = im.data;
  const pal = CRISP.pal[id] || (CRISP.pal[id] = CRISP_PAL[id].map(hexRgb)), cache = new Map();
  const near = k => { const key = (d[k] << 16) | (d[k + 1] << 8) | d[k + 2]; let e = cache.get(key);
    if (!e) { let best = 1e9, c = null; for (const p of pal) { const q = (p[0] - d[k]) ** 2 + (p[1] - d[k + 1]) ** 2 + (p[2] - d[k + 2]) ** 2; if (q < best) { best = q; c = p; } } e = [best, c]; cache.set(key, e); } return e; };
  const solid = new Uint8Array(w * h), fireY = Math.round(m.d * (by - 16) + m.f) - y0;
  // the flame and its bloom sit above the head: leave everything up there exactly as drawn
  for (let p = Math.max(0, fireY) * w; p < w * h; p++) { const k = p * 4; if (d[k + 3] >= 96) { const [q, c] = near(k); if (q < 46 * 46) { d[k] = c[0]; d[k + 1] = c[1]; d[k + 2] = c[2]; d[k + 3] = 255; solid[p] = 1; } } }
  // soft fringes around the solid shapes go; streaks, glow and fire further out stay
  for (let y = Math.max(0, fireY); y < h; y++) for (let x = 0; x < w; x++) { const p = y * w + x, k = p * 4; if (solid[p] || !d[k + 3] || d[k + 3] >= 96) continue;
    const adj = (x > 0 && solid[p - 1]) || (x < w - 1 && solid[p + 1]) || (y > 0 && solid[p - w]) || (y < h - 1 && solid[p + w]);
    if (adj && near(k)[0] < 46 * 46) d[k + 3] = 0; }
  // selective outline: outside only, none on lit top edges, none up in the flame
  for (let y = Math.max(0, fireY); y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, k = p * 4; if (solid[p] || d[k + 3] >= 96) continue;
    let s = -1; if (y > 0 && solid[p - w]) s = p - w; else if (x > 0 && solid[p - 1]) s = p - 1; else if (x < w - 1 && solid[p + 1]) s = p + 1;
    if (s < 0) continue;
    const rr = d[s * 4], gg = d[s * 4 + 1], bb = d[s * 4 + 2], lightWarm = rr > 170 && rr > bb + 20;
    if (lightWarm) { d[k] = 58; d[k + 1] = 42; d[k + 2] = 34; } else { d[k] = 16; d[k + 1] = 22; d[k + 2] = 38; } d[k + 3] = 255;
  }
  g.putImageData(im, x0, y0);
  real.save(); real.setTransform(1, 0, 0, 1, 0, 0); real.drawImage(CRISP.c, x0, y0, w, h, x0, y0, w, h); real.restore();
  return r;
}
function drawWickBody(cx, by, f, t, sit) {
  const atk = P.atkT > 0, p = atk ? 1 - P.atkT / SN.dur : 1;
  // weight, the way a hand-animated platformer hero moves: stretch on take-off, squash on landing, a lunge into the slash
  const ddt = clamp(t - (P._lt == null ? t : P._lt), 0, 0.05); P._lt = t;
  if (P.grounded && P._air) P.landT = 0.14; P._air = !P.grounded; if (P.landT > 0) P.landT -= ddt;
  // squash and stretch in whole pixels so the pixel art stays crisp: the body sinks on landing and on the lunge, rises on take-off
  let sq = 0;
  if (P.landT > 0) sq = Math.round(2 * P.landT / 0.14);
  else if (P.dashT > 0 || (atk && P.atkDir === 'side' && p < 0.4)) sq = 1;
  else if (!P.grounded && P.vy < -60) sq = -1;
  const low = (sit ? 3 : P.healT > 0 ? 2 : idleBob()) + sq;
  // dash: faint streaks left behind at head and body height
  if (P.dashT > 0) for (let i = 1; i <= 3; i++) { ctx.fillStyle = `rgba(239,227,194,${0.3 / i})`; ctx.fillRect(cx - f * (4 + i * 5) - 3, by - 13, 6, 1); ctx.fillStyle = `rgba(58,43,75,${0.4 / i})`; ctx.fillRect(cx - f * (4 + i * 5) - 3, by - 7, 6, 1); }

  const tipHat = P.idleT > 3 && (P.idleT % 7) > 5.6 && (P.idleT % 7) < 6.5 ? -2 : 0;
  const lean = atk && P.atkDir === 'side' ? (p < 0.35 ? 2 : 1) * f : 0;   // a snap forward into the slash
  const bob = atk && P.atkDir === 'up' ? -1 : atk && P.atkDir === 'down' ? 1 : 0;
  // legs
  if (!sit) {
    ctx.fillStyle = HP.wick[0];
    let l1 = 0, l2 = 0;
    if (P.grounded && Math.abs(P.vx) > 10) { const ph = Math.floor(P.anim * 12) % 4; l1 = [0, -1, 0, 1][ph]; l2 = -l1; }
    if (!P.grounded) { l1 = -1; l2 = 1; }
    if (atk && P.atkDir === 'side' && P.grounded) { l1 = 0; l2 = 0; ctx.fillRect(cx - f * 4 - 1, by - 2, 2, 2); ctx.fillRect(cx + f * 3 - 1, by - 3, 2, 3); }
    else {
      ctx.fillRect(cx - 3, by - 3 + Math.min(0, l1), 2, 3 - Math.abs(Math.min(0, l1)));
      ctx.fillRect(cx + 1, by - 3 + Math.min(0, l2), 2, 3 - Math.abs(Math.min(0, l2)));
    }
  }
  // ---- the sword: a short blade with a brass guard, always in his hand. Work out where the hand is and where it points.
  const bx = cx + lean, it = P.idleT || 0;
  let shx = bx + f, shy = by - 8 + low + bob;
  let wx, wy, dx, dy, behind = false;
  if (atk) {
    // during a swing the blade leads the crescent's edge, then holds the follow-through
    const g = wickSlashGeom(P.atkDir, cx, by, f), a = -1.35 + 2.7 * Math.min(1, p * 4.2);
    const lx = Math.cos(a) * g.sx, ly = Math.sin(a) * g.sy, c = Math.cos(g.rot), sn = Math.sin(g.rot);
    dx = lx * c - ly * sn; dy = lx * sn + ly * c; wx = bx + f * 2 + dx * 2; wy = by - 7 + low + bob + dy * 2;
  } else if (P.healT > 0 || sit) {
    // planted point-down in front while focusing or resting, both hands on the pommel
    wx = bx + f * 4; wy = by - 12 + (sit ? 3 : 0); dx = 0; dy = 1;
  } else if (P.dashT > 0) { shx = bx - f * 2; wx = bx - f * 4; wy = by - 6; dx = -f; dy = 0.12; behind = true; }
  else if (!P.grounded) { shx = bx - f * 2; wx = bx - f * 4; wy = by - 7 + low; dx = -f * 0.55; dy = 0.84; behind = true; }
  else if (Math.abs(P.vx) > 10) {
    // running: the blade trails low behind him and bobs with the stride
    const sw = Math.sin(P.anim * 12) * 0.12; shx = bx - f * 2; wx = bx - f * 4; wy = by - 5 + low; dx = -f * Math.cos(0.55 + sw); dy = Math.sin(0.55 + sw); behind = true;
  } else {
    // idle: the blade hangs low in his hand, tip trailing behind him, moving only with his breath
    const th = 0.95 + 0.03 * Math.sin(it * 2); shx = bx - f * 2; wx = bx - f * 4; wy = by - 5 + low; dx = -f * Math.cos(th); dy = Math.sin(th); behind = true;
  }
  const sword = () => {
    ctx.lineCap = 'round'; ctx.strokeStyle = HP.wick[0]; ctx.lineWidth = 2; kline(shx, shy, wx, wy);   // arm
    drawWickSword(wx, wy, dx, dy);
    ctx.fillStyle = C.wax; ctx.fillRect(Math.round(wx) - 0.5, Math.round(wy) - 0.5, 1, 1);         // a little wax hand on the grip
    ctx.lineCap = 'butt';
  };
  if (behind) sword();
  // a cape with a ragged hem: it streams back with speed, lifts while falling and snaps back on a slash
  const spd = clamp(Math.abs(P.vx) / 45, 0, 3) + (P.dashT > 0 ? 2 : 0), lift = !P.grounded ? clamp(P.vy / 80, -1, 3) : 0;
  const fl = Math.sin(t * 11) * (spd > 0.5 || !P.grounded ? 0.8 : 0.25), topY = by - 9 + low + bob, hemY = by - 2 + (sit ? 1 : 0);
  const fX = bx + f * (4 - spd * 0.3), bX = bx - f * (7 + spd * 1.6 + (atk ? 2 : 0)), bY = hemY - lift - spd * 1.1 + fl;
  const m1 = fX + (bX - fX) / 3, m2 = fX + (bX - fX) * 2 / 3;
  ctx.fillStyle = HP.wick[1]; ctx.beginPath();
  ctx.moveTo(bx - f * 4, topY - 1); ctx.lineTo(bx + f * 4, topY - 1); ctx.lineTo(bx + f * 5, topY + 2); ctx.lineTo(fX, hemY);
  ctx.lineTo(m1, hemY - 1); ctx.lineTo((m1 + m2) / 2, hemY + 0.5); ctx.lineTo(m2, (hemY + bY) / 2 - 1); ctx.lineTo(bX, bY);
  ctx.lineTo(bx - f * 6, topY + 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = HP.wick[0]; ctx.lineWidth = 0.9; kline(bx - f, topY + 2, m2, (hemY + bY) / 2 - 1.5);   // a fold in shadow
  // a pale trim along the ragged hem
  ctx.strokeStyle = HP.wick[3]; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(fX, hemY); ctx.lineTo(m1, hemY - 1); ctx.lineTo((m1 + m2) / 2, hemY + 0.5); ctx.lineTo(m2, (hemY + bY) / 2 - 1); ctx.lineTo(bX, bY); ctx.stroke();
  // his own flame lights the tops of his shoulders
  ctx.fillStyle = HP.brass[2]; ctx.fillRect(Math.min(bx - f * 3, bx + f * 3), topY - 1, 6, 1);
  ctx.fillStyle = HP.wick[2]; ctx.fillRect(f > 0 ? bx + 2 : bx - 3, topY, 1, 5);
  // a belt with a small brass buckle and the empty scabbard at his hip
  ctx.fillStyle = HP.leather[0]; ctx.fillRect(bx - 4, by - 5 + low + bob, 8, 1); ctx.fillStyle = C.brass; ctx.fillRect(bx + f, by - 5 + low + bob, 1, 1);
  ctx.strokeStyle = HP.leather[1]; ctx.lineWidth = 1.2; kline(bx - f * 3, by - 5 + low + bob, bx - f * 7, by - 2 + low + bob);
  if (!behind) sword();
  // a candle head: cream wax with a soft melted rim and drips, a dark wick and a living flame
  const hy = by - 16 + low + bob, hx = bx, lit = f > 0 ? 1 : -1;
  ctx.fillStyle = C.wax; ctx.fillRect(hx - 4, hy, 8, 8);
  ctx.fillStyle = C.waxSh; ctx.fillRect(lit > 0 ? hx - 4 : hx + 3, hy + 1, 1, 7); ctx.fillRect(hx - 3, hy + 7, 6, 1);
  ctx.fillStyle = C.waxHi; ctx.fillRect(hx - 4, hy, 8, 1); ctx.fillRect(lit > 0 ? hx + 2 : hx - 3, hy + 1, 1, 5);
  // melted lip spilling over the rim, and two drips running down the wax
  ctx.fillStyle = C.waxHi; ctx.fillRect(hx - 5, hy, 1, 2); ctx.fillRect(hx + 4, hy, 1, 1);
  ctx.fillRect(hx - 2 * lit, hy + 1, 1, 3); ctx.fillRect(hx + 3 * lit, hy + 1, 1, 2);
  ctx.fillStyle = C.waxMid; ctx.fillRect(hx - 2 * lit, hy + 4, 1, 1); ctx.fillRect(hx - 5, hy + 2, 1, 1);
  // a little wax collar where the head meets the cloak
  ctx.fillStyle = C.waxMid; ctx.fillRect(hx - 3, hy + 8, 6, 1);
  const blink = !sit && ((t % 3.7) < 0.1 || idleBlink()), eo = idleLook() && !atk ? -f : f;
  ctx.fillStyle = HP.ink;
  if (sit || blink) { ctx.fillRect(hx - 2 + eo, hy + 4, 2, 1); ctx.fillRect(hx + 1 + eo, hy + 4, 2, 1); }
  else { ctx.fillRect(hx - 2 + eo, hy + 3, 1, 2); ctx.fillRect(hx + 1 + eo, hy + 3, 1, 2); ctx.fillStyle = C.waxHi; ctx.fillRect(hx - 2 + eo, hy + 3, 1, 1); ctx.fillRect(hx + 1 + eo, hy + 3, 1, 1); }
  if (P.hurtT > 0) { ctx.fillStyle = HP.ink; ctx.fillRect(hx - 1 + eo, hy + 6, 2, 1); }
  // wick and flame: it streams back on a swing and swells while focusing
  const lean2 = atk ? -f * 1.2 : clamp(-P.vx / 90, -1.5, 1.5);
  ctx.fillStyle = HP.soot; ctx.fillRect(hx, hy - 2, 1, 2);
  const big = P.healT > 0 ? 1.25 + P.healT * 0.4 : 1;
  drawFlame(hx + 0.5 + lean2, hy - 2, big, t, P.hurtT > 0 ? C.ember : C.flame, C.core);
}
