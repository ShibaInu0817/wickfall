// ---------- drawing: tiles & background (visual only; collision still comes from the room grid)
// Each chamber has its own palette: mossy Wickhollow, wet blue Drip, ember-lit Cinder Chamber.
const THEMES = [
  { name:'moss', sky0:'#090d15', sky1:'#152030', far:'#101722', farRim:'#1f3238', mid:'#141d2b', midRim:'#2c4d52', wall:'#121926', wallHi:'#1a2433', wallLo:'#0c111a',
    rock:'#1e2534', rockHi:'#323d52', rockLo:'#121722', mortar:'#0d1119', top:'#5fa39a', topDim:'#3b6c67', topHi:'#9adccd', accent:'#f2a541',
    glow:'143,240,224', fog:'95,163,154', shaft:'143,240,224', amb:'mote' },
  { name:'drip', sky0:'#060b15', sky1:'#0f1b2e', far:'#0d1525', farRim:'#1d3550', mid:'#111d32', midRim:'#2b4f74', wall:'#0f1726', wallHi:'#17223a', wallLo:'#0a0f1a',
    rock:'#1a2437', rockHi:'#2c3d5a', rockLo:'#0e1423', mortar:'#0a0e19', top:'#4f8fa8', topDim:'#2f5f78', topHi:'#a8e2f4', accent:'#9fdcf0',
    glow:'159,220,240', fog:'90,140,190', shaft:'150,205,245', amb:'drip' },
  { name:'cinder', sky0:'#110909', sky1:'#26140f', far:'#1b0f0d', farRim:'#40200f', mid:'#22130f', midRim:'#63301a', wall:'#1b110f', wallHi:'#2a1a15', wallLo:'#120b09',
    rock:'#2a1c18', rockHi:'#43302a', rockLo:'#170f0c', mortar:'#100a08', top:'#7a5236', topDim:'#4f3322', topHi:'#e0a070', accent:'#e2553f',
    glow:'242,140,80', fog:'200,90,50', shaft:'242,165,65', amb:'ember' },
  { name:'cinder', sky0:'#0d0b08', sky1:'#201a10', far:'#17130c', farRim:'#3d3014', mid:'#1c170e', midRim:'#5e4a22', wall:'#16120b', wallHi:'#241d12', wallLo:'#0e0b07',
    rock:'#2b251a', rockHi:'#473d2a', rockLo:'#17130d', mortar:'#0f0c08', top:'#8f7c3c', topDim:'#5c5027', topHi:'#e6cc74', accent:'#f2b341',
    glow:'242,190,90', fog:'170,140,70', shaft:'242,205,120', amb:'ember' },
  { name:'drip', sky0:'#06100e', sky1:'#0f221e', far:'#0c1916', farRim:'#1d3d36', mid:'#10201c', midRim:'#2c5a4f', wall:'#0e1a17', wallHi:'#162723', wallLo:'#09110f',
    rock:'#1a2a26', rockHi:'#2c4740', rockLo:'#0e1715', mortar:'#0a110f', top:'#4f9a84', topDim:'#2f6455', topHi:'#a6e8d2', accent:'#e0b04a',
    glow:'150,230,200', fog:'80,150,130', shaft:'160,230,205', amb:'drip' },
  { name:'hall', sky0:'#07060f', sky1:'#171028', far:'#120d20', farRim:'#3b2e63', mid:'#171128', midRim:'#4c3b78', wall:'#110d1d', wallHi:'#1b152e', wallLo:'#0a0813',
    rock:'#211934', rockHi:'#3a2f57', rockLo:'#110d1c', mortar:'#0b0915', top:'#c9a64e', topDim:'#7a6230', topHi:'#ffe9a8', accent:'#f2c46a',
    glow:'205,190,255', fog:'120,100,190', shaft:'190,185,255', amb:'wax' },
  { name:'burrow', sky0:'#0b0810', sky1:'#1d1426', far:'#160f1e', farRim:'#3a2648', mid:'#1a1224', midRim:'#5a3a5e', wall:'#140e1b', wallHi:'#20172b', wallLo:'#0c0811',
    rock:'#251b2e', rockHi:'#3e2f4d', rockLo:'#130d19', mortar:'#0d0912', top:'#b08fbf', topDim:'#6b5878', topHi:'#f0d8ff', accent:'#ffb35a',
    glow:'255,190,110', fog:'150,110,170', shaft:'255,200,140', amb:'mote' },
  { name:'stair', sky0:'#0e0907', sky1:'#2a140b', far:'#1d0f09', farRim:'#55240f', mid:'#24120b', midRim:'#7a3416', wall:'#1c100b', wallHi:'#2c1a12', wallLo:'#110a07',
    rock:'#2e1d15', rockHi:'#4b3124', rockLo:'#180f0b', mortar:'#110a07', top:'#b0703a', topDim:'#6e4424', topHi:'#ffc080', accent:'#ff7a3a',
    glow:'255,130,60', fog:'210,100,50', shaft:'255,150,80', amb:'ember' },
  { name:'kiln', sky0:'#120605', sky1:'#2e0e08', far:'#220a07', farRim:'#6a1e0e', mid:'#2a0c08', midRim:'#8c2e12', wall:'#1e0907', wallHi:'#30120c', wallLo:'#140605',
    rock:'#331610', rockHi:'#55261a', rockLo:'#1b0b08', mortar:'#130605', top:'#d0803e', topDim:'#80482a', topHi:'#ffd090', accent:'#ff6a2a',
    glow:'255,120,50', fog:'230,90,40', shaft:'255,140,70', amb:'ember' }
];
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mixC(a, b, k) { const A = hexRgb(a), B = hexRgb(b); return `rgb(${Math.round(A[0] + (B[0] - A[0]) * k)},${Math.round(A[1] + (B[1] - A[1]) * k)},${Math.round(A[2] + (B[2] - A[2]) * k)})`; }
const toHex = rgb => '#' + rgb.match(/\d+/g).map(v => (+v).toString(16).padStart(2, '0')).join('');

function buildTiles() {
  const r = G.room, th = G.theme || THEMES[0], c = document.createElement('canvas');
  c.width = r.w * T; c.height = r.h * T;
  const x = c.getContext('2d');
  const solid = (tx, ty) => tileAt(clamp(tx, 0, r.w - 1), ty) === 1;
  const px1 = (X, Y, col) => { x.fillStyle = col; x.fillRect(X, Y, 1, 1); };
  // depth: rock further from open air is drawn darker, so walls read as solid mass
  const depth = [], q = [];
  for (let ty = 0; ty < r.h; ty++) { depth.push(new Array(r.w).fill(9)); for (let tx = 0; tx < r.w; tx++) if (r.g[ty][tx] !== 1) { depth[ty][tx] = 0; q.push([tx, ty]); } }
  while (q.length) { const [tx, ty] = q.shift(), d = depth[ty][tx]; if (d >= 4) continue;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = tx + dx, ny = ty + dy; if (nx >= 0 && ny >= 0 && nx < r.w && ny < r.h && depth[ny][nx] > d + 1) { depth[ny][nx] = d + 1; q.push([nx, ny]); } } }

  // masonry laid out in world space so stones run continuously across tiles
  function stones(px, py, base) {
    x.save(); x.beginPath(); x.rect(px, py, T, T); x.clip();
    for (let j = Math.floor(py / 8); j * 8 < py + T; j++) {
      const sy = j * 8, off = Math.floor(hash(j, 3) * 12);
      for (let k = Math.floor((px - off) / 11) - 1; ; k++) {
        const sx = off + k * 11 + Math.floor(hash(j, k) * 4), ex = off + (k + 1) * 11 + Math.floor(hash(j, k + 1) * 4);
        if (sx >= px + T) break;
        if (ex <= px) continue;
        const v = hash(k * 7 + 1, j * 13 + 2), w = ex - sx;
        const col = v < 0.35 ? base : v < 0.7 ? mixC(toHex(base), th.rockHi, 0.22) : mixC(toHex(base), th.rockLo, 0.35);
        x.fillStyle = col; x.fillRect(sx + 1, sy + 1, w - 1, 7);
        x.fillStyle = mixC(toHex(col), '#ffffff', 0.07); x.fillRect(sx + 1, sy + 1, w - 2, 1); x.fillRect(sx + 1, sy + 1, 1, 5);
        x.fillStyle = th.rockLo; x.fillRect(sx + 1, sy + 7, w - 1, 1); x.fillRect(sx + w - 1, sy + 2, 1, 6);
        if (v > 0.5) { x.fillStyle = th.mortar; x.fillRect(sx + 1, sy + 1, 1, 1); }
        if (hash(k, j * 5) > 0.78) { x.fillStyle = th.rockLo; for (let i = 0; i < 3; i++) x.fillRect(sx + 3 + i, sy + 2 + i, 1, 1); }
        x.fillStyle = th.rockLo; x.fillRect(sx + 2 + Math.floor(v * (w - 3)), sy + 3 + Math.floor(hash(k, j) * 3), 1, 1);
      }
    }
    x.restore();
  }

  for (let ty = 0; ty < r.h; ty++) for (let tx = 0; tx < r.w; tx++) {
    const t = r.g[ty][tx], px = tx * T, py = ty * T, h0 = hash(tx * 3 + 7, ty * 11 + 5);
    if (t === 1) {
      const d = Math.min(4, depth[ty][tx]);
      x.fillStyle = th.mortar; x.fillRect(px, py, T, T);
      stones(px, py, mixC(th.rock, th.rockLo, Math.max(0, (d - 1) / 3)));
      if (d >= 2) { x.fillStyle = `rgba(0,0,0,${0.08 * (d - 1)})`; x.fillRect(px, py, T, T); }
      const up = !solid(tx, ty - 1), dn = !solid(tx, ty + 1), lf = !solid(tx - 1, ty), rt = !solid(tx + 1, ty);
      if (lf) { x.fillStyle = th.rockHi; x.fillRect(px, py, 1, T); }
      if (rt) { x.fillStyle = th.rockLo; x.fillRect(px + T - 1, py, 1, T); x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(px + T - 2, py, 1, T); }
      if (dn) {
        // ceiling underside: shadowed lip, hanging roots and little stalactites
        x.fillStyle = th.rockLo; x.fillRect(px, py + T - 2, T, 2);
        for (let i = 0; i < 3; i++) if (hash(tx * 5 + i, ty * 3) > 0.55) {
          const rx = px + 2 + i * 5 + Math.floor(hash(tx, i) * 3), len = 2 + Math.floor(hash(tx + i, ty) * 6);
          x.fillStyle = th.topDim; x.fillRect(rx, py + T, 1, len);
          if (hash(i, tx) > 0.5) px1(rx + 1, py + T + Math.floor(len / 2), th.topDim);
          if (th.name === 'drip') px1(rx, py + T + len, th.topHi);
          if (th.name === 'cinder') px1(rx, py + T + len, th.accent);
        }
        if (h0 > 0.6) { x.fillStyle = th.rockLo; x.beginPath(); x.moveTo(px + 5, py + T); x.lineTo(px + 9, py + T); x.lineTo(px + 7, py + T + 4 + Math.floor(h0 * 4)); x.fill(); }
      }
      if (up) {
        // living top: a jagged band of moss (ash in the cinder chamber) with blades and highlights
        for (let i = 0; i < T; i++) {
          const dpt = 2 + Math.floor(hash(tx * 16 + i, ty) * 3);
          x.fillStyle = th.topDim; x.fillRect(px + i, py, 1, dpt);
          x.fillStyle = th.top; x.fillRect(px + i, py, 1, Math.max(1, dpt - 2));
          if (hash(i, tx * 7 + ty) > 0.72) px1(px + i, py, th.topHi);
        }
        for (let i = 0; i < 5; i++) if (hash(tx * 9 + i, ty * 2) > 0.45) {
          const bx = px + 1 + i * 3 + Math.floor(hash(i, tx) * 2), bh = 1 + Math.floor(hash(tx, i * 3) * 3);
          x.fillStyle = i % 2 ? th.topDim : th.top; x.fillRect(bx, py - bh, 1, bh);
          if (bh > 2) px1(bx + (i % 2 ? 1 : -1), py - bh, th.top);
        }
        if (th.name === 'drip' && h0 > 0.5) { x.fillStyle = 'rgba(168,226,244,.55)'; x.fillRect(px + 3, py, 6 + Math.floor(h0 * 5), 1); }
      }
      // chip the exposed corners and edges so the rock outline is organic
      if (up && lf) { x.clearRect(px, py - 3, 2, 3); x.clearRect(px, py, 1, 1); }
      if (up && rt) { x.clearRect(px + T - 2, py - 3, 2, 3); x.clearRect(px + T - 1, py, 1, 1); }
      if (dn && lf) x.clearRect(px, py + T - 1, 2, 1);
      if (dn && rt) x.clearRect(px + T - 2, py + T - 1, 2, 1);
      if (lf) for (let i = 3; i < T - 2; i++) if (hash(tx * 31 + i, ty) > 0.78) x.clearRect(px, py + i, 1, 1 + (hash(i, ty) > 0.5 ? 1 : 0));
      if (rt) for (let i = 3; i < T - 2; i++) if (hash(tx * 17 + i, ty * 3) > 0.78) x.clearRect(px + T - 1, py + i, 1, 1);
      // small props on open floors (purely decorative)
      if (up && !lf && !rt && tileAt(tx, ty - 1) === 0 && h0 > 0.7) {
        const ox = px + 3 + Math.floor(hash(tx, 99) * 9);
        if (th.name === 'moss') { // glowing cave mushroom
          x.fillStyle = '#c9d6cf'; x.fillRect(ox, py - 3, 1, 3);
          x.fillStyle = th.topHi; x.fillRect(ox - 1, py - 4, 3, 1); px1(ox, py - 5, '#d6fff5');
        } else if (th.name === 'drip') { // blue crystal shard
          x.fillStyle = '#5fa8c8'; x.beginPath(); x.moveTo(ox, py); x.lineTo(ox + 1, py - 6); x.lineTo(ox + 3, py); x.fill();
          px1(ox + 1, py - 5, '#d8f6ff');
        } else if (th.name === 'hall') { // little brass candlestick
          x.fillStyle = '#8a6a30'; x.fillRect(ox - 1, py - 1, 3, 1); x.fillRect(ox, py - 3, 1, 2);
          x.fillStyle = '#efe3c2'; x.fillRect(ox, py - 6, 1, 3); px1(ox, py - 7, '#ffe9a8');
        } else { // melted wax stub with an ember
          x.fillStyle = '#cbbd98'; x.fillRect(ox, py - 3, 2, 3); px1(ox + 2, py - 1, '#cbbd98'); px1(ox, py - 4, th.accent);
        }
      }
    } else if (t === 2) {
      // spines: rubble base, bone spikes with a lit edge and a bright tip
      x.fillStyle = '#1d1b20'; x.fillRect(px, py + T - 3, T, 3);
      for (let i = 0; i < 4; i++) px1(px + Math.floor(hash(tx, i + 40) * 15), py + T - 3 + Math.floor(hash(i, tx) * 2), '#3a3640');
      for (let i = 0; i < 4; i++) {
        const sx = px + i * 4, tip = py + 4 + Math.floor(hash(tx * 4 + i, ty) * 4);
        x.fillStyle = C.boneSh; x.beginPath(); x.moveTo(sx, py + T - 2); x.lineTo(sx + 2, tip); x.lineTo(sx + 4, py + T - 2); x.fill();
        x.fillStyle = C.bone; x.beginPath(); x.moveTo(sx, py + T - 2); x.lineTo(sx + 2, tip); x.lineTo(sx + 2, py + T - 2); x.fill();
        px1(sx + 2, tip, '#ffffff');
        x.fillStyle = 'rgba(0,0,0,.25)'; x.fillRect(sx + 3, py + T - 5, 1, 3);
      }
    } else if (t === 3) {
      // root-bound plank platform: grain, nails, brackets and hanging moss
      x.fillStyle = C.wood; x.fillRect(px, py, T, 4);
      x.fillStyle = C.woodHi; x.fillRect(px, py, T, 1);
      x.fillStyle = '#4a3828'; x.fillRect(px + 2 + Math.floor(h0 * 4), py + 2, 5, 1); x.fillRect(px + 9, py + 1, 4, 1);
      x.fillStyle = '#2e2218'; x.fillRect(px, py + 4, T, 1);
      if (tileAt(tx - 1, ty) !== 3) { x.fillStyle = '#2e2218'; x.fillRect(px, py, 1, 5); }
      if (tileAt(tx + 1, ty) !== 3) { x.fillStyle = '#2e2218'; x.fillRect(px + T - 1, py, 1, 5); }
      px1(px + 3, py + 1, '#9a8a70'); px1(px + 12, py + 1, '#9a8a70');
      x.fillStyle = '#3a2d20'; x.fillRect(px + 7, py + 5, 2, 2);
      for (let i = 0; i < 2; i++) if (hash(tx * 3 + i, ty) > 0.4) { const mx = px + 2 + i * 9 + Math.floor(hash(i, tx) * 3); x.fillStyle = th.topDim; x.fillRect(mx, py + 5, 1, 2 + Math.floor(hash(tx, i + 9) * 5)); }
    }
  }
  G.tiles = c;
}

function buildBg(i) {
  const th = G.theme || THEMES[0], rnd = seeded(i * 977 + 13), roomPx = G.room.w * T;
  const layer = f => { const c = document.createElement('canvas'); c.width = Math.ceil((roomPx - W) * f + W) + 4; c.height = H; return c; };
  // far: distant jagged ridges and hanging rock, rim-lit, with faint far lights
  const far = layer(0.2), fx = far.getContext('2d');
  const ridge = (c, w, base, amp, col, rim, fromTop) => {
    const pts = []; for (let X = -10; X <= w + 10; X += 6 + rnd() * 12) pts.push([X, base + (rnd() - 0.5) * amp + Math.sin(X * 0.012 + base) * amp * 0.5]);
    c.fillStyle = col; c.beginPath(); c.moveTo(-10, fromTop ? 0 : H);
    for (const [X, Y] of pts) c.lineTo(X, Y);
    c.lineTo(w + 10, fromTop ? 0 : H); c.closePath(); c.fill();
    c.strokeStyle = rim; c.lineWidth = 1; c.beginPath(); pts.forEach(([X, Y], k) => k ? c.lineTo(X, Y) : c.moveTo(X, Y)); c.stroke();
  };
  for (let k = 0; k < 16; k++) {
    const gx = rnd() * far.width, gy = 30 + rnd() * 130, rr = 2 + rnd() * 6, g = fx.createRadialGradient(gx, gy, 0, gx, gy, rr * 3);
    g.addColorStop(0, `rgba(${th.glow},.35)`); g.addColorStop(1, `rgba(${th.glow},0)`); fx.fillStyle = g; fx.fillRect(gx - rr * 3, gy - rr * 3, rr * 6, rr * 6);
  }
  ridge(fx, far.width, 165, 60, th.far, th.farRim, false);
  ridge(fx, far.width, 34, 40, th.far, th.farRim, true);

  // mid: stalactites and stalagmites with a lit edge
  const mid = layer(0.45), mx = mid.getContext('2d');
  for (let X = -20; X < mid.width; X += 18 + rnd() * 40) {
    const w = 12 + rnd() * 26, len = 30 + rnd() * 90, top = rnd() < 0.62;
    const y0 = top ? 0 : H - 40, dir = top ? 1 : -1, tipY = y0 + dir * len;
    mx.fillStyle = th.mid; mx.beginPath(); mx.moveTo(X, y0); mx.lineTo(X + w * 0.15, y0 + dir * len * 0.45); mx.lineTo(X + w * 0.45, tipY); mx.lineTo(X + w * 0.7, y0 + dir * len * 0.5); mx.lineTo(X + w, y0); mx.closePath(); mx.fill();
    mx.strokeStyle = th.midRim; mx.lineWidth = 1; mx.beginPath(); mx.moveTo(X + w * 0.45, tipY); mx.lineTo(X + w * 0.7, y0 + dir * len * 0.5); mx.lineTo(X + w, y0); mx.stroke();
    if (top && th.name === 'drip') { mx.fillStyle = `rgba(${th.glow},.5)`; mx.fillRect(Math.round(X + w * 0.45), Math.round(tipY + 2), 1, 2); }
  }

  // near: big rock pillars with strata, and a feature per chamber
  const near = layer(0.72), nx = near.getContext('2d');
  for (let X = 40 + rnd() * 60; X < near.width; X += 150 + rnd() * 120) {
    const w = 26 + rnd() * 28;
    nx.fillStyle = th.wall; nx.beginPath(); nx.moveTo(X - 4, 0); nx.lineTo(X + w + 4, 0); nx.lineTo(X + w + rnd() * 4, 120); nx.lineTo(X + w + 6, H); nx.lineTo(X - 6, H); nx.lineTo(X - rnd() * 4, 120); nx.closePath(); nx.fill();
    for (let s = 8; s < H; s += 7 + rnd() * 10) { nx.fillStyle = rnd() < 0.5 ? th.wallHi : th.wallLo; nx.fillRect(X + rnd() * 6, s, w - 6 - rnd() * 8, 1); }
    nx.fillStyle = th.wallHi; nx.fillRect(X - 3, 0, 1, H);
    nx.fillStyle = th.wallLo; nx.fillRect(X + w + 2, 0, 2, H);
    const fy = 70 + rnd() * 70;
    if (th.name === 'moss') { // carved candle niche
      nx.fillStyle = '#080b11'; nx.beginPath(); nx.moveTo(X + w / 2 - 6, fy + 14); nx.lineTo(X + w / 2 - 6, fy + 4); nx.quadraticCurveTo(X + w / 2, fy - 4, X + w / 2 + 6, fy + 4); nx.lineTo(X + w / 2 + 6, fy + 14); nx.fill();
      nx.fillStyle = '#cbbd98'; nx.fillRect(X + w / 2 - 1, fy + 8, 2, 6);
      const g = nx.createRadialGradient(X + w / 2, fy + 6, 0, X + w / 2, fy + 6, 22); g.addColorStop(0, 'rgba(242,165,65,.35)'); g.addColorStop(1, 'rgba(242,165,65,0)');
      nx.fillStyle = g; nx.fillRect(X + w / 2 - 22, fy - 16, 44, 44);
      nx.fillStyle = '#f2a541'; nx.fillRect(X + w / 2 - 0.5, fy + 5, 1, 3); nx.fillStyle = '#fff1c1'; nx.fillRect(X + w / 2 - 0.5, fy + 6, 1, 1);
    } else if (th.name === 'drip') { // water streaks and algae
      for (let k = 0; k < 3; k++) { const sx = X + 6 + rnd() * (w - 12), g = nx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, `rgba(${th.glow},.18)`); g.addColorStop(1, `rgba(${th.glow},0)`); nx.fillStyle = g; nx.fillRect(sx, 0, 1, 110 + rnd() * 100); }
      nx.fillStyle = '#1c3a40'; for (let k = 0; k < 12; k++) nx.fillRect(X + rnd() * w, fy + rnd() * 60, 2, 1);
    } else if (th.name === 'hall') { // a long violet banner with gold trim
      const bx = X + w / 2 - 7, by = 18 + rnd() * 20, bh = 70 + rnd() * 40;
      nx.fillStyle = '#2a1b45'; nx.beginPath(); nx.moveTo(bx, by); nx.lineTo(bx + 14, by); nx.lineTo(bx + 14, by + bh); nx.lineTo(bx + 7, by + bh - 8); nx.lineTo(bx, by + bh); nx.fill();
      nx.fillStyle = '#8a6a30'; nx.fillRect(bx - 2, by - 1, 18, 2); nx.fillRect(bx + 1, by + 2, 1, bh - 6); nx.fillRect(bx + 12, by + 2, 1, bh - 6);
      nx.fillStyle = '#c9a64e'; nx.beginPath(); nx.arc(bx + 7, by + 22, 3, 0, TAU); nx.fill(); nx.fillStyle = '#2a1b45'; nx.fillRect(bx + 6, by + 21, 2, 2);
    } else { // glowing cracks
      nx.save(); nx.shadowColor = th.accent; nx.shadowBlur = 6; nx.strokeStyle = 'rgba(242,120,60,.75)'; nx.lineWidth = 1; nx.beginPath();
      let cx = X + w * 0.3 + rnd() * w * 0.4, cy = fy - 30; nx.moveTo(cx, cy);
      for (let k = 0; k < 7; k++) { cx += (rnd() - 0.5) * 8; cy += 8 + rnd() * 8; nx.lineTo(cx, cy); }
      nx.stroke(); nx.restore();
    }
  }
  const fogs = []; for (let k = 0; k < 7; k++) fogs.push({ x:rnd() * (W + 200), y:120 + rnd() * 90, rx:60 + rnd() * 90, ry:14 + rnd() * 16, sp:3 + rnd() * 6 });
  const motes = []; for (let k = 0; k < 46; k++) motes.push({ x:rnd() * (W + 40), y:rnd() * H, ph:rnd() * TAU, sp:4 + rnd() * 8 });
  const shafts = []; for (let k = 0; k < 4; k++) shafts.push({ x:rnd() * (W + (roomPx - W) * 0.3), w:20 + rnd() * 40, ph:rnd() * TAU });
  G.bg = { far, mid, near, fogs, motes, shafts };
  if (G.room.def.id === 'hall') decorateHall(G.bg, rnd);
}
// The Chandler's hall: tall moonlit windows and a rose window far back, a colonnade with candelabra and hanging chains in the middle
function decorateHall(bg, rnd) {
  const fx = bg.far.getContext('2d'), FW = bg.far.width;
  fx.fillStyle = '#0d0918'; fx.fillRect(0, 0, FW, H);
  const win = (cx, top, w, h) => {
    fx.fillStyle = '#05040a'; fx.beginPath(); fx.moveTo(cx - w / 2 - 3, top + h); fx.lineTo(cx - w / 2 - 3, top + w / 2); fx.arc(cx, top + w / 2, w / 2 + 3, Math.PI, 0); fx.lineTo(cx + w / 2 + 3, top + h); fx.fill();
    const g = fx.createLinearGradient(0, top, 0, top + h); g.addColorStop(0, 'rgba(170,160,255,.55)'); g.addColorStop(1, 'rgba(90,70,170,.25)');
    fx.fillStyle = g; fx.beginPath(); fx.moveTo(cx - w / 2, top + h); fx.lineTo(cx - w / 2, top + w / 2); fx.arc(cx, top + w / 2, w / 2, Math.PI, 0); fx.lineTo(cx + w / 2, top + h); fx.fill();
    fx.strokeStyle = 'rgba(20,14,36,.9)'; fx.lineWidth = 1.5; fx.beginPath();
    fx.moveTo(cx, top); fx.lineTo(cx, top + h); for (let y = top + w / 2 + 14; y < top + h; y += 16) { fx.moveTo(cx - w / 2, y); fx.lineTo(cx + w / 2, y); } fx.stroke();
  };
  for (const [cx, w] of [[FW * 0.14, 26], [FW * 0.86, 26], [FW * 0.33, 22], [FW * 0.67, 22]]) win(cx, 46, w, 120);
  // rose window
  const rx = FW / 2, ry = 70;
  fx.fillStyle = '#05040a'; fx.beginPath(); fx.arc(rx, ry, 40, 0, TAU); fx.fill();
  const rg = fx.createRadialGradient(rx, ry, 4, rx, ry, 36); rg.addColorStop(0, 'rgba(255,230,170,.65)'); rg.addColorStop(0.5, 'rgba(180,150,255,.5)'); rg.addColorStop(1, 'rgba(90,60,170,.35)');
  fx.fillStyle = rg; fx.beginPath(); fx.arc(rx, ry, 36, 0, TAU); fx.fill();
  fx.strokeStyle = 'rgba(20,14,36,.95)'; fx.lineWidth = 1.5;
  for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; fx.beginPath(); fx.moveTo(rx + Math.cos(a) * 8, ry + Math.sin(a) * 8); fx.lineTo(rx + Math.cos(a) * 36, ry + Math.sin(a) * 36); fx.stroke(); }
  for (const r of [8, 20, 36]) { fx.beginPath(); fx.arc(rx, ry, r, 0, TAU); fx.stroke(); }
  fx.fillStyle = '#0d0918'; fx.fillRect(0, 190, FW, H - 190);
  // middle: a colonnade, candelabra between the columns, chains from the dark above
  const mx = bg.mid.getContext('2d'), MW = bg.mid.width;
  for (let X = 20; X < MW; X += 118) {
    const g = mx.createLinearGradient(X, 0, X + 24, 0); g.addColorStop(0, '#2a2142'); g.addColorStop(0.35, '#3d3160'); g.addColorStop(1, '#1a1430');
    mx.fillStyle = g; mx.fillRect(X, 26, 24, H - 26);
    mx.fillStyle = '#4c3b78'; mx.fillRect(X - 4, 26, 32, 6); mx.fillRect(X - 3, 176, 30, 5);
    mx.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 4; k++) mx.fillRect(X + 4 + k * 5, 34, 1, H);
    // a candelabra on a stand between this column and the next
    const cx = X + 71, by = 186;
    mx.fillStyle = '#6b5226'; mx.fillRect(cx - 1, by - 34, 2, 34); mx.fillRect(cx - 7, by - 2, 14, 2); mx.fillRect(cx - 10, by - 34, 20, 2);
    for (const dx of [-9, -3, 3, 9]) {
      mx.fillStyle = '#e6dcc0'; mx.fillRect(cx + dx - 1, by - 41, 2, 7);
      const fg = mx.createRadialGradient(cx + dx, by - 44, 0, cx + dx, by - 44, 12); fg.addColorStop(0, 'rgba(255,214,140,.5)'); fg.addColorStop(1, 'rgba(255,214,140,0)');
      mx.fillStyle = fg; mx.fillRect(cx + dx - 12, by - 56, 24, 24);
      mx.fillStyle = '#ffd88a'; mx.fillRect(cx + dx - 0.5, by - 45, 1, 3);
    }
    // a chain with a small dark chandelier
    const chx = X + 50 + rnd() * 40, chy = 30 + rnd() * 30;
    mx.fillStyle = '#2e2647'; for (let y = 0; y < chy; y += 3) mx.fillRect(chx, y, 1, 2);
    mx.strokeStyle = '#3b2e5a'; mx.lineWidth = 1.5; mx.beginPath(); mx.ellipse(chx, chy + 2, 9, 2.5, 0, 0, TAU); mx.stroke();
    for (const dx of [-7, 0, 7]) { mx.fillStyle = '#ffd88a'; mx.fillRect(chx + dx, chy - 3, 1, 2); }
  }
}

function drawBg(t) {
  const th = G.theme || THEMES[0], bg = G.bg, cx = G.cam.x;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, th.sky0); g.addColorStop(1, th.sky1);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.drawImage(bg.far, -Math.round(cx * 0.2), 0);
  // light shafts breathing slowly
  for (const s of bg.shafts) {
    const x = s.x - cx * 0.25, a = 0.045 + 0.025 * Math.sin(t * 0.6 + s.ph);
    const sg = ctx.createLinearGradient(0, 0, 0, H); sg.addColorStop(0, `rgba(${th.shaft},${a * 1.6})`); sg.addColorStop(1, `rgba(${th.shaft},0)`);
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + s.w, 0); ctx.lineTo(x + s.w + 110, H); ctx.lineTo(x + 110, H); ctx.fill();
  }
  ctx.drawImage(bg.mid, -Math.round(cx * 0.45), 0);
  // drifting fog
  for (const f of bg.fogs) {
    const span = W + 240, x = (((f.x - cx * 0.55 + t * f.sp) % span) + span) % span - 120;
    const fg = ctx.createRadialGradient(x, f.y, 0, x, f.y, f.rx); fg.addColorStop(0, `rgba(${th.fog},.08)`); fg.addColorStop(1, `rgba(${th.fog},0)`);
    ctx.save(); ctx.translate(x, f.y); ctx.scale(1, f.ry / f.rx); ctx.translate(-x, -f.y); ctx.fillStyle = fg; ctx.fillRect(x - f.rx, f.y - f.rx, f.rx * 2, f.rx * 2); ctx.restore();
  }
  ctx.drawImage(bg.near, -Math.round(cx * 0.72), 0);
  // ambient particles per chamber
  const span = W + 40;
  if (th.amb === 'drip') {
    for (let k = 0; k < 24; k++) {
      const x = (((k * 97.3 + 13) - cx * 0.85) % span + span) % span - 20, y = ((t * (90 + (k % 5) * 20) + k * 53) % (H + 40)) - 20;
      ctx.fillStyle = `rgba(${th.glow},.35)`; ctx.fillRect(Math.round(x), Math.round(y), 1, 3);
    }
  }
  if (th.amb === 'wax') {
    for (let k = 0; k < 26; k++) {
      const x = (((k * 83.1 + 29) - cx * 0.8 + Math.sin(t * 0.7 + k) * 10) % span + span) % span - 20, y = ((t * (10 + (k % 5) * 4) + k * 61) % (H + 20)) - 10;
      ctx.fillStyle = k % 3 ? `rgba(239,227,194,${0.25 + 0.15 * Math.sin(t + k)})` : `rgba(205,190,255,${0.3 + 0.2 * Math.sin(t * 2 + k)})`; ctx.fillRect(Math.round(x), Math.round(y), k % 4 ? 1 : 2, 1);
    }
  }
  if (th.amb === 'ember') {
    for (let k = 0; k < 30; k++) {
      const x = (((k * 71.7 + 7) - cx * 0.8 + Math.sin(t * 1.3 + k) * 6) % span + span) % span - 20, y = H - ((t * (14 + (k % 6) * 5) + k * 41) % (H + 20));
      ctx.fillStyle = `rgba(242,${120 + (k % 4) * 25},60,${0.35 + 0.3 * Math.sin(t * 3 + k)})`; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  for (const m of bg.motes) {
    const x = (((m.x - cx * 0.8) % span) + span) % span - 20, y = (((m.y - t * m.sp) % H) + H) % H;
    ctx.fillStyle = `rgba(${th.glow},${0.16 + 0.2 * Math.sin(t * 2 + m.ph)})`; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
  }
}

// ---------- drawing: actors
function drawFlame(x, y, s, t, col, core) {
  const f = Math.sin(t * 19) * 0.6 + Math.sin(t * 31) * 0.5;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - 7 * s - f);
  ctx.quadraticCurveTo(x + 3.6 * s, y - 2 * s, x, y + 0.5 * s); ctx.quadraticCurveTo(x - 3.6 * s, y - 2 * s, x, y - 7 * s - f); ctx.fill();
  if (core) { ctx.fillStyle = core; ctx.beginPath(); ctx.moveTo(x, y - 4 * s - f * 0.5); ctx.quadraticCurveTo(x + 1.8 * s, y - 1 * s, x, y); ctx.quadraticCurveTo(x - 1.8 * s, y - 1 * s, x, y - 4 * s - f * 0.5); ctx.fill(); }
}
function drawShrine(cx0, t) {
  const s = G.shrine; if (!s) return;
  const x = s.x - cx0, y = s.y + T;
  ctx.fillStyle = C.stone; ctx.fillRect(x, y - 10, 16, 10); ctx.fillStyle = C.stoneHi; ctx.fillRect(x, y - 10, 16, 2);
  ctx.fillStyle = '#2a303e'; ctx.fillRect(x + 3, y - 6, 10, 1); ctx.fillRect(x - 2, y - 2, 20, 2);
  ctx.fillStyle = C.wax; ctx.fillRect(x + 6, y - 16, 4, 6); ctx.fillStyle = C.waxSh; ctx.fillRect(x + 9, y - 16, 1, 6);
  ctx.fillStyle = '#2a2222'; ctx.fillRect(x + 8, y - 18, 1, 2);
  if (s.lit) drawFlame(x + 8.5, y - 18, 0.9, t + 3, C.flame, C.core);
  if (G.boss && G.boss.kind === 'chandler' && G.boss.state !== 'dormant') { ctx.fillStyle = 'rgba(184,156,255,.55)'; ctx.fillRect(x + 6, y - 17, 4, 1); return; } // sealed
  if (G.nearShrine && !P.sit && G.state === 'play') {
    const bob = Math.round(Math.sin(t * 5) * 1.5);
    ctx.fillStyle = C.wax; ctx.beginPath(); ctx.moveTo(x + 8, y - 34 + bob); ctx.lineTo(x + 12, y - 29 + bob); ctx.lineTo(x + 4, y - 29 + bob); ctx.fill();
  }
}
// Focus: a ring of flame at the feet, a rising heat column and a growing glow; front flames drawn over the body
function drawFocus(cx, by, t, front) {
  const k = Math.min(1, P.healT / focusT()), rx = 9 + k * 5, ry = 3 + k;
  if (!front) {
    const g = ctx.createRadialGradient(cx, by - 8, 0, cx, by - 8, 20 + k * 14);
    g.addColorStop(0, `rgba(255,190,110,${0.18 + 0.3 * k})`); g.addColorStop(0.5, `rgba(226,85,63,${0.1 + 0.15 * k})`); g.addColorStop(1, 'rgba(226,85,63,0)');
    ctx.fillStyle = g; ctx.fillRect(cx - 40, by - 48, 80, 80);
    // heat column: flame tongues licking upward behind the body
    for (let i = -1; i <= 1; i++) {
      const hgt = (8 + k * 18) * (i === 0 ? 1 : 0.7), sway = Math.sin(t * 9 + i * 2) * 1.5;
      ctx.fillStyle = `rgba(242,165,65,${0.35 + 0.3 * k})`; ctx.beginPath();
      ctx.moveTo(cx + i * 4 - 3, by - 2); ctx.quadraticCurveTo(cx + i * 4 + sway - 2, by - hgt * 0.6, cx + i * 4 + sway, by - hgt); ctx.quadraticCurveTo(cx + i * 4 + sway + 2, by - hgt * 0.6, cx + i * 4 + 3, by - 2); ctx.fill();
      ctx.fillStyle = `rgba(255,241,193,${0.3 + 0.4 * k})`; ctx.beginPath();
      ctx.moveTo(cx + i * 4 - 1.5, by - 2); ctx.quadraticCurveTo(cx + i * 4 + sway * 0.6, by - hgt * 0.5, cx + i * 4 + sway * 0.6, by - hgt * 0.65); ctx.quadraticCurveTo(cx + i * 4 + sway * 0.6 + 1, by - hgt * 0.5, cx + i * 4 + 1.5, by - 2); ctx.fill();
    }
  }
  // ring of small flames at the feet; the back half sits behind the body, the front half over it
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = t * 2.2 + i / n * TAU, sy = Math.sin(a);
    if ((sy > 0) !== front) continue;
    const x = cx + Math.cos(a) * rx, y = by - 1 + sy * ry;
    drawFlame(x, y, 0.45 + 0.35 * k + 0.1 * Math.sin(t * 13 + i), t * 1.7 + i, k > 0.7 ? C.ember : C.flame, C.core);
  }
  if (front && k > 0.55) { const a = (k - 0.55) / 0.45; ctx.fillStyle = `rgba(255,241,193,${a * 0.8})`; ctx.fillRect(cx - 1, by - 9, 2, 2); }
}
// idle helpers: a one-pixel breath, a blink now and then, and a glance to the side every few seconds
const idleBob = () => P.idleT > 0 ? (Math.sin(P.idleT * 2.6) > 0.25 ? 1 : 0) : 0;
const idleBlink = () => P.idleT > 0 && (P.idleT % 3.4) > 3.27;
const idleLook = () => P.idleT > 2.5 && (P.idleT % 6) > 4.4 && (P.idleT % 6) < 5.5;
function drawPlayer(cx0, t) {
  if (G.abyss && G.abyss.in != null && !G.abyss.drawing && cx0 !== 0) return;   // the abyss draws the hero itself while swallowing
  if (P.dead || (G.finish && G.finish.hideP)) return;
  if (P.inv > 0 && !G.finish && !(G.char === 'hero' && (P.atkT > 0 || P.sheathT > 0)) && Math.floor(t * 22) % 2 === 0 && P.locked <= 0) return;
  const cx = Math.round(P.x + P.w / 2 - cx0), by = Math.round(P.y + P.h), f = P.face;
  const sit = P.sit, low = sit ? 3 : (G.char === 'wick' ? idleBob() : 0);
  if (P.healT > 0) drawFocus(cx, by, t, false);
  if (G.char === 'snuff') crispChar('snuff', () => drawSnuffBody(cx, by, f, t, sit), cx, by);
  else if (G.char === 'hero') crispChar('hero', () => drawHeroBody(cx, by, f, t, sit), cx, by);
  else if (G.char === 'knight') drawKnightBody(cx, by, f, t, sit, low);
  else {
  // hook on the back
  if (P.atkT <= 0.08) { ctx.fillStyle = C.brass; ctx.fillRect(cx - f * 6, by - 12 + low, 1, 7); ctx.fillRect(cx - f * 6 - (f > 0 ? 0 : -1), by - 13 + low, f > 0 ? -2 : 2, 1); }
  // legs
  if (!sit) {
    ctx.fillStyle = '#1b1424';
    let l1 = 0, l2 = 0;
    if (P.grounded && Math.abs(P.vx) > 10) { const ph = Math.floor(P.anim * 12) % 4; l1 = [0, -1, 0, 1][ph]; l2 = -l1; }
    if (!P.grounded) { l1 = -1; l2 = 1; }
    ctx.fillRect(cx - 3, by - 3 + Math.min(0, l1), 2, 3 - Math.abs(Math.min(0, l1)));
    ctx.fillRect(cx + 1, by - 3 + Math.min(0, l2), 2, 3 - Math.abs(Math.min(0, l2)));
  }
  // cloak
  const sway = clamp(-P.vx / 60, -2, 2), hemY = by - 2 + (sit ? 1 : 0);
  ctx.fillStyle = C.cloak; ctx.beginPath();
  ctx.moveTo(cx - 4, by - 9 + low); ctx.lineTo(cx + 4, by - 9 + low); ctx.lineTo(cx + 6 + sway, hemY); ctx.lineTo(cx - 6 + sway, hemY); ctx.fill();
  ctx.fillStyle = C.cloakHi; ctx.fillRect(f > 0 ? cx + 3 : cx - 4, by - 9 + low, 1, 5);
  // candle head
  const hy = by - 16 + low;
  ctx.fillStyle = C.wax; ctx.fillRect(cx - 4, hy, 8, 7);
  ctx.fillStyle = C.waxSh; ctx.fillRect(f > 0 ? cx - 4 : cx + 3, hy + 1, 1, 6); ctx.fillRect(f > 0 ? cx + 2 : cx - 3, hy + 6, 1, 2);
  ctx.fillStyle = C.wax; ctx.fillRect(f > 0 ? cx - 2 : cx + 1, hy + 7, 1, 2);
  ctx.fillStyle = '#18121f';
  const eo = idleLook() ? -f : f;
  if (sit || idleBlink()) { ctx.fillRect(cx - 2 + eo, hy + 3, 2, 1); ctx.fillRect(cx + 1 + eo, hy + 3, 2, 1); }
  else { ctx.fillRect(cx - 2 + eo, hy + 2, 1, 2); ctx.fillRect(cx + 1 + eo, hy + 2, 1, 2); }
  ctx.fillStyle = '#2a2222'; ctx.fillRect(cx, hy - 2, 1, 2);
  const big = P.healT > 0 ? 1.25 + P.healT * 0.4 : 1;
  drawFlame(cx + 0.5, hy - 2, big, t, P.hurtT > 0 ? C.ember : C.flame, C.core);
  }
  if (G.char === 'snuff' && P.atkT > 0) drawSnuffSlash(cx, by, f);
  if (P.healT > 0) drawFocus(cx, by, t, true);
  // slash
  if (G.char === 'wick' && P.atkT > 0.08) {
    const k = 1 - (P.atkT - 0.08) / 0.12; let ox, oy, a0, a1;
    if (P.atkDir === 'up') { ox = cx; oy = by - 12; a0 = -Math.PI + 0.45; a1 = -0.45; }
    else if (P.atkDir === 'down') { ox = cx; oy = by - 2; a0 = 0.45; a1 = Math.PI - 0.45; }
    else if (f > 0) { ox = cx + 4; oy = by - 8; a0 = -1.15; a1 = 1.15; }
    else { ox = cx - 4; oy = by - 8; a0 = Math.PI - 1.15; a1 = Math.PI + 1.15; }
    if (G.char === 'knight') {
      if (P.combo % 2 === 0) { const tmp = a0; a0 = a1; a1 = tmp; } // alternate swing direction through the combo
      drawKnightSlash(ox, oy, a0, a1, k);
    } else {
      const sweep = a0 + (a1 - a0) * Math.min(1, k * 1.6);
      ctx.lineCap = 'round';
      ctx.strokeStyle = `rgba(242,165,65,${0.55 * (1 - k * 0.6)})`; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(ox, oy, 15, a0, sweep); ctx.stroke();
      ctx.strokeStyle = `rgba(239,227,194,${1 - k * 0.5})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(ox, oy, 16, a0, sweep); ctx.stroke();
      ctx.lineCap = 'butt';
    }
  }
}
// Lampknight swing: a tapered crescent smear that whips through fast, lingers, then shrinks into its tip,
// with the blade itself drawn at the leading edge
function drawKnightSlash(ox, oy, a0, a1, k) {
  const fin = P.fin, R = 17 * CH().reach * (fin ? 1.3 : 1);
  const m0 = (a0 + a1) / 2, half = (a1 - a0) / 2 * 1.25; a0 = m0 - half; a1 = m0 + half;
  const prog = Math.min(1, k * 2.6), fade = k < 0.4 ? 1 : Math.max(0, 1 - (k - 0.4) / 0.6);
  const range = a1 - a0, end = a0 + range * prog;
  const start = a0 + range * Math.min(prog - 0.02, Math.max(0, prog - 0.85) + (1 - fade) * 0.8);
  const ccw = a1 < a0;
  const crescent = (r, sF, col) => {
    if (Math.abs(end - start) < 0.04) return;
    const mid = (start + end) / 2, s = r * sF, c2x = ox - Math.cos(mid) * s, c2y = oy - Math.sin(mid) * s;
    const ex = ox + Math.cos(end) * r, ey = oy + Math.sin(end) * r, sx = ox + Math.cos(start) * r, sy = oy + Math.sin(start) * r;
    ctx.fillStyle = col; ctx.beginPath();
    ctx.arc(ox, oy, r, start, end, ccw);
    ctx.arc(c2x, c2y, Math.hypot(ex - c2x, ey - c2y), Math.atan2(ey - c2y, ex - c2x), Math.atan2(sy - c2y, sx - c2x), !ccw);
    ctx.closePath(); ctx.fill();
  };
  if (fin) crescent(R + 9, 1.2, `rgba(255,241,193,${0.45 * fade})`);
  crescent(R + 4, 1.0, `rgba(143,240,224,${0.42 * fade})`);
  crescent(R, 0.8, `rgba(236,244,255,${0.95 * fade})`);
  ctx.strokeStyle = `rgba(255,255,255,${fade})`; ctx.lineWidth = fin ? 2 : 1.2;
  ctx.beginPath(); ctx.arc(ox, oy, R + 0.5, start, end, ccw); ctx.stroke();
  // the blade at the leading edge while it is still moving
  if (k < 0.55) {
    const ux = Math.cos(end), uy = Math.sin(end);
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#d7e0ee'; ctx.lineWidth = fin ? 3 : 2.5;
    ctx.beginPath(); ctx.moveTo(ox + ux * R * 0.25, oy + uy * R * 0.25); ctx.lineTo(ox + ux * (R + 3), oy + uy * (R + 3)); ctx.stroke();
    ctx.strokeStyle = C.brass; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox + ux * R * 0.25 - uy * 3, oy + uy * R * 0.25 + ux * 3); ctx.lineTo(ox + ux * R * 0.25 + uy * 3, oy + uy * R * 0.25 - ux * 3); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ox + ux * (R + 3), oy + uy * (R + 3), fin ? 2.5 : 1.8, 0, TAU); ctx.fill();
    ctx.lineCap = 'butt';
  }
}
