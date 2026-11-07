const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.PE=require('../engine.js');require('../kajo-art.js');const art=require('../traveller-art.js'),equipment=require('../equipment.js'),PNG=require('../scripts/png.cjs');
const ART=path.join(__dirname,'../assets/art-v2'),meta=JSON.parse(fs.readFileSync(path.join(ART,'traveller.json'),'utf8')),legacy=JSON.parse(fs.readFileSync(path.join(ART,'traveller-actions.json'),'utf8'));
const sheet=PNG.decode(fs.readFileSync(path.join(ART,'traveller.png'))),byId=Object.fromEntries(meta.frames.map(f=>[f.id,f]));
const calls=[],c=new Proxy({drawImage(...a){calls.push(['image',...a]);},translate(...a){calls.push(['translate',...a]);},scale(...a){calls.push(['scale',...a]);},rotate(...a){calls.push(['rotate',...a]);}},{get:(o,k)=>o[k]||(()=>{})});
const r={c,sprites:{},visualV2:true,artTravellerActions:{id:'actions'},artTraveller:{id:'rig'},artKajo:{},makeCanvas:()=>({width:140,height:116,getContext:()=>c}),sprite(){calls.push(['old']);},pose(){calls.push(['old']);},poses:{},seatedImage:{},petImage:{}};
const e=new PE.Engine();e.start();const p=e.state.player;

// Phase-2 cels exist, share the 64×80 [32,76] rig, keep boots on the ground and carry tool angles.
const ids=['chop-','split-'].flatMap(k=>[0,1,2,3,4,5].map(i=>k+i)).concat([0,1,2,3,4].map(i=>'gather-'+i),['skin-down','skin-0','skin-1','skin-2','skin-3','skin-up','pet-0','pet-1','throw-0','throw-1','throw-2','throw-3']);
for(const id of ids){const f=byId[id];assert.ok(f,id);assert.deepEqual(f.anchor,[32,76]);assert.deepEqual(f.rect.slice(2),[64,80]);
  let bottom=-1,top=99;for(let y=0;y<80;y++)for(let x=0;x<64;x++)if(sheet.data[((f.rect[1]+y)*sheet.width+f.rect[0]+x)*4+3]){bottom=Math.max(bottom,y);top=Math.min(top,y);}
  assert.equal(bottom,75,id+' boots on the ground (no scale jump into actions)');assert.ok(top>=12,id+' same body size as walking');
  if(/^(chop|split)/.test(id))assert.ok(Number.isFinite(f.tool),id+' tool angle');
  const k=art.frames.find(x=>x.id===id);assert.deepEqual(k.hand,f.hand);}
assert.deepEqual(byId['chop-3'].events,['axe-contact']);assert.deepEqual(byId['split-3'].events,['axe-contact']);

// Every action × map × facing × time draws one rig cel, tool at the cel hand, simulation untouched.
let count=0;for(const map of ['forest','river','pond'])for(const x of [565,2460,5520])for(const facing of [-1,1])for(const type of ['tree','log','carcass','pet','berry'])for(const time of [0,.26,.45,.69,1.8]){
 e.state.currentMap=map;Object.assign(p,{x,facing,sitting:false,moving:false});Object.assign(e.state.dog,{x:x+facing*26,facing:-facing,moving:false,mode:'pet'});e.state.equipped=type==='carcass'?'knife':'flintaxe';e.action={target:{type,x:x+facing*28},time,duration:2.1};
 const sample=art.actionSample(e,r),before=JSON.stringify(e.state);calls.length=0;assert.equal(equipment.drawActor(r,e),true);assert.equal(JSON.stringify(e.state),before);
 const drawn=calls.filter(a=>a[0]==='image'&&a[1]===r.artTraveller);assert.equal(drawn.length,1);assert.deepEqual(drawn[0].slice(2,6),sample.pose.rect);assert.ok(!calls.some(a=>a[0]==='image'&&a[1]===r.artTravellerActions));assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===facing));assert.ok(!calls.some(a=>a[0]==='old'));
 const g=sample.pose.grip,atHand=calls.some(a=>a[0]==='translate'&&a[1]===67+sample.dx+g[0]&&a[2]===101+sample.dy+g[1]);
 if(type==='tree'||type==='log'){assert.ok(atHand,'axe at the cel hand');assert.match(sample.pose.id,type==='tree'?/^chop-/:/^split-/);assert.equal(sample.dy,0);if(time===.45)assert.equal(sample.pose.id,type==='tree'?'chop-3':'split-3');}
 if(type==='carcass'){if(/^skin-\d/.test(sample.pose.id))assert.ok(atHand,'knife at the cel hand');if(time===0)assert.equal(sample.pose.id,'skin-down');if(time===1.8)assert.match(sample.pose.id,/^skin-\d$/);}
 if(type==='pet'){assert.match(sample.pose.id,/^pet-/);assert.ok(Math.abs(sample.dx)<=18);assert.equal(sample.dy,Math.round(PE.ground(x+sample.dx*facing,map)-PE.ground(x,map)));}
 if(type==='berry')assert.match(sample.pose.id,/^gather-/);
 count++;}

// Gather is one whole motion: bend → pick → rise across the action's duration.
e.action={target:{type:'berry'},time:0,duration:.85};const seen=[];for(let t=0;t<.85;t+=.01){e.action.time=t;const id=art.actionSample(e,r).pose.id;if(seen[seen.length-1]!==id)seen.push(id);}
assert.deepEqual(seen,['gather-0','gather-1','gather-2','gather-3','gather-4']);

// Stick throw for Kajo is a pure function of the fetch start time.
e.action=null;Object.assign(e.state.dog,{mode:'fetch',fetchStarted:10});const throwSeq=[];for(const t of [10,10.2,10.3,10.4,10.5]){e.state.playSeconds=t;throwSeq.push(art.actionSample(e,r)?.pose.id??null);}
assert.deepEqual(throwSeq,['throw-0','throw-1','throw-2','throw-3',null]);e.state.dog.mode='follow';

// Seated poses still come from the legacy sheet until phase 3.
p.sitting=true;p.energy=100;assert.equal(art.actionSample(e,r).pose.index,12);p.energy=20;assert.equal(art.actionSample(e,r).pose.index,13);assert.equal(art.actionSample(e,r).dy,-4);
for(let i=0;i<16;i++)assert.deepEqual(art.actionFrames[i].rect,legacy.frames[i].rect);
p.sitting=false;assert.equal(art.actionSample(e,r),null);e.action={target:{type:'tree'},time:NaN};assert.equal(art.actionSample(e,r).pose.id,'chop-0');
r.artTraveller=null;r.artTravellerActions=null;assert.equal(art.drawAction(r,c,e),false);r.artTraveller={};r.visualV2=false;assert.equal(art.drawAction(r,c,e),false);r.visualV2=true;assert.equal(art.drawAction(r,c,e),true);

// Real engine cadence: every audible axe contact lands on the impact cel, same .9 s rhythm as before.
for(const hz of [30,60,144])for(const type of ['tree','log']){
 let contacts=0;const sim=new PE.Engine(ev=>{if(ev.type==='sound'&&ev.name==='axe'){contacts++;assert.equal(art.actionSample(sim,r).pose.id,type==='tree'?'chop-3':'split-3','audible contact must coincide with impact cel at '+hz+'Hz');}});sim.start();sim.state.equipped='flintaxe';sim.action={target:{id:'action-cadence',type,x:sim.state.player.x+28},time:0,duration:4};for(let i=0;i<hz*3.8;i++)sim.update(1/hz);assert.equal(contacts,4);
}
console.log('PASS rig actions: '+ids.length+' cels on the walking scale, '+count+' map/slope/facing/action/time cases, axe contact on the impact cel at 30/60/144Hz, tool/knife grips, gather/throw timelines, seated legacy; simulation unchanged.');
