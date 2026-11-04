/* Close-up room camera, no player avatar. Art, Kajo and fixtures share one projection. */
(function(root){'use strict';
// Long rests, short pose changes. Simulation time pauses naturally in menus.
function dogPose(t){const u=((t%58)+58)%58;
 if(u<5)return 0;
 if(u<11)return Math.floor((u-5)*3)%2;
 if(u<14)return 2;
 if(u<17)return 0;
 if(u<17.65)return 3;
 if(u<19)return 4;
 if(u<48)return Math.floor((u-19)/1.8)%2?6:5;
 if(u<51)return 7;
 if(u<53)return 4;
 if(u<53.65)return 3;
 return 0;
}
const dogBoxes=[[55,93,334,368],[445,92,285,368],[845,91,267,369],[1158,188,375,276],[12,641,414,265],[464,681,293,234],[813,679,316,242],[1194,667,320,243]];
// Authored small breathing/blink changes; no whole-body squash in the new art.
function nativeDogPose(t){const u=(((Number.isFinite(t)?t:0)%58)+58)%58;
 if(u<5)return 0;
 if(u<11)return Math.floor((u-5)*3)%2;
 if(u<11.2)return 2;
 if(u<14)return 3;
 if(u<17)return 0;
 if(u<17.65)return 4;
 if(u<18.3)return 5;
 if(u<19)return 6;
 if(u<19.7)return 7;
 if(u<47)return (u-20+58)%7<.16?10:Math.floor((u-19.7)/1.9)%2?9:8;
 if(u<48)return 10;
 if(u<49)return 11;
 if(u<50)return 12;
 if(u<50.8)return 13;
 if(u<51.6)return 14;
 if(u<53)return 15;
 return 0;
}
function drawDog(r,t){const c=r.c,index=dogPose(t),b=dogBoxes[index],k=.155;
 if(r.visualV2&&r.artKajoCabin){const i=nativeDogPose(t);c.save();c.imageSmoothingEnabled=false;c.drawImage(r.artKajoCabin,i%4*80,Math.floor(i/4)*80,80,80,530,330,80,80);c.restore();return;}
 if(!r.kajoCabin){r.sprite(7,570,402,-1,.21);return;}
 const breathing=1+Math.sin(t*(index>=5?1.8:3.2))*(index>=5?.013:.007),w=b[2]*k,h=b[3]*k*breathing;
 c.save();c.drawImage(r.kajoCabin,...b,570-w/2,402-h,w,h);c.restore();
}
function curtains(c,open,t){
 // Two opaque woven linen panels. Tiny irregular folds, no wooden slats.
 c.save();c.strokeStyle='#493522';c.lineWidth=2;c.beginPath();c.moveTo(680,138);c.lineTo(784,138);c.stroke();
 for(const side of [-1,1]){const left=side<0?684:(open?761:732),width=open?19:48,top=142,bottom=245,sway=open?Math.sin(t*.65+side)*.7:0;
  c.save();c.beginPath();c.moveTo(left,top);c.lineTo(left+width,top);c.bezierCurveTo(left+width-2,177,left+width+(open?-5:1)+sway,213,left+width+sway,bottom-1);
  for(let j=5;j>=0;j--)c.lineTo(left+width*j/5+sway,bottom+Math.sin(j*2+side)*1.3);
  c.bezierCurveTo(left+(open?4:0),213,left+1,177,left,top);c.closePath();c.clip();
  const g=c.createLinearGradient(left,0,left+width,0);for(let i=0;i<=12;i++)g.addColorStop(i/12,i%3===0?'#857f65':i%3===1?'#c2b798':'#a3997b');c.fillStyle=g;c.fillRect(left-2,top,width+5,108);
  for(let y=146;y<247;y+=2){c.fillStyle=y%6?'#eadfc016':'#544f391b';c.fillRect(left,y,width+2,.5);}
  c.fillStyle='#726e51';c.fillRect(left,238,width+3,2);c.fillStyle='#d2c5a0';c.fillRect(left,241,width+3,1);c.restore();
  for(let i=0;i<5;i++){c.strokeStyle='#a38c62';c.lineWidth=.7;c.beginPath();c.ellipse(left+2+i*(width-4)/4,140,1.2,2.4,0,0,Math.PI*2);c.stroke();}
  if(open){c.strokeStyle='#76613e';c.lineWidth=1.3;c.beginPath();c.moveTo(left+2,205);c.quadraticCurveTo(left+width*.5,209,left+width-1,205);c.stroke();}
 }c.restore();
}
// Room-space receivers, not a fog/glow disc across the whole finished picture.
// Cached geometry follows the unchanged furniture coordinates at every pan.
const roomReceivers={
 hearth:{source:[468,337,248],color:[240,151,69],shapes:[[[401,267],[534,267],[547,379],[393,379]],[[441,368],[503,368],[704,481],[234,481]],[[528,269],[607,269],[607,364],[537,382]]],cuts:[[[430,279],[509,279],[509,347],[430,347]],[[691,365],[811,365],[811,416],[691,416]],[[818,358],[959,358],[959,483],[818,483]]]},
 window:{source:[736,210,320],color:[165,197,199],shapes:[[[680,136],[787,136],[787,252],[680,252]],[[702,245],[771,245],[837,454],[477,454]],[[571,256],[712,256],[712,364],[571,364]]],cuts:[[[692,144],[772,144],[772,243],[692,243]],[[691,365],[811,365],[811,416],[691,416]]]},
 lantern:{source:[625,127,214],color:[245,185,97],shapes:[[[542,82],[813,82],[813,275],[542,275]],[[520,270],[668,270],[668,343],[520,343]]],cuts:[[[692,144],[772,144],[772,243],[692,243]]]}
};
function inside(points,x,y){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const a=points[i],b=points[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
function edgeDistance(points,x,y){let d=Infinity;for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],u=Math.max(0,Math.min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy||1)));d=Math.min(d,Math.hypot(x-a[0]-u*dx,y-a[1]-u*dy));}return d;}
function roomLayer(r,key){const cache=r._roomLights||(r._roomLights=new Map());if(cache.has(key))return cache.get(key);
 const a=r.makeCanvas(640,360),c=a.getContext('2d'),m=roomReceivers[key],pixels=c.createImageData(640,360),[sx,sy,radius]=m.source;
 // One-time room-space raster. Feather INWARD on each receiving surface;
 // no blurred light outside furniture, no warm rectangles or floor wedges.
 for(let y=0;y<360;y++)for(let x=0;x<640;x++){const wx=(x+.5)*1.5,wy=(y+.5)*1.5,fall=Math.max(0,1-Math.hypot(wx-sx,wy-sy)/radius);if(!fall||m.cuts.some(p=>inside(p,wx,wy)))continue;
  let edge=0;for(const p of m.shapes)if(inside(p,wx,wy))edge=Math.max(edge,Math.min(1,edgeDistance(p,wx,wy)/22));if(!edge)continue;
  const k=(y*640+x)*4;pixels.data[k]=m.color[0];pixels.data[k+1]=m.color[1];pixels.data[k+2]=m.color[2];pixels.data[k+3]=Math.round(124*fall*fall*edge*edge*(3-2*edge));
 }c.putImageData(pixels,0,0);cache.set(key,a);return a;
}
function roomLight(r,key,strength){if(!(strength>0))return;const c=r.c;c.save();c.globalCompositeOperation='screen';c.globalAlpha=strength;c.drawImage(roomLayer(r,key),0,0,960,540);c.restore();}
function dogLight(r,t,strength){if(!r.artKajoCabin||!(strength>0))return;
 const a=r._roomDogLight||(r._roomDogLight=r.makeCanvas(80,80)),c=a.getContext('2d'),i=nativeDogPose(t);c.clearRect(0,0,80,80);c.globalCompositeOperation='source-over';c.drawImage(r.artKajoCabin,i%4*80,Math.floor(i/4)*80,80,80,0,0,80,80);c.globalCompositeOperation='source-in';const g=c.createLinearGradient(0,0,80,0);g.addColorStop(0,'#eca1544b');g.addColorStop(1,'#dc944202');c.fillStyle=g;c.fillRect(0,0,80,80);c.globalCompositeOperation='source-over';const main=r.c;main.save();main.globalCompositeOperation='screen';main.globalAlpha=strength;main.drawImage(a,530,330);main.restore();
}
function hearthInterior(c){
 c.save();c.beginPath();c.rect(430,279,79,70);c.clip();
 // Quiet soot-stained depth, not a featureless black decal. Native 1.5px grid.
 c.fillStyle='#242c29';c.fillRect(430,279,79,70);c.fillStyle='#2e342e';
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){const x=432+col*21-(row%2)*10.5;c.fillRect(x,282+row*13.5,18,10.5);}
 c.fillStyle='#181f1c';c.fillRect(430,279,7.5,57);c.fillRect(503,279,6,57);
 c.fillStyle='#3d382b';c.fillRect(443.5,331.5,46.5,6);c.fillRect(458.5,337.5,34.5,4.5);
 c.fillStyle='#252a22';c.fillRect(440.5,336,55.5,3);c.fillStyle='#4c4332';c.fillRect(447,331.5,22.5,1.5);c.fillRect(460,337.5,19.5,1.5);
 c.restore();
}
function draw(r,e){const c=r.c,s=e.state,h=root.PECabin.home(e),t=s.playSeconds;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;const v=root.PECabin.view(e);c.save();c.setTransform(v.zoom,0,0,v.zoom,-v.left*v.zoom,-v.top*v.zoom);const art=r.visualV2&&r.artInterior?r.artInterior:r.cabinInterior;if(art)c.drawImage(art,0,0,960,540);else{c.fillStyle='#362a21';c.fillRect(0,0,960,540);}
 if(r.visualV2&&r.artInterior)hearthInterior(c);
 const daylight=Math.max(0,Math.sin((s.dayTime-.22)*Math.PI*2));
 if(h.shutters&&daylight<.5){c.fillStyle=`rgba(18,34,48,${(.5-daylight)*1.55})`;c.fillRect(692,144,80,99);}
 curtains(c,h.shutters,t);
 // A loose page rests on the coffee table; its hit box uses the same room space.
 if(e.cabinReady()&&r.letterImage){c.save();c.transform(1,.04,.42,.48,744,367);c.shadowColor='#160e09aa';c.shadowBlur=2;c.shadowOffsetY=2;c.drawImage(r.letterImage,0,0,27,32);c.shadowColor='transparent';c.strokeStyle='#755432';c.lineWidth=.6;for(let i=0;i<6;i++){c.beginPath();c.moveTo(5,8+i*2.7);c.lineTo(i===5?15:22,8+i*2.7);c.stroke();}c.restore();}
 // Kajo is a room occupant: grade him with the room, then let hearth/lantern
 // light reach his fur. Drawing him after these passes made him glow at night.
 drawDog(r,t);
 c.fillStyle=`rgba(13,23,32,${.06+(1-daylight)*.48})`;c.fillRect(0,0,960,540);
 roomLight(r,'window',h.shutters?daylight*.42:0);
 if(h.lantern){roomLight(r,'lantern',.6-.2*daylight);c.fillStyle='#ffe3a3';c.fillRect(623,121,4,8);}
 if(h.fire.lit&&Number.isFinite(h.fire.fuel)&&h.fire.fuel>0){const power=Math.min(1,h.fire.fuel/30),energy=power*(.93+.025*Math.sin(t*3.1)+.016*Math.sin(t*4.7))*(1-.35*daylight);roomLight(r,'hearth',energy);dogLight(r,t,energy);c.save();c.beginPath();c.rect(430,279,79,70);c.clip();root.PEFire?.draw(c,468,345,69,61,t,917,Math.max(.25,power),r.makeCanvas);c.restore();}
 // The water canister is painted into the original room artwork.
 
 // Kajo remains at his basket anchor; the player avatar is absent.
 // The player is deliberately absent, including when resting in the chair.
 if(e.roomHeart>0){c.save();c.globalAlpha=Math.min(1,e.roomHeart*2);c.fillStyle='#e1a095';c.font='18px Georgia';c.textAlign='center';c.fillText('♥',570,357-(1.2-e.roomHeart)*27);c.restore();}
 if(e.roomSteam>0){c.save();c.strokeStyle='#e7ddc377';c.lineWidth=1;for(let i=0;i<3;i++){const x=716+i*4;c.beginPath();c.moveTo(x,351);c.bezierCurveTo(x-4,343,x+5,340,x+Math.sin(t+i)*3,329);c.stroke();}c.restore();}
 // Small floating motes; frame-rate independent, understated against dark timber.
 for(let i=0;i<12;i++){c.fillStyle='#e4c89335';c.fillRect((i*79+Math.sin(t*.14+i)*18)%960,85+(i*31+t*1.4)%290,1,1);}
 c.restore(); // HUD-scale overlays must not pan or zoom with the room.
 root.PEArt.drawCold(r,s.player.warmth);
 if(e.transition){const tr=e.transition,a=tr.time<.45?tr.time/.45:1-(tr.time-.45)/.55;c.fillStyle=`rgba(0,0,0,${Math.max(0,Math.min(1,a))})`;c.fillRect(0,0,960,540);}
 const out=r.canvas.getContext('2d');out.setTransform(1,0,0,1,0,0);out.imageSmoothingEnabled=false;out.clearRect(0,0,r.canvas.width,r.canvas.height);out.drawImage(r.surface,0,0,r.canvas.width,r.canvas.height);
}
function smoke(r,s){const f=s.cabinHome?.fire;if(s.currentMap!=='pond'||!f?.lit||f.fuel<=0)return;const cfg=root.PERegions.cabin,anchor=r.visualV2&&r.artCabin?root.PECabinPixels?.geometry.chimney:null,x=cfg.x+(anchor?anchor[0]-200:87)*cfg.scale,y=root.PE.ground(cfg.x,'pond')-cfg.setback+(anchor?anchor[1]-240:-193)*cfg.scale,c=r.c,t=s.playSeconds;c.save();for(let i=0;i<9;i++){const u=(t*.12+i/9)%1;c.globalAlpha=Math.sin(u*Math.PI)*.12;c.fillStyle='#c4c4b2';c.beginPath();c.ellipse(x+u*23+Math.sin(t*.5+i)*u*7,y-u*81,3+u*14,5+u*10,0,0,Math.PI*2);c.fill();}c.restore();}
root.PECabinArt={draw,smoke,dogPose,nativeDogPose,drawDog,curtains,roomLayer,roomReceivers};if(typeof module!=='undefined')module.exports=root.PECabinArt;
})(typeof window==='undefined'?globalThis:window);
