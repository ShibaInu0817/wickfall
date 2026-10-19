function drawCrawler(e, cx0) {
  const x = Math.round(e.x - cx0), y = Math.round(e.y), fl = e.flash > 0, cx = x + e.w / 2, by = y + e.h;
  if (e.wickling) {
    // a little runaway candle stub with legs
    const ph = Math.floor(e.anim * 14) % 2, bob = ph;
    ctx.fillStyle = fl ? '#fff' : '#1b1424'; ctx.fillRect(cx - 3 + ph, by - 3, 2, 3); ctx.fillRect(cx + 1 - ph, by - 3, 2, 3);
    ctx.fillStyle = fl ? '#fff' : C.wax; ctx.fillRect(cx - 4, by - 12 + bob, 8, 9); ctx.fillStyle = fl ? '#fff' : C.waxSh; ctx.fillRect(cx + (e.dir > 0 ? -4 : 3), by - 11 + bob, 1, 8);
    ctx.fillStyle = fl ? '#fff' : C.wax; ctx.fillRect(cx - 4 + (e.dir > 0 ? 6 : 0), by - 4 + bob, 2, 2);
    ctx.fillStyle = '#18121f'; ctx.fillRect(cx + e.dir * 2 - 2, by - 9 + bob, 1, 2); ctx.fillRect(cx + e.dir * 2 + 1, by - 9 + bob, 1, 2); ctx.fillRect(cx + e.dir * 2 - 1, by - 6 + bob, 2, 1);
    ctx.fillStyle = '#2a2222'; ctx.fillRect(cx, by - 14 + bob, 1, 2);
    drawFlame(cx + 0.5, by - 14 + bob, 0.95, e.anim * 2, C.ember, C.flame);
    return;
  }
  const ph = Math.floor(e.anim * 10) % 2;
  ctx.fillStyle = fl ? '#fff' : C.bone;
  for (let i = 0; i < 3; i++) { const lx = x + 2 + i * 4; ctx.fillRect(lx + ((i + ph) % 2), by - 2, 1, 2); }
  ctx.fillStyle = fl ? '#fff' : C.mite; ctx.beginPath(); ctx.ellipse(cx, by - 3, 7, 6, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : C.miteHi; ctx.fillRect(cx - 4, by - 8, 2, 1); ctx.fillRect(cx, by - 9, 2, 1); ctx.fillRect(cx + 3, by - 7, 2, 1);
  ctx.fillStyle = fl ? '#fff' : '#3d1f17'; ctx.fillRect(x, by - 3, e.w, 1);
  ctx.fillStyle = C.eye; ctx.fillRect(e.dir > 0 ? x + e.w - 3 : x + 1, by - 5, 2, 1);
  if (e.armor) {
    // a bronze shell over the back and a heavy plate on the face it walks toward
    ctx.fillStyle = fl ? '#fff' : '#6e5a35'; ctx.beginPath(); ctx.ellipse(cx, by - 4, 8, 7, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = fl ? '#fff' : '#a88c52'; ctx.fillRect(cx - 5, by - 9, 3, 1); ctx.fillRect(cx - 1, by - 10, 3, 1); ctx.fillRect(cx + 3, by - 8, 2, 1);
    ctx.fillStyle = fl ? '#fff' : '#3e321e'; ctx.fillRect(cx - 7, by - 4, 14, 1);
    const fx = e.dir > 0 ? x + e.w - 1 : x - 2; ctx.fillStyle = fl ? '#fff' : '#8a7448'; ctx.fillRect(fx, by - 10, 3, 9); ctx.fillStyle = fl ? '#fff' : '#c9ad6a'; ctx.fillRect(fx + (e.dir > 0 ? 0 : 2), by - 10, 1, 9);
  }
}
function drawSpitter(e, cx0, t) {
  const x = Math.round(e.x - cx0), y = Math.round(e.y), fl = e.flash > 0, cx = x + e.w / 2, by = y + e.h, f = e.face;
  const pulse = e.charge ? 0.5 + 0.5 * Math.sin(t * 30) : 0;
  ctx.fillStyle = fl ? '#fff' : '#5c4a2c'; ctx.beginPath(); ctx.ellipse(cx, by - 5, 6, 5, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = fl ? '#fff' : '#8a7448'; ctx.fillRect(cx - 6, by - 5, 12, 1); ctx.fillRect(cx - 4, by - 1, 8, 1);
  ctx.fillStyle = fl ? '#fff' : '#3e321e'; ctx.fillRect(cx - 3, by - 11, 6, 2);
  // the spout faces you and glows before it spits
  ctx.fillStyle = fl ? '#fff' : '#2a2018'; ctx.fillRect(cx + f * 4 - (f > 0 ? 0 : 3), by - 8, 4, 3);
  if (e.charge) { ctx.fillStyle = `rgba(242,${150 + Math.round(pulse * 80)},70,${0.6 + pulse * 0.4})`; ctx.fillRect(cx + f * 5 - (f > 0 ? 0 : 2), by - 7, 2, 1);
    const g = ctx.createRadialGradient(cx + f * 6, by - 7, 0, cx + f * 6, by - 7, 10); g.addColorStop(0, `rgba(242,165,65,${0.35 * pulse + 0.1})`); g.addColorStop(1, 'rgba(242,165,65,0)'); ctx.fillStyle = g; ctx.fillRect(cx + f * 6 - 10, by - 17, 20, 20); }
  ctx.fillStyle = C.eye; ctx.fillRect(cx - 1 + f, by - 6, 2, 1);
}
function drawFlyer(e, cx0, t) {
  const x = Math.round(e.x - cx0), y = Math.round(e.y), fl = e.flash > 0, cx = x + e.w / 2, cy = y + e.h / 2;
  const flap = Math.abs(Math.sin(e.t * 16)) * 5 + 1;
  ctx.fillStyle = fl ? '#fff' : C.moth;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + s * 8, cy - flap); ctx.lineTo(cx + s * 7, cy + 2); ctx.fill(); }
  ctx.fillStyle = fl ? '#fff' : C.mothDk; ctx.fillRect(cx - 5, cy - Math.round(flap / 2), 1, 1); ctx.fillRect(cx + 4, cy - Math.round(flap / 2), 1, 1);
  ctx.fillStyle = fl ? '#fff' : '#2a2630'; ctx.beginPath(); ctx.ellipse(cx, cy + 1, 2, 4, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = C.eye; ctx.fillRect(cx - 2, cy - 1, 1, 1); ctx.fillRect(cx + 1, cy - 1, 1, 1);
}
function drawBoss(cx0, t) {
  const B = G.boss; if (!B) return;
  if (B.kind === 'chandler') return drawChandler(cx0, t, B);
  if (B.kind === 'wyrm') return drawWyrm(cx0, t, B);
  if (B.kind === 'moth') return drawMoth(cx0, t, B);
  if (B.kind === 'umbra') return drawUmbra(cx0, t, B);
  const p2 = B.hp <= B.maxHp / 2, fl = B.flash > 0;
  let ox = 0; if (B.state === 'windup' || B.state === 'intro' || B.state === 'dead') ox = Math.round(rand(-1.5, 1.5)); else if (B.state === 'downed') ox = Math.random() < 0.15 ? Math.round(rand(-1, 1)) : 0;
  const x = Math.round(B.x - cx0) + ox, y = Math.round(B.y), w = B.w, h = B.h;
  const body = fl ? '#ffffff' : C.wax, shade = fl ? '#ffffff' : C.waxSh;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + w / 2, Math.round(B.y + h) + 1, w / 2 + 2, 2, 0, 0, TAU); ctx.fill();
  ctx.fillStyle = body; ctx.beginPath();
  ctx.moveTo(x, y + h); ctx.lineTo(x, y + 11); ctx.quadraticCurveTo(x, y, x + 11, y); ctx.lineTo(x + w - 11, y); ctx.quadraticCurveTo(x + w, y, x + w, y + 11); ctx.lineTo(x + w, y + h); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade; ctx.fillRect(x + w - 6, y + 9, 6, h - 9); ctx.fillRect(x, y + h - 3, w, 3);
  for (let i = 0; i < 4; i++) { const len = 3 + (Math.sin(B.anim * 1.2 + i * 1.9) * 0.5 + 0.5) * 7; ctx.fillStyle = shade; ctx.fillRect(x + 3 + i * 8, y + 1, 2, 3 + len); ctx.fillStyle = body; ctx.fillRect(x + 3 + i * 8, y + 3 + len, 2, 2); }
  const fx = x + w / 2 + B.face * 3, fy = y + 15;
  ctx.fillStyle = fl ? '#ddd' : '#1a1414'; ctx.beginPath(); ctx.ellipse(fx, fy, 10, 7, 0, 0, TAU); ctx.fill();
  const eyeC = B.state === 'windup' ? C.ember : B.state === 'stun' || B.state === 'downed' ? '#5c4d43' : B.state === 'dormant' ? '#3a2e28' : C.flame;
  ctx.fillStyle = eyeC; ctx.fillRect(fx - 6, fy - 2, 3, 3); ctx.fillRect(fx + 3, fy - 2, 3, 3); ctx.fillRect(fx - 2, fy + 3, 4, 1);
  if (B.state !== 'dead') for (const i of [-9, 0, 9]) {
    const wx = x + w / 2 + i; ctx.fillStyle = '#2a2222'; ctx.fillRect(wx, y - 4 + (i === 0 ? -2 : 0), 1, 4 + (i === 0 ? 2 : 0));
    if (B.state !== 'dormant' && !(B.state === 'intro' && !(G.cine && G.cine.lit > (i + 9) / 9))) drawFlame(wx + 0.5, y - 4 + (i === 0 ? -2 : 0), B.state === 'downed' ? 0.5 : p2 ? 1.35 : 1, t + i, p2 ? C.ember : C.flame, C.core);
  }
}
function drawHazards(cx0, t) {
  for (const d of G.drops) {
    const x = Math.round(d.x - cx0);
    if (d.warn > 0 && d.big) {
      const k = 1 - Math.min(1, d.warn / 0.6), cx = x + d.w / 2;
      ctx.fillStyle = `rgba(255,140,70,${0.08 + 0.18 * k})`; ctx.fillRect(cx - 2, T, 4, 12 * T); ctx.fillStyle = `rgba(255,140,70,${0.3 + 0.5 * k})`; ctx.fillRect(cx - 5, 13 * T - 2, 10, 2);
    } else if (d.warn > 0) {
      const k = 1 - Math.min(1, d.warn / 0.6);
      ctx.fillStyle = `rgba(239,227,194,${0.06 + 0.1 * k})`; ctx.fillRect(x + 2, T, 2, 12 * T - T);
      ctx.fillStyle = C.wax; ctx.beginPath(); ctx.arc(x + 3, T + 1, 1 + k * 2.5, 0, Math.PI); ctx.fill();
    } else if (d.big) {
      const y = Math.round(d.y), cx = x + d.w / 2;
      const g = ctx.createRadialGradient(cx, y + 8, 0, cx, y + 8, 16); g.addColorStop(0, 'rgba(255,170,90,.4)'); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 16, y - 8, 32, 32);
      ctx.fillStyle = 'rgba(242,165,65,.45)'; ctx.fillRect(cx - 1, y - 12, 2, 12);
      ctx.fillStyle = C.ember; ctx.beginPath(); ctx.moveTo(cx, y - 2); ctx.quadraticCurveTo(cx + 7, y + 9, cx, y + 13); ctx.quadraticCurveTo(cx - 7, y + 9, cx, y - 2); ctx.fill();
      ctx.fillStyle = C.flame; ctx.beginPath(); ctx.moveTo(cx, y + 2); ctx.quadraticCurveTo(cx + 4, y + 9, cx, y + 11); ctx.quadraticCurveTo(cx - 4, y + 9, cx, y + 2); ctx.fill();
      ctx.fillStyle = C.core; ctx.fillRect(cx - 1, y + 7, 2, 2);
      // where it will land
      ctx.fillStyle = 'rgba(255,120,60,.35)'; ctx.fillRect(cx - 4, 13 * T - 1, 8, 1);
    } else {
      const y = Math.round(d.y); ctx.fillStyle = C.wax; ctx.beginPath(); ctx.moveTo(x + 3, y); ctx.quadraticCurveTo(x + 7, y + 7, x + 3, y + 8); ctx.quadraticCurveTo(x - 1, y + 7, x + 3, y); ctx.fill();
    }
  }
  for (const pd of G.puddles) {
    const x = Math.round(pd.x - cx0), a = Math.min(1, pd.life / 0.4);
    ctx.fillStyle = `rgba(226,85,63,${0.6 * a})`; ctx.fillRect(x, pd.y - 2, pd.w, 2);
    for (let i = 0; i < 3; i++) drawFlame(x + 4 + i * 6, pd.y, 0.7 * a + 0.2 * Math.sin(t * 9 + i), t * 2 + i + x, C.ember, C.flame);
  }
  for (const sh of G.shots) {
    const x = Math.round(sh.x - cx0), y = Math.round(sh.y);
    const g = ctx.createRadialGradient(x + 3, y + 3, 0, x + 3, y + 3, 10); g.addColorStop(0, 'rgba(255,170,90,.4)'); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 7, y - 7, 20, 20);
    ctx.fillStyle = C.ember; ctx.fillRect(x - 1, y - 1, 8, 8); ctx.fillStyle = C.flame; ctx.fillRect(x, y, 6, 6); ctx.fillStyle = C.core; ctx.fillRect(x + 1, y + 1, 3, 2);
  }
  for (const w of G.waves) {
    const x = Math.round(w.x - cx0), y = Math.round(w.y);
    if (w.big) {
      // a rolling wall of fire: glow, scorched floor behind it, three tall licking tongues
      const fx = x + w.w / 2, by = y + w.h, d = Math.sign(w.vx) || 1;
      const g = ctx.createRadialGradient(fx, by - 10, 0, fx, by - 10, 32); g.addColorStop(0, 'rgba(255,170,90,.45)'); g.addColorStop(1, 'rgba(255,90,40,0)');
      ctx.fillStyle = g; ctx.fillRect(fx - 32, by - 42, 64, 64);
      ctx.fillStyle = 'rgba(30,10,6,.55)'; ctx.fillRect(fx - d * 40, by - 1, d * 34, 1);
      drawFlame(fx - d * 7, by, 2.1, t * 1.6 + x, C.ember, C.flame);
      drawFlame(fx + d * 4, by, 2.9, t * 1.9 + x * 0.7, C.flame, C.core);
      drawFlame(fx - d * 1, by, 2.4, t * 2.3 + x * 1.3, C.ember, C.core);
      continue;
    }
    drawFlame(x + 5, y + 10, 1.4, t * 1.3 + x, C.ember, C.flame);
  }
}
function drawFx(cx0) {
  ctx.lineCap = 'round';
  for (const f of G.fx) {
    const k = f.t / f.max, x = f.x - cx0, y = f.y;
    if (f.k === 'gash') {
      const kk = Math.min(1, k * 1.6), dx = Math.cos(f.ang) * f.len / 2, dy = Math.sin(f.ang) * f.len / 2;
      hlens(x - dx, y - dy, x + dx, y + dy, 3.4 * kk + 0.4, `rgba(120,200,255,${0.5 * kk})`);
      hlens(x - dx * 0.92, y - dy * 0.92, x + dx * 0.92, y + dy * 0.92, 1.3 * kk + 0.25, `rgba(255,255,255,${kk})`);
      continue;
    }
    if (f.k === 'shard') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(f.rot); ctx.fillStyle = `rgba(205,238,255,${k})`;
      ctx.beginPath(); ctx.moveTo(-f.s, 0); ctx.lineTo(0, -f.s * 0.5); ctx.lineTo(f.s * 1.2, 0); ctx.lineTo(0, f.s * 0.5); ctx.fill(); ctx.restore();
      continue;
    }
    if (f.k === 'slash') {
      const L = f.len * (1.3 - k * 0.3), dx = Math.cos(f.ang) * L / 2, dy = Math.sin(f.ang) * L / 2;
      ctx.strokeStyle = `rgba(242,165,65,${0.6 * k})`; ctx.lineWidth = 7 * k + 1;
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 3 * k + 0.6;
      ctx.beginPath(); ctx.moveTo(x - dx, y - dy); ctx.lineTo(x + dx, y + dy); ctx.stroke();
    } else if (f.k === 'boom') {
      const p = 1 - k, R = (f.big ? 34 : 24) * Math.min(1, p * 2.2 + 0.25);
      const g = ctx.createRadialGradient(x, y, 0, x, y, R * 1.8); g.addColorStop(0, `rgba(255,200,110,${0.55 * k})`); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g; ctx.fillRect(x - R * 1.8, y - R * 1.8, R * 3.6, R * 3.6);
      ctx.fillStyle = `rgba(226,85,63,${Math.min(1, k * 1.4)})`; ctx.beginPath(); ctx.arc(x, y, R, 0, TAU); ctx.fill();
      for (const l of f.lobes) { const lx = x + Math.cos(l.a) * l.d * (0.6 + p), ly = y + Math.sin(l.a) * l.d * (0.6 + p) - p * 6; ctx.beginPath(); ctx.arc(lx, ly, l.r * (0.5 + p * 0.8), 0, TAU); ctx.fill(); }
      ctx.fillStyle = `rgba(242,165,65,${Math.min(1, k * 1.6)})`; ctx.beginPath(); ctx.arc(x, y - p * 3, R * 0.68, 0, TAU); ctx.fill();
      ctx.fillStyle = `rgba(255,241,193,${Math.max(0, k * 2 - 0.6)})`; ctx.beginPath(); ctx.arc(x, y - p * 4, R * 0.38 * (1 - p * 0.5), 0, TAU); ctx.fill();
      ctx.strokeStyle = `rgba(255,230,180,${0.8 * k})`; ctx.lineWidth = 2 * k + 0.5; ctx.beginPath(); ctx.arc(x, y, R * 1.5 + p * 16, 0, TAU); ctx.stroke();
    } else if (f.k === 'ring') {
      ctx.strokeStyle = `rgba(${f.c},${k})`; ctx.lineWidth = 2.5 * k + 0.5;
      ctx.beginPath(); ctx.arc(x, y, Math.max(1, f.r * (1.1 - k * 0.8)), 0, TAU); ctx.stroke();
    } else if (f.k === 'star') {
      const rr = f.r * (0.4 + 0.6 * (1 - k));
      ctx.strokeStyle = `rgba(255,255,255,${k})`; ctx.lineWidth = 1.5; ctx.beginPath();
      for (let i = 0; i < f.n; i++) { const a = f.rot + i * TAU / f.n, r0 = i % 2 ? rr * 0.55 : rr; ctx.moveTo(x + Math.cos(a) * 3, y + Math.sin(a) * 3); ctx.lineTo(x + Math.cos(a) * r0, y + Math.sin(a) * r0); }
      ctx.stroke();
      ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.beginPath(); ctx.arc(x, y, 5 * k + 1, 0, TAU); ctx.fill();
    }
  }
  ctx.lineCap = 'butt';
}
function drawSpells(cx0, t) {
  for (const s of G.spells) {
    if (s.k === 'bolt') {
      const x = s.x - cx0, y = s.y, d = Math.sign(s.vx), cy = y + s.h / 2, hx = d > 0 ? x + s.w : x, fl = Math.sin((s.t || 0) * 40) * 1.2;
      const g = ctx.createRadialGradient(hx - d * 6, cy, 0, hx - d * 6, cy, 26); g.addColorStop(0, 'rgba(255,200,120,.45)'); g.addColorStop(1, 'rgba(255,120,60,0)');
      ctx.fillStyle = g; ctx.fillRect(hx - d * 6 - 26, cy - 26, 52, 52);
      // tail
      const tl = 46;
      ctx.fillStyle = 'rgba(226,85,63,.55)'; ctx.beginPath(); ctx.moveTo(hx - d * 6, cy - 6 - fl); ctx.lineTo(hx - d * tl, cy); ctx.lineTo(hx - d * 6, cy + 6 + fl); ctx.fill();
      ctx.fillStyle = 'rgba(242,165,65,.85)'; ctx.beginPath(); ctx.moveTo(hx - d * 4, cy - 4); ctx.lineTo(hx - d * tl * 0.7, cy + fl * 0.5); ctx.lineTo(hx - d * 4, cy + 4); ctx.fill();
      // head
      ctx.fillStyle = C.ember; ctx.beginPath(); ctx.moveTo(hx + d * 3, cy); ctx.lineTo(hx - d * 8, cy - 6); ctx.lineTo(hx - d * 13, cy); ctx.lineTo(hx - d * 8, cy + 6); ctx.fill();
      ctx.fillStyle = C.flame; ctx.beginPath(); ctx.moveTo(hx + d * 1, cy); ctx.lineTo(hx - d * 7, cy - 4); ctx.lineTo(hx - d * 10, cy); ctx.lineTo(hx - d * 7, cy + 4); ctx.fill();
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(hx - d * 1, cy); ctx.lineTo(hx - d * 6, cy - 2); ctx.lineTo(hx - d * 8, cy); ctx.lineTo(hx - d * 6, cy + 2); ctx.fill();
    } else if (s.k === 'flare') {
      const k = s.life / s.max, x = s.x - cx0, y = s.y;
      const g = ctx.createLinearGradient(0, y, 0, y + s.h); g.addColorStop(0, 'rgba(242,165,65,0)'); g.addColorStop(1, `rgba(242,165,65,${0.45 * k + 0.1})`);
      ctx.fillStyle = g; ctx.fillRect(x + 4, y, s.w - 8, s.h);
      for (let i = 0; i < 4; i++) drawFlame(x + 8 + i * 8, y + s.h - 4 - (i % 2) * 6, 2.2 + Math.sin(t * 9 + i) * 0.3, t * 1.2 + i, i % 2 ? C.ember : C.flame, C.core);
      drawFlame(x + s.w / 2, y + 26, 3.2, t, C.flame, C.core);
    } else if (s.k === 'burn') {
      const k = s.life / s.max, x = s.x - cx0;
      for (let i = 0; i < 5; i++) drawFlame(x + 4 + i * 6, s.y + 12, (0.9 + 0.5 * Math.sin(t * 8 + i)) * Math.min(1, k * 1.6), t * 1.3 + i * 1.7, i % 2 ? C.ember : C.flame, C.core);
    } else if (s.k === 'quake') {
      const k = s.life / s.max, x = s.x - cx0, y = s.y, rr = 50 * (1 - k) + 6;
      ctx.lineWidth = 3 * k + 1;
      ctx.strokeStyle = `rgba(255,241,193,${k})`; ctx.beginPath(); ctx.ellipse(x, y - 2, rr, rr * 0.3, 0, Math.PI, TAU); ctx.stroke();
      ctx.strokeStyle = `rgba(143,240,224,${k * 0.8})`; ctx.beginPath(); ctx.ellipse(x, y - 2, rr * 0.7, rr * 0.22, 0, Math.PI, TAU); ctx.stroke();
    }
  }
}
// training dummies: a wax-and-straw figure on a stake or a chain, and a brass lantern to bounce off
function drawDummyFigure(fl) {
  ctx.fillStyle = fl ? '#ffffff' : '#b49a68'; ctx.fillRect(-5, -13, 10, 12);
  ctx.fillStyle = fl ? '#ffffff' : '#8a7349'; ctx.fillRect(-5, -9, 10, 1); ctx.fillRect(-5, -5, 10, 1); ctx.fillRect(-1, -13, 2, 12);
  ctx.fillStyle = fl ? '#ffffff' : '#c79a4a'; ctx.fillRect(-7, -12, 2, 4); ctx.fillRect(5, -12, 2, 4);
  ctx.fillStyle = fl ? '#ffffff' : C.wax; ctx.fillRect(-4, -20, 8, 7);
  ctx.fillStyle = '#3a2b2b';
  for (const ex of [-3, 1]) { ctx.fillRect(ex, -18, 1, 1); ctx.fillRect(ex + 2, -18, 1, 1); ctx.fillRect(ex + 1, -17, 1, 1); ctx.fillRect(ex, -16, 1, 1); ctx.fillRect(ex + 2, -16, 1, 1); }
  ctx.fillRect(-1, -14, 3, 1);
}
function drawDummy(e, cx0) {
  const bx = Math.round(e.x + e.w / 2 - cx0), fl = e.flash > 0;
  if (e.kind === 'H') {
    const top = T, pivotY = top, by = Math.round(e.y + e.h), ang = clamp(e.wob, -0.6, 0.6) + Math.sin(e.t * 1.4) * 0.04;
    ctx.save(); ctx.translate(bx, pivotY); ctx.rotate(-ang);
    ctx.fillStyle = '#6b6f7a'; for (let y = 0; y < by - pivotY - 20; y += 3) ctx.fillRect(-0.5, y, 1, 2);
    ctx.translate(0, by - pivotY + 1); drawDummyFigure(fl); ctx.restore();
    return;
  }
  if (e.kind === 'L') {
    const y = Math.round(e.y + Math.sin(e.t * 2) * 1.2), lx = bx;
    const g = ctx.createRadialGradient(lx, y + 5, 0, lx, y + 5, 22); g.addColorStop(0, 'rgba(242,165,65,.28)'); g.addColorStop(1, 'rgba(242,165,65,0)');
    ctx.fillStyle = g; ctx.fillRect(lx - 22, y - 17, 44, 44);
    ctx.fillStyle = fl ? '#ffffff' : C.brass; ctx.fillRect(lx - 6, y, 12, 2); ctx.fillRect(lx - 5, y + 8, 10, 2); ctx.fillRect(lx - 2, y - 3, 4, 3);
    ctx.fillStyle = fl ? '#ffffff' : '#8d6a33'; ctx.fillRect(lx - 5, y + 2, 1, 6); ctx.fillRect(lx + 4, y + 2, 1, 6);
    ctx.fillStyle = 'rgba(255,241,193,.35)'; ctx.fillRect(lx - 4, y + 2, 8, 6);
    drawFlame(lx + 0.5, y + 7, 0.75, e.t, C.flame, C.core);
    // a down-arrow hint while the bounce lesson is active
    if (G.signAct === 'pogo') { const a = 0.5 + 0.5 * Math.sin(e.t * 5), ay = y - 14 + Math.sin(e.t * 5) * 1.5; ctx.fillStyle = `rgba(255,241,193,${a})`; ctx.fillRect(lx - 1, ay - 4, 2, 4); ctx.fillRect(lx - 3, ay, 6, 1); ctx.fillRect(lx - 2, ay + 1, 4, 1); ctx.fillRect(lx - 1, ay + 2, 2, 1); }
    return;
  }
  const by = Math.round(e.y + e.h);
  if (e.kind === 'W') {
    // a stout pillar of old wax with a glowing core; it rocks when struck and sheds wax
    ctx.save(); ctx.translate(bx, by); ctx.rotate(clamp(e.wob, -0.5, 0.5) * 0.5);
    const g = ctx.createRadialGradient(0, -10, 0, 0, -10, 18); g.addColorStop(0, `rgba(255,220,140,${0.22 + (P.wax < 33 ? 0.12 * Math.sin(e.t * 4) + 0.12 : 0)})`); g.addColorStop(1, 'rgba(255,220,140,0)');
    ctx.fillStyle = g; ctx.fillRect(-18, -28, 36, 36);
    ctx.fillStyle = '#3c2f22'; ctx.fillRect(-7, -2, 14, 2);
    ctx.fillStyle = fl ? '#fff' : C.waxSh; ctx.fillRect(-6, -18, 12, 16);
    ctx.fillStyle = fl ? '#fff' : C.wax; ctx.fillRect(-5, -18, 9, 16);
    for (const [dx, len] of [[-5, 5], [-1, 8], [3, 4]]) { ctx.fillStyle = fl ? '#fff' : C.wax; ctx.fillRect(dx, -19, 2, len); ctx.fillRect(dx, -19 + len, 2, 1); }
    ctx.fillStyle = `rgba(242,165,65,${0.55 + 0.25 * Math.sin(e.t * 3)})`; ctx.fillRect(-1, -12, 3, 5);
    ctx.fillStyle = '#2a2222'; ctx.fillRect(0, -21, 1, 3); drawFlame(0.5, -21, 0.85, e.t, C.flame, C.core);
    ctx.restore();
    return;
  }
  ctx.fillStyle = C.wood; ctx.fillRect(bx - 1, by - 8, 2, 8); ctx.fillStyle = '#3c2f22'; ctx.fillRect(bx - 4, by - 1, 8, 1);
  ctx.save(); ctx.translate(bx, by - 7); ctx.rotate(clamp(e.wob, -0.6, 0.6)); drawDummyFigure(fl); ctx.restore();
}
// tutorial signposts: a small board with a glowing mark, brighter while you stand at it
function drawSigns(cx0, t) {
  if (!G.signs) return;
  for (const sg of G.signs) {
    const x = Math.round(sg.x - cx0), y = sg.y, on = G.signAct === sg.id;
    if (x < -20 || x > W + 20) continue;
    ctx.fillStyle = C.wood; ctx.fillRect(x - 1, y - 12, 2, 12);
    ctx.fillStyle = on ? C.woodHi : C.wood; ctx.fillRect(x - 7, y - 20, 14, 9);
    ctx.fillStyle = '#3c2f22'; ctx.fillRect(x - 7, y - 12, 14, 1);
    const a = on ? 0.9 + 0.1 * Math.sin(t * 6) : 0.45;
    ctx.fillStyle = `rgba(242,165,65,${a})`; ctx.fillRect(x - 1, y - 18, 2, 3); ctx.fillRect(x - 2, y - 16, 4, 2);
    ctx.fillStyle = `rgba(255,241,193,${a})`; ctx.fillRect(x, y - 16, 1, 1);
    if (on) { const g = ctx.createRadialGradient(x, y - 16, 0, x, y - 16, 16); g.addColorStop(0, 'rgba(242,165,65,.22)'); g.addColorStop(1, 'rgba(242,165,65,0)'); ctx.fillStyle = g; ctx.fillRect(x - 16, y - 32, 32, 32); }
  }
}
function drawGates(cx0, t) {
  // wax floor: blocks of pale candle wax set into the stone, soft and lumpy, with drips on the edge; a Wax Dive melts straight through
  const glow = 0.5 + 0.3 * Math.sin(t * 2.6);
  for (const k of G.cracks || []) {
    const [tx, ty] = k.split(',').map(Number), x = tx * T - cx0, y = ty * T; if (x < -T || x > W) continue;
    ctx.fillStyle = '#c9ba93'; ctx.fillRect(x, y, T, T);                         // shaded wax body
    ctx.fillStyle = '#efe3c2'; ctx.fillRect(x, y, T, T - 4);                     // lit face
    ctx.fillStyle = '#fff7e2'; ctx.fillRect(x, y, T, 2); ctx.fillRect(x + 2, y + 2, 3, 1); ctx.fillRect(x + 10, y + 2, 2, 1);  // soft top and highlights
    ctx.fillStyle = '#d9caa2'; ctx.fillRect(x + 5, y + 5, 1, 4); ctx.fillRect(x + 11, y + 7, 1, 3); ctx.fillRect(x + (tx % 2 ? 3 : 8), y + 10, 4, 1); // lumps and seams
    ctx.fillStyle = '#efe3c2'; ctx.fillRect(x + (tx % 2 ? 4 : 11), y + T, 1, 2 + (tx % 3)); ctx.fillRect(x + (tx % 2 ? 12 : 2), y + T, 1, 1);  // drips hanging into the gap
    ctx.fillStyle = `rgba(242,165,65,${0.18 * glow})`; ctx.fillRect(x, y - 2, T, 2); // a faint warm sheen on the surface
  }
  // over the weak floor: a bobbing "dive here" marker once Wax Dive is known, a lock before
  if (G.cracks && G.cracks.size && G.state === 'play') {
    let sx = 0, n = 0, ty0 = 99; for (const k of G.cracks) { const [tx, ty] = k.split(',').map(Number); sx += tx; n++; ty0 = Math.min(ty0, ty); }
    const mx = (sx / n) * T + 8 - cx0, my = ty0 * T, near = Math.abs(mx + cx0 - (P.x + P.w / 2)) < 90;
    if (mx > -20 && mx < W + 20) {
      const bob = Math.sin(t * 4) * 2, a2 = near ? 1 : 0.45;
      ctx.save(); ctx.globalAlpha = a2; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (G.skills.dive) {
        markArrow(mx, my - 22 + bob);
        if (near) { ctx.font = '9px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = '#f2c46a'; gtext(TOUCH ? 'STICK ↓ + SPARK' : 'WAX DIVE  ↓ + E', mx, my - 32 + bob); }
      } else if (near) {
        ctx.font = '9px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = '#efe3c2'; gtext('WAX FLOOR', mx, my - 26 + bob);
      }
      ctx.restore();
    }
  }
  // braziers: an iron bowl hanging from a chain, cold or roaring
  const bzNear = bz => !bz.lit && G.skills.bolt && Math.abs(bz.x - (P.x + P.w / 2)) < 150;
  for (const bz of G.braziers || []) {
    const x = Math.round(bz.x - cx0), y = bz.y; if (x < -30 || x > W + 30) continue;
    ctx.fillStyle = '#4a4e58'; for (let yy = T; yy < y - 6; yy += 3) ctx.fillRect(x, yy, 1, 2);
    ctx.fillStyle = '#2c2f38'; ctx.beginPath(); ctx.moveTo(x - 6, y - 4); ctx.lineTo(x + 6, y - 4); ctx.lineTo(x + 4, y + 2); ctx.lineTo(x - 4, y + 2); ctx.fill();
    ctx.fillStyle = '#5b6070'; ctx.fillRect(x - 6, y - 5, 12, 1);
    if (bz.lit) { drawFlame(x + 0.5, y - 4, 1.7, t * 1.3 + bz.x, C.flame, C.core); }
    else { ctx.fillStyle = '#5a2a20'; ctx.fillRect(x - 3, y - 6, 2, 1); ctx.fillRect(x + 1, y - 6, 2, 1); if ((t * 0.8 + bz.x) % 1 < 0.5) { ctx.fillStyle = 'rgba(120,120,130,.4)'; ctx.fillRect(x, y - 9 - ((t * 6) % 6), 1, 1); } }
    if (bzNear(bz) && G.state !== 'title') { // point at the cold bowl until it is lit
      const bob = Math.sin(t * 4) * 2; markArrow(x, y - 20 + bob);
      ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '9px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = '#f2c46a'; gtext(TOUCH ? 'TAP SPARK' : 'EMBER BOLT  E', x, y - 30 + bob); ctx.restore();
    }
  }
  if (!G.gates) return;
  for (const g of G.gates) {
    if (g.open && !(g.fade > 0)) continue;
    const x = g.x * T - cx0, a = g.open ? g.fade : 1; if (x < -T || x > W) continue;
    ctx.fillStyle = `rgba(22,18,14,${0.85 * a})`; ctx.fillRect(x, T, T, 12 * T);
    for (let y = T; y < 13 * T; y += 6) { ctx.fillStyle = `rgba(242,165,65,${(0.12 + 0.1 * Math.sin(t * 3 + y * 0.3)) * a})`; ctx.fillRect(x + 2, y, T - 4, 2); }
    const sy = 10 * T + 4; ctx.fillStyle = `rgba(226,85,63,${a})`; ctx.beginPath(); ctx.arc(x + T / 2, sy, 5, 0, TAU); ctx.fill();
    ctx.fillStyle = `rgba(255,241,193,${0.8 * a})`; ctx.fillRect(x + T / 2 - 1, sy - 3, 2, 4); ctx.fillRect(x + T / 2 - 2, sy - 1, 4, 2);
  }
}
// Ember Bolt landing: a fiery blast, a shockwave, a hard freeze and (once per bolt) the screen cracks for a moment
function boltImpact(x, y, dir, crack) {
  burst(x, y, 30, { spd:260, life:0.5, colors:[C.core, C.flame, C.ember, '#ffffff'], size:2, g:80 });
  burst(x, y, 12, { spd:120, life:0.8, colors:[C.ember, C.flame], size:2, g:-120 });
  G.fx.push({ k:'ring', x, y, t:0.32, max:0.32, r:46, c:'255,200,120' });
  G.fx.push({ k:'ring', x, y, t:0.2, max:0.2, r:26, c:'255,255,255' });
  G.fx.push({ k:'star', x, y, t:0.14, max:0.14, n:10, r:24, rot:rand(0, TAU) });
  G.hitstop = Math.max(G.hitstop, 0.1); G.shake = Math.max(G.shake, 8); screenFlash(0.38, 0.09, '255,190,110'); sfx('boltHit');
  // the explosion: a fireball that swells and rolls outward, then smoke and debris
  const lobes = []; for (let i = 0; i < 7; i++) lobes.push({ a:rand(0, TAU), d:rand(6, 14), r:rand(6, 11) });
  G.fx.push({ k:'boom', x, y, t:0.5, max:0.5, lobes, big:crack });
  for (let i = 0; i < 10; i++) G.parts.push({ x:x + rand(-8, 8), y:y + rand(-6, 6), vx:rand(-40, 40), vy:rand(-60, -20), life:rand(0.6, 1.1), max:1.1, c:i % 2 ? '#4a4450' : '#2e2a33', s:3, g:-30 });
  burst(x, y, 10, { spd:200, life:0.7, colors:['#2a2420', '#5a4a3a'], size:2, g:500 });
}
function drawShatter() {
  const S = G.shatter; if (!S || S.t <= 0) return;
  const k = S.t / S.max, a = Math.min(1, k * 1.6);
  // a faint displaced copy along the main cracks sells the "glass" for a few frames
  if (k > 0.6) { ctx.globalAlpha = 0.18 * (k - 0.6) / 0.4; ctx.drawImage(ctx.canvas, S.dir * 2, -1); ctx.globalAlpha = 1; }
  ctx.lineJoin = 'miter';
  for (const [w, col] of [[1.8, `rgba(10,8,14,${0.45 * a})`], [0.8, `rgba(255,248,230,${0.8 * a})`]]) {
    ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath();
    for (const pts of S.segs) { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); }
    ctx.stroke();
  }
  const g = ctx.createRadialGradient(S.x, S.y, 0, S.x, S.y, 40); g.addColorStop(0, `rgba(255,240,210,${0.35 * a})`); g.addColorStop(1, 'rgba(255,240,210,0)');
  ctx.fillStyle = g; ctx.fillRect(S.x - 40, S.y - 40, 80, 80);
}
function lightBrazier(bz) {
  bz.lit = true; G.lit[bz.key] = true; sfx('kIgnite'); G.hitstop = Math.max(G.hitstop, 0.06);
  burst(bz.x, bz.y - 4, 24, { spd:120, life:0.7, colors:[C.flame, C.ember, C.core], size:2, g:-100 });
  G.fx.push({ k:'ring', x:bz.x, y:bz.y, t:0.4, max:0.4, r:30, c:'242,165,65' });
  bz.openIn = 0.35; // the gate unseals a beat later
  toast('The brazier roars. Somewhere a lock unseals.', 2600);
}
function breakCracks() {
  if (!G.cracks.size) return;
  const ty = Math.floor((P.y + P.h + 1) / T), seed = [];
  for (let tx = Math.floor(P.x / T); tx <= Math.floor((P.x + P.w - 0.01) / T); tx++) if (G.cracks.has(tx + ',' + ty)) seed.push(tx + ',' + ty);
  if (!seed.length) return;
  const q = seed.slice(), gone = new Set(seed);
  while (q.length) { const [x, y] = q.pop().split(',').map(Number); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const k = (x + dx) + ',' + (y + dy); if (G.cracks.has(k) && !gone.has(k)) { gone.add(k); q.push(k); } } }
  for (const k of gone) { const [x, y] = k.split(',').map(Number); G.room.g[y][x] = 0; G.cracks.delete(k); burst(x * T + 8, y * T + 8, 12, { spd:150, life:0.7, colors:['#efe3c2', '#fff7e2', '#c9ba93', C.flame], size:2, g:500 }); }
  G.broken[G.ri] = true; buildTiles(); sfx('crack'); G.shake = Math.max(G.shake, 8); P.grounded = false; P.vy = 80;
}
function waxNudge(what) {
  if (P.wax >= 33 || !G.enemies.some(e => e.kind === 'W')) return;
  const now = G.time; if (now - (G.waxNudgeT || -99) < 8) return; G.waxNudgeT = now;
  toast(`Not enough wax for ${what}. Slash the glowing tallow totem nearby to refill your vessel.`, 3800);
}
function updateWorld() {
  if (G.cracks.size && !P.dead && P.grounded) {
    const ty = Math.floor((P.y + P.h + 1) / T), on = [Math.floor(P.x / T), Math.floor((P.x + P.w - 0.01) / T)].some(tx => G.cracks.has(tx + ',' + ty));
    if (on) { G.creakT = (G.creakT || 0) - 1 / 120;
      if (G.creakT <= 0) { G.creakT = 0.7; G.shake = Math.max(G.shake, 1.2); tone2(90, 0.18, 'triangle', 0.05, 0.7); nsweep(0.15, 0.05, 'bandpass', 900, 300, 2);
        for (let i = 0; i < 6; i++) G.parts.push({ x:P.x + rand(-2, P.w + 2), y:P.y + P.h + 1, vx:rand(-10, 10), vy:rand(-30, -5), life:0.5, max:0.5, c:i % 2 ? '#efe3c2' : '#c9ba93', s:1, g:300 }); }
    }
  }
  if (G.cracks.size && !P.dead) {
    for (const k of G.cracks) { const [x, y] = k.split(',').map(Number); if (Math.abs(x * T + 8 - (P.x + P.w / 2)) < 56 && Math.abs(y * T - (P.y + P.h)) < 24) {
      if (G.skills.dive) waxNudge('a Wax Dive');
      if (G.skills.dive) showTip('crack1'); else hint('crack0', 'This floor is soft white wax. Something hot and heavy could melt through it; maybe the blacksmith can help.'); break; } }
  }
  for (const bz of G.braziers) { bz.t += 0.016;
    if (!bz.lit && Math.abs(bz.x - (P.x + P.w / 2)) < 170) waxNudge('Ember Bolt');
    if (bz.openIn > 0 && (bz.openIn -= 1 / 120) <= 0) for (const g of G.gates) if (g.id === bz.id && !g.open) openGate(g); if (!bz.lit && Math.abs(bz.x - (P.x + P.w / 2)) < 150 && G.skills.bolt) showTip('brazier'); }
}
function openGate(g) {
  g.open = true; g.fade = 1;
  for (let y = 1; y <= 12; y++) G.room.g[y][g.x] = 0;
  buildTiles(); sfx('gate'); G.shake = Math.max(G.shake, 3);
  for (let y = 2; y <= 12; y += 2) burst(g.x * T + 8, y * T, 4, { spd:60, life:0.6, colors:[C.ember, C.flame, C.core], size:2, g:120 });
}
function updateSigns(dt) {
  if (!G.room || !G.room.def.tut || P.dead) return;
  for (const g of G.gates) { if (g.open) g.fade = Math.max(0, (g.fade || 0) - (dt || 0) * 1.5); else if (tutDoneLesson(g.id)) openGate(g); }
  // the current lesson is the last sign you have walked up to
  let cur = null;
  for (const sg of G.signs) if (sg.x <= P.x + P.w / 2 + 28) cur = sg;
  if (!cur) return;
  if (cur.id !== G.signAct) { G.signAct = cur.id; sfx('sign'); }
  const need = TUT_NEED[cur.id], done = tutDoneLesson(cur.id) || (cur.id === 'focus' && P.hp >= P.maxHp);
  const ct = need ? ` <span class="ct">${Math.min(need, G.tutProg[cur.id] || 0)}/${need}</span>` : '';
  const html = `<span class="tag">${done ? '✓ Done' : 'Lesson'}</span><span>${done && G.gates.some(g => g.id === cur.id) ? 'The seal breaks. Go on.' : TUT[cur.id]()}${ct}</span>`;
  if (html !== G.tutLast) { const el = $('tutHud'); el.innerHTML = html; el.classList.toggle('done', !!done); G.tutLast = html; }
}
function drawRelics(cx0, t) {
  for (const r of G.relics) {
    const x = r.x - cx0, y = r.y + Math.sin(r.t * 2.5) * 2, col = SK[r.id].col;
    ctx.strokeStyle = col; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(t * 4); ctx.lineWidth = 1; ctx.beginPath();
    for (let i = 0; i < 4; i++) { const a = t * 0.8 + i * Math.PI / 2; ctx.moveTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); ctx.lineTo(x + Math.cos(a) * 12, y + Math.sin(a) * 12); }
    ctx.stroke(); ctx.globalAlpha = 1;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 6); ctx.lineTo(x + 5, y); ctx.lineTo(x, y + 6); ctx.lineTo(x - 5, y); ctx.fill();
    ctx.fillStyle = C.core; ctx.fillRect(x - 1, y - 2, 2, 4);
  }
}
function drawLight(cx0) {
  const lx = P.x + P.w / 2 - cx0, ly = P.y;
  const g = ctx.createRadialGradient(lx, ly, 24, lx, ly, 300);
  g.addColorStop(0, 'rgba(5,6,10,0)'); g.addColorStop(1, 'rgba(5,6,10,0.66)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (x, y, r, a) => { const gg = ctx.createRadialGradient(x, y, 0, x, y, r); gg.addColorStop(0, `rgba(242,165,65,${a})`); gg.addColorStop(1, 'rgba(242,165,65,0)'); ctx.fillStyle = gg; ctx.fillRect(x - r, y - r, r * 2, r * 2); };
  if (!P.dead) glow(lx, ly - 4, 70 + (P.healT > 0 ? 30 : 0), 0.15);
  if (G.boss && G.boss.state !== 'dormant') glow(G.boss.x + G.boss.w / 2 - cx0, G.boss.y - 4, 90, 0.14);
  if (G.shrine && G.shrine.lit) glow(G.shrine.x + 8 - cx0, G.shrine.y, 50, 0.12);
  for (const r of G.relics) glow(r.x - cx0, r.y, 44, 0.16);
  for (const bz of G.braziers || []) if (bz.lit) glow(bz.x - cx0, bz.y - 4, 80, 0.24);
  for (const f of G.fx) if (f.k === 'boom') glow(f.x - cx0, f.y, 120, 0.5 * f.t / f.max);
  for (const c of G.coinL || []) glow(c.x - cx0, c.y, 26, 0.1);
  if (G.smith) glow(G.smith.x - 11 - cx0, G.smith.y + T - 7, 60, 0.18);
  if (G.abyss) glow(G.abyss.x - cx0, G.abyss.y, 110 * G.abyss.open, 0.3 * G.abyss.open);
  if (G.char === 'knight' && P.fin && P.atkT > 0 && !P.dead) { const tp = knightTip(); glow(tp.x - cx0, tp.y, 80, 0.26); }
  for (const s of G.spells) if (s.k !== 'quake') glow(s.x + s.w / 2 - cx0, s.y + s.h / 2, s.k === 'flare' ? 95 : 55, 0.22);
  ctx.globalCompositeOperation = 'source-over';
}
const FLAME_SVG = '<svg viewBox="0 0 10 14"><path d="M5 0C6 3 9 5 9 8.5A4 4 0 0 1 1 8.5C1 5 4 3 5 0z" fill="CO"/><path d="M5 5c.6 1.6 2 2.6 2 4a2 2 0 0 1-4 0c0-1.4 1.4-2.4 2-4z" fill="CI"/></svg>';
const hudLast = {};
// the bobbing two-tone "here" arrow, pointing down at (x, y + 9)
function markArrow(x, y) {
  for (let i = 0; i < 2; i++) { const yy = y + i * 5; ctx.fillStyle = i ? '#f2a541' : '#fff1c1'; ctx.beginPath(); ctx.moveTo(x - 4, yy); ctx.lineTo(x + 4, yy); ctx.lineTo(x, yy + 4); ctx.fill(); }
}
function updateHUD() {
  const layer = $('hudLayer'); if (!layer) return;
  const show = (G.state === 'play' || G.state === 'paused' || G.state === 'tip') && !G.cine && !G.finish && !G.descend;
  if (layer.hidden === show) layer.hidden = !show;
  if (!show) return;
  // embers: rebuilt only when health or max change
  const ek = P.hp + '/' + P.maxHp + (P.hurtT > 0 ? 'h' : '');
  if (hudLast.e !== ek) {
    const prev = hudLast.hp;
    $('hudEmb').innerHTML = Array.from({ length:P.maxHp }, (_, i) => i < P.hp
      ? FLAME_SVG.replace('<svg', `<svg class="on${prev != null && i >= prev ? ' gone' : ''}"`).replace('CO', P.hurtT > 0 ? '#e2553f' : '#f2a541').replace('CI', '#fff1c1')
      : FLAME_SVG.replace('<svg', '<svg class="lost"').replace('CO', '#262b38').replace('CI', '#1a1e28')).join('');
    hudLast.e = ek; hudLast.hp = P.hp;
  }
  const w = Math.round(P.wax), ok = P.wax >= 33;
  if (hudLast.w !== w) { const r = $('hudWax'); r.setAttribute('y', 35 - (P.wax / 99) * 30); r.classList.toggle('ok', ok); $('hudRing').classList.toggle('ok', ok); hudLast.w = w; }
  const fp = P.healT > 0 ? Math.round(Math.min(1, P.healT / focusT()) * 100) : 0;
  if (hudLast.f !== fp) { const fe = $('hudFocus'); fe.setAttribute('stroke-dasharray', fp + ' 100'); fe.style.opacity = fp ? 1 : 0; hudLast.f = fp; }
  if (hudLast.c !== G.coins) { $('hudCoinN').textContent = '×' + G.coins; $('hudCoin').classList.toggle('rich', G.coins >= COST); hudLast.c = G.coins; }
  const sk = Object.keys(SK).filter(id => !SK[id].held).map(id => G.skills[id] ? 1 : 0).join('');
  if (hudLast.s !== sk) { $('hudSk').innerHTML = Object.keys(SK).filter(id => !SK[id].held).map(id => G.skills[id] ? `<i class="on" style="background:${SK[id].col};color:${SK[id].col}"></i>` : '<i></i>').join(''); hudLast.s = sk; }
  const B = G.boss, bs = B && !['dormant', 'dead', 'downed', 'intro'].includes(B.state);
  const hb = $('hudBoss'); if (hb.hidden === !!bs) hb.hidden = !bs;
  if (bs) {
    const two = B.kind === 'wyrm' || B.kind === 'moth', moth = B.kind === 'moth';
    const name = B.kind === 'umbra' ? 'The Black Wick' : B.kind === 'chandler' ? 'The Hanging Chandler' : B.kind === 'wyrm' ? (B.state === 'pupa' ? 'The Pupa' : 'The Tallow Wyrm') : moth ? 'The Cinder Moth' : 'The Tallow Warden';
    if (hudLast.bn !== name) { $('hudBossN').textContent = name; hudLast.bn = name; }
    const t2 = $('hudBossT2'); if (t2.hidden === two) t2.hidden = !two;
    const p1 = moth ? 0 : Math.max(0, Math.round(B.hp / B.maxHp * 1000) / 10), p2 = moth ? Math.max(0, Math.round(B.hp / B.maxHp * 1000) / 10) : 100;
    if (hudLast.bp !== p1) { $('hudBossBar').style.width = p1 + '%'; hudLast.bp = p1; }
    if (two && hudLast.bp2 !== p2 + ':' + moth) { $('hudBossBar2').style.width = p2 + '%'; t2.classList.toggle('lock', !moth); $('hudBossT1').classList.toggle('lock', moth); hudLast.bp2 = p2 + ':' + moth; } }
}
function drawHUD(t) {
  const vx = 20, vy = 20, r = 12;
  ctx.fillStyle = 'rgba(5,6,10,0.6)'; ctx.beginPath(); ctx.arc(vx, vy, r + 3, 0, TAU); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(vx, vy, r, 0, TAU); ctx.clip();
  ctx.fillStyle = '#181c27'; ctx.fillRect(vx - r, vy - r, r * 2, r * 2);
  const top = vy + r - (P.wax / 99) * 2 * r;
  ctx.fillStyle = P.wax >= 33 ? C.wax : C.waxSh; ctx.fillRect(vx - r, top + Math.sin(t * 3) * 0.7, r * 2, r * 2);
  ctx.restore();
  ctx.strokeStyle = P.wax >= 33 ? C.wax : '#7b7766'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(vx, vy, r, 0, TAU); ctx.stroke();
  ctx.fillStyle = '#7b7766'; ctx.fillRect(vx + r - 3, vy + r - 2 * r / 3 * 1, 3, 1); ctx.fillRect(vx + r - 3, vy + r - 2 * r / 3 * 2, 3, 1);
  if (P.healT > 0) { ctx.strokeStyle = C.flame; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(vx, vy, r + 3, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, P.healT / focusT())); ctx.stroke(); }
  // learned skills: one small diamond each under the vessel
  Object.keys(SK).filter(id => !SK[id].held).forEach((id, i) => {
    const x = 14 + i * 9, y = 42; ctx.fillStyle = G.skills[id] ? SK[id].col : '#262b38';
    ctx.beginPath(); ctx.moveTo(x, y - 3); ctx.lineTo(x + 3, y); ctx.lineTo(x, y + 3); ctx.lineTo(x - 3, y); ctx.fill();
  });
  // coins, under the embers
  { const cx = 46, cy = 36; ctx.fillStyle = '#9a7a2a'; ctx.fillRect(cx - 3, cy - 3, 6, 6); ctx.fillStyle = '#e8c25a'; ctx.fillRect(cx - 2, cy - 3, 4, 6); ctx.fillRect(cx - 3, cy - 2, 6, 4); ctx.fillStyle = '#fff1c1'; ctx.fillRect(cx - 1, cy - 2, 1, 3);
    ctx.font = '8px monospace'; ctx.textBaseline = 'middle'; ctx.fillStyle = G.coins >= COST ? '#ffe58a' : '#cfc6ad'; gtext('\u00d7' + G.coins, cx + 5, cy + 0.5); }
  for (let i = 0; i < P.maxHp; i++) {
    const x = 44 + i * 13, y = 22;
    ctx.fillStyle = '#2a2f3d'; ctx.fillRect(x - 3, y, 7, 2);
    if (i < P.hp) drawFlame(x + 0.5, y, 1.3, t + i * 0.7, C.flame, C.core);
    else drawFlame(x + 0.5, y, 1.1, 0, '#262b38', null);
  }
  const B = G.boss;
  if (B && B.state !== 'dormant' && B.state !== 'dead') {
    const bw = 180, bx = W / 2 - bw / 2, by = H - 14;
    ctx.fillStyle = 'rgba(5,6,10,0.7)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 7);
    ctx.fillStyle = '#3a2420'; ctx.fillRect(bx, by, bw, 3);
    ctx.fillStyle = C.ember; ctx.fillRect(bx, by, Math.round(bw * B.hp / B.maxHp), 3);
  }
}
// Shrine Camp: the party rests around the candle shrine; the chosen hero stands. Real hero sprites, same idle code.
const campSt = {};
let campLast = 0;
function drawHeroAt(id, x, by, face, sit, t, dt) {
  const saveP = Object.assign({}, P), save = { char:G.char, muted, shake:G.shake, parts:G.parts, fx:G.fx, flash:Object.assign({}, G.flash), hitstop:G.hitstop };
  try {
    muted = true; G.parts = []; G.fx = [];
    let st = campSt[id + sit];
    if (!st) { resetPlayer(); st = campSt[id + sit] = Object.assign({}, P, { pose:{ lean:0, crouch:0, stride:0, hip:0, hop:0 }, atkHit:new Set() }); }
    Object.assign(P, st);
    G.char = id; P.x = x - P.w / 2; P.y = by - P.h; P.vx = 0; P.vy = 0; P.grounded = true; P.face = face; P.sit = sit; P.dead = false; P.inv = 0; P.hurtT = 0; P.healT = 0; P.atkT = 0;
    P.anim += dt; P.idleT = sit ? 0 : (P.idleT || 0) + dt;
    if (id === 'knight') updateKnightPose(dt); else if (id === 'hero') updateHeroPose(dt);
    drawPlayer(0, t);
    campSt[id + sit] = Object.assign({}, P);
  } catch (_) {}
  finally { Object.assign(P, saveP); G.char = save.char; muted = save.muted; G.shake = save.shake; G.parts = save.parts; G.fx = save.fx; G.flash = save.flash; G.hitstop = save.hitstop; }
}
const campCam = { x:W / 2, y:H / 2, z:1 };
const CAMP_SX = 300, CAMP_GY = 224, CAMP_SPOTS = { knight:[-34, 1], wick:[-17, 1], hero:[26, -1] };
function drawCamp(t) {
  const dt = Math.min(0.05, Math.max(0, t - campLast)); campLast = t;
  // where the camera wants to be
  let tx = W / 2, ty = H / 2, tz = 1;
  if (G.descend) { const k = Math.min(1, G.descend.t / DESCEND_T); tx = CAMP_SX; ty = CAMP_GY - 52; tz = 1 + 3.2 * k * k; }
  else if (G.menu === 'chapter') { tz = 1.5; tx = CAMP_SX - 10; ty = CAMP_GY - 64; }
  else if (G.menu === 'home' && G.homeFocus === 'party') {
    const hx = CAMP_SX + CAMP_SPOTS[G.char][0] * 2; tz = 2.4; tx = hx + (W * 0.17) / tz; ty = CAMP_GY - 26;
  }
  const lag = G.descend ? 1 : Math.min(1, dt * 5);
  campCam.x += (tx - campCam.x) * lag; campCam.y += (ty - campCam.y) * lag; campCam.z += (tz - campCam.z) * lag;
  ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(campCam.z, campCam.z); ctx.translate(-campCam.x, -campCam.y);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#060e10'); g.addColorStop(1, '#10201f'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // stalactites and soft shafts of light from above
  ctx.fillStyle = '#0a1415'; ctx.beginPath(); ctx.moveTo(0, 0); for (let x = 0; x <= W; x += 14) ctx.lineTo(x, 6 + ((x * 37) % 19) + (x % 42 === 0 ? 14 : 0)); ctx.lineTo(W, 0); ctx.fill();
  for (let i = 0; i < 3; i++) { const x = 120 + i * 120 + Math.sin(t * 0.3 + i) * 8, sg = ctx.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, 'rgba(143,240,224,.09)'); sg.addColorStop(1, 'rgba(143,240,224,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 26, 0); ctx.lineTo(x + 90, H); ctx.lineTo(x + 60, H); ctx.fill(); }
  ctx.fillStyle = '#0b1716'; ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 16) ctx.lineTo(x, 160 + Math.sin(x * 0.035) * 12 + ((x * 13) % 7)); ctx.lineTo(W, H); ctx.fill();
  // distant candle niches in the far wall
  for (const [nx, ny] of [[70, 150], [410, 140], [455, 168]]) { const a = 0.18 + 0.06 * Math.sin(t * 4 + nx); const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 14); ng.addColorStop(0, `rgba(242,165,65,${a})`); ng.addColorStop(1, 'rgba(242,165,65,0)'); ctx.fillStyle = ng; ctx.fillRect(nx - 14, ny - 14, 28, 28); ctx.fillStyle = '#f2a541'; ctx.fillRect(nx, ny, 1, 2); }
  // ground and moss
  const gy = CAMP_GY; ctx.fillStyle = '#132220'; ctx.fillRect(0, gy, W, H - gy); ctx.fillStyle = '#5fa39a'; ctx.fillRect(0, gy, W, 1);
  for (let x = 3; x < W; x += 6) { ctx.fillStyle = (x * 7) % 3 ? '#3b6c67' : '#5fa39a'; ctx.fillRect(x, gy - 1 - ((x * 7) % 3), 1, 1 + ((x * 7) % 3)); }
  // the shrine and its candle
  const sx = CAMP_SX;
  const sg2 = ctx.createRadialGradient(sx, gy - 40, 0, sx, gy - 40, 150); sg2.addColorStop(0, `rgba(242,165,65,${0.34 + 0.05 * Math.sin(t * 5)})`); sg2.addColorStop(1, 'rgba(242,165,65,0)'); ctx.fillStyle = sg2; ctx.fillRect(sx - 150, gy - 190, 300, 300);
  // the shrine and party are drawn at twice size so they read as the heart of the screen
  ctx.save(); ctx.translate(sx, gy); ctx.scale(2, 2); ctx.translate(-sx, -gy);
  ctx.fillStyle = C.stone; ctx.fillRect(sx - 12, gy - 14, 24, 14); ctx.fillStyle = C.stoneHi; ctx.fillRect(sx - 12, gy - 14, 24, 2); ctx.fillStyle = '#2a303e'; ctx.fillRect(sx - 16, gy - 2, 32, 2); ctx.fillRect(sx - 7, gy - 9, 14, 1);
  ctx.fillStyle = C.wax; ctx.fillRect(sx - 2, gy - 24, 5, 10); ctx.fillStyle = C.waxSh; ctx.fillRect(sx + 2, gy - 24, 1, 10); ctx.fillStyle = '#2a2222'; ctx.fillRect(sx, gy - 26, 1, 2);
  drawFlame(sx + 0.5, gy - 26, 1.3, t, C.flame, C.core);
  // the party: the chosen hero stands, the rest sit facing the flame
  for (const id of ['knight', 'wick', 'hero']) drawHeroAt(id, sx + CAMP_SPOTS[id][0], gy, CAMP_SPOTS[id][1], id !== G.char, t, dt);
  // the chosen hero gets a warm pool of light and a bobbing marker
  if (!G.descend && G.menu === 'home') {
    const hx = sx + CAMP_SPOTS[G.char][0], col = G.char === 'hero' ? '143,216,255' : '242,196,106', bob = Math.round(Math.sin(t * 3) * 1.5);
    const pl = ctx.createRadialGradient(hx, gy, 0, hx, gy, 16); pl.addColorStop(0, `rgba(${col},.35)`); pl.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = pl; ctx.fillRect(hx - 16, gy - 6, 32, 10);
    if (G.homeFocus !== 'party') { const my = gy - 36 + bob; ctx.fillStyle = `rgb(${col})`; ctx.beginPath(); ctx.moveTo(hx - 3, my); ctx.lineTo(hx + 3, my); ctx.lineTo(hx, my + 3); ctx.fill(); }
  }
  ctx.restore();
  // fireflies
  for (let i = 0; i < 16; i++) { const fx = (i * 97 + 40) % W + Math.sin(t * (0.4 + (i % 5) * 0.15) + i) * 18, fy = 120 + (i * 53) % 90 + Math.cos(t * 0.5 + i) * 10, a = 0.35 + 0.35 * Math.sin(t * 3 + i * 1.7);
    const fg = ctx.createRadialGradient(fx, fy, 0, fx, fy, 6); fg.addColorStop(0, `rgba(200,255,170,${0.35 * a})`); fg.addColorStop(1, 'rgba(200,255,170,0)'); ctx.fillStyle = fg; ctx.fillRect(fx - 6, fy - 6, 12, 12); ctx.fillStyle = `rgba(220,255,190,${a})`; ctx.fillRect(Math.round(fx), Math.round(fy), 1, 1); }
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 320); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // the descent: the flame flares, then the view closes to black around it
  if (G.descend) {
    const k = Math.min(1, G.descend.t / DESCEND_T), fx = W / 2 + (CAMP_SX - campCam.x) * campCam.z, fy = H / 2 + (CAMP_GY - 52 - campCam.y) * campCam.z;
    const fl = ctx.createRadialGradient(fx, fy, 0, fx, fy, 60 + 240 * k); fl.addColorStop(0, `rgba(255,230,170,${0.55 * k})`); fl.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = fl; ctx.fillRect(0, 0, W, H);
    const r = Math.max(0, 520 * (1 - Math.min(1, Math.max(0, (k - 0.35) / 0.65)) ** 1.6));
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(fx, fy, r, 0, TAU, true); ctx.fill();
  }
  if (G.campFade > 0) { ctx.fillStyle = `rgba(0,0,0,${Math.min(1, G.campFade)})`; ctx.fillRect(0, 0, W, H); G.campFade -= dt * 1.8; }
}
function render(t) {
  if (G.state === 'title') { ctx.setTransform(1, 0, 0, 1, 0, 0); drawCamp(t); return; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (!G.room) { ctx.fillStyle = C.void; ctx.fillRect(0, 0, W, H); return; }
  const zm = G.zm || 1, zs = zm > 1.001 && G.zf;
  if (zs) { const sx = G.zf.x - Math.round(G.cam.x), sy = G.zf.y; ctx.setTransform(zm, 0, 0, zm, sx - sx * zm, sy - sy * zm); }
  drawBg(t);
  const sk = G.shake * (COMF.shake ? 0.2 : 1);
  ctx.save(); ctx.translate(Math.round(rand(-sk, sk) * 0.6), Math.round(rand(-sk, sk) * 0.6 + (G.jolt || 0) * (COMF.shake ? 0.2 : 1)));
  const cx0 = Math.round(G.cam.x);
  ctx.drawImage(G.tiles, -cx0, 0);
  drawKiln(cx0, t); drawUmbraArena(t); drawShrine(cx0, t); drawHazards(cx0, t);
  drawSigns(cx0, t); drawGates(cx0, t);
  drawDrips(cx0);
  for (const e of G.enemies) e.burstC && e.type !== 'crawler' ? drawFoe(e, cx0, t) : e.type === 'crawler' ? drawCrawler(e, cx0) : e.dummy ? drawDummy(e, cx0) : e.type === 'spitter' ? drawSpitter(e, cx0, t) : e.type === 'cocoon' ? drawCocoon(e, cx0, t) : e.cinder ? drawCinderMoth(e, cx0, t) : drawFlyer(e, cx0, t);
  drawCoins(cx0, t); drawSecrets(cx0, t); drawRelics(cx0, t); drawWaxbits(cx0, t); drawBossF(cx0, t); drawFirePuffs(cx0); drawPlayer(cx0, t); if (G.char === 'hero') drawHeroWorld(cx0); drawSpells(cx0, t);
  for (const p of G.parts) { ctx.globalAlpha = clamp(p.life / p.max, 0, 1); ctx.fillStyle = p.c; ctx.fillRect(Math.round(p.x - cx0), Math.round(p.y), p.s, p.s); }
  ctx.globalAlpha = 1;
  drawVeil(cx0); drawFx(cx0); drawFinish(cx0, t); drawDowned(cx0, t); drawLastWords(cx0);
  ctx.restore();
  drawLight(cx0);
  drawUmbraScreen();
  drawAbyss(cx0, t);   // drawn over the room's warm lighting so its blues stay pure
  if (zs) ctx.setTransform(1, 0, 0, 1, 0, 0);
  drawUmbraEntrance();
  if (G.lb > 0.01) {
    // the hatch: the room darkens around the shell and black bars close in
    const k = G.lb, fx = G.zf ? G.zf.x - Math.round(G.cam.x) : W / 2, fy = G.zf ? G.zf.y : H / 2;
    const vg = ctx.createRadialGradient(fx, fy, 40, fx, fy, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(8,2,2,${0.75 * k})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    const bh = Math.round(24 * k); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bh); ctx.fillRect(0, H - bh, W, bh);
  }
  if (G.blk > 0) {
    ctx.fillStyle = COMF.flash ? 'rgba(2,0,0,.72)' : 'rgba(2,0,0,.94)'; ctx.fillRect(0, 0, W, H);
    const fx = G.zf ? G.zf.x - Math.round(G.cam.x) : W / 2, fy = G.zf ? G.zf.y : H / 2;
    for (const [ex, ey] of G.eyeS || []) { const sx = (ex - fx) * zm + fx, sy = (ey - fy) * zm + fy, r = 3 * zm;
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 4); g.addColorStop(0, 'rgba(255,30,20,.7)'); g.addColorStop(1, 'rgba(255,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(sx - r * 4, sy - r * 4, r * 8, r * 8);
      ctx.fillStyle = '#ff3a24'; ctx.fillRect(Math.round(sx - r / 2), Math.round(sy - r / 3), Math.round(r), Math.max(1, Math.round(r * 0.6))); }
  }
  G.eyeS = [];
  drawSmog(); drawLore();
  if (G.char === 'hero') drawSeverance();
  drawFinishUI();
  if (G.flash.t > 0) { ctx.fillStyle = `rgba(${G.flash.c},${G.flash.a * (G.flash.t / G.flash.max)})`; ctx.fillRect(0, 0, W, H); }
  if (G.vig > 0) {
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.62);
    vg.addColorStop(0, 'rgba(226,85,63,0)'); vg.addColorStop(1, `rgba(226,85,63,${G.vig * 0.55})`);
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  drawCine();
  drawAbyssEnd();

  if (G.blackIn > 0) { const k = clamp(G.blackIn / (G.blackInMax || 2) * 1.25, 0, 1); ctx.fillStyle = `rgba(0,0,0,${k * k * (3 - 2 * k)})`; ctx.fillRect(0, 0, W, H); }
  if (G.iris) {
    const k = Math.min(1, G.iris.t / IRIS_T), e = 1 - Math.pow(1 - k, 3), px = P.x + P.w / 2 - Math.round(G.cam.x), py = P.y + 4;
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(px, py, Math.max(0.5, e * 560), 0, TAU, true); ctx.fill();
    if (k < 0.5) { const g = ctx.createRadialGradient(px, py, 0, px, py, 40); g.addColorStop(0, `rgba(255,230,170,${0.5 * (1 - k * 2)})`); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(px - 40, py - 40, 80, 80); }
  }
  if (G.fade > 0) { ctx.fillStyle = `rgba(7,8,12,${G.fade})`; ctx.fillRect(0, 0, W, H); }
}

