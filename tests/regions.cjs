const assert=require('node:assert/strict');const {Engine,WORLD}=require('../engine.js'),{maps,cabin}=require('../regions.js');
const step=(e,n=22)=>{for(let i=0;i<n;i++)e.update(.05);};
const e=new Engine();e.start();e.state.inventory.wood=99;e.state.picked.starter0=1e12;e.state.structures.push({id:'my-fire',type:'fire',x:900,lit:true,fuel:100});e.state.player.x=WORLD-36;e.keys={KeyD:true};e.update(.05);
assert.equal(e.transition.to,'river');assert.equal(e.state.currentMap,'forest','old scene persists while fading out');step(e,10);assert.equal(e.state.currentMap,'river');assert.equal(e.state.player.x,95);assert.equal(e.state.inventory.wood,99);step(e);assert.equal(e.transition,null);assert.equal(e.npc,null);
e.state.picked['river-node-1']=1e12;e.state.drops.push({id:'river-log',type:'log',x:400,angle:.1,depth:2});e.enterRegion('forest',6270);assert.equal(e.state.picked.starter0,1e12);assert.ok(e.state.structures.some(f=>f.id==='my-fire'));e.enterRegion('river',3250);assert.equal(e.state.picked['river-node-1'],1e12);assert.equal(e.state.drops[0].id,'river-log');
e.interact(e.hotspots[0]);assert.equal(e.transition.to,'pond');step(e);assert.equal(e.state.currentMap,'pond');assert.ok(e.state.player.x>6000);assert.ok(e.state.animals.every(a=>a.type==='rabbit'));
e.state.player.x=cabin.x;e.interact(e.hotspots.find(o=>o.part==='roof'));assert.equal(e.action,null,'missing materials cannot start repair');
for(const k of ['wood','stone','cord','firewood','fiber'])e.state.inventory[k]=100;
e.interact(e.hotspots.find(o=>o.part==='facade'));assert.equal(e.action.target.part,'facade');step(e,125);assert.equal(e.state.cabinRepairs.facade,true);assert.equal(e.state.cabinRepairs.roof,undefined);assert.equal(e.state.inventory.firewood,86);
const cost=e.state.inventory.firewood;e.interact(e.hotspots.find(o=>o.part==='facade'));assert.equal(e.state.inventory.firewood,cost,'no duplicate charge');
e.interact(e.hotspots.find(o=>o.part==='roof'));e.keys={KeyA:true};step(e,2);e.keys={};assert.equal(e.state.inventory.firewood,cost,'canceled repair is free');
const saved=e.save(),loaded=new Engine();loaded.start(JSON.parse(saved));assert.equal(loaded.state.currentMap,'pond');assert.equal(loaded.state.cabinRepairs.facade,true);assert.ok(loaded.state.animals.every(a=>a.type==='rabbit'));loaded.enterRegion('river',100);assert.equal(loaded.state.drops.length,1);loaded.enterRegion('forest',565);assert.equal(loaded.state.picked.starter0,1e12);loaded.enterRegion('pond',6250);assert.equal(loaded.state.cabinRepairs.facade,true);
loaded.state.player.x=3734;loaded.interact(loaded.hotspots.find(o=>o.type==='chair'));assert.equal(loaded.state.player.sitting,true);loaded.keys={KeyA:true};step(loaded,100);assert.equal(loaded.state.player.sitting,false);assert.ok(loaded.state.player.x>=3718,'jetty ends before deep water');loaded.keys={};
loaded.enterRegion('river',3640);loaded.keys={KeyD:true};const oldX=loaded.state.player.x;loaded.update(.05);assert.equal(loaded.state.player.wading,true);assert.ok(loaded.state.player.x-oldX<83*.05);
const legacy=new Engine();legacy.load({version:5,currentMap:'bogus',inventory:{wood:12},player:{x:700},picked:{starter0:1e12}});assert.equal(legacy.state.currentMap,'forest');assert.equal(legacy.state.inventory.wood,12);assert.equal(legacy.state.picked.starter0,1e12);
console.log('PASS region graph/fades, reverse entrances, independent world saves, repair costs/cancellation, rabbit-only pond, pier and shallow crossings.');
loaded.keys={};loaded.enterRegion('pond',3734);for(const id of ['wood','firewood','cord','stone','fiber'])loaded.state.inventory[id]=100;loaded.state.inventory.flintaxe=1;loaded.state.toolDurability.flintaxe=100;
assert.equal(loaded.craft('campfire'),false,'no building in deep water or on jetty');
loaded.state.player.facing=-1;loaded.commandDog('stick');assert.ok(loaded.state.dog.fetchX>=3718,'stick remains on reachable jetty');
loaded.state.player.x=cabin.x;for(const part of ['yard','facade','roof']){loaded.interact(loaded.hotspots.find(o=>o.part===part));step(loaded,125);assert.equal(loaded.state.cabinRepairs[part],true);}
loaded.enterRegion('river',3640);assert.ok(loaded.nodes.every(n=>!(n.x>3510&&n.x<3800||n.x>5050&&n.x<5350)),'no gatherables growing in fords');
console.log('PASS all three independent repairs, dry-ground building and accessible dog fetch.');
const geometry=require('../regions.js'),oldPier=new Engine();oldPier.start({version:6,currentMap:'pond',player:{x:3110},inventory:{wood:17}});
assert.equal(oldPier.state.player.x,geometry.pond.walkMin);assert.equal(oldPier.state.inventory.wood,17,'pier migration preserves supplies');assert.ok(oldPier.state.dog.x>=geometry.pond.walkMin);
assert.ok(require('../engine.js').ground(geometry.pond.chair,'pond')<380,'raised shore leaves more room for underwater view');
oldPier.enterRegion('river',geometry.trail.x);const fork=oldPier.hotspots.find(o=>o.type==='exit');assert.equal(fork.x,3250);assert.ok(fork.box[3]>170);assert.equal(fork.name,'Sienilampi');
oldPier.enterRegion('pond',5000);const door=oldPier.hotspots.find(o=>o.part==='facade');assert.equal(door.box[1],geometry.cabin.parts.facade.box[1]*geometry.cabin.scale-geometry.cabin.setback);
console.log('PASS short-pier save migration, raised shore, relocated trail and setback cabin hitboxes.');
assert.deepEqual(Object.keys(cabin.parts).sort(),['facade','roof','yard']);
for(const part of ['door','windows','facade']){
 const migrated=new Engine();migrated.start({version:6,currentMap:'pond',cabinRepairs:{[part]:true},inventory:{wood:17}});
 assert.equal(migrated.state.cabinRepairs.facade,true,'prior '+part+' work grants the coherent facade');assert.equal(migrated.state.cabinRepairs.roof,false);assert.equal(migrated.state.inventory.wood,17);assert.equal(migrated.repairReady('facade'),false);
 assert.deepEqual(migrated.hotspots.filter(o=>o.type==='repair').map(o=>o.part).sort(),['facade','roof','yard']);
}
const nested=new Engine();nested.start({version:6,currentMap:'forest',regions:{pond:{cabinRepairs:{door:true,roof:true}}}});nested.enterRegion('pond',5000);assert.equal(nested.state.cabinRepairs.facade,true);assert.equal(nested.state.cabinRepairs.roof,true);assert.equal(nested.state.cabinRepairs.yard,false);
console.log('PASS merged facade, no duplicate material charge and legacy repair migration in active/inactive regions.');
const drinker=new Engine();drinker.start();drinker.enterRegion('pond',geometry.pond.spring-110);const spring=drinker.water.find(o=>o.id==='cabin-spring');assert.equal(spring.x,geometry.pond.spring);assert.ok(drinker.nodes.every(o=>Math.abs(o.x-spring.x)>=65));drinker.state.player.thirst=10;drinker.state.equipped='rod';drinker.interact(spring);assert.ok(drinker.walkTarget);step(drinker,80);assert.ok(drinker.state.player.thirst>99);assert.equal(drinker.fishing,null);assert.equal(drinker.state.completed.drink,true);
console.log('PASS cabin spring click-to-approach/drink, no blocked fishing and clear resource placement.');
const {clearingOpacity,yardPixelAlpha}=require('../region-art.js');
for(let y=0;y<8;y++)for(let x=0;x<80;x++){assert.equal(yardPixelAlpha(1,x,y),255);assert.equal(yardPixelAlpha(0,x,y),0);assert.ok([0,255].includes(yardPixelAlpha(.5,x,y)),'yard edges must not ghost through');}
assert.equal(clearingOpacity(-2,-3,1),0,'outside both edges must not reappear as an opaque rectangle');
assert.equal(clearingOpacity(1,-1,1),0);assert.equal(clearingOpacity(-1,1,1),0);
assert.equal(clearingOpacity(1,1,1),1);assert.equal(clearingOpacity(.5,.5,1),.25);
assert.ok(cabin.x>5400);assert.ok(cabin.x-cabin.clearing.left<=4780,'keep the old western yard approach');assert.ok(cabin.x+cabin.clearing.right>=6350,'extend the clearing eastward');
console.log('PASS extended cabin clearing and independently clamped opacity masks.');
for(let mask=0;mask<8;mask++){
 const n=new Engine();n.start();n.enterRegion('pond',cabin.x);const parts=['roof','facade','yard'];parts.forEach((k,i)=>n.state.cabinRepairs[k]=!!(mask&(1<<i)));
 assert.deepEqual(n.activeHotspots().filter(o=>o.type==='repair').map(o=>o.part).sort(),parts.filter(k=>!n.state.cabinRepairs[k]).sort());
 assert.equal(n.targets().some(o=>o.type==='cabinDoor'),mask===7);
 for(const o of n.hotspots.filter(o=>o.type==='repair'&&n.state.cabinRepairs[o.part])){assert.equal(n.label(o),'');n.interact(o);assert.equal(n.action,null);assert.equal(n.walkTarget,null);}
 const reloaded=new Engine();reloaded.start(JSON.parse(n.save()));assert.equal(reloaded.cabinReady(),mask===7);
}
const doorEvents=[],house=new Engine(e=>doorEvents.push(e));house.start();house.enterRegion('pond',cabin.x-180);const entry=house.hotspots.find(o=>o.type==='cabinDoor');house.interact(entry);assert.equal(house.walkTarget,null);
house.state.cabinRepairs={roof:true,facade:true,yard:true};house.interact(entry);assert.ok(house.walkTarget);step(house,70);assert.equal(house.state.currentMap,'pond');assert.equal(house.transition,null);assert.equal(house.state.cabinHome.inside,true);
console.log('PASS completed repairs disappear, door unlocks only at three repairs, save loading and restored interior entrance.');
