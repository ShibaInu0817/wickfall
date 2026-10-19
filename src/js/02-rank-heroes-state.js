// ---------- stage rating: a 100-point score from four parts, turned into a rank
//   time 40 (full at or under par, nothing at 2.5x par) · falls 25 (-9 each) · hits taken 20 (-2 each) · embers left 15
const RANK_PAR = { 1:300, 2:420, 3:600, duel:150, rush:540 };   // seconds
const RANKS = [['S', 90], ['A', 75], ['B', 58], ['C', 40], ['D', 0]];
function rateRun() {
  const ch = G.rush ? 'rush' : G.duel ? 'duel' : G.chapter || 1, par = RANK_PAR[ch] || 360, t = G.time || 0, falls = G.deaths || 0, hits = G.hits || 0;
  const time = Math.round(t <= par ? 40 : 40 * Math.max(0, 1 - (t - par) / (1.5 * par)));
  const fall = Math.max(0, 25 - 9 * falls), hit = Math.max(0, 20 - 2 * hits), emb = Math.round(15 * Math.max(0, P.hp) / P.maxHp);
  const score = time + fall + hit + emb, rank = RANKS.find(([, min]) => score >= min)[0];
  let best = null;
  try { best = JSON.parse(localStorage.getItem('wf-best-ch' + ch) || 'null'); } catch (_) {}
  const assist = !!G.assisted;
  if (!assist && (!best || score > best.score)) { try { localStorage.setItem('wf-best-ch' + ch, JSON.stringify({ score, rank, hero:G.char, time:t })); } catch (_) {} }
  return { ch, par, t, falls, hits, score, rank, parts:{ time, fall, hit, emb }, best, assist, newBest:!assist && (!best || score > best.score) };
}
const tutDone = () => { try { return localStorage.getItem('wf-tut') === '1'; } catch (_) { return false; } };
// tutorial lessons: what the objective bar says, and when each lesson counts as done
const TUT_NEED = { slash:3, upslash:2 };
const TUT = {
  move:() => tip('Drag on the left half of the screen to move.', 'Move with ← → (or A and D).'),
  jump:() => tip('Tap Jump to hop the step. Hold Jump to clear the tall wall.', 'Space or Z to jump. Hold it to clear the tall wall.'),
  dash:() => tip('Jump, then tap Dash in mid-air to cross the gap.', 'Jump, then Shift (or C) in mid-air to dash over the gap.'),
  slash:() => tip('Tap Slash to strike the dummy.', 'Slash the dummy with X (or J).') + (CH().combo ? ' Keep slashing to chain the combo.' : ''),
  upslash:() => tip('The dummy hangs out of reach. Push the stick up and tap Slash.', 'It hangs out of reach. Hold ↑ and slash upward.'),
  focus:() => P.hp >= P.maxHp ? 'Embers full.' : P.wax < 33 && !(P.healT > 0) ? 'Focus needs a third of the wax vessel. Strike a dummy for more wax.'
    : tip('You are one ember short. Hold Focus to turn wax into an ember.', 'You are one ember short. Hold F to turn wax into an ember.'),
  pogo:() => tip('Too high to jump. Jump over the lantern, push the stick down and tap Slash to bounce up.', 'Too high to jump. Jump over the lantern, hold ↓ and slash it to bounce up.'),
  exit:() => 'That is everything. Walk on into Wickhollow.'
};
function tutDoneLesson(id) {
  if (TUT_NEED[id]) return (G.tutProg[id] || 0) >= TUT_NEED[id];
  if (id === 'focus') return P.hp >= P.maxHp;
  if (id === 'pogo') return P.grounded && P.y + P.h <= 9 * T + 1 && P.x > 63 * T;
  return false;
}

// ---------- heroes
const CHARS = {
  wick:{ name:'Wick', tag:'Normal', slash:1, maxHp:5, run:118, dashV:300, dashT:0.18, reach:1, combo:false,
    blurb:'A little candle-spirit with a short sword. Five embers and wide, sweeping slashes.' },
  knight:{ name:'Lampknight', tag:'Easier', slash:1.5, maxHp:7, run:106, dashV:270, dashT:0.16, reach:1.25, combo:true,
    blurb:'Armoured, seven embers, a two-handed greatsword and a heavy four-hit combo ending in a fire cleave.' },
  hero:{ name:'Wick Hero', tag:'Easiest', slash:3, maxHp:9, run:128, dashV:330, dashT:0.18, reach:1.6, combo:true,
    blurb:'A swordsman crowned with blue fire, carrying a polished katana. Nine embers, huge damage, and a finisher that cuts everything in a wide sphere ahead.' }
};
// the heroes you can pick, in order
const ROSTER = ['wick', 'knight', 'hero'];
// saves from before the rename call Wick 'snuff'
const heroId = id => id === 'snuff' ? 'wick' : id;
const CH = () => CHARS[G.char] || CHARS.wick;

// ---------- state
const P = { x:0, y:0, w:10, h:14, hp:5, maxHp:5, wax:0, safe:{x:0,y:0}, atkHit:new Set() };
const G = { state:'title', ri:0, room:null, tiles:null, bg:null, enemies:[], drops:[], waves:[], parts:[], cam:{x:0},
  shake:0, hitstop:0, fade:0, fadeDir:0, fadeCb:null, shrine:null, cp:{room:0}, boss:null, bossDown:false,
  time:0, deaths:0, winT:0, hinted:{}, nearShrine:false,
  fx:[], spells:[], relics:[], signs:[], signAct:null, menu:'home', chapter:1, coins:0, coinGot:{}, lit:{}, broken:{}, puddles:[], coinL:[], smith:null, shots:[], braziers:[], cracks:new Set(), skills:{}, flash:{ t:0, max:1, a:0, c:'255,255,255' }, vig:0, skillToastT:0, char:'wick' };
try { const c = heroId(localStorage.getItem('wf-char')); if (ROSTER.includes(c)) { G.char = c; localStorage.setItem('wf-char', c); } } catch (_) {}

function resetPlayer() {
  Object.assign(P, { vx:0, vy:0, face:1, grounded:false, coyote:0, jumpBuf:0, jumping:false, dashT:0, dashCD:0, canDash:true, dashDir:1,
    atkT:0, atkCD:0, atkDir:'side', atkSpike:false, healT:0, inv:0, hitAt:-9, hurtT:0, recoilT:0, recoilV:0, dead:false, deadT:0,
    sit:false, locked:0, dropT:0, anim:0, castCD:0, dive:false, flareT:0, combo:0, comboT:0, fin:false, lungeT:0,
    atkDur:0.2, atkBuf:0, focusSpent:0, focusTick:0, idleT:0, swing:null, swAng:2.75, swFrom:2.75, sheathT:0, struck:false, landed:false, smear:null,
    pose:{ lean:0, crouch:0, stride:0, hip:0, hop:0 } });
  P.atkHit = new Set();
}
resetPlayer();

function tileAt(tx, ty) {
  const r = G.room; if (!r) return 0;
  if (ty < 0) return 1; if (ty >= r.h) return 1;
  if (tx < 0 || tx >= r.w) return 0;
  return r.g[ty][tx];
}

// ---------- collisions
function collideX(e) {
  const top = Math.floor(e.y / T), bot = Math.floor((e.y + e.h - 0.01) / T);
  if (e.vx > 0) { const tx = Math.floor((e.x + e.w) / T); for (let ty = top; ty <= bot; ty++) if (tileAt(tx, ty) === 1) { e.x = tx * T - e.w; return true; } }
  else if (e.vx < 0) { const tx = Math.floor(e.x / T); for (let ty = top; ty <= bot; ty++) if (tileAt(tx, ty) === 1) { e.x = (tx + 1) * T; return true; } }
  return false;
}
function collideY(e, prevBottom, ignoreOneway) {
  const l = Math.floor(e.x / T), r = Math.floor((e.x + e.w - 0.01) / T);
  if (e.vy > 0) {
    const ty = Math.floor((e.y + e.h) / T);
    for (let tx = l; tx <= r; tx++) {
      const t = tileAt(tx, ty);
      if (t === 1 || (t === 3 && !ignoreOneway && prevBottom <= ty * T + 0.5)) { e.y = ty * T - e.h; return 'floor'; }
    }
  } else if (e.vy < 0) {
    const ty = Math.floor(e.y / T);
    for (let tx = l; tx <= r; tx++) if (tileAt(tx, ty) === 1) { e.y = (ty + 1) * T; return 'ceil'; }
  }
  return null;
}
function touchesSpike(b) {
  const l = Math.floor(b.x / T), r = Math.floor((b.x + b.w - 0.01) / T), t = Math.floor(b.y / T), bo = Math.floor((b.y + b.h - 0.01) / T);
  for (let ty = t; ty <= bo; ty++) for (let tx = l; tx <= r; tx++)
    if (tileAt(tx, ty) === 2 && overlap(b, { x:tx * T + 1, y:ty * T + 6, w:T - 2, h:T - 6 })) return { x:tx * T + T / 2, y:ty * T + 6 };
  return null;
}

