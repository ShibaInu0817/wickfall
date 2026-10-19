// The Black Wick's entrance: input locked and HUD hidden while it plays, then the duel starts; the recorded slash decodes.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ ...(require('fs').existsSync('/opt/pw-browsers/chromium') && { executablePath:'/opt/pw-browsers/chromium' }), args:['--headless=new', '--autoplay-policy=no-user-gesture-required'], ignoreDefaultArgs:['--headless=old'] });
  const pg = await b.newPage({ viewport:{ width:960, height:544 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(900);
  await pg.mouse.click(300, 300); await pg.evaluate(() => __smp()); await pg.waitForTimeout(600);
  const smp = await pg.evaluate(() => __smp());
  await pg.evaluate(() => __run('duel')); await pg.waitForTimeout(2600);
  const x0 = await pg.evaluate(() => __T.P.x); await pg.keyboard.down('ArrowRight'); await pg.waitForTimeout(500); await pg.keyboard.up('ArrowRight');
  const mid = await pg.evaluate(() => ({ uent:!!__T.G.uent, moved:Math.round(__T.P.x) !== 0, hud:document.getElementById('hudLayer').style.opacity, boss:__T.G.boss && __T.G.boss.state, zm:+(__T.G.zm || 1).toFixed(2) }));
  mid.moved = Math.abs((await pg.evaluate(() => __T.P.x)) - x0) > 2;
  await (await pg.$('#gameWrap')).screenshot({ path:'bx/entrance_mid.png' });
  await pg.waitForTimeout(5600);
  const end = await pg.evaluate(() => ({ uent:!!__T.G.uent, hud:document.getElementById('hudLayer').style.opacity, boss:__T.G.boss && __T.G.boss.state, zm:+(__T.G.zm || 1).toFixed(2) }));
  await (await pg.$('#gameWrap')).screenshot({ path:'bx/entrance_end.png' });
  const ok = smp.includes('slash-r1') && mid.uent && !mid.moved && mid.hud === '0' && !end.uent && end.hud === '' && end.boss !== 'intro' && end.zm < 1.05;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify({ smp, mid, end }), 'errs', errs); await b.close();
})();
