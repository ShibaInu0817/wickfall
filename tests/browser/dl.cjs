const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(require('fs').existsSync('/opt/pw-browsers/chromium') && { executablePath:'/opt/pw-browsers/chromium' }), args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const ctx = await b.newContext({ acceptDownloads:true }); const pg = await ctx.newPage(); const errs=[]; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(700);
  await pg.evaluate(() => { __T.G.chapter = 2; __T.G.time = 300; __win(); }); await pg.waitForTimeout(800);
  await pg.click('[data-action="share"]'); await pg.waitForTimeout(400);
  const [d] = await Promise.all([pg.waitForEvent('download', { timeout:5000 }), pg.click('[data-s="save"]')]);
  console.log('download', d.suggestedFilename(), errs); await b.close();
})();
