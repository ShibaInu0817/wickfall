// ---------- the story, kept short: three opening cards, a line under each chapter title, last words, one closing line
const STORY_OPEN = ['Every flame in Underwick was lit from one fire, far below.', 'One by one, they are going out.', 'A small flame goes down into the dark.'];
const STORY_CH = { 1:'The last warm flame is guarded.', 2:'Drowned flames light an empty hall.', 3:'Something swallowed the kiln’s fire.' };
const STORY_LAST = { warden:'Keep it… warm…', chandler:'They were… so bright…', moth:'It was… mine…' };
const STORY_END = 'Below the cold kiln, the way to the First Flame opens.';
const STORY_CARD = 4.6;
let storySeen = false;
try { $('gameWrap').addEventListener('pointerdown', e => { if (G.story) { e.preventDefault(); e.stopPropagation(); storyNext(false); } }, true); } catch (_) {}
function startStory(then) { G.story = { i:0, t:0, then }; G.state = 'story'; overlay.hidden = true; overlay.innerHTML = ''; overlay.classList.remove('home'); storySeen = true; sfx('storyWind'); sfx('storyBell'); }
function storyNext(skip) {
  const S = G.story; if (!S || S.ending) return;
  if (skip || S.i >= STORY_OPEN.length - 1) { S.ending = true; S.et = 0; S.eLen = skip ? 0.8 : 1.6; return; }   // fade the shot to black first
  S.i++; S.t = 0; sfx('storyBell'); if (S.i === 1) sfx('storyWind');
}
function updateStory(dt) {
  const S = G.story; if (!S) return; S.t += dt;
  if (S.ending) { S.et += dt; if (S.et >= S.eLen + 0.5) { G.story = null; G.state = 'title'; runStart(S.then); G.iris = null; G.blackIn = G.blackInMax = 2.2; } return; }
  if (S.t >= STORY_CARD) storyNext(false);
}
function drawStory(t) {
  const S = G.story; if (!S) return;
  // one long shot: a shaft falling away into the dark, the First Flame a faint ember far below.
  // Card 1 the wall candles burn; card 2 they go out one by one and the ember dims; card 3 a small flame stands at the edge.
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const T0 = S.i * STORY_CARD + S.t, cx = W / 2, fall = T0 * 5;             // the camera keeps sinking across all three cards
  ctx.fillStyle = '#020305'; ctx.fillRect(0, 0, W, H);
  const heat = S.i === 0 ? 1 : S.i === 1 ? 1 - 0.55 * clamp((S.t - 0.6) / 2.6, 0, 1) : 0.45;
  // the ember, deep below, breathing
  const ey = 262 - Math.min(14, fall * 0.15), pulse = 0.8 + 0.2 * Math.sin(T0 * 1.3);
  let g = ctx.createRadialGradient(cx, ey, 0, cx, ey, 150); g.addColorStop(0, `rgba(255,130,50,${0.42 * heat * pulse})`); g.addColorStop(0.35, `rgba(150,50,20,${0.12 * heat})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = `rgba(255,200,120,${0.55 * heat * pulse})`; ctx.fillRect(Math.round(cx) - 1, Math.round(ey) - 1, 2, 2);
  // thin shafts of light rising from it
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 3; i++) { const x = cx - 30 + i * 30 + Math.sin(T0 * 0.3 + i) * 6, a = 0.035 * heat * (0.6 + 0.4 * Math.sin(T0 * 0.7 + i * 2));
    g = ctx.createLinearGradient(0, ey, 0, 0); g.addColorStop(0, `rgba(255,160,80,${a})`); g.addColorStop(1, 'rgba(255,160,80,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 3, ey); ctx.lineTo(x + 3, ey); ctx.lineTo(x + 14, 0); ctx.lineTo(x - 14, 0); ctx.fill(); }
  ctx.globalCompositeOperation = 'source-over';
  // the shaft walls: jagged rock, rimmed faintly by the light below
  const wall = (side) => {
    ctx.fillStyle = '#07090d'; ctx.beginPath(); const x0 = side < 0 ? 0 : W; ctx.moveTo(x0, 0);
    for (let y = -8; y <= H + 8; y += 6) { const wy = y + fall, n = hash(Math.floor(wy / 6), side > 0 ? 7 : 3), n2 = hash(Math.floor(wy / 30), side > 0 ? 11 : 5);
      ctx.lineTo(cx + side * (88 + n * 14 + n2 * 46 - Math.max(0, (y - 150)) * 0.22), y); }
    ctx.lineTo(x0, H); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(150,70,35,${0.22 * heat})`; ctx.lineWidth = 1; ctx.beginPath();
    for (let y = -8; y <= H + 8; y += 6) { const wy = y + fall, n = hash(Math.floor(wy / 6), side > 0 ? 7 : 3), n2 = hash(Math.floor(wy / 30), side > 0 ? 11 : 5), x = cx + side * (88 + n * 14 + n2 * 46 - Math.max(0, (y - 150)) * 0.22);
      if (y === -8) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.globalAlpha = 1; ctx.stroke();
  };
  wall(-1); wall(1);
  // candles in niches down the walls: lit, then going out one by one
  const NICH = [[-1, 60], [1, 96], [-1, 140], [1, 176], [-1, 222], [1, 256], [-1, 300]];
  NICH.forEach(([side, wy0], k) => {
    const y = wy0 - fall * 0.9; if (y < -10 || y > H + 10) return;
    const x = cx + side * (96 + hash(k, 2) * 30), out = S.i === 2 || (S.i === 1 && S.t > 0.5 + k * 0.38);
    ctx.fillStyle = '#0d1016'; ctx.fillRect(x - 5, y - 9, 10, 12);
    ctx.fillStyle = '#6f6656'; ctx.fillRect(x - 1, y - 3, 2, 5);
    if (!out) { const lg = ctx.createRadialGradient(x, y - 5, 0, x, y - 5, 16); lg.addColorStop(0, 'rgba(255,190,110,.22)'); lg.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = lg; ctx.fillRect(x - 16, y - 21, 32, 32); drawFlame(x + 0.5, y - 3, 0.7, T0 + k, C.flame, C.core); }
    else { const a = S.i === 1 ? S.t - 0.5 - k * 0.38 : 3 + k; for (let j = 0; j < 5; j++) { const q = (a * 0.35 + j * 0.2) % 1; ctx.fillStyle = `rgba(120,122,130,${0.35 * (1 - q) * Math.min(1, a)})`; ctx.fillRect(Math.round(x + Math.sin(q * 5 + j + k) * 2), Math.round(y - 5 - q * 22), 1, 1); } }
  });
  // card 3: a small flame at the edge, looking down
  if (S.i === 2) {
    const a = clamp(S.t / 1.2, 0, 1), lx = cx - 96, ly = 108;
    ctx.fillStyle = '#07090d'; ctx.fillRect(0, ly, lx + 22, 6);
    ctx.fillStyle = `rgba(150,70,35,${0.2 * heat})`; ctx.fillRect(0, ly, lx + 22, 1);
    ctx.save(); ctx.globalAlpha = a;
    // his body is only a shadow; the one warm thing in the shot is his flame
    const wx = lx + 12, by = ly;
    ctx.fillStyle = '#05060a'; ctx.fillRect(wx - 3, by - 13, 7, 13); ctx.fillRect(wx - 4, by - 9, 9, 6); ctx.fillRect(wx + 3, by - 5, 6, 1);
    const fg = ctx.createRadialGradient(wx, by - 16, 0, wx, by - 16, 26); fg.addColorStop(0, 'rgba(255,190,110,.3)'); fg.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = fg; ctx.fillRect(wx - 26, by - 42, 52, 52);
    ctx.fillStyle = '#2a2222'; ctx.fillRect(wx, by - 15, 1, 2); drawFlame(wx + 0.5, by - 15, 0.9, T0 * 1.2, C.flame, C.core);
    ctx.restore();
  }
  // motes drifting down the shaft
  for (let i = 0; i < 30; i++) { const q = (T0 * (0.03 + (i % 7) * 0.006) + i * 0.173) % 1, x = cx + Math.sin(i * 12.9 + T0 * 0.4) * (60 + (i % 5) * 18);
    ctx.fillStyle = i % 6 ? `rgba(130,125,115,${0.25 + 0.2 * Math.sin(T0 + i)})` : `rgba(255,170,90,${0.35 * heat})`; ctx.fillRect(Math.round(x), Math.round(q * H), 1, 1); }
  // vignette, letterbox and grain
  g = ctx.createRadialGradient(cx, H / 2, H * 0.25, cx, H / 2, W * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.85)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 18); ctx.fillRect(0, H - 18, W, 18);
  for (let i = 0; i < 160; i++) { ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`; ctx.fillRect((Math.random() * W) | 0, (Math.random() * H) | 0, 1, 1); }
  // the words: small, wide-set, fading in one letter at a time over a thin rule
  const line = STORY_OPEN[S.i], out = clamp((STORY_CARD - S.t) / 0.9, 0, 1), ty = 212;
  ctx.save(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.font = '11px "IM Fell English SC", Georgia, serif';
  const sp = 1.4, chars = [...line]; let wsum = 0; const ws = chars.map(c => { const w = ctx.measureText(c).width + sp; wsum += w; return w; });
  let x = Math.round(cx - wsum / 2);
  chars.forEach((c, k) => { const a = clamp((S.t - 0.5 - k * 0.035) / 0.5, 0, 1) * out; if (a > 0) { ctx.globalAlpha = a * 0.9; ctx.fillStyle = '#cfc4b0'; gtext(c, x, ty); } x += ws[k]; });
  const ra = clamp((S.t - 0.2) / 1, 0, 1) * out * 0.5, rw = Math.min(wsum * 0.5, 90) * ra * 2;
  ctx.globalAlpha = ra; ctx.fillStyle = '#7a6a4a'; ctx.fillRect(Math.round(cx - rw / 2), ty + 12, Math.round(rw), 1);
  ctx.fillStyle = '#a8814a'; ctx.translate(cx, ty + 12.5); ctx.rotate(Math.PI / 4); ctx.fillRect(-1.5, -1.5, 3, 3);
  ctx.restore();
  if (S.ending) { ctx.fillStyle = `rgba(0,0,0,${clamp(S.et / S.eLen, 0, 1)})`; ctx.fillRect(0, 0, W, H); return; }
  const ha = clamp((S.t - 1.6) / 1, 0, 1) * 0.35;
  if (ha > 0) { ctx.save(); ctx.globalAlpha = ha; ctx.textAlign = 'center'; ctx.font = '6px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = '#8a8f8f';
    gtext(TOUCH ? 'TAP' : 'ANY KEY · ESC SKIPS', cx, H - 9); ctx.restore(); }
}
// a boss's last words, written out over it as it goes out
function drawLastWords(cx0) {
  const L = G.lastWords; if (!L) return;
  const shown = Math.min(L.text.length, Math.floor(L.t * 16)), a = clamp((3.6 - L.t) / 0.5, 0, 1);
  ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '10px "IM Fell English SC", Georgia, serif';
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 4; ctx.fillStyle = '#f2d9a8';
  gtext(L.text.slice(0, shown), Math.round(L.x - cx0), Math.round(L.y)); ctx.restore();
}
// the black crack: a tear in the air, jagged and lightless, rimmed in dark red, with black fire licking off its edges
function drawBlackCrack(K, cx0, t) {
  const x = K.x - cx0, y = K.y, h = 30 * K.open, k = K.open;
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, 34); g.addColorStop(0, `rgba(170,10,24,${0.35 * k})`); g.addColorStop(1, 'rgba(120,0,10,0)'); ctx.fillStyle = g; ctx.fillRect(x - 34, y - 34, 68, 68);
  ctx.globalCompositeOperation = 'source-over';
  const pts = []; for (let i = 0; i <= 10; i++) { const q = i / 10, yy = y - h / 2 + q * h, wob = Math.sin(q * Math.PI) * (3.5 + Math.sin(t * 6 + i * 2.3) * 1.2); pts.push([x + (hash(i, 9) - 0.5) * 6 * k, yy, wob]); }
  ctx.fillStyle = '#ff3a2a'; ctx.beginPath(); pts.forEach(([px, py, w], i) => i ? ctx.lineTo(px + w + 1, py) : ctx.moveTo(px, py)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] - pts[i][2] - 1, pts[i][1]); ctx.fill();
  ctx.fillStyle = '#5a0610'; ctx.beginPath(); pts.forEach(([px, py, w], i) => i ? ctx.lineTo(px + w, py) : ctx.moveTo(px, py)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] - pts[i][2], pts[i][1]); ctx.fill();
  ctx.fillStyle = '#000000'; ctx.beginPath(); pts.forEach(([px, py, w], i) => i ? ctx.lineTo(px + w * 0.6, py) : ctx.moveTo(px, py)); for (let i = pts.length - 1; i >= 0; i--) ctx.lineTo(pts[i][0] - pts[i][2] * 0.6, pts[i][1]); ctx.fill();
  for (const m of K.ps) { ctx.fillStyle = m.r > 14 ? '#c0281e' : '#4a0c12'; ctx.fillRect(Math.round(x + Math.cos(m.a) * m.r * 0.7), Math.round(y + Math.sin(m.a) * m.r), 1, 1); }
}
function drawAbyssEnd() {
  const A = G.abyss; if (A && A.crackIn != null) { ctx.fillStyle = `rgba(6,0,2,${clamp((A.crackIn - 0.5) / 1.2, 0, 1)})`; ctx.fillRect(0, 0, W, H); return; }
  if (!A || A.in == null) return;
  const u = A.in, blk = clamp((u - 1.0) / 1.2, 0, 1), txtA = clamp((u - 6.0) / 0.6, 0, 1) * clamp((10.0 - u) / 0.8, 0, 1);
  const storyA = clamp((u - 2.4) / 0.7, 0, 1) * clamp((5.6 - u) / 0.6, 0, 1);
  if (blk > 0) { ctx.fillStyle = `rgba(2,4,10,${blk})`; ctx.fillRect(0, 0, W, H); }
  try { const hl = $('hudLayer'); if (hl) hl.style.opacity = String(1 - blk); if (blk > 0.3) toastEl.classList.remove('show'); } catch (_) {}
  if (blk > 0 && blk < 1) {   // a last blue pinhole where the abyss was
    const g = ctx.createRadialGradient(A.x - Math.round(G.cam.x), A.y, 0, A.x - Math.round(G.cam.x), A.y, 40 * (1 - blk));
    g.addColorStop(0, `rgba(90,170,255,${0.6 * (1 - blk)})`); g.addColorStop(1, 'rgba(30,80,200,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (storyA > 0) {   // the story's last line before the end card
    ctx.save(); ctx.globalAlpha = storyA; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '13px "IM Fell English SC", Georgia, serif';
    ctx.shadowColor = 'rgba(70,150,255,.5)'; ctx.shadowBlur = 8; ctx.fillStyle = '#cfe2f5';
    gtext(STORY_END, W / 2, Math.round(H / 2 - 4)); ctx.restore();
  }
  if (txtA <= 0) return;
  const word = 'To be continued', shown = Math.min(word.length, Math.floor((u - 6.0) * 11));
  const dots = u - 6.0 > word.length / 11 ? '.'.repeat(1 + Math.floor((u * 2.2) % 3)) : '';
  ctx.save(); ctx.globalAlpha = txtA; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.font = '18px "IM Fell English SC", Georgia, serif';
  const full = ctx.measureText(word + '...').width, x = Math.round(W / 2 - full / 2), y = Math.round(H / 2 - 4);
  ctx.shadowColor = 'rgba(70,150,255,.75)'; ctx.shadowBlur = 10; ctx.fillStyle = '#d8ecff';
  gtext(word.slice(0, shown) + dots, x, y);
  ctx.shadowBlur = 0; ctx.font = '7px "JetBrains Mono", ui-monospace, monospace'; ctx.fillStyle = `rgba(120,170,230,${0.8 * clamp((u - 7.8) / 0.6, 0, 1)})`;
  ctx.textAlign = 'center'; gtext('THE DEEP GOES ON', W / 2, y + 20);
  ctx.restore();
}
function kilnForge() {
  if (G.rush) { G.winT = 3.2; return; }   // in the rush the kiln stays dark: straight on to the next fight
  if (G.gal || G.room.def.id !== 'kiln') { if (!G.gal) G.winT = 2.6; return; }
  G.smith = { x:(G.room.w - 7) * T, y:12 * T, id:'flare', near:false, said:false, t:0, free:true };
  burst(G.smith.x + 8, G.smith.y + 4, 30, { spd:120, life:0.8, colors:[C.flame, C.core, '#ffe58a'], size:2, g:-20 });
  sfx('anvil');
  setTimeout(() => toast(tip('A blacksmith climbs down from the cooling kiln. Go to them and push up.', 'A blacksmith climbs down from the cooling kiln. Go to them and press ↑.'), 4600), 1400);
}

const ih = (a, b) => Math.floor(hash(a, b) * 997);
