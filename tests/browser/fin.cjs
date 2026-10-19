const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(require('fs').existsSync('/opt/pw-browsers/chromium') && { executablePath:'/opt/pw-browsers/chromium' }), args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const pg = await b.newPage({ viewport:{ width:960, height:640 } }); const errs=[]; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(700);
  const box = async n => { await (await pg.$('#gameWrap')).screenshot({ path:n }); };
  // gallery
  await pg.keyboard.press('ArrowDown'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(2600);
  for (const boss of ['warden', 'chandler']) for (const hero of ['wick', 'knight', 'hero']) {
    await pg.click(`#galPanel [data-g="char"][data-v="${hero}"]`); await pg.waitForTimeout(100);
    await pg.click(`#galPanel [data-g="boss"][data-v="${boss}"]`); await pg.waitForTimeout(400);
    await pg.click('#galPanel [data-g="opt"][data-v="passive"]').catch(()=>{});
    await pg.evaluate(() => { const B = __T.G.boss; if (B && (B.state === 'intro' || B.state === 'dormant')) { B.state = B.kind === 'chandler' ? 'hover' : 'idle'; B.t = 0.5; __T.G.cine = null; } });
    await pg.waitForTimeout(300);
    await pg.click('#galPanel [data-g="finish"]');
    const shots = []; for (const w of [450, 500, 600, 700]) { await pg.waitForTimeout(w); const n = `bx/fin_${boss}_${hero}_${shots.length}.png`; await box(n); shots.push(n); }
    await pg.waitForTimeout(1500);
    console.log(boss, hero, await pg.evaluate(() => [!!__T.G.finish, !!__T.G.boss, __T.G.state]));
    await pg.click('#galPanel [data-g="opt"][data-v="passive"]').catch(()=>{});
  }
  console.log(errs); await b.close();
})();
