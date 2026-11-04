/* Original outdoor Kajo family. Read-only pose sampling; engine owns motion. */
(function(root){'use strict';
 const TAU=Math.PI*2,anchor=Object.freeze([32,44]);
 function frame(d){return d.moving?Math.floor(((Number.isFinite(d.stride)?d.stride:0)%TAU+TAU)%TAU/TAU*6):['sit','wait'].includes(d.mode)?7:6;}
 function available(r){return !!(r.visualV2&&r.artKajo);}
 function placement(d,ground){
  const x=Math.round(d.x),y=Math.round(ground(d.x)),facing=d.facing<0?-1:1;
  // Both ends of the stance follow the same terrain as the actor. Keep the
  // incline modest, avoiding a floating front/rear paw on ordinary slopes.
  const angle=Math.max(-.18,Math.min(.18,Math.atan2(ground(d.x+15)-ground(d.x-15),30)));
  return {x,y,facing,angle};
 }
 function mouth(r,d,ground){
  if(!available(r))return null;
  const p=placement(d,ground),i=frame(d),x=17*p.facing,y=(i===7?18:21)-anchor[1],cs=Math.cos(p.angle),sn=Math.sin(p.angle);
  return {x:p.x+x*cs-y*sn,y:p.y+x*sn+y*cs};
 }
 function draw(r,d,ground){
  if(!available(r))return false;
  const i=frame(d),p=placement(d,ground),c=r.c;
  c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.scale(p.facing,1);c.imageSmoothingEnabled=false;
  c.drawImage(r.artKajo,i%4*64,Math.floor(i/4)*48,64,48,-anchor[0],-anchor[1],64,48);c.restore();return true;
 }
 const api=Object.freeze({frame,placement,mouth,draw});root.PEKajoArt=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
