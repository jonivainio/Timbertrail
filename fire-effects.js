/* Shared, bounded thermal-raster animation. Visual only: never changes fuel or saves. */
(function(root){'use strict';
const W=72,H=88,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const hash=n=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v);};
function noise(x,y){const a=Math.floor(x),b=Math.floor(y);let u=x-a,v=y-b;u=u*u*(3-2*u);v=v*v*(3-2*v);const p=hash(a+b*157),q=hash(a+1+b*157),r=hash(a+(b+1)*157),s=hash(a+1+(b+1)*157);return (p+(q-p)*u)*(1-v)+(r+(s-r)*u)*v;}
const caches=new WeakMap();
function raster(data,t,seed=0,strength=1){
 const shift=hash(seed)*70,roots=Array.from({length:5},(_,i)=>({x:(i-2)*.24,height:.4+.5*noise(i*3+shift,t*1.5)+.12*Math.sin(t*3.4+i*2.7),width:.25+.07*Math.sin(i+t*1.7)}));
 for(let py=0;py<H;py++){
  const y=(H-1-py)/(H-1),bend=(noise(y*5+shift,t*1.9)-.5)*y*.8;
  for(let px=0;px<W;px++){
   const x=(px/(W-1)-.5)*2.2;
   const turbulence=noise(x*4+shift,y*5-t*3.4)*.72+noise(x*10+shift,y*12-t*6)*.28;
   let density=0;
   for(const r of roots){const rise=y/(r.height*(.55+strength*.45)),width=r.width*(1-clamp(rise)*.88),dx=x-r.x-bend-Math.sin(y*13-t*5+r.x*12)*y*.2;
    density+=Math.exp(-dx*dx/(width*width))*(1-clamp((rise-.12)/.88));
   }
   const heat=clamp(density*.82+(turbulence-.62)*1.25-y*.13),i=(py*W+px)*4;
   const alpha=clamp(density*8)*clamp((heat-.08)*3.5)*clamp((1-y)*10)*clamp((1-Math.abs(x)/1.08)*10);
   data[i]=255;data[i+1]=Math.round(48+195*clamp(heat));data[i+2]=Math.round(5+136*Math.pow(heat,3));data[i+3]=Math.round(alpha*235);
  }
 }
 return data;
}
function sparks(t,seed=0){const points=[];for(let i=0;i<3;i++){const period=3.6+hash(seed+i+21)*3.1,age=(t+hash(seed+i+7)*period)%period,life=.75+hash(i+seed)*.5;if(age>life)continue;const u=age/life;points.push({x:(hash(seed+i+3)-.5)*.55+Math.sin(age*3+i)*u*.12,y:.28+u*.95,alpha:Math.sin(Math.min(1,u*5)*Math.PI/2)*(1-u)});}return points;}
function draw(c,x,base,width,height,t,seed,strength,makeCanvas){
 if(strength<=0||!makeCanvas)return;
 let cache=caches.get(c);if(!cache)caches.set(c,cache=new Map());
 let tile=cache.get(seed);if(!tile){if(cache.size>=12)cache.delete(cache.keys().next().value);const canvas=makeCanvas(W,H),ctx=canvas.getContext('2d');tile={canvas,ctx,pixels:ctx.createImageData(W,H),tick:-1};cache.set(seed,tile);}
 const tick=Math.floor(t*24),power=Math.round(clamp(strength,.2,1)*20)/20;
 if(tile.tick!==tick||tile.power!==power){raster(tile.pixels.data,tick/24,seed,power);tile.ctx.putImageData(tile.pixels,0,0);tile.tick=tick;tile.power=power;}
 c.save();
 // Low ember bed remains between flame tongues rather than a single white core.
 const halo=c.createRadialGradient(x,base-2,1,x,base-2,width*.65);halo.addColorStop(0,'#eb6b252d');halo.addColorStop(1,'#e8641700');c.fillStyle=halo;c.fillRect(x-width,base-width,width*2,width*1.3);
 c.fillStyle='#241b17';c.beginPath();c.ellipse(x,base+1,width*.4,3,0,0,Math.PI*2);c.fill();
 for(let i=0;i<23;i++){const glow=.4+.6*noise(i+seed,t*1.9);c.fillStyle=`rgba(255,${Math.round(70+glow*90)},29,${glow*.85})`;c.fillRect(x+(hash(i+seed)-.5)*width*.73,base-2+hash(i+47)*4,1+hash(i+13)*2,1);}
 c.imageSmoothingEnabled=true;c.drawImage(tile.canvas,x-width/2,base-height,width,height);
 // Charred front logs occlude the bases; fine orange fissures sell burning timber.
 c.lineCap='round';c.lineWidth=Math.max(2,width*.047);c.strokeStyle='#302018';c.beginPath();c.moveTo(x-width*.34,base+1);c.lineTo(x+width*.25,base-2);c.moveTo(x-width*.18,base-3);c.lineTo(x+width*.35,base+2);c.stroke();
 c.lineWidth=.65;c.strokeStyle='#d37436a0';c.beginPath();c.moveTo(x-width*.28,base);c.lineTo(x-width*.12,base-1);c.moveTo(x+width*.09,base);c.lineTo(x+width*.23,base+1);c.stroke();
 for(const p of sparks(t,seed)){c.globalAlpha=p.alpha*.85*power;c.fillStyle='#ffd593';c.fillRect(x+p.x*width,base-p.y*height,.7,1.2);}
 c.restore();
}
root.PEFire={draw,raster,sparks,width:W,height:H};if(typeof module!=='undefined')module.exports=root.PEFire;
})(typeof window==='undefined'?globalThis:window);
