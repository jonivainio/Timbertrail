const assert=require('node:assert/strict'),art=require('../kajo-art.js');
const d={x:140.3,facing:1,moving:true,stride:0,mode:'follow'},ground=x=>410+.08*(x-140),calls=[];
const c=new Proxy({}, {get:(_,key)=>(...args)=>calls.push([key,...args])}),r={visualV2:true,artKajo:{},c};
for(let i=0;i<6;i++){d.stride=(i+.5)*Math.PI/3;assert.equal(art.frame(d),i);}
for(const stride of [-100,-.001,0,1e8,NaN,Infinity]){d.stride=stride;assert.ok(art.frame(d)>=0&&art.frame(d)<6);}
d.moving=false;d.mode='sit';assert.equal(art.frame(d),7);d.mode='wait';assert.equal(art.frame(d),7);d.mode='follow';assert.equal(art.frame(d),6);
for(const facing of [-1,1])for(const slope of [-.4,-.08,0,.08,.4]){
 d.facing=facing;const g=x=>400+slope*(x-d.x),state=JSON.stringify(d);calls.length=0;assert.equal(art.draw(r,d,g),true);assert.equal(JSON.stringify(d),state);
 const p=art.placement(d,g),m=art.mouth(r,d,g);assert.ok(Math.abs(p.angle)<=.18);assert.ok(Number.isFinite(m.x)&&Number.isFinite(m.y));
 assert.equal(calls[0][0],'save');assert.equal(calls.at(-1)[0],'restore');assert.deepEqual(calls.find(a=>a[0]==='scale'),['scale',facing,1]);
 const localX=(m.x-p.x)*Math.cos(p.angle)+(m.y-p.y)*Math.sin(p.angle),localY=-(m.x-p.x)*Math.sin(p.angle)+(m.y-p.y)*Math.cos(p.angle);
 assert.ok(Math.abs(localX-17*facing)<1e-9);assert.ok(Math.abs(localY+23)<1e-9);
}
r.artKajo=null;assert.equal(art.draw(r,d,ground),false);assert.equal(art.mouth(r,d,ground),null);r.artKajo={};r.visualV2=false;assert.equal(art.draw(r,d,ground),false);r.visualV2=true;assert.equal(art.draw(r,d,ground),true);
console.log('PASS Kajo 6-phase sampling, idle/sit, facing, slope/mouth transform, render purity and fallback recovery.');
