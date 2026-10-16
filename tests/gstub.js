const src=require('fs').readFileSync('g.js','utf8');
const noop=()=>{}; const grad={addColorStop:noop};
const ctx=new Proxy({},{get:(t,k)=>k==='createLinearGradient'||k==='createRadialGradient'?()=>grad:(k in t?t[k]:noop),set:(t,k,v)=>{t[k]=v;return true}});
function el(){const e={getContext:()=>ctx,querySelector:()=>el(),querySelectorAll:()=>[],addEventListener:noop,removeEventListener:noop,classList:{toggle:noop,add:noop,remove:noop,contains:()=>false},setAttribute:noop,appendChild:noop,dataset:{},style:{setProperty:noop,removeProperty:noop},textContent:'',innerHTML:'',hidden:false,clientWidth:740,clientHeight:360,offsetWidth:100,offsetHeight:40,getBoundingClientRect:()=>({left:0,top:0,right:100,bottom:100,width:100,height:100}),setPointerCapture:noop,blur:noop,closest:()=>null,open:false,scrollIntoView:noop};return e}
const handlers={};
global.window=global; window.addEventListener=(k,f)=>{(handlers[k]=handlers[k]||[]).push(f)}; window.innerWidth=800; window.innerHeight=400;
global.document={getElementById:()=>el(),createElement:()=>el(),querySelectorAll:()=>[],querySelector:()=>el(),addEventListener:noop,body:el(),documentElement:el(),activeElement:null};
global.matchMedia=()=>({matches:false,addEventListener:noop}); global.localStorage={getItem:()=>null,setItem:noop};
global.screen={width:800,height:400}; global.navigator={};
let now=0; global.performance={now:()=>now}; let frames=0; let rafCb=null; global.requestAnimationFrame=f=>{rafCb=f};
global.setTimeout=()=>0; global.clearTimeout=noop;
eval(src.replace("'use strict';","'use strict'; global.__G=()=>G; global.__P=()=>P; global.__new=()=>{G.char='knight'; newGame();};"));
__new();
const key=(type,code)=>handlers[type].forEach(f=>f({code,repeat:false,preventDefault:noop}));
let maxCombo=0, fins=0, burns=0, errs=0;
for(let i=0;i<1200;i++){ now+=16.7; if(i%14===0){ key('keydown','KeyX'); } if(i%14===2) key('keyup','KeyX'); if(i>600&&i<640) key('keydown','ArrowRight'); if(i===640) key('keyup','ArrowRight');
  try{ rafCb(now);}catch(e){ errs++; if(errs<3) console.log('ERR',e.stack.split('\n').slice(0,3).join(' | ')); }
  const P=__P(); maxCombo=Math.max(maxCombo,P.combo); if(P.fin&&P.atkT>0) fins++; burns=Math.max(burns,__G().spells.filter(s=>s.k==='burn').length); }
console.log({maxCombo, finFrames:fins, burnsSeen:burns, errs, swAng:__P().swAng.toFixed(2), state:__G().state});
