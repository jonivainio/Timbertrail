// Web Audio scheduling/mixing contract; not an auditory quality assessment.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const gains=[],oscillators=[],sources=[];
const param=()=>({value:0,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
const node=()=>({gain:param(),frequency:param(),Q:param(),pan:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(n){return n;},start(){},stop(){}});
class AudioContext{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=node();this.state='running';}createGain(){const n=node();gains.push(n);return n;}createOscillator(){const n=node();oscillators.push(n);return n;}createBufferSource(){const n=node();sources.push(n);return n;}createBiquadFilter(){return node();}createDynamicsCompressor(){return node();}createStereoPanner(){return node();}createBuffer(_,len,rate){return{duration:len/rate,getChannelData:()=>new Float32Array(len)};}resume(){return Promise.resolve();}}
const storage=new Map(),ctx={console,AudioContext,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8'),ctx);
const audio=ctx.PEAudio,s={running:true,playSeconds:0,dayTime:.45,weather:'clear',structures:[],animals:[],player:{x:0,moving:false}},engine={keys:{},water:[]};audio.start(s);
assert.equal(audio.musicWindow(10),false);assert.equal(audio.musicWindow(20),true);assert.equal(audio.musicWindow(90),false);assert.equal(audio.musicWindow(260),true);
audio.configure({soundOn:false,musicOn:true});assert.equal(gains[1].gain.value,0);assert.equal(gains[3].gain.value,0);assert.ok(gains[2].gain.value>0);
audio.configure({soundOn:true,musicOn:false,soundVolume:.2,musicVolume:.3});assert.ok(gains[1].gain.value>0);assert.equal(gains[2].gain.value,0);assert.equal(JSON.parse(storage.get('timbertrail-audio')).musicVolume,.3);
s.weather='rain';s.rainIntensity=.25;audio.update(s,engine,false);const light=gains[5].gain.value;s.rainIntensity=.95;audio.update(s,engine,false);assert.ok(gains[5].gain.value>light*4);
s.weather='clear';s.playSeconds=3;const birdsBefore=oscillators.length;audio.update(s,engine,false);assert.ok(oscillators.length>birdsBefore,'sunlit woodland schedules birds');s.playSeconds=35;audio.update(s,engine,false);assert.equal(gains[4].gain.value,0,'wind has quiet intervals');
s.running=false;audio.update(s,engine,false);assert.equal(gains[4].gain.value,0);assert.equal(gains[5].gain.value,0);assert.equal(gains[2].gain.value,0);
console.log('PASS independent audio switches/volumes, preference persistence, music rests, rain levels, birds and wind gaps.');
const tonesBefore=oscillators.length,gainsBefore=gains.length;
for(const name of ['pickup','gatherWood','gatherStone','gatherGrass','gatherFruit','gatherMushroom','skin'])audio.play(name,.65);
assert.equal(oscillators.length,tonesBefore,'material handling never schedules an electronic tone');assert.ok(gains.length>gainsBefore+15,'layered material friction and contact bursts');
audio.configure({soundOn:false});const muted=gains.length;audio.play('gatherWood');assert.equal(gains.length,muted,'material foley respects sound mute');
console.log('PASS non-tonal layered material sounds and mute. Listening quality still requires a playtest.');
audio.configure({soundOn:true});for(const name of ['drink','pour','door','shutter','chestOpen','cloth','storage','floorStep']){const n=gains.length;audio.play(name,.5);assert.ok(gains.length>n,name+' emits its own foley');}
s.running=true;s.weather='rain';s.rainIntensity=.95;s.cabinHome={inside:false,fire:{lit:false}};audio.update(s,engine,false);const outdoorRain=gains[5].gain.value;s.cabinHome.inside=true;audio.update(s,engine,false);assert.ok(gains[5].gain.value<outdoorRain*.25);audio.configure({soundOn:false});const silent=gains.length;audio.play('pour');audio.play('drink');assert.equal(gains.length,silent);
console.log('PASS indoor rain attenuation, room interaction foley and mute.');
audio.configure({soundOn:true,musicOn:false});s.weather='rain';s.playSeconds=100;s.cabinHome={inside:true,x:480,fire:{lit:true,fuel:80}};
const fireStart=sources.length,fireTones=oscillators.length;audio.update(s,engine,false);assert.ok(sources.length>=fireStart+4);const oneFrame=sources.length;
for(let i=0;i<30;i++)audio.update(s,engine,false);assert.equal(sources.length,oneFrame,'paused/repeated clock never stacks fire sounds');assert.equal(oscillators.length,fireTones,'wood fire is entirely non-tonal');
s.playSeconds+=.5;audio.update(s,engine,false);assert.equal(sources.length,oneFrame,'no mechanical sub-second crackle loop');
s.cabinHome.fire.fuel=0;s.playSeconds+=10;audio.update(s,engine,false);assert.equal(sources.length,oneFrame,'empty hearth stops scheduling fire');
s.cabinHome.inside=false;s.structures=[{type:'fire',lit:true,fuel:50,x:400}];s.playSeconds+=10;audio.update(s,engine,false);assert.equal(sources.length,oneFrame,'distant campfire is silent');
s.structures[0].x=20;s.playSeconds+=1;audio.update(s,engine,false);assert.ok(sources.length>oneFrame,'nearby outdoor fire uses the same ambience');
audio.configure({soundOn:false});const mutedFire=sources.length;s.playSeconds+=10;audio.update(s,engine,false);audio.play('fire');assert.equal(sources.length,mutedFire,'all fire layers respect mute');
console.log('PASS mellow non-tonal fire layers, sparse crackle scheduling, fuel/distance gating and mute.');
