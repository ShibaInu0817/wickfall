const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(require('fs').existsSync('/opt/pw-browsers/chromium') && { executablePath:'/opt/pw-browsers/chromium' }), args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  for (const [name, vp] of [['iphone-se', { width:667, height:375 }], ['iphone-14', { width:844, height:390 }], ['android', { width:915, height:412 }]]) {
    const ctx = await b.newContext({ viewport:vp, deviceScaleFactor:2, isMobile:true, hasTouch:true });
    const pg = await ctx.newPage();
    await pg.goto('file://' + process.cwd() + '/mobtest.html'); await pg.waitForTimeout(600);
    await pg.touchscreen.tap(5, 5); await pg.waitForTimeout(300);
    await pg.evaluate(() => { storySeenHack = 1; }).catch(()=>{});
    await pg.evaluate(() => __run('ch2')); await pg.waitForTimeout(3500);
    const st = await pg.evaluate(() => [__T.G.state, !!__T.G.story, !!__T.G.descend]);
    await pg.screenshot({ path:`bx/m_${name}_page.png` });
    await pg.evaluate(() => document.querySelector('#touch [data-ui="fs"]').click()); await pg.waitForTimeout(800);
    await pg.screenshot({ path:`bx/m_${name}_full.png` });
    const m = await pg.evaluate(() => {
      const r = el => { const q = el && el.getBoundingClientRect(); return q ? [Math.round(q.left), Math.round(q.top), Math.round(q.width), Math.round(q.height)] : null; };
      const out = { vp:[innerWidth, innerHeight], canvas:r(document.querySelector('#game')), stick:r(document.getElementById('pad')), zone:r(document.getElementById('padzone')), cls:document.getElementById('gameWrap').className };
      for (const k of ['jump', 'attack', 'dash', 'heal', 'skill']) out[k] = r(document.querySelector(`[data-act="${k}"]`));
      out.bar = r(document.querySelector('#touch .topbar')); return out; });
    console.log(name, st, JSON.stringify(m));
    await ctx.close();
  }
  await b.close();
})();
