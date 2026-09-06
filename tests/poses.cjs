const assert=require('node:assert/strict');
global.PE=require('../engine.js');const art=require('../equipment.js');
const images=[],transforms=[];
const ctx=new Proxy({drawImage(...args){images.push(args);},scale(...args){transforms.push(args);}},{get:(o,k)=>o[k]||(()=>{})});
const layer={width:140,height:116,getContext:()=>ctx};
const renderer={c:ctx,sprites:{},petImage:{id:'pet'},seatedImage:{id:'seated'},makeCanvas:()=>layer,sprite(){throw Error('Static actions must use their own complete illustration');}};
const e=new PE.Engine();e.start();e.state.player.x=2000;e.state.dog.x=2024;e.commandDog('pet');
art.drawActor(renderer,e);const first=images.find(a=>a[0]===renderer.petImage);assert.ok(first);
images.length=0;e.action.time=1.6;art.drawActor(renderer,e);assert.deepEqual(images.find(a=>a[0]===renderer.petImage),first,'petting does not animate replacement arms');
e.action=null;e.state.player.sitting=true;e.state.player.facing=-1;images.length=0;art.drawActor(renderer,e);assert.ok(images.some(a=>a[0]===renderer.seatedImage));assert.ok(transforms.some(a=>a[0]===-1),'complete seated pose mirrors toward the pond');
console.log('PASS dedicated seated/petting illustrations, stable pet pose and mirrored sitting.');
const F=global.PEFishing,spinning=require('../fishing-art.js');renderer.fishingPoses={id:'fishing'};e.enterRegion('pond',PERegions.pond.chair);e.state.player.sitting=true;e.state.equipped='rod';e.state.inventory.rod=1;
for(let i=0;i<8;i++){e.fishing={kind:'spinning',stage:i<6?'charge':i===6?'flight':'fight',power:i/5,age:0,tension:i===7?.8:0};images.length=0;assert.equal(spinning.actor(renderer,e),true);const d=images[0],p=F.pose(e);assert.equal(p.phase,i);assert.equal(d[0],renderer.fishingPoses);assert.ok(d[1]>=0&&d[2]>=0&&d[1]+d[3]<=1536&&d[2]+d[4]<=1024);
 assert.ok(Math.abs((p.c1.x-p.grip.x)*Math.sin(p.angle)+(p.c1.y-p.grip.y)*Math.cos(p.angle))<1e-8,'rod tangent aligned to painted grip');
 const socketX=e.state.player.x-(d[5]+p.frame[2]*p.scale),socketY=PE.ground(e.state.player.x,'pond')+d[6]+p.frame[3]*p.scale;assert.ok(Math.hypot(p.grip.x-socketX,p.grip.y-socketY)<1e-8,'visible socket is simulation grip');
}
e.fishing.tension=0;const straight=F.pose(e);e.fishing.tension=1;const bent=F.pose(e);assert.equal(bent.grip.x,straight.grip.x);assert.equal(bent.grip.y,straight.grip.y);assert.ok(bent.tip.y-straight.tip.y>24,'load bends tip without displacing hand');
e.state.equipped=null;assert.equal(spinning.actor(renderer,e),false,'ordinary sitting remains separate');
console.log('PASS eight seated spinning frames, shared grip/tip transforms, handle tangent and load-dependent rod bend.');
