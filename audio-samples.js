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
        // A small worker pool keeps the first actions responsive without flooding requests.
        let next=0;
        await Promise.all(Array.from({length:Math.min(4,entries.length)},async()=>{while(next<entries.length){
          const e=entries[next++];
          try{
            if(!/^[a-zA-Z]+-[a-f0-9]{64}\.(mp3|wav|ogg)$/.test(e.file))throw Error('Invalid sample path');
            const result=await fetch('assets/audio/'+e.file);if(!result.ok)throw Error('Sample unavailable');
            const buffer=await context.decodeAudioData(await result.arrayBuffer());
            if(!Number.isFinite(e.offset)||e.offset<0||!Number.isFinite(e.duration)||e.duration<.02||e.offset+e.duration>buffer.duration+.001||!Number.isFinite(e.gain))throw Error('Invalid sample range');
            clips.set(e.event,{...e,buffer});
          }catch{failures.add(e.event);/* Unsupported sample: use synthesis. */}
        }}));
      }catch{/* file:// or offline failures must not interrupt play. */}
    })();return loading;
  }
  function play(name,context,destination,intensity,pan){
    const e=clips.get(name);if(!e)return false;
    const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
    source.buffer=e.buffer;
    const volume=Math.max(.0001,Math.min(1,e.gain*intensity));
    gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(volume,now+.005);
    gain.gain.setValueAtTime(volume,now+e.duration-.01);gain.gain.exponentialRampToValueAtTime(.0001,now+e.duration);
    source.connect(gain);let panner=null;
    if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner).connect(destination);}else gain.connect(destination);
    source.onended=()=>{source.disconnect();gain.disconnect();panner?.disconnect();};
    source.start(now,e.offset,e.duration);return true;
  }
  function stopLoop(name,context){
    const active=loops.get(name);if(!active)return;
    const now=context.currentTime;active.gain.gain.cancelScheduledValues(now);
    active.gain.gain.setTargetAtTime(.0001,now,.015);active.source.stop(now+.08);loops.delete(name);
  }
  function setLoop(name,context,destination,level,pan=0){
    const e=clips.get(name);if(!e?.loop)return false;
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
    active.gain.gain.setTargetAtTime(Math.max(.0001,Math.min(1,e.gain*level)),context.currentTime,.035);
    return true;
  }
  function stopLoops(context){for(const name of loops.keys())stopLoop(name,context);}
  root.PEAudioSamples={load,play,setLoop,stopLoops,status:()=>({loaded:[...clips.keys()],failed:[...failures],loops:[...loops.keys()]})};
})(typeof window!=='undefined'?window:globalThis);
