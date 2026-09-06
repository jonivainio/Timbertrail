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
function fish(r,which,x,y,width,facing=1,alpha=1,hooked=false){const c=r.c,im=r[which+'Image'];if(!im)return;c.save();c.globalAlpha=alpha;c.translate(x-(hooked?facing*width*.42:0),y);c.scale(facing,1);c.rotate(which==='pike'?.6:.42);const b=root.PEIcons.bounds[which],h=width*b[3]/b[2];c.drawImage(im,...b,-width/2,-h/2,width,h);c.restore();}
function world(r,e){const f=e.fishing?.kind==='spinning'?e.fishing:null,c=r.c,pond=root.PERegions.pond,water=pond.surface;
 c.save();c.beginPath();c.rect(pond.chair-430,water+2,414,154);c.clip();
 for(const a of e.pondFish||[]){if(a.mode==='caught')continue;fish(r,a.species,a.x,a.y,18+Math.sqrt(a.weight)*8,a.vx<0?-1:1,a===f?.fish ? .8 : .28,a===f?.fish);}
 for(const b of f?.bubbles||[]){c.strokeStyle='#cadbd1b0';c.lineWidth=.65;c.beginPath();c.arc(b.x,b.y,b.size,0,Math.PI*2);c.stroke();}c.restore();if(!f)return;
 if(f.points.length){stroke(c,f.points.map(p=>[p.x,p.y]),f.strain>.35?'#eccba7cc':'#d8ded49a',.7);}
 for(const v of f.ripples){c.save();c.globalAlpha=v.life*.6;c.strokeStyle='#daebe1';c.lineWidth=.8;c.beginPath();c.ellipse(v.x,v.y,2+(1-v.life)*19,1+(1-v.life)*5,0,0,Math.PI*2);c.stroke();c.restore();}
 if(f.lure&&f.stage!=='fight'){const l=f.lure;c.save();c.translate(l.x,l.y);c.rotate(Math.atan2(l.vy,l.vx));stroke(c,[[-3,0],[3,0]],'#d5b575',2);stroke(c,[[-2,1],[-4,2],[-5,0]],'#d6dfd0',.65);c.restore();}
}
const trophy='<svg class="fish-trophy" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M9 3h14v4h6v5c0 5-4 8-9 8v5h6v4H6v-4h6v-5C7 20 3 17 3 12V7h6zm14 7v6c2-1 3-2 3-4v-2zM6 10v2c0 2 1 3 3 4v-6z"/></svg>';
function catchPanel(e){const f=e.lastCatch;if(!f)return '';const T=x=>root.L?.text(x)||x,sp=root.PEFishing.species[f.species];return '<div class="catch-sheet"><p class="eyebrow">'+T(f.trophy?'TROPHY FISH':'A MOMENT TO REMEMBER')+'</p><div class="catch-illustration '+f.species+'" role="img" aria-label="'+T(sp.name)+'"></div><h3>'+T(sp.name)+'</h3><p class="catch-weight">'+f.weight.toFixed(2)+' kg '+(f.trophy?trophy+'<span class="sr-only">'+T('Trophy fish')+'</span>':'')+'</p><p>'+T(f.best?'Your new personal best.':'A fine catch.')+'</p><p>'+T('Raw fillets added to backpack')+': '+f.portions+'</p><button class="primary" data-catch-close="true">'+T('Back to the lake')+'</button></div>';}
root.PEFishingArt={actor,world,fish,catchPanel};if(typeof module!=='undefined')module.exports=root.PEFishingArt;
})(typeof window==='undefined'?globalThis:window);
