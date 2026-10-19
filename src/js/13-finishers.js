// ---------- finishing moves: when a boss falls, the hero ends it with a move of their own (one per hero, per boss)
const FIN = {
  warden:{
    wick:{ name:'Last Light', dur:2.4, desc:'Three crossing dash-cuts through the Warden, then a leap and a downward plunge into its crown that snuffs all three of its flames.' },
    knight:{ name:'Pyre Cleave', dur:2.3, desc:'He hauls the burning claymore overhead and splits the Warden down the middle; a column of fire roars up through the seam.' },
    hero:{ name:'Frozen Severance', dur:2.5, desc:'He sheathes, the world goes dark, and he is suddenly past it. A single white line hangs in the air; at the click of the blade the Warden slides apart, frozen.' } },
  chandler:{
    wick:{ name:'Cut the Chain', dur:2.5, desc:'He springs up to the chain that holds it, cuts it with an up-sweep, and the Chandler crashes to the floor in a spray of candles.' },
    knight:{ name:'Rising Pyre', dur:2.5, desc:'He drives the claymore into the stone beneath it; a geyser of fire erupts upward, engulfs the Chandler and brings it down.' },
    hero:{ name:'Moonfall', dur:2.7, desc:'He vanishes into the air. Eight blue cuts appear around the Chandler one by one; he lands behind it, sheathes, and it shatters like ice.' } },
  moth:{
    wick:{ name:'Wingclip', dur:2.4, desc:'He vaults over the fallen moth and clips both burning wings in one crossing cut; they drift down as ash and the last of its fire gutters out.' },
    knight:{ name:'Kiln Breaker', dur:2.4, desc:'He leaps, brings the claymore down across its back, and the kiln fire it stole roars up out of it in a pillar.' },
    hero:{ name:'Severed Wings', dur:2.6, desc:'Two strokes, left and right, too fast to see. Two white lines cross over the moth; at the click of the blade its wings fall away like frost.' } }
};
// a downed boss slumps to the floor, trembling and smoking, and waits for the finisher
const FIN_REACH = 30, FIN_HOLD = 0.35;
function updateDowned(dt, B) {
  B.flash -= dt; B.anim += dt; B.downT = (B.downT || 0) + dt;
  if (B.kind === 'chandler' || B.kind === 'moth') { const fy = 13 * T - B.h; B.y += (fy - B.y) * Math.min(1, dt * 4); }
  else { const pb = B.y + B.h; B.vy = Math.min((B.vy || 0) + 1050 * dt, 420); B.y += B.vy * dt; if (collideY(B, pb, true) === 'floor') B.vy = 0; }
  if (Math.random() < 0.25) G.parts.push({ x:B.x + B.w / 2 + rand(-10, 10), y:B.y + rand(0, 8), vx:rand(-6, 6), vy:rand(-30, -12), life:1.2, max:1.2, c:Math.random() < 0.5 ? '#6b6f7a' : '#8c8f99', s:Math.random() < 0.3 ? 2 : 1, g:-10 });
  // stand close and hold up to finish it
  const near = finNear(B);
  if (near && I.down.up && !P.dead && P.healT <= 0) { G.finHold = (G.finHold || 0) + dt; if (G.finHold >= FIN_HOLD) { G.finHold = 0; startFinish(B); } }
  else G.finHold = Math.max(0, (G.finHold || 0) - dt * 2);
}
function finNear(B) { return P.grounded && Math.abs(P.x + P.w / 2 - (B.x + B.w / 2)) < B.w / 2 + FIN_REACH; }
// the prompt over a downed boss: a soft pulse when far, "Hold ↑" with a filling ring when close
function drawDowned(cx0, t) {
  const B = G.boss; if (!B || B.state !== 'downed' || G.finish) return;
  const x = B.x + B.w / 2 - cx0, y = B.y - 14, near = finNear(B), k = (G.finHold || 0) / FIN_HOLD, pulse = 0.5 + 0.5 * Math.sin(t * 5);
  const g = ctx.createRadialGradient(x, B.y + B.h, 2, x, B.y + B.h, B.w); g.addColorStop(0, `rgba(242,165,65,${0.18 + 0.12 * pulse})`); g.addColorStop(1, 'rgba(242,165,65,0)');
  ctx.fillStyle = g; ctx.fillRect(x - B.w, B.y + B.h - 10, B.w * 2, 14);
  ctx.save(); ctx.globalAlpha = near ? 1 : 0.35 + 0.25 * pulse;
  ctx.fillStyle = 'rgba(8,10,16,.8)'; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#3a2a12'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.stroke();
  if (k > 0) { ctx.strokeStyle = '#f2a541'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(x, y, 7, -Math.PI / 2, -Math.PI / 2 + k * TAU); ctx.stroke(); }
  ctx.fillStyle = '#f6e7bf'; ctx.beginPath(); ctx.moveTo(x, y - 4 - (near ? pulse : 0)); ctx.lineTo(x + 3.5, y + 1 - (near ? pulse : 0)); ctx.lineTo(x - 3.5, y + 1 - (near ? pulse : 0)); ctx.fill(); ctx.fillRect(x - 1, y, 2, 3);
  if (near) { ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '9px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = '#f2c46a'; gtext(TOUCH ? 'PUSH UP · FINISH' : 'HOLD ↑ · FINISH', x, y - 15); }
  ctx.restore();
}
// when each finisher's killing blow lands (seconds into the move): the riser peaks and the big hit plays there
const FIN_KILL = { 'warden:wick':1.5, 'chandler:wick':0.82, 'moth:wick':0.62, 'warden:knight':0.5, 'chandler:knight':0.5, 'moth:knight':0.52, 'warden:hero':1.3, 'chandler:hero':1.4, 'moth:hero':1.45 };
function startFinish(B) {
  if (!B) return;
  const kind = B.kind === 'chandler' ? 'chandler' : B.kind === 'moth' ? 'moth' : 'warden', hero = ROSTER.includes(G.char) ? G.char : 'wick', def = FIN[kind][hero];
  const gy = kind === 'chandler' || kind === 'moth' ? 13 * T : B.y + B.h, bcx = B.x + B.w / 2, side = (P.x + P.w / 2) < bcx ? -1 : 1;
  G.finish = { t:0, kind, hero, B, def, gy, side, bcx, once:{}, hideP:false, hideB:false, split:0, cut:false, vy:0, lines:[], dim:0, fire:-1, geyser:-1, jump:null, killT:FIN_KILL[kind + ':' + hero] || 1, punch:0 };
  B.finished = true; sfx('finStart', hero);
  B.state = kind === 'chandler' ? 'hover' : 'stun'; B.vx = 0; B.flash = 0; if (kind === 'moth') B.y = 13 * T - B.h;
  P.vx = 0; P.vy = 0; P.atkT = 0; P.healT = 0; P.dashT = 0; P.dive = false; P.inv = 99; P.comboT = 0; P.fin = false; P.swing = null;
  G.drops = []; G.waves = []; G.shots = []; G.puddles = []; releaseAll();
}
function finPlace(x, y) { const F = G.finish; P.x = x - P.w / 2; P.y = (y == null ? F.gy : y) - P.h; P.grounded = y == null; P.vx = 0; P.vy = 0; }
function finArc(F, x0, y0, x1, y1, t0, t1, h) { const k = clamp((F.t - t0) / (t1 - t0), 0, 1); finPlace(x0 + (x1 - x0) * k, y0 + (y1 - y0) * k - Math.sin(k * Math.PI) * h); P.grounded = false; return k; }
function finWickSwing(dir, alt) { P.atkDir = dir; P.atkT = SN.dur; P.alt = !!alt; P.atkHit = new Set(); }
function finKnightSlam() { const sw = knightSwing('side', 4, true); Object.assign(P, { atkDir:'side', combo:4, fin:false, swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:false, landed:false }); }
function finHeroCut() { const sw = heroSwing('side', 1, false); Object.assign(P, { atkDir:'side', combo:1, fin:false, swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:0, hWin:-1, comboT:0 }); }
function finCrash(F) {
  const B = F.B; B.y = F.gy - B.h; F.vy = 0; F.landed = true;
  G.shake = Math.max(G.shake, 15); G.hitstop = Math.max(G.hitstop, 0.1); sfx('bslam'); sfx('wallhit'); screenFlash(0.3, 0.12, '255,214,170');
  dust(B.x + B.w / 2, F.gy, 24); rubble(B.x + B.w / 2, 12);
  for (const d of [-1, 1]) burst(B.x + B.w / 2, F.gy - 6, 14, { spd:200, life:0.6, colors:[C.wax, C.flame, C.core, '#e8c25a'], size:2, g:420, ang:-Math.PI / 2 - d * 0.9, spread:0.6 });
  G.fx.push({ k:'ring', x:B.x + B.w / 2, y:F.gy - 4, t:0.4, max:0.4, r:64, c:'242,165,65' });
}
function updateFinish(dt) {
  const F = G.finish; if (!F) return;
  const B = F.B, t = (F.t += dt), once = (k, at, fn) => { if (t >= at && !F.once[k]) { F.once[k] = 1; fn(); } };
  const bcx = B.x + B.w / 2, sd = F.side, top = B.y;
  P.atkT -= dt; P.anim += dt; if (B.flash > 0) B.flash -= dt; B.anim += dt; P.inv = 99;
  // the Chandler is pulled back up to hanging height before its finisher
  if (F.kind === 'chandler' && !F.cut) B.y += (T * 3 - B.y) * Math.min(1, dt * 6);
  if (F.cut && !F.landed) { F.vy += 950 * dt; B.y += F.vy * dt; if (B.y + B.h >= F.gy) finCrash(F); }
  const k = F.kind + ':' + F.hero;
  // the sound of the move: a riser that sucks the air out just before the kill, then one huge blow and its long ring
  const swl = Math.min(0.55, F.killT);
  if (!F.swelled && t >= F.killT - swl) { F.swelled = true; sfx('finSwell', F.killT - t); }
  if (!F.blown && t >= F.killT) { F.blown = true; F.punch = 1; sfx('finBlow', F.hero); }
  F.punch = Math.max(0, F.punch - dt * 2.5);
  if (k === 'warden:wick') {
    once('a', 0, () => { finPlace(bcx + sd * 40); P.face = -sd; });
    [0.35, 0.6, 0.85].forEach((at, i) => once('d' + i, at, () => {
      const d = i % 2 ? sd : -sd, y = top + B.h * (0.3 + 0.18 * i), ang = (i % 2 ? 0.22 : -0.22);
      finPlace(bcx + d * 36); P.face = -d; finWickSwing('side', i % 2);
      G.fx.push({ k:'slash', x:bcx, y, ang, t:0.25, max:0.25, len:80 }); impact(bcx, y, ang, true);
      sfx('nSlash', i % 2 === 1); sfx('finCut', i); G.shake = Math.max(G.shake, 6); B.flash = 0.08; G.hitstop = Math.max(G.hitstop, 0.04);
    }));
    once('leap', 1.05, () => sfx('finLeap'));
    if (t >= 1.05 && t < 1.38) { if (!F.jump) F.jump = { x:P.x + P.w / 2 }; finArc(F, F.jump.x, F.gy, bcx, top - 30, 1.05, 1.38, 10); P.face = sd; }
    once('p', 1.38, () => finWickSwing('down'));
    if (t >= 1.38 && t < 1.5) finPlace(bcx, top - 30 + (t - 1.38) / 0.12 * 30);
    once('hit', 1.5, () => {
      G.shake = Math.max(G.shake, 14); G.hitstop = Math.max(G.hitstop, 0.12); screenFlash(0.5, 0.15, '255,230,180'); sfx('bslam'); sfx('hit'); B.state = 'dead'; B.flash = 0.1;
      impact(bcx, top + 2, Math.PI / 2, true);
      for (const wx of [-9, 0, 9]) for (let i = 0; i < 6; i++) G.parts.push({ x:bcx + wx + rand(-1, 1), y:top - 4, vx:rand(-8, 8), vy:rand(-40, -15), life:rand(0.9, 1.5), max:1.5, c:i % 2 ? '#8c8f99' : '#5f626b', s:2, g:-30 });
      burst(bcx, top + 4, 26, { spd:180, life:0.6, colors:[C.wax, C.waxSh, C.flame], size:2, g:300 });
    });
    if (t >= 1.5 && t < 1.9) { finArc(F, bcx, top, bcx + sd * 36, F.gy, 1.5, 1.9, 12); P.face = -sd; }
    once('land', 1.9, () => { finPlace(bcx + sd * 36); P.face = -sd; P.landT = 0.14; dust(P.x + P.w / 2, F.gy, 6); });
  } else if (k === 'chandler:wick') {
    once('a', 0, () => { finPlace(bcx + sd * 26); P.face = -sd; });
    once('leap', 0.4, () => sfx('finLeap'));
    if (t >= 0.4 && t < 0.78) { if (!F.jump) F.jump = { x:P.x + P.w / 2 }; finArc(F, F.jump.x, F.gy, bcx + sd * 6, top - 6 + P.h, 0.4, 0.78, 6); P.face = -sd; }
    once('up', 0.74, () => finWickSwing('up'));
    once('cut', 0.82, () => {
      F.cut = true; F.vy = -40; B.state = 'dead';
      impact(bcx, top - 10, -Math.PI / 2, true); sfx('nSlash'); sfx('hit'); tone2(1400, 0.4, 'triangle', 0.06, 0.6); G.shake = Math.max(G.shake, 6); G.hitstop = Math.max(G.hitstop, 0.08);
      for (let i = 0; i < 8; i++) G.parts.push({ x:bcx, y:top - 10 - i * 3, vx:rand(-30, 30), vy:rand(-20, 40), life:1, max:1, c:'#6b6f7a', s:1, g:400 });
    });
    if (t >= 0.82 && !F.once.land) { F.pvy = (F.pvy == null ? -120 : F.pvy) + 900 * dt; P.y = Math.min(F.gy - P.h, P.y + F.pvy * dt); P.x += (bcx + sd * 40 - P.w / 2 - P.x) * Math.min(1, dt * 5); P.face = -sd; P.grounded = false;
      if (P.y >= F.gy - P.h) { F.once.land = 1; finPlace(P.x + P.w / 2); P.face = -sd; P.landT = 0.14; dust(P.x + P.w / 2, F.gy, 6); } }
  } else if (k === 'moth:wick') {
    once('a', 0, () => { finPlace(bcx + sd * 40); P.face = -sd; });
    once('leap', 0.3, () => sfx('finLeap'));
    if (t >= 0.3 && t < 0.62) { if (!F.jump) F.jump = { x:P.x + P.w / 2 }; finArc(F, F.jump.x, F.gy, bcx, top - 18, 0.3, 0.62, 14); P.face = -sd; }
    once('clip', 0.62, () => {
      finWickSwing('side', true); B.noWings = true; B.flash = 0.1;
      for (const a of [-0.5, 0.5]) G.fx.push({ k:'slash', x:bcx, y:top + 4, ang:a, t:0.3, max:0.3, len:96 });
      impact(bcx, top + 4, 0.4, true); sfx('nSlash', true); sfx('hit'); sfx('mScreech'); G.shake = Math.max(G.shake, 9); G.hitstop = Math.max(G.hitstop, 0.12); screenFlash(0.45, 0.12, '255,220,170');
      for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1; G.parts.push({ x:bcx + s * rand(6, 34), y:top + rand(-8, 8), vx:s * rand(10, 60), vy:rand(-60, -10), life:rand(1.2, 2), max:2, c:['#8a3218', '#d4632a', '#ffe08a', '#2a120c'][i % 4], s:Math.random() < 0.5 ? 3 : 2, g:40 }); }
    });
    if (t >= 0.62 && t < 1.0) { finArc(F, bcx, top - 18, bcx - sd * 38, F.gy, 0.62, 1.0, 6); P.face = sd; }
    once('land', 1.0, () => { finPlace(bcx - sd * 38); P.face = sd; P.landT = 0.14; dust(P.x + P.w / 2, F.gy, 6); });
    once('out', 1.5, () => { B.state = 'dead'; sfx('snuff'); burst(bcx, top + 6, 24, { spd:120, life:0.8, colors:['#6b6f7a', '#8c8f99', C.ember], size:2, g:-30 }); });
  } else if (k === 'moth:knight') {
    once('a', 0, () => { finPlace(bcx + sd * 46); P.face = -sd; });
    if (t >= 0.15 && t < 0.5) { if (!F.jump) F.jump = { x:P.x + P.w / 2 }; finArc(F, F.jump.x, F.gy, bcx + sd * 16, F.gy, 0.15, 0.5, 34); P.face = -sd; }
    once('swing', 0.32, () => { finKnightSlam(); sfx('finHeave'); });
    once('strike', 0.52, () => {
      finPlace(bcx + sd * 16); P.face = -sd; F.fire = t; P.landT = 0.18;
      G.shake = Math.max(G.shake, 15); G.hitstop = Math.max(G.hitstop, 0.12); screenFlash(0.5, 0.15, '255,190,120'); sfx('kFireBoom'); sfx('bslam'); B.flash = 0.12;
      for (const r of [50, 80]) G.fx.push({ k:'ring', x:bcx, y:F.gy - 4, t:0.45, max:0.45, r, c:'255,150,70' });
      burst(bcx, F.gy - 4, 30, { spd:220, life:0.6, colors:[C.ember, C.flame, C.core], size:2, g:-40, ang:-Math.PI / 2, spread:1.4 });
    });
    if (F.fire >= 0 && t - F.fire < 1.1 && Math.random() < 0.6) firePuff({ free:true, x:bcx + rand(-10, 10), y:F.gy - 8, vx:rand(-15, 15), vy:rand(-220, -130), g:-30, drag:0.5, life:rand(0.5, 0.75), dir:Math.random() < 0.5 ? -1 : 1, sc:rand(0.8, 1.25) });
    if (F.fire >= 0 && t - F.fire < 1.1) { for (let i = 0; i < 3; i++) G.parts.push({ x:bcx + rand(-10, 10), y:rand(top - 40, F.gy), vx:rand(-20, 20), vy:rand(-160, -60), life:0.6, max:0.6, c:[C.ember, C.flame, C.core][i], s:2, g:-60 }); if (Math.random() < 0.3) B.flash = 0.05; }
    once('out', 1.35, () => { B.state = 'dead'; });
  } else if (k === 'moth:hero') {
    once('a', 0, () => { finPlace(bcx + sd * 48); P.face = -sd; });
    F.dim = t < 0.4 ? t / 0.4 * 0.6 : t < 1.3 ? 0.6 : Math.max(0, 0.6 - (t - 1.3) * 1.2);
    once('c1', 0.45, () => { finPlace(bcx - sd * 48); P.face = sd; finHeroCut(); F.lines.push({ x:bcx, y:top + B.h / 2, a:-0.55, l:110, t }); sfx('hSwing'); sfx('finIce', 0); screenFlash(0.3, 0.06, '220,240,255'); G.shake = Math.max(G.shake, 4); B.flash = 0.05; });
    once('c2', 0.8, () => { finPlace(bcx + sd * 48); P.face = -sd; finHeroCut(); F.lines.push({ x:bcx, y:top + B.h / 2, a:0.55, l:110, t }); sfx('hSwing'); sfx('finIce', 1); screenFlash(0.3, 0.06, '220,240,255'); G.shake = Math.max(G.shake, 4); B.flash = 0.05; });
    once('click', 1.45, () => {
      P.sheathT = 0.25; B.noWings = true; F.lines = []; B.state = 'dead'; sfx('hClick'); sfx('hShatter'); G.shake = Math.max(G.shake, 12); G.hitstop = Math.max(G.hitstop, 0.15); screenFlash(0.6, 0.2, '220,240,255');
      for (let i = 0; i < 34; i++) { const a = rand(0, TAU), sp = rand(60, 180); G.fx.push({ k:'shard', x:bcx + rand(-30, 30), y:top + B.h / 2 + rand(-10, 6), vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 30, rot:rand(0, TAU), vr:rand(-20, 20), s:rand(1.5, 3.5), t:0.9, max:0.9 }); }
    });
  } else if (k === 'warden:knight' || k === 'chandler:knight') {
    const war = F.kind === 'warden';
    once('a', 0, () => { finPlace(bcx + sd * (war ? 34 : 18)); P.face = -sd; });
    once('swing', 0.22, () => { finKnightSlam(); sfx('finHeave'); });
    once('strike', 0.5, () => {
      if (war) F.fire = t; else F.geyser = t;
      G.shake = Math.max(G.shake, 14); G.hitstop = Math.max(G.hitstop, 0.1); screenFlash(0.45, 0.15, '255,190,120'); sfx('kFireBoom'); sfx('bslam'); B.flash = 0.12;
    });
    if ((F.fire >= 0 && t - F.fire < 1.1) || (F.geyser >= 0 && t - F.geyser < 1.0)) {
      const x0 = war ? bcx : bcx, yTop = war ? top - 40 : top;
      if (Math.random() < 0.6) firePuff({ free:true, x:bcx + rand(-10, 10), y:F.gy - 8 - rand(0, 10), vx:rand(-15, 15), vy:rand(-220, -130), g:-30, drag:0.5, life:rand(0.5, 0.75), dir:Math.random() < 0.5 ? -1 : 1, sc:rand(0.8, 1.25) });
      for (let i = 0; i < 3; i++) G.parts.push({ x:x0 + rand(-10, 10), y:rand(yTop, F.gy), vx:rand(-20, 20), vy:rand(-160, -60), life:0.6, max:0.6, c:[C.ember, C.flame, C.core][i], s:2, g:-60 });
      if (Math.random() < 0.3) B.flash = 0.05;
    }
    once('out', war ? 1.3 : 1.0, () => { B.state = 'dead'; if (!war) { F.cut = true; F.vy = 0; } });
  } else if (k === 'warden:hero') {
    once('a', 0, () => { finPlace(bcx + sd * 46); P.face = -sd; });
    F.dim = t < 0.55 ? Math.min(0.75, t / 0.5 * 0.75) : t < 1.25 ? 0.75 : Math.max(0, 0.75 - (t - 1.25) * 1.2);
    once('step', 0.55, () => {
      F.lineY = top + B.h * 0.45; F.lineT = t; finPlace(bcx - sd * 46); P.face = -sd; finHeroCut();
      sfx('hSwing'); sfx('finIce', 0); screenFlash(0.35, 0.08, '220,240,255'); G.shake = Math.max(G.shake, 4);
    });
    once('click', 1.3, () => {
      P.sheathT = 0.25; sfx('hClick'); sfx('hShatter'); G.shake = Math.max(G.shake, 11); G.hitstop = Math.max(G.hitstop, 0.15); screenFlash(0.6, 0.2, '220,240,255'); B.state = 'dead';
      for (let i = 0; i < 26; i++) { const a = rand(0, TAU), sp = rand(50, 160); G.fx.push({ k:'shard', x:bcx + rand(-B.w / 2, B.w / 2), y:F.lineY, vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 40, rot:rand(0, TAU), vr:rand(-20, 20), s:rand(1.5, 3.5), t:0.8, max:0.8 }); }
    });
    if (t > 1.3) F.split = Math.min(1, (t - 1.3) / 0.45);
  } else if (k === 'chandler:hero') {
    once('a', 0, () => { finPlace(bcx + sd * 50); P.face = -sd; });
    once('vanish', 0.25, () => { F.hideP = true; sfx('hDraw'); sfx('finVanish'); G.fx.push({ k:'slash', x:P.x + P.w / 2, y:F.gy - 40, ang:-Math.PI / 2, t:0.2, max:0.2, len:90 }); });
    for (let i = 0; i < 8; i++) once('c' + i, 0.4 + i * 0.08, () => {
      const a = rand(0, Math.PI); F.lines.push({ x:bcx + rand(-6, 6), y:top + B.h / 2 + rand(-6, 6), a, l:rand(46, 64), t }); sfx('hTick'); B.flash = 0.05;
    });
    once('land', 1.15, () => { F.hideP = false; finPlace(bcx - sd * 42); P.face = -sd; P.landT = 0.14; dust(P.x + P.w / 2, F.gy, 6); });
    once('click', 1.4, () => {
      P.sheathT = 0.25; F.hideB = true; F.lines = []; B.state = 'dead'; sfx('hClick'); sfx('hShatter'); G.shake = Math.max(G.shake, 12); G.hitstop = Math.max(G.hitstop, 0.15); screenFlash(0.6, 0.2, '220,240,255');
      for (let i = 0; i < 34; i++) { const a = rand(0, TAU), sp = rand(60, 180); G.fx.push({ k:'shard', x:bcx + rand(-10, 10), y:top + B.h / 2 + rand(-8, 8), vx:Math.cos(a) * sp, vy:Math.sin(a) * sp - 30, rot:rand(0, TAU), vr:rand(-20, 20), s:rand(1.5, 3.5), t:0.9, max:0.9 }); }
      burst(bcx, top + B.h / 2, 20, { spd:160, life:0.6, colors:[C.wax, '#e8c25a', C.core], size:2, g:300 });
    });
  }
  if (t >= F.def.dur) { if (STORY_LAST[F.kind]) { G.lastWords = { text:STORY_LAST[F.kind], x:bcx, y:Math.max(30, B.y - 12), t:0 }; sfx('lastWords'); }
    B.state = 'dead'; B.t = 0.7; P.inv = 1; P.atkT = 0; P.swing = null; P.grounded = true; G.finish = null; }
}
// boss drawing during a finisher: hidden, split in two, or as usual
function drawBossF(cx0, t) {
  const F = G.finish; if (!F) return drawBoss(cx0, t);
  if (F.hideB) return;
  const B = F.B;
  if (F.split > 0) {
    const cy = Math.round(F.lineY), k = F.split, bx = B.x - cx0;
    ctx.save(); ctx.beginPath(); ctx.rect(bx - 60, 0, B.w + 120, cy); ctx.clip(); ctx.translate(-F.side * k * 8, -k * 3); drawBoss(cx0, t); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.rect(bx - 60, cy, B.w + 120, H); ctx.clip(); drawBoss(cx0, t); ctx.restore();
    ctx.fillStyle = `rgba(190,235,255,${0.9 * k})`; ctx.fillRect(bx - 2, cy - 1, B.w + 4, 1);
  } else drawBoss(cx0, t);
}
// world-space effects of the finishers (fire, cut lines, the chain)
function drawFinish(cx0, t) {
  const F = G.finish; if (!F) return;
  const B = F.B, bcx = B.x + B.w / 2 - cx0;
  if (F.lineY != null && F.lineT != null) {
    const k = F.t - F.lineT, a = F.split > 0 ? Math.max(0, 1 - F.split * 1.5) : Math.min(1, k * 8);
    if (a > 0) { hlens(bcx - 70, F.lineY, bcx + 70, F.lineY, 2.2 * a + 0.3, `rgba(140,210,255,${0.5 * a})`); hlens(bcx - 66, F.lineY, bcx + 66, F.lineY, 0.8, `rgba(255,255,255,${a})`); }
  }
  for (const L of F.lines) { const dx = Math.cos(L.a) * L.l / 2, dy = Math.sin(L.a) * L.l / 2, a = Math.min(1, (F.t - L.t) * 10);
    hlens(L.x - cx0 - dx, L.y - dy, L.x - cx0 + dx, L.y + dy, 2.4 * a, 'rgba(120,200,255,.5)'); hlens(L.x - cx0 - dx, L.y - dy, L.x - cx0 + dx, L.y + dy, 0.8, `rgba(255,255,255,${a})`); }
}
// screen-space framing: letterbox, the darkening for Frozen Severance, and the move's name
function drawFinishUI() {
  const F = G.finish; if (!F) return;
  const k = Math.min(1, F.t / 0.25, (F.def.dur - F.t) / 0.3), bar = Math.round(22 * Math.max(0, k));
  if (F.dim > 0) { const B = F.B, bx = B.x + B.w / 2 - Math.round(G.cam.x), g = ctx.createRadialGradient(bx, B.y + B.h / 2, 20, bx, B.y + B.h / 2, 200); g.addColorStop(0, `rgba(0,0,0,${F.dim * 0.3})`); g.addColorStop(1, `rgba(0,0,0,${F.dim})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  const ta = Math.min(1, Math.max(0, (F.t - 0.15) / 0.3)) * Math.max(0, k);
  if (ta > 0) {
    ctx.save(); ctx.globalAlpha = ta; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = '7px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = '#9fdcd0'; gtext((CHARS[F.hero].name + ' · finishing move').toUpperCase(), W / 2, H - bar / 2 - 5);
    ctx.font = '13px "IM Fell English SC", Georgia, serif'; ctx.fillStyle = '#f6e7bf'; gtext(F.def.name, W / 2, H - bar / 2 + 5);
    ctx.restore();
  }
}
// rubble shaken loose from the ceiling after a big impact
function rubble(x, n) {
  for (let i = 0; i < n; i++) G.parts.push({ x:clamp(x + rand(-90, 90), T, G.room.w * T - T), y:T + rand(0, 10), vx:rand(-12, 12), vy:rand(0, 50), life:rand(0.9, 1.4), max:1.4, c:['#55607a', '#3a4250', '#6b6f7a', C.waxSh][(Math.random() * 4) | 0], s:Math.random() < 0.4 ? 3 : 2, g:430 });
}
function bossDie() {
  const B = G.boss;
  if (B.kind === 'wyrm') return startPupa(B);
  if (B.kind === 'umbra') return umbraDie(B);
  B.state = 'downed'; B.t = 2; B.hp = 0; B.vx = 0; B.wardT = 0; B.downT = 0; G.finHold = 0; G.hitstop = 0.35; G.shake = 10; sfx('die'); screenFlash(0.85, 0.35);
  setTimeout(() => { if (G.boss === B && B.state === 'downed') toast(tip('It is beaten. Go to it and push the stick up to finish it.', 'It is beaten. Stand by it and hold ↑ to finish it.'), 4200); }, 900);
  G.drops = []; G.waves = []; G.shots = []; G.puddles = [];
  for (const e of G.enemies) if (e.wickling || e.cinder) { e.dead = true; burst(e.x + 5, e.y + 4, 8, { spd:80, life:0.4, colors:[C.wax, C.flame], size:2, g:200 }); }
}
function updateHazards(dt) {
  for (const d of G.drops) {
    if (d.warn > 0) { d.warn -= dt; continue; }
    d.vy = Math.min(d.vy + 900 * dt, 420); d.y += d.vy * dt;
    if (tileAt(Math.floor((d.x + 3) / T), Math.floor((d.y + d.h) / T)) === 1) {
      d.dead = true; const gy = Math.floor((d.y + d.h) / T) * T;
      burst(d.x + d.w / 2, gy, d.big ? 18 : 8, { spd:d.big ? 140 : 80, life:0.45, colors:d.big ? [C.ember, C.flame, C.core, C.wax] : [C.wax, C.waxSh], size:2, g:400, ang:-Math.PI / 2, spread:1.3 });
      if (d.big) { G.shake = Math.max(G.shake, 2); if (Math.random() < 0.5) sfx('splat'); }
      if (d.puddle) G.puddles.push({ x:d.x + d.w / 2 - 10, y:gy, w:20, life:1.6, max:1.6 });
    }
    if (!d.dead && !P.dead && overlap(P, d)) { hurtPlayer(1, d.x + 3); d.dead = true; }
  }
  G.drops = G.drops.filter(d => !d.dead);
  for (const sh of G.shots) {
    sh.life -= dt; sh.vy += sh.g * dt; sh.x += sh.vx * dt; sh.y += sh.vy * dt;
    if (Math.random() < 0.4) G.parts.push({ x:sh.x + 3, y:sh.y + 3, vx:0, vy:0, life:0.25, max:0.25, c:C.waxSh, s:1, g:0 });
    const t = tileAt(Math.floor((sh.x + 3) / T), Math.floor((sh.y + 3) / T));
    if (t === 1 && sh.puddle) { const gy = Math.floor((sh.y + 3) / T) * T; G.puddles.push({ x:sh.x + 3 - 10, y:gy, w:20, life:sh.puddle, max:sh.puddle }); sfx('splat'); }
    if (t === 1 || sh.life <= 0) { sh.dead = true; burst(sh.x + 3, sh.y + 3, 8, { spd:80, life:0.35, colors:[C.wax, C.waxSh, C.flame], size:2, g:400, ang:-Math.PI / 2, spread:1.3 }); }
    else if (!P.dead && overlap(P, sh)) { hurtPlayer(1, sh.x + 3); sh.dead = true; }
  }
  G.shots = G.shots.filter(sh => !sh.dead);
  for (const pd of G.puddles) {
    pd.life -= dt;
    if (Math.random() < 0.5) burst(pd.x + rand(2, pd.w - 2), pd.y - 2, 1, { spd:15, life:0.4, colors:[C.flame, C.ember], size:1, g:-100 });
    if (!P.dead && pd.life > 0.2 && overlap(P, { x:pd.x + 2, y:pd.y - 6, w:pd.w - 4, h:6 })) hurtPlayer(1, pd.x + pd.w / 2);
  }
  G.puddles = G.puddles.filter(pd => pd.life > 0);
  for (const w of G.waves) {
    w.life -= dt; w.x += w.vx * dt;
    const tx = Math.floor((w.vx > 0 ? w.x + w.w : w.x) / T);
    if (tileAt(tx, Math.floor((w.y + 4) / T)) === 1 || w.life <= 0) w.dead = true;
    if (Math.random() < (w.big ? 1 : 0.5)) burst(w.x + w.w / 2, w.y + w.h - 2, w.big ? 2 : 1, { spd:30, life:0.5, colors:[C.flame, C.ember, C.core], size:2, g:-120 });
    if (!w.dead && !P.dead && overlap(P, w)) { hurtPlayer(1, w.x + 5); }
  }
  G.waves = G.waves.filter(w => !w.dead);
}

