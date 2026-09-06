const assert=require('node:assert/strict'),fs=require('node:fs');
const PE=require('../engine.js'),R=require('../regions.js'),surface=require('../terrain-surface.js');
for(const map of ['forest','river','pond']){
 for(let x=0;x<PE.WORLD;x+=7){const g=PE.ground(x,map),top=surface.top(map,x);assert.ok(top<=g);assert.ok(Number.isFinite(top));assert.equal(surface.coverage(map,x,g+10),1,'continuous soil crosses the walking line');assert.equal(surface.coverage(map,x,top-4),0);assert.ok(Math.abs(surface.top(map,x+.1)-top)<1,'no vertical edge/cliff');}
 for(const a of surface.areas(map)){assert.equal(surface.influence(a,a.x),1);assert.equal(surface.influence(a,a.x-a.left-1),0);assert.equal(surface.influence(a,a.x+a.right+1),0);assert.ok(PE.ground(a.x,map)-surface.top(map,a.x)>=a.depth-.01);}
}
for(let x=0;x<30;x++)for(let y=0;y<30;y++){assert.ok([0,255].includes(surface.alpha(.5,x,y)));assert.equal(surface.alpha(1,x,y),255);assert.equal(surface.alpha(0,x,y),0);}
// Soil sockets must keep every vertex finite on both steep and shallow grades.
for(const map of ['forest','river','pond'])for(const x of [800,1900,3380,4200,5520,6160])for(const front of [false,true]){
 const points=[],draws=[],c={save(){},restore(){},beginPath(){},closePath(){},clip(){},stroke(){},moveTo(...v){points.push(v);},lineTo(...v){points.push(v);},quadraticCurveTo(...v){points.push(v);},drawImage(...v){draws.push(v);}};
 surface.socket({c,_terrain:{}},map,x,PE.ground(x,map)+4,28,front);assert.ok(points.flat().every(Number.isFinite));assert.equal(draws.length,1);assert.ok(draws[0].slice(1).every(Number.isFinite));
}
surface.extend({groundMaterial:{}},'river',{getContext:()=>({getImageData(){throw Error('empty zones must not read infinite bounds');}})},{});
const e=new PE.Engine();e.start();assert.equal(e.npc.depth,-R.aarni.setback);const before=JSON.stringify(e.state);surface.areas('pond');assert.equal(JSON.stringify(e.state),before,'visual surfaces never mutate save or locomotion');
const camp=new PE.Engine();camp.start();camp.enterRegion('pond',R.pond.spring-30);Object.assign(camp.state.inventory,{stone:20,wood:20,flintaxe:1});camp.state.toolDurability.flintaxe=100;const inventory=JSON.stringify(camp.state.inventory);assert.equal(camp.craft('campfire'),false);assert.equal(JSON.stringify(camp.state.inventory),inventory);assert.equal(camp.state.structures.length,0);camp.state.player.x=R.pond.spring-250;assert.equal(camp.craft('campfire'),true);
const html=fs.readFileSync('index.html','utf8'),build=fs.readFileSync('scripts/build.cjs','utf8');assert.ok(html.indexOf('terrain-surface.js')<html.indexOf('world-art.js'));assert.ok(build.includes("'terrain-surface.js'"));assert.ok(html.includes('assets/timber-wordmark.png'));
console.log('PASS shared depth surfaces, continuous ground, opaque edges, hillside sockets, immutable saves and production wiring.');
// Reproduce network order: panoramas arrive before the ground material.
global.PE=PE;global.PERegions=R;const world=require('../world-art.js');
let writes=0;
const makeCanvas=(width,height)=>({width,height,getContext(){return new Proxy({getImageData:(x,y,w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){writes++;}},{get:(o,k)=>o[k]||(()=>{})});}});
const renderer={makeCanvas,c:makeCanvas(960,540).getContext(),fade:new Map(),scenery:[{width:1000},{width:1000},{width:1000}],regionImages:{}};
world.prepare(renderer,'forest');world.drawLandscape(renderer,3200);const early=renderer._terrain;assert.ok(early);assert.equal(writes,0);
renderer.groundMaterial={};world.prepare(renderer,'forest');world.drawLandscape(renderer,3200);assert.notEqual(renderer._terrain,early,'late ground material rebuilds the yard under Aarni');assert.equal(writes,1);
const complete=renderer._terrain;world.prepare(renderer,'forest');world.drawLandscape(renderer,3200);assert.equal(renderer._terrain,complete,'ready terrain remains cached');
renderer.scenery[1]={width:1000};world.prepare(renderer,'forest');assert.equal(renderer._terrain,null,'changed backdrop invalidates sampled soil');
world.prepare(renderer,'pond');world.drawLandscape(renderer,5000);const fallback=renderer._backdrop;renderer.regionImages.pond={width:1000};world.prepare(renderer,'pond');world.drawLandscape(renderer,5000);assert.notEqual(renderer._backdrop,fallback,'late regional panorama replaces fallback');
console.log('PASS delayed ground/panorama load order, cache reuse and region invalidation.');
