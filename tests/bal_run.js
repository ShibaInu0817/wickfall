const src=require('fs').readFileSync('g.js','utf8');
const noop=()=>{}; const grad={addColorStop:noop};
const chk=(n,args)=>{ for (const v of args) if (typeof v==='number' && isNaN(v)) throw new Error(n+' NaN '+JSON.stringify(args)); };
const fns={}; for (const n of ['arc','ellipse','moveTo','lineTo','quadraticCurveTo','fillRect','translate','scale','rotate','drawImage']) fns[n]=(...a)=>{ chk(n,a); if(n==='arc'&&a[2]<0) throw new Error('arc neg '+a[2]); if(n==='ellipse'&&(a[2]<0||a[3]<0)) throw new Error('ellipse neg'); };
const ctx=new Proxy(fns,{get:(t,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>grad:(k in t?t[k]:noop),set:(t,k,v)=>{t[k]=v;return true}});
function el(){return {getContext:()=>ctx,querySelector:()=>el(),querySelectorAll:()=>[],addEventListener:noop,removeEventListener:noop,classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},setAttribute:noop,appendChild:noop,dataset:{},style:{setProperty:noop,removeProperty:noop},textContent:'',innerHTML:'',hidden:false,clientWidth:740,clientHeight:360,offsetWidth:100,offsetHeight:40,getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:100,width:100,height:100}),setPointerCapture:noop,blur:noop,closest:()=>null,open:false,scrollIntoView:noop,width:0,height:0}}
const handlers={};
global.window=global; window.addEventListener=(k,f)=>{(handlers[k]=handlers[k]||[]).push(f)}; window.innerWidth=800; window.innerHeight=400;
global.document={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),addEventListener:noop,body:el(),documentElement:el(),activeElement:null};
global.matchMedia=()=>({matches:false,addEventListener:noop}); global.localStorage={getItem:()=>null,setItem:noop};
global.screen={width:800,height:400}; global.navigator={};
let now=0; global.performance={now:()=>now}; let rafCb=null; global.requestAnimationFrame=f=>{rafCb=f};
global.setTimeout=()=>0; global.clearTimeout=noop;
eval(src.replace("'use strict';","'use strict'; global.__G=()=>G; global.__P=()=>P; global.__new=(c,m)=>{G.char=c; newGame(m);}; global.__room=(i,e)=>loadRoom(i,e||'a'); global.__mk={slag:(x,y)=>mkSlag(x,y),wisp:(x,y)=>mkWisp(x,y),GAL:()=>GAL_ROOM}; global.__F={enterGallery:()=>enterGallery(), galRun:(m)=>galRun(GAL_MOVES[m]), galSpawn:(k)=>galSpawn(k), galBoss:(m)=>galBoss(m), galEntrance:()=>galEntrance(), MOVES:()=>Object.keys(GAL_MOVES), hurtPlayer:(...a)=>hurtPlayer(...a), SK:()=>SK, skDmg:(i)=>skDmg(i), ROOMS:()=>ROOM_DEFS};"));
const key=(type,code)=>handlers[type].forEach(f=>f({code,repeat:false,preventDefault:noop}));
function frames(n, f){ for(let i=0;i<n;i++){ now+=16.7; if(f) f(i); rafCb(now);} }
function flat(c){ __new(c,'ch1'); __F.enterGallery(); const G=__G(); G.gal=null; G.boss=null; G.enemies=[]; G.puddles=[]; G.hits=0; const P=__P(); P.hp=P.maxHp=99; return {G,P}; }
function slagBehind(c, gap){
  const {G,P}=flat(c); const e=__mk.slag(8*16, 12*16); e.dir=1; G.enemies.push(e); frames(30);
  let swings=0, hits0=G.hits, hp0=e.hp, burnFrames=0;
  frames(360, i=>{ if(e.dead) return; P.x = e.x - gap - P.w; P.y = e.y + e.h - P.h; P.vx=0; P.vy=0; P.face=1; P.inv=0;
    for (const pd of G.puddles) if (P.x+P.w > pd.x+2 && P.x < pd.x+pd.w-2) { burnFrames++; break; }
    if(i%18===0){ key('keydown','KeyX'); } if(i%18===2) key('keyup','KeyX'); });
  return { gap, killed:!!e.dead || e.hp<=0, dmgDealt:hp0-Math.max(0,e.hp), hitsTaken:G.hits-hits0, inFireSec:+(burnFrames/60).toFixed(1) };
}
function wisp(c){
  const {G,P}=flat(c); P.x=20*16; P.y=13*16-P.h; const e=__mk.wisp(28*16, 10*16); G.enemies.push(e);
  let reach=null; frames(900, i=>{ if(reach==null && (e.dead || Math.hypot(e.x-P.x,e.y-P.y)<14)) reach=(i/60).toFixed(1); });
  return { secondsToReachIdleHero:reach, hitsTaken:G.hits };
}
for (const c of ['snuff','knight','hero']) { console.log(c, 'slag', [6,14,24].map(g=>JSON.stringify(slagBehind(c,g))).join(' ')); console.log(c,'wisp',JSON.stringify(wisp(c))); }
function slagApproach(c){
  const {G,P}=flat(c); const e=__mk.slag(14*16, 12*16); e.dir=1; G.enemies.push(e); frames(150); // let a trail build
  P.x = e.x - 90; P.y = e.y + e.h - P.h; let burn=0, t=0, hits0=G.hits; const reach = c==='snuff'?8:16;
  frames(420, i=>{ if(e.dead) return; t=i; P.face=1; const gap = e.x - (P.x+P.w);
    for (const pd of G.puddles) if (P.x+P.w > pd.x+2 && P.x < pd.x+pd.w-2) { burn++; break; }
    if (gap > reach) { key('keydown','ArrowRight'); } else { key('keyup','ArrowRight'); if(i%18===0) key('keydown','KeyX'); if(i%18===2) key('keyup','KeyX'); } });
  key('keyup','ArrowRight');
  return { killed:!!e.dead||e.hp<=0, sec:+(t/60).toFixed(1), inFireSec:+(burn/60).toFixed(2), hits:G.hits-hits0 };
}
for (const c of ['snuff','knight','hero']) console.log(c,'approach',JSON.stringify(slagApproach(c)));
