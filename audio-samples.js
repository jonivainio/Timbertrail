(function(root){'use strict';
  let loading=null;
  const clips=new Map(),loops=new Map();
  const failures=new Set();
  // Failure leaves procedural audio available; never replay a late action.
  function load(context){
    if(loading)return loading;
    loading=(async()=>{
      try{
        const response=await fetch('assets/audio/library.json');if(!response.ok)return;
        const entries=await response.json();
        // First footsteps should not wait behind every item, animal and reel clip.
        const priority=['step','water','gatherWood','gatherStone'];
        const rank=e=>priority.includes(e.event)?priority.indexOf(e.event):priority.length;
        entries.sort((a,b)=>rank(a)-rank(b));
        // A small worker pool keeps the first actions responsive without flooding requests.
        let next=0;
        await Promise.all(Array.from({length:Math.min(4,entries.length)},async()=>{while(next<entries.length){
          const e=entries[next++];
          try{
            if(!/^[a-zA-Z]+-[a-f0-9]{64}\.(mp3|wav|ogg)$/.test(e.file))throw Error('Invalid sample path');
            const result=await fetch('assets/audio/'+e.file);if(!result.ok)throw Error('Sample unavailable');
            const buffer=await context.decodeAudioData(await result.arrayBuffer());
            if(!Number.isFinite(e.offset)||e.offset<0||!Number.isFinite(e.duration)||e.duration<.02||e.offset+e.duration>buffer.duration+.001||!Number.isFinite(e.gain))throw Error('Invalid sample range');
            const regions=e.regions||[{offset:e.offset,duration:e.duration}];
            if(!regions.length||regions.some(r=>!Number.isFinite(r.offset)||r.offset<0||!Number.isFinite(r.duration)||r.duration<.02||r.offset+r.duration>buffer.duration+.001))throw Error('Invalid variants');
            clips.set(e.event,{...e,buffer,regions,next:0});
          }catch{failures.add(e.event);/* Unsupported sample: use synthesis. */}
        }}));
      }catch{/* file:// or offline failures must not interrupt play. */}
    })();return loading;
  }
  function play(name,context,destination,intensity,pan){
    const e=clips.get(name);if(!e)return false;
    if(!Number.isFinite(intensity)||intensity<=0)return true;
    pan=Number.isFinite(pan)?pan:0;
    const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
    source.buffer=e.buffer;
    const region=e.regions[e.next++%e.regions.length];
    const varyRate=name==='step'&&source.playbackRate?.setValueAtTime;
    const speed=varyRate ? 0.965+Math.random()*0.07 : 1;
    if(varyRate)source.playbackRate.setValueAtTime(speed,now);
    const duration=region.duration/speed;
    const volume=Math.max(.0001,Math.min(1,e.gain*intensity*(name==='step'?.94+Math.random()*.12:1)));
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+Math.min(e.attack??.015,duration*.25));
    gain.gain.setValueAtTime(volume,now+duration-Math.min(e.release??.06,duration*.5));gain.gain.linearRampToValueAtTime(0,now+duration);
    source.connect(gain);let panner=null;
    if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner).connect(destination);}else gain.connect(destination);
    source.onended=()=>{source.disconnect();gain.disconnect();panner?.disconnect();};
    source.start(now,region.offset,region.duration);return true;
  }
  function stopLoop(name,context,quick=false){
    const active=loops.get(name);if(!active)return;
    const now=context.currentTime,release=quick?.08:(clips.get(name).loopRelease??.2);
    // setTarget continues from the current value without resetting a running fade.
    active.gain.gain.setTargetAtTime(0,now,release/6);active.source.stop(now+release);loops.delete(name);
  }
  function setLoop(name,context,destination,level,pan=0){
    const e=clips.get(name);if(!e?.loop)return false;
    if(!Number.isFinite(level))level=0;if(!Number.isFinite(pan))pan=0;
    if(level<=0){stopLoop(name,context);return true;}
    let active=loops.get(name);
    if(!active){
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=e.buffer;source.loop=true;source.loopStart=e.offset;source.loopEnd=e.offset+e.duration;
      source.connect(gain);let panner=null;
      if(context.createStereoPanner){panner=context.createStereoPanner();gain.connect(panner).connect(destination);}else gain.connect(destination);
      gain.gain.value=.0001;
      source.onended=()=>{source.disconnect();gain.disconnect();panner?.disconnect();};
      active={source,gain,panner};loops.set(name,active);source.start(context.currentTime,e.offset);
    }
    if(active.panner)active.panner.pan.value=Math.max(-1,Math.min(1,pan));
    const target=Math.max(.0001,Math.min(1,e.gain*level));
    if(active.target!==target){active.gain.gain.setTargetAtTime(target,context.currentTime,(e.loopAttack??.12)/3);active.target=target;}
    return true;
  }
  function stopLoops(context){for(const name of loops.keys())stopLoop(name,context,true);}
  root.PEAudioSamples={load,play,setLoop,stopLoops,status:()=>({loaded:[...clips.keys()],failed:[...failures],loops:[...loops.keys()]})};
})(typeof window!=='undefined'?window:globalThis);
