#!/usr/bin/env python3
"""Build tools/capture/out/capture.html: the deploy build + test hooks + capture hooks, with the fonts served locally
(the capture machine may not reach Google Fonts) and the gallery panel hidden."""
import os, re, base64, glob
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(os.path.dirname(HERE))
html = open(os.path.join(ROOT, 'dist', 'index.html'), encoding='utf-8').read()
boot = "start(window.claude?.hot?.data ?? {});\n"
assert html.count(boot) == 1
hooks = open(os.path.join(ROOT, 'tests', 'browser', 'hooks.js')).read().split('\n', 1)[1] + open(os.path.join(HERE, 'hooks.js')).read()
html = html.replace(boot, boot + hooks)
faces = {'im-fell-english-sc-latin-400-normal': ('IM Fell English SC', 400, 'normal'), 'silkscreen-latin-400-normal': ('Silkscreen', 400, 'normal'),
         'jetbrains-mono-latin-500-normal': ('JetBrains Mono', 500, 'normal'), 'alegreya-sans-latin-400-normal': ('Alegreya Sans', 400, 'normal'),
         'alegreya-sans-latin-500-normal': ('Alegreya Sans', 500, 'normal'), 'alegreya-sans-latin-700-normal': ('Alegreya Sans', 700, 'normal'),
         'alegreya-sans-latin-400-italic': ('Alegreya Sans', 400, 'italic')}
css = ''.join(f"@font-face{{font-family:'{f}';font-weight:{w};font-style:{s};src:url(data:font/woff2;base64,{base64.b64encode(open(os.path.join(HERE,'fonts',k+'.woff2'),'rb').read()).decode()}) format('woff2')}}" for k, (f, w, s) in faces.items())
open(os.path.join(HERE, 'fonts.css'), 'w').write(css)
html = re.sub(r'<link rel="stylesheet" href="https://fonts.googleapis.com[^>]*>', '', html)
html = html.replace('</head>', '<style>' + css + '#galPanel{display:none!important}body.cap-nohud #hudLayer{display:none!important}body.cap-notoast .toast{display:none!important}body.cap-nobanner .banner{display:none!important}</style></head>', 1)
os.makedirs(os.path.join(HERE, 'out'), exist_ok=True)
open(os.path.join(HERE, 'out', 'capture.html'), 'w', encoding='utf-8').write(html)
print('capture page written')
