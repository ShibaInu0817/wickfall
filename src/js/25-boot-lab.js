// ---------- boot (keeps progress across live updates)
function start(data) {
  data = data || {};
  if (TOUCH) $('touch').classList.add('on');
  // notes panel: closed by default on phones, remembers the viewer's choice
  const info = $('info');
  let pref = null; try { pref = localStorage.getItem('wf-info'); } catch (_) {}
  if (pref === 'open') info.open = true; else if (pref === 'closed' || TOUCH) info.open = false;
  info.addEventListener('toggle', () => { try { localStorage.setItem('wf-info', info.open ? 'open' : 'closed'); } catch (_) {} });
  layout();
  if (data.started && data.ver === 3) {
    G.skills = data.skills || {};
    if (ROSTER.includes(data.char)) G.char = data.char;
    P.maxHp = heroMaxHp();
    G.bossDown = !!data.bossDown; G.time = data.time || 0; G.deaths = data.deaths || 0; G.cp = data.cp || { room:FIRST }; G.chapter = data.chapter || 1; G.coins = data.coins || 0; G.coinGot = data.coinGot || {}; G.lit = data.lit || {}; G.broken = data.broken || {}; G.hinted = data.hinted || {};
    resetPlayer(); P.hp = data.hp || P.maxHp; P.wax = data.wax || 0;
    G.state = 'paused'; loadRoom(G.cp.room, 'S'); setOverlay('paused'); setPauseLabels('Resume');
  } else {
    G.menu = 'home'; G.homeFocus = 'menu'; loadRoom(FIRST, 'P'); setOverlay('title');
  }
  syncSkillUI();
  requestAnimationFrame(frame);
}
// ---------- Chapter 3 boss lab: opened as lab.html (or with #lab), the game drops straight into the Kiln Pit,
// takes commands from the page around it (hero, stage, tuning) and reports how each attempt went.
const LAB = { on:(typeof location !== 'undefined' && /lab/i.test(location.hash + location.pathname)) || !!window.UW_LAB, last:null, run:null, god:false };
function labPost(m) { try { if (window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ uw:1 }, m), '*'); } catch (_) {} }
function labStart(o) {
  o = Object.assign({ hero:G.char || 'wick', stage:1, intro:false }, o || {}); LAB.last = o;
  if (ROSTER.includes(o.hero)) G.char = o.hero;
  newGame('ch3'); G.iris = null; G.hinted = { start:1, shrine:1, cocoon:1 };
  const ki = ROOM_DEFS.findIndex(d => d.id === 'kiln'); G.cp = { room:ki };
  loadRoom(ki, 'a'); P.wax = 99; clearTimeout(bannerTimer); try { $('banner').classList.remove('show'); } catch (_) {}
  const B = G.boss;
  if (o.stage === 3) {
    // the hidden duel: the cooled pit, sunk in dark red, and Wick Hero's shadow waiting at the far end
    setDoor(true); G.kilnCool = 1; G.umbraArena = true;
    G.ledges = KILN_LEDGES.map(([x, y, w]) => ({ x, y, w, k:1, d:0, on:true })); for (const L of G.ledges) for (let j = 0; j < L.w; j++) G.room.g[L.y][L.x + j] = 3; buildTiles();
    const U = G.boss = mkUmbra(22 * T); U.face = -1;
    if (o.quick) { U.state = 'uIdle'; U.atk = 99; } else { U.state = 'intro'; U.t = CINE_T; startBossCine(U, 'The Black Wick', 'What the cold flame left behind'); }
    P.x = 8 * T;
  } else if (o.stage === 2) {
    setDoor(true); G.kilnCool = 1;
    G.ledges = KILN_LEDGES.map(([x, y, w]) => ({ x, y, w, k:1, d:0, on:true })); for (const L of G.ledges) for (let j = 0; j < L.w; j++) G.room.g[L.y][L.x + j] = 3; buildTiles();
    const M = G.boss = mkMoth(16 * T, MOTH_CRUISE); M.state = 'fly'; M.y = M.ty = MOTH_CRUISE; M.atk = 1.6;
    P.x = 8 * T;
  } else if (!o.intro && B) { setDoor(true); B.state = 'under'; B.atk = 1.4; B.hx = 18 * T; P.x = 8 * T; }
  P.y = 12 * T + T - P.h; P.vy = 0; G.cam.x = clamp(P.x + P.w / 2 - W / 2, 0, G.room.w * T - W);
  LAB.run = { hero:G.char, stage:o.stage, t0:G.time, hits:0, stuns:0, mstuns:0, deaths:0, t1:null, done:false, lastHp:P.hp, lastState:'' };
  labPost({ type:'start', hero:G.char, stage:o.stage });
}
function labTick() {
  const R = LAB.run; if (!R || !G.room) return;
  const B = G.boss;
  if (LAB.god && P.hp < P.maxHp) P.hp = P.maxHp;
  if (P.hp < R.lastHp) R.hits += R.lastHp - P.hp; R.lastHp = P.hp;
  const key = B ? B.kind + ':' + B.state : '';
  if (B && B.state === 'stun' && R.lastState !== key) { if (B.kind === 'wyrm') R.stuns++; else R.mstuns++; }
  if (B && B.kind === 'moth' && R.t1 == null) R.t1 = G.time - R.t0;
  R.lastState = key;
  const won = G.state === 'won' || (G.bossDown && !B);
  if (won && !R.done) { R.done = true; labPost({ type:'result', ok:true, hero:R.hero, stage:R.stage, time:G.time - R.t0, t1:R.t1, hits:R.hits, stuns:R.stuns, mstuns:R.mstuns, deaths:R.deaths, tune:Object.assign({}, TUNE) }); }
  labPost({ type:'stats', kind:B ? B.kind : null, state:B ? B.state : (won ? 'beaten' : ''), bhp:B ? Math.max(0, Math.round(B.hp * 10) / 10) : 0, bmax:B ? B.maxHp : 0, hp:P.hp, maxHp:P.maxHp, wax:Math.round(P.wax), time:Math.round((G.time - R.t0) * 10) / 10, stuns:R.stuns, mstuns:R.mstuns, hits:R.hits, deaths:R.deaths, god:LAB.god });
}
// the Black Wick skill lab: reset the duel to a clean pose and play exactly one skill
function umbraShow(m) {
  initAudio();
  const hero = ROSTER.includes(m.hero) ? m.hero : G.char;
  if (m.move === 'intro') { labStart({ hero, stage:3 }); return; }
  let B = G.boss;
  if (!B || B.kind !== 'umbra' || B.state === 'dead' || G.state !== 'play' || P.dead || G.char !== hero) { labStart({ hero, stage:3, quick:true }); B = G.boss; }
  if (!B) return;
  const floorY = 13 * T, rw = G.room.w * T;
  Object.assign(B, { state:'uIdle', atk:99, vx:0, vy:0, hide:false, lines:[], waves:[], marks:[], smoke:[], sev:null, flash:0, t:0, glint:0, reps:0 });
  B.maxHp = TUNE.umbraHp; B.hp = m.p2 ? Math.floor(B.maxHp * 0.45) : B.maxHp; B.enraged = !!m.p2;
  B.x = clamp(rw / 2 + 50, 4 * T, rw - 4 * T) - B.w / 2; B.y = floorY - B.h; B.face = -1;
  P.x = B.x + B.w / 2 - (m.dist || 80) - P.w / 2; P.y = floorY - P.h; P.vx = 0; P.vy = 0; P.hp = P.maxHp; P.face = 1; P.inv = 0.3; P.atkT = 0;
  G.fpuffs = []; G.cam.x = clamp((P.x + B.x) / 2 - W / 2, 0, rw - W);
  if (m.move === 'enrage') { B.enraged = false; return; }
  if (m.move === 'death') { umbraDie(B); return; }
  if (m.move === 'idle') return;
  umbraStart(B, m.move);
}
function labCmd(m) {
  if (!m || !m.uw) return;
  if (m.cmd === 'start') { initAudio(); labStart(m); }
  if (m.cmd === 'speed') window.__uwTs = clamp(+m.v || 1, 0.1, 2);
  if (m.cmd === 'hold') LAB.hold = !!m.on;
  if (m.cmd === 'ushow') umbraShow(m);
  if (m.cmd === 'tune' && m.key in TUNE) TUNE[m.key] = +m.val;
  if (m.cmd === 'tuneAll' && m.tune) for (const k in m.tune) if (k in TUNE) TUNE[k] = +m.tune[k];
  if (m.cmd === 'god') LAB.god = !!m.on;
  if (m.cmd === 'pause') togglePause();
  const B = G.boss;
  if (m.cmd === 'move' && B) {
    if (B.kind === 'wyrm' && m.move === 'hatch') { if (B.state !== 'pupa') { B.hp = 0; bossDie(); } }
    else if (B.kind === 'wyrm' && B.state === 'under') wyrmStart(B, m.move);
    if (B.kind === 'moth' && m.move === 'end') { G.boss = null; G.bossDown = true; setDoor(false); G.skills.flare = true; for (const e of G.enemies) if (e.cinder) e.dead = true; openAbyss(); }
    else if (B.kind === 'moth' && B.state === 'fly') mothStart(B, m.move);
    if (B.kind === 'umbra' && B.state === 'uIdle') umbraStart(B, m.move);
  }
  if (m.cmd === 'stun' && B) { if (B.kind === 'wyrm' && B.state === 'under') { B.state = 'stun'; B.t = TUNE.stunT; B.rise = 1; B.cap = 0; } if (B.kind === 'moth' && B.state === 'fly') { B.state = 'fall'; B.vy = 40; B.cap = 0; } }
  if (m.cmd === 'focus') { try { window.focus(); cv.focus && cv.focus(); } catch (_) {} }
}
if (LAB.on) {
  document.documentElement.classList.add('lab');
  window.addEventListener('message', e => labCmd(e.data));
  setInterval(labTick, 200);
  window.uwLab = { start:labStart, tune:TUNE, cmd:labCmd };
}
try {
  window.claude?.hot?.snapshot?.(() => ({ started:G.state !== 'title' && !G.gal, bossDown:G.bossDown, time:G.time, deaths:G.deaths, cp:G.cp, hp:P.hp, wax:P.wax, hinted:G.hinted, skills:G.skills, char:G.char, chapter:G.chapter, coins:G.coins, coinGot:G.coinGot, lit:G.lit, broken:G.broken, ver:3 }));
} catch (_) {}
if (LAB.on) { start({}); setTimeout(() => labStart({ hero:'wick', stage:1 }), 120); }
else window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
