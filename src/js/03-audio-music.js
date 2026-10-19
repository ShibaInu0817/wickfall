// ---------- audio
let AC = null, muted = false, noiseBuf = null;
const VOL = { music:0.8, sfx:0.9 };
try { const v = JSON.parse(localStorage.getItem('wf-vol') || 'null'); if (v) { if (v.music >= 0 && v.music <= 1) VOL.music = +v.music; if (v.sfx >= 0 && v.sfx <= 1) VOL.sfx = +v.sfx; } } catch (_) {}
// comfort settings, kept in this browser: calmer shake, softer flashes, and an assist ember for story players
const COMF = { shake:!!RM, flash:!!RM, assist:false };
try { const v = JSON.parse(localStorage.getItem('wf-comfort') || 'null'); if (v) for (const k in COMF) if (typeof v[k] === 'boolean') COMF[k] = v[k]; } catch (_) {}
const COMF_ROWS = [['shake', 'Reduce shake', 'Screen shake and jolts at a fifth'], ['flash', 'Reduce flashes', 'White flashes and blackouts softened'], ['assist', 'Assist', 'One extra ember, and one back in every new room']];
const heroMaxHp = () => CH().maxHp + (COMF.assist ? 1 : 0);
function setComf(k, v) {
  COMF[k] = !!v; try { localStorage.setItem('wf-comfort', JSON.stringify(COMF)); } catch (_) {}
  if (k === 'assist' && G.state !== 'title') { P.maxHp = heroMaxHp(); P.hp = Math.min(P.maxHp, P.hp + (v ? 1 : 0)); if (v) G.assisted = true; }
}
function comfRows() {
  return `<div class="pcomf">${COMF_ROWS.map(([k, l, d]) => `<button type="button" class="ctog${COMF[k] ? ' on' : ''}" data-action="comf" data-k="${k}" aria-pressed="${COMF[k]}"><i aria-hidden="true"></i><span><b>${l}</b><small>${d}</small></span></button>`).join('')}</div>`;
}
function setVol(k, v) { VOL[k] = clamp(Math.round(v * 10) / 10, 0, 1); try { localStorage.setItem('wf-vol', JSON.stringify(VOL)); } catch (_) {} if (AC && AC.__sfx) AC.__sfx.gain.setTargetAtTime(VOL.sfx, AC.currentTime, 0.02); if (k === 'music') updateBgm(); }
function initAudio() {
  if (AC) { if (AC.state === 'suspended') AC.resume().catch(() => {}); return; }
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    try { const cp = AC.createDynamicsCompressor(); cp.threshold.value = -14; cp.knee.value = 10; cp.ratio.value = 4; cp.connect(AC.__out || AC.destination); AC.__out = cp; } catch (_) {}
    try { const sg = AC.createGain(); sg.gain.value = VOL.sfx; sg.connect(AC.__out || AC.destination); AC.__out = AC.__sfx = sg; } catch (_) {}   // the effects volume
    try { // a cold, airy hall used by Wick Hero's sounds
      const len = Math.floor(AC.sampleRate * 1.8), ir = AC.createBuffer(2, len, AC.sampleRate);
      for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
      const cv = AC.createConvolver(), hp = AC.createBiquadFilter(), rg = AC.createGain();
      cv.buffer = ir; hp.type = 'highpass'; hp.frequency.value = 500; rg.gain.value = 0.9;
      hp.connect(cv).connect(rg).connect(AC.__out || AC.destination); AC.__rev = hp;
    } catch (_) {}
    loadBgm(); loadSamples();
    noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  } catch (e) { AC = null; }
}
// recorded sound effects: a few short clips kept in the page as base64 (the build fills SAMPLE_DATA from src/audio/sfx/)
// and decoded once. sample() returns false until its clip is ready, so callers can fall back to a synthesised sound.
const SAMPLE_DATA = /*@@SAMPLES@@*/{};
const SAMPLES = {};
function loadSamples(ctx) {
  const c = ctx || AC; if (!c) return Promise.resolve();
  return Promise.all(Object.keys(SAMPLE_DATA).filter(k => !SAMPLES[k]).map(k => new Promise(res => {
    try { const s = atob(SAMPLE_DATA[k]), b = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
      const p = c.decodeAudioData(b.buffer, buf => { SAMPLES[k] = buf; res(); }, () => res()); if (p && p.catch) p.catch(() => res()); } catch (_) { res(); } })));
}
function sample(name, vol, rate, delay) {
  if (!AC || muted || !SAMPLES[name]) return false;
  const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), g = AC.createGain();
  s.buffer = SAMPLES[name]; s.playbackRate.value = rate || 1; g.gain.value = vol; s.connect(g); route(g); s.start(t);
  return true;
}
// WET > 0 sends the sound into the reverb as well (set only while a Wick Hero sound plays)
let WET = 0;
function route(g) {
  g.connect(AC.__out || AC.destination);
  if (WET > 0 && AC.__rev) { const s = AC.createGain(); s.gain.value = WET; g.connect(s).connect(AC.__rev); }
}
function wet(w, fn) { const o = WET; WET = w; try { return fn(); } finally { WET = o; } }
// ---------- music
// Chapters 1-2 and camp: "Beneath A Frozen Horizon" (152 bpm) cut on its bar lines and levelled to match chapter 3:
//   explore  the sparse intro once, then the first theme loops · boss  two bars of build and a breath, then the climax loops
//   c12outro the song's own ending, once, on the results screen
// Chapter 3: "Sanguis Cerae" (150 bpm, C minor) rearranged into four cuts on its bar lines:
//   bgm3-explore  intro once, then the first theme and its breakdown loop (the Burrows, the Stair, the Kiln before the fight)
//   bgm3-wyrm     from the wyrm's roar: the build plays once, then the climax loops
//   bgm3-moth     starts inside the hatch: the song's near-silent break carries the heartbeat, the rebuild lands as the
//                 wings open, the final section plays once, then the climax loops for the moth
//   bgm3-outro    the song's own ending, once, when the moth burns out; then the explore loop returns
// Each loop has its own fader; a shared low-pass muffles the music when paused or dead.
const BGM = { tracks:{
    explore:{ url:'bgm-explore.mp3', loop:12.8474 }, boss:{ url:'bgm-boss.mp3', loop:6.4155 }, c12outro:{ url:'bgm-outro.mp3', once:true, lazy:true },
    c3explore:{ url:'bgm3-explore.mp3', loop:12.8474, lazy:true }, c3wyrm:{ url:'bgm3-wyrm.mp3', loop:25.6184, lazy:true },
    c3moth:{ url:'bgm3-moth.mp3', loop:25.6416, lazy:true }, c3outro:{ url:'bgm3-outro.mp3', once:true, lazy:true } },
  master:null, lp:null, started:false, cur:null, outroDone:false };
// big boss sounds push the music down for a moment so they land on top of it
function duckBgm(depth, hold, rel) {
  if (!AC || !BGM.duck) return; const g = BGM.duck.gain, t = AC.currentTime;
  g.cancelScheduledValues(t); g.setValueAtTime(Math.max(0.05, g.value), t);
  g.linearRampToValueAtTime(depth, t + 0.06); g.setValueAtTime(depth, t + 0.06 + hold); g.linearRampToValueAtTime(1, t + 0.06 + hold + rel);
}
const HATCH_MUSIC_AT = 1.28;   // pupa time when the moth cut starts, so the song's rebuild lands as the wings snap open (7.6 s)
function loadTrack(name) {
  const tr = BGM.tracks[name]; if (!tr || tr.loading || !AC || !BGM.lp) return;
  tr.loading = true;
  tr.gain = AC.createGain(); tr.gain.gain.value = 0.0001; tr.gain.connect(BGM.lp);
  fetch(tr.url).then(r => { if (!r.ok) throw new Error(tr.url); return r.arrayBuffer(); })
    .then(ab => new Promise((res, rej) => { const pr = AC.decodeAudioData(ab, res, rej); if (pr && pr.then) pr.then(res, rej); }))
    .then(buf => {
      // skip any encoder padding so the loop is truly gapless
      const d = buf.getChannelData(0); let a = 0, b = d.length - 1;
      while (a < 8192 && Math.abs(d[a]) < 1e-4) a++; while (b > d.length - 8192 && Math.abs(d[b]) < 1e-4) b--;
      tr.buf = buf; tr.a = a / buf.sampleRate; tr.b = (b + 1) / buf.sampleRate;
    }).catch(() => {});
}
function loadBgm() {
  if (!AC || BGM.started || typeof fetch !== 'function') return;
  BGM.started = true;
  BGM.master = AC.createGain(); BGM.master.gain.value = 0.0001;
  BGM.lp = AC.createBiquadFilter(); BGM.lp.type = 'lowpass'; BGM.lp.frequency.value = 18000; BGM.lp.Q.value = 0.5;
  BGM.duck = AC.createGain(); BGM.duck.gain.value = 1;
  BGM.lp.connect(BGM.master).connect(BGM.duck).connect(AC.destination);
  for (const [name, tr] of Object.entries(BGM.tracks)) if (!tr.lazy) loadTrack(name);
}
function playTrack(name, fromStart, offset) {
  const tr = BGM.tracks[name]; if (!AC || !tr || !tr.buf) return false;
  if (tr.src && !fromStart) return true;
  if (tr.src) { try { tr.src.onended = null; tr.src.stop(); } catch (_) {} }
  const src = AC.createBufferSource(); src.buffer = tr.buf;
  if (!tr.once) { src.loop = true; src.loopStart = tr.a + (tr.loop || 0); src.loopEnd = tr.b; }
  else src.onended = () => { if (tr.src === src) { tr.src = null; BGM.outroDone = true; } };
  src.connect(tr.gain); src.start(0, Math.min(tr.b - 0.05, tr.a + (offset || 0))); tr.src = src;
  return true;
}
function stopTrack(name) { const tr = BGM.tracks[name]; if (tr && tr.src) { try { tr.src.onended = null; tr.src.stop(); } catch (_) {} tr.src = null; } }
function bgmReset() {
  // back to the calm theme from its start (camp, a new chapter)
  for (const n in BGM.tracks) if (n !== 'explore') stopTrack(n);
  BGM.cur = null; BGM.outroDone = false;
  const ex = BGM.tracks && BGM.tracks.explore; if (!AC || !ex || !ex.buf || !ex.gain) return;
  playTrack('explore', true);
  const t = AC.currentTime; ex.gain.gain.cancelScheduledValues(t); ex.gain.gain.setValueAtTime(0.0001, t);
}
// which cut should be playing right now (null = silence)
function bgmWant() {
  const B = G.boss;
  if (G.uent && G.state !== 'title') return null;   // the Black Wick's entrance plays in silence
  const fight = G.state !== 'title' && ((G.cine && G.cine.roared) || (!G.cine && B && B.state !== 'dormant' && B.state !== 'dead' && B.state !== 'intro'));
  // the finishing move plays in silence: the music ends as it starts, and stays out until the fight is truly over
  if (G.state !== 'title' && G.state !== 'won' && (G.finish || (B && B.state === 'dead' && B.finished) || (G.bossDown && G.winT > 0))) return null;
  if (G.state === 'won' && G.chapter !== 3 && !G.duel && !G.gal) return BGM.outroDone ? 'explore' : 'c12outro';
  if (G.state === 'title' || G.chapter !== 3 || G.gal) return fight ? 'boss' : 'explore';
  if (B && B.kind === 'wyrm' && B.state === 'pupa') return B.pt >= HATCH_MUSIC_AT ? 'c3moth' : null;   // the coil falls silent
  if (B && B.kind === 'moth') return 'c3moth';
  if (fight) return 'c3wyrm';
  if (G.bossDown && G.room && G.room.def.id === 'kiln' && !BGM.outroDone) return 'c3outro';
  return 'c3explore';
}
function updateBgm() {
  if (!AC || !BGM.master) return;
  if (G.chapter === 3) for (const n of ['c3explore', 'c3wyrm', 'c3moth', 'c3outro']) loadTrack(n);
  else if (G.chapter) loadTrack('c12outro');
  if (!G.bossDown) BGM.outroDone = false;
  const want = bgmWant(), prev = BGM.cur;
  if (want !== prev) {
    // a fight cut always starts from its top; the pupa's moth cut starts in step with the hatch
    let off = 0;
    if (want === 'c3moth' && G.boss && G.boss.kind === 'wyrm' && G.boss.state === 'pupa') off = Math.max(0, G.boss.pt - HATCH_MUSIC_AT);
    const fresh = want === 'boss' || want === 'c3wyrm' || want === 'c3moth' || want === 'c3outro' || want === 'c12outro' || (want === 'c3explore' && prev !== null && prev !== 'c3explore');
    if (!want || playTrack(want, fresh, off)) BGM.cur = want;
  }
  let vol = BGM.cur === 'c3wyrm' || BGM.cur === 'c3moth' || BGM.cur === 'boss' ? 0.42 : 0.5, cut = 18000;
  if (G.state === 'title') vol = 0.6;
  else if (G.state === 'paused' || G.state === 'tip') { vol = 0.3; cut = 700; }
  else if (G.state === 'won') vol = 0.55;
  else if (G.abyss && G.abyss.in != null) vol = Math.max(0.12, 0.5 - G.abyss.in * 0.1);
  else if (G.cine && !G.cine.roared) vol = 0.05;
  else if (P.dead) { vol = 0.2; cut = 1200; }
  if (muted) vol = 0;
  vol *= VOL.music / 0.8;   // the player's music volume (0.8 is the default)
  const t = AC.currentTime;
  BGM.master.gain.setTargetAtTime(Math.max(0.0001, vol), t, G.cine && !G.cine.roared ? 0.25 : 0.5);
  BGM.lp.frequency.setTargetAtTime(cut, t, 0.3);
  for (const [n, tr] of Object.entries(BGM.tracks)) {
    if (!tr.gain) continue;
    const on = n === BGM.cur, fightCut = n === 'boss' || n === 'c3wyrm' || n === 'c3moth';
    // every change is a crossfade: the new part swells in over ~2 s while the old one dies away over ~3 s
    tr.gain.gain.setTargetAtTime(on ? 1 : 0.0001, t, on ? (fightCut ? 0.55 : 1.1) : (G.finish ? 0.2 : 0.9));   // a finisher cuts the music out in under a second
    if (!on && tr.src && n !== 'explore' && tr.gain.gain.value < 0.002) stopTrack(n);
  }
}
function tone(f, dur, type, vol, slide) {
  if (!AC || muted) return; const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(AC.__out || AC.destination); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol, freq) {
  if (!AC || muted || !noiseBuf) return; const t = AC.currentTime, s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 0.9;
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g).connect(AC.__out || AC.destination); s.start(t); s.stop(t + dur + 0.02);
}
// filtered noise with a moving cutoff (whooshes, roars), delayed tones, and fire crackle
function nsweep(dur, vol, type, f0, f1, q, delay) {
  if (!AC || muted || !noiseBuf) return;
  const t = AC.currentTime + (delay || 0), s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = noiseBuf; s.loop = true; f.type = type; f.Q.value = q || 0.8;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.04, dur * 0.3)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f).connect(g); route(g); s.start(t); s.stop(t + dur + 0.05);
}
function tone2(fr, dur, type, vol, slide, delay) {
  if (!AC || muted) return;
  const t = AC.currentTime + (delay || 0), o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(fr, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, fr * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); route(g); o.start(t); o.stop(t + dur + 0.05);
}
function ring(parts, dur, vol, delay) {
  if (!AC || muted) return;
  const t = AC.currentTime + (delay || 0);
  for (const [f, a] of parts) {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 0.995, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol * a, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + dur * (0.6 + 0.4 * a));
    o.connect(g); route(g); o.start(t); o.stop(t + dur + 0.05);
  }
}
function shing(base, vol, delay) { ring([[base, 1], [base * 1.505, 0.6], [base * 1.98, 0.35], [base * 2.74, 0.2]], 0.42, vol, delay); }
// ice: tiny glassy pings scattered in time, and a cold hiss tail
function tinkle(n, dur, vol, delay, lo, hi) {
  for (let i = 0; i < n; i++) { const f = (lo || 4200) + Math.random() * ((hi || 9000) - (lo || 4200));
    ring([[f, 1], [f * 1.41, 0.45]], 0.06 + Math.random() * 0.14, vol * (0.4 + Math.random() * 0.6), (delay || 0) + Math.random() * dur); }
}
function frost(dur, vol, delay) { nsweep(dur, vol, 'highpass', 7000, 3500, 0.5, delay); crackle(dur * 0.8, Math.ceil(dur * 30), vol * 0.5, delay); }
// boss voices run through their own gritty bus (soft clipping) so they sound huge without going shrill
function bossBus(cut) {
  AC.__boss = AC.__boss || {}; if (AC.__boss[cut]) return AC.__boss[cut];
  const ws = AC.createWaveShaper(), cv = new Float32Array(1024);
  for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; cv[i] = Math.tanh(x * 3.2) / Math.tanh(3.2); }
  ws.curve = cv; ws.oversample = '2x'; const g = AC.createGain(); g.gain.value = 0.9;
  const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = cut; lp.Q.value = 0.6;   // tame the fizz the clipping adds
  ws.connect(lp).connect(g).connect(AC.__out || AC.destination);
  if (AC.__rev) { const sd = AC.createGain(); sd.gain.value = 0.55; g.connect(sd).connect(AC.__rev); }
  return AC.__boss[cut] = ws;
}
// a breath-shaped envelope: [time, level] points
function envAt(param, t, pts) { param.setValueAtTime(0.0001, t); for (const [dt, v] of pts) param.linearRampToValueAtTime(Math.max(0.0001, v), t + dt); }
// the wyrm's roar: a rough, growling throat over a sub-boom, opening and closing like a jaw
function beastRoar(len, pitch, vol) {
  if (!AC || muted || !noiseBuf) return; const t = AC.currentTime, out = bossBus(2600);
  const amp = AC.createGain(), jaw = AC.createBiquadFilter(); jaw.type = 'lowpass'; jaw.Q.value = 3;
  jaw.frequency.setValueAtTime(320, t); jaw.frequency.linearRampToValueAtTime(1900, t + 0.28); jaw.frequency.linearRampToValueAtTime(1300, t + len * 0.6); jaw.frequency.exponentialRampToValueAtTime(260, t + len);
  envAt(amp.gain, t, [[0.07, vol * 0.5], [0.3, vol * 0.7], [len * 0.55, vol * 0.5], [len * 0.85, vol * 0.12], [len, 0.0001]]);
  // growl: the throat flutters ~30 times a second
  const flut = AC.createOscillator(), fd = AC.createGain(), trem = AC.createGain();
  flut.type = 'sawtooth'; flut.frequency.setValueAtTime(34, t); flut.frequency.linearRampToValueAtTime(26, t + len); fd.gain.value = 0.55; trem.gain.value = 0.55;
  flut.connect(fd).connect(trem.gain); trem.connect(jaw).connect(amp).connect(out);
  for (const [m, dt, ty, lv] of [[1, 0, 'sawtooth', 0.5], [1.007, 0, 'sawtooth', 0.42], [0.5, 0, 'square', 0.32], [1.5, 0.012, 'sawtooth', 0.16]]) {
    const o = AC.createOscillator(), g = AC.createGain(); o.type = ty; const f = pitch * m;
    o.frequency.setValueAtTime(f * 0.7, t); o.frequency.linearRampToValueAtTime(f * 1.25, t + 0.26); o.frequency.linearRampToValueAtTime(f, t + len * 0.55); o.frequency.exponentialRampToValueAtTime(f * 0.62, t + len);
    g.gain.value = lv; o.connect(g).connect(trem); o.start(t + dt); o.stop(t + len + 0.1);
  }
  flut.start(t); flut.stop(t + len + 0.1);
  // breath and spit through two mouth formants
  for (const [f0, f1, q, lv] of [[420, 700, 4, 0.8], [850, 1150, 5, 0.45], [2000, 1500, 1.5, 0.12]]) {
    const n = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(); n.buffer = noiseBuf; n.loop = true;
    bp.type = 'bandpass'; bp.Q.value = q; bp.frequency.setValueAtTime(f0, t); bp.frequency.linearRampToValueAtTime(f1, t + 0.3); bp.frequency.exponentialRampToValueAtTime(f0 * 0.6, t + len);
    g.gain.value = lv; n.connect(bp).connect(g).connect(amp); n.start(t); n.stop(t + len + 0.1);
  }
  // the chest: a sub-boom you feel more than hear
  const sub = AC.createOscillator(), sg = AC.createGain(); sub.type = 'sine';
  sub.frequency.setValueAtTime(64, t); sub.frequency.exponentialRampToValueAtTime(30, t + len * 0.7);
  envAt(sg.gain, t, [[0.03, vol * 1.1], [len * 0.5, vol * 0.6], [len * 0.8, 0.0001]]); sub.connect(sg).connect(AC.__out || AC.destination); sub.start(t); sub.stop(t + len);
  nsweep(0.18, vol * 0.6, 'highpass', 900, 3000, 0.7);   // the first crack of air
  crackle(len * 0.7, 18, 0.07, 0.15);
}
// the moth's scream: thin, wet and insect-like - a rasping whistle that bends up, with chitters through it
function insectScream(len, pitch, vol) {
  if (!AC || muted || !noiseBuf) return; const t = AC.currentTime, out = bossBus(8000);
  const amp = AC.createGain(), hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 420;
  envAt(amp.gain, t, [[0.03, vol * 0.8], [len * 0.25, vol], [len * 0.7, vol * 0.7], [len, 0.0001]]);
  // the chitter: the whole voice stutters ~40 times a second
  const ch = AC.createOscillator(), cd = AC.createGain(), stut = AC.createGain();
  ch.type = 'square'; ch.frequency.setValueAtTime(38, t); ch.frequency.linearRampToValueAtTime(52, t + len); cd.gain.value = 0.45; stut.gain.value = 0.55;
  ch.connect(cd).connect(stut.gain); stut.connect(hp).connect(amp).connect(out);
  for (const [m, lv, det] of [[1, 0.5, 0], [1.414, 0.32, 9], [0.5, 0.2, -6]]) {   // a tritone above: the wrongness
    const o = AC.createOscillator(), mod = AC.createOscillator(), md = AC.createGain(), g = AC.createGain(); const f = pitch * m;
    o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(f * 0.6, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + len * 0.3); o.frequency.linearRampToValueAtTime(f * 1.15, t + len * 0.65); o.frequency.exponentialRampToValueAtTime(f * 0.55, t + len);
    mod.type = 'sine'; mod.frequency.setValueAtTime(f * 0.11, t); md.gain.value = f * 0.45;   // FM rasp
    mod.connect(md).connect(o.frequency); g.gain.value = lv; o.connect(g).connect(stut);
    o.start(t); mod.start(t); o.stop(t + len + 0.05); mod.stop(t + len + 0.05);
  }
  const n = AC.createBufferSource(), bp = AC.createBiquadFilter(), ng = AC.createGain(); n.buffer = noiseBuf; n.loop = true;
  bp.type = 'bandpass'; bp.Q.value = 2.5; bp.frequency.setValueAtTime(2500, t); bp.frequency.exponentialRampToValueAtTime(6000, t + len * 0.3); bp.frequency.exponentialRampToValueAtTime(1800, t + len);
  ng.gain.value = 0.5; n.connect(bp).connect(ng).connect(amp); n.start(t); n.stop(t + len + 0.05);
  tone2(1600 + Math.random() * 300, 0.06, 'square', vol * 0.15, 0.7, len * 0.15); tone2(1900, 0.06, 'square', vol * 0.12, 0.7, len * 0.15 + 0.08);
}
function crackle(dur, n, vol, delay) { for (let i = 0; i < n; i++) nsweep(0.025 + Math.random() * 0.02, vol * (0.5 + Math.random() * 0.5), 'bandpass', 1800 + Math.random() * 3200, 1400, 2.5, (delay || 0) + Math.random() * dur); }
const SFX = {
  // Wick Hero, in a cold anime-katana style: a bright "tsing" on every cut with the air ripped behind it,
  // ice crystallising on each hit, everything in a cold hall; the finisher charges quietly, then shatters
  hDraw:() => wet(0.25, () => { nsweep(0.09, 0.12, 'bandpass', 2400, 8000, 3.5); shing(4200, 0.02, 0.07); tinkle(3, 0.12, 0.008, 0.05); }),
  hSwing:() => wet(0.32, () => { const v = 0.92 + Math.random() * 0.16;
    nsweep(0.05, 0.4, 'bandpass', 1500 * v, 6500 * v, 1.3);            // the cut: fast and bright
    nsweep(0.16, 0.22, 'bandpass', 5200 * v, 900 * v, 0.8, 0.035);      // air tearing behind the blade
    shing(3600 * v, 0.036, 0.008); ring([[7200 * v, 1]], 0.25, 0.014, 0.01); // steel "tsing" with a high glint
    tone2(68, 0.08, 'sine', 0.12, 0.6); frost(0.22, 0.05, 0.06); }),
  hHit:() => wet(0.4, () => {
    nsweep(0.022, 0.42, 'highpass', 8000, 4000, 0.7);                   // the slice through
    nsweep(0.08, 0.28, 'bandpass', 3200, 1100, 1.8, 0.004);
    tone2(85, 0.2, 'sine', 0.32, 0.45); tone2(170, 0.08, 'triangle', 0.08, 0.5); // weight
    shing(2600 + Math.random() * 400, 0.028, 0.01);
    crackle(0.14, 7, 0.12, 0.03); tinkle(6, 0.22, 0.016, 0.04); frost(0.3, 0.06, 0.05); }), // ice forming on the wound
  hTick:() => wet(0.35, () => { const f = 3800 + Math.random() * 3200;
    nsweep(0.03, 0.12, 'bandpass', f, f * 0.55, 2.5); ring([[f * 1.3, 1], [f * 1.9, 0.4]], 0.14, 0.013); tinkle(1, 0.05, 0.01, 0.02); }),
  hDrone:() => wet(0.5, () => {                                         // the charge: low hum, rising icy shimmer
    tone2(49, 1.1, 'sine', 0.14, 1.04); nsweep(1.0, 0.07, 'lowpass', 250, 800, 0.7);
    nsweep(1.0, 0.05, 'bandpass', 2500, 9000, 6); tinkle(14, 0.95, 0.009, 0.05, 5000, 10000); }),
  hClick:() => wet(0.45, () => {                                        // the blade clicks home
    nsweep(0.01, 0.3, 'bandpass', 3000, 2800, 4); nsweep(0.012, 0.22, 'bandpass', 1900, 1800, 4, 0.05);
    tone2(210, 0.07, 'triangle', 0.08, 0.8, 0.05); ring([[5200, 1], [7800, 0.5]], 0.5, 0.012, 0.05); }),
  hShatter:() => wet(0.6, () => {                                       // a deep boom, then a cascade of breaking ice
    tone2(42, 1.0, 'sine', 0.38, 0.5); tone2(84, 0.5, 'triangle', 0.1, 0.5); nsweep(0.6, 0.3, 'lowpass', 1600, 120, 0.7);
    nsweep(0.06, 0.4, 'highpass', 6000, 3000, 0.6); nsweep(0.7, 0.26, 'highpass', 4500, 1200, 0.6, 0.03);
    crackle(0.6, 30, 0.12); tinkle(28, 0.9, 0.018, 0.02);
    ring([[1760, 1], [2640, 0.7], [3520, 0.5], [4710, 0.35], [5920, 0.25]], 1.2, 0.04);
    for (let i = 0; i < 6; i++) shing(2800 + Math.random() * 3600, 0.018, 0.04 + i * 0.07);
    frost(1.0, 0.07, 0.15); }),
  // Wick: a quick airy swish (pitch alternates with the stroke) and a crisp, bright hit
  nSlash:alt => { const v = (alt ? 1.12 : 1) * (0.96 + Math.random() * 0.08);
    nsweep(0.1, 0.3, 'bandpass', 800 * v, 3400 * v, 1.1); nsweep(0.07, 0.09, 'highpass', 4200 * v, 6500 * v, 0.7, 0.015); tone2(260 * v, 0.05, 'triangle', 0.025, 1.5); },
  nHit:() => { nsweep(0.025, 0.3, 'highpass', 5000, 2500, 0.7); nsweep(0.07, 0.3, 'bandpass', 2200, 700, 1.3, 0.004);
    tone2(130, 0.12, 'sine', 0.26, 0.5); tone2(1700, 0.07, 'square', 0.02, 0.7); },
  // Lampknight: armour rattle on the wind-up, deep whoosh + thump on the swing, metal clang on contact
  kWind:() => { nsweep(0.09, 0.05, 'highpass', 3200, 4200, 0.7); tone2(310, 0.05, 'square', 0.015, 0.8); },
  kSwing:n => { nsweep(0.26, 0.3, 'bandpass', 380 + (n || 1) * 60, 1250, 0.9); tone2(68, 0.18, 'sine', 0.2, 0.6); tone2(136, 0.09, 'triangle', 0.05, 0.7); },
  kHit:() => { tone2(105, 0.2, 'sine', 0.3, 0.45); nsweep(0.13, 0.32, 'lowpass', 2600, 300, 0.7); tone2(820, 0.24, 'triangle', 0.05, 0.98); tone2(1245, 0.18, 'triangle', 0.03, 0.97); },
  // the fire cleave: ignite on the wind-up, roar on the swing, fiery hit, boom and crackle on landing
  kIgnite:() => { nsweep(0.42, 0.18, 'bandpass', 240, 2300, 1.2); crackle(0.42, 7, 0.08); tone2(170, 0.42, 'sawtooth', 0.03, 2.1); },
  kFireSwing:() => { nsweep(0.5, 0.34, 'lowpass', 480, 2700, 0.6); nsweep(0.55, 0.2, 'bandpass', 950, 280, 1); tone2(58, 0.32, 'sine', 0.24, 0.7); crackle(0.5, 9, 0.09); },
  kFireHit:() => { SFX.kHit(); nsweep(0.38, 0.3, 'lowpass', 3200, 380, 0.7); crackle(0.42, 8, 0.1); },
  kFireBoom:() => { tone2(56, 0.75, 'sine', 0.36, 0.4); tone2(88, 0.42, 'triangle', 0.12, 0.5); nsweep(0.75, 0.36, 'lowpass', 1900, 110, 0.7); crackle(1.0, 18, 0.08); },
  jump:() => tone(300, 0.12, 'square', 0.04, 1.8),
  slash:() => noise(0.09, 0.14, 2600),
  hit:() => { noise(0.08, 0.2, 900); tone(170, 0.1, 'square', 0.05, 0.5); },
  hurt:() => { tone(240, 0.32, 'sawtooth', 0.07, 0.3); noise(0.2, 0.16, 600); },
  dash:() => noise(0.16, 0.09, 4200),
  pogo:() => tone(554, 0.09, 'triangle', 0.08, 1.5),
  clink:() => tone(980, 0.06, 'square', 0.04, 1.2),
  tVolley:() => { nsweep(0.5, 0.12, 'bandpass', 300, 900, 3); for (let i = 0; i < 4; i++) tone2(180 + i * 60, 0.08, 'sine', 0.04, 1.3, i * 0.12); },
  tCall:() => { tone2(660, 0.4, 'sine', 0.04, 1); tone2(880, 0.4, 'sine', 0.03, 1, 0.15); nsweep(0.4, 0.08, 'lowpass', 600, 300, 1); },
  tWave:() => { tone2(45, 0.7, 'sawtooth', 0.08, 1.4); nsweep(0.7, 0.14, 'lowpass', 200, 900, 0.8); },
  tCross:() => { nsweep(0.8, 0.1, 'highpass', 3000, 5000, 1); tone2(300, 0.8, 'square', 0.015, 1.8); },
  tRain:() => { tone2(220, 1.1, 'sawtooth', 0.05, 3); nsweep(1.1, 0.14, 'bandpass', 400, 3000, 1.5); },
  waveFire:() => { nsweep(0.6, 0.3, 'lowpass', 500, 2400, 0.7); crackle(0.5, 14, 0.1); tone2(70, 0.4, 'sawtooth', 0.06, 0.6); },
  splat:() => { nsweep(0.12, 0.14, 'lowpass', 1600, 300, 0.8); tone2(140, 0.1, 'sine', 0.1, 0.5); },
  slam:() => { tone2(42, 0.7, 'sine', 0.45, 0.5); nsweep(0.6, 0.38, 'lowpass', 1400, 70, 0.7); crackle(0.4, 12, 0.1); },
  dread:() => { tone2(38, 3.2, 'sine', 0.16, 1.03); tone2(57, 3.0, 'sine', 0.06, 0.97); nsweep(3.0, 0.06, 'lowpass', 200, 500, 0.7); },
  chain:() => { tone2(800 + Math.random() * 600, 0.05, 'square', 0.014, 0.85); nsweep(0.04, 0.05, 'highpass', 4500, 3000, 2); },
  step:() => { tone2(48, 0.3, 'sine', 0.32, 0.5); nsweep(0.2, 0.18, 'lowpass', 600, 80, 0.7); },
  roar:() => { nsweep(1.3, 0.32, 'bandpass', 220, 90, 1.6); tone2(55, 1.4, 'sawtooth', 0.11, 0.7); tone2(83, 1.2, 'sawtooth', 0.07, 0.6); nsweep(1.1, 0.22, 'lowpass', 700, 140, 0.7); },
  ward:() => { nsweep(0.5, 0.2, 'bandpass', 300, 1800, 1.2); tone2(150, 0.5, 'sawtooth', 0.05, 2); ring([[660, 1], [990, 0.5]], 0.5, 0.025, 0.1); },
  absorb:() => { nsweep(0.3, 0.26, 'lowpass', 1600, 200, 0.8); tone2(120, 0.22, 'sine', 0.16, 0.5); },
  spit:() => { nsweep(0.12, 0.14, 'bandpass', 600, 1800, 1.5); tone2(300, 0.1, 'square', 0.02, 1.6); },
  crack:() => { nsweep(0.35, 0.32, 'lowpass', 2200, 200, 0.7); crackle(0.3, 14, 0.12); tone2(70, 0.3, 'sine', 0.25, 0.5); },
  shell:() => { tone2(1800, 0.12, 'square', 0.03, 0.9); tone2(2700, 0.1, 'triangle', 0.03, 1); nsweep(0.03, 0.15, 'highpass', 5000, 3000, 0.7); },
  chime:() => { tone2(554, 0.6, 'sine', 0.05, 1); tone2(831, 0.7, 'sine', 0.04, 1, 0.1); tone2(1109, 0.8, 'sine', 0.03, 1, 0.2); },
  descend:() => { nsweep(1.2, 0.2, 'lowpass', 300, 3000, 0.8); tone2(110, 1.2, 'sine', 0.08, 2); crackle(1.0, 16, 0.06); },
  arrive:() => { nsweep(0.6, 0.12, 'lowpass', 2400, 300, 0.7); tone2(554, 0.6, 'sine', 0.03, 1); },
  // the Warden's weight: a deep slam, a crushing wall hit, heavy footfalls on the charge
  bslam:() => { tone2(72, 0.55, 'sine', 0.42, 0.4); tone2(44, 0.8, 'sine', 0.36, 0.55, 0.01); nsweep(0.4, 0.34, 'lowpass', 1100, 70, 0.7); nsweep(0.14, 0.16, 'bandpass', 2400, 500, 1.2); crackle(0.45, 12, 0.07, 0.06); },
  wallhit:() => { tone2(110, 0.35, 'square', 0.12, 0.35); tone2(52, 0.9, 'sine', 0.44, 0.45); nsweep(0.5, 0.4, 'lowpass', 2000, 80, 0.8); nsweep(0.22, 0.22, 'bandpass', 3400, 800, 2); crackle(0.7, 22, 0.09, 0.03); tone2(38, 1.0, 'sine', 0.3, 0.7, 0.05); },
  stomp:() => { tone2(62, 0.14, 'sine', 0.18, 0.6); nsweep(0.09, 0.09, 'lowpass', 520, 110, 0.7); },
  blip:() => tone2(880, 0.05, 'square', 0.02, 1),
  coin:() => { tone2(1320, 0.12, 'square', 0.03, 1); tone2(1980, 0.2, 'square', 0.025, 1, 0.07); },
  anvil:() => { for (let i = 0; i < 3; i++) { tone2([1109, 1245, 1109][i], 0.25, 'triangle', 0.06, 0.98, i * 0.18); nsweep(0.04, 0.2, 'bandpass', 3500, 2500, 3, i * 0.18); } },
  focusStart:() => { nsweep(0.35, 0.12, 'bandpass', 300, 1400, 1); tone2(110, 0.5, 'sine', 0.07, 1.6); },
  focusTick:k => { crackle(0.1, 2, 0.04 + 0.04 * (k || 0)); tone2(160 + (k || 0) * 420, 0.09, 'triangle', 0.012, 1.15); },
  focusDone:() => { nsweep(0.45, 0.26, 'lowpass', 500, 3200, 0.7); tone2(277, 0.6, 'sine', 0.08, 2); crackle(0.4, 10, 0.08); },
  fizzle:() => { nsweep(0.18, 0.06, 'highpass', 2500, 1200, 0.6); },
  snuff:() => { nsweep(0.4, 0.22, 'highpass', 2200, 400, 0.6); tone2(200, 0.22, 'square', 0.03, 0.4); },
  gate:() => { nsweep(0.5, 0.2, 'lowpass', 300, 1400, 0.8); tone2(415, 0.5, 'sine', 0.05, 1); tone2(554, 0.6, 'sine', 0.04, 1, 0.12); },
  sign:() => { tone2(880, 0.18, 'sine', 0.03, 1); tone2(1320, 0.22, 'sine', 0.02, 1, 0.06); },
  heal:() => { tone(440, 0.28, 'sine', 0.08, 1.5); tone(660, 0.34, 'sine', 0.05, 1.5); },
  die:() => tone(208, 0.9, 'sawtooth', 0.08, 0.2),
  thud:() => { tone(85, 0.28, 'sine', 0.22, 0.5); noise(0.2, 0.12, 300); },
  boss:() => { tone(69, 1.4, 'sawtooth', 0.09, 0.7); tone(104, 1.4, 'sine', 0.06, 0.7); },
  kill:() => { noise(0.25, 0.16, 1200); tone(330, 0.2, 'triangle', 0.05, 0.5); },
  land:() => noise(0.05, 0.06, 500),
  rest:() => { tone(554, 0.4, 'sine', 0.06, 1); tone(831, 0.6, 'sine', 0.04, 1); },
  finisher:() => { noise(0.16, 0.22, 1700); tone(130, 0.2, 'square', 0.07, 0.55); },
  boltHit:() => { tone2(52, 0.6, 'sine', 0.42, 0.4); nsweep(0.6, 0.36, 'lowpass', 2600, 120, 0.7); nsweep(0.08, 0.3, 'bandpass', 900, 300, 0.9); crackle(0.5, 18, 0.12); },
  boltWall:() => { tone2(80, 0.25, 'sine', 0.2, 0.5); nsweep(0.25, 0.2, 'lowpass', 2000, 200, 0.7); },
  bolt:() => { nsweep(0.32, 0.3, 'bandpass', 400, 2600, 0.9); nsweep(0.4, 0.18, 'lowpass', 1800, 300, 0.7, 0.05); tone2(90, 0.25, 'sine', 0.22, 0.6); tone2(220, 0.3, 'sawtooth', 0.04, 2.4); crackle(0.3, 8, 0.07); },
  flare:() => { noise(0.45, 0.17, 900); tone(140, 0.42, 'sawtooth', 0.06, 2.6); },
  wRumble:() => { tone2(40, 0.9, 'sawtooth', 0.08, 1.25); nsweep(0.9, 0.2, 'lowpass', 120, 320, 0.7); crackle(0.8, 10, 0.04); },
  wBurst:() => { nsweep(0.4, 0.3, 'lowpass', 1800, 200, 0.7); crackle(0.4, 16, 0.1); tone2(60, 0.4, 'sine', 0.3, 0.5); },
  wGlob:() => { nsweep(0.25, 0.16, 'bandpass', 500, 1500, 1.2); tone2(180, 0.2, 'sine', 0.08, 0.6); },
  mFlap:() => { nsweep(0.16, 0.1, 'lowpass', 700, 180, 0.6); nsweep(0.16, 0.08, 'lowpass', 700, 180, 0.6, 0.18); },
  mScreech:() => { tone2(900, 0.5, 'sawtooth', 0.05, 1.8); tone2(1340, 0.45, 'square', 0.025, 1.6); nsweep(0.5, 0.15, 'bandpass', 2000, 5000, 2); },
  pCrack:() => { crackle(0.15, 6, 0.1); tone2(120, 0.15, 'triangle', 0.08, 0.7); },
  // ---- finishing moves: the music cuts out, time holds its breath, every strike is heavy, and the kill rings out
  finStart:hero => {   // the world stops: a deep thump, a sucked-in breath, and a low drone that fills the silence
    tone2(46, 0.9, 'sine', 0.42, 0.55); nsweep(0.5, 0.16, 'highpass', 400, 3600, 0.7);
    tone2(41.2, 2.4, 'sine', 0.1, 1); tone2(61.7, 2.2, 'sine', 0.05, 1.002);
    wet(0.5, () => ring(hero === 'hero' ? [[1568, 1], [2349, 0.4]] : hero === 'knight' ? [[392, 1], [587, 0.5]] : [[784, 1], [1175, 0.4]], 1.4, 0.03, 0.05));
    duckBgm(0.05, 2.2, 1.5);
  },
  finSwell:len => {    // reverse-cymbal riser that stops dead a hair before the hit, so the hit lands in silence
    if (!AC || muted || !noiseBuf) return; len = Math.max(0.12, len || 0.4); const t = AC.currentTime, end = t + len - 0.05;
    const n = AC.createBufferSource(), bp = AC.createBiquadFilter(), g = AC.createGain(); n.buffer = noiseBuf; n.loop = true;
    bp.type = 'bandpass'; bp.Q.value = 1.2; bp.frequency.setValueAtTime(500, t); bp.frequency.exponentialRampToValueAtTime(6500, end);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.3, end); g.gain.linearRampToValueAtTime(0.0001, end + 0.015);
    n.connect(bp).connect(g); route(g); n.start(t); n.stop(end + 0.05);
    const o = AC.createOscillator(), og = AC.createGain(); o.type = 'sawtooth'; o.frequency.setValueAtTime(70, t); o.frequency.exponentialRampToValueAtTime(260, end);
    og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.06, end); og.gain.linearRampToValueAtTime(0.0001, end + 0.015);
    o.connect(og); route(og); o.start(t); o.stop(end + 0.05);
  },
  finBlow:hero => {    // the killing blow: a crack, a body-blow, a sub drop you feel, and a long ring in the hero's own colour
    nsweep(0.06, 0.5, 'highpass', 2500, 7000, 0.7); tone2(95, 1.4, 'sine', 0.55, 0.3); tone2(52, 1.8, 'sine', 0.4, 0.55, 0.02);
    nsweep(0.9, 0.42, 'lowpass', 2600, 50, 0.8); crackle(0.5, 18, 0.1, 0.03);
    if (hero === 'knight') {           // a bell of steel and a roar of fire
      wet(0.5, () => ring([[196, 1], [523, 0.7], [1187, 0.45], [2063, 0.25]], 2.6, 0.06, 0.01));
      nsweep(1.4, 0.32, 'bandpass', 260, 1400, 0.9, 0.05); crackle(1.2, 30, 0.08, 0.1);
    } else if (hero === 'hero') {      // glass: a cold shimmer that hangs in the hall
      wet(0.75, () => { ring([[2637, 1], [3951, 0.6], [5274, 0.4], [1319, 0.5]], 2.8, 0.035, 0.02); tinkle(14, 1.2, 0.012, 0.05); });
      nsweep(0.6, 0.2, 'highpass', 8000, 2500, 1, 0.02);
    } else {                           // Wick: a warm "whumph" of flame, then the hiss of a wick going out and a soft bell
      nsweep(0.5, 0.36, 'lowpass', 900, 120, 1.2, 0.01); nsweep(1.0, 0.14, 'highpass', 3000, 900, 0.6, 0.35);
      wet(0.5, () => ring([[523, 1], [784, 0.6], [1046, 0.4]], 2.4, 0.045, 0.04));
    }
    duckBgm(0.05, 1.5, 2.0);
  },
  finCut:i => {        // each of the dash-cuts: a fatter swish with weight behind it
    const v = 1 + (i || 0) * 0.08; nsweep(0.12, 0.45, 'bandpass', 900 * v, 6500 * v, 1.3); tone2(110 * v, 0.2, 'sine', 0.42, 0.45); nsweep(0.25, 0.26, 'lowpass', 1500, 120, 0.8, 0.02);
  },
  finIce:i => wet(0.5, () => { const v = i ? 1.12 : 1; ring([[3136 * v, 1], [4699 * v, 0.5]], 0.9, 0.02, 0.01); tone2(80, 0.25, 'sine', 0.25, 0.5); nsweep(0.2, 0.2, 'bandpass', 3000, 9000, 2); }),
  finHeave:() => { nsweep(0.35, 0.4, 'bandpass', 180, 900, 0.9); tone2(70, 0.35, 'sawtooth', 0.09, 1.6); crackle(0.3, 12, 0.09); },
  finLeap:() => { nsweep(0.3, 0.34, 'bandpass', 400, 2400, 1); tone2(150, 0.25, 'sine', 0.14, 1.8); },
  finVanish:() => wet(0.6, () => { nsweep(0.4, 0.2, 'bandpass', 6000, 800, 1.5); tone2(1200, 0.5, 'sine', 0.03, 0.4); }),
  // ---- The Black Wick: Wick Hero's sounds pitched down and dirtied; every tell has its own cue
  // the draw cut's tell: his signature slash (a recorded sword swing, pitched a little down), over a low thump
  uGlint:() => { if (!wet(0.25, () => sample('slash-r1plus', 0.95, 0.94))) wet(0.4, () => { shing(3300, 0.035); nsweep(0.25, 0.14, 'bandpass', 5200, 1500, 3); }); tone2(55, 0.45, 'sine', 0.24, 0.7); },
  uDash:() => { nsweep(0.14, 0.42, 'bandpass', 600, 5200, 1.2); tone2(90, 0.2, 'sawtooth', 0.07, 0.4); },
  uLineCut:() => wet(0.35, () => { nsweep(0.08, 0.45, 'highpass', 2000, 8000, 0.8); nsweep(0.4, 0.3, 'bandpass', 3000, 400, 2); tone2(70, 0.4, 'sine', 0.36, 0.5); crackle(0.2, 10, 0.08); }),
  uRaise:() => { nsweep(0.42, 0.22, 'bandpass', 300, 1400, 2); tone2(65, 0.45, 'sawtooth', 0.07, 1.5); },
  uSlash:i => { const v = 0.9 + (i || 0) * 0.07; nsweep(0.1, 0.4, 'bandpass', 700 * v, 4200 * v, 1.2); tone2(140 * v, 0.14, 'sawtooth', 0.06, 0.5); wet(0.3, () => ring([[1400 * v, 1], [2100 * v, 0.4]], 0.3, 0.014)); },
  uVanish:() => { nsweep(0.35, 0.26, 'lowpass', 1800, 120, 0.9); nsweep(0.2, 0.12, 'highpass', 3000, 6000, 1); tone2(48, 0.4, 'sine', 0.22, 0.6); },
  uMark:() => wet(0.4, () => { tone2(98, 0.55, 'sine', 0.24, 0.98); ring([[196, 1], [294, 0.4]], 0.6, 0.035); nsweep(0.4, 0.07, 'bandpass', 600, 300, 6); }),
  uDrop:() => { nsweep(0.22, 0.34, 'bandpass', 5000, 600, 1.2); tone2(300, 0.22, 'sawtooth', 0.05, 0.3); },
  uCharge:() => { nsweep(0.6, 0.16, 'bandpass', 200, 1600, 4); tone2(55, 0.6, 'sawtooth', 0.07, 2); crackle(0.5, 12, 0.05); },
  uWave:hi => { nsweep(0.3, 0.34, 'bandpass', hi ? 1800 : 500, hi ? 6000 : 2600, 1.1); tone2(hi ? 220 : 110, 0.3, 'sawtooth', 0.06, hi ? 1.6 : 0.6); },
  uGuard:() => wet(0.5, () => { ring([[523, 1], [1046, 0.5], [1569, 0.3]], 1.3, 0.035); tone2(65, 1.2, 'sine', 0.13, 1); }),
  uParry:() => wet(0.5, () => { shing(2600, 0.07); tone2(90, 0.3, 'sine', 0.32, 0.5); }),
  uCounter:() => { nsweep(0.1, 0.5, 'bandpass', 900, 7000, 1.4); tone2(70, 0.4, 'sine', 0.42, 0.4); crackle(0.25, 12, 0.1); },
  uSevDrone:() => { tone2(41, 2.2, 'sawtooth', 0.08, 1); tone2(43.5, 2.2, 'sawtooth', 0.07, 1); nsweep(2, 0.08, 'bandpass', 300, 1500, 6); duckBgm(0.3, 1.6, 1); },
  uSevTick:() => wet(0.3, () => ring([[1800 + Math.random() * 1600, 1]], 0.15, 0.016)),
  uSevClick:() => { SFX.hClick(); nsweep(0.08, 0.5, 'highpass', 2000, 8000, 0.8); tone2(48, 1.2, 'sine', 0.5, 0.5); nsweep(0.9, 0.35, 'lowpass', 2400, 50, 0.8); crackle(0.5, 20, 0.1); wet(0.6, () => ring([[311, 1], [466, 0.6], [622, 0.4]], 2, 0.045)); duckBgm(0.2, 0.6, 1.2); },
  uBurn:() => { nsweep(0.6, 0.22, 'lowpass', 1600, 200, 0.9); crackle(0.5, 16, 0.07); tone2(62, 0.5, 'sawtooth', 0.05, 0.6); },
  uIntro:() => { if (!wet(0.5, () => sample('slash-r1', 0.8, 0.8))) wet(0.5, () => shing(1800, 0.07)); tone2(44, 1.6, 'sine', 0.45, 0.6); nsweep(1.2, 0.26, 'bandpass', 200, 900, 1.5); crackle(1, 18, 0.06, 0.1); duckBgm(0.25, 1, 1); },
  uEnrage:() => { wet(0.5, () => ring([[156, 1], [233, 0.7], [311, 0.5]], 2, 0.05)); tone2(40, 1.5, 'sawtooth', 0.13, 1.4); nsweep(1.2, 0.3, 'bandpass', 150, 2400, 1.2); duckBgm(0.3, 1, 1); },
  uDie:() => { nsweep(2, 0.22, 'lowpass', 3000, 80, 0.7); wet(0.6, () => ring([[233, 1], [349, 0.6], [466, 0.4]], 2.6, 0.045, 0.1)); tone2(55, 2, 'sine', 0.32, 0.5); crackle(1.5, 30, 0.06); },
  storyWind:() => { nsweep(9, 0.05, 'bandpass', 260, 520, 4); nsweep(9, 0.035, 'bandpass', 900, 600, 6, 1.5); tone2(41, 9, 'sine', 0.06, 1); },
  storyBell:() => wet(0.7, () => { ring([[98, 1], [196, 0.45], [293.7, 0.3], [415, 0.15]], 4.5, 0.05, 0.05); tone2(49, 3, 'sine', 0.08, 1); }),
  lastWords:() => { nsweep(1.4, 0.06, 'bandpass', 500, 260, 3); tone2(110, 1.4, 'sine', 0.05, 0.85); },
  crackOpen:() => { tone2(46, 2.2, 'sawtooth', 0.06, 0.9); nsweep(1.6, 0.12, 'bandpass', 1800, 300, 3); wet(0.6, () => ring([[156, 1], [233, 0.5]], 2.2, 0.03, 0.2)); },
  creak:() => { tone2(180, 0.25, 'sawtooth', 0.025, 0.7); nsweep(0.25, 0.04, 'bandpass', 900, 600, 8); },
  drip:() => { tone2(1400, 0.08, 'sine', 0.05, 0.5); tone2(900, 0.1, 'sine', 0.04, 0.6, 0.12); },
  secret:() => { ring([[523.3, 1], [784, 0.5], [1046.5, 0.3]], 1.4, 0.035, 0.02); tone2(1568, 0.5, 'sine', 0.02, 1, 0.12); },
  hiss:() => { nsweep(0.55, 0.05, 'highpass', 2600, 5200, 0.7); nsweep(0.4, 0.025, 'bandpass', 1400, 900, 2, 0.1); },          // a smoke wisp notices you
  flutter:() => { for (let i = 0; i < 5; i++) nsweep(0.05, 0.035, 'bandpass', 1800 - i * 120, 1200, 3, i * 0.045); },            // an ash moth swarm wheeling
  sizzle:() => { nsweep(0.35, 0.03, 'highpass', 3400, 2200, 0.9); tone2(160, 0.18, 'sawtooth', 0.012, 0.6); },                 // slag hitting the floor
  rankStamp:r => {   // the stamp lands: a thump, and a ring that gets brighter with the rank
    tone2(70, 0.35, 'sine', 0.4, 0.5); nsweep(0.12, 0.25, 'lowpass', 1800, 150, 0.8);
    const lv = { S:4, A:3, B:2, C:1, D:0 }[r] || 0, base = [392, 440, 523, 587, 659][lv];
    if (lv) wet(0.4, () => ring([[base, 1], [base * 1.5, 0.6], [base * 2, 0.4 + lv * 0.1]], 0.8 + lv * 0.35, 0.03 + lv * 0.008, 0.02));
    if (lv >= 3) wet(0.5, () => tinkle(6 + lv * 3, 0.9, 0.01, 0.1));
  },
  abyssOpen:() => { tone2(55, 2.2, 'sine', 0.3, 0.6); tone2(110, 1.8, 'triangle', 0.06, 0.5); nsweep(1.8, 0.22, 'bandpass', 3000, 160, 2.5); nsweep(1.2, 0.14, 'highpass', 6000, 1800, 1, 0.1); ring([[880, 1], [1320, 0.5], [1760, 0.3]], 1.6, 0.03, 0.2); duckBgm(0.4, 0.8, 1.2); },
  abyssHum:() => { tone2(48, 1.7, 'sine', 0.07, 1.05); nsweep(1.6, 0.05, 'bandpass', 400, 900, 6); },
  abyssIn:() => { nsweep(0.9, 0.3, 'bandpass', 300, 3800, 1.4); tone2(70, 0.9, 'sine', 0.2, 2.2); ring([[660, 1], [990, 0.6]], 1.2, 0.04, 0.1); },
  abyssGulp:() => { tone2(120, 0.8, 'sine', 0.4, 0.25); nsweep(0.6, 0.3, 'lowpass', 2400, 60, 1); ring([[1320, 1], [1980, 0.5], [2640, 0.3]], 2.4, 0.035, 0.05); duckBgm(0.3, 0.6, 2.5); },
  bRoar:() => { beastRoar(2.1, 62, 0.5); duckBgm(0.22, 1.3, 1.0); },              // the wyrm's full roar (intro, fire, enrage)
  bGrowl:() => { beastRoar(1.0, 74, 0.36); duckBgm(0.5, 0.5, 0.6); },             // short warning growl before the quake
  mScream:() => { insectScream(1.4, 1250, 0.32); duckBgm(0.28, 0.9, 0.8); },      // the moth's birth and fury
  mShriek:() => { insectScream(0.42, 1500, 0.22); duckBgm(0.6, 0.15, 0.4); },     // a short shriek as it attacks
  hit8:() => { tone2(46, 0.5, 'sine', 0.42, 0.5); nsweep(0.3, 0.3, 'lowpass', 900, 60, 0.7); duckBgm(0.5, 0.12, 0.4); },  // heavy impact body
  wRoar:() => { nsweep(1.5, 0.36, 'bandpass', 150, 560, 1.4); nsweep(1.2, 0.24, 'bandpass', 950, 320, 2.2, 0.08); tone2(66, 1.5, 'sawtooth', 0.13, 1.7); tone2(99, 1.3, 'sawtooth', 0.08, 1.4, 0.05); tone2(44, 1.6, 'sine', 0.28, 0.85); crackle(1.1, 22, 0.06, 0.2); },
  wInhale:() => { nsweep(0.55, 0.2, 'highpass', 500, 2600, 0.8); tone2(85, 0.55, 'sine', 0.09, 1.7); },
  fireBreath:() => { nsweep(0.32, 0.24, 'lowpass', 800, 1700, 0.6); crackle(0.28, 7, 0.07); },
  wHiss:() => { nsweep(0.6, 0.14, 'highpass', 3000, 1200, 0.7); },
  heart:() => { tone2(58, 0.2, 'sine', 0.42, 0.6); tone2(50, 0.22, 'sine', 0.32, 0.6, 0.15); nsweep(0.14, 0.08, 'lowpass', 220, 70, 0.7); },
  mRush:() => { nsweep(0.45, 0.24, 'bandpass', 300, 1900, 1.1); tone2(220, 0.35, 'sawtooth', 0.04, 2.2); crackle(0.3, 8, 0.06); },
  mChit:() => { tone2(1600, 0.08, 'square', 0.025, 0.7); tone2(1900, 0.08, 'square', 0.025, 0.7, 0.09); tone2(1700, 0.1, 'square', 0.02, 0.6, 0.18); nsweep(0.3, 0.08, 'highpass', 2500, 4200, 1); },
  drone:() => { tone2(41, 3.4, 'sawtooth', 0.07, 1); tone2(43.6, 3.4, 'sawtooth', 0.06, 1); tone2(82.5, 3.0, 'sine', 0.04, 0.94); nsweep(3.2, 0.06, 'bandpass', 300, 1100, 7); nsweep(2.6, 0.04, 'bandpass', 1400, 500, 9, 0.5); },
  wet:() => { nsweep(0.28, 0.16, 'lowpass', 1000, 180, 2.5); crackle(0.22, 12, 0.06); tone2(90, 0.2, 'sine', 0.08, 0.6); },
  gPing:() => { tone2(1320, 0.16, 'sine', 0.08, 1); tone2(1980, 0.12, 'sine', 0.035, 1, 0.02); },
  mSlash:() => { nsweep(0.2, 0.24, 'bandpass', 2600, 500, 1.2); tone2(320, 0.12, 'sawtooth', 0.03, 0.5); },
  counter:() => { tone2(1760, 0.6, 'sine', 0.11, 1); tone2(2640, 0.5, 'sine', 0.05, 1); tone2(880, 0.4, 'triangle', 0.06, 0.98); nsweep(0.35, 0.3, 'highpass', 3200, 700, 1); crackle(0.25, 12, 0.09); },
  waxGet:() => { tone2(880, 0.16, 'sine', 0.05, 1.2); tone2(1320, 0.2, 'sine', 0.03, 1, 0.05); }
};
function sfx(n, a) { try { SFX[n] && SFX[n](a); } catch (e) {} }

