// Render every sound effect the scenes used, once each, with the game's own synth (offline, 44.1 kHz) -> out/sfx/*.f32
const L = require('./lib.cjs'), fs = require('fs'), path = require('path'), crypto = require('crypto');
(async () => {
  const dir = path.join(L.OUT, 'sfx'); fs.mkdirSync(dir, { recursive:true });
  const want = new Map([['storyBell|null', ['storyBell', null]], ['dread|null', ['dread', null]], ['storyWind|null', ['storyWind', null]], ['uGlint|null', ['uGlint', null]], ['uLineCut|null', ['uLineCut', null]], ['uBurn|null', ['uBurn', null]], ['slam|null', ['slam', null]]]);
  for (const f of fs.readdirSync(L.OUT).filter(f => f.endsWith('.sfx.json'))) for (const [n, a] of JSON.parse(fs.readFileSync(path.join(L.OUT, f)))) want.set(`${n}|${JSON.stringify(a)}`, [n, a]);
  const S = await L.open(), index = {};
  await S.pg.evaluate(() => window.__ev('loadSamples(new OfflineAudioContext(1, 1, 44100))'));
  for (const [key, [n, a]] of want) {
    const b64 = await S.pg.evaluate(([n, a]) => window.__render(n, a, n.startsWith('story') || n.startsWith('abyss') || n === 'dread' || n === 'drone' || n === 'uSevDrone' || n === 'uIntro' ? 6 : 3), [n, a]);
    if (!b64) continue; const file = crypto.createHash('md5').update(key).digest('hex').slice(0, 12) + '.f32';
    fs.writeFileSync(path.join(dir, file), Buffer.from(b64, 'base64')); index[key] = file;
  }
  fs.writeFileSync(path.join(dir, 'index.json'), JSON.stringify(index)); console.log('rendered', Object.keys(index).length, 'sounds'); await S.b.close();
})();
