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
 e.pondFish=Array.from({length:8},(_,i)=>{const id=i%2?'zander':'pike',s=species[id];return{id:i,species:id,weight:weight(id,random),x:p.chair-65-random()*275,y:p.surface+s.depth+random()*32,vx:0,vy:0,mode:'roam',timer:random()*4+1,interest:0,cooldown:random()*5,stamina:1,heading:random()<.5?-1:1,random};});return e.pondFish;}
function cancel(e,message){if(!e.fishing||e.fishing.kind!=='spinning')return;const f=e.fishing;if(f.fish){f.fish.mode='roam';f.fish.cooldown=9;f.fish.interest=0;}e.fishing=null;if(message)e.notify(message);e.emit('change');}
function press(e,x,y){const f=e.fishing;if(f?.kind==='spinning'){if(['flight','wet','fight'].includes(f.stage)){f.held=true;return true;}return false;}if(!canCast(e,x,y))return false;
 e.state.fishery||=restore();e.state.fishery.casts++;shoal(e);e.action=null;e.walkTarget=null;e.keys={};e.fishing={kind:'spinning',stage:'charge',held:true,power:0,age:0,accumulator:0,tension:0,strain:0,slack:0,lineLength:0,points:[],ripples:[],bubbles:[],random:rng(13981+e.state.fishery.casts*1777+e.state.day*391)};e.emit('change');return true;}
function release(e,abort=false){const f=e.fishing;if(f?.kind!=='spinning')return;f.held=false;if(abort){if(f.stage==='charge')cancel(e);return;}if(f.stage!=='charge')return;
 f.stage='flight';f.age=0;const tip=pose(e).tip,T=.72+f.power*.72,range=50+f.power*215;
 f.lure={x:tip.x,y:tip.y,vx:-range/T,vy:(root.PERegions.pond.surface-tip.y-.5*260*T*T)/T};f.lineLength=0;f.flightTime=T;f.targetX=tip.x-range;e.sound('cast',.35);e.emit('change');}
function ripple(f,x,y){f.ripples.push({x,y,life:1});}
function land(e,f){const fish=f.fish,id=fish.species,record={species:id,weight:fish.weight,trophy:fish.weight>=trophyLimit(id),portions:Math.min(8,Math.max(1,Math.round(fish.weight))),best:fish.weight>e.state.fishery.best[id]};
 e.state.fishery.caught++;e.state.fishery.best[id]=Math.max(e.state.fishery.best[id],fish.weight);e.state.inventory.rawFish+=record.portions;e.state.discovered.rawFish=true;e.state.journal.caught.fish=true;e.lastCatch=record;fish.mode='caught';fish.cooldown=65;e.fishing=null;e.sound('catch',.5);e.emit('change');e.emit('save');e.emit('panel',{panel:'fish-catch'});}
function updateFish(e,f,dt){const pond=root.PERegions.pond;
 for(const fish of shoal(e)){if(fish===f.fish&&f.stage==='fight')continue;const sp=species[fish.species],random=fish.random;fish.cooldown=Math.max(0,fish.cooldown-dt);fish.timer-=dt;
  if(fish.mode==='caught'){if(fish.cooldown<=0){fish.mode='roam';fish.x=pond.chair-300;fish.weight=weight(fish.species,random);}continue;}
  const l=f.lure,available=f.stage==='wet'&&l&&fish.cooldown===0,dist=l?Math.hypot(fish.x-l.x,fish.y-l.y):Infinity,depth=l?l.y-pond.surface:0;
  const suitable=fish.species==='pike'?depth<100:depth>55;
  if(available&&suitable&&dist<100&&f.wetTime>1.3){fish.mode='follow';const dx=l.x-fish.x,dy=l.y-fish.y,len=Math.hypot(dx,dy)||1;fish.vx=dx/len*sp.speed;fish.vy=dy/len*sp.speed;fish.interest+=dt;
   if(dist<13&&fish.interest>.7){ripple(f,l.x,l.y);e.sound('fishNibble',.35);fish.cooldown=3+random()*5;fish.interest=0;
    // A nibble can reject the lure. A moving, taut presentation hooks more reliably.
    if(random()<sp.commit&&(f.tension>.05||f.held)){f.stage='fight';f.age=0;f.fish=fish;fish.mode='hooked';fish.stamina=1;fish.timer=.3;f.slackTime=0;f.strain=0;f.surge=0;f.run=1;f.runY=0;e.sound('fishHook',.4);e.emit('change');return;}
    f.nibble=1;fish.mode='roam';fish.heading=random()<.5?-1:1;
   }
  }else{if(fish.timer<=0){fish.timer=2+random()*4;fish.heading=random()<.5?-1:1;}fish.mode='roam';fish.vx=fish.heading*sp.speed*.22;fish.vy=(pond.surface+sp.depth+Math.sin(e.state.playSeconds*.3+fish.id)*16-fish.y)*.3;fish.interest=Math.max(0,fish.interest-dt);}
  fish.x=clamp(fish.x+fish.vx*dt,pond.chair-370,pond.chair-38);fish.y=clamp(fish.y+fish.vy*dt,pond.surface+12,pond.surface+151);if(fish.x<=pond.chair-369||fish.x>=pond.chair-39)fish.heading*=-1;
 }
}
function linePoints(f,tip,dt){const N=18,l=f.lure;if(!l)return;const d=Math.hypot(l.x-tip.x,l.y-tip.y),slack=Math.max(0,f.lineLength-d),sag=Math.min(42,Math.sqrt(slack*12));
 if(!f.points.length)for(let i=0;i<=N;i++){const u=i/N;f.points.push({x:mix(tip.x,l.x,u),y:mix(tip.y,l.y,u),vx:0,vy:0});}
 // Damped rope modes anchored at both ends: slack droops, taut line straightens.
 for(let i=0;i<=N;i++){const u=i/N,p=f.points[i],x=mix(tip.x,l.x,u),y=mix(tip.y,l.y,u)+Math.sin(Math.PI*u)*sag;if(i===0||i===N){p.x=x;p.y=y;p.vx=p.vy=0;}else{p.vx+=(x-p.x)*150*dt;p.vy+=(y-p.y)*150*dt;const damping=Math.exp(-17*dt);p.vx*=damping;p.vy*=damping;p.x+=p.vx*dt;p.y+=p.vy*dt;}}
}
function substep(e,f,dt){f.age+=dt;f.nibble=Math.max(0,(f.nibble||0)-dt);const water=root.PERegions.pond.surface;
 if(f.stage==='charge'){f.power=clamp(f.age/1.55,0,1);return;}
 const l=f.lure,tip=pose(e).tip;f.ripples=f.ripples.filter(r=>(r.life-=dt)>0);f.bubbles=f.bubbles.filter(b=>{b.y-=dt*9;return(b.life-=dt)>0;});
 if(f.stage==='flight'){l.vy+=260*dt;l.x+=l.vx*dt;l.y+=l.vy*dt;f.lineLength=Math.hypot(l.x-tip.x,l.y-tip.y)+8;
  if(l.y>=water&&l.vy>0){l.y=water+1;l.vx*=.08;l.vy=8;f.stage='wet';f.age=0;f.wetTime=0;f.lineLength+=18;ripple(f,l.x,water);e.sound('lureSplash',.55);e.emit('change');}
 }else{
  const dx=tip.x-l.x,dy=tip.y-l.y,d=Math.hypot(dx,dy)||1;f.slack=Math.max(0,f.lineLength-d);
  if(f.stage==='wet'){
   f.wetTime+=dt;if(f.held)f.lineLength=Math.max(8,f.lineLength-41*dt);else f.lineLength=Math.min(440,f.lineLength+4*dt);
   const extension=Math.max(0,d-f.lineLength);f.tension=clamp(extension/7,0,.65);
   l.vx+=(dx/d*extension*20-l.vx*3)*dt;l.vy+=(19+dy/d*extension*20-l.vy*2.7)*dt;
   if(d<65&&f.held){cancel(e,'The lure is back. Try a different depth.');return;}
  }else if(f.stage==='fight'){
   const fish=f.fish,sp=species[fish.species];fish.timer-=dt;
   if(fish.timer<=0){fish.timer=.8+f.random()*1.9;f.run=f.random()<.76?-1:1;f.runY=(f.random()-.48)*1.3;f.surge=.45+f.random()*.55;}
   const strength=(.4+fish.stamina*.6)*(1+Math.sqrt(fish.weight)*.13),escape=sp.speed*sp.burst*strength*f.surge;
   // Brake pays out line when released. Holding reels and resists a running fish.
   if(f.held)f.lineLength=Math.max(7,f.lineLength-(29+(1-fish.stamina)*25)*dt);
   else f.lineLength=Math.min(470,f.lineLength+(f.tension>.3?40:4)*dt);
   const extension=Math.max(0,d-f.lineLength),target=clamp(extension/10,0,1.35);f.tension+=(target-f.tension)*Math.min(1,dt*12);
   l.vx+=(f.run*escape+dx/d*extension*19-l.vx*3.4)*dt;l.vy+=(f.runY*escape*.55+dy/d*extension*19-l.vy*3.4)*dt;
   fish.stamina=Math.max(0,fish.stamina-dt*(.018+f.tension*.031)/(1+fish.weight*.085));
   f.strain=clamp(f.strain+dt*(f.tension>.9?(f.tension-.9)*3.2:-.65),0,1);
   f.slackTime=f.slack>34?f.slackTime+dt:Math.max(0,f.slackTime-dt*2);
   if(f.strain>=1){e.sound('lineSnap',.45);cancel(e,'The line broke. Release the mouse when tension rises.');return;}
   if(f.slackTime>4){cancel(e,'The hook came loose. Keep a little tension on the line.');return;}
   f.bubbleClock=(f.bubbleClock||0)+dt;if(f.tension>.4&&f.bubbleClock>mix(.42,.055,Math.min(1,f.tension))){f.bubbleClock=0;f.bubbles.push({x:l.x,y:l.y,life:1.3,size:1+f.random()*1.4});}
   if(d<75&&l.y<water+24&&fish.stamina<.3&&f.held){land(e,f);return;}
  }
  l.x=clamp(l.x+l.vx*dt,e.state.player.x-410,e.state.player.x-16);l.y=clamp(l.y+l.vy*dt,water+2,water+154);
  if(l.y>=water+154)l.vy=Math.min(0,l.vy);if(l.x<=e.state.player.x-410||l.x>=e.state.player.x-16)l.vx=0;
  if(f.stage==='fight'){f.fish.x=l.x;f.fish.y=l.y;f.fish.vx=l.vx;}
  updateFish(e,f,dt);
 }
 linePoints(f,pose(e).tip,dt);
}
function ambient(e,dt){if(e.state.currentMap==='pond'&&e.state.player.x<root.PERegions.pond.shore+100&&!e.fishing)updateFish(e,{stage:'idle',lure:null},Math.min(.05,dt));}
function update(e,dt){const f=e.fishing;if(f?.kind!=='spinning')return;if(!ready(e)){cancel(e);return;}f.accumulator+=Math.min(.1,Math.max(0,dt));while(e.fishing===f&&f.accumulator>=1/120){f.accumulator-=1/120;substep(e,f,1/120);}}
root.PEFishing={species,rng,weight,trophyLimit,restore,ready,canCast,pose,poseFrames,shoal,press,release,cancel,update,ambient};if(typeof module!=='undefined')module.exports=root.PEFishing;
})(typeof window==='undefined'?globalThis:window);
