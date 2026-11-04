/* Native original locomotion cels. Tool grip and cel share one pose sample. */
(function(root){'use strict';
 const TAU=Math.PI*2,anchor=Object.freeze([32,76]);
 const hands=[[22,53],[24,53],[23,53],[40,50],[26,54],[43,45],[29,53],[44,60],[47,45],[48,47],[46,44],[46,46],[48,48],[47,46],[47,59],[44,58]];
 const frames=Object.freeze(hands.map((hand,i)=>Object.freeze({index:i,rect:Object.freeze([i%4*64,Math.floor(i/4)*80,64,80]),hand:Object.freeze(hand),grip:Object.freeze([hand[0]-anchor[0],hand[1]-anchor[1]])})));
 function frame(p){const stride=Number.isFinite(p.stride)?p.stride:0,phase=((stride%TAU+TAU)%TAU)/TAU;
  if(p.crouching)return p.moving?(phase<.5?14:15):7;
  return p.moving?(p.running?8:0)+Math.floor(phase*6):6;
 }
 function sample(p){return frames[frame(p)];}
 function drawBase(r,c,p,x=67,y=101){
  if(!r.visualV2||!r.artTraveller)return null;
  const pose=sample(p);c.imageSmoothingEnabled=false;c.drawImage(r.artTraveller,...pose.rect,x-anchor[0],y-anchor[1],64,80);return pose;
 }
 const actionAnchor=Object.freeze([40,100]);
 const actionHands=[[37,49],[52,60],[58,71],[55,78],[36,30],[52,54],[56,83],[52,64],[66,95],[74,75],[69,74],[63,80],[53,74],[49,73],[62,91],[67,83]];
 const heads=[[22,33,10,12],[64,35,13,14],[66,65,8,12],[64,82,10,13],[18,29,8,11],[34,28,13,12],[70,87,11,13],[56,38,13,13]];
 const actionFrames=Object.freeze(actionHands.map((hand,i)=>Object.freeze({index:i,rect:Object.freeze([i%4*96,Math.floor(i/4)*112,96,112]),hand:Object.freeze(hand),grip:Object.freeze([hand[0]-40,hand[1]-100]),head:heads[i]?Object.freeze(heads[i]):null})));
 function actionSample(e,r){
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
 function drawAction(r,c,e,drawHeld,toolImages){
  if(!r.visualV2||!r.artTravellerActions)return false;
  const s=actionSample(e,r);if(!s)return false;
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
 const api=Object.freeze({frame,sample,drawBase,frames,anchor,actionFrames,actionAnchor,actionSample,drawAction,bowFrames,bowSample,solveArm,drawBow});root.PETravellerArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
