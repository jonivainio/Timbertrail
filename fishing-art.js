/* Authored seated poses plus continuously bent rod and physical line endpoints. */
(function(root){'use strict';
const stroke=(c,p,color,width=1)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();p.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();};
function actor(r,e){if(!root.PEFishing.ready(e)||!r.fishingPoses)return false;const c=r.c,p=e.state.player,pose=root.PEFishing.pose(e),i=pose.phase,col=i%4,row=Math.floor(i/4),y=root.PE.ground(p.x,'pond');
 c.save();c.translate(p.x,y);c.scale(-1,1);c.imageSmoothingEnabled=false;
 // Per-frame seating/boot anchors prevent the atlas rows from bouncing.
 const k=pose.scale,a=pose.frame;c.drawImage(r.fishingPoses,col*384,row*512,384,512,-a[0]*k,-a[1]*k,384*k,512*k);c.restore();
 const {grip:g,tip:t,c1,c2}=pose;c.save();c.strokeStyle='#242b26';c.lineWidth=1.65;c.lineCap='round';c.beginPath();c.moveTo(g.x,g.y);c.bezierCurveTo(c1.x,c1.y,c2.x,c2.y,t.x,t.y);c.stroke();c.strokeStyle='#aaad97';c.lineWidth=.55;c.stroke();
 for(let u=.2;u<1;u+=.18){const v=1-u,x=v*v*v*g.x+3*v*v*u*c1.x+3*v*u*u*c2.x+u*u*u*t.x,yy=v*v*v*g.y+3*v*v*u*c1.y+3*v*u*u*c2.y+u*u*u*t.y;c.strokeStyle='#aebfb5';c.lineWidth=.65;c.beginPath();c.arc(x,yy+.75,.8,0,Math.PI);c.stroke();}c.restore();return true;
}
const polygon=(c,points,color)=>{c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();};
// Articulated geometry, not a translated/rotated inventory illustration.
// Every bone is measured back from the mouth: a hooked mouth stays on the line.
function fishShape(a,length){const pike=a.species==='pike',beat=a.beat||0,effort=a.effort||0;
 const heights=pike?[.012,.03,.048,.085,.105,.105,.09,.073,.05,.022,.013]:[.018,.075,.12,.145,.15,.142,.12,.09,.056,.026,.015];
 const at=u=>[-u*length*.88,Math.sin(beat-u*4.8)*length*(.012+effort*.028)*u*u];
 const spine=heights.map((_,i)=>at(i/10)),top=spine.map(([x,y],i)=>[x,y-heights[i]*length]),bottom=spine.map(([x,y],i)=>[x,y+heights[i]*length*.8]);
 const tail=at(1),sweep=Math.sin(beat-5.4)*length*(.012+effort*.025),span=length*(pike?.092:.10);
 return{at,top,bottom,outline:[...top,...bottom.slice().reverse()],tail:[tail,[-length*1.025,tail[1]-span+sweep],[-length*.97,tail[1]+sweep],[-length*1.025,tail[1]+span+sweep]],pike};
}
// Continuous projected yaw, separate from pitch: there is no sign()/mirror jump.
function fishView(a){const yaw=a.yaw??(a.vx<0?Math.PI:0),pitch=a.pitch||0,sx=Math.cos(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch);return{sx,pitch,front:1-Math.abs(sx),profile:Math.min(1,Math.abs(sx)/.18),project:([x,y])=>[a.x+sx*(cp*x-sp*y),a.y+sp*x+cp*y]};}
function fish(r,a,alpha=a.visibility??.42){const c=r.c,length=root.PEFishing.bodyLength(a),g=fishShape(a,length),v=fishView(a),beat=a.beat||0,fin=Math.sin(beat+1)*length*.015;
 c.save();c.globalAlpha=alpha;c.translate(a.x,a.y);
 const finColor=g.pike?'#7b8053':'#728e82',back=g.pike?'#526345':'#536d62',side=g.pike?'#87976b':'#9cac8b';
 // A narrow end-on head/body keeps real volume as the side profile turns away.
 // Without this, scaling through zero would make a fish disappear for a frame.
 if(v.front>0){c.save();c.globalAlpha=alpha*v.front;c.translate(-length*.18*v.sx,-length*.18*Math.sin(v.pitch));
  for(const side of [-1,1])polygon(c,[[side*length*.04,length*.015],[side*length*(.12+Math.sin(beat)*.012),length*.08],[side*length*.055,length*.05]],finColor);
  c.fillStyle=back;c.beginPath();c.ellipse(0,0,length*.07,length*(g.pike?.095:.12),0,0,Math.PI*2);c.fill();c.fillStyle=side;c.beginPath();c.ellipse(0,length*.025,length*.048,length*.055,0,0,Math.PI*2);c.fill();
  c.fillStyle='#d6c88a';for(const side of [-1,1]){c.fillRect(side*length*.049-length*.012,-length*.027,length*.024,length*.021);}stroke(c,[[-length*.025,length*.035],[length*.025,length*.035]],'#304235',.45);c.restore();}
 // Fade the vanishing side profile into its end-on volume before the transform
 // becomes singular, avoiding a one-frame stroke collapse at exactly 90°.
 c.globalAlpha=alpha*v.profile;c.scale(v.sx,1);c.rotate(v.pitch);
 polygon(c,g.tail,finColor);stroke(c,[g.tail[1],g.tail[0],g.tail[3]],'#a9b18a',.5);
 // Pike has a rear dorsal; zander has the characteristic two spiny sails.
 const dorsal=(lo,hi,h,spines)=>{const pts=[g.top[lo]];for(let i=lo;i<=hi;i++){const [x,y]=g.top[i];pts.push([x+length*.018,y-h*(i%2&&spines?.8:1)+fin*.35],[x-length*.025,y-h*.35]);}pts.push(g.top[hi]);polygon(c,pts,finColor);stroke(c,pts,'#a3af87',.45);};
 if(g.pike)dorsal(7,9,length*.075,false);else{dorsal(3,5,length*.12,true);dorsal(6,8,length*.085,true);}
 const pelvic=g.at(.62);polygon(c,[[pelvic[0],pelvic[1]], [pelvic[0]-length*.1,pelvic[1]+length*.17+fin], [pelvic[0]+length*.055,pelvic[1]+length*.08]],finColor);
 polygon(c,g.outline,back);stroke(c,[...g.outline,g.outline[0]],'#283f34',.65);
 polygon(c,[...g.top.map(([x,y],i)=>[x,y+(g.bottom[i][1]-y)*.32]),...g.bottom.slice().reverse()],side);
 polygon(c,[...g.bottom.map(([x,y],i)=>[x,y-(y-g.top[i][1])*.22]),...g.bottom.slice().reverse()],g.pike?'#b8bd8b':'#ccd0ad');
 c.save();c.beginPath();g.outline.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.clip();
 for(let i=2;i<10;i++){const [x,y]=g.at(i/10);if(g.pike){for(let j=-1;j<=1;j++){c.fillStyle=j===0?'#c7c79a':'#aeb885';c.fillRect(x+(i%2)*length*.025,y+j*length*.044,length*.035,length*.018);}}
  else{c.fillStyle='#4d695a';c.fillRect(x,y-length*.12,length*.026,length*.16);c.fillStyle='#d4d3ae';c.fillRect(x+length*.033,y+length*.025,length*.025,length*.018);}}
 c.restore();
 const gill=g.at(g.pike?.27:.2);stroke(c,[[gill[0],gill[1]-length*.065],[gill[0]-length*.018,gill[1]+length*.04]],'#425a44',.7);
 polygon(c,[[gill[0],gill[1]], [gill[0]-length*.12,gill[1]+length*.09+fin], [gill[0]-length*.04,gill[1]+length*.015]],finColor);
 const jaw=(a.jaw||0)*length*.065,hinge=[-length*.19,length*.018];polygon(c,[[0,0],hinge,[-length*.006,jaw]],'#304235');polygon(c,[hinge,[-length*.006,jaw],[-length*.026,jaw+length*.009],[-length*.15,length*.035]],'#bfc399');stroke(c,[[0,0],[-length*.13,length*.013]],'#304235',.6);
 c.fillStyle='#d6c88a';c.fillRect(-length*.14,-length*.037,length*.04,length*.04);c.fillStyle='#182e27';c.fillRect(-length*.13,-length*.027,length*.021,length*.025);
 c.restore();
}
function world(r,e){const f=e.fishing?.kind==='spinning'?e.fishing:null,c=r.c,pond=root.PERegions.pond,water=pond.surface;
 c.save();c.beginPath();c.rect(pond.chair-485,water-110,545,278);c.clip();
 // One stable draw order/clip/opacity path for swimming, hooked, jumping and
 // released fish. No whole-sprite pop when its mouth crosses the water surface.
 for(const a of e.pondFish||[])if(a.mode!=='caught')fish(r,a);
 const banks=[e.pondFish?e.pondWater:null,f].filter(Boolean);
 for(const bank of banks){
  for(const b of bank.bubbles||[]){c.strokeStyle='#cadbd1b0';c.lineWidth=.65;c.beginPath();c.arc(b.x,b.y,b.size,0,Math.PI*2);c.stroke();}
  for(const p of bank.spray||[]){c.save();c.fillStyle='#d1e6d2';c.globalAlpha=Math.min(1,p.life*2);c.fillRect(p.x,p.y,1,1.8);c.restore();}
  for(const v of bank.ripples){c.save();c.globalAlpha=v.life*.6;c.strokeStyle='#daebe1';c.lineWidth=.8;c.beginPath();c.ellipse(v.x,v.y,2+(1-v.life)*19,1+(1-v.life)*5,0,0,Math.PI*2);c.stroke();c.restore();}
 }
 c.restore();if(!f)return;
 if(f.points.length){stroke(c,f.points.map(p=>[p.x,p.y]),f.strain>.35?'#eccba7cc':'#d8ded49a',.7);}
 if(f.lure&&f.stage!=='fight'){const l=f.lure;c.save();c.translate(l.x,l.y);c.rotate(Math.atan2(l.vy,l.vx));stroke(c,[[-3,0],[3,0]],'#d5b575',2);stroke(c,[[-2,1],[-4,2],[-5,0]],'#d6dfd0',.65);c.restore();}
}
const trophy='<svg class="fish-trophy" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M9 3h14v4h6v5c0 5-4 8-9 8v5h6v4H6v-4h6v-5C7 20 3 17 3 12V7h6zm14 7v6c2-1 3-2 3-4v-2zM6 10v2c0 2 1 3 3 4v-6z"/></svg>';
function catchPanel(e){const f=e.lastCatch;if(!f)return '';const T=x=>root.L?.text(x)||x,sp=root.PEFishing.species[f.species];return '<div class="catch-sheet"><p class="eyebrow">'+T(f.trophy?'TROPHY FISH':'A MOMENT TO REMEMBER')+'</p><div class="catch-illustration '+f.species+'" role="img" aria-label="'+T(sp.name)+'"></div><h3>'+T(sp.name)+'</h3><p class="catch-weight">'+f.weight.toFixed(2)+' kg '+(f.trophy?trophy+'<span class="sr-only">'+T('Trophy fish')+'</span>':'')+'</p><p>'+T(f.best?'Your new personal best.':'A fine catch.')+'</p><p>'+T('Raw fillets added to backpack')+': '+f.portions+'</p><button class="primary" data-catch-close="true">'+T('Back to the lake')+'</button></div>';}
root.PEFishingArt={actor,world,fish,fishShape,fishView,catchPanel};if(typeof module!=='undefined')module.exports=root.PEFishingArt;
})(typeof window==='undefined'?globalThis:window);
