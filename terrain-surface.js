/* Visible ground has depth; the simulation's walking curve remains unchanged. */
(function(root){'use strict';
const PE=root.PE||(typeof require==='function'?require('./engine.js'):null),R=root.PERegions||(typeof require==='function'?require('./regions.js'):null);
const smooth=v=>{v=PE.clamp(v,0,1);return v*v*(3-2*v);};
function areas(map){
 if(map==='pond')return [{id:'cabin-yard',x:R.cabin.x,left:R.cabin.clearing.left,right:R.cabin.clearing.right,depth:R.cabin.setback+22,plateau:.26,path:54}, {id:'spring-bank',x:R.pond.spring,left:103,right:103,depth:26,plateau:.35,path:0}];
 if(map==='river')return []; // The branch is a ground-level sign; the distant cabin is the travel target.
 return [{id:'aarni-yard',x:R.aarni.x,left:300,right:350,depth:73,plateau:.36,path:35}];
}
function influence(area,x){const u=Math.abs(x-area.x)/(x<area.x?area.left:area.right);return 1-smooth((u-area.plateau)/(1-area.plateau));}
function top(map,x){let y=PE.ground(x,map)-1;for(const a of areas(map)){const f=influence(a,x);if(f>0)y=Math.min(y,PE.ground(x,map)-a.depth*f);}return y;}
const coverage=(map,x,y)=>PE.clamp((y-top(map,x))/3,0,1);
// Coverage is resolved into opaque 2px material clusters, never ghosted scenery.
const alpha=(amount,x,y)=>amount>=1?255:amount<=0?0:PE.random(Math.floor(x/2)*197+Math.floor(y/2)*7919+417)<amount?255:0;
function extend(r,map,terrain,source){
 const c=terrain.getContext('2d');
 if(!r.groundMaterial||!areas(map).length)return;
 const material=r.makeCanvas(768,512),mc=material.getContext('2d');mc.imageSmoothingEnabled=false;mc.drawImage(r.groundMaterial,0,0,768,512);
 const sw=material.width,sh=material.height,src=mc.getImageData(0,0,sw,sh).data;
 const zones=areas(map),left=Math.max(0,Math.floor(Math.min(...zones.map(a=>a.x-a.left)))),right=Math.min(PE.WORLD,Math.ceil(Math.max(...zones.map(a=>a.x+a.right))));
 const minY=Math.max(0,Math.floor(Math.min(...zones.map(a=>PE.ground(a.x,map)-a.depth))-35)),height=PE.HEIGHT-minY;
 const data=c.getImageData(left,minY,right-left,height),d=data.data;
 // Repeat only a clean authored material, never scenery silhouettes. Near
 // and distant soil share world UVs; no camera-dependent stretching or mirroring.
 const sy0=0,tileH=sh;
 for(let x=left;x<right;x++){
  const active=zones.filter(a=>influence(a,x)>0);if(!active.length)continue;
  const g=PE.ground(x,map),start=Math.max(minY,Math.floor(top(map,x))),edge=Math.max(...active.map(a=>influence(a,x)));
  for(let y=start;y<PE.HEIGHT;y++){
   const join=1-smooth((y-g-18)/32),weight=PE.clamp(edge*20,0,1)*join;if(weight<=0)continue;
   // Blend material colours only where solid terrain already exists. Alpha stays
   // opaque; the narrow silhouette fringe above the walking line is binary.
   if(!alpha(coverage(map,x,y),x,y))continue;
   const sx=Math.floor((x*.71+sw*20)%sw);
   const v=((y+127)*1.7)%tileH,sy=sy0+Math.floor(v),q=(sy*sw+sx)*4,idx=((y-minY)*(right-left)+x-left)*4;
   const mix=d[idx+3]===255?weight:1;
   let wear=0;for(const a of active){if(!a.path)continue;const depth=PE.clamp((g-y)/a.depth,0,1),centre=a.x-(a.id==='sienilampi-trail'?17*(1-depth):16*(1-depth)),half=a.path*(1-depth*.7);wear=Math.max(wear,(1-smooth(Math.abs(x-centre)/half))*.14);}
   for(let k=0;k<3;k++){const moss=.5+.5*Math.sin(x*.024+Math.sin(y*.048)*1.6)*Math.cos(y*.067+x*.004),shade=.88+.12*Math.sin(x*.015+y*.03);
     const value=src[q+k]*[.94,1.04,.79][k]*shade,newColor=value*(1-moss*.2-wear)+[82,92,41][k]*moss*.2+[137,122,83][k]*wear;d[idx+k]=d[idx+k]*(1-mix)+newColor*mix;}d[idx+3]=255;
  }
 }
 c.putImageData(data,left,minY);
 // Broken moss/needle edge ties the ground sheet to the distant forest floor.
 for(let x=left;x<right;x+=3){if(top(map,x)>=PE.ground(x,map)-5)continue;const y=top(map,x),seed=Math.floor(x/3);for(let j=0;j<3;j++){c.fillStyle=['#465331','#697344','#8a8851'][j];c.fillRect(x+PE.random(seed+j)*4,y-1+PE.random(seed+j+4)*6,2+PE.random(seed+j+8)*4,1);}}

}
// Local soil socket: keep the rigid object upright, bridge its footprint to the
// hill, then put a very thin lip of that SAME terrain in front of the lowest roots.
function socket(r,map,x,base,radius,front=false){
 const c=r.c,tex=r._terrain;if(!tex)return;const left=Math.floor(x-radius),width=Math.ceil(radius*2),offset=base<PE.ground(x,map)-10?base-PE.ground(x,map):0,g=xx=>PE.ground(xx,map)+offset;
 c.save();c.beginPath();
 for(let dx=-radius;dx<=radius;dx+=2){const xx=x+dx,f=1-smooth(Math.abs(dx)/radius),yy=front?g(xx)+1:Math.min(g(xx),base-1)*f+g(xx)*(1-f);dx===-radius?c.moveTo(xx,yy):c.lineTo(xx,yy);}
 for(let dx=radius;dx>=-radius;dx-=2){const xx=x+dx;c.lineTo(xx,front?Math.max(g(xx)+5,base+3):Math.max(g(xx)+5,base+5));}c.closePath();c.clip();
 const min=Math.floor(Math.min(base,g(left),g(x+radius))-3),height=Math.ceil(Math.max(base,g(left),g(x+radius))-min+10);
 c.drawImage(tex,Math.max(0,left),Math.min(PE.HEIGHT-18,g(x)+8),width,16,left,min,width,height);c.restore();
 if(!front){c.save();c.strokeStyle='#18201670';c.lineWidth=2;c.beginPath();c.moveTo(x-radius*.7,base);c.quadraticCurveTo(x,base+3,x+radius*.7,base);c.stroke();c.restore();}
}
root.PETerrainSurface={areas,influence,top,coverage,alpha,extend,socket};if(typeof module!=='undefined')module.exports=root.PETerrainSurface;
})(typeof window==='undefined'?globalThis:window);
