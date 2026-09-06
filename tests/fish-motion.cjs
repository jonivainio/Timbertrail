// Motion continuity regression: positions alone miss whole-body mirror teleports.
const assert=require('node:assert/strict');
const {setup,cast,step,hooked,control}=require('./fishing.cjs');
const F=global.PEFishing,A=require('../fishing-art.js');
const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function landmarks(a){const v=A.fishView(a),g=A.fishShape(a,F.bodyLength(a));return [...g.outline,...g.tail].map(v.project);}
function snapshot(a){return{x:a.x,y:a.y,visibility:a.visibility,mode:a.mode,points:landmarks(a),beat:a.beat};}
function continuous(before,a,dt,label){
 if(before.mode==='caught'||a.mode==='caught')return;
 assert.ok(Math.hypot(a.x-before.x,a.y-before.y)<dt*180+.01,label+' mouth never teleports');
 assert.ok(Math.abs(a.visibility-before.visibility)<=dt*.33+.001,label+' opacity cannot flash');
 const points=landmarks(a);for(let i=0;i<points.length;i++)assert.ok(distance(points[i],before.points[i])<dt*290+.05,label+' body vertex '+i+' remains continuous');
 for(const k of ['x','y','vx','vy','yaw','pitch','beat','visibility'])assert.ok(Number.isFinite(a[k]),label+' finite '+k);
}

// Test tiny/large fish turning both ways, including nearly vertical jitter.
for(const species of ['pike','zander'])for(const weight of [.5,4,10]){
 const a={species,weight,x:0,y:0,vx:25,vy:0,mode:'roam',facing:1,yaw:0,pitch:0,beat:0,visibility:.42};
 let crossed=false;for(let i=0;i<240;i++){const before=snapshot(a);a.vx=-25;F.animateFish(a,1/120);continuous(before,a,1/120,'turn');crossed||=A.fishView(a).front>.99;}
 assert.ok(crossed,'continuous end-on turn');assert.equal(a.yaw,Math.PI);
 const yaw=a.yaw;for(let i=0;i<120;i++){a.vx=i%2?1:-1;a.vy=40;F.animateFish(a,1/120);}assert.equal(a.yaw,yaw,'vertical velocity noise cannot flip sides');
 const little=A.fishShape(a,F.bodyLength(a)),large=A.fishShape({...a,weight:weight*8},F.bodyLength({...a,weight:weight*8}));
 const span=g=>g.tail[3][1]-g.tail[1][1];assert.ok(Math.abs(span(large)/span(little)-2)<1e-9,'tail scales with cubic-root body length, never fixed pixel size');assert.ok(span(little)/F.bodyLength(a)<=.201,'tail proportion is bounded');
 const left=landmarks({...a,yaw:Math.PI/2-1e-7}),right=landmarks({...a,yaw:Math.PI/2+1e-7});for(let i=0;i<left.length;i++)assert.ok(distance(left[i],right[i])<.001,'no discontinuity at the old mirror threshold');const endOn=A.fishView({...a,yaw:Math.PI/2});assert.ok(endOn.profile<1e-12&&endOn.front>.999,'singular side profile yields to end-on volume');
}

// All fishing phases keep the SAME shoal moving, including charging/flight.
const e=setup(12),school=F.shoal(e);assert.equal(school.length,6);
const before=school.map(snapshot);F.press(e,e.state.player.x-220,370);step(e,.4);
for(let i=0;i<school.length;i++)assert.ok(school[i].beat>before[i].beat&&distance([school[i].x,school[i].y],[before[i].x,before[i].y])>.1);
F.release(e);const flight=school.map(snapshot);step(e,.3);for(let i=0;i<school.length;i++)assert.ok(school[i].beat>flight[i].beat);

// Cancel a jump, then cast again immediately. The fish completes its arc and
// enters water normally instead of clamping into the old swim rectangle.
for(const casting of [false,true]){const e=hooked(),f=e.fishing,a=f.fish;Object.assign(f,{airborne:true,held:false});Object.assign(f.lure,{x:e.state.player.x-405,y:PERegions.pond.surface-25,vx:-20,vy:-30});Object.assign(a,{...f.lure,airborne:true});const before=snapshot(a);F.cancel(e);assert.equal(a.x,before.x);assert.equal(a.y,before.y);if(casting)F.press(e,e.state.player.x-200,370);
 let entered=false;for(let i=0;i<240;i++){const b=snapshot(a);if(casting)F.update(e,1/120);else F.ambient(e,1/120);continuous(b,a,1/120,'released jump');entered||=!a.airborne;}assert.ok(entered);assert.ok(a.y>=PERegions.pond.surface);assert.ok(e.events.some(v=>v.name==='fishSplash'),'released jump makes a reentry splash');}

// A near-surface/shore release uses the exact same bounds as a hooked fish.
for(const x of [F.waterBounds().left,F.waterBounds().right]){const e=hooked(),f=e.fishing,a=f.fish;Object.assign(a,{x,y:F.waterBounds().top,vx:0,vy:0});Object.assign(f.lure,a);const b=snapshot(a);F.cancel(e);F.ambient(e,1/120);continuous(b,a,1/120,'boundary release');}

// Respawn happens only while invisible, then fades in; no on-screen relocation.
const respawn=setup(),a=F.shoal(respawn)[0];Object.assign(a,{mode:'caught',visibility:0,cooldown:.005});F.ambient(respawn,1/120);assert.equal(a.visibility,0);const reappeared=snapshot(a);F.ambient(respawn,1/120);continuous(reappeared,a,1/120,'respawn');assert.ok(a.visibility<.01);
const idleA=setup(22),idleB=setup(22);for(let i=0;i<30;i++)F.ambient(idleA,1/30);for(let i=0;i<144;i++)F.ambient(idleB,1/144);for(let i=0;i<6;i++){assert.ok(distance([idleA.pondFish[i].x,idleA.pondFish[i].y],[idleB.pondFish[i].x,idleB.pondFish[i].y])<1e-8,'idle swimming also uses a fixed timestep');}const frozen=idleB.pondFish.map(snapshot);F.ambient(idleB,0);assert.deepEqual(idleB.pondFish.map(snapshot),frozen,'zero-time/pause does not advance animation');

// Natural casts at different render rates, including hook and jump transitions.
const outcomes={pike:0,zander:0,empty:0},modes=new Set(),behaviors=new Set();let hooks=0,jumps=0,maxStep=0;
for(const hz of [30,60,144])for(let day=1;day<=32;day++){
 const e=setup(day);e.state.day=day;cast(e,.75);let t=0;
 while(e.fishing&&t<110){const f=e.fishing,oldStage=f.stage,old=e.pondFish.map(snapshot);f.held=f.stage==='fight'?control(f):f.wetTime>(day%2?5:30);F.update(e,1/hz);t+=1/hz;
  for(let i=0;i<e.pondFish.length;i++){const a=e.pondFish[i];continuous(old[i],a,1/hz,'natural '+hz+' Hz');modes.add(a.mode);if(a.mode!=='caught'&&old[i].mode!=='caught')maxStep=Math.max(maxStep,Math.hypot(a.x-old[i].x,a.y-old[i].y));}
  if(f.stage==='fight'&&oldStage!=='fight')hooks++;if(f.behavior)behaviors.add(f.behavior);if(f.airborne)jumps++;
 }
 outcomes[e.lastCatch?.species||'empty']++;
}
assert.ok(hooks>15&&jumps>0);for(const mode of ['follow','inspect','strike','reject'])assert.ok(modes.has(mode));for(const behavior of ['run','dive','circle','rest','jump'])assert.ok(behaviors.has(behavior));assert.ok(outcomes.pike>=6&&outcomes.zander>=6&&outcomes.empty>0);
console.log('PASS six-fish shoal, proportional tails, continuous yaw/body/opacity, active cast phases, released jumps/bounds, invisible respawn; 96 natural casts at 30/60/144 Hz',outcomes,'max mouth step',maxStep.toFixed(2));
