#!/usr/bin/env node
// Traveller rig → baked pixel cels.
//   node scripts/bake-traveller.cjs --extract <legacy-sheet.png>   (one-off: cut parts from the 0.8 idle cel)
//   node scripts/bake-traveller.cjs             (bake assets/art-v2/traveller.png + .json, update traveller-art.js)
// Parts: head and torso+pack are bitmaps cut from the original illustrated cel; limbs
// and boots are rasterised from the rig with the sprite's own palette, so no rotated
// pixels are ever resampled. Every cel is 64×80 with the boot anchor at [32,76].
'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),PNG=require('./png.cjs');
const ROOT=path.resolve(__dirname,'..'),ART=path.join(ROOT,'assets/art-v2');
const W=64,H=80,ANCHOR=[32,76],TAU=Math.PI*2;
const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16),255];
const C={ink:hex('#222b28'),jean:hex('#3b5352'),jeanDark:hex('#253b3c'),jeanLight:hex('#5b7066'),sleeve:hex('#bd9458'),sleeveShade:hex('#9e723f'),sleeveDark:hex('#79563a'),sleeveDeep:hex('#594532'),
  skin:hex('#e1ba83'),skinShade:hex('#d0ac73'),boot:hex('#633925'),bootLight:hex('#935133'),bootDark:hex('#3b3328')};

// ---------- parts ----------
// Source: the legacy illustrated sheet (git show c8c8f07-era traveller.png), idle cel at [128,80].
// Layers: x 0–63 head, 64–127 torso+pack, 128–191 jeans swatch (texture only).
function extract(from){
  const src=PNG.decode(fs.readFileSync(from)),parts=PNG.create(192,H),idle=[128,80];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=((idle[1]+y)*src.width+idle[0]+x)*4;if(src.data[i+3]<128)continue;
    let dx=-1;if(y<=28)dx=0;else if(y<=49||(y<=51&&x>=31&&x<=37))dx=64;else if(y>=53&&y<=66&&x>=24&&x<=38)dx=128;if(dx<0)continue;
    const o=(y*192+x+dx)*4;src.data.copy(parts.data,o,i,i+4);parts.data[o+3]=255;}
  fs.writeFileSync(path.join(ART,'traveller-parts.png'),PNG.encode(parts));console.log('wrote traveller-parts.png');
}

// ---------- raster helpers ----------
function cel(){return {data:new Array(W*H).fill(null)};}
function put(c,x,y,col){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;c.data[y*W+x]=col;}
function blit(c,layer,off,dx,dy,shear=0,pivotY=0,lagRows=null){
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*layer.width+x+off)*4;if(layer.data[i+3]<128)continue;
    const lag=lagRows&&lagRows(x,y)||0,sx=Math.round(x+dx+(pivotY-y)*shear);put(c,sx,y+dy+lag,[layer.data[i],layer.data[i+1],layer.data[i+2],255]);}
}
function distSeg(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy||1e-9;let t=((px-a[0])*vx+(py-a[1])*vy)/l;t=Math.max(0,Math.min(1,t));const qx=a[0]+vx*t-px,qy=a[1]+vy*t-py;return {d:Math.hypot(qx,qy),side:(vx*(py-a[1])-vy*(px-a[0]))/Math.sqrt(l),t};}
// A limb: chain of points, fill radius r, 1px ink outline, shade on the underside.
function limb(c,pts,r,fill,shade,light,tex=null,clipY=-1e9){
  const lens=pts.slice(1).map((p,k)=>Math.hypot(p[0]-pts[k][0],p[1]-pts[k][1])),cum=lens.reduce((a,l)=>(a.push(a[a.length-1]+l),a),[0]);
  const fillPx=new Set(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.floor(Math.min(...xs)-r-2),x1=Math.ceil(Math.max(...xs)+r+2),y0=Math.floor(Math.min(...ys)-r-2),y1=Math.ceil(Math.max(...ys)+r+2);
  const info=new Map();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let best={d:1e9};for(let k=0;k+1<pts.length;k++){const s=distSeg(x+.5,y+.5,pts[k],pts[k+1]);if(s.d<best.d)best={...s,along:cum[k]+s.t*lens[k]};}
    if(best.d<=r)fillPx.add(x+','+y),info.set(x+','+y,best);}
  for(const key of fillPx){const [x,y]=key.split(',').map(Number),edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!fillPx.has((x+a)+','+(y+b)));
    const nearRoot=info.get(key).along<UPPER*.75;for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(!fillPx.has((x+a)+','+(y+b))&&(y+b>=clipY||!nearRoot))put(c,x+a,y+b,C.ink);}
  for(const key of fillPx){const [x,y]=key.split(',').map(Number),s=info.get(key);if(y<clipY&&s.along<UPPER*.75)continue;const under=!fillPx.has(x+','+(y+1))||!fillPx.has((x-1)+','+y);
    put(c,x,y,tex?tex(s.along,s.side,under):under?shade:(light&&!fillPx.has(x+','+(y-1))?light:fill));}
}
function bootPts(ankle,angle){const ca=Math.cos(angle),sa=Math.sin(angle),pt=(u,v)=>[ankle[0]+u*ca+v*sa,ankle[1]-u*sa+v*ca];return {top:pt(0,-.5),heel:pt(-1,2.2),toe:pt(5,2.6)};}
// Planted boots: lift the ankle so the lowest boot point rests on the ground row.
function ground(f){const b=bootPts([0,f.y],f.angle||0),low=Math.max(b.heel[1],b.toe[1])+BOOT_R;if(!f.stance)return low>SOLE?{...f,y:f.y+(SOLE-low)}:f;return {...f,y:f.y+(SOLE-low)};}
function boot(c,ankle,angle,far){
  // Heel sits under the ankle, toe points forward; angle>0 lifts the toe.
  const {top,heel,toe}=bootPts(ankle,angle),pt=null;
  limb(c,[top,heel,toe],BOOT_R,far?C.bootDark:C.boot,far?C.ink:C.bootDark,far?null:C.bootLight);
}
function hand(c,p,far){const a=far?C.skinShade:C.skin,b=C.skinShade;put(c,p[0],p[1],a);put(c,p[0]+1,p[1],a);put(c,p[0],p[1]+1,b);put(c,p[0]+1,p[1]+1,b);put(c,p[0]-1,p[1],C.ink);put(c,p[0]+2,p[1],C.ink);put(c,p[0],p[1]+2,C.ink);put(c,p[0]+1,p[1]+2,C.ink);}

// Sleeve texture: jacket pixels from the torso layer, mapped along the arm so the
// cloth pattern travels with it. Underside uses the next darker jacket tone.
function clothTexture(parts,layer,box,ramps,fallback,far){
  const key=c=>c.slice(0,3).join(','),darker={};for(const r of ramps)r.forEach((c,i)=>darker[key(c)]=r[Math.min(r.length-1,i+1)]);
  const [x0,y0,x1,y1]=box,w=x1-x0+1,h=y1-y0+1,grid=new Map();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=(y*parts.width+layer+x)*4;if(parts.data[i+3]<128)continue;const c=[parts.data[i],parts.data[i+1],parts.data[i+2],255];if(key(c)===key(C.ink))continue;grid.set((x-x0)+','+(y-y0),c);}
  const pick=(u,v)=>{for(let k=0;k<w;k++){const g=grid.get(((u+k)%w)+','+v)||grid.get(((u+k)%w)+','+((v+1)%h));if(g)return g;}return fallback;};
  return (along,across,under)=>{let c=pick(((Math.round(across+w/2))%w+w)%w,((Math.round(along))%h+h)%h);if(under)c=darker[key(c)]||c;if(far)c=darker[key(c)]||c;return c;};
}
function sleeveTexture(parts,far){
  const key=c=>c.slice(0,3).join(','),ink=new Set([key(C.ink),key(C.bootDark),'89,69,50']),darker={};
  const ramp=['#d0ac73','#bd9458','#9e723f','#79563a','#594532'].map(hex),warm=['#b66a3b','#935133','#633925'].map(hex);
  for(const r of [ramp,warm])r.forEach((c,i)=>darker[key(c)]=r[Math.min(r.length-1,i+1)]);
  const swatch=[];for(let y=33;y<=45;y++)for(let x=26;x<=32;x++){const i=(y*parts.width+64+x)*4;if(parts.data[i+3]<128)continue;const c=[parts.data[i],parts.data[i+1],parts.data[i+2],255];if(!ink.has(key(c)))swatch.push({x:x-26,y:y-33,c});}
  const grid=new Map(swatch.map(p=>[p.x+','+p.y,p.c])),pick=(u,v)=>{for(let k=0;k<6;k++){const g=grid.get(((u+k)%7)+','+v);if(g)return g;}return C.sleeve;};
  return (along,across,under)=>{const u=((Math.round(across+3))%7+7)%7,v=((Math.round(along))%13+13)%13;let c=pick(u,v);if(under||far)c=darker[key(c)]||c;if(far)c=darker[key(c)]||c;return c;};
}
// ---------- IK ----------
function ik(root,target,a,b,bend){const dx=target[0]-root[0],dy=target[1]-root[1];let d=Math.hypot(dx,dy);const maxd=a+b-.01;let tx=target[0],ty=target[1];
  if(d>maxd){tx=root[0]+dx/d*maxd;ty=root[1]+dy/d*maxd;d=maxd;}
  const along=(a*a-b*b+d*d)/(2*d),rise=Math.sqrt(Math.max(0,a*a-along*along)),ux=(tx-root[0])/d,uy=(ty-root[1])/d;
  return {joint:[root[0]+ux*along-uy*rise*bend,root[1]+uy*along+ux*rise*bend],end:[tx,ty]};}
const THIGH=12,SHIN=12,UPPER=8,FORE=8,ANKLE_Y=71,SOLE=75.45,BOOT_R=1.9;
const smooth=q=>q*q*(3-2*q);

// ---------- gaits ----------
// cycle: px travelled per stride cycle (stride phase 0..2π). duty: stance share.
const GAITS={
  walk:{cels:8,cycle:52,duty:.5,lift:5,hip:50,bob:1,lean:.03,swing:.8,elbow:.35,pack:0},
  run:{cels:8,cycle:84,duty:.36,lift:9,hip:51,bob:2,lean:.13,swing:.75,elbow:1.45,pack:1,kick:7},
  crouch:{cels:6,cycle:30,duty:.6,lift:3,hip:60,bob:1,lean:.12,swing:.2,elbow:.9,pack:0,crouch:true,shiftX:3}
};
function footAt(g,u){ // u = this foot's phase 0..1, 0 = heel strike
  const half=g.cycle*g.duty/2;
  if(u<g.duty){const k=u/g.duty;return {x:half-2*half*k,y:ANKLE_Y,angle:k<.15?.25*(1-k/.15):k>.8?-.35*(k-.8)/.2:0,stance:true};}
  const k=(u-g.duty)/(1-g.duty),e=smooth(k),x=-half+2*half*e,arc=Math.sin(k*Math.PI);
  let y=ANKLE_Y-g.lift*arc,ang=-.45*(1-k)+.25*k;
  if(g.kick){y-=g.kick*Math.sin(Math.min(1,k*1.6)*Math.PI)*(k<.6?1:0);}
  return {x,y,angle:ang,stance:false};
}
function pose(g,phase){ // phase 0..1; near leg strikes at 0, far leg at .5
  const near=footAt(g,phase),far=footAt(g,(phase+.5)%1);
  // Body is lowest just after each contact, highest mid-stance/flight.
  const bob=g.kick?-Math.round(g.bob*Math.abs(Math.sin(phase*TAU*2-Math.PI*.6))):Math.round(g.bob*Math.max(0,Math.cos(phase*TAU*2)));
  return {near,far,bob,armPhase:phase};
}
const SLEEVE={};
function draw(g,spec,parts){
  const jeans=[['#5b7066','#3b5352','#253b3c','#222b28'].map(hex)];
  const ctx={sleeveNear:SLEEVE.near||(SLEEVE.near=sleeveTexture(parts,false)),sleeveFar:SLEEVE.far||(SLEEVE.far=sleeveTexture(parts,true)),
    jeanNear:SLEEVE.jn||(SLEEVE.jn=clothTexture(parts,128,[26,54,36,66],jeans,C.jean,false)),jeanFar:SLEEVE.jf||(SLEEVE.jf=clothTexture(parts,128,[26,54,36,66],jeans,C.jeanDark,true))};
  const c=cel(),hipX=31+(spec.hipDx||0)+(g.lean?Math.round(g.lean*6):0),hipY=g.hip+(spec.bob||0)+(spec.hipDy||0),lean=spec.lean??g.lean,hip=[hipX,hipY];
  const sh=(y)=>(hipY-y)*lean;
  const shoulder=[31+Math.round((49-34)*lean)+(spec.hipDx||0)+(g.lean?Math.round(g.lean*6):0)+(g.shiftX||0),34+(spec.bob||0)+(spec.hipDy||0)+(g.crouch?g.hip-50:0)];
  const arm=(swing,far)=>{const a=Math.PI/2-swing,elbowBend=g.elbow+(spec.elbowAdd||0)+Math.max(0,swing)*.55,el=[shoulder[0]+Math.cos(a)*UPPER,shoulder[1]+Math.sin(a)*UPPER],fa=a-elbowBend,wr=[el[0]+Math.cos(fa)*FORE,el[1]+Math.sin(fa)*FORE];
    const s=far?[shoulder[0]-2,shoulder[1]+1]:shoulder;return {pts:[s,[el[0]-(far?2:0),el[1]+(far?1:0)],[wr[0]-(far?2:0),wr[1]+(far?1:0)]]};};
  const legPts=f=>{f=ground(f);const ankle=[hipX+f.x,f.y],k=ik(hip,ankle,THIGH,SHIN,-1);const dx=k.joint[0]-k.end[0],dy=k.joint[1]-k.end[1],d=Math.hypot(dx,dy)||1,cuff=[k.end[0]+dx/d*1.8,k.end[1]+dy/d*1.8];return {pts:[hip,k.joint,cuff],ankle:k.end};};
  // Reaching arms: two-bone IK to a hand target, elbow hanging below the line.
  const reach=(target,far)=>{const s0=far?[shoulder[0]-2,shoulder[1]+1]:shoulder,k=ik(s0,target,UPPER,FORE,target[0]>=s0[0]?1:-1);return {pts:[s0,k.joint,k.end]};};
  const farArm=spec.farHand?reach(spec.farHand,true):arm(spec.farSwing,true),nearArm=spec.nearHand?reach(spec.nearHand,false):arm(spec.nearSwing,false),farLeg=legPts(spec.far),nearLeg=legPts(spec.near);
  limb(c,farArm.pts,2.2,C.sleeveDark,C.sleeveDeep,null,ctx.sleeveFar,spec.noClip?-1e9:Math.round(shoulder[1])+2);hand(c,farArm.pts[2].map(Math.round),true);
  limb(c,farLeg.pts,2.5,C.jeanDark,C.ink,null,ctx.jeanFar);boot(c,farLeg.ankle,spec.far.angle,true);
  limb(c,nearLeg.pts,2.6,C.jean,C.jeanDark,C.jeanLight,ctx.jeanNear);boot(c,nearLeg.ankle,spec.near.angle,false);
  const dy=(spec.bob||0)+(spec.hipDy||0)+(g.crouch?g.hip-50:0),dx=(spec.hipDx||0)+(g.lean?Math.round(g.lean*6):0)+(g.shiftX||0);
  const packLag=spec.packLag||0;
  blit(c,parts,64,dx,dy,lean,49,(x,y)=>x<=25?packLag:0);
  blit(c,parts,0,dx+(spec.headDx||0),dy+(spec.headDy||0),lean,49);
  limb(c,nearArm.pts,2.4,C.sleeve,C.sleeveShade,null,ctx.sleeveNear,spec.noClip?-1e9:Math.round(shoulder[1])+2);const handPx=nearArm.pts[2].map(Math.round);if(!spec.noNearHand)hand(c,handPx,false);
  return {cel:c,hand:handPx,nearAnkle:nearLeg.ankle,farAnkle:farLeg.ankle};
}
function gaitSpec(g,phase,prevBob){const p=pose(g,phase),swing=Math.sin(phase*TAU)*g.swing;
  // Follow-through: head and pack settle one cel after the body (±1 px).
  const lag=Math.max(-1,Math.min(1,prevBob-p.bob));
  return {near:p.near,far:p.far,bob:p.bob,nearSwing:-swing,farSwing:swing,packLag:g.pack||g.cels===8?lag:0,headDy:g.crouch||g.kick?0:Math.max(0,lag)};} // head only sinks into the collar, never lifts off it

// ---------- bake ----------
function bake(){
  const parts=PNG.decode(fs.readFileSync(path.join(ART,'traveller-parts.png')));
  const out=[],add=(id,state,res,events=[],extra={})=>out.push({id,state,res,events,...extra});
  const still={x:0,y:ANKLE_Y,angle:0,stance:true},stand=(o={})=>({near:{...still,x:2},far:{...still,x:-3},bob:0,nearSwing:.06,farSwing:-.06,...o});
  const idleG={...GAITS.walk,hip:49,lean:0,elbow:.2};
  // Idle: 4 cels, breathing = 1px chest/pack rise on cels 1–2.
  for(let i=0;i<4;i++)add('idle-'+i,'idle',draw(idleG,stand({bob:i===1||i===2?-1:0,hipDy:0}),parts));
  for(const name of ['walk','run'])for(let i=0;i<8;i++){const g=GAITS[name],ph=(i+.5)/g.cels,prev=pose(g,((i-.5)/g.cels+1)%1).bob;
    const s=gaitSpec(g,ph,prev),res=draw(g,s,parts);add(name+'-'+i,name,res,(i===0||i===4)?['foot-contact']:[],{phase:ph});}
  const cg=GAITS.crouch;
  add('crouch-idle','crouch',draw(cg,{near:{...still,x:5},far:{...still,x:-6},bob:0,nearSwing:.15,farSwing:.1},parts));
  for(let i=0;i<6;i++){const ph=(i+.5)/6,s=gaitSpec(cg,ph,0);s.nearSwing+=.15;s.farSwing+=.1;add('crouch-'+i,'crouch',draw(cg,s,parts),(i===0||i===3)?['foot-contact']:[],{phase:ph});}
  // Start: weight shifts forward before the first step.
  add('start-0','start',draw({...idleG,lean:.06},stand({near:{...still,x:3},far:{x:-5,y:ANKLE_Y-1,angle:-.3},nearSwing:-.15,farSwing:.15}),parts));
  add('start-1','start',draw({...idleG,lean:.1},stand({near:{...still,x:1},far:{x:-6,y:ANKLE_Y-2,angle:-.45},nearSwing:-.3,farSwing:.3,bob:1}),parts));
  // Stop: planting step then settle. Run stop adds a braking cel.
  add('stop-brake','stop',draw({...GAITS.run,lean:-.06,elbow:1.2},{near:{x:11,y:ANKLE_Y,angle:.3,stance:true},far:{x:-9,y:ANKLE_Y-1,angle:-.3},bob:2,nearSwing:.5,farSwing:-.4},parts));
  add('stop-0','stop',draw({...idleG,lean:-.04},stand({near:{...still,x:7},far:{...still,x:-6},bob:1,nearSwing:.25,farSwing:-.2}),parts));
  add('stop-1','stop',draw(idleG,stand({near:{...still,x:3},far:{...still,x:-3},bob:1,nearSwing:.1,farSwing:-.08}),parts));
  // Turn: plain flip (no scaling). turn-0 pivots on crossed feet with the weight
  // still behind; turn-1 settles forward into the new direction.
  add('turn-0','turn',draw({...idleG,lean:-.03},stand({near:{...still,x:-3},far:{...still,x:4},nearSwing:-.2,farSwing:.25,bob:1}),parts));
  add('turn-1','turn',draw({...idleG,lean:.04},stand({near:{...still,x:4},far:{...still,x:-2},nearSwing:.15,farSwing:-.1}),parts));
  // ---------- actions (phase 2) ----------
  // Tool cels hold the body only; the runtime draws the tool at `hand` with `tool`
  // (radians, equipment.js convention: 0 = haft up, head/bit forward).
  const dir=a=>[Math.sin(a),-Math.cos(a)];
  const act=(id,o)=>{const g={...GAITS.walk,hip:o.hip??50,lean:o.lean??0,elbow:.3,crouch:true,shiftX:o.shiftX||0};
    const grip=o.grip,two=o.tool!=null&&o.twoHands!==false,d=dir(o.tool??0);
    const spec={noClip:true,near:{...still,x:6,...(o.near||{})},far:{...still,x:-5,...(o.far||{})},bob:0,nearSwing:.1,farSwing:-.1,
      nearHand:grip&&two?[grip[0]+d[0]*3,grip[1]+d[1]*3]:grip,farHand:o.farHand||(grip&&two?grip:null)};
    const res=draw(g,spec,parts);res.hand=grip?grip.map(Math.round):res.hand;add(id,'action',res,o.events||[],{tool:o.tool??null});};
  const wide={near:{x:8},far:{x:-7}};
  // Axe into a standing tree: horizontal swing. Windup → top/hold → smear → impact → recover ×2.
  act('chop-0',{...wide,lean:-.04,grip:[25,33],tool:-1.1});
  act('chop-1',{...wide,lean:-.07,grip:[21,30],tool:-1.65,hip:51});
  act('chop-2',{...wide,lean:.06,grip:[40,37],tool:.35});
  act('chop-3',{...wide,lean:.1,grip:[49,43],tool:1.4,hip:51,events:['axe-contact']});
  act('chop-4',{...wide,lean:.05,grip:[45,47],tool:1.0});
  act('chop-5',{...wide,lean:0,grip:[41,50],tool:.4});
  // Axe into a log on the ground: overhead vertical split, knees give at impact.
  act('split-0',{...wide,lean:-.05,grip:[30,20],tool:-.6});
  act('split-1',{...wide,lean:-.09,grip:[27,15],tool:-1.05,hip:49});
  act('split-2',{...wide,lean:.08,grip:[41,30],tool:.8});
  act('split-3',{...wide,lean:.16,grip:[46,52],tool:2.1,hip:53,events:['axe-contact']});
  act('split-4',{...wide,lean:.1,grip:[44,50],tool:1.6,hip:52});
  act('split-5',{...wide,lean:.03,grip:[41,50],tool:.6});
  // Gather: one whole motion – bend, pick, rise.
  act('gather-0',{hip:55,lean:.08,shiftX:1,grip:[43,57],near:{x:7},far:{x:-6}});
  act('gather-1',{hip:60,lean:.12,shiftX:3,grip:[47,63],farHand:[42,63],near:{x:12},far:{x:-8,angle:-.5}});
  act('gather-2',{hip:60,lean:.12,shiftX:3,grip:[44,61],farHand:[46,63],near:{x:12},far:{x:-8,angle:-.5},events:['pick']});
  act('gather-3',{hip:58,lean:.09,shiftX:2,grip:[41,52],farHand:[39,54],near:{x:8},far:{x:-7}});
  act('gather-4',{hip:52,lean:.03,grip:[37,50],near:{x:5},far:{x:-4}});
  // Skinning: kneel down, 4-cel knife loop, rise. Knife rides the near hand.
  const kneel={hip:61,lean:.1,shiftX:2,near:{x:9},far:{x:-9,angle:-.6}};
  act('skin-down',{hip:56,lean:.06,shiftX:1,grip:[42,56],near:{x:8},far:{x:-7}});
  for(const [i,[x,y]] of [[47,66],[49,67],[47,68],[45,67]].entries())act('skin-'+i,{...kneel,grip:[x,y],farHand:[43,68]});
  act('skin-up',{hip:56,lean:.05,shiftX:1,grip:[41,55],near:{x:8},far:{x:-7}});
  // Petting Kajo: kneeling, palm strokes over the head.
  act('pet-0',{hip:58,lean:.06,shiftX:1,grip:[49,54],near:{x:8},far:{x:-8,angle:-.5}});
  act('pet-1',{hip:58,lean:.07,shiftX:1,grip:[45,52],near:{x:8},far:{x:-8,angle:-.5}});
  // Throwing a stick for Kajo: back → throw → follow-through (stick leaves on cel 1).
  act('throw-0',{lean:-.06,grip:[22,30],near:{x:7},far:{x:-6}});
  act('throw-1',{lean:.06,grip:[38,24],near:{x:8},far:{x:-6},events:['release']});
  act('throw-2',{lean:.1,grip:[48,40],near:{x:8},far:{x:-6,y:ANKLE_Y-1,angle:-.4}});
  act('throw-3',{lean:.04,grip:[44,48],near:{x:6},far:{x:-5}});
  // Sheet
  const cols=6,rows=Math.ceil(out.length/cols),img=PNG.create(cols*W,rows*H);
  out.forEach((f,i)=>{const ox=i%cols*W,oy=Math.floor(i/cols)*H;f.rect=[ox,oy,W,H];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=f.res.cel.data[y*W+x];if(!v)continue;img.data.set(v,((oy+y)*img.width+ox+x)*4);}});
  const bytes=PNG.encode(img);if(process.env.PREVIEW){fs.writeFileSync(process.env.PREVIEW,bytes);return out;}
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(ART,'traveller.png'),bytes);
  const partsBytes=fs.readFileSync(path.join(ART,'traveller-parts.png'));
  const meta={id:'traveller',file:'assets/art-v2/traveller.png',nativeSize:[img.width,img.height],palette:Object.values(C).map(c=>'#'+c.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')),
    gaits:Object.fromEntries(Object.entries(GAITS).map(([k,g])=>[k,{cels:g.cels,cyclePx:g.cycle,duty:g.duty}])),
    frames:out.map(f=>({id:f.id,rect:f.rect,anchor:ANCHOR,hand:f.res.hand,state:f.state,events:f.events,...(f.tool!=null?{tool:f.tool}:{}),...(f.phase!=null?{phase:+f.phase.toFixed(4),nearAnkle:f.res.nearAnkle.map(v=>+v.toFixed(2)),farAnkle:f.res.farAnkle.map(v=>+v.toFixed(2))}:{})})),
    sha256:sha,source:{file:'assets/art-v2/traveller-parts.png',sha256:crypto.createHash('sha256').update(partsBytes).digest('hex'),script:'scripts/bake-traveller.cjs',
      method:'Head and torso+pack cut from the 0.8 illustrated idle cel; limbs and boots rasterised from a two-bone rig in the sprite palette; integer shear for lean, no resampling'},
    license:'original',status:'rig-v1'};
  fs.writeFileSync(path.join(ART,'traveller.json'),JSON.stringify(meta,null,2)+'\n');
  // Inline frame table into traveller-art.js between markers.
  const js=path.join(ROOT,'traveller-art.js'),text=fs.readFileSync(js,'utf8'),table=JSON.stringify(out.map(f=>f.tool!=null?[f.id,f.rect,f.res.hand,f.tool]:[f.id,f.rect,f.res.hand]));
  const next=text.replace(/\/\*BAKED\*\/.*?\/\*END\*\//s,'/*BAKED*/'+table+'/*END*/');if(next===text&&!text.includes('/*BAKED*/'+table))throw Error('traveller-art.js markers missing');
  fs.writeFileSync(js,next);
  console.log(`baked ${out.length} cels → traveller.png ${img.width}×${img.height} sha ${sha.slice(0,12)}`);
}
if(require.main===module){const i=process.argv.indexOf('--extract');if(i>=0)extract(process.argv[i+1]);else bake();}
module.exports={GAITS,footAt,pose,ANCHOR};
