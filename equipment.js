/* Shared pixel equipment: inventory icons and hand-attached world rigs. */
(function(root){
  'use strict';
  const TOOLS=new Set(['puukko','knife','flintaxe','axe','bow','rod']);
  const images={};let loading;
  const imageBounds={axe:[208,61,870,1120],flintaxe:[206,70,952,1124],puukko:[190,97,874,1060],knife:[179,53,909,1160],rod:[42,49,1180,1168]};
  function setAssets(assets){Object.assign(images,assets);}
  function loadAssets(){if(loading)return loading;loading=Promise.all(Object.keys(imageBounds).map(id=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images[id]=im;resolve();};im.onerror=()=>reject(new Error('Cannot load tool-'+id));im.src='assets/tool-'+id+'.png';})));return loading;}
  const TAU=Math.PI*2;
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>{t=clamp(t);return t*t*(3-2*t);};
  const rotatePoint=(p,a,s=1)=>[(p[0]*Math.cos(a)-p[1]*Math.sin(a))*s,(p[0]*Math.sin(a)+p[1]*Math.cos(a))*s];
  function path(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.lineCap='round';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
  function fill(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
  function px(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function hand(c,p){c.fillStyle='#d8ad78';c.beginPath();c.ellipse(p[0],p[1],2.7,2.4,-.2,0,TAU);c.fill();px(c,p[0]-1,p[1]-2,2,1,'#f0c895');}
  function tool(c,type,angle=0,scale=1){
    c.save();c.rotate(angle);c.scale(scale,scale);
    if(type==='puukko'){
      // Finnish carbon-steel puukko: curly-birch barrel handle, brass bolster and drop-point blade.
      path(c,[[-9,0],[-5,-1],[4,0]],'#38261c',7);path(c,[[-9,-1],[-5,-3],[4,-1]],'#9b6735',4);path(c,[[-7,-2],[-3,-3],[2,-2]],'#dda85f',1);
      px(c,3,-4,3,7,'#b89a59');fill(c,[[6,-3],[20,-5],[25,-2],[21,1],[6,3]],'#586160');fill(c,[[7,-2],[20,-4],[23,-2],[19,-1],[7,2]],'#c5cdc4');path(c,[[9,-1],[21,-3]],'#f2e7c1',1);
    }else if(type==='knife'){
      // Knapped flint blade lashed into a short birch handle.
      path(c,[[-9,0],[4,0]],'#39281e',7);path(c,[[-8,-2],[3,-2]],'#ad7b43',3);px(c,2,-4,4,8,'#796241');path(c,[[2,-3],[5,3]],'#d2bd82',1);
      fill(c,[[6,-4],[17,-8],[25,-3],[20,1],[7,4]],'#394747');fill(c,[[7,-3],[17,-6],[22,-3],[18,-1],[8,2]],'#82918a');path(c,[[9,1],[19,-2]],'#c5cbb8',1);
    }else if(type==='axe'||type==='flintaxe'){
      // Canonical axe: grip at origin, curved haft up to the eye, poll left and cutting bit right.
      path(c,[[0,1],[1,-9],[-1,-20],[0,-30]],'#36271d',6);path(c,[[1,0],[2,-9],[0,-20],[1,-29]],'#a47343',4);path(c,[[1,-1],[2,-10],[1,-19]],'#deb078',1);
      if(type==='flintaxe'){
        fill(c,[[-6,-34],[5,-37],[14,-34],[15,-27],[10,-21],[3,-25],[-7,-28]],'#3b4341');fill(c,[[1,-33],[7,-35],[12,-32],[12,-27],[8,-24],[3,-27]],'#89918b');path(c,[[9,-32],[13,-30],[10,-25]],'#c6c8b4',1);
        for(let j=0;j<4;j++)path(c,[[-4,-34+j*2],[5,-30+j*2]],j%2?'#a3895e':'#66523a',2);
        c.restore();return;
      }
      fill(c,[[-7,-34],[1,-34],[3,-27],[-7,-27]],'#454b49');fill(c,[[-5,-33],[1,-33],[1,-29],[-6,-29]],'#7d8780');
      fill(c,[[0,-34],[7,-35],[12,-38],[14,-31],[12,-23],[6,-26],[0,-27]],'#3a4545');fill(c,[[1,-33],[7,-34],[11,-36],[12,-31],[11,-25],[6,-27],[1,-28]],'#85928d');fill(c,[[10,-36],[14,-35],[14,-26],[11,-25],[12,-31]],'#d1d5c6');path(c,[[13,-35],[13,-26]],'#f1e9ca',1);px(c,-2,-32,5,4,'#50564f');
    }else if(type==='bow'){
      path(c,[[0,-19],[7,-14],[10,-7],[10,0],[9,7],[6,14],[0,19]],'#3d2a1d',5);path(c,[[0,-19],[6,-14],[8,-7],[8,0],[7,7],[4,14],[0,19]],'#b67a42',3);path(c,[[0,-19],[2,0],[0,19]],'#d9d2a4',1);path(c,[[6,-3],[9,3]],'#4d3925',3);
    }else if(type==='rod'){
      path(c,[[-4,1],[8,-2],[18,-5],[27,-9],[34,-14]],'#3a291d',4);path(c,[[-3,-1],[8,-4],[18,-7],[27,-11],[34,-15]],'#b5854d',2);path(c,[[34,-15],[38,-8],[40,0]],'#d7cfaa',1);c.strokeStyle='#725039';c.lineWidth=2;c.beginPath();c.arc(4,3,4,0,TAU);c.stroke();px(c,2,1,3,3,'#b86f45');
    }
    c.restore();
  }
  function drawBowAim(c,grip,angle,pull,drawHand,released){
    c.save();c.translate(grip[0],grip[1]);c.rotate(angle);
    const top=[1,-19],bottom=[1,19],back=-13*pull;
    path(c,[top,[8,-13],[10,-6],[9,0],[9,6],[7,13],bottom],'#38281d',5);path(c,[top,[7,-13],[9,-6],[8,0],[8,6],[6,13],bottom],'#b87c43',3);
    path(c,[top,[back,0],bottom],'#ddd3a2',1);
    if(!released){path(c,[[back-3,0],[31,0]],'#c9a977',1);fill(c,[[31,0],[25,-3],[26,3]],'#c8cfbf');fill(c,[[back-3,0],[back+1,-3],[back+1,3]],'#d5c9a0');}
    c.restore();hand(c,grip);hand(c,drawHand);
  }
  function arm(c,shoulder,elbow,wrist,front=true){const cloth=front?'#b18d5c':'#8e704d';path(c,[shoulder,elbow,wrist],'#3c3327',6);path(c,[[shoulder[0],shoulder[1]-1],[elbow[0],elbow[1]-1],[wrist[0],wrist[1]-1]],cloth,4);path(c,[[shoulder[0]-1,shoulder[1]-2],[elbow[0]-1,elbow[1]-2]],front?'#d6ad74':'#b79568',1);px(c,mix(shoulder[0],elbow[0],.45),mix(shoulder[1],elbow[1],.45)-1,2,1,'#765b3e');px(c,mix(elbow[0],wrist[0],.55),mix(elbow[1],wrist[1],.55),1,1,'#d0a46c');px(c,elbow[0]-2,elbow[1]-1,4,2,'#69533a');}
  function rigArm(c,shoulder,wrist,front=true,bend=1,link=14){const dx=wrist[0]-shoulder[0],dy=wrist[1]-shoulder[1],distance=Math.hypot(dx,dy)||1,half=Math.min(distance,link*2-.1)/2,rise=Math.sqrt(Math.max(0,link*link-half*half)),mx=(shoulder[0]+wrist[0])/2,my=(shoulder[1]+wrist[1])/2,elbow=[mx-dy/distance*rise*bend,my+dx/distance*rise*bend];arm(c,shoulder,elbow,wrist,front);}
  function shadow(c,x,y,w=16){c.fillStyle='#10170d88';c.beginPath();c.ellipse(Math.round(x),Math.round(y)+1,w,3,0,0,TAU);c.fill();}
  function makeLayer(renderer){
    if(!renderer._equipmentLayer)renderer._equipmentLayer=renderer.makeCanvas(140,116);
    const layer=renderer._equipmentLayer,lc=layer.getContext('2d');lc.setTransform(1,0,0,1,0,0);lc.clearRect(0,0,layer.width,layer.height);lc.imageSmoothingEnabled=false;return [layer,lc];
  }
  function baseSprite(renderer,lc,index,bob=0){const old=renderer.c;renderer.c=lc;renderer.sprite(index,67,101+bob,1,.12);renderer.c=old;}
  function basePose(renderer,lc,index){const old=renderer.c;renderer.c=lc;renderer.pose(index,67,101,1);renderer.c=old;}
  function eraseArm(lc,crouch=false){lc.save();lc.globalCompositeOperation='destination-out';path(lc,crouch?[[76,72],[79,79],[81,84]]:[[72,60],[75,67],[75,73]],'#000',8);lc.restore();}
  function heldAngle(type){return ['axe','flintaxe'].includes(type)?.34:type==='rod'?-.58:type==='bow'?0:-.72;}
  function heldScale(type){return ['axe','flintaxe'].includes(type)?.55:type==='rod'?.9:type==='bow'?.9:.38;}
  function drawHeld(c,type,grip,angle=heldAngle(type),scale=1){
    c.save();c.translate(grip[0],grip[1]);tool(c,type,angle,scale);c.restore();hand(c,grip);
  }
  function idleGrip(p){
    if(p.moving&&!p.crouching){const index=Math.floor(p.stride/(Math.PI*.5))%4,grips=[[77,72],[71,73],[59,73],[65,73]];return{index,bob:0,grip:grips[index].slice(),pose:true};}
    const crouch=!!p.crouching,bob=p.moving&&crouch?Math.sin(p.stride)*.6:0,index=crouch?3:p.moving?1+Math.floor(p.stride/Math.PI)%2:0;
    const anchors={0:[74,72],1:[78,70],2:[77,70],3:[81,80]},grip=(anchors[index]||anchors[0]).slice();grip[1]+=bob;if(crouch&&p.moving)grip[0]+=Math.sin(p.stride)*2;return{index,bob,grip};
  }
  function drawIdle(renderer,lc,p,type){
    if(p.running&&renderer.runPoses){
      const index=Math.floor(p.stride/(Math.PI/3))%6,boxes=[[74,128,354,467],[467,137,276,451],[759,112,277,456],[1080,133,351,464],[1519,158,226,435],[1800,128,294,455]],anchors=[274,619,889,1278,1622,1951],bases=[593,586,590,595,591,605],hands=[[351,300],[695,314],[971,287],[1337,304],[1705,332],[2052,290]],b=boxes[index],k=.134;
      lc.drawImage(renderer.runPoses,...b,67+(b[0]-anchors[index])*k,101+(b[1]-bases[index])*k,b[2]*k,b[3]*k);
      if(type){const grip=[67+(hands[index][0]-anchors[index])*k,101+(hands[index][1]-bases[index])*k];drawHeld(lc,type,grip,heldAngle(type)+(['axe','flintaxe'].includes(type)?.3:0),heldScale(type));}return;
    }
    const {index,bob,grip,pose}=idleGrip(p);
    if(pose&&renderer.poses)basePose(renderer,lc,index);else baseSprite(renderer,lc,index,bob);
    if(!type)return;
    drawHeld(lc,type,grip,heldAngle(type),heldScale(type));
  }
  // Complete illustrated poses: no procedural arm segments during chopping.
  // Atlas offsets keep boots planted; horizontal felling and overhead splitting
  // have independent sprites, with stone/steel rows and a shared .9 s cadence.
  const chopFrames={
    tree:{boxes:[[40,0,316,534],[405,0,432,534],[832,0,390,535],[1200,0,313,535],[40,512,316,502],[405,523,432,491],[832,529,390,485],[1200,523,313,491]],anchors:[214,568,983,1340],bases:[531,532,533,533,1008,1010,1009,1010],scale:.123,heads:[[67,80,68,95],[780,182,59,89],[1170,220,56,86],[1430,247,68,80],[58,592,81,88],[783,692,50,85],[1171,718,52,86],[1444,724,62,87]]},
    log:{boxes:[[0,145,258,560],[264,245,281,460],[514,389,265,317],[762,345,262,361],[0,795,258,560],[264,894,281,461],[514,1030,265,325],[762,985,262,370]],anchors:[112,367,625,877],bases:[700,700,700,700,1345,1345,1345,1345],scale:.145,heads:[[83,145,78,80],[478,247,72,82],[712,641,66,65],[964,343,60,84],[82,796,78,82],[478,897,72,82],[712,1288,66,64],[966,991,58,81]]}
  };
  function axeAction(renderer,lc,engine){
    const low=engine.action.target.type==='log',img=low?renderer.chopLog:renderer.chopTree,type=engine.state.equipped==='flintaxe'?'flintaxe':'axe';
    if(!img){basePose(renderer,lc,engine.action.time%.9<.45?6:low?8:7);return;}
    const info=chopFrames[low?'log':'tree'],phase=(engine.action.time%.9)/.9,col=phase<.28?0:phase<.5?1:phase<.76?2:3,row=type==='flintaxe'?0:1,index=row*4+col,b=info.boxes[index],anchor=info.anchors[col],base=info.bases[index],scale=info.scale;
    renderer._chopCache||=new Map();const key=(low?'log':'tree')+':'+type+':'+col;
    let cached=renderer._chopCache.get(key);
    if(!cached){
      cached=renderer.makeCanvas(140,116);const c=cached.getContext('2d');c.imageSmoothingEnabled=false;c.save();c.translate(67-anchor*scale,101-base*scale);c.scale(scale,scale);
      // Mask atlas neighbours at the staggered row/column boundaries.
      c.beginPath();c.rect(...b);c.clip();
      if(low&&col>0){
        const dy=row?645:0,regions={1:[[264,245],[550,245],[550,460],[490,460],[490,710],[264,710]],2:[[550,389],[750,389],[750,575],[780,575],[780,710],[514,710],[514,465],[550,465]],3:[[780,345],[1024,345],[1024,710],[790,710],[790,560],[762,560],[762,420],[780,420]]};
        c.beginPath();regions[col].forEach(([x,y],i)=>i?c.lineTo(x,y+dy):c.moveTo(x,y+dy));c.closePath();c.clip();
      }
      if(!low&&row===0&&(col===0||col===3)){c.beginPath();c.moveTo(b[0],b[1]);c.lineTo(b[0]+b[2],b[1]);c.lineTo(b[0]+b[2],512);c.lineTo(anchor-15,512);c.lineTo(anchor-15,b[1]+b[3]);c.lineTo(b[0],b[1]+b[3]);c.closePath();c.clip();}
      if(!low&&row===1&&col===0){c.beginPath();c.moveTo(b[0],554);c.lineTo(anchor-15,554);c.lineTo(anchor-15,b[1]);c.lineTo(b[0]+b[2],b[1]);c.lineTo(b[0]+b[2],b[1]+b[3]);c.lineTo(b[0],b[1]+b[3]);c.closePath();c.clip();}
      // The supplied axe heads replace ambiguous generated tool silhouettes.
      // These are raster tool parts, not replacement arms or sleeves.
      const head=info.heads[index];
      if(images[type]){c.beginPath();c.rect(...b);c.rect(...head);c.clip('evenodd');}
      c.drawImage(img,0,0);c.restore();
      if(images[type]){
        const head=info.heads[index],cx=67+(head[0]+head[2]*.5-anchor)*scale,cy=101+(head[1]+head[3]*.5-base)*scale;
        const crop=type==='flintaxe'?[645,69,514,510]:[639,58,444,400],w=low?10:9,h=low?10:10;
        c.save();c.translate(cx,cy);c.rotate(low?(col===0?-.72:col===2?.85:.12):0);c.imageSmoothingEnabled=true;c.drawImage(images[type],...crop,-w*.5,-h*.5,w,h);c.restore();
      }
      renderer._chopCache.set(key,cached);
    }
    lc.drawImage(cached,0,0);
  }
  function bowAim(engine){
    const p=engine.state.player,crouch=!!p.crouching,groundY=root.PE?root.PE.ground(p.x):0,localGrip=crouch?[17,-29]:[20,-42],worldGrip=[p.x+(p.facing||1)*localGrip[0],groundY+localGrip[1]],a=engine.attack;
    if(!a)return{localGrip,worldGrip,angle:0};const dx=(a.wx-worldGrip[0])*(p.facing||1),dy=a.wy-worldGrip[1];return{localGrip,worldGrip,angle:Math.atan2(dy,Math.max(1,dx))};
  }
  function bowAction(renderer,lc,engine){
    const p=engine.state.player,a=engine.attack,crouch=!!p.crouching;baseSprite(renderer,lc,crouch?3:0);eraseArm(lc,crouch);
    const aim=bowAim(engine),angle=aim.angle,grip=[67+aim.localGrip[0],101+aim.localGrip[1]],pull=a.time<.32?mix(.45,1,ease(a.time/.32)):mix(1,.12,ease((a.time-.32)/Math.max(.01,a.duration-.32))),drawHand=[grip[0]+Math.cos(angle)*(-13*pull),grip[1]+Math.sin(angle)*(-13*pull)];
    arm(lc,crouch?[72,68]:[68,55],crouch?[78,69]:[78,57],grip,true);arm(lc,crouch?[69,67]:[64,56],crouch?[72,64]:[70,54],drawHand,false);drawBowAim(lc,grip,angle,pull,drawHand,a.time>=.32);
  }
  function carcassAction(renderer,lc,engine){
    const type=engine.state.equipped==='knife'?'knife':'puukko';baseSprite(renderer,lc,3);const pulse=.5-.5*Math.cos(engine.action.time*9),grip=[81,80];drawHeld(lc,type,grip,.7+pulse*.35,heldScale(type));
  }
  function gatherAction(renderer,lc,engine){
    const frame=(engine.action.time/engine.action.duration)<.58?4:5;basePose(renderer,lc,frame);
  }
  function petAction(renderer,lc,engine){
    baseSprite(renderer,lc,3);eraseArm(lc,true);
    const p=engine.state.player,d=engine.state.dog,head=[67+(d.x+d.facing*13-p.x)*p.facing,101+root.PE.ground(d.x)-root.PE.ground(p.x)-27];
    const wrist=[head[0]+Math.sin(engine.action.time*7)*2,head[1]-1];rigArm(lc,[72,68],wrist,true,-1,12);hand(lc,wrist);
  }
  function drawActor(renderer,engine){
    if(!renderer||!renderer.sprites)return false;
    const c=renderer.c,s=engine.state,p=s.player,y=root.PE?root.PE.ground(p.x):0,type=TOOLS.has(s.equipped)?s.equipped:null;
    shadow(c,p.x,y,16);const [layer,lc]=makeLayer(renderer);
    if(engine.action&&['tree','log'].includes(engine.action.target.type))axeAction(renderer,lc,engine);
    else if(engine.action&&engine.action.target.type==='carcass')carcassAction(renderer,lc,engine);
    else if(engine.action&&engine.action.target.type==='pet')petAction(renderer,lc,engine);
    else if(engine.action&&renderer.poses)gatherAction(renderer,lc,engine);
    else if(engine.attack&&type==='bow')bowAction(renderer,lc,engine);
    else drawIdle(renderer,lc,p,type);
    c.save();c.translate(Math.round(p.x),Math.round(y));c.scale(p.facing||1,1);c.drawImage(layer,-67,-101);c.restore();return true;
  }
  function drawIcon(c,type,x=0,y=0,size=48){
    if(root.PEIcons?.draw(c,type,x,y,size))return;
    if(images[type]){const b=imageBounds[type],k=(size-6)/Math.max(b[2],b[3]);c.save();c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(images[type],...b,x+(size-b[2]*k)/2,y+(size-b[3]*k)/2,b[2]*k,b[3]*k);c.restore();return;}
    if(type==='flintaxe')type='axe';
    const bounds={puukko:[-11,-7,27,6],knife:[-11,-10,27,6],axe:[-10,-41,17,5],bow:[-3,-22,13,22],rod:[-7,-19,43,9]}[type],angle=type==='bow'?0:type==='axe'?.68:type==='rod'?-.62:-.68;
    const corners=[[bounds[0],bounds[1]],[bounds[2],bounds[1]],[bounds[2],bounds[3]],[bounds[0],bounds[3]]].map(p=>rotatePoint(p,angle)),xs=corners.map(p=>p[0]),ys=corners.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),k=(size-8)/Math.max(maxX-minX,maxY-minY),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    c.save();c.translate(x+size*.5-cx*k,y+size*.5-cy*k);c.scale(k,k);tool(c,type,angle,1);c.restore();
  }
  function projectileOrigin(engine){const p=engine.state.player,aim=bowAim(engine);return{x:aim.worldGrip[0]+(p.facing||1)*Math.cos(aim.angle)*31,y:aim.worldGrip[1]+Math.sin(aim.angle)*31};}
  function fishingLineOrigin(engine){const p=engine.state.player,y=root.PE?root.PE.ground(p.x):0,{grip}=idleGrip(p),tip=rotatePoint([40,0],heldAngle('rod'),heldScale('rod')),local=[grip[0]-67+tip[0],grip[1]-101+tip[1]];return{x:p.x+(p.facing||1)*local[0],y:y+local[1]};}
  const api={isTool:type=>TOOLS.has(type),drawIcon,drawActor,projectileOrigin,fishingLineOrigin,loadAssets,setAssets,_drawTool:tool};
  root.PEEquipment=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
