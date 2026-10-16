import numpy as np, subprocess, json, scipy.signal as ss
SR=44100
x=np.fromfile('src.f32',dtype=np.float32).reshape(-1,2)
bars=list(np.load('bars.npy')); BAR=float(np.median(np.diff(bars)))
while bars[-1]+BAR < len(x)/SR: bars.append(bars[-1]+BAR)
def b(i): return int(round(bars[i]*SR))
XF=int(0.03*SR)
def seg(i0,i1): return x[b(i0):b(i1)].copy()
def loopify(a, loop_at):
    a=a.copy(); fo=np.linspace(1,0,XF)[:,None]; fi=1-fo
    a[-XF:]=a[-XF:]*fo + a[loop_at:loop_at+XF]*fi
    return a, loop_at+XF
def loud(a):
    m=a.mean(1); bb,aa=ss.butter(2,100/(SR/2),'high'); z=ss.lfilter(bb,aa,m); blk=int(0.4*SR); hop=blk//4
    e=np.array([np.mean(z[i:i+blk]**2) for i in range(0,len(z)-blk,hop)]); e=e[e>1e-7]; g=e[10*np.log10(e)>10*np.log10(e.mean())-10]
    return 10*np.log10(g.mean())
def level(a, target):
    # match a loudness target, then keep peaks under -1 dBFS with a gentle soft clip
    a=a*10**((target-loud(a))/20); pk=np.abs(a).max()
    if pk>0.89: m=np.abs(a); a=np.where(m>0.7, np.sign(a)*(0.7+0.19*np.tanh((m-0.7)/0.19)), a)   # only the peaks above -3 dB are bent under -1 dB
    return a
meta={}
def write(name,a,loop):
    a=np.clip(a,-1,1).astype(np.float32); a.tofile(name+'.f32')
    subprocess.run(['ffmpeg','-loglevel','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i',name+'.f32','-b:a','160k',name+'.mp3'],check=True)
    meta[name]={'len':round(len(a)/SR,4),'loop':None if loop is None else round(loop/SR,4),'loud':round(float(loud(a)),2),'peak':round(float(20*np.log10(np.abs(a).max())),2)}
# explore: the sparse intro once, then the first theme and its pulses loop
ex=level(seg(0,32),-18.0); ex,lf=loopify(ex,b(8)-b(0)); write('bgm-explore',ex,lf)
# boss: two bars of build and the breath before the drop play once, then the climax loops (24 bars)
bo=level(seg(36,64),-15.5); bo,lf=loopify(bo,b(40)-b(36)); write('bgm-boss',bo,lf)
# outro: the song's own ending, faded, once, for the results screen
ou=x[b(88):].copy(); ou*=np.minimum(1,np.linspace(1.3,0,len(ou)))[:,None]; ou=level(ou,-21.0); write('bgm-outro',ou,None)
meta['bar']=round(BAR,5); json.dump(meta,open('meta.json','w'),indent=1); print(json.dumps(meta,indent=1))
