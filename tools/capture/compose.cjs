// Text cards, captioned screenshots and the link-preview image, laid out in HTML with the game's own fonts.
// node compose.cjs  (needs out/still_*.png from record_all.cjs)
const { chromium } = require('playwright'), fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'out'), MEDIA = path.join(__dirname, '..', '..', 'media');
const FONTS = fs.readFileSync(path.join(__dirname, 'fonts.css'), 'utf8');
const SLOGAN = 'Every flame goes out. Not yours.';
const img = f => 'file://' + path.join(OUT, f);
const base = `${FONTS}*{box-sizing:border-box;margin:0}body{width:var(--w);height:var(--h);overflow:hidden;background:#05060a;color:#efe3c2;font-family:'Alegreya Sans',sans-serif}
.disp{font-family:'IM Fell English SC',serif;letter-spacing:.04em}.px{font-family:'Silkscreen',monospace;letter-spacing:.3em;text-transform:uppercase}
.flame{position:relative;width:46px;height:70px;margin:0 auto}.flame i{position:absolute;inset:0;border-radius:50% 50% 45% 45%/60% 60% 40% 40%;background:radial-gradient(circle at 50% 70%,#fff1c1 0 18%,#f2a541 38%,#e2553f 70%,transparent 72%);filter:blur(.5px)}
.glow{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%,rgba(242,165,65,.22),rgba(242,120,40,.06) 35%,transparent 65%)}`;
// a pixel flame like the game's candle flames (three frames, flickered in the trailer)
const FLAME = [
  ['....r....', '....r....', '...rr....', '...ror...', '..rooor..', '..roooor.', '.rooyoor.', '.rooyyor.', '.royywor.', '.roywwyr.', '..rywwr..', '...rwr...', '....k....'],
  ['.....r...', '....rr...', '....ror..', '...roor..', '..rooor..', '..rooyor.', '.rooyyor.', '.royyyor.', '.roywwor.', '.roywwyr.', '..rywwr..', '...rwr...', '....k....'],
  ['...r.....', '...rr....', '..ror....', '..roor...', '..rooor..', '.rooyor..', '.rooyyor.', '.royyyor.', '.roywyor.', '.roywwyr.', '..rywwr..', '...rwr...', '....k....']];
const FCOL = { r:'#c8402e', o:'#f2a541', y:'#ffd84a', w:'#fff3cf', k:'#3a2410' };
const pixFlame = (f, px) => `<svg width="${9 * px}" height="${13 * px}" viewBox="0 0 9 13" shape-rendering="crispEdges" style="display:block;margin:0 auto;filter:drop-shadow(0 0 ${px * 2}px rgba(242,165,65,.55))">${FLAME[f].map((row, y) => [...row].map((c, x) => FCOL[c] ? `<rect x="${x}" y="${y}" width="1" height="1" fill="${FCOL[c]}"/>` : '').join('')).join('')}</svg>`;
const page = (w, h, body, css = '') => `<!doctype html><html><head><meta charset="utf-8"><style>${base}:root{--w:${w}px;--h:${h}px}${css}</style></head><body>${body}</body></html>`;
const endText = page(1920, 1080, `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 46%,rgba(3,4,8,.55),rgba(3,4,8,.15) 45%,transparent 70%)"></div>
    <div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center;gap:30px">
      <h1 class="disp" style="font-size:190px;font-weight:400;line-height:.9;color:#f6e7bf;text-shadow:0 7px 0 #3a2410,0 0 60px rgba(242,165,65,.5)">Wickfall</h1>
      <p class="disp" style="font-size:64px;color:#efe3c2;text-shadow:0 3px 12px #000">${SLOGAN}</p>
      <p class="px" style="font-size:30px;color:#f2a541;margin-top:26px;text-shadow:0 2px 8px #000">play free in your browser</p></div>`, 'body{background:transparent}');
const titleCard = f => page(1920, 1080, `<div class="glow"></div><div style="position:absolute;inset:0;display:grid;place-content:center;gap:34px;text-align:center">
    ${pixFlame(f, 12)}<h1 class="disp" style="font-size:230px;font-weight:400;line-height:.9;color:#f6e7bf;text-shadow:0 8px 0 #3a2410,0 0 70px rgba(242,165,65,.45)">Wickfall</h1></div>`);
const CARDS = {
  title_0: titleCard(0), title_1: titleCard(1), title_2: titleCard(2),
  keepers: page(1920, 1080, `<div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center;gap:24px"><p class="px" style="font-size:26px;color:#9fdcd0">the keepers</p><h2 class="disp" style="font-size:96px;font-weight:400">Each one guards a flame.</h2></div>`),
  below: page(1920, 1080, `<div class="glow" style="background:radial-gradient(ellipse at 50% 50%,rgba(170,10,24,.18),transparent 60%)"></div><div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center"><h2 class="disp" style="font-size:96px;font-weight:400;color:#f2d0c8">Something answers from below.</h2></div>`),
  end: page(1920, 1080, `<div style="position:absolute;inset:0;background:url(${img('still_camp_60.png')}) center/cover;filter:brightness(.45) blur(2px)"></div><div class="glow"></div>
    <div style="position:absolute;inset:0;display:grid;place-content:center;text-align:center;gap:30px">
      <h1 class="disp" style="font-size:190px;font-weight:400;line-height:.9;color:#f6e7bf;text-shadow:0 7px 0 #3a2410,0 0 60px rgba(242,165,65,.5)">Wickfall</h1>
      <p class="disp" style="font-size:64px;color:#efe3c2">${SLOGAN}</p>
      <p class="px" style="font-size:30px;color:#f2a541;margin-top:26px">play free in your browser</p></div>`)
};
// the screenshots: [still, caption]
const SHOTS = [
  ['still_hollowRun_90.png', 'A small flame goes down.'],
  ['still_chandlerIntro_200.png', 'Every keeper, a puzzle.'],
  ['still_pogo_108.png', 'Strike down. Bounce. Keep moving.'],
  ['still_moth_60.png', 'Read the tell. Break the slash.'],
  ['still_finisher_144.png', 'End it with a finishing move.'],
  ['still_camp_60.png', 'Three heroes, three ways to fight.'],
  ['still_alcove_150.png', 'Secrets in the stone.'],
  ['still_crack_240.png', 'Something answers from below.'],
  ['still_wyrm_125.png', 'Dive. Stun. Strike.']
];
const captioned = (f, cap) => page(1920, 1080, `<div class="glow" style="background:radial-gradient(ellipse at 50% 0%,rgba(242,165,65,.16),transparent 55%)"></div>
  <h2 class="disp" style="position:absolute;left:0;right:0;top:44px;text-align:center;font-size:76px;font-weight:400;color:#f6e7bf;text-shadow:0 4px 0 #2a1a0c">${cap}</h2>
  <div style="position:absolute;left:176px;top:168px;width:1568px;height:882px;background:url(${img(f)}) center/cover;image-rendering:pixelated;border-radius:10px;box-shadow:0 0 0 2px rgba(246,231,191,.16),0 24px 60px rgba(0,0,0,.6)"></div>`);
const social = page(1200, 630, `<div style="position:absolute;inset:0;background:url(${img('still_camp_60.png')}) 60% 70%/cover;image-rendering:pixelated;filter:brightness(.75)"></div>
  <div style="position:absolute;inset:0;background:linear-gradient(90deg,rgba(4,5,9,.92) 0,rgba(4,5,9,.7) 45%,transparent 75%)"></div>
  <div style="position:absolute;left:70px;top:0;bottom:0;display:grid;align-content:center;gap:22px;width:620px">
    <h1 class="disp" style="font-size:132px;font-weight:400;line-height:.9;color:#f6e7bf;text-shadow:0 6px 0 #3a2410,0 0 40px rgba(242,165,65,.45)">Wickfall</h1>
    <p class="disp" style="font-size:40px">${SLOGAN}</p>
    <p class="px" style="font-size:20px;color:#f2a541">a candlelit platformer</p></div>`);
// the slash: on the Black Wick's last frame, a blade of light crosses the whole screen in two frames, the picture snaps apart
// along it with a jolt, the cut burns, then everything falls to black. WICK_CUT is the frame of wickRise.mp4 it cuts on
// (keep it equal to the out-point of the wickRise clip in assemble.py).
const WICK_CUT = 347, SLASH_N = 96;
const SLASH_JS = String.raw`
const c = document.getElementById('c'), g = c.getContext('2d'), A = document.getElementById('a');
const x0 = -160, y0 = 860, x1 = 2080, y1 = 210, L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux;
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const jit = Array.from({ length:20 }, () => [(rnd() - 0.5) * 2, (rnd() - 0.5) * 2]);
const embers = Array.from({ length:110 }, () => ({ t:rnd(), side:rnd() < 0.5 ? -1 : 1, vy:60 + rnd() * 220, vx:(rnd() - 0.5) * 120, s:[4, 8, 12][Math.floor(rnd() * 3)], k:rnd(), d:rnd() * 0.3 }));
function half(side) { g.beginPath(); const far = 3000 * side; g.moveTo(x0 - ux * 600, y0 - uy * 600); g.lineTo(x1 + ux * 600, y1 + uy * 600); g.lineTo(x1 + ux * 600 + nx * far, y1 + uy * 600 + ny * far); g.lineTo(x0 - ux * 600 + nx * far, y0 - uy * 600 + ny * far); g.closePath(); }
function seg(a, b, w, col, ox, oy) { g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0 + ux * L * a + (ox || 0), y0 + uy * L * a + (oy || 0)); g.lineTo(x0 + ux * L * b + (ox || 0), y0 + uy * L * b + (oy || 0)); g.stroke(); }
window.draw = f => {
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; g.filter = 'none'; g.fillStyle = '#000'; g.fillRect(0, 0, 1920, 1080);
  const CUT = 3, fade = f < 50 ? 1 : Math.max(0, 1 - (f - 50) / 40);
  const jk = f >= CUT && f < CUT + 16 ? (1 - (f - CUT) / 16) : 0, jx = jit[f % 20][0] * 26 * jk, jy = jit[f % 20][1] * 26 * jk;
  g.save(); g.translate(jx, jy);
  if (f < CUT) {
    g.drawImage(A, 0, 0);
    const head = f === 0 ? 0 : f === 1 ? 0.55 : 1;
    if (head > 0) { seg(0, head, 70, 'rgba(160,10,22,.45)'); seg(0, head, 22, 'rgba(255,70,50,.85)'); seg(Math.max(0, head - 0.5), head, 8, '#fff6ef');
      g.fillStyle = 'rgba(255,230,220,' + (head * 0.5) + ')'; g.fillRect(-100, -100, 2200, 1300); }
  } else {
    const k = (f - CUT) / 47, d = 26 + 30 * Math.min(1, k * 1.5);
    g.globalAlpha = fade;
    for (const side of [-1, 1]) { g.save(); g.translate(nx * d * side, ny * d * side); half(side); g.clip(); g.drawImage(A, 0, 0); g.fillStyle = 'rgba(120,6,16,' + (0.35 * Math.max(0, 1 - k * 1.6)) + ')'; g.fillRect(-200, -200, 2400, 1500); g.restore(); }
    // the burning lips of the cut and the dark between them
    const lineA = Math.max(0, f < 80 ? 1 - Math.max(0, f - 40) / 40 : 0), fl = 0.75 + 0.25 * Math.sin(f * 1.7);
    for (const side of [-1, 1]) { seg(0, 1, 26, 'rgba(150,8,20,' + 0.5 * lineA * fl + ')', nx * d * side, ny * d * side); seg(0, 1, 6, 'rgba(255,74,56,' + lineA * fl + ')', nx * d * side, ny * d * side); seg(0, 1, 2, 'rgba(255,225,215,' + 0.7 * lineA * Math.max(0, 1 - k * 2) + ')', nx * d * side, ny * d * side); }
    for (const e of embers) { const age = Math.max(0, k * 1.4 - e.d); if (age <= 0 || age > 1) continue; const px = x0 + ux * L * e.t + nx * d * e.side + e.vx * age, py = y0 + uy * L * e.t + ny * d * e.side - e.vy * age;
      g.globalAlpha = (1 - age) * fade; g.fillStyle = e.k < 0.4 ? '#0a0103' : e.k < 0.85 ? '#b0141f' : '#ff6a50'; g.fillRect(Math.round(px / 4) * 4, Math.round(py / 4) * 4, e.s, e.s); }
    g.globalAlpha = 1;
    if (f - CUT < 10) { const q = 1 - (f - CUT) / 10; g.fillStyle = 'rgba(255,215,200,' + 0.7 * q * q + ')'; g.fillRect(-100, -100, 2200, 1300); }
  }
  g.restore();
};`;
(async () => {
  fs.mkdirSync(path.join(MEDIA, 'screenshots'), { recursive:true }); fs.mkdirSync(path.join(OUT, 'cards'), { recursive:true });
  const b = await chromium.launch({ executablePath:process.env.CHROMIUM || '/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const shoot = async (html, w, h, file, clear) => { const pg = await b.newPage({ viewport:{ width:w, height:h } }); const tf = path.join(OUT, '_compose.html'); fs.writeFileSync(tf, html); await pg.goto('file://' + tf, { waitUntil:'load' }); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150); await pg.screenshot({ path:file, omitBackground:!!clear }); await pg.close(); };
  for (const [k, html] of Object.entries(CARDS)) await shoot(html, 1920, 1080, path.join(OUT, 'cards', k + '.png'));
  await shoot(endText, 1920, 1080, path.join(OUT, 'cards', 'end_text.png'), true);
  for (const [k, [f, cap]] of SHOTS.entries()) {
    if (!fs.existsSync(path.join(OUT, f))) { console.log('missing', f); continue; }
    const id = String(k + 1).padStart(2, '0');
    // clean: the still itself, cropped from 1920x1088 to 1920x1080
    await shoot(page(1920, 1080, `<div style="position:absolute;inset:0;background:url(${img(f)}) center/cover"></div>`), 1920, 1080, path.join(MEDIA, 'screenshots', `${id}.png`));
    await shoot(captioned(f, cap), 1920, 1080, path.join(MEDIA, 'screenshots', `${id}-caption.png`));
  }
  await shoot(social, 1200, 630, path.join(MEDIA, 'social-card.png'));
  require('child_process').execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', path.join(OUT, 'wickRise.mp4'), '-vf', `select=eq(n\\,${WICK_CUT - 1})`, '-frames:v', '1', path.join(OUT, 'cards', 'wick_last.png')]);
  { const dir = path.join(OUT, 'cards', 'slash'); fs.rmSync(dir, { recursive:true, force:true }); fs.mkdirSync(dir, { recursive:true });
    const tf = path.join(OUT, '_slash.html'); fs.writeFileSync(tf, `<!doctype html><body style="margin:0;background:#000"><canvas id=c width=1920 height=1080></canvas>
      <img id=a src="${img('cards/wick_last.png')}"><script>${SLASH_JS}</script></body>`);
    const pg = await b.newPage({ viewport:{ width:1920, height:1080 } }); await pg.goto('file://' + tf, { waitUntil:'load' });
    for (let f = 0; f < SLASH_N; f++) { await pg.evaluate(f => window.draw(f), f); await (await pg.$('#c')).screenshot({ path:path.join(dir, String(f).padStart(4, '0') + '.png') }); }
    await pg.close(); }
  await b.close(); console.log('cards, screenshots and social card written');
})();
