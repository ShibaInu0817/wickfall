const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(require('fs').existsSync('/opt/pw-browsers/chromium') && { executablePath:'/opt/pw-browsers/chromium' }), args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const pg = await b.newPage({ viewport:{ width:1100, height:720 }, deviceScaleFactor:1 }); const errs=[];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(800);
  const ids = process.argv[2] ? process.argv[2].split(',') : ['mite','brass','flyer','spitter','wickling','cinderling','cocoon','dripmite','wisp','eel','puppet','slag','swarm','warden','chandler','wyrm','moth'];
  for (const id of ids) {
    await pg.evaluate(id => __goChars(id), id); await pg.waitForTimeout(150);
    const anims = await pg.$$eval('[data-action="cs-anim"]', bs => bs.map(b => b.dataset.a));
    for (const a of anims) {
      await pg.click(`[data-action="cs-anim"][data-a="${a}"]`);
      for (const w of [500]) { await pg.waitForTimeout(w); await (await pg.$('#csv')).screenshot({ path:`bx/${id}_${a}_${w}_${Date.now()%1000}.png` }); }
    }
    console.log(id, anims.join(' '));
  }
  await pg.evaluate(() => __goChars('warden')); await pg.waitForTimeout(400);
  await pg.screenshot({ path:'bx/page_warden.png' });
  await pg.evaluate(() => __goChars('eel')); await pg.waitForTimeout(400);
  await pg.screenshot({ path:'bx/page_eel.png' });
  console.log('errs', [...new Set(errs.filter(e => !/mp3|Failed to load/.test(e)))].slice(0,10)); await b.close();
})();
