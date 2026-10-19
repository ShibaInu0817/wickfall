// The scenes: each stages the game, then a small per-frame controller plays it like a player would.
// Controllers run inside the game (window.__ctl(i)), with the game's own press()/release().
const S = {};
const ctl = src => `window.__ctl = function(i){ ${src} };`;

// Wick Hero runs through Wickhollow, cutting down what is in the way and hopping the spine pits
S.hollowRun = { frames:230, setup:`__stage({ ch:1, room:'hollow', hero:'hero', x:5, god:true, notoast:true, nobanner:true });` + ctl(`
  press('right'); const tx = (P.x + P.w / 2) / T;
  const near = G.enemies.find(e => !e.dead && e.x + e.w > P.x && e.x - (P.x + P.w) < 30 && Math.abs((e.y + e.h / 2) - (P.y + P.h / 2)) < 26);
  if (near && i % 12 === 0) press('attack'); if (i % 12 === 3) release('attack');
  if ((tx > 9.4 && tx < 10.6) || (tx > 14.3 && tx < 15.6) || (tx > 37.2 && tx < 38.4) || (tx > 27.6 && tx < 28.6)) press('jump'); else if (P.vy > -40) release('jump');`) };

// the alcove inside the Wickhollow pillar: walk into the rock, it fades, the lore stone speaks
S.alcove = { frames:300, setup:`__stage({ ch:1, room:'hollow', hero:'wick', x:26.2, god:true, notoast:true, nobanner:true }); G.enemies = [];` + ctl(`
  if (i < 70) press('right'); else release('right');`) };

// pogo across the Drip's spine field
S.pogo = { frames:240, setup:`__stage({ ch:1, room:'drip', hero:'wick', x:9, y:9, god:true, notoast:true, nobanner:true }); G.enemies = G.enemies.filter(e => e.type !== 'flyer' && e.type !== 'wisp'); P.vy = -60;` + ctl(`
  press('right'); press('down');
  if (!P.grounded && P.vy > 40 && P.y + P.h > 13 * T - 26 && P.atkT <= 0) press('attack'); else release('attack');
  if (P.grounded) { press('jump'); } else if (P.vy > 0) release('jump');`) };

// the Warden: wind-up, charge, the hero leaps it, it slams the wall and the hero cuts it while it reels
S.warden = { frames:250, setup:`__stage({ ch:1, room:'cinder', hero:'knight', x:7, god:true, notoast:true, nobanner:true });
  const B = G.boss; B.state = 'idle'; B.t = 0.7; B.face = -1; G.cine = null; setDoor(true); window.__wd = 0;` + ctl(`
  const B = G.boss; if (!B) return; const pcx = P.x + P.w / 2, bcx = B.x + B.w / 2, d = Math.abs(bcx - pcx);
  if (i === 25) { B.next = 'charge'; B.state = 'windup'; B.t = 0.52; B.face = pcx < bcx ? -1 : 1; }
  if (B.state === 'charge' && d < 74 && P.grounded) { press('jump'); window.__wd = 18; }
  if (window.__wd > 0) { window.__wd--; press('right'); } else release('right');
  if (window.__wd === 0) release('jump');
  if (B.state === 'stun' || (i > 120 && B.state === 'idle' && d < 60)) { if (pcx > bcx + 20) press('left'); else release('left'); if (i % 14 === 0) press('attack'); if (i % 14 === 3) release('attack'); }
  if (B.state === 'idle' && i > 150) B.t = Math.max(B.t, 0.3);`) };

// the Chandler: its intro with the name banner (for the screenshot) — no skipping
S.chandlerIntro = { frames:250, setup:`__stage({ ch:2, room:'hall', hero:'hero', x:5, god:true, notoast:true });` + ctl(`
  if (i < 40) press('right'); else release('right');`) };

// the Chandler attacking: volley tell, globs, the hero dashing clear, then its ward
S.chandler = { frames:240, setup:`__stage({ ch:2, room:'hall', hero:'hero', x:16, god:true, notoast:true, nobanner:true });
  const B = G.boss; B.state = 'hover'; B.y = B.ty = T + 2; G.cine = null; setDoor(true); B.wardCD = 99;` + ctl(`
  const B = G.boss; if (!B) return;
  if (i === 20) startChandler(B, 'volley', false);
  if (i === 70) press('dash'); if (i === 74) release('dash');
  if (i > 60 && i < 90) press('left'); else release('left');
  if (i === 130) startChandler(B, 'wave', true);
  if (i > 150 && i < 175) press('jump'); else release('jump');`) };

// the Wyrm: it rises in a quake, the hero drops onto its skull with a Wax Dive and it falls stunned
S.wyrm = { frames:260, setup:`__stage({ lab:{ stage:1 }, hero:'hero', god:true, notoast:true, nobanner:true }); G.boss.atk = 99; window.__wy = 0;` + ctl(`
  const B = G.boss; if (!B) return;
  if (i === 10) wyrmStart(B, 'quake');
  if (B.state === 'quakeUp' && !window.__wy) { const hd = wyrmHead(B); P.x = hd.x - P.w / 2; P.y = hd.y - 70; P.vy = -120; P.grounded = false; window.__wy = i; }
  if (window.__wy && i === window.__wy + 14) { press('down'); press('skill'); }
  if (window.__wy && i === window.__wy + 18) { release('down'); release('skill'); }
  if (B.state === 'stun') { const hd = wyrmHead(B), pcx = P.x + P.w / 2; if (Math.abs(hd.x - pcx) > 16) press(hd.x > pcx ? 'right' : 'left'); else { release('left'); release('right'); }
    P.face = hd.x > pcx ? 1 : -1; if (i % 12 === 0) press('attack'); if (i % 12 === 3) release('attack'); }`) };

// the Moth's triple slash: three lights, struck while one burns, and it drops
S.moth = { frames:230, setup:`__stage({ lab:{ stage:2 }, hero:'hero', god:true, notoast:true, nobanner:true }); G.boss.atk = 99; window.__mt = 0;` + ctl(`
  const B = G.boss; if (!B) return; const pcx = P.x + P.w / 2, bcx = B.x + B.w / 2;
  if (i === 15) mothStart(B, 'slash');
  P.face = bcx > pcx ? 1 : -1;
  if (B.state === 'slash' && B.green >= 0 && Math.abs(bcx - pcx) < 56 && !window.__mt) { press('attack'); window.__mt = i; }
  if (window.__mt && i === window.__mt + 3) release('attack');
  if (B.state === 'stun' || B.state === 'fall') { if (i % 12 === 0) press('attack'); if (i % 12 === 3) release('attack'); }`) };

// a finishing move: Wick Hero's Severance on the Warden
S.finisher = { frames:300, setup:`__stage({ ch:1, room:'cinder', hero:'hero', x:22, god:true, notoast:true, nobanner:true });
  const B = G.boss; B.state = 'idle'; B.t = 9; G.cine = null; setDoor(true); B.hp = 0; bossDie();` + ctl(`
  const B = G.boss; if (!B) return; const pcx = P.x + P.w / 2, bcx = B.x + B.w / 2;
  if (!G.finish) { if (Math.abs(bcx - pcx) > 22) press(bcx > pcx ? 'right' : 'left'); else { release('left'); release('right'); press('up'); } }
  else { release('up'); release('left'); release('right'); }`) };

// the tease: the kiln gone cold, the abyss opens and beside it a black crack tears the air
S.crack = { frames:300, setup:`__stage({ ch:3, room:'kiln', hero:'hero', x:10, notoast:true, nobanner:true }); G.bossDown = true; loadRoom(ROOM_DEFS.findIndex(d => d.id === 'kiln'), 'a'); G.state = 'play';
  P.x = 7 * T; G.deaths = 0; G.gal = null; openAbyss(); try { clearTimeout(toastTimer); } catch (_) {} toastEl.classList.remove('show');` + ctl(`
  `) };

// the camp: three heroes by the shrine, menus hidden
S.camp = { frames:120, setup:`toTitle('home'); document.body.classList.add('cap-nohud'); overlay.hidden = true;` + ctl(`overlay.hidden = true;`) };

// the opening story card, as the game plays it
S.story = { frames:330, setup:`leaveGallery(); G.state = 'title'; startStory('ch1');` + ctl(``) };

// Lampknight on the Kiln Stair: the ash moth swarm comes down and scatters under the greatsword
S.stair = { frames:220, setup:`__stage({ ch:3, room:'stair', hero:'knight', x:19, god:true, notoast:true, nobanner:true }); G.enemies = G.enemies.filter(e => e.type === 'ashmoth');` + ctl(`
  const near = G.enemies.find(e => !e.dead && Math.abs((e.x + e.w / 2) - (P.x + P.w / 2)) < 40 && Math.abs((e.y + e.h / 2) - (P.y + P.h / 2)) < 44);
  if (!near && i < 150) press('right'); else release('right');
  if (near) { P.face = near.x > P.x ? 1 : -1; const up = near.y + near.h < P.y - 4; if (up) press('up'); else release('up'); if (i % 10 === 0) press('attack'); if (i % 10 === 3) release('attack'); }
  else release('up');`) };

// the Locks: a puppet swinging and the eel leaping from the spine pit
S.locks = { frames:200, setup:`__stage({ ch:2, room:'locks', hero:'wick', x:38, god:true, notoast:true, nobanner:true });` + ctl(`
  if (i > 20 && i < 140) press('right'); else release('right');
  if (i === 70) press('jump'); if (i === 84) release('jump');`) };

// the Black Wick's entrance, as the game plays it at the start of the duel (src/js/12-black-wick.js, startUmbraEntrance)
S.wickRise = { frames:440, setup:`__stage({ ch:3, room:'kiln', hero:'hero', god:true, nohud:true, notoast:true, nobanner:true }); G.duel = true; umbraArenaSetup(false);` + ctl(``) };

module.exports = S;
