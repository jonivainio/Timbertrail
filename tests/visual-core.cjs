const assert=require('node:assert/strict'),V=require('../visual-core.js');
for(const scale of [.5,2/3])for(const camera of [0,565,2441.125,5440])for(const x of [0,565,3250,5520,6400]){
  assert.ok(Math.abs(V.projectX(x,camera,{scale})-(x-camera)*scale)<=.5);
}
assert.equal(V.reflectionSample(10,19,20),null);
assert.deepEqual(V.reflectionSample(10,40,20,.5,2),{x:12,y:-20});
assert.throws(()=>V.reflectionSample(1,2,3,0));
for(const hz of [30,60,144]){let value=0;for(let i=0;i<hz;i++)value=V.smooth(value,1,1/hz);assert.ok(Math.abs(value-V.smooth(0,1,1))<1e-12);}
for(let t=0;t<15;t+=1/144){const wave=V.waterOffset(3810,48,t,.7);assert.ok(Math.abs(wave-V.waterOffset(3810,48,t+1/144,.7))<.03);assert.equal(wave,V.waterOffset(3810,48,t,.7));}
for(const dpr of [1,1.25,1.5,2])for(const [w,h]of [[1280,720],[1366,768],[1920,1080],[2560,1440]])for(const [aw,ah]of [[480,270],[640,360]]){
  const fit=V.integerFit(aw,ah,w,h,dpr);assert.ok(fit.physicalWidth<=w*dpr);assert.ok(fit.physicalHeight<=h*dpr);assert.equal(fit.physicalWidth%aw,0);
}
const rect={left:35,top:80,width:1280,height:720};assert.deepEqual(V.pointerToLogical(675,440,rect),{x:480,y:270});assert.equal(V.pointerToLogical(20,80,rect),null);
let allocations=0;const pool=new V.SurfacePool((width,height)=>{allocations++;return {width,height};},2);
for(let i=0;i<2000;i++)pool.get('lit',480,270);assert.equal(allocations,1);pool.get('water',480,270);assert.equal(pool.bytes,480*270*8);assert.throws(()=>pool.get('extra',1,1));
pool.clear();assert.equal(pool.bytes,0);
const fractional=pool.get('terrain',6400*2/3,540*2/3);
assert.equal(fractional.width,4267);assert.equal(fractional.height,360);
for(let i=0;i<2000;i++)assert.equal(pool.get('terrain',6400*2/3,540*2/3),fractional);
assert.equal(allocations,3);pool.clear();
const state={currentMap:'pond',camera:3000,playSeconds:25,dayTime:.45,weather:'calm',player:{x:3734}};const snap=V.snapshot(state);state.camera=3500;assert.equal(snap.camera,3000);assert.ok(Object.isFrozen(snap));
console.log('Visual coordinates, frame-rate-independent smoothing, coherent water and bounded surfaces pass.');
for(const zoom of [1,1.08,1.2])for(const camera of [0,16,159,160,565,2866,5280,5400,5440]){
  const state={running:true,camera},view=V.cameraView(state,zoom);
  assert.ok(view.x>=0&&view.x+view.width<=960+1e-9);assert.ok(view.y>=0&&view.y+view.height<=540+1e-9);
  for(const p of [{x:0,y:0},{x:384,y:430},{x:959,y:539}]){
    const back=V.screenToScene(V.sceneToScreen(p,view),view);assert.ok(Math.abs(back.x-p.x)<1e-9);assert.ok(Math.abs(back.y-p.y)<1e-9);
  }
  assert.equal(V.cameraView({...state,cabinHome:{inside:true}},zoom).zoom,1);
  assert.equal(V.cameraView({...state,running:false},zoom).zoom,1);
}
assert.equal(V.cameraView({running:true,camera:0},1.2).x,0);
const endView=V.cameraView({running:true,camera:5440},1.2);assert.equal(endView.x+endView.width,960);
console.log('Camera crops preserve reversible pointer coordinates, region edges, UI units and the independent interior/menu framing.');
for(const scale of [.5,2/3])for(const zoom of [1,1.08,1.2])for(let camera=0;camera<=5440;camera+=17){
  const v=V.cameraView({running:true,camera},zoom,scale);
  for(const value of [v.x,v.y,v.width,v.height])assert.ok(Math.abs(value*scale-Math.round(value*scale))<1e-9,'crop aligned to native pixels');
  assert.ok(v.x>=0&&v.x+v.width<=960+1e-9);
  assert.ok(v.y>=0&&v.y+v.height<=540+1e-9);
  const p={x:384.25,y:431.7},back=V.screenToScene(V.sceneToScreen(p,v),v);
  assert.ok(Math.abs(back.x-p.x)<1e-9&&Math.abs(back.y-p.y)<1e-9);
}
console.log('Native-grid crops retain reversible input across both world resolutions and camera edges.');
