---
name: wickfall-content
description: Use when adding or changing content in the Wickfall platformer: a new hero/character, enemy, boss, room, stage or chapter, a secret alcove, lore line, badge, or a Characters (Beta) entry. Use even when the user just says "design a new boss" or "add a level".
---

# Wickfall: adding heroes, enemies, bosses and stages

Read `wickfall-workflow` first for the project layout, backups, build, test and publish. Every recipe below ends the same way: build, run `tools/test.sh --all`, screenshot it, register it on Characters (Beta), then publish.

Design first, in words, when the user asks for something new. Then show a design sheet before wiring it into the game. The user liked seeing a live-drawn design card (the Black Wick sheet) before implementation. Units: one tile `T` = 16 px; a room is 17 rows tall, the floor top is row 13 (y = 208), the ceiling is row 0; one screen shows 30 tiles.

## A new stage (room) or chapter

Rooms live in `ROOM_DEFS` (01-world-rooms). A chapter is a run of consecutive rooms with the same `ch`. Walking off the right edge loads `ROOM_DEFS[ri+1]` (entry `a`), and walking off the left goes back (entry `b`), but only within the same chapter. So a chapter's rooms must be contiguous, with its boss room last.

```js
{ id:'vault', ch:2, theme:4, name:'The Wax Vault', note:'one short, quiet line', w:70, build(r) {
    r.rect(0,0,70,1,'#'); r.rect(0,13,70,4,'#');            // ceiling, floor (4 rows thick)
    r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' ');             // left wall with an opening rows 9-12
    r.rect(69,0,1,13,'#'); r.rect(69,9,1,4,' ');           // right wall with an opening
    r.ent('a',2,12); r.ent('b',67,12);                      // entries from left / right
    ...
}}
```

- **Tiles:**
  - `#` rock
  - `^` spines
  - `=` thin platform
  - `%` cracked rock (a skill breaks it; `G.broken` remembers)
  - `~` hidden-alcove space: open, but drawn as rock until you step in
  - `' '` empty
- **Entities:** `r.ent(letter, x, y, data)`.
  - Spawns and doors: `a`/`b` entries, `S` shrine (save point), `P` camp/gallery spawn.
  - Pickups: `o` coin (3 coins buy a skill), `M` smith (data = skill id), `R` relic, `y` lore stone (text in `LORE`), `x` spare ember (key listed in `SPARE`).
  - Locks: `z` brazier and `G` gate share a data id; lighting the brazier opens the gate.
  - Tutorial only: `T` sign; `D`/`H`/`L`/`W` dummies.
  - Enemies: `C` crawler, `A` armoured crawler, `F` cave moth, `s` spitter, `c` cocoon, `d` drip mite, `w` wisp, `e` eel, `h` hook puppet, `g` slag crawler, `m` ash moth swarm.
  - Bosses: `K` Warden, `Q` Chandler, `Y` Wyrm.
- **Pick a `theme`** index from `THEMES` (16-draw-world-actors), or add one (sky, rock, top grass, glow, fog, ambient type).
- **A new chapter** needs:
  - `CHAPTERS[n]` with `name`, `first` room index, `stages` text and starting `skills`.
  - `STORY_CH[n]`, a one-line subtitle.
  - `RANK_PAR[n]`.
  - Music routing in `bgmWant`.
  - The won-screen lines in `setOverlay0`'s `kind === 'won'` branch (title and line per chapter).
  - A chapter card. The chapter page and `chapterPreviews` assume 3 chapters: widen `.chap-cards` (`grid-template-columns`) and the `[1,2,3]` loops.
  - Badges `chN`.
  - Practice entries if it has a boss.
- **Pacing:** two rooms plus a boss room per chapter so far. New enemies get introduced in the first two rooms.

### A hidden alcove

Carve open space inside a solid block with `~` and put the reward inside. Keep the top row solid so players standing on it don't fall in. Walking into the block reveals it with a soft chime. Example: `r.rect(30,10,3,3,'~'); r.ent('y',31,12,'1');`. Add the text to `LORE['room:1']` or the key to `SPARE`. The badges `lore`/`embers` count every key automatically.

## A new enemy

Newer foes all live in 07-enemies:

1. **Maker:** `mkX = (px, py) => ({ type:'x', x, y, w, h, vx:0, vy:0, hp, flash:0, kbT:0, burstC:[3 colours], ... })`. `burstC` routes drawing to `drawFoe` and colours the death burst.
2. **Spawn:** add a letter in `spawnFoe` and in the `loadRoom` letter test (`'dwehgm'.includes(e.type)`).
3. **Behaviour:** add a branch to `updateFoe(e, dt)` (return true). Use `hurtPlayer(1, x)` on contact. Clamp to the room. Mark `e.dead` when it falls out.
4. **Draw:** add a branch to `drawFoe(e, cx0, t)`. Use pixel rects, flash white when `e.flash > 0`, and keep the silhouette readable at 1×.
5. **Optional extras:** reactions in `foeHit(e)` (e.g. the swarm scatters, the slag stops trailing). Armour uses `armor:true`, which `hitEnemy` handles: front blocked, behind, a down-slash or a skill gets through.
6. **A tell and a sound.** Every enemy needs a warning the player can read: the drip falls before the mite does, bubbles come before the eel, the chain creaks before the puppet swings back. Give it a sound in `SFX` too, and only play it when the enemy is on screen.
7. **Characters (Beta):** add an entry to `BEAST` in 23-bestiary-practice and to `FOE_IDS`. An entry has a name, tag, ch, hp, spd, view `near`/`wide`, where, blurb, tell, beat, `anims`, and `pose(anim, t)`. `pose` draws a scripted loop with the game's own draw function in world coordinates: floor at `BFY`, centre `BCX`, top `BTOP`. Use `bHit` for the struck flash and `G.shots`/`G.puddles` with `drawHazards` for projectiles.
8. **Balance by measuring:** a small node-stub bot (see tests/bal_run.js) that measures time in danger and hits taken. Then tune.

## A new boss

Each boss has `type:'boss', kind:'x'` and a state machine. Touch these places; grep each name:

1. **Maker** `mkX(px, py)` with hp, maxHp, `state:'dormant'`, face, flash and anim. Put tuning numbers in `TUNE` so the Boss Lab sliders can reach them.
2. **Spawn:** a room entity letter, plus a line in `loadRoom` (`if (e.type === 'X' && !G.bossDown) G.boss = mkX(px, py)`).
3. **Update:** dispatch in `updateBoss` (11-draw-ch3). In the dormant state, trigger the intro when the player walks in: `B.state = 'intro'; B.t = CINE_T; startBossCine(B, 'Name', 'one short line')`.
4. **Draw:** dispatch in `drawBoss` (20). Draw the tells inside the boss's draw (a windup glow, floor marks, a sight line).
5. **Attacks:** a picker that avoids repeating the same move twice. Phase two is below half hp: faster, plus one new tell-able move. Every attack needs:
   - its own windup tell, visual plus sound
   - a readable dodge
   - an opening afterwards
6. **Defeat:** `bossDie()` puts most bosses into `downed`, and the hero walks up and holds ↑ to finish. Add `FIN[kind][heroId]` (name, desc, script) for every hero, a `FIN_KILL['kind:hero']` timing, `STORY_LAST[kind]` last words, and set `G.winT` after the kill so the results screen follows.
7. **HUD name:** the boss bar label (search `B.kind === 'umbra' ? 'The Black Wick'`).
8. **Music:** route it in `bgmWant`; `fight` covers cine-roared through death. Silence plays during the finisher.
9. **Also wire into:**
   - `GAL_BOSS` + `galSpawn` + `galBoss` (Gallery)
   - `RUSH`
   - `PRACTICE_STEP`
   - `BEAST` entry with poses for idle, each tell and phase two, `boss:true`, `room`, and `gal`
   - its chapter's preview silhouette in `chapterPreviews`. A non-block shape needs a custom pose and its eye positions, as was done for the twisted wyrm.
10. **Boss Lab:** if it is complex, expose its states and sliders like `ch3/bosses.html` or `umlab/skills.html`. Labs talk to the game by postMessage (lab commands such as `speed`, `hold`, `ushow`).

**Boss design rules the owner cares about:**
- No text hints in a fight. A paused tip on the retry after repeated falls is allowed.
- Every tell is unique.
- A heavy attack shakes the screen (use `heavyShake(n)`).
- Roars and screams are loud enough over the music.
- The finisher zooms in slightly, with silence and a strong sound.
- A retry starts with a full wax vessel and a shortened intro (`G.quickCine`).

**A long, custom entrance** (the Black Wick's, in 12-black-wick.js): instead of `startBossCine`, set `G.uent = { t, B }`. The step locks input (`G.cine || G.uent`), centres the camera on him, drives the zoom from `uentZoom(t)` with `uentFocus` keeping him centred, and `drawUmbraEntrance()` draws the dark veil, the eyes and the letterbox after the zoom. `bgmWant` returns silence while it runs. Schedule beats by crossing times (`cross(s)`), end with `endUmbraEntrance()`, and skip it on retries.

**Hidden-boss pattern (Black Wick):** reuse a hero's drawing through a "puppet": temporarily swap `P` fields, call `drawHeroBody`, then recolour the pixels (getImageData) into a dark palette with an outline. Give the dark fire remapped flame frames. Gate it behind a secret (a no-fall Chapter 3 clear opens the crack), and also expose it in Characters (Beta) with all stats `???` and a fight button.

## A new hero

Heroes are ids in `CHARS` and `ROSTER` (02). There are about 70 places that branch on the hero id. Find them all first:

```bash
grep -n "G.char === '\|id === '\|=== 'knight'\|=== 'hero'\|=== 'wick'" src/js/*.js
```

- **Cheapest route:** reuse Wick's (`wick`) paths. The `else` branches default to Wick, so give it new stats in `CHARS` and new drawing. For a distinct moveset, mirror the Lampknight (`knight`) pattern:
  - a swing table `xSwing(dir, n, fin)` returning `{d, dmg, ...}`
  - pose updates (`updateKnightPose`)
  - a body draw (`drawKnightBody`, with `knightSnap` for crisp rotated pixels)
- **Register it in:**
  - `CHARS` (name, tag, slash, maxHp, run, dashV, dashT, reach, combo, blurb)
  - `ROSTER`
  - `HERO_STATS` (pips on the party card)
  - `CAMP_SPOTS` (where it stands at camp)
  - `drawPlayer` dispatch
  - `CHAR_NOTES` (moves + design notes)
  - the `charFrames` swing logic for the sheet
  - the `FIN` finisher for every boss, plus `FIN_KILL`
  - hit sounds in `hitEnemy`
  - any wax-gain or focus-time differences
- **Check it:** Characters (Beta) draws it live from the same code (idle, run, jump, dash, full combo, up-slash, focus). Use that, plus `tests/browser/fin.cjs`, to check each finisher with each boss.

## Story and badges

- **Story lines** live in `STORY_OPEN`, `STORY_CH`, `STORY_LAST`, `STORY_END` and `LORE`. Write one short, hollow sentence each. No exclamation marks or jokes.
- **Badges:** `BADGES` = [id, name, description]. Award one with `earn(id)` at the moment it happens, or in `achOnWin(R)`. Keep badge ids distinct from helper keys stored in `ACH`.
