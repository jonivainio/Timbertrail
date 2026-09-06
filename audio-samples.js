(function(root){'use strict';
  let loading=null;
  const clips=new Map();
  // Failure leaves procedural audio available; never replay a late action.
  function load(context){
    if(loading)return loading;
    loading=(async()=>{
      try{
        const response=await fetch('assets/audio/library.json');if(!response.ok)return;
        const entries=await response.json();
        for(const e of entries){
          try{
            if(!/^[a-zA-Z]+-[a-f0-9]{64}\.(mp3|wav|ogg)$/.test(e.file))continue;
            const result=await fetch('assets/audio/'+e.file);if(!result.ok)continue;
            const buffer=await context.decodeAudioData(await result.arrayBuffer());
            if(e.offset<0||e.duration<=0||e.offset+e.duration>buffer.duration||!Number.isFinite(e.gain))continue;
            clips.set(e.event,{...e,buffer});
          }catch{/* Unsupported or unavailable sample: use synthesis. */}
        }
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
  root.PEAudioSamples={load,play};
})(typeof window!=='undefined'?window:globalThis);
