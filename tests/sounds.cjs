const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {importSound,readLibrary,validate,audioType}=require('../scripts/sounds.cjs');
async function main(){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'timbertrail-sounds-'));
  fs.mkdirSync(path.join(dir,'assets/audio'),{recursive:true});fs.writeFileSync(path.join(dir,'assets/audio/library.json'),'[]');
  const wav=Buffer.alloc(844);wav.write('RIFF');wav.writeUInt32LE(836,4);wav.write('WAVE',8);wav.write('fmt ',12);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(8000,24);wav.writeUInt32LE(16000,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(800,40);
  fs.writeFileSync(path.join(dir,'test.wav'),wav);
  const recipe={event:'reelWind',file:'test.wav',title:'Synthetic test fixture',creator:'Test',source:'https://pixabay.com/sound-effects/test-123/',downloadedOn:'2026-09-06',reviewed:true,notes:'Synthetic test only; never shipped.',offset:0,duration:.04,gain:.2};
  const recipeFile=path.join(dir,'recipe.json');fs.writeFileSync(recipeFile,JSON.stringify(recipe));
  const imported=importSound(recipeFile,dir);assert.equal(readLibrary(dir).length,1);assert.equal(imported.file.startsWith('reelWind-'),true);
  importSound(recipeFile,dir);assert.equal(readLibrary(dir).length,1,'same event replaces registration');
  assert.throws(()=>validate({...recipe,event:'running'}));assert.throws(()=>validate({...recipe,reviewed:false}));assert.throws(()=>validate({...recipe,source:'https://evil.example/sound-effects/test-123/'}));
  assert.throws(()=>validate({...recipe,duration:.27}));assert.throws(()=>audioType(Buffer.from('<html>not audio</html>')));
  fs.appendFileSync(path.join(dir,'assets/audio',imported.file),'changed');assert.throws(()=>readLibrary(dir),/integrity/);
  const sources=[],gains=[],requests=[];
  const parameter=()=>({setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){this.target=v;},cancelScheduledValues(){}});
  const node=()=>({gain:parameter(),pan:{},connect(n){return n;},disconnect(){},start(...args){this.started=args;},stop(...args){this.stopped=args;}});
  const context={currentTime:2,createBufferSource(){const n=node();sources.push(n);return n;},createGain(){const n=node();gains.push(n);return n;},createStereoPanner:node,async decodeAudioData(){return {duration:1};}};
  const ctx={fetch:async url=>{requests.push(url);return {ok:true,json:async()=>[imported],arrayBuffer:async()=>wav.buffer};}};vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio-samples.js'),'utf8'),ctx);
  const samples=ctx.PEAudioSamples;
  assert.equal(samples.play('reelWind',context,node(),1,0),false,'pending sample falls back immediately');
  await samples.load(context);await samples.load(context);assert.equal(requests.length,2,'one manifest and one asset fetched once');
  assert.equal(samples.play('reelWind',context,node(),.5,-.2),true);assert.deepEqual(sources[0].started,[2,0,.04]);sources[0].onended();
  assert.equal(samples.play('unknown',context,node(),1,0),false);
  assert.equal(samples.setLoop('reelWind',context,node(),1),false,'one-shots are not silently looped');
  const loopContext={fetch:async url=>({ok:true,json:async()=>[{...imported,loop:true}],arrayBuffer:async()=>wav.buffer})};vm.createContext(loopContext);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio-samples.js'),'utf8'),loopContext);
  await loopContext.PEAudioSamples.load(context);const beforeLoop=sources.length;
  assert.equal(loopContext.PEAudioSamples.setLoop('reelWind',context,node(),.5,-.2),true);
  for(let i=0;i<30;i++)loopContext.PEAudioSamples.setLoop('reelWind',context,node(),.8,.2);
  assert.equal(sources.length,beforeLoop+1,'repeated updates reuse a single looping source');assert.equal(sources.at(-1).loop,true);
  assert.equal(sources.at(-1).loopEnd,.04);loopContext.PEAudioSamples.setLoop('reelWind',context,node(),0);assert.ok(sources.at(-1).stopped,'release fades and stops the source');
  loopContext.PEAudioSamples.setLoop('reelWind',context,node(),1);loopContext.PEAudioSamples.stopLoops(context);assert.equal(loopContext.PEAudioSamples.status().loops.length,0,'pause/mute can stop every loop');
  const fail={fetch:async()=>{throw Error('offline');}};vm.createContext(fail);vm.runInContext(fs.readFileSync(path.join(__dirname,'../audio-samples.js'),'utf8'),fail);await fail.PEAudioSamples.load(context);assert.equal(fail.PEAudioSamples.play('reelWind',context,node(),1,0),false);
  // Integration: sample dispatch must stay behind the game's sound switch.
  let played=0;const code=fs.readFileSync(path.join(__dirname,'../audio.js'),'utf8');
  const n=()=>({...node(),frequency:parameter(),Q:{},threshold:{},knee:{},ratio:{},attack:{},release:{},stop(){}});
  class AudioContext{constructor(){this.currentTime=0;this.sampleRate=100;this.destination=n();}createGain(){return n();}createDynamicsCompressor(){return n();}createBuffer(){return {getChannelData:()=>new Float32Array(300)};}createBufferSource(){return n();}createBiquadFilter(){return n();}createOscillator(){return n();}}
  const integration={AudioContext,PEAudioSamples:{load(){},play(){played++;return true;}},localStorage:{getItem(){},setItem(){}}};integration.window=integration;vm.createContext(integration);
  // The existing mix uses setTargetAtTime.
  AudioContext.prototype.createGain=()=>{const x=n();x.gain.setTargetAtTime=()=>{};return x;};
  vm.runInContext(code,integration);integration.PEAudio.start({});integration.PEAudio.play('reelWind');assert.equal(played,1);integration.PEAudio.configure({soundOn:false});integration.PEAudio.play('reelWind');assert.equal(played,1,'mute prevents sample dispatch');
  console.log('PASS sound import, provenance/hash checks, bounded reel clips, loading/failure fallback, dispatch and mute. No listening claim.');
}
main().catch(e=>{console.error(e);process.exitCode=1;});
