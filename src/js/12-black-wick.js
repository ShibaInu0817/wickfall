// ---------- Hidden boss (Boss Lab only): The Black Wick
// Wick Hero's shadow: the same body, stance and katana, drawn by Wick Hero's own code and recoloured live into black wax
// and dark red fire. A duellist: no contact damage, six attacks that each have their own tell, and open windows after each.
//   Draw cut   red glint at the scabbard + "tsing" -> blinks through you at chest height, leaves a red line that splits a beat later (jump it)
//   Combo      blade raised overhead, eyes flare -> steps in with three cuts and a cross; open afterwards
//   Moonfall   leaps and vanishes in smoke; a red column of light marks you -> drops through it with a falling cut, 3 times (4 when hurt)
//   Crescents  steps back, blade held low and glowing -> blood-red waves along the floor (jump); below half the last one flies high (stay down)
//   Guard      blade held level, edge burning a steady red -> strike it and he blinks behind you and cuts; wait and he lowers it, open
//   Severance  below half: the room goes dark, a red sphere marks where you stand, cuts fill it, the click lands them all (get out)
const UMBRA_PUP_KEYS = ['pose', 'hurtT', 'swAng', 'vx', 'vy', 'grounded', 'anim', 'atkT', 'dashT', 'sheathed', 'sheathT', 'smear', 'sheathing', 'bladeVis', 'idleT', 'healT', 'sit', 'dead'];
const mkUmbra = x => ({ type:'boss', kind:'umbra', x:x - 6, y:13 * T - 16, w:12, h:16, vx:0, vy:0, hp:TUNE.umbraHp, maxHp:TUNE.umbraHp, state:'dormant', t:0, face:-1, flash:0, anim:0, atk:1, last:'', seq:0,
  lines:[], waves:[], marks:[], smoke:[], wisps:[], hide:false, glint:0, sev:null,
  pup:{ pose:{ lean:0, crouch:0, stride:0, hip:0, hop:0 }, hurtT:0, swAng:2.75, vx:0, vy:0, grounded:true, anim:0, atkT:0, dashT:0, sheathed:true, sheathT:0, smear:null, sheathing:null, bladeVis:1, idleT:1, healT:0, sit:false, dead:false } });
const UMBRA_COMBO = [{ at:0, a0:2.75, a1:-0.25 }, { at:0.3, a0:2.3, a1:-2.4 }, { at:0.62, a0:-2.3, a1:1.25 }, { at:0.8, a0:1.5, a1:-1.9 }];
function umbraPick(B) {
  const p2 = B.hp <= B.maxHp / 2, d = Math.abs(P.x + P.w / 2 - (B.x + B.w / 2)), high = P.y + P.h < 13 * T - 20;
  B.seq++;
  if (p2 && B.seq % 4 === 0) return umbraStart(B, 'sev');
  let pool = high ? [['moon', 4], ['wave', 1], ['sev', p2 ? 2 : 0]]
    : d < 70 ? [['combo', 3], ['guard', 2], ['iai', 1], ['wave', 1]] : [['iai', 3], ['wave', 2], ['moon', 2], ['combo', 1]];
  pool = pool.filter(([m, w]) => w > 0 && m !== B.last); if (!pool.length) pool = [['iai', 1], ['wave', 1]].filter(([m]) => m !== B.last);
  let r = Math.random() * pool.reduce((s, [, w]) => s + w, 0), pick = pool[0][0];
  for (const [m, w] of pool) { if ((r -= w) <= 0) { pick = m; break; } }
  umbraStart(B, pick);
}
function umbraStart(B, m) {
  const p2 = B.hp <= B.maxHp / 2, tl = TUNE.umbraTell * (p2 ? 0.8 : 1), pcx = P.x + P.w / 2, bcx = B.x + B.w / 2;
  B.last = m; B.face = pcx < bcx ? -1 : 1; B.vx = 0;
  if (m === 'iai') { B.state = 'uIaiW'; B.t = B.wt = 0.6 * tl; B.glint = 1; B.reps = p2 ? 1 : 0; sfx('uGlint'); }
  else if (m === 'combo') { B.state = 'uComboW'; B.t = B.wt = 0.45 * tl; sfx('uRaise'); }
  else if (m === 'moon') { B.state = 'uLeap'; B.t = 0.3; B.drops = p2 ? 4 : 3; B.vy = 0; }
  else if (m === 'wave') { B.state = 'uWaveW'; B.t = B.wt = 0.6 * tl; B.nw = p2 ? 3 : 2; sfx('uCharge'); }
  else if (m === 'guard') { B.state = 'uGuard'; B.t = 1.3; sfx('uGuard'); }
  else if (m === 'sev') {
    B.state = 'uSevW'; B.t = 0.45; sfx('uSevDrone');
    const cuts = [], c = { x:pcx, y:P.y + P.h / 2 - 4 }, R = 56;
    for (let i = 0; i < 30; i++) { const r = Math.sqrt(Math.random()) * R * 0.9, a = rand(0, TAU); cuts.push({ x:c.x + Math.cos(a) * r, y:c.y + Math.sin(a) * r * 0.85, a:rand(0, Math.PI), l:rand(12, 28), at:rand(0.05, 0.85) }); }
    for (let i = 0; i < 3; i++) cuts.push({ x:c.x + rand(-8, 8), y:c.y + rand(-8, 8), a:rand(0, Math.PI), l:R * 1.8, at:0.4 + i * 0.15 });
    cuts.sort((a, b) => a.at - b.at);
    B.sev = { x:c.x, y:c.y, r:R, p:0, dur:1.5 * tl, cuts, next:0, flash:0, dim:0 };
  }
}
// strike the guard and he answers; strike while he is out of reach and nothing happens
function umbraHit(B, o) {
  if (B.state === 'uGuard') {
    B.state = 'uCounter'; B.t = 0.2; B.flash = 0; sfx('uParry'); G.hitstop = Math.max(G.hitstop, 0.1); screenFlash(0.4, 0.1, '255,60,50');
    const bcx = B.x + B.w / 2; burst(bcx + B.face * 10, B.y + 4, 14, { spd:160, life:0.35, colors:['#ffffff', '#ff4a3c', '#7a0c14'], size:1, g:200 });
    if (!P.recoilT || P.recoilT <= 0) { P.recoilT = 0.12; P.recoilV = -P.face * 170; }
    return true;
  }
  if (B.hide || ['uIai', 'uCounter', 'uCut', 'intro', 'dormant', 'uLeap', 'uMark', 'uRise'].includes(B.state)) return true;
  return false;
}
function umbraDie(B) {
  B.state = 'dead'; B.t = 2.4; B.hp = 0; B.vx = 0; B.sev = null; B.lines = []; B.waves = []; B.marks = []; B.hide = false; B.y = 13 * T - B.h;
  G.hitstop = 0.35; heavyShake(12); sfx('uDie'); screenFlash(0.8, 0.35, '255,60,50'); G.vig = 1;
}
function updateUmbra(dt, B) {
  const floorY = 13 * T, p2 = B.hp <= B.maxHp / 2, pcx = P.x + P.w / 2, U = B.pup, rw = G.room.w * T;
  B.flash -= dt; B.anim += dt; B.t -= dt; if (B.glint > 0) B.glint -= dt * 2.5;
  let bcx = B.x + B.w / 2;
  const Tp = { lean:0.3, crouch:0.4, stride:0, hop:0 }; let ang = 2.75, snap = false; U.sheathed = true; U.smear = null; U.sheathing = null; U.bladeVis = 1;
  const hurt = (x, y, w, h, n) => { if (!P.dead && overlap(P, { x, y, w, h })) hurtPlayer(n || 1, bcx); };
  const faceP = () => { B.face = pcx < bcx ? -1 : 1; };
  const guardPose = () => { U.sheathed = false; ang = 0.55; Tp.lean = 0.8; Tp.crouch = 1.2; };
  if (p2 && !B.enraged && B.state !== 'dead') { B.enraged = true; sfx('uEnrage'); sfx('uBurn'); darkFlames(bcx, B.y + 4, 14, { w:8, sc:1.2, spread:0.3 }); heavyShake(10); screenFlash(0.5, 0.2, '200,20,30'); G.vig = 1; burst(bcx, B.y, 30, { spd:200, life:0.7, colors:['#ff4a3c', '#7a0c14', '#1a0a0c'], size:2, g:-40 }); }
  // dark red wisps rise off him all fight
  if (p2 && !B.hide && B.state !== 'dead' && Math.random() < dt * 3) darkFlames(bcx + rand(-4, 4), B.y - 2, 1, { w:3, sc:0.5, up:0.7 });
  if (!B.hide && Math.random() < dt * (p2 ? 26 : 16) * (G.lite ? 0.4 : 1)) B.wisps.push({ x:bcx + rand(-6, 6), y:B.y + rand(-14, 10), vy:-rand(12, 30), life:rand(0.5, 1), max:1, s:Math.random() < 0.3 ? 2 : 1 });
  switch (B.state) {
    case 'dormant': break;
    case 'intro': Tp.crouch = 0.3; faceP(); if (B.t <= 0) { B.state = 'uIdle'; B.atk = 0.8; } break;
    case 'uIdle': {
      faceP(); const d = pcx - bcx, ad = Math.abs(d);
      B.vx = ad > 95 ? Math.sign(d) * 70 : ad < 42 ? -Math.sign(d) * 60 : 0;
      if (!(typeof LAB !== 'undefined' && LAB.hold)) B.atk -= dt; if (B.atk <= 0) umbraPick(B);
      break; }
    case 'uIaiW': {
      // crouched, hand on the hilt; the glint flares at the mouth of the scabbard
      const k = 1 - B.t / B.wt; Tp.crouch = 2.2 * Math.min(1, k * 2); Tp.lean = -0.6; Tp.stride = 1; faceP();
      if (B.t <= 0) {
        B.state = 'uIai'; B.t = 0.12; B.dir = B.face; B.ix0 = bcx; B.ix1 = clamp(pcx + B.dir * 52, 2 * T, rw - 2 * T); sfx('uDash');
        if (Math.sign(B.ix1 - B.ix0) !== B.dir) B.ix1 = clamp(B.ix0 + B.dir * 90, 2 * T, rw - 2 * T);
      }
      break; }
    case 'uIai': {
      const k = 1 - Math.max(0, B.t) / 0.12, nx = B.ix0 + (B.ix1 - B.ix0) * k, px0 = bcx;
      B.x = nx - B.w / 2; bcx = nx; U.sheathed = false; ang = -0.25; snap = true; Tp.lean = 3.5; Tp.crouch = 2.5; Tp.stride = 3.5; U.smear = { a0:2.4, a:-0.25, fade:1 };
      hurt(Math.min(px0, nx) - 6, floorY - 16, Math.abs(nx - px0) + 12, 16);
      if (Math.random() < 0.8) darkFlames(nx - B.dir * 6, floorY - 8, 1, { sc:0.7, up:0.5 });
      if (B.t <= 0) {
        B.lines.push({ x0:Math.min(B.ix0, B.ix1) - 8, x1:Math.max(B.ix0, B.ix1) + 8, y:floorY - 9, t:0, cut:0.32, done:false });
        if (B.reps > 0) { B.reps--; B.state = 'uIaiW'; B.t = B.wt = 0.32; B.glint = 1; sfx('uGlint'); }
        else { B.state = 'uIaiEnd'; B.t = 0.6; }
        B.face = B.dir;
      }
      break; }
    case 'uIaiEnd': guardPose(); Tp.crouch = 1.8; if (B.t <= 0) { B.state = 'uOpen'; B.t = 0.45; U.sheathT = 0.18; } break;
    case 'uComboW': {
      // blade raised overhead; if you are far he closes the gap during the raise
      U.sheathed = false; ang = -2.3; Tp.lean = -1.2; Tp.crouch = 0.8; faceP();
      const d = pcx - bcx; if (Math.abs(d) > 30) B.vx = Math.sign(d) * Math.min(260, Math.abs(d) * 4); else B.vx = 0;
      if (B.t <= 0) { B.state = 'uCombo'; B.ct = 0; B.ci = -1; B.vx = 0; }
      break; }
    case 'uCombo': {
      const sp = p2 ? 0.85 : 1; B.ct += dt; U.sheathed = false; snap = true;
      let cur = -1; for (let i = 0; i < UMBRA_COMBO.length; i++) if (B.ct >= UMBRA_COMBO[i].at * sp) cur = i;
      if (cur !== B.ci) { B.ci = cur; sfx('uSlash', cur); B.x += B.face * 9; G.shake = Math.max(G.shake, cur === 3 ? 5 : 3);
        if (cur >= 2) { darkFlames(bcx + B.face * 20, floorY - 16, cur === 3 ? 7 : 4, { w:10, vx:B.face * 40 }); if (cur === 3) sfx('uBurn'); } }
      const S = UMBRA_COMBO[cur], q = clamp((B.ct - S.at * sp) / 0.11, 0, 1);
      ang = klerp(S.a0, S.a1, keo(q)); U.smear = { a0:S.a0, a:ang, fade:q < 1 ? 1 : Math.max(0, 1 - (B.ct - S.at * sp - 0.11) / 0.12) };
      Tp.lean = q < 1 ? 3.2 : 1.5; Tp.crouch = 2.2; Tp.stride = 3;
      if (q < 1) hurt(B.face > 0 ? bcx : bcx - 36, floorY - 34, 36, 34);
      if (B.ct >= 0.8 * sp + 0.3) { B.state = 'uOpen'; B.t = 0.85; }
      break; }
    case 'uOpen':
      // spent: blade low, breathing; this is the time to hit him
      guardPose(); ang = 1.2; Tp.crouch = 1.6; Tp.lean = 0.4; faceP();
      if (B.t <= 0) { B.state = 'uIdle'; B.atk = TUNE.umbraGap * (p2 ? 0.75 : 1); U.sheathT = 0.18; }
      break;
    case 'uLeap':
      Tp.crouch = 2.2; faceP();
      if (B.t <= 0) { B.vy = -460; B.state = 'uRise'; B.t = 0.22; sfx('finLeap'); dust(bcx, floorY, 6); }
      break;
    case 'uRise':
      B.y += B.vy * dt; B.vy += 900 * dt; Tp.crouch = 0.4; U.sheathed = true;
      if (B.t <= 0) { umbraPuff(B, bcx, B.y + 6); B.hide = true; B.y = -200; B.state = 'uMark'; B.t = B.wt = 0.55 * TUNE.umbraTell * (p2 ? 0.8 : 1); B.marks.push({ x:pcx, t:0, dur:B.t }); sfx('uVanish'); sfx('uMark'); }
      break;
    case 'uMark': {
      const M = B.marks[B.marks.length - 1];
      if (B.t <= 0) { B.hide = false; B.x = M.x - B.w / 2; B.y = -20; B.vy = 520; B.state = 'uDrop'; bcx = M.x; B.face = pcx < M.x ? -1 : 1; sfx('uDrop'); }
      break; }
    case 'uDrop': {
      U.sheathed = false; ang = 2.9; snap = true; Tp.crouch = 0.4; Tp.lean = 0.5; U.smear = { a0:-0.4, a:2.9, fade:1 };
      B.vy += 1600 * dt; const y0 = B.y; B.y = Math.min(floorY - B.h, B.y + B.vy * dt);
      hurt(B.x - 6, y0, B.w + 12, B.y + B.h - y0 + 4);
      if (Math.random() < 0.9) darkFlames(bcx, B.y - 4, 1, { sc:0.8, up:-0.3, life:0.7 });
      if (B.y >= floorY - B.h) {
        B.marks.shift(); heavyShake(8); dust(bcx, floorY, 12); sfx('bslam'); sfx('uBurn');
        for (const dd of [-1, 1]) darkFlames(bcx, floorY - 8, 3, { roll:true, dir:dd }); darkFlames(bcx, floorY - 10, 4, { w:6, up:1.2 });
        for (const d of [-1, 1]) burst(bcx, floorY - 2, 8, { spd:150, life:0.4, colors:['#ff4a3c', '#7a0c14', '#2a0a0e'], size:2, g:400, ang:-Math.PI / 2 - d * 0.9, spread:0.5 });
        B.drops--; if (B.drops > 0) { B.state = 'uLeap'; B.t = 0.16; } else { B.state = 'uOpen'; B.t = 0.8; }
      }
      break; }
    case 'uWaveW': {
      const k = 1 - B.t / B.wt; U.sheathed = false; ang = 2.3; Tp.lean = -1.5; Tp.crouch = 1.4; faceP();
      B.vx = k < 0.4 ? -B.face * 70 : 0; B.charge = k;
      if (B.t <= 0) { B.state = 'uWave'; B.wi = 0; B.t = 0; B.vx = 0; B.since = 9; }
      break; }
    case 'uWave': {
      // each crescent is thrown with a swing: low ones from a blade held low, the high one from a blade raised overhead
      U.sheathed = false; snap = true; B.since += dt;
      const nextHigh = p2 && B.wi === B.nw - 1, lastHigh = B.lastHi;
      if (B.since < 0.12) ang = lastHigh ? klerp(-2.4, 0.4, keo(B.since / 0.12)) : klerp(2.3, -0.6, keo(B.since / 0.12));
      else if (B.wi < B.nw) ang = klerp(lastHigh ? 0.4 : -0.6, nextHigh ? -2.4 : 2.3, clamp((B.since - 0.12) / 0.2, 0, 1));
      else ang = -0.6;
      if (B.since < 0.25) U.smear = { a0:lastHigh ? -2.4 : 2.3, a:ang, fade:1 - B.since / 0.25 };
      Tp.lean = B.since < 0.15 ? 3 : 0.5; Tp.crouch = 1.6; Tp.stride = B.since < 0.15 ? 3 : 1;
      if (B.t <= 0) {
        if (B.wi >= B.nw) { B.state = 'uOpen'; B.t = 0.6; break; }
        B.waves.push({ x:bcx + B.face * 14, y:nextHigh ? floorY - 34 : floorY - 10, h:nextHigh ? 14 : 20, vx:B.face * 240, life:2.6, hi:nextHigh, age:0 });
        for (let i = 0; i < 10; i++) G.parts.push({ x:bcx + B.face * 14, y:(nextHigh ? floorY - 34 : floorY - 10) + rand(-8, 8), vx:B.face * rand(60, 180), vy:rand(-40, 40), life:0.3, max:0.3, c:i % 3 ? '#ff4a3c' : '#ffe6dc', s:1, g:0 });
        sfx('uWave', nextHigh); B.wi++; B.t = 0.45; B.charge = 0; B.since = 0; B.lastHi = nextHigh;
      }
      break; }
    case 'uGuard': guardPose(); ang = 0; Tp.crouch = 1.3; Tp.lean = 0.6; faceP(); if (B.t <= 0) { B.state = 'uOpen'; B.t = 0.75; } break;
    case 'uCounter':
      guardPose(); ang = 0;
      if (B.t <= 0) {
        // he is suddenly behind you
        umbraPuff(B, bcx, B.y + 6); const side = Math.sign(bcx - pcx) || 1, nx = clamp(pcx - side * 24, 2 * T, rw - 2 * T);
        B.x = nx - B.w / 2; bcx = nx; B.face = side; umbraPuff(B, nx, B.y + 6); B.state = 'uCut'; B.t = 0.24; sfx('uCounter'); sfx('uBurn'); darkFlames(nx, floorY - 10, 6, { w:6 }); darkFlames(nx + side * 20, floorY - 10, 5, { w:14, vx:side * 50 });
        B.lines.push({ x0:Math.min(nx, nx + side * 36), x1:Math.max(nx, nx + side * 36), y:floorY - 10, t:0.3, cut:0.3, done:true, flash:0.25 });
      }
      break;
    case 'uCut': {
      U.sheathed = false; snap = true; const q = clamp((0.24 - B.t) / 0.1, 0, 1); ang = klerp(2.6, -0.5, keo(q)); U.smear = { a0:2.6, a:ang, fade:q < 1 ? 1 : 0.5 };
      Tp.lean = 3.4; Tp.crouch = 2.4; Tp.stride = 3;
      if (B.t > 0.1) hurt(B.face > 0 ? bcx : bcx - 38, floorY - 30, 38, 30);
      if (B.t <= 0) { B.state = 'uOpen'; B.t = 0.55; }
      break; }
    case 'uSevW': {
      U.sheathed = false; ang = -0.45; Tp.crouch = 2; Tp.lean = 3; faceP(); const S = B.sev; S.dim = Math.min(1, S.dim + dt * 3);
      if (B.t <= 0) B.state = 'uSev';
      break; }
    case 'uSev': {
      const S = B.sev; S.p = Math.min(1, S.p + dt / S.dur); S.dim = 1; U.sheathing = S.p; Tp.crouch = klerp(2, 0.8, S.p); Tp.lean = klerp(3, -0.3, S.p);
      while (S.next < S.cuts.length && S.p >= S.cuts[S.next].at) { S.next++; if (S.next % 3 === 0) sfx('uSevTick'); }
      if (S.p >= 1) {
        U.sheathT = 0.25; sfx('uSevClick'); heavyShake(11); G.hitstop = Math.max(G.hitstop, 0.15); screenFlash(0.6, 0.2, '255,50,40');
        if (!P.dead && Math.hypot(P.x + P.w / 2 - S.x, P.y + P.h / 2 - S.y) < S.r + 4) hurtPlayer(2, S.x);
        S.flash = 0.35; B.state = 'uOpen'; B.t = 1.0; sfx('uBurn');
        for (let i = 0; i < 18; i++) { const a = rand(0, TAU), r = Math.sqrt(Math.random()) * S.r * 0.9; darkFlames(S.x + Math.cos(a) * r, S.y + Math.sin(a) * r * 0.85, 1, { w:2, sc:1.1, spread:0.15 }); }
      }
      break; }
    case 'dead': {
      Tp.crouch = 3; Tp.lean = 1.5; U.sheathed = false; ang = 1.6; U.bladeVis = Math.max(0, B.t / 2.4);
      if (Math.random() < 0.7) B.wisps.push({ x:bcx + rand(-8, 8), y:B.y + rand(-14, 14), vy:-rand(20, 50), life:rand(0.6, 1.2), max:1.2, s:2, ash:true });
      if (Math.random() < dt * 14 * Math.max(0.2, B.t / 2.4)) darkFlames(bcx, B.y + 2, 1, { w:7, sc:0.9 });
      if (B.t <= 0 && G.boss === B) {
        burst(bcx, B.y + 4, 50, { spd:180, life:1.0, colors:['#1a0a0c', '#3a1014', '#ff4a3c', '#7a0c14'], size:2, g:-30 });
        G.boss = null; G.bossDown = true; setDoor(false); toast('The Black Wick goes out.', 3000); if (G.duel || G.rush) G.winT = 3.2;
      }
      break; }
  }
  // movement on the floor
  if (!B.hide && B.state !== 'uDrop' && B.state !== 'uRise' && B.state !== 'uIai') { B.x = clamp(B.x + B.vx * dt, 2 * T, rw - 2 * T - B.w); B.y = floorY - B.h; }
  // red lines left by the draw cut split a beat later
  for (const L of B.lines) { L.t += dt; if (!L.done && L.t >= L.cut) { L.done = true; L.flash = 0.25; sfx('uLineCut'); sfx('uBurn'); G.shake = Math.max(G.shake, 4); hurt(L.x0, L.y - 6, L.x1 - L.x0, 12); for (let x = L.x0; x <= L.x1; x += 12) darkFlames(x, L.y + 2, 1, { w:5, up:0.8, spread:(x - L.x0) / (L.x1 - L.x0 + 1) * 0.12 }); } if (L.flash > 0) L.flash -= dt; }
  B.lines = B.lines.filter(L => !L.done || L.flash > 0);
  for (const w of B.waves) { w.life -= dt; w.age = (w.age || 0) + dt; w.x += w.vx * dt; if (w.x < T || w.x > rw - T) w.life = 0; else hurt(w.x - 6, w.y - w.h / 2, 12, w.h);
    if (!G.lite && Math.random() < 0.6) B.wisps.push({ x:w.x - Math.sign(w.vx) * 4, y:w.y + rand(-w.h / 2, w.h / 2), vy:-rand(5, 20), life:0.4, max:0.4, s:1 });
    if (Math.random() < dt * 6) darkFlames(w.x - Math.sign(w.vx) * 10, w.y, 1, { w:2, sc:w.hi ? 0.55 : 0.7, up:0.6, vx:-w.vx * 0.15 }); }
  B.waves = B.waves.filter(w => w.life > 0);
  for (const M of B.marks) M.t += dt;
  for (const s of B.smoke) { s.life -= dt; s.x += s.vx * dt; s.y += s.vy * dt; s.r += dt * 14; }
  B.smoke = B.smoke.filter(s => s.life > 0);
  for (const w of B.wisps) { w.life -= dt; w.y += w.vy * dt; w.x += Math.sin((w.life + w.y) * 6) * dt * 6; }
  B.wisps = B.wisps.filter(w => w.life > 0);
  if (B.sev && B.state !== 'uSev' && B.state !== 'uSevW') { B.sev.dim = Math.max(0, B.sev.dim - dt * 2.5); if (B.sev.flash > 0) B.sev.flash -= dt; if (B.sev.dim <= 0 && B.sev.flash <= 0) B.sev = null; }
  // pose
  const Q = U.pose, k = Math.min(1, dt * 22);
  for (const key of ['lean', 'crouch', 'stride']) Q[key] += (Tp[key] - Q[key]) * k;
  Q.hip = Q.stride * 0.45; Q.hop = 0;
  U.swAng = snap ? ang : wrapAng(U.swAng + wrapAng(ang - U.swAng) * Math.min(1, dt * 16));
  U.vx = B.vx; U.grounded = !(B.state === 'uRise' || B.state === 'uDrop'); U.anim += dt; U.idleT += dt; if (U.sheathT > 0) U.sheathT -= dt;
}
function umbraPuff(B, x, y) { for (let i = 0; i < 16; i++) { const a = rand(0, TAU), s = rand(10, 50); B.smoke.push({ x:x + rand(-4, 4), y:y + rand(-8, 6), vx:Math.cos(a) * s, vy:Math.sin(a) * s - 10, r:rand(2, 4), life:rand(0.35, 0.6), max:0.6, red:Math.random() < 0.25 }); } }
// draw with Wick Hero's body code, using the boss as the puppet
function umbraPuppet(B, fn) {
  const save = {}; for (const k of UMBRA_PUP_KEYS) save[k] = P[k];
  for (const k of UMBRA_PUP_KEYS) P[k] = B.pup[k];
  P.atkT = 0; P.dashT = 0; P.hurtT = 0; P._noBloom = true;
  try { fn(); } finally { for (const k of UMBRA_PUP_KEYS) P[k] = save[k]; P._noBloom = false; }
}
// recolour pass: blues become dark red fire, wax and steel go black, the brightest edges burn red; a deep red rim
// outlines the whole figure so it still reads against the dark room
const UMB = { c:null, g:null };
function umbraPass(fn, cx, by, flash, alpha) {
  const real = ctx;
  if (!real.canvas || !real.canvas.width || typeof real.getImageData !== 'function' || typeof real.getTransform !== 'function') return fn();
  const cw = real.canvas.width, ch = real.canvas.height;
  if (!UMB.c || UMB.c.width !== cw || UMB.c.height !== ch) { UMB.c = document.createElement('canvas'); UMB.c.width = cw; UMB.c.height = ch; UMB.g = UMB.c.getContext('2d', { willReadFrequently:true }); }
  const g = UMB.g, m = real.getTransform();
  const x0 = Math.max(0, Math.floor(m.a * (cx - 42) + m.e)), y0 = Math.max(0, Math.floor(m.d * (by - 54) + m.f));
  const x1 = Math.min(cw, Math.ceil(m.a * (cx + 42) + m.e)), y1 = Math.min(ch, Math.ceil(m.d * (by + 6) + m.f));
  if (x1 <= x0 || y1 <= y0) return;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(x0, y0, x1 - x0, y1 - y0); g.setTransform(m); g.globalAlpha = 1;
  ctx = g; try { fn(); } finally { ctx = real; }
  const w = x1 - x0, h = y1 - y0, im = g.getImageData(x0, y0, w, h), d = im.data, solid = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) {
    const k = p * 4, a = d[k + 3]; if (!a) continue;
    const r = d[k], gg = d[k + 1], b = d[k + 2], L = 0.3 * r + 0.59 * gg + 0.11 * b, blu = b - (r + gg) / 2;
    let nr, ng, nb;
    if (flash) { nr = 255; ng = 225; nb = 215; }
    else if (blu > 35) { const t = L / 255; nr = 40 + 215 * Math.pow(t, 0.8); ng = 8 + 70 * t * t; nb = 14 + 60 * t * t; }
    else if (L > 248) { nr = 255; ng = 72; nb = 60; }
    else if (L > 140) { const v = 18 + (L - 140) * 0.22; nr = v + 10; ng = v; nb = v + 1; }
    else { const v = L * 0.55; nr = v + 3; ng = v; nb = v + 8; }
    d[k] = nr; d[k + 1] = ng; d[k + 2] = nb;
    if (a >= 110 && blu <= 35) { d[k + 3] = 255; solid[p] = 1; } else if (a < 110) d[k + 3] = 0;   // no soft halo: it blurred him into the red room
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const p = y * w + x, k = p * 4; if (solid[p] || d[k + 3] >= 110) continue;
    if ((x > 0 && solid[p - 1]) || (x < w - 1 && solid[p + 1]) || (y > 0 && solid[p - w]) || (y < h - 1 && solid[p + w])) { d[k] = 214; d[k + 1] = 52; d[k + 2] = 58; d[k + 3] = 255; }
  }
  g.putImageData(im, x0, y0);
  real.save(); real.setTransform(1, 0, 0, 1, 0, 0); real.globalAlpha = alpha == null ? 1 : alpha; real.drawImage(UMB.c, x0, y0, w, h, x0, y0, w, h); real.restore();
}
function umbraFrame(B) {
  const Q = B.pup.pose, cx = B.x + B.w / 2, by = B.y + B.h, hipX = cx + Q.hip, hipY = by - 3 + Q.crouch * 0.6 - Q.hop, shX = hipX + Q.lean, shY = hipY - 7, f = B.face;
  const mir = x => cx + f * (x - cx);
  const a = B.pup.swAng, tipL = KARM + HBLADE;
  return { cx, by, tip:{ x:mir(shX + 2 + Math.cos(a) * tipL), y:shY + 1 + Math.sin(a) * tipL }, hand:{ x:mir(shX + 2 + Math.cos(a) * KARM), y:shY + 1 + Math.sin(a) * KARM },
    saya:{ x:mir(hipX - 2), y:hipY - 3 }, eye:{ x:mir(shX + Q.lean * 0.25), y:shY - 7 + 4 } };
}
function drawUmbra(cx0, t, B) {
  const F = umbraFrame(B), sx = Math.round(F.cx - cx0), floorY = 13 * T;
  // floor marks of the moonfall: a red column of light where he will land
  for (const M of B.marks) {
    const k = clamp(M.t / M.dur, 0, 1), x = Math.round(M.x - cx0), pulse = 0.6 + 0.4 * Math.sin(t * 30);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(0, 0, 0, floorY); g.addColorStop(0, 'rgba(255,40,30,0)'); g.addColorStop(1, `rgba(255,40,30,${0.35 * k * pulse})`);
    ctx.fillStyle = g; ctx.fillRect(x - 6 - k * 4, 0, 12 + k * 8, floorY);
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = `rgba(255,70,55,${0.5 + 0.5 * k})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(x, floorY - 1, 6 + k * 12, 2 + k * 2, 0, 0, TAU); ctx.stroke();
    ctx.fillStyle = '#ff4a3c'; ctx.fillRect(x - 1, floorY - 3, 2, 2);
  }
  for (const w of B.wisps) { ctx.globalAlpha = clamp(w.life / w.max, 0, 1); ctx.fillStyle = w.ash ? (w.life > 0.5 ? '#3a1014' : '#120608') : (w.life > 0.4 ? '#c0281e' : '#4a0c12'); ctx.fillRect(Math.round(w.x - cx0), Math.round(w.y), w.s, w.s); }
  ctx.globalAlpha = 1;
  if (!B.hide) {
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.ellipse(sx, Math.round(Math.min(B.y + B.h, floorY)) + 1, 8, 2, 0, 0, TAU); ctx.fill();
    // a low red glow under him, brighter when he is hurt
    ctx.globalCompositeOperation = 'lighter';
    let g = ctx.createRadialGradient(sx, B.y + 4, 0, sx, B.y + 4, 30); g.addColorStop(0, `rgba(200,20,30,${B.enraged ? 0.16 : 0.08})`); g.addColorStop(1, 'rgba(200,20,30,0)'); ctx.fillStyle = g; ctx.fillRect(sx - 30, B.y - 26, 60, 60);
    ctx.globalCompositeOperation = 'source-over';
    const fade = B.state === 'dead' ? clamp(B.t / 2.4, 0, 1) : 1;
    umbraPass(() => umbraPuppet(B, () => drawHeroBody(sx, Math.round(B.y + B.h), B.face, t, false)), sx, Math.round(B.y + B.h), B.flash > 0, fade);
    // eyes that burn through the black wax
    if (B.state !== 'dead' || B.t > 0.8) {
      const ex = Math.round(F.eye.x - cx0), ey = Math.round(F.eye.y), hot = B.state === 'uComboW' || B.state === 'uCounter' || B.enraged;
      ctx.globalCompositeOperation = 'lighter'; g = ctx.createRadialGradient(ex, ey, 0, ex, ey, hot ? 7 : 5); g.addColorStop(0, `rgba(255,60,40,${hot ? 0.8 : 0.5})`); g.addColorStop(1, 'rgba(255,30,20,0)'); ctx.fillStyle = g; ctx.fillRect(ex - 8, ey - 8, 16, 16); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = hot ? '#ffd0c0' : '#ff3a24'; const o = B.face > 0 ? 0 : -1; ctx.fillRect(ex - 2 + o, ey, 1, 1); ctx.fillRect(ex + 2 + o, ey, 1, 1);
    }
    // tells: scabbard glint (draw cut), burning edge (guard), glowing blade (crescents), flare (counter)
    if (B.glint > 0 || B.state === 'uIaiW') {
      const k = Math.max(B.glint, B.state === 'uIaiW' ? 0.35 + 0.35 * Math.sin(t * 24) : 0), gx = Math.round(F.saya.x - cx0), gy = Math.round(F.saya.y);
      ctx.globalCompositeOperation = 'lighter'; g = ctx.createRadialGradient(gx, gy, 0, gx, gy, 10); g.addColorStop(0, `rgba(255,90,70,${0.9 * k})`); g.addColorStop(1, 'rgba(255,40,30,0)'); ctx.fillStyle = g; ctx.fillRect(gx - 10, gy - 10, 20, 20); ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = `rgba(255,235,225,${Math.min(1, k * 1.2)})`; ctx.fillRect(gx, gy - 4, 1, 9); ctx.fillRect(gx - 4, gy, 9, 1);
    }
    if (B.state === 'uGuard' || B.state === 'uCounter' || (B.state === 'uWaveW' && B.charge > 0)) {
      const k = B.state === 'uWaveW' ? B.charge : B.state === 'uCounter' ? 1 : 0.7 + 0.3 * Math.sin(t * 6);
      const hx = F.hand.x - cx0, hy = F.hand.y, tx = F.tip.x - cx0, ty = F.tip.y;
      ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(255,50,40,${0.35 * k})`; ctx.lineWidth = 4; kline(hx, hy, tx, ty);
      ctx.strokeStyle = `rgba(255,120,100,${0.8 * k})`; ctx.lineWidth = 1; kline(hx, hy, tx, ty); ctx.globalCompositeOperation = 'source-over';
      if (B.state === 'uWaveW' && Math.random() < 0.5) B.wisps.push({ x:F.tip.x + rand(-3, 3), y:F.tip.y, vy:rand(10, 30), life:0.4, max:0.4, s:1 });
    }
  }
  for (const s of B.smoke) { ctx.globalAlpha = clamp(s.life / s.max, 0, 1) * 0.85; ctx.fillStyle = s.red ? '#5a0c12' : '#0c0608'; const r = Math.round(s.r); ctx.fillRect(Math.round(s.x - cx0 - r / 2), Math.round(s.y - r / 2), r, r); }
  ctx.globalAlpha = 1;
  // the draw cut's hanging line, then its split
  for (const L of B.lines) {
    const x0 = L.x0 - cx0, x1 = L.x1 - cx0;
    if (!L.done) { const a = 0.55 + 0.45 * Math.sin(L.t * 40); hlens(x0, L.y, x1, L.y, 1.6, `rgba(120,10,20,${0.6 * a})`); hlens(x0, L.y, x1, L.y, 0.6, `rgba(255,80,60,${a})`); }
    else if (L.flash > 0) { const k = L.flash / 0.25; hlens(x0, L.y, x1, L.y, 5 * k + 0.5, `rgba(200,20,30,${0.6 * k})`); hlens(x0, L.y, x1, L.y, 1.8 * k + 0.3, `rgba(255,220,210,${k})`); }
  }
  // blood crescents
  for (const w of B.waves) drawSlashCrescent(w.x - cx0, w.y, w.h, Math.sign(w.vx), w.age || 0, t);
}
// a blood crescent: a flying sword-slash. A moon-shaped blade of light, convex side forward, sharp tips, a white-hot
// leading edge over crimson, a black shadow along the inside curve, afterimages streaking behind it
function slashMoon(x, y, H, d, bOut, bIn, back) {
  // outer curve bulges forward by bOut, inner curve by bIn; back shifts the whole shape behind x
  const top = y - H / 2, bot = y + H / 2, x0 = x - d * back;
  ctx.beginPath(); ctx.moveTo(x0, top);
  ctx.quadraticCurveTo(x0 + d * bOut * 2, y, x0, bot);
  ctx.quadraticCurveTo(x0 + d * bIn * 2, y, x0, top);
  ctx.closePath();
}
function drawSlashCrescent(x, y, h, d, age, t) {
  const H = h * 1.5, grow = Math.min(1, 0.55 + age * 6), flick = 0.85 + 0.15 * Math.sin(t * 50 + x);
  const Hh = H * grow, b = 10 * grow;
  // afterimages: the slash smears back along its path
  for (let i = 3; i >= 1; i--) { ctx.fillStyle = `rgba(150,12,22,${0.16 * (4 - i) / 3 * flick})`; slashMoon(x - d * i * 7, y, Hh * (1 - i * 0.06), d, b * 0.9, b * 0.2, 0); ctx.fill(); }
  // speed lines streaking behind
  ctx.fillStyle = 'rgba(255,90,70,.45)';
  for (let i = 0; i < 4; i++) { const yy = Math.round(y - Hh * 0.35 + i * Hh * 0.23), len = 8 + ((i * 7 + Math.floor(t * 30)) % 9); ctx.fillRect(Math.round(x - d * (6 + len)), yy, len, 1); }
  // a soft glow around the blade
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(200,20,30,${0.28 * flick})`; slashMoon(x + d * 1, y, Hh * 1.18, d, b * 1.25, b * 0.05, 2); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // black shadow on the inner curve, then the crimson body, the hot band, the white edge
  ctx.fillStyle = 'rgba(10,2,4,.9)'; slashMoon(x - d * 1.5, y, Hh * 0.92, d, b * 0.75, b * 0.1, 0); ctx.fill();
  ctx.fillStyle = '#9e1420'; slashMoon(x, y, Hh, d, b, b * 0.38, 0); ctx.fill();
  ctx.fillStyle = '#e8302c'; slashMoon(x + d * 0.6, y, Hh * 0.96, d, b * 0.98, b * 0.6, 0); ctx.fill();
  ctx.fillStyle = `rgba(255,232,222,${0.95 * flick})`; slashMoon(x + d * 1.1, y, Hh * 0.9, d, b * 0.96, b * 0.82, 0); ctx.fill();
  // sparks shaved off the tips
  ctx.fillStyle = '#ffd0c4';
  for (const s of [-1, 1]) if ((Math.floor(t * 24) + (s > 0 ? 1 : 0)) % 2) ctx.fillRect(Math.round(x - d * 2), Math.round(y + s * Hh / 2 - (s > 0 ? 1 : 0)), 1, 1);
}
// the Severance and the arena: drawn over the room, under the HUD
function drawUmbraScreen() {
  const B = G.boss; if (!B || B.kind !== 'umbra' || !B.sev) return;
  const S = B.sev, ox = -Math.round(G.cam.x), cx = S.x + ox;
  if (S.dim > 0) { ctx.fillStyle = `rgba(10,0,3,${0.5 * S.dim})`; ctx.fillRect(0, 0, W, H); }
  if (S.flash > 0) {
    const k = S.flash / 0.35;
    for (const c of S.cuts) { const dx = Math.cos(c.a) * c.l / 2, dy = Math.sin(c.a) * c.l / 2, x = c.x + ox; hlens(x - dx, c.y - dy, x + dx, c.y + dy, 3.5 * k + 0.5, `rgba(200,20,30,${0.6 * k})`); hlens(x - dx, c.y - dy, x + dx, c.y + dy, 1.4 * k + 0.3, `rgba(255,230,220,${k})`); }
    return;
  }
  if (B.state !== 'uSev' && B.state !== 'uSevW') return;
  // the sphere: where the cuts will land
  const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 70);
  ctx.strokeStyle = `rgba(255,60,45,${(0.35 + 0.4 * S.p) * (0.6 + 0.4 * pulse)})`; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.beginPath(); ctx.ellipse(cx, S.y, S.r, S.r * 0.85, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
  for (let i = 0; i < S.next; i++) {
    const c = S.cuts[i], age = S.p - c.at, dx = Math.cos(c.a) * c.l / 2, dy = Math.sin(c.a) * c.l / 2, x = c.x + ox;
    if (age < 0.03) { hlens(x - dx, c.y - dy, x + dx, c.y + dy, 3, 'rgba(220,30,30,.75)'); hlens(x - dx, c.y - dy, x + dx, c.y + dy, 1.2, '#ffd6cc'); }
    else hlens(x - dx, c.y - dy, x + dx, c.y + dy, 0.6, `rgba(255,90,70,${Math.max(0.3, 0.75 - age * 1.2)})`);
  }
}
function drawUmbraArena(t) {
  if (!G.umbraArena) return;
  ctx.fillStyle = 'rgba(14,0,5,0.6)'; ctx.fillRect(-20, -20, W + 40, H + 40);
  const g = ctx.createLinearGradient(0, H * 0.45, 0, 13 * T + 8); g.addColorStop(0, 'rgba(120,10,20,0)'); g.addColorStop(1, 'rgba(120,10,20,0.28)'); ctx.fillStyle = g; ctx.fillRect(-20, 0, W + 40, 13 * T + 8);
  // ash drifting down through a dark red haze
  for (let i = 0, n = G.lite ? 10 : 26; i < n; i++) { const k = (t * (0.05 + (i % 5) * 0.012) + i * 0.137) % 1, x = ((i * 97.3 + Math.sin(t * 0.6 + i) * 14) % (W + 20)) - 10;
    ctx.fillStyle = i % 4 ? 'rgba(40,12,16,.8)' : 'rgba(200,40,40,.55)'; ctx.fillRect(Math.round(x), Math.round(k * H), i % 3 ? 1 : 2, 1); }
}
// ---------- his entrance (the first time each duel): the kiln falls black, pillars of black fire climb from the floor one by one,
// two eyes open in the dark, red flashes show him for a breath at a time while a heart races; then the fire roars up around him,
// his hand finds the hilt with his signature slash, the name lands, and the light comes back for the fight. About seven seconds,
// no music, no input. A retry skips it.
const UENT_T = 7.2;
const UENT_BEATS = [0.27, 1.43, 2.43, 3.27, 3.93, 4.43, 4.8, 5.07, 5.27, 5.43];
const UENT_FLASH = [1.97, 3.13, 3.97, 4.5, 4.87];
const UENT_COLS = [[-118, 0.67], [104, 1.17], [-78, 1.83], [70, 2.5], [-44, 3.17], [40, 3.83], [-26, 5], [24, 5]];   // [offset from him, start (s)]
const uease = x => x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x);
// black fire: the same pixel flames, remapped so the heart is black and only the rim burns crimson
const BLACK_FIRE = { frames:null };
function blackFireFrames() {
  if (BLACK_FIRE.frames) return BLACK_FIRE.frames;
  const src = fireFrames(); BLACK_FIRE.frames = [];
  try {
    const from = [[154, 30, 12], [232, 80, 26], [255, 154, 34], [255, 216, 74], [255, 248, 208]], to = [[170, 16, 24], [96, 8, 14], [34, 3, 7], [10, 1, 3], [0, 0, 0]];
    for (const im of src) {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let k = 0; k < d.length; k += 4) { if (!d[k + 3]) continue; let bi = 0, bd = 1e9;
        for (let i = 0; i < 5; i++) { const q = (d[k] - from[i][0]) ** 2 + (d[k + 1] - from[i][1]) ** 2 + (d[k + 2] - from[i][2]) ** 2; if (q < bd) { bd = q; bi = i; } }
        d[k] = to[bi][0]; d[k + 1] = to[bi][1]; d[k + 2] = to[bi][2]; }
      g.putImageData(id, 0, 0); BLACK_FIRE.frames.push(c);
    }
  } catch (_) { BLACK_FIRE.frames = darkFireFrames(); }
  return BLACK_FIRE.frames;
}
function startUmbraEntrance(B) {
  setDoor(true); G.bossHits0 = G.hits || 0; G.cine = null;
  B.state = 'intro'; B.t = 99; G.uent = { t:0, B, flashAt:-9 };
  try { const hl = $('hudLayer'); if (hl) hl.style.opacity = '0'; } catch (_) {}
  sfx('drone');
}
function endUmbraEntrance() {
  const E = G.uent; G.uent = null;
  try { const hl = $('hudLayer'); if (hl) hl.style.opacity = ''; } catch (_) {}
  if (E && E.B && G.boss === E.B && (E.B.state === 'intro' || E.B.state === 'uIaiW')) { E.B.state = 'uIdle'; E.B.atk = 0.9; E.B.glint = 0; }
}
// the push-in: slow, then hard at the flare, then back out as the light returns
function uentZoom(t) { const back = uease((t - 6.2) / 0.8); return (1.25 + 0.9 * uease(t / 5) + 1.1 * uease((t - 5) / 0.83)) * (1 - back) + back; }
function updateUmbraEntrance(dt) {
  const E = G.uent; if (!E) return;
  const B = E.B; if (!B || G.boss !== B || P.dead) { endUmbraEntrance(); return; }
  const t0 = E.t; E.t += dt; const t = E.t, ux = B.x + B.w / 2, floor = 13 * T, cross = s => t0 < s && t >= s;
  for (const s of UENT_BEATS) if (cross(s)) sfx('heart');
  if (cross(2.5)) sfx('uSevDrone');
  if (t > 0.3 && t < 5 && Math.floor(t0 / 0.67) !== Math.floor(t / 0.67)) sfx('uBurn');
  if (t > 2 && t < 5) G.shake = Math.max(G.shake, 0.6 + t * 0.3);
  for (const [dx, from] of UENT_COLS) if (t >= from && t < 6.6 && Math.random() < dt * 60 * (0.18 + 0.5 * uease((t - from) / 2)))
    darkFlames(ux + dx, floor - 2, 1, { w:3, sc:0.55 + 0.25 * uease((t - from) / 2.3), up:1.25, black:true });
  for (const s of UENT_FLASH) if (cross(s)) { E.flashAt = t; screenFlash(0.28, 0.12, '200,20,30'); G.shake = Math.max(G.shake, 3); sfx('uLineCut'); }
  if (cross(5)) { sfx('uIntro'); sfx('uBurn'); for (const sd of [-1, 1]) darkFlames(ux + sd * 20, floor - 2, 6, { w:6, sc:0.8, spread:0.3, black:true }); heavyShake(7); screenFlash(0.5, 0.25, '200,20,30'); G.vig = 1; buzz([60, 30, 120]); }
  if (cross(5.6)) { B.state = 'uIaiW'; B.wt = 0.6; B.glint = 1; sfx('uGlint'); }
  if (B.state === 'uIaiW') B.t = B.wt * 0.15;   // hand on the hilt, held
  if (cross(6.3)) showBanner('The Black Wick', 'What the cold flame left behind', true);
  if (t >= UENT_T) endUmbraEntrance();
}
// where the zoom is anchored so he drifts to the middle of the screen as the camera pushes in
function uentFocus(B, zm) {
  const sx = B.x + B.w / 2 - G.cam.x, want = sx + (W / 2 - sx) * uease((zm - 1) / 0.5);
  return { x:G.cam.x + (zm > 1.001 ? (want - sx * zm) / (1 - zm) : sx), y:B.y + 6 };
}
// the dark, the eyes and the bars, over the zoomed room
function drawUmbraEntrance() {
  const E = G.uent; if (!E) return;
  const B = E.B, t = E.t, F = umbraFrame(B), zm = G.zm || 1, fx = G.zf ? G.zf.x - G.cam.x : W / 2, fy = G.zf ? G.zf.y : H / 2;
  const scr = (x, y) => [(x - G.cam.x - fx) * zm + fx, (y - fy) * zm + fy];
  const fl = Math.floor((t - E.flashAt) * 60), out = uease((t - 6.2) / 0.8);
  const flashA = fl >= 0 && fl < 6 ? [0.12, 0.2, 0.3, 0.5, 0.7, 0.85][fl] * (COMF.flash ? 0 : 1) + (COMF.flash ? 0.6 : 0) : 1;
  const a = t < 5 ? Math.min(flashA, 0.93 - 0.15 * uease(t / 4.67)) * Math.min(1, t / 0.25 + 0.6) : t < 6.2 ? 0.3 + 0.25 * uease((t - 5) / 1.17) : 0.55 * (1 - out);
  if (t >= 5 && t < 6.33) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(150,8,18,.06)'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  { const [hx, hy] = scr(B.x + B.w / 2, B.y + 2), r = (t < 5 ? 70 : 120) * zm, g = ctx.createRadialGradient(hx, hy, r * 0.15, hx, hy, r);
    g.addColorStop(0, `rgba(3,0,2,${a * (t < 5 ? 0.82 : 0.25)})`); g.addColorStop(1, `rgba(3,0,2,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  const ek = t < 1 ? 0 : t < 1.67 ? uease((t - 1) / 0.67) * 0.6 : t < 5 ? 0.6 + 0.15 * Math.sin(t * 12) : 1 - out;
  if (ek > 0) {   // the eyes burn through the dark
    const [ex, ey] = scr(F.eye.x - (B.face > 0 ? 0 : 0.5), F.eye.y), s = Math.max(1, Math.round(zm * (t >= 5 ? 1.4 : 1))), gap = 4 * zm;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5 * zm * (0.6 + ek * 0.5)); g.addColorStop(0, `rgba(255,50,30,${0.4 * ek})`); g.addColorStop(1, 'rgba(255,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(ex - 30 * zm, ey - 30 * zm, 60 * zm, 60 * zm);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = ek > 0.85 ? '#ffd0c0' : `rgba(255,58,36,${Math.min(1, ek * 1.4)})`;
    for (const o of [-1, 1]) ctx.fillRect(Math.round(ex + o * gap / 2 - s / 2), Math.round(ey - s / 2), s, Math.max(1, Math.round(s * 0.7)));
  }
  const bars = Math.round(30 * Math.min(1, t / 0.4) * (1 - out)); if (bars > 0) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bars); ctx.fillRect(0, H - bars, W, bars); }
}
