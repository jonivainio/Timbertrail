// Portable contracts; pixel containment is checked separately in the native review.
const assert=require('node:assert/strict');
global.PERegions=require('../regions.js');global.PE=require('../engine.js');
require('../visual-core.js');global.PEWorldArt={};global.PETerrainSurface={socket(){}};
const art=require('../visual-world.js');
for(const dayTime of [0,.22,.3,.47,.73,.9,1]){const clear=art.sunState({dayTime,weather:'calm'}),rain=art.sunState({dayTime,weather:'rain'});assert.ok(Object.values(clear).every(Number.isFinite));assert.ok(clear.strength>=0&&clear.strength<=1);assert.ok(rain.strength<=clear.strength);}
assert.equal(art.sunState({dayTime:.93,weather:'calm'}).strength,0,'no sun shadows at night');
assert.ok(art.sunState({dayTime:.33,weather:'calm'}).side>0&&art.sunState({dayTime:.65,weather:'calm'}).side<0,'sun shadow direction changes with time of day');
let calls=0,allocations=0;
function canvas(width,height){allocations++;const c=new Proxy({canvas:null,getTransform:()=>({a:1,b:0,c:0,d:1,e:-300,f:0}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}})}, {get:(o,k)=>k in o?o[k]:()=>{}});const a={width,height,getContext:()=>c};c.canvas=a;return a;}
const r={artScale:2/3,makeCanvas:canvas,c:canvas(640,360).getContext('2d')},main=r.c;
const e={state:{camera:300,currentMap:'forest',playSeconds:25,structures:[]}};
const draw=c=>{calls++;assert.equal(c,r.c);};
art.beginReceivers(r,e);art.receiver(r,{x:600,width:40},draw);assert.equal(calls,1);assert.equal(allocations,1,'no lights allocate no receiver canvases');
e.state.structures=[{type:'fire',x:630,lit:true,fuel:150}];const saved=JSON.stringify(e.state);
for(let i=0;i<100;i++){art.beginReceivers(r,e);art.receiver(r,{x:600,width:40},draw);assert.equal(r.c,main);}
assert.equal(calls,101,'draw once per frame, not once per light');assert.equal(allocations,5,'four bounded reusable light surfaces');assert.equal(JSON.stringify(e.state),saved);
assert.throws(()=>art.receiver(r,{x:600,width:40},()=>{throw Error('draw failed');}),/draw failed/);assert.equal(r.c,main,'restore renderer after failure');
for(const fuel of [0,-1,NaN,Infinity]){e.state.structures[0].fuel=fuel;art.beginReceivers(r,e);assert.equal(art.state(r).fires.length,0);}
e.state.structures[0].fuel=100;e.state.structures[0].lit=false;art.beginReceivers(r,e);assert.equal(art.state(r).fires.length,0);
e.state.structures[0].lit=true;e.state.structures[0].type='shelter';art.beginReceivers(r,e);assert.equal(art.state(r).fires.length,0);
e.state.structures[0].type='fire';e.state.structures[0].x=3000;art.beginReceivers(r,e);assert.equal(art.state(r).fires.length,0);
console.log('PASS receiver draw-once/pure-state contracts, bounded buffers, extinguish/fuel/type/distance gates and failure restoration.');
const cabin=require('../cabin-pixels.js'),home={currentMap:'pond',cabinRepairs:{facade:true,roof:true,yard:true},dayTime:.93,playSeconds:25,cabinHome:{fire:{lit:true,fuel:100},lantern:false,shutters:true}},before=JSON.stringify(home);
const night=cabin.windowStrength(home);assert.ok(night>.5&&night<.6);home.dayTime=.47;assert.ok(cabin.windowStrength(home)<night*.25);home.dayTime=.93;
home.cabinHome.shutters=false;assert.ok(cabin.windowStrength(home)<night*.3);home.cabinHome.shutters=true;
home.cabinHome.fire.lit=false;assert.equal(cabin.windowStrength(home),0);home.cabinHome.lantern=true;assert.ok(cabin.windowStrength(home)>0);home.cabinHome.lantern=false;home.cabinHome.fire.lit=true;
for(const fuel of [0,NaN,Infinity]){home.cabinHome.fire.fuel=fuel;assert.equal(cabin.windowStrength(home),0);}home.cabinHome.fire.fuel=100;
for(const part of ['facade','roof','yard']){home.cabinRepairs[part]=false;assert.equal(cabin.windowStrength(home),0);home.cabinRepairs[part]=true;}
home.currentMap='forest';assert.equal(cabin.windowStrength(home),0);home.currentMap='pond';assert.equal(JSON.stringify(home),before);
console.log('PASS window light follows real hearth/lantern, day/night, curtains, repairs and region without state mutation.');
