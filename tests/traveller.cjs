const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
global.PE=require('../engine.js');const art=require('../traveller-art.js'),equipment=require('../equipment.js'),meta=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/art-v2/traveller.json'),'utf8'));
const calls=[],ctx=new Proxy({drawImage(...args){calls.push(['image',...args]);},translate(...args){calls.push(['translate',...args]);},scale(...args){calls.push(['scale',...args]);}},{get:(o,k)=>o[k]||(()=>{})});
const layer={width:140,height:116,getContext:()=>ctx},r={c:ctx,sprites:{},artTraveller:{id:'new'},visualV2:true,makeCanvas:()=>layer,sprite(){calls.push(['old']);},pose(){calls.push(['old-pose']);},petImage:{id:'pet'},seatedImage:{id:'seated'}};
const e=new PE.Engine();e.start();const p=e.state.player;
for(let i=0;i<16;i++){
 Object.assign(p,{moving:i!==6&&i!==7,running:i>=8&&i<14,crouching:i===7||i>=14,stride:i<6?(i+.5)*Math.PI/3:i<14?(i-8+.5)*Math.PI/3:(i-14+.5)*Math.PI});
 assert.equal(art.frame(p),i);assert.deepEqual(art.frames[i].hand,meta.frames[i].hand);assert.deepEqual(art.frames[i].rect,meta.frames[i].rect);
 for(const facing of [-1,1])for(const tool of [null,'puukko','knife','flintaxe','axe','bow','rod']){
  p.facing=facing;e.state.equipped=tool;calls.length=0;const before=JSON.stringify(e.state);assert.equal(equipment.drawActor(r,e),true);assert.equal(JSON.stringify(e.state),before);
  assert.equal(calls.filter(a=>a[0]==='image'&&a[1]===r.artTraveller).length,1);assert.ok(!calls.some(a=>a[0]==='old'));
  assert.ok(calls.some(a=>a[0]==='scale'&&a[1]===facing));if(tool){const g=art.sample(p).grip;assert.ok(calls.some(a=>a[0]==='translate'&&a[1]===67+g[0]&&a[2]===101+g[1]),'tool uses cel hand');}
 }
}
for(const stride of [NaN,Infinity,-1e6,1e9]){p.stride=stride;assert.ok(Number.isInteger(art.frame(p))&&art.frame(p)>=0&&art.frame(p)<16);}
Object.assign(p,{moving:false,running:false,crouching:false,sitting:true});calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.seatedImage));assert.ok(!calls.some(a=>a[0]==='image'&&a[1]===r.artTraveller));
p.sitting=false;e.action={target:{type:'pet'},time:0};calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.petImage));e.action=null;e.state.equipped=null;r.artTraveller=null;calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='old'));r.artTraveller={};calls.length=0;equipment.drawActor(r,e);assert.ok(calls.some(a=>a[0]==='image'&&a[1]===r.artTraveller));
console.log('PASS traveller16 poses ×2 facings ×7 hand/tool states, metadata grips, immutable simulation, separate special poses and missing-art recovery.');
