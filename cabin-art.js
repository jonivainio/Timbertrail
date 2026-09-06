/* Close-up room camera, no player avatar. Art, Kajo and fixtures share one projection. */
(function(root){'use strict';
function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,2,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#edac6000');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
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
function drawDog(r,t){const c=r.c,index=dogPose(t),b=dogBoxes[index],k=.155;
 if(!r.kajoCabin){r.sprite(7,570,402,-1,.21);return;}
 const breathing=1+Math.sin(t*(index>=5?1.8:3.2))*(index>=5?.013:.007),w=b[2]*k,h=b[3]*k*breathing;
 c.save();c.drawImage(r.kajoCabin,...b,570-w/2,402-h,w,h);c.restore();
}
function draw(r,e){const c=r.c,s=e.state,h=root.PECabin.home(e),t=s.playSeconds;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;const v=root.PECabin.view(e);c.save();c.setTransform(v.zoom,0,0,v.zoom,-v.left*v.zoom,-v.top*v.zoom);if(r.cabinInterior)c.drawImage(r.cabinInterior,0,0,960,540);else{c.fillStyle='#362a21';c.fillRect(0,0,960,540);}
 const daylight=Math.max(0,Math.sin((s.dayTime-.22)*Math.PI*2));
 if(!h.shutters){c.fillStyle='#34271d';c.fillRect(692,144,80,99);for(let i=0;i<8;i++){c.fillStyle=i%2?'#5a422c':'#664d32';c.fillRect(693+i*10,145,9,96);c.fillStyle='#98754d';c.fillRect(694+i*10,146,1,93);}c.fillStyle='#31271d';c.fillRect(692,177,80,4);c.fillRect(692,220,80,4);}
 else if(daylight<.5){c.fillStyle=`rgba(18,34,48,${(.5-daylight)*1.55})`;c.fillRect(692,144,80,99);}
 c.fillStyle=`rgba(13,19,28,${.06+(1-daylight)*.27})`;c.fillRect(0,0,960,540);
 if(h.lantern){c.save();c.globalCompositeOperation='screen';glow(c,625,130,175,'#edb65c29');c.restore();c.fillStyle='#ffe3a3';c.fillRect(623,121,4,8);}
 if(h.fire.lit&&h.fire.fuel>0){c.save();c.globalCompositeOperation='screen';glow(c,466,330,265,`rgba(245,135,54,${.14+Math.sin(t*5)*.008+Math.sin(t*3.17)*.006})`);c.restore();c.save();c.beginPath();c.rect(430,279,79,70);c.clip();root.PEFire?.draw(c,468,345,69,61,t,917,Math.min(1,Math.max(.25,h.fire.fuel/30)),r.makeCanvas);c.restore();}
 // The water canister is painted into the original room artwork.
 
 // Kajo relaxes in his own woven basket, not in the player's walking lane.
 drawDog(r,t);
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
function smoke(r,s){const f=s.cabinHome?.fire;if(s.currentMap!=='pond'||!f?.lit||f.fuel<=0)return;const cfg=root.PERegions.cabin,x=cfg.x+87*cfg.scale,y=root.PE.ground(cfg.x,'pond')-cfg.setback-193*cfg.scale,c=r.c,t=s.playSeconds;c.save();for(let i=0;i<9;i++){const u=(t*.12+i/9)%1;c.globalAlpha=Math.sin(u*Math.PI)*.12;c.fillStyle='#c4c4b2';c.beginPath();c.ellipse(x+u*23+Math.sin(t*.5+i)*u*7,y-u*81,3+u*14,5+u*10,0,0,Math.PI*2);c.fill();}c.restore();}
root.PECabinArt={draw,smoke,dogPose,drawDog};if(typeof module!=='undefined')module.exports=root.PECabinArt;
})(typeof window==='undefined'?globalThis:window);
