// ---------- boss
function setDoor(solid) {
  for (let y = 9; y <= 12; y++) G.room.g[y][0] = solid ? 1 : 0;
  buildTiles(); dust(8, 11 * T, 14);
}
// ---------- Chapter 2 boss: the Hanging Chandler
// It hovers at chest height and backs away from you, so Ember Bolt is the natural answer. Wax comes from the
// wicklings it drops (slash them) and from the tired moment after it crosses the hall, when it sits low and open.
const mkChandler = (px, py) => ({ type:'boss', kind:'chandler', x:px, y:T + 2, w:32, h:28, vx:0, vy:0, hp:42, maxHp:42, state:'dormant', t:0, face:-1, flash:0, anim:0, atk:1, crossT:11, rainCD:0, ty:T + 2, wardT:0, wardCD:3.5, bolts:[] });
function startWard(B) { const p2 = B.hp <= B.maxHp / 2; B.wardT = p2 ? 2.0 : 1.6; B.wardCD = p2 ? rand(3, 4.5) : rand(4.5, 6.5); sfx('ward'); }
function updateChandler(dt, B) {
  B.flash -= dt; B.anim += dt; B.t -= dt;
  const p2 = B.hp <= B.maxHp / 2, pcx = P.x + P.w / 2, bcx = B.x + B.w / 2, floorY = 13 * T, hoverY = floorY - B.h - 6, roomW = G.room.w * T;
  const wicks = G.enemies.filter(e => e.wickling && !e.dead).length;
  // the ward: candle flames whirl into a ring that swallows Ember Bolts (blades still get through)
  if (B.wardT > 0) B.wardT -= dt;
  if (['hover', 'windup'].includes(B.state) && !(G.gal && G.gal.passive)) { B.wardCD -= dt; if (B.wardCD <= 0 && B.wardT <= 0) startWard(B); }
  if (B.state === 'tired' || B.state === 'dead') B.wardT = 0;
  if (p2 && !B.enraged && B.state !== 'dead' && B.state !== 'dormant' && B.state !== 'intro') {
    B.enraged = true; B.state = 'enrage'; B.t = 1.5; B.vx = 0; B.wardT = 0; G.drops = []; G.shots = [];
    sfx('roar'); sfx('slam'); G.shake = 11; G.hitstop = Math.max(G.hitstop, 0.15); screenFlash(0.6, 0.2, '226,85,63'); G.vig = 1; buzz([80, 40, 140]);
    showBanner('The Chandler burns', 'Its wax runs hot', true);
    burst(bcx, B.y + B.h / 2, 40, { spd:230, life:0.8, colors:[C.ember, C.flame, C.core, '#b89cff'], size:2, g:0 });
    G.fx.push({ k:'ring', x:bcx, y:B.y + B.h / 2, t:0.5, max:0.5, r:70, c:'226,85,63' });
  }
  if (B.enraged && B.state !== 'dead' && Math.random() < 0.5) G.parts.push({ x:B.x + rand(4, B.w - 4), y:B.y + rand(6, B.h), vx:rand(-10, 10), vy:rand(-50, -20), life:0.6, max:0.6, c:Math.random() < 0.5 ? C.ember : C.flame, s:Math.random() < 0.3 ? 2 : 1, g:-40 });
  switch (B.state) {
    case 'enrage':
      B.vx = 0; B.ty = hoverY - 14 + Math.sin(B.anim * 30) * 1.5;
      if (Math.random() < 0.6) burst(bcx + rand(-14, 14), B.y + rand(0, B.h), 2, { spd:120, life:0.5, colors:[C.ember, C.flame], size:2, g:-80 });
      if (B.t <= 0) { B.state = 'hover'; B.atk = 0.8; B.crossT = 6; B.rainCD = 4; }
      break;
    case 'dormant': B.ty = T + 2;
      if (P.x > 7 * T && !P.dead) { B.state = 'intro'; B.t = CINE_T; startBossCine(B, 'The Hanging Chandler', 'It never comes close'); }
      break;
    case 'intro': B.ty = G.cine && G.cine.t < 0.7 ? T + 2 : hoverY; if (B.t <= 0) { B.state = 'hover'; B.atk = 1.1; } break;
    case 'hover': {
      const d = pcx - bcx, ad = Math.abs(d), away = d > 0 ? -1 : 1, sp = p2 ? 95 : 72;
      const tv = ad < 140 ? away * sp : ad > 220 ? -away * sp * 0.5 : 0;
      B.vx = approach(B.vx, tv, 260 * dt); B.face = d < 0 ? -1 : 1; B.ty = hoverY + Math.sin(B.anim * 2) * 3;
      if (!(G.gal && G.gal.passive)) { B.atk -= dt; B.crossT -= dt; B.rainCD -= dt; }
      const cornered = ((bcx < 4.5 * T && away < 0) || (bcx > roomW - 4.5 * T && away > 0)) && ad < 100;
      if ((cornered && B.atk < 1) || B.crossT <= 0) startChandler(B, 'cross', p2);
      else if (B.atk <= 0) {
        let opts = ['volley', 'call', 'volley']; if (p2) opts = ['volley', 'call', 'wave', 'volley', 'wave'].concat(B.rainCD <= 0 ? ['rain'] : []);
        if (wicks >= 3) opts = opts.filter(o => o !== 'call');
        let pick = opts[(Math.random() * opts.length) | 0];
        if (wicks === 0 && P.wax < 33) pick = 'call'; // keep a wax supply on hand when you're running dry
        startChandler(B, pick, p2);
      }
      break;
    }
    case 'windup': B.vx = approach(B.vx, 0, 400 * dt);
      // each wind-up moves differently: dip toward the floor for a wave, climb to the roof for rain, shudder for a crossing
      if (B.next === 'wave') B.ty = hoverY + 8;
      else if (B.next === 'rain') { B.ty = 2 * T + 6; B.vx = clamp((roomW / 2 - bcx) * 2, -120, 120); }
      else if (B.next === 'cross') { B.ty = hoverY - 6; B.wtick -= dt; if (B.wtick <= 0) { B.wtick = 0.12; sfx('chain'); } }
      else if (B.next === 'call') B.ty = hoverY - 2 + Math.sin(B.anim * 40);
      if (B.t <= 0) {
        const n = B.next;
        if (n === 'cross') { B.state = 'rise'; sfx('flare'); break; }
        if (n === 'volley') { const k = p2 ? 5 : 3; for (let i = 0; i < k; i++) fireShot(bcx, B.y + B.h - 6, pcx + (i - (k - 1) / 2) * 26, floorY - 6, 0.85 + i * 0.05); sfx('spit'); B.atk = p2 ? 1.4 : 1.9; }
        if (n === 'rain') {
          // phase two: burning wax rains down across the hall, every column marked first
          const cols = 9, roomW2 = G.room.w * T, gap = (roomW2 - 4 * T) / cols, off = rand(0, gap);
          for (let i = 0; i < cols; i++) G.drops.push({ x:2 * T + off + i * gap - 4, y:T + 1, w:8, h:12, vy:0, warn:0.55 + (i % 3) * 0.18, big:true, puddle:true });
          sfx('flare'); G.shake = Math.max(G.shake, 4); B.atk = 2.1;
        }
        if (n === 'call') { const k = p2 ? 3 : 2; for (let i = 0; i < k; i++) { const wx = bcx + (i - (k - 1) / 2) * 16; G.enemies.push(mkWickling(wx, B.y + B.h)); burst(wx, B.y + B.h - 4, 12, { spd:110, life:0.5, colors:[C.wax, C.waxSh, C.flame], size:2, g:300 }); }
          G.fx.push({ k:'ring', x:bcx, y:B.y + B.h, t:0.35, max:0.35, r:30, c:'239,227,194' }); sfx('chime'); sfx('spit'); B.atk = 1.7; }
        if (n === 'wave') { for (const dd of p2 ? [-1, 1] : [Math.sign(pcx - bcx) || 1]) G.waves.push({ x:bcx - 6, y:floorY - 20, w:12, h:20, vx:dd * (p2 ? 175 : 155), life:2.6, big:true }); sfx('waveFire'); G.shake = Math.max(G.shake, 5); B.atk = 1.5; }
        B.state = 'hover';
      }
      break;
    case 'rise': B.ty = 2 * T + 4; B.vx = approach(B.vx, 0, 600 * dt); if (Math.abs(B.y - B.ty) < 3) { B.state = 'fly'; B.dropT = 0.1; } break;
    case 'fly':
      B.vx = B.flyDir * (p2 ? 210 : 170); B.dropT -= dt;
      if (B.dropT <= 0) { B.dropT = p2 ? 0.2 : 0.26; G.drops.push({ x:bcx - 4, y:B.y + B.h - 2, w:8, h:12, vy:60, warn:0, big:true, puddle:p2 }); }
      if ((B.flyDir > 0 && bcx >= B.flyTo) || (B.flyDir < 0 && bcx <= B.flyTo)) { B.state = 'land'; B.vx = 0; }
      break;
    case 'land': B.ty = floorY - B.h; B.vx = 0;
      if (B.y >= B.ty - 1) { B.state = 'tired'; B.t = p2 ? 1.8 : 2.2; // long enough for the slower heroes to reach it G.shake = 6; sfx('thud'); dust(bcx, floorY, 14);
        if (p2) { for (const dd of [-1, 1]) G.waves.push({ x:bcx - 6 + dd * 14, y:floorY - 20, w:12, h:20, vx:dd * 150, life:2, big:true }); sfx('waveFire'); } }
      break;
    case 'tired': B.vx = 0; B.ty = floorY - B.h;
      if (Math.random() < 0.15) burst(bcx + rand(-10, 10), B.y + 4, 1, { spd:20, life:0.8, colors:['#6b6f7a'], size:2, g:-40 });
      if (B.t <= 0) { B.state = 'hover'; B.atk = 0.9; }
      break;
    case 'dead':
      B.vx = 0; B.ty = floorY - B.h;
      if (Math.random() < 0.6) burst(bcx + rand(-14, 14), B.y + rand(0, B.h), 2, { spd:90, life:0.7, colors:[C.wax, C.flame, C.core], size:2, g:-60 });
      if (B.t <= 0) {
        burst(bcx, B.y + B.h / 2, 60, { spd:220, life:1.1, colors:[C.wax, C.waxSh, '#e8c25a', C.core], size:3, g:200 });
        G.boss = null; G.bossDown = true; setDoor(false); G.winT = 2.6; sfx('kill'); toast('The Chandler gutters out.', 3000);
        return;
      }
      break;
  }
  if (B.state === 'dormant') { B.y = B.ty; return; }
  B.x = clamp(B.x + B.vx * dt, T, roomW - T - B.w);
  const fast = B.state === 'rise' || B.state === 'land' || B.state === 'dead';
  B.y = approach(B.y, B.ty, (fast ? 300 : 120) * dt);
  if (!P.dead && !['intro', 'tired', 'dead', 'downed'].includes(B.state) && overlap(P, { x:B.x + 4, y:B.y + 6, w:B.w - 8, h:B.h - 8 })) hurtPlayer(1, bcx);
}
function startChandler(B, pick, p2) {
  const roomW = G.room.w * T, bcx = B.x + B.w / 2;
  // wind-up length per attack (phase two is a little quicker, never instant)
  const WT = { volley:[0.65, 0.5], call:[0.6, 0.5], wave:[0.75, 0.6], cross:[0.9, 0.75], rain:[1.2, 1.2] }[pick] || [0.55, 0.45];
  B.next = pick; B.state = 'windup'; B.t = B.wt = WT[p2 ? 1 : 0]; B.wtick = 0;
  if (pick === 'cross') { B.flyDir = bcx < roomW / 2 ? 1 : -1; B.flyTo = B.flyDir > 0 ? roomW - 4 * T : 4 * T; B.crossT = p2 ? rand(8, 10) : rand(10, 13); }
  if (pick === 'rain') B.rainCD = 10;
  sfx({ volley:'tVolley', call:'tCall', wave:'tWave', cross:'tCross', rain:'tRain' }[pick] || 'thud');
}
// what each attack looks like before it lands
function drawChandlerTell(B, x, y, w, h, mx, t) {
  const k = clamp(1 - B.t / (B.wt || 0.6), 0, 1), cx0 = Math.round(G.cam.x), floorY = 13 * T, p2 = B.hp <= B.maxHp / 2;
  if (B.next === 'volley') {
    // three molten globs swell at its drip points, then it spits
    for (const dx of [-8, 0, 8]) { const r = 1 + k * 4; ctx.fillStyle = C.ember; ctx.beginPath(); ctx.arc(mx + dx, y + h + 2, r + 1, 0, TAU); ctx.fill(); ctx.fillStyle = C.flame; ctx.beginPath(); ctx.arc(mx + dx, y + h + 2, r, 0, TAU); ctx.fill(); }
    const g = ctx.createRadialGradient(mx, y + h, 0, mx, y + h, 22); g.addColorStop(0, `rgba(255,170,90,${0.4 * k})`); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; ctx.fillRect(mx - 22, y + h - 22, 44, 44);
  } else if (B.next === 'call') {
    // pale wax blobs bulge out of its body, about to drop and hatch
    for (const dx of [-10, 0, 10]) { ctx.fillStyle = C.wax; ctx.beginPath(); ctx.ellipse(mx + dx, y + h - 2 + k * 5, 3 + k * 2, 2 + k * 4, 0, 0, TAU); ctx.fill(); ctx.fillStyle = C.waxSh; ctx.fillRect(mx + dx - 1, y + h + k * 5, 2, 2); }
    ctx.strokeStyle = `rgba(239,227,194,${0.6 * k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(mx, y + h / 2, 20 + k * 6, 0, TAU); ctx.stroke();
  } else if (B.next === 'wave') {
    // flame gathers under it and a burning line races along the floor where the wave will roll
    const dirs = p2 ? [-1, 1] : [Math.sign(P.x + P.w / 2 - (B.x + B.w / 2)) || 1];
    for (const d of dirs) { const len = 30 + k * 110; const g = ctx.createLinearGradient(mx, 0, mx + d * len, 0); g.addColorStop(0, `rgba(255,150,70,${0.95 * k})`); g.addColorStop(1, 'rgba(255,120,60,0)'); ctx.fillStyle = g; ctx.fillRect(Math.min(mx, mx + d * len), floorY - 3, len, 3);
      for (let i = 0; i < 3; i++) { const ax = mx + d * (16 + i * 14 + k * 20); ctx.fillStyle = `rgba(255,200,120,${0.8 * k})`; ctx.fillRect(ax, floorY - 6, 1, 3); ctx.fillRect(ax - d, floorY - 5, 1, 1); } }
    drawFlame(mx + 0.5, y + h + 4, 0.8 + k * 1.4, t * 2, C.ember, C.flame);
  } else if (B.next === 'cross') {
    // it shudders and its eye fixes on the far wall; a dotted flight line shows where it will cross
    const ty = 2 * T + 4 + h / 2, x0 = mx, x1 = B.flyTo - cx0;
    ctx.fillStyle = `rgba(255,140,80,${0.25 + 0.5 * k})`; for (let xx = Math.min(x0, x1); xx < Math.max(x0, x1); xx += 6) ctx.fillRect(xx, ty, 3, 1);
    ctx.fillStyle = `rgba(255,140,80,${0.5 * k})`; for (let xx = Math.min(x0, x1) + 6; xx < Math.max(x0, x1); xx += 24) ctx.fillRect(xx + 1, ty + 3, 1, floorY - ty - 6);
  } else if (B.next === 'rain') {
    // it climbs to the roof, candles flare white and the whole ceiling glows red
    const g = ctx.createLinearGradient(0, T, 0, T + 40); g.addColorStop(0, `rgba(226,85,63,${0.45 * k})`); g.addColorStop(1, 'rgba(226,85,63,0)'); ctx.fillStyle = g; ctx.fillRect(0, T, W, 40);
    ctx.strokeStyle = `rgba(255,240,210,${0.7 * k})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(mx, y + h / 2, 22 + Math.sin(t * 20) * 2, 0, TAU); ctx.stroke();
  }
}
function drawChandler(cx0, t, B) {
  const p2 = B.hp <= B.maxHp / 2, fl = B.flash > 0, low = B.state === 'tired' || B.state === 'dead' || B.state === 'downed';
  let ox = 0; if ((B.state === 'windup' && B.next === 'cross') || B.state === 'intro' || B.state === 'dead') ox = Math.round(rand(-1.5, 1.5)); else if (B.state === 'windup') ox = Math.round(Math.sin(t * 50) * 0.6);
  const x = Math.round(B.x - cx0) + ox, y = Math.round(B.y), w = B.w, h = B.h, mx = x + w / 2;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(mx, 13 * T + 1, w / 2 + 2 - (13 * T - y - h) * 0.1, 2, 0, 0, TAU); ctx.fill();
  if (!low) { ctx.fillStyle = '#6b6f7a'; for (let yy = T; yy < y; yy += 3) ctx.fillRect(mx, yy, 1, 2); }
  // the wax body hanging under the ring, with drips
  const body = fl ? '#ffffff' : C.wax, shade = fl ? '#ffffff' : C.waxSh;
  ctx.fillStyle = body; ctx.beginPath(); ctx.moveTo(x + 3, y + 8); ctx.lineTo(x + w - 3, y + 8); ctx.quadraticCurveTo(x + w - 1, y + h - 6, mx + 4, y + h); ctx.lineTo(mx - 4, y + h); ctx.quadraticCurveTo(x + 1, y + h - 6, x + 3, y + 8); ctx.fill();
  ctx.fillStyle = shade; ctx.fillRect(x + w - 8, y + 9, 4, h - 14);
  for (let i = 0; i < 4; i++) { const len = 2 + (Math.sin(B.anim * 1.4 + i * 1.7) * 0.5 + 0.5) * 6, dx = x + 6 + i * 6; ctx.fillStyle = shade; ctx.fillRect(dx, y + h - 6, 2, len); ctx.fillStyle = body; ctx.fillRect(dx, y + h - 6 + len, 2, 2); }
  if (p2 && !fl) {
    ctx.strokeStyle = `rgba(255,${110 + Math.round(40 * Math.sin(t * 6))},60,.9)`; ctx.lineWidth = 1; ctx.beginPath();
    ctx.moveTo(x + 6, y + 10); ctx.lineTo(x + 9, y + 15); ctx.lineTo(x + 7, y + 20); ctx.moveTo(x + w - 7, y + 11); ctx.lineTo(x + w - 10, y + 17); ctx.lineTo(x + w - 8, y + 22); ctx.moveTo(mx - 3, y + h - 4); ctx.lineTo(mx, y + h - 8); ctx.lineTo(mx + 3, y + h - 5); ctx.stroke();
  }
  // one great eye
  const ex = mx + B.face * 2, ey = y + 16;
  ctx.fillStyle = fl ? '#ddd' : '#1a1414'; ctx.beginPath(); ctx.ellipse(ex, ey, 7, low || B.state === 'dormant' || (B.state === 'intro' && !(G.cine && G.cine.roared)) ? 2 : 5, 0, 0, TAU); ctx.fill();
  const asleep = B.state === 'dormant' || (B.state === 'intro' && !(G.cine && G.cine.roared));
  if (asleep) { ctx.fillStyle = '#3a2e28'; ctx.fillRect(ex - 6, ey, 12, 1); }
  else if (p2 && !low) { ctx.fillStyle = '#ff3a2a'; ctx.fillRect(ex - 3 + B.face, ey - 3, 6, 6); ctx.fillStyle = '#ffd0a0'; ctx.fillRect(ex - 1 + B.face * 2, ey - 1, 2, 2); }
  else if (!low) { ctx.fillStyle = B.state === 'windup' || B.state === 'fly' ? C.ember : p2 ? '#ff8a5c' : C.flame; ctx.fillRect(ex - 2 + B.face, ey - 2, 4, 4); ctx.fillStyle = '#1a1414'; ctx.fillRect(ex - 1 + B.face * 2, ey - 1, 2, 2); }
  if (B.wardT > 0) {
    const wa = Math.min(1, B.wardT * 3), wx = mx, wy = y + h / 2 + 2;
    const g = ctx.createRadialGradient(wx, wy, 8, wx, wy, 28); g.addColorStop(0, `rgba(160,130,255,${0.05 * wa})`); g.addColorStop(0.8, `rgba(201,182,255,${0.22 * wa})`); g.addColorStop(1, 'rgba(201,182,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(wx, wy, 28, 0, TAU); ctx.fill();
    for (let i = 0; i < 8; i++) { const a = t * 4 + i / 8 * TAU; drawFlame(wx + Math.cos(a) * 24, wy + Math.sin(a) * 22 + 3, 0.9, t * 2 + i, i % 2 ? '#b89cff' : C.flame, '#ffffff'); }
  }
  if (B.state === 'windup') drawChandlerTell(B, x, y, w, h, mx, t);
  // brass ring with five candles
  ctx.strokeStyle = fl ? '#fff' : C.brass; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(mx, y + 7, 16, 4, 0, 0, TAU); ctx.stroke();
  ctx.fillStyle = fl ? '#fff' : '#8d6a33'; ctx.fillRect(mx - 1, y + 2, 2, 5);
  const flare = B.state === 'windup' ? (B.next === 'rain' ? 1.9 : B.next === 'volley' ? 1.5 : 1.25) : low ? 0.55 : B.wardT > 0 ? 0.4 : 1;
  for (const k of [-12, -6, 0, 6, 12]) {
    const cy = y + 7 + Math.abs(k) * -0.1, cxk = mx + k;
    ctx.fillStyle = C.wax; ctx.fillRect(cxk - 1, cy - 6, 3, 6); ctx.fillStyle = '#2a2222'; ctx.fillRect(cxk, cy - 8, 1, 2);
    if (B.state !== 'dormant' && B.state !== 'dead' && !(B.state === 'intro' && !(G.cine && G.cine.roared))) drawFlame(cxk + 0.5, cy - 8, (p2 ? 1.5 : 0.95) * flare, t * (p2 ? 1.6 : 1) + k, p2 ? '#ff4a2a' : C.flame, p2 ? '#ffd0a0' : C.core);
  }
}
