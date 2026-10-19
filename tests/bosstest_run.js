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
eval(src.replace("'use strict';","'use strict'; global.__G=()=>G; global.__P=()=>P; global.__new=(c,m)=>{G.char=c; newGame(m);}; global.__room=(i,e)=>loadRoom(i,e||'a'); global.__F={hurtPlayer:(...a)=>hurtPlayer(...a), SK:()=>SK, skDmg:(i)=>skDmg(i), ROOMS:()=>ROOM_DEFS};"));
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
bossMain();
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
function bossMain(){
  for (const c of ['wick','knight','hero']) {
    __new(c,'ch2'); __room(6,'a'); frames(3); const G=__G(), P=__P();
    let minB=99, src={}; let errs=0, states={}, maxWick=0, bolts=0, minHp=99, hits=0, boss0=null, waxLow=0;
    key('keydown','ArrowRight'); frames(40); key('keyup','ArrowRight');
    const B=G.boss; boss0=B.hp;
    for (let i=0;i<60*90 && G.boss && !G.winT;i++){
      now+=16.7;
      const b=G.boss; if(!b) break; states[b.state]=(states[b.state]||0)+1;
      const bcx=b.x+b.w/2, pcx=P.x+P.w/2, d=bcx-pcx;
      // face the boss
      if (i%6===0){ key('keyup','ArrowLeft'); key('keyup','ArrowRight'); }
      const wk=G.enemies.find(e=>e.wickling&&!e.dead);
      if (wk && Math.abs(wk.x-P.x)<60){ key('keydown', wk.x<P.x?'ArrowLeft':'ArrowRight'); if(i%10===0){key('keydown','KeyX');} if(i%10===2) key('keyup','KeyX'); }
      else if (b.state==='downed' || G.finish){ if (b.state==='downed' && Math.abs(d)>b.w/2+20) key('keydown', d<0?'ArrowLeft':'ArrowRight'); else { key('keyup','ArrowLeft'); key('keyup','ArrowRight'); key('keydown','ArrowUp'); } }
      else if (b.state==='tired'){ key('keydown', d<0?'ArrowLeft':'ArrowRight'); if(i%10===0) key('keydown','KeyX'); if(i%10===2) key('keyup','KeyX'); }
      else {
        if (i%6===1) { key('keydown', d<0?'ArrowLeft':'ArrowRight'); }
        if (i%6===3) { key('keyup','ArrowLeft'); key('keyup','ArrowRight'); }
        if (P.wax>=33 && i%20===5){ key('keydown','KeyE'); bolts++; } if(i%20===7) key('keyup','KeyE');
      }
      if (P.wax<33) waxLow++;
      if (i%45===0) key('keydown','Space'); if (i%45===20) key('keyup','Space');
      try { rafCb(now); } catch(e){ errs++; if(errs<3) console.log('ERR',e.message,e.stack.split('\n')[1]); }
      maxWick=Math.max(maxWick, G.enemies.filter(e=>e.wickling).length); if (P.hp<minHp){ src[(G.shots.length?'shot':'')+(G.drops.length?'drop':'')+(G.waves.length?'wave':'')+(G.enemies.some(e=>e.wickling&&Math.abs(e.x-P.x)<16)?'wick':'')||'contact']=(src[(G.shots.length?'shot':'')+(G.drops.length?'drop':'')+(G.waves.length?'wave':'')+(G.enemies.some(e=>e.wickling&&Math.abs(e.x-P.x)<16)?'wick':'')||'contact']||0)+1; } minHp=Math.min(minHp,P.hp); if(G.boss) minB=Math.min(minB,G.boss.hp);
    }
    console.log(c, 'bossMinHp', minB, 'hurtBy', JSON.stringify(src)); console.log(c, JSON.stringify({errs, boss0, bossHp:G.boss?G.boss.hp:'defeated', winT:G.winT>0, room:G.room.def.id, deaths:G.deaths, states, maxWick, boltPresses:bolts, minHp, waxLowFrac:+(waxLow/5400).toFixed(2)}));
  }
}