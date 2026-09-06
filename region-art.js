/* Regional scene layers, water and independently composited cabin restoration. */
(function(root){'use strict';
const {random,clamp,WIDTH:W,HEIGHT:H,WORLD}=root.PE;let currentMap='forest';const ground=x=>root.PE.ground(x,currentMap);
const px=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(Math.round(x),Math.round(y),Math.ceil(w),Math.ceil(h));};
function line(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
function poly(c,points,color){c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=color;c.fill();}
function moss(c,x,y,w,seed,amount=40){for(let i=0;i<amount;i++){const xx=x+random(seed+i)*w,yy=y+random(seed+i+140)*6;px(c,xx,yy,1+random(i)*4,1+random(i+82)*3,['#63703c','#849051','#344b2e','#a2a061'][i%4]);}}
function cabinLayer(r,part,restored){
 r._cabinLayers||=new Map();const key=part+':'+restored;if(r._cabinLayers.has(key))return r._cabinLayers.get(key);
 const layer=r.makeCanvas(400,280),c=layer.getContext('2d');c.translate(200,240);c.imageSmoothingEnabled=false;
 if(r.cabinAtlas&&part!=='yard'){
  // Normalize the two paintings to identical eaves and foundation coordinates.
  // The entire facade is one painting: doors, frames and log courses stay aligned.
  const image=r.cabinAtlas,sx=restored?920:20,sw=restored?823:835;
  const door=[-35,-108,69,104],windows=[[-122,-107,62,66],[61,-107,62,66]];
  if(part==='roof')c.drawImage(image,sx,restored?138:129,sw,473-(restored?138:129),-165,-230,330,115);
  else{
   c.save();c.beginPath();
   if(part==='facade'){c.rect(-165,-115,330,123);c.clip();}
   else{for(const b of part==='door'?[door]:windows)c.rect(...b);c.clip();}
   c.drawImage(image,sx,473,sw,278,-165,-115,330,123);c.restore();
  }
  r._cabinLayers.set(key,layer);return layer;
 }
 if(part==='facade'){
  poly(c,[[-143,-118],[143,-118],[143,-12],[-143,-12]],'#241f18');
  for(let row=0;row<12;row++){const y=-116+row*8.5,left=-143-random(row)*3,right=144+random(row+10)*3;
   px(c,left,y,right-left,7,restored?['#68503a','#73593c','#816243'][row%3]:['#484a38','#55513c','#5d5940'][row%3]);
   line(c,[[left+3,y+1],[right-3,y+1]],restored?'#b38a57':'#8a8060',1);line(c,[[left,y+7],[right,y+7]],'#25271c',1);
   for(let i=0;i<18;i++){const x=left+random(row*31+i)*280;px(c,x,y+2+random(i)*4,3+random(i+row)*13,1,restored?'#382e2255':'#1e251d80');}
   for(const x of [-138,134]){px(c,x,y-1,9,9,restored?'#9a774c':'#777158');px(c,x+2,y+1,4,4,'#4b4030');}
  }
  for(let i=0;i<17;i++){const x=-128+random(i+19)*250,y=-112+random(i+22)*89;c.strokeStyle='#302a22';c.beginPath();c.ellipse(x,y,3,1.4,.1,0,Math.PI*2);c.stroke();}
  if(!restored){for(const [x,y,w]of [[-110,-30,46],[35,-46,62],[-45,-106,30]]){px(c,x,y,w,5,'#1b241e');line(c,[[x,y],[x+14,y-3],[x+20,y+2]],'#8b7750',2);}for(let i=0;i<10;i++)moss(c,-137+i*27,-23-random(i)*9,30,i+22);}
 }
 if(part==='roof'){
  const outline=[[-162,-118],[0,-228],[163,-118]];poly(c,outline,'#38352b');c.save();c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
  for(let row=0;row<14;row++)for(let col=0;col<25;col++){const x=-170+col*15+(row%2)*7,y=-226+row*8;
   const palette=restored?['#564333','#65503b','#735a3d','#816448']:['#383e32','#4c503b','#5b5b40','#676447'];px(c,x,y,14,8,palette[Math.floor(random(row*73+col)*4)]);px(c,x+1,y+1,12,1,restored?'#a08356':'#817954');px(c,x+13,y+2,1,6,'#262b23');
  }c.restore();line(c,[[-164,-118],[0,-230],[165,-118]],restored?'#b08e5b':'#7e7550',4);line(c,[[-165,-116],[165,-116]],'#342b20',5);line(c,[[-163,-119],[163,-119]],restored?'#b29261':'#7a7652',2);
  if(!restored){poly(c,[[-38,-196],[25,-183],[58,-161],[44,-125],[-42,-128],[-70,-145]],'#18251e');for(const [x,y]of [[-60,-144],[-24,-179],[19,-177],[48,-153]])line(c,[[x,y],[x+12,-119]],'#7e6542',3);line(c,[[-61,-145],[25,-162],[51,-133]],'#a18b5b',2);moss(c,-135,-128,270,9,160);moss(c,-36,-198,63,82,50);}
  // Chimney belongs to roof only, so roof repair never changes the walls.
  px(c,73,-191,24,47,restored?'#777365':'#666b54');for(let i=0;i<8;i++){px(c,74,-190+i*6,21,1,'#333b32');px(c,75+(i%2)*9,-189+i*6,1,5,'#9d9880');}px(c,70,-196,30,6,restored?'#a49c82':'#7c8064');
 }
 if(part==='door'){
  px(c,-29,-102,50,90,'#1b221c');const tilt=restored?0:.10;c.save();c.translate(-27,-100);c.rotate(tilt);
  for(let i=0;i<6;i++){px(c,i*7,0,6,83,restored?['#8c6842','#9a764b'][i%2]:['#5f5a40','#686049'][i%2]);line(c,[[i*7+1,3],[i*7+1,80]],restored?'#c19a62':'#94805a');}
  for(const y of [13,67])px(c,1,y,13,3,'#3f4640');px(c,34,40,3,6,restored?'#c1ac72':'#625f43');if(!restored){line(c,[[6,20],[32,64]],'#ae9571',5);px(c,16,60,7,23,'#20271c');}c.restore();
  for(const x of [-32,21])px(c,x,-104,5,92,restored?'#ae8e60':'#777053');px(c,-32,-105,58,5,restored?'#c2a06c':'#8f8361');
 }
 if(part==='windows')for(const x of [-115,72]){
  px(c,x-3,-98,48,49,restored?'#b3a383':'#77775a');px(c,x,-95,42,43,'#1b2926');
  if(restored){const g=c.createLinearGradient(x,-95,x+42,-52);g.addColorStop(0,'#7f9f9a');g.addColorStop(.5,'#3d625e');g.addColorStop(1,'#273f36');c.fillStyle=g;c.fillRect(x+2,-93,38,39);line(c,[[x+4,-91],[x+18,-75]],'#bbc5ac88',2);line(c,[[x+19,-95],[x+19,-52]],'#baa982',3);line(c,[[x,-74],[x+42,-74]],'#baa982',3);}
  else{poly(c,[[x+1,-93],[x+19,-92],[x+13,-80],[x+5,-77]],'#6e8d80');line(c,[[x-2,-87],[x+43,-60]],'#8c7751',7);line(c,[[x-2,-87],[x+43,-60]],'#b09668',1);moss(c,x-2,-56,44,x,25);}px(c,x-5,-49,51,4,restored?'#b1a07d':'#686c50');
 }
 if(part==='yard'){
  for(let i=0;i<50;i++){const x=-171+random(i+53)*338,y=-3+random(i+11)*32;px(c,x,y,3+random(i)*6,2,restored?['#7b8064','#9b9880','#5e6e55'][i%3]:['#3c4d2a','#626638','#8c8651'][i%3]);}
  if(!restored){for(let i=0;i<19;i++){const x=-167+random(i+24)*321,y=4+random(i+99)*21;line(c,[[x,y],[x+19+random(i)*21,y-3+random(i+1)*8]],i%2?'#746448':'#9a8056',3);}for(let i=0;i<12;i++)moss(c,-170+i*29,12,27,i+88,25);}
  else{for(let i=0;i<7;i++)px(c,-30+i*9,1+random(i)*4,8,6,i%2?'#98987c':'#777e67');line(c,[[-156,20],[-156,5],[-80,5],[-80,18]],'#988057',3);for(let i=0;i<7;i++)line(c,[[-154+i*12,7],[-154+i*12,19]],'#b09a6c',2);}
 }
 if(part==='facade'&&!r.cabinAtlas){c.drawImage(cabinLayer(r,'door',restored),-200,-240);c.drawImage(cabinLayer(r,'windows',restored),-200,-240);}
 r._cabinLayers.set(key,layer);return layer;
}
// Clamp masks separately: two negative distances must never multiply into opacity.
const clearingOpacity=(edge,front,back)=>clamp(edge,0,1)*clamp(front,0,1)*clamp(back,0,1);
// Opaque soil/needle clusters, never a translucent double image of the terrain.
const yardPixelAlpha=(coverage,x,y)=>coverage>=1?255:coverage<=0?0:random(Math.floor(x/2)*197+Math.floor(y/2)*7919+417)<coverage?255:0;
function cabinYard(r,s){
 // The continuous ground sheet is rendered before all props by PETerrainSurface.
 // Restoration changes loose debris only; it never swaps or stretches the soil.
 const cfg=root.PERegions.cabin,x=cfg.x,base=ground(x)-cfg.setback,c=r.c;
 if(!s.cabinRepairs.yard)for(let i=0;i<32;i++){const u=random(i+213),xx=x+(random(i+734)-.5)*450,yy=base+20+u*80;
  if(i%3===0){line(c,[[xx,yy],[xx+12+random(i)*12,yy+2]],'#433b29',3);line(c,[[xx+1,yy-1],[xx+11+random(i)*12,yy+1]],'#95825b',1);}
  else moss(c,xx,yy,8+random(i)*12,i+391,6);
 }
}
function drawCabin(r,s){const c=r.c,x=root.PERegions.cabin.x,y=ground(x),yard=root.PERegions.cabin.clearing;if(x+yard.right<s.camera||x-yard.left>s.camera+W)return;
 const config=root.PERegions.cabin;cabinYard(r,s);root.PETerrainSurface?.socket(r,currentMap,x,y-config.setback+6,config.scale*155,false);
 c.save();c.translate(x,y-config.setback);c.scale(config.scale,config.scale);c.translate(-x,-y);
 c.fillStyle='#121e1655';c.beginPath();c.ellipse(x,y+8,160,4,0,0,Math.PI*2);c.fill();
 for(const part of ['facade','roof'])c.drawImage(cabinLayer(r,part,!!s.cabinRepairs[part]),x-200,y-240);
 // Ground contact is at the shifted foundation, never stretched from the walking line.
 c.fillStyle='#1c281aa0';c.fillRect(x-154,y+5,308,3);for(let i=0;i<90;i++){const xx=x-158+random(i+413)*316;px(c,xx,y+7+random(i)*4,2+random(i+6)*3,1,['#6f7451','#8b8862','#3f502f'][i%3]);}
 c.restore();
}
function water(r,s,start,end,pond){
 const c=r.c,cam=s.camera,t=s.playSeconds,left=Math.max(start,cam-10),right=Math.min(end,cam+W+10);if(right<=left)return;
 const wind=.18+.65*Math.sin((t%73)/73*Math.PI)**2+(s.weather==='rain'?.5:0),surface=pond?root.PERegions.pond.surface:353,bed=x=>pond?pondBed(x):ground(x)+30;
 if(pond&&r._backdrop){
  // Continue the photographed reflection plane toward the cutaway, not a second lake.
  const source=r._backdrop,bx=clamp(cam/(WORLD-W),0,1)*(source.width-W);
  c.save();c.beginPath();c.moveTo(left,surface);for(let x=left;x<=right;x+=3)c.lineTo(x,surface-86*clamp((end-x)/180,0,1));c.lineTo(right,surface);c.closePath();c.clip();
  for(let yy=surface-86;yy<surface;yy+=2){const f=(yy-surface+86)/86,shift=Math.sin(t*.8+yy*.2)*wind*.7;c.globalAlpha=Math.min(1,f*4);c.drawImage(source,bx+left-cam,root.PERegions.pond.surface-22+f*62,right-left,2,left+shift,yy,right-left+2,2);}
  c.restore();
 }
 c.save();c.beginPath();c.moveTo(left,surface);c.lineTo(right,surface);for(let x=right;x>=left;x-=4)c.lineTo(x,bed(x));c.closePath();c.clip();
 const g=c.createLinearGradient(0,surface,0,pond?H+12:460);g.addColorStop(0,'#436d60');g.addColorStop(.38,'#305b50');g.addColorStop(1,'#193d37');c.fillStyle=g;c.fillRect(left,surface,right-left,180);
 if(pond)for(let x=left;x<=right;x+=3){px(c,x,bed(x)-5,3,7,'#7e8160');px(c,x,bed(x)-3,3,1,'#b0a47c');}
 if(pond){
  const image=r.regionImages?.pond;if(image){c.save();c.globalAlpha=.14;c.drawImage(image,image.width*.08,image.height*.52,image.width*.49,image.height*.22,left,surface,right-left,140);c.restore();}
  for(let i=Math.floor(left/4);i<right/4;i++){const x=i*4+random(i)*4,y=bed(x)-9+random(i+15)*9;px(c,x,y,1+random(i+6)*4,1,['#d2c19666','#829f7255','#254e4166'][i%3]);}
  for(let i=Math.floor(left/78);i<right/78;i++){const x=i*78+random(i)*32,y=bed(x)-7,w=5+random(i+9)*11;poly(c,[[x-w,y+3],[x-w*.8,y-3],[x,y-6],[x+w,y-2],[x+w*.8,y+3]],'#607d69');line(c,[[x-w*.7,y-3],[x,y-6],[x+w*.7,y-2]],'#bdbaa07a',1);}
  for(let i=Math.floor(left/170);i<right/170;i++){const x=i*170+Math.sin(t*.15+i)*12;c.save();c.globalCompositeOperation='screen';poly(c,[[x,surface],[x+7,surface],[x+48,H],[x+15,H]],'#d3d69a08');c.restore();}
 }
 // Visible bed: stones and anchored pondweed below a translucent surface.
 for(let i=Math.floor(left/12);i<=right/12;i++){const x=i*12,y=bed(x)-7+random(i+83)*5;px(c,x,y,3+random(i)*9,2+random(i+4)*4,['#637d67','#b1a17b','#3c6357','#8c9874'][i%4]);}
 for(let i=Math.floor(left/29);i<right/29;i++){if(random(i+208)<.32)continue;const x=i*29+random(i+72)*16,y=bed(x)-3;for(let j=0;j<2+Math.floor(random(i+89)*3);j++){const sway=Math.sin(t*.8+i+j)*wind*2.5;line(c,[[x+j*3,y],[x+j*3+sway,y-10],[x+j*3+sway*1.5,y-23-random(i)*20]],j%2?'#648750':'#93a168',1);for(let k=1;k<5;k++)line(c,[[x+j*3-4,y-k*6-3],[x+j*3+sway,y-k*6],[x+j*3+4,y-k*6-4]],'#648351',1);}}
 c.fillStyle='#448c811c';c.fillRect(left,surface,right-left,180);
 // Striped, broken reflections and caustics stay subtle; ripples share the wind driver.
 for(let i=0;i<130;i++){const x=start+random(i+44)*(end-start),y=surface+random(i+5)*65;if(x<left-20||x>right+20)continue;const dx=Math.sin(t*(.5+wind)+i)*3*wind;px(c,x+dx,y,3+random(i+9)*22,1,i%3?'#c8d6ad38':'#163e3944');}
 for(let y=surface+1;y<430;y+=9){const offset=Math.sin(t*(.7+wind)+y)*wind*5;for(let x=Math.floor(left/80)*80;x<right;x+=80)line(c,[[x+offset,y],[x+15+offset,y-1],[x+32+offset,y]],'#c4ded327',1);}
 c.restore();
 if(pond){
  if(r._backdrop){const source=r._backdrop,bx=clamp(cam/(WORLD-W),0,1)*(source.width-W);c.save();for(let yy=0;yy<36;yy+=2){c.globalAlpha=(1-yy/36)*.45;c.drawImage(source,bx+left-cam,root.PERegions.pond.surface+40-yy*.28,right-left,2,left+Math.sin(t*.8+yy*.2)*wind,surface+yy,right-left,2);}c.restore();}
  for(let x=left;x<right;x+=5){if(random(Math.floor(x/23))<.55)continue;const yy=surface+Math.sin(x*.03+t*.8)*wind*.7;px(c,x,yy,4,1,'#abc8ad45');}return;
 }
 // The walkable bank/jetty stays in front of the water, never requires swimming.
 for(let x=left;x<right;x+=3){const y=ground(x);px(c,x,y-1,3,5,'#82816a');px(c,x,y+5,3,2,'#344935');}
}
function ford(r,s,start,end){const c=r.c,t=s.playSeconds,cam=s.camera;if(end<cam-60||start>cam+W+60)return;const center=(start+end)/2,y0=ground(center)-5;
 c.save();c.beginPath();for(let y=y0;y<=H+4;y+=4){const x=start+Math.sin(y*.045)*8-(y-y0)*.16;y===y0?c.moveTo(x,y):c.lineTo(x,y);}for(let y=H+4;y>=y0;y-=4)c.lineTo(end+Math.sin(y*.055)*7+(y-y0)*.13,y);c.closePath();c.clip();
 const g=c.createLinearGradient(0,y0,0,H);g.addColorStop(0,'#779085');g.addColorStop(1,'#345e55');c.fillStyle=g;c.fillRect(start-45,y0,end-start+90,H-y0+5);
 const image=r.regionImages?.river;if(image){c.globalAlpha=.28;c.drawImage(image,image.width*.56,image.height*.58,image.width*.3,image.height*.18,start-45,y0,end-start+90,H-y0);c.globalAlpha=1;}
 for(let i=0;i<350;i++){const x=start-30+random(i+28)*(end-start+60),y=y0+random(i+62)*(H-y0);px(c,x,y,2+random(i+10)*6,1+random(i+52)*3,['#a0aa8190','#496f5980','#c3bea360','#284f4670'][i%4]);}
 for(let i=0;i<70;i++){const x=start+random(i+96)*(end-start),y=y0+((random(i+11)*150+t*7)%150);line(c,[[x,y],[x+5+random(i)*11,y+1]],'#d3ded23d',1);}c.restore();
 for(const side of [start,end])for(let i=0;i<28;i++){const y=y0+i*4,x=side+Math.sin(y*(side===start?.045:.055))*8+(side===start?-1:1)*(y-y0)*.15;poly(c,[[x-6,y],[x-3,y-3],[x+4,y-2],[x+7,y+2],[x,y+4]],i%2?'#64735c':'#869078');moss(c,x-4,y-3,8,i,4);}
 for(let x=start+16;x<end-10;x+=27){const y=ground(x),w=10+random(x)*4;poly(c,[[x-w,y+3],[x-w+2,y-3],[x+2,y-5],[x+w,y-1],[x+w-2,y+4]],'#6f7c68');line(c,[[x-w+3,y-3],[x+2,y-5],[x+w-2,y-1]],'#b4b59a',1);line(c,[[x-w-5+Math.sin(t*2+x)*2,y+6],[x+w+7,y+6]],'#d3ded299',1);}
}
function pondBed(x){return root.PERegions.pond.surface+170*(1-Math.exp(-Math.max(0,root.PERegions.pond.shore-x)/65))+Math.sin(x*.027)*2;}
function jetty(r,s){const c=r.c,p=root.PERegions.pond,y=ground(p.chair),left=p.pierEnd,right=p.shore+14;
 c.save();c.beginPath();c.moveTo(left-5,y-9);c.lineTo(right+4,y-9);c.lineTo(right+4,y+8);for(let x=p.shore;x>=left-5;x-=3)c.lineTo(x,pondBed(x));c.closePath();c.clip();
 if(r.pierImage){c.save();c.globalAlpha=.64;c.drawImage(r.pierImage,60,328,1695,280,left,y-5,right-left,174);c.restore();c.save();c.beginPath();c.rect(left-2,y-7,right-left+4,12);c.clip();c.drawImage(r.pierImage,60,328,1695,280,left,y-5,right-left,174);c.restore();}
 else for(let x=left;x<right;x+=17){px(c,x,y-1,16,6,'#897a56');px(c,x,y,14,1,'#c0aa7e');}
 c.restore();
 const x=p.chair;line(c,[[x-12,y],[x-8,y-23],[x+8,y-23],[x+13,y]],'#4e402e',4);line(c,[[x-11,y],[x-7,y-23]],'#b09a73',1);px(c,x-15,y-24,29,4,'#8c7650');px(c,x-15,y-25,29,1,'#cfb88d');line(c,[[x+10,y-23],[x+12,y-48]],'#695539',4);for(let i=0;i<4;i++){px(c,x+9,y-47+i*5,6,4,i%2?'#9b865e':'#b09b71');px(c,x+10,y-46+i*5,2,1,'#d0bb8c');}line(c,[[x-9,y-8],[x+11,y-8]],'#75603e',2);
}
function cabinSpring(r,s){
 const c=r.c,x=root.PERegions.pond.spring,y=ground(x)-18,t=s.playSeconds;if(x<s.camera-110||x>s.camera+W+110||!r.springImage)return;
 // Real alpha cutout: the surrounding ground remains the current area's soil.
 const width=154,height=width*r.springImage.height/r.springImage.width;
 root.PETerrainSurface?.socket(r,currentMap,x,ground(x),66,false);
 c.drawImage(r.springImage,x-width/2,y-height*.64,width,height);
 root.PETerrainSurface?.socket(r,currentMap,x,ground(x),66,true);
 c.save();c.beginPath();c.ellipse(x,y-height*.05,47,9,0,0,Math.PI*2);c.clip();
 for(let i=0;i<4;i++){const u=(t*.3+i*.25)%1;c.globalAlpha=(1-u)*.2;c.strokeStyle='#d3dfcd';c.beginPath();c.ellipse(x-15,y-height*.16,2+u*35,1+u*7,0,0,Math.PI*2);c.stroke();}
 c.restore();
}
// A simple sign marks the junction; no projecting path or bridge geometry.
function draw(r,e){const s=e.state,c=r.c,cam=s.camera;currentMap=s.currentMap;if(s.currentMap==='forest')return;
 if(s.currentMap==='river'){
  // The river panorama supplies distant water; only crossings occupy the walking plane.
  ford(r,s,3540,3770);ford(r,s,5080,5320);
  const trail=root.PERegions.trail,x=trail.x,y=ground(x);
  // Trail ground is already present under the sign and all nearby trees.
  const signX=x+53;line(c,[[signX,y+3],[signX+1,y-43]],'#483c2a',5);line(c,[[signX-1,y],[signX,y-42]],'#a3895b',1);poly(c,[[signX-24,y-47],[signX+21,y-47],[signX+30,y-40],[signX+21,y-33],[signX-24,y-33]],'#725c3c');line(c,[[signX-22,y-46],[signX+20,y-46]],'#b29a6b');c.fillStyle='#e2d4a4';c.font='7px Georgia';c.textAlign='center';c.fillText('SIENILAMPI',signX,y-37);
 }else{water(r,s,780,3940,true);drawCabin(r,s);root.PECabinArt?.smoke(r,s);jetty(r,s);cabinSpring(r,s);}
}
function hover(r,e){const o=r.hover;if(!o?.box||!e.hotspotActive(o))return;const c=r.c,[dx,dy,w,h]=o.type==='exit'?root.PERegions.trailBox(e.state.camera):o.box,x=o.type==='exit'?dx:o.x+dx,y=o.type==='exit'?dy:ground(o.x)+dy;c.save();c.strokeStyle='#eee4c49c';c.fillStyle='#eee4c407';c.lineWidth=1;c.setLineDash([7,4,1,4]);c.lineDashOffset=-e.state.playSeconds*2;c.beginPath();c.roundRect(x,y,w,h,7);c.fill();c.stroke();c.restore();}
root.PERegionArt={draw,hover,cabinLayer,clearingOpacity,yardPixelAlpha};if(typeof module!=='undefined')module.exports=root.PERegionArt;
})(typeof window==='undefined'?globalThis:window);
