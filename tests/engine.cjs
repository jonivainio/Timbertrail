const assert=require('node:assert/strict');
const {Engine,items,recipes,toolDurability}=require('../engine.js');

const engine=new Engine();
engine.start();
const s=engine.state;
assert.equal(s.inventory.puukko,0,'a new journey must not include a puukko');
assert.equal(s.quickFood,'berries');
assert.equal(items.flintaxe[2],'tool');
assert.ok(recipes.some(r=>r.id==='flintaxe'));
assert.ok(!recipes.some(r=>r.id==='axe'),'steel axe must be trader-only');

Object.assign(s.inventory,{stone:4,wood:4,fiber:3});
assert.equal(engine.craft('knife'),true,'flint knife is the first craft');
assert.equal(s.inventory.knife,1);
assert.equal(s.toolDurability.knife,toolDurability.knife);
assert.equal(engine.craft('cord'),true);
assert.equal(engine.craft('flintaxe'),true,'flint axe follows the flint knife');
assert.equal(s.inventory.flintaxe,1);
assert.equal(s.toolDurability.flintaxe,toolDurability.flintaxe);
s.inventory.stone=4;s.inventory.wood=4;
assert.equal(engine.requirements(recipes.find(r=>r.id==='campfire')),true,'flint axe satisfies axe recipes');

s.equipped='knife';
s.drops.push({id:'test-carcass',type:'carcass',species:'rabbit',x:s.player.x});
const knifeBefore=s.toolDurability.knife;
engine.completeAction(s.drops[0]);
assert.equal(s.inventory.rawMeat,1,'flint knife can skin game');
assert.equal(s.toolDurability.knife,knifeBefore-1,'successful skinning consumes durability');

s.equipped='flintaxe';
const axeBefore=s.toolDurability.flintaxe;
engine.completeAction({id:'test-tree',type:'tree',x:s.player.x});
assert.equal(s.toolDurability.flintaxe,axeBefore-2,'felling consumes meaningful flint-axe durability');
engine.completeAction({id:'test-log',type:'log',x:s.player.x});
assert.equal(s.toolDurability.flintaxe,axeBefore-3,'splitting also consumes durability');

s.traders.aarni.introDone=true;
s.player.x=engine.npc.x;
s.inventory.hide=3;
assert.equal(engine.trade('puukko'),true);
assert.equal(s.inventory.puukko,1);
assert.equal(s.toolDurability.puukko,toolDurability.puukko);
assert.equal(engine.trade('axe'),true);
assert.equal(s.inventory.axe,1,'steel axe is acquired from the trader');
assert.equal(s.toolDurability.axe,toolDurability.axe);
assert.ok(toolDurability.axe>toolDurability.flintaxe);

assert.equal(engine.assignQuickFood('cookedMeat'),true);
assert.equal(s.quickFood,'cookedMeat');
assert.equal(engine.assignQuickFood('wood'),false,'non-food cannot be assigned');
assert.equal(s.quickFood,'cookedMeat');
s.inventory.cookedMeat=0;
const saved=JSON.parse(engine.save());
const restored=new Engine();
restored.load(saved);
assert.equal(restored.state.quickFood,'cookedMeat','a depleted quick-food slot stays selected');
assert.equal(restored.state.toolDurability.axe,toolDurability.axe,'tool durability persists');

const legacy=new Engine();
legacy.load({version:4,inventory:{puukko:1,axe:1,bow:1,rod:1},equipped:'axe'});
assert.equal(legacy.state.inventory.puukko,1,'old acquired puukko is preserved');
assert.equal(legacy.state.inventory.axe,1,'old acquired axe is preserved');
assert.equal(legacy.state.toolDurability.puukko,toolDurability.puukko,'old saves receive safe full durability');
assert.equal(legacy.state.equipped,'axe');
assert.equal(legacy.toolReady('bow'),true,'owned non-durable tools remain usable after load');
legacy.use('rod');
assert.equal(legacy.state.equipped,'rod','non-durable tools can be equipped after load');
assert.equal(legacy.state.discovered.stone,true,'pre-v5 crafted axes retain their ingredient discoveries');
assert.equal(legacy.state.discovered.wood,true);
assert.equal(legacy.state.discovered.cord,true);

const durationFor=(tool,type)=>{
  const work=new Engine();
  work.start();
  work.state.inventory[tool]=1;
  work.state.toolDurability[tool]=toolDurability[tool];
  work.state.equipped=tool;
  work.interact({id:`${tool}-${type}`,type,x:work.state.player.x});
  return work.action.duration;
};
assert.equal(durationFor('axe','tree'),1.8,'steel tree work is two exact swing cycles');
assert.equal(durationFor('flintaxe','tree'),3.6,'flint tree work is four exact swing cycles');
assert.equal(durationFor('axe','log'),0.9,'steel log work is one exact swing cycle');
assert.equal(durationFor('flintaxe','log'),1.8,'flint log work is two exact swing cycles');

const axeTimes=[];
let timing;
timing=new Engine(event=>{
  if(event.type==='sound'&&event.name==='axe')axeTimes.push(Number(timing.action.time.toFixed(2)));
});
timing.start();
timing.state.inventory.axe=1;
timing.state.toolDurability.axe=toolDurability.axe;
timing.state.equipped='axe';
timing.interact({id:'timed-tree',type:'tree',x:timing.state.player.x});
assert.deepEqual(axeTimes,[],'wood work makes no axe sound on action start');
for(let i=0;i<36;i++)timing.update(.05);
assert.deepEqual(axeTimes,[.45,1.35],'axe audio lands on the two rendered impact frames before completion');

console.log('Tool progression verified.');

const shelter=recipes.find(r=>r.id==='shelter');
assert.equal(shelter.need.firewood,8);
const camp=new Engine();camp.start();Object.assign(camp.state.inventory,{axe:1,wood:50,fiber:50,cord:10});camp.state.toolDurability.axe=75;
assert.equal(camp.requirements(shelter),false,'branches cannot replace stout shelter poles');camp.state.inventory.firewood=8;assert.equal(camp.craft('shelter'),true);assert.equal(camp.state.inventory.firewood,0);
const scatter=new Engine();scatter.start();for(let i=0;i<3;i++)scatter.scatterDrop('firewood',700,i,49);
assert.equal(new Set(scatter.state.drops.map(d=>d.angle)).size,3);assert.equal(new Set(scatter.state.drops.map(d=>d.depth)).size,3);
const positions=scatter.state.drops.map(({x,angle,depth,variant})=>({x,angle,depth,variant}));const reload=new Engine();reload.load(JSON.parse(scatter.save()));assert.deepEqual(reload.state.drops.map(({x,angle,depth,variant})=>({x,angle,depth,variant})),positions);
let rainy=0;for(let day=2;day<202;day++){const e=new Engine();e.start();e.state.day=day-1;e.state.dayTime=.99999;e.update(.05);if(e.state.weather==='rain')rainy++;}assert.ok(rainy<40&&rainy>5,'rain is uncommon across a representative calendar');
global.PE=require('../engine.js');const world=require('../world-art.js');assert.equal(world.lightProfile({day:1,dayTime:.95,weather:'clear'}).strength,0);assert.ok(world.lightProfile({day:1,dayTime:.45,weather:'clear'}).strength>world.lightProfile({day:1,dayTime:.45,weather:'rain'}).strength*5);
console.log('PASS shelter poles, varied persistent wood scattering, uncommon rain and sun/rain light response.');

const companion=new Engine();companion.start();companion.state.dog.x=companion.state.player.x+120;
companion.interact({id:'dog',type:'dog',x:companion.state.dog.x,command:'pet'});
assert.equal(companion.walkTarget.command,'pet');
for(let i=0;i<120&&!companion.action;i++)companion.update(.05);
assert.equal(companion.action?.target.type,'pet','approach retains the chosen dog command');
assert.ok(Math.abs(companion.state.player.x-companion.state.dog.x)<=27);
for(let i=0;i<45;i++)companion.update(.05);
assert.equal(companion.action,null);assert.equal(companion.state.dog.mode,'sit');
assert.deepEqual(companion.dogActions(),['pet','stick']);
companion.state.drops.push({id:'test-bird',type:'carcass',species:'grouse',x:companion.state.player.x+250});
assert.ok(companion.dogActions().includes('retrieve'));assert.equal(companion.commandDog('retrieve'),true);
let carried=false;for(let i=0;i<180;i++){companion.update(.05);carried||=!!companion.state.drops[0]?.carriedBy;}
assert.equal(carried,true);assert.equal(companion.state.drops.length,1);assert.ok(!companion.state.drops[0].carriedBy);
assert.ok(Math.abs(companion.state.drops[0].x-companion.state.player.x)<45);assert.equal(companion.state.inventory.rawMeat,0,'fetch does not bypass skinning');
companion.state.drops[0].carriedBy='dog';companion.state.dog.mode='retrieve';companion.travel();assert.ok(!companion.state.drops[0].carriedBy,'map travel releases a carried carcass');
const savedCompanion=new Engine();savedCompanion.load(JSON.parse(companion.save()));assert.equal(savedCompanion.state.drops.length,1);
const jog=new Engine();jog.start();jog.keys={KeyD:true,ShiftLeft:true};jog.update(.05);assert.equal(jog.state.player.running,true);jog.setCrouch(true);jog.update(.05);assert.equal(jog.state.player.running,false);jog.keys={};jog.setCrouch(false);jog.update(.05);assert.equal(jog.state.player.running,false);
const cold=new Engine();cold.start();cold.state.dayTime=.81;cold.state.weather='clear';cold.state.structures=[];cold.state.player.warmth=80;
for(let i=0;i<7200;i++){cold.state.player.hunger=100;cold.state.player.thirst=100;cold.update(.05);}
assert.ok(cold.state.player.warmth>7&&cold.state.player.warmth<17,'forest nights approach, but do not reach, freezing');
const beforeWarmth=cold.state.player.warmth;cold.state.structures.push({type:'fire',x:cold.state.player.x,lit:true,fuel:100});cold.update(.05);assert.ok(cold.state.player.warmth>beforeWarmth);
console.log('PASS dog approach/petting/retrieval, recoverable carcass, real running state and cold forest nights.');
