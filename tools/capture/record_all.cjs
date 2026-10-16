// Record every trailer scene into out/<scene>.mp4 (+ its sound log), and the screenshot stills into out/still_<scene>_<frame>.png.
// node record_all.cjs [scene ...]
const L = require('./lib.cjs'), SC = require('./scenes.cjs');
const PLAN = { story:380, hollowRun:330, pogo:360, alcove:330, warden:340, chandler:300, wyrm:300, moth:260, finisher:305, crack:300, camp:620, wickRise:360 };
const STILLS = { hollowRun:[90], chandlerIntro:[200], pogo:[108], moth:[60], finisher:[144], camp:[60], alcove:[150], crack:[240], wyrm:[125] };
(async () => {
  const only = process.argv.slice(2), names = only.length ? only : [...new Set([...Object.keys(PLAN), ...Object.keys(STILLS)])];
  for (const n of names) {
    const sc = SC[n], S = await L.open();
    await S.ev(sc.setup); await S.tick(2);
    const stills = STILLS[n] || [], frames = PLAN[n] || (Math.max(...stills) + 1);
    const t = Date.now();
    if (PLAN[n]) await L.record(S, n, frames, async i => { await S.ev(`window.__ctl && window.__ctl(${i})`); if (stills.includes(i)) await L.still(S, `${L.OUT}/still_${n}_${i}.png`); });
    else for (let i = 0; i < frames; i++) { await S.ev(`window.__ctl && window.__ctl(${i})`); await S.tick(1); if (stills.includes(i)) await L.still(S, `${L.OUT}/still_${n}_${i}.png`); }
    console.log(n, frames, 'frames', Math.round((Date.now() - t) / 1000) + 's', S.errs.length ? S.errs : '');
    await S.b.close();
  }
})();
