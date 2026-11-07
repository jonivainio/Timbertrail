const assert=require('node:assert/strict');
global.PERegions=require('../regions.js');global.PE=require('../engine.js');
require('../visual-core.js');global.PEWorldArt={};global.PETerrainSurface=new Proxy({},{get:()=>()=>0});
const art=require('../visual-world.js');
let rects=0;
function canvas(width,height){const c=new Proxy({canvas:null,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),createRadialGradient:()=>({addColorStop(){}}),createLinearGradient:()=>({addColorStop(){}}),fillRect(){rects++;}},{get:(o,k)=>k in o?o[k]:()=>{}});const a={width,height,getContext:()=>c};c.canvas=a;return a;}
for(const dayTime of [.3,.47,.73,.93])for(const weather of ['calm','rain'])for(const currentMap of ['forest','pond']){
  const r={artScale:2/3,makeCanvas:canvas,c:canvas(640,360).getContext('2d')};
  const e=new PE.Engine();e.start();Object.assign(e.state,{camera:300,currentMap,dayTime,weather,playSeconds:25.5});e.state.structures.push({type:'fire',x:630,lit:true,fuel:150});const before=JSON.stringify(e.state);
  art.beginReceivers(r,e);rects=0;art.finish(r,e);
  assert.equal(JSON.stringify(e.state),before,'finish() must not mutate simulation/save state');
  assert.ok(rects>0,'ambient layer draws');
}
console.log('PASS ambient life (smoke, leaves, fireflies) renders without mutating state.');
