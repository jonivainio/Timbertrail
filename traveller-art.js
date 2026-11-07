/* Native original locomotion cels. Tool grip and cel share one pose sample. */
(function(root){'use strict';
 const TAU=Math.PI*2,anchor=Object.freeze([32,76]);
 // Baked by scripts/bake-traveller.cjs: [id, rect, near-hand] per 64×80 cel.
 const baked=/*BAKED*/[["idle-0",[0,0,64,80],[34,50]],["idle-1",[64,0,64,80],[34,49]],["idle-2",[128,0,64,80],[34,49]],["idle-3",[192,0,64,80],[34,50]],["walk-0",[256,0,64,80],[29,51]],["walk-1",[320,0,64,80],[23,47]],["walk-2",[0,80,64,80],[23,47]],["walk-3",[64,80,64,80],[29,51]],["walk-4",[128,80,64,80],[39,48]],["walk-5",[192,80,64,80],[44,41]],["walk-6",[256,80,64,80],[44,41]],["walk-7",[320,80,64,80],[39,48]],["run-0",[0,160,64,80],[39,43]],["run-1",[64,160,64,80],[34,45]],["run-2",[128,160,64,80],[34,44]],["run-3",[192,160,64,80],[39,44]],["run-4",[256,160,64,80],[44,37]],["run-5",[320,160,64,80],[44,33]],["run-6",[0,240,64,80],[44,32]],["run-7",[64,240,64,80],[44,38]],["crouch-idle",[128,240,64,80],[45,55]],["crouch-0",[192,240,64,80],[44,57]],["crouch-1",[256,240,64,80],[43,57]],["crouch-2",[320,240,64,80],[44,57]],["crouch-3",[0,320,64,80],[47,54]],["crouch-4",[64,320,64,80],[48,53]],["crouch-5",[128,320,64,80],[47,54]],["start-0",[192,320,64,80],[31,50]],["start-1",[256,320,64,80],[31,51]],["stop-brake",[320,320,64,80],[41,40]],["stop-0",[0,400,64,80],[36,49]],["stop-1",[64,400,64,80],[35,50]],["turn-0",[128,400,64,80],[29,51]],["turn-1",[192,400,64,80],[37,49]],["chop-0",[256,400,64,80],[25,33],-1.1],["chop-1",[320,400,64,80],[21,30],-1.65],["chop-2",[0,480,64,80],[40,37],0.35],["chop-3",[64,480,64,80],[49,43],1.4],["chop-4",[128,480,64,80],[45,47],1],["chop-5",[192,480,64,80],[41,50],0.4],["split-0",[256,480,64,80],[30,20],-0.6],["split-1",[320,480,64,80],[27,15],-1.05],["split-2",[0,560,64,80],[41,30],0.8],["split-3",[64,560,64,80],[46,52],2.1],["split-4",[128,560,64,80],[44,50],1.6],["split-5",[192,560,64,80],[41,50],0.6],["gather-0",[256,560,64,80],[43,57]],["gather-1",[320,560,64,80],[47,63]],["gather-2",[0,640,64,80],[44,61]],["gather-3",[64,640,64,80],[41,52]],["gather-4",[128,640,64,80],[37,50]],["skin-down",[192,640,64,80],[42,56]],["skin-0",[256,640,64,80],[47,66]],["skin-1",[320,640,64,80],[49,67]],["skin-2",[0,720,64,80],[47,68]],["skin-3",[64,720,64,80],[45,67]],["skin-up",[128,720,64,80],[41,55]],["pet-0",[192,720,64,80],[49,54]],["pet-1",[256,720,64,80],[45,52]],["throw-0",[320,720,64,80],[22,30]],["throw-1",[0,800,64,80],[38,24]],["throw-2",[64,800,64,80],[48,40]],["throw-3",[128,800,64,80],[44,48]]]/*END*/;
 const frames=Object.freeze(baked.map(([id,rect,hand,tool],i)=>Object.freeze({index:i,id,rect:Object.freeze(rect),hand:Object.freeze(hand),grip:Object.freeze([hand[0]-anchor[0],hand[1]-anchor[1]]),tool:Number.isFinite(tool)?tool:null})));
 const byId=Object.fromEntries(frames.map(f=>[f.id,f.index])),at=(id,fallback='idle-0')=>byId[id]??byId[fallback]??0;
 const CYCLE=Object.freeze({walk:8,run:8,crouch:6}),IDLE_LOOP=2.4;
 // Transition lengths (s): weight shift before the first step, planting stop, quick turn.
 const TRANSITION=Object.freeze({start:.12,stop:.15,stopRun:.2,turn:.1});
 function phaseOf(p){const stride=Number.isFinite(p.stride)?p.stride:0;return ((stride%TAU+TAU)%TAU)/TAU;}
 // Pure locomotion cel. The optional motion memo belongs to the renderer and only
 // remembers what was drawn last; simulation state is never written.
 function frame(p,memo=null,now=0){
  const phase=phaseOf(p),t=Number.isFinite(now)?now:0;
  if(memo){
   const facing=p.facing||1,was=memo.seen?memo:null;
   if(was){
    if(facing!==was.facing)memo.kind='turn',memo.t0=t;
    else if(p.moving&&!was.moving&&!p.crouching)memo.kind='start',memo.t0=t;
    else if(!p.moving&&was.moving&&!p.crouching)memo.kind=was.running?'stopRun':'stop',memo.t0=t;
   }
   Object.assign(memo,{seen:true,facing,moving:!!p.moving,running:!!p.running});
   const k=memo.kind,age=t-(memo.t0||0);
   if(k&&age>=0&&age<TRANSITION[k]&&!p.crouching){const u=age/TRANSITION[k];
    if(k==='turn')return at(u<.5?'turn-0':'turn-1');
    if(k==='start'&&p.moving)return at(u<.5?'start-0':'start-1');
    if(k==='stop'&&!p.moving)return at(u<.5?'stop-0':'stop-1');
    if(k==='stopRun'&&!p.moving)return at(u<1/3?'stop-brake':u<2/3?'stop-0':'stop-1');
   }else memo.kind=null;
  }
  if(p.crouching)return p.moving?at('crouch-'+Math.min(CYCLE.crouch-1,Math.floor(phase*CYCLE.crouch))):at('crouch-idle');
  if(p.moving){const gait=p.running?'run':'walk';return at(gait+'-'+Math.min(CYCLE[gait]-1,Math.floor(phase*CYCLE[gait])));}
  return at('idle-'+Math.floor(((t%IDLE_LOOP)+IDLE_LOOP)%IDLE_LOOP/IDLE_LOOP*4));
 }
 function sample(p,memo,now){return frames[frame(p,memo,now)];}
 const clock=()=>(root.performance?.now?.()??Date.now())/1000;
 function drawBase(r,c,p,x=67,y=101){
  if(!r.visualV2||!r.artTraveller)return null;
  const pose=sample(p,r._travellerMotion||(r._travellerMotion={}),clock());c.imageSmoothingEnabled=false;c.drawImage(r.artTraveller,...pose.rect,x-anchor[0],y-anchor[1],64,80);return pose;
 }
 const actionAnchor=Object.freeze([40,100]);
 const actionHands=[[37,49],[52,60],[58,71],[55,78],[36,30],[52,54],[56,83],[52,64],[66,95],[74,75],[69,74],[63,80],[53,74],[49,73],[62,91],[67,83]];
 const heads=[[22,33,10,12],[64,35,13,14],[66,65,8,12],[64,82,10,13],[18,29,8,11],[34,28,13,12],[70,87,11,13],[56,38,13,13]];
 const actionFrames=Object.freeze(actionHands.map((hand,i)=>Object.freeze({index:i,rect:Object.freeze([i%4*96,Math.floor(i/4)*112,96,112]),hand:Object.freeze(hand),grip:Object.freeze([hand[0]-40,hand[1]-100]),head:heads[i]?Object.freeze(heads[i]):null})));
 function legacyActionSample(e,r){
  const p=e.state.player,a=e.action,t=Number.isFinite(a?.time)?Math.max(0,a.time):0;let index,dx=0,dy=0;
  if(a){
   if(['tree','log'].includes(a.target.type)){const phase=((t+1e-7)%.9)/.9;index=(a.target.type==='log'?4:0)+(phase<.28?0:phase<.5?1:phase<.76?2:3);}
   else if(a.target.type==='carcass')index=14+(Math.cos(t*9)<0?1:0);
   else if(a.target.type==='pet'){
    const d=e.state.dog,ground=x=>root.PE.ground(x,e.state.currentMap),mouth=root.PEKajoArt?.mouth(r,d,ground);
    const head=mouth?{x:mouth.x-d.facing*4,y:mouth.y-5}:{x:d.x+d.facing*13,y:ground(d.x)-27};
    const targetY=head.y-ground(p.x);index=Math.abs(targetY+26)<=Math.abs(targetY+20)?10:11;
    // Shift the complete crouched pose, never stretch its arm or lift its boots.
    dx=Math.round(Math.max(-18,Math.min(18,(head.x-p.x)*(p.facing||1)-actionFrames[index].grip[0])));
    dy=Math.round(ground(p.x+dx*(p.facing||1))-ground(p.x));
   }else index=t/Math.max(.001,a.duration||1)<.58?8:9;
  }else if(p.sitting&&!e.attack){index=p.energy<25?13:12;dy=-4;}
  else return null;
  const shadowX=dx+(index===8||index===9||index>=14?13:index===10||index===11?-6:0);
  return {pose:actionFrames[index],dx,dy,shadowX};
 }
 // Rig action cels (64×80, same scale and anchor as walking). Timelines keep the
 // engine's durations: the axe contact (engine sound at .45 of each .9 s swing)
 // always lands on the impact cel, which also holds ~60 ms as the hit-stop.
 const AXE=Object.freeze([[.15,0],[.37,1],[.43,2],[.51,3],[.7,4],[.9,5]]);
 // Reduce motion: no hit-stop hold on the impact cel (contact at .45 still lands on it).
 const AXE_STILL=Object.freeze([[.15,0],[.37,1],[.43,2],[.49,3],[.7,4],[.9,5]]);
 const GATHER=Object.freeze([[.12,0],[.24,1],[.47,2],[.7,3],[1.01,4]]);
 const THROW=Object.freeze([[.15,0],[.25,1],[.37,2],[.45,3]]),THROW_TIME=.45;
 const step=(table,u)=>{for(const [end,i] of table)if(u<end)return i;return table[table.length-1][1];};
 function rigActionSample(e,r){
  if(byId['chop-0']==null)return null;
  const s=e.state,p=s.player,a=e.action,t=Number.isFinite(a?.time)?Math.max(0,a.time):0;let id=null,dx=0,dy=0,kind=null;
  if(a){const type=a.target?.type,dur=Math.max(.001,a.duration||1);
   if(type==='tree'||type==='log'){id=(type==='log'?'split-':'chop-')+step(root.PEMotionFx?.isReduced?.()?AXE_STILL:AXE,(t+1e-7)%.9);kind='axe';}
   else if(type==='carcass'){id=t<.2?'skin-down':t>dur-.2?'skin-up':'skin-'+(Math.floor((t-.2)/.12)%4);kind='knife';}
   else if(type==='pet'){id='pet-'+(Math.floor(t/.3)%2);
    const d=s.dog,ground=x=>root.PE.ground(x,s.currentMap),mouth=root.PEKajoArt?.mouth(r,d,ground);
    const head=mouth?{x:mouth.x-d.facing*4,y:mouth.y-5}:{x:d.x+d.facing*13,y:ground(d.x)-27};
    // Shift the whole kneeling pose so the palm meets Kajo's head; boots stay on the ground.
    dx=Math.round(Math.max(-18,Math.min(18,(head.x-p.x)*(p.facing||1)-frames[byId[id]].grip[0])));
    dy=Math.round(ground(p.x+dx*(p.facing||1))-ground(p.x));}
   else id='gather-'+step(GATHER,t/dur);
  }else{const d=s.dog,since=(s.playSeconds||0)-(d?.fetchStarted??-99);
   if(d?.mode==='fetch'&&since>=0&&since<THROW_TIME&&!p.moving&&!p.sitting&&!e.attack)id='throw-'+step(THROW,since);}
  if(id==null||byId[id]==null)return null;
  const pose=frames[byId[id]];return {pose,dx,dy,shadowX:dx+(/^(skin|pet|gather)/.test(id)?2:0),rig:true,kind,id};
 }
 function actionSample(e,r){return rigActionSample(e,r)||legacyActionSample(e,r);}
 function drawAction(r,c,e,drawHeld,toolImages){
  if(!r.visualV2)return false;
  const rig=r.artTraveller?rigActionSample(e,r):null;
  if(rig){const f=rig.pose,x=67+rig.dx,y=101+rig.dy;c.save();c.imageSmoothingEnabled=false;c.drawImage(r.artTraveller,...f.rect,x-anchor[0],y-anchor[1],64,80);c.restore();
   const grip=[x+f.grip[0],y+f.grip[1]],equipped=e.state.equipped;
   if(rig.kind==='axe'&&drawHeld&&Number.isFinite(f.tool))drawHeld(c,equipped==='axe'?'axe':'flintaxe',grip,f.tool,.55);
   if(rig.kind==='knife'&&drawHeld&&/^skin-\d/.test(rig.id))drawHeld(c,equipped==='knife'?'knife':'puukko',grip,.7+(.5-.5*Math.cos((e.action.time||0)*9))*.35,.38);
   return true;}
  if(!r.artTravellerActions)return false;
  const s=legacyActionSample(e,r);if(!s)return false;
  const f=s.pose,x=67-40+s.dx,y=101-100+s.dy,stone=f.head&&e.state.equipped==='flintaxe'&&toolImages?.flintaxe;
  c.save();c.imageSmoothingEnabled=false;
  if(stone){c.beginPath();c.rect(x,y,96,112);c.rect(x+f.head[0],y+f.head[1],f.head[2],f.head[3]);c.clip('evenodd');}
  c.drawImage(r.artTravellerActions,...f.rect,x,y,96,112);c.restore();
  if(stone){
   // Only the blade is exchanged; the illustrated haft and both grips stay intact.
   const [hx,hy,w,h]=f.head;c.save();c.imageSmoothingEnabled=false;c.beginPath();c.rect(x+hx,y+hy,w,h);c.clip();
   c.translate(x+hx+w/2,y+hy+h/2);
   c.drawImage(toolImages.flintaxe,645,69,514,510,-w/2,-h/2,w,h);c.restore();
  }
  if(f.index>=14&&drawHeld)drawHeld(c,e.state.equipped==='knife'?'knife':'puukko',[67+s.dx+f.grip[0],101+s.dy+f.grip[1]],.7+(.5-.5*Math.cos((e.action.time||0)*9))*.35,.38);
  return true;
 }
 const bowFrames=Object.freeze([
  Object.freeze({rect:Object.freeze([0,0,96,96]),anchor:Object.freeze([40,88]),shoulder:Object.freeze([-1,-42])}),
  Object.freeze({rect:Object.freeze([96,0,96,96]),anchor:Object.freeze([40,88]),shoulder:Object.freeze([0,-35])})
 ]);
 // Fixed-length two-link cloth rig. A fixed elbow branch avoids aim-angle flips.
 function solveArm(shoulder,wrist,upper,fore,bend){
  const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1],distance=Math.hypot(dx,dy),d=Math.max(1e-6,distance),along=(upper*upper-fore*fore+d*d)/(2*d),rise=Math.sqrt(Math.max(0,upper*upper-along*along));
  return {shoulder,wrist,elbow:[shoulder[0]+dx/d*along-dy/d*rise*bend,shoulder[1]+dy/d*along+dx/d*rise*bend],reachable:distance<=upper+fore&&distance>=Math.abs(upper-fore),upper,fore};
 }
 function bowSample(e,aim){
  const a=e.attack;if(!a)return null;const f=bowFrames[e.state.player.crouching?1:0],t=Math.max(0,a.time||0),smooth=q=>{q=Math.max(0,Math.min(1,q));return q*q*(3-2*q);};
  const pull=t<.32?.45+.55*smooth(t/.32):1-.88*smooth((t-.32)/Math.max(.01,a.duration-.32)),grip=aim.localGrip.slice(),drawHand=[grip[0]-13*pull*Math.cos(aim.angle),grip[1]-13*pull*Math.sin(aim.angle)],shoulder=f.shoulder.slice();
  return {body:f,grip,drawHand,pull,angle:aim.angle,released:t>=.32,time:t,front:solveArm(shoulder,grip,14,14,1),back:solveArm([shoulder[0]-2,shoulder[1]-1],drawHand,12,19,-1)};
 }
 function drawBow(r,c,e,aim,weapon){
  if(!r.visualV2||!r.artTravellerBow)return false;const p=bowSample(e,aim);if(!p)return false;
  c.save();c.translate(67,101);c.imageSmoothingEnabled=false;
  const segment=(sx,start,end,handOnly=false)=>{const angle=Math.atan2(end[1]-start[1],end[0]-start[0]),length=Math.hypot(end[0]-start[0],end[1]-start[1]);c.save();c.translate(...start);c.rotate(angle);c.scale(length/14,1);if(handOnly)c.drawImage(r.artTravellerBow,sx+22,96,10,24,12,-12,10,24);else c.drawImage(r.artTravellerBow,sx,96,40,24,-10,-12,40,24);c.restore();};
  const limb=rig=>{segment(0,rig.shoulder,rig.elbow);segment(40,rig.elbow,rig.wrist);};
  // Rear sleeve starts behind the torso. Its wrist is redrawn over the string.
  limb(p.back);c.drawImage(r.artTravellerBow,...p.body.rect,-40,-88,96,96);limb(p.front);
  // Expose the rear forearm (but not its shoulder) over the jacket at full draw.
  segment(40,p.back.elbow,p.back.wrist);
  weapon(c,p.grip,p.angle,p.pull,p.drawHand,p.released,p.time,true);
  segment(40,p.back.elbow,p.back.wrist,true);segment(40,p.front.elbow,p.front.wrist,true);
  c.restore();return true;
 }
 const api=Object.freeze({frame,sample,phaseOf,rigActionSample,AXE,CYCLE,TRANSITION,drawBase,frames,anchor,actionFrames,actionAnchor,actionSample,drawAction,bowFrames,bowSample,solveArm,drawBow});root.PETravellerArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
