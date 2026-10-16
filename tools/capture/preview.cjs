// node preview.cjs scene f1,f2,...  -> stills at those frames in out/pv_<scene>_<f>.png
const L = require('./lib.cjs'), SC = require('./scenes.cjs'), fs = require('fs');
(async () => {
  const [name, list] = process.argv.slice(2), sc = SC[name], at = (list || '30,90,150').split(',').map(Number), S = await L.open();
  await S.ev(sc.setup); await S.tick(2);
  const last = Math.max(...at); const info = [];
  for (let i = 0; i <= last; i++) {
    await S.ev(`window.__ctl && window.__ctl(${i})`); await S.tick(1);
    if (at.includes(i)) { await L.still(S, `${L.OUT}/pv_${name}_${i}.png`); info.push([i, await S.ev(`[G.state, G.boss && G.boss.state, Math.round(P.x/T*10)/10, Math.round(P.y), !!G.finish, P.hp]`)]); }
  }
  console.log(name, JSON.stringify(info), S.errs); await S.b.close();
})();
