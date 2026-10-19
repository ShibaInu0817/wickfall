// ---------- particles
function burst(x, y, n, o) {
  for (let i = 0; i < n; i++) {
    const a = o.ang != null ? o.ang + rand(-o.spread, o.spread) : rand(0, TAU), s = rand(o.spd * 0.3, o.spd);
    G.parts.push({ x, y, vx:Math.cos(a) * s + (o.vx || 0), vy:Math.sin(a) * s + (o.vy || 0), life:rand(o.life * 0.5, o.life), max:o.life,
      c:o.colors[(Math.random() * o.colors.length) | 0], s:o.size || 2, g:o.g == null ? 400 : o.g });
  }
}
const dust = (x, y, n) => burst(x, y, n, { spd:50, life:0.4, colors:['#55607a', '#3c4558', '#6b7590'], size:2, g:-20, ang:-Math.PI / 2, spread:1.4 });
function updateParticles(dt) {
  for (const p of G.parts) { p.life -= dt; p.vy += p.g * dt; p.vx *= 0.985; p.x += p.vx * dt; p.y += p.vy * dt; }
  G.parts = G.parts.filter(p => p.life > 0);
  const pcap = G.lite ? 240 : 600; if (G.parts.length > pcap) G.parts.splice(0, G.parts.length - pcap);
}

// ---------- enemies
const mkCrawler = (px, py) => ({ type:'crawler', x:px + 1, y:py + T - 10, w:14, h:10, vx:0, vy:0, dir:-1, hp:3, flash:0, kbT:0, anim:rand(0, 5), grounded:false });
const mkFlyer = (px, py) => ({ type:'flyer', x:px, y:py, w:12, h:10, hx:px, hy:py, vx:0, vy:0, hp:2, flash:0, kbT:0, t:rand(0, 6) });
function mkDummy(px, py, kind, need) {
  const d = { type:'dummy', dummy:true, kind, need, vx:0, vy:0, hp:999, flash:0, kbT:0, wob:0, wv:0, t:rand(0, 6) };
  if (kind === 'H') return Object.assign(d, { x:px + 3, y:py + 2, w:10, h:18 });   // hangs above head height: only an up-slash reaches it
  if (kind === 'L') return Object.assign(d, { x:px + 2, y:py + 4, w:12, h:10 });   // floats over the spines
  if (kind === 'W') return Object.assign(d, { x:px + 2, y:py + T - 20, w:12, h:20 }); // tallow totem: slash it for wax, forever
  return Object.assign(d, { x:px + 3, y:py + T - 22, w:10, h:22 });
}
const mkSpitter = (px, py) => ({ type:'spitter', x:px + 2, y:py + T - 12, w:12, h:12, vx:0, vy:0, hp:3, flash:0, kbT:0, t:rand(0.8, 1.8), face:-1, charge:false, anim:rand(0, 5) });
const mkWickling = (x, y) => ({ type:'crawler', wickling:true, x:x - 5, y:y - 12, w:10, h:12, vx:0, vy:0, dir:(P.x + P.w / 2) < x ? -1 : 1, hp:1, flash:0, kbT:0, anim:rand(0, 5), grounded:false });
// a lobbed wax glob that lands on (or near) the target after tf seconds
function fireShot(x, y, tx, ty, tf) {
  const g = 520, vx = clamp((tx - x) / tf, -230, 230), vy = (ty - y - 0.5 * g * tf * tf) / tf;
  G.shots.push({ x:x - 3, y:y - 3, w:6, h:6, vx, vy, g, life:3 });
}
const mkBoss = (px, py) => ({ type:'boss', x:px, y:py + T - 30, w:34, h:30, vx:0, vy:0, hp:32, maxHp:32, state:'dormant', t:0, face:-1, flash:0, anim:0, last:'', repeat:0, next:'' });

// ---------- the new foes: two per chapter, each with its own warning
//   Drip Mite (ch1, 'd')   clings to the ceiling; when you pass under, a wax drip falls first, then it drops and gives chase
//   Smoke Wisp (ch1, 'w')  drifts slowly at you; a touch stings and leaves the screen edges smoky for a moment; one hit kills it
//   Wick Eel (ch2, 'e')    hides in a spine pit; bubbles mark where it will rise, then it leaps out in an arc and back
//   Hook Puppet (ch2, 'h') hangs on a chain from the ceiling and swings; the chain creaks at the end of each swing
//   Slag Crawler (ch3, 'g') armoured at the front, leaves a trail of burning slag; strike it from behind or dive on it
//   Ash Moth Swarm (ch3, 'm') five small moths circling in formation; hit one and the rest scatter, then regroup
const mkDripMite = (px, py) => ({ type:'dripmite', x:px + 3, y:py + 2, w:10, h:8, vx:0, vy:0, hp:2, flash:0, kbT:0, st:'hang', t:0, dir:-1, anim:rand(0, 5), grounded:false, burstC:['#c9ba93', '#efe3c2', '#6b5a3a'] });
const mkWisp = (px, py) => ({ type:'wisp', x:px + 3, y:py + 3, w:10, h:10, vx:0, vy:0, hp:1, flash:0, kbT:0, t:rand(0, 6), hx:px, hy:py, burstC:['#8c8f99', '#5f626b', '#c9ccd4'] });
const mkEel = (px, py) => ({ type:'eel', x:px, y:py + 2 * T, w:14, h:8, hx:px, vx:0, vy:0, hp:2, flash:0, kbT:0, st:'lurk', t:rand(0.8, 1.6), dir:1, burstC:['#2f78a8', '#9fdcf0', '#f2a541'] });
const mkPuppet = (px, py) => ({ type:'puppet', ax:px + 8, ay:T, len:72, ang:0.9, av:0, x:px, y:T + 72, w:12, h:14, vx:0, vy:0, hp:2, flash:0, kbT:0, t:rand(0, 3), creak:0, burstC:['#8a6a3a', '#c9a64e', '#3a2a1a'] });
const mkSlag = (px, py) => ({ type:'slag', x:px + 1, y:py + T - 10, w:16, h:10, vx:0, vy:0, dir:-1, hp:4, flash:0, kbT:0, anim:rand(0, 5), grounded:false, armor:true, lastPx:px, burstC:['#3a2a24', '#e2553f', '#f2a541'] });
function mkSwarm(px, py) {
  const grp = { cx:px + 8, cy:py + 8, t:0, scatter:0, alive:5 }, out = [];
  for (let i = 0; i < 5; i++) out.push({ type:'ashmoth', grp, k:i, x:grp.cx, y:grp.cy, w:7, h:6, vx:0, vy:0, hp:1, flash:0, kbT:0, burstC:['#6b6f7a', '#a8acb6', '#e2553f'] });
  return out;
}
function spawnFoe(type, px, py) {
  if (type === 'd') G.enemies.push(mkDripMite(px, py));
  else if (type === 'w') G.enemies.push(mkWisp(px, py));
  else if (type === 'e') G.enemies.push(mkEel(px, py));
  else if (type === 'h') G.enemies.push(mkPuppet(px, py));
  else if (type === 'g') G.enemies.push(mkSlag(px, py));
  else if (type === 'm') G.enemies.push(...mkSwarm(px, py));
}
// returns true when the foe was handled here
function updateFoe(e, dt) {
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2, ecx = e.x + e.w / 2;
  if (e.type === 'dripmite') {
    e.anim += dt;
    if (e.st === 'hang') { if (!P.dead && Math.abs(pcx - ecx) < 26 && P.y > e.y) { e.st = 'warn'; e.t = 0.55; G.drips = G.drips || []; G.drips.push({ x:ecx, y:e.y + e.h, vy:0 }); sfx('splat'); } return true; }
    if (e.st === 'warn') { e.t -= dt; e.x += Math.sin(e.anim * 60) * 0.3; if (e.t <= 0) { e.st = 'fall'; e.vy = 0; sfx('mChit'); } return true; }
    if (e.st === 'fall' || e.st === 'walk') {
      if (e.st === 'walk' && e.kbT <= 0 && e.grounded) e.dir = pcx < ecx ? -1 : 1;
      if (e.kbT > 0) { e.kbT -= dt; e.vx = approach(e.vx, 0, 700 * dt); } else e.vx = e.st === 'walk' ? e.dir * 44 : 0;
      e.vy = Math.min(e.vy + 1050 * dt, 420); const pb = e.y + e.h;
      e.x += e.vx * dt; collideX(e); e.y += e.vy * dt; e.grounded = false;
      const c = collideY(e, pb, false); if (c === 'floor') { if (e.st === 'fall') { e.st = 'walk'; dust(ecx, e.y + e.h, 4); sfx('thud'); } e.vy = 0; e.grounded = true; }
      if (e.y > G.room.h * T) e.dead = true;
    }
    if (!P.dead && overlap(P, e) && e.st !== 'hang') hurtPlayer(1, ecx);
    return true;
  }
  if (e.type === 'wisp') {
    e.t += dt; const dx = pcx - ecx, dy = pcy - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1;
    let tx = 0, ty = 0; const near = d < 180 && !P.dead;
    if (near && !e.seen) { e.seen = true; if (Math.abs(ecx - (G.cam.x + W / 2)) < W / 2) sfx('hiss'); } else if (!near && d > 230) e.seen = false;
    if (near) { tx = dx / d * 32; ty = dy / d * 32; } else { tx = (e.hx - e.x) * 0.8; ty = (e.hy - e.y) * 0.8; }
    ty += Math.sin(e.t * 2.4) * 12;
    if (e.kbT > 0) { e.kbT -= dt; e.vx = approach(e.vx, 0, 300 * dt); e.vy = approach(e.vy, 0, 300 * dt); } else { e.vx = approach(e.vx, tx, 60 * dt); e.vy = approach(e.vy, ty, 60 * dt); }
    e.x += e.vx * dt; e.y += e.vy * dt; e.x = clamp(e.x, T, G.room.w * T - T - e.w); e.y = clamp(e.y, T + 2, 12 * T - e.h);
    if (Math.random() < dt * 10) G.parts.push({ x:ecx + rand(-4, 4), y:e.y + rand(0, e.h), vx:rand(-6, 6), vy:rand(-14, -4), life:0.8, max:0.8, c:Math.random() < 0.5 ? '#6b6f7a' : '#8c8f99', s:2, g:-6 });
    if (!P.dead && overlap(P, e) && P.inv <= 0) { hurtPlayer(1, ecx); G.smog = 2.2; e.dead = true; burst(ecx, e.y + 5, 18, { spd:80, life:0.8, colors:e.burstC, size:2, g:-20 }); sfx('snuff'); }
    return true;
  }
  if (e.type === 'eel') {
    const floorY = 13 * T;
    if (e.st === 'lurk') { e.y = floorY + 12; e.t -= dt; if (e.t <= 0 && !P.dead && Math.abs(pcx - e.hx) < 140) { e.st = 'bubble'; e.t = 0.6; e.dir = pcx < e.hx ? -1 : 1; sfx('drip'); } return true; }
    if (e.st === 'bubble') { e.t -= dt; if (Math.random() < 0.6) G.parts.push({ x:e.hx + rand(-6, 6), y:floorY + 2, vx:rand(-8, 8), vy:-rand(30, 70), life:0.4, max:0.4, c:'#9fdcf0', s:1, g:120 }); if (e.t <= 0) { e.st = 'leap'; e.x = e.hx - e.w / 2; e.y = floorY; e.vx = e.dir * 70; e.vy = -360; sfx('mRush'); } return true; }
    if (e.st === 'leap') {
      if (e.kbT > 0) e.kbT -= dt;
      e.vy += 700 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
      if (Math.random() < 0.4) G.parts.push({ x:ecx, y:e.y + e.h, vx:0, vy:0, life:0.3, max:0.3, c:'#2f78a8', s:1, g:200 });
      if (e.vy > 0 && e.y > floorY + 10) { e.st = 'lurk'; e.t = rand(1.2, 2); e.hx = clamp(e.x + e.w / 2, e.hx - 40, e.hx + 40); burst(e.hx, floorY, 8, { spd:90, life:0.4, colors:['#9fdcf0', '#2f78a8'], size:1, g:300, ang:-Math.PI / 2, spread:1 }); sfx('splat'); }
      if (!P.dead && overlap(P, e)) hurtPlayer(1, ecx);
    }
    return true;
  }
  if (e.type === 'puppet') {
    e.t += dt; e.kbT = 0; e.vx = 0; e.vy = 0;
    // a pendulum on its chain; it creaks at each end of the swing, just before it comes back
    const g0 = -9.5 / (e.len / T) * Math.sin(e.ang); e.av += g0 * dt * 3.2; e.ang += e.av * dt; e.av *= 1 - 0.02 * dt;
    if (Math.abs(e.av) < 0.15 && e.creak <= 0) { e.creak = 0.4; sfx('creak'); } if (e.creak > 0) e.creak -= dt;
    if (Math.abs(e.ang) < 0.25 && Math.abs(e.av) < 1.6) e.av += Math.sign(e.av || 1) * 0.8 * dt;   // keeps swinging forever
    e.x = e.ax + Math.sin(e.ang) * e.len - e.w / 2; e.y = e.ay + Math.cos(e.ang) * e.len - e.h / 2;
    if (!P.dead && overlap(P, e)) hurtPlayer(1, e.x + e.w / 2);
    return true;
  }
  if (e.type === 'slag') {
    e.anim += dt;
    if (e.kbT > 0) { e.kbT -= dt; e.vx = approach(e.vx, 0, 700 * dt); } else e.vx = e.dir * 22;
    e.vy = Math.min(e.vy + 1050 * dt, 380); const pb = e.y + e.h;
    e.x += e.vx * dt; if (collideX(e) && e.kbT <= 0) e.dir *= -1;
    e.y += e.vy * dt; e.grounded = false; const c = collideY(e, pb, false); if (c === 'floor') { e.vy = 0; e.grounded = true; }
    if (e.kbT <= 0 && e.grounded) { const fx = e.dir > 0 ? e.x + e.w + 1 : e.x - 1, tl = tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T)); if (tl === 0 || tl === 2) e.dir *= -1; }
    // burning slag left behind it
    // a short lump every 30 px, dropped clear of its tail and cooling in 1.1 s; struck, it stops trailing for 1.4 s
    if (e.cool > 0) { e.cool -= dt; e.lastPx = e.x; }
    else if (e.grounded && Math.abs(e.x - e.lastPx) > 30) { e.lastPx = e.x; G.puddles.push({ x:e.dir > 0 ? e.x - 18 : e.x + e.w + 4, y:e.y + e.h, w:14, life:1.1, max:1.1, slag:true }); if (Math.abs(e.x - (G.cam.x + W / 2)) < W / 2 + 20) sfx('sizzle'); }
    if (!P.dead && overlap(P, e)) hurtPlayer(1, e.x + e.w / 2);
    if (e.y > G.room.h * T) e.dead = true;
    return true;
  }
  if (e.type === 'ashmoth') {
    const gp = e.grp;
    if (e.k === 0 || !gp.lead || gp.lead.dead) { gp.lead = e; }
    if (gp.lead === e) {   // one member steers the group each frame
      gp.t += dt; if (gp.scatter > 0) gp.scatter -= dt;
      const dx = pcx - gp.cx, dy = (P.y - 6) - gp.cy, d = Math.hypot(dx, dy) || 1;
      if (d < 200 && !P.dead) { gp.cx += dx / d * 34 * dt; gp.cy += dy / d * 34 * dt; }
      gp.cy = clamp(gp.cy, T * 2, 11 * T);
    }
    const a = gp.t * 2.2 + e.k * (TAU / 5), r = 16 + Math.sin(gp.t * 1.7 + e.k) * 3;
    const tx = gp.cx + Math.cos(a) * r, ty = gp.cy + Math.sin(a) * r * 0.6;
    if (gp.scatter > 0) { e.x += e.vx * dt; e.y += e.vy * dt; e.vx *= 1 - 2 * dt; e.vy *= 1 - 2 * dt; }
    else { e.x += (tx - e.x) * Math.min(1, dt * 5); e.y += (ty - e.y) * Math.min(1, dt * 5); }
    e.x = clamp(e.x, T, G.room.w * T - T - e.w); e.y = clamp(e.y, T + 2, 12 * T - e.h);
    if (e.kbT > 0) e.kbT -= dt;
    if (!P.dead && overlap(P, e)) hurtPlayer(1, e.x + e.w / 2);
    return true;
  }
  return false;
}
// when one ash moth is struck, the rest of its swarm scatters
function foeHit(e) {
  if (e.type === 'ashmoth') { const gp = e.grp; gp.scatter = 1.1; for (const o of G.enemies) if (o.grp === gp && o !== e) { const a = rand(0, TAU); o.vx = Math.cos(a) * 140; o.vy = Math.sin(a) * 110; } sfx('mFlap'); sfx('flutter'); }
  if (e.type === 'dripmite' && e.st === 'hang') { e.st = 'fall'; e.vy = 0; }
  if (e.type === 'slag') e.cool = 1.4;   // struck, its fire gutters: no trail for a moment, so you can stay on it
}
function updateDrips(dt) {
  if (!G.drips) return;
  for (const d of G.drips) { d.vy = Math.min(d.vy + 700 * dt, 400); d.y += d.vy * dt; const tl = tileAt(Math.floor(d.x / T), Math.floor(d.y / T)); if (tl === 1 || tl === 3) { d.dead = true; burst(d.x, Math.floor(d.y / T) * T, 4, { spd:50, life:0.3, colors:['#efe3c2', '#c9ba93'], size:1, g:300, ang:-Math.PI / 2, spread:1.2 }); } }
  G.drips = G.drips.filter(d => !d.dead);
  if (G.smog > 0) G.smog -= dt;
}
function drawFoe(e, cx0, t) {
  const x = Math.round(e.x - cx0), y = Math.round(e.y), fl = e.flash > 0;
  if (e.type === 'dripmite') {
    const body = fl ? '#ffffff' : '#c9ba93', dk = fl ? '#ffffff' : '#7a6a48';
    if (e.st === 'hang' || e.st === 'warn') {   // upside down on the ceiling, legs gripping the rock
      ctx.fillStyle = dk; for (let i = 0; i < 3; i++) ctx.fillRect(x + 1 + i * 3, y - 2, 1, 3);
      ctx.fillStyle = body; ctx.fillRect(x, y, 10, 5); ctx.fillRect(x + 2, y + 5, 6, 2);
      ctx.fillStyle = '#efe3c2'; ctx.fillRect(x + 4, y + 7, 2, 1 + (e.st === 'warn' ? 2 : Math.floor((t * 1.5) % 2)));   // a bead of wax forming
      ctx.fillStyle = '#e2553f'; ctx.fillRect(x + 2, y + 3, 1, 1); ctx.fillRect(x + 7, y + 3, 1, 1);
    } else {
      const ph = Math.floor(e.anim * 14) % 2, f = e.dir;
      ctx.fillStyle = dk; ctx.fillRect(x + 1, y + 6 + ph, 2, 2); ctx.fillRect(x + 7, y + 7 - ph, 2, 2);
      ctx.fillStyle = body; ctx.fillRect(x, y + 1, 10, 6); ctx.fillRect(x + 2, y, 6, 1);
      ctx.fillStyle = '#e2553f'; ctx.fillRect(x + (f > 0 ? 7 : 2), y + 2, 1, 1);
    }
    return;
  }
  if (e.type === 'wisp') {
    const p = 0.7 + 0.3 * Math.sin(e.t * 5), cx = x + 5, cy = y + 5;
    ctx.globalAlpha = 0.5; ctx.fillStyle = fl ? '#ffffff' : '#5f626b'; ctx.beginPath(); ctx.arc(cx, cy, 6 + p, 0, TAU); ctx.fill();
    ctx.globalAlpha = 0.85; ctx.fillStyle = fl ? '#ffffff' : '#8c8f99'; ctx.beginPath(); ctx.arc(cx, cy - 1, 4, 0, TAU); ctx.fill();
    ctx.globalAlpha = 1; ctx.fillStyle = '#e8ecf2'; ctx.fillRect(cx - 2, cy - 2, 1, 1); ctx.fillRect(cx + 1, cy - 2, 1, 1);
    return;
  }
  if (e.type === 'eel') {
    const floorY = 13 * T;
    if (e.st === 'bubble') { ctx.strokeStyle = `rgba(159,220,240,${0.4 + 0.4 * Math.sin(t * 20)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(Math.round(e.hx - cx0), floorY + 3, 8 + (0.6 - e.t) * 10, 2, 0, 0, TAU); ctx.stroke(); }
    if (e.st !== 'leap') return;
    const ang = Math.atan2(e.vy, e.vx);
    ctx.save(); ctx.translate(x + 7, y + 4); ctx.rotate(ang);
    ctx.fillStyle = fl ? '#ffffff' : '#1d4a6a'; ctx.fillRect(-8, -2, 16, 5);
    ctx.fillStyle = fl ? '#ffffff' : '#2f78a8'; ctx.fillRect(-8, -2, 16, 2); ctx.fillRect(-11, -1, 3, 3);
    ctx.fillStyle = '#9fdcf0'; ctx.fillRect(5, -1, 1, 1);
    ctx.fillStyle = '#f2a541'; ctx.fillRect(8, -4, 1, 2); ctx.fillStyle = '#ffe58a'; ctx.fillRect(8, -5, 1, 1);   // a little wick on its nose
    ctx.restore();
    return;
  }
  if (e.type === 'puppet') {
    const ax = e.ax - cx0, bx = x + 6, by = y + 2;
    ctx.strokeStyle = '#6b5a3a'; ctx.lineWidth = 1; ctx.setLineDash([2, 2]); ctx.beginPath(); ctx.moveTo(ax, e.ay); ctx.lineTo(bx, by); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(Math.round(ax) - 2, e.ay - 1, 4, 2);
    ctx.save(); ctx.translate(bx, by); ctx.rotate(-e.ang * 0.6);
    ctx.fillStyle = fl ? '#ffffff' : '#c9a64e'; ctx.fillRect(-1, -2, 2, 3);                                 // the hook
    ctx.fillStyle = fl ? '#ffffff' : '#8a6a3a'; ctx.fillRect(-5, 1, 10, 9); ctx.fillStyle = fl ? '#ffffff' : '#5a4428'; ctx.fillRect(-5, 8, 10, 2);
    ctx.fillStyle = '#efe3c2'; ctx.fillRect(-3, 3, 2, 2); ctx.fillRect(1, 3, 2, 2); ctx.fillStyle = '#1a1414'; ctx.fillRect(-2, 4, 1, 1); ctx.fillRect(2, 4, 1, 1);
    ctx.fillStyle = '#5a4428'; ctx.fillRect(-6, 10, 2, 3); ctx.fillRect(4, 10, 2, 3);
    ctx.restore();
    return;
  }
  if (e.type === 'slag') {
    const f = e.dir, ph = Math.floor(e.anim * 10) % 2, glow = 0.6 + 0.4 * Math.sin(e.anim * 6);
    ctx.fillStyle = '#1a1210'; ctx.fillRect(x + 2, y + 8 + ph, 3, 2); ctx.fillRect(x + 11, y + 9 - ph, 3, 2);
    ctx.fillStyle = fl ? '#ffffff' : '#2a201c'; ctx.fillRect(x, y + 2, 16, 7); ctx.fillRect(x + 2, y, 12, 2);
    ctx.fillStyle = `rgba(242,${Math.round(120 + 60 * glow)},60,1)`; ctx.fillRect(x + 4 - f, y + 1, 6, 1); ctx.fillRect(x + 6 - f * 2, y + 3, 3, 1);   // its back burns
    ctx.fillStyle = e.armor ? '#6b5a4a' : '#3a2a24'; ctx.fillRect(f > 0 ? x + 13 : x, y + 2, 3, 7);   // the plated front
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(f > 0 ? x + 14 : x + 1, y + 4, 1, 1);
    return;
  }
  if (e.type === 'ashmoth') {
    const wf = Math.sin(t * 30 + e.k) > 0 ? 1 : 0;
    ctx.fillStyle = fl ? '#ffffff' : '#6b6f7a'; ctx.fillRect(x, y + 1 - wf, 3, 2 + wf); ctx.fillRect(x + 4, y + 1 - wf, 3, 2 + wf);
    ctx.fillStyle = fl ? '#ffffff' : '#a8acb6'; ctx.fillRect(x + 3, y + 1, 1, 4);
    ctx.fillStyle = '#e2553f'; ctx.fillRect(x + 3, y + 1, 1, 1);
  }
}
function drawDrips(cx0) {
  if (G.drips) for (const d of G.drips) { ctx.fillStyle = '#efe3c2'; ctx.fillRect(Math.round(d.x - cx0), Math.round(d.y), 1, 3); }
}
// a touch of smoke clouds the edges of the screen for a moment
function drawSmog() {
  if (!(G.smog > 0)) return;
  const k = Math.min(1, G.smog / 1.2), g = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, W * 0.6);
  g.addColorStop(0, 'rgba(60,62,70,0)'); g.addColorStop(1, `rgba(60,62,70,${0.8 * k})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function updateEnemies(dt) {
  for (const e of G.enemies) {
    e.flash -= dt;
    if (e.dummy) { e.t += dt; e.wv += (-e.wob * 160 - e.wv * 9) * dt; e.wob += e.wv * dt; continue; } // springs back after each hit, never hurts
    if (e.type === 'cocoon') { e.t += dt; e.wv += (-e.wob * 120 - e.wv * 6) * dt; e.wob += e.wv * dt; continue; }
    if (updateFoe(e, dt)) continue;
    if (e.type === 'spitter') {
      e.anim += dt;
      const ecx = e.x + e.w / 2, pcx = P.x + P.w / 2, dx = pcx - ecx, dy = (P.y + P.h / 2) - (e.y + 4), d = Math.hypot(dx, dy);
      e.face = dx < 0 ? -1 : 1;
      if (d < 240 && !P.dead) { e.t -= dt; if (e.t <= 0) { fireShot(ecx + e.face * 5, e.y + 3, pcx, P.y + P.h / 2, 0.85); e.t = 2.4; sfx('spit'); } }
      else e.t = Math.max(e.t, 0.7);
      e.charge = d < 240 && e.t < 0.5;
    } else if (e.type === 'crawler') {
      e.anim += dt;
      if (e.wickling && e.kbT <= 0 && e.grounded) e.dir = (P.x + P.w / 2) < (e.x + e.w / 2) ? -1 : 1; // wicklings chase you
      if (e.kbT > 0) { e.kbT -= dt; e.vx = approach(e.vx, 0, 700 * dt); } else e.vx = e.dir * (e.armor ? 24 : e.wickling ? 50 : 32);
      e.vy = Math.min(e.vy + 1050 * dt, 380);
      const pb = e.y + e.h;
      e.x += e.vx * dt; if (collideX(e) && e.kbT <= 0) e.dir *= -1;
      e.y += e.vy * dt; e.grounded = false;
      const c = collideY(e, pb, false); if (c === 'floor') { e.vy = 0; e.grounded = true; } else if (c === 'ceil') e.vy = 0;
      if (e.kbT <= 0 && e.grounded) {
        const fx = e.dir > 0 ? e.x + e.w + 1 : e.x - 1, t = tileAt(Math.floor(fx / T), Math.floor((e.y + e.h + 2) / T));
        if ((t === 0 || t === 2) && !e.wickling) e.dir *= -1;
      }
      if (e.y > G.room.h * T) e.dead = true;
    } else if (e.type === 'flyer') {
      e.t += dt;
      const dx = (P.x + P.w / 2) - (e.x + e.w / 2), dy = (P.y + 4) - (e.y + e.h / 2), d = Math.hypot(dx, dy) || 1;
      let tx, ty;
      if (e.cinder && !P.dead) { const sp = (e.t % 2.2) < e.sw ? 62 : 120; tx = dx / d * sp; ty = dy / d * sp; }
      else if (d < 130 && !P.dead) { tx = dx / d * 46; ty = dy / d * 46; } else { tx = (e.hx - e.x) * 1.5; ty = (e.hy - e.y) * 1.5; }
      ty += Math.sin(e.t * 4) * (e.cinder ? 14 : 28);
      if (e.kbT > 0) { e.kbT -= dt; e.vx = approach(e.vx, 0, 500 * dt); e.vy = approach(e.vy, 0, 500 * dt); }
      else { const ac = e.cinder ? 240 : 170; e.vx = approach(e.vx, tx, ac * dt); e.vy = approach(e.vy, ty, ac * dt); }
      e.x += e.vx * dt; e.y += e.vy * dt;
      e.x = clamp(e.x, T, G.room.w * T - T - e.w); e.y = clamp(e.y, T + 2, 12 * T - e.h);
    }
    if (!P.dead && !e.dead && overlap(P, e)) hurtPlayer(1, e.x + e.w / 2);
  }
  G.enemies = G.enemies.filter(e => !e.dead);
}

// o: { spell, up, dir, x, y } — spells deal more damage but do not refill wax
function hitEnemy(e, dmg = 1, o = {}) {
  if (e.dead || (e.type === 'boss' && (e.state === 'dead' || e.state === 'downed' || G.finish))) return;
  if (e.kind === 'moth' && e.state === 'slash' && !o.spell) { mothParry(e, o); return; }
  if (e.kind === 'umbra' && umbraHit(e, o)) return;
  if (isKinBoss(e) && !kinOpen(e)) { kinDeflect(e, o); return; }
  if (e.armor) {
    const ecx = e.x + e.w / 2, behind = Math.sign((P.x + P.w / 2) - ecx) === -e.dir;
    if (o.spell) {
      e.armor = false; sfx('crack'); G.shake = Math.max(G.shake, 4);
      burst(ecx, e.y + 3, 16, { spd:150, life:0.6, colors:['#8a7448', '#b49a5c', '#ffffff'], size:2, g:380 });
    } else if (!behind && P.atkDir !== 'down') {
      sfx('shell'); e.flash = 0.04; G.hitstop = Math.max(G.hitstop, 0.04);
      burst(clamp(P.x + P.w / 2 + P.face * 10, e.x, e.x + e.w), e.y + 4, 6, { spd:140, life:0.25, colors:['#ffffff', '#ffe58a'], size:1, g:200 });
      if (!P.recoilT || P.recoilT <= 0) { P.recoilT = 0.12; P.recoilV = -P.face * 170; }
      hint('shell', tip('Its shell turns your blade. Strike it from behind, bounce on it, or crack it with a skill.', 'Its shell turns your blade. Strike from behind, down-slash on top, or crack it with a skill.'), 4200);
      return;
    }
  }
  e.hp -= dmg; e.flash = 0.14; foeHit(e);
  if (e.type === 'cocoon') e.wv += ((e.x + e.w / 2) < (P.x + P.w / 2) ? -1 : 1) * 7;
  if (e.dummy) {
    e.hp = 999; e.wv += (e.x + e.w / 2 < P.x + P.w / 2 ? -1 : 1) * (P.atkDir === 'side' ? 7 : 4);
    // only the move the lesson asks for counts
    if (!o.spell && G.tutProg && P.atkDir === e.need) { const k = e.need === 'side' ? 'slash' : e.need === 'up' ? 'upslash' : 'pogo'; G.tutProg[k] = (G.tutProg[k] || 0) + 1; }
  }
  const ecx = e.x + e.w / 2, pcx = P.x + P.w / 2, dir = o.dir != null ? o.dir : (ecx < pcx ? -1 : 1);
  const ad = o.spell ? (o.up ? 'up' : 'side') : P.atkDir;
  if (e.type !== 'boss' && o.combo) {
    // Lampknight combo hits 1-3: stagger in place so the next strike still connects
    e.kbT = 0.14; e.vx = dir * 30;
    if (e.type === 'flyer') e.vy = ad === 'up' ? -35 : ad === 'down' ? 35 : 0;
    else if (ad === 'up') e.vy = -60;
  } else if (e.type !== 'boss') {
    e.kbT = 0.16;
    if (ad === 'up') { e.vy = -170; e.vx = dir * 40; }
    else if (ad === 'down') { e.vy = e.type === 'flyer' ? 150 : 0; e.vx = dir * 60; }
    else e.vx = dir * (o.spell ? 210 : o.fin ? 290 : 170);
  }
  // contact point: where the strike meets the body
  const hx = o.x != null ? o.x : clamp(pcx + (ad === 'side' ? P.face * 10 : 0), e.x, e.x + e.w);
  const hy = o.y != null ? o.y : clamp(P.y + P.h / 2 + (ad === 'up' ? -12 : ad === 'down' ? 12 : 0), e.y, e.y + e.h);
  const ang = (ad === 'side' ? (dir > 0 ? -0.55 : 0.55) : ad === 'up' ? 1.2 : -1.2) + rand(-0.25, 0.25);
  const big = !!o.spell || !!o.fin || e.hp <= 0;
  impact(hx, hy, ang, big);
  if (e.type === 'boss') burst(hx, hy, 6, { spd:110, life:0.4, colors:[C.wax, C.waxSh, C.flame], size:2, g:300 });
  sfx(o.hero ? 'hHit' : G.char === 'wick' && !o.spell ? 'nHit' : G.char === 'knight' && !o.spell ? (o.fire ? 'kFireHit' : 'kHit') : 'hit');
  if (!o.spell) P.wax = Math.min(99, P.wax + (G.char === 'hero' ? 22 : 11));
  if (o.hero) {
    G.hitstop = Math.max(G.hitstop, 0.085);
    if (!o.sev) G.fx.push({ k:'gash', x:hx, y:hy, ang:o.gash == null ? 0.1 : o.gash, len:28, t:0.45, max:0.45 });
    else G.fx.push({ k:'gash', x:hx, y:hy, ang:rand(0, Math.PI), len:18, t:0.25, max:0.25 });
  }
  G.hitstop = Math.max(G.hitstop, o.fin ? 0.12 : big ? 0.075 : o.combo ? 0.07 : 0.055); G.shake = Math.max(G.shake, big ? 4 : 2.5);
  if (big) screenFlash(o.spell ? 0.22 : 0.16, 0.06);
  if (o.fire) {
    burst(hx, hy, 18, { spd:190, life:0.55, colors:[C.ember, C.flame, C.core], size:2, g:-60 });
    G.fx.push({ k:'ring', x:hx, y:hy, t:0.32, max:0.32, r:32, c:'242,165,65' });
    screenFlash(0.32, 0.09, '255,200,140');
  }
  if (e.hp <= 0) {
    if (e.type === 'boss') bossDie();
    else {
      e.dead = true; sfx('kill');
      G.fx.push({ k:'ring', x:ecx, y:e.y + e.h / 2, t:0.3, max:0.3, r:34, c:'255,241,193' });
      burst(ecx, e.y + e.h / 2, 22, { spd:170, life:0.6, colors:e.burstC ? e.burstC : e.type === 'crawler' ? [C.mite, C.miteHi, C.bone, '#ffffff'] : e.type === 'cocoon' ? [C.wax, '#fff7e2', C.waxSh, C.flame] : e.cinder ? [C.ember, C.flame, C.core, C.wax] : [C.moth, C.mothDk, C.eye, '#ffffff'], size:2, g:350 });
      if (e.cinder) waxBit(ecx, e.y + e.h / 2, null, -rand(60, 120));
      if (e.type === 'wisp') waxBit(ecx, e.y + e.h / 2, null, -rand(50, 90));   // cut down, a wisp condenses into a lump of wax
      if (e.type === 'cocoon') { waxBit(ecx, e.y + e.h / 2, null, -rand(60, 120)); if (Math.random() < 0.4) { const m = mkCinderMoth(ecx, e.y + e.h / 2); m.cinder = 'wild'; G.enemies.push(m); sfx('mFlap'); } }
    }
  }
}

