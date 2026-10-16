<p align="center">
  <a href="https://shibainu0817.github.io/wickfall/"><img src="media/teaser.gif" alt="Wickfall gameplay" width="640"></a>
</p>

<h1 align="center">Wickfall</h1>
<p align="center"><i>Every flame goes out. Not yours.</i></p>

<p align="center">
  <a href="https://shibainu0817.github.io/wickfall/"><img src="https://img.shields.io/badge/%E2%96%B6%20Play%20free-in%20your%20browser-e8a24a?style=for-the-badge" alt="Play free in your browser"></a>
  &nbsp;
  <a href="media/trailer.mp4"><img src="https://img.shields.io/badge/Watch-the%20trailer-2b2f3a?style=for-the-badge" alt="Watch the trailer"></a>
</p>

## Folders

```
wickfall/
├── src/                     what you edit
│   ├── head.html            the document head for deploys: phone viewport, home-screen tags, a small reset
│   ├── page.html            the game page: title, fonts, HUD and overlay markup (@@STYLE@@ and @@SCRIPT@@ are filled in by the build)
│   ├── style.css            every style rule
│   ├── js/                  the game script, split into numbered parts joined in order (one shared scope)
│   ├── audio/               the music tracks; sfx/ holds the slash sounds (embedded into the page by the build)
│   ├── labs/                Boss Lab and Black Wick Skill Lab pages (they embed the game as lab.html)
│   ├── pwa/                 home-screen manifest and icons
│   └── lab-head.html        the three lines that turn the game into lab.html
├── dist/                    what you deploy (generated; do not edit)
├── build/                   artifact.html: the game page without head.html, for claude.ai (generated)
├── .claude/skills/          project skills for Claude: workflow, adding content (heroes, enemies, bosses, stages), feel and polish
├── media/                   trailer, teaser, screenshots and the link-preview image
├── site.json                the public address, title and slogan (fills the link-preview tags)
├── .github/workflows/       GitHub Pages deploy
├── tests/                   regression tests (fast stub tests, plus browser tests in tests/browser)
└── tools/
    ├── build.py             src/ → dist/
    ├── test.sh              build and run the tests
    ├── capture/             scripted recording of the trailer and screenshots
    └── music/               the scripts that cut and level the music from the source tracks
```

## Build, test, deploy

```
python3 tools/build.py                          # writes dist/; re-run after every change in src/
python3 -m http.server 8000 --directory dist    # play locally at http://localhost:8000
tools/test.sh                                   # stub tests, about a minute
tools/test.sh --all                             # plus the browser tests (needs Playwright and Chromium)
```

Every push to `main` builds the game and deploys `dist/` to GitHub Pages (`.github/workflows/pages.yml`).
To host it elsewhere, upload the contents of `dist/` together to any static host and serve it over http(s); opened from disk, the music is blocked.
