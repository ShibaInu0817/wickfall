const src=require('fs').readFileSync('g.js','utf8');
const noop=()=>{}; const grad={addColorStop:noop};
const chk=(n,args)=>{ for (const v of args) if (typeof v==='number' && isNaN(v)) throw new Error(n+' NaN '+JSON.stringify(args)); };
const fns={}; for (const n of ['arc','ellipse','moveTo','lineTo','quadraticCurveTo','fillRect','translate','scale','rotate','drawImage']) fns[n]=(...a)=>{ chk(n,a); if(n==='arc'&&a[2]<0) throw new Error('arc neg '+a[2]); if(n==='ellipse'&&(a[2]<0||a[3]<0)) throw new Error('ellipse neg'); };
const ctx=new Proxy(fns,{get:(t,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>grad:(k in t?t[k]:noop),set:(t,k,v)=>{t[k]=v;return true}});
function el(){return {getContext:()=>ctx,querySelector:()=>el(),querySelectorAll:()=>[],addEventListener:noop,removeEventListener:noop,classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},setAttribute:noop,appendChild:noop,dataset:{},style:{setProperty:noop,removeProperty:noop},textContent:'',innerHTML:'',hidden:false,clientWidth:740,clientHeight:360,offsetWidth:100,offsetHeight:40,getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:100,width:100,height:100}),setPointerCapture:noop,blur:noop,closest:()=>null,open:false,scrollIntoView:noop,width:0,height:0}}
const handlers={};
global.window=global; window.UW_NOTIPS=true; window.addEventListener=(k,f)=>{(handlers[k]=handlers[k]||[]).push(f)}; window.innerWidth=800; window.innerHeight=400;
global.document={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),addEventListener:noop,body:el(),documentElement:el(),activeElement:null};
global.matchMedia=()=>({matches:false,addEventListener:noop}); global.localStorage={getItem:()=>null,setItem:noop};
global.screen={width:800,height:400}; global.navigator={};
let now=0; global.performance={now:()=>now}; let rafCb=null; global.requestAnimationFrame=f=>{rafCb=f};
global.setTimeout=()=>0; global.clearTimeout=noop;
eval(src.replace("'use strict';","'use strict'; global.__G=()=>G; global.__P=()=>P; global.__new=(c,m)=>{G.char=c; newGame(m);}; global.__room=(i,e)=>loadRoom(i,e||'a'); global.__F={enterGallery:()=>enterGallery(), galRun:(m)=>galRun(GAL_MOVES[m]), galSpawn:(k)=>galSpawn(k), galBoss:(m)=>galBoss(m), galEntrance:()=>galEntrance(), MOVES:()=>Object.keys(GAL_MOVES), hurtPlayer:(...a)=>hurtPlayer(...a), SK:()=>SK, skDmg:(i)=>skDmg(i), ROOMS:()=>ROOM_DEFS, showTip:(i,d)=>showTip(i,d), closeTip:()=>closeTip(), learnSkill:(r)=>learnSkill(r), openAbyssAfterTip:()=>openAbyssAfterTip(), hint:(k,s)=>hint(k,s), tipScene:(id)=>{G.tipId=id; for(let i=0;i<260;i++) drawTipScene(i/60,1/60);}};"));
const key=(type,code)=>handlers[type].forEach(f=>f({code,repeat:false,preventDefault:noop}));
function run(room, label){
  __new(process.env.HC||'hero','ch1'); if (room) __room(room);
  let maxCombo=0, sevSeen=0, kills=0, startEnemies=__G().enemies.length + (__G().boss?1:0), errs=0, bossHp0 = __G().boss ? __G().boss.hp : null;
  for(let i=0;i<1500;i++){ now+=16.7;
    if(i%16===0) key('keydown','KeyX'); if(i%16===2) key('keyup','KeyX');
    if(room===3 && i===20) key('keydown','ArrowRight'); if(room===3 && i===140) key('keyup','ArrowRight');
    try{ rafCb(now);}catch(e){ errs++; if(errs<3) console.log('ERR',label,e.message, e.stack.split('\n')[1]); }
    const P=__P(); maxCombo=Math.max(maxCombo,P.combo); if(__G().sev) sevSeen++; }
  const G=__G();
  console.log(label, {maxCombo, sevFrames:sevSeen, enemiesLeft:G.enemies.length, startEnemies, bossHp0, bossHp: G.boss ? G.boss.hp : (G.bossDown ? 'defeated' : null), hp:__P().hp, maxHp:__P().maxHp, wax:__P().wax, errs});
}
cp();
tips();
function run0w(){ let errs=0; for(let i=0;i<600;i++){ now+=16.7; if(i%16===0) key('keydown','KeyX'); if(i%16===2) key('keyup','KeyX'); try{rafCb(now);}catch(e){errs++; if(errs<2) console.log('ERRW',e.message);} } console.log('wick ok, errs', errs, 'char', __G().char, 'maxHp', __P().maxHp); }
function tut(){
  __new(process.env.HC||'hero','tut'); let errs=0, maxRi=0, signs=new Set(), dummyHits=0;
  const G0=__G(); console.log('tut start room', G0.room.def.id, 'hp', __P().hp, '/', __P().maxHp, 'signs', G0.signs.length, 'enemies', G0.enemies.map(e=>e.type).join(','));
  key('keydown','ArrowRight');
  for(let i=0;i<3000;i++){ now+=16.7;
    const t=i%40; if(t===0) key('keydown','Space'); if(t===32) key('keyup','Space');
    if(t===18) key('keydown','ShiftLeft'); if(t===20) key('keyup','ShiftLeft');
    const nearD=__G().enemies.some(e=>e.dummy&&Math.abs(e.x-__P().x)<40)||__G().ri>0; if(nearD&&i%9===0) key('keydown','KeyX'); if(i%9===2) key('keyup','KeyX');
    try{ rafCb(now);}catch(e){ errs++; if(errs<3) console.log('ERRT',e.message, e.stack.split('\n')[1]); }
    const G=__G(); if (G.signAct) signs.add(G.signAct); maxRi=Math.max(maxRi,G.ri);
    const d=G.enemies.find(e=>e.dummy); if(d && d.flash>0.13) dummyHits++;
  }
  const G=__G(); console.log('tut', {errs, maxRi, room:G.room.def.id, signs:[...signs].join(','), dummyHits, cp:G.cp.room, deaths:G.deaths, hp:__P().hp});
}

function frames(n, f){ for(let i=0;i<n;i++){ now+=16.7; if(f) f(i); rafCb(now);} }
function place(tx,ty){ const P=__P(); P.x=tx*16+3; P.y=(ty||13)*16-P.h; P.vx=0; P.vy=0; }
function press(code,n){ key('keydown',code); frames(n||2); key('keyup',code); }
function main(){
  const out={};
  for (const c of ['wick','knight','hero']) {
    const r={};
    // chapter 1: coins and the smith
    __new(c,'ch1'); frames(3); const G=__G();
    r.coinsHollow=G.coinL.length; __room(2,'a'); frames(3); r.coinsDrip=G.coinL.length; r.smith=!!G.smith;
    G.coins=2; place(60); frames(4); press('ArrowUp'); frames(3); r.buyWith2=!!G.skills.bolt;
    G.coins=3; frames(2); press('ArrowUp'); frames(3); r.buyWith3=!!G.skills.bolt; r.coinsAfter=G.coins;
    r.boltDmg=__F.skDmg('bolt'); r.diveDmg=__F.skDmg('dive');
    // focus: drains while held, spills on a hit, refunds on release
    const P=__P(); frames(140); place(64); P.hp=P.maxHp-1; P.wax=99; frames(5);
    key('keydown','KeyF'); frames(25); r.waxMidFocus=Math.round(P.wax); key('keyup','KeyF'); frames(2); r.waxAfterRelease=Math.round(P.wax);
    key('keydown','KeyF'); frames(25); P.inv=0; __F.hurtPlayer(1, P.x+40); key('keyup','KeyF'); frames(2); r.waxAfterHit=Math.round(P.wax); r.hpAfterHit=P.hp;
    frames(90); P.inv=0; P.hurtT=0; const hp0=P.hp, wx0=P.wax; key('keydown','KeyF'); frames(75); key('keyup','KeyF'); r.focusFull=(P.hp-hp0)+' ember, wax '+Math.round(wx0)+'->'+Math.round(P.wax);
    // chapter 2: brazier with Ember Bolt from the high platform
    __new(c,'ch2'); frames(3); r.ch2room=G.room.def.id; r.ch2bolt=!!G.skills.bolt;
    place(45,7); P.face=1; P.wax=99; frames(6); key('keydown','ArrowRight'); frames(1); key('keyup','ArrowRight'); frames(2); press('KeyE'); frames(90);
    r.gateOpen=G.gates.find(g=>g.id==='lock1').open; r.braziersLit=G.braziers.filter(b=>b.lit).length;
    // spitter: bolt from the platform level with it
    const sp=G.enemies.find(e=>e.type==='spitter'); place(30,10); P.face=1; P.wax=99; frames(4); press('KeyE'); frames(60); r.spitterKilledByBolt=sp.dead||sp.hp<=0;
    // foundry: shell blocks a frontal slash, bolt cracks it
    __room(5,'a'); frames(3);
    const sh=G.enemies.find(e=>e.armor); sh.dir=1; sh.x=8*16; P.x=sh.x+sh.w+2; P.y=13*16-P.h; P.face=-1; const hp1=sh.hp; frames(1); press('KeyX'); frames(20);
    r.shellFrontBlocked = sh.hp===hp1 && sh.armor;
    P.wax=99; P.face=-1; P.x=sh.x+60; frames(2); press('KeyE'); frames(30); r.shellCracked=!sh.armor || sh.dead;
    // smith sells Wax Dive, then dive through the cracked floor
    G.coins=3; place(41); frames(4); press('ArrowUp'); frames(10); r.diveBought=!!G.skills.dive;
    place(50); P.wax=99; frames(8); key('keydown','ArrowDown'); press('KeyE'); key('keyup','ArrowDown'); frames(30);
    r.cracksLeft=G.cracks.size; r.inTunnel=P.y>13*16;
    // walk out of the tunnel and past the wall
    key('keydown','ArrowRight'); frames(30, i=>{ if(i%14===0) key('keydown','Space'); if(i%14===10) key('keyup','Space'); }); frames(150, i=>{ if(i%30===0) key('keydown','Space'); if(i%30===24) key('keyup','Space'); }); key('keyup','ArrowRight'); key('keyup','Space'); frames(20);
    r.pastWall=P.x>55*16 && P.y<13*16; r.endPos=[Math.round(P.x/16*10)/10, Math.round(P.y/16*10)/10];
    out[c]=r;
  }
  for (const c in out) console.log(c, JSON.stringify(out[c]));
}
function galMain(){
  for (const c of ['wick','knight','hero']) {
    __new(c,'ch1'); G0=__G(); __F.enterGallery(); frames(5); const G=__G(), P=__P(); let errs=0, res={room:G.room.def.id};
    const run=(n)=>{ for(let i=0;i<n;i++){ now+=16.7; try{rafCb(now);}catch(e){ errs++; if(errs<3) console.log('ERR',c,e.message,e.stack.split('\n')[1]); } } };
    let wax0=0; for (const m of __F.MOVES()) { const d=G.enemies.find(e=>e.dummy); const hits0=d?d.flash:0; __F.galRun(m); let saw=false; for(let i=0;i<110;i++){ run(1); if(G.spells.length) saw=true; } res['m_'+m.replace(/[^a-z]/gi,'')]=saw?'spell':'ok'; }
    res.focusHealed = P.hp; 
    for (const bk of ['warden','chandler']) { __F.galSpawn(bk); run(30); for (const m of (bk==='warden'?['leap','charge','drip']:['volley','call','wave','cross','ward'])) { __F.galBoss(m); run(260); }
      __F.galEntrance(); run(260); res[bk+'State']=G.boss&&G.boss.state; res[bk+'Cine']=G.cine; }
    // ward absorbs a bolt
    __F.galSpawn('chandler'); run(20); const B=G.boss; P.x=B.x-70; P.y=13*16-P.h; P.face=1; B.vx=0; __F.galBoss('ward'); run(2); const hp0=B.hp; __F.galRun('Ember Bolt'); run(40); res.wardBlocked = B.hp===hp0;
    B.wardT=0; B.wardCD=99; P.x=B.x-70; P.face=1; run(2); __F.galRun('Ember Bolt'); run(40); res.boltHurts = B.hp<hp0;
    res.errs=errs; res.winT=G.winT; res.state=G.state;
    console.log(c, JSON.stringify(res));
  }
}
function cp(){ for (const [c,ch,ri] of [['wick','ch1',3],['wick','ch2',6]]) { __new(c,ch); __room(ri,'a'); frames(10); const G=__G(),P=__P(); const cpRoom=G.cp.room;
  key('keydown','ArrowRight'); frames(40); key('keyup','ArrowRight'); frames(30); P.inv=0; P.hp=1; __F.hurtPlayer(1,P.x+30); frames(400);
  console.log(c, 'cp after entering', cpRoom, 'room after death', G.room.def.id, 'boss state', G.boss&&G.boss.state, 'P.x', Math.round(P.x)); } }
// stuck-player fixes: spines after a hit, the return point, the paused tips
function tips(){
  const ok={}, T=16, ri=id=>__F.ROOMS().findIndex(d=>d.id===id);
  __new('wick','ch1'); __room(ri('drip'),'a'); frames(5); let G=__G(), P=__P();
  // a spine touch while still flashing from a hit costs nothing more, and the return protects for 1.5s
  let sp=null; for (let y=0;y<G.room.g.length&&!sp;y++) for (let x=0;x<G.room.g[y].length;x++) if (G.room.g[y][x]===2) { sp={x,y}; break; }
  P.hp=3; P.inv=1; P.hitAt=G.time; P.dive=true; P.x=sp.x*T+3; P.y=sp.y*T-P.h+8; P.vy=0; frames(1); ok.spineAfterHitFree = P.hp===3;
  ok.spineFeedback = G.hitstop>0 && P.locked>0 && P.dive===false;
  let backAt=-1; for (let i=0;i<120 && backAt<0;i++){ frames(1); if (__G().fadeDir===-1) backAt=i; } ok.returnInv = P.inv>1.2;
  // other protection (here: the return itself) does not make the next spine touch free
  frames(70); P.hp=3; P.x=sp.x*T+3; P.y=sp.y*T-P.h+8; P.vy=0; frames(1); ok.spineAfterReturnCosts = P.hp===2 && P.inv>0; frames(90);
  // the return point is never set beside a live foe
  const e=G.enemies.find(e=>!e.dead && e.type!=='spitter'); if (e) { const s0=P.safe; P.inv=99; P.x=e.x+e.w/2-P.w/2; P.y=e.y+e.h-P.h; P.vy=0; P.grounded=true; frames(2); ok.noSafeBesideFoe = P.safe===s0 || Math.abs(P.safe.x-(e.x+e.w/2))>=40; } else ok.noSafeBesideFoe='no foe';
  // a tip pauses the run, shows once, and the dismissing key is not read as a jump
  window.UW_NOTIPS=false; __new('wick','ch1'); frames(60); G=__G(); P=__P(); G.hinted={};
  const t0=G.time; __F.showTip('brazier'); frames(3); ok.tipPauses = G.state==='tip';
  frames(30); ok.clockStops = G.time-t0 < 0.1;
  key('keydown','Space'); ok.spaceCloses = G.state==='play'; frames(2); key('keyup','Space'); ok.noJump = P.grounded && P.vy > -10;
  __F.showTip('brazier'); frames(3); ok.onlyOnce = G.state==='play';
  __F.learnSkill({x:P.x,y:P.y,id:'dive'}); frames(90); ok.skillTip = G.state==='tip'; __F.closeTip();
  // two falls to the Wyrm bring its tip on the retry
  __new('wick','ch3'); __room(ri('kiln'),'a'); frames(5); G=__G(); P=__P(); G.hinted={};
  for (let n=0;n<2;n++) { for (let i=0;i<900 && !(G.boss && G.boss.kind==='wyrm' && !['dormant','intro'].includes(G.boss.state)); i++) { frames(1); if (G.state==='tip') __F.closeTip(); if (G.boss && G.boss.state==='dormant' && i>30) G.boss.state='under'; }
    P.inv=0; P.locked=0; P.hp=1; __F.hurtPlayer(9,P.x+20); frames(200); }
  let saw=false; for (let i=0;i<900 && !saw;i++) { frames(1); saw = G.state==='tip'; }
  ok.wyrmTipOnRetry = saw && !!G.hinted.wyrm; ok.bossFalls = (G.bossFalls||{}).wyrm;
  let sceneErrs=0; const ce=console.error; console.error=()=>sceneErrs++;
  for (const ch of ['wick','knight','hero']) { __new(ch,'ch1'); frames(3); const px=__P().x, pp=__P().pose; for (const id of ['brazier','crack1','wyrm','moth','skill:bolt','skill:dive','skill:flare']) __F.tipScene(id); ok['scenes_'+ch] = sceneErrs===0 && __P().x===px && __P().pose===pp && __G().char===ch; }
  console.error=ce; ok.sceneErrs=sceneErrs;
  // the chapter 3 ending waits for the skill tip instead of being dropped
  { const timers=[], st=global.setTimeout; global.setTimeout=(f,ms)=>{ timers.push(f); return 0; };
    window.UW_NOTIPS=false; __new('wick','ch3'); __room(ri('kiln'),'a'); frames(5); G=__G(); G.hinted={}; G.boss=null; G.bossDown=true;
    __F.showTip('skill:flare'); frames(3); __F.openAbyssAfterTip(); ok.abyssHeldByTip = !G.abyss && G.state==='tip';
    __F.closeTip(); for (let n=0; n<50 && timers.length; n++) timers.shift()(); ok.abyssOpensAfterTip = !!G.abyss;
    // a timed hint waits for the tip instead of playing behind it
    G.hinted={}; __F.showTip('brazier'); frames(3); __F.hint('cocoon','x'); ok.hintWaits = !G.hinted.cocoon && G.state==='tip'; __F.closeTip(); for (let n=0; n<50 && timers.length; n++) timers.shift()(); ok.hintShownAfter = !!G.hinted.cocoon;
    global.setTimeout=st; }
  window.UW_NOTIPS=true;
  const bad=Object.entries(ok).filter(([k,v])=>v===false).map(([k])=>k);
  console.log('tips', JSON.stringify(ok)); console.log(bad.length ? 'TIPS FAIL '+bad.join(',') : 'tips all ok');
}
