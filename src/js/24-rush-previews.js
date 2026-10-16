// ---------- Boss Rush: every boss back to back on one health bar. Between fights the hero gets two embers back and a full
// vessel; fall once and the rush ends. Clear the Moth and the Black Wick is waiting as the last fight.
const RUSH = [{ room:'cinder', ch:1, name:'Tallow Warden' }, { room:'hall', ch:2, name:'The Hanging Chandler' }, { room:'kiln', ch:3, name:'Wyrm and Moth' }, { room:'kiln', ch:3, name:'The Black Wick', umbra:true }];
function startRush() {
  newGame('ch1'); G.rush = { i:-1, splits:[], ended:false, won:false };
  G.skills = { bolt:true, dive:true, flare:true }; syncSkillUI(); G.hinted = { start:1, shrine:1, cocoon:1, boss:1, dash:1 };
  try { clearTimeout(bannerTimer); $('banner').classList.remove('show'); } catch (_) {}
  rushNext();
}
function rushNext() {
  const R = G.rush; if (!R) return;
  if (R.i >= 0) R.splits.push(G.time);
  R.i++; const L = rushList();
  if (R.i >= L.length) { R.won = true; G.state = 'won'; setOverlay('won'); return; }
  const step = L[R.i], ri = ROOM_DEFS.findIndex(d => d.id === step.room);
  if (R.i > 0) P.hp = Math.min(P.maxHp, P.hp + 2);   // a breath between fights
  P.wax = 99; P.dead = false; P.inv = 1; G.chapter = step.ch; G.bossDown = false; G.winT = 0;
  if (step.umbra) { umbraArenaSetup(R.i > 0); }
  else { loadRoom(ri, 'a'); }
  G.skills = { bolt:true, dive:true, flare:true }; syncSkillUI();
  showBanner(step.name, R.practice ? 'Practice' : 'Boss Rush · ' + (R.i + 1) + ' of ' + L.length);
  if (R.i > 0) G.blackIn = G.blackInMax = 1.2;
}
// the kiln dressed for the Black Wick: cooled pit, ledges, red haze, and him at the far end
function umbraArenaSetup(again) {
  const ki = ROOM_DEFS.findIndex(x => x.id === 'kiln'); G.cp = { room:ki }; loadRoom(ki, 'a'); P.wax = 99;
  try { clearTimeout(bannerTimer); $('banner').classList.remove('show'); } catch (_) {}
  setDoor(true); G.kilnCool = 1; G.umbraArena = true;
  G.ledges = KILN_LEDGES.map(([x, y, w]) => ({ x, y, w, k:1, d:0, on:true })); for (const L of G.ledges) for (let j = 0; j < L.w; j++) G.room.g[L.y][L.x + j] = 3; buildTiles();
  const U = G.boss = mkUmbra(22 * T); U.face = -1;
  if (again === 'quick') { U.state = 'uIdle'; U.atk = 1.4; } else startUmbraEntrance(U);
  P.x = 8 * T; P.y = 12 * T + T - P.h; P.vy = 0; G.camLead = 0; G.cam.x = clamp(P.x + P.w / 2 - W / 2 + camBias(), 0, G.room.w * T - W);
}
// the duel: the cooled Kiln Pit sunk in red haze, and the Black Wick waiting at the far end
function startUmbraDuel(again) {
  const d = again ? G.deaths : 0, tm = again ? G.time : 0, h = again ? G.hits : 0;
  newGame('ch3'); G.duel = true; G.deaths = d; G.time = tm; G.hits = h; G.hinted = { start:1, shrine:1, cocoon:1 };
  umbraArenaSetup(again ? 'quick' : false);
}
// ---------- chapter previews: each stage drawn by the game itself, sunk in shadow; the boss only as a silhouette
let CH_PREVIEW = null;
// one preview per chapter: the boss arena, and the boss as a huge tilted shadow with burning eyes
function chapterPreviews() {
  if (CH_PREVIEW) return CH_PREVIEW;
  const out = {}, saveCtx = ctx, saveP = Object.assign({}, P), PW = 480, PH = 240;
  try {
    for (const n of [1, 2, 3]) {
      const ids = ROOM_DEFS.map((d, i) => ({ d, i })).filter(o => o.d.ch === n && !o.d.tut && o.d.id !== 'gallery'), last = ids[ids.length - 1];
      loadRoom(last.i, 'a');
      const B = G.boss, col = n === 1 ? '242,96,44' : n === 3 ? '255,110,40' : '236,184,84', hot = n === 1 ? '255,170,90' : n === 3 ? '255,210,130' : '255,226,150';
      G.cam.x = B ? clamp(B.x + B.w / 2 - W / 2, 0, Math.max(0, G.room.w * T - W)) : 0;
      const cx0 = Math.round(G.cam.x);
      // the arena, sunk deep in shadow
      const arena = document.createElement('canvas'); arena.width = W; arena.height = H; ctx = arena.getContext('2d');
      drawBg(0); ctx.drawImage(G.tiles, -cx0, 0); drawKiln(cx0, 0); drawHazards(cx0, 0); drawGates(cx0, 0);
      const c = document.createElement('canvas'); c.width = PW; c.height = PH; const g = c.getContext('2d');
      g.drawImage(arena, 0, H - PH, W, PH, 0, 0, PW, PH);
      g.fillStyle = 'rgba(4,6,11,.55)'; g.fillRect(0, 0, PW, PH);
      if (B) {
        // draw the boss alone, find its outline, and make a black silhouette of it
        B.state = B.kind === 'chandler' ? 'hover' : B.kind === 'wyrm' ? 'biteUp' : 'idle'; B.t = 0; B.flash = 0; if (B.kind === 'wyrm') { B.rise = 1; B.headUp = 70; B.face = -1; }
        const bc = document.createElement('canvas'); bc.width = W; bc.height = H; const bg = bc.getContext('2d'); ctx = bg;
        let eyesAt = null;   // where the eyes sit in this drawing, when the shape is not a plain block
        if (B.kind === 'wyrm') {
          // the wyrm rears out of the crust in an S: tail low on the right, coils twisting up to the head on the left, jaws open
          const A = { x:318, y:240 }, Hd = { x:178, y:96 }, dx = Hd.x - A.x, dy = Hd.y - A.y, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, N = 30;
          const at = u => { const sw = Math.sin(u * Math.PI * 2.6 + 0.3) * 40 * (1 - u * 0.55); return { x:A.x + dx * u + nx * sw, y:A.y + dy * u + ny * sw }; };
          for (let i = 0; i < N; i++) { const u = i / N, q = at(u); wyrmSeg(q.x, q.y, 3 + 7.5 * Math.pow(u, 0.6), false, 0.6, 1.3, i, 1, false); }
          const h = at(1); B.state = 'bite'; B.armorT = 0; drawWyrmHead(h.x, h.y, -1, B, false, 1.3, false);
          const ex = h.x - 4, ey = h.y - 2; eyesAt = [[ex - 5, ey], [ex + 5, ey]];
        } else drawBoss(cx0, 1.3);
        // only the solid body counts: glows and soft light are dropped, so the shadow is crisp
        const id = bg.getImageData(0, 0, W, H), d = id.data; let x0 = W, y0 = H, x1 = 0, y1 = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (y * W + x) * 4; if (d[k + 3] > 200) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; d[k] = 1; d[k + 1] = 2; d[k + 2] = 5; d[k + 3] = 255; } else d[k + 3] = 0; }
        bg.putImageData(id, 0, 0);
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, sil = document.createElement('canvas'); sil.width = bw; sil.height = bh; const sg = sil.getContext('2d');
        sg.drawImage(bc, x0, y0, bw, bh, 0, 0, bw, bh);
        // size it to fill about 40% of the frame, tilt it hard to the left
        const sc = Math.sqrt(0.4 * PW * PH / (bw * bh)), rot = B.kind === 'wyrm' ? -0.12 : -0.7, px = PW * 0.6, py = PH * 0.52;
        // light pours out from behind it
        g.globalCompositeOperation = 'lighter';
        const halo = g.createRadialGradient(px, py, 0, px, py, PW * 0.55); halo.addColorStop(0, `rgba(${col},.55)`); halo.addColorStop(0.35, `rgba(${col},.18)`); halo.addColorStop(1, `rgba(${col},0)`);
        g.fillStyle = halo; g.fillRect(0, 0, PW, PH);
        for (let i = 0; i < 14; i++) { const a = rot + i / 14 * TAU, w = 0.05 + (i % 3) * 0.03; g.fillStyle = `rgba(${col},${0.05 + (i % 2) * 0.05})`;
          g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a - w) * PW, py + Math.sin(a - w) * PW); g.lineTo(px + Math.cos(a + w) * PW, py + Math.sin(a + w) * PW); g.fill(); }
        g.globalCompositeOperation = 'source-over';
        const put = (dx, dy, extra, alpha, blur) => { g.save(); g.globalAlpha = alpha; g.imageSmoothingEnabled = false; g.translate(px + dx, py + dy); g.rotate(rot + extra); g.scale(sc, sc);
          if (blur) { g.shadowColor = `rgba(${col},.95)`; g.shadowBlur = blur; } g.drawImage(sil, -bw / 2, -bh / 2); g.restore(); };
        // two echoes trailing it, as if it is lunging out of the dark
        put(-26, 14, 0.12, 0.18, 0); put(-13, 7, 0.06, 0.32, 0);
        put(0, 0, 0, 1, 18); put(0, 0, 0, 1, 6);
        // burning eyes, placed on the tilted body
        const cs = Math.cos(rot), sn = Math.sin(rot);
        const eyes = eyesAt ? eyesAt.map(([ex, ey]) => [(ex - x0 - bw / 2) * sc, (ey - y0 - bh / 2) * sc]) : [-0.17, 0.17].map(ex => [ex * bw * sc, -0.1 * bh * sc]);
        for (const [lx, ly] of eyes) { const x = px + lx * cs - ly * sn, y = py + lx * sn + ly * cs, r = (eyesAt ? 6 : 10) + sc * (eyesAt ? 0.8 : 1.2);
          g.globalCompositeOperation = 'lighter'; const eg = g.createRadialGradient(x, y, 0, x, y, r * 2.2); eg.addColorStop(0, `rgba(${hot},1)`); eg.addColorStop(0.25, `rgba(${col},.75)`); eg.addColorStop(1, `rgba(${col},0)`);
          g.fillStyle = eg; g.fillRect(x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4); g.globalCompositeOperation = 'source-over';
          g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = '#fff3d6'; g.fillRect(-sc * 1.2, -sc * 0.45, sc * 2.4, sc * 0.9); g.restore(); }
        // embers drift up through the scene
        for (let i = 0; i < 40; i++) { const x = (i * 97) % PW, y = (i * 53) % PH, k = (i % 5) / 5; g.fillStyle = `rgba(${hot},${0.25 + k * 0.5})`; g.fillRect(x, y, k > 0.6 ? 2 : 1, k > 0.6 ? 2 : 1); }
      }
      // heavy vignette and a burnt floor glow
      const v = g.createRadialGradient(PW * 0.58, PH * 0.5, PH * 0.25, PW * 0.58, PH * 0.5, PW * 0.7); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.85)');
      g.fillStyle = v; g.fillRect(0, 0, PW, PH);
      const fg = g.createLinearGradient(0, PH * 0.7, 0, PH); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, `rgba(${col},.18)`); g.fillStyle = fg; g.fillRect(0, PH * 0.7, PW, PH * 0.3);
      out[n] = { boss:c.toDataURL('image/jpeg', 0.86) };
    }
  } catch (e) { console.error(e); }
  finally { ctx = saveCtx; loadRoom(FIRST, 'P'); Object.assign(P, saveP); }
  return (CH_PREVIEW = out);
}
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  // a slow device (long frames for ~2.5 s in play) switches to lighter effects: fewer fire puffs, particles and motes
  if (G.state === 'play' && !document.hidden) { frame.ema = (frame.ema || 0.016) * 0.95 + dt * 0.05; frame.slow = frame.ema > 0.021 ? (frame.slow || 0) + dt : 0; if (frame.slow > 2.5 && !G.lite) G.lite = true; }
  { const m = G.state !== 'play' || !!G.descend; if (m !== frame.menu) { frame.menu = m; $('gameWrap').classList.toggle('menu', m); if (m) padReset(); } }
  pollPad();
  if (G.state === 'play') {
    acc += dt * (window.__uwTs || 1); let first = true;   // the skill lab can slow time down
    while (acc >= STEP) { step(STEP); acc -= STEP; if (first) { clearHits(); first = false; } }
  } else { acc = 0; clearHits(); }
  if (G.descend) { G.descend.t += dt; if (G.descend.t >= DESCEND_T) { const m = G.descend.mode; G.descend = null; startRun(m); } }
  if (G.iris) { G.iris.t += dt; if (G.iris.t >= IRIS_T) G.iris = null; }
  if (G.blackIn > 0) G.blackIn = Math.max(0, G.blackIn - dt);
  if (G.story) updateStory(dt);
  render(now / 1000);
  if (G.story) drawStory(now / 1000);
  flushText();
  updateHUD();
  updateBgm();
  if (G.state === 'title' && G.menu === 'home' && G.homeFocus === 'party' && !G.descend) drawPartyPreview(now / 1000, dt);
  if (G.state === 'title' && G.menu === 'chars') drawCharSheet(now);
  requestAnimationFrame(frame);
}

