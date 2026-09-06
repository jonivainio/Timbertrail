const assert=require('node:assert/strict'),fire=require('../fire-effects.js'),art=require('../cabin-art.js');
const sample=(t,seed=9,power=1)=>fire.raster(new Uint8ClampedArray(fire.width*fire.height*4),t,seed,power);
const first=sample(20),next=sample(20.2);assert.deepEqual(first,sample(20));assert.notDeepEqual(first,next);assert.notDeepEqual(first,sample(20,72));
const coverage=d=>{let total=0;for(let i=3;i<d.length;i+=4)total+=d[i];return total;};assert.ok(coverage(sample(20,9,.25))<coverage(first),'low fuel reduces visible flame');
for(let x=0;x<fire.width;x++)assert.equal(first[x*4+3],0,'transparent top boundary');
let quiet=0,active=0;for(let t=0;t<40;t+=.1){const points=fire.sparks(t,42);points.length?active++:quiet++;for(const p of points)assert.ok(p.alpha>=0&&p.alpha<=1&&p.y>0);}assert.ok(quiet>80&&active>30,'sparse sparks have real quiet intervals');
const frames=new Set();for(let t=0;t<58;t+=.05)frames.add(art.dogPose(t));assert.equal(frames.size,8);assert.equal(art.dogPose(22),art.dogPose(80));assert.ok([5,6].includes(art.dogPose(35)),'long curled resting interval');
const draws=[],fake={c:{save(){},restore(){},drawImage(...args){draws.push(args);}},kajoCabin:{}};for(const t of [0,5.4,13,17.3,18,22,35,49,54])art.drawDog(fake,t);
for(const d of draws){assert.equal(d[0],fake.kajoCabin);assert.ok(d[1]>=0&&d[2]>=0&&d[1]+d[3]<=1536&&d[2]+d[4]<=1024);assert.ok(Math.abs(d[6]+d[8]-402)<1e-8,'all paws/resting bodies keep the basket anchor');assert.ok(d[7]<66&&d[8]<59);}
console.log('PASS turbulent fire raster, fuel response, sparse sparks, eight Kajo poses and grounded breathing.');
