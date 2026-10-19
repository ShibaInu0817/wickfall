// ---------- Secrets: alcoves behind rock that is not really there, each holding a lore stone or a spare ember
const LORE = {
  'hollow:1':'We lit every candle from the deep fire, and never asked what fed it.',
  'foundry:1':'The Chandler hung the drowned up as lamps, so no one would sit in the dark.',
  'stair:1':'One flame came back up from the bottom. It was black, and it wore a hero’s shape.'
};
const SPARE = ['drip:1', 'locks:1', 'burrows:1'];
// the veil: the alcove's cells drawn as solid rock, cut from a second tile pass, fading while you stand inside
function buildVeil() {
  G.veil = []; const vs = G.room.veils; if (!vs || !vs.length || typeof document === 'undefined') return;
  const keep = G.tiles; for (const [x, y] of vs) G.room.g[y][x] = 1;
  try { buildTiles(); } finally { for (const [x, y] of vs) G.room.g[y][x] = 0; }
  const solid = G.tiles; G.tiles = keep;
  const left = vs.slice(), boxes = [];
  while (left.length) {   // group touching cells into boxes
    const grp = [left.pop()]; for (let i = 0; i < grp.length; i++) for (let j = left.length - 1; j >= 0; j--) if (Math.abs(left[j][0] - grp[i][0]) + Math.abs(left[j][1] - grp[i][1]) === 1) grp.push(...left.splice(j, 1));
    const xs = grp.map(c => c[0]), ys = grp.map(c => c[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), w = Math.max(...xs) - x0 + 1, h = Math.max(...ys) - y0 + 1;
    const c = document.createElement('canvas'); c.width = w * T; c.height = h * T; const g = c.getContext('2d'); if (g && g.drawImage) g.drawImage(solid, x0 * T, y0 * T, w * T, h * T, 0, 0, w * T, h * T);
    boxes.push({ x:x0 * T, y:y0 * T, w:w * T, h:h * T, c, a:1, found:false });
  }
  G.veil = boxes;
}
function updateSecrets(dt) {
  for (const v of G.veil || []) {
    const inside = overlap(P, { x:v.x - 2, y:v.y - 2, w:v.w + 4, h:v.h + 4 });
    if (inside && !v.found) { v.found = true; sfx('secret'); }
    v.a = approach(v.a, inside ? 0.08 : v.found ? 0.7 : 1, dt * 2.4);
  }
  if (G.lore) { G.lore.t += dt; if (G.lore.t > 6.5) G.lore = null; }
  for (const s of G.secrets || []) {
    s.t += dt; if (s.done || P.dead) continue;
    if (!overlap(P, { x:s.x - 7, y:s.y - 16, w:14, h:16 })) continue;
    s.done = true;
    if (s.k === 'y') {
      G.lore = { text:LORE[s.key] || '', t:0 }; sfx('storyBell');
      ACH.loreSeen = Object.assign({}, ACH.loreSeen, { [s.key]:1 }); achSave(); if (Object.keys(LORE).every(k => ACH.loreSeen[k])) earn('lore');
    } else {
      (G.embersGot = G.embersGot || {})[s.key] = 1; P.maxHp += 1; P.hp = Math.min(P.maxHp, P.hp + 1); sfx('waxGet'); sfx('chime'); toast('A spare ember. One more for this chapter.', 2600);
      burst(s.x, s.y - 8, 24, { spd:110, life:0.7, colors:[C.flame, C.core, C.ember], size:2, g:-60 });
      ACH.spareSeen = Object.assign({}, ACH.spareSeen, { [s.key]:1 }); achSave(); if (SPARE.every(k => ACH.spareSeen[k])) earn('embers');
    }
  }
}
function drawSecrets(cx0, t) {
  for (const s of G.secrets || []) {
    const x = Math.round(s.x - cx0), y = s.y;
    if (s.k === 'y') {   // a small carved stone; its rune glows until read
      ctx.fillStyle = '#2a3140'; ctx.fillRect(x - 5, y - 11, 10, 11); ctx.fillStyle = '#3d4658'; ctx.fillRect(x - 4, y - 12, 8, 1); ctx.fillRect(x - 5, y - 11, 1, 11);
      const p = s.done ? 0.35 : 0.6 + 0.4 * Math.sin(t * 3 + s.t);
      ctx.fillStyle = `rgba(143,240,224,${p})`; ctx.fillRect(x - 1, y - 9, 2, 6); ctx.fillRect(x - 3, y - 7, 6, 1); ctx.fillRect(x - 2, y - 4, 1, 1); ctx.fillRect(x + 1, y - 4, 1, 1);
      if (!s.done) { const g = ctx.createRadialGradient(x, y - 6, 0, x, y - 6, 12); g.addColorStop(0, `rgba(143,240,224,${0.25 * p})`); g.addColorStop(1, 'rgba(143,240,224,0)'); ctx.fillStyle = g; ctx.fillRect(x - 12, y - 18, 24, 24); }
    } else if (!s.done) {   // a spare ember floating in its nook
      const by = y - 8 + Math.sin(t * 2.4 + s.t) * 1.5, g = ctx.createRadialGradient(x, by, 0, x, by, 14);
      g.addColorStop(0, 'rgba(255,190,100,.45)'); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(x - 14, by - 14, 28, 28);
      drawFlame(x + 0.5, by + 3, 1.1, t * 1.4 + s.t, C.ember, C.flame);
      ctx.fillStyle = C.core; ctx.fillRect(x - 1, by, 2, 2);
    }
  }
}
function drawVeil(cx0) {
  for (const v of G.veil || []) { if (v.a <= 0.01) continue; ctx.globalAlpha = v.a; ctx.drawImage(v.c, Math.round(v.x - cx0), v.y); }
  ctx.globalAlpha = 1;
}
// a lore line, written out slowly across the top of the screen
function drawLore() {
  const L = G.lore; if (!L || !L.text) return;
  const a = clamp(Math.min(L.t / 0.6, (6.5 - L.t) / 0.8), 0, 1), shown = Math.min(L.text.length, Math.floor(L.t * 22));
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createLinearGradient(0, 84, 0, 128); g.addColorStop(0, 'rgba(4,6,10,0)'); g.addColorStop(0.5, 'rgba(4,6,10,.72)'); g.addColorStop(1, 'rgba(4,6,10,0)'); ctx.fillStyle = g; ctx.fillRect(0, 84, W, 44);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '10px "IM Fell English SC", Georgia, serif'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4; ctx.fillStyle = '#d8efe8';
  gtext(L.text.slice(0, shown), W / 2, 106); ctx.restore();
}
// ---------- Badges: small goals kept in this browser, earned on the results screen (or the moment they happen)
const BADGES = [
  ['ch1', 'First Light', 'Clear Chapter 1.'],
  ['ch2', 'Drowned Bells', 'Clear Chapter 2.'],
  ['ch3', 'Cold Kiln', 'Clear Chapter 3.'],
  ['nofall3', 'Unbroken', 'Clear Chapter 3 without falling once.'],
  ['srank', 'Bright as Day', 'Earn an S rank.'],
  ['untouched', 'Untouched', 'Put out a boss without taking a hit.'],
  ['party', 'Full Party', 'Clear a chapter with each of the three heroes.'],
  ['crack', 'Into the Crack', 'Find the way into the black crack.'],
  ['duel', 'Shadow Cut', 'Put out the Black Wick.'],
  ['rush', 'One Fire', 'Win the Boss Rush.'],
  ['lore', 'Keeper of Words', 'Find every hidden lore stone.'],
  ['embers', 'Spare Flame', 'Find every hidden ember.']
];
const ACH = (() => { try { return JSON.parse(localStorage.getItem('wf-ach') || '{}') || {}; } catch (_) { return {}; } })();
// badges from before the rename keyed Wick's party runs as 'snuff'
for (const k of ['party1', 'party2', 'party3']) { const p = ACH[k]; if (p && p.snuff) { p.wick = 1; delete p.snuff; try { localStorage.setItem('wf-ach', JSON.stringify(ACH)); } catch (_) {} } }
function achSave() { try { localStorage.setItem('wf-ach', JSON.stringify(ACH)); } catch (_) {} }
function earn(id) {
  if (ACH[id] || LAB.on || G.gal) return false;
  const b = BADGES.find(x => x[0] === id); if (!b) return false;
  ACH[id] = Date.now(); achSave(); setTimeout(() => { toast('Badge earned · ' + b[1], 2800); sfx('chime'); }, 900); return true;
}
// called once per results screen
function achOnWin(R) {
  const won = G.rush ? G.rush.won : true; if (!won) return [];
  const got = [], add = id => { if (earn(id)) got.push(id); };
  if (G.rush && !G.rush.practice) add('rush');
  if (G.duel) add('duel');
  if (!G.rush && !G.duel) {
    add('ch' + G.chapter);
    if (G.chapter === 3 && !G.deaths) add('nofall3');
    const pk = 'party' + G.chapter; ACH[pk] = Object.assign({}, ACH[pk], { [G.char]:1 }); achSave();
    if ([1, 2, 3].some(c => ROSTER.every(h => ACH['party' + c] && ACH['party' + c][h]))) add('party');
  }
  if (R && R.rank === 'S' && !G.rush) add('srank');
  if (G.bossHits0 != null && G.hits === G.bossHits0) add('untouched');
  return got;
}
const achCount = () => BADGES.filter(b => ACH[b[0]]).length;
function badgesHtml() {
  return `<div class="camp sheet-page"><div class="rpgwin howw bdgw">
    <p class="peb">Kept in this browser · ${achCount()} of ${BADGES.length}</p><h2>Badges</h2>
    <div class="bdgs">${BADGES.map(([id, n, d]) => { const on = !!ACH[id]; return `<div class="bdg${on ? ' on' : ''}"><i aria-hidden="true">${on ? '✦' : '·'}</i><b>${on ? n : '???'}</b><small>${d}</small></div>`; }).join('')}</div>
    <div class="gbtns"><button class="btn primary" data-action="menu" data-to="home" type="button">Back to camp</button></div>
  </div><div class="hint">${tip('Tap Back to return', 'Enter or Esc back')}</div></div>`;
}
// ---------- Share card: a picture of the run drawn on a canvas, saved or shared from this device; no server involved
function shareCard() {
  const R = G.rankRes || {}, c = document.createElement('canvas'), Wc = 1200, Hc = 630; c.width = Wc; c.height = Hc;
  const g = c.getContext('2d'), mode = G.rush ? (G.rush.practice ? 'Practice' : 'Boss Rush') : G.duel ? 'The Black Wick' : 'Chapter ' + G.chapter + ' · ' + CHAPTERS[G.chapter].name;
  const bg = g.createRadialGradient(Wc * 0.3, Hc * 0.6, 40, Wc * 0.3, Hc * 0.6, 760); bg.addColorStop(0, '#2a1c10'); bg.addColorStop(0.5, '#10141a'); bg.addColorStop(1, '#05070a');
  g.fillStyle = bg; g.fillRect(0, 0, Wc, Hc);
  for (let i = 0; i < 70; i++) { const x = (i * 197) % Wc, y = (i * 113) % Hc; g.fillStyle = `rgba(242,165,65,${0.05 + (i % 5) * 0.03})`; g.fillRect(x, y, 3, 3); }
  g.strokeStyle = '#c9a64e'; g.lineWidth = 6; g.strokeRect(24, 24, Wc - 48, Hc - 48); g.lineWidth = 2; g.strokeRect(38, 38, Wc - 76, Hc - 76);
  // the hero, drawn by the game itself
  try { const fr = charFrames(G.char, 'idle')[0]; g.imageSmoothingEnabled = false; g.drawImage(fr, 52 - 30, 92 - 56, 60, 60, 90, 170, 360, 360); } catch (_) {}
  const fl = g.createRadialGradient(270, 300, 10, 270, 300, 240); fl.addColorStop(0, 'rgba(255,190,100,.18)'); fl.addColorStop(1, 'rgba(255,150,60,0)'); g.fillStyle = fl; g.fillRect(30, 60, 480, 480);
  g.textBaseline = 'alphabetic'; g.fillStyle = C.wax; g.font = '64px "IM Fell English SC", Georgia, serif'; g.fillText('Wickfall', 520, 130);
  g.fillStyle = '#f2a541'; g.font = '22px "Silkscreen", monospace'; g.fillText(mode.toUpperCase(), 524, 175);
  g.fillStyle = '#cfc6ad'; g.font = '24px "JetBrains Mono", monospace'; g.fillText((CHARS[G.char] || CH()).name + (G.assisted ? '  ·  assist' : ''), 524, 214);
  const rows = [['Time', fmtTime(G.time || 0)], ['Falls', String(G.deaths || 0)], ['Hits taken', String(G.hits || 0)], ['Score', R.score != null && R.parts && R.parts.time != null ? R.score + ' / 100' : '—']];
  rows.forEach(([k, v], i) => { const y = 290 + i * 62; g.fillStyle = '#9aa59f'; g.font = '20px "Silkscreen", monospace'; g.fillText(k.toUpperCase(), 524, y); g.fillStyle = '#f6e7bf'; g.font = '40px "JetBrains Mono", monospace'; g.fillText(v, 760, y + 4); g.fillStyle = 'rgba(201,166,78,.25)'; g.fillRect(524, y + 18, 420, 2); });
  // the rank stamp
  if (R.rank && R.parts && R.parts.time != null) {
    const sx = 1040, sy = 330, col = { S:'#ffd66b', A:'#f2a541', B:C.wax, C:'#9fdcd0', D:'#9aa59f' }[R.rank] || C.wax;
    g.save(); g.translate(sx, sy); g.rotate(-0.12); g.strokeStyle = col; g.lineWidth = 8; g.beginPath(); g.arc(0, 0, 92, 0, TAU); g.stroke(); g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 76, 0, TAU); g.stroke();
    g.fillStyle = col; g.textAlign = 'center'; g.font = '120px "IM Fell English SC", Georgia, serif'; g.fillText(R.rank, 0, 40); g.font = '18px "Silkscreen", monospace'; g.fillText('RANK', 0, -50); g.restore();
  }
  g.textAlign = 'left'; g.fillStyle = '#7b7766'; g.font = '18px "JetBrains Mono", monospace'; g.fillText(achCount() + ' of ' + BADGES.length + ' badges', 524, 560);
  return c;
}
// on claude.ai the page asks the viewer through the downloads capability; anywhere else a plain download link is used
async function saveCardFile(c, url, name, btn) {
  let dl = null;
  try { if (window.claude && typeof window.claude.use === 'function') dl = await window.claude.use('downloads'); } catch (_) {}
  if (dl) {
    c.toBlob(async bl => { try { await dl.save({ filename:name, data:bl }); btn.textContent = 'Saved'; } catch (e) { if (e && e.code !== 'declined') btn.textContent = 'Saving is blocked here'; } }, 'image/png');
    return;
  }
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
}
function showShareCard() {
  const c = shareCard(), url = c.toDataURL('image/png'), name = 'wickfall-' + (G.rush ? 'rush' : G.duel ? 'duel' : 'ch' + G.chapter) + '.png';
  const box = document.createElement('div'); box.className = 'sharebox'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', 'Score card');
  box.innerHTML = `<div class="sharein"><img alt="Your Wickfall score card" src="${url}"><div class="gbtns"><button class="btn primary" type="button" data-s="save">Save image</button>${navigator.canShare ? '<button class="btn" type="button" data-s="share">Share</button>' : ''}<button class="btn" type="button" data-s="close">Close</button></div><p>If saving is blocked here, right-click or long-press the picture.</p></div>`;
  box.addEventListener('click', e => {
    const k = e.target.closest('[data-s]'); if (e.target === box || (k && k.dataset.s === 'close')) { box.remove(); return; }
    if (k && k.dataset.s === 'save') saveCardFile(c, url, name, k);
    if (k && k.dataset.s === 'share') c.toBlob(bl => { try { const f = new File([bl], name, { type:'image/png' }); if (navigator.canShare({ files:[f] })) navigator.share({ files:[f], title:'Wickfall' }).catch(() => {}); } catch (_) {} });
  });
  overlay.appendChild(box); const f = box.querySelector('.btn'); if (f) f.focus({ preventScroll:true });
}
