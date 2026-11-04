/* Original generated + palette-prepared raster cabin with authored damage.
 * All restoration combinations share silhouette and foundation; render-only.
 */
(function(root){'use strict';
const geometry=Object.freeze({source:[18,8,220,159],destination:[35,1,330,239],eave:130,foundation:[200,240],chimney:[284,15]});
const palette={deep:'#202a28',shade:'#403e32',wood:'#705e43',light:'#917b58',old:'#636b58',moss:'#4e5749',glass:'#395c58'};
function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function damage(c,part){const p=palette;
 if(part==='roof'){
  // Missing shingles on the left roof plane, not a hole pasted onto the gable.
  poly(c,[[69,53],[78,46],[82,47],[96,34],[103,33],[111,39],[100,49],[100,54],[87,65],[81,63],[75,68],[66,62]],p.deep);
  poly(c,[[70,56],[73,54],[88,64],[85,66]],p.wood);
  poly(c,[[86,44],[88,42],[103,50],[101,52]],p.light);
  poly(c,[[72,66],[104,38],[106,40],[74,68]],p.shade);
  for(const [x,y,w]of [[39,79,15],[90,37,10],[193,72,18],[154,39,12]]){rect(c,x,y,w,2,p.moss);rect(c,x+3,y-2,w-6,2,p.moss);}
 }else{
  // Window frames and door surround stay in precisely the restored positions.
  for(const x of [61,171]){
   rect(c,x,100,27,31,p.deep);
   poly(c,[[x,100],[x+9,100],[x+7,107],[x,111]],p.glass);
   poly(c,[[x-2,102],[x+1,100],[x+30,127],[x+27,131]],p.old);
   poly(c,[[x-2,102],[x,102],[x+29,128],[x+27,129]],p.light);
  }
  poly(c,[[113,93],[119,93],[118,106],[120,126],[116,139],[117,155],[112,155]],p.deep);
  for(const [x,y,w]of [[33,149,21],[79,151,14],[149,152,20],[206,144,15]]){rect(c,x,y,w,2,p.moss);rect(c,x+4,y-2,w-7,2,p.moss);}
 }
}
function cache(r){
 // A late asset load invalidates an earlier transparent placeholder.
 if(r._pixelCabinSource!==r.artCabin){r._pixelCabinSource=r.artCabin;r._pixelCabinLayers=new Map();}
 return r._pixelCabinLayers||(r._pixelCabinLayers=new Map());
}
function layer(r,part,restored){
 const saved=cache(r),key=part+':'+!!restored;if(saved.has(key))return saved.get(key);
 const image=r.makeCanvas(400,280),c=image.getContext('2d');c.imageSmoothingEnabled=false;
 if(r.artCabin){
  const native=r.makeCanvas(256,192),nc=native.getContext('2d');nc.imageSmoothingEnabled=false;nc.drawImage(r.artCabin,0,0);
  if(!restored){damage(nc,part);const pixels=nc.getImageData(0,0,256,192),d=pixels.data;for(let i=3;i<d.length;i+=4)d[i]=d[i]<128?0:255;nc.putImageData(pixels,0,0);}
  c.save();c.beginPath();c.rect(0,part==='roof'?0:geometry.eave,400,part==='roof'?geometry.eave:280-geometry.eave);c.clip();
  c.drawImage(native,...geometry.source,...geometry.destination);c.restore();
 }
 saved.set(key,image);return image;
}
function complete(r){const saved=cache(r);if(!saved.has('complete')){const image=r.makeCanvas(400,280),c=image.getContext('2d');c.drawImage(layer(r,'facade',true),0,0);c.drawImage(layer(r,'roof',true),0,0);saved.set('complete',image);}return saved.get('complete');}
function windows(r){const saved=cache(r);if(saved.has('windows'))return saved.get('windows');
 const image=r.makeCanvas(400,280),c=image.getContext('2d');c.imageSmoothingEnabled=false;
 if(r.artCabin){const native=r.makeCanvas(256,192),nc=native.getContext('2d');nc.drawImage(r.artCabin,0,0);const pixels=nc.getImageData(0,0,256,192),d=pixels.data;
  // Authored pane interiors: retain every mullion, frame and chipped edge.
  // Read once when the source changes, never read pixels in the frame loop.
  for(let y=0;y<192;y++)for(let x=0;x<256;x++){const i=(y*256+x)*4,u=x>=171?x-110:x,pane=((y>=100&&y<112)||(y>=116&&y<129))&&((u>=62&&u<72)||(u>=75&&u<86)),frame=d[i]===32&&d[i+1]===42&&d[i+2]===40;
   const shade=y<112?.78:1,curtain=u<65||u>82?.68:1;
   d[i+3]=pane&&!frame&&d[i+3]===255?255:0;d[i]=Math.round(242*shade*curtain);d[i+1]=Math.round(175*shade*curtain);d[i+2]=Math.round(89*shade*curtain);
  }
  nc.putImageData(pixels,0,0);c.drawImage(native,...geometry.source,...geometry.destination);
 }
 saved.set('windows',image);return image;
}
function windowSpill(r){const saved=cache(r);if(saved.has('window-spill'))return saved.get('window-spill');const a=r.makeCanvas(400,280),c=a.getContext('2d');c.imageSmoothingEnabled=false;
 if(r.artCabin){const native=r.makeCanvas(256,192),n=native.getContext('2d');n.drawImage(r.artCabin,0,0);n.globalCompositeOperation='destination-in';n.fillStyle='#fff';n.beginPath();for(const x of [57,167])n.rect(x,94,36,51);n.fill();n.globalCompositeOperation='source-in';
  const g=n.createLinearGradient(0,94,0,145);g.addColorStop(0,'#d59b5033');g.addColorStop(.6,'#e3ae6580');g.addColorStop(1,'#bb7d2f00');n.fillStyle=g;n.fillRect(0,0,256,192);c.drawImage(native,...geometry.source,...geometry.destination);
 }saved.set('window-spill',a);return a;}
function windowStrength(s){const h=s.cabinHome,f=h?.fire,repairs=s.cabinRepairs;if(s.currentMap!=='pond'||!h||!repairs?.facade||!repairs.roof||!repairs.yard)return 0;
 const burning=f?.lit&&Number.isFinite(f.fuel)&&f.fuel>0,night=1-Math.max(0,Math.sin((s.dayTime-.22)*Math.PI*2));
 const flame=burning?Math.min(1,f.fuel/30)*(.54+.014*Math.sin(s.playSeconds*3.1)+.01*Math.sin(s.playSeconds*4.7)):0;
 return Math.min(.68,(flame+(h.lantern?.18:0))*(.2+.8*night)*(h.shutters?1:.24));
}
function drawWindows(r,s){const strength=windowStrength(s);if(!strength||!r.artCabin)return;const cfg=root.PERegions.cabin,c=r.c;
 c.save();c.globalCompositeOperation='screen';c.globalAlpha=strength;c.translate(cfg.x-Math.round(s.camera),root.PE.ground(cfg.x,'pond')-cfg.setback);c.scale(cfg.scale,cfg.scale);c.drawImage(windowSpill(r),-200,-240);c.drawImage(windows(r),-200,-240);c.restore();
}
function trader(r,x,y,height,angle=0,opacity=1){if(!r.artCabin)return false;const c=r.c,w=height*602/534,h=w*239/330;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.globalAlpha=opacity;c.drawImage(complete(r),35,1,330,239,-w/2,-h,w,h);c.restore();return true;}
const api={layer,complete,trader,windows,windowStrength,drawWindows,palette,geometry,metadata:{source:'assets/art-v2/cabin.json',license:'original-generated + project-original damage overlays',logicalSize:[400,280],foundation:[200,240],door:[200,186],eave:[200,130],chimney:geometry.chimney,parts:['facade','roof'],states:['ruined','restored'],status:'calibration'}};
root.PECabinPixels=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
