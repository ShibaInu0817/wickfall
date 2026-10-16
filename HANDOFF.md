# Wickfall: handoff

Where the project stands at the end of the 16 Oct 2026 session, so the next session can pick it up cold.
Read `.claude/skills/wickfall-workflow/SKILL.md` first. It covers the layout, build, tests, publishing and the owner's rules.
For new heroes, enemies, bosses or rooms, read `wickfall-content`; for sound, feel, balance and controls, read `wickfall-feel`.

## The owner's standing rules

- **"Discuss" means discuss:** change and publish nothing until asked.
- **Backups:** copy the folder before any non-trivial change (`cp -r wickfall wickfall.bak-<what>`).
- **Keep it light:** no login, no database, no server; saves stay in localStorage under `wf-` keys.
- **Story:** short, hollow lines.
- **Boss fights:**
  - no text hints;
  - every attack has its own visible and audible tell;
  - the player is never stuck without wax.
- **Colour-blind safe:** never signal by colour alone; shapes must differ too.

## State of the game

- **The game:** three chapters, four keepers, three heroes, a boss rush, and a hidden duel with the Black Wick.
  - The duel opens from a crack that appears after a no-fall clear of Chapter 3.
- **The title:** Wickfall. The world inside the story is still called Underwick.
- **The Black Wick's entrance** (added this session) is in `src/js/12-black-wick.js` (`startUmbraEntrance`, `G.uent`):
  - about 7 seconds of darkness, black-fire pillars, eyes, red flashes and a heartbeat;
  - then the flare, the hand to the hilt, and the name banner;
  - no music and no input while it plays; a retry skips it;
  - test: `tests/browser/entrance.cjs`.
- **Recorded sound effects** (added this session) live in `src/audio/sfx/`:
  - The build embeds `<name>.mp3` as base64; `sample(name, vol, rate)` plays one.
  - Two synthesised slashes replace the old "tsing": `slash-r1plus.mp3` (crisp attack, clean end) on the draw-cut tell (`uGlint`), `slash-r1.mp3` (fuller ring) on the entrance roar (`uIntro`).
  - They were synthesised from noise and sine waves; no generator or reference is kept, so the two mp3s are the masters.
- **Tests:** all pass (`tools/test.sh --all`).
- **Published on claude.ai** (updated after the last game change):
  - Wickfall
  - Chapter 3 Boss Lab
  - Black Wick Skill Lab

## Marketing media and GitHub Pages

- **`media/`:**
  - `trailer.mp4`: 1080p, 30 fps, about 74 s; the version the site serves.
  - `trailer-720p.mp4`: smaller copy for phones and slow connections.
  - `trailer-60fps.mp4`: master, for YouTube or Steam.
  - `teaser.gif` and `teaser.webm`: short silent loop for the README.
  - `screenshots/NN.png` and `NN-caption.png`, nine of each.
  - `social-card.png`: the link-preview image.
- **Trailer order:**
  1. story
  2. title (pixel flame)
  3. run, pogo, alcove lore
  4. "The keepers" card
  5. Warden, Chandler, Wyrm, Moth
  6. finisher
  7. crack
  8. "Something answers from below."
  9. the in-game Black Wick entrance, cut on his draw
  10. hard screen slash, then black
  11. 10 s live camp end card with the title and slogan (no URL; removed 16 Oct 2026)
- **Slogan:** "Every flame goes out. Not yours." Marketing never states how many bosses there are; the owner wants room to add more.
- **Rebuilding media:** the scripts are in `tools/capture/`, run in order: `make_page.py`, `record_all.cjs`, `compose.cjs`, `render_sfx.cjs`, `assemble.py` (each file's first lines say what it does).
  - Scenes are scripted in `scenes.cjs`.
  - The browser clock is paused (`lib.cjs`), so every frame is exactly 1/60 s.
  - Use `sheet.cjs` to check a scene's timing before recording.
  - `WICK_CUT` in `compose.cjs` must equal the wickRise out-point in `assemble.py`.
- **GitHub Pages:**
  - `.github/workflows/pages.yml` builds and deploys `dist/` on every push to `main`.
  - Repo: `ShibaInu0817/wickfall` (remote via the `github-shibainu` SSH alias). Address: `https://shibainu0817.github.io/wickfall/`, in `site.json` and the README.
  - The capture scripts take a local Chromium through `CHROMIUM=<path>`; Playwright comes from `NODE_PATH`.

## Open items

1. **After the first push:** in GitHub, set Settings → Pages → Source to GitHub Actions.
2. **Rights (confirmed):** the music was made by the owner with Google Gemini; the slash sounds are synthesised (see above).
3. **Possible next steps the owner has mentioned:** a homepage for the game; a chapter 4 (deferred).
4. **The entrance's opening seconds are deliberately quiet** (drone and heartbeat). Turn them up if the owner finds them empty.
5. **Human playtesting:** balance and par times so far were tested by bots only.

## Backups in the session scratchpad

`wickfall.bak-entrance` is the state just before the Black Wick entrance and the recorded slash sound were added.
