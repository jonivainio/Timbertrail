const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.PE=require('../engine.js');const art=require('../traveller-art.js'),equipment=require('../equipment.js'),meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/art-v2/traveller-bow.json'),'utf8'));
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-7,msg||`${a} != ${b}`),dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const calls=[],c=new Proxy({drawImage(...a){calls.push(a);},scale(...a){calls.push(['scale',...a]);}},{get:(o,k)=>o[k]||(()=>{})});
const r={c,sprites:{},visualV2:true,artTravellerBow:{id:'bow'},makeCanvas:()=>({width:140,height:116,getContext:()=>c}),sprite(){calls.push(['old']);}};
const e=new PE.Engine();e.start();e.state.equipped='bow';
const heldPath=[],heldContext=new Proxy({lineTo(x,y){heldPath.push([x,y]);},moveTo(x,y){heldPath.push([x,y]);}},{get:(o,k)=>o[k]||(()=>{})});equipment._drawTool(heldContext,'bow');assert.ok(heldPath.some(p=>p[0]===0&&p[1]===0),'carried bow riser shares the actual hand origin');
for(let i=0;i<2;i++){const f=art.bowFrames[i],m=meta.frames[i];assert.deepEqual(f.rect,m.rect);assert.deepEqual(f.anchor,m.anchor);assert.deepEqual(f.shoulder,m.shoulder.map((v,j)=>v-m.anchor[j]));}
let count=0;for(const map of ['forest','river','pond'])for(const crouching of [false,true])for(const facing of [-1,1])for(let deg=-89;deg<=89;deg+=2)for(const time of [0,.16,.319999,.32,.4,.749]){
 e.state.currentMap=map;Object.assign(e.state.player,{x:2460,facing,crouching});const grip=crouching?[17,-29]:[20,-42],angle=deg*Math.PI/180,ground=PE.ground(2460,map);e.attack={time,duration:.75,wx:2460+facing*(grip[0]+500*Math.cos(angle)),wy:ground+grip[1]+500*Math.sin(angle)};
 const aim=equipment.bowAim(e),s=art.bowSample(e,aim),before=JSON.stringify(e.state),attack=JSON.stringify(e.attack);near(s.angle,angle);assert.equal(s.released,time>=.32);
 for(const rig of [s.front,s.back]){assert.ok(rig.reachable,'unreachable elbow at '+[deg,time,crouching]);near(dist(rig.shoulder,rig.elbow),rig.upper);near(dist(rig.elbow,rig.wrist),rig.fore);}
 near(dist(s.grip,s.drawHand),13*s.pull);assert.deepEqual(s.front.wrist,s.grip);assert.deepEqual(s.back.wrist,s.drawHand);const origin=equipment.projectileOrigin(e);near(origin.x,2460+facing*(s.grip[0]+31*Math.cos(angle)));near(origin.y,ground+s.grip[1]+31*Math.sin(angle));
 if(deg===1&&time===.32){calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]===r.artTravellerBow));assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===facing));}
 assert.equal(JSON.stringify(e.state),before);assert.equal(JSON.stringify(e.attack),attack);count++;
}
// No elbow branch jump as continuous pointer aim crosses horizontal or vertical.
for(const crouching of [false,true]){e.state.player.crouching=crouching;e.attack.time=.2;let last;for(let angle=-Math.PI/2+.001;angle<Math.PI/2;angle+=.002){const p=art.bowSample(e,{localGrip:crouching?[17,-29]:[20,-42],angle});if(last)assert.ok(dist(p.back.elbow,last)<.15);last=p.back.elbow;}}
r.artTravellerBow=null;calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='old'));const origin=equipment.projectileOrigin(e);r.artTravellerBow={};assert.deepEqual(equipment.projectileOrigin(e),origin,'late load never alters trajectory');r.visualV2=false;assert.equal(art.drawBow(r,c,e,equipment.bowAim(e),()=>{}),false);
for(const hz of [30,60,144])for(const facing of [-1,1]){let events=0;const sim=new PE.Engine(ev=>{if(ev.type==='sound'&&ev.name==='bow'){events++;const o=equipment.projectileOrigin(sim),p=sim.projectiles.at(-1);near(p.x,o.x);near(p.y,o.y);assert.equal(art.bowSample(sim,equipment.bowAim(sim)).released,true);}});sim.start();sim.state.equipped='bow';sim.state.inventory.arrows=3;assert.equal(sim.shoot(sim.state.player.x+facing*260,PE.ground(sim.state.player.x,'forest')-100),true);for(let i=0;i<hz;i++)sim.update(1/hz);assert.equal(events,1);assert.equal(sim.state.inventory.arrows,2);assert.equal(sim.attack,null);}
console.log('PASS bow '+count+' map/stance/facing/angle/time cases, exact fixed-length joints, continuous aim, renderer purity, hand/arrow anchors, late fallback and real30/60/144Hz single release.');
