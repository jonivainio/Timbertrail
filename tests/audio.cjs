// Web Audio scheduling/mixing contract; not an auditory quality assessment.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const gains=[],oscillators=[];
const param=()=>({value:0,setValueAtTime(v){this.value=v;},exponentialRampToValueAtTime(v){this.value=v;},setTargetAtTime(v){this.value=v;}});
const node=()=>({gain:param(),frequency:param(),Q:param(),pan:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(n){return n;},start(){},stop(){}});
class AudioContext{constructor(){this.currentTime=0;this.sampleRate=8000;this.destination=node();this.state='running';}createGain(){const n=node();gains.push(n);return n;}createOscillator(){const n=node();oscillators.push(n);return n;}createBufferSource(){return node();}createBiquadFilter(){return node();}createDynamicsCompressor(){return node();}createStereoPanner(){return node();}createBuffer(_,len,rate){return{duration:len/rate,getChannelData:()=>new Float32Array(len)};}resume(){return Promise.resolve();}}
const storage=new Map(),ctx={console,AudioContext,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)}};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8'),ctx);
const audio=ctx.PEAudio,s={running:true,playSeconds:0,dayTime:.45,weather:'clear',structures:[],animals:[],player:{x:0,moving:false}},engine={keys:{},water:[]};audio.start(s);
assert.equal(audio.musicWindow(10),false);assert.equal(audio.musicWindow(20),true);assert.equal(audio.musicWindow(90),false);assert.equal(audio.musicWindow(260),true);
audio.configure({soundOn:false,musicOn:true});assert.equal(gains[1].gain.value,0);assert.equal(gains[3].gain.value,0);assert.ok(gains[2].gain.value>0);
audio.configure({soundOn:true,musicOn:false,soundVolume:.2,musicVolume:.3});assert.ok(gains[1].gain.value>0);assert.equal(gains[2].gain.value,0);assert.equal(JSON.parse(storage.get('timbertrail-audio')).musicVolume,.3);
s.weather='rain';s.rainIntensity=.25;audio.update(s,engine,false);const light=gains[5].gain.value;s.rainIntensity=.95;audio.update(s,engine,false);assert.ok(gains[5].gain.value>light*4);
s.weather='clear';s.playSeconds=3;const birdsBefore=oscillators.length;audio.update(s,engine,false);assert.ok(oscillators.length>birdsBefore,'sunlit woodland schedules birds');s.playSeconds=35;audio.update(s,engine,false);assert.equal(gains[4].gain.value,0,'wind has quiet intervals');
s.running=false;audio.update(s,engine,false);assert.equal(gains[4].gain.value,0);assert.equal(gains[5].gain.value,0);assert.equal(gains[2].gain.value,0);
console.log('PASS independent audio switches/volumes, preference persistence, music rests, rain levels, birds and wind gaps.');
