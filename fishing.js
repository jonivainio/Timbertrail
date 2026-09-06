/* Spinning v1: fixed-step lure/line/fish simulation. No DOM or rendering dependencies. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const species={
 pike:{name:'Pike',min:.5,max:15,mean:2.8,sd:2.7,depth:38,speed:29,burst:1.65,commit:.66},
 zander:{name:'Zander',min:.5,max:10,mean:1.8,sd:1.9,depth:102,speed:20,burst:1.3,commit:.48}
};
function rng(seed){let n=seed>>>0;return()=>{n+=0x6D2B79F5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
function weight(id,random){const s=species[id];for(let i=0;i<100;i++){const z=Math.sqrt(-2*Math.log(Math.max(1e-9,random())))*Math.cos(2*Math.PI*random()),w=s.mean+s.sd*z;if(w>=s.min&&w<=s.max)return Math.round(w*100)/100;}return s.mean;}
const trophyLimit=id=>species[id].min+.8*(species[id].max-species[id].min);
const approach=(value,target,rate,dt)=>value+clamp(target-value,-rate*dt,rate*dt);
function strength(fish){return(.45+.55*fish.stamina)*(1+Math.sqrt(fish.weight)*.16)*species[fish.species].burst/1.3;}
const bodyLength=fish=>24*Math.cbrt(fish.weight);
function waterBounds(){const p=root.PERegions.pond;return{left:p.chair-410,right:p.chair-16,top:p.surface+2,bottom:p.surface+154};}
function contain(a,dt){const b=waterBounds();a.x=clamp(a.x+a.vx*dt,b.left,b.right);a.y=a.airborne?a.y+a.vy*dt:clamp(a.y+a.vy*dt,b.top,b.bottom);if(a.x<=b.left&&a.vx<0||a.x>=b.right&&a.vx>0)a.vx=0;if(!a.airborne&&(a.y<=b.top&&a.vy<0||a.y>=b.bottom&&a.vy>0))a.vy=0;}
function animateFish(fish,dt){
 const speed=Math.hypot(fish.vx,fish.vy),active=fish.mode==='strike'||fish.mode==='hooked';
 fish.beatRate=approach(fish.beatRate??3,2.4+Math.min(6,speed*.1)+(active?1.2:0),4,dt);
 fish.beat=(fish.beat||0)+dt*fish.beatRate;
 fish.effort=approach(fish.effort||0,clamp(speed/65+(active?.15:0),0,1),1.2,dt);
 // Hysteresis avoids left/right chatter at nearly vertical motion. Yaw crosses
 // through an end-on view instead of instantly mirroring about the mouth.
 if(Math.abs(fish.vx)>5)fish.facing=fish.vx<0?-1:1;
 fish.yaw=approach(fish.yaw??(fish.facing<0?Math.PI:0),fish.facing<0?Math.PI:0,1.9,dt);
 const pitch=clamp(Math.atan2(fish.vy,Math.max(16,Math.abs(fish.vx))),-.8,.8);
 fish.pitch=approach(fish.pitch||0,pitch,1.6,dt);
 fish.jaw=approach(fish.jaw||0,fish.mode==='strike'?1:fish.mode==='inspect'?.2:fish.mode==='hooked'?.35:0,3,dt);
 const visible=fish.mode==='hooked'?.78:['strike','inspect'].includes(fish.mode)?.6:.42;
 fish.visibility=approach(fish.visibility??.42,visible,.32,dt);
}
function restore(raw={}){const out={casts:0,caught:0,best:{pike:0,zander:0}};for(const k of ['casts','caught'])if(Number.isSafeInteger(raw?.[k])&&raw[k]>=0)out[k]=Math.min(raw[k],1e8);for(const id of Object.keys(species)){const w=raw?.best?.[id];if(Number.isFinite(w)&&w>=species[id].min&&w<=species[id].max)out.best[id]=w;}return out;}
function ready(e){const s=e.state,p=s.player;return s.running&&!e.transition&&!s.cabinHome?.inside&&s.currentMap==='pond'&&p.sitting&&Math.abs(p.x-root.PERegions.pond.chair)<8&&s.equipped==='rod'&&s.inventory.rod>0;}
function canCast(e,x,y){const p=e.state.player;return ready(e)&&!e.fishing&&Number.isFinite(x)&&Number.isFinite(y)&&x<p.x-25&&x>p.x-350&&y>root.PERegions.pond.surface-110&&y<root.PERegions.pond.surface+165;}
// Atlas anchors in each 384x512 cell: seat x, boot baseline, rod socket x/y,
// handle direction. Simulation and rendering consume the same authored joints.
const poseFrames=[
 [165,484,307,230,0],[128,484,259,183,-.14],[128,484,249,138,-.2],[128,484,212,82,-.55],
 [147,462,78,48,-2.05],[135,462,44,90,-3.1],[128,462,321,121,0],[135,462,234,146,0]
],poseScale=.145;
function pose(e){const f=e.fishing,p=e.state.player;let phase=0;
 if(f?.kind==='spinning'){if(f.stage==='charge')phase=Math.min(5,Math.floor(f.power*6));else if(f.stage==='flight'&&f.age<.32)phase=6;else if(f.stage==='fight')phase=7;}
 const frame=poseFrames[phase],angle=frame[4],grip={x:p.x-(frame[2]-frame[0])*poseScale,y:root.PE.ground(p.x,e.state.currentMap)+(frame[3]-frame[1])*poseScale};
 const length=64,load=clamp(f?.tension||0,0,1.35),bend=load*25;
 // Cubic cantilever: the first tangent ALWAYS follows the painted cork handle.
 const vx=-Math.cos(angle),vy=Math.sin(angle),tip={x:grip.x+vx*length,y:grip.y+vy*length+bend};
 const c1={x:grip.x+vx*length*.4,y:grip.y+vy*length*.4},c2={x:grip.x+vx*length*.78,y:grip.y+vy*length*.78+bend*.35};
 return {phase,frame,scale:poseScale,grip,angle,tip,c1,c2,bend};
}
function shoal(e){if(e.pondFish)return e.pondFish;const random=rng(89731+e.state.day*997+e.state.fishery.caught*71),p=root.PERegions.pond;
 e.pondWater={ripples:[],spray:[],bubbles:[]};
 e.pondFish=Array.from({length:6},(_,i)=>{const id=i%2?'zander':'pike',s=species[id],heading=random()<.5?-1:1;return{id:i,species:id,weight:weight(id,random),x:p.chair-75-i/5*245+(random()-.5)*18,y:p.surface+s.depth+random()*24,vx:heading*s.speed*.2,vy:0,mode:'roam',timer:random()*4+1,interest:0,cooldown:random()*5,stamina:1,heading,facing:heading,yaw:heading<0?Math.PI:0,pitch:0,beat:random()*6.28,effort:0,jaw:0,visibility:.42,random};});return e.pondFish;}
function cancel(e,message){if(!e.fishing||e.fishing.kind!=='spinning')return;const f=e.fishing;if(f.fish){f.fish.mode='roam';f.fish.cooldown=9;f.fish.interest=0;f.fish.airborne=!!f.airborne;}if(e.pondWater)for(const k of ['ripples','spray','bubbles'])e.pondWater[k].push(...(f[k]||[]));e.fishing=null;if(message)e.notify(message);e.emit('change');}
function press(e,x,y){const f=e.fishing;if(f?.kind==='spinning'){if(['flight','wet','fight'].includes(f.stage)){f.held=true;return true;}return false;}if(!canCast(e,x,y))return false;
 e.state.fishery||=restore();e.state.fishery.casts++;shoal(e);e.action=null;e.walkTarget=null;e.keys={};e.fishing={kind:'spinning',stage:'charge',held:true,power:0,age:0,accumulator:0,tension:0,strain:0,slack:0,lineLength:0,points:[],ripples:[],bubbles:[],random:rng(13981+e.state.fishery.casts*1777+e.state.day*391)};e.emit('change');return true;}
function release(e,abort=false){const f=e.fishing;if(f?.kind!=='spinning')return;f.held=false;if(abort){if(f.stage==='charge')cancel(e);return;}if(f.stage!=='charge')return;
 f.stage='flight';f.age=0;const tip=pose(e).tip,T=.72+f.power*.72,range=50+f.power*215;
 f.lure={x:tip.x,y:tip.y,vx:-range/T,vy:(root.PERegions.pond.surface-tip.y-.5*260*T*T)/T};f.lineLength=0;f.flightTime=T;f.targetX=tip.x-range;e.sound('cast',.35);e.emit('change');}
function ripple(f,x,y){f.ripples.push({x,y,life:1});}
function splash(e,f,amount=1){const l=f.lure,water=root.PERegions.pond.surface;ripple(f,l.x,water);f.spray||=[];for(let i=0;i<10*amount;i++)f.spray.push({x:l.x,y:water,vx:(f.random()-.5)*55,vy:-18-f.random()*48,life:.45+f.random()*.4});e.sound('fishSplash',.45*amount);}
function land(e,f){const fish=f.fish,id=fish.species,record={species:id,weight:fish.weight,trophy:fish.weight>=trophyLimit(id),portions:Math.min(8,Math.max(1,Math.round(fish.weight))),best:fish.weight>e.state.fishery.best[id]};
 e.state.fishery.caught++;e.state.fishery.best[id]=Math.max(e.state.fishery.best[id],fish.weight);e.state.inventory.rawFish+=record.portions;e.state.discovered.rawFish=true;e.state.journal.caught.fish=true;e.lastCatch=record;fish.mode='caught';fish.visibility=0;fish.cooldown=65;e.fishing=null;e.sound('catch',.5);e.emit('change');e.emit('save');e.emit('panel',{panel:'fish-catch'});}
function updateFish(e,f,dt){const pond=root.PERegions.pond;
 for(const fish of shoal(e)){
  if(fish===f.fish&&f.stage==='fight')continue;
  const sp=species[fish.species],random=fish.random;fish.cooldown=Math.max(0,fish.cooldown-dt);fish.timer-=dt;
  if(fish.mode==='caught'){if(fish.cooldown<=0){Object.assign(fish,{mode:'roam',x:pond.chair-380,y:pond.surface+sp.depth,vx:sp.speed*.2,vy:0,stamina:1,heading:1,facing:1,yaw:0,pitch:0,visibility:0,airborne:false,weight:weight(fish.species,random)});}continue;}
  // A released jumping fish completes the same arc; it never snaps back into
  // the narrower roaming depth range when a cast is cancelled or the line breaks.
  if(fish.airborne){fish.vy+=210*dt;fish.vx*=Math.exp(-.35*dt);contain(fish,dt);if(fish.y>=pond.surface+2&&fish.vy>0){fish.airborne=false;fish.vy*=.25;splash(e,{...e.pondWater,lure:fish,random},.7);}animateFish(fish,dt);continue;}
  const l=f.lure,dist=l?Math.hypot(fish.x-l.x,fish.y-l.y):Infinity,depth=l?l.y-pond.surface:0;
  const available=f.stage==='wet'&&l&&fish.cooldown===0&&(fish.species==='pike'?depth<100:depth>55)&&f.wetTime>1.3;
  let tx=fish.x+fish.heading*45,ty=pond.surface+sp.depth+Math.sin((fish.beat||0)*.16+fish.id)*18,speed=sp.speed*.3;
  if(fish.mode==='reject'&&fish.timer>0){tx=fish.retreatX;ty=fish.retreatY;speed=sp.speed*1.5;}
  else if(available&&dist<125){
   if(!['follow','inspect','strike'].includes(fish.mode)){fish.mode='follow';fish.interest=0;fish.side=random()<.5?-1:1;}
   fish.interest+=dt;tx=l.x;ty=l.y;speed=sp.speed*(fish.species==='pike'?1.12:.9);
   if(fish.mode==='follow'&&dist<30){fish.mode='inspect';fish.timer=.35+random()*.85;}
   if(fish.mode==='inspect'){tx=l.x+fish.side*18;ty=l.y+Math.sin(fish.interest*4)*9;speed=sp.speed*.65;if(fish.timer<=0){fish.mode='strike';fish.timer=.7+random()*.3;}}
   if(fish.mode==='strike'){
    tx=l.x+l.vx*.1;ty=l.y+l.vy*.1;speed=sp.speed*(fish.species==='pike'?3:2.4);
    if(dist<4){e.sound('fishNibble',.35);f.nibble=1.2;fish.cooldown=3+random()*5;
     if(random()<sp.commit&&(f.tension>.05||f.held)){
      Object.assign(f,{stage:'fight',age:0,fish,slackTime:0,strain:0,surge:1,run:-1,runY:.1,behavior:'run',hookGrace:1,jumpCooldown:4+f.random()*4,airborne:false,dragRate:0});
      // The tiny lure meets the mouth; the much larger fish is never teleported.
      Object.assign(l,{x:fish.x,y:fish.y,vx:fish.vx,vy:fish.vy});Object.assign(fish,{mode:'hooked',stamina:1,timer:2.6});f.tension=Math.min(f.tension,.2);e.sound('fishHook',.5);e.emit('change');continue;
     }
     fish.timer=.8+random()*.8;fish.mode='reject';fish.retreatX=fish.x+(fish.x<l.x?-45:45);fish.retreatY=clamp(fish.y+(random()-.5)*65,pond.surface+15,pond.surface+145);fish.interest=0;
    }else if(fish.timer<=0){fish.mode='roam';fish.cooldown=1.5;}
   }
  }else{fish.mode='roam';fish.interest=0;if(fish.timer<=0){fish.timer=1.5+random()*4;fish.heading=random()<.5?-1:1;fish.cruise=random()<.2?.05:.18+random()*.35;}speed=sp.speed*(fish.cruise??.25);}
  // Anticipate the shoreline/depth limits before collision. The same hard limits
  // are shared by free and hooked fish, including fish just released near a pier.
  const bounds=waterBounds(),pursuing=['follow','inspect','strike'].includes(fish.mode);tx=clamp(tx,bounds.left+(pursuing?0:30),bounds.right-(pursuing?0:30));ty=clamp(ty,bounds.top+(pursuing?0:16),bounds.bottom-(pursuing?0:18));
  // Soft steering, changing depth and neighbor separation avoid sliding icon clusters.
  const dx=tx-fish.x,dy=ty-fish.y,len=Math.hypot(dx,dy)||1;let sx=0,sy=0;
  if(fish.mode!=='strike')for(const other of e.pondFish){if(other===fish||other.mode==='caught')continue;const x=fish.x-other.x,y=fish.y-other.y,d=Math.hypot(x,y);if(d>0&&d<22){sx+=x/d*(22-d)*.8;sy+=y/d*(22-d)*.8;}}
  const turn=fish.mode==='strike'?5:2,accel=fish.mode==='strike'?135:65;fish.vx+=clamp((dx/len*speed+sx-fish.vx)*turn,-accel,accel)*dt;fish.vy+=clamp((dy/len*speed+sy-fish.vy)*turn,-accel,accel)*dt;
  contain(fish,dt);if(fish.x<bounds.left+35)fish.heading=1;if(fish.x>bounds.right-35)fish.heading=-1;animateFish(fish,dt);
 }
}
function chooseRun(f){const fish=f.fish,q=f.random(),canJump=fish.stamina>.24&&f.jumpCooldown<=0;
 f.behavior=canJump&&q<(fish.species==='pike'?.3:.15)?'surface':q<.57?'run':q<.76?'dive':q<.89?'circle':'rest';
 fish.timer=f.behavior==='surface'?5.5:1.8+f.random()*2.7;
 f.run=f.behavior==='run'?-1:f.behavior==='rest'?.15:f.random()<.55?-1:1;
 f.runY=f.behavior==='surface'?-1.8:f.behavior==='dive'?1.15:(f.random()-.5)*.9;
 f.surge=f.behavior==='run'?1:f.behavior==='rest'?.1:.45+f.random()*.35;
}
function fightStep(e,f,tip,dt){const l=f.lure,fish=f.fish,sp=species[fish.species],water=root.PERegions.pond.surface;
 fish.timer-=dt;f.jumpCooldown=Math.max(0,(f.jumpCooldown||0)-dt);f.hookGrace=Math.max(0,(f.hookGrace||0)-dt);
 if(!f.airborne&&fish.timer<=0)chooseRun(f);
 const power=strength(fish),dx=tip.x-l.x,dy=tip.y-l.y,d=Math.hypot(dx,dy)||1,away=Math.max(0,-(l.vx*dx+l.vy*dy)/d);
 // A clutch slips under a strong run; releasing the handle pays out more freely.
 f.dragRate=f.held?clamp((f.tension-.65)/.45,0,1)*Math.min(18,away*.65):f.tension>.18?36+power*8:4;
 const retrieve=f.held?(25+(1-fish.stamina)*27):0;f.lineLength=clamp(f.lineLength+(f.dragRate-retrieve)*dt,7,470);
 const extension=Math.max(0,d-f.lineLength),target=clamp(extension/17,0,1.25);
 // Gradual, strength-dependent loading is authoritative for BOTH bend and break risk.
 const rise=.055+power*.065+(f.behavior==='run'?.025:0),fall=f.held?.25:.55;
 f.tension+=clamp(target-f.tension,-fall*dt,(f.hookGrace>0?.055:rise)*dt);
 const pull=extension*12,escape=sp.speed*sp.burst*power*(f.surge??.6)*2.3;
 if(f.airborne){l.vx+=(dx/d*pull*.18-l.vx*.35)*dt;l.vy+=(210+dy/d*pull*.18)*dt;}
 else{const circle=f.behavior==='circle'?Math.sin(f.age*2.4):f.run;l.vx+=(circle*escape+dx/d*pull-l.vx*3.4)*dt;l.vy+=(f.runY*escape*.55+dy/d*pull-l.vy*3.4)*dt;
  if(f.behavior==='surface'&&l.y<=water+9&&f.jumpCooldown<=0){f.airborne=true;f.behavior='jump';f.jumpCount=(f.jumpCount||0)+1;f.jumpCooldown=12+f.random()*10;l.vy=-85-f.random()*25;l.vx=-22-f.random()*20;splash(e,f,.65);}
 }
 fish.stamina=Math.max(0,fish.stamina-dt*(.018+f.tension*.041)/(1+fish.weight*.06));
 f.strain=clamp(f.strain+dt*(f.tension>.96?.18+(f.tension-.96)*.5:-.45),0,1);
 f.slackTime=f.slack>38&&!f.airborne?f.slackTime+dt:Math.max(0,f.slackTime-dt*2);
 if(f.strain>=1){e.sound('lineSnap',.45);cancel(e,'The line broke. Release the mouse when tension rises.');return false;}
 if(f.slackTime>5){cancel(e,'The hook came loose. Keep a little tension on the line.');return false;}
 f.bubbleClock=(f.bubbleClock||0)+dt;if(!f.airborne&&f.tension>.3&&f.bubbleClock>mix(.4,.055,Math.min(1,f.tension))){f.bubbleClock=0;f.bubbles.push({x:l.x-Math.sign(l.vx)*9,y:l.y+2,life:1.3,size:1+f.random()*1.4});}
 if(!f.airborne&&d<75&&l.y<water+24&&fish.stamina<.3&&f.held){land(e,f);return false;}return true;
}
function linePoints(f,tip,dt){const N=18,l=f.lure;if(!l)return;const d=Math.hypot(l.x-tip.x,l.y-tip.y),slack=Math.max(0,f.lineLength-d),sag=Math.min(42,Math.sqrt(slack*12));
 if(!f.points.length)for(let i=0;i<=N;i++){const u=i/N;f.points.push({x:mix(tip.x,l.x,u),y:mix(tip.y,l.y,u),vx:0,vy:0});}
 // Damped rope modes anchored at both ends: slack droops, taut line straightens.
 for(let i=0;i<=N;i++){const u=i/N,p=f.points[i],x=mix(tip.x,l.x,u),y=mix(tip.y,l.y,u)+Math.sin(Math.PI*u)*sag;if(i===0||i===N){p.x=x;p.y=y;p.vx=p.vy=0;}else{p.vx+=(x-p.x)*150*dt;p.vy+=(y-p.y)*150*dt;const damping=Math.exp(-17*dt);p.vx*=damping;p.vy*=damping;p.x+=p.vx*dt;p.y+=p.vy*dt;}}
}
function updateEffects(f,dt){if(!f)return;f.ripples=f.ripples.filter(r=>(r.life-=dt)>0);f.bubbles=f.bubbles.filter(b=>{b.y-=dt*9;return(b.life-=dt)>0;});f.spray=(f.spray||[]).filter(p=>{p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt;return(p.life-=dt)>0;});}
function substep(e,f,dt){f.age+=dt;f.nibble=Math.max(0,(f.nibble||0)-dt);const water=root.PERegions.pond.surface;updateEffects(e.pondWater,dt);updateEffects(f,dt);
 if(f.stage==='charge'){f.power=clamp(f.age/1.55,0,1);updateFish(e,f,dt);return;}
 const l=f.lure,tip=pose(e).tip;
 if(f.stage==='flight'){l.vy+=260*dt;l.x+=l.vx*dt;l.y+=l.vy*dt;f.lineLength=Math.hypot(l.x-tip.x,l.y-tip.y)+8;
  if(l.y>=water&&l.vy>0){l.y=water+1;l.vx*=.08;l.vy=8;f.stage='wet';f.age=0;f.wetTime=0;f.lineLength+=18;ripple(f,l.x,water);e.sound('lureSplash',.55);e.emit('change');}
 }else{
  const dx=tip.x-l.x,dy=tip.y-l.y,d=Math.hypot(dx,dy)||1;f.slack=Math.max(0,f.lineLength-d);
  if(f.stage==='wet'){
   f.wetTime+=dt;if(f.held)f.lineLength=Math.max(8,f.lineLength-41*dt);else f.lineLength=Math.min(440,f.lineLength+4*dt);
   const extension=Math.max(0,d-f.lineLength);f.tension=clamp(extension/7,0,.65);
   l.vx+=(dx/d*extension*20-l.vx*3)*dt;l.vy+=(19+dy/d*extension*20-l.vy*2.7)*dt;
   if(d<65&&f.held){cancel(e,'The lure is back. Try a different depth.');return;}
  }else if(f.stage==='fight'&&!fightStep(e,f,tip,dt))return;
  l.airborne=!!f.airborne;contain(l,dt);
  if(f.airborne&&l.y>=water+2&&l.vy>0){f.airborne=l.airborne=false;l.vy*=.25;f.behavior='rest';f.fish.timer=1.6;f.run=.15;f.runY=.1;f.surge=.1;splash(e,f,1);}
  if(f.stage==='fight'){f.fish.x=l.x;f.fish.y=l.y;f.fish.vx=l.vx;f.fish.vy=l.vy;f.fish.airborne=!!f.airborne;animateFish(f.fish,dt);}
 }
 updateFish(e,f,dt);
 linePoints(f,pose(e).tip,dt);
}
function ambient(e,dt){if(e.state.currentMap!=='pond'||e.state.player.x>=root.PERegions.pond.shore+100||e.fishing)return;shoal(e);e.pondWater.accumulator=(e.pondWater.accumulator||0)+Math.min(.1,Math.max(0,dt));while(e.pondWater.accumulator+1e-10>=1/120){e.pondWater.accumulator=Math.max(0,e.pondWater.accumulator-1/120);updateFish(e,{stage:'idle',lure:null},1/120);updateEffects(e.pondWater,1/120);}}
function update(e,dt){const f=e.fishing;if(f?.kind!=='spinning')return;if(!ready(e)){cancel(e);return;}f.accumulator+=Math.min(.1,Math.max(0,dt));while(e.fishing===f&&f.accumulator+1e-10>=1/120){f.accumulator=Math.max(0,f.accumulator-1/120);substep(e,f,1/120);}}
root.PEFishing={species,rng,weight,trophyLimit,restore,ready,canCast,pose,poseFrames,shoal,press,release,cancel,update,ambient,strength,animateFish,bodyLength,waterBounds};if(typeof module!=='undefined')module.exports=root.PEFishing;
})(typeof window==='undefined'?globalThis:window);
