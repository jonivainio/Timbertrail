/* Original layered woodland calibration. No simulation or save mutations. */
(function(root){'use strict';
const P=root.PE,V=root.PEVisualCore,W=960,H=540;
const colors={earth:'#514437',soil:'#796347',path:'#a4895d',moss:'#596a47',shade:'#243731'};
const pondBed=x=>root.PERegions.pond.surface+170*(1-Math.exp(-Math.max(0,root.PERegions.pond.shore-x)/65));
const poly=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();};
const rect=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));};
// Authored coarse contours: rhythm and gaps are designed, never thousands of random flecks.
const crowns=[[[0,0],[-4,15],[-10,22],[-6,22],[-17,37],[-12,37],[-27,57],[-17,54],[-32,73],[-23,72],[-39,95],[-21,91],[-44,122],[-20,116],[-29,141],[0,133],[29,143],[21,120],[39,126],[25,99],[35,99],[19,77],[29,80],[12,51],[21,56],[8,32],[13,32],[5,13]],[[0,0],[-11,8],[-12,19],[-30,22],[-40,35],[-37,44],[-14,45],[-20,62],[-47,63],[-55,73],[-40,85],[-12,79],[-3,61],[9,65],[28,82],[45,78],[52,65],[40,52],[17,48],[25,36],[44,36],[41,20],[24,14],[15,4]],[[0,0],[-15,5],[-26,18],[-22,32],[-36,42],[-37,62],[-23,73],[-27,92],[-15,107],[0,99],[14,108],[25,93],[23,76],[36,64],[34,47],[22,34],[27,21],[14,6]]];
const groups=[{x:100,type:0,h:215},{x:180,type:2,h:170},{x:325,type:0,h:270},{x:476,type:1,h:240},{x:580,type:0,h:200},{x:785,type:2,h:248},{x:835,type:0,h:188},{x:1080,type:1,h:250},{x:1260,type:0,h:235},{x:1345,type:2,h:196}];
function state(r){return r._v2||(r._v2={pool:new V.SurfacePool(r.makeCanvas,8),sprites:new Map(),map:null,terrainKey:null});}
function prepare(r,map){const v=state(r);v.map=map;}
function silhouette(r,type,tone){const v=state(r),key=type+tone;if(v.sprites.has(key))return v.sprites.get(key);const a=r.makeCanvas(128,160),c=a.getContext('2d');c.imageSmoothingEnabled=false;
  if(r.artTrees){c.drawImage(r.artTrees,type*128,0,128,144,0,0,128,160);c.globalCompositeOperation='source-in';rect(c,0,0,128,160,tone);c.globalCompositeOperation='source-over';}
  else{c.translate(64,4);poly(c,crowns[type],tone);poly(c,[[-3,50],[3,50],[5,151],[20,156],[4,156],[0,153],[-11,157],[-22,156],[-4,151]],tone);}
  v.sprites.set(key,a);return a;}
// Background groups have their own rootless, simplified contours. Enlarging the
// detailed play-layer trees produces giant cutouts and a false sense of scale.
function forestGroup(r,variant,tone){const v=state(r),key='group:'+(r.artForest?'atlas:':'draft:')+variant+tone;if(v.sprites.has(key))return v.sprites.get(key);
  if(r.artForest){const a=r.makeCanvas(256,288),c=a.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(r.artForest,variant*256,0,256,288,0,0,256,288);c.globalCompositeOperation='source-atop';c.globalAlpha=.78;rect(c,0,0,256,288,tone);c.globalAlpha=1;c.globalCompositeOperation='source-over';v.sprites.set(key,a);return a;}
  const a=r.makeCanvas(320,240),c=a.getContext('2d');
  const layouts=[[[19,168,0],[58,203,0],[95,146,1],[151,220,0],[189,180,1],[238,192,0],[284,144,0]],[[14,153,0],[49,180,1],[111,214,0],[162,165,0],[216,222,1],[278,177,0]],[[25,205,0],[81,163,0],[123,189,1],[194,225,0],[251,164,0],[298,194,0]]];
  for(const [x,h,type]of layouts[variant]){const bottom=240,top=bottom-h;poly(c,[[x-2,top+28],[x+2,top+28],[x+4,bottom],[x-4,bottom]],tone);
    if(!type){const points=[[x,top]];for(let i=1;i<=7;i++){const y=top+h*.105*i,w=3+i*4;points.push([x-w*.42,y-7],[x-w,y+4],[x-w*.58,y+2]);}points.push([x-9,top+h*.8],[x+9,top+h*.8]);for(let i=7;i>=1;i--){const y=top+h*.105*i,w=3+i*4;points.push([x+w*.58,y+2],[x+w,y+4],[x+w*.42,y-7]);}poly(c,points,tone);}
    else{for(const [dx,dy,w]of [[-10,24,30],[10,45,37],[-17,67,30],[13,88,25]])poly(c,[[x+dx-w,top+dy+8],[x+dx-w+7,top+dy-3],[x+dx-8,top+dy-12],[x+dx+9,top+dy-10],[x+dx+w-5,top+dy-2],[x+dx+w,top+dy+8],[x+dx+9,top+dy+13],[x+dx-13,top+dy+12]],tone);}}
  v.sprites.set(key,a);return a;
}
function depthTrees(r,cam,parallax,tone,baseline,heightScale,shift=0){const c=r.c;
  const map=state(r).map,spacing=parallax<.3?210:parallax<.6?295:390,variants=[0,2,1,0,1,2,2,0,1,0,2];
  for(let section=0;section<24;section++){const world=section*spacing+shift+[0,14,-21,9][section%4],x=world-cam*parallax;if(x<-390||x>W+180)continue;
    // Authored clearings are anchored in each depth plane, not to the camera.
    const gaps=map==='pond'?[[3430,680],[5520,230]]:map==='river'?[[3220,210],[3650,170],[5190,180]]:[[630,180],[1295,120],[3380,220],[4890,140]];
    if(parallax>.6&&gaps.some(([center,radius])=>Math.abs(world-center*parallax)<radius*parallax))continue;
    const h=210*heightScale*[1,.78,1.12,.91,.69][section%5],bottom=baseline+Math.sin(world*.003)*8,a=forestGroup(r,variants[section%variants.length],tone);
    c.drawImage(a,Math.round(x-50),Math.round(bottom-h),Math.round(h*a.width/a.height),Math.round(h));}
  // Each distance layer owns its ground silhouette. Trunk ends disappear into
  // that same plane rather than hanging over a full-width horizontal divider.
  const floor=[];for(let x=-8;x<=W+8;x+=4){const world=x+cam*parallax,shoulder=Math.sin(world*.008+shift*.01)*12+Math.sin(world*.022+1.2)*5;
    const undergrowth=parallax>.6?Math.max(0,Math.sin(world*.027+1.4))*7+Math.max(0,Math.sin(world*.071)) *3:0;
    floor.push([x,baseline-22+shoulder-undergrowth]);}
  floor.push([W+8,H],[-8,H]);poly(c,floor,tone);
  // Low overlapping alder/fern masses break the bare bank without filling the
  // viewing gap with another wall of full-height trees.
  if(parallax>.6)for(const wx of [245,625,1020,1475,2040,2615,3070,3640,4180,4610]){const x=wx-cam*parallax;if(x<-150||x>W+150)continue;
    const y=baseline-14+Math.sin(wx*.008+shift*.01)*12;
    poly(c,[[x-74,y+9],[x-68,y-1],[x-43,y-3],[x-39,y-12],[x-26,y-16],[x-18,y-12],[x-9,y-24],[x+6,y-27],[x+16,y-21],[x+25,y-9],[x+47,y-11],[x+61,y-2],[x+77,y+12]],tone);
  }
}
function materialPatch(r,c,id,x,base,width){
  if(!r.artGround)return;const sx=id%3*256,sy=Math.floor(id/3)*144,scale=width/256,map=state(r).map,center=P.ground(x,map);
  // Warp only the static ground accent to the shared contour. Column samples
  // meet exactly; no translucent edge or separate floating ground plane.
  for(let dx=0;dx<width;dx+=8){const sw=Math.min(8,width-dx),wx=x-width/2+dx,dy=P.ground(wx+sw/2,map)-center;
    c.drawImage(r.artGround,sx+dx/scale,sy,sw/scale,144,wx,base-132*scale+dy,sw,144*scale);}
}
// Material masses, not scattered point noise: each silhouette has a long,
// irregular moss/needle edge and a small exposed upper plane. Coordinates are
// depth offsets on the SAME ground as actors, including the cabin setbacks.
const floorForms=[
  [[-1,.2],[-.88,-.18],[-.65,-.27],[-.52,-.56],[-.17,-.48],[.03,-.7],[.24,-.58],[.38,-.24],[.67,-.3],[.84,-.04],[1,.12],[.83,.42],[.48,.35],[.28,.64],[-.01,.51],[-.25,.72],[-.44,.37],[-.74,.43]],
  [[-1,.1],[-.76,-.16],[-.62,-.54],[-.27,-.45],[-.07,-.62],[.13,-.38],[.41,-.48],[.56,-.12],[.82,-.15],[1,.21],[.71,.45],[.42,.32],[.17,.69],[-.13,.5],[-.45,.66],[-.6,.31],[-.86,.4]],
  [[-1,.02],[-.85,-.41],[-.59,-.3],[-.33,-.61],[-.04,-.47],[.22,-.62],[.47,-.29],[.7,-.37],[.82,-.08],[1,.27],[.78,.54],[.48,.38],[.24,.63],[-.03,.45],[-.32,.68],[-.56,.38],[-.79,.43]]
];
// Rounded material contours sampled onto the shared world grid. The point
// layouts are authored; a small deterministic edge rhythm gives moss a broken
// margin without filling the whole ground with uniform noise.
function materialContour(map,x,depth,width,height,form,plane='back'){
 const src=floorForms[form],points=[],n=src.length,ground=plane==='back'?xx=>root.PETerrainSurface.top(map,xx):xx=>P.ground(xx,map);
 for(let i=0;i<n;i++){const p0=src[(i+n-1)%n],p1=src[i],p2=src[(i+1)%n],p3=src[(i+2)%n];
  for(let j=0;j<4;j++){const t=j/4,t2=t*t,t3=t2*t,cat=k=>.5*((2*p1[k])+(-p0[k]+p2[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(-p0[k]+3*p1[k]-3*p2[k]+p3[k])*t3);
   const xx=Math.round((x+cat(0)*width)/3)*3,edge=Math.sin(xx*.19+form)*1.1+Math.sin(xx*.071+depth)*1.3;
   points.push([xx,Math.round((ground(xx)+depth+cat(1)*height+edge)/1.5)*1.5]);
  }
 }
 return points;
}
function floorMass(c,map,x,depth,width,height,form,color,plane='back'){poly(c,materialContour(map,x,depth,width,height,form,plane),color);}
const soilPalette={base:'#5b5340',earth:'#6d5d44',worn:'#807053',wornLight:'#94805b',mossShadow:'#454d39',moss:'#535d40',mossLight:'#636b46',crease:'#4d4d39',front:'#363e31',frontLight:'#404934'};
function mossField(c,map,x,depth,width,height,form,seed,plane='back'){
 const p=soilPalette,near=plane==='front';floorMass(c,map,x,depth,width,height,form,near?p.front:p.mossShadow,plane);
 floorMass(c,map,x-width*.09,depth-height*.09,width*.90,height*.82,(form+1)%3,near?p.frontLight:p.moss,plane);
 // Uneven connected cushions and their short, broken highlight margins.
 const mounds=[[-.68,-.08,.23,.31],[-.31,-.29,.28,.28],[.13,-.23,.31,.34],[.56,.03,.25,.28],[-.08,.24,.26,.22]];
 for(let j=0;j<mounds.length;j++){const [u,v,w,h]=mounds[j],xx=x+u*width,dd=depth+v*height;
  floorMass(c,map,xx,dd,width*w,height*h,(form+j)%3,near?p.frontLight:(j===seed%5?'#657047':p.moss),plane);
  if(j%2===seed%2&&!near)floorMass(c,map,xx-width*w*.13,dd-height*h*.30,width*w*.77,height*h*.23,(form+j+1)%3,p.mossLight,plane);
 }
 // Short clusters stay attached to a material edge, never an even noise veil.
 const outline=materialContour(map,x,depth,width,height,form,plane);
 for(let j=seed%5;j<outline.length;j+=7){const [xx,yy]=outline[j],length=[9,15,7,12][j%4];rect(c,xx-4,yy-1,length,1.5,near?p.frontLight:p.moss);rect(c,xx+1,yy+1,Math.max(4,length-5),1.5,near?p.front:p.mossShadow);}
 // A needle-filled notch opens into the earth, breaking the nested-oval look.
 floorMass(c,map,x+width*.54,depth+height*.25,width*.36,height*.32,(form+2)%3,near?p.base:p.earth,plane);
}
function groundMaterials(c,map){
 const p=soilPalette;
 // Finite route composition, with wider quiet gaps around interaction sites.
 // Coverage continues from the distant yard edge through the walking contour.
 const offsets=[0,41,-29,18,-12,33,-47],depths=[38,66,45,81,59,34,72];
 for(let i=0;i<23;i++){const x=72+i*303+offsets[i%7];if(map==='pond'&&(x<4010||Math.abs(x-5520)<280))continue;if(map==='forest'&&Math.abs(x-3380)<160)continue;
  mossField(c,map,x,depths[i%7],[175,231,198,247,202][i%5],[27,36,32,30][i%4],i%3,i);
 }
 // Front-plane masses are larger and quieter, not a featureless brown strip.
 for(let i=0;i<14;i++){const x=60+i*487+offsets[(i+3)%7];if(map==='pond'&&x<4040)continue;
  mossField(c,map,x,[104,134,118,149][i%4],[331,292,368,324][i%4],[51,61,56][i%3],(i+1)%3,i,'front');
 }
 // Wear appears in overlapping earth pockets, not a bright continuous ribbon.
 for(let i=0;i<39;i++){const x=i*172+31+[0,27,-19,12][i%4];if(map==='pond'&&x<3940)continue;
  const width=[107,131,89,117][i%4];floorMass(c,map,x,9,width,18,i%3,p.earth,'walk');
  floorMass(c,map,x-12,10,width*.83,11,(i+1)%3,p.worn,'walk');
  if(i%3!==1)floorMass(c,map,x-24,7,width*.32,3,(i+2)%3,p.wornLight,'walk');
  // Small grouped root/needle traces aligned to the walking plane.
  if(i%3===0){const y=P.ground(x,map);poly(c,[[x-47,y+16],[x-30,y+13],[x-5,y+14],[x+14,y+11],[x+29,y+12],[x+10,y+16],[x-13,y+17],[x-34,y+16]],p.crease);
   rect(c,x-29,y+13,20,1.5,p.wornLight);}
 }
 // Narrow worn approaches share the same opaque yard surface; nothing projects
 // from the path as a floating bridge. Slope and shoulder stay soil/moss.
 for(const area of root.PETerrainSurface.areas(map)){if(!area.path)continue;
  // The clearing has a moss shoulder and a continuous worn approach. Its
  // colours belong to the opaque ground; it has no elevated side or front lip.
  for(const [side,spread]of [[-1,.72],[1,.8]]){
   const x=area.x+side*(side<0?area.left:area.right)*spread;
   mossField(c,map,x,27,side<0?123:167,25,side<0?1:2,3);
   floorMass(c,map,x-side*45,43,91,10,0,p.moss);
  }
  // Three site-scale masses, not a tiled field of moss ovals. The central
  // walking lane remains quiet; the left bank and near edge carry the material.
  mossField(c,map,area.x-area.left*.57,area.depth*.47,area.left*.46+30,42,1,2);
  mossField(c,map,area.x+area.right*.63,area.depth*.62,area.right*.38+24,38,2,4);
  mossField(c,map,area.x-area.left*.28,60,area.left*.65+area.right*.35,65,0,3,'front');
  const approach=(inset,color)=>{const points=[];
   for(const side of [-1,1])for(let j=0;j<=12;j++){
    const u=side<0?j/12:1-j/12,center=area.x-13+Math.sin(u*2.7)*13;
    const half=(21+u*area.path*.78)*inset+Math.sin(u*23)*3;
    const x=center+side*half,top=root.PETerrainSurface.top(map,x);
    points.push([x,top+20+u*(P.ground(x,map)-top-14)]);
   }poly(c,points,color);
  };
  approach(1.2,p.earth);approach(1,p.worn);
  // Wear blends into the wider yard on alternating sides, not two kerb lines.
  floorMass(c,map,area.x-37,area.depth*.54,39,15,1,p.worn);
  floorMass(c,map,area.x+40,area.depth*.77,54,16,2,p.worn);
  for(const [dx,depth,width]of [[-51,41,25],[49,72,38],[-69,97,28]])floorMass(c,map,area.x+dx,depth,width,4,1,p.earth);
 }
}
function paintSoil(r,c,map){
 if(!r.artSoil)return;
 if(r._soilPixels?.source!==r.artSoil){const a=r.makeCanvas(192,96),ac=a.getContext('2d');ac.imageSmoothingEnabled=false;ac.drawImage(r.artSoil,0,0,192,96);r._soilPixels={source:r.artSoil,data:ac.getImageData(0,0,192,96).data};}
 const q=r.artScale||.5,w=c.canvas.width,h=c.canvas.height,original=c.getImageData(0,0,w,h),d=original.data,result=c.getImageData(0,0,w,h),out=result.data,texture=r._soilPixels.data;
 // Color-only material marks concentrate at authored edges. Nearly solid
 // interiors and the worn walking lane preserve visual rest and readable feet.
 // Operate once on the cached native ground, not thousands of draw calls/frame.
 for(let x=0;x<w;x++){const wx=(x+.5)/q;if(map==='pond'&&wx<3940)continue;const top=root.PETerrainSurface.top(map,wx),walk=P.ground(wx,map),u=Math.floor(wx/3)%192;
  for(let y=Math.max(0,Math.ceil(top*q));y<h;y++){const i=(y*w+x)*4;if(d[i+3]!==255)continue;let edge=0;
   for(const [dx,dy]of [[-5,0],[5,0],[0,-3],[0,3]]){const xx=Math.max(0,Math.min(w-1,x+dx)),yy=Math.max(0,Math.min(h-1,y+dy)),j=(yy*w+xx)*4;if(d[j+3]===255)edge=Math.max(edge,Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1]));}
   const wy=(y+.5)/q,front=1-P.clamp((wy-walk-30)/110,0,1)*.7,quiet=Math.abs(wy-walk)<17?.35:1;
   const amount=(edge>25?.44:edge>12?.22:.11)*front*quiet,v=Math.max(0,Math.floor((wy-top)/3))%96,src=(v*192+u)*4;
   for(let k=0;k<3;k++)out[i+k]=Math.round(d[i+k]*(1-amount)+texture[src+k]*amount);
  }
 }
 c.putImageData(result,0,0);
}
function terrain(r){const v=state(r),scale=r.artScale||.5,key=v.map+':'+scale+':'+!!r.artGround+':'+!!r.artSoil;if(v.terrainKey===key)return v.pool.get('terrain',P.WORLD*scale,H*scale);
  const a=v.pool.get('terrain',P.WORLD*scale,H*scale),c=a.getContext('2d');c.setTransform(scale,0,0,scale,0,0);c.clearRect(0,0,P.WORLD,H);
  c.beginPath();c.moveTo(0,H);for(let x=0;x<=P.WORLD;x+=4)c.lineTo(x,v.map==='pond'&&x<3940?pondBed(x):root.PETerrainSurface.top(v.map,x));c.lineTo(P.WORLD,H);c.closePath();c.save();c.clip();rect(c,0,0,P.WORLD,H,colors.earth);
  rect(c,0,0,P.WORLD,H,'#59513e');
  if(!r.artGround)for(let i=0;i<70;i++){const x=i*97+23,y=P.ground(x,v.map)+[6,49,87,22,66][i%5],w=[58,78,44,69][i%4];poly(c,[[x-w*.5,y+5],[x-w*.4,y-4],[x-w*.15,y-6],[x,y-2],[x+w*.24,y-5],[x+w*.4,y],[x+w*.5,y+4],[x+w*.31,y+8],[x+w*.16,y+7],[x,y+12],[x-w*.3,y+9]],i%3?'#4b5939':'#667047');
    poly(c,[[x-w*.4,y-4],[x-w*.15,y-6],[x,y-2],[x+w*.24,y-5],[x+w*.35,y-1],[x+w*.07,y+1],[x-w*.12,y-1],[x-w*.35,y+1]],i%3?'#687148':'#85865a');}
  for(const area of root.PETerrainSurface.areas(v.map)){const left=area.x-area.left,right=area.x+area.right;
    c.beginPath();for(let x=left;x<=right;x+=4){const y=root.PETerrainSurface.top(v.map,x);x===left?c.moveTo(x,y):c.lineTo(x,y);}for(let x=right;x>=left;x-=4)c.lineTo(x,P.ground(x,v.map)+27);c.closePath();c.fillStyle=colors.soil;c.fill();
  }
  groundMaterials(c,v.map);
  paintSoil(r,c,v.map);
  if(r.artGround){
    const rhythm=[0,2,1,4,0,1,3,2,1,5];
    const accents=v.map==='pond'?[4200,4610,5090,6030,6280]:v.map==='river'?[230,860,1710,2460,2980,4210,5590,6180]:[220,1060,1820,2480,3040,3710,4520,5210,6070];
    accents.forEach((x,i)=>materialPatch(r,c,rhythm[i%rhythm.length],x,P.ground(x,v.map)+[51,59,47][i%3],[74,88,80][i%3]));
    for(const area of root.PETerrainSurface.areas(v.map))for(const [dx,depth,id,width]of [[-240,28,2,72],[260,27,1,78]]){
      const x=area.x+dx;materialPatch(r,c,id,x,root.PETerrainSurface.top(v.map,x)+depth,width);}
  }
  c.restore();v.terrainKey=key;return a;
}
// Fixed sky, faint parallax; a few stars breathe. Drawn before every land layer
// so trees and hills occlude them naturally.
const STARS=Array.from({length:90},(_,i)=>[P.random(i*7.13+1)*W*1.2,(50+Math.pow(P.random(i*3.7+2),1.6)*230),P.random(i*5.9+3)]);
function stars(c,cam,t,k){for(const [x,y,b]of STARS){const xx=Math.round(((x-cam*.015)%(W*1.2)+W*1.2)%(W*1.2)),yy=Math.round(y),tw=b>.82?.55+.45*Math.sin(t*1.7+x):1;
    c.globalAlpha=k*(.35+.65*b)*tw;c.fillStyle=b>.9?'#fff1cf':'#dfe7ff';c.fillRect(xx,yy,b>.93?2:1,b>.93?2:1);}
  const mx=Math.round(W*.7-cam*.004),my=122;c.globalAlpha=k;c.fillStyle='#f1ead2';c.beginPath();c.arc(mx,my,11,0,Math.PI*2);c.fill();c.fillStyle='#c9c6b8';c.fillRect(mx-4,my-3,3,3);c.fillRect(mx+3,my+2,4,3);c.fillRect(mx-2,my+5,2,2);
  c.globalAlpha=k*.18;const halo=c.createRadialGradient(mx,my,10,mx,my,60);halo.addColorStop(0,'#dfe7ff');halo.addColorStop(1,'rgba(223,231,255,0)');c.fillStyle=halo;c.fillRect(mx-60,my-60,120,120);c.globalAlpha=1;
}
function landscape(r,cam){const c=r.c,map=state(r).map,pond=map==='pond',river=map==='river';
  const s=state(r).lightState,warm=s?Math.max(Math.exp(-Math.pow((s.dayTime-.29)/.085,2)),Math.exp(-Math.pow((s.dayTime-.73)/.09,2))):0;
  const n=s?P.clamp((1-ambient(s))/.88,0,1):0,mix=(a,b,k=n)=>{const h=x=>[1,3,5].map(i=>parseInt(x.slice(i,i+2),16));const A=h(a),B=h(b);return 'rgb('+A.map((v,i)=>Math.round(v+(B[i]-v)*k)).join(',')+')';};
  const sky=c.createLinearGradient(0,0,0,400);sky.addColorStop(0,mix(pond?'#708e99':'#6f8f92','#3a4866'));sky.addColorStop(.62,mix('#aec0b2','#7b8ca4'));sky.addColorStop(1,mix('#d3ccb0','#b4b8b0'));c.fillStyle=sky;c.fillRect(0,0,W,H);
  if(n>.15)stars(c,cam,s.playSeconds,(n-.15)/.85);
  if(warm>.02){const glow=c.createLinearGradient(0,0,0,400);glow.addColorStop(0,'rgba(120,96,140,0)');glow.addColorStop(.55,`rgba(214,140,120,${warm*.4})`);glow.addColorStop(1,`rgba(236,170,106,${warm*.62})`);c.fillStyle=glow;c.fillRect(0,0,W,400);}
  // Broad distant landforms give the lake a horizon and the forest openings depth.
  for(let layer=0;layer<2;layer++){const points=[[0,H]];for(let x=-8;x<=W+8;x+=8){const wx=x+cam*(.055+layer*.04);points.push([x,265+layer*48+Math.sin(wx*.004+layer)*24+Math.sin(wx*.011+.9)*10]);}points.push([W+8,H]);poly(c,points,layer?mix('#829d8c','#6a7c8c'):mix('#9cb3a5','#8090a2'));}
  // Large cloud banks; finite authored route, not mirrored photographs.
  for(const [x,y,w]of [[220,43,240],[840,80,340],[1440,32,285]]){const xx=x-cam*.08;poly(c,[[xx,y+13],[xx+31,y+3],[xx+83,y+5],[xx+105,y],[xx+171,y+5],[xx+w,y+16],[xx+w-24,y+22],[xx+12,y+23]],mix('#bcc4b6','#727e98'));}
  birds(c,cam,s);
  const base=pond?315:river?365:395;
  depthTrees(r,cam,.20,mix('#91aaa0','#9aacbc',n*.6),base-38,.63,0);
  depthTrees(r,cam,.43,mix('#688778','#6f8796',n*.5),base-13,pond?.95:1.02,135);
  depthTrees(r,cam,.72,'#344f43',base+18,pond?1.16:1.48,220);
  if(river)distantCabin(r,cam);
  const sheet=terrain(r),q=r.artScale||.5;c.drawImage(sheet,Math.round(cam*q),0,W*q,H*q,0,0,W,H);
}
// This landmark used to be baked into the panorama. Keep the existing travel
// target's exact projection; replacing a background must not hide an exit.
function distantCabin(r,cam){
  const [wx,y,w,h]=root.PERegions.trailBox(cam),x=wx-cam,base=y+h,c=r.c;
  if(x+w<-40||x>W+40||(!r.artCabin&&!r.cabinAtlas))return;
  const v=state(r),key='distant-cabin:'+!!r.artCabin;let image=v.sprites.get(key);
  if(!image){image=r.makeCanvas(96,72);const cc=image.getContext('2d');cc.imageSmoothingEnabled=false;
    if(r.artCabin)cc.drawImage(r.artCabin,18,8,220,159,0,0,96,72);
    else cc.drawImage(r.cabinAtlas,920,138,823,613,0,0,96,72);
    // Distance compresses local contrast without a translucent building.
    cc.globalCompositeOperation='source-atop';cc.fillStyle='#607c77';cc.globalAlpha=.38;cc.fillRect(0,0,96,72);v.sprites.set(key,image);}
  // The hillside continues into the opaque ground sheet. A closed oval here
  // looks like a floating platform with background trunks visible underneath.
  const hill=[[x-240,base+143],[x-172,base+103],[x-116,base+64],[x-57,base+28],[x-29,base+8],[x+5,base-1],[x+w-4,base-1],[x+w+39,base+16],[x+w+94,base+55],[x+w+158,base+104],[x+w+232,base+144],[x+w+232,H],[x-240,H]];
  poly(c,hill,'#536a58');c.save();c.clip();
  // Distance compresses both contrast and detail. These long interlocking
  // slopes continue to the play-layer floor, never fading into transparency.
  for(const [dx,dy,ww,hh,f,tone]of [[16,52,83,16,0,'#657359'],[137,76,94,19,2,'#5e7055'],[-66,101,117,22,1,'#4b6251'],[77,129,144,27,0,'#627253'],[176,161,146,23,2,'#4b6251'],[-121,159,130,19,1,'#607052']]){
    poly(c,floorForms[f].map(([u,v])=>[x+dx+u*ww,base+dy+v*hh]),tone);
  }
  c.restore();
  poly(c,[[x-27,base+13],[x+8,base+3],[x+w-6,base+3],[x+w+28,base+18],[x+w+8,base+23],[x+19,base+20]],'#7c8060');
  c.drawImage(image,Math.round(x+13),Math.round(base-78),112,78);
  rect(c,x+13,base,112,3,'#435e50');
  for(const [dx,dy,ww]of [[-21,13,23],[118,16,31],[8,29,22],[87,31,34]])poly(c,[[x+dx,base+dy],[x+dx+4,base+dy-4],[x+dx+ww-5,base+dy-3],[x+dx+ww,base+dy+2]],'#607552');
}
function socket(r,map,x,base,radius,front=false){const c=r.c,g=xx=>P.ground(xx,map),offset=base<g(x)-10?base-g(x):0;const points=[];
  for(let dx=-radius;dx<=radius;dx+=2){const edge=Math.abs(dx)/radius,yy=g(x+dx)+offset;points.push([x+dx,front?Math.max(base-1,yy):Math.min(base-2,yy)*(1-edge)+yy*edge]);}
  for(let dx=radius;dx>=-radius;dx-=2)points.push([x+dx,Math.max(base+4,g(x+dx)+offset+4)]);
  poly(c,points,colors.soil);
  if(front)for(const [u,width]of [[-.68,.27],[.36,.32]]){const xx=x+u*radius,yy=Math.max(base,g(xx)+offset);poly(c,[[xx-width*radius,yy+1],[xx-width*radius*.5,yy-1],[xx+width*radius*.3,yy],[xx+width*radius,yy+2],[xx+width*radius*.25,yy+3]],colors.moss);}
}
function rootProfile(r,type){
  if(!r._treeRoots||r._treeRoots.image!==r.artTrees)r._treeRoots={image:r.artTrees,profiles:[]};
  if(r._treeRoots.profiles[type])return r._treeRoots.profiles[type];
  const a=r.makeCanvas(128,144),c=a.getContext('2d');c.drawImage(r.artTrees,type*128,0,128,144,0,0,128,144);
  const pixels=c.getImageData(0,0,128,144).data,profile=[];
  for(let col=0;col<128;col+=2){let bottom=0;for(let row=126;row<144;row++)for(let dx=0;dx<2;dx++)if(pixels[(row*128+col+dx)*4+3])bottom=row+1;profile.push(bottom);}
  return r._treeRoots.profiles[type]=profile;
}
function rootPlan(r,type,x,y,height){const scale=height/128,profile=rootProfile(r,type),map=state(r).map;
  return profile.map((bottom,i)=>{const col=i*2,dx=(col+1-64)*scale,top=(126-142)*scale;
    return {col,bottom,top,contact:P.ground(x+dx,map)+3-y};});
}
function tree(r,x,y,height,type=0,angle=0,tint=null){const c=r.c;type=((type%3)+3)%3;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);
  const source=tint?silhouette(r,type,tint):r.artTrees;
  if(source){const scale=height/(tint?156:128);if(tint)c.drawImage(source,-64*scale,-156*scale,128*scale,160*scale);else if(angle)c.drawImage(source,type*128,0,128,144,-64*scale,-142*scale,128*scale,144*scale);
    else{c.drawImage(source,type*128,0,128,126,-64*scale,-142*scale,128*scale,126*scale);
      // Deform only the last18 source rows. Each opaque root column meets the
      // shared terrain contour; trunk/crown remain rigid and felling stays unchanged.
      for(const p of rootPlan(r,type,x,y,height))if(p.bottom>126){const bottom=Math.max(p.top+scale,p.contact);
        c.drawImage(source,type*128+p.col,126,2,p.bottom-126,(p.col-64)*scale,p.top,2*scale,bottom-p.top);}
    }}
  c.restore();
}
// The lake's side cut reads as a bank, not a ruled curve: a wet band follows
// the bed, stones sit in it, strata and reeds break up the flat earth.
function shoreBank(r,s){const c=r.c,pond=root.PERegions.pond,shore=pond.shore,surface=pond.surface;if(shore<s.camera-200||shore-260>s.camera+W)return;
  const at=y=>shore+65*Math.log(1-Math.min(.995,(y-surface)/170)),pts=[];for(let y=surface;y<=H;y+=2)pts.push([at(y),y]);
  const band=(o1,o2,color)=>poly(c,[...pts.map(([x,y])=>[x+o1,y]),...pts.slice().reverse().map(([x,y])=>[x+o2,y])],color);
  // Damp earth darkens toward the water in a few hard pixel steps.
  band(-2,46,'rgba(58,46,34,.18)');band(-2,26,'rgba(52,41,30,.28)');band(-2,12,'rgba(44,36,27,.45)');band(-2,2,'#2c261e');
  // Mottled soil: irregular stepped clods, two tones, sparse.
  for(let i=0;i<70;i++){const y=surface+8+P.random(i*3.3)*(H-surface-8),x0=at(y)+8+P.random(i*7.9)*170,w=6+P.random(i*1.1)*24,h=2+Math.round(P.random(i*2.2)*3),dark=P.random(i*.7)>.45;
    poly(c,[[x0,y+h],[x0+2,y+1],[x0+w*.3,y],[x0+w*.7,y],[x0+w-1,y+1],[x0+w,y+h]],dark?'rgba(70,56,40,.55)':'rgba(140,118,84,.35)');}
  for(let i=0;i<7;i++){const y=surface+20+P.random(i*9.1)*(H-surface-30),x0=Math.round(at(y)+14+P.random(i*4.4)*140),w=8+Math.round(P.random(i*5.5)*9),h=4+Math.round(P.random(i*6.6)*4);
    poly(c,[[x0,y+h],[x0+1,y+1],[x0+3,y],[x0+w-3,y],[x0+w-1,y+1],[x0+w,y+h]],'#6c685d');rect(c,x0+3,y+1,w-6,1,'#99957f');rect(c,x0,y+h,w,1,'#3c372e');}
  // Stones gather in a few clusters at the water line.
  for(let i=0;i<pts.length;i++){const [x,y]=pts[i],k=P.random(y*1.7+3);if(k<.86)continue;const n=2+Math.floor(P.random(y*.4)*3);
    for(let j=0;j<n;j++){const w=4+Math.round(P.random(y+j*7)*7),h=3+Math.round(P.random(y*2+j)*3),xx=Math.round(x+1+j*(w-1)+P.random(y*3+j)*3),yy=Math.round(y-h+2+j%2);
      rect(c,xx,yy,w,h,'#6f6b61');rect(c,xx+1,yy,w-2,1,'#9b9787');rect(c,xx,yy+h-1,w,1,'#3a362f');}}
  // Roots hang from the lip of the bank.
  for(const [dx,len]of [[8,22],[19,34],[31,15]]){let x=shore+dx,y=surface+2;for(let i=0;i<len;i++){rect(c,Math.round(x),Math.round(y),1,1,'#3b2f22');y+=1;x+=Math.sin(i*.45+dx)*.6-.15;}}
  // Grass overhangs the lip; a reed bed stands at the shoreline.
  for(let i=0;i<14;i++){const x=shore-3+i*3+Math.round(P.random(i*5.3)*2),h=3+Math.round(P.random(i*1.9)*5),y=surface+1;rect(c,x,y-h,1,h,i%2?'#4d6a3c':'#66854a');if(i<5)rect(c,x-1,y,1,2+i%3,'#4d6a3c');}
  for(let i=0;i<9;i++){const x=shore-38+i*4+Math.round(P.random(i*4.1)*3),h=12+Math.round(P.random(i*2.7)*14),y=surface;rect(c,x,y-h,1,h,i%3?'#55703f':'#6d8a49');if(i%3===0)rect(c,x-1,y-h-4,2,5,'#6b5232');}
}
function mid(r,e){const s=e.state,map=s.currentMap,c=r.c;
  const positions=map==='forest'?[[275,302,0],[1790,290,1],[2460,324,2],[3820,290,0],[4650,334,1],[5650,301,2],[6230,315,0]]:map==='pond'?[[4200,290,0],[6160,315,1]]:[[450,285,0],[1470,292,1],[2170,310,2],[2920,290,0],[4340,315,1],[5830,290,0]];
  sunGround(r,e,positions);
  if(map==='pond')shoreBank(r,s);
  for(const [x,h,type]of positions){if(x<s.camera-150||x>s.camera+W+150)continue;const y=P.ground(x,map)+3;socket(r,map,x,y,28,false);receiver(r,{x,width:56},()=>tree(r,x,y,h,type));socket(r,map,x,y,28,true);}
  for(const x of [805,2030,2750,3590,4530,5850]){if(x<s.camera-80||x>s.camera+W+80||(map==='pond'&&x<3940))continue;groundRock(r,x,P.ground(x,map));}
}
function groundRock(r,x,y){const v=state(r),key='lichen-rock';let a=v.sprites.get(key);
  if(!a){a=r.makeCanvas(56,30);const c=a.getContext('2d');
    poly(c,[[1,28],[3,22],[7,21],[8,15],[13,13],[15,8],[23,5],[29,4],[31,6],[40,8],[43,13],[48,16],[49,21],[53,23],[55,28],[42,29],[28,28],[13,29]],'#36483f');
    poly(c,[[8,20],[9,15],[16,12],[18,8],[29,5],[32,8],[39,9],[41,14],[34,17],[25,16],[21,19],[13,19]],'#7d8972');
    poly(c,[[12,13],[19,8],[27,7],[23,10],[25,12],[33,11],[37,14],[29,15],[25,14],[18,16],[10,17]],'#9a9e82');
    poly(c,[[34,17],[42,13],[47,17],[47,22],[50,24],[43,25],[38,22],[29,23],[27,20]],'#566958');
    poly(c,[[10,19],[19,18],[24,17],[26,22],[35,24],[32,26],[18,24],[13,27],[5,26]],'#52604a');
    poly(c,[[7,24],[12,19],[18,19],[20,16],[25,16],[23,20],[18,21],[18,24],[13,25],[11,28],[4,28]],'#687548');
    for(const [xx,yy,w]of [[12,19,3],[19,17,3],[7,25,4],[37,21,4],[31,10,4],[22,8,3]])rect(c,xx,yy,w,1,'#a1a477');
    for(const [xx,yy,w]of [[24,18,2],[25,20,3],[27,22,4],[43,17,2],[41,19,3],[15,12,3]])rect(c,xx,yy,w,1,'#3b5045');
    v.sprites.set(key,a);
  }
  r.c.drawImage(a,Math.round(x-42),Math.round(y-39),84,45);socket(r,state(r).map,x,y+2,34,true);
}
function ambient(s){return .12+.88*Math.max(0,Math.sin((s.dayTime-.22)*Math.PI*2));}
function sunState(s){const elevation=Math.max(0,Math.sin((s.dayTime-.22)*Math.PI*2));return {strength:P.clamp((elevation-.08)/.55,0,1)*(s.weather==='rain'?.12:1),reach:.3+(1-elevation)*.55,side:Math.cos((s.dayTime-.22)*Math.PI*2)*.8};}
function sunGround(r,e,positions){const s=e.state,c=r.c,map=s.currentMap,sun=sunState(s);if(sun.strength<.01)return;
  c.save();c.beginPath();const left=Math.max(0,s.camera-180),right=Math.min(P.WORLD,s.camera+W+180);
  c.moveTo(left,H);for(let x=left;x<=right;x+=4)c.lineTo(x,root.PETerrainSurface.top(map,x));c.lineTo(right,H);c.closePath();c.clip();
  const trees=[...positions,...e.nodes.filter(n=>n.type==='tree'&&!(s.picked[n.id]>s.playSeconds)).map(n=>{const variant=Math.floor(P.random(n.x+24)*3);return [n.x,[180,193,157][variant]+P.random(n.x)*20,variant];})];
  for(const [x,h,type]of trees){if(x<left||x>right)continue;const y=P.ground(x,map),a=silhouette(r,type,'#172e29');
    c.save();c.translate(x,y+2);c.transform(1,0,-sun.side,-sun.reach*.46,0,0);c.globalAlpha=sun.strength*.22;c.drawImage(a,-h*.25,-h,h*.5,h);c.restore();
  }
  // Low projected building shadows begin at the real foundation, never a
  // generic ellipse below the walking line. The building itself masks the rear.
  const buildings=map==='pond'?[[root.PERegions.cabin.x,P.ground(root.PERegions.cabin.x,map)-root.PERegions.cabin.setback,330*root.PERegions.cabin.scale,239*root.PERegions.cabin.scale]]:e.npc?[[e.npc.x-6,P.ground(e.npc.x,map)+8+(e.npc.depth||0),220,170]]:[];
  c.globalAlpha=sun.strength*.2;
  for(const [x,y,w,h]of buildings){if(x+w/2<left||x-w/2>right)continue;const dx=h*sun.side*.48,dy=h*sun.reach*.22;poly(c,[[x-w*.5,y],[x+w*.5,y],[x+w*.5+dx,y+dy],[x-w*.5+dx,y+dy]],'#182e29');}
  c.restore();
}
const FIRE_RADIUS=200;
function fireStrength(s,fire){return P.clamp(fire.fuel/30,.25,1)*(.93+.025*Math.sin(s.playSeconds*3.1)+.016*Math.sin(s.playSeconds*4.7))*(.35+.65*(1-ambient(s)));}
function lightSurface(r,key){const q=r.artScale||1,a=state(r).pool.get(key,W*q,H*q),c=a.getContext('2d');c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.imageSmoothingEnabled=false;return a;}
function beginReceivers(r,e){const v=state(r),s=e.state;
  v.lightState=s;v.fires=s.structures.filter(f=>f.type==='fire'&&f.lit&&Number.isFinite(f.fuel)&&f.fuel>0&&Math.abs(f.x-s.camera-W/2)<W/2+FIRE_RADIUS);
  // Clear even when the last fire goes out; old illumination must never survive.
  for(const key of ['receiver-mask','receiver-light']){const a=v.pool.surfaces.get(key);if(a)a.getContext('2d').clearRect(0,0,a.width,a.height);}
}
// Paint once, through the real actor/prop renderer. Capture that exact alpha and
// transform, including crouching, tools, facing and delayed-art fallback. No
// duplicate simulation/render callbacks and no rectangular stand-in silhouettes.
function receiver(r,bounds,draw){const v=state(r),main=r.c,s=v.lightState;
  if(!v.fires?.length||!v.fires.some(f=>Math.abs(f.x-bounds.x)<FIRE_RADIUS+bounds.width/2))return draw(main);
  const shape=lightSurface(r,'receiver-shape'),sc=shape.getContext('2d'),transform=main.getTransform();sc.clearRect(0,0,shape.width,shape.height);sc.save();sc.setTransform(transform);r.c=sc;
  try{draw(sc);}finally{r.c=main;sc.restore();}
  main.save();main.setTransform(1,0,0,1,0,0);main.drawImage(shape,0,0);main.restore();
  const mask=lightSurface(r,'receiver-mask'),mc=mask.getContext('2d'),out=lightSurface(r,'receiver-light'),oc=out.getContext('2d');mc.drawImage(shape,0,0);
  // A later object occludes an earlier receiver, rather than adding its light.
  oc.globalCompositeOperation='destination-out';oc.drawImage(shape,0,0);oc.globalCompositeOperation='screen';
  const q=shape.width/W,scratch=lightSurface(r,'received-light'),c=scratch.getContext('2d');
  for(const fire of v.fires){if(Math.abs(fire.x-bounds.x)>=FIRE_RADIUS+bounds.width/2)continue;
    c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';c.clearRect(0,0,scratch.width,scratch.height);c.drawImage(shape,0,0);c.setTransform(q,0,0,q,0,0);
    const x=fire.x-s.camera,y=P.ground(fire.x,s.currentMap)-12,strength=fireStrength(s,fire),g=c.createRadialGradient(x,y,1,x,y,FIRE_RADIUS);
    g.addColorStop(0,`rgba(246,170,88,${strength*.78})`);g.addColorStop(.45,`rgba(224,132,60,${strength*.42})`);g.addColorStop(1,'rgba(197,113,52,0)');
    c.globalCompositeOperation='source-in';c.fillStyle=g;c.fillRect(0,0,W,H);
    const half=Math.max(8,bounds.width/2),center=bounds.x-s.camera,side=P.clamp((fire.x-bounds.x)/half,-1,1),facing=c.createLinearGradient(center-half,0,center+half,0);
    facing.addColorStop(0,`rgba(0,0,0,${.58-side*.37})`);facing.addColorStop(1,`rgba(0,0,0,${.58+side*.37})`);
    c.globalCompositeOperation='destination-in';c.fillStyle=facing;c.fillRect(0,0,W,H);oc.drawImage(scratch,0,0);
  }
  c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';oc.globalCompositeOperation='source-over';
}
function receivedFireLight(r,e,fire,strength){const s=e.state,cam=s.camera,q=r.artScale||.5,x=fire.x-cam,y=P.ground(fire.x,s.currentMap),layer=state(r).pool.get('received-light',W*q,H*q),c=layer.getContext('2d');
  c.setTransform(q,0,0,q,0,0);c.globalCompositeOperation='source-over';c.clearRect(0,0,W,H);const ground=[];
  for(let xx=Math.max(0,x-190);xx<=Math.min(W,x+190);xx+=2)ground.push([xx,root.PETerrainSurface.top(s.currentMap,xx+cam)]);ground.push([Math.min(W,x+190),H],[Math.max(0,x-190),H]);poly(c,ground,'#fff');
  const nearby=e.nodes.filter(n=>n.type==='tree'&&Math.abs(n.x-fire.x)<170&&!(s.picked[n.id]>s.playSeconds));
  // Ground receives light, with a short widening shadow behind nearby trunks.
  c.globalCompositeOperation='destination-out';for(const n of nearby){const nx=n.x-cam,ny=P.ground(n.x,s.currentMap),side=Math.sign(n.x-fire.x)||1;poly(c,[[nx-4,ny],[nx+6,ny],[nx+side*77+12,ny+39],[nx+side*77-15,ny+28]],'#fff');}
  c.globalCompositeOperation='source-over';const main=r.c;
  c.globalCompositeOperation='source-in';const received=c.createRadialGradient(x,y-4,1,x,y-4,185);received.addColorStop(0,`rgba(232,150,70,${strength*.55})`);received.addColorStop(.35,`rgba(210,122,55,${strength*.26})`);received.addColorStop(1,'rgba(197,113,52,0)');c.fillStyle=received;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';
  // Opaque receivers replace the ground lighting below their exact silhouette.
  const mask=state(r).pool.surfaces.get('receiver-mask');if(mask){c.globalCompositeOperation='destination-out';c.drawImage(mask,0,0,W,H);c.globalCompositeOperation='source-over';}
  main.save();main.globalCompositeOperation='screen';main.drawImage(layer,0,0,W,H);main.restore();
}
// Night is a multiply grade, not a flat grey veil: colours keep their
// relationships, ground falls darker than sky, and every light cuts a pool
// of true colour out of the dark (fires, the walker's own small halo).
function darkness(r,e,night){if(night<.02)return;const s=e.state,cam=s.camera,q=r.artScale||.5,v=state(r);
  const a=v.pool.get('darkness',W*q,H*q),d=a.getContext('2d');d.setTransform(q,0,0,q,0,0);d.globalCompositeOperation='source-over';d.clearRect(0,0,W,H);
  const n=P.clamp(night/.88,0,1)*(s.weather==='rain'?1:.97),g=d.createLinearGradient(0,0,0,H);
  g.addColorStop(0,`rgba(62,78,124,${n*.86})`);g.addColorStop(.6,`rgba(52,66,110,${n*.88})`);g.addColorStop(1,`rgba(34,42,76,${n*.92})`);d.fillStyle=g;d.fillRect(0,0,W,H);d.globalCompositeOperation='destination-out';
  // Pools hug the ground: a flattened ellipse, so a fire lights the clearing
  // rather than throwing a spotlight up into the far hills.
  const hole=(x,y,radius,k,color)=>{d.save();d.translate(x,y);d.scale(1,.62);const h=d.createRadialGradient(0,0,1,0,0,radius);h.addColorStop(0,color?color(k):`rgba(0,0,0,${k})`);h.addColorStop(.45,color?color(k*.6):`rgba(0,0,0,${k*.62})`);h.addColorStop(1,color?color(0):'rgba(0,0,0,0)');d.fillStyle=h;d.fillRect(-radius,-radius,radius*2,radius*2);d.restore();};
  for(const fire of v.fires||[]){const x=fire.x-cam,y=P.ground(fire.x,s.currentMap)-26;hole(x,y,FIRE_RADIUS*1.25,.92*P.clamp(fireStrength(s,fire)/.9,0,1));}
  // Moon and the brightest stars shine through the grade as crisp pixels.
  if(n>.15){const k=(n-.15)/.85,mx=Math.round(W*.7-cam*.004),my=122;d.fillStyle=`rgba(0,0,0,${.8*k})`;d.beginPath();d.arc(mx,my,11,0,Math.PI*2);d.fill();
    for(const [x,y,b]of STARS){if(b<.55)continue;const xx=Math.round(((x-cam*.015)%(W*1.2)+W*1.2)%(W*1.2)),size=b>.93?2:1;d.fillStyle=`rgba(0,0,0,${k*.7*b})`;d.fillRect(xx,Math.round(y),size,size);}}
  const p=s.player;if(p&&!s.cabinHome?.inside){const x=p.x-cam,y=P.ground(p.x,s.currentMap)-30;hole(x,y,95,.32);}
  // Firelight is warm: what the hole reveals is tinted ember, not daylight.
  d.globalCompositeOperation='destination-over';for(const fire of v.fires||[]){const x=fire.x-cam,y=P.ground(fire.x,s.currentMap)-26;hole(x,y,FIRE_RADIUS*1.25,n*.55*P.clamp(fireStrength(s,fire)/.9,0,1),k=>`rgba(255,168,96,${k})`);}
  d.globalCompositeOperation='source-over';const c=r.c;c.save();c.globalCompositeOperation='multiply';c.drawImage(a,0,0,W,H);c.restore();
}
function light(r,e){const c=r.c,s=e.state,night=1-ambient(s),cam=s.camera,t=s.playSeconds;
  const warm=Math.max(Math.exp(-Math.pow((s.dayTime-.29)/.065,2)),Math.exp(-Math.pow((s.dayTime-.73)/.065,2)))*(s.weather==='rain'?.2:1);
  if(warm>.01){c.save();c.globalCompositeOperation='soft-light';rect(c,0,0,W,H,`rgba(225,164,94,${warm*.26})`);c.restore();}
  darkness(r,e,night);
  for(const fire of state(r).fires||[]){const x=fire.x-cam,y=P.ground(fire.x,s.currentMap),strength=fireStrength(s,fire);
    receivedFireLight(r,e,fire,strength);
    c.save();c.globalCompositeOperation='screen';const glow=c.createRadialGradient(x,y-24,2,x,y-24,150);glow.addColorStop(0,`rgba(246,196,120,${strength*.16})`);glow.addColorStop(.3,`rgba(205,110,60,${strength*.06})`);glow.addColorStop(1,'rgba(189,98,62,0)');c.fillStyle=glow;c.fillRect(x-150,y-174,300,300);c.restore();
  }
  const received=state(r).pool.surfaces.get('receiver-light');if(received){c.save();c.globalCompositeOperation='screen';c.drawImage(received,0,0,W,H);c.restore();}
  root.PECabinPixels?.drawWindows(r,s);
  for(const fire of state(r).fires||[]){const y=P.ground(fire.x,s.currentMap);
    // Emissive tongues are drawn after receiver lighting, before reflection sampling.
    c.save();c.translate(-cam,0);root.PEFire?.draw(c,fire.x,y-5,31,37,t,fire.x,P.clamp(fire.fuel/30,.25,1),r.makeCanvas);c.restore();
  }
}
function banks(start,end,surface,y){const d=y-surface,curve=Math.sin(d*.024)*8;return [start+curve-d*.13,end+curve+d*.11];}
function bodyWater(r,e,start,end,surface,bed,stream=false){const s=e.state,c=r.c,q=r.artScale||.5,cam=s.camera,t=s.playSeconds,v=state(r),source=v.pool.get('reflection',W*q,H*q),left=Math.max(cam,start),right=Math.min(cam+W,end);if(right<=left)return;
  c.save();c.translate(-cam,0);c.beginPath();if(stream){for(let y=surface;y<=H;y+=2){const [a]=banks(start,end,surface,y);y===surface?c.moveTo(a,y):c.lineTo(a,y);}for(let y=H;y>=surface;y-=2)c.lineTo(banks(start,end,surface,y)[1],y);}else{c.moveTo(left,surface);c.lineTo(right,surface);for(let x=right;x>=left;x-=4)c.lineTo(x,bed(x));}c.closePath();c.clip();
  const night=1-ambient(s),base=night>.5?'#13212c':'#35535c';
  const depthColor=c.createLinearGradient(0,surface,0,surface+170);depthColor.addColorStop(0,night>.5?'#24323e':'#6d9088');depthColor.addColorStop(.3,base);depthColor.addColorStop(1,night>.5?'#0c161e':'#263f49');c.fillStyle=depthColor;c.fillRect(left,surface,right-left,H-surface);
  if(stream)rect(c,cam,surface,W,H-surface,base);
  for(let yy=surface;yy<H;yy+=2){const depth=yy-surface,sy=surface-depth;if(sy<0)break;const edges=stream?banks(start,end,surface,yy):[left,right],a=Math.max(cam,edges[0]-4),b=Math.min(cam+W,edges[1]+4);
    c.globalAlpha=(stream?.45:.56)*(1-.3*P.clamp(night/.88,0,1))*Math.max(.06,1-depth/(stream?130:155));
    // One strip per depth row, anchored to this water body's fixed world extent.
    // This remains camera-invariant without thousands of small image draws.
    const offset=V.waterOffset((start+end)/2,depth,t,s.weather==='rain'?.8:.1)/q;
    if(b>a)c.drawImage(source,(a-cam)*q,Math.max(0,sy*q),(b-a)*q,2*q,a+offset,yy,b-a,2);}
  c.globalAlpha=1;
  if(!stream){for(const x of [1130,1685,2300,2870,3320,3480,3800,3870,3910]){if(x<left-35||x>right+35)continue;const y=bed(x);c.globalAlpha=Math.max(.12,.65-(y-surface)/250);poly(c,[[x-22,y+4],[x-16,y-7],[x+3,y-12],[x+19,y-6],[x+24,y+6]],night>.5?'#2c4547':'#586b58');for(let i=0;i<3;i++){const sway=Math.sin(t*.8+x*.02+i)*2;poly(c,[[x+i*6,y],[x+i*6-2+sway,y-26-i*5],[x+i*6+3+sway,y-13],[x+i*6+2,y]],night>.5?'#304f48':'#596e4f');}}}
  c.restore();c.save();c.translate(-cam,0);for(let x=start+Math.ceil((left-start)/83)*83;x<right;x+=83){const shift=V.waterOffset(x,0,t)*2,phase=Math.floor((x-start)/83);c.globalAlpha=.3+.2*Math.sin(t*.45+x);rect(c,x+shift,surface+(phase%3)*2,phase%2?23:9,1,night>.5?'#607087':'#a0b1b0');}c.restore();
}
function pier(r,s,underwater){const c=r.c,p=root.PERegions.pond,y=P.ground(p.chair,'pond');
  const posts=[p.pierEnd+24,p.pierEnd+112,p.shore-18];
  if(underwater){c.save();for(const x of posts){const bottom=Math.min(H,p.surface+170*(1-Math.exp(-Math.max(0,p.shore-x)/65)));
    // Depth removes both contrast and edge strength. Keep a readable waterline
    // while the submerged end recedes, instead of looking like a cutaway ruler.
    for(let y=p.surface;y<bottom;y+=3){const depth=y-p.surface,alpha=.72*Math.exp(-depth/53),height=Math.min(3,bottom-y);c.globalAlpha=alpha;rect(c,x-4,y,8,height,'#304a4b');rect(c,x-3,y,2,height,'#6a7e71');rect(c,x+2,y,1,height,'#243c41');}
    c.globalAlpha=.75;rect(c,x-5,p.surface+3,9,3,'#344e45');}c.restore();return;}
  // Deck plane and front beam have thickness, without moving the walking/seat anchors.
  rect(c,p.pierEnd,y+1,p.shore-p.pierEnd+14,7,'#4d3c31');rect(c,p.pierEnd,y+6,p.shore-p.pierEnd+14,2,'#282d2b');
  for(const x of posts){rect(c,x-5,y+7,9,Math.max(1,p.surface-y-7),'#554b37');rect(c,x-4,y+7,2,Math.max(1,p.surface-y-7),'#817552');rect(c,x-7,y+5,13,4,'#36352c');}
  let i=0;for(let x=p.pierEnd;x<p.shore+14;x+=17,i++){rect(c,x,y-3,16,5,i%3?'#826d4d':'#91734e');rect(c,x,y-3,15,1,i%4?'#bca373':'#cfb687');rect(c,x+2,y-1,8+i%5,1,'#66523b');rect(c,x+4,y+3,7+i%3,1,'#796044');rect(c,x+2,y,1,1,'#383b32');rect(c,x+12,y,1,1,'#383b32');}
  const x=p.chair;rect(c,x-18,y,36,2,'#222d2b88');
  poly(c,[[x-12,y],[x-9,y-23],[x-5,y-23],[x-9,y]],'#594832');poly(c,[[x+9,y],[x+7,y-23],[x+11,y-24],[x+14,y]],'#473f32');rect(c,x-10,y-12,21,2,'#67543b');rect(c,x-9,y-22,2,17,'#a3875c');rect(c,x+11,y-21,2,19,'#806d4b');
  rect(c,x-15,y-25,30,4,'#aa895b');rect(c,x-15,y-25,30,1,'#d1b687');rect(c,x-13,y-21,27,3,'#554832');rect(c,x-7,y-24,13,1,'#8b704a');rect(c,x+10,y-49,4,27,'#594b37');rect(c,x+10,y-49,1,22,'#aa8d61');for(let j=0;j<4;j++){rect(c,x+8,y-48+j*6,7,4,j%2?'#826d4d':'#a88b60');rect(c,x+8,y-48+j*6,7,1,'#c1a777');}
}
function streamEdges(r,s,start,end,surface){const c=r.c;let i=0;for(let y=surface;y<H;y+=[17,23,15,21][i++%4]){const edges=banks(start,end,surface,y);for(let side=0;side<2;side++){const x=edges[side],w=[5,11,7,9][(i+side)%4],yy=y+(side?7:0);poly(c,[[x-w,yy+3],[x-w*.7,yy-4],[x+1,yy-7],[x+w,yy],[x+w*.6,yy+5]],i%3?'#3a5140':'#53675b');poly(c,[[x-w*.7,yy-4],[x+1,yy-7],[x+w*.6,yy-1],[x,yy]],i%3?'#7b8255':'#9ba68a');}}
  for(let x=start+12;x<end-7;x+=25){const y=P.ground(x,s.currentMap);poly(c,[[x-10,y+3],[x-8,y-3],[x+1,y-5],[x+10,y-1],[x+8,y+4]],'#53675b');poly(c,[[x-8,y-3],[x+1,y-5],[x+8,y-1],[x,y]],'#9ba68a');}
}
function water(r,e){const s=e.state,map=s.currentMap,v=state(r),q=r.artScale||.5,copy=v.pool.get('reflection',W*q,H*q),cc=copy.getContext('2d');cc.setTransform(1,0,0,1,0,0);cc.clearRect(0,0,copy.width,copy.height);cc.drawImage(r.c.canvas,0,0,copy.width,copy.height);
  if(map==='pond')bodyWater(r,e,780,3940,root.PERegions.pond.surface,pondBed);
  if(map==='river')for(const [a,b]of [[3540,3770],[5080,5320]])bodyWater(r,e,a,b,P.ground((a+b)/2,map)-5,()=>H,true);
  if(map==='forest')for(const w of e.water)if(!w.wide&&!w.drinkOnly)bodyWater(r,e,w.x-23,w.x+23,P.ground(w.x,map)-4,()=>H,true);
  const front=v.pool.get('water-front',W*q,H*q),fc=front.getContext('2d'),main=r.c;fc.setTransform(q,0,0,q,0,0);fc.imageSmoothingEnabled=false;fc.clearRect(0,0,W,H);fc.save();fc.translate(-s.camera,0);r.c=fc;
  try{if(map==='pond'){pier(r,s,true);root.PEFishingArt?.world(r,e);}else if(map==='river'){for(const [a,b]of [[3540,3770],[5080,5320]])streamEdges(r,s,a,b,P.ground((a+b)/2,map)-5);}else for(const w of e.water)if(!w.wide&&!w.drinkOnly)streamEdges(r,s,w.x-23,w.x+23,P.ground(w.x,map)-4);}finally{r.c=main;fc.restore();}
  fc.globalCompositeOperation='source-atop';rect(fc,0,0,W,H,`rgba(16,22,34,${(1-ambient(s))*.71})`);fc.globalCompositeOperation='source-over';main.drawImage(front,0,0,W,H);
}
function foreground(r,e){const s=e.state,c=r.c;if(s.currentMap==='pond'&&s.player.x<4150)return;
  for(const world of [130,1850,3530,4780,6310]){const x=world-s.camera*1.05;if(x<-160||x>W+160)continue;poly(c,[[x-130,H],[x-100,H-24],[x-56,H-31],[x-37,H-20],[x+12,H-43],[x+56,H-48],[x+75,H-27],[x+150,H]],'#1c2b30');poly(c,[[x-40,H],[x-20,H-18],[x+22,H-33],[x+55,H-37],[x+37,H-21],[x+9,H-10]],'#2d3c39');}
}
// Ambient life: pure functions of time and camera, never simulation state.
// Smoke and leaves sit under the night grade; fireflies glow through it.
function smoke(r,e){const s=e.state,c=r.c,cam=s.camera,t=s.playSeconds,day=ambient(s),tone=[day>.5?'#8f8a7f':'#c9c4b6',day>.5?'#7d796f':'#b7b2a4'];
  for(const fire of state(r).fires||[]){const x0=fire.x-cam,y0=P.ground(fire.x,s.currentMap)-34,power=P.clamp(fire.fuel/30,.25,1);
    for(let i=0;i<7;i++){const age=(t*.22+i/7)%1,size=Math.round(4+age*10),x=Math.round(x0+Math.sin(age*5+i*1.3)*6+age*26),y=Math.round(y0-age*150);
      c.globalAlpha=power*.72*(1-age)*Math.min(1,age*4);c.fillStyle=tone[i%2];c.fillRect(x-size/2,y-size/2,size,size);c.fillRect(x-size/2-1,y-size/2+1,size+2,size-2);}}
  c.globalAlpha=1;}
function leaves(r,e){const s=e.state,c=r.c,cam=s.camera,t=s.playSeconds;if(s.currentMap==='pond'||s.cabinHome?.inside)return;
  for(let i=0;i<10;i++){const period=12+P.random(i*3.3)*8,age=((t+P.random(i*1.9)*period)%period)/period,wx=Math.floor((t+P.random(i*1.9)*period)/period)*97+i*211;
    const x=Math.round(((wx*7.3)%(W+80))-40+Math.sin(age*9+i)*14+age*30),y=Math.round(90+age*(P.ground(x+cam,s.currentMap)-90)),flip=Math.sin(age*14+i)>0;
    c.fillStyle=['#b8823d','#9a6b2e','#c9a24a'][i%3];c.globalAlpha=Math.min(1,(1-age)*5);c.fillRect(x,y,flip?3:2,flip?2:3);}
  c.globalAlpha=1;}
function fireflies(r,e,night){const s=e.state,c=r.c,cam=s.camera,t=s.playSeconds,k=P.clamp((night-.45)/.4,0,1);if(k<=0||s.weather==='rain'||s.cabinHome?.inside)return;
  for(let i=0;i<24;i++){const span=W+200,x=Math.round(((i*263.7-cam*.9)%span+span)%span-100+Math.sin(t*.35+i*2.1)*22),gy=P.ground(x+cam,s.currentMap),y=Math.round(gy-14-P.random(i*5.1)*60+Math.sin(t*.5+i)*9);
    const blink=Math.pow(Math.max(0,Math.sin(t*(.7+P.random(i)*.6)+i*4.7)),3);if(blink<.05)continue;
    c.globalAlpha=k*blink*.35;c.fillStyle='#d8f07a';c.fillRect(x-1,y-1,4,4);c.globalAlpha=k*blink;c.fillStyle='#f4ffc0';c.fillRect(x,y,2,2);}
  c.globalAlpha=1;}
function birds(c,cam,s){if(!s||ambient(s)<.6||s.weather==='rain')return;const t=s.playSeconds,period=48,phase=t%period;if(phase>16)return;
  const flock=Math.floor(t/period),dir=P.random(flock)>.5?1:-1,y0=70+P.random(flock*2.7)*80,x0=dir>0?-40+phase*72:W+40-phase*72;
  c.fillStyle='#3e4b4c';c.globalAlpha=.7;for(let i=0;i<5;i++){const x=Math.round(x0-dir*i*14-dir*(i%2)*6),y=Math.round(y0+i*5-(i%2)*9+Math.sin(t*2+i)*2),up=Math.sin(t*9+i*1.7)>0;
    c.fillRect(x-1,y,3,1);c.fillRect(x-3,up?y-1:y+1,2,1);c.fillRect(x+2,up?y-1:y+1,2,1);}
  c.globalAlpha=1;}
function finish(r,e){state(r).frame=V.snapshot(e.state);smoke(r,e);leaves(r,e);light(r,e);fireflies(r,e,1-ambient(e.state));water(r,e);foreground(r,e);if(e.state.weather==='rain'){const c=r.c,t=e.state.playSeconds;c.save();c.strokeStyle='#a0b1b05c';c.lineWidth=1;for(let i=0;i<50;i++){const x=(i*113+t*37)%W,y=(i*71+t*255)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y+8);c.stroke();}c.restore();}}
const base=root.PEWorldArt;for(const [key,fn]of Object.entries({prepare,drawLandscape:landscape,drawMid:mid,drawForeground:foreground,drawLight:()=>{}})){const previous=base[key];base[key]=function(r,...args){return r.visualV2?fn(r,...args):previous?.(r,...args);};}
const oldSocket=root.PETerrainSurface.socket;root.PETerrainSurface.socket=(r,...args)=>r.visualV2?socket(r,...args):oldSocket(r,...args);
root.PEVisualWorld={prepare,landscape,mid,tree,rootPlan,socket,pier,finish,state,beginReceivers,receiver,sunState};if(typeof module!=='undefined')module.exports=root.PEVisualWorld;
})(typeof window!=='undefined'?window:globalThis);
