// ---------- DOM ui
const $ = id => document.getElementById(id);
const overlay = $('overlay'), banner = $('banner'), toastEl = $('toast');
let bannerTimer = 0, toastTimer = 0;
function showBanner(name, note, boss) {
  $('bName').textContent = name; $('bNote').textContent = note;
  banner.classList.toggle('boss', !!boss); banner.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => banner.classList.remove('show'), 2600);
}
function toast(text, ms = 3200) {
  toastEl.textContent = text; toastEl.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => toastEl.classList.remove('show'), ms);
}
function hint(key, text, ms) { if (G.hinted[key]) return; G.hinted[key] = true; toast(text, ms || 4200); }
function fmtTime(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
function setOverlay(kind) { setOverlay0(kind); focusMenu(); const gp = $('galPanel'); if (gp && G.gal) gp.hidden = !!kind; }
function volRow(k, label) {
  const v = Math.round(VOL[k] * 100);
  return `<div class="vrow"><span>${label}</span><button class="vbtn" data-action="vol" data-k="${k}" data-d="-1" type="button" aria-label="${label} quieter">−</button><span class="vbar" aria-hidden="true"><i style="width:${v}%"></i></span><button class="vbtn" data-action="vol" data-k="${k}" data-d="1" type="button" aria-label="${label} louder">+</button><b>${v}</b></div>`;
}
function setOverlay0(kind) {
  overlay.classList.toggle('home', kind === 'title' || kind === 'paused' || kind === 'won');
  if (!kind) { overlay.hidden = true; overlay.innerHTML = ''; return; }
  overlay.hidden = false;
  if (kind === 'title' && G.menu !== 'select' && G.menu !== 'chapter') {
    if (G.menu === 'chars') {
      const cs = G.cs || (G.cs = { id:ROSTER[0], anim:'idle', t0:performance.now() }), id = cs.id;
      if (id === 'umbra') { if (!UMBRA_ANIMS.some(a => a[0] === cs.anim)) cs.anim = 'idle'; overlay.innerHTML = umbraSheetHtml(cs); return; }
      if (BEAST[id]) { if (!BEAST[id].anims.some(a => a[0] === cs.anim)) cs.anim = BEAST[id].anims[0][0]; overlay.innerHTML = beastSheetHtml(cs); return; }
      if (!CHAR_ANIMS.some(a => a[0] === cs.anim)) cs.anim = 'idle';
      const ch = CHARS[id], n = CHAR_NOTES[id];
      const max = { maxHp:9, run:128, dashV:330, slash:3, reach:1.6 }, row = (k, l, v, u) => `<dt>${l}</dt><dd><span class="bar"><i style="width:${Math.round(v / max[k] * 100)}%"></i></span>${v}${u || ''}</dd>`;
      overlay.innerHTML = `<div class="camp sheet-page"><div class="rpgwin csw cs"><p class="peb">Characters · Beta · drawn live by the game</p>
      ${csNav(id)}
      <div class="cs-main">
        <div class="cs-left"><div class="cs-stage"><canvas id="csv" width="352" height="224" aria-label="${ch.name} animation"></canvas><span class="cs-anim" id="csl"></span></div>
          <div class="cs-anims">${CHAR_ANIMS.map(([a, l]) => `<button type="button" class="chip${a === cs.anim ? ' on' : ''}" data-action="cs-anim" data-a="${a}">${l}</button>`).join('')}</div></div>
        <div class="cs-sheet">
          <div class="cs-title"><h3>${ch.name}</h3><span class="tag">${ch.tag}</span></div>
          <p>${ch.blurb}</p>
          <dl class="cs-stats">${row('maxHp', 'Embers', ch.maxHp)}${row('run', 'Run speed', ch.run, ' px/s')}${row('dashV', 'Dash', ch.dashV, ' px/s')}${row('slash', 'Slash dmg', ch.slash)}${row('reach', 'Reach', ch.reach, '×')}</dl>
          <p class="cs-moves"><b>Moves</b> ${n.moves}</p>
          <div class="cs-pal" id="cspal" aria-label="Palette"></div>
          <div class="cs-notes"><b>Design notes</b>${n.notes}</div>
          <div class="cs-fins"><b>Finishing moves</b>${['warden', 'chandler', 'moth'].map(bk => `<p><em>${FIN[bk][id].name}</em> <small>vs ${bk === 'warden' ? 'Tallow Warden' : bk === 'moth' ? 'Cinder Moth' : 'Hanging Chandler'}</small><br>${FIN[bk][id].desc}</p>`).join('')}</div>
        </div>
      </div>
      <div class="gbtns"><button class="btn" data-action="menu" data-to="home" type="button">Back to camp</button></div></div>
      <div class="hint">${tip('Tap a hero or an animation', '← → ↑ ↓ choose · Enter select · Esc back')}</div></div>`;
      return;
    }
    if (G.menu === 'badges') { overlay.innerHTML = badgesHtml(); return; }
    if (G.menu === 'howto') {
      const keys = TOUCH
        ? [['Move', 'Drag on the left half of the screen'], ['Jump', 'Tap, or hold to jump higher'], ['Slash', 'Aim with the stick, or swipe up or down on the button'], ['Dash', 'Works in mid-air'], ['Focus', 'Hold to turn wax into an ember'], ['Rest', 'Push up at a shrine'], ['Layout', 'The sliders icon moves and resizes buttons']]
        : [['Move', '← → or A D'], ['Jump', 'Space or Z · hold to jump higher'], ['Slash', 'X or J · hold ↑ or ↓ to aim'], ['Dash', 'Shift, C or K'], ['Focus', 'Hold F to turn wax into an ember'], ['Skill', 'E or L, once learned'], ['Rest', '↑ at a shrine'], ['Pause', 'P or Esc · M toggles sound']];
      overlay.innerHTML = `<div class="camp sheet-page">
        <div class="rpgwin howw">
          <p class="peb">Field guide</p><h2>How to Play</h2>
          <dl class="hkeys">${keys.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
          <div class="hnotes">
            <p><b>Embers</b> are your health. <b>Wax</b> fills as you land hits; a third of the vessel buys one Focus or one skill.</p>
            <p><b>Strike down</b> on a foe or on spines to bounce and refresh your dash. <b>Shrines</b> save where you rest.</p>
          </div>
          <p class="peb" style="margin:0">Comfort · saved in this browser</p>
          ${comfRows()}
          <div class="gbtns"><button class="btn primary" data-action="menu" data-to="select" type="button">Descend</button><button class="btn" data-action="menu" data-to="home" type="button">Back to camp</button></div>
        </div>
        <div class="hint">${tip('Tap a button', '← → choose · Enter confirm · Esc back')}</div>
      </div>`;
      return;
    }
    const items = HOME_ITEMS, hi = G.homeIdx || 0, pf = G.homeFocus === 'party';
    const order = ROSTER, k = order.indexOf(G.char), st = HERO_STATS[G.char];
    const pips = n => `<span class="pips">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
    overlay.innerHTML = pf ? `<div class="camp">
      <button type="button" class="navl" data-action="pnav" data-d="-1" aria-label="Previous hero">&#9664;</button>
      <button type="button" class="navr" data-action="pnav" data-d="1" aria-label="Next hero">&#9654;</button>
      <div class="rpgwin pcard">
        <h4>Choose your hero</h4>
        <div class="who"><h3>${CHARS[G.char].name}</h3><span class="tagl">${k + 1} / ${order.length} · ${CHARS[G.char].tag}</span></div>
        <div class="pvbox"><canvas class="pv" width="200" height="84" aria-hidden="true"></canvas><span class="pvl" id="pvl"></span></div>
        <p>${CHARS[G.char].blurb}</p>
        <div class="stats"><span>Embers</span><i class="emb" style="--n:${CHARS[G.char].maxHp}"></i><span>Speed</span>${pips(st.Speed)}<span>Reach</span>${pips(st.Reach)}<span>Power</span>${pips(st.Power)}</div>
        <div class="pbtns"><button type="button" class="pri" data-action="pchoose">Descend as ${CHARS[G.char].name} &#9654;</button><button type="button" data-action="pback">Back</button></div>
      </div>
      <div class="hint">${tip('Tap the arrows to meet each hero', '← → meet each hero · Enter descend · Esc back')}</div>
    </div>` : `<div class="camp${G.campIn ? ' fade-in' : ''}">
      <div class="logo">Wickfall<small>Rest · then descend</small></div>
      <div class="rpgwin cmd"><h4>${CHARS[G.char].name} · ${CHARS[G.char].tag}</h4>
        ${items.map((it, i) => `<button type="button" class="rpgbtn${i === hi ? ' on' : ''}" data-action="hm" data-i="${i}">${it.label}</button>`).join('')}
      </div>
      <div class="hint">${tip('Tap a command', '↑ ↓ choose · Enter confirm · ← → swap hero')}</div>
    </div>`;
    G.campIn = false;
    return;
  }
  if (kind === 'title') {
    const card = (id, svg) => `<button class="char${G.char === id ? ' on' : ''}" data-action="pick" data-char="${id}" type="button" aria-pressed="${G.char === id}">
      <canvas class="hc" data-char="${id}" width="54" height="37" aria-hidden="true"></canvas><b>${CHARS[id].name}</b><small>${CHARS[id].tag}</small><span>${CHARS[id].blurb}</span></button>`;
    if (G.menu === 'chapter') {
      const done = tutDone(), pv = chapterPreviews();
      const card = (n, desc, btns, d) => `<div class="rpgwin chapc" style="--d:${d}s">
        <div class="cboss"><img src="${pv[n].boss}" alt=""><span class="bl">Boss · <b>? ? ?</b></span><span class="cn">Chapter ${n}</span></div>
        <div class="ct"><h3>${CHAPTERS[n].name}</h3><p class="cst">${CHAPTERS[n].stages}</p><p>${desc}</p></div>
        <div class="crow">${btns}</div></div>`;
      overlay.innerHTML = `<div class="camp chap-page">
        <div class="chap-head"><p class="steps"><span>Camp</span> · <span>Hero</span> · <b>Chapter</b></p><h2>Choose a chapter</h2>
          <p class="goer">Descending as <b>${CH().name}</b> · <button class="link" data-action="menu" data-to="select" type="button">change</button></p></div>
        <div class="chap-cards">
          ${card(1, `Find coins and trade ${COST} at the blacksmith for <b>Ember Bolt</b>. Something old keeps the flame at the bottom.`, done
            ? `<button class="btn primary" data-action="ch" data-ch="1" type="button">Descend</button><button class="btn" data-action="tut" type="button">Tutorial</button>`
            : `<button class="btn primary" data-action="tut" type="button">Tutorial first</button><button class="btn" data-action="ch" data-ch="1" type="button">Skip tutorial</button>`, 0.05)}
          ${card(2, 'Begins with <b>Ember Bolt</b>. A second blacksmith forges <b>Wax Dive</b>. Something hangs above the last hall.',
            `<button class="btn${done ? '' : ''}" data-action="ch" data-ch="2" type="button">Descend</button>`, 0.15)}
          ${card(3, 'Begins with <b>Ember Bolt</b> and <b>Wax Dive</b>. Moths nest in the burrows; something swims in the kiln below. <b>Flare Burst</b> waits at the end.',
            `<button class="btn" data-action="ch" data-ch="3" type="button">Descend</button>`, 0.25)}
        </div>
        <div class="hint">${tip('Tap a chapter to begin', '← → ↑ ↓ choose · Enter descend · Esc back to heroes')}</div>
      </div>`;
      return;
    }
    overlay.innerHTML = `<div class="ov"><p class="steps"><span>Home</span>·<b>Hero</b>·<span>Chapter</span></p><h2>Choose your hero</h2>
    <div class="chars">
      ${card('wick', '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4c2 4 5 6 5 10a5 5 0 0 1-10 0c0-4 3-6 5-10z" fill="#f2a541"/><rect x="14" y="17" width="12" height="10" rx="1" fill="#efe3c2"/><rect x="16.5" y="20" width="2" height="3" fill="#18121f"/><rect x="21.5" y="20" width="2" height="3" fill="#18121f"/><path d="M13 27h14l3 9H10z" fill="#3a2b4b"/></svg>')}
      ${card('snuff', '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M18 5h4l1 2-1 1h-4l-1-1z" fill="#d9b46a"/><path d="M19 7h2l8 12H11z" fill="#c79a4a"/><path d="M19 7h1L14 19h-3z" fill="#8d6a33"/><rect x="10" y="18.5" width="20" height="1.6" fill="#ecc97f"/><rect x="13" y="20" width="14" height="8" rx="1" fill="#121019"/><rect x="16" y="22.5" width="2.6" height="2.6" fill="#f4ead0"/><rect x="21.4" y="22.5" width="2.6" height="2.6" fill="#f4ead0"/><path d="M13 28h14l2 8H11z" fill="#2b3a46"/><path d="M27 30c4-1 7-4 9-8" stroke="#ffffff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>')}
      ${card('knight', '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 2c1.6 3 4 4.5 4 7.5a4 4 0 0 1-8 0c0-3 2.4-4.5 4-7.5z" fill="#f2a541"/><path d="M11 24v-6a9 9 0 0 1 18 0v6z" fill="#7b88a0"/><rect x="13" y="18.5" width="14" height="2.5" rx="1" fill="#f2a541"/><path d="M11 24h18l2 4H9z" fill="#5d6a82"/><path d="M12 28h16l3 9H9z" fill="#5a2430"/><rect x="29" y="28" width="4" height="5" rx="1" fill="#c79a4a"/><rect x="30" y="29.5" width="2" height="2" fill="#fff1c1"/></svg>')}
      ${card('hero', '<svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4c2 4 5 6 5 10a5 5 0 0 1-10 0c0-4 3-6 5-10z" fill="#8fd8ff"/><path d="M20 8c1 2 2.5 3.5 2.5 5.5a2.5 2.5 0 0 1-5 0c0-2 1.5-3.5 2.5-5.5z" fill="#eafaff"/><path d="M14 22c-4 1-8 3-11 6 3-1 7-2 11-3z" fill="#1f3550"/><rect x="14" y="17" width="12" height="10" rx="1" fill="#e8ecf2"/><rect x="18" y="20" width="1.6" height="3" fill="#121826"/><rect x="22" y="20" width="1.6" height="3" fill="#121826"/><path d="M13 27h14l3 9H10z" fill="#232a3a"/><path d="M26 30l11-9" stroke="#8fd8ff" stroke-width="2.4" stroke-linecap="round"/><path d="M26 30l11-9" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round"/></svg>')}
    </div>
    <div class="row"><button class="btn primary" data-action="menu" data-to="chapter" type="button">Continue as ${CH().name} →</button></div>
    <button class="link" data-action="menu" data-to="home" type="button">← Back</button>
    <p class="hint">${tip('Tap a hero to choose', '← → choose · Enter continue · Esc back')}</p></div>`;
  }
  if (kind === 'paused') {
    const tut = G.room && G.room.def.tut, ch = CH();
    const embers = Array.from({ length:P.maxHp }, (_, i) => `<i class="${i < P.hp ? 'on' : ''}"></i>`).join('');
    const skills = Object.keys(SK).filter(id => !SK[id].held).map(id => G.skills[id]
      ? `<div class="psk"><b style="color:${SK[id].col}">${SK[id].name}</b><span>${tip(SK[id].input.t, SK[id].input.k)} · ${SK[id].desc().replace(SK[id].name + ' ', '')}</span></div>`
      : `<div class="psk lock"><b>${SK[id].name}</b><span>Bring ${COST} coins to a blacksmith to forge it.</span></div>`).join('');
    overlay.innerHTML = `<div class="camp pause-page">
      <div class="rpgwin pmenu">
        <p class="peb">${G.gal ? 'Gallery' : 'Chapter ' + G.chapter + ' · ' + (G.room ? G.room.def.name : '')}</p>
        <h2>Paused</h2>
        <button class="rpgbtn" data-action="resume" type="button">Resume</button>
        ${G.gal ? '' : tut ? '<button class="rpgbtn" data-action="skiptut" type="button">Skip tutorial</button>' : '<button class="rpgbtn" data-action="shrine" type="button">Return to shrine</button>'}
        ${G.gal ? '' : '<button class="rpgbtn" data-action="title" type="button">Change hero</button>'}
        <button class="rpgbtn" data-action="home" type="button">Back to camp</button>
        <div class="pvol">${volRow('music', 'Music')}${volRow('sfx', 'Effects')}</div>
        ${comfRows()}
      </div>
      <div class="rpgwin pinfo">
        <h4>${ch.name} · ${ch.tag}</h4>
        <div class="pstats">
          <span><small>Embers</small><em class="pemb">${embers}</em></span>
          <span><small>Wax</small><em class="pwax"><i style="width:${Math.round(P.wax / 99 * 100)}%"></i></em></span>
          <span><small>Coins</small><b>${G.coins}</b></span>
          <span><small>Time</small><b>${fmtTime(G.time)}</b></span>
          <span><small>Falls</small><b>${G.deaths}</b></span>
        </div>
        <h4>Skills</h4>
        <div class="pskills">${skills}</div>
        <p class="pnote">Each skill costs a third of the wax vessel.</p>
      </div>
      <div class="hint">${tip('Tap a command', '↑ ↓ choose · Enter confirm · P or Esc resume')}</div>
    </div>`;
  }
  if (kind === 'won') {
    const R = G.rankRes || (G.rankRes = G.rush && (!G.rush.won || G.rush.practice) ? { rank:'D', score:0, parts:{}, played:true } : rateRun()); if (!R.played) { R.played = true; setTimeout(() => sfx('rankStamp', R.rank), 1150); }
    if (!R.ach) R.ach = achOnWin(R);
    const shareBtn = '<button class="btn" data-action="share" type="button">Score card</button>';
    const c1 = G.chapter === 1, c3 = G.chapter === 3, embers = Array.from({ length:P.maxHp }, (_, i) => `<i class="${i < P.hp ? 'on' : ''}"></i>`).join('');
    if (G.rush && G.rush.practice) {
      const Rr = G.rush, nm = Rr.list[0].name;
      overlay.innerHTML = `<div class="camp end-page"><div class="rpgwin endw">
        <p class="peb">Practice · ${CH().name}</p><h2>${Rr.won ? (Rr.list[0].room === 'kiln' ? 'The kiln goes cold' : nm + ' is down') : 'Your flame went out'}</h2>
        <div class="edv" aria-hidden="true"><i></i><b></b><i></i></div>
        <p class="eline">${Rr.won ? 'A clean practice run. Nothing is saved, so fight it as often as you like.' : 'Against ' + nm + '. Practice runs end on the first fall.'}</p>
        <p class="eline" style="font-size:1.4cqw">Time ${fmtTime(G.time)} · Hits taken ${G.hits || 0} · Embers left ${Rr.won ? P.hp : 0}</p>
        <div class="gbtns"><button class="btn primary" data-action="beast-fight" data-k="${Rr.practice}" type="button">Fight again</button><button class="btn" data-action="beast-back" data-k="${Rr.practice}" type="button">Back to the sheet</button><button class="btn" data-action="home" type="button">Back to camp</button></div>
      </div><div class="hint">${tip('Tap a button', '← → choose · Enter confirm')}</div></div>`;
      return;
    }
    if (G.rush) {
      const Rr = G.rush, done = Rr.won ? RUSH.length : Rr.i, reached = RUSH[Math.min(Rr.i, RUSH.length - 1)];
      const rows = RUSH.map((b, k) => `<span class="${k < done ? 'ok' : k === Rr.i && !Rr.won ? 'fell' : ''}"><small>${k + 1}</small><b>${b.name}</b><em>${k < done ? fmtTime(Rr.splits[k] - (k ? Rr.splits[k - 1] : 0)) : k === Rr.i && !Rr.won ? 'fell' : '—'}</em></span>`).join('');
      overlay.innerHTML = `<div class="camp end-page"><div class="rpgwin endw">
        <p class="peb">Boss Rush · ${CH().name}</p><h2>${Rr.won ? 'The rush is won' : 'The rush ends'}</h2>
        <div class="edv" aria-hidden="true"><i></i><b></b><i></i></div>
        <p class="eline">${Rr.won ? 'Every keeper, and the black flame after them, on one fire.' : 'Your flame went out against ' + reached.name + '.'}</p>
        <div class="rushlist">${rows}</div>
        ${Rr.won ? rankHtml(R, embers) : `<p class="eline" style="font-size:1.4cqw">Time ${fmtTime(G.time)} · Hits taken ${G.hits || 0}</p>`}
        <div class="gbtns"><button class="btn primary" data-action="rush" type="button">Run it again</button>${shareBtn}<button class="btn" data-action="home" type="button">Back to camp</button></div>
      </div><div class="hint">${tip('Tap a button', '← → choose · Enter confirm')}</div></div>`;
      return;
    }
    if (G.duel) {
      overlay.innerHTML = `<div class="camp end-page"><div class="rpgwin endw">
        <p class="peb">Hidden duel · Beta</p><h2>The Black Wick goes out</h2>
        <div class="edv" aria-hidden="true"><i></i><b></b><i></i></div>
        <p class="eline">Wick Hero's shadow crumbles to ash at the bottom of the pit. The black flame gutters, but it does not quite go out.</p>
        ${rankHtml(R, embers)}
        <div class="gbtns"><button class="btn primary" data-action="duel" type="button">Fight him again</button>${shareBtn}<button class="btn" data-action="home" type="button">Back to camp</button></div>
      </div><div class="hint">${tip('Tap a button', '← → choose · Enter confirm')}</div></div>`;
      return;
    }
    overlay.innerHTML = `<div class="camp end-page">
      <div class="rpgwin endw">
        <p class="peb">Chapter ${G.chapter} cleared · ${CHAPTERS[G.chapter].name}</p>
        <h2>${c1 ? 'The Warden is out' : c3 ? 'The Moth burns out' : 'The Chandler falls'}</h2>
        <div class="edv" aria-hidden="true"><i></i><b></b><i></i></div>
        <p class="eline">${c1 ? 'Below the Cinder Chamber, a flooded foundry still burns.' : c3 ? 'Flare Burst is yours, and the kiln goes cold. Beneath it the abyss opened, and you stepped through. More of the deep is coming.' : 'Under the chandlery the old kiln is still hot, and something is nesting in it.'}</p>
        ${rankHtml(R, embers)}
        <div class="gbtns">${c3 ? '<button class="btn primary" data-action="ch" data-ch="3" type="button">Play chapter 3 again</button>' : `<button class="btn primary" data-action="ch" data-ch="${G.chapter + 1}" type="button">Continue to chapter ${G.chapter + 1}</button>`}
          ${shareBtn}<button class="btn" data-action="title" type="button">Choose hero</button><button class="btn" data-action="home" type="button">Back to camp</button></div>
      </div>
      <div class="hint">${tip('Tap a button', '← → choose · Enter confirm')}</div>
    </div>`;
  }
}
function rankHtml(R, embers) {
  const row = (i, label, val, note, pts, max) => `<p style="--d:${0.35 + i * 0.12}s"><span>${label}</span><b>${val}</b><em>${note}</em><i><u style="--k:${pts / max}"></u></i><strong>+${pts}</strong></p>`;
  const bestTxt = R.assist ? 'Assist was on · best not saved' : !R.best && !R.newBest ? '' : R.newBest ? (R.best ? `New best · was ${R.best.rank} (${R.best.score})` : 'First clear · best saved') : `Best · ${R.best.rank} (${R.best.score}) with ${(CHARS[R.best.hero] || CH()).name}`;
  return `<div class="rank">
    <div class="rstamp r-${R.rank}" aria-label="Rank ${R.rank}"><small>Rank</small><b>${R.rank}</b></div>
    <div class="rrows">
      ${row(0, 'Time', fmtTime(R.t), 'par ' + fmtTime(R.par), R.parts.time, 40)}
      ${row(1, 'Falls', R.falls, R.falls ? '-9 each' : 'none', R.parts.fall, 25)}
      ${row(2, 'Hits taken', R.hits, R.hits ? '-2 each' : 'untouched', R.parts.hit, 20)}
      <p style="--d:0.71s"><span>Embers left</span><em class="pemb">${embers}</em><em></em><i><u style="--k:${R.parts.emb / 15}"></u></i><strong>+${R.parts.emb}</strong></p>
      <p class="rtot" style="--d:0.85s"><span>Score · ${CH().name}</span><strong>${R.score}<small> / 100</small></strong></p>
    </div>
  </div>
  <p class="rbest${R.newBest ? ' new' : ''}">${bestTxt}</p>`;
}
function focusMenu() {
  if (overlay.hidden || G.state === 'play') { const f = document.activeElement; if (f && overlay.contains(f)) f.blur(); return; }
  if (G.state === 'title' && G.menu === 'home') return;
  const b = overlay.querySelector('.btn.primary') || overlay.querySelector('button'); if (b && !overlay.hidden) b.focus({ preventScroll:true });
}
overlay.addEventListener('click', e => {
  const b = e.target.closest('[data-action]'); if (!b) return;
  const a = b.dataset.action; initAudio();
  if (a === 'start') beginDescent('ch1');
  if (a === 'ch') beginDescent('ch' + b.dataset.ch);
  if (a === 'tut') beginDescent('tut');
  if (a === 'gallery') beginDescent('gallery');
  if (a === 'menu') goMenu(b.dataset.to);
  if (a === 'hm') { G.homeIdx = +b.dataset.i; homeAct(G.homeIdx); }
  if (a === 'pnav') homeMove(+b.dataset.d);
  if (a === 'cs-hero') { G.cs.id = b.dataset.id; G.cs.t0 = performance.now(); sfx('blip'); setOverlay('title'); const nb = overlay.querySelector(`[data-action="cs-hero"][data-id="${G.cs.id}"]`); if (nb) nb.focus({ preventScroll:true }); return; }
  if (a === 'duel') { sfx('blip'); beginDescent('duel'); return; }
  if (a === 'share') { sfx('blip'); showShareCard(); return; }
  if (a === 'comf') { const k = b.dataset.k; setComf(k, !COMF[k]); sfx('blip'); setOverlay(G.state === 'paused' ? 'paused' : 'title'); const nb = overlay.querySelector(`[data-action="comf"][data-k="${k}"]`); if (nb) nb.focus({ preventScroll:true }); return; }
  if (a === 'beast-fight') { sfx('blip'); beginDescent('fight:' + b.dataset.k); return; }
  if (a === 'beast-gal') { sfx('blip'); beginDescent('gallery:' + b.dataset.k); return; }
  if (a === 'beast-back') { G.cs = { id:b.dataset.k, anim:BEAST[b.dataset.k].anims[0][0], t0:performance.now() }; toTitle('home'); goMenu('chars'); return; }
  if (a === 'cs-grp') { const g = b.dataset.g; G.cs.last = G.cs.last || {}; G.cs.last[csGroupOf(G.cs.id)] = G.cs.id; G.cs.id = G.cs.last[g] || csIds(g)[0]; G.cs.t0 = performance.now(); sfx('blip'); setOverlay('title'); const nb = overlay.querySelector(`[data-action="cs-grp"][data-g="${g}"]`); if (nb) nb.focus({ preventScroll:true }); return; }
  if (a === 'rush') { sfx('blip'); beginDescent('rush'); return; }
  if (a === 'vol') { const k = b.dataset.k, d = +b.dataset.d; setVol(k, VOL[k] + d * 0.1); sfx('blip'); setOverlay(G.state === 'paused' ? 'paused' : 'title'); const nb = overlay.querySelector(`[data-action="vol"][data-k="${k}"][data-d="${d}"]`); if (nb) nb.focus({ preventScroll:true }); return; }
  if (a === 'duel-hero') { pickChar(b.dataset.id); sfx('blip'); setOverlay('title'); const nb = overlay.querySelector(`[data-action="duel-hero"][data-id="${b.dataset.id}"]`); if (nb) nb.focus({ preventScroll:true }); return; }
  if (a === 'cs-anim') { G.cs.anim = b.dataset.a; G.cs.t0 = performance.now(); sfx('blip'); overlay.querySelectorAll('[data-action="cs-anim"]').forEach(x => x.classList.toggle('on', x === b)); return; }
  if (a === 'pchoose') { sfx('chime'); goMenu('chapter'); }
  if (a === 'pback') { sfx('blip'); goMenu('home'); }
  if (a === 'pick') { pickChar(b.dataset.char); sfx('blip'); }
  if (a === 'title') toTitle('select');
  if (a === 'home') toTitle('home');
  if (a === 'skiptut') { togglePause(); finishTutorial(); }
  if (a === 'resume') togglePause();
  if (a === 'shrine') { togglePause(); P.hp = 0; P.dead = true; P.deadT = 0.01; G.deaths--; }
  if (document.activeElement === b) b.blur();
});

