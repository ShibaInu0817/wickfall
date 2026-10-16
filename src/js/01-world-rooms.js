// ---------- helpers
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const approach = (v, t, a) => v < t ? Math.min(v + a, t) : Math.max(v - a, t);
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
const rand = (a = 0, b = 1) => a + Math.random() * (b - a);
function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function seeded(s) { return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// ---------- rooms
const ROOM_DEFS = [
  // a short, safe lesson room; walking out the right side leads to Wickhollow
  // a short, safe lesson room. Each lesson is built for its move; sealed gates open once you have done it.
  { id:'tut', ch:1, tut:true, theme:0, name:'The First Light', note:'A short lesson before the deep', w:72, build(r) {
      r.rect(0,0,72,1,'#'); r.rect(0,13,72,4,'#'); r.rect(0,0,1,17,'#'); r.rect(71,0,1,13,'#'); r.rect(71,5,1,4,' ');
      r.rect(12,12,2,1,'#'); r.rect(17,10,2,3,'#');            // a step, then a wall that needs a held jump
      r.rect(24,13,5,1,' '); r.rect(24,14,5,1,'^');             // a gap just too far to jump, easy with a dash
      r.rect(38,1,1,12,'#'); r.rect(47,1,1,12,'#'); r.rect(53,1,1,12,'#'); // sealed gates
      r.rect(58,13,5,1,'^');                                    // spines under the lantern
      r.rect(63,9,8,4,'#');                                     // a ledge too high to jump: bounce off the lantern
      r.ent('S',2,12); r.ent('P',4,12);
      r.ent('T',7,12,'move'); r.ent('T',10,12,'jump'); r.ent('T',21,12,'dash');
      r.ent('T',32,12,'slash'); r.ent('D',35,12,'side'); r.ent('G',38,0,'slash');
      r.ent('T',41,12,'upslash'); r.ent('H',44,10,'up'); r.ent('G',47,0,'upslash');
      r.ent('T',50,12,'focus'); r.ent('G',53,0,'focus');
      r.ent('T',56,12,'pogo'); r.ent('L',60,10,'down');
      r.ent('T',66,8,'exit');
  }},
  { id:'hollow', ch:1, theme:0, name:'Wickhollow', note:'Where the first candles were set', w:60, build(r) {
      r.rect(0,0,60,1,'#'); r.rect(0,13,60,4,'#'); r.rect(0,0,1,17,'#'); r.rect(59,0,1,13,'#'); r.rect(59,8,1,4,' ');
      r.rect(11,12,2,1,'#');
      r.rect(16,13,3,1,' '); r.rect(16,14,3,1,'^');
      r.rect(25,10,3,1,'=');
      r.rect(30,9,3,4,'#');
      r.rect(39,13,3,1,' '); r.rect(39,14,3,1,'^');
      r.rect(44,8,4,1,'=');
      r.rect(50,12,9,1,'#');
      r.ent('S',2,12); r.ent('P',5,12); r.ent('C',22,12); r.ent('C',45,12); r.ent('F',47,5); r.ent('b',56,11);
      r.ent('o',31,8); r.ent('o',45,7);
      r.ent('d',35,1); r.ent('w',53,6);
      r.rect(30,10,3,3,'~'); r.ent('y',31,12,'1');               // the pillar is hollow: a lore stone inside
  }},
  { id:'drip', ch:1, theme:1, name:'The Drip', note:'Mind the spines below', w:70, build(r) {
      r.rect(0,0,70,1,'#'); r.rect(0,13,70,4,'#'); r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' '); r.rect(69,0,1,13,'#'); r.rect(69,9,1,4,' ');
      r.rect(7,13,50,1,'^');
      r.rect(10,11,3,1,'='); r.rect(16,10,3,1,'='); r.rect(22,11,3,1,'=');
      r.rect(29,10,3,4,'#');
      r.rect(36,9,3,1,'='); r.rect(43,10,3,1,'='); r.rect(52,11,3,1,'=');
      r.ent('a',2,12); r.ent('F',20,6); r.ent('C',30,9); r.ent('F',50,7); r.ent('F',58,8); r.ent('S',65,12); r.ent('b',67,12);
      r.ent('o',37,8); r.ent('o',17,8); r.ent('M',60,12,'bolt');
      r.ent('w',40,5); r.ent('d',33,1);
      r.rect(61,10,3,3,'#'); r.rect(61,11,3,2,'~'); r.ent('x',62,12,'1');   // an old kiln block by the smith, hollow inside
  }},
  { id:'cinder', ch:1, theme:2, name:'Cinder Chamber', note:'Something old keeps the flame here', w:40, build(r) {
      r.rect(0,0,40,1,'#'); r.rect(0,13,40,4,'#'); r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' '); r.rect(39,0,1,13,'#');
      r.rect(8,9,4,1,'='); r.rect(28,9,4,1,'=');
      r.ent('a',2,12); r.ent('K',27,11);
  }}
];
// ----- Chapter 2: The Sunken Chandlery
ROOM_DEFS.push(
  { id:'locks', ch:2, theme:3, name:'Lamplit Locks', note:'The bolt reaches what the blade cannot', w:72, build(r) {
      r.rect(0,0,72,1,'#'); r.rect(0,13,72,4,'#'); r.rect(0,0,1,17,'#'); r.rect(71,0,1,13,'#'); r.rect(71,9,1,4,' ');
      r.rect(22,13,12,1,' '); r.rect(22,14,12,1,'^');           // a chasm with a spitter waiting past it
      r.rect(24,10,3,1,'='); r.rect(29,10,3,1,'=');
      r.rect(35,10,3,3,'#');
      r.rect(40,11,2,1,'='); r.rect(42,9,2,1,'='); r.rect(44,7,3,1,'=');   // climb level with the brazier
      r.rect(54,1,1,12,'#');                                    // the sealed lock gate
      r.rect(59,13,6,1,' '); r.rect(59,14,6,1,'^'); r.rect(60,10,3,1,'=');
      r.rect(66,10,3,3,'#');
      r.ent('S',2,12); r.ent('P',4,12); r.ent('C',10,12); r.ent('C',17,12);
      r.ent('s',36,9); r.ent('z',53,6,'lock1'); r.ent('G',54,0,'lock1'); r.ent('W',39,12);
      r.ent('C',57,12); r.ent('F',63,6); r.ent('s',67,9); r.ent('b',70,12);
      r.ent('o',45,5); r.ent('o',57,12);
      r.ent('e',27,12); r.ent('h',49,1);
      r.rect(35,11,3,2,'~'); r.ent('x',36,12,'1');               // under the spitter's perch
  }},
  { id:'foundry', ch:2, theme:4, name:'Drowned Foundry', note:'Shells, sparks and a floor of wax', w:84, build(r) {
      r.rect(0,0,84,1,'#'); r.rect(0,13,84,4,'#'); r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' '); r.rect(83,0,1,13,'#'); r.rect(83,9,1,4,' ');
      r.rect(20,10,2,3,'#');
      r.rect(26,11,2,1,'='); r.rect(28,9,2,1,'='); r.rect(34,9,3,4,'#');
      r.rect(53,1,2,12,'#');                                    // a wall you can only pass underneath
      r.rect(49,14,8,2,' '); r.rect(49,13,3,1,'%'); r.rect(55,13,2,1,' '); r.rect(56,15,1,1,'#'); // cracked floor into a tunnel
      r.rect(66,10,3,1,'='); r.rect(76,10,2,3,'#');
      r.ent('a',2,12); r.ent('A',12,12); r.ent('C',17,12); r.ent('o',7,12);
      r.ent('F',31,5); r.ent('s',35,8); r.ent('o',36,6);
      r.ent('M',41,12,'dive'); r.ent('W',44,12); r.ent('S',47,12);
      r.ent('A',62,12); r.ent('F',70,6); r.ent('A',72,12); r.ent('s',76,9); r.ent('b',80,12);
      r.ent('h',24,1); r.ent('h',64,1);
      r.rect(34,10,3,3,'~'); r.ent('y',35,12,'1');               // inside the furnace block
  }},
  { id:'hall', ch:2, theme:5, name:'Chandler\u2019s Hall', note:'It hangs above, and it never comes close', w:44, build(r) {
      r.rect(0,0,44,1,'#'); r.rect(0,13,44,4,'#'); r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' '); r.rect(43,0,1,13,'#');
      r.rect(7,9,4,1,'='); r.rect(33,9,4,1,'=');
      r.ent('a',2,12); r.ent('S',3,12); r.ent('Q',30,6);
  }}
);
// ----- Chapter 3: The Kiln Below
ROOM_DEFS.push(
  { id:'burrows', ch:3, theme:6, name:'Mothlight Burrows', note:'Pale cocoons hang where the moths sleep', w:76, build(r) {
      r.rect(0,0,76,1,'#'); r.rect(0,13,76,4,'#'); r.rect(0,0,1,17,'#'); r.rect(75,0,1,13,'#'); r.rect(75,9,1,4,' ');
      r.rect(9,10,3,1,'='); r.rect(14,8,3,1,'=');
      r.rect(23,13,8,1,' '); r.rect(23,14,8,1,'^'); r.rect(25,10,2,1,'='); r.rect(29,9,2,1,'=');
      r.rect(44,1,2,12,'#');                                     // a wall you can only pass beneath
      r.rect(38,14,10,2,' '); r.rect(38,13,3,1,'%'); r.rect(46,13,2,1,' '); r.rect(47,15,1,1,'#'); // white wax floor into a tunnel
      r.rect(51,10,2,1,'='); r.rect(54,8,3,1,'=');               // climb level with the brazier
      r.rect(62,1,1,12,'#');                                     // the brazier gate
      r.rect(66,11,3,1,'=');
      r.ent('S',2,12); r.ent('P',4,12); r.ent('W',7,12);
      r.ent('c',11,6); r.ent('c',16,4); r.ent('F',19,6); r.ent('c',27,6);
      r.ent('C',33,12); r.ent('W',36,12); r.ent('c',41,7);
      r.ent('F',50,6); r.ent('z',59,7,'moth1'); r.ent('G',62,0,'moth1'); r.ent('W',49,12);
      r.ent('c',65,7); r.ent('c',69,6); r.ent('F',70,7); r.ent('b',73,12);
      r.ent('g',35,12); r.ent('m',56,5);
      r.rect(18,10,3,3,'#'); r.rect(18,11,3,2,'~'); r.ent('x',19,12,'1');   // a wax-sealed nest by the chasm
  }},
  { id:'stair', ch:3, theme:7, name:'The Kiln Stair', note:'Heat rises, and so must you', w:72, build(r) {
      r.rect(0,0,72,1,'#'); r.rect(0,13,72,4,'#'); r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' '); r.rect(71,0,1,13,'#'); r.rect(71,9,1,4,' ');
      r.rect(14,10,3,3,'#');
      r.rect(22,10,3,1,'='); r.rect(25,8,2,1,'='); r.rect(28,6,2,1,'='); r.rect(30,5,2,8,'#');   // over the kiln wall
      r.rect(34,13,14,1,' '); r.rect(34,14,14,1,'^'); r.rect(36,10,3,1,'='); r.rect(41,9,3,1,'='); r.rect(46,10,2,1,'=');
      r.rect(64,1,2,12,'#');                                     // pass beneath the last wall
      r.rect(58,14,12,2,' '); r.rect(58,13,3,1,'%'); r.rect(68,13,2,1,' '); r.rect(69,15,1,1,'#');
      r.ent('a',2,12); r.ent('S',4,12); r.ent('A',10,12); r.ent('s',15,9); r.ent('W',20,12);
      r.ent('c',24,4); r.ent('A',33,12); r.ent('F',40,6); r.ent('c',43,5);
      r.ent('A',52,12); r.ent('W',55,12); r.ent('c',57,7); r.ent('F',61,7); r.ent('b',70,12);
      r.ent('g',50,12); r.ent('m',24,3);
      r.rect(14,11,3,2,'~'); r.ent('y',15,12,'1');               // under the first spitter
  }},
  { id:'kiln', ch:3, theme:8, name:'The Kiln Pit', note:'Something swims beneath the crust', w:32, build(r) {
      r.rect(0,0,32,1,'#'); r.rect(0,13,32,4,'#'); r.rect(0,0,1,13,'#'); r.rect(0,9,1,4,' '); r.rect(31,0,1,13,'#');
      r.ent('a',2,12); r.ent('S',3,12); r.ent('Y',16,12);
  }}
);
ROOM_DEFS.push({ id:'gallery', ch:0, theme:0, name:'Gallery', note:'Every move and every boss attack, on demand', w:40, build(r) {
  r.rect(0,0,40,1,'#'); r.rect(0,13,40,4,'#'); r.rect(0,0,1,17,'#'); r.rect(39,0,1,17,'#');
  r.rect(5,9,4,1,'='); r.rect(31,9,4,1,'=');
  r.ent('S',2,12); r.ent('P',8,12); r.ent('D',14,12,'side');
}});
const GAL_ROOM = ROOM_DEFS.length - 1;
function makeRoom(def) {
  const w = def.w, h = 17, g = [], ents = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(0));
  const map = { '#':1, '^':2, '=':3, ' ':0, '%':1, '~':0 }, cracks = [], veils = [];   // '~' looks like rock but is open: a hidden alcove
  def.build({
    rect(x, y, ww, hh, c) { for (let j = y; j < y + hh; j++) for (let i = x; i < x + ww; i++) if (i >= 0 && i < w && j >= 0 && j < h) { g[j][i] = map[c]; if (c === '%') cracks.push(i + ',' + j); if (c === '~') veils.push([i, j]); } },
    ent(type, x, y, data) { ents.push({ type, x, y, data }); }
  });
  return { def, w, h, g, ents, cracks, veils };
}
const FIRST = 1; // Wickhollow, the first real chamber
const CHAPTERS = {
  1:{ name:'The Wick Depths', first:1, stages:'Wickhollow · The Drip · Cinder Chamber', skills:{} },
  2:{ name:'The Sunken Chandlery', first:4, stages:'Lamplit Locks · Drowned Foundry · Chandler\u2019s Hall', skills:{ bolt:true } },
  3:{ name:'The Kiln Below', first:ROOM_DEFS.findIndex(d => d.id === 'burrows'), stages:'Mothlight Burrows · The Kiln Stair · The Kiln Pit', skills:{ bolt:true, dive:true } }
};
const COST = 3; // coins per skill at a blacksmith
