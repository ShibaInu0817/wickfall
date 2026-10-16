// Phone-sized checks: the game fills a landscape phone by itself, controls stay on screen, the stick catches anywhere on the left half.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const errs = [];
  for (const [name, vp] of [['iphone-se', { width:667, height:375 }], ['iphone-14', { width:844, height:390 }], ['android', { width:915, height:412 }]]) {
    const ctx = await b.newContext({ viewport:vp, deviceScaleFactor:2, isMobile:true, hasTouch:true });
    const pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message));
    await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(700);
    await pg.screenshot({ path:`bx/mob_${name}_camp.png` });
    await pg.evaluate(() => __run('ch2')); await pg.waitForTimeout(3600);
    await pg.screenshot({ path:`bx/mob_${name}_play.png` });
    const m = await pg.evaluate(() => {
      const r = el => { const q = el && el.getBoundingClientRect(); return q ? [Math.round(q.left), Math.round(q.top), Math.round(q.right), Math.round(q.bottom)] : null; };
      const out = { vp:[innerWidth, innerHeight], full:document.getElementById('gameWrap').classList.contains('full'), state:__T.G.state, canvas:r(document.querySelector('#game')), zone:r(document.getElementById('padzone')), stick:r(document.getElementById('pad')) };
      for (const k of ['jump', 'attack', 'dash', 'heal', 'skill']) out[k] = r(document.querySelector(`[data-act="${k}"]`));
      out.bar = r(document.querySelector('#touch .topbar'));
      out.offscreen = Object.entries(out).filter(([k, v]) => Array.isArray(v) && k !== 'vp' && k !== 'canvas' && (v[0] < 0 || v[1] < 0 || v[2] > innerWidth || v[3] > innerHeight)).map(([k]) => k);
      return out; });
    // drag the stick from a spot high on the left half, then right: the hero should move
    const x0 = await pg.evaluate(() => __T.P.x);
    const cdp = await ctx.newCDPSession(pg), tx = Math.round(vp.width * 0.3), ty = Math.round(vp.height * 0.35);
    await cdp.send('Input.dispatchTouchEvent', { type:'touchStart', touchPoints:[{ x:tx, y:ty }] });
    for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type:'touchMove', touchPoints:[{ x:tx + i * 8, y:ty }] }); await pg.waitForTimeout(30); }
    await pg.waitForTimeout(600); const live = await pg.evaluate(() => document.getElementById('padzone').classList.contains('live'));
    await pg.screenshot({ path:`bx/mob_${name}_stick.png` });
    await cdp.send('Input.dispatchTouchEvent', { type:'touchEnd', touchPoints:[] });
    const x1 = await pg.evaluate(() => __T.P.x);
    console.log(name, JSON.stringify(m), 'stickLive', live, 'moved', Math.round(x1 - x0));
    await ctx.close();
  }
  console.log('errs', errs); await b.close();
})();
