#!/usr/bin/env node
// Traveller rig → baked pixel cels.
//   node scripts/bake-traveller.cjs --extract   (one-off: cut parts from the legacy idle cel)
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
function extract(){
  const src=PNG.decode(fs.readFileSync(path.join(ART,'traveller.png'))),parts=PNG.create(128,H),idle=[128,80];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=((idle[1]+y)*src.width+idle[0]+x)*4;if(src.data[i+3]<128)continue;
    let dx=-1;if(y<=28)dx=0;else if(y<=49||(y<=51&&x>=31&&x<=37))dx=64;if(dx<0)continue;
    const o=(y*128+x+dx)*4;src.data.copy(parts.data,o,i,i+4);parts.data[o+3]=255;}
  fs.writeFileSync(path.join(ART,'traveller-parts.png'),PNG.encode(parts));console.log('wrote traveller-parts.png');
}

// ---------- raster helpers ----------
function cel(){return {data:new Array(W*H).fill(null)};}
function put(c,x,y,col){x=Math.round(x);y=Math.round(y);if(x<0||y<0||x>=W||y>=H)return;c.data[y*W+x]=col;}
function blit(c,layer,off,dx,dy,shear=0,pivotY=0,lagRows=null){
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*layer.width+x+off)*4;if(layer.data[i+3]<128)continue;
    const lag=lagRows&&lagRows(x,y)||0,sx=Math.round(x+dx+(pivotY-y)*shear);put(c,sx,y+dy+lag,[layer.data[i],layer.data[i+1],layer.data[i+2],255]);}
}
function distSeg(px,py,a,b){const vx=b[0]-a[0],vy=b[1]-a[1],l=vx*vx+vy*vy||1e-9;let t=((px-a[0])*vx+(py-a[1])*vy)/l;t=Math.max(0,Math.min(1,t));const qx=a[0]+vx*t-px,qy=a[1]+vy*t-py;return {d:Math.hypot(qx,qy),side:(vx*(py-a[1])-vy*(px-a[0]))};}
// A limb: chain of points, fill radius r, 1px ink outline, shade on the underside.
function limb(c,pts,r,fill,shade,light){
  const fillPx=new Set(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.floor(Math.min(...xs)-r-2),x1=Math.ceil(Math.max(...xs)+r+2),y0=Math.floor(Math.min(...ys)-r-2),y1=Math.ceil(Math.max(...ys)+r+2);
  const info=new Map();
  for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){let best={d:1e9};for(let k=0;k+1<pts.length;k++){const s=distSeg(x+.5,y+.5,pts[k],pts[k+1]);if(s.d<best.d)best=s;}
    if(best.d<=r)fillPx.add(x+','+y),info.set(x+','+y,best);}
  for(const key of fillPx){const [x,y]=key.split(',').map(Number),edge=[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>!fillPx.has((x+a)+','+(y+b)));
    for(const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]])if(!fillPx.has((x+a)+','+(y+b)))put(c,x+a,y+b,C.ink);}
  for(const key of fillPx){const [x,y]=key.split(',').map(Number),s=info.get(key);const under=!fillPx.has(x+','+(y+1))||!fillPx.has((x-1)+','+y);
    put(c,x,y,under?shade:(light&&!fillPx.has(x+','+(y-1))?light:fill));}
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
  walk:{cels:8,cycle:52,duty:.5,lift:4,hip:50,bob:1,lean:.03,swing:.8,elbow:.35,pack:0},
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
function draw(g,spec,parts,ctx={}){
  const c=cel(),hipX=31+(spec.hipDx||0)+(g.lean?Math.round(g.lean*6):0),hipY=g.hip+(spec.bob||0)+(spec.hipDy||0),lean=spec.lean??g.lean,hip=[hipX,hipY];
  const sh=(y)=>(hipY-y)*lean;
  const shoulder=[31+Math.round((49-34)*lean)+(spec.hipDx||0)+(g.lean?Math.round(g.lean*6):0)+(g.shiftX||0),34+(spec.bob||0)+(spec.hipDy||0)+(g.crouch?g.hip-50:0)];
  const arm=(swing,far)=>{const a=Math.PI/2-swing,elbowBend=g.elbow+(spec.elbowAdd||0),el=[shoulder[0]+Math.cos(a)*UPPER,shoulder[1]+Math.sin(a)*UPPER],fa=a-elbowBend,wr=[el[0]+Math.cos(fa)*FORE,el[1]+Math.sin(fa)*FORE];
    const s=far?[shoulder[0]-2,shoulder[1]+1]:shoulder;return {pts:[s,[el[0]-(far?2:0),el[1]+(far?1:0)],[wr[0]-(far?2:0),wr[1]+(far?1:0)]]};};
  const legPts=f=>{f=ground(f);const ankle=[hipX+f.x,f.y],k=ik(hip,ankle,THIGH,SHIN,-1);const dx=k.joint[0]-k.end[0],dy=k.joint[1]-k.end[1],d=Math.hypot(dx,dy)||1,cuff=[k.end[0]+dx/d*1.8,k.end[1]+dy/d*1.8];return {pts:[hip,k.joint,cuff],ankle:k.end};};
  const farArm=arm(spec.farSwing,true),nearArm=arm(spec.nearSwing,false),farLeg=legPts(spec.far),nearLeg=legPts(spec.near);
  limb(c,farArm.pts,1.7,C.sleeveDark,C.sleeveDeep,null);hand(c,farArm.pts[2].map(Math.round),true);
  limb(c,farLeg.pts,2.5,C.jeanDark,C.ink,null);boot(c,farLeg.ankle,spec.far.angle,true);
  limb(c,nearLeg.pts,2.6,C.jean,C.jeanDark,C.jeanLight);boot(c,nearLeg.ankle,spec.near.angle,false);
  const dy=(spec.bob||0)+(spec.hipDy||0)+(g.crouch?g.hip-50:0),dx=(spec.hipDx||0)+(g.lean?Math.round(g.lean*6):0)+(g.shiftX||0);
  const packLag=spec.packLag||0;
  blit(c,parts,64,dx,dy,lean,49,(x,y)=>x<=25?packLag:0);
  blit(c,parts,0,dx+(spec.headDx||0),dy+(spec.headDy||0),lean,49);
  limb(c,nearArm.pts,1.7,C.sleeve,C.sleeveShade,null);const handPx=nearArm.pts[2].map(Math.round);hand(c,handPx,false);
  return {cel:c,hand:handPx,nearAnkle:nearLeg.ankle,farAnkle:farLeg.ankle};
}
function gaitSpec(g,phase,prevBob){const p=pose(g,phase),swing=Math.sin(phase*TAU)*g.swing;
  return {near:p.near,far:p.far,bob:p.bob,nearSwing:-swing,farSwing:swing,packLag:g.pack?(prevBob-p.bob):0};}

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
  // Sheet
  const cols=6,rows=Math.ceil(out.length/cols),img=PNG.create(cols*W,rows*H);
  out.forEach((f,i)=>{const ox=i%cols*W,oy=Math.floor(i/cols)*H;f.rect=[ox,oy,W,H];for(let y=0;y<H;y++)for(let x=0;x<W;x++){const v=f.res.cel.data[y*W+x];if(!v)continue;img.data.set(v,((oy+y)*img.width+ox+x)*4);}});
  const bytes=PNG.encode(img);if(process.env.PREVIEW){fs.writeFileSync(process.env.PREVIEW,bytes);return out;}
  const sha=crypto.createHash('sha256').update(bytes).digest('hex');
  fs.writeFileSync(path.join(ART,'traveller.png'),bytes);
  const partsBytes=fs.readFileSync(path.join(ART,'traveller-parts.png'));
  const meta={id:'traveller',file:'assets/art-v2/traveller.png',nativeSize:[img.width,img.height],palette:Object.values(C).map(c=>'#'+c.slice(0,3).map(v=>v.toString(16).padStart(2,'0')).join('')),
    gaits:Object.fromEntries(Object.entries(GAITS).map(([k,g])=>[k,{cels:g.cels,cyclePx:g.cycle,duty:g.duty}])),
    frames:out.map(f=>({id:f.id,rect:f.rect,anchor:ANCHOR,hand:f.res.hand,state:f.state,events:f.events,...(f.phase!=null?{phase:+f.phase.toFixed(4),nearAnkle:f.res.nearAnkle.map(v=>+v.toFixed(2)),farAnkle:f.res.farAnkle.map(v=>+v.toFixed(2))}:{})})),
    sha256:sha,source:{file:'assets/art-v2/traveller-parts.png',sha256:crypto.createHash('sha256').update(partsBytes).digest('hex'),script:'scripts/bake-traveller.cjs',
      method:'Head and torso+pack cut from the 0.8 illustrated idle cel; limbs and boots rasterised from a two-bone rig in the sprite palette; integer shear for lean, no resampling'},
    license:'original',status:'rig-v1'};
  fs.writeFileSync(path.join(ART,'traveller.json'),JSON.stringify(meta,null,2)+'\n');
  // Inline frame table into traveller-art.js between markers.
  const js=path.join(ROOT,'traveller-art.js'),text=fs.readFileSync(js,'utf8'),table=JSON.stringify(out.map(f=>[f.id,f.rect,f.res.hand]));
  const next=text.replace(/\/\*BAKED\*\/.*?\/\*END\*\//s,'/*BAKED*/'+table+'/*END*/');if(next===text&&!text.includes('/*BAKED*/'+table))throw Error('traveller-art.js markers missing');
  fs.writeFileSync(js,next);
  console.log(`baked ${out.length} cels → traveller.png ${img.width}×${img.height} sha ${sha.slice(0,12)}`);
}
if(require.main===module){if(process.argv.includes('--extract'))extract();else bake();}
module.exports={GAITS,footAt,pose,ANCHOR};
