const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.PE=require('../engine.js');const art=require('../traveller-art.js'),equipment=require('../equipment.js'),PNG=require('../scripts/png.cjs'),rig=require('../scripts/bake-traveller.cjs');
const ART=path.join(__dirname,'../assets/art-v2'),meta=JSON.parse(fs.readFileSync(path.join(ART,'traveller.json'),'utf8')),sheet=PNG.decode(fs.readFileSync(path.join(ART,'traveller.png')));
const TAU=Math.PI*2,ids=meta.frames.map(f=>f.id),id=i=>art.frames[i].id;

// Baked table, metadata and sheet agree; 64×80 cels on the shared [32,76] anchor.
assert.equal(art.frames.length,meta.frames.length);
meta.frames.forEach((f,i)=>{assert.equal(art.frames[i].id,f.id);assert.deepEqual(art.frames[i].rect,f.rect);assert.deepEqual(art.frames[i].hand,f.hand);assert.deepEqual(f.anchor,[32,76]);assert.equal(f.rect[2],64);assert.equal(f.rect[3],80);});
for(const [prefix,n] of [['idle-',4],['walk-',8],['run-',8],['crouch-',6],['start-',2],['stop-',2],['turn-',2]])for(let i=0;i<n;i++)assert.ok(ids.includes(prefix+i),prefix+i);
assert.ok(ids.includes('stop-brake')&&ids.includes('crouch-idle'));

// Same character everywhere: boots end on the ground row, head height within ±1 px across upright states.
const bounds=f=>{let top=99,bottom=-1;for(let y=0;y<80;y++)for(let x=0;x<64;x++)if(sheet.data[((f.rect[1]+y)*sheet.width+f.rect[0]+x)*4+3]){top=Math.min(top,y);bottom=Math.max(bottom,y);}return {top,bottom};};
const idleTop=bounds(meta.frames[0]).top;
for(const f of meta.frames){const b=bounds(f);assert.ok(b.bottom<=75,f.id+' stays above ground');
  if(!/^run-[37]$/.test(f.id))assert.equal(b.bottom,75,f.id+' boots on the ground');
  if(/^(idle|walk|start|stop-[01]|turn)/.test(f.id))assert.ok(Math.abs(b.top-idleTop)<=1,f.id+' height ±1 px');
  if(/^run/.test(f.id))assert.ok(Math.abs(b.top-idleTop)<=2,f.id+' running lean keeps height');}

// Feet do not slide: a stance foot's world x (body travel + cel ankle) is constant to ±1 px across its stance cels.
for(const gait of ['walk','run','crouch']){const g=meta.gaits[gait],cels=meta.frames.filter(f=>f.state===gait&&f.phase!=null);assert.equal(cels.length,g.cels);
  for(const [key,offset] of [['nearAnkle',0],['farAnkle',.5]]){const stance=cels.filter(f=>((f.phase+offset)%1)<g.duty);assert.ok(stance.length>=2,gait+' has stance cels');
    const world=stance.map(f=>Math.round(f[key][0])+g.cyclePx*((f.phase+offset)%1));
    const span=Math.max(...world)-Math.min(...world);assert.ok(span<=1+1e-9,`${gait} ${key} slides ${span.toFixed(2)} px`);
    for(const f of stance)assert.ok(f[key][1]>=68,gait+' stance foot stays planted');}}

// Engine stride speed = speed × 2π / cycle, so cels follow ground travel (also when wading).
for(const [mode,keys,cycle] of [['walk',{KeyD:true},meta.gaits.walk.cyclePx],['run',{KeyD:true,ShiftLeft:true},meta.gaits.run.cyclePx],['crouch',{KeyD:true},meta.gaits.crouch.cyclePx]]){
  const e=new PE.Engine();e.start();const p=e.state.player;p.crouching=mode==='crouch';Object.assign(e.keys,keys);const x0=p.x,s0=p.stride;for(let i=0;i<30;i++)e.update(1/60);
  assert.ok(Math.abs((p.stride-s0)-(p.x-x0)*TAU/cycle)<1e-6,mode+' stride synchronised to travel');}

// Pure cel choice from stride phase; walk ↔ run keeps the cycle position (same foot).
const e=new PE.Engine();e.start();const p=e.state.player;
for(let k=0;k<8;k++){const stride=(k+.5)/8*TAU;
  Object.assign(p,{moving:true,running:false,crouching:false,stride});assert.equal(id(art.frame(p)),'walk-'+k);
  p.running=true;assert.equal(id(art.frame(p)),'run-'+k,'run continues from the same phase');}
for(let k=0;k<6;k++){Object.assign(p,{moving:true,running:false,crouching:true,stride:(k+.5)/6*TAU});assert.equal(id(art.frame(p)),'crouch-'+k);}
Object.assign(p,{moving:false,crouching:true});assert.equal(id(art.frame(p)),'crouch-idle');
p.crouching=false;assert.deepEqual([0,.7,1.3,1.9].map(t=>id(art.frame(p,null,t))),['idle-0','idle-1','idle-2','idle-3']);
for(const stride of [NaN,Infinity,-1e6,1e9]){p.stride=stride;p.moving=true;assert.ok(Number.isInteger(art.frame(p))&&art.frame(p)>=0&&art.frame(p)<art.frames.length);}

// Transitions: start, stop (walk/run) and turn always show in-between cels before the cycle.
{const memo={},seq=(state,t)=>{Object.assign(p,state);return id(art.frame(p,memo,t));};p.stride=0;p.facing=1;
  assert.equal(seq({moving:false,running:false,crouching:false},0),'idle-0');
  assert.equal(seq({moving:true},1),'start-0');assert.equal(seq({},1.07),'start-1');assert.match(seq({},1.13),/^walk-/);
  assert.equal(seq({moving:false},2),'stop-0');assert.equal(seq({},2.1),'stop-1');assert.match(seq({},2.2),/^idle-/);
  seq({moving:true,running:true},3);seq({},3.5);assert.equal(seq({moving:false,running:false},4),'stop-brake');assert.equal(seq({},4.1),'stop-0');assert.equal(seq({},4.17),'stop-1');assert.match(seq({},4.3),/^idle-/);
  assert.equal(seq({facing:-1},5),'turn-0');assert.equal(seq({},5.06),'turn-1');assert.match(seq({},5.2),/^idle-/);
  p.moving=true;const before=JSON.stringify(e.state);seq({},6);assert.equal(JSON.stringify(e.state),before);}

// Drawing: every cel × facing × tool uses the cel hand for grips and never mutates simulation state.
const calls=[],ctx=new Proxy({drawImage(...args){calls.push(['image',...args]);},translate(...args){calls.push(['translate',...args]);},scale(...args){calls.push(['scale',...args]);}},{get:(o,k)=>o[k]||(()=>{})});
const layer={width:140,height:116,getContext:()=>ctx},r={c:ctx,sprites:{},artTraveller:{id:'new'},visualV2:true,makeCanvas:()=>layer,sprite(){calls.push(['old']);},pose(){calls.push(['old-pose']);},petImage:{id:'pet'},seatedImage:{id:'seated'}};
const states=[{moving:false,running:false,crouching:false},{moving:true,running:false,crouching:false,stride:1},{moving:true,running:true,crouching:false,stride:4},{moving:true,running:false,crouching:true,stride:2},{moving:false,running:false,crouching:true}];
for(const st of states)for(const facing of [-1,1])for(const tool of [null,'puukko','knife','flintaxe','axe','bow','rod']){
  Object.assign(p,st,{facing,sitting:false});e.state.equipped=tool;r._travellerMotion=undefined;calls.length=0;const before=JSON.stringify(e.state);
  assert.equal(equipment.drawActor(r,e),true);assert.equal(JSON.stringify(e.state),before);
  const drawn=calls.filter(a=>a[0]==='image'&&a[1]===r.artTraveller);assert.equal(drawn.length,1);assert.ok(!calls.some(a=>a[0]==='old'));assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===facing));
  const f=art.frames.find(f=>f.rect.every((v,i)=>v===drawn[0][2+i]));assert.ok(f,'draws a baked cel');
  if(tool){const g=f.grip;assert.ok(calls.some(a=>a[0]==='translate'&&a[1]===67+g[0]&&a[2]===101+g[1]),'tool uses cel hand');}}
Object.assign(p,{moving:false,running:false,crouching:false,sitting:true});calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.seatedImage));assert.ok(!calls.some(a=>a[0]==='image'&&a[1]===r.artTraveller));
p.sitting=false;e.action={target:{type:'pet'},time:0};calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.petImage));e.action=null;e.state.equipped=null;r.artTraveller=null;calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='old'));r.artTraveller={};calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.artTraveller));
assert.equal(typeof rig.footAt,'function');
console.log(`PASS traveller rig: ${art.frames.length} baked cels, planted feet, stride=travel, phase-kept gait switch, start/stop/turn transitions, grips and immutable simulation.`);
