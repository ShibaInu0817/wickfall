#!/usr/bin/env python3
"""Build Wickfall from src/ into dist/.

  python3 tools/build.py            build dist/ (game, labs, audio, home-screen files) and build/artifact.html
  python3 tools/build.py --tests    also write tests/g.js and tests/browser/test.html
  python3 tools/build.py --check F  fail unless the game page (build/artifact.html) is byte-identical to file F

dist/index.html is a complete document (src/head.html: doctype, phone viewport, home-screen tags) around the
game page. build/artifact.html is the same page without that head, for hosts that add their own (claude.ai).

The game is one script (an IIFE) split into ordered parts in src/js/. The parts are plain
text joined in file-name order, so they share one scope: a part may use anything defined in
another part, as long as it is only *run* after boot. Keep the numeric prefixes when adding parts.
"""
import base64, glob, json, os, shutil, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, DIST, TESTS, BUILD = (os.path.join(ROOT, d) for d in ('src', 'dist', 'tests', 'build'))

def read(p):
    with open(p, encoding='utf-8', newline='') as f: return f.read()
def write(p, s):
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, 'w', encoding='utf-8', newline='') as f: f.write(s)

def game():
    page, css = read(os.path.join(SRC, 'page.html')), read(os.path.join(SRC, 'style.css'))
    js = ''.join(read(p) for p in sorted(glob.glob(os.path.join(SRC, 'js', '*.js'))))
    # recorded sound effects (src/audio/sfx/<name>.mp3, except *-source.mp3) are embedded in the script as base64,
    # so they play everywhere the game runs, even opened from disk
    sm = {os.path.basename(p)[:-4]: base64.b64encode(open(p, 'rb').read()).decode() for p in sorted(glob.glob(os.path.join(SRC, 'audio', 'sfx', '*.mp3'))) if not p.endswith('-source.mp3')}
    assert js.count('/*@@SAMPLES@@*/{}') == 1, 'the script needs one /*@@SAMPLES@@*/{} marker'
    js = js.replace('/*@@SAMPLES@@*/{}', json.dumps(sm, separators=(',', ':')))
    assert page.count('@@STYLE@@') == 1 and page.count('@@SCRIPT@@') == 1, 'page.html needs one @@STYLE@@ and one @@SCRIPT@@'
    ver = json.loads(read(os.path.join(ROOT, 'site.json')))['version']   # shown on the title and pause screens
    return page.replace('@@STYLE@@', css).replace('@@SCRIPT@@', js).replace('@@VERSION@@', ver)

def main(argv):
    html = game()
    site = json.loads(read(os.path.join(ROOT, 'site.json')))          # the site address, title and slogan for link previews
    head = read(os.path.join(SRC, 'head.html'))
    for k, v in site.items(): head = head.replace('{{' + k + '}}', v.replace('"', '&quot;'))
    doc = head + html.rstrip('\n') + '\n</body></html>\n'
    if os.path.isdir(DIST): shutil.rmtree(DIST)
    write(os.path.join(DIST, 'index.html'), doc)
    write(os.path.join(BUILD, 'artifact.html'), html)
    # the labs embed the same game, flagged with window.UW_LAB, as lab.html
    write(os.path.join(DIST, 'lab.html'), read(os.path.join(SRC, 'lab-head.html')).rstrip('\n') + '\n' + html.rstrip('\n') + '\n\n</html>\n')
    for p in glob.glob(os.path.join(SRC, 'labs', '*.html')) + glob.glob(os.path.join(SRC, 'audio', '*.mp3')) + glob.glob(os.path.join(SRC, 'pwa', '*')):
        shutil.copy2(p, DIST)
    # marketing media that the site itself serves: the link-preview card, the trailer and the teaser
    for f in ('social-card.png', 'trailer.mp4', 'teaser.webm', 'teaser.gif'):
        p = os.path.join(ROOT, 'media', f)
        if os.path.exists(p): os.makedirs(os.path.join(DIST, 'media'), exist_ok=True); shutil.copy2(p, os.path.join(DIST, 'media', f))
    print(f'dist/index.html  {len(doc.encode()):,} bytes')
    if '--tests' in argv:
        script = html[html.index('<script>\n(() => {') + len('<script>\n'):html.rindex('</script>')]
        write(os.path.join(TESTS, 'g.js'), script.lstrip('\n'))
        boot = "start(window.claude?.hot?.data ?? {});\n"
        assert html.count(boot) == 1, 'boot line not found'
        hooks = read(os.path.join(TESTS, 'browser', 'hooks.js')).split('\n', 1)[1]
        write(os.path.join(TESTS, 'browser', 'test.html'), doc.replace(boot, boot + hooks))
        for p in glob.glob(os.path.join(SRC, 'audio', '*.mp3')): shutil.copy2(p, os.path.join(TESTS, 'browser'))
        print('tests/g.js and tests/browser/test.html written')
    if '--check' in argv:
        ref = read(argv[argv.index('--check') + 1])
        if ref != html: sys.exit('build differs from ' + argv[argv.index('--check') + 1])
        print('identical to', argv[argv.index('--check') + 1])

if __name__ == '__main__':
    main(sys.argv[1:])
