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
eval(src.replace("'use strict';","'use strict'; global.__G=()=>G; global.__P=()=>P; global.__new=(c,m)=>{G.char=c; newGame(m);}; global.__room=(i,e)=>loadRoom(i,e||'a'); global.__F={hurtPlayer:(...a)=>hurtPlayer(...a), SK:()=>SK, skDmg:(i)=>skDmg(i), ROOMS:()=>ROOM_DEFS};"));
const key=(type,code)=>handlers[type].forEach(f=>f({code,repeat:false,preventDefault:noop}));
const R=()=>__F.ROOMS(), idx=id=>R().findIndex(d=>d.id===id);
function frames(n, fn){ let errs=0; for(let i=0;i<n;i++){ now+=8.33; if(fn) fn(i); try{ rafCb(now);}catch(e){ errs++; if(errs<4) console.log('ERR',e.message, e.stack.split('\n').slice(1,3).join(' | ')); } } return errs; }
const hero=process.env.HC||'snuff';
// 1. every chapter 3 room loads and runs
__new(hero,'ch3'); let G=__G();
console.log('start', G.room.def.id, 'skills', JSON.stringify(G.skills), 'wax', __P().wax, 'chapter', G.chapter);
for (const id of ['burrows','stair','kiln']) { __room(idx(id), id==='burrows'?'P':'a'); const e=frames(400,i=>{ if(i%30===0) key('keydown','KeyX'); if(i%30===3) key('keyup','KeyX'); }); console.log('room', id, 'errs', e, 'enemies', __G().enemies.map(x=>x.type+(x.cinder?'*':'')).join(','), 'boss', __G().boss && __G().boss.kind); }
// 2. the kiln fight, with a bot that dives at the right moments
__new(hero,'ch3'); __room(idx('kiln'),'a'); G=__G();
const st={}, seen=new Set(); let stuns=0, mstuns=0, errs=0, phase='wyrm', minHp=99, hurtCount=0, lastHp=__P().hp, won=false, fin=null, smith=false;
key('keydown','ArrowRight'); errs+=frames(240); key('keyup','ArrowRight');
for (let i=0;i<120*240 && !won;i++){
  now+=8.33; const P=__P(), B=__G().boss; G=__G();
  if (P.hp<lastHp) hurtCount++; lastHp=P.hp; minHp=Math.min(minHp,P.hp); P.hp=Math.max(P.hp,2); // keep the bot alive to test the whole flow
  if (B && B.state!=='stun') B._prev=B.state;
  if (B) { seen.add(B.kind+':'+B.state); st[B.kind+':'+B.state]=(st[B.kind+':'+B.state]||0)+1; }
  if (B && B.kind==='wyrm' && ['biteUp','quakeUp'].includes(B.state) && B.t < 1.0 && !P.dive && P.wax>=33) {
    const hx=B.hx; P.x=hx-P.w/2; P.y=13*16-40-12-30; P.vy=0; P.grounded=false; key('keydown','ArrowDown'); key('keydown','KeyE');
  }
  if (B && B.kind==='moth' && ['fly','recover','perch'].includes(B.state) && !P.dive && P.wax>=33 && i%60===0) {
    P.x=B.x+B.w/2-P.w/2; P.y=B.y-30; P.vy=0; P.grounded=false; key('keydown','ArrowDown'); key('keydown','KeyE');
  }
  if (B && B.kind==='moth' && B.state==='slash' && B.green>=0 && !B.pfail) { const bx=B.x+B.w/2; if (Math.abs(bx-P.x-P.w/2)<56) { P.face=Math.sign(bx-P.x-P.w/2)||1; key('keydown','KeyX'); global.parries=(global.parries||0)+1; } }
  if (B && B.kind==='moth' && B.state==='slash' && B.green<0) key('keyup','KeyX');
  if (B && B.kind==='wyrm' && B.state!=='stun' && P.grounded) P.x=Math.max(7*16, Math.min(25*16, P.x));
  if (P.wax<33) P.wax=Math.min(99,P.wax+0.2); // stand-in for picking up wax bits the bot ignores
  if (B && B.state==='stun') { const bx=B.x+B.w/2; if (P.grounded) { P.x=bx-30*Math.sign(bx-P.x-1||1)-P.w/2; } if(i%14===0) key('keydown','KeyX'); if(i%14===3) key('keyup','KeyX'); }
  if (B && B.state==='downed') { P.x=B.x+B.w/2-P.w/2-20; key('keydown','ArrowUp'); }
  if (G.finish && !fin) fin=G.finish.def.name;
  if (G.smith && G.smith.free) { smith=true; P.x=G.smith.x+8-P.w/2; P.y=12*16+16-P.h; if(i%20===0) key('keydown','ArrowUp'); if(i%20===5) key('keyup','ArrowUp'); }
  try{ rafCb(now);}catch(e){ errs++; if(errs<4) console.log('ERR',e.message, e.stack.split('\n').slice(1,3).join(' | ')); }
  key('keyup','KeyE'); key('keyup','ArrowDown'); if (!(B && B.state==='downed')) key('keyup','ArrowUp');
  if (__G().boss && __G().boss!==B && __G().boss.kind==='moth') phase='moth';
  if (B && B.state==='stun' && !B._c){ B._h0=B.hp; B._c=1; (global.from=global.from||[]).push(B.kind+':'+(B._prev||'?')); if(B.kind==='wyrm') stuns++; else mstuns++; }
  if (B && B.state!=='stun' && B._c) { (global.dmg=global.dmg||[]).push(B.kind[0]+Math.round((B._h0-B.hp)*10)/10); B._c=0; }
  if (__G().state==='won') won=true;
}
G=__G();
console.log(hero, JSON.stringify({errs, phase, stuns, mstuns, minHp, hurtCount, fin, smith, won, flare:!!G.skills.flare, ledges:G.ledges&&G.ledges.length, bossDown:G.bossDown, t:Math.round(G.time)}));
console.log('parry presses', global.parries||0); console.log('stunned from', (global.from||[]).join(' '));
console.log('dmg per stun (after dive)', (global.dmg||[]).join(' '));
console.log('states', JSON.stringify(st));
