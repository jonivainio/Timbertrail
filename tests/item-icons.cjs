// Verify supplied-image loading and the shared Canvas icon contract, not CSS layout.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),loaded=[];
class Image {set src(value){this.path=value;const b=fs.readFileSync(path.join(root,value));this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);loaded.push(this);queueMicrotask(()=>this.onload());}}
const context={Image};context.globalThis=context;vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(root,'item-icons.js'),'utf8'),context);
(async()=>{
 const api=context.PEIcons,first=api.load();assert.equal(api.load(),first,'preload is shared');await first;
 const ids=['rawFish','cookedFish','pike','zander','perch'];
 for(const id of ids){
  const image=loaded.find(v=>v.path==='assets/icon-'+id+'.png');assert.ok(image,id+' preloaded');
  const b=Array.from(api.bounds[id]);assert.equal(b.length,4);assert.ok(b[0]>=0&&b[1]>=0&&b[2]>0&&b[3]>0&&b[0]+b[2]<=image.width&&b[1]+b[3]<=image.height,'valid crop: '+id);
  for(const size of [24,48,96,160]){
   const calls=[],c={save(){},restore(){},drawImage(...args){calls.push(args);}};
   assert.equal(api.draw(c,id,11,17,size),true);assert.equal(calls.length,1);
   const [source,sx,sy,sw,sh,x,y,w,h]=calls[0];assert.equal(source,image);assert.deepEqual([sx,sy,sw,sh],b);
   assert.ok(Math.abs(w/h-sw/sh)<1e-10,'aspect ratio preserved');
   assert.ok(Math.abs(x+w/2-(11+size/2))<1e-10&&Math.abs(y+h/2-(17+size/2))<1e-10,'icon centered');
   assert.ok(x>=11&&y>=17&&x+w<=11+size&&y+h<=17+size,'fits icon slot');
  }
 }
 assert.equal(api.draw({},'unknown-item'),false,'unknown icons retain procedural fallback');
 assert.equal(new Set(ids.map(id=>loaded.find(v=>v.path==='assets/icon-'+id+'.png'))).size,5,'five distinct supplied images');
 console.log('PASS fish/fillet icon preload, distinct species, bounded crops, aspect ratio and slot sizes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
