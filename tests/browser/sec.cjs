const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] });
  const pg = await b.newPage({ viewport:{ width:1100, height:700 } }); const errs=[];
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/mp3|Failed to load|ERR_/.test(m.text())) errs.push(m.text()); });
  await pg.goto('file://' + process.cwd() + '/test.html'); await pg.waitForTimeout(800);
  const box = async n => { await (await pg.$('#gameWrap')).screenshot({ path:n }); };
  await pg.evaluate(() => __run('ch1')); await pg.waitForTimeout(400);
  // skip story if any
  for (let i = 0; i < 6; i++) { await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); }
  await pg.waitForTimeout(2500);
  console.log('state', await pg.evaluate(() => [__T.G.state, __T.G.room && __T.G.room.def.id]));
  const visit = async (room, tx, name, ch) => {
    await pg.evaluate(([room, tx, ch]) => { const G = __T.G, P = __T.P; G.chapter = ch; __room(room); P.x = (tx - 1) * 16 - 2; P.y = 13 * 16 - P.h; P.inv = 9; G.enemies = []; }, [room, tx, ch]);
    await pg.waitForTimeout(500); await box(`bx/s_${name}_out.png`);
    await pg.keyboard.down('ArrowRight'); await pg.waitForTimeout(260); await pg.keyboard.up('ArrowRight'); await pg.waitForTimeout(900);
    await box(`bx/s_${name}_in.png`);
    console.log(name, await pg.evaluate(() => ({ secrets:__T.G.secrets.map(s => [s.k, s.key, s.done]), veil:(__T.G.veil||[]).map(v => +v.a.toFixed(2)), hp:__T.P.hp, max:__T.P.maxHp, lore:__T.G.lore && __T.G.lore.text })));
  };
  await visit('hollow', 30, 'hollow', 1);
  await visit('drip', 61, 'drip', 1);
  await visit('locks', 35, 'locks', 2);
  await visit('foundry', 34, 'foundry', 2);
  await visit('burrows', 18, 'burrows', 3);
  await visit('stair', 14, 'stair', 3);
  console.log('ach', await pg.evaluate(() => localStorage.getItem('wf-ach')));
  // pause menu with comfort
  await pg.keyboard.press('KeyP'); await pg.waitForTimeout(400); await box('bx/s_pause.png');
  await pg.click('[data-action="comf"][data-k="assist"]'); await pg.waitForTimeout(200);
  await pg.click('[data-action="comf"][data-k="shake"]'); await pg.waitForTimeout(200);
  console.log('comf', await pg.evaluate(() => [localStorage.getItem('wf-comfort'), __T.P.maxHp, __T.G.assisted])); await box('bx/s_pause2.png');
  await pg.keyboard.press('KeyP'); await pg.waitForTimeout(300);
  // win screen + share card
  await pg.evaluate(() => { __T.G.chapter = 1; __T.G.time = 212; __T.G.hits = 3; __T.G.deaths = 0; __win(); }); await pg.waitForTimeout(1600); await box('bx/s_won.png');
  await pg.click('[data-action="share"]'); await pg.waitForTimeout(700); await box('bx/s_share.png');
  const src = await pg.$eval('.sharebox img', i => i.src); require('fs').writeFileSync('bx/s_card.png', Buffer.from(src.split(',')[1], 'base64'));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); console.log('share closed', await pg.evaluate(() => !document.querySelector('.sharebox')));
  // badges page
  await pg.evaluate(() => { __T.G.state = 'title'; }); await pg.click('[data-action="home"]').catch(()=>{}); await pg.waitForTimeout(800);
  const items = await pg.$$eval('[data-action="hm"]', bs => bs.map(b => b.textContent.trim())); console.log('home', items);
  const bi = items.findIndex(t => /Badges/.test(t)); await pg.click(`[data-action="hm"][data-i="${bi}"]`).catch(e => console.log('click fail', e.message)); await pg.waitForTimeout(600); await box('bx/s_badges.png');
  console.log('errs', errs); await b.close();
})();
