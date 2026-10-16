// Touch aiming: tap Slash = side, swipe down on Slash in the air = down-slash, a shallow down-right push on the stick in the air = down-slash.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const ctx = await b.newContext({ viewport:{ width:844, height:390 }, deviceScaleFactor:2, isMobile:true, hasTouch:true });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(700);
  await pg.evaluate(() => __run('ch2')); await pg.waitForTimeout(3600);
  const cdp = await ctx.newCDPSession(pg);
  const sl = await pg.evaluate(() => { const q = document.querySelector('[data-act="attack"]').getBoundingClientRect(); return { x:Math.round(q.left + q.width / 2), y:Math.round(q.top + q.height / 2) }; });
  const T = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints:pts });
  const dirAfter = async () => { for (let i = 0; i < 8; i++) { const d = await pg.evaluate(() => __T.P.atkT > 0 ? __T.P.atkDir : null); if (d) return d; await pg.waitForTimeout(16); } return 'none'; };
  const airborne = async () => { await pg.keyboard.down('Space'); await pg.waitForTimeout(120); await pg.keyboard.up('Space'); await pg.evaluate(() => { const P = __T.P; P.atkT = 0; P.atkCD = 0; }); };
  // 1. plain tap on the ground
  await pg.evaluate(() => { __T.P.atkT = 0; __T.P.atkCD = 0; });
  await T('touchStart', [{ x:sl.x, y:sl.y, id:1 }]); const tap = await dirAfter(); await T('touchEnd', []); await pg.waitForTimeout(400);
  // 2. swipe down on Slash in the air
  await airborne(); await T('touchStart', [{ x:sl.x, y:sl.y, id:1 }]); await T('touchMove', [{ x:sl.x, y:sl.y + 20, id:1 }]); const swipe = await dirAfter(); const gr = await pg.evaluate(() => __T.P.grounded); await T('touchEnd', []); await pg.waitForTimeout(500);
  // 3. shallow down-right on the stick in the air (about 25 degrees), then tap Slash
  const sx = 120, sy = 250;
  await airborne(); await T('touchStart', [{ x:sx, y:sy, id:2 }]); await T('touchMove', [{ x:sx + 40, y:sy + 19, id:2 }]); await pg.waitForTimeout(40);
  const dirs = await pg.evaluate(() => [__T.G && 0, ...['left', 'right', 'up', 'down'].filter(k => document.querySelector('.arr.' + k).classList.contains('on'))]);
  await T('touchStart', [{ x:sx + 40, y:sy + 19, id:2 }, { x:sl.x, y:sl.y, id:3 }]); const stick = await dirAfter(); await T('touchEnd', []);
  console.log(JSON.stringify({ tap, swipe, gr, stickDirs:dirs.slice(1), stick }), 'errs', errs); await b.close();
})();
