---
name: wickfall-feel
description: Use when tuning how Wickfall feels or sounds: sound effects, music cuts and crossfades, screen shake, flashes, finishers, comfort settings, balance and par times, mobile touch controls, gamepad and menu focus, or phone layout and deploy issues.
---

# Wickfall: sound, music, impact, balance and controls

Use together with `wickfall-workflow`, which covers build, test, publish and backups. These are the lessons from tuning the game with its owner. Most began as a complaint such as "awkward", "less impactful" or "uncomfortable", so diagnose the cause before changing numbers.

## Sound effects (synthesised, plus a few recorded clips)

`SFX` in 03-audio-music maps a name to a function. Play one with `sfx('name', arg)`. The building blocks are:

- `tone2(freq, dur, type, vol, slide, delay)`: an oscillator with a pitch slide
- `nsweep(dur, vol, filterType, f0, f1, q, delay)`: filtered noise with a moving cutoff (whooshes, hisses, roars)
- `ring(partials, dur, vol, delay)`: bells and chimes
- `crackle(dur, n, vol, delay)`: fire
- `wet(amount, fn)`: reverb for one sound

Boss voices go through a boss bus (`bossBus`) so they cut through the music.

Recorded clips live in `src/audio/sfx/<name>.mp3` (keep the untouched download as `<name>-source.mp3`). Trim and level them with ffmpeg (peak about −2 dB, mono, 96k). The build embeds them as base64 (`SAMPLE_DATA`), `loadSamples()` decodes them when audio starts, and `sample(name, vol, rate, delay)` plays one, returning false until it is ready so the old synth can stand in. The Black Wick's draw-cut tell (`uGlint`) and his entrance roar (`uIntro`) use `slash`.

Rules:
- **One sound per new thing**, with its own character. The hiss, flutter, sizzle and creak are examples.
- **Gate on visibility:** only play an enemy sound when it is on screen (compare to `G.cam.x + W/2`).
- **Heavy hits get weight:** a low sine thump, a noise burst and `heavyShake(n)`.
- **Bosses must beat the music:** the owner asked twice for stronger roars and screams. Layer a low growl, a mid snarl and a high screech, and add a short music duck (`duckBgm(depth, hold, release)`).
- **Measure, don't guess:** a test hook renders a sound offline and reports peak, RMS and length.

## Music

Tracks live in `BGM.tracks` with a loop offset (seconds), plus `once` (plays once, e.g. outros) and `lazy` (loaded when needed). `bgmWant()` decides the current track every frame: return a name, or `null` for silence. Changes crossfade with `setTargetAtTime`. Never hard-cut: the owner noticed abrupt switches at once. Volume follows `VOL.music`.

Cutting a song into explore, boss and outro loops (scripts in `tools/music/`):
1. Decode with ffmpeg to float32. Find the tempo and bar grid with librosa.
2. Cut on bar lines. Make loops with a ~30 ms crossfade at the loop point (`loopify`).
3. Level by K-weighted-ish RMS: explore about −18, boss about −15.5, outro about −21.
4. Use a **peak-only** limiter. A soft limiter once boosted quiet passages by +3 dB.
5. Encode at 160k.

End the fight music when the finishing move starts. The finisher plays in near-silence with its own swell, blow and cut sounds.

## Impact without discomfort

- **Use the helpers:**
  - `heavyShake(n)` (shake plus a downward jolt)
  - `G.shake = Math.max(G.shake, n)` for light shake
  - `screenFlash(alpha, dur, 'r,g,b')`
  - `G.hitstop` for freeze frames
  - Never fill the screen white directly. The helpers respect the comfort settings: `COMF.shake` scales shake to 0.2, `COMF.flash` scales flashes to 0.35 and softens blackouts. Both start on when the device asks for reduced motion.
- **Finishers:** slight camera zoom (`G.zm` / `G.zf`), letterbox bars, silence, then a strong sound.
- **Assist mode:** one extra ember, plus one ember back in each new room. Assisted runs still get a rank but never overwrite best scores.

## Balance and ranks

- **Measure with bots, then decide.** Write a node-stub scenario in `tests/bal_run.js` (expose makers through the eval prefix). Examples:
  - Seconds spent in fire while attacking a slag crawler from behind; it was 5.3 s and that showed the trail was unfair.
  - How long a wisp takes to reach an idle hero; it never did, which showed it was pointless.
- **Par times:**
  - `RANK_PAR` is in seconds: ch1 300, ch2 420, ch3 600, duel 150, rush 540.
  - A perfect bot takes about 160 s on the Chapter 3 bosses alone, so set par for a first-time human, not the bot.
  - The score is time 40 + falls 25 + hits 20 + embers 15. S is 90 or more.
- **Retry:** a boss retry restores a full wax vessel and shortens the intro.
- **Be honest:** say "bot-tested, needs a human playthrough".

## Mobile and touch (lessons from a full audit)

The most damaging problems were invisible on claude.ai, because its viewer adds a viewport tag and a reset:
- **Head:** the deploy build needs `src/head.html`: doctype, `width=device-width, viewport-fit=cover`, and `body{margin:0}`. Without it, phones render at desktop width.
- **Auto full screen:** a phone (`TOUCH` and the short side ≤ 560 px) always plays full screen; held upright, the game turns sideways (`rot`). The full-screen button only toggles the browser's own full screen, never back to the page. On Android the first tap requests real full screen. On iPhone only Add to Home Screen (`src/pwa`) removes the browser bars.
- **Safe areas:** clamp controls inside the safe-area insets. A hidden `.safeprobe` element exposes `env()` values.

Controls:
- **Stick:** the whole left half (below the top 16%) is a floating stick that appears where the thumb lands. A small fixed zone felt unresponsive.
- **Opacity:** about 45% at rest, 100% while pressed, plus a strong glow on press. iPhones cannot vibrate from a web page.
- **Default layout** (`DEF_LAYOUT`, bump `LAYOUT_V` to replace saved layouts):
  - Jump and Slash are large and side by side at the bottom right.
  - Dash sits above Jump.
  - Focus and Skill are smaller and tucked in.
  - Keep every button left of about 70% of the screen width off the far side.
- **Camera:** on touch, the hero sits just right of centre (`camBias()`) to stay clear of the stick.
- **Aiming:**
  - In the air, a shallow downward push counts as down. This makes down-slash bounces reliable while drifting.
  - Slash can also be aimed by swiping on its button (60 ms window). That window delays plain taps, so mention the trade-off if anyone reports lag.
  - The stick is re-read each frame (`padTick`) so it reacts as you leave the ground.
- **Test** `tests/browser/mobile.cjs` (three phone sizes, nothing off screen, the stick catches high on the left) and `aim.cjs`.

## Menus, keyboard and gamepad

- **Navigation mode:** set `body.navmode` on any key or gamepad input and clear it on pointerdown. In navmode the focused button gets a bright pulsing ring. Default-action (primary) buttons turn plain unless focused, and on the chapter screen the focused card glows while the others dim. A primary button that always looks selected confuses players, as it did with "Tutorial first".
- **Gamepad:** every menu must support move, confirm (A/X) and back (B). Check new pages against `pollPad`'s `inMenu` logic.
- **Test** `tests/browser/focus.cjs`.

## Visual checks

After any change to feel or layout, take screenshots, including at phone sizes, tile them into one image and look at it. When reporting to the owner, send the image together with a one-line summary of what to try by hand.
