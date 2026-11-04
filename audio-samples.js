(function(root){'use strict';
  let loading=null,owner=null,generation=0;
  const clips=new Map(),loops=new Map();
  const failures=new Set(),voices=new Set(),loopVoices=new Set();
  const maxVoices=24,maxLoops=6;
  function clean(voice){voice.source.disconnect();voice.gain.disconnect();voice.panner?.disconnect();voices.delete(voice);loopVoices.delete(voice);}
  function adopt(context){
    if(owner===context)return;
    for(const voice of [...voices,...loopVoices]){try{voice.source.stop();}catch{}clean(voice);}
    loops.clear();clips.clear();failures.clear();loading=null;owner=context;generation++;
  }
  // Shuffle whole takes; preserve their pitch identity and prevent a bag seam
  // repeating the last footfall. No extra audio or delayed action is scheduled.
  function variant(e){
    if(!e.bag.length){e.bag=e.regions.map((_,i)=>i);for(let i=e.bag.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[e.bag[i],e.bag[j]]=[e.bag[j],e.bag[i]];}
      if(e.bag.length>1&&e.bag.at(-1)===e.last)[e.bag[0],e.bag[e.bag.length-1]]=[e.bag.at(-1),e.bag[0]];
    }
    e.last=e.bag.pop();return e.regions[e.last];
  }
  // Failure leaves procedural audio available; never replay a late action.
  function load(context){
    adopt(context);const ticket=generation;
    if(loading)return loading;
    loading=(async()=>{
      try{
        const response=await fetch('assets/audio/library.json');if(!response.ok)return;
        const entries=await response.json();
        if(ticket!==generation)return;
        // First footsteps should not wait behind every item, animal and reel clip.
        const priority=['step','water','gatherWood','gatherStone'];
        const rank=e=>priority.includes(e.event)?priority.indexOf(e.event):priority.length;
        entries.sort((a,b)=>rank(a)-rank(b));
        // A small worker pool keeps the first actions responsive without flooding requests.
        let next=0;
        await Promise.all(Array.from({length:Math.min(4,entries.length)},async()=>{while(next<entries.length){
          if(ticket!==generation)return;const e=entries[next++];
          try{
            if(!/^[a-zA-Z]+-[a-f0-9]{64}\.(mp3|wav|ogg)$/.test(e.file))throw Error('Invalid sample path');
            const result=await fetch('assets/audio/'+e.file);if(!result.ok)throw Error('Sample unavailable');
            const buffer=await context.decodeAudioData(await result.arrayBuffer());
            if(!Number.isFinite(e.offset)||e.offset<0||!Number.isFinite(e.duration)||e.duration<.02||e.offset+e.duration>buffer.duration+.001||!Number.isFinite(e.gain))throw Error('Invalid sample range');
            const regions=e.regions||[{offset:e.offset,duration:e.duration}];
            if(!regions.length||regions.some(r=>!Number.isFinite(r.offset)||r.offset<0||!Number.isFinite(r.duration)||r.duration<.02||r.offset+r.duration>buffer.duration+.001))throw Error('Invalid variants');
            if(ticket!==generation)return;
            clips.set(e.event,{...e,buffer,regions,bag:[],last:-1});
          }catch{if(ticket===generation)failures.add(e.event);/* Unsupported sample: use synthesis. */}
        }}));
      }catch{/* file:// or offline failures must not interrupt play. */}
    })();return loading;
  }
  function play(name,context,destination,intensity,pan){
    if(context!==owner)return false;
    const e=clips.get(name);if(!e)return false;
    if(!Number.isFinite(intensity)||intensity<=0)return true;
    pan=Number.isFinite(pan)?pan:0;
    // Discard an overloaded contact, never request a synthesis fallback that
    // would merely add more voices. Existing contacts finish their short tails.
    if(voices.size>=maxVoices)return true;
    const source=context.createBufferSource(),gain=context.createGain(),now=context.currentTime;
    source.buffer=e.buffer;
    const region=variant(e);
    const varyRate=name==='step'&&source.playbackRate?.setValueAtTime;
    const speed=varyRate ? 0.965+Math.random()*0.07 : 1;
    if(varyRate)source.playbackRate.setValueAtTime(speed,now);
    const duration=region.duration/speed;
    const volume=Math.max(.0001,Math.min(1,e.gain*intensity*(name==='step'?.94+Math.random()*.12:1)));
    gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(volume,now+Math.min(e.attack??.015,duration*.25));
    gain.gain.setValueAtTime(volume,now+duration-Math.min(e.release??.06,duration*.5));gain.gain.linearRampToValueAtTime(0,now+duration);
    source.connect(gain);let panner=null;
    if(context.createStereoPanner){panner=context.createStereoPanner();panner.pan.value=Math.max(-1,Math.min(1,pan));gain.connect(panner).connect(destination);}else gain.connect(destination);
    const voice={source,gain,panner};voices.add(voice);source.onended=()=>clean(voice);
    try{source.start(now,region.offset,region.duration);}catch{clean(voice);return false;}return true;
  }
  function stopLoop(name,context,quick=false){
    const active=loops.get(name);if(!active)return;
    const now=active.context.currentTime,release=quick?.08:(clips.get(name)?.loopRelease??.2);
    // setTarget continues from the current value without resetting a running fade.
    active.gain.gain.setTargetAtTime(0,now,release/6);active.source.stop(now+release);loops.delete(name);
  }
  function setLoop(name,context,destination,level,pan=0){
    if(context!==owner)return false;
    const e=clips.get(name);if(!e?.loop)return false;
    if(!Number.isFinite(level))level=0;if(!Number.isFinite(pan))pan=0;
    if(level<=0){stopLoop(name,context);return true;}
    let active=loops.get(name);
    if(!active){
      if(loopVoices.size>=maxLoops)return true;
      const source=context.createBufferSource(),gain=context.createGain();
      source.buffer=e.buffer;source.loop=true;source.loopStart=e.offset;source.loopEnd=e.offset+e.duration;
      source.connect(gain);let panner=null;
      if(context.createStereoPanner){panner=context.createStereoPanner();gain.connect(panner).connect(destination);}else gain.connect(destination);
      gain.gain.value=.0001;
      active={source,gain,panner,context};const voice=active;loopVoices.add(voice);
      source.onended=()=>{clean(voice);if(loops.get(name)===voice)loops.delete(name);};
      loops.set(name,active);try{source.start(context.currentTime,e.offset);}catch{loops.delete(name);clean(voice);return false;}
    }
    if(active.panner)active.panner.pan.value=Math.max(-1,Math.min(1,pan));
    const target=Math.max(.0001,Math.min(1,e.gain*level));
    if(active.target!==target){active.gain.gain.setTargetAtTime(target,context.currentTime,(e.loopAttack??.12)/3);active.target=target;}
    return true;
  }
  function stopLoops(context){for(const name of loops.keys())stopLoop(name,context,true);}
  root.PEAudioSamples={load,play,setLoop,stopLoops,status:()=>({loaded:[...clips.keys()],failed:[...failures],loops:[...loops.keys()],voices:voices.size,loopVoices:loopVoices.size,maxVoices,maxLoops})};
})(typeof window!=='undefined'?window:globalThis);
