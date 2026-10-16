(() => {
'use strict';
const W = 480, H = 272, T = 16, TAU = Math.PI * 2;
const cv = document.getElementById('game');
let ctx = cv.getContext('2d'); // swapped briefly to draw the hero-select previews
const MAIN_CTX = ctx;
// ---------- sharp text: words are drawn on a layer over the pixel canvas at the screen's real resolution, so they never blur
// or go blocky when the 480x272 picture is stretched. Each call keeps the canvas state it was made with (font, colour, alpha,
// alignment, shadow and the current transform, so zoom and shake still apply).
const TXT = { c:null, g:null, q:[], had:false };
function gtext(str, x, y) {
  if (ctx !== MAIN_CTX || typeof ctx.getTransform !== 'function') return ctx.fillText(str, x, y);
  const m = ctx.getTransform(); if (!m || m.a == null) return ctx.fillText(str, x, y);
  TXT.q.push({ str, x:m.a * x + m.c * y + m.e, y:m.b * x + m.d * y + m.f, k:m.a, font:ctx.font, fill:ctx.fillStyle, a:ctx.globalAlpha, al:ctx.textAlign, bl:ctx.textBaseline, sc:ctx.shadowColor, sb:ctx.shadowBlur });
}
function flushText() {
  if (!TXT.q.length && !TXT.had) return;
  if (!TXT.c) { TXT.c = document.createElement('canvas'); TXT.c.className = 'txtlayer'; TXT.c.setAttribute('aria-hidden', 'true'); cv.after(TXT.c); TXT.g = TXT.c.getContext('2d'); }
  const c = TXT.c, g = TXT.g, dpr = Math.min(3, window.devicePixelRatio || 1), cw = cv.clientWidth, ch = cv.clientHeight;
  const L = cv.offsetLeft + 'px', Tp = cv.offsetTop + 'px', Wd = cw + 'px', Hd = ch + 'px';
  if (c.style.left !== L || c.style.top !== Tp || c.style.width !== Wd || c.style.height !== Hd) Object.assign(c.style, { left:L, top:Tp, width:Wd, height:Hd });
  const bw = Math.max(1, Math.round(cw * dpr)), bh = Math.max(1, Math.round(ch * dpr)); if (c.width !== bw || c.height !== bh) { c.width = bw; c.height = bh; }
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, bw, bh);
  const s = Math.min(cw / W, ch / H), ox = (cw - W * s) / 2, oy = (ch - H * s) / 2, k = s * dpr;   // the canvas is drawn 'contain'
  for (const t of TXT.q) {
    g.setTransform(k * t.k, 0, 0, k * t.k, ox * dpr + t.x * k, oy * dpr + t.y * k);
    g.globalAlpha = t.a; g.fillStyle = t.fill; g.textAlign = t.al; g.textBaseline = t.bl; g.font = t.font;
    g.shadowColor = t.sc; g.shadowBlur = t.sb * k * t.k;   // shadows ignore the transform, so scale them by hand
    g.fillText(t.str, 0, 0);
  }
  g.shadowBlur = 0; TXT.had = TXT.q.length > 0; TXT.q = [];
}
ctx.imageSmoothingEnabled = false;
const RM = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
let TOUCH = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
let padEl = null, nubEl = null, padId = null, PADREST = null, EDIT = false;
const padDirs = { left:false, right:false, up:false, down:false };
function buzz(ms) { try { if (TOUCH && navigator.vibrate) navigator.vibrate(ms); } catch (_) {} }
const tip = (touchText, keyText) => TOUCH ? touchText : keyText;

const C = {
  void:'#07080c', rock:'#1b2130', rockHi:'#2c3549', rockLo:'#10141d', speck:'#222a3b',
  moss:'#5fa39a', mossDim:'#3b6c67', bone:'#d8cfb6', boneSh:'#a39a83',
  wax:'#efe3c2', waxSh:'#c9ba93', flame:'#f2a541', core:'#fff1c1', ember:'#e2553f',
  cloak:'#3a2b4b', cloakHi:'#56416d', brass:'#c79a4a', wood:'#5a4632', woodHi:'#7d6247',
  mite:'#7a3f2e', miteHi:'#a65c3f', moth:'#bcb5a2', mothDk:'#6f6a5e', eye:'#8ff0e0', stone:'#3a4152', stoneHi:'#525b70'
};

