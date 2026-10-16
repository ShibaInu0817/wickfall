const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const pg = await b.newPage({ viewport:{ width:1100, height:720 } }); const errs=[];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/mp3|Failed to load/.test(m.text())) errs.push(m.text()); });
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(800);
  const box = async n => { await (await pg.$('#gameWrap')).screenshot({ path:n }); };
  // real menu path: home -> chars
  await pg.evaluate(() => __goChars('snuff')); await pg.waitForTimeout(400); await box('bx/p_hero.png');
  await pg.click('[data-action="cs-grp"][data-g="foes"]'); await pg.waitForTimeout(500); await box('bx/p_foes.png');
  await pg.click('[data-action="cs-hero"][data-id="slag"]'); await pg.waitForTimeout(1500); await box('bx/p_slag.png');
  await pg.click('[data-action="cs-grp"][data-g="bosses"]'); await pg.waitForTimeout(400);
  await pg.click('[data-action="cs-hero"][data-id="chandler"]'); await pg.waitForTimeout(400);
  await pg.click('[data-action="cs-anim"][data-a="call"]'); await pg.waitForTimeout(1300); await box('bx/p_chandler.png');
  await pg.click('[data-action="cs-hero"][data-id="umbra"]'); await pg.waitForTimeout(500); await box('bx/p_umbra.png');
  await pg.click('[data-action="cs-grp"][data-g="foes"]'); await pg.waitForTimeout(300);
  console.log('remembered foe:', await pg.evaluate(() => __T.G.cs.id));
  // practice fight: warden
  await pg.evaluate(() => __goChars('warden')); await pg.waitForTimeout(300);
  await pg.click('[data-action="beast-fight"]'); await pg.waitForTimeout(3500);
  console.log('fight', await pg.evaluate(() => ({ st:__T.G.state, room:__T.G.room.def.id, boss:__T.G.boss && __T.G.boss.kind, rush:__T.G.rush })));
  await box('bx/p_fight.png');
  await pg.evaluate(() => { __T.G.boss.hp = 0; }); 
  await pg.evaluate(() => { const G = __T.G; G.boss.state='dead'; G.boss.t=0.01; }); await pg.waitForTimeout(6000);
  console.log('after', await pg.evaluate(() => ({ st:__T.G.state, rush:__T.G.rush && __T.G.rush.won })));
  await box('bx/p_fightwon.png');
  // back to sheet
  const bb = await pg.$('[data-action="beast-back"]'); if (bb) { await bb.click(); await pg.waitForTimeout(600); console.log('back', await pg.evaluate(() => [__T.G.state, __T.G.menu, __T.G.cs.id])); }
  // gallery watch for moth
  await pg.evaluate(() => __goChars('moth')); await pg.waitForTimeout(300);
  await pg.click('[data-action="beast-gal"]'); await pg.waitForTimeout(3000);
  console.log('gal', await pg.evaluate(() => ({ gal:!!__T.G.gal, boss:__T.G.boss && __T.G.boss.kind })));
  await box('bx/p_gal.png');
  // practice fall
  await pg.evaluate(() => { __T.G.gal = null; }); 
  console.log('errs', errs); await b.close();
})();
