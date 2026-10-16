// Shared capture helpers: a 480x272 game at 4x (1920x1088, cropped to 1920x1080), driven frame by frame on a fake clock,
// so every frame is perfectly spaced however slow the machine is. Frames are piped straight into ffmpeg.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path'), fs = require('fs');
const OUT = path.join(__dirname, 'out');
async function open() {
  const b = await chromium.launch({ executablePath:process.env.CHROMIUM || '/opt/pw-browsers/chromium', args:['--headless=new', '--autoplay-policy=no-user-gesture-required'], ignoreDefaultArgs:['--headless=old'] });
  const ctx = await b.newContext({ viewport:{ width:480, height:272 }, deviceScaleFactor:4 });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.clock.install({ time:new Date('2026-01-01T00:00:00Z') });
  await pg.clock.pauseAt(new Date('2026-01-01T00:00:01Z'));   // stop real time leaking in: only runFor moves the game
  await pg.goto('file://' + path.join(OUT, 'capture.html'));
  await pg.clock.runFor(800);
  await pg.evaluate(() => document.fonts.ready);
  const ev = src => pg.evaluate(s => window.__ev(s), src);
  await ev(`setFull(true)`); await pg.clock.runFor(300);
  const tick = n => pg.clock.runFor(Math.round(n * 1000 / 60));
  const png = () => pg.screenshot({ type:'png' });
  return { b, pg, ev, tick, png, errs };
}
// record `frames` frames at 60 fps into out/<name>.mp4; `each(i)` runs before every frame (scripted input, staging)
async function record(S, name, frames, each) {
  const file = path.join(OUT, name + '.mp4');
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '60', '-i', '-', '-vf', 'crop=1920:1080:0:4', '-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-pix_fmt', 'yuv420p', file]);
  const t0 = await S.pg.evaluate(() => { window.__sfxlog = []; return performance.now(); });
  for (let i = 0; i < frames; i++) {
    if (each) await each(i);
    await S.tick(1);
    const buf = await S.png(); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  const log = await S.pg.evaluate(t0 => window.__sfxlog.map(([n, a, t]) => [n, a, (t - t0) / 1000]), t0);
  fs.writeFileSync(path.join(OUT, name + '.sfx.json'), JSON.stringify(log));
  return { file, sfx:log.length };
}
async function still(S, file) { const buf = await S.png(); fs.writeFileSync(file, buf); }
module.exports = { open, record, still, OUT };
