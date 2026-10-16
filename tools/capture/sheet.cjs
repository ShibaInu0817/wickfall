// node sheet.cjs <scene> <frames> <every>  -> out/sheet_<scene>.png, a contact sheet for checking a scene's timing
const L = require('./lib.cjs'), SC = require('./scenes.cjs'), fs = require('fs'), { execFileSync } = require('child_process');
(async () => { const [n, frames, every] = [process.argv[2], +process.argv[3], +process.argv[4]];
  const S = await L.open(); await S.ev(SC[n].setup); await S.tick(2); const dir = `${L.OUT}/sh_${n}`; fs.rmSync(dir, { recursive:true, force:true }); fs.mkdirSync(dir);
  for (let i = 0; i < frames; i++) { await S.ev(`window.__ctl && window.__ctl(${i})`); await S.tick(1); if (i % every == 0) fs.writeFileSync(`${dir}/${String(i).padStart(4, '0')}.png`, await S.pg.screenshot({ type:'png', scale:'css' })); }
  await S.b.close();
  execFileSync('python3', ['-c', `import glob,sys
from PIL import Image,ImageDraw
fs=sorted(glob.glob('${dir}/*.png'));c=6;r=(len(fs)+c-1)//c;W,H=320,181
im=Image.new('RGB',(W*c,H*r))
for i,f in enumerate(fs):
  t=Image.open(f).convert('RGB').resize((W,H));ImageDraw.Draw(t).text((4,4),f[-8:-4],fill=(255,255,0));im.paste(t,((i%c)*W,(i//c)*H))
im.save('${L.OUT}/sheet_${n}.png')`]);
  console.log('sheet', n, S.errs.length ? S.errs : ''); })();
