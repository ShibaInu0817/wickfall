// Capture-only hooks, injected after the game boots (tools/capture/make_page.py). Never shipped.
// __ev runs code inside the game's own scope, so scene scripts can stage anything; sfx calls are logged for the soundtrack.
window.__ev = s => eval(s);
window.__sfxlog = [];
{ const orig = sfx; sfx = (n, a) => { window.__sfxlog.push([n, a === undefined ? null : a, performance.now()]); return orig(n, a); }; }
// render one sound effect offline at 44.1 kHz and hand back the samples as base64 float32
window.__render = async (n, a, secs) => {
  const old = AC, ob = noiseBuf, oc = new OfflineAudioContext(1, 44100 * (secs || 3), 44100); AC = oc;
  const cp = oc.createDynamicsCompressor(); cp.threshold.value = -14; cp.knee.value = 10; cp.ratio.value = 4; cp.connect(oc.destination); oc.__out = cp;
  const sg = oc.createGain(); sg.gain.value = VOL.sfx; sg.connect(cp); oc.__sfx = sg;
  noiseBuf = oc.createBuffer(1, oc.sampleRate * 0.5, oc.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const wasMuted = muted; muted = false;
  try { SFX[n] && SFX[n](a === null ? undefined : a); } catch (e) { AC = old; noiseBuf = ob; muted = wasMuted; return ''; }
  AC = old; noiseBuf = ob; muted = wasMuted;
  const buf = await oc.startRendering(), x = buf.getChannelData(0), u8 = new Uint8Array(x.buffer); let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
  return btoa(s);
};
// stage a scene: a hero in a room, in play, with every hint silenced; optional god mode, hidden HUD, toasts or banners
window.__stage = o => {
  storySeen = true; leaveGallery(); G.char = o.hero || 'hero';
  if (o.lab) labStart(Object.assign({ hero:G.char }, o.lab));
  else { newGame('ch' + (o.ch || 1)); const i = ROOM_DEFS.findIndex(d => d.id === o.room); loadRoom(i, o.entry || 'a'); }
  G.state = 'play'; setOverlay(null); setPauseLabels('Pause'); G.iris = null; G.blackIn = 0; G.fade = 0; G.fadeDir = 0; G.descend = null;
  G.skills = { bolt:true, dive:true, flare:true }; syncSkillUI();
  G.hinted = new Proxy({}, { get:() => true, set:() => true });
  if (o.god) G.gal = { macro:[], mt:0, wax:true, god:true, passive:!!o.passive, min:true };
  try { clearTimeout(bannerTimer); } catch (_) {} $('banner').classList.remove('show'); toastEl.classList.remove('show');
  for (const k of ['nohud', 'notoast', 'nobanner']) document.body.classList.toggle('cap-' + k, !!o[k]);
  releaseAll(); if (o.x != null) { P.x = o.x * T; P.y = (o.y || 13) * T - P.h; P.vx = 0; P.vy = 0; P.face = o.face || 1; G.camLead = 0; G.cam.x = clamp(P.x + P.w / 2 - W / 2 + camBias(), 0, G.room.w * T - W); }
  window.__ctl = null;
};
window.__hold = (a, on) => on ? press(a) : release(a);
window.__tap = a => { press(a); setTimeout(() => release(a), 50); };
// cinematic controls for scripted shots: a forced camera (with zoom), a hidden hero, and a veil drawn over the frame
// window.__cam = { x, zm, zf:{ x, y } } (world units)   window.__noP = true   window.__veil = { a, hole:{ x, y, r, a }, eyes:{ x, y, k, s }, bars, red }
window.__cam = null; window.__noP = false; window.__veil = null;
{ const dp = drawPlayer, dh = drawHeroWorld; drawPlayer = (a, b) => { if (!window.__noP) dp(a, b); }; drawHeroWorld = a => { if (!window.__noP) dh(a); }; }
{ const orig = render; render = t => {
  const C = window.__cam; if (C) { G.cam.x = C.x; G.zm = C.zm || 1; G.zf = C.zf || null; }
  orig(t);
  const V = window.__veil; if (!V || G.state !== 'play') return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const zm = G.zm || 1, fx = G.zf ? G.zf.x - G.cam.x : W / 2, fy = G.zf ? G.zf.y : H / 2;
  const scr = (x, y) => [(x - G.cam.x - fx) * zm + fx, (y - fy) * zm + fy];
  if (V.red) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(150,8,18,${V.red})`; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  if (V.a > 0) {
    if (V.hole) { const [hx, hy] = scr(V.hole.x, V.hole.y), r = V.hole.r * zm, g = ctx.createRadialGradient(hx, hy, r * 0.15, hx, hy, r);
      g.addColorStop(0, `rgba(3,0,2,${V.a * (V.hole.a == null ? 0.5 : V.hole.a)})`); g.addColorStop(1, `rgba(3,0,2,${V.a})`); ctx.fillStyle = g; }
    else ctx.fillStyle = `rgba(3,0,2,${V.a})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (V.eyes && V.eyes.k > 0) {   // the eyes burn through any darkness
    const [ex, ey] = scr(V.eyes.x, V.eyes.y), k = V.eyes.k, s = Math.max(1, Math.round(zm * (V.eyes.s || 1))), gap = 4 * zm;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 5 * zm * (0.6 + k * 0.5)); g.addColorStop(0, `rgba(255,50,30,${0.4 * k})`); g.addColorStop(1, 'rgba(255,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(ex - 30 * zm, ey - 30 * zm, 60 * zm, 60 * zm);
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = k > 0.85 ? '#ffd0c0' : `rgba(255,58,36,${Math.min(1, k * 1.4)})`;
    ctx.fillRect(Math.round(ex - gap / 2 - s / 2), Math.round(ey - s / 2), s, Math.max(1, Math.round(s * 0.7))); ctx.fillRect(Math.round(ex + gap / 2 - s / 2), Math.round(ey - s / 2), s, Math.max(1, Math.round(s * 0.7)));
  }
  if (V.bars) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, V.bars); ctx.fillRect(0, H - V.bars, W, V.bars); }
}; }
