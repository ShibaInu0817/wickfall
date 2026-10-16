---
name: wickfall-workflow
description: Use whenever working on the Wickfall canvas platformer (formerly Underwick): editing src/js parts, building, testing, publishing the game or boss labs, deploying, or answering questions about the project.
---

# Wickfall: how to work on the project

Wickfall is a single-page canvas platformer: a 480×272 pixel game scaled to the screen, three chapters, four bosses, a hidden duel (the Black Wick) and a boss rush. It has no server, no login and no database by design. Everything that persists lives in localStorage. The world inside the story is still called Underwick; only the game title changed.

For adding heroes, enemies, bosses or stages, also use the `wickfall-content` skill. For sound, music, screen shake, balance and mobile controls, use `wickfall-feel`.

## The owner's standing rules (follow these before anything else)

- **"Discuss" means discuss.** If the user asks a question, or says "don't do anything but discuss/brainstorm", answer only. Change nothing and publish nothing. Present findings, then ask which to do.
- **Be ready to undo.** Copy the project folder before every non-trivial change (`cp -r wickfall wickfall.bak-<what>`). Mention that the backup exists.
- **Light game.** Don't add accounts, databases or servers. Saving stays in the browser.
- **Short, hollow story.** Lines are brief, quiet and melancholy. Never add long dialogue.
- **Boss fights carry no text hints.** Every attack must have its own visible and audible tell. The player must never be stuck without wax, and Chapter 3 needs wax for Wax Dive.
- **Don't lean on colour alone.** Signals must also differ in shape (see the moth's parry lights: a lit light is a bigger diamond with a white heart, a failed one is cracked in two).
- **Plain replies.** Say what changed and what to try. Note honestly what was only tested by bots or headless browsers.

## Project layout

```
wickfall/
  .claude/skills/      these project skills
  src/head.html        doctype, phone viewport, home-screen tags, small reset (deploy only)
  src/page.html        game page; @@STYLE@@ and @@SCRIPT@@ get filled in
  src/style.css
  src/js/NN-*.js       ONE script (an IIFE) split into ordered parts, joined by filename
  src/audio/*.mp3      music
  src/labs/            boss-lab.html, skill-lab.html (iframe lab.html)
  src/lab-head.html    3 lines that turn the game into lab.html (sets window.UW_LAB)
  src/pwa/             manifest + icons
  tools/build.py       src -> dist/ and build/artifact.html
  tools/test.sh        build with hooks + run every regression (--all adds browser tests)
  tests/*.js           node stub tests (fake canvas/DOM) reading tests/g.js
  tests/browser/*.cjs  Playwright tests reading tests/browser/test.html; hooks.js = test-only globals
```

The parts share one scope, so a part may call a function from a later part, as long as the call only runs after boot. **Top-level `const`/`let` are in the temporal dead zone until their line runs.** Anything that can run early, such as layout() from a resize event, must not touch a later `const` unguarded. Wrap it in try/catch (see `autoFullCheck` reading `LAB`). Keep the two-digit prefixes when adding parts.

Where to look (grep the name rather than trusting line numbers):

| Topic | Part |
|---|---|
| rooms, tiles, chapters | 01-world-rooms |
| ranks (`RANK_PAR`, `rateRun`), `CHARS`, `ROSTER`, state | 02 |
| sound engine, `SFX`, music `BGM`/`bgmWant`, `VOL`, `COMF` | 03 |
| camp, pause, results, how-to (`setOverlay0`) | 04 |
| secrets/lore, badges (`BADGES`, `earn`), score card | 05 |
| keyboard, gamepad (`pollPad`), touch stick/buttons, layout editor, full screen | 06 |
| enemy update/draw for the newer foes (`updateFoe`, `drawFoe`), `hitEnemy` | 07 |
| Warden + Chandler logic | 08 |
| wyrm/pupa/moth logic, `TUNE`, abyss ending | 09 |
| story (`STORY_*`) | 10 |
| ch3 drawing, cine (`startBossCine`), `updateBoss` dispatch | 11 |
| Black Wick | 12 |
| finishers (`FIN`, `FIN_KILL`, `bossDie`) | 13 |
| player physics/combat/skills | 14 |
| `loadRoom`, gallery (`GAL_BOSS`), `HERO_STATS`, `step`, camera | 15 |
| themes, tiles, `drawPlayer` | 16 |
| heroes: 17 Wick (`snuff`), 18 Wick Hero (`hero`), 19 Lampknight (`knight`) | 17-19 |
| old-enemy/Warden drawing, hazards, HUD, camp | 20 |
| frame loop + render order | 21 |
| Characters (Beta) heroes / bestiary + practice | 22 / 23 |
| boss rush, duel, chapter previews | 24 |
| boot, lab mode | 25 |

## Build, test, publish

```bash
cd wickfall
python3 tools/build.py              # dist/ + build/artifact.html
tools/test.sh                       # stub tests (~1 min)
tools/test.sh --all                 # + browser tests (Playwright, Chromium at /opt/pw-browsers)
```

- **Byte-identical check for refactors:** `python3 tools/build.py --check <old page>` proves a reorganisation changed nothing.
- **Two outputs:**
  - `dist/index.html` is a full document, used for deploys.
  - `build/artifact.html` is the page without a head. claude.ai adds its own head (viewport, margin reset). Publish this one to claude.ai.
- **Publishing on claude.ai** touches three artifacts. Publish all three after a game change:
  - The game: publish `build/artifact.html` to its existing URL. It declares the `downloads` capability for the score card; omitting `capabilities` keeps it.
  - Boss Lab: page `dist/boss-lab.html` with `files {"lab.html": dist/lab.html}`.
  - Black Wick Skill Lab: page `dist/skill-lab.html` with the same lab.html.
  - If a publish is refused because a file changed since you last saw it, `read` that path, confirm it is just the previous build, then republish.
- **Deploying:** upload the contents of `dist/` to any static host. Serve over http(s), because `file://` blocks the music fetches. Keep the files together.
- **Packaging:** zip the folder (including `.claude/`) without `build/` and the test outputs, then send it with SendUserFile.

## Testing lessons (each one cost time once)

- **Playwright launch:** use `chromium.launch({ executablePath:'/opt/pw-browsers/chromium', args:['--headless=new'], ignoreDefaultArgs:['--headless=old'] })`. Old headless is gone.
- **Test hooks:** the game is an IIFE, so `page.evaluate` cannot see `G` or `goMenu`. Add globals in `tests/browser/hooks.js` (it is injected after boot and never shipped), e.g. `__T.G`, `__T.P`, `__run(mode)`, `__room(id)`, `__go(menu)`, `__win()`.
- **The node stub's `querySelector` always returns an element.** Never gate input handling on `overlay.querySelector(...)` alone: it once swallowed every keypress in the stub tests. Combine it with a state check, e.g. `G.state === 'won' && ...`.
- **The stub's `getTransform` returns undefined.** Code reading transforms needs a fallback.
- **Phones:** emulate with `newContext({ viewport, isMobile:true, hasTouch:true, deviceScaleFactor:2 })`. Drive multi-touch with a CDP session: `Input.dispatchTouchEvent`.
- **Real airborne states:** press Space; don't hand-edit `P.y`. Fake states lie.
- **Fire up bots to measure, not to judge feel.** Report numbers, and say a human should play.
- **Look at the result.** Screenshot every visual change (tile several into one image with PIL) and inspect it before claiming success.
- **Saved data keys** use the `wf-` prefix. A key collision once broke a badge: `ACH.lore` was both a map and a badge id. Keep badge ids and helper maps apart.

## Trailer, screenshots and GitHub Pages

- `tools/capture/` records the real game frame by frame (run in order: `make_page.py`, `record_all.cjs`, `compose.cjs`, `render_sfx.cjs`, `assemble.py`; local Chromium via `CHROMIUM=<path>`). Scenes are scripted in `scenes.cjs`: a setup using `__stage({...})` plus a per-frame controller that calls the game's own `press()`/`release()`.
- **Pause the clock.** `clock.install()` alone lets real time leak in, and the first takes came out about 2.7× fast-forward. `lib.cjs` installs at a fixed date and calls `pauseAt`, so only `runFor` moves the game.
- **Check timing with a contact sheet** (`node sheet.cjs <scene> 300 15`) before recording; pick trim points and still frames from it.
- Google Fonts are blocked in the sandbox; the capture embeds local OFL fonts from `tools/capture/fonts`.
- Sounds in the trailer are the game's own: each scene logs its `sfx` calls, `render_sfx.cjs` renders them offline, `assemble.py` mixes them with the music.
- `site.json` holds the public URL, title and slogan; `build.py` fills them into `src/head.html` (link-preview tags). `.github/workflows/pages.yml` builds and deploys `dist/` on push to `main`.

## Wrap-up checklist

1. All tests pass, plus a screenshot of anything visual.
2. Rebuild, then publish all three artifacts.
3. Update the README if a file, key or workflow changed.
4. Re-zip if the user is deploying.
5. Write a short reply: what changed, what to try by hand, any trade-off.
