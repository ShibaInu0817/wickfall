// ----- Chapter 3 drawing: the kiln crust, the wax ledges, the wyrm, the pupa, the moth, cocoons
// one wax segment of the wyrm: dark rim, pale body, a molten seam along its back
// the wyrm, drawn like the other bosses: flat tallow wax with a shaded side, drips, wick flames, a dark eye mask
// the cap: the same soft white wax as the floors you dive through
// the Kiln Pit: a white wax bridge over open lava. The wyrm swims in the lava below, in plain view.
function drawKiln(cx0, t) {
  const B = G.boss, kiln = G.room.def.id === 'kiln', wyrmish = B && B.kind === 'wyrm';
  if (!kiln && !wyrmish) return;
  const floorY = 13 * T, [x0, x1] = wyrmPool(), cool = kiln && (G.bossDown || (B && B.kind === 'moth')) ? 1 : (G.kilnCool || 0), hot = 1 - cool;
  const a = Math.max(0, Math.min(W, x0 - cx0)), b = Math.max(0, Math.min(W, x1 - cx0));
  if (b > a) {
    // the air gap under the bridge, lit from below
    const surf = floorY + 30;
    const ag = ctx.createLinearGradient(0, floorY + 6, 0, surf); ag.addColorStop(0, mixC('#3a160a', '#120c0a', cool)); ag.addColorStop(1, mixC('#b8481a', '#1a1210', cool));
    ctx.fillStyle = ag; ctx.fillRect(a, floorY + 6, b - a, surf - floorY - 6);
    // the wyrm, half in the lava: its back breaks the surface as it swims
    if (wyrmish) drawWyrmUnder(cx0, t, B);
    // the lava, drawn over the wyrm's lower half
    const lv = ctx.createLinearGradient(0, surf, 0, H);
    lv.addColorStop(0, mixC('#ffb04a', '#3a2a24', cool)); lv.addColorStop(0.3, mixC('#e8641e', '#2a1e1a', cool)); lv.addColorStop(1, mixC('#7a1e0c', '#160f0c', cool));
    ctx.fillStyle = lv;
    for (let x = Math.floor(a / 2) * 2; x < b; x += 2) { const wy = Math.round(surf + Math.sin(t * 2.2 + (x + cx0) * 0.06) * 1.5 + Math.sin(t * 3.7 + (x + cx0) * 0.15) * 0.8); ctx.fillRect(x, wy, 2, H - wy); }
    ctx.fillStyle = mixC('#ffe08a', '#4a3a32', cool);
    for (let x = Math.floor(a / 2) * 2; x < b; x += 2) { const wy = Math.round(surf + Math.sin(t * 2.2 + (x + cx0) * 0.06) * 1.5 + Math.sin(t * 3.7 + (x + cx0) * 0.15) * 0.8); ctx.fillRect(x, wy, 2, 1); }
    if (hot > 0.1) for (let i = 0; i < 8; i++) { const k = (t * 0.7 + i * 0.29) % 1, x = x0 + ((ih(i, Math.floor(t * 0.7 + i * 0.29)) % 1000) / 1000) * (x1 - x0) - cx0; if (x < a || x > b) continue;
      ctx.fillStyle = `rgba(255,${200 + (i % 3) * 15},120,${(1 - k) * hot})`; ctx.beginPath(); ctx.arc(x, surf - k * 8, 1 + k * 1.5, 0, TAU); ctx.fill(); }
    // heat rising through the slats
    if (hot > 0) { const g = ctx.createLinearGradient(0, floorY - 30, 0, floorY); g.addColorStop(0, 'rgba(255,140,60,0)'); g.addColorStop(1, `rgba(255,150,60,${0.14 * hot})`); ctx.fillStyle = g; ctx.fillRect(a, floorY - 30, b - a, 30); }
    // two wax pillars hold the bridge up
    for (const k of [1 / 3, 2 / 3]) { const sx = Math.round(x0 + (x1 - x0) * k - cx0); if (sx < -8 || sx > W + 8) continue;
      ctx.fillStyle = C.waxSh; ctx.fillRect(sx - 4, floorY + 6, 8, H - floorY); ctx.fillStyle = C.wax; ctx.fillRect(sx - 4, floorY + 6, 4, H - floorY); ctx.fillStyle = C.waxHi; ctx.fillRect(sx - 3, floorY + 6, 1, surf - floorY - 6);
      ctx.fillStyle = mixC('#ff8a2a', '#2a1e1a', cool); ctx.fillRect(sx - 4, surf - 1, 8, 3); }
    // the bridge deck: white wax planks with gaps you can see the lava through
    const sh = G.shake > 2 ? Math.round(rand(-1, 1)) : 0;
    for (let x = Math.floor(x0 / 12) * 12; x < x1; x += 12) {
      const sx = x - cx0; if (sx < -12 || sx > W) continue;
      const dy = sh * ((x / 12) % 2 ? 1 : -1);
      ctx.fillStyle = C.waxSh; ctx.fillRect(sx, floorY + dy, 11, 6);
      ctx.fillStyle = C.wax; ctx.fillRect(sx, floorY + dy, 11, 4);
      ctx.fillStyle = C.waxHi; ctx.fillRect(sx + 1, floorY + dy, 9, 1);
      ctx.fillStyle = hot > 0.05 ? `rgba(255,${150 + Math.round(60 * Math.sin(t * 4 + x))},70,${0.9 * hot + 0.1})` : '#1a1210'; ctx.fillRect(sx + 11, floorY, 1, 6);
      if (ih(x, 5) % 4 === 0) { ctx.fillStyle = C.waxSh; ctx.fillRect(sx + 3 + (ih(x, 6) % 5), floorY + 6 + dy, 2, 2 + ih(x, 7) % 3); }
    }
  }
  // props on the bridge
  if (G.props) for (const p of G.props) drawProp(p, cx0, t, floorY);
  drawHusk(cx0, t);
  // the white wax ledges rising up the walls
  if (G.ledges) for (const L of G.ledges) {
    const e = 1 - Math.pow(1 - L.k, 3), x = L.x * T - cx0, y = Math.round(L.y * T + (1 - e) * 36), w = L.w * T;
    if (x + w < 0 || x > W) continue;
    ctx.globalAlpha = Math.min(1, L.k * 2);
    ctx.fillStyle = C.waxDk; ctx.fillRect(x - 1, y - 1, w + 2, 7);
    ctx.fillStyle = C.waxSh; ctx.fillRect(x, y, w, 6);
    ctx.fillStyle = C.wax; ctx.fillRect(x, y, w, 4);
    ctx.fillStyle = C.waxHi; ctx.fillRect(x, y, w, 1);
    for (let i = 0; i < L.w * 2; i++) { const hx = ih(L.x * 7 + i, L.y), len = 2 + hx % 5; if (hx % 3 === 0) continue; ctx.fillStyle = C.waxSh; ctx.fillRect(x + i * 8 + (hx % 6), y + 6, 2, len); ctx.fillStyle = C.wax; ctx.fillRect(x + i * 8 + (hx % 6), y + 6 + len, 2, 1); }
    ctx.globalAlpha = 1;
  }
}
function drawProp(p, cx0, t, floorY) {
  const x = Math.round(p.x - cx0); if (x < -16 || x > W + 16) return;
  const y = Math.round(floorY + p.y);
  ctx.save(); ctx.translate(x, y); ctx.rotate(p.r);
  if (p.kind === 'crate') {
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(-6, -10, 12, 10); ctx.fillStyle = '#6e4e2e'; ctx.fillRect(-5, -9, 10, 8); ctx.fillStyle = '#8a6a40'; ctx.fillRect(-5, -9, 10, 1); ctx.fillRect(-5, -5, 10, 1);
    ctx.fillStyle = '#4a3420'; ctx.fillRect(-5, -9, 1, 8); ctx.fillRect(4, -9, 1, 8); ctx.fillStyle = C.wax; ctx.fillRect(-2, -11, 4, 2);
  } else if (p.kind === 'jar') {
    ctx.fillStyle = '#2a1c14'; ctx.fillRect(-4, -10, 8, 10); ctx.fillStyle = '#9a5a34'; ctx.fillRect(-3, -9, 6, 8); ctx.fillStyle = '#c47a48'; ctx.fillRect(-3, -9, 2, 7);
    ctx.fillStyle = C.wax; ctx.fillRect(-3, -11, 6, 2); ctx.fillStyle = C.waxSh; ctx.fillRect(-2, -9, 1, 2);
  } else {
    const n = p.kind === 'candles' ? 3 : 1;
    for (let i = 0; i < n; i++) { const cx = (i - (n - 1) / 2) * 4, h = 6 - (i % 2) * 2; ctx.fillStyle = C.wax; ctx.fillRect(cx - 1, -h, 3, h); ctx.fillStyle = C.waxSh; ctx.fillRect(cx + 1, -h, 1, h); ctx.fillStyle = '#2a2222'; ctx.fillRect(cx, -h - 2, 1, 2); drawFlame(cx + 0.5, -h - 2, 0.55, t + i + p.x, C.flame, C.core); }
  }
  ctx.restore();
}
// one plate of the wyrm's shell: dark bronze, a lit ridge, molten seams. Broken open (arm 0) the seams blaze.
const WY = { body:'#4a3426', shade:'#2e1a15', hi:'#977644', rim:'#190d0b', spike:'#725436' };
function wyrmSeg(x, y, r, fl, hot, t, i, arm, flashA) {
  r *= 1.25;
  const w = Math.round(r * 2), h = Math.round(r * 1.8), x0 = Math.round(x - r), y0 = Math.round(y - h / 2);
  const body = fl ? '#ffffff' : flashA ? '#9a8a7a' : WY.body, shade = fl ? '#ffffff' : WY.shade;
  ctx.fillStyle = WY.rim; ctx.beginPath(); ctx.moveTo(x0 - 1, y0 + h + 1); ctx.lineTo(x0 - 1, y0 + 4); ctx.quadraticCurveTo(x0 - 1, y0 - 1, x0 + 4, y0 - 1); ctx.lineTo(x0 + w - 4, y0 - 1); ctx.quadraticCurveTo(x0 + w + 1, y0 - 1, x0 + w + 1, y0 + 4); ctx.lineTo(x0 + w + 1, y0 + h + 1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0, y0 + 4); ctx.quadraticCurveTo(x0, y0, x0 + 4, y0); ctx.lineTo(x0 + w - 4, y0); ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + 4); ctx.lineTo(x0 + w, y0 + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade; ctx.fillRect(x0 + w - 3, y0 + 3, 3, h - 3); ctx.fillRect(x0, y0 + h - 3, w, 3);
  if (!fl) { ctx.fillStyle = flashA ? '#ffffff' : WY.hi; ctx.fillRect(x0 + 2, y0 + 1, w - 6, 1); ctx.fillRect(x0 + 1, y0 + 2, 1, Math.round(h * 0.4)); }
  // two little ridge spikes along the spine
  ctx.fillStyle = fl ? '#fff' : WY.spike; ctx.fillRect(Math.round(x) - 3, y0 - 3, 2, 3); ctx.fillRect(Math.round(x) + 2, y0 - 2, 2, 2);
  // molten seam between plates; cracked wide open when stunned
  const p = 0.6 + 0.4 * Math.sin(t * 6 + i);
  ctx.fillStyle = `rgba(255,${110 + Math.round(60 * p)},40,${arm === 0 ? 1 : Math.max(0.35, hot)})`; ctx.fillRect(x0, y0 + h - 1, w, 1);
  if (arm === 0) { ctx.fillStyle = `rgba(255,${170 + Math.round(60 * p)},80,.95)`; ctx.fillRect(x0 + 3, y0 + 3, 1, h - 6); ctx.fillRect(x0 + 3, y0 + Math.round(h / 2), w - 8, 1); ctx.fillRect(x0 + w - 6, y0 + 2, 1, Math.round(h / 2)); }
}
// the one soft spot: a plug of white wax sealing the top of its skull, the same wax as the floors you dive through
function drawWyrmCap(x, top, k, glint, t) {
  if (k <= 0) return;
  const w = Math.round(18 * (0.4 + 0.6 * k)), h = Math.max(2, Math.round(7 * k)), x0 = Math.round(x - w / 2), y0 = Math.round(top - h + 2);
  ctx.fillStyle = C.waxDk; ctx.fillRect(x0 - 1, y0 - 1, w + 2, h + 2);
  ctx.fillStyle = C.waxSh; ctx.fillRect(x0, y0, w, h);
  ctx.fillStyle = C.wax; ctx.fillRect(x0, y0, w, h - 2);
  ctx.fillStyle = C.waxHi; ctx.fillRect(x0 + 1, y0, w - 2, 1);
  ctx.fillStyle = C.wax; ctx.fillRect(x0 + 2, y0 + h, 2, 3); ctx.fillRect(x0 + w - 5, y0 + h, 2, 4);
  ctx.fillStyle = '#e7d3b1'; ctx.fillRect(x0 + 3, y0 - 2, 3, 1); ctx.fillRect(x0 + w - 7, y0 - 2, 4, 1);
  if (glint > 0) { const gx = x0 + Math.round(((t * 1.6) % 1) * w); ctx.fillStyle = `rgba(255,255,255,${glint})`; ctx.fillRect(gx, y0, 2, 1); ctx.fillRect(gx - 1, y0 + 1, 1, 1); }
}
function drawWyrmHead(x, y, f, B, fl, t, p2) {
  const sk = B.state === 'spreadW' ? 1 - B.t / B.wt : 0, inhale = B.state === 'spreadW' && sk < 0.55, roaring = B.state === 'spreadW' && !inhale;
  const stun = B.state === 'stun', gape = B.state === 'bite' || roaring || B.state === 'flame' ? 1 : 0, open = B.state === 'bite' ? 1 : roaring ? 1 : inhale ? 0 : B.state === 'biteSnap' ? 0 : B.state === 'flame' ? 1 : B.state === 'biteUp' ? 0.2 : B.state === 'quakeW' ? 0.9 : B.state === 'quakeSlam' ? 0 : B.state === 'spreadW' ? 0.3 + 0.7 * (1 - B.t / B.wt) : B.state === 'spreadEnd' ? 0.6 : 0.15;
  const w = 28, h = 24, x0 = Math.round(x - w / 2), y0 = Math.round(y - h / 2), body = fl ? '#ffffff' : B.armorT > 0 ? '#9a8a7a' : WY.body, shade = fl ? '#ffffff' : WY.shade;
  if (B.state === 'spreadW') { const k = inhale ? sk / 0.55 : 1, g = ctx.createRadialGradient(x - f * 2, y + 14, 0, x - f * 2, y + 14, 10 + k * 16); g.addColorStop(0, `rgba(255,200,110,${0.7 * k})`); g.addColorStop(1, 'rgba(255,120,50,0)'); ctx.fillStyle = g; ctx.fillRect(x - 30, y - 24, 60, 60); }
  // lower jaw
  const drop = Math.round(open * (gape ? 14 : 6)), jy = y0 + h - 6 + drop;
  ctx.fillStyle = '#2a0c06'; ctx.fillRect(x0 + 2, y0 + h - 8, w - 4, drop + 3);
  if (open > 0.2) { ctx.fillStyle = gape ? '#c2301a' : `rgba(255,170,80,${open})`; ctx.fillRect(x0 + 5, y0 + h - 6, w - 10, Math.max(1, drop - 1)); if (gape) { ctx.fillStyle = '#ff9a5a'; ctx.fillRect(x0 + 9, y0 + h - 4, w - 18, Math.max(1, drop - 5)); } }
  // upper fangs hang into the gape
  if (open > 0.5) for (let i = 0; i < 5; i++) { ctx.fillStyle = fl ? '#fff' : '#f2e6c4'; ctx.fillRect(x0 + 4 + i * 5, y0 + h - 8, 2, gape ? 4 : 2); }
  ctx.fillStyle = WY.rim; ctx.fillRect(x0 + 1, jy - 1, w - 2, 8); ctx.fillStyle = shade; ctx.fillRect(x0 + 2, jy, w - 4, 6); ctx.fillStyle = body; ctx.fillRect(x0 + 2, jy, w - 6, 4);
  for (let i = 0; i < 4; i++) { ctx.fillStyle = fl ? '#fff' : '#f2e6c4'; ctx.fillRect(x0 + 5 + i * 5, jy - 1, 2, 2); }
  // the shelled skull
  ctx.fillStyle = WY.rim; ctx.beginPath(); ctx.moveTo(x0 - 1, y0 + h - 5); ctx.lineTo(x0 - 1, y0 + 8); ctx.quadraticCurveTo(x0 - 1, y0 - 1, x0 + 8, y0 - 1); ctx.lineTo(x0 + w - 8, y0 - 1); ctx.quadraticCurveTo(x0 + w + 1, y0 - 1, x0 + w + 1, y0 + 8); ctx.lineTo(x0 + w + 1, y0 + h - 5); ctx.closePath(); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(x0, y0 + h - 6); ctx.lineTo(x0, y0 + 8); ctx.quadraticCurveTo(x0, y0, x0 + 8, y0); ctx.lineTo(x0 + w - 8, y0); ctx.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + 8); ctx.lineTo(x0 + w, y0 + h - 6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade; ctx.fillRect(f > 0 ? x0 : x0 + w - 5, y0 + 6, 5, h - 12); ctx.fillRect(x0, y0 + h - 8, w, 2);
  if (!fl) { ctx.fillStyle = B.armorT > 0 ? '#ffffff' : WY.hi; ctx.fillRect(x0 + 6, y0 + 1, w - 12, 1); ctx.fillRect(x0 + 2, y0 + 5, 1, 6); }
  // brow horns
  ctx.fillStyle = fl ? '#fff' : WY.spike; ctx.fillRect(x0 + 1, y0 - 3, 3, 4); ctx.fillRect(x0 + w - 4, y0 - 3, 3, 4);
  // ember eyes set deep in the shell
  const ex = x + f * 4, ey = y0 + 10;
  const exr = Math.round(ex);
  if (stun) { ctx.fillStyle = '#5c4d43'; ctx.fillRect(exr - 7, ey, 4, 1); ctx.fillRect(exr + 3, ey, 4, 1); }
  else if (inhale) {
    // narrowed slits under heavy brows while it draws breath
    ctx.fillStyle = '#100a07'; ctx.fillRect(exr - 8, ey - 3, 6, 4); ctx.fillRect(exr + 2, ey - 3, 6, 4);
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(exr - 7, ey, 4, 1); ctx.fillRect(exr + 3, ey, 4, 1);
    ctx.fillStyle = WY.spike; ctx.fillRect(exr - 9, ey - 4, 7, 2); ctx.fillRect(exr + 2, ey - 4, 7, 2);
  } else if (roaring) {
    // eyes blown wide and white-hot
    ctx.fillStyle = '#100a07'; ctx.fillRect(exr - 9, ey - 4, 7, 7); ctx.fillRect(exr + 2, ey - 4, 7, 7);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(exr - 8, ey - 3, 5, 5); ctx.fillRect(exr + 3, ey - 3, 5, 5); ctx.fillStyle = C.ember; ctx.fillRect(exr - 6, ey - 1, 1, 1); ctx.fillRect(exr + 5, ey - 1, 1, 1);
  } else if (B.state === 'flame') {
    // furious: brows slammed down into a V over burning eyes
    ctx.fillStyle = '#100a07'; ctx.fillRect(exr - 8, ey - 3, 6, 5); ctx.fillRect(exr + 2, ey - 3, 6, 5);
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(exr - 7, ey - 1, 4, 2); ctx.fillRect(exr + 3, ey - 1, 4, 2);
    ctx.fillStyle = WY.spike; for (let i = 0; i < 6; i++) { ctx.fillRect(exr - 9 + i, ey - 5 + Math.floor(i / 2), 1, 2); ctx.fillRect(exr + 8 - i, ey - 5 + Math.floor(i / 2), 1, 2); }
  }
  else { const ec = ['biteW', 'diveW', 'spreadW', 'emerge', 'quakeW'].includes(B.state) ? '#ffffff' : p2 ? '#ff5a3a' : C.flame;
    ctx.fillStyle = '#100a07'; ctx.fillRect(Math.round(ex) - 8, ey - 3, 6, 5); ctx.fillRect(Math.round(ex) + 2, ey - 3, 6, 5);
    ctx.fillStyle = ec; ctx.fillRect(Math.round(ex) - 7, ey - 2, 4, 3); ctx.fillRect(Math.round(ex) + 3, ey - 2, 4, 3); }
  const top = y0 + 1;
  if (stun || B.cap < 1) {
    // the plug is gone: the skull lies open and glowing
    const g = ctx.createRadialGradient(x, top + 2, 0, x, top + 2, 16); g.addColorStop(0, 'rgba(255,210,120,.95)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 16, top - 12, 32, 22);
    ctx.fillStyle = `rgba(255,${170 + Math.round(60 * Math.sin(t * 9))},80,1)`; ctx.fillRect(x0 + 8, top, w - 16, 3);
  }
  const above = !P.dead && !P.grounded && P.y + P.h < top + 4 && Math.abs(P.x + P.w / 2 - Math.round(G.cam.x) - x) < 70;
  if (!stun) drawWyrmCap(x, top, B.cap == null ? 1 : B.cap, above ? 0.95 : 0.4 + 0.3 * Math.sin(t * 3), t);
  if (!stun && !P.dead && wyrmCapUp(B) && Math.abs(P.x + P.w / 2 - Math.round(G.cam.x) - x) < 70) markArrow(x, top - 22 + Math.sin(t * 4) * 2);   // dive here (no words in a fight)
  if (B.armorT > 0) { ctx.strokeStyle = `rgba(255,255,255,${B.armorT / 0.22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, y, 20 + (0.22 - B.armorT) * 40, 16 + (0.22 - B.armorT) * 30, 0, 0, TAU); ctx.stroke(); }
  if (stun) for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; ctx.fillStyle = i % 2 ? '#ffe58a' : '#ffffff'; ctx.fillRect(Math.round(x + Math.cos(a) * 12), Math.round(top - 8 + Math.sin(a) * 3), 2, 2); }
}
// the part of the wyrm that is under the bridge, in the lava (drawn before the deck)
function drawWyrmUnder(cx0, t, B) {
  if (B.state === 'pupa') return;
  const floorY = 13 * T, f = B.face || 1, fl = B.flash > 0, p2 = B.hp <= B.maxHp / 2, arm = B.state === 'stun' ? 0 : (B.cap == null ? 1 : B.cap);
  ctx.save(); ctx.beginPath(); ctx.rect(-40, floorY + 6, W + 80, H); ctx.clip();
  if (B.state === 'leap') {
    for (let i = 9; i >= 0; i--) { const k = B.lk - i * 0.055; if (k < 0) continue; const x = B.dx0 + (B.dx1 - B.dx0) * k - cx0, y = floorY + 40 - Math.sin(k * Math.PI) * 128; if (y > floorY + 2) wyrmSeg(x, y, 8.5 - i * 0.4, fl, 0.6, t, i, arm, false); }
    // the far end of its body still slides through the lava
    for (let i = 0; i < 4; i++) { const x = B.dx0 - (B.dx1 - B.dx0) * 0.08 * i - cx0; wyrmSeg(x, floorY + 44 + i * 2, 6.5 - i * 0.5, fl, 0.6, t, i + 10, arm, false); }
  } else {
    // swimming: the head leads and its back breaks the surface in humps, like a dolphin
    const up = B.rise > 0.05, hx = B.hx - cx0, surf = floorY + 30;
    const coil = B.state === 'quakeW' || B.state === 'quakeSlam' ? 1 : 0, biteTell = B.state === 'biteW' ? 1 - B.t / B.wt : 0, ph = t * 2.6;
    for (let i = 9; i >= (up ? 0 : 1); i--) {
      const along = i * (12 - coil * 4), x = hx - f * along, hump = Math.max(0, Math.sin(ph - i * 0.55)) * (16 + coil * 4);
      const y = up && i < 3 ? surf + 6 : surf + 6 - hump;
      wyrmSeg(x, y, 8.5 - i * 0.3, fl, 0.6, t, i, arm, B.armorT > 0);
    }
    if (!up) drawWyrmHead(hx + f * 8, surf - 2 - Math.max(0, Math.sin(ph + 0.6)) * 8 - biteTell * 14, f, B, fl, t, p2);
  }
  ctx.restore();
  // its glow under the deck, so you can track it
  const gx = (B.state === 'leap' ? B.dx0 : B.hx) - cx0, g = ctx.createRadialGradient(gx, floorY + 20, 0, gx, floorY + 20, 40); g.addColorStop(0, 'rgba(255,220,140,.35)'); g.addColorStop(1, 'rgba(255,160,60,0)'); ctx.fillStyle = g; ctx.fillRect(gx - 40, floorY - 20, 80, 70);
}
function drawWyrm(cx0, t, B) {
  if (B.state === 'pupa') return drawPupa(cx0, t, B);
  const floorY = 13 * T, p2 = B.hp <= B.maxHp / 2, fl = B.flash > 0, hot = p2 ? 0.95 : 0.6, f = B.face || 1, arm = B.state === 'stun' ? 0 : (B.cap == null ? 1 : B.cap);
  // tells on the deck
  if (B.state === 'biteW') {
    const k = 1 - B.t / B.wt, x = B.bx - cx0, r = 10 + k * 12;
    const g = ctx.createRadialGradient(x, floorY, 0, x, floorY, r + 12); g.addColorStop(0, `rgba(255,190,100,${0.6 * k + 0.25})`); g.addColorStop(1, 'rgba(255,110,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - r - 12, floorY - r - 12, (r + 12) * 2, r + 16);
    ctx.fillStyle = `rgba(255,230,160,${0.5 + 0.5 * k})`; for (let i = 0; i < 5; i++) ctx.fillRect(Math.round(x - 16 + i * 8), floorY - 1 - Math.round(Math.abs(Math.sin(t * 30 + i)) * 2 * k), 6, 2);
  }
  if (B.state === 'diveW') {
    const k = 1 - B.t / B.wt; ctx.fillStyle = `rgba(255,150,70,${0.3 * k + 0.1})`;
    for (let i = 0; i <= 24; i++) { const kk = i / 24, x = B.dx0 + (B.dx1 - B.dx0) * kk - cx0, y = floorY + 40 - Math.sin(kk * Math.PI) * 128; if (y < floorY) ctx.fillRect(Math.round(x), Math.round(y), 2, 2); }
  }
  if (B.state === 'biteSnap') { const hd = wyrmHead(B), x = hd.x - cx0 + B.face * 6, y = hd.y + 8; ctx.fillStyle = 'rgba(255,255,255,.9)'; for (const d of [-1, 1]) ctx.fillRect(Math.round(x - 14), Math.round(y + d * 6), 28, 1); }
  if (B.state === 'flame') {
    // a hot glow along the burning stretch of bridge; the fire itself is the pixel puffs drawn over the wyrm
    const m = wyrmMouth(B), [bx0, bx1] = wyrmPool(), sx = B.bank ? (B.bank < 0 ? T : bx1) - cx0 : m.x - cx0, ex = B.bank ? (B.bank < 0 ? bx0 : G.room.w * T - T) - cx0 : sx + B.face * B.fd;
    const cg = ctx.createLinearGradient(0, 13 * T - 26, 0, 13 * T); cg.addColorStop(0, 'rgba(255,120,40,0)'); cg.addColorStop(1, 'rgba(255,170,80,.45)'); ctx.fillStyle = cg; ctx.fillRect(Math.min(sx, ex), 13 * T - 26, Math.abs(ex - sx), 26);
  }
  if (B.state === 'spreadW') { const m = wyrmMouth(B), k = 1 - B.t / B.wt, [bx0, bx1] = wyrmPool(); ctx.fillStyle = `rgba(255,150,70,${0.2 + 0.4 * k})`;
    if (B.bank) { const a = B.bank < 0 ? T : bx1, b = B.bank < 0 ? bx0 : G.room.w * T - T; for (let x = a; x < b; x += 6) ctx.fillRect(Math.round(x - cx0), 13 * T - 2 - Math.round(Math.abs(Math.sin(t * 12 + x)) * 2 * k), 3, 2); const g = ctx.createLinearGradient(0, 13 * T - 20, 0, 13 * T); g.addColorStop(0, 'rgba(255,120,40,0)'); g.addColorStop(1, `rgba(255,140,60,${0.35 * k})`); ctx.fillStyle = g; ctx.fillRect(a - cx0, 13 * T - 20, b - a, 20); }
    else for (let d = 30; d < TUNE.flameLen; d += 10) ctx.fillRect(Math.round(m.x - cx0 + B.face * d), 13 * T - 2, 3, 1); }
  if (B.state === 'spreadW' && B.targets) { const k = 1 - B.t / B.wt; for (const tx of B.targets) { const x = tx - cx0; ctx.fillStyle = `rgba(255,120,60,${0.25 + 0.5 * k})`; ctx.fillRect(Math.round(x - 4 - k * 2), floorY - 1, Math.round(8 + k * 4), 1); ctx.fillRect(Math.round(x), floorY - 4 - Math.round(k * 3), 1, 3); } }
  const hd = wyrmHead(B), hx = hd.x - cx0, hy = hd.y;
  ctx.save(); ctx.beginPath(); ctx.rect(-40, -60, W + 80, floorY + 62); ctx.clip();
  if (B.state === 'leap') {
    for (let i = 9; i >= 1; i--) { const k = B.lk - i * 0.055; if (k < 0) continue; const x = B.dx0 + (B.dx1 - B.dx0) * k - cx0, y = floorY + 40 - Math.sin(k * Math.PI) * 128; if (y < floorY + 4) wyrmSeg(x, y, 8.5 - i * 0.4, fl, hot, t, i, arm, false); }
    if (hy < floorY + 4) drawWyrmHead(hx, hy, Math.sign(B.dx1 - B.dx0) || 1, B, fl, t, p2);
  } else if (B.state === 'stun') {
    for (let i = 4; i >= 1; i--) wyrmSeg(hx - f * (10 + i * 11), floorY - 7 - Math.abs(Math.sin(i * 1.3)) * 3, 8 - i * 0.4, fl, hot, t, i, 0, false);
    drawWyrmHead(hx, floorY - 11, f, B, fl, t, p2);
  } else if (B.rise > 0.02) {
    const bx = B.hx - f * 10 - cx0, by = floorY + 36, mx = B.hx - f * 14 - cx0, my = floorY + 10 - B.headUp * B.rise * 0.45;
    const ns = Math.max(6, Math.ceil((by - hy) / 10)); for (let i = ns; i >= 1; i--) { const k = i / (ns + 1), u = 1 - k, x = u * u * hx + 2 * u * k * mx + k * k * bx, y = u * u * hy + 2 * u * k * my + k * k * by; wyrmSeg(x, y + 6, 8.5 - (i / ns) * 1.2, fl, hot, t, i, arm, B.armorT > 0); }
    drawWyrmHead(hx, hy, f, B, fl, t, p2);
  }
  ctx.restore();
  // the broken planks where it came up
  if ((B.rise > 0.1 && B.state !== 'leap') || B.state === 'stun') {
    const x = B.hx - cx0;
    ctx.fillStyle = C.wax; for (const [d, r] of [[-18, -0.5], [-12, -0.25], [12, 0.25], [18, 0.5]]) { ctx.save(); ctx.translate(Math.round(x + d), floorY - 2); ctx.rotate(r); ctx.fillRect(-3, -1, 6, 3); ctx.restore(); }
    const g = ctx.createRadialGradient(x, floorY, 0, x, floorY, 22); g.addColorStop(0, 'rgba(255,170,80,.55)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(x - 22, floorY - 12, 44, 14);
  }
}

function drawPupa(cx0, t, B) {
  const floorY = 13 * T, x = B.px - cx0, pt = B.pt, fl = B.flash > 0, f = B.face || 1;
  if (pt < 1.2) {
    // the wyrm coils tighter and tighter onto the bridge
    const k = pt / 1.2, n = 9;
    for (let i = n; i >= 0; i--) { const a = i * 0.9 + t * 3 * (1 - k), r = (1 - i / n) * 6 + (i / n) * (22 - 12 * k); wyrmSeg(x + Math.cos(a) * r, floorY - 12 - Math.sin(a) * r * 0.6 - k * 6, 8 - i * 0.3, fl, 0.8 * (1 - k), t, i); }
    if (k > 0.5) { ctx.globalAlpha = (k - 0.5) * 2; drawPupaBody(x, floorY, 0, fl, t, {}); ctx.globalAlpha = 1; }
    return;
  }
  const beat = B.beat || 0;
  if (pt < 5.9) {
    const crack = clamp((pt - 3.6) / 2.3, 0, 1), shiver = crack > 0 ? Math.round(rand(-1, 1) * crack * 1.5) : 0;
    const eyes = pt > 4.4 ? clamp((pt - 4.4) / 0.5, 0, 1) * (pt > 5.0 && pt < 5.14 ? 0 : 1) : 0;
    const claws = [clamp((pt - 5.2) / 0.25, 0, 1), clamp((pt - 5.55) / 0.25, 0, 1)];
    ctx.save(); ctx.translate(x, floorY); ctx.scale(1 + beat * 0.07, 1 + beat * 0.05); ctx.translate(-x, -floorY);
    drawPupaBody(x + shiver, floorY, crack, fl, t, { beat, eyes, claws, f, glow:pt > 2.8 ? Math.min(1, (pt - 2.8) / 2) : 0 });
    ctx.restore();
    return;
  }
  // it splits; the moth hauls itself out, wet and crumpled, and its wings slowly fill
  const k = clamp((pt - 5.9) / 0.45, 0, 1), e = Math.floor(clamp((pt - 5.9) / 1.0, 0, 1) * 9) / 9, ee = 1 - Math.pow(1 - e, 3), unf = pt < 7.45 ? clamp((pt - 6.4) / 0.5, 0, 1) * 0.7 : 0.7 + 0.3 * clamp((pt - 7.45) / 0.12, 0, 1);
  for (const s of [-1, 1]) drawPupaHalf(x, floorY, s, k, fl, t, 1);
  const g = ctx.createRadialGradient(x, floorY - 20, 0, x, floorY - 20, 50); g.addColorStop(0, `rgba(255,90,50,${0.45 * (1 - e * 0.5)})`); g.addColorStop(1, 'rgba(255,60,30,0)'); ctx.fillStyle = g; ctx.fillRect(x - 50, floorY - 70, 100, 100);
  const my = Math.round(floorY - 12 - ee * 34), jx = e < 1 ? Math.round(Math.sin(pt * 31) * (1 - e) * 1.5) : 0;
  // wet strands still cling between the husk and its wings
  if (pt < 7.0) { ctx.strokeStyle = `rgba(232,220,190,${0.5 * (1 - clamp((pt - 6.4) / 0.6, 0, 1))})`; ctx.lineWidth = 1; ctx.beginPath(); for (const s of [-1, 1]) { ctx.moveTo(x + s * 16, floorY - 4); ctx.quadraticCurveTo(x + s * 14, my + 14, x + s * 22 * (0.4 + unf), my - 4); ctx.moveTo(x + s * 9, floorY - 6); ctx.lineTo(x + s * 6, my + 6); } ctx.stroke(); }
  const ph = (B.wph = Math.max(0, pt - 6.3) * 7), sc = 1.3 * (0.8 + 0.2 * ee);
  const stare = pt > 6.95 && pt < 7.45, wk = stare ? 0.35 : Math.sin(ph) * (0.25 + 0.75 * unf);
  G.eyeS = [[x + f * 15 * sc / 1.3, my - 4]];
  ctx.save(); ctx.translate(x, my); ctx.rotate(-f * 0.25 * (1 - ee)); ctx.scale(sc, sc); ctx.translate(-x, -my);
  drawMothFigure(x + jx, my, f, wk, { k2:stare ? 0.2 : Math.sin(ph - 0.8) * (0.25 + 0.75 * unf), fl, glow:0, p2:false, t, unf, legs:e < 0.85 ? 'grip' : 'dangle', eye:1, eyeHot:pt > 7.3, saddle:1, hj:B.tw > 0 && !stare ? B.twA : 0, look:{ x:clamp((P.x - B.px) / 80, -1, 1) * f, y:0 } });
  ctx.restore();
  // the bottom of the husk stays in front of its tail until it is clear
  if (e < 0.75) { ctx.globalAlpha = 1 - e / 0.75; ctx.fillStyle = '#2a170f'; ctx.fillRect(Math.round(x - 14), floorY - 9, 28, 9); ctx.fillStyle = fl ? '#fff' : '#b8873a'; ctx.fillRect(Math.round(x - 13), floorY - 8, 26, 8); ctx.fillStyle = '#6e4e1e'; ctx.fillRect(Math.round(x - 13), floorY - 8, 26, 1); ctx.globalAlpha = 1; }
}
// one half of the split shell, falling open around its base
function drawPupaHalf(x, floorY, s, k, fl, t, a) {
  const top = floorY - 34, px = x + s * 13;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(px + s * k * 5, floorY); ctx.rotate(s * k * 1.4); ctx.translate(-px, -floorY);
  ctx.fillStyle = '#2a170f'; ctx.beginPath(); ctx.moveTo(x, top - 1); ctx.quadraticCurveTo(x + s * 17, top + 10, x + s * 14, floorY); ctx.lineTo(x, floorY); ctx.closePath(); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : '#b8873a'; ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + s * 15, top + 10, x + s * 13, floorY); ctx.lineTo(x + s * 1, floorY); ctx.closePath(); ctx.fill();
  // the torn inside face, still glowing
  ctx.fillStyle = `rgba(255,${120 + Math.round(40 * Math.sin(t * 6))},60,${0.6 * k * (1 - (1 - a))})`; ctx.fillRect(Math.round(x + (s > 0 ? 0 : -2)), top + 4, 2, 28);
  ctx.fillStyle = '#6e4e1e'; for (let i = 1; i < 5; i++) { const y = top + i * 7, hw = 8 + Math.sin(i / 5 * Math.PI) * 5; ctx.fillRect(Math.round(s > 0 ? x : x - hw), y, Math.round(hw), 1); }
  ctx.restore();
}
function drawHusk(cx0, t) {
  const h = G.husk; if (!h) return;
  const a = clamp(1 - (h.t - 5) / 2, 0, 1), x = h.x - cx0; if (x < -40 || x > W + 40) return;
  for (const s of [-1, 1]) drawPupaHalf(x, 13 * T, s, 1, false, t, a);
}
function drawPupaBody(x, floorY, crack, fl, t, o) {
  const top = floorY - 34, beat = o.beat || 0, glow = o.glow || 0;
  // the heat it is pulling in, pulsing with the heartbeat
  if (glow > 0) { const g = ctx.createRadialGradient(x, top + 18, 0, x, top + 18, 34 + beat * 10); g.addColorStop(0, `rgba(255,60,30,${(0.25 + 0.35 * beat) * glow})`); g.addColorStop(1, 'rgba(255,40,20,0)'); ctx.fillStyle = g; ctx.fillRect(x - 46, top - 28, 92, 92); }
  ctx.fillStyle = '#2a170f'; ctx.beginPath(); ctx.moveTo(x, top - 1); ctx.quadraticCurveTo(x + 17, top + 10, x + 14, floorY); ctx.lineTo(x - 14, floorY); ctx.quadraticCurveTo(x - 17, top + 10, x, top - 1); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : mixC('#b8873a', '#d4743a', beat * glow); ctx.beginPath(); ctx.moveTo(x, top); ctx.quadraticCurveTo(x + 15, top + 10, x + 13, floorY); ctx.lineTo(x - 13, floorY); ctx.quadraticCurveTo(x - 15, top + 10, x, top); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : '#e2b866'; ctx.beginPath(); ctx.moveTo(x - 2, top + 3); ctx.quadraticCurveTo(x - 11, top + 12, x - 9, floorY - 2); ctx.lineTo(x - 4, floorY - 2); ctx.quadraticCurveTo(x - 6, top + 12, x - 2, top + 3); ctx.fill();
  ctx.fillStyle = '#6e4e1e'; for (let i = 1; i < 5; i++) { const y = top + i * 7, hw = 8 + Math.sin(i / 5 * Math.PI) * 5; ctx.fillRect(Math.round(x - hw), y, Math.round(hw * 2), 1); }
  // something inside presses outward, and red veins swell with each beat
  if (glow > 0) {
    for (let i = 0; i < 2; i++) { const u = (t * 0.55 + i * 0.5) % 1, bx = x + (i ? 6 : -6) + Math.sin(t * 3 + i) * 2, by = floorY - 6 - u * 22, a = Math.sin(u * Math.PI) * glow;
      ctx.fillStyle = `rgba(60,24,10,${0.6 * a})`; ctx.beginPath(); ctx.ellipse(bx, by + 2, 4, 3, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(240,200,130,${0.7 * a})`; ctx.beginPath(); ctx.ellipse(bx, by, 3.5, 2.2, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(60,24,10,${0.5 * a})`; for (let j = -1; j <= 1; j++) ctx.fillRect(Math.round(bx + j * 2), Math.round(by - 4), 1, 2); }
    ctx.strokeStyle = `rgba(200,20,20,${(0.2 + 0.6 * beat) * glow})`; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(x - 1, top + 6); ctx.lineTo(x - 6, top + 12); ctx.lineTo(x - 9, top + 22); ctx.moveTo(x - 6, top + 12); ctx.lineTo(x - 3, top + 18);
    ctx.moveTo(x + 1, top + 9); ctx.lineTo(x + 7, top + 15); ctx.lineTo(x + 8, top + 27); ctx.moveTo(x + 7, top + 15); ctx.lineTo(x + 11, top + 19); ctx.stroke();
  }
  // wing shapes pressing out from inside, harder with each beat
  ctx.fillStyle = `rgba(${110 + Math.round(90 * beat * glow)},${40 - Math.round(20 * beat * glow)},20,${0.5 + 0.3 * glow})`; ctx.beginPath(); ctx.ellipse(x - 5 - beat, top + 18, 4 + beat, 9, 0.3, 0, TAU); ctx.ellipse(x + 5 + beat, top + 18, 4 + beat, 9, -0.3, 0, TAU); ctx.fill();
  if (crack > 0) {
    const p = 0.6 + 0.4 * Math.sin(t * 20);
    ctx.strokeStyle = `rgba(255,${120 + Math.round(60 * p)},70,${0.4 + 0.6 * crack})`; ctx.lineWidth = 1 + crack; ctx.beginPath();
    ctx.moveTo(x, top + 1); ctx.lineTo(x + 2, top + 8); ctx.lineTo(x - 2, top + 15); ctx.lineTo(x + 3, top + 23); ctx.lineTo(x, floorY - 3);
    if (crack > 0.4) { ctx.moveTo(x + 2, top + 8); ctx.lineTo(x + 9, top + 12); ctx.moveTo(x - 2, top + 15); ctx.lineTo(x - 10, top + 19); }
    if (crack > 0.75) { ctx.moveTo(x + 3, top + 23); ctx.lineTo(x + 11, top + 27); ctx.moveTo(x, top + 1); ctx.lineTo(x - 6, top + 5); }
    ctx.stroke();
  }
  // two eyes open behind the crack: dark, then a red glow that does not blink
  if (o.eyes > 0) {
    const ey = top + 10, e = o.eyes, f = o.f || 1;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, ey, 0, x, ey, 16); g.addColorStop(0, `rgba(255,30,20,${0.55 * e})`); g.addColorStop(1, 'rgba(255,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(x - 16, ey - 16, 32, 32);
    ctx.globalCompositeOperation = 'source-over';
    G.eyeS = [[x - 4 + f, ey], [x + 4 + f, ey]];
    for (const s of [-1, 1]) { const ex = Math.round(x + s * 4 + f); ctx.fillStyle = '#120202'; ctx.fillRect(ex - 2, ey - 1, 4, 3); ctx.fillStyle = `rgba(255,${40 + Math.round(30 * Math.sin(t * 9))},30,${e})`; ctx.fillRect(ex - 1, ey, 2, 1); }
  }
  // its legs punch through the shell
  if (o.claws) for (let i = 0; i < 2; i++) { const c = o.claws[i]; if (c <= 0) continue; const s = i ? 1 : -1, bx = x + s * 12, by = top + 17 + i * 3, len = 9 * c, j = Math.sin(t * 40 + i) * 1.2;
    ctx.strokeStyle = fl ? '#fff' : '#1e0c08'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + s * len * 0.6, by - 4 + j); ctx.lineTo(bx + s * len, by + 2 + j); ctx.stroke();
    ctx.fillStyle = C.waxSh; ctx.fillRect(Math.round(bx + s * len) - 1, Math.round(by + 2 + j), 2, 2); }
}
// six thin legs: dangling in flight, reaching forward with hooked feet when it attacks, splayed when it stands
function drawMothLegs(mx, my, f, mode, t, fl) {
  ctx.strokeStyle = fl ? '#fff' : '#1e0c08'; ctx.lineWidth = 1; ctx.beginPath();
  const ends = [];
  for (let i = 0; i < 3; i++) {
    const bx = mx + f * (3 - i * 3), by = my + 4; let kx, ky, ex, ey;
    if (mode === 'reach') { kx = bx + f * (5 + i); ky = by + 4; ex = bx + f * (11 + i * 2); ey = by + 8 - i; }
    else if (mode === 'stand') { kx = bx + (i - 1) * 5; ky = by + 2; ex = bx + (i - 1) * 8; ey = by + 6; }
    else if (mode === 'grip') { kx = bx + (i - 1) * 7; ky = by - 2; ex = bx + (i - 1) * 12; ey = by + 4; }
    else { const sw = Math.sin(t * 4 + i * 1.3) * 1.5; kx = bx + f + sw * 0.5; ky = by + 5; ex = bx - f + sw; ey = by + 11; }
    ctx.moveTo(bx, by); ctx.lineTo(kx, ky); ctx.lineTo(ex, ey); ends.push([ex, ey]);
  }
  ctx.stroke();
  ctx.fillStyle = fl ? '#fff' : C.waxSh; for (const [ex, ey] of ends) ctx.fillRect(Math.round(ex), Math.round(ey), 1, 1);
}
// the Cinder Moth: four burning wings with eye-spots, a fuzzy wax collar, feathered antennae and dark red eyes
function drawMothFigure(mx, my, f, k, o) {
  const fl = o.fl, glow = o.glow || 0, p2 = o.p2, flat = o.flat, noWings = o.noWings, fold = o.fold || 0, unf = o.unf == null ? 1 : o.unf, wet = 1 - unf;
  const flap = flat ? 0.15 : k, flap2 = flat ? 0.1 : (o.k2 == null ? k : o.k2);
  const F = flap * (1 - fold), F2 = flap2 * (1 - fold);
  my += o.bob || 0;
  const wc = (c, g) => fl ? '#fff' : wet > 0.01 ? mixC(toHex(mixC(c, '#fff1d0', g)), '#3a1810', wet * 0.55) : mixC(c, '#fff1d0', g);
  drawMothLegs(mx, my, f, o.legs || 'dangle', o.t || 0, fl);
  if (!noWings) for (const s of [-1, 1]) {
    // hind wing first, so the forewing overlaps it
    const hs = (22 - Math.abs(flap2) * 3) * (0.4 + 0.6 * unf) * (1 - fold * 0.4), hx = mx + s * hs - f * fold * 10, hy = my + 12 - F2 * 5 + wet * 8 - fold * 4, hb = mx + s * 4;
    ctx.fillStyle = '#2a120c'; ctx.beginPath(); ctx.moveTo(hb, my + 1); ctx.quadraticCurveTo(hb + (hx - hb) * 0.95, my + 2 - F2 * 4, hx, hy); ctx.quadraticCurveTo(hb + (hx - hb) * 0.33, my + 14, hb, my + 6); ctx.fill();
    ctx.fillStyle = wc('#6e2414', glow); ctx.beginPath(); ctx.moveTo(hb, my + 2); ctx.quadraticCurveTo(hb + (hx - hb) * 0.86, my + 3 - F2 * 4, hx - s, hy - 1); ctx.quadraticCurveTo(hb + (hx - hb) * 0.33, my + 12, hb, my + 5); ctx.fill();
    // forewing
    const span = (36 - Math.abs(flap) * 7) * (0.35 + 0.65 * unf) * (1 - fold * 0.5), base = mx + s * 4;
    const tipX = mx + s * span - f * fold * 14, tipY = my - 12 - F * 14 + wet * 18 + fold * 6, L = (u) => base + (tipX - base) * u;
    ctx.fillStyle = '#2a120c'; ctx.beginPath(); ctx.moveTo(base, my - 4); ctx.quadraticCurveTo(L(0.5), my - 22 - F * 12 + wet * 12 + fold * 12, tipX, tipY); ctx.quadraticCurveTo(L(0.83), my + 2 - F * 4 + wet * 12, base, my + 3); ctx.fill();
    ctx.fillStyle = wc('#561a10', glow); ctx.beginPath(); ctx.moveTo(base, my - 3); ctx.quadraticCurveTo(L(0.5), my - 20 - F * 12 + wet * 12 + fold * 12, tipX - s * 2, tipY + 1); ctx.quadraticCurveTo(L(0.8), my + 1 - F * 4 + wet * 12, base, my + 2); ctx.fill();
    ctx.fillStyle = wc('#974821', glow); ctx.beginPath(); ctx.moveTo(L(0.31), my - 8 - F * 6 + wet * 6); ctx.quadraticCurveTo(L(0.62), my - 16 - F * 11 + wet * 10 + fold * 8, tipX - s * 3, tipY + 2); ctx.quadraticCurveTo(L(0.62), my - 4 - F * 6 + wet * 8, L(0.31), my - 4 - F * 4 + wet * 6); ctx.fill();
    // torn trailing edge and moth-eaten holes
    if (!fl && unf > 0.5) { ctx.fillStyle = '#140604'; const c2x = L(0.83), c2y = my + 2 - F * 4 + wet * 12;
      for (const u of [0.45, 0.62, 0.78]) { const v = 1 - u, nx = v * v * tipX + 2 * u * v * c2x + u * u * base, ny = v * v * tipY + 2 * u * v * c2y + u * u * (my + 3); ctx.beginPath(); ctx.moveTo(nx - 2, ny + 1); ctx.lineTo(nx, ny - 3); ctx.lineTo(nx + 2, ny + 1); ctx.fill(); }
      ctx.fillRect(Math.round(L(0.74)), Math.round(my - 11 - F * 9), 1, 1); ctx.fillRect(Math.round(L(0.36)), Math.round(my - 6 - F * 5), 2, 1); }
    // eye-spot: a pale staring eye whose pupil follows you
    if (unf > 0.4) { const ex = L(0.55), ey = my - 6 + (tipY - (my - 6)) * 0.45, r = 3.6 * Math.min(1, (unf - 0.4) / 0.4) * (1 - fold * 0.3), lk = o.look || { x:0, y:0 };
      ctx.fillStyle = fl ? '#fff' : '#140604'; ctx.beginPath(); ctx.ellipse(ex, ey, r + 0.8, r * 0.8 + 0.8, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = fl ? '#fff' : '#ddc79d'; ctx.beginPath(); ctx.ellipse(ex, ey, r, r * 0.8, 0, 0, TAU); ctx.fill();
      if (!fl) { const px = ex + lk.x * r * 0.4, py = ey + lk.y * r * 0.3; ctx.fillStyle = p2 ? '#a01810' : '#5a1008'; ctx.beginPath(); ctx.arc(px, py, r * 0.55, 0, TAU); ctx.fill(); ctx.fillStyle = '#050101'; ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2); ctx.fillStyle = 'rgba(255,240,220,.8)'; ctx.fillRect(Math.round(px - r * 0.3), Math.round(py - r * 0.35), 1, 1); } }
    // burning edge
    if (!fl && unf > 0.6) { ctx.fillStyle = glow > 0.2 ? `rgba(255,255,240,${glow})` : `rgba(255,${p2 ? 140 : 190},90,.9)`; ctx.fillRect(Math.round(tipX - s * 2), Math.round(tipY), 2, 2); ctx.fillRect(Math.round(hx - s), Math.round(hy - 1), 2, 1); }
    if (p2 && !fl && !flat) drawFlame(tipX, tipY + 2, 0.6, (o.t || 0) * 2 + s, C.ember, C.flame);
    // wet sheen while the wings are still unfolding
    if (wet > 0.05 && !fl) { ctx.fillStyle = `rgba(255,230,200,${0.35 * wet})`; ctx.fillRect(Math.round(L(0.3)), Math.round(my - 6 + wet * 4), Math.round(Math.abs(tipX - base) * 0.4) * (s < 0 ? -1 : 1), 1); }
  }
  // abdomen with glowing rings
  for (let i = 3; i >= 0; i--) { const ax = mx - f * (4 + i * 4), ay = my + 2 + i * 0.5 + (o.legs === 'grip' ? i * 1.5 : 0), r = 5 - i * 0.8;
    ctx.fillStyle = '#2a120c'; ctx.beginPath(); ctx.arc(ax, ay, r + 1, 0, TAU); ctx.fill(); ctx.fillStyle = fl ? '#fff' : '#5a2a1a'; ctx.beginPath(); ctx.arc(ax, ay, r, 0, TAU); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : `rgba(255,${p2 ? 110 : 160},60,.9)`; ctx.fillRect(Math.round(ax) - 1, Math.round(ay - r) + 1, 2, 1);
    if (!fl) { ctx.fillStyle = '#94736b'; ctx.fillRect(Math.round(ax + (i % 2 ? 1 : -2)), Math.round(ay - r - 1), 1, 2); ctx.fillRect(Math.round(ax), Math.round(ay + r - 1), 1, 2); } }
  // thorax and the pale wax collar
  ctx.fillStyle = '#2a120c'; ctx.beginPath(); ctx.ellipse(mx, my, 8, 7, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : C.wax; ctx.beginPath(); ctx.ellipse(mx + f * 1, my - 1, 7, 6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : C.waxSh; for (let i = -3; i <= 3; i += 2) ctx.fillRect(Math.round(mx + i), Math.round(my + 3), 1, 2);
  // the white wax saddle left over from the pupa: soft enough to dive through
  if (o.saddle > 0) { const sw = Math.round(16 * (0.4 + 0.6 * o.saddle)), sh = Math.max(2, Math.round(5 * o.saddle)), sx = Math.round(mx - sw / 2 - f), sy = Math.round(my - 6 - sh);
    ctx.fillStyle = C.waxSh; ctx.fillRect(sx, sy, sw, sh + 2); ctx.fillStyle = o.armorT > 0 ? '#ffffff' : C.wax; ctx.fillRect(sx, sy, sw, sh);
    if (o.armorT > 0) { ctx.strokeStyle = `rgba(255,255,255,${o.armorT / 0.22})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(mx, my, 26 + (0.22 - o.armorT) * 40, 14 + (0.22 - o.armorT) * 24, 0, 0, TAU); ctx.stroke(); } ctx.fillStyle = C.waxHi; ctx.fillRect(sx + 1, sy, sw - 2, 1);
    ctx.fillStyle = C.wax; ctx.fillRect(sx + 2, sy + sh + 2, 2, 2); ctx.fillRect(sx + sw - 4, sy + sh + 2, 2, 3);
    if (o.glint > 0) { const gx = sx + Math.round((((o.t || 0) * 1.6) % 1) * sw); ctx.fillStyle = `rgba(255,255,255,${o.glint})`; ctx.fillRect(gx, sy, 2, 1); } }
  // head: a fuzzy dark skull, two small hooked palps, and big dark red eyes that glow from inside
  ctx.save(); if (o.hj) { ctx.translate(mx + f * 9, my - 2); ctx.rotate(o.hj); ctx.translate(-(mx + f * 9), -(my - 2)); }
  const hx = mx + f * 9, hy = my - 2, eye = o.stun ? 0 : (o.eye == null ? 1 : o.eye), hot = o.eyeHot ? 1 : 0;
  ctx.fillStyle = '#1a0a06'; ctx.beginPath(); ctx.arc(hx, hy, 6, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : '#3a1a10'; ctx.beginPath(); ctx.arc(hx, hy, 5, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : C.wax; ctx.fillRect(Math.round(hx - f * 5), Math.round(hy - 4), 1, 2); ctx.fillRect(Math.round(hx - f * 6), Math.round(hy), 1, 2);
  ctx.fillStyle = fl ? '#fff' : C.waxSh; ctx.fillRect(Math.round(hx + f * 3), Math.round(hy + 4), 1, 3); ctx.fillRect(Math.round(hx + f * 5), Math.round(hy + 3), 1, 3);
  ctx.strokeStyle = fl ? '#fff' : '#bb9c81'; ctx.lineWidth = 1; ctx.beginPath();
  if (o.legs === 'reach') { ctx.moveTo(hx + f * 4, hy + 4); ctx.lineTo(hx + f * 13, hy + 7); }
  else { ctx.moveTo(hx + f * 4, hy + 4); ctx.quadraticCurveTo(hx + f * 8, hy + 6, hx + f * 7, hy + 9); ctx.quadraticCurveTo(hx + f * 5, hy + 10, hx + f * 5, hy + 8); }
  ctx.stroke();
  if (eye > 0 && !fl) {
    ctx.globalCompositeOperation = 'lighter';
    const er = 9 + hot * 7 + (p2 ? 2 : 0), ga = 0.3 * eye + 0.35 * hot + (p2 ? 0.1 : 0), gx = hx + f * 2.5, gy = hy - 1;
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, er); g.addColorStop(0, `rgba(255,30,20,${ga})`); g.addColorStop(1, 'rgba(255,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(gx - er, gy - er, er * 2, er * 2);
    ctx.globalCompositeOperation = 'source-over';
  }
  // the far eye, half hidden
  ctx.fillStyle = '#0e0303'; ctx.beginPath(); ctx.ellipse(hx - f * 1.5, hy - 1, 2.5, 3.5, 0, 0, TAU); ctx.fill();
  if (eye > 0) { ctx.fillStyle = fl ? '#fff' : '#7a0c08'; ctx.fillRect(Math.round(hx - f * 1.5) - 1, Math.round(hy - 1), 2, 2); }
  // the near eye: black rim, deep crimson, a burning core and one cold glint
  const ex = hx + f * 2.5, ey = hy - 1;
  ctx.fillStyle = '#0e0303'; ctx.beginPath(); ctx.ellipse(ex, ey, 3.8, 4.6, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : eye > 0 ? '#4a0606' : '#2a1414'; ctx.beginPath(); ctx.ellipse(ex, ey, 3, 3.8, 0, 0, TAU); ctx.fill();
  if (eye > 0 && !fl) {
    const pulse = 0.75 + 0.25 * Math.sin((o.t || 0) * (p2 ? 11 : 5));
    ctx.fillStyle = '#8a0e0a'; ctx.fillRect(Math.round(ex - 2), Math.round(ey), 4, 2);
    ctx.fillStyle = hot ? '#ff6a4a' : `rgba(255,${30 + Math.round(30 * pulse)},20,${0.7 + 0.3 * pulse})`; ctx.fillRect(Math.round(ex + f * 0.5) - 1, Math.round(ey) - 1, 2, 2);
    ctx.fillStyle = 'rgba(255,200,190,.85)'; ctx.fillRect(Math.round(ex - f * 1.5), Math.round(ey - 3), 1, 1);
    ctx.fillStyle = `rgba(255,40,30,${0.6 + 0.4 * pulse})`; ctx.fillRect(Math.round(hx - f * 1), Math.round(hy - 5), 1, 1); ctx.fillRect(Math.round(hx + f * 1), Math.round(hy - 6), 1, 1); ctx.fillRect(Math.round(hx + f * 3), Math.round(hy - 5), 1, 1);
    if (hot) { ctx.fillStyle = 'rgba(255,90,70,.75)'; ctx.fillRect(Math.round(ex - 7), Math.round(ey), 14, 1); ctx.fillRect(Math.round(ex), Math.round(ey - 5), 1, 10); }
  }
  ctx.strokeStyle = fl ? '#fff' : '#ecdeb1'; ctx.lineWidth = 1;
  for (const s of [-1, 1]) { const ax = hx + f * 2, ay = hy - 4, tx = ax + f * (8 - fold * 10) + s * 3, ty = ay - 10 + (flat ? 6 : 0) + fold * 7 + wet * 5; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo(ax + f * 2, ty + 2, tx, ty); ctx.stroke();
    for (let j = 1; j < 4; j++) { const u = j / 4, px = ax + (tx - ax) * u, py = ay + (ty - ay) * u; ctx.fillStyle = fl ? '#fff' : C.waxSh; ctx.fillRect(Math.round(px - f), Math.round(py), 2, 1); } }
  ctx.restore();
}
function drawMoth(cx0, t, B) {
  const p2 = B.hp <= B.maxHp / 2, fl = B.flash > 0, f = B.face || 1, mx = Math.round(B.x + B.w / 2 - cx0), my = Math.round(B.y + B.h / 2), st = B.state;
  const down = st === 'stun' || st === 'fall' || st === 'downed' || st === 'dead', perch = st === 'perch' || st === 'land';
  const ph = B.wph || 0, glow = st === 'rainW' ? 1 - B.t / B.wt : 0, floorY = 13 * T;
  // its heat haze
  const g = ctx.createRadialGradient(mx, my, 0, mx, my, 46); g.addColorStop(0, `rgba(255,${st === 'rushW' || st === 'slamW' ? 60 : 140},60,${0.2 + glow * 0.3 + (p2 ? 0.1 : 0)})`); g.addColorStop(1, 'rgba(255,100,40,0)'); ctx.fillStyle = g; ctx.fillRect(mx - 46, my - 46, 92, 92);
  // its shadow; when it is about to drop, the shadow grows dark red under you
  const hgt = floorY - B.y - B.h;
  if (st === 'stalk' || st === 'slamW') { const k = st === 'slamW' ? 1 : 1 - B.t / B.wt, w = 14 + 20 * k; ctx.fillStyle = `rgba(90,0,0,${0.25 + 0.35 * k})`; ctx.beginPath(); ctx.ellipse(mx, floorY + 1, w, 3, 0, 0, TAU); ctx.fill(); ctx.fillStyle = `rgba(255,40,20,${0.25 * k + (st === 'slamW' ? 0.2 * Math.sin(t * 40) : 0)})`; ctx.fillRect(mx - w, floorY, w * 2, 1); }
  else { ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.beginPath(); ctx.ellipse(mx, floorY + 1, Math.max(4, 20 - Math.min(14, hgt * 0.08)), 2, 0, 0, TAU); ctx.fill(); }
  // the line of its rush: a thin red sight from its eye that brightens just before it goes
  if (st === 'rushW' && B.tgx != null) { const k = 1 - B.t / B.wt, tx = B.tgx - cx0, ty = B.tgy, ex = mx + f * 12, ey = my - 3, n = Math.hypot(tx - ex, ty - ey) / 6;
    ctx.fillStyle = `rgba(255,40,30,${0.12 + 0.55 * k * k})`; for (let i = 1; i < n; i += 2) { const u = i / n; ctx.fillRect(Math.round(ex + (tx - ex) * u), Math.round(ey + (ty - ey) * u), 2, 1); } }
  // during a rush or sweep its eyes leave red streaks and its body leaves a burning ghost
  if (B.trail && B.trail.length > 1) {
    ctx.lineWidth = 2; for (let i = 1; i < B.trail.length; i++) { const a = B.trail[i - 1], b = B.trail[i]; ctx.strokeStyle = `rgba(255,${40 + Math.round(60 * b.life / 0.28)},30,${0.9 * b.life / 0.28})`; ctx.beginPath(); ctx.moveTo(a.x - cx0 + a.f * 13, a.y - 4); ctx.lineTo(b.x - cx0 + b.f * 13, b.y - 4); ctx.stroke(); }
  }
  if (st === 'sweepW') {
    // a faint line marks the height it is about to skim
    const k = 1 - B.t / B.wt, y = Math.round(B.lane - B.h / 2 - 3);
    ctx.fillStyle = `rgba(255,150,70,${0.2 + 0.5 * k})`; for (let x = 0; x < W; x += 8) ctx.fillRect(x + (B.sdir > 0 ? Math.floor(t * 40) % 8 : 8 - Math.floor(t * 40) % 8), y, 4, 1);
    ctx.fillStyle = `rgba(255,120,60,${0.15 * k})`; ctx.fillRect(0, y - 8, W, 16);
  }
  if (st === 'callW') { const k = 1 - B.t / B.wt; ctx.strokeStyle = `rgba(255,190,110,${0.6 * k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mx, my, 18 + k * 10, 0, TAU); ctx.stroke(); }
  const ox = st === 'sweepW' || st === 'slamW' || st === 'rushW' && B.t < 0.2 ? Math.round(rand(-1, 1)) : 0;
  let wingK = st === 'slamW' ? 0.85 + Math.sin(ph) * 0.15 : Math.sin(ph);
  const bob = down || perch || st === 'rush' || st === 'slamDrop' || st === 'slash' ? 0 : Math.round(Math.cos(ph) * 1.5);
  if (st === 'slash') { const hs = mothSlashTimes(p2), nx = hs[Math.min(2, B.si)], since = B.si > 0 ? B.st - hs[B.si - 1] : 9; wingK = since < 0.12 ? -1 + since / 0.12 * 0.4 : B.si < 3 && nx - B.st < 0.3 ? 1 : 0.2; }
  const lookX = clamp((P.x + P.w / 2 - B.x - B.w / 2) / 80, -1, 1), lookY = clamp((P.y + P.h / 2 - B.y - B.h / 2) / 60, -1, 1);
  const legs = st === 'rush' || st === 'slamDrop' || st === 'rushW' || st === 'slamW' || st === 'sweep' || st === 'slash' || st === 'slashGo' ? 'reach' : (down || perch) ? 'stand' : 'dangle';
  ctx.save(); ctx.translate(mx, my); ctx.rotate(B.tilt || 0); ctx.scale(1.3, 1.3); ctx.translate(-mx, -my);
  drawMothFigure(mx + ox, my + (down ? 2 : 0), f, wingK, { k2:st === 'slash' ? wingK * 0.7 : Math.sin(ph - 0.8), bob, look:{ x:lookX * f, y:lookY }, hj:B.tw > 0 && !down ? B.twA : 0, fold:B.fold || 0, legs, fl, glow, p2, t, flat:down || perch, stun:down, eye:st === 'dead' ? 0 : 1, eyeHot:['rushW', 'rush', 'slamW', 'slamDrop', 'sweepW', 'sweep', 'slashGo', 'slash'].includes(st), noWings:B.noWings, saddle:down ? 0 : (B.cap == null ? 1 : B.cap), armorT:B.armorT || 0, glint:!P.dead && !P.grounded && P.y + P.h < B.y ? 0.95 : 0.3 + 0.2 * Math.sin(t * 3) });
  ctx.restore();
  if (!down && !P.dead && B.cap >= 1 && st !== 'hatch' && Math.abs(P.x + P.w / 2 - (mx + cx0)) < 70) markArrow(mx, Math.round(B.y) - 22 + Math.sin(t * 4) * 2);   // dive onto its back
  if (st === 'stun') for (let i = 0; i < 3; i++) { const a = t * 5 + i * TAU / 3; ctx.fillStyle = i % 2 ? '#ffe58a' : '#ffffff'; ctx.fillRect(Math.round(mx + f * 8 + Math.cos(a) * 9), Math.round(my - 12 + Math.sin(a) * 3), 2, 2); }
  // the wing slash itself: a pale crescent in front of it
  if (B.slashFx > 0) { const a = B.slashFx / 0.16, cx = mx + f * 16, up = B.slashN % 2 ? -1 : 1, a0 = f > 0 ? -1.3 : Math.PI + 1.3, a1 = f > 0 ? 1.3 : Math.PI - 1.3;
    ctx.lineWidth = 4; ctx.strokeStyle = `rgba(255,170,90,${0.5 * a})`; ctx.beginPath(); ctx.arc(cx, my + up * 2, 30, up > 0 ? a0 : a1, up > 0 ? a1 : a0, f < 0 === up > 0); ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = `rgba(255,250,235,${a})`; ctx.beginPath(); ctx.arc(cx, my + up * 2, 28, up > 0 ? a0 : a1, up > 0 ? a1 : a0, f < 0 === up > 0); ctx.stroke(); }
  // three green lights: one for each slash. Each flares just before its slash lands; red once you have struck at the wrong moment.
  if (st === 'slashGo' || st === 'slash') {
    for (let i = 0; i < 3; i++) { const px = mx + (i - 1) * 11, py = Math.round(my - 36), done = st === 'slash' && i < B.si && B.green !== i, lit = st === 'slash' && B.green === i;
      const col = B.pfail ? (lit ? '#ff5a4a' : '#5a1a14') : lit ? '#9dffb4' : done ? '#1e3a24' : '#3f8a52';
      if (lit && !B.pfail) { ctx.globalCompositeOperation = 'lighter'; const g2 = ctx.createRadialGradient(px, py, 0, px, py, 14); g2.addColorStop(0, 'rgba(120,255,160,.75)'); g2.addColorStop(1, 'rgba(60,255,120,0)'); ctx.fillStyle = g2; ctx.fillRect(px - 14, py - 14, 28, 28); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(220,255,230,.9)'; ctx.fillRect(px - 7, py, 15, 1); ctx.fillRect(px, py - 7, 1, 15); }
      // shape carries the meaning too, so it reads without colour: a lit light swells with a white heart, a failed one is cracked in two
      if (B.pfail) {
        for (const sd of [-1, 1]) { const ox = px + sd * 1.5;
          ctx.fillStyle = '#081208'; ctx.beginPath(); ctx.moveTo(ox, py - 5); ctx.lineTo(ox + sd * 5, py); ctx.lineTo(ox, py + 5); ctx.fill();
          ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(ox, py - 4); ctx.lineTo(ox + sd * 4, py); ctx.lineTo(ox, py + 4); ctx.fill(); }
        ctx.fillStyle = '#081208'; ctx.fillRect(px - 1, py - 5, 1, 2); ctx.fillRect(px, py - 2, 1, 2); ctx.fillRect(px - 1, py + 1, 1, 2); ctx.fillRect(px, py + 3, 1, 2);
      } else {
        const r = lit ? 6 + Math.round(Math.sin(t * 30)) * 0.5 : 4;
        ctx.fillStyle = '#081208'; ctx.beginPath(); ctx.moveTo(px, py - r - 1); ctx.lineTo(px + r + 1, py); ctx.lineTo(px, py + r + 1); ctx.lineTo(px - r - 1, py); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(px, py - r); ctx.lineTo(px + r, py); ctx.lineTo(px, py + r); ctx.lineTo(px - r, py); ctx.fill();
        if (lit) { ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 1, py - 1, 3, 3); ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; ctx.strokeRect(px - r - 3.5, py - r - 3.5, (r + 3.5) * 2, (r + 3.5) * 2); }
        else if (done) { ctx.fillStyle = '#081208'; ctx.fillRect(px - 2, py, 5, 1); }
      } }
    // the same green glints on the striking wing
    if (B.green >= 0 && !B.pfail) { const gx = mx + f * 34, gy = my - 22; ctx.globalCompositeOperation = 'lighter'; const g3 = ctx.createRadialGradient(gx, gy, 0, gx, gy, 12); g3.addColorStop(0, 'rgba(140,255,170,.8)'); g3.addColorStop(1, 'rgba(60,255,120,0)'); ctx.fillStyle = g3; ctx.fillRect(gx - 12, gy - 12, 24, 24); ctx.globalCompositeOperation = 'source-over'; }
  }
}
function drawCocoon(e, cx0, t) {
  const x = Math.round(e.x - cx0), cx = x + e.w / 2, fl = e.flash > 0, sway = Math.sin(t * 1.3 + e.t) * 0.06 + e.wob * 0.12;
  ctx.strokeStyle = 'rgba(230,220,200,.45)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx, T); ctx.lineTo(cx + Math.sin(sway) * 2, e.y + 1); ctx.stroke();
  ctx.save(); ctx.translate(cx, e.y); ctx.rotate(sway);
  const pulse = 0.5 + 0.5 * Math.sin(t * 2.2 + e.t * 3);
  const g = ctx.createRadialGradient(0, 9, 0, 0, 9, 12); g.addColorStop(0, `rgba(255,170,90,${0.18 + 0.15 * pulse})`); g.addColorStop(1, 'rgba(255,140,60,0)'); ctx.fillStyle = g; ctx.fillRect(-12, -3, 24, 24);
  ctx.fillStyle = '#6e5e46'; ctx.beginPath(); ctx.ellipse(0, 8, 6, 9, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : '#e8dcc0'; ctx.beginPath(); ctx.ellipse(0, 8, 5, 8, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : C.waxHi; ctx.fillRect(-3, 2, 2, 8);
  ctx.fillStyle = fl ? '#fff' : '#b8a888'; for (let i = 0; i < 4; i++) ctx.fillRect(-5 + (i % 2), 3 + i * 3, 10 - (i % 2) * 2, 1);
  ctx.fillStyle = `rgba(255,${150 + Math.round(60 * pulse)},80,${0.5 + 0.4 * pulse})`; ctx.fillRect(-1, 7, 2, 3);
  ctx.restore();
}
function drawCinderMoth(e, cx0, t) {
  const x = Math.round(e.x - cx0), y = Math.round(e.y), fl = e.flash > 0, cx = x + e.w / 2, cy = y + e.h / 2, flap = Math.sin(e.t * 22) * 4;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10); g.addColorStop(0, 'rgba(255,150,60,.35)'); g.addColorStop(1, 'rgba(255,120,40,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 10, cy - 10, 20, 20);
  for (const s of [-1, 1]) { ctx.fillStyle = '#2a120c'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 8, cy - 2 - flap); ctx.lineTo(cx + s * 6, cy + 3); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#d4632a'; ctx.beginPath(); ctx.moveTo(cx + s, cy); ctx.lineTo(cx + s * 7, cy - 2 - flap); ctx.lineTo(cx + s * 5, cy + 2); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#ffd27a'; ctx.fillRect(Math.round(cx + s * 5) - (s < 0 ? 1 : 0), Math.round(cy - 1 - flap / 2), 1, 1); }
  ctx.fillStyle = '#2a120c'; ctx.fillRect(cx - 2, cy - 2, 4, 6); ctx.fillStyle = fl ? '#fff' : C.wax; ctx.fillRect(cx - 1, cy - 2, 2, 2); ctx.fillStyle = fl ? '#fff' : '#ff8a3a'; ctx.fillRect(cx - 1, cy + 1, 2, 2);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(cx - 1, cy - 3, 1, 1); ctx.fillRect(cx + 1, cy - 3, 1, 1);
}

const CINE_T = 3.4;
function startBossCine(B, name, sub) {
  setDoor(true); sfx('slam'); sfx('dread'); G.shake = 7; buzz([40, 30, 80]);
  G.bossHits0 = G.hits || 0;
  const quick = !!G.quickCine; G.quickCine = false;   // a retry skips most of the entrance
  G.cine = { t:quick ? 1.9 : 0, B, name, sub, roared:false, lit:0, tick:0 }; if (quick && B && B.t > 1.9) B.t -= 1.9;
  for (let i = 0; i < 18; i++) G.parts.push({ x:G.cam.x + rand(0, W), y:T + 2, vx:rand(-6, 6), vy:rand(20, 80), life:rand(0.8, 1.6), max:1.6, c:'#6b6f7a', s:Math.random() < 0.3 ? 2 : 1, g:160 });
}
function updateCine(dt) {
  const c = G.cine; if (!c) return;
  c.t += dt; const B = c.B;
  if (c.t > 0.7 && c.t < 2.3) {
    c.tick -= dt;
    if (c.tick <= 0) { c.tick = B && B.kind === 'chandler' ? 0.14 : 0.42; sfx(B && B.kind === 'chandler' ? 'chain' : 'step'); if (!(B && B.kind === 'chandler')) G.shake = Math.max(G.shake, 2.5);
      if (Math.random() < 0.7) G.parts.push({ x:G.cam.x + rand(0, W), y:T + 2, vx:0, vy:rand(30, 70), life:1.2, max:1.2, c:'#6b6f7a', s:1, g:160 }); }
    c.lit = (c.t - 0.7) / 1.6;
  }
  if (c.t >= 2.35 && !c.roared) {
    c.roared = true; c.lit = 9; sfx(B && B.kind === 'wyrm' ? 'bRoar' : B && B.kind === 'umbra' ? 'uIntro' : 'roar'); G.shake = 11; if (B && B.kind === 'wyrm') heavyShake(13); G.hitstop = Math.max(G.hitstop, 0.12); screenFlash(0.55, 0.18, '226,85,63'); G.vig = 1; buzz([80, 40, 140]);
    showBanner(c.name, c.sub, true);
    if (B) burst(B.x + B.w / 2, B.y + B.h / 2, 30, { spd:200, life:0.7, colors:[C.ember, C.flame, C.core], size:2, g:0 });
  }
  if (c.t >= CINE_T) G.cine = null;
}
// cinematic framing: black bars, the hall falling dark except for the boss and you
function drawCine() {
  const c = G.cine; if (!c) return;
  const inK = Math.min(1, c.t / 0.35), outK = Math.min(1, (CINE_T - c.t) / 0.35), k = Math.min(inK, outK);
  const dk = (c.roared ? 0.35 : 0.72) * k, B = c.B, cx0 = Math.round(G.cam.x);
  if (dk > 0) {
    const bx = B ? B.x + B.w / 2 - cx0 : W / 2, by = B ? B.y + B.h / 2 : H / 2;
    const g = ctx.createRadialGradient(bx, by, 10, bx, by, c.roared ? 120 : 60); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${dk})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const bar = Math.round(24 * k); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
}
function updateBoss(dt) {
  const B = G.boss; if (!B) return;
  if (B.state === 'downed') return updateDowned(dt, B);
  if (B.kind === 'chandler') return updateChandler(dt, B);
  if (B.kind === 'wyrm') return updateWyrm(dt, B);
  if (B.kind === 'moth') return updateMoth(dt, B);
  if (B.kind === 'umbra') return updateUmbra(dt, B);
  B.flash -= dt; B.anim += dt; B.t -= dt;
  const p2 = B.hp <= B.maxHp / 2, pcx = P.x + P.w / 2, bcx = B.x + B.w / 2;
  if (p2 && !B.enraged && B.state !== 'dead') { B.enraged = true; sfx('roar'); G.shake = 10; screenFlash(0.5, 0.18, '226,85,63'); G.vig = 1; showBanner('The Warden flares', 'Faster now, and burning', true); burst(bcx, B.y + B.h / 2, 30, { spd:200, life:0.7, colors:[C.ember, C.flame, C.core], size:2, g:0 }); }
  switch (B.state) {
    case 'dormant':
      if (P.x > 7 * T && !P.dead) { B.state = 'intro'; B.t = CINE_T; startBossCine(B, 'Tallow Warden', 'Keeper of the last flame'); }
      break;
    case 'intro': if (B.t <= 0) { B.state = 'idle'; B.t = 0.5; } break;
    case 'idle':
      B.face = pcx < bcx ? -1 : 1; B.vx = approach(B.vx, 0, 900 * dt);
      if (G.gal && G.gal.passive) B.t = Math.max(B.t, 0.2);
      if (B.t <= 0) {
        const far = Math.abs(pcx - bcx) > 150; let opts = far ? ['leap', 'charge', 'leap'] : ['leap', 'charge', 'drip'];
        let pick = opts[(Math.random() * opts.length) | 0];
        if (pick === B.last && B.repeat >= 1) pick = opts.find(o => o !== B.last) || pick;
        B.repeat = pick === B.last ? B.repeat + 1 : 0; B.last = pick;
        B.next = pick; B.state = 'windup'; B.t = p2 ? 0.36 : 0.52;
      }
      break;
    case 'windup':
      B.vx = 0;
      if (B.t <= 0) {
        if (B.next === 'leap') { B.state = 'leap'; B.vy = -400; B.vx = clamp((pcx - bcx) / 0.78, -240, 240); B.face = B.vx < 0 ? -1 : 1; sfx('jump'); sfx('stomp'); G.shake = Math.max(G.shake, 4); dust(bcx, B.y + B.h, 10); }
        if (B.next === 'charge') { B.state = 'charge'; dust(bcx, B.y + B.h, 6); }
        if (B.next === 'drip') {
          B.state = 'drip'; B.t = 1.3; sfx('bslam'); G.shake = Math.max(G.shake, 9); rubble(bcx, 8);
          const n = p2 ? 7 : 5, maxX = G.room.w * T - 2 * T;
          for (let i = 0; i < n; i++) {
            const x = i === 0 ? pcx : rand(2 * T, maxX);
            G.drops.push({ x:clamp(x, 2 * T, maxX) - 3, y:T + 1, w:6, h:8, vy:0, warn:0.6 + i * 0.09 });
          }
        }
      }
      break;
    case 'charge':
      B.vx = B.face * (p2 ? 285 : 235);
      if (Math.random() < 0.5) dust(bcx - B.face * 14, B.y + B.h, 1);
      // heavy footfalls that shake the floor
      B.stepT = (B.stepT || 0) - dt; if (B.stepT <= 0) { B.stepT = p2 ? 0.14 : 0.18; G.shake = Math.max(G.shake, 3); sfx('stomp'); dust(bcx, B.y + B.h, 3); }
      break;
    case 'stun': B.vx = 0; if (Math.random() < 0.2) burst(bcx, B.y, 1, { spd:20, life:0.8, colors:['#6b6f7a'], size:2, g:-40 }); if (B.t <= 0) { B.state = 'idle'; B.t = 0.35; } break;
    case 'drip': B.vx = 0; if (B.t <= 0) { B.state = 'idle'; B.t = p2 ? 0.3 : 0.55; } break;
    case 'dead':
      B.vx = 0; if (Math.random() < 0.6) burst(bcx + rand(-14, 14), B.y + rand(0, B.h), 2, { spd:90, life:0.7, colors:[C.wax, C.flame, C.core], size:2, g:-60 });
      if (B.t <= 0) {
        burst(bcx, B.y + B.h / 2, 60, { spd:220, life:1.1, colors:[C.wax, C.waxSh, C.flame, C.core], size:3, g:200 });
        G.boss = null; G.bossDown = true; setDoor(false); G.winT = 2.6; sfx('kill'); toast('The Warden is out. The way back is open.', 3000);
      }
      return;
  }
  if (B.state === 'dormant') return;
  B.vy = Math.min((B.vy || 0) + 1050 * dt, 420);
  const pb = B.y + B.h;
  B.x += B.vx * dt;
  if (collideX(B) && B.state === 'charge') {
    B.state = 'stun'; B.t = 0.75; G.shake = Math.max(G.shake, 16); G.hitstop = Math.max(G.hitstop, 0.09); sfx('wallhit'); screenFlash(0.22, 0.1, '255,214,170');
    const wx = B.face > 0 ? B.x + B.w : B.x; rubble(wx, 18); dust(wx, B.y + B.h, 12);
    G.fx.push({ k:'ring', x:wx, y:B.y + B.h / 2, t:0.35, max:0.35, r:46, c:'255,220,180' }); burst(B.face > 0 ? B.x + B.w : B.x, B.y + B.h / 2, 14, { spd:120, life:0.5, colors:['#55607a', C.waxSh], size:2, g:300 });
    if (p2) for (let i = 0; i < 3; i++) G.drops.push({ x:rand(2 * T, G.room.w * T - 2 * T), y:T + 1, w:6, h:8, vy:0, warn:0.5 + i * 0.15 });
  }
  B.y += B.vy * dt;
  const c = collideY(B, pb, true);
  if (c === 'floor') {
    if (B.state === 'leap') {
      B.state = 'idle'; B.t = p2 ? 0.35 : 0.6; G.shake = Math.max(G.shake, 13); G.hitstop = Math.max(G.hitstop, 0.06); sfx('bslam'); screenFlash(0.14, 0.08, '255,200,150');
      dust(B.x + B.w / 2, B.y + B.h, 26); rubble(B.x + B.w / 2, 12);
      G.fx.push({ k:'ring', x:B.x + B.w / 2, y:B.y + B.h - 2, t:0.4, max:0.4, r:60, c:'242,165,65' });
      for (const d of [-1, 1]) burst(B.x + B.w / 2 + d * 10, B.y + B.h - 1, 10, { spd:160, life:0.45, colors:['#6b6f7a', C.waxSh, '#3a4250'], size:2, g:500, ang:-Math.PI / 2 - d * 1.1, spread:0.5 });
      if (p2) for (const d of [-1, 1]) G.waves.push({ x:B.x + B.w / 2 - 5 + d * 18, y:B.y + B.h - 10, w:10, h:10, vx:d * 170, life:2 });
    }
    B.vy = 0;
  } else if (c === 'ceil') B.vy = 0;
  if (!P.dead && B.state !== 'intro' && overlap(P, { x:B.x + 3, y:B.y + 4, w:B.w - 6, h:B.h - 4 })) hurtPlayer(1, B.x + B.w / 2);
}
