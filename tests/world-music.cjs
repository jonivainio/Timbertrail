// Deterministic timing/transport checks, not music audition or mix acceptance.
const assert=require('node:assert/strict'),{Director,Player,role}=require('../world-music.js');
const cues=['a','b'].map(id=>({id,file:'assets/audio/world-'+id+'.mp3',duration:80,roles:['forest_walk','quiet_shore_evening','cabin_rest']}));
for(const hz of [30,60,144]){
  const d=new Director(cues);let audible=0,first=null,previous=null,starts=[];
  for(let i=0;i<hz*1200;i++){const s=d.tick({seconds:i/hz,role:i<hz*390?'forest_walk':'cabin_rest'});if(s.cue){audible+=1/hz;if(first===null)first=i/hz;if(s.cue.id!==previous){starts.push(s.cue.id);previous=s.cue.id;}}else previous=null;}
  assert.ok(first>=44.9&&first<=45.1);const quiet=1-audible/1200;assert.ok(quiet>=.65&&quiet<=.8,`${hz} quiet share ${quiet}`);
  for(let i=1;i<starts.length;i++)assert.notEqual(starts[i],starts[i-1]);
}
const d=new Director(cues);for(let i=0;i<3000;i++)d.tick({seconds:i/60});assert.equal(d.phase,'playing');
const age=d.elapsed;d.tick({seconds:700});assert.equal(d.elapsed,age,'sleep jump does not skip phrases');
for(let i=1;i<=100;i++)d.tick({seconds:700+i/60,active:false});assert.equal(d.elapsed,age,'pause does not age cue');
const same=d.cue;for(let i=101;i<200;i++)d.tick({seconds:700+i/60,role:'cabin_rest'});assert.equal(d.cue,same,'region changes do not interrupt phrase');
d.tick({seconds:704,enabled:false});assert.equal(d.cue,null);assert.equal(d.phase,'cooldown');
const empty=new Director();for(let i=0;i<72000;i++)empty.tick({seconds:i/60});assert.equal(empty.cue,null);
assert.equal(new Director([{...cues[0],file:'https://external/music.mp3'}]).cues.length,0);
assert.equal(role({cabinHome:{inside:true}}),'cabin_rest');
const buffered=new Director(cues);
for(let i=0;i<4200;i++)buffered.tick({seconds:i/60,mediaTime:0});
assert.equal(buffered.elapsed,0,'25 seconds of initial buffering must not skip music');assert.ok(buffered.cue);
buffered.tick({seconds:70,mediaTime:1});assert.equal(buffered.elapsed,1);
buffered.tick({seconds:70.1,mediaTime:1});assert.equal(buffered.elapsed,1,'a stalled transport holds the music envelope');
buffered.tick({seconds:70.2,active:false,enabled:false,mediaTime:1});assert.equal(buffered.cue,null,'muting during pause cancels the same cue');
const stuck=new Director(cues);for(let i=0;i<4600;i++)stuck.tick({seconds:i/60,mediaTime:0});
assert.equal(stuck.cue,null,'permanently stalled media is abandoned, not kept forever');assert.equal(stuck.failed.size,1);
const real=require('../world-music.js');assert.equal(real.cues.length,3);assert.equal(real.listeningReviewed,false);
for(const sceneRole of ['forest_walk','quiet_shore_evening','cabin_rest']){
  const simulation=new Director(real.cues);let musicSeconds=0;
  for(let i=0;i<72000;i++)if(simulation.tick({seconds:i/60,role:sceneRole}).cue)musicSeconds+=1/60;
  assert.ok(1-musicSeconds/1200>=.65&&1-musicSeconds/1200<=.8,sceneRole+' preserves nature-only intervals');
}
(async()=>{
  const media=[],nodes=[];let resolvePlay;
  const player=new Player(cues,url=>{const m={url,paused:true,play(){this.paused=false;return new Promise(r=>resolvePlay=r);},pause(){this.paused=true;},removeAttribute(){},load(){}};media.push(m);return m;});
  const node=()=>{const n={gain:{value:0,setTargetAtTime(v){assert.ok(Number.isFinite(v));}},connect(to){return to;},disconnect(){this.disconnected=true;}};nodes.push(n);return n;};
  const ctx={state:'running',currentTime:0,createGain:node,createMediaElementSource:node};
  const tick=(seconds,extra={})=>player.update(ctx,{}, {seconds,active:true,enabled:true,volume:.4,...extra});
  for(let i=0;i<2800;i++)tick(i/60);assert.equal(media.length,1);
  tick(47,{active:false});assert.equal(media[0].paused,true);
  resolvePlay();await Promise.resolve();assert.equal(media[0].paused,true,'in-flight play completion cannot resume paused game');
  tick(47.1);player.reset();resolvePlay();await Promise.resolve();assert.equal(media[0].paused,true,'stale play completion cannot resurrect music');assert.ok(nodes.every(n=>n.disconnected));
  for(let i=0;i<2800;i++)tick(i/60);media.at(-1).onerror();tick(47);assert.equal(player.media,null,'load errors free source and leave silence');
  const count=media.length;for(let i=0;i<3600;i++)tick(48+i/60);assert.equal(media.length,count,'failure does not retry every frame');
  console.log('PASS recorded music director: 20-minute quiet share at30/60/144Hz and each real role, buffering/stall timeout, dwell, nonrepetition, pause/sleep/mute, missing bank and stale media completion/error cleanup. No listening claim.');
})().catch(e=>{console.error(e);process.exitCode=1;});
