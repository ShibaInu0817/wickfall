#!/usr/bin/env python3
"""Cut the recorded scenes and text cards into media/trailer.mp4, with music and the game's own sound effects,
and make the short teaser loop (media/teaser.webm and media/teaser.gif).
Needs: out/<scene>.mp4 + .sfx.json (record_all.cjs), out/cards/*.png (compose.cjs), out/sfx/*.f32 (render_sfx.cjs)."""
import json, os, subprocess, numpy as np, hashlib
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
OUT, MEDIA, AUD = os.path.join(HERE, 'out'), os.path.join(ROOT, 'media'), os.path.join(ROOT, 'src', 'audio')
FPS, SR = 60, 44100
# (kind, source, in-frame or seconds, out-frame or None, fade-in s, fade-out s)
EDIT = [
  ('clip', 'story', 0, 360, 0.6, 0.4),
  ('flick', 'title', 3.2, None, 0.5, 0.5),
  ('clip', 'hollowRun', 10, 320, 0.3, 0),
  ('clip', 'pogo', 20, 350, 0, 0),
  ('clip', 'alcove', 50, 320, 0, 0.4),
  ('card', 'keepers', 3.2, None, 0.4, 0.4),
  ('clip', 'warden', 90, 330, 0, 0),
  ('clip', 'chandler', 15, 290, 0, 0),
  ('clip', 'wyrm', 15, 290, 0, 0),
  ('clip', 'moth', 10, 250, 0, 0),
  ('clip', 'finisher', 40, 300, 0, 0.4),
  ('clip', 'crack', 30, 290, 0.3, 0.5),
  ('card', 'below', 3.0, None, 0.5, 0.5),
  ('clip', 'wickRise', 30, 347, 0, 0),      # cut on his draw: keep 347 equal to WICK_CUT in compose.cjs
  ('seq', 'slash', 96, None, 0, 0),
  ('black', None, 0.4, None, 0, 0),
  ('live', 'end', 10.0, None, 1.2, 1.5),
]
def run(*a): subprocess.run(list(a), check=True)
def seg_len(e): return (e[3] - e[2]) / FPS if e[0] == 'clip' else e[2] / FPS if e[0] == 'seq' else e[2]
def video():
    tmp = os.path.join(OUT, 'segs'); os.makedirs(tmp, exist_ok=True); lst = []
    for k, e in enumerate(EDIT):
        kind, src, a, b, fi, fo = e; d = seg_len(e); f = os.path.join(tmp, f'{k:02d}.mp4')
        fades = ([f'fade=t=in:st=0:d={fi}'] if fi else []) + ([f'fade=t=out:st={d - fo:.3f}:d={fo}'] if fo else [])
        if kind == 'clip':
            vf = ','.join([f'trim=start_frame={a}:end_frame={b}', 'setpts=PTS-STARTPTS'] + fades)
            run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, src + '.mp4'), '-vf', vf, '-r', str(FPS), '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-an', f)
        elif kind == 'black':
            run('ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', f'color=c=black:s=1920x1080:r={FPS}:d={d}', '-c:v', 'libx264', '-crf', '16', '-pix_fmt', 'yuv420p', f)
        elif kind == 'live':   # the end: the camp, alive and dimmed, with the title laid over it
            fc = f"[0:v]trim=start_frame=0:end_frame={int(d * FPS)},setpts=PTS-STARTPTS,eq=brightness=-0.06:saturation=0.85,gblur=sigma=2.2[bg];[bg][1:v]overlay=0:0,format=yuv420p" + (',' + ','.join(fades) if fades else '')
            run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, 'camp.mp4'), '-loop', '1', '-framerate', str(FPS), '-t', f'{d}', '-i', os.path.join(OUT, 'cards', src + '_text.png'), '-filter_complex', fc, '-r', str(FPS), '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-an', f)
        elif kind == 'seq':
            run('ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', os.path.join(OUT, 'cards', src, '%04d.png'), '-vf', 'scale=1920:1080,format=yuv420p', '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-an', f)
        elif kind == 'flick':   # a card whose flame flickers: frames <src>_0..2 shown a tenth of a second each, in a restless order
            order = [0, 1, 0, 2, 1, 2, 0, 1, 2, 0, 2, 1]; fl = os.path.join(tmp, f'{k:02d}_flick.txt'); n = int(d * 10) + 1
            with open(fl, 'w') as fh:
                for m in range(n): fh.write(f"file '{os.path.join(OUT, 'cards', f'{src}_{order[m % len(order)]}.png')}'\nduration 0.1\n")
                fh.write(f"file '{os.path.join(OUT, 'cards', f'{src}_0.png')}'\n")
            vf = ','.join(['scale=1920:1080', f'fps={FPS}', 'format=yuv420p', f'trim=duration={d}'] + fades)
            run('ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', fl, '-vf', vf, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-an', f)
        else:
            vf = ','.join(['scale=1920:1080', 'format=yuv420p'] + fades)
            run('ffmpeg', '-y', '-loglevel', 'error', '-loop', '1', '-framerate', str(FPS), '-t', f'{d}', '-i', os.path.join(OUT, 'cards', src + '.png'), '-vf', vf, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', '-an', f)
        lst.append(f)
    with open(os.path.join(tmp, 'list.txt'), 'w') as fh: fh.writelines(f"file '{f}'\n" for f in lst)
    run('ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(tmp, 'list.txt'), '-c', 'copy', os.path.join(OUT, 'trailer_video.mp4'))
def decode(path):
    r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).reshape(-1, 2).copy()
def place(mix, x, t0, gain=1.0, fin=0.0, fout=0.0, dur=None):
    x = x if dur is None else x[:int(dur * SR)]
    x = x * gain; n = len(x)
    if fin: k = int(fin * SR); x[:k] *= np.linspace(0, 1, k)[:, None]
    if fout: k = int(fout * SR); x[-k:] *= np.linspace(1, 0, k)[:, None]
    i = int(t0 * SR); j = min(len(mix), i + n); mix[i:j] += x[:j - i]
def audio(total):
    mix = np.zeros((int((total + 1) * SR), 2), np.float32)
    starts, t = [], 0.0
    for e in EDIT: starts.append(t); t += seg_len(e)
    at = lambda name: starts[[e[1] for e in EDIT].index(name)]
    # music: quiet descent, the boss track for the keepers, silence for the crack, the outro under the end card
    explore, boss, outro = decode(os.path.join(AUD, 'bgm-explore.mp3')), decode(os.path.join(AUD, 'bgm-boss.mp3')), decode(os.path.join(AUD, 'bgm-outro.mp3'))
    m0, m1 = at('title'), at('keepers')
    place(mix, explore, m0, 0.55, fin=1.5, fout=0.6, dur=m1 - m0 + 0.3)
    b0, b1 = m1, at('crack') + 1.2
    place(mix, boss[int(6.4155 * SR):], b0, 0.6, fin=0.25, fout=1.6, dur=b1 - b0)
    place(mix, outro, at('end') - 0.2, 0.62, fin=1.5, fout=2.0, dur=seg_len(EDIT[-1]) + 0.2)
    # sound effects, from each scene's log, rendered offline by the game itself
    lib = json.load(open(os.path.join(OUT, 'sfx', 'index.json')))
    for k, e in enumerate(EDIT):
        if e[0] != 'clip': continue
        a, b = e[2] / FPS, e[3] / FPS
        for n, arg, ts in json.load(open(os.path.join(OUT, e[1] + '.sfx.json'))):
            if ts < a or ts > b: continue
            key = lib.get(f'{n}|{json.dumps(arg)}')
            if not key: continue
            s = np.fromfile(os.path.join(OUT, 'sfx', key), dtype=np.float32)
            place(mix, np.stack([s, s], 1), starts[k] + ts - a, 1.0 if e[1] == 'wickRise' else 0.85 if e[1] in ('story', 'crack', 'alcove') else 0.7)
    # a deep swell under the title, and a sting under the black crack's card
    for n, when, g in (('storyWind', 0.0, 0.9), ('storyWind', 2.6, 0.8), ('storyBell', m0 + 0.05, 0.9), ('dread', at('below') + 0.1, 0.8), ('uLineCut', at('slash') + 3 / FPS, 1.0), ('uBurn', at('slash') + 3 / FPS, 0.9), ('slam', at('slash') + 3 / FPS, 0.8)):
        key = lib.get(f'{n}|null')
        if key: s = np.fromfile(os.path.join(OUT, 'sfx', key), dtype=np.float32); place(mix, np.stack([s, s], 1), when, g)
    peak = np.abs(mix).max(); mix = np.tanh(mix / max(1.0, peak * 0.9) * 1.1) * 0.89   # gentle ceiling, no boost of quiet parts
    mix = mix[:int(total * SR)]
    mix.astype(np.float32).tofile(os.path.join(OUT, 'trailer_audio.f32'))
if __name__ == '__main__':
    os.makedirs(MEDIA, exist_ok=True)
    video(); total = sum(seg_len(e) for e in EDIT); audio(total)
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, 'trailer_video.mp4'), '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', os.path.join(OUT, 'trailer_audio.f32'),
        '-c:v', 'libx264', '-crf', '20', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-c:a', 'aac', '-b:a', '160k', '-shortest', os.path.join(MEDIA, 'trailer-60fps.mp4'))
    # lighter copies for streaming: the 60 fps master stutters in some players and phones
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(MEDIA, 'trailer-60fps.mp4'), '-vf', 'fps=30', '-c:v', 'libx264', '-profile:v', 'high', '-level:v', '4.0', '-preset', 'slow', '-crf', '22', '-maxrate', '3500k', '-bufsize', '7000k', '-g', '60', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', os.path.join(MEDIA, 'trailer.mp4'))
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(MEDIA, 'trailer-60fps.mp4'), '-vf', 'fps=30,scale=1280:720:flags=lanczos', '-c:v', 'libx264', '-profile:v', 'main', '-level:v', '3.1', '-preset', 'slow', '-crf', '23', '-maxrate', '2000k', '-bufsize', '4000k', '-g', '60', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', os.path.join(MEDIA, 'trailer-720p.mp4'))
    # the teaser: seven silent seconds that loop, small enough for a README
    parts = [('pogo', 20, 110), ('warden', 110, 200), ('moth', 60, 130), ('finisher', 120, 220)]
    tmp = os.path.join(OUT, 'segs'); lst = []
    for k, (s, a, b) in enumerate(parts):
        f = os.path.join(tmp, f't{k}.mp4'); run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, s + '.mp4'), '-vf', f'trim=start_frame={a}:end_frame={b},setpts=PTS-STARTPTS', '-an', '-c:v', 'libx264', '-crf', '16', f); lst.append(f)
    with open(os.path.join(tmp, 'tlist.txt'), 'w') as fh: fh.writelines(f"file '{f}'\n" for f in lst)
    run('ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', os.path.join(tmp, 'tlist.txt'), '-c', 'copy', os.path.join(OUT, 'teaser_src.mp4'))
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, 'teaser_src.mp4'), '-vf', 'scale=960:540:flags=neighbor,fps=30', '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '34', '-an', os.path.join(MEDIA, 'teaser.webm'))
    run('ffmpeg', '-y', '-loglevel', 'error', '-i', os.path.join(OUT, 'teaser_src.mp4'), '-vf', 'fps=15,scale=640:360:flags=neighbor,split[a][b];[a]palettegen=max_colors=96:stats_mode=diff[p];[b][p]paletteuse=dither=none', os.path.join(MEDIA, 'teaser.gif'))
    print('trailer, teaser.webm and teaser.gif written to media/')
