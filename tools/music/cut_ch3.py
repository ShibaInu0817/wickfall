import numpy as np, subprocess, json
SR=44100
x=np.fromfile('src.f32',dtype=np.float32).reshape(-1,2)
bars=list(np.load('bars.npy'))
BAR=float(np.median(np.diff(bars)))
while bars[-1]+BAR < len(x)/SR: bars.append(bars[-1]+BAR)
def b(i): return int(round(bars[i]*SR))
XF=int(0.03*SR)
def seg(i0,i1): return x[b(i0):b(i1)].copy()
def loopify(a, loop_at):
    a=a.copy(); fo=np.linspace(1,0,XF)[:,None]; fi=1-fo
    a[-XF:]=a[-XF:]*fo + a[loop_at:loop_at+XF]*fi
    return a, loop_at+XF
def splice(a,bb):
    n=int(0.012*SR); t=np.linspace(0,np.pi/2,n)[:,None]
    a=a.copy(); a[-n:]=a[-n:]*np.cos(t)+bb[:n]*np.sin(t)
    return np.concatenate([a,bb[n:]])
meta={}
def write(name,a,loop):
    a=np.clip(a,-1,1).astype(np.float32); a.tofile(name+'.f32')
    subprocess.run(['ffmpeg','-loglevel','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i',name+'.f32','-b:a','160k',name+'.mp3'],check=True)
    meta[name]={'len':round(len(a)/SR,4),'loop':None if loop is None else round(loop/SR,4)}
ex,lf=loopify(seg(0,32),b(8)-b(0)); write('bgm3-explore',ex,lf)
wy,lf=loopify(seg(32,80),b(48)-b(32)); write('bgm3-wyrm',wy,lf)
p1=seg(80,96); mo=splice(p1,seg(48,80)); mo,lf=loopify(mo,len(p1)); write('bgm3-moth',mo,lf)
ou=x[b(96):].copy(); ou*=np.minimum(1,np.linspace(1.3,0,len(ou)))[:,None]; write('bgm3-outro',ou,None)
meta['bar']=round(BAR,5)
json.dump(meta,open('bgm3_meta.json','w'),indent=1); print(json.dumps(meta))
