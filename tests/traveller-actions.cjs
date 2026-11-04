const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.PE=require('../engine.js');require('../kajo-art.js');const art=require('../traveller-art.js'),equipment=require('../equipment.js');
const meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/art-v2/traveller-actions.json'),'utf8'));
const calls=[],c=new Proxy({drawImage(...a){calls.push(['image',...a]);},translate(...a){calls.push(['translate',...a]);},scale(...a){calls.push(['scale',...a]);}},{get:(o,k)=>o[k]||(()=>{})});
const r={c,sprites:{},visualV2:true,artTravellerActions:{id:'actions'},artTraveller:{id:'walk'},artKajo:{},makeCanvas:()=>({width:140,height:116,getContext:()=>c}),sprite(){calls.push(['old']);},pose(){calls.push(['old']);},poses:{},seatedImage:{},petImage:{}};
const e=new PE.Engine();e.start();const p=e.state.player,stone={id:'stone'};equipment.setAssets({flintaxe:stone});
for(let i=0;i<16;i++){assert.deepEqual(art.actionFrames[i].rect,meta.frames[i].rect);assert.deepEqual(art.actionFrames[i].hand,meta.frames[i].hand);if(i<8)assert.deepEqual(art.actionFrames[i].head,meta.frames[i].axeHead);}
let count=0;for(const map of ['forest','river','pond'])for(const x of [565,2460,5520])for(const facing of [-1,1])for(const type of ['tree','log','carcass','pet','berry'])for(const time of [0,.26,.45,.69,1.8]){
 e.state.currentMap=map;Object.assign(p,{x,facing,sitting:false});Object.assign(e.state.dog,{x:x+facing*26,facing:-facing,moving:false,mode:'pet'});e.state.equipped=type==='carcass'?'knife':'flintaxe';e.action={target:{type,x:x+facing*28},time,duration:2.1};
 const sample=art.actionSample(e,r),before=JSON.stringify(e.state);calls.length=0;assert.equal(equipment.drawActor(r,e),true);assert.equal(JSON.stringify(e.state),before);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.artTravellerActions));assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===facing));assert.ok(!calls.some(a=>a[0]==='old'));
 if(type==='tree'||type==='log'){assert.ok(calls.some(a=>a[0]==='image'&&a[1]===stone));assert.equal(sample.dy,0);if(time===.45)assert.equal(sample.pose.index,type==='tree'?2:6);}
 if(type==='carcass'){const g=sample.pose.grip;assert.ok(calls.some(a=>a[0]==='translate'&&a[1]===67+g[0]&&a[2]===101+g[1]));}
 if(type==='pet'){assert.ok(Math.abs(sample.dx)<=18);assert.equal(sample.dy,Math.round(PE.ground(x+sample.dx*facing,map)-PE.ground(x,map)));}
 count++;
}
e.action=null;p.sitting=true;p.energy=100;assert.equal(art.actionSample(e,r).pose.index,12);p.energy=20;assert.equal(art.actionSample(e,r).pose.index,13);assert.equal(art.actionSample(e,r).dy,-4);
p.sitting=false;assert.equal(art.actionSample(e,r),null);e.action={target:{type:'tree'},time:NaN};assert.equal(art.actionSample(e,r).pose.index,0);
r.artTravellerActions=null;assert.equal(art.drawAction(r,c,e),false);r.artTravellerActions={};r.visualV2=false;assert.equal(art.drawAction(r,c,e),false);r.visualV2=true;assert.equal(art.drawAction(r,c,e),true);
for(const hz of [30,60,144])for(const type of ['tree','log']){
 let contacts=0;const sim=new PE.Engine(ev=>{if(ev.type==='sound'&&ev.name==='axe'){contacts++;assert.equal(art.actionSample(sim,r).pose.index,type==='tree'?2:6,'audible contact must coincide with impact cel at '+hz+'Hz');}});sim.start();sim.state.equipped='flintaxe';sim.action={target:{id:'action-cadence',type,x:sim.state.player.x+28},time:0,duration:4};for(let i=0;i<hz*3.8;i++)sim.update(1/hz);assert.equal(contacts,4);
}
console.log('PASS action metadata16, '+count+' map/slope/facing/action/time cases, real30/60/144Hz impact sounds, blade and knife grips, seated and loading fallback; simulation unchanged.');
