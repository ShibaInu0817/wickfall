// Menus: moving with keys shows one unmistakable selection; the default button stops looking selected; the chapter 3 shadow renders.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const pg = await b.newPage({ viewport:{ width:1100, height:700 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(900);
  const box = async n => { await (await pg.$('#gameWrap')).screenshot({ path:n }); };
  await pg.mouse.click(300, 300); await pg.waitForTimeout(200);              // a mouse click first: the old ring would stay hidden after this
  await pg.evaluate(() => __go('chapter')); await pg.waitForTimeout(2500);
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(300); await box('bx/f_chapter_right.png');
  const st = await pg.evaluate(() => ({ nav:document.body.classList.contains('navmode'), focus:document.activeElement && document.activeElement.textContent.trim(),
    ring:getComputedStyle(document.activeElement).outlineStyle }));
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(300); await box('bx/f_chapter_right2.png');
  await pg.mouse.click(5, 5); await pg.waitForTimeout(200); const navAfterClick = await pg.evaluate(() => document.body.classList.contains('navmode'));
  const url = await pg.evaluate(() => __chprev()[3].boss); require('fs').writeFileSync('bx/f_ch3_shadow.jpg', Buffer.from(url.split(',')[1], 'base64'));
  // pause menu and badges with keys
  await pg.evaluate(() => __go('badges')); await pg.waitForTimeout(400); await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(200); await box('bx/f_badges.png');
  console.log(JSON.stringify(st), 'navAfterClick', navAfterClick, 'errs', errs); await b.close();
})();
