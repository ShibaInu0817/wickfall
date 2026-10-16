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

A small candle goes down into the dark, where every flame is going out.
Wickfall is a short, candle-lit platformer: keepers to put to rest, three heroes, hidden alcoves, a boss rush and something waiting below.
It runs in the browser on desktop and phone, with no download, no account and no server. Progress stays on your device.

<table>
  <tr>
    <td><img src="media/screenshots/01-caption.png" alt="A small flame goes down."></td>
    <td><img src="media/screenshots/02-caption.png" alt="Every keeper, a puzzle."></td>
    <td><img src="media/screenshots/03-caption.png" alt="Strike down. Bounce. Keep moving."></td>
  </tr>
  <tr>
    <td><img src="media/screenshots/04-caption.png" alt="Read the tell. Break the slash."></td>
    <td><img src="media/screenshots/05-caption.png" alt="End it with a finishing move."></td>
    <td><img src="media/screenshots/06-caption.png" alt="Three heroes, three ways to fight."></td>
  </tr>
  <tr>
    <td><img src="media/screenshots/07-caption.png" alt="Secrets in the stone."></td>
    <td><img src="media/screenshots/08-caption.png" alt="Something answers from below."></td>
    <td><img src="media/screenshots/09-caption.png" alt="Dive. Stun. Strike."></td>
  </tr>
</table>

## Controls

| | Keyboard | Gamepad | Phone |
|---|---|---|---|
| Move | ← → or A D | left stick or d-pad | left half of the screen |
| Jump | Space or Z (hold to jump higher) | A / Cross | Jump |
| Slash | X or J (hold ↑ or ↓ to aim) | X / Square | Slash (swipe on it to aim) |
| Dash | Shift, C or K | any shoulder button | Dash |
| Focus | hold F | hold B / Circle | Focus |
| Skill | E or L, once learned | Y / Triangle | Skill |
| Pause | P or Esc (M toggles sound) | Start | Pause |

Phones always play full screen, sideways. On iPhone, Add to Home Screen removes the browser bars.

## Put it on GitHub Pages

1. Push this folder to a GitHub repository (the `main` branch).
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. The address, `https://shibainu0817.github.io/wickfall/`, lives in `site.json` (link-preview tags) and in this README's Play links. The trailer shows no address.

Every push to `main` rebuilds the game (`tools/build.py`) and publishes `dist/` through `.github/workflows/pages.yml`.

**Credits.** The music in `src/audio/` was made by the owner with Google Gemini.
The Black Wick's slash sounds (`src/audio/sfx/slash-r1.mp3`, `slash-r1plus.mp3`) are synthesised.

## Media

| File | Use |
|---|---|
| `media/trailer.mp4` | the trailer, 1080p at 30 fps with sound (about 75 seconds), light enough to stream |
| `media/trailer-720p.mp4` | a smaller copy for phones and slow connections |
| `media/trailer-60fps.mp4` | the 60 fps master, for uploading to YouTube or Steam |
| `media/teaser.gif`, `media/teaser.webm` | a short silent loop for the README and social posts |
| `media/screenshots/NN.png` | clean 1920×1080 screenshots |
| `media/screenshots/NN-caption.png` | the same with a caption, store-page style |
| `media/social-card.png` | the 1200×630 link-preview image |

All of it is recorded from the real game by the scripts in `tools/capture/` (see the end of this file).

---

# For developers

## Folders

```
wickfall/
├── src/                     what you edit
│   ├── head.html            the document head for deploys: phone viewport, home-screen tags, a small reset
│   ├── page.html            the game page: title, fonts, HUD and overlay markup (@@STYLE@@ and @@SCRIPT@@ are filled in by the build)
│   ├── style.css            every style rule
│   ├── js/                  the game script, split into ordered parts (see below)
│   ├── audio/               the seven music tracks; sfx/ holds recorded sound effects (embedded into the page by the build)
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
python3 tools/build.py          # writes dist/; re-run after every change in src/
python3 -m http.server 8000 --directory dist   # play locally at http://localhost:8000
tools/test.sh                   # stub tests, about a minute
tools/test.sh --all             # plus the browser tests (needs Playwright and Chromium)
```

Deploy by uploading the **contents of `dist/`** to any static host (Netlify, GitHub Pages, Cloudflare Pages, S3 and so on).
Keep the files together: the game fetches its music from the same folder.
Serve it over http(s). Opened straight from disk (`file://`), the game still plays, but browsers block the music.

`dist/` contains:

| File | What it is |
|---|---|
| `index.html` | the game |
| `boss-lab.html`, `skill-lab.html` | developer labs for tuning the bosses |
| `lab.html` | the copy of the game that the labs load |
| `*.mp3` | music |
| `media/` | the trailer, teaser, screenshots and link-preview image |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | lets players add the game to their home screen, where it opens full screen and sideways |

The labs are for development. Leave them out of a public deploy if you prefer.

To publish on claude.ai instead, publish `build/artifact.html`; claude.ai wraps the page in its own head.

## On phones

- The game always fills the screen, and turns sideways when the phone is held upright. On Android the first tap also hides the browser bars. iPhones can't hide them from a web page, but "Add to Home Screen" opens the game with no browser bars at all.
- The whole left half of the screen is the stick: it appears wherever the thumb lands.
- Slash aims with the stick, or by swiping up or down on the Slash button. In the air, a shallow downward push is enough for a down-slash.
- Controls are see-through until pressed and keep clear of the notch. Players can move, resize and fade every control from the sliders button.

## Where things live in `src/js/`

The parts are joined in file-name order into one script, so they all share one scope.
That means a part can use a function from a later part, as long as it is only called after the game boots.
Keep the number prefixes, and pick a number in between when you add a part.

| Part | Contents |
|---|---|
| `00-core.js` | strict mode, canvas, the sharp text layer |
| `01-world-rooms.js` | helpers and every room layout (chapters 1 to 3 and the Gallery) |
| `02-rank-heroes-state.js` | rank scoring and par times, hero stats, game state, collisions |
| `03-audio-music.js` | sound engine, every sound effect, music, volume and comfort settings |
| `04-menus.js` | camp, pause, results and how-to screens |
| `05-secrets-badges-share.js` | hidden alcoves and lore, badges, the score card |
| `06-input-touch-layout.js` | keyboard, touch controls and the button-layout editor |
| `07-enemies.js` | enemy behaviour, plus drawing for the six newer enemies |
| `08-bosses-ch1-ch2.js` | the Tallow Warden and the Hanging Chandler |
| `09-bosses-ch3.js` | the Tallow Wyrm, the pupa, the Cinder Moth and the abyss ending |
| `10-story.js` | opening story, chapter lines, last words |
| `11-draw-ch3.js` | drawing for the kiln and the chapter 3 bosses |
| `12-black-wick.js` | the hidden boss |
| `13-finishers.js` | finishing moves |
| `14-player-skills-hits.js` | player movement and combat, skills, hit effects |
| `15-flow-gallery-step.js` | loading rooms, the Gallery, the fixed-step update |
| `16-draw-world-actors.js` | tiles, backgrounds and the player |
| `17`–`19` | the three heroes' bodies and animations |
| `20-draw-enemies-hud-camp.js` | drawing for the original enemies, the Tallow Warden, hazards, hit effects, signs, gates, light, the HUD and camp |
| `21-loop-render.js` | the frame loop and render order |
| `22-character-sheet.js`, `23-bestiary-practice.js` | Characters (Beta) and practice fights |
| `24-rush-previews.js` | Boss Rush, the Black Wick duel and the chapter previews |
| `25-boot-lab.js` | start-up and lab mode |

### Numbers worth tuning

- **Chapter 3 bosses and the Black Wick:** `TUNE` in `09-bosses-ch3.js` (the boss labs edit these live).
- **Par times:** `RANK_PAR` in `02-rank-heroes-state.js`.
- **Hero stats:** `CHARS` in `02-rank-heroes-state.js`.

### Room format

Rooms are built in `01-world-rooms.js` with:

- `r.rect(x, y, w, h, tile)`, where the tile is one of:
  - `#` rock
  - `^` spines
  - `=` platform
  - `%` cracked rock (breaks to a skill)
  - `~` a hidden alcove: open space drawn as rock, which fades away while you stand inside
- `r.ent(letter, x, y, data)` to place things. The newest ones are:
  - `y` a lore stone (its text is in `LORE`)
  - `x` a spare ember (its key is listed in `SPARE`)

## Saved in the browser

The game saves these localStorage keys. Clearing site data resets them.

| Key | What it holds |
|---|---|
| `wf-vol` | volume |
| `wf-comfort` | reduce shake, reduce flashes, assist |
| `wf-ach` | badges, plus which lore stones and embers have been found |
| `wf-best-ch1` / `2` / `3` / `rush` / `duel` | best score for each mode |
| `wf-char` | last hero |
| `wf-tut` | tutorial done |
| `wf-layout` | touch button layout |
| `wf-info` | field-notes panel open or closed |

## Recorded sound effects

Every effect is synthesised in code except a few recorded clips in `src/audio/sfx/`. The build embeds each `<name>.mp3` (not `*-source.mp3`) into the script as base64, so they work even from disk; play one with `sample('name', volume, rate)`, which returns false until the clip has decoded so the caller can fall back to a synthesised sound.

## Music

`tools/music/` holds the scripts that cut the tracks into loops. They use librosa, numpy and ffmpeg, and cut on bar lines with short crossfades. They expect the original source recordings, which are not part of this folder.

## Remaking the trailer and screenshots

`tools/capture/` drives the real game in headless Chromium with a fake clock, so every take is identical.
It needs Node with Playwright, ffmpeg, Python 3 with numpy, and the fonts in `tools/capture/fonts` (OFL, from @fontsource).

```
python3 tools/build.py
cd tools/capture
python3 make_page.py          # out/capture.html: the game plus capture hooks and local fonts
node record_all.cjs           # every scene to out/<scene>.mp4, with a log of its sounds, plus stills
node compose.cjs              # title cards, captioned screenshots, the social card
node render_sfx.cjs           # renders each logged sound with the game's own synth
python3 assemble.py           # media/trailer.mp4, teaser.webm, teaser.gif
```

Scenes are scripted in `scenes.cjs` (a setup plus a per-frame controller). `node preview.cjs <scene> 40,120` saves single frames, and `node sheet.cjs <scene> 300 15` saves a contact sheet of every 15th frame, for checking a scene's timing.
The capture pauses the browser's clock so only the script moves time; every frame is exactly 1/60 s of game time however slow the machine is.
