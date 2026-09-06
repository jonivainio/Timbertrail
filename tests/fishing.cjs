const assert=require('node:assert/strict');global.PE=require('../engine.js');const F=global.PEFishing;
function setup(seed=1){const events=[],e=new PE.Engine(v=>events.push(v));e.start();e.enterRegion('pond',PERegions.pond.chair);e.state.player.sitting=true;e.state.equipped='rod';e.state.inventory.rod=1;e.state.fishery.casts=seed;e.events=events;return e;}
function step(e,seconds,dt=1/120){for(let i=0;i<Math.round(seconds/dt);i++){e.state.playSeconds+=dt;F.update(e,dt);}}
function cast(e,power=.8){assert.ok(F.press(e,e.state.player.x-200,370));step(e,power*1.55);F.release(e);let n=0;while(e.fishing?.stage==='flight'&&n++<300)step(e,1/120);assert.equal(e.fishing?.stage,'wet');return e.fishing;}
function hooked(id='pike',w=8,seed=1){const e=setup(seed),f=cast(e),fish=F.shoal(e).find(a=>a.species===id);e.pondFish=[fish];Object.assign(fish,{weight:w,mode:'hooked',stamina:1,timer:0});Object.assign(f,{stage:'fight',fish,age:0,held:true,slackTime:0,strain:0,run:-1,runY:0,surge:1});Object.assign(f.lure,{x:e.state.player.x-240,y:PERegions.pond.surface+75,vx:0,vy:0});const t=F.pose(e).tip;f.lineLength=Math.hypot(f.lure.x-t.x,f.lure.y-t.y)+6;return e;}
function fight(e,policy,dt=1/60){let t=0,maxTension=0,maxBubbles=0;while(e.fishing&&t<120){e.fishing.held=policy(e.fishing);step(e,dt,dt);t+=dt;if(e.fishing){maxTension=Math.max(maxTension,e.fishing.tension);maxBubbles=Math.max(maxBubbles,e.fishing.bubbles.length);for(const k of ['x','y','vx','vy'])assert.ok(Number.isFinite(e.fishing.lure[k]),'finite '+k);}}return{t,maxTension,maxBubbles,landed:!!e.lastCatch,notice:e.events.filter(v=>v.type==='notice').at(-1)?.text};}
const control=f=>f.tension<.72||f.slack>20;
function dynamicsTests(){
 const heavy=hooked('pike',14,11),light=hooked('zander',.8,11);
 for(const e of [heavy,light]){Object.assign(e.fishing,{behavior:'run',run:-1,runY:0,surge:1,lineLength:30,tension:0});e.fishing.fish.timer=10;step(e,.75);}
 assert.ok(heavy.fishing.tension>light.fishing.tension+.02,'strong fish load the line faster');assert.ok(heavy.fishing.tension<.2,'no instantaneous red tension from a load spike');
 const response=hooked('pike',10);Object.assign(response.fishing,{behavior:'run',run:-1,runY:0,surge:1,tension:.85,held:false});response.fishing.fish.timer=10;const x=response.fishing.lure.x;step(response,1.5);assert.ok(response.fishing.lure.x<x-15,'released fish visibly runs away');assert.ok(response.fishing.tension<.6,'release gives meaningful relief');assert.ok(response.fishing.dragRate>0);
 for(const id of ['pike','zander']){const e=hooked(id,4),f=e.fishing;Object.assign(f,{behavior:'surface',run:-.5,runY:-1.8,surge:1,jumpCooldown:0,tension:.3,held:false});f.fish.timer=5;f.lure.y=PERegions.pond.surface+6;f.lineLength=300;step(e,.25);assert.ok(f.airborne&&f.lure.y<PERegions.pond.surface-10,id+' breaches surface');assert.equal(f.fish.x,f.lure.x);assert.equal(f.fish.y,f.lure.y);assert.ok(f.spray.length>0);assert.equal(e.lastCatch,null);assert.equal(f.points.at(-1).x,f.fish.x);assert.equal(f.points.at(-1).y,f.fish.y,'line endpoint follows airborne mouth');step(e,1.3);assert.equal(f.airborne,false);assert.ok(f.lure.y>=PERegions.pond.surface);assert.ok(e.events.filter(v=>v.type==='sound'&&v.name==='fishSplash').length>=2,'takeoff and landing splash');assert.ok(f.jumpCooldown>10);}
 const a=setup(),school=F.shoal(a);let last=school[0].beat;F.ambient(a,.05);assert.notEqual(school[0].beat,last,'body animation advances in free swimming');
 console.log('PASS gradual strength-dependent tension, relief/away run, both species jumping/reentry, attached airborne hook and swimming animation clocks.');
}
if(require.main===module){
 dynamicsTests();
 const e=setup();assert.ok(F.ready(e));for(const [x,y]of[[e.state.player.x+50,370],[e.state.player.x-100,30],[NaN,370]])assert.equal(F.canCast(e,x,y),false);
 e.state.equipped=null;assert.equal(F.press(e,e.state.player.x-100,370),false);e.state.equipped='rod';e.state.player.sitting=false;assert.equal(F.ready(e),false);e.state.player.sitting=true;
 const short=cast(setup(),.05),long=cast(setup(),1);assert.ok(short.lure.x-long.lure.x>180);assert.ok(long.ripples.length);assert.ok(long.lure.y>=PERegions.pond.surface);
 const queued=setup();F.press(queued,queued.state.player.x-150,370);step(queued,.7);F.release(queued);assert.ok(F.press(queued,0,0));assert.equal(queued.fishing.held,true,'retrieve can be held before splashdown');F.cancel(queued);
 const sinking=setup();const wet=cast(sinking);sinking.pondFish=[];const y=wet.lure.y;step(sinking,3);assert.ok(wet.lure.y>y+12,'lure sinks');
 wet.lure.vx=wet.lure.vy=0;const tip=F.pose(sinking).tip;wet.lineLength=Math.hypot(wet.lure.x-tip.x,wet.lure.y-tip.y)+70;const x=wet.lure.x,len=wet.lineLength;F.press(sinking,0,0);step(sinking,.5);assert.ok(wet.lineLength<len-19);assert.ok(Math.abs(wet.lure.x-x)<.1,'retrieving slack does not pull the lure');step(sinking,2);assert.ok(wet.lure.x>x+5,'taut line retrieves lure');
 assert.ok(wet.points.length>10);assert.ok(Math.hypot(wet.points[0].x-F.pose(sinking).tip.x,wet.points[0].y-F.pose(sinking).tip.y)<.2,'line attached to current rod tip');
 for(const id of ['pike','zander']){const random=F.rng(819),a=Array.from({length:40000},()=>F.weight(id,random)),s=F.species[id];assert.ok(a.every(w=>w>=s.min&&w<=s.max));const trophies=a.filter(w=>w>=F.trophyLimit(id)).length;assert.ok(trophies>0&&trophies<400,'extreme sizes rare but possible');assert.ok(a.filter(w=>w<5).length>a.length*.6);}
 assert.ok(Math.abs(F.trophyLimit('pike')-12.1)<1e-10);assert.ok(Math.abs(F.trophyLimit('zander')-8.1)<1e-10);
 for(const id of ['pike','zander']){const e=hooked(id,id==='pike'?13:9),result=fight(e,control);assert.ok(result.landed,JSON.stringify(result));assert.ok(result.maxBubbles>0);assert.ok(e.lastCatch.trophy);assert.ok(e.state.inventory.rawFish>0);assert.equal(e.events.filter(v=>v.type==='panel'&&v.panel==='fish-catch').length,1);const n=e.state.inventory.rawFish;step(e,2);F.release(e);assert.equal(e.state.inventory.rawFish,n,'no duplicate award');const restored=setup();restored.start(JSON.parse(e.save()));assert.equal(restored.state.fishery.best[id],e.lastCatch.weight);assert.equal(restored.fishing,null);assert.equal(restored.pondFish,null);}
 const rough=hooked('pike',14),broken=fight(rough,()=>true);assert.equal(broken.landed,false);assert.match(broken.notice,/line broke/);assert.equal(rough.state.inventory.rawFish,0);
 const loose=hooked();loose.fishing.lineLength=450;const escaped=fight(loose,()=>false);assert.equal(escaped.landed,false);assert.match(escaped.notice,/hook came loose/);
 const a=hooked('zander',3,7),b=hooked('zander',3,7);step(a,1,1/120);step(b,1,1/30);assert.ok(Math.abs(a.fishing.lure.x-b.fishing.lure.x)<1e-6,'fixed-step frame independence');
 for(const action of ['move','unequip','cancel','blur','travel']){const e=setup();F.press(e,e.state.player.x-100,370);if(action==='move'){e.keys.KeyD=true;e.update(.03);}if(action==='unequip'){e.state.equipped=null;e.update(.03);}if(action==='cancel')F.cancel(e);if(action==='blur')F.release(e,true);if(action==='travel')e.requestTravel('river');assert.equal(e.fishing,null,action+' cancels');F.release(e);assert.equal(e.fishing,null,'release cannot revive cancelled cast');}
 assert.deepEqual(F.restore({casts:-2,caught:NaN,best:{pike:999,zander:'2'}}),F.restore());
 let landed=0;for(let seed=1;seed<=40;seed++){const e=hooked(seed%2?'pike':'zander',1+seed%(seed%2?14:9),seed);if(fight(e,control).landed)landed++;}assert.ok(landed>=34,'controllable fights across seeds');
 // Actual casts and unmodified shoals: shallow retrieves and long sinking pauses.
 // No injected hook, fish position, weight, random values or inventory awards.
 const natural={pike:0,zander:0,empty:0},modes=new Set(),behaviors=new Set();let followed=false,rejected=false,jumped=false;
 for(let day=1;day<=24;day++){const e=setup(day);e.state.day=day;cast(e,.75);let t=0;
  while(e.fishing&&t<100){const f=e.fishing;f.held=f.stage==='fight'?control(f):f.wetTime>(day%2?5:30);step(e,1/60,1/60);t+=1/60;followed||=e.pondFish.some(a=>a.mode==='follow');rejected||=f.nibble>0;for(const fish of e.pondFish)modes.add(fish.mode);if(f.behavior)behaviors.add(f.behavior);jumped||=!!f.airborne;}
  natural[e.lastCatch?.species||'empty']++;
 }
 assert.ok(natural.pike>=4&&natural.zander>=4&&natural.empty>0,JSON.stringify(natural));assert.ok(followed&&rejected,'fish follow and sometimes reject instead of automatically hooking');
 for(const mode of ['follow','inspect','strike','reject'])assert.ok(modes.has(mode),'natural lure behavior: '+mode);for(const behavior of ['run','dive','circle','rest','surface'])assert.ok(behaviors.has(behavior),'natural fight behavior: '+behavior);assert.ok(jumped,'natural fights include surface jumps without forcing state');
 const ambient=setup(),shoal=F.shoal(ambient),oldX=shoal[0].x;F.ambient(ambient,.05);assert.notEqual(shoal[0].x,oldX,'fish roam without casting');ambient.enterRegion('forest',565);assert.equal(ambient.pondFish,null,'travel discards transient shoal');
 console.log('PASS fishing charge/range, splash/sink/slack, trophy distribution, both species landing, line break/slack escape, persistence, fixed timestep, cancellation; controlled fights',landed+'/40; natural casts',natural);
}
module.exports={setup,step,cast,hooked,fight,control};
