// ---------- Characters (Beta): every foe and boss, posed live by the game's own drawing code.
// Each pose is a short scripted loop (tell, then the move), so the sheet always matches what the game draws.
const CS_GROUPS = [['heroes', 'Heroes'], ['foes', 'Foes'], ['bosses', 'Bosses']];
const BFY = 13 * T, BCX = 88, BTOP = BFY - 92;      // world floor, stage centre, world y at the top of the stage
const bWalk = (t, v, a, b) => { const span = b - a, u = (t * v) % (span * 2); return u < span ? { x:a + u, dir:1 } : { x:b - (u - span), dir:-1 }; };
const bHit = (t, every) => (t % every) < 0.12 ? 0.1 : 0;
function bCeil() { ctx.fillStyle = '#10161c'; ctx.fillRect(0, BTOP - 8, 176, 10); ctx.fillStyle = '#26323c'; ctx.fillRect(0, BTOP + 2, 176, 1); }
function bPuffs(x, y, t, n, col, rise) {   // a soft rising trail of smoke or embers
  for (let k = 0; k < n; k++) { const a = (t * 1.1 + k / n) % 1; ctx.globalAlpha = (1 - a) * 0.55; ctx.fillStyle = col; ctx.fillRect(Math.round(x + Math.sin(k * 2.3 + t) * 4), Math.round(y - a * rise), 2, 2); }
  ctx.globalAlpha = 1;
}
function bPop(x, y, s, cols) {             // a death burst, frozen at s seconds in
  if (s < 0 || s > 0.6) return; const k = 1 - s / 0.6;
  for (let i = 0; i < 14; i++) { const a = i * 0.45, d = 6 + s * 60; ctx.globalAlpha = k; ctx.fillStyle = cols[i % cols.length]; ctx.fillRect(Math.round(x + Math.cos(a) * d), Math.round(y + Math.sin(a) * d + s * s * 80), 2, 2); }
  ctx.globalAlpha = 1;
}
const BEAST = {
  mite:{ name:'Wax Mite', tag:'Crawler', ch:1, hp:3, spd:'32 px/s', view:'near',
    where:'Wickhollow, The Drip, Lamplit Locks, Drowned Foundry, Mothlight Burrows',
    blurb:'A tallow tick that walks a ledge end to end and turns back at every drop.',
    tell:'None. It never changes pace, so read its path.', beat:'Slash it, or bounce on it with a down-slash.',
    anims:[['walk', 'Patrol'], ['hit', 'Struck']],
    pose(a, t) { const w = bWalk(t, 32, 52, 110); drawCrawler({ x:w.x, y:BFY - 10, w:14, h:10, dir:w.dir, anim:t, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0); } },
  brass:{ name:'Brass Mite', tag:'Armoured crawler', ch:2, hp:4, spd:'24 px/s', view:'near',
    where:'Drowned Foundry, The Kiln Stair',
    blurb:'A mite under a bronze shell, with a heavy plate on the side it walks toward.',
    tell:'The bright plate always faces the way it is walking.', beat:'Blades bounce off the plate. Hit it from behind, down-slash on top, or crack the shell with a skill.',
    anims:[['walk', 'Patrol'], ['hit', 'Struck']],
    pose(a, t) { const w = bWalk(t, 24, 52, 110); drawCrawler({ x:w.x, y:BFY - 10, w:14, h:10, dir:w.dir, anim:t, armor:true, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0); } },
  flyer:{ name:'Cave Moth', tag:'Flyer', ch:1, hp:2, spd:'46 px/s', view:'near',
    where:'Wickhollow, The Drip, Lamplit Locks, Drowned Foundry, Mothlight Burrows, The Kiln Stair',
    blurb:'Hovers near its roost and flutters at you once you come close.',
    tell:'It starts drifting toward you from about eight tiles away.', beat:'Up-slash as it dips in, or let it come down to you.',
    anims:[['fly', 'Hover'], ['hit', 'Struck']],
    pose(a, t) { drawFlyer({ x:BCX - 6 + Math.sin(t * 1.3) * 22, y:BFY - 40 + Math.sin(t * 4) * 8, w:12, h:10, t, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0, t); } },
  spitter:{ name:'Wax Spitter', tag:'Turret', ch:2, hp:3, spd:'Never moves', view:'wide',
    where:'Lamplit Locks, Drowned Foundry, The Kiln Stair',
    blurb:'A squat pot that lobs molten wax at the spot where you are standing.',
    tell:'Its spout glows orange half a second before it spits.', beat:'Step away when it glows; the glob lands where you were. Close in between shots.',
    anims:[['spit', 'Spit'], ['hit', 'Struck']],
    pose(a, t) {
      const c = t % 2.4, x = 40, y = BFY - 12;
      drawSpitter({ x, y, w:12, h:12, face:1, charge:c > 1.9, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0, t);
      if (c < 0.85) { const x0 = x + 11, y0 = y + 3, tx = 140, ty = BFY - 6, tf = 0.85, g = 520, vx = (tx - x0) / tf, vy = (ty - y0 - 0.5 * g * tf * tf) / tf;
        G.shots = [{ x:x0 + vx * c - 3, y:y0 + vy * c + 0.5 * g * c * c - 3, w:6, h:6 }]; drawHazards(0, t); G.shots = []; }
      else bPop(140, BFY - 4, c - 0.85, [C.ember, C.flame, C.core]);
    } },
  wickling:{ name:'Wickling', tag:'Summoned', ch:2, hp:1, spd:'50 px/s', view:'near',
    where:'Chandler’s Hall, called down by the Hanging Chandler',
    blurb:'A runaway candle stub with legs. It chases you and does not stop at edges.',
    tell:'Pale blobs bulge from the Chandler’s body just before they drop.', beat:'One hit. Clear them quickly so they do not crowd your dodges.',
    anims:[['run', 'Chase'], ['hit', 'Struck']],
    pose(a, t) { const w = bWalk(t, 50, 50, 116); drawCrawler({ wickling:true, x:w.x, y:BFY - 12, w:10, h:12, dir:w.dir, anim:t, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0); } },
  cinderling:{ name:'Cinderling', tag:'Summoned', ch:3, hp:1, spd:'62–120 px/s', view:'near',
    where:'The Kiln Pit, called by the Cinder Moth; now and then inside a cocoon',
    blurb:'A small burning moth that darts at you in short bursts.',
    tell:'It slows down for a moment between darts.', beat:'One hit. Swing as it slows.',
    anims:[['fly', 'Dart'], ['hit', 'Struck']],
    pose(a, t) { const c = t % 2.2, fast = c > 1.2, u = fast ? 1.2 + (c - 1.2) * 2 : c; drawCinderMoth({ x:BCX - 5 + Math.sin(u * 1.6) * 30, y:BFY - 36 + Math.sin(u * 4) * 10, w:10, h:8, t, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0, t); } },
  cocoon:{ name:'Wax Cocoon', tag:'Wax source', ch:3, hp:2, spd:'Never moves', view:'near',
    where:'Mothlight Burrows, The Kiln Stair',
    blurb:'A pale cocoon hanging on a thread. It never attacks.',
    tell:'It sways when you brush past.', beat:'Cut it open for wax. Sometimes a Cinderling is still inside.',
    anims:[['hang', 'Hang'], ['hit', 'Struck']],
    pose(a, t) { const s = t % 1.6, wob = a === 'hit' ? Math.exp(-s * 3) * Math.sin(s * 14) * 0.5 : 0; drawCocoon({ x:BCX - 5, y:BFY - 52, w:10, h:16, t:0, wob, flash:a === 'hit' ? bHit(t, 1.6) : 0 }, 0, t); } },
  dripmite:{ name:'Drip Mite', tag:'Ambusher', ch:1, hp:2, spd:'44 px/s', view:'wide', ceil:true,
    where:'Wickhollow, The Drip',
    blurb:'Clings upside down to the ceiling and waits for you to walk underneath.',
    tell:'A single bead of wax drips first. Then it lets go.', beat:'Step back when the drip falls, then slash it as it lands.',
    anims:[['drop', 'Drop and chase'], ['hit', 'Struck']],
    pose(a, t) {
      const c = t % 3.6, x0 = BCX - 30, e = { type:'dripmite', x:x0, y:BTOP + 4, w:10, h:8, dir:1, anim:t, st:'hang', flash:a === 'hit' ? bHit(t, 1.2) : 0 };
      if (c >= 1 && c < 1.55) { e.st = 'warn'; e.anim = c * 3; const s = c - 1; G.drips = [{ x:x0 + 5, y:Math.min(BFY, BTOP + 12 + 350 * s * s) }]; drawDrips(0); G.drips = []; }
      else if (c >= 1.55 && c < 1.95) { e.st = 'fall'; const s = c - 1.55; e.y = Math.min(BFY - 8, BTOP + 4 + 525 * s * s); }
      else if (c >= 1.95) { e.st = 'walk'; e.y = BFY - 8; e.x = x0 + (c - 1.95) * 44; }
      drawFoe(e, 0, t);
    } },
  wisp:{ name:'Smoke Wisp', tag:'Drifter', ch:1, hp:1, spd:'24 px/s', view:'near',
    where:'Wickhollow, The Drip',
    blurb:'A slow knot of smoke that drifts toward you through walls of air.',
    tell:'It leaves a grey trail and bobs as it comes.', beat:'One hit kills it. A touch costs an ember and clouds your view for a moment.',
    anims:[['drift', 'Drift'], ['hit', 'Struck']],
    pose(a, t) {
      const x = BCX - 5 + Math.sin(t * 0.9) * 24, y = BFY - 38 + Math.sin(t * 2.4) * 6;
      if (a === 'hit') { const c = t % 2; if (c < 0.6) { bPop(x + 5, y + 5, c, ['#8c8f99', '#5f626b', '#c9ccd4']); return; } ctx.globalAlpha = Math.min(1, (c - 0.6) * 3); }
      bPuffs(x + 4, y + 8, t, 8, '#8c8f99', 14); drawFoe({ type:'wisp', x, y, w:10, h:10, t, flash:0 }, 0, t); ctx.globalAlpha = 1;
    } },
  eel:{ name:'Wick Eel', tag:'Pit lurker', ch:2, hp:2, spd:'Leaps', view:'wide', pit:true,
    where:'Lamplit Locks',
    blurb:'Hides under the surface of a spine pit and leaps out in an arc when you cross.',
    tell:'Bubbles and a widening ripple mark where it will rise.', beat:'Wait out the leap, or slash it at the top of the arc.',
    anims:[['leap', 'Leap'], ['hit', 'Struck']],
    pose(a, t) {
      const c = t % 2.8, hx = BCX - 34, e = { type:'eel', st:'lurk', t:0, hx, x:hx - 7, y:BFY + 12, w:14, h:8, vx:70, vy:0, flash:a === 'hit' ? bHit(t, 1.2) : 0 };
      if (c >= 0.7 && c < 1.3) { e.st = 'bubble'; e.t = 1.3 - c; for (let i = 0; i < 4; i++) { const u = ((c * 3 + i * 0.27) % 1); ctx.fillStyle = '#9fdcf0'; ctx.fillRect(Math.round(hx - 5 + i * 3), Math.round(BFY + 2 - u * 10), 1, 1); } }
      else if (c >= 1.3) { const s = c - 1.3; if (s < 1.06) { e.st = 'leap'; e.x = hx - 7 + 70 * s; e.y = BFY - 360 * s + 350 * s * s; e.vy = -360 + 700 * s; } else bPop(hx + 74, BFY + 1, s - 1.06, ['#9fdcf0', '#2f78a8']); }
      drawFoe(e, 0, t);
    } },
  puppet:{ name:'Hook Puppet', tag:'Swinger', ch:2, hp:2, spd:'Swings', view:'wide', ceil:true,
    where:'Lamplit Locks, Drowned Foundry',
    blurb:'A wooden puppet on a chain, swinging forever across a corridor.',
    tell:'The chain creaks at the end of each swing, just before it comes back.', beat:'Pass under it on the creak, or break it with two hits.',
    anims:[['swing', 'Swing'], ['hit', 'Struck']],
    pose(a, t) {
      const ang = 0.9 * Math.cos(t * 1.9), len = 76, ax = BCX, ay = BTOP + 2, e = { type:'puppet', ax, ay, len, ang, w:12, h:14, flash:a === 'hit' ? bHit(t, 1.2) : 0 };
      e.x = ax + Math.sin(ang) * len - 6; e.y = ay + Math.cos(ang) * len - 7;
      const cr = Math.abs(Math.sin(t * 1.9)); if (cr < 0.2) { ctx.fillStyle = `rgba(239,227,194,${1 - cr * 5})`; for (const d of [-1, 1]) { ctx.fillRect(ax + d * 4, ay + 2, d, 1); ctx.fillRect(ax + d * 6, ay + 4, d, 1); } }
      drawFoe(e, 0, t);
    } },
  slag:{ name:'Slag Crawler', tag:'Armoured crawler', ch:3, hp:4, spd:'22 px/s', view:'wide',
    where:'Mothlight Burrows, The Kiln Stair',
    blurb:'A slow lump of cooling slag with a plated face, leaving a burning trail.',
    tell:'The plate faces the way it walks; the burning slag behind it fades after a couple of seconds.', beat:'Strike it from behind or from above, or crack the plate with a skill. Do not chase it through its own trail.',
    anims:[['walk', 'Crawl'], ['hit', 'Struck']],
    pose(a, t) {
      const c = t % 6, x = 24 + c * 22, pd = [];
      for (let k = 1; 24 + k * 18 <= x; k++) { const px = 24 + k * 18, age = c - (px - 24) / 22, life = 2.4 - age; if (life > 0) pd.push({ x:px + 8 - 9 - 8, y:BFY, w:18, life, max:2.4, slag:true }); }
      G.puddles = pd; drawHazards(0, t); G.puddles = [];
      drawFoe({ type:'slag', x, y:BFY - 10, w:16, h:10, dir:1, anim:t, armor:true, flash:a === 'hit' ? bHit(t, 1.2) : 0 }, 0, t);
    } },
  swarm:{ name:'Ash Moth Swarm', tag:'Swarm', ch:3, hp:'1 × 5', spd:'34 px/s', view:'wide',
    where:'Mothlight Burrows, The Kiln Stair',
    blurb:'Five small ash moths circling in a tight ring that drifts toward you.',
    tell:'Strike one and the rest scatter for a second, then fly back into the ring.', beat:'Swing into the ring; a single slash can catch several.',
    anims:[['circle', 'Circle'], ['hit', 'Scatter']],
    pose(a, t) {
      const c = t % 2.6, gx = BCX + Math.sin(t * 0.6) * 20, gy = BFY - 46;
      for (let k = 0; k < 5; k++) {
        const ring = tt => { const an = tt * 2.2 + k * (TAU / 5), r = 16 + Math.sin(tt * 1.7 + k) * 3; return [gx + Math.cos(an) * r, gy + Math.sin(an) * r * 0.6]; };
        let [x, y] = ring(t);
        if (a === 'hit' && c > 0.4) {
          if (k === 0 && c < 1.9) { if (c < 1) bPop(x + 3, y + 3, c - 0.4, ['#6b6f7a', '#a8acb6', '#e2553f']); continue; }
          const s = c - 0.4, an = k * 2.4 + 0.7, d = 70 * (1 - Math.exp(-2 * Math.min(s, 1.1))), back = clamp((s - 1.1) / 0.5, 0, 1), e2 = back * back * (3 - 2 * back);
          x += Math.cos(an) * d * (1 - e2); y += Math.sin(an) * d * 0.8 * (1 - e2);
        }
        drawFoe({ type:'ashmoth', k, x:x - 3, y:y - 3, w:7, h:6, flash:a === 'hit' && k === 0 && c > 0.35 && c < 0.4 ? 0.1 : 0 }, 0, t);
      }
    } },
  warden:{ name:'Tallow Warden', tag:'Chapter 1 boss', ch:1, hp:32, boss:true, room:0, gal:'warden', view:'wide', wall:true,
    where:'Cinder Chamber',
    blurb:'A hulking block of tallow with three wicks, guarding the last warm flame.',
    moves:'Leap, which lands with a shockwave in phase two · Charge, which slams it into the wall · Drip, which shakes wax down from the ceiling.',
    tell:'It shudders and its eyes burn ember red before every attack.', beat:'Dodge the charge so it hits the wall, then punish it while it is dazed. Below half health its flames grow and it moves faster.',
    anims:[['idle', 'Idle'], ['leap', 'Leap'], ['charge', 'Charge'], ['drip', 'Drip'], ['p2', 'Phase two']],
    pose(a, t) {
      const B = Object.assign(mkBoss(0, 0), { x:BCX - 17, y:BFY - 30, state:'idle', anim:t, face:-1 });
      if (a === 'p2') B.hp = 14;
      if (a === 'leap') { const c = t % 2.4; B.x = 30; B.face = 1;
        if (c < 0.52) Object.assign(B, { state:'windup', next:'leap' });
        else if (c < 1.15) { const s = c - 0.52; B.state = 'leap'; B.x = 30 + 80 * s / 0.63; B.y = Math.min(BFY - 30, BFY - 30 - (330 * s - 525 * s * s)); }
        else { B.x = 110; const s = c - 1.15; if (s < 0.4) G.fx = [{ k:'ring', x:127, y:BFY - 2, t:0.4 - s, max:0.4, r:60, c:'242,165,65' }]; } }
      if (a === 'charge') { const c = t % 2.4; B.face = 1; B.x = 14;
        if (c < 0.52) Object.assign(B, { state:'windup', next:'charge' });
        else if (c < 0.93) { B.state = 'charge'; B.x = 14 + (c - 0.52) * 235; }
        else { B.x = 110; B.state = c < 1.7 ? 'stun' : 'idle'; const s = c - 0.93; if (s < 0.35) G.fx = [{ k:'ring', x:144, y:BFY - 15, t:0.35 - s, max:0.35, r:46, c:'255,220,180' }]; } }
      if (a === 'drip') { const c = t % 2.4;
        if (c < 0.52) Object.assign(B, { state:'windup', next:'drip' });
        else { B.state = 'drip'; const s = c - 0.52; G.drops = [18, 50, 128, 156].map((x, i) => { const u = s - i * 0.12; return { x, y:BTOP - 10 + 300 * Math.max(0, u) * Math.max(0, u), w:6, h:8, warn:0 }; }).filter(d => d.y < BFY - 8); } }
      G.boss = B; drawHazards(0, t); drawBoss(0, t); drawFx(0);
    } },
  chandler:{ name:'The Hanging Chandler', tag:'Chapter 2 boss', ch:2, hp:42, boss:true, room:1, gal:'chandler', view:'wide',
    where:'Chandler’s Hall',
    blurb:'A drowned chandelier of wax and brass with one great eye, hanging from a chain in the dark.',
    moves:'Volley of molten globs · Call, which drops Wicklings · Wave of fire along the floor · Cross, a flight from wall to wall · Ward against spells · Rain of fire from the roof.',
    tell:'Every attack has its own sign: swelling globs, bulging wax, a burning floor line, a dotted flight path, a white ring at the roof.', beat:'It hangs out of reach, so strike when it comes low or hangs tired. Its violet ward turns spells, so do not spam bolts.',
    anims:[['hover', 'Hover'], ['volley', 'Volley'], ['call', 'Call'], ['wave', 'Wave'], ['ward', 'Ward'], ['p2', 'Phase two']],
    pose(a, t) {
      const B = Object.assign(mkChandler(0, 0), { x:BCX - 16, y:BFY - 72 + Math.round(Math.sin(t * 2) * 2), state:'hover', anim:t, face:-1 });
      if (a === 'p2') B.hp = 18;
      if (a === 'ward') B.wardT = 1;
      const c = t % 2.2, mx = B.x + 16, by = B.y + B.h;
      if (a === 'volley' || a === 'call' || a === 'wave') {
        if (c < 0.8) Object.assign(B, { state:'windup', next:a, wt:0.8, t:0.8 - c, hp:a === 'wave' ? 18 : B.hp });
        else { const s = c - 0.8;
          if (a === 'volley') G.shots = [-46, 0, 46].map(dx => { const tf = 0.7, vx = dx / tf, vy = (BFY - 6 - by - 0.5 * 520 * tf * tf) / tf; return s < tf ? { x:mx + vx * s - 3, y:by + vy * s + 260 * s * s - 3, w:6, h:6 } : null; }).filter(Boolean);
          if (a === 'wave') G.waves = s < 1.2 ? [-1, 1].map(d => ({ x:mx - 6 + d * s * 160, y:BFY - 20, w:12, h:20, vx:d, big:true })) : [];
          if (a === 'call') for (const dx of [-10, 10]) { const fall = Math.min(1, s / 0.35), w = bWalk(Math.max(0, s - 0.35), 50, 0, 40); drawCrawler({ wickling:true, x:mx + dx - 5 + (dx < 0 ? -w.x : w.x), y:by + (BFY - 12 - by) * fall * fall, w:10, h:12, dir:dx < 0 ? -1 : 1, anim:t + dx, flash:0 }, 0); }
        } }
      G.boss = B; drawHazards(0, t); drawBoss(0, t);
    } },
  wyrm:{ name:'The Tallow Wyrm', tag:'Chapter 3 boss · stage one', ch:3, hp:30, boss:true, room:2, gal:'wyrm', view:'wide', kiln:true,
    where:'The Kiln Pit',
    blurb:'A wax serpent swimming under the molten crust of the kiln floor.',
    moves:'Bite up through the floor · Flame breath that sets the floor alight · Quake · Leap across the pit.',
    tell:'A hot glow on the floor where it will bite; a dotted arc before it leaps; a long inhale before the flame.', beat:'Blades glance off its crust. Jump above its raised head and Wax Dive onto it to stun it, then cut.',
    anims:[['rise', 'Rise'], ['bite', 'Bite'], ['leap', 'Leap'], ['stun', 'Stunned'], ['p2', 'Phase two']],
    pose(a, t) {
      const B = Object.assign(mkWyrm(BCX), { state:'under', rise:1, headUp:30, face:-1, anim:t });
      if (a === 'p2') B.hp = 10;
      if (a === 'rise' || a === 'p2') { const c = t % 3; B.rise = c < 0.6 ? c / 0.6 : c < 2.3 ? 1 : Math.max(0, 1 - (c - 2.3) / 0.5); B.headUp = 30 + Math.sin(t * 2) * 3; }
      if (a === 'stun') B.state = 'stun';
      if (a === 'bite') { const c = t % 2.6;
        if (c < 0.85) Object.assign(B, { state:'biteW', bx:BCX, wt:0.85, t:0.85 - c, rise:0 });
        else if (c < 1.35) Object.assign(B, { state:'bite', rise:Math.min(1, (c - 0.85) / 0.12), headUp:44 });
        else if (c < 1.55) Object.assign(B, { state:'biteSnap', rise:1, headUp:44 });
        else Object.assign(B, { state:'biteUp', rise:Math.max(0, 1 - (c - 1.55) / 0.6), headUp:44 }); }
      if (a === 'leap') { const c = t % 2.6; Object.assign(B, { dx0:BCX - 64, dx1:BCX + 64, face:1 });
        if (c < 0.8) Object.assign(B, { state:'diveW', wt:0.8, t:0.8 - c, rise:0 });
        else if (c < 2.1) Object.assign(B, { state:'leap', lk:Math.min(1, (c - 0.8) / 1.2) });
        else B.rise = 0; }
      drawWyrm(0, t, B);
    } },
  moth:{ name:'The Cinder Moth', tag:'Chapter 3 boss · stage two', ch:3, hp:32, boss:true, room:2, gal:'moth', view:'wide', kiln:true,
    where:'The Kiln Pit, hatched from the Tallow Wyrm',
    blurb:'What the Wyrm became: a burning moth with staring eye-spots on its wings.',
    moves:'Rush along a sight line · Sweep across the room · Slam from above · Ember rain · Call Cinderlings · Triple wing slash.',
    tell:'A thin red sight line before a rush, a dark red shadow under you before a slam, three lights above it before the triple slash.', beat:'Climb the ledges and Wax Dive onto its back as it passes below. Strike while a light shines to break the triple slash.',
    anims:[['fly', 'Fly'], ['rush', 'Rush'], ['slash', 'Triple slash'], ['perch', 'Perch'], ['p2', 'Phase two']],
    pose(a, t) {
      const B = Object.assign(mkMoth(BCX, BFY - 62), { state:'fly', wph:t * 7, face:-1, anim:t });
      B.x = BCX - 24; B.y = BFY - 62;
      if (a === 'p2') B.hp = 10;
      if (a === 'perch') { B.state = 'perch'; B.y = BFY - 30; }
      if (a === 'rush') { const c = t % 2.4, tx = BCX - 64, ty = BFY - 24;
        if (c < 0.9) Object.assign(B, { state:'rushW', tgx:tx, tgy:ty, wt:0.9, t:0.9 - c });
        else if (c < 1.35) { const s = (c - 0.9) / 0.45, cx = BCX + (tx - BCX) * s, cy = BFY - 50 + (ty - BFY + 50) * s; B.state = 'rush'; B.x = cx - 24; B.y = cy - 12;
          B.trail = []; for (let i = 6; i >= 0; i--) { const u = Math.max(0, s - i * 0.06); B.trail.push({ x:BCX + (tx - BCX) * u, y:BFY - 50 + (ty - BFY + 50) * u, f:-1, life:0.28 * (1 - i / 7) }); } }
        else { const s = Math.min(1, (c - 1.35) / 0.8), cx = tx + (BCX - tx) * s, cy = ty + (BFY - 50 - ty) * s; B.x = cx - 24; B.y = cy - 12; } }
      if (a === 'slash') { const c = t % 2.4, hs = mothSlashTimes(false);
        if (c < 0.35) B.state = 'slashGo';
        else { const st = c - 0.35; B.state = 'slash'; B.st = st; B.si = hs.filter(h => h <= st).length; B.green = hs.findIndex(h => h - st > 0 && h - st < 0.14);
          const last = B.si ? hs[B.si - 1] : -9; B.slashFx = st - last < 0.16 ? 0.16 - (st - last) : 0; B.slashN = B.si;
          if (B.si >= 3 && st > hs[2] + 0.2) B.state = 'fly'; } }
      drawMoth(0, t, B);
    } }
};
const FOE_IDS = ['mite', 'brass', 'flyer', 'spitter', 'wickling', 'cinderling', 'cocoon', 'dripmite', 'wisp', 'eel', 'puppet', 'slag', 'swarm'];
const BOSS_IDS = ['warden', 'chandler', 'wyrm', 'moth'];
const csGroupOf = id => ROSTER.includes(id) ? 'heroes' : (BOSS_IDS.includes(id) || id === 'umbra') ? 'bosses' : 'foes';
const csIds = g => g === 'heroes' ? ROSTER : g === 'foes' ? FOE_IDS : [...BOSS_IDS, 'umbra'];
function csNav(id) {
  const g = csGroupOf(id), label = k => CHARS[k] ? CHARS[k].name : k === 'umbra' ? '???' : BEAST[k].name.replace(/^The /, '');
  return `<div class="cs-tabs" role="tablist">${CS_GROUPS.map(([k, l]) => `<button type="button" role="tab" aria-selected="${k === g}" class="chip${k === g ? ' on' : ''}" data-action="cs-grp" data-g="${k}">${l}</button>`).join('')}</div>
    <div class="cs-heroes">${csIds(g).map(h => `<button type="button" class="btn${h === 'umbra' ? ' umb' : ''}${h === id ? ' primary' : ''}" data-action="cs-hero" data-id="${h}">${label(h)}</button>`).join('')}</div>`;
}
function beastSheetHtml(cs) {
  const id = cs.id, b = BEAST[id], max = b.boss ? 50 : 6, hpN = typeof b.hp === 'number' ? b.hp : 1;
  const fight = b.boss ? `<div class="cs-duel cs-fight"><b>Practice</b>
      <div class="row">${ROSTER.map(h => `<button type="button" class="chip${h === G.char ? ' on' : ''}" data-action="duel-hero" data-id="${h}">${CHARS[h].name}</button>`).join('')}</div>
      <div class="row"><button type="button" class="btn fight" data-action="beast-fight" data-k="${id}">${id === 'moth' ? 'Fight the Wyrm, then the Moth' : 'Fight as ' + CH().name}</button><button type="button" class="chip" data-action="beast-gal" data-k="${b.gal}">Watch every move in the Gallery</button></div></div>` : '';
  return `<div class="camp sheet-page"><div class="rpgwin csw cs cs-beast${b.boss ? ' cs-boss' : ''}"><p class="peb">Characters · Beta · drawn live by the game</p>
    ${csNav(id)}
    <div class="cs-main">
      <div class="cs-left"><div class="cs-stage"><canvas id="csv" width="352" height="224" aria-label="${b.name} animation"></canvas><span class="cs-anim" id="csl"></span></div>
        <div class="cs-anims">${b.anims.map(([a, l]) => `<button type="button" class="chip${a === cs.anim ? ' on' : ''}" data-action="cs-anim" data-a="${a}">${l}</button>`).join('')}</div>
        <div class="cs-pal" id="cspal" aria-label="Palette"></div>
        ${fight}</div>
      <div class="cs-sheet">
        <div class="cs-title"><h3>${b.name}</h3><span class="tag">${b.tag}</span></div>
        <p>${b.blurb}</p>
        <dl class="cs-stats"><dt>Health</dt><dd><span class="bar"><i style="width:${Math.round(Math.min(1, hpN / max) * 100)}%"></i></span>${b.hp}</dd>
          <dt>Touch</dt><dd>${b.boss || id !== 'cocoon' ? '1 ember' : 'Harmless'}</dd><dt>Speed</dt><dd>${b.boss ? '—' : b.spd}</dd><dt>Found in</dt><dd class="cs-where">${b.where}</dd></dl>
        ${b.moves ? `<p class="cs-moves"><b>Moves</b> ${b.moves}</p>` : ''}
        <p class="cs-moves"><b>Tell</b> ${b.tell}</p>
        <div class="cs-notes"><b>How to beat it</b>${b.beat}</div>
      </div>
    </div>
    <div class="gbtns"><button class="btn" data-action="menu" data-to="home" type="button">Back to camp</button></div></div>
    <div class="hint">${tip('Tap a creature or a move', '← → ↑ ↓ choose · Enter select · Esc back')}</div></div>`;
}
const BS = { c:null };
function beastFrame(id, anim, t, bare) {
  if (!BS.c) { BS.c = document.createElement('canvas'); BS.c.width = 176; BS.c.height = 112; }
  const b = BEAST[id], g = BS.c.getContext('2d'), save = { ctx, boss:G.boss, cine:G.cine, cam:G.cam.x, drops:G.drops, puddles:G.puddles, shots:G.shots, waves:G.waves, drips:G.drips, fx:G.fx };
  try {
    ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 176, 112);
    G.cine = null; G.cam.x = 0; G.drops = []; G.puddles = []; G.shots = []; G.waves = []; G.drips = []; G.fx = [];
    g.translate(0, -BTOP);
    if (!bare) {
      const pal = b.kiln ? ['#1a0c08', '#5a2410'] : b.ch === 3 ? ['#1e1410', '#4a3020'] : b.ch === 2 ? ['#141e28', '#2a4258'] : ['#1d2830', '#2f4a3c'];
      g.fillStyle = pal[0]; g.fillRect(0, BFY, 176, 30); g.fillStyle = pal[1]; g.fillRect(0, BFY, 176, 1);
      if (b.kiln) { g.fillStyle = 'rgba(255,120,40,.35)'; g.fillRect(0, BFY + 1, 176, 2); }
      if (b.pit) { g.fillStyle = '#081018'; g.fillRect(BCX - 48, BFY, 96, 30); g.fillStyle = '#2f78a8'; g.fillRect(BCX - 48, BFY + 2, 96, 1); g.fillStyle = '#9fdcf0'; for (let x = BCX - 46; x < BCX + 46; x += 9) g.fillRect(x + Math.round(Math.sin(t * 2 + x) * 2), BFY + 2, 3, 1); }
      if (b.ceil) bCeil();
      if (b.wall && anim === 'charge') { g.fillStyle = '#10161c'; g.fillRect(144, BTOP, 40, 92); g.fillStyle = '#26323c'; g.fillRect(144, BTOP, 1, 92); }
    }
    b.pose(anim, t);
  } catch (e) { console.error(e); }
  finally { ctx = save.ctx; G.boss = save.boss; G.cine = save.cine; G.cam.x = save.cam; G.drops = save.drops; G.puddles = save.puddles; G.shots = save.shots; G.waves = save.waves; G.drips = save.drips; G.fx = save.fx; }
  return BS.c;
}
function drawBeastSheet(cv, now) {
  const cs = G.cs, b = BEAST[cs.id], t = Math.max(0, now - (cs.t0 || 0)) / 1000, g = cv.getContext('2d');
  const pal = document.getElementById('cspal');
  if (pal && !pal.dataset.done) {   // the creature's own colours, read from a frame drawn without the floor
    pal.dataset.done = 1; const fr = beastFrame(cs.id, b.anims[0][0], 1.3, true), d = fr.getContext('2d').getImageData(0, 0, fr.width, fr.height).data, cnt = {};
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { const kk = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); cnt[kk] = (cnt[kk] || 0) + 1; }
    pal.innerHTML = Object.entries(cnt).sort((a, c) => c[1] - a[1]).slice(0, 7).map(e => `<span><b style="background:${e[0]}"></b>${e[0].slice(1)}</span>`).join('');
  }
  const fr = beastFrame(cs.id, cs.anim, t);
  g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  const near = b.view === 'near', k = near ? 3.6 : cv.height / 112, sx = near ? BCX - 49 : 0, sy = near ? 40 : 0, sw = cv.width / k, sh = cv.height / k;
  g.drawImage(fr, sx, sy, sw, sh, (cv.width - sw * k) / 2, 0, sw * k, sh * k);
  const l = document.getElementById('csl'), name = (b.anims.find(a => a[0] === cs.anim) || [0, ''])[1]; if (l && l.textContent !== name) l.textContent = name;
}
// a practice fight against one boss: the rush machinery with a single entry
const PRACTICE_STEP = { warden:0, chandler:1, wyrm:2, moth:2 };
const rushList = () => (G.rush && G.rush.list) || RUSH;
function startPractice(k) {
  const step = RUSH[PRACTICE_STEP[k] || 0];
  newGame('ch' + step.ch); G.rush = { i:-1, splits:[], ended:false, won:false, list:[step], practice:k };
  G.skills = { bolt:true, dive:true, flare:true }; syncSkillUI(); G.hinted = { start:1, shrine:1, cocoon:1, boss:1, dash:1 };
  try { clearTimeout(bannerTimer); $('banner').classList.remove('show'); } catch (_) {}
  rushNext();
}
