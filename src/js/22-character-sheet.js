// ---------- Characters (Beta): a live character sheet for whoever designs or updates the heroes.
// Every frame is drawn by the same code the game uses, so it is always current.
const CHAR_ANIMS = [['idle', 'Idle'], ['run', 'Run'], ['jump', 'Jump'], ['dash', 'Dash'], ['combo', 'Full combo'], ['up', 'Up-slash'], ['focus', 'Focus']];
const CHAR_NOTES = {
  snuff:{ moves:'Sweep · Back-sweep (alternates) · Up-sweep · Down-sweep (pogo), all with his short sword.',
    notes:'Candle head: cream wax, melted rim with drips, dark wick, a flame that streams back on a swing. Short sword (leather grip, brass guard and pommel, steel blade with a bright edge) carried in his back hand, low at his side with the tip trailing behind so it never crosses his body. Slate-blue cape with a ragged pale-trimmed hem that streams with speed and lifts in a fall; shoulders lit by his own flame. Weight in whole pixels: sinks on landing and into each slash, rises on take-off. Dash leaves streaks; focus hunches over the planted sword.' },
  knight:{ moves:'Forehand · Backhand · Rising cut · Fire cleave (finisher).',
    notes:'Steel helm with a flame crest and amber visor, crimson cape, lantern at the hip. The claymore is always carried behind him: held low behind when standing, dragged with its tip on the floor when walking (throws sparks), trailed level in a jump, rested on the shoulder now and then. While carried behind it is drawn behind his body.' },
  hero:{ moves:'Draw cut · Rising crescent · Frost cross · Severance (finisher).',
    notes:'White wax head with a stern, grown-up face (brows dipping toward the nose, narrow eyes with cold blue irises, firm mouth, a small frost scar), crowned by a pulsing blue fire spirit with loose sparks. Bright blue scarf with a light edge; navy coat with blue trim. Katana: wrapped grip, guard, curved polished steel with a bright edge and a thin glint that slides along it. Stays drawn in a low guard between combo strikes; sheathed in one flick when the combo ends. Severance: carries the blade over and slides it home into the saya before the final click. Idle is a still stance with a slow breath.' }
};
const CHAR_CACHE = {};
function charFrames(id, anim) {
  const key = id + ':' + anim; if (CHAR_CACHE[key]) return CHAR_CACHE[key];
  const DT = 1 / 30, FW = 176, FH = 112, GY = 92, HX = 52, frames = [];
  const saveP = Object.assign({}, P), save = { ctx, char:G.char, muted, parts:G.parts, fx:G.fx, spells:G.spells, enemies:G.enemies, cam:G.cam.x, flash:Object.assign({}, G.flash), sev:G.sev, shake:G.shake, hitstop:G.hitstop, time:G.time };
  const c = document.createElement('canvas'); c.width = FW; c.height = FH; const g = c.getContext('2d');
  muted = true; G.char = id; resetPlayer(); P.atkHit = new Set();
  const savePuffs = G.fpuffs; G.fpuffs = [];
  G.parts = []; G.fx = []; G.spells = []; G.enemies = []; G.cam.x = 0; G.flash = { a:0, t:0, max:1, c:'255,255,255' }; G.sev = null;
  let t = 0, wait = 0.15, count = { idle:60, run:24, jump:28, dash:14, focus:36 }[anim] || 400;
  const queue = anim === 'combo' ? (CHARS[id].combo ? [1, 2, 3, 4].map(n => ['side', n]) : [['side', 1], ['side', 2], ['side', 1]]) : anim === 'up' ? [['up', 1]] : [];
  const swing = (dir, n) => { P.atkDir = dir; P.atkHit = new Set(); P.combo = n; P.fin = n === 4;
    if (id === 'knight') { const sw = knightSwing(dir, n, P.fin); Object.assign(P, { swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:false, landed:false }); }
    else if (id === 'hero') { const sw = heroSwing(dir, n, P.fin) || heroSwing('side', 1, false); Object.assign(P, { swing:sw, atkDur:sw.d, atkT:sw.d, swFrom:P.swAng, struck:0, hWin:-1, comboT:sw.d + 0.4 }); if (P.fin) startSeverance(); }
    else { P.fin = false; P.atkT = SN.dur; P.alt = n === 2; } };
  try {
    for (let i = 0; i < count; i++) {
      P.x = HX - P.w / 2; P.y = GY - P.h; P.face = 1; P.dead = false; P.sit = false; P.hurtT = 0;
      P.vx = 0; P.vy = 0; P.grounded = true; P.dashT = 0; P.healT = 0; if (!P.fin) P.inv = 0;
      if (anim === 'run') P.vx = CHARS[id].run;
      if (anim === 'jump') { const k = i / 27; P.grounded = false; P.vy = -280 + 520 * k; P.y = GY - P.h - Math.sin(k * Math.PI) * 14; }
      if (anim === 'dash') { P.dashT = Math.max(0, CHARS[id].dashT - i * DT * 0.6); P.vx = P.dashT > 0 ? CHARS[id].dashV : 0; }
      if (anim === 'focus') P.healT = 0.2 + (i / count) * 0.9;
      P.anim += DT; t += DT; G.time = (G.time || 0) + DT; P.atkT -= DT; P.comboT = (P.comboT || 0) - DT; P.idleT = (P.atkT > 0 || anim !== 'idle') ? 0 : (P.idleT || 0) + DT;
      if (P.atkT <= 0) { if (P.fin) P.fin = false; wait -= DT; if (wait <= 0 && queue.length) { swing(...queue.shift()); wait = 0.08; } }
      if (!queue.length && P.atkT <= 0 && wait <= 0 && count === 400) count = i + 14;
      if (id === 'knight') updateKnightPose(DT); else if (id === 'hero') updateHeroPose(DT);
      updateParticles(DT); updateFx(DT); updateSpells(DT); updateFirePuffs(DT);
      ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, FW, FH);
      drawFirePuffs(0); drawPlayer(0, t); if (id === 'hero') drawHeroWorld(0); drawSpells(0, t);
      for (const q of G.parts) { g.globalAlpha = clamp(q.life / q.max, 0, 1); g.fillStyle = q.c; g.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s); }
      g.globalAlpha = 1; drawFx(0); if (id === 'hero') drawSeverance();
      if (G.flash.t > 0) { g.fillStyle = `rgba(${G.flash.c},${G.flash.a * (G.flash.t / G.flash.max)})`; g.fillRect(0, 0, FW, FH); }
      const fc = document.createElement('canvas'); fc.width = FW; fc.height = FH; fc.getContext('2d').drawImage(c, 0, 0); frames.push(fc);
    }
  } catch (e) { console.error(e); }
  finally { G.fpuffs = savePuffs; Object.assign(P, saveP); ctx = save.ctx; G.char = save.char; muted = save.muted; G.parts = save.parts; G.fx = save.fx; G.spells = save.spells; G.enemies = save.enemies; G.cam.x = save.cam; G.flash = save.flash; G.sev = save.sev; G.shake = save.shake; G.hitstop = save.hitstop; G.time = save.time; }
  return (CHAR_CACHE[key] = frames);
}
function charPalette(id) {
  const fr = charFrames(id, 'idle')[0], d = fr.getContext('2d').getImageData(0, 0, fr.width, fr.height).data, cnt = {};
  for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { const k = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); cnt[k] = (cnt[k] || 0) + 1; }
  return Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 7).map(e => e[0]);
}
function drawCharSheet(now) {
  const cv = document.getElementById('csv'); if (!cv || !G.cs) return;
  if (G.cs.id === 'umbra') return drawUmbraSheet(cv, now);
  if (BEAST[G.cs.id]) return drawBeastSheet(cv, now);
  const cs = G.cs, fr = charFrames(cs.id, cs.anim), loopPause = cs.anim === 'combo' || cs.anim === 'up' || cs.anim === 'dash' ? 12 : 0;
  if (!fr.length) return;
  const i = Math.min(fr.length - 1, Math.floor(Math.max(0, now - (cs.t0 || 0)) / (1000 / 30)) % (fr.length + loopPause));
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  const wide = cs.anim === 'combo', k = wide ? cv.height / 112 : 3.6, sx = wide ? 0 : 52 - 49, sy = wide ? 0 : 92 - 52, sw = cv.width / k, sh = cv.height / k;
  g.fillStyle = '#1d2830'; g.fillRect(0, (92 - sy) * k, cv.width, cv.height); g.fillStyle = '#2f4a3c'; g.fillRect(0, (92 - sy) * k, cv.width, Math.max(1, k * 0.5));
  g.drawImage(fr[i], sx, sy, sw, sh, (cv.width - sw * k) / 2, 0, sw * k, sh * k);
  const l = document.getElementById('csl'), name = (CHAR_ANIMS.find(a => a[0] === cs.anim) || [0, ''])[1]; if (l && l.textContent !== name) l.textContent = name;
  const pal = document.getElementById('cspal'); if (pal && !pal.dataset.done) { pal.dataset.done = 1; pal.innerHTML = charPalette(cs.id).map(c => `<span><b style="background:${c}"></b>${c.slice(1)}</span>`).join(''); }
}
// ---------- the Black Wick on the character sheet: everything about him unknown, except how he moves and a door to the duel
const UMBRA_ANIMS = [['idle', 'Idle'], ['draw', 'Draw cut'], ['combo', 'Combo'], ['guard', 'Guard'], ['wave', 'Crescent']];
function umbraSheetHtml(cs) {
  const unk = l => `<dt>${l}</dt><dd class="unk"><span class="bar unk"><i></i></span>???</dd>`;
  return `<div class="camp sheet-page"><div class="rpgwin csw cs cs-umb"><p class="peb">Characters · Beta · drawn live by the game</p>
    ${csNav('umbra')}
    <div class="cs-main">
      <div class="cs-left"><div class="cs-stage"><canvas id="csv" width="352" height="224" aria-label="The Black Wick animation"></canvas><span class="cs-anim" id="csl"></span></div>
        <div class="cs-anims">${UMBRA_ANIMS.map(([a, l]) => `<button type="button" class="chip${a === cs.anim ? ' on' : ''}" data-action="cs-anim" data-a="${a}">${l}</button>`).join('')}</div></div>
      <div class="cs-sheet">
        <div class="cs-title"><h3>The Black Wick</h3><span class="tag">Hidden boss</span></div>
        <p>Something wears Wick Hero's shape at the bottom of the pit. Same stance, same blade. The flame went black.</p>
        <dl class="cs-stats">${unk('Embers')}${unk('Run speed')}${unk('Dash')}${unk('Slash dmg')}${unk('Reach')}</dl>
        <p class="cs-moves"><b>Moves</b> ???</p>
        <div class="cs-pal" id="cspal" aria-label="Palette"></div>
        <div class="cs-duel"><b>The duel</b>
          <div class="row">${ROSTER.map(h => `<button type="button" class="chip${h === G.char ? ' on' : ''}" data-action="duel-hero" data-id="${h}">${CHARS[h].name}</button>`).join('')}</div>
          <button type="button" class="btn fight" data-action="duel">Enter the fight as ${CH().name}</button></div>
      </div>
    </div>
    <div class="gbtns"><button class="btn" data-action="menu" data-to="home" type="button">Back to camp</button></div></div>
    <div class="hint">${tip('Tap a move, pick your hero, then enter the fight', '← → ↑ ↓ choose · Enter select · Esc back')}</div></div>`;
}
const US = { B:null, c:null, lt:0 };
function umbraSheetFrame(t, anim) {
  if (!US.c) { US.c = document.createElement('canvas'); US.c.width = 176; US.c.height = 112; }
  const B = US.B || (US.B = mkUmbra(52)), U = B.pup, Q = U.pose, GY = 92, dt = clamp(t - US.lt, 0, 0.05); US.lt = t;
  B.x = 52 - B.w / 2; B.y = GY - B.h; B.face = 1; B.hide = false; B.flash = 0; B.glint = 0; B.charge = 0; B.waves = []; B.state = 'uIdle';
  U.smear = null; U.sheathing = null; U.bladeVis = 1; U.sheathed = true;
  let ang = 2.75, L = 0.3, Cr = 0.4 + 0.15 * Math.sin(t * 1.5), St = 0;
  if (anim === 'draw') {
    const c = t % 1.8;
    if (c < 0.6) { B.state = 'uIaiW'; L = -0.6; Cr = 2.2 * Math.min(1, c * 3); St = 1; B.glint = c < 0.15 ? 1 - c / 0.15 : 0; }
    else if (c < 0.78) { B.state = 'uIai'; U.sheathed = false; ang = -0.25; L = 3.5; Cr = 2.5; St = 3.5; U.smear = { a0:2.4, a:-0.25, fade:1 - (c - 0.6) / 0.18 * 0.4 }; }
    else if (c < 1.35) { U.sheathed = false; ang = 0.55; L = 0.8; Cr = 1.8; }
    else { U.sheathT = c < 1.4 ? 0.18 : 0; }
  } else if (anim === 'combo') {
    const c = t % 2.1;
    if (c < 0.45) { B.state = 'uComboW'; U.sheathed = false; ang = -2.3; L = -1.2; Cr = 0.8; }
    else if (c < 1.3) { const ct = c - 0.45; U.sheathed = false; let cur = 0; for (let i = 0; i < UMBRA_COMBO.length; i++) if (ct >= UMBRA_COMBO[i].at) cur = i;
      const S = UMBRA_COMBO[cur], q = clamp((ct - S.at) / 0.11, 0, 1); ang = klerp(S.a0, S.a1, keo(q)); U.smear = { a0:S.a0, a:ang, fade:q < 1 ? 1 : Math.max(0, 1 - (ct - S.at - 0.11) / 0.12) }; L = q < 1 ? 3.2 : 1.5; Cr = 2.2; St = 3; }
    else { B.state = 'uOpen'; U.sheathed = false; ang = 1.2; L = 0.4; Cr = 1.6; }
  } else if (anim === 'guard') { B.state = 'uGuard'; U.sheathed = false; ang = 0; L = 0.6; Cr = 1.3; }
  else if (anim === 'wave') {
    const c = t % 1.9;
    if (c < 0.6) { B.state = 'uWaveW'; B.charge = c / 0.6; U.sheathed = false; ang = 2.3; L = -1.5; Cr = 1.4; }
    else { const s2 = c - 0.6; U.sheathed = false; ang = s2 < 0.12 ? klerp(2.3, -0.6, keo(s2 / 0.12)) : -0.6; L = s2 < 0.15 ? 3 : 0.5; Cr = 1.6; St = s2 < 0.15 ? 3 : 1;
      if (s2 < 0.25) U.smear = { a0:2.3, a:ang, fade:1 - s2 / 0.25 };
      const wx = 66 + s2 * 160; if (wx < 190) B.waves = [{ x:wx, y:GY - 10, h:20, vx:240, age:s2 }]; }
  }
  Q.lean = L; Q.crouch = Cr; Q.stride = St; Q.hip = St * 0.45; Q.hop = 0; U.swAng = ang; U.anim = t; U.idleT = t; U.vx = 0; U.grounded = true; if (U.sheathT > 0) U.sheathT -= dt;
  if (Math.random() < dt * 16) B.wisps.push({ x:52 + rand(-6, 6), y:B.y + rand(-14, 10), vy:-rand(12, 30), life:rand(0.5, 1), max:1, s:Math.random() < 0.3 ? 2 : 1 });
  for (const w of B.wisps) { w.life -= dt; w.y += w.vy * dt; } B.wisps = B.wisps.filter(w => w.life > 0);
  const g = US.c.getContext('2d'), save = ctx;
  try { ctx = g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, 176, 112); drawUmbra(0, t, B); }
  catch (e) { console.error(e); } finally { ctx = save; }
  return US.c;
}
function drawUmbraSheet(cv, now) {
  const cs = G.cs, t = now / 1000, fr = umbraSheetFrame(t, cs.anim), g = cv.getContext('2d');
  g.imageSmoothingEnabled = false; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  const wide = cs.anim === 'combo' || cs.anim === 'wave' || cs.anim === 'draw', k = wide ? cv.height / 112 : 3.6, sx = wide ? 0 : 3, sy = wide ? 0 : 40, sw = cv.width / k, sh = cv.height / k;
  g.fillStyle = '#140608'; g.fillRect(0, (92 - sy) * k, cv.width, cv.height); g.fillStyle = '#5a0c12'; g.fillRect(0, (92 - sy) * k, cv.width, Math.max(1, k * 0.5));
  g.drawImage(fr, sx, sy, sw, sh, (cv.width - sw * k) / 2, 0, sw * k, sh * k);
  const l = document.getElementById('csl'), name = (UMBRA_ANIMS.find(a => a[0] === cs.anim) || [0, ''])[1]; if (l && l.textContent !== name) l.textContent = name;
  const pal = document.getElementById('cspal'); if (pal && !pal.dataset.done) {
    pal.dataset.done = 1; const d = fr.getContext('2d').getImageData(0, 0, fr.width, fr.height).data, cnt = {};
    for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { const kk = '#' + [d[i], d[i + 1], d[i + 2]].map(v => v.toString(16).padStart(2, '0')).join(''); cnt[kk] = (cnt[kk] || 0) + 1; }
    pal.innerHTML = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 7).map(e => `<span><b style="background:${e[0]}"></b>${e[0].slice(1)}</span>`).join('');
  }
}
