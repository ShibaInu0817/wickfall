// ---------- Chapter 3: the Tallow Wyrm, then the Cinder Moth
// Neither stage can be cut until a Wax Dive stuns it. The wyrm swims under a molten crust and bites up through it:
// jump above its raised head and dive onto it. When it falls it hardens into a pupa, the pool cools, white-wax ledges
// rise up the walls and the Cinder Moth hatches. Climb high and dive onto its back as it passes below.
// every number worth arguing about lives here; the Chapter 3 boss lab edits these live
const TUNE = { wyrmHp:30, mothHp:32, stunT:3.2, biteTell:0.85, biteHang:1.4, headSag:18, wyrmGap:0.7, flameLen:150, flameT:1.3, capRegrow:1.2, diveReach:22,
  mothGap:1.1, mothSpeed:80, minis:2, miniMax:4, saddleRegrow:1.5, launch:440, floatG:0.8, perchT:1.8, rushSpeed:400, recoverT:0.7, parryWin:0.24,
  umbraHp:48, umbraGap:0.7, umbraTell:1 };
const WYRM_HP = TUNE.wyrmHp, MOTH_HP = TUNE.mothHp, MOTH_CRUISE = 6 * T - 4;
const KILN_LEDGES = [[1, 10, 4], [6, 7, 3], [1, 4, 4], [27, 10, 4], [23, 7, 3], [27, 4, 4]];
const mkWyrm = (px) => ({ type:'boss', kind:'wyrm', x:px - 12, y:13 * T + 40, w:24, h:20, hx:px, vx:0, vy:0, hp:TUNE.wyrmHp, maxHp:TUNE.wyrmHp, state:'dormant', t:0, face:-1, flash:0, anim:0, atk:1.4, last:'', rise:0, headUp:30, lk:0, targets:[] });
const mkMoth = (cx, cy) => ({ type:'boss', kind:'moth', x:cx - 24, y:cy, w:48, h:24, vx:0, vy:0, hp:TUNE.mothHp, maxHp:TUNE.mothHp, state:'hatch', t:1.8, face:-1, flash:0, anim:0, wph:0, fold:0, tilt:0, trail:[], atk:1.6, last:'', ty:cy, dir:1 });
const mkCocoon = (px, py) => ({ type:'cocoon', x:px + 3, y:py, w:10, h:16, vx:0, vy:0, hp:2, flash:0, kbT:0, t:rand(0, 6), wob:0, wv:0 });
const mkCinderMoth = (x, y) => ({ type:'flyer', cinder:true, x:x - 5, y:y - 4, w:10, h:8, hx:x, hy:y, vx:rand(-60, 60), vy:rand(-60, -20), hp:1, flash:0, kbT:0, t:rand(0, 6), sw:rand(0.8, 1.6) });
function wyrmPool() { const rw = G.room.w * T; return G.room.def.id === 'kiln' ? [5 * T, 27 * T] : [5 * T, rw - 5 * T]; }
const isKinBoss = B => B && (B.kind === 'wyrm' || B.kind === 'moth');
const kinOpen = B => B.state === 'stun' || B.state === 'fall';

// ----- wax chunks: thrown out by broken crust, stuns, the pupa and slain moths; walk over them to refill
function waxBit(x, y, vx, vy) { (G.waxbits || (G.waxbits = [])).push({ x, y, vx:vx == null ? rand(-50, 50) : vx, vy:vy == null ? -rand(90, 160) : vy, t:0, rest:false }); }
function updateWaxbits(dt) {
  if (!G.waxbits || !G.waxbits.length) return;
  for (const b of G.waxbits) {
    b.t += dt;
    const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2, dx = pcx - b.x, dy = pcy - b.y, d = Math.hypot(dx, dy);
    if (b.t > 0.35 && d < 34 && !P.dead) { b.vx = dx / (d || 1) * 160; b.vy = dy / (d || 1) * 160; b.rest = false; b.x += b.vx * dt; b.y += b.vy * dt; }
    else if (!b.rest) {
      b.vy = Math.min(b.vy + 700 * dt, 400); b.x += b.vx * dt; b.y += b.vy * dt;
      if (tileAt(Math.floor(b.x / T), Math.floor(b.y / T)) === 1) { b.x -= b.vx * dt; b.vx *= -0.5; }
      const ty = Math.floor((b.y + 3) / T), tl = tileAt(Math.floor(b.x / T), ty);
      if ((tl === 1 || tl === 3) && b.vy > 0 && b.y + 3 - ty * T < 8) { b.y = ty * T - 3; b.vy = -b.vy * 0.32; b.vx *= 0.6; if (Math.abs(b.vy) < 35) { b.rest = true; b.vy = 0; b.vx = 0; } }
      if (b.y > G.room.h * T) b.dead = true;
    }
    if (b.t > 0.25 && !P.dead && overlap(P, { x:b.x - 6, y:b.y - 6, w:12, h:12 })) {
      b.dead = true; P.wax = Math.min(99, P.wax + 22); sfx('waxGet');
      burst(b.x, b.y, 8, { spd:70, life:0.35, colors:[C.wax, C.waxHi, C.flame], size:1, g:-40 });
    }
    if (b.t > 24) b.dead = true;
  }
  G.waxbits = G.waxbits.filter(b => !b.dead);
}
function drawWaxbits(cx0, t) {
  if (!G.waxbits) return;
  for (const b of G.waxbits) {
    const x = Math.round(b.x - cx0), y = Math.round(b.y + (b.rest ? Math.sin(t * 3 + b.x) * 0.8 : 0)), a = b.t > 21 ? (Math.sin(t * 20) > 0 ? 1 : 0.3) : 1;
    ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, 'rgba(255,240,200,.35)'); g.addColorStop(1, 'rgba(255,240,200,0)'); ctx.fillStyle = g; ctx.fillRect(x - 9, y - 9, 18, 18);
    ctx.fillStyle = C.waxDk; ctx.fillRect(x - 3, y - 2, 6, 5); ctx.fillRect(x - 2, y - 3, 4, 7);
    ctx.fillStyle = C.wax; ctx.fillRect(x - 2, y - 2, 4, 4); ctx.fillStyle = C.waxHi; ctx.fillRect(x - 2, y - 2, 2, 1); ctx.fillStyle = C.waxSh; ctx.fillRect(x - 1, y + 1, 3, 1);
    ctx.globalAlpha = 1;
  }
}

// ----- shared: a Wax Dive lands on a kiln boss. You bounce off, it is knocked open and sheds wax.
function kinDiveHit(B, x, y) {
  P.dive = false; P.vy = -310; P.inv = Math.max(P.inv, 0.7); P.canDash = true; P.grounded = false;
  G.shake = Math.max(G.shake, 15); G.hitstop = Math.max(G.hitstop, 0.16); screenFlash(0.55, 0.15, '255,240,210'); sfx('thud'); sfx('bslam'); sfx('crack'); buzz([60, 30, 90]);
  burst(x, y, 30, { spd:200, life:0.6, colors:[C.wax, C.waxHi, C.eye, C.flame], size:2, g:260 });
  G.fx.push({ k:'ring', x, y, t:0.4, max:0.4, r:56, c:'239,227,194' });
  G.spells.push({ k:'quake', x, y:y + 4, life:0.4, max:0.4 });
  for (let i = 0; i < 2; i++) waxBit(x + rand(-10, 10), y - 4, (i ? 1 : -1) * rand(50, 90), -rand(140, 200));
}
// blades and bolts glance off until it is stunned
function kinDeflect(B, o) {
  sfx('shell'); sfx('clink'); G.hitstop = Math.max(G.hitstop, 0.06); G.shake = Math.max(G.shake, 3); B.armorT = 0.22;
  const hx = clamp(P.x + P.w / 2 + P.face * 10, B.x, B.x + B.w), hy = clamp(P.y + (P.atkDir === 'down' ? P.h + 4 : 6), B.y, B.y + B.h);
  burst(hx, hy, 12, { spd:190, life:0.3, colors:['#ffffff', C.waxHi, '#ffd27a'], size:2, g:220 });
  G.fx.push({ k:'ring', x:hx, y:hy, t:0.25, max:0.25, r:24, c:'255,255,255' });
  G.fx.push({ k:'star', x:hx, y:hy, t:0.12, max:0.12, n:8, r:16, rot:rand(0, TAU) });
  if (!o.spell && P.atkDir !== 'down') { P.recoilT = 0.18; P.recoilV = -P.face * 240; if (P.grounded) P.vy = -110; }
}
// landing on armour without diving: it is too hard to stand on, so you bounce off it, unhurt
function kinBounce(B, x, top) {
  P.y = top - 2 - P.h; P.vy = -300; P.canDash = true; P.jumping = false; P.dashT = 0; B.armorT = 0.22;
  sfx('shell'); sfx('pogo'); G.shake = Math.max(G.shake, 2);
  burst(P.x + P.w / 2, top, 10, { spd:150, life:0.3, colors:['#ffffff', C.waxHi], size:2, g:250, ang:-Math.PI / 2, spread:1.2 });
  G.fx.push({ k:'ring', x:P.x + P.w / 2, y:top, t:0.25, max:0.25, r:20, c:'255,255,255' });
}

// ----- stage 1: the Tallow Wyrm
// A worm of stacked tallow candles swimming under the crust. Its head wears a cap of the same soft white wax as the
// floors you dive through, so a Wax Dive onto it is the obvious answer: the cap shatters and the wyrm slumps open.
// Every time the head is up (a bite, or rearing to spit) the cap is in reach, and after a bite the head sags lower.
// is the white wax cap up where a dive can reach it?
// ----- stage 1: the Tallow Wyrm, shelled, with one plug of white wax on its skull
function wyrmBank() { const [x0, x1] = wyrmPool(), pcx = P.x + P.w / 2; return pcx < x0 ? -1 : pcx > x1 ? 1 : 0; }
function wyrmPick(B) {
  let opts = ['quake', 'spread', 'bite', 'dive', 'quake', 'spread'];
  if (B.noQuake > 0) { B.noQuake--; opts = opts.filter(o => o !== 'quake'); }   // right after a stun it keeps you busy first
  if (P.wax < 33 && !(B.noQuake > 0)) opts = ['quake'];                        // the quake shakes wax loose: never stuck without a dive
  let pick = opts[(Math.random() * opts.length) | 0];
  if (pick === B.last && pick !== 'quake') pick = pick === 'dive' ? 'spread' : 'dive';
  if (wyrmBank() && B.last !== 'spread' && Math.random() < 0.6) pick = 'spread';   // hiding on the stone? it lobs its fire onto you
  B.last = pick; B.double = false;
  return pick;
}
function wyrmStart(B, pick) {
  const p2 = B.hp <= B.maxHp / 2, [x0, x1] = wyrmPool(), pcx = P.x + P.w / 2, floorY = 13 * T;
  // where it will surface away from you: on the roomier side, a dash and a bit away
  const away = (min, max) => { const side = pcx - x0 > x1 - pcx ? -1 : 1; return clamp(pcx + side * rand(min, max), x0 + 22, x1 - 22); };
  if (pick === 'bite') { B.state = 'biteW'; B.t = B.wt = TUNE.biteTell * (p2 ? 0.88 : 1); B.bx = clamp(pcx, x0 + 14, x1 - 14); sfx('wRumble'); }
  else if (pick === 'quake') { B.hx = away(70, 120); B.face = pcx < B.hx ? -1 : 1; B.state = 'quakeRise'; B.t = 0.55; B.rise = 0; sfx('wRumble'); }
  else if (pick === 'spread') {
    B.bank = wyrmBank();
    if (B.bank) { B.hx = B.bank < 0 ? x0 + 120 : x1 - 120; B.face = B.bank; }   // it rears out on the bridge and lobs the fire onto the bank
    else { B.hx = away(80, 130); B.face = pcx < B.hx ? -1 : 1; }
    B.state = 'emerge'; B.t = 0.45; B.rise = 0; sfx('wRumble'); B.targets = [];
  } else {
    const dir = pcx > (x0 + x1) / 2 ? -1 : 1;
    B.dx0 = dir > 0 ? x0 + 8 : x1 - 8; B.dx1 = dir > 0 ? x1 - 8 : x0 + 8; B.face = dir;
    B.state = 'diveW'; B.t = B.wt = p2 ? 0.7 : 0.85; sfx('wRumble');
  }
}
function wyrmHead(B) {
  const floorY = 13 * T;
  if (B.state === 'leap') { const k = B.lk, x = B.dx0 + (B.dx1 - B.dx0) * k, y = floorY + 40 - Math.sin(k * Math.PI) * 128; return { x, y }; }
  return { x:B.hx + B.face * 4 * B.rise + (B.hoff || 0), y:floorY - B.headUp * B.rise };
}
// the head is up and its wax plug is in reach
const wyrmPlugOpen = B => ['quakeRise', 'quakeW', 'quakeSlam', 'quakeUp'].includes(B.state);
const wyrmHeadUp = B => ['bite', 'biteSnap', 'biteUp', 'quakeRise', 'quakeW', 'quakeUp', 'quakeSlam', 'emerge', 'spreadW', 'spreadEnd'].includes(B.state) && B.rise > 0.6;
const wyrmCapUp = B => wyrmHeadUp(B) && B.cap >= 1;
// the slam: the whole bridge jolts and everything standing on it is thrown into the air
const FIRE = { frames:null, n:16, w:48, h:40 };
function fireFrames() {
  if (FIRE.frames !== null) return FIRE.frames;
  FIRE.frames = [];
  try {
    const pal = [[154, 30, 12], [232, 80, 26], [255, 154, 34], [255, 216, 74], [255, 248, 208]], cut = [0.12, 0.24, 0.4, 0.58, 0.78];
    const rnd = seeded(7), blobs = [];
    for (let i = 0; i < 11; i++) blobs.push({ a:rnd() * TAU, d:rnd(), r:0.45 + rnd() * 0.55, up:rnd() });
    const vn = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, h = (a, b) => hash(a * 7 + z * 131, b * 13 + z * 17);
      const a = h(xi, yi), b = h(xi + 1, yi), c = h(xi, yi + 1), d = h(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
    for (let f = 0; f < FIRE.n; f++) {
      const k = f / (FIRE.n - 1), c = document.createElement('canvas'); c.width = FIRE.w; c.height = FIRE.h;
      const g = c.getContext('2d'); if (!g || !g.createImageData) throw 0;
      const img = g.createImageData(FIRE.w, FIRE.h), d = img.data, cx = FIRE.w * 0.58, cy = FIRE.h * 0.62;
      const R = 3 + 13 * Math.min(1, k * 2.4), fade = k < 0.55 ? 0 : (k - 0.55) * 2.3, rise = k * 7;
      for (let y = 0; y < FIRE.h; y++) for (let x = 0; x < FIRE.w; x++) {
        let den = 0;
        for (const bl of blobs) { const bx = cx + Math.cos(bl.a) * bl.d * R * 0.8, by = cy + Math.sin(bl.a) * bl.d * R * 0.6 - bl.up * rise, r = bl.r * R, dd = Math.hypot(x - bx, y - by) / r; if (dd < 1) den = Math.max(den, 1 - dd); }
        den += (vn(x / 3, y / 3 + k * 6, f) - 0.5) * 0.55 + (vn(x / 1.5, y / 1.5, f + 40) - 0.5) * 0.25;
        den -= fade; if (fade > 0 && vn(x / 2.5, y / 2.5, f + 90) < fade * 0.9) den -= 0.4;
        // a thin jet trailing back toward where it came from, early on
        if (k < 0.6 && Math.abs(y - cy - 1) <= (x < cx - R ? 0.6 : 1.2) && x < cx && x > cx - R - 10 - k * 8) den = Math.max(den, 0.5 - (cx - x) / (R + 22));
        let ci = -1; for (let q = 0; q < 5; q++) if (den > cut[q]) ci = q;
        if (ci < 0) continue; const o = (y * FIRE.w + x) * 4; d[o] = pal[ci][0]; d[o + 1] = pal[ci][1]; d[o + 2] = pal[ci][2]; d[o + 3] = 255;
      }
      // loose flecks licking upward around the edge
      for (let i = 0; i < 6 + f; i++) { const a = rnd() * TAU, rr = R * (0.9 + rnd() * 0.6), x = Math.round(cx + Math.cos(a) * rr), y = Math.round(cy + Math.sin(a) * rr * 0.7 - rnd() * rise * 1.5); if (x < 0 || y < 0 || x >= FIRE.w || y >= FIRE.h) continue; const o = (y * FIRE.w + x) * 4, col = pal[1 + (i % 3)]; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255; }
      g.putImageData(img, 0, 0); FIRE.frames.push(c);
    }
  } catch (_) { FIRE.frames = []; }
  return FIRE.frames;
}
// fire puffs: thrown from the mouth along the stream, then rolling out along the bridge
// the Black Wick's fire: the same pixel flames, remapped from orange to black smoke, crimson body and a hot red core
const DARK_FIRE = { frames:null };
function darkFireFrames() {
  if (DARK_FIRE.frames) return DARK_FIRE.frames;
  const src = fireFrames(); DARK_FIRE.frames = [];
  try {
    const from = [[154, 30, 12], [232, 80, 26], [255, 154, 34], [255, 216, 74], [255, 248, 208]], to = [[10, 3, 6], [52, 6, 12], [128, 12, 22], [214, 34, 34], [255, 120, 96]];
    for (const im of src) {
      const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const id = g.getImageData(0, 0, c.width, c.height), d = id.data;
      for (let k = 0; k < d.length; k += 4) { if (!d[k + 3]) continue; let bi = 0, bd = 1e9;
        for (let i = 0; i < 5; i++) { const q = (d[k] - from[i][0]) ** 2 + (d[k + 1] - from[i][1]) ** 2 + (d[k + 2] - from[i][2]) ** 2; if (q < bd) { bd = q; bi = i; } }
        d[k] = to[bi][0]; d[k + 1] = to[bi][1]; d[k + 2] = to[bi][2]; }
      g.putImageData(id, 0, 0); DARK_FIRE.frames.push(c);
    }
  } catch (_) { DARK_FIRE.frames = src; }
  return DARK_FIRE.frames;
}
// a burst of black-red flames: n puffs around (x, y), rising unless roll is set (then they run along the floor)
function darkFlames(x, y, n, o) {
  o = o || {};
  const live = G.fpuffs ? G.fpuffs.length : 0, cap = G.lite ? 28 : 70; if (live > cap) return; if (live > cap * 0.57) n = Math.min(n, 2); if (G.lite) n = Math.ceil(n / 2);
  for (let i = 0; i < n; i++) {
    const dir = o.dir || (Math.random() < 0.5 ? -1 : 1);
    if (o.roll) firePuff({ dark:true, black:!!o.black, roll:true, x:x + rand(-4, 4), y:13 * T - 8, vx:dir * rand(80, 170), drag:0.08, dir, life:rand(0.4, 0.6), sc:rand(0.6, 0.95), age:-i * 0.02 });
    else firePuff({ dark:true, black:!!o.black, free:true, x:x + rand(-(o.w || 6), o.w || 6), y:y + rand(-4, 4), vx:rand(-20, 20) + (o.vx || 0), vy:-rand(60, 150) * (o.up || 1), g:-40, drag:0.45, life:rand(0.35, 0.6) * (o.life || 1), dir, sc:rand(0.45, 0.85) * (o.sc || 1), age:-rand(0, o.spread || 0.08) });
  }
}
function firePuff(o) { (G.fpuffs || (G.fpuffs = [])).push(Object.assign({ age:0, life:0.6, dir:1, sc:1, seed:rand(0, 9), vx:0, vy:0 }, o)); }
function updateFirePuffs(dt) {
  if (!G.fpuffs || !G.fpuffs.length) return;
  const floorY = 13 * T, B = G.boss;
  for (const p of G.fpuffs) {
    p.age += dt;
    if (p.free) { p.vy += (p.g || 0) * dt; const dr = Math.pow(p.drag || 0.4, dt); p.vx *= dr; p.vy *= dr; p.x += p.vx * dt; p.y += p.vy * dt; continue; }
    if (p.roll) { p.vx *= Math.pow(p.drag || 0.15, dt); p.x += p.vx * dt; continue; }
    if (!p.floor) { p.vy += 300 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.y >= floorY - 8) { p.floor = true; p.y = floorY - 8; p.vy = 0; p.vx = p.dir * rand(90, 150); } }
    else { p.vx *= Math.pow(0.12, dt); p.x += p.vx * dt; if (B && B.kind === 'wyrm' && B.state === 'flame') { const lim = wyrmMouth(B).x + B.dir * 0 + B.face * B.fd; if ((p.dir > 0 && p.x > lim) || (p.dir < 0 && p.x < lim)) p.x = lim; } }
  }
  G.fpuffs = G.fpuffs.filter(p => p.age < p.life);
}
function drawFirePuffs(cx0) {
  if (!G.fpuffs || !G.fpuffs.length) return;
  const fr = fireFrames(), dfr = darkFireFrames(), m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
  const ox = -Math.round(FIRE.w * 0.58), oy = -Math.round(FIRE.h * 0.62);
  for (const p of G.fpuffs) {
    if (p.age < 0) continue;
    const k = p.age / p.life, x = Math.round(p.x - cx0), y = Math.round(p.y);
    if (!fr.length) { drawFlame(x, y + 6, 1 + k, p.age * 3 + p.seed, C.ember, C.core); continue; }
    if (x < -40 || x > W + 40) continue;   // off screen
    const fs = p.black ? blackFireFrames() : p.dark ? dfr : fr, im = fs[Math.min(fs.length - 1, Math.floor(k * fs.length))], sc = p.sc, sx = p.dir < 0 ? -sc : sc;
    // one matrix per puff instead of save/translate/scale/restore: much cheaper when there are dozens of them
    if (m) { ctx.setTransform(m.a * sx, m.b * sx, m.c * sc, m.d * sc, m.e + m.a * x + m.c * y, m.f + m.b * x + m.d * y); ctx.drawImage(im, ox, oy); }
    else { ctx.save(); ctx.translate(x, y); ctx.scale(sx, sc); ctx.drawImage(im, ox, oy); ctx.restore(); }
  }
  if (m) ctx.setTransform(m);
}
function wyrmMouth(B) { const hd = wyrmHead(B); return { x:hd.x + B.face * 15, y:hd.y + 6 }; }
function flameArc(B, n) {
  const m = wyrmMouth(B), floorY = 13 * T, ix = m.x + B.face * B.fd, pts = [];
  for (let i = 0; i <= n; i++) { const k = i / n, x = m.x + (ix - m.x) * k, y = m.y + (floorY - 2 - m.y) * k - Math.sin(k * Math.PI) * 26; pts.push({ x, y, k }); }
  return pts;
}
// a heavy blow: strong rattle plus a downward punch of the whole view that springs back
function heavyShake(n) { G.shake = Math.max(G.shake, n); G.jolt = Math.max(G.jolt || 0, n * 0.45); }
function wyrmQuake(B) {
  const floorY = 13 * T;
  heavyShake(16); G.hitstop = Math.max(G.hitstop, 0.1); sfx('bslam'); sfx('wallhit'); sfx('hit8'); screenFlash(0.25, 0.1, '255,200,150'); buzz([70, 30, 110]);
  if (!P.dead && P.grounded && !P.dive) { P.vy = -TUNE.launch; P.grounded = false; P.jumping = false; P.canDash = true; P.dashT = 0; G.floatT = 1.6; G.floatAge = 0; sfx('jump'); dust(P.x + P.w / 2, floorY, 8);
    for (let i = 0; i < 10; i++) G.parts.push({ x:P.x + P.w / 2 + rand(-6, 6), y:P.y + P.h, vx:rand(-20, 20), vy:rand(-200, -80), life:0.5, max:0.5, c:i % 2 ? C.waxHi : C.waxSh, s:2, g:300 }); }
  for (const b of G.waxbits || []) if (b.rest) { b.rest = false; b.vy = -rand(160, 240); b.vx = rand(-30, 30); }
  for (const pr of G.props || []) { pr.vy = -rand(150, 230); pr.vr = rand(-6, 6); }
  for (let x = 2 * T; x < G.room.w * T - 2 * T; x += 24) dust(x + rand(-6, 6), floorY, 2);
  rubble(B.hx, 14); waxBit(B.hx + B.face * -rand(30, 50), floorY - 20, null, -rand(200, 260));
  G.fx.push({ k:'ring', x:B.hx, y:floorY, t:0.45, max:0.45, r:120, c:'255,200,150' });
}
function updateWyrm(dt, B) {
  B.flash -= dt; B.anim += dt; B.t -= dt;
  const p2 = B.hp <= B.maxHp / 2, floorY = 13 * T, pcx = P.x + P.w / 2, [x0, x1] = wyrmPool(), gp = G.gal && G.gal.passive;
  if (B.state === 'pupa') return updatePupa(dt, B);
  if (B.cap == null) B.cap = 1;
  if (B.armorT > 0) B.armorT -= dt;
  if (!['spreadW', 'flame'].includes(B.state)) B.hoff = approach(B.hoff || 0, 0, 40 * dt);
  if (B.state !== 'stun' && B.cap < 1) B.cap = Math.min(1, B.cap + dt / TUNE.capRegrow);
  if (p2 && !B.enraged && ['under', 'biteW', 'diveW'].includes(B.state)) {
    B.enraged = true; sfx('bRoar'); heavyShake(12); screenFlash(0.5, 0.18, '226,85,63'); G.vig = 1; buzz([80, 40, 140]);
    showBanner('The Wyrm boils', 'Faster now, and it quakes harder', true);
  }
  let rise = 0;
  switch (B.state) {
    case 'dormant': B.hx = (x0 + x1) / 2 + Math.sin(B.anim * 0.9) * 70; B.face = Math.cos(B.anim * 0.9) > 0 ? 1 : -1;
      if (P.x > x0 + T && !P.dead) { B.state = 'intro'; B.t = CINE_T; B.hx = (x0 + x1) / 2; B.face = pcx < B.hx ? -1 : 1; startBossCine(B, 'The Tallow Wyrm', 'It swims beneath the bridge'); }
      break;
    case 'intro': { const c = G.cine; rise = c && c.t > 1.6 && c.t < 3.2 ? 1 : 0; B.headUp = 70;
      if (c && c.t > 1.6 && !B.introBurst) { B.introBurst = true; sfx('wBurst'); G.shake = 8; burst(B.hx, floorY - 2, 26, { spd:190, life:0.6, colors:[C.wax, C.waxSh, C.flame, C.ember], size:2, g:420, ang:-Math.PI / 2, spread:1.1 }); }
      if (B.t <= 0) { B.state = 'under'; B.atk = 0.7; }
      break; }
    case 'under': {
      // it shadows you through the lava under the bridge, always visible through the gaps
      const tx = clamp(pcx + Math.sin(B.anim * 1.3) * 30, x0 + 14, x1 - 14); B.hx = approach(B.hx, tx, (p2 ? 140 : 105) * dt); B.face = tx < B.hx ? -1 : 1;
      if (!gp) B.atk -= dt;
      if (B.atk <= 0) wyrmStart(B, wyrmPick(B));
      break; }
    case 'biteW':
      // the planks under you glow and crack; it follows for a moment, then commits
      if (B.t > B.wt * 0.45) B.bx = approach(B.bx, clamp(pcx, x0 + 14, x1 - 14), 150 * dt);
      B.hx = approach(B.hx, B.bx, 320 * dt); G.shake = Math.max(G.shake, 1.3);
      if (Math.random() < 0.5) G.parts.push({ x:B.bx + rand(-14, 14), y:floorY - 1, vx:rand(-10, 10), vy:rand(-90, -40), life:0.4, max:0.4, c:Math.random() < 0.5 ? C.flame : C.waxSh, s:Math.random() < 0.3 ? 2 : 1, g:300 });
      if (B.t <= 0) {
        B.state = 'bite'; B.t = 0.28; B.hx = B.bx; B.face = pcx < B.hx ? -1 : 1; sfx('wBurst'); sfx('spit'); heavyShake(11); G.hitstop = Math.max(G.hitstop, 0.04);
        burst(B.bx, floorY - 2, 26, { spd:220, life:0.6, colors:[C.wax, C.waxSh, C.flame, C.ember, C.core], size:2, g:420, ang:-Math.PI / 2, spread:0.9 });
        G.fx.push({ k:'ring', x:B.bx, y:floorY - 4, t:0.3, max:0.3, r:34, c:'255,170,90' });
      }
      break;
    case 'bite': rise = 1; B.headUp = 78; B.face = pcx < B.hx ? -1 : 1; B.hx = approach(B.hx, clamp(pcx, B.bx - 22, B.bx + 22), 140 * dt);
      if (B.t <= 0) { B.state = 'biteSnap'; B.t = 0.1; sfx('kHit'); sfx('clink'); heavyShake(8); G.hitstop = Math.max(G.hitstop, 0.05); const hd = wyrmHead(B); G.fx.push({ k:'star', x:hd.x + B.face * 10, y:hd.y + 4, t:0.12, max:0.12, n:6, r:14, rot:0 }); }
      break;
    case 'biteSnap': rise = 1; B.headUp = 76; if (B.t <= 0) { B.state = 'biteUp'; B.t = 0.45; } break;
    case 'biteUp': rise = 1; B.headUp = 74; B.face = pcx < B.hx ? -1 : 1; if (B.t <= 0) { B.state = 'sink'; B.t = 0.3; } break;
    case 'quakeRise': rise = 1; B.headUp = 76; B.face = pcx < B.hx ? -1 : 1;
      if (B.t <= 0.4 && !B.burstQ) { B.burstQ = true; sfx('wBurst'); G.shake = Math.max(G.shake, 6); burst(B.hx, floorY - 2, 22, { spd:200, life:0.6, colors:[C.wax, C.waxSh, C.flame, C.ember], size:2, g:420, ang:-Math.PI / 2, spread:1 }); }
      if (B.t <= 0) { B.burstQ = false; B.state = 'quakeW'; B.t = B.wt = p2 ? 0.45 : 0.6; sfx('bGrowl'); }
      break;
    case 'quakeW':
      // it rears back and coils its body under the bridge: everything on the deck starts to rattle
      rise = 1; B.headUp = 76 + (1 - B.t / B.wt) * 14; B.face = pcx < B.hx ? -1 : 1; G.shake = Math.max(G.shake, 1.5 + (1 - B.t / B.wt) * 2.5);
      if (B.t <= 0) { B.state = 'quakeSlam'; B.t = 0.12; sfx('kSwing'); }
      break;
    case 'quakeSlam':
      // the head comes down on the bridge like a hammer
      rise = 1; B.headUp = 6 + 84 * Math.max(0, B.t / 0.12); B.rise = 1;
      if (B.t <= 0) { wyrmQuake(B); burst(B.hx, floorY - 2, 30, { spd:240, life:0.6, colors:[C.wax, C.waxHi, C.waxSh, C.flame], size:2, g:500, ang:-Math.PI / 2, spread:1.4 }); B.state = 'quakeUp'; B.t = TUNE.biteHang * (p2 ? 0.85 : 1); B.headUp = 6; }
      break;
    case 'quakeUp': rise = 1; B.headUp = approach(B.headUp, 60, 160 * dt); B.face = pcx < B.hx ? -1 : 1;
      if (p2 && !B.q2 && B.t < TUNE.biteHang * 0.45 && !gp) { B.q2 = true; B.state = 'quakeW'; B.t = B.wt = 0.35; break; }   // below half it slams twice
      if (B.t <= 0) { B.q2 = false; B.state = 'sink'; B.t = 0.3; }
      break;
    case 'sink':
      if (B.t <= 0) {
        if (p2 && !B.double && !gp && B.last === 'bite') { B.double = true; wyrmStart(B, 'bite'); B.t = B.wt = 0.6; }
        else { B.state = 'under'; B.atk = TUNE.wyrmGap * (p2 ? 0.74 : 1); }
      }
      break;
    case 'emerge': rise = 1; B.headUp = 72; if (B.t <= 0) { B.state = 'spreadW'; B.t = B.wt = p2 ? 0.6 : 0.8; B.face = pcx < B.hx ? -1 : 1; sfx('tVolley'); } break;
    case 'spreadW': {
      // first it draws back and breathes in (mouth shut, eyes narrowed, throat glowing), then throws its head forward and roars
      const k = 1 - B.t / B.wt, inhale = k < 0.55;
      rise = 1; B.headUp = inhale ? 72 + k / 0.55 * 8 : 80 - (k - 0.55) / 0.45 * 4; B.hoff = inhale ? -B.face * 7 * (k / 0.55) : B.face * (-7 + 12 * Math.min(1, (k - 0.55) / 0.15));
      if (!B.inhaled) { B.inhaled = true; sfx('wInhale'); }
      if (!inhale && !B.roared) { B.roared = true; sfx('bRoar'); heavyShake(10); G.hitstop = Math.max(G.hitstop, 0.05); const m = wyrmMouth(B); for (const r of [20, 34]) G.fx.push({ k:'ring', x:m.x, y:m.y, t:0.35, max:0.35, r, c:'255,220,170' }); }
      if (!inhale) G.shake = Math.max(G.shake, 3);
      if (Math.random() < 0.6) { const m = wyrmMouth(B); G.parts.push({ x:m.x + rand(-2, 2), y:m.y + rand(-2, 2), vx:B.face * rand(10, 40), vy:rand(-50, -20), life:0.3, max:0.3, c:Math.random() < 0.5 ? C.flame : C.core, s:2, g:-60 }); }
      if (B.t <= 0) { B.state = 'flame'; B.t = B.ft = TUNE.flameT * (p2 ? 1.25 : 1); B.fd = 24; B.puffT = 0; B.inhaled = B.roared = false; sfx('waveFire'); }
      break; }
    case 'flame': {
      // the stream pours onto the bridge and the fire spreads out along it to full reach, holds, then dies back: get out of reach
      rise = 1; B.headUp = 76 + Math.sin(B.anim * 30) * 1.2; B.hoff = B.face * (4 + Math.sin(B.anim * 22) * 1.5); const k = 1 - Math.max(0, B.t) / B.ft, grow = k < 0.35 ? k / 0.35 : k < 0.8 ? 1 : 1 - (k - 0.8) / 0.2;
      { const m0 = wyrmMouth(B), room = B.face > 0 ? x1 - m0.x : m0.x - x0; B.fd = B.bank ? room + (x0 - 16) * Math.max(0, grow) : Math.min(24 + (TUNE.flameLen - 24) * Math.max(0, grow), Math.max(10, room)); }
      G.shake = Math.max(G.shake, 2); B.puffT -= dt; if (B.puffT <= 0) { B.puffT = 0.22; sfx('fireBreath'); }
      B.emitT = (B.emitT || 0) - dt;
      if (Math.random() < 0.7) { const m = wyrmMouth(B); firePuff({ free:true, x:m.x + B.face * 4, y:m.y, vx:B.face * rand(80, 140), vy:rand(-30, 10), g:-60, drag:0.2, life:rand(0.25, 0.4), dir:B.face, sc:rand(0.35, 0.55) }); }
      if (B.emitT <= 0 && grow > 0.05) { B.emitT = 0.045; const m = wyrmMouth(B), ix = B.bank ? (B.bank < 0 ? rand(T + 4, x0 - 4) : rand(x1 + 4, G.room.w * T - T - 4)) : m.x + B.face * Math.min(B.fd, 60) * rand(0.5, 1), tf = B.bank ? 0.5 : 0.32, vx = (ix - m.x) / tf, vy = (13 * T - 8 - m.y) / tf - 0.5 * 300 * tf;
        (G.fpuffs || (G.fpuffs = [])).push({ x:m.x, y:m.y, vx, vy, age:0, life:rand(0.55, 0.75), dir:B.face, sc:rand(0.7, 1), seed:rand(0, 9), floor:false });
        if (B.bank && grow > 0.4) G.fpuffs.push({ x:B.bank < 0 ? rand(T + 4, x0) : rand(x1, G.room.w * T - T - 4), y:13 * T - 8, vx:rand(-20, 20), vy:0, age:rand(0, 0.1), life:rand(0.45, 0.65), dir:B.face, sc:rand(0.6, 0.95), seed:rand(0, 9), floor:true, roll:true, drag:0.3 });
        if (!B.bank && B.fd > 50) G.fpuffs.push({ x:m.x + B.face * rand(30, B.fd), y:13 * T - 8, vx:B.face * rand(20, 60), vy:0, age:rand(0, 0.15), life:rand(0.5, 0.7), dir:B.face, sc:rand(0.6, 0.9), seed:rand(0, 9), floor:true }); }
      const end = flameArc(B, 1)[1]; if (Math.random() < 0.9) burst(end.x, 13 * T - 2, 2, { spd:120, life:0.35, colors:[C.flame, C.ember, C.core], size:2, g:300, ang:-Math.PI / 2, spread:1 });
      if (B.t <= 0) { B.state = 'spreadEnd'; B.t = 0.45; }
      break; }
    case 'spreadEnd': rise = 1; B.headUp = approach(B.headUp, 70, 40 * dt);
      if (!B.hissed) { B.hissed = true; sfx('wHiss'); }
      if (Math.random() < 0.5) { const m = wyrmMouth(B); G.parts.push({ x:m.x + rand(-3, 3), y:m.y - 2, vx:B.face * rand(5, 20), vy:rand(-40, -15), life:0.9, max:0.9, c:Math.random() < 0.5 ? '#6b6f7a' : '#8c8f99', s:2, g:-20 }); } if (B.t <= 0) { B.state = 'sink'; B.t = 0.3; B.double = true; B.hissed = false; B.bank = 0; } break;
    case 'diveW': B.hx = approach(B.hx, B.dx0, 420 * dt);
      if (Math.random() < 0.7) { const k = Math.random(), x = B.dx0 + (B.dx1 - B.dx0) * k; G.parts.push({ x, y:floorY - 1, vx:0, vy:rand(-60, -25), life:0.35, max:0.35, c:Math.random() < 0.6 ? C.flame : C.wax, s:1, g:200 }); }
      if (B.t <= 0) { B.state = 'leap'; B.lk = 0; sfx('wBurst'); sfx('waveFire'); G.shake = Math.max(G.shake, 7); burst(B.dx0, floorY - 2, 22, { spd:200, life:0.55, colors:[C.wax, C.flame, C.ember], size:2, g:420, ang:-Math.PI / 2, spread:0.8 }); }
      break;
    case 'leap':
      B.lk = Math.min(1, B.lk + dt / (p2 ? 0.95 : 1.1)); B.hx = B.dx0 + (B.dx1 - B.dx0) * B.lk;
      if (B.lk >= 1) {
        sfx('wBurst'); sfx('splat'); sfx('hit8'); heavyShake(13); dust(B.dx1, floorY, 12);
        burst(B.dx1, floorY - 2, 30, { spd:230, life:0.6, colors:[C.wax, C.flame, C.ember, C.core], size:2, g:420, ang:-Math.PI / 2, spread:1 });
        for (const bank of [x0 - 2 * T, x1 + 2 * T]) { fireShot(B.dx1, floorY - 12, clamp(bank + rand(-8, 8), 2 * T, G.room.w * T - 2 * T), floorY - 4, 0.8); G.shots[G.shots.length - 1].puddle = p2 ? 3 : 2.2; }
        if (p2) for (const d of [-1, 1]) G.waves.push({ x:B.dx1 - 6 + d * 16, y:floorY - 20, w:12, h:20, vx:d * 150, life:1.5, big:true });
        B.state = 'under'; B.atk = TUNE.wyrmGap * (p2 ? 0.8 : 1.05);
      }
      break;
    case 'stun': rise = 1; B.headUp = 10;
      if (Math.random() < 0.2) burst(B.hx + rand(-16, 16), floorY - 10, 1, { spd:20, life:0.8, colors:['#6b6f7a'], size:2, g:-40 });
      if (B.t <= 0) { B.state = 'sink'; B.t = 0.35; B.double = true; sfx('wBurst'); burst(B.hx, floorY - 2, 14, { spd:140, life:0.5, colors:[C.wax, C.flame], size:2, g:420, ang:-Math.PI / 2, spread:1 }); }
      break;
  }
  if (B.state !== 'leap') B.rise = approach(B.rise, rise, dt * (B.state === 'bite' ? 10 : B.state === 'stun' ? 6 : 4));
  const hd = wyrmHead(B);
  if (B.state === 'stun') { B.x = B.hx - 26; B.y = floorY - 20; B.w = 52; B.h = 20; }
  else if (B.state === 'leap') { B.w = 24; B.h = 22; B.x = hd.x - 12; B.y = hd.y - 13; }
  else if (B.rise > 0.15) { const top = hd.y - 14; B.w = 28; B.x = hd.x - 14; B.y = top; B.h = floorY - top; }
  else { B.w = 24; B.h = 20; B.x = B.hx - 12; B.y = floorY + 40; }
  if (P.dead) return;
  // the stun: a Wax Dive onto the wax plug on top of its head
  if (P.dive && P.vy > 0 && wyrmCapUp(B)) {
    const top = hd.y - 16, zone = { x:hd.x - TUNE.diveReach, y:top - 10, w:TUNE.diveReach * 2, h:26 };
    if (overlap(P, zone) && P.y + P.h <= top + 16) {
      kinDiveHit(B, hd.x, top + 2);
      for (let i = 0; i < 14; i++) G.parts.push({ x:hd.x + rand(-8, 8), y:top + rand(0, 4), vx:rand(-90, 90), vy:rand(-160, -60), life:rand(0.6, 1), max:1, c:i % 3 ? C.wax : C.waxHi, s:Math.random() < 0.5 ? 3 : 2, g:500 });
      B.state = 'stun'; B.t = TUNE.stunT; B.rise = 1; B.cap = 0; G.shots = []; B.noQuake = 2; B.q2 = false;
      hitEnemy(B, skDmg('dive'), { spell:true, dir:B.face, x:hd.x, y:top + 4 });
      return;
    }
  }
  if (P.dive) return;
  // landing on its shell without diving: it shrugs you off
  if (P.vy > 0 && wyrmHeadUp(B)) { const top = hd.y - 16; if (P.x + P.w > hd.x - 16 && P.x < hd.x + 16 && P.y + P.h >= top - 3 && P.y + P.h <= top + 10) { kinBounce(B, hd.x, top); return; } }
  let hurt = null;
  if (['bite', 'biteSnap', 'biteUp', 'quakeRise', 'quakeW', 'quakeUp', 'quakeSlam', 'emerge', 'spreadW', 'spreadEnd'].includes(B.state) && B.rise > 0.4) hurt = { x:hd.x - 11, y:hd.y + 3, w:22, h:floorY - hd.y - 3 };
  if (B.state === 'quakeSlam') hurt = { x:hd.x - 14, y:hd.y - 14, w:28, h:floorY - hd.y + 14 };
  if (B.state === 'bite' || B.state === 'biteSnap') hurt = { x:hd.x - 14 + B.face * 6, y:hd.y - 16, w:30, h:floorY - hd.y + 16 };
  if (B.state === 'flame' && B.bank) { const k = 1 - Math.max(0, B.t) / B.ft; if (k > 0.3 && k < 0.85 && wyrmBank() === B.bank && P.y + P.h > floorY - 18) hurtPlayer(1, wyrmMouth(B).x); }
  else if (B.state === 'flame') { const m = wyrmMouth(B), lo = Math.min(m.x, m.x + B.face * B.fd), hi = Math.max(m.x, m.x + B.face * B.fd); if (P.x + P.w > lo && P.x < hi && P.y + P.h > floorY - 18) hurtPlayer(1, m.x); }
  else if (B.state === 'leap' && hd.y < floorY) hurt = { x:hd.x - 11, y:hd.y - 11, w:22, h:Math.min(24, floorY - hd.y + 11) };
  if (B.state === 'leap') for (let i = 1; i < 6; i++) { const k = B.lk - i * 0.05; if (k <= 0) break; const x = B.dx0 + (B.dx1 - B.dx0) * k, y = floorY + 40 - Math.sin(k * Math.PI) * 128; if (y < floorY - 4 && overlap(P, { x:x - 8, y:y - 8, w:16, h:16 })) { hurtPlayer(1, x); break; } }
  if (hurt && overlap(P, hurt)) hurtPlayer(1, hd.x);
}
// little things on the bridge that hop when it is shaken (looks only)
function makeProps() {
  const [x0, x1] = wyrmPool(), kinds = ['crate', 'jar', 'candle', 'crate', 'candles', 'jar', 'crate'];
  G.props = []; let i = 0;
  for (let x = x0 + 20; x < x1 - 10; x += 38 + (i * 13) % 20, i++) G.props.push({ x:x + (i % 2 ? 6 : 0), kind:kinds[i % kinds.length], y:0, vy:0, r:0, vr:0 });
}
function updateProps(dt) {
  if (!G.props) return;
  for (const p of G.props) {
    if (p.y < 0 || p.vy) { p.vy += 900 * dt; p.y += p.vy * dt; p.r += p.vr * dt; if (p.y >= 0) { p.y = 0; if (p.vy > 120) { p.vy = -p.vy * 0.3; p.vr *= 0.5; } else { p.vy = 0; p.vr = 0; p.r *= 0.5; if (Math.abs(p.r) < 0.05) p.r = 0; } } }
    else if (G.shake > 2.5 && Math.random() < 0.08) { p.vy = -rand(20, 50) * Math.min(2, G.shake / 6); p.vr = rand(-1, 1); }
  }
}

// ----- the pupa: the wyrm curls up on the crust, hardens, the pool cools and the ledges rise; then it splits
function startPupa(B) {
  const [x0, x1] = wyrmPool();
  B.state = 'pupa'; B.pt = 0; B.hp = 0; B.vx = 0; B.px = clamp(B.hx, x0 + 40, x1 - 40); B.flash = 0.2; B.face = P.x + P.w / 2 < B.px ? -1 : 1; B.hb = null; B.beat = 0;
  G.drops = []; G.waves = []; G.shots = []; G.puddles = [];
  for (const e of G.enemies) if (e.cinder) { e.dead = true; burst(e.x + 5, e.y + 4, 8, { spd:80, life:0.4, colors:[C.flame, C.ember], size:2, g:200 }); }
  G.hitstop = 0.35; G.shake = 12; sfx('die'); screenFlash(0.8, 0.3); buzz([60, 40, 120]);
  P.inv = Math.max(P.inv, 1.2);
}
function riseLedges() {
  if (G.room.def.id !== 'kiln') return;
  G.ledges = KILN_LEDGES.map(([x, y, w], i) => ({ x, y, w, k:0, d:i * 0.12 }));
}
function updateLedges(dt) {
  if (!G.ledges) return;
  for (const L of G.ledges) {
    if (L.d > 0) { L.d -= dt; continue; }
    L.k = Math.min(1, L.k + dt / 0.55);
    if (L.k >= 1 && !L.on) { L.on = true; for (let i = 0; i < L.w; i++) G.room.g[L.y][L.x + i] = 3; buildTiles(); dust(L.x * T + L.w * 8, L.y * T, 8); sfx('stomp'); }
  }
}
function updatePupa(dt, B) {
  const floorY = 13 * T, t0 = B.pt; B.pt += dt; const t = B.pt;
  const at = (s) => t0 < s && t >= s;
  B.flash -= dt; B.anim += dt; B.beat = Math.max(0, (B.beat || 0) - dt * 3.5);
  B.x = B.px - 14; B.y = floorY - 34; B.w = 28; B.h = 34;
  P.inv = Math.max(P.inv, 0.3);
  if (at(1.2)) { sfx('crack'); sfx('bslam'); G.shake = 8; burst(B.px, floorY - 16, 26, { spd:160, life:0.6, colors:[C.wax, '#e8c25a', C.waxSh], size:2, g:300 }); }
  if (at(1.55)) { for (let i = 0; i < 5; i++) waxBit(B.px + rand(-10, 10), floorY - 30, (i - 2) * rand(30, 45), -rand(170, 240)); sfx('chime'); }
  if (t > 1.4 && t < 3.0) G.kilnCool = Math.min(1, (t - 1.4) / 1.4);
  if (at(1.9)) { riseLedges(); sfx('wRumble'); G.shake = Math.max(G.shake, 5); }
  // a heartbeat inside the shell, faster and faster, drawing the heat of the room into it
  if (t > 2.8 && t < 5.9) {
    const u = (t - 2.8) / 3.1;
    B.hb = (B.hb == null ? 0 : B.hb) - dt;
    if (B.hb <= 0) { B.hb = 0.85 - 0.55 * u; B.beat = 1; sfx('heart'); G.shake = Math.max(G.shake, 1 + u * 3); if (u > 0.35) sfx('pCrack'); buzz([18]); }
    if (Math.random() < 0.35 + u * 0.6) { const a = rand(0, TAU), r = rand(50, 95), cy = floorY - 18; G.parts.push({ x:B.px + Math.cos(a) * r, y:cy + Math.sin(a) * r * 0.6, vx:-Math.cos(a) * r * 1.7, vy:-Math.sin(a) * r * 1.0, life:0.58, max:0.58, c:Math.random() < 0.5 ? C.ember : '#ff3a24', s:Math.random() < 0.3 ? 2 : 1, g:0 }); }
  }
  if (at(2.8) || at(5.9)) sfx('drone');
  if (at(4.4)) { sfx('dread'); G.shake = Math.max(G.shake, 4); }
  // the light gutters out for a moment and only its eyes stay lit
  for (const s of [3.95, 4.9, 5.7]) if (at(s)) G.blk = 0.09;
  if (at(6.95)) { G.blk = 0.38; sfx('wet'); }
  if (t > 5.95 && t < 6.9) { B.wetT = (B.wetT || 0) - dt; if (B.wetT <= 0) { B.wetT = rand(0.18, 0.4); sfx('wet'); } }
  B.twT = (B.twT == null ? 0.4 : B.twT) - dt; if (B.twT <= 0) { B.twT = rand(0.18, 0.5); B.tw = 0.09; B.twA = rand(-0.7, 0.7); } if (B.tw > 0) B.tw -= dt;
  for (const [s, side] of [[5.2, -1], [5.55, 1]]) if (at(s)) { sfx('crack'); sfx('pCrack'); G.shake = Math.max(G.shake, 6); burst(B.px + side * 13, floorY - 18, 12, { spd:120, life:0.5, colors:[C.wax, '#e8c25a', '#6e4e1e'], size:2, g:300 }); }
  if (at(5.9)) {
    // the shell splits down the middle
    sfx('crack'); sfx('wBurst'); sfx('wHiss'); G.hitstop = Math.max(G.hitstop, 0.12); G.shake = 11; screenFlash(0.35, 0.15, '255,90,60'); buzz([60, 30, 90]);
    burst(B.px, floorY - 20, 34, { spd:170, life:0.7, colors:[C.wax, '#e8c25a', '#b8873a', C.ember], size:2, g:320 });
  }
  if (at(6.35)) sfx('mChit');
  if (at(6.55)) sfx('mFlap');
  if (at(7.4)) sfx('mFlap');
  if (t >= 7.6) {
    // its wings snap open and it screams
    const M = mkMoth(B.px, floorY - 58); M.ty = MOTH_CRUISE; M.face = B.face || 1; M.wph = B.wph || 0; M.state = 'hatch'; M.t = 0.9;
    G.boss = M; G.kilnCool = 1; G.husk = { x:B.px, t:0, face:B.face || 1 };
    sfx('mScream'); sfx('hit8'); sfx('crack'); heavyShake(15); G.hitstop = Math.max(G.hitstop, 0.18); screenFlash(0.7, 0.25, '255,60,40'); G.vig = 1; buzz([90, 40, 160]);
    showBanner('The Cinder Moth', 'It was always going to fly', true);
    burst(B.px, floorY - 40, 60, { spd:240, life:0.9, colors:[C.wax, '#e8c25a', C.flame, C.ember, C.core], size:2, g:120 });
    G.fx.push({ k:'ring', x:B.px, y:floorY - 46, t:0.6, max:0.6, r:120, c:'255,80,60' });
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; firePuff({ free:true, x:B.px + Math.cos(a) * 14, y:floorY - 46 + Math.sin(a) * 8, vx:Math.cos(a) * rand(120, 200), vy:Math.sin(a) * rand(70, 130) - 40, g:-80, drag:0.2, life:rand(0.45, 0.7), dir:Math.cos(a) < 0 ? -1 : 1, sc:rand(0.6, 1) }); }
  }
}

// ----- stage 2: the Cinder Moth
function mothLanes() { return G.room.def.id === 'kiln' ? [13 * T, 10 * T, 7 * T, 4 * T] : [13 * T, 9 * T]; }
function mothPick(B, minis) {
  const p2 = B.hp <= B.maxHp / 2;
  let opts = p2 ? ['rush', 'slash', 'pounce', 'sweep', 'call', 'slash', 'rush'] : ['rush', 'slash', 'pounce', 'call', 'slash', 'rush'];
  if (minis >= TUNE.miniMax) opts = opts.filter(o => o !== 'call');
  let pick = opts[(Math.random() * opts.length) | 0];
  if (pick === B.last && opts.length > 1) pick = opts.find(o => o !== B.last);
  if (P.wax < 33 && minis === 0) pick = 'call'; // its little moths are your wax supply
  B.last = pick; B.second = false;
  return pick;
}
function mothSweepSetup(B, lane, dir) {
  const rw = G.room.w * T;
  B.lane = lane; B.sdir = dir; B.sx0 = dir > 0 ? 2 * T + B.w / 2 : rw - 2 * T - B.w / 2; B.state = 'sweepGo'; B.lastPx = -99;
}
function mothStart(B, pick) {
  const p2 = B.hp <= B.maxHp / 2, rw = G.room.w * T, bcx = B.x + B.w / 2;
  B.trail = [];
  if (pick === 'rain') { B.state = 'rainW'; B.t = B.wt = p2 ? 0.55 : 0.7; sfx('tRain'); }
  else if (pick === 'call') { B.state = 'callW'; B.t = B.wt = 0.6; sfx('tCall'); }
  else if (pick === 'rush') { B.state = 'rushW'; B.t = B.wt = p2 ? 0.5 : 0.6; B.y0 = B.y; B.rushLeft = p2 ? 2 : 1; sfx('mChit'); }
  else if (pick === 'slash') { B.state = 'slashGo'; B.t = 0.9; B.rushLeft = 0; B.si = 0; B.pfail = false; B.green = -1; B.lastGreen = -1; sfx('mChit'); sfx('wHiss'); }
  else if (pick === 'pounce') { B.state = 'stalk'; B.t = B.wt = p2 ? 0.85 : 1.1; sfx('mFlap'); }
  else {
    const feet = P.y + P.h, lanes = mothLanes(); let lane = lanes[0];
    for (const l of lanes) if (Math.abs(l - feet) < Math.abs(lane - feet)) lane = l;
    mothSweepSetup(B, lane, bcx < rw / 2 ? 1 : -1);
  }
}
// wing beat speed (radians/s) and how far the wings sweep back, per state
const MOTH_WING = { slashGo:[20, 0.4], slash:[0, 0],  hatch:[11, 0], fly:[13, 0], rainW:[9, 0], callW:[9, 0], rushW:[24, 0], rush:[0, 1], skid:[4, 0.6], recover:[7, 0], stalk:[16, 0], slamW:[30, 0], slamDrop:[0, 0.7], sweepGo:[15, 0.3], sweepW:[20, 0], sweep:[0, 0.85], rise:[14, 0], fall:[3, 0], land:[6, 0] };
function updateMoth(dt, B) {
  B.flash -= dt; B.anim += dt; B.t -= dt;
  const p2 = B.hp <= B.maxHp / 2, floorY = 13 * T, rw = G.room.w * T, gp = G.gal && G.gal.passive, bcx = B.x + B.w / 2, bcy = B.y + B.h / 2;
  const pcx = P.x + P.w / 2;
  const minis = G.enemies.filter(e => e.cinder && !e.dead).length;
  if (p2 && !B.enraged && B.state === 'fly') {
    B.enraged = true; sfx('mScream'); heavyShake(12); screenFlash(0.5, 0.18, '226,85,63'); G.vig = 1; buzz([80, 40, 140]);
    showBanner('The Moth blazes', 'Its eyes burn brighter', true);
    burst(bcx, B.y + B.h / 2, 40, { spd:230, life:0.8, colors:[C.ember, C.flame, C.core], size:2, g:0 });
  }
  if (!['stun', 'fall', 'dead'].includes(B.state) && Math.random() < (p2 ? 0.6 : 0.3)) G.parts.push({ x:bcx + rand(-26, 26), y:B.y + rand(0, B.h), vx:rand(-10, 10), vy:rand(-40, -10), life:0.6, max:0.6, c:Math.random() < 0.5 ? C.ember : C.flame, s:1, g:-30 });
  if (B.cap == null) B.cap = 1;
  if (!['stun', 'fall'].includes(B.state) && B.cap < 1) B.cap = Math.min(1, B.cap + dt / TUNE.saddleRegrow);
  if (B.armorT > 0) B.armorT -= dt;
  // wings: a continuous phase, so changing speed never makes them jump
  const wing = MOTH_WING[B.state] || [0, 0], ph0 = B.wph || 0;
  B.wrate = approach(B.wrate || 0, wing[0], 60 * dt); B.wph = ph0 + B.wrate * dt;
  B.fold = approach(B.fold || 0, wing[1], 6 * dt);
  if (B.wrate > 2 && B.wrate < 18 && Math.floor(ph0 / TAU) !== Math.floor(B.wph / TAU) && (B.flapT = (B.flapT || 0)) <= 0) { sfx('mFlap'); B.flapT = 0.4; }
  B.flapT = (B.flapT || 0) - dt;
  if (B.trail) { for (const p of B.trail) p.life -= dt; B.trail = B.trail.filter(p => p.life > 0); }
  let fly = true, tilt = 0;
  switch (B.state) {
    case 'hatch': B.vx = 0; B.ty = MOTH_CRUISE; if (B.t <= 0) { B.state = 'fly'; B.atk = 1.0; } break;
    case 'fly': {
      // it hunts you: hovers off to one side, then swings over your head to the other
      if (!B.hs) B.hs = bcx < pcx ? -1 : 1;
      B.sideT = (B.sideT == null ? 2.6 : B.sideT) - dt; if (B.sideT <= 0) { B.sideT = rand(2.2, 3.6); B.hs = -B.hs; }
      const spd = TUNE.mothSpeed * (p2 ? 1.3 : 1), tx = clamp(pcx + B.hs * 110, 3 * T, rw - 3 * T);
      B.vx = approach(B.vx, clamp((tx - bcx) * 1.5, -spd * 1.6, spd * 1.6), 240 * dt);
      B.ty = MOTH_CRUISE + Math.sin(B.anim * 1.9) * 12 + Math.sin(B.anim * 0.8) * 7;
      B.face = Math.abs(B.vx) > 60 ? (B.vx < 0 ? -1 : 1) : (pcx < bcx ? -1 : 1);
      tilt = clamp(B.vx / 500, -0.3, 0.3);
      if (!gp) B.atk -= dt;
      if (B.atk <= 0) mothStart(B, mothPick(B, minis));
      break; }
    case 'rushW': {
      // it cocks back, wings high, eyes flaring; the aim locks just before it goes
      if (B.t > 0.15) { B.tgx = pcx; B.tgy = clamp(P.y + P.h / 2, 2 * T, floorY - B.h / 2 - 1); }
      const dx = B.tgx - bcx; B.face = dx < 0 ? -1 : 1;
      B.vx = approach(B.vx, -B.face * 45, 500 * dt); B.ty = (B.y0 == null ? B.y : B.y0) - 14;
      tilt = -B.face * 0.25;
      if (B.t <= 0) {
        const dy = B.tgy - bcy, d = Math.hypot(dx, dy) || 1, S = TUNE.rushSpeed * (p2 ? 1.12 : 1);
        B.rvx = dx / d * S; B.rvy = dy / d * S; B.rd = d + 70; B.state = 'rush'; B.trail = [];
        sfx('mRush'); sfx('mShriek'); G.shake = Math.max(G.shake, 5);
      }
      break; }
    case 'rush': {
      fly = false;
      B.x += B.rvx * dt; B.y += B.rvy * dt; B.rd -= Math.hypot(B.rvx, B.rvy) * dt; B.face = B.rvx < 0 ? -1 : 1;
      tilt = clamp(B.face * Math.atan2(B.rvy, Math.abs(B.rvx)), -0.9, 0.9);
      B.trail.push({ x:bcx, y:bcy, f:B.face, tilt, life:0.28 });
      if (Math.random() < 0.4) firePuff({ free:true, x:bcx - B.face * rand(12, 22), y:bcy + rand(-6, 6), vx:-B.rvx * 0.12, vy:-B.rvy * 0.12 - 40, g:-60, drag:0.25, life:rand(0.3, 0.45), dir:-B.face, sc:rand(0.4, 0.65) });
      if (Math.random() < 0.8) G.parts.push({ x:bcx - B.face * rand(10, 24), y:bcy + rand(-6, 6), vx:-B.rvx * 0.15, vy:-B.rvy * 0.15 + rand(-20, 20), life:0.4, max:0.4, c:Math.random() < 0.5 ? C.ember : C.flame, s:2, g:-20 });
      if (B.y + B.h >= floorY - 1) {
        // it hits the bridge and skids along it, scorching the planks
        B.y = floorY - B.h - 1; B.state = 'skid'; B.vx = (Math.sign(B.rvx) || B.face) * Math.max(120, Math.abs(B.rvx) * 0.9); B.t = 0.4; B.lastPx = -99;
        sfx('stomp'); sfx('wBurst'); dust(bcx, floorY, 14); heavyShake(9);
      } else if (B.x <= T + 1 || B.x >= rw - T - B.w - 1 || B.rd <= 0 || B.y < 2 * T) {
        B.state = 'recover'; B.t = B.rushLeft > 0 ? 0.3 : TUNE.recoverT * (p2 ? 0.8 : 1); B.vx = B.rvx * 0.3; B.vy2 = B.rvy * 0.2;
      }
      break; }
    case 'skid': fly = false; B.vx = approach(B.vx, 0, 700 * dt); B.y = floorY - B.h - 1; tilt = B.face * 0.15;
      if (Math.random() < 0.25) firePuff({ floor:true, x:bcx - B.face * 24, y:floorY - 8, vx:B.vx * 0.15, dir:-B.face, life:0.45, sc:rand(0.4, 0.6) });
      if (Math.random() < 0.7) G.parts.push({ x:bcx - B.face * 14, y:floorY - 1, vx:-B.vx * 0.3 + rand(-20, 20), vy:-rand(40, 120), life:0.35, max:0.35, c:Math.random() < 0.5 ? '#ffe08a' : C.ember, s:1, g:400 });
      if (Math.abs(bcx - B.lastPx) > 22) { const tl = tileAt(Math.floor(bcx / T), 13); if (tl === 1 || tl === 3) { G.puddles.push({ x:bcx - 10, y:floorY, w:20, life:1.5, max:1.5 }); B.lastPx = bcx; } }
      if (B.t <= 0) { B.state = 'recover'; B.t = B.rushLeft > 0 ? 0.3 : TUNE.recoverT * (p2 ? 0.8 : 1); B.vy2 = 0; }
      break;
    case 'recover':
      // spent: it labours back up on slow heavy beats, low enough to jump over
      fly = false; B.vx = approach(B.vx, 0, 300 * dt); B.vy2 = approach(B.vy2 || 0, -30, 200 * dt); B.y = Math.min(B.y + B.vy2 * dt, floorY - B.h - 1);
      tilt = -B.face * 0.12;
      if (B.t <= 0) { if (B.rushLeft > 0 && !gp) { B.rushLeft--; B.state = 'rushW'; B.t = B.wt = 0.4; B.y0 = B.y; sfx('mChit'); } else { B.state = 'fly'; B.atk = TUNE.mothGap * (p2 ? 0.8 : 1); } }
      break;
    case 'slashGo': {
      // it closes in at your height, wings drawn back
      const side = bcx < pcx ? -1 : 1, tx = clamp(pcx + side * 40, 2 * T, rw - 2 * T), ty = clamp(P.y + P.h / 2 - B.h / 2, 3 * T, floorY - B.h - 2);
      B.vx = clamp((tx - bcx) * 6, -340, 340); B.ty = ty; B.face = -side; tilt = clamp(B.vx / 500, -0.4, 0.4);
      if ((Math.abs(tx - bcx) < 10 && Math.abs(B.y - ty) < 10) || B.t <= 0) { B.state = 'slash'; B.st = 0; B.si = 0; B.vx = 0; }
      break; }
    case 'slash': {
      // three wing slashes; a green light flares on each just before it lands. Strike it while the light burns and the slash breaks.
      B.st += dt; const hits = mothSlashTimes(p2), Wn = TUNE.parryWin;
      B.vx = approach(B.vx, 0, 700 * dt); B.ty = clamp(P.y + P.h / 2 - B.h / 2, 3 * T, floorY - B.h - 2);
      if (B.si < 3 && B.st < hits[B.si] - 0.3) B.face = pcx < bcx ? -1 : 1;
      B.green = -1; for (let i = 0; i < 3; i++) if (B.st >= hits[i] - Wn && B.st < hits[i] + 0.04) B.green = i;
      if (B.green >= 0 && B.lastGreen !== B.green) { B.lastGreen = B.green; sfx(B.pfail ? 'clink' : 'gPing'); }
      if (B.si < 3 && B.st >= hits[B.si]) {
        B.vx = B.face * 180; sfx('mSlash'); B.slashFx = 0.16; B.slashN = B.si; heavyShake(B.si === 2 ? 8 : 5);
        const hb = { x:B.face > 0 ? bcx : bcx - 54, y:B.y - 16, w:54, h:B.h + 30 };
        if (!P.dead && overlap(P, hb)) hurtPlayer(1, bcx);
        B.si++;
      }
      if (B.st >= hits[2] + 0.4) { B.state = 'recover'; B.t = 0.45; B.vy2 = -10; B.green = -1; }
      break; }
    case 'stalk': B.vx = approach(B.vx, clamp((pcx - bcx) * 3.2, -230, 230), 600 * dt); B.ty = MOTH_CRUISE - 8; B.face = pcx < bcx ? -1 : 1; tilt = clamp(B.vx / 600, -0.25, 0.25);
      if (B.t <= 0) { B.state = 'slamW'; B.t = B.wt = p2 ? 0.3 : 0.38; sfx('mChit'); sfx('wHiss'); }
      break;
    case 'slamW': B.vx = approach(B.vx, 0, 900 * dt); B.ty = MOTH_CRUISE - 22;
      if (B.t <= 0) { B.state = 'slamDrop'; B.vy = 120; sfx('mRush'); }
      break;
    case 'slamDrop': fly = false; B.vx = 0; B.vy = Math.min(B.vy + 1600 * dt, 620); B.y += B.vy * dt;
      if (B.y + B.h >= floorY) {
        B.y = floorY - B.h; heavyShake(15); sfx('bslam'); sfx('stomp'); sfx('hit8'); dust(bcx, floorY, 22); G.hitstop = Math.max(G.hitstop, 0.06);
        burst(bcx, floorY - 2, 24, { spd:180, life:0.5, colors:[C.ember, C.flame, C.core], size:2, g:300, ang:-Math.PI / 2, spread:1.4 });
        for (const d of [-1, 1]) G.waves.push({ x:bcx - 6 + d * 18, y:floorY - 16, w:12, h:16, vx:d * (p2 ? 170 : 150), life:p2 ? 1.1 : 0.7, big:true });
        for (let i = 0; i < 6; i++) { const d = i % 2 ? 1 : -1; firePuff({ floor:true, x:bcx + d * 8, y:floorY - 8, vx:d * rand(80, 170), dir:d, life:rand(0.45, 0.7), sc:rand(0.6, 0.95) }); }
        sfx('waveFire'); B.state = 'perch'; B.t = TUNE.perchT * (p2 ? 0.8 : 1);
      }
      break;
    case 'rainW': B.vx = approach(B.vx, 0, 300 * dt); B.ty = MOTH_CRUISE - 16;
      if (B.t <= 0) {
        // scales fall in a spread with gaps you can stand in
        const gap0 = rand(3 * T, rw - 3 * T), gap1 = p2 ? -999 : rand(3 * T, rw - 3 * T), step = p2 ? 30 : 36;
        for (let x = 2 * T + rand(0, step); x < rw - 2 * T; x += step) {
          if (Math.abs(x - gap0) < 26 || Math.abs(x - gap1) < 22 || Math.abs(x - pcx) < 10 && Math.random() < 0.3) continue;
          G.drops.push({ x:x - 4, y:T + 1, w:8, h:12, vy:0, warn:0.45 + Math.abs(x - bcx) / rw * 0.4, big:true, puddle:false });
        }
        sfx('flare'); G.shake = Math.max(G.shake, 4); B.state = 'fly'; B.atk = TUNE.mothGap * (p2 ? 0.87 : 1.2);
      }
      break;
    case 'callW': B.vx = approach(B.vx, 0, 300 * dt);
      if (B.t <= 0) {
        const k = Math.min(TUNE.minis + (p2 ? 1 : 0), TUNE.miniMax - minis);
        for (let i = 0; i < k; i++) { const m = mkCinderMoth(bcx + (i - (k - 1) / 2) * 14, B.y + B.h); G.enemies.push(m); }
        burst(bcx, B.y + B.h / 2, 20, { spd:140, life:0.5, colors:[C.flame, C.ember, C.wax], size:2, g:0 });
        G.fx.push({ k:'ring', x:bcx, y:B.y + B.h / 2, t:0.35, max:0.35, r:36, c:'255,170,90' }); sfx('chime'); sfx('mFlap');
        B.state = 'fly'; B.atk = TUNE.mothGap * (p2 ? 0.93 : 1.27);
      }
      break;
    case 'sweepGo': {
      B.ty = B.lane - B.h - 3; B.vx = clamp((B.sx0 - bcx) * 4, -280, 280); B.face = B.vx < 0 ? -1 : 1; tilt = clamp(B.vx / 600, -0.35, 0.35);
      if (Math.abs(B.sx0 - bcx) < 6 && Math.abs(B.y - B.ty) < 4) { B.state = 'sweepW'; B.t = B.wt = p2 ? 0.6 : 0.8; B.vx = 0; sfx('tCross'); }
      break; }
    case 'sweepW': B.vx = 0; B.ty = B.lane - B.h - 3; B.face = B.sdir; tilt = -B.sdir * 0.2; if (B.t <= 0) { B.state = 'sweep'; B.trail = []; sfx('mShriek'); sfx('waveFire'); G.shake = Math.max(G.shake, 4); } break;
    case 'sweep': {
      B.vx = B.sdir * (p2 ? 300 : 250); B.ty = B.lane - B.h - 3; B.face = B.sdir; tilt = B.sdir * 0.15;
      B.trail.push({ x:bcx, y:bcy, f:B.face, tilt, life:0.22 });
      if (Math.random() < 0.3) firePuff({ free:true, x:bcx - B.face * rand(12, 22), y:bcy + rand(-4, 4), vx:-B.vx * 0.1, vy:-40, g:-60, drag:0.25, life:rand(0.3, 0.4), dir:-B.face, sc:rand(0.4, 0.6) });
      // it leaves flame on whatever it skims
      if (Math.abs(bcx - B.lastPx) > 20) { const tl = tileAt(Math.floor(bcx / T), Math.floor(B.lane / T)); if (tl === 1 || tl === 3) { G.puddles.push({ x:bcx - 10, y:B.lane, w:20, life:2.2, max:2.2 }); B.lastPx = bcx; } }
      if ((B.sdir > 0 && bcx >= rw - 2 * T - B.w / 2) || (B.sdir < 0 && bcx <= 2 * T + B.w / 2)) {
        if (p2 && !B.second && !gp) { B.second = true; const lanes = mothLanes(), i = lanes.indexOf(B.lane), j = i <= 0 ? 1 : i >= lanes.length - 1 ? i - 1 : i + (Math.random() < 0.5 ? -1 : 1); mothSweepSetup(B, lanes[j], -B.sdir); B.state = 'sweepW'; B.t = B.wt = 0.5; }
        else { B.state = 'land'; B.vy = 0; B.dir = -B.sdir; }
      }
      break; }
    case 'fall': fly = false; B.vx = approach(B.vx, 0, 200 * dt); B.vy = Math.min((B.vy || 0) + 900 * dt, 420); B.y += B.vy * dt; tilt = B.face * 0.5;
      if (B.y + B.h >= floorY) {
        B.y = floorY - B.h; B.vy = 0; B.state = 'stun'; B.t = TUNE.stunT; heavyShake(12); sfx('bslam'); dust(bcx, floorY, 18);
        burst(bcx, floorY - 4, 20, { spd:160, life:0.6, colors:[C.ember, C.flame, '#6b6f7a'], size:2, g:300, ang:-Math.PI / 2, spread:1.2 });
        waxBit(bcx + rand(-14, 14), floorY - 14, null, -rand(150, 200));
      }
      break;
    case 'stun': fly = false; B.vx = 0; B.y = floorY - B.h;
      if (Math.random() < 0.2) burst(bcx + rand(-14, 14), B.y + 2, 1, { spd:20, life:0.8, colors:['#6b6f7a'], size:2, g:-40 });
      if (B.t <= 0) { B.state = 'rise'; sfx('mFlap'); sfx('mShriek'); }
      break;
    case 'land': fly = false; B.vx = approach(B.vx, 0, 600 * dt); B.vy = Math.min((B.vy || 0) + 700 * dt, 380); B.y += B.vy * dt;
      if (B.y + B.h >= floorY) { B.y = floorY - B.h; B.vy = 0; B.state = 'perch'; B.t = TUNE.perchT * (p2 ? 0.8 : 1); sfx('stomp'); dust(bcx, floorY, 10); G.shake = Math.max(G.shake, 4); }
      break;
    case 'perch': fly = false; B.vx = 0; B.y = floorY - B.h;
      if (Math.random() < 0.3) G.parts.push({ x:bcx + rand(-20, 20), y:B.y + rand(0, 6), vx:rand(-6, 6), vy:rand(-30, -10), life:0.6, max:0.6, c:'#8c8f99', s:1, g:-20 });
      if (B.t <= 0) { B.state = 'rise'; sfx('mFlap'); }
      break;
    case 'rise': B.vx = 0; B.ty = MOTH_CRUISE; if (Math.abs(B.y - B.ty) < 4) { B.state = 'fly'; B.atk = 0.9; } break;
    case 'dead': fly = false; B.vx = 0; B.y = floorY - B.h;
      if (Math.random() < 0.6) burst(bcx + rand(-14, 14), B.y + rand(0, B.h), 2, { spd:90, life:0.7, colors:[C.ember, C.flame, C.core], size:2, g:-60 });
      if (B.t <= 0) {
        burst(bcx, B.y + B.h / 2, 60, { spd:220, life:1.1, colors:[C.ember, C.flame, '#e8c25a', C.core], size:3, g:200 });
        G.boss = null; G.bossDown = true; setDoor(false); sfx('kill'); toast('The Cinder Moth burns out.', 3000);
        for (const e of G.enemies) if (e.cinder) e.dead = true;
        kilnForge();
      }
      return;
  }
  B.tilt = approach(B.tilt || 0, tilt, (B.state === 'rush' ? 8 : 3) * dt);
  if (B.slashFx > 0) B.slashFx -= dt;
  B.twT = (B.twT == null ? 1 : B.twT) - dt; if (B.twT <= 0) { B.twT = rand(0.5, 1.6); B.tw = 0.12; B.twA = rand(-0.55, 0.55); } if (B.tw > 0) B.tw -= dt;
  if (fly) { B.x = clamp(B.x + B.vx * dt, T, rw - T - B.w); B.y = approach(B.y, B.ty, (B.state === 'sweepGo' || B.state === 'rise' || B.state === 'hatch' || B.state === 'stalk' ? 200 : B.state === 'slashGo' || B.state === 'slash' ? 260 : 120) * dt); }
  else B.x = clamp(B.x + B.vx * dt, T, rw - T - B.w);
  if (P.dead) return;
  // the stun: a Wax Dive onto its back
  if (P.dive && P.vy > 0 && B.cap >= 1 && !['stun', 'fall', 'dead', 'downed', 'hatch'].includes(B.state) && P.y + P.h <= B.y + 12 && overlap(P, { x:B.x - 8, y:B.y - 8, w:B.w + 16, h:B.h + 4 })) {
    kinDiveHit(B, bcx, B.y + 2);
    B.state = 'fall'; B.vy = 40; B.vx *= 0.3; B.cap = 0; B.trail = [];
    for (let i = 0; i < 14; i++) G.parts.push({ x:bcx + rand(-12, 12), y:B.y + rand(0, 4), vx:rand(-90, 90), vy:rand(-160, -60), life:rand(0.6, 1), max:1, c:i % 3 ? C.wax : C.waxHi, s:Math.random() < 0.5 ? 3 : 2, g:500 });
    hitEnemy(B, skDmg('dive'), { spell:true, dir:B.face, x:bcx, y:B.y + 4 });
    return;
  }
  if (!P.dive && P.vy > 0 && B.cap >= 1 && !['stun', 'fall', 'dead', 'downed'].includes(B.state) && P.x + P.w > B.x + 8 && P.x < B.x + B.w - 8 && P.y + P.h >= B.y - 4 && P.y + P.h <= B.y + 8) { kinBounce(B, bcx, B.y); return; }
  if (!P.dive && !['stun', 'fall', 'dead', 'downed', 'hatch', 'land', 'perch'].includes(B.state) && overlap(P, { x:B.x + 6, y:B.y + 6, w:B.w - 12, h:B.h - 6 })) hurtPlayer(1, bcx);
}
function mothSlashTimes(p2) { return p2 ? [0.5, 0.88, 1.2] : [0.6, 1.05, 1.42]; }
// a melee hit on the moth during its triple slash: struck while the green light burns, the slash breaks and it drops stunned.
// Only the first strike counts; strike at the wrong moment and the lights go red.
function mothParry(B, o) {
  const bcx = B.x + B.w / 2, bcy = B.y + B.h / 2;
  if (B.pfail || B.green < 0) { B.pfail = true; kinDeflect(B, o); return; }
  G.hitstop = Math.max(G.hitstop, 0.24); G.shake = Math.max(G.shake, 12); screenFlash(0.6, 0.2, '150,255,170'); sfx('counter'); sfx('crack'); buzz([40, 30, 120]);
  burst(bcx, bcy, 34, { spd:230, life:0.6, colors:['#7dffa0', '#e8fff0', '#ffffff', C.ember], size:2, g:200 });
  G.fx.push({ k:'ring', x:bcx, y:bcy, t:0.45, max:0.45, r:64, c:'150,255,170' }); G.fx.push({ k:'star', x:bcx, y:bcy, t:0.16, max:0.16, n:10, r:26, rot:rand(0, TAU) });
  B.state = 'fall'; B.vy = -150; B.vx = Math.sign(bcx - (P.x + P.w / 2)) * 140; B.cap = 0; B.trail = []; B.green = -1; B.flash = 0.12;
  P.recoilT = 0.15; P.recoilV = -P.face * 160;
}
// after the moth, a blacksmith climbs down from the kiln mouth and forges Flare Burst for free
// ----- the end of chapter 3: the abyss
// After Flare Burst is forged, a blue vortex tears open over the cold kiln. Walk into it: it pulls the hero in,
// the screen goes black, "To be continued..." is written out, and then the results come up.
// the smith's last gift opens the abyss; a tip on screen (the new skill) holds it until it is closed
function openAbyssAfterTip() { if (G.state === 'tip') setTimeout(openAbyssAfterTip, 300); else openAbyss(); }
function openAbyss() {
  if (!G.room || G.room.def.id !== 'kiln' || G.abyss || G.state !== 'play') return;
  G.abyss = { x:Math.round(G.room.w * T / 2), y:13 * T - 36, t:0, open:0, in:null, gone:false, ps:[], hum:0, said:false };
  // the secret: clear the whole chapter without falling and a black crack opens in the air beside the abyss, a jump up
  if (!G.deaths && !G.duel && !G.gal) G.abyss.crack = { x:G.abyss.x + 84, y:13 * T - 58, t:0, open:0, ps:[] };
  sfx('abyssOpen'); heavyShake(8); screenFlash(0.35, 0.25, '80,160,255'); buzz([40, 30, 80]);
  setTimeout(() => toast(tip('The abyss has opened. Walk into it.', 'The abyss has opened. Walk into it.'), 4200), 900);
}
function updateAbyss(dt) {
  const A = G.abyss; if (!A) return;
  A.t += dt; A.open = Math.min(1, A.t / 1.4);
  const k = A.open, ease = 1 - Math.pow(1 - k, 3);
  // motes drift in from all around and spiral down the throat
  if (Math.random() < dt * (14 + 30 * ease)) { const a = rand(0, TAU); A.ps.push({ a, r:rand(46, 78), w:rand(2.2, 3.6) * (Math.random() < 0.5 ? 1 : 1), s:Math.random() < 0.3 ? 2 : 1, c:Math.random() < 0.35 ? '#9fdcff' : '#3b9cf0' }); }
  for (const m of A.ps) { m.r -= dt * (22 + 60 / Math.max(6, m.r) * 10); m.a += dt * m.w * (40 / Math.max(10, m.r)); }
  A.ps = A.ps.filter(m => m.r > 3);
  A.hum -= dt; if (A.hum <= 0 && A.in == null) { A.hum = 1.6; sfx('abyssHum'); }
  const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2, K = A.crack;
  if (K) {
    K.t += dt; const was = K.open; K.open = clamp((K.t - 1.8) / 1.4, 0, 1);
    if (was <= 0 && K.open > 0) { sfx('crackOpen'); G.shake = Math.max(G.shake, 3); }
    if (K.open > 0 && Math.random() < dt * 20 * K.open) { const a = rand(0, TAU); K.ps.push({ a, r:rand(18, 34), w:rand(2, 3.4) * (Math.random() < 0.5 ? 1 : -1) }); }
    for (const m of K.ps) { m.r -= dt * 26; m.a += dt * m.w; } K.ps = K.ps.filter(m => m.r > 2);
    if (K.open > 0.3 && Math.random() < dt * 4) darkFlames(K.x, K.y + rand(-10, 10), 1, { w:2, sc:0.5, up:0.6 });
    if (A.crackIn != null) {
      A.crackIn += dt; P.vx = 0; P.vy = 0; P.inv = 9; P.x += (K.x - P.w / 2 - P.x) * Math.min(1, dt * 8); P.y += (K.y - P.h / 2 - P.y) * Math.min(1, dt * 8);
      if (A.crackIn > 1.9 && !A.crackGone) { A.crackGone = true; earn('crack'); startRun('duel'); G.blackIn = G.blackInMax = 1.8; }
      return;
    }
    if (K.open >= 1 && A.in == null && !P.dead && Math.abs(pcx - K.x) < 9 && Math.abs(pcy - K.y) < 16) {
      A.crackIn = 0; sfx('uIntro'); sfx('uBurn'); heavyShake(9); G.hitstop = 0.08; screenFlash(0.5, 0.25, '200,20,30'); buzz([40, 30, 90]);
      darkFlames(K.x, K.y, 14, { w:8, sc:1.1, spread:0.2 }); for (const e of G.enemies) e.dead = true;
      return;
    }
  }
  if (A.in == null) {
    // a gentle pull once it is fully open
    if (k >= 1 && !P.dead) { const dx = A.x - pcx; if (Math.abs(dx) < 70) P.x += Math.sign(dx) * dt * 18 * (1 - Math.abs(dx) / 70); }
    if (k >= 1 && !P.dead && Math.abs(pcx - A.x) < 14 && pcy > A.y - 34 && pcy < A.y + 40) {
      A.in = 0; A.px = P.x; A.py = P.y; sfx('abyssIn'); G.hitstop = 0.06; buzz([30, 20, 60]);
      for (const e of G.enemies) e.dead = true;
    }
    return;
  }
  A.in += dt; const u = A.in;
  P.vx = 0; P.vy = 0; P.inv = 9;
  if (!A.gone) {
    const q = Math.min(1, u / 0.75), e = q * q;
    P.x = A.px + (A.x - P.w / 2 - A.px) * e; P.y = A.py + (A.y - P.h / 2 - A.py) * e;
    if (q >= 1) {
      A.gone = true; heavyShake(10); screenFlash(0.8, 0.35, '120,190,255'); sfx('abyssGulp');
      burst(A.x, A.y, 40, { spd:160, life:0.7, colors:['#e8f6ff', '#9fdcff', '#3b9cf0', '#1d5fa3'], size:2, g:0 });
    }
  }
  if (u > 10.8 && G.state === 'play') { G.state = 'won'; setOverlay('won'); }
}
// the vortex: pixel by pixel, an oval eye of blue bands winding into a dark throat, with bright arcs skating round the rim
const ABYSS_PAL = ['#061026', '#0a2350', '#0f3a7a', '#1856aa', '#2270cc', '#2e8ae4', '#47aaf7'];
function drawAbyss(cx0, t) {
  const A = G.abyss; if (!A || A.open <= 0) return;
  const k = A.open, ease = 1 - Math.pow(1 - k, 3), pulse = 1 + 0.03 * Math.sin(t * 5);
  const rx = 20 * ease * pulse * (A.gone ? 1 + Math.min(0.15, (A.in - 0.75) * 0.3) : 1), ry = 34 * Math.min(1, k * 1.6) * pulse;
  const cx = A.x - cx0, cy = A.y;
  if (rx < 0.8) { ctx.fillStyle = '#9fdcff'; ctx.fillRect(Math.round(cx), Math.round(cy - ry), 1, Math.round(ry * 2)); return; }   // a hairline crack first
  const spin = t * 2.4, ox = rx * 0.28;                                            // the throat sits a little right of centre, like a turning eye
  const x0 = Math.floor(-rx - 4), x1 = Math.ceil(rx + 4), y0 = Math.floor(-ry - 4), y1 = Math.ceil(ry + 4);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const nx = x / rx, ny = y / ry, r = Math.sqrt(nx * nx + ny * ny), a = Math.atan2(ny, nx);
    const edge = 1 + 0.07 * Math.sin(a * 5 + spin * 1.3) + 0.05 * Math.sin(a * 11 - spin * 2);   // ragged rim
    if (r > edge) continue;
    // distance from the off-centre throat sets the depth band; a spiral term twists the bands
    const tx = (x - ox * (1 - r)) / rx, d = Math.min(1, Math.sqrt(tx * tx + ny * ny));
    const sw = Math.sin(a * 2 + d * 9 - spin * 3);
    let band = Math.floor(d * 6.2 + sw * 0.7); band = Math.max(0, Math.min(6, band));
    if (r > edge - 0.12) band = 6;                                                 // the bright lip
    else if (r > edge - 0.24 && sw > 0.55) band = Math.min(6, band + 1);
    ctx.fillStyle = ABYSS_PAL[band]; ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }
  // arcs of light skating round the rim and flicking off it
  for (let i = 0; i < 4; i++) {
    const a0 = spin * (i % 2 ? -1.1 : 1.3) + i * 1.7, len = 0.9 + 0.3 * Math.sin(t * 2 + i);
    for (let j = 0; j < 14; j++) {
      const a = a0 + (j / 14) * len, rr = 1.04 + 0.06 * Math.sin(j * 0.8 + i);
      ctx.fillStyle = j > 10 ? '#9fdcff' : '#5fc0ff';
      ctx.fillRect(Math.round(cx + Math.cos(a) * rx * rr), Math.round(cy + Math.sin(a) * ry * rr), j > 11 ? 1 : 2, j > 11 ? 1 : 2);
    }
  }
  for (const m of A.ps) { ctx.fillStyle = m.c; ctx.globalAlpha = Math.min(1, m.r / 20); ctx.fillRect(Math.round(cx + Math.cos(m.a) * m.r * 0.62), Math.round(cy + Math.sin(m.a) * m.r), m.s, m.s); }
  ctx.globalAlpha = 1;
  // while being swallowed: the hero shrinks and spins into the eye
  if (A.in != null && !A.gone) {
    const q = Math.min(1, A.in / 0.75), sc = 1 - q * 0.9;
    ctx.save(); ctx.translate(Math.round(P.x + P.w / 2 - cx0), Math.round(P.y + P.h / 2)); ctx.rotate(q * q * 9); ctx.scale(sc, sc);
    ctx.translate(-Math.round(P.x + P.w / 2 - cx0), -Math.round(P.y + P.h / 2)); ctx.globalAlpha = 1 - q * 0.4;
    A.drawing = true; drawPlayer(cx0, t); A.drawing = false; ctx.restore(); ctx.globalAlpha = 1;
  }
  if (A.crack && A.crack.open > 0) drawBlackCrack(A.crack, cx0, t);
  if (A.open < 1 && A.t < 1.5) { ctx.fillStyle = `rgba(160,220,255,${0.5 * (1 - A.open)})`; ctx.fillRect(Math.round(cx - 1), Math.round(cy - ry - 6), 2, Math.round(ry * 2 + 12)); }
}
// the end card: the screen sinks to black, "To be continued" is written out, and the dots keep breathing
