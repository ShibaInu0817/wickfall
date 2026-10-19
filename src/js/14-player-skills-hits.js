// ---------- player
const RUN = 118, GRAV = 1050, JUMP_V = 340, MAX_FALL = 380, COYOTE = 0.09;
const RESPAWN_INV = 1.5;   // protection after a respawn or a spine return, long enough to step clear of whatever was there
function atkBox() {
  const cx = P.x + P.w / 2, r = CH().reach * (P.fin ? 1.25 : 1);
  if (G.char === 'wick') {
    if (P.atkDir === 'up') return { x:cx - 20, y:P.y - 23, w:40, h:28 };
    if (P.atkDir === 'down') return { x:cx - 20, y:P.y + P.h - 4, w:40, h:24 };
    return P.face > 0 ? { x:P.x + P.w - 2, y:P.y - 10, w:29, h:32 } : { x:P.x + 2 - 29, y:P.y - 10, w:29, h:32 };
  }
  if (P.atkDir === 'up') { const s = 22 * r; return { x:cx - s / 2, y:P.y + 2 - s, w:s, h:s }; }
  if (P.atkDir === 'down') { const s = 22 * r; return { x:cx - s / 2, y:P.y + P.h - 4, w:s, h:s }; }
  const w = 24 * r, h = 20 * (P.fin ? 1.3 : 1);
  return P.face > 0 ? { x:P.x + P.w - 2, y:P.y + 6 - h / 2, w, h } : { x:P.x + 2 - w, y:P.y + 6 - h / 2, w, h };
}
function pogo() { P.vy = -320; P.jumping = false; P.canDash = true; P.dashT = 0; sfx('pogo'); }
// a hit while focusing snuffs the flame and the wax already spent is lost
function breakFocus() {
  if (!(P.healT > 0)) return;
  if (P.focusSpent > 0) {
    burst(P.x + P.w / 2, P.y + 6, 16, { spd:90, life:0.6, colors:[C.wax, C.waxSh, '#8a8378'], size:2, g:380 });
    burst(P.x + P.w / 2, P.y + 2, 8, { spd:30, life:0.9, colors:['#6b6f7a', '#4a4e58'], size:2, g:-60 });
    sfx('snuff'); hint('focusbreak', 'A hit breaks your Focus and the wax spills. Heal where you are safe.', 3400);
  }
  P.focusSpent = 0; P.healT = 0;
}
const focusT = () => G.char === 'hero' ? 0.8 : 1.0;
function hurtPlayer(n, fromX) {
  if (P.inv > 0 || P.dead || P.locked > 0) return;
  if (G.gal && G.gal.god) { breakFocus(); P.inv = 0.4; G.shake = Math.max(G.shake, 3); sfx('clink'); return; }
  breakFocus();
  G.hits = (G.hits || 0) + 1;
  P.hp -= n; P.inv = 1.3; P.hitAt = G.time; P.hurtT = 0.25; P.healT = 0; P.dashT = 0; P.sit = false;
  const d = P.x + P.w / 2 < fromX ? -1 : 1;
  P.recoilT = 0.16; P.recoilV = d * 160; P.vy = -210;
  G.hitstop = 0.13; G.shake = 7; sfx('hurt'); buzz(45); hurtFx();
  burst(P.x + P.w / 2, P.y + 6, 14, { spd:130, life:0.5, colors:[C.ember, C.flame, '#2a1d33'], size:2, g:300 });
  if (P.hp <= 0) killPlayer();
}
function killPlayer() {
  P.dead = true; P.deadT = 1.5; P.hp = 0; G.deaths++;
  { const B = G.boss; G.retryBoss = B && !G.bossDown && !G.duel && !G.rush && !G.gal && !LAB.on && !['dormant', 'dead', 'downed'].includes(B.state) ? G.ri : null; if (G.retryBoss != null) { G.bossFalls = G.bossFalls || {}; G.bossFalls[B.kind] = (G.bossFalls[B.kind] || 0) + 1; G.retryKind = B.kind; } } sfx('die'); G.shake = 8; buzz([60, 40, 120]);
  burst(P.x + P.w / 2, P.y + 4, 40, { spd:160, life:1, colors:[C.wax, C.flame, C.cloak, C.core], size:2, g:120 });
}
function respawn() {
  startFade(() => {
    if (LAB.on && LAB.last) { const d = LAB.run ? LAB.run.deaths + 1 : 1; labStart(LAB.last); LAB.run.deaths = d; return; }
    if (G.rush) { G.rush.ended = true; G.state = 'won'; setOverlay('won'); return; }   // one fall and the rush is over
    if (G.duel) { startUmbraDuel(true); return; }   // fall in the duel and it starts again, falls counted
    if (G.retryBoss != null) { const ri = G.retryBoss; G.retryBoss = null; resetPlayer(); P.hp = P.maxHp; P.wax = 99; P.inv = RESPAWN_INV; G.quickCine = true; loadRoom(ri, 'a'); toast('Again.', 1400);
      if ((G.retryKind === 'wyrm' || G.retryKind === 'moth') && G.bossFalls[G.retryKind] >= 2) showTip(G.retryKind, 0.6);
      return; }
    resetPlayer(); P.hp = P.maxHp; P.wax = 0; P.inv = RESPAWN_INV;
    loadRoom(G.cp.room, 'S');
  });
}
function standingOnOneway() {
  const ty = Math.floor((P.y + P.h + 1) / T);
  const a = tileAt(Math.floor(P.x / T), ty), b = tileAt(Math.floor((P.x + P.w - 0.01) / T), ty);
  return (a === 3 || a === 0) && (b === 3 || b === 0) && (a === 3 || b === 3);
}

function updatePlayer(dt) {
  if (P.dead) { P.deadT -= dt; if (P.deadT <= 0 && !G.fadeDir) { P.deadT = 99; respawn(); } return; }
  P.inv -= dt; P.atkCD -= dt; P.castCD -= dt; P.comboT -= dt; if (P.comboT <= 0) P.combo = 0; P.atkBuf -= dt; P.atkT -= dt; P.dashCD -= dt; P.coyote -= dt; P.jumpBuf -= dt; P.recoilT -= dt; P.hurtT -= dt; P.dropT -= dt;
  P.anim += dt;
  if (I.hit.jump) P.jumpBuf = 0.12;

  // shrine rest
  G.nearShrine = !!(G.shrine && P.grounded && Math.abs((P.x + P.w / 2) - (G.shrine.x + 8)) < 16);
  if (G.shrine && !G.gal && Math.abs((P.x + P.w / 2) - (G.shrine.x + 8)) < 24 && G.cp.room !== G.ri) {
    G.cp = { room:G.ri }; G.shrine.lit = true; sfx('rest');
    burst(G.shrine.x + 8, G.shrine.y + 2, 16, { spd:50, life:0.8, colors:[C.flame, C.core], size:2, g:-60 });
    toast(G.boss ? 'Checkpoint lit. If you fall, you wake here, right before the fight.' : 'Checkpoint lit. If you fall, you wake at this candle.', 3000);
  }
  const sealed = G.boss && G.boss.kind === 'chandler' && G.boss.state !== 'dormant';
  if (G.nearShrine && I.hit.up && !P.sit && sealed) { if (G.time - (G.sealSaid || -9) > 2.5) { G.sealSaid = G.time; toast('The candle is sealed while the Chandler burns. No resting mid-fight.', 2600); sfx('clink'); } }
  else if (G.nearShrine && I.hit.up && !P.sit) {
    P.sit = true; P.vx = 0; P.hp = P.maxHp; G.cp = { room:G.ri }; G.shrine.lit = true; sfx('rest');
    burst(G.shrine.x + 8, G.shrine.y + 2, 24, { spd:60, life:1, colors:[C.flame, C.core, C.wax], size:2, g:-60 });
    P.wax = Math.max(P.wax, 33);
    toast('Rested at the shrine. Embers restored, and wax enough for a skill.', 2600);
  }
  if (P.sit) {
    if (I.down.left || I.down.right || I.hit.jump || I.hit.attack || I.hit.dash) P.sit = false;
    else { P.jumpBuf = 0; return; }
  }

  // focus (heal)
  const holding = P.grounded && P.hp < P.maxHp && I.down.heal && P.dashT <= 0 && P.atkT <= 0 && P.hurtT <= 0 && !P.sit;
  if (holding && (P.healT > 0 || P.wax >= 33)) {
    const ft = focusT();
    if (P.healT <= 0) { P.focusSpent = 0; P.focusTick = 0; sfx('focusStart'); }
    P.healT += dt;
    const want = Math.min(33, 33 * P.healT / ft); P.wax = Math.max(0, P.wax - (want - P.focusSpent)); P.focusSpent = want;
    const k = Math.min(1, P.healT / ft), cx = P.x + P.w / 2, cy = P.y + 8;
    // embers spiral in toward the body
    for (let i = 0; i < 2; i++) { const a = rand(0, TAU), r = 26 - k * 6; G.parts.push({ x:cx + Math.cos(a) * r, y:cy + Math.sin(a) * r * 0.7, vx:-Math.cos(a) * 60 - Math.sin(a) * 40, vy:-Math.sin(a) * 42 + Math.cos(a) * 28 - 10, life:0.4, max:0.4, c:Math.random() < 0.5 ? C.flame : (Math.random() < 0.5 ? C.ember : C.core), s:Math.random() < 0.3 ? 2 : 1, g:-40 }); }
    P.focusTick -= dt; if (P.focusTick <= 0) { P.focusTick = 0.11; sfx('focusTick', k); }
    if (P.healT >= ft) {
      P.healT = 0; P.focusSpent = 0; P.hp++; sfx('heal'); sfx('focusDone');
      G.fx.push({ k:'ring', x:cx, y:cy, t:0.4, max:0.4, r:40, c:'242,165,65' }); G.fx.push({ k:'ring', x:cx, y:cy, t:0.25, max:0.25, r:22, c:'255,241,193' });
      burst(cx, P.y + 4, 26, { spd:110, life:0.7, colors:[C.core, C.flame, C.ember], size:2, g:-120, ang:-Math.PI / 2, spread:1.1 });
      screenFlash(0.22, 0.08, '255,190,120'); G.hitstop = Math.max(G.hitstop, 0.05);
    }
  } else if (P.healT > 0) {
    // let go early: the wax flows back
    P.wax = Math.min(99, P.wax + (P.focusSpent || 0)); P.focusSpent = 0; P.healT = 0; sfx('fizzle');
  }

  // dash
  if (I.hit.dash && P.dashCD <= 0 && (P.grounded || P.canDash) && P.healT <= 0 && !P.dive && P.flareT <= 0) {
    P.dashT = CH().dashT; P.dashCD = 0.42; if (!P.grounded) P.canDash = false;
    P.dashDir = I.down.left ? -1 : I.down.right ? 1 : P.face; P.face = P.dashDir; P.recoilT = 0; sfx('dash');
  }

  if (P.dive) {
    P.vx = 0; P.vy = 560; P.inv = Math.max(P.inv, 0.12);
    G.parts.push({ x:P.x + P.w / 2 + rand(-4, 4), y:P.y + rand(-6, 4), vx:0, vy:-60, life:0.3, max:0.3, c:Math.random() < 0.5 ? C.eye : C.wax, s:2, g:0 });
  } else if (P.flareT > 0) {
    P.flareT -= dt; P.vx = 0; P.vy = 0;
  } else if (P.dashT > 0) {
    P.dashT -= dt; P.vx = P.dashDir * CH().dashV; P.vy = 0;
    if (Math.random() < 0.8) G.parts.push({ x:P.x + P.w / 2 + rand(-3, 3), y:P.y + rand(2, 12), vx:-P.dashDir * 30, vy:0, life:0.25, max:0.25, c:C.wax, s:2, g:0 });
  } else if (P.healT > 0) {
    P.vx = 0; P.vy = Math.min(P.vy + GRAV * dt, MAX_FALL);
  } else {
    const dir = P.healT > 0 ? 0 : (I.down.right ? 1 : 0) - (I.down.left ? 1 : 0); // focusing roots you
    const kAtk = CH().combo && P.atkT > 0 && P.swing;
    if (dir && P.recoilT <= 0 && !kAtk) P.face = dir;
    if (P.recoilT > 0) P.vx = P.recoilV;
    else if (kAtk && G.char === 'hero') {
      const sw = P.swing, pp = 1 - P.atkT / P.atkDur;
      // the draw cut crosses the gap but stops about a tile short of any foe, so it never runs into contact damage
      if (sw.iai && P.atkDir === 'side' && pp >= sw.wE && pp <= sw.sE && !enemyAhead(18)) P.vx = P.face * 280;
      else if (spellTargets().some(e => overlap(P, e))) P.vx = -P.face * 90; // already touching a foe: ease back out
      else if (sw.sev) P.vx = 0;
      else if (P.grounded) P.vx = approach(P.vx, 0, 2000 * dt);
    }
    else if (kAtk && P.grounded) {
      // heavy swings plant the feet, then step into the strike
      const sw = P.swing, pp = 1 - P.atkT / P.atkDur;
      // only a tiny shuffle forward (about 2px), and none at all when a foe is within reach
      if (P.atkDir === 'side' && pp >= sw.wE && pp <= sw.sE && !enemyAhead(16)) P.vx = P.face * 40;
      else P.vx = approach(P.vx, 0, 2000 * dt);
    }
    else P.vx = approach(P.vx, dir * CH().run, (P.grounded ? 2400 : 1800) * dt);

    if (P.jumpBuf > 0 && P.grounded && I.down.down && standingOnOneway()) { P.dropT = 0.22; P.jumpBuf = 0; P.y += 2; P.grounded = false; }
    if (P.jumpBuf > 0 && (P.grounded || P.coyote > 0)) {
      P.vy = -JUMP_V; P.jumping = true; P.jumpAge = 0; P.grounded = false; P.coyote = 0; P.jumpBuf = 0; sfx('jump'); dust(P.x + P.w / 2, P.y + P.h, 4);
    }
    // a quick tap still gives a decent hop; holding gives the full jump
    P.jumpAge = (P.jumpAge || 0) + dt;
    if (P.jumping && !I.down.jump && P.vy < 0 && P.jumpAge > 0.11) { P.vy *= 0.5; P.jumping = false; }
    if (P.vy >= 0) P.jumping = false;
    P.vy = Math.min(P.vy + GRAV * (G.floatT > 0 ? TUNE.floatG : 1) * dt, G.floatT > 0 ? MAX_FALL * 0.7 : MAX_FALL);
  }

  // attack
  // Lampknight buffers a press so a combo can be queued during the previous swing
  if (CH().combo && I.hit.attack) P.atkBuf = 0.22;
  const wantAtk = CH().combo ? P.atkBuf > 0 : I.hit.attack;
  if (wantAtk && P.atkCD <= 0 && P.healT <= 0 && P.dashT <= 0 && !P.dive && P.flareT <= 0) {
    P.atkDir = I.down.up ? 'up' : (I.down.down && !P.grounded) ? 'down' : 'side';
    if (G.char === 'hero') {
      // Wick Hero: draw cut, rising crescent, frost cross, then Severance
      P.atkBuf = 0;
      P.combo = P.comboT > 0 && P.combo < 4 ? P.combo + 1 : 1;
      P.fin = P.combo === 4 && P.atkDir === 'side';
      const sw = heroSwing(P.atkDir, P.combo, P.fin) || heroSwing('side', 1, false);
      P.swing = sw; P.atkDur = sw.d; P.atkT = sw.d; P.atkCD = sw.d * (P.fin ? 1 : 0.7); P.comboT = sw.d + 0.4;
      P.swFrom = P.swAng; P.struck = 0; P.hWin = -1;
      if (P.fin) startSeverance(); else sfx('hDraw');
    } else if (CH().combo) {
      // Lampknight (Vigil): forehand, backhand, rising cut, then a leaping fire cleave
      P.atkBuf = 0;
      P.combo = P.comboT > 0 && P.combo < 4 ? P.combo + 1 : 1;
      P.fin = P.combo === 4 && P.atkDir === 'side';
      const sw = knightSwing(P.atkDir, P.combo, P.fin);
      P.swing = sw; P.atkDur = sw.d; P.atkT = sw.d; P.atkCD = sw.d * (P.fin ? 0.95 : 0.72); P.comboT = sw.d + 0.35;
      P.swFrom = P.swAng; P.struck = false; P.landed = false;
      sfx(P.fin ? 'kIgnite' : 'kWind');
    } else {
      P.fin = false; P.atkT = SN.dur; P.atkCD = SN.cd;
      P.alt = P.atkDir === 'side' && G.time - (P.lastSlash || -9) < 0.6 ? !P.alt : false; P.lastSlash = G.time;
      sfx('nSlash', P.alt);
    }
    P.atkHit = new Set(); P.atkSpike = false;
  }
  // skills
  if (I.hit.skill && P.castCD <= 0 && P.healT <= 0 && P.dashT <= 0 && !P.dive && P.flareT <= 0) castSkill();

  // move
  const prevBottom = P.y + P.h;
  P.x += P.vx * dt; if (collideX(P)) P.vx = 0;
  P.y += P.vy * dt;
  const wasG = P.grounded, cy = collideY(P, prevBottom, P.dropT > 0);
  P.grounded = false;
  if (cy === 'floor') {
    if (P.dive) diveLand();
    else if (!wasG && P.vy > 240) { dust(P.x + P.w / 2, P.y + P.h, 5); sfx('land'); }
    P.vy = 0; P.grounded = true; P.canDash = true; P.coyote = COYOTE;
  } else if (cy === 'ceil') P.vy = 0;

  if (P.grounded) {
    const ty = Math.floor((P.y + P.h + 1) / T), l = tileAt(Math.floor((P.x - 3) / T), ty), r = tileAt(Math.floor((P.x + P.w + 3) / T), ty);
    if ((l === 1 || l === 3) && (r === 1 || r === 3) && !G.enemies.some(e => !e.dead && Math.abs(e.x + e.w / 2 - (P.x + P.w / 2)) < 48 && Math.abs(e.y + e.h / 2 - (P.y + P.h / 2)) < 32)) P.safe = { x:P.x, y:P.y };   // never return the hero next to a foe
  }

  // attack hits
  if (atkActive()) {
    const hb = atkBox();
    let landed = false;
    let dmg = P.fin ? 2 : 1, ho = { fin:P.fin, combo:CH().combo && !P.fin, fire:CH().combo && P.fin };
    if (G.char === 'hero') { const sw = P.swing; dmg = sw.dmg; ho = { hero:true, combo:true, gash:Array.isArray(sw.gash) ? sw.gash[Math.max(0, P.hWin)] : sw.gash }; }
    for (const e of G.enemies) if (!e.dead && !P.atkHit.has(e) && overlap(hb, e)) { P.atkHit.add(e); hitEnemy(e, dmg, ho); landed = true; }
    const B = G.boss;
    if (B && B.state !== 'dormant' && B.state !== 'dead' && !P.atkHit.has(B) && overlap(hb, B)) { P.atkHit.add(B); hitEnemy(B, dmg, ho); landed = true; }
    if (landed) {
      if (P.atkDir === 'down') pogo();
      else if (P.atkDir === 'side' && CH().combo) {
        P.lungeT = 0;
        if (P.fin) { P.recoilT = 0.09; P.recoilV = -P.face * 110; G.shake = Math.max(G.shake, 6); screenFlash(0.28, 0.08); }
      }
      else if (P.atkDir === 'side') { P.recoilT = 0.07; P.recoilV = -P.face * 130; }
    }
    if (P.atkDir === 'down' && !P.atkSpike) {
      const s = touchesSpike(hb);
      if (s) { P.atkSpike = true; pogo(); sfx('clink'); burst(s.x, s.y, 8, { spd:90, life:0.25, colors:[C.core, C.bone], size:1, g:200 }); }
    }
  }

  // spines
  if (G.fadeDir === 0) {
    const s = touchesSpike({ x:P.x + 2, y:P.y + 3, w:P.w - 4, h:P.h - 3 });
    if (s) {
      // in the tutorial spines only send you back
      breakFocus(); if (!G.room.def.tut && !(G.time - (P.hitAt ?? -9) < 1.3)) P.hp--; G.hitstop = 0.14; G.shake = 7; sfx('hurt'); buzz(45); hurtFx(); P.sit = false; P.healT = 0; P.dive = false; P.flareT = 0;   // knocked in by a hit: that hit already cost the ember
      burst(P.x + P.w / 2, P.y + 8, 16, { spd:140, life:0.5, colors:[C.ember, C.flame, C.bone], size:2, g:300 });
      if (G.gal && G.gal.god) P.hp = Math.max(P.hp, 1);
      if (P.hp <= 0) killPlayer();
      else { P.locked = 0.4; P.vx = 0; P.vy = 0; P.dashT = 0; hint('spine', tip('Spines cost an ember. In the air, hold the stick down and slash to bounce off them.', 'Spines cost an ember. Down-slash them in the air to bounce instead.')); }
    }
  }

  // room exits
  if (G.fadeDir === 0 && !P.dead) {
    if (P.x > G.room.w * T && G.room.def.tut) finishTutorial();
    else if (P.x > G.room.w * T && ROOM_DEFS[G.ri + 1] && ROOM_DEFS[G.ri + 1].ch === G.room.def.ch) { const n = G.ri + 1; startFade(() => loadRoom(n, 'a')); }
    else if (P.x + P.w < 0 && G.ri > 0 && ROOM_DEFS[G.ri - 1].ch === G.room.def.ch && !ROOM_DEFS[G.ri - 1].tut) { const n = G.ri - 1; startFade(() => loadRoom(n, 'b')); }
  }
}

// ---------- skills
const SK = {
  bolt:{ name:'Ember Bolt', col:'#f2a541', keys:'Press E to hurl a bolt of flame', touch:'Tap the spark button to hurl a bolt of flame',
    desc:() => `Ember Bolt pierces every foe in a line for ${skDmg('bolt')} damage and lights braziers.`, input:{ k:'E', t:'Spark button' } },
  dive:{ name:'Wax Dive', col:'#8ff0e0', keys:'Hold ↓ and press E to slam down', touch:'Hold the stick down and tap spark to slam down',
    desc:() => `Wax Dive plunges you down unharmed and bursts for ${skDmg('dive')} damage where you land. It cracks shells and melts through wax floors.`, input:{ k:'↓ + E', t:'Stick down + spark' } },
  flare:{ name:'Flare Burst', col:'#e2553f', keys:'Hold ↑ and press E to erupt', touch:'Hold the stick up and tap spark to erupt',
    held:true, desc:() => 'Flare Burst raises a column of fire above you that strikes up to four times.', input:{ k:'↑ + E', t:'Stick up + spark' } }
};
const SK_MULT = { bolt:3, dive:4, flare:1 };
const skDmg = id => SK_MULT[id] * (CH().slash || 1);
function skillsHTML() {
  return `<div class="skills">${Object.keys(SK).filter(id => !SK[id].held).map(id => G.skills[id]
    ? `<div class="sk"><b style="color:${SK[id].col}">${SK[id].name}</b><span>${tip(SK[id].input.t, SK[id].input.k)} · ${SK[id].desc().replace(SK[id].name + ' ', '')}</span></div>`
    : `<div class="sk lock"><b>${SK[id].name}</b><span>Bring ${COST} coins to a blacksmith to forge it.</span></div>`).join('')}</div><p class="hint">Coins: ${G.coins} · Each skill costs 33 wax.</p>`;
}
function syncSkillUI() { const b = document.querySelector('#touch [data-act="skill"]'); if (b) b.classList.toggle('locked', !Object.keys(G.skills).length); }
function castSkill() {
  let want = I.down.up ? 'flare' : I.down.down ? 'dive' : 'bolt';
  const now = performance.now();
  const say = m => { if (now - G.skillToastT > 1500) { G.skillToastT = now; toast(m, 2200); } };
  if (!Object.keys(G.skills).length) { say(`No skills yet. Bring ${COST} coins to a blacksmith.`); return; }
  if (!G.skills[want]) want = 'bolt'; // an unlearned direction falls back to Ember Bolt
  if (!G.skills[want]) { say(`No skills yet. Bring ${COST} coins to a blacksmith.`); return; }
  if (P.wax < 33) { say('Not enough wax. Land slashes to fill the vessel.'); sfx('clink'); return; }
  P.wax -= 33; P.castCD = 0.42; P.sit = false; P.atkT = 0;
  if (want === 'bolt') {
    G.spells.push({ k:'bolt', x:P.face > 0 ? P.x + P.w : P.x - 22, y:P.y, w:22, h:12, vx:P.face * 360, life:1.2, hit:new Set(), t:0 });
    P.recoilT = 0.11; P.recoilV = -P.face * 130; sfx('bolt'); screenFlash(0.2, 0.06, '255,170,80');
    const mx = P.x + P.w / 2 + P.face * 10, my = P.y + 6;
    G.fx.push({ k:'ring', x:mx, y:my, t:0.18, max:0.18, r:20, c:'255,200,120' });
    burst(mx, my, 14, { spd:220, life:0.3, colors:[C.core, C.flame, C.ember], size:2, g:0, ang:P.face > 0 ? 0 : Math.PI, spread:0.6 });
    G.shake = Math.max(G.shake, 3); G.hitstop = Math.max(G.hitstop, 0.03);
  } else if (want === 'dive') {
    P.dive = true; P.vx = 0; P.vy = 560; sfx('dash');
    if (P.grounded) diveLand();
  } else {
    P.flareT = 0.42; P.vx = 0; P.vy = 0; sfx('flare');
    G.spells.push({ k:'flare', x:P.x + P.w / 2 - 20, y:P.y - 58, w:40, h:62, life:0.42, max:0.42, tick:0 });
  }
}
function enemyAhead(px) {
  const box = { x:P.face > 0 ? P.x + P.w : P.x - px, y:P.y, w:px, h:P.h };
  return spellTargets().some(e => overlap(box, e));
}
function spellTargets() {
  const out = G.enemies.filter(e => !e.dead), B = G.boss;
  if (B && B.state !== 'dormant' && B.state !== 'dead') out.push(B);
  return out;
}
function diveLand() {
  P.dive = false; P.inv = Math.max(P.inv, 0.35);
  const cx = P.x + P.w / 2, fy = P.y + P.h, box = { x:cx - 46, y:fy - 30, w:92, h:34 };
  for (const e of spellTargets()) if (overlap(box, e)) hitEnemy(e, skDmg('dive'), { spell:true, dir:(e.x + e.w / 2) < cx ? -1 : 1, x:clamp(cx, e.x, e.x + e.w), y:clamp(fy - 8, e.y, e.y + e.h) });
  breakCracks();
  G.spells.push({ k:'quake', x:cx, y:fy, life:0.4, max:0.4 });
  G.shake = 10; G.hitstop = Math.max(G.hitstop, 0.08); screenFlash(0.45, 0.12); sfx('thud');
  dust(cx - 10, fy, 10); dust(cx + 10, fy, 10);
  burst(cx, fy - 2, 24, { spd:200, life:0.5, colors:[C.wax, C.eye, C.core], size:2, g:250, ang:-Math.PI / 2, spread:1.5 });
}
function updateSpells(dt) {
  for (const s of G.spells) {
    s.life -= dt;
    if (s.k === 'bolt') {
      s.x += s.vx * dt;
      s.t = (s.t || 0) + dt;
      for (let i = 0; i < 3; i++) G.parts.push({ x:s.x + s.w / 2 - Math.sign(s.vx) * rand(4, 12), y:s.y + rand(2, 10), vx:-s.vx * rand(0.05, 0.2), vy:rand(-30, 15), life:rand(0.2, 0.4), max:0.4, c:[C.core, C.flame, C.ember, C.ember][(Math.random() * 4) | 0], s:Math.random() < 0.4 ? 2 : 1, g:-60 });
      const fx = s.vx > 0 ? s.x + s.w : s.x;
      if (tileAt(Math.floor(fx / T), Math.floor((s.y + s.h / 2) / T)) === 1 || s.x < -40 || s.x > G.room.w * T + 40) {
        s.life = 0; burst(fx, s.y + s.h / 2, 20, { spd:170, life:0.4, colors:[C.flame, C.core, C.ember], size:2, g:100 });
        G.fx.push({ k:'ring', x:fx, y:s.y + s.h / 2, t:0.25, max:0.25, r:24, c:'242,165,65' }); G.shake = Math.max(G.shake, 3); sfx('boltWall');
      }
      const CB = G.boss;
      if (CB && CB.kind === 'chandler' && CB.wardT > 0 && s.life > 0) {
        const wx = CB.x + CB.w / 2, wy = CB.y + CB.h / 2 + 2;
        if (overlap(s, { x:CB.x - 9, y:CB.y - 6, w:CB.w + 18, h:CB.h + 14 })) {
          s.life = 0; sfx('absorb'); G.shake = Math.max(G.shake, 3);
          burst(s.x + s.w / 2, s.y + s.h / 2, 18, { spd:150, life:0.45, colors:['#c9b6ff', C.flame, '#ffffff'], size:2, g:0 });
          G.fx.push({ k:'ring', x:wx, y:wy, t:0.3, max:0.3, r:30, c:'201,182,255' });
          hint('ward', 'Its ward of flame swallows your bolts. Wait for it to drop, or catch the Chandler when it lands tired.', 4200);
        }
      }
      for (const e of spellTargets()) if (s.life > 0 && !s.hit.has(e) && overlap(s, e)) {
        s.hit.add(e); const hx = clamp(s.x + s.w / 2, e.x, e.x + e.w), hy = s.y + s.h / 2;
        if (e.kind === 'chandler') { e.bolts = (e.bolts || []).filter(tt => G.time - tt < 2.5); e.bolts.push(G.time); if (e.bolts.length >= 2 && e.wardT <= 0 && e.state !== 'tired') { startWard(e); e.bolts = []; } }
        hitEnemy(e, skDmg('bolt'), { spell:true, dir:Math.sign(s.vx), x:hx, y:hy });
        boltImpact(hx, hy, Math.sign(s.vx), !s.cracked); s.cracked = true;
      }
      for (const bz of G.braziers) if (!bz.lit && overlap(s, { x:bz.x - 6, y:bz.y - 8, w:12, h:14 })) { lightBrazier(bz); boltImpact(bz.x, bz.y - 2, Math.sign(s.vx), true); s.life = 0; }
    } else if (s.k === 'burn') {
      for (const e of spellTargets()) if (!s.hit.has(e) && overlap(s, e)) { s.hit.add(e); hitEnemy(e, 1, { spell:true, dir:P.face, x:clamp(s.x + s.w / 2, e.x, e.x + e.w), y:clamp(s.y + 6, e.y, e.y + e.h) }); }
      if (Math.random() < 0.8) burst(s.x + rand(2, s.w - 2), s.y + rand(4, 12), 1, { spd:20, life:0.5, colors:[C.ember, C.flame, C.core], size:2, g:-120 });
    } else if (s.k === 'flare') {
      s.x = P.x + P.w / 2 - 20; s.y = P.y - 58; s.tick -= dt;
      if (s.tick <= 0) { s.tick = 0.13; for (const e of spellTargets()) if (overlap(s, e)) hitEnemy(e, 1, { spell:true, up:true, x:clamp(P.x + P.w / 2, e.x, e.x + e.w), y:clamp(s.y + 30, e.y, e.y + e.h) }); }
      if (Math.random() < 0.8) burst(s.x + rand(4, 36), s.y + rand(20, 60), 1, { spd:30, life:0.4, colors:[C.flame, C.ember, C.core], size:2, g:-160 });
    }
  }
  G.spells = G.spells.filter(s => s.life > 0);
}
function updateCoins(dt) {
  for (const c of G.coinL) {
    c.t += dt;
    if (!P.dead && overlap(P, { x:c.x - 6, y:c.y - 7, w:12, h:14 })) {
      c.taken = true; G.coins++; G.coinGot[c.key] = true; sfx('coin');
      burst(c.x, c.y, 14, { spd:90, life:0.5, colors:['#ffe58a', '#e8c25a', '#ffffff'], size:2, g:120 });
      G.fx.push({ k:'ring', x:c.x, y:c.y, t:0.25, max:0.25, r:16, c:'255,229,138' });
      toast(`Coin ${G.coins}. ${G.coins >= COST ? 'Enough for the blacksmith.' : `The blacksmith wants ${COST}.`}`, 2200);
    }
  }
  G.coinL = G.coinL.filter(c => !c.taken);
  const S = G.smith; if (!S) return;
  S.t += dt;
  S.near = !P.dead && P.grounded && Math.abs((P.x + P.w / 2) - (S.x + 8)) < 22;
  const sk = SK[S.id], owned = !!G.skills[S.id];
  if (S.free) {
    if (S.near && !S.said) { S.said = true; if (!owned) toast(`Blacksmith: "You brought its fire back down. Let me forge it into ${sk.name}." ${tip('Push up.', 'Press ↑.')}`, 4600); }
    if (!S.near) S.said = false;
    if (S.near && I.hit.up && !owned) { sfx('anvil'); learnSkill({ x:S.x + 8, y:S.y + 2, id:S.id }); if (G.chapter === 3 && G.room.def.id === 'kiln' && !G.gal) setTimeout(openAbyssAfterTip, 2200); else G.winT = 4.2; }
    return;
  }
  if (S.near && !S.said) {
    S.said = true;
    toast(owned ? `Blacksmith: "${sk.name} is yours already. Burn bright."`
      : `Blacksmith: "${COST} coins and I'll forge you ${sk.name}." You have ${G.coins}. ${tip('Push up to trade.', 'Press ↑ to trade.')}`, 4200);
  }
  if (!S.near) S.said = false;
  if (S.near && I.hit.up && !owned) {
    if (G.coins >= COST) {
      G.coins -= COST; sfx('anvil');
      learnSkill({ x:S.x + 8, y:S.y + 2, id:S.id });
      if (S.id === 'dive' && G.cracks && G.cracks.size) setTimeout(() => toast(tip('Blacksmith: "East of here the floor is white wax. Stand on it, hold the stick down and tap spark to melt through."', 'Blacksmith: "East of here the floor is white wax. Stand on it and press ↓ + E to melt through."'), 5200), 2600);
    } else {
      const left = {};
      ROOM_DEFS.forEach((d, ri) => { if (d.ch !== G.chapter || d.tut) return; const tmp = makeRoom(d); for (const e of tmp.ents) if (e.type === 'o' && !G.coinGot[ri + ':' + e.x + ':' + e.y]) left[d.name] = (left[d.name] || 0) + 1; });
      const where = Object.entries(left).map(([n, k]) => `${k} in ${n}`).join(', ');
      toast(`Blacksmith: "Not enough. ${COST - G.coins} more coin${COST - G.coins > 1 ? 's' : ''}.${where ? ' Still out there: ' + where + '.' : ''}"`, 4200); sfx('clink');
    }
  }
}
function drawCoins(cx0, t) {
  for (const c of G.coinL) {
    const x = Math.round(c.x - cx0), y = Math.round(c.y + Math.sin(c.t * 2.4) * 1.5), w = Math.max(1, Math.round(Math.abs(Math.cos(c.t * 3)) * 5));
    const g = ctx.createRadialGradient(x, y, 0, x, y, 12); g.addColorStop(0, 'rgba(255,220,120,.28)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.fillRect(x - 12, y - 12, 24, 24);
    ctx.fillStyle = '#9a7a2a'; ctx.fillRect(x - w, y - 5, w * 2, 10); ctx.fillRect(x - w - 1, y - 4, w * 2 + 2, 8);
    ctx.fillStyle = '#e8c25a'; ctx.fillRect(x - w + (w > 1 ? 1 : 0), y - 4, Math.max(1, w * 2 - (w > 1 ? 2 : 0)), 8);
    if (w > 2) { ctx.fillStyle = '#fff1c1'; ctx.fillRect(x - 1, y - 3, 1, 5); }
    if ((c.t * 1.3) % 2 < 0.15) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 3, y - 6, 1, 3); ctx.fillRect(x + 2, y - 5, 3, 1); }
  }
  const S = G.smith; if (!S) return;
  const x = S.x - cx0, y = S.y + T, swing = (S.t % 1.4) / 1.4, hit = swing > 0.55 && swing < 0.62;
  // forge: a brick box with a glowing mouth
  ctx.fillStyle = '#3a2a24'; ctx.fillRect(x - 18, y - 16, 14, 16); ctx.fillStyle = '#4a362d'; ctx.fillRect(x - 18, y - 16, 14, 2);
  const fg = 0.6 + 0.4 * Math.sin(S.t * 7) * Math.sin(S.t * 3.1);
  ctx.fillStyle = `rgba(242,${120 + Math.round(fg * 60)},60,${0.8 + fg * 0.2})`; ctx.fillRect(x - 15, y - 9, 8, 5);
  const g = ctx.createRadialGradient(x - 11, y - 7, 0, x - 11, y - 7, 26); g.addColorStop(0, `rgba(242,140,60,${0.25 * fg + 0.1})`); g.addColorStop(1, 'rgba(242,140,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 37, y - 33, 52, 52);
  ctx.fillStyle = '#2a1e19'; ctx.fillRect(x - 13, y - 22, 4, 6);
  // anvil
  ctx.fillStyle = '#3c4150'; ctx.fillRect(x + 12, y - 8, 12, 3); ctx.fillRect(x + 15, y - 5, 6, 3); ctx.fillRect(x + 13, y - 2, 10, 2); ctx.fillStyle = '#596075'; ctx.fillRect(x + 12, y - 8, 12, 1);
  // the smith: a broad wax figure in a leather apron, hammer rising and falling
  ctx.fillStyle = '#1b1424'; ctx.fillRect(x + 2, y - 3, 2, 3); ctx.fillRect(x + 7, y - 3, 2, 3);
  ctx.fillStyle = '#4a3528'; ctx.fillRect(x + 1, y - 13, 10, 10); ctx.fillStyle = '#6b4c37'; ctx.fillRect(x + 3, y - 11, 6, 8);
  ctx.fillStyle = C.wax; ctx.fillRect(x + 2, y - 21, 8, 8); ctx.fillStyle = C.waxSh; ctx.fillRect(x + 2, y - 15, 8, 2);
  ctx.fillStyle = '#18121f'; ctx.fillRect(x + 6, y - 18, 1, 2); ctx.fillRect(x + 8, y - 18, 1, 2);
  ctx.fillStyle = '#2a2222'; ctx.fillRect(x + 5, y - 23, 1, 2); drawFlame(x + 5.5, y - 23, 0.8, t + 1, C.flame, C.core);
  const ang = swing < 0.55 ? -1.9 + swing / 0.55 * 0.9 : swing < 0.62 ? -1.0 + (swing - 0.55) / 0.07 * 1.5 : 0.5 - (swing - 0.62) / 0.38 * 2.4;
  const sx = x + 10, sy = y - 11, hx = sx + Math.cos(ang) * 9, hy = sy + Math.sin(ang) * 9;
  ctx.strokeStyle = '#6b4c37'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke();
  ctx.fillStyle = '#596075'; ctx.fillRect(Math.round(hx) - 2, Math.round(hy) - 2, 4, 3);
  if (hit && Math.random() < 0.7) burst(S.x + 18, S.y + T - 8, 3, { spd:90, life:0.3, colors:['#ffe58a', C.flame, '#ffffff'], size:1, g:300, ang:-Math.PI / 2, spread:1.2 });
  if (S.near && !G.skills[S.id] && G.state === 'play') {
    const bob = Math.round(Math.sin(t * 5) * 1.5);
    ctx.fillStyle = G.coins >= COST ? '#ffe58a' : C.wax; ctx.beginPath(); ctx.moveTo(x + 6, y - 36 + bob); ctx.lineTo(x + 10, y - 31 + bob); ctx.lineTo(x + 2, y - 31 + bob); ctx.fill();
  }
}
function updateRelics(dt) {
  for (const r of G.relics) { r.t += dt; if (!P.dead && overlap(P, { x:r.x - 7, y:r.y - 7, w:14, h:14 })) learnSkill(r); }
  G.relics = G.relics.filter(r => !r.taken);
}
function learnSkill(r) {
  r.taken = true; G.skills[r.id] = true; syncSkillUI();
  screenFlash(0.7, 0.3); G.hitstop = 0.2; sfx('rest'); sfx('heal');
  burst(r.x, r.y, 40, { spd:160, life:1, colors:[SK[r.id].col, C.core, '#ffffff'], size:2, g:-30 });
  G.fx.push({ k:'ring', x:r.x, y:r.y, t:0.5, max:0.5, r:60, c:'255,241,193' });
  P.wax = 99;
  showTip('skill:' + r.id, 0.5);
}

// ---------- hit effects: white slash streak, impact star, burst ring, screen flash
function screenFlash(a, dur, c) {
  if (COMF.flash) a *= 0.35;
  const cur = G.flash.t > 0 ? G.flash.a * (G.flash.t / G.flash.max) : 0;
  if (a >= cur) G.flash = { a, t:dur, max:dur, c:c || '255,255,255' };
}
function impact(x, y, ang, big) {
  G.fx.push({ k:'slash', x, y, ang, t:0.15, max:0.15, len:big ? 48 : 34 });
  G.fx.push({ k:'star', x, y, t:0.1, max:0.1, n:big ? 8 : 6, r:big ? 18 : 13, rot:rand(0, TAU) });
  G.fx.push({ k:'ring', x, y, t:0.2, max:0.2, r:big ? 28 : 18, c:'255,255,255' });
  burst(x, y, big ? 14 : 9, { spd:240, life:0.25, colors:['#ffffff', C.core, C.flame], size:2, g:100 });
}
function hurtFx() {
  screenFlash(0.6, 0.1); G.vig = 0.75; P.dive = false; P.flareT = 0;
  G.fx.push({ k:'ring', x:P.x + P.w / 2, y:P.y + 7, t:0.32, max:0.32, r:46, c:'226,85,63' });
  G.fx.push({ k:'star', x:P.x + P.w / 2, y:P.y + 7, t:0.14, max:0.14, n:10, r:22, rot:rand(0, TAU) });
}
function updateFx(dt) {
  if (G.shatter && G.shatter.t > 0) G.shatter.t -= dt;
  for (const f of G.fx) {
    f.t -= dt;
    if (f.k === 'shard') { f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 140 * dt; f.vx *= 0.97; f.rot += f.vr * dt; }
    if (f.k === 'gash' && f.t <= 0) for (let i = 0; i < 6; i++) { const k = Math.random() - 0.5;
      G.parts.push({ x:f.x + Math.cos(f.ang) * f.len * k, y:f.y + Math.sin(f.ang) * f.len * k, vx:rand(-8, 8), vy:rand(-10, -3), life:0.6, max:0.6, c:Math.random() < 0.5 ? '#cfeeff' : '#ffffff', s:1, g:10 }); }
  }
  G.fx = G.fx.filter(f => f.t > 0);
  if (G.flash.t > 0) G.flash.t -= dt;
  G.vig = Math.max(0, G.vig - dt * 1.6);
}

