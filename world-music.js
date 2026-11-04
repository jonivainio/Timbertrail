/* Recorded-world-music lifecycle. No oscillator fallback, no game/save writes. */
(function(root){'use strict';
  const roles=new Set(['forest_walk','quiet_shore_evening','cabin_rest']);
  const clamp=v=>Math.max(0,Math.min(1,Number.isFinite(v)?v:0));
  class Director{
    constructor(cues=[]){
      this.cues=cues.filter(c=>c&&/^assets\/audio\/world-[a-z0-9-]+\.(mp3|ogg|wav)$/.test(c.file)&&Array.isArray(c.roles)&&c.roles.every(r=>roles.has(r))&&Number.isFinite(c.duration)&&c.duration>=10);
      this.reset();
    }
    reset(){this.phase='quiet';this.activeTime=0;this.wait=45;this.elapsed=0;this.stalled=0;this.role=null;this.dwell=0;this.previous=null;this.cue=null;this.cursor=0;this.last=-1;this.failed=new Set();}
    cancel(wait=210){this.phase='cooldown';this.wait=wait;this.cue=null;this.elapsed=0;this.stalled=0;}
    tick({seconds,active=true,enabled=true,role='forest_walk',ended=false,failed=false,mediaTime}){
      const time=Number.isFinite(seconds)?seconds:this.last;
      if(time<this.last)this.reset();
      // Long suspension/sleep jumps are not elapsed active listening time.
      const delta=this.last<0?0:Math.max(0,time-this.last),dt=delta<=.5?delta:0;this.last=time;
      if(!enabled){if(this.cue)this.cancel();return this.snapshot();}
      if(!active)return this.snapshot();
      this.activeTime+=dt;
      if(role!==this.role){this.role=role;this.dwell=0;}else this.dwell+=dt;
      if(this.cue&&(failed||ended)){if(failed)this.failed.add(this.cue.id);this.previous=this.cue.id;this.cancel(180+(this.cursor%4)*35);return this.snapshot();}
      if(['quiet','cooldown'].includes(this.phase)){this.wait-=dt;if(this.wait<=0)this.phase='pending';}
      if(this.phase==='pending'&&this.dwell>=30){
        let available=this.cues.filter(c=>c.roles.includes(role)&&!this.failed.has(c.id));
        if(available.length>1)available=available.filter(c=>c.id!==this.previous);
        if(available.length){this.cue=available[this.cursor++%available.length];this.elapsed=0;this.phase='fade_in';}
      }else if(this.cue){
        // The streaming transport owns phrase time. Loading/buffering must not
        // consume the fade-in, skip a phrase, or manufacture a silent "play".
        const elapsed=Number.isFinite(mediaTime)?Math.max(this.elapsed,Math.min(this.cue.duration,mediaTime)):this.elapsed+dt;
        this.stalled=elapsed>this.elapsed?0:this.stalled+dt;this.elapsed=elapsed;
        if(this.stalled>=30){this.failed.add(this.cue.id);this.previous=this.cue.id;this.cancel();return this.snapshot();}
        if(this.elapsed>=this.cue.duration){this.previous=this.cue.id;this.cancel(180+(this.cursor%4)*35);}
        else if(this.elapsed>=this.cue.duration-5)this.phase='fade_out';
        else if(this.elapsed>=3)this.phase='playing';
      }
      return this.snapshot();
    }
    snapshot(){return {phase:this.phase,cue:this.cue,elapsed:this.elapsed,activeTime:this.activeTime,level:this.cue?Math.min(1,this.elapsed/3,(this.cue.duration-this.elapsed)/5):0};}
  }
  class Player{
    constructor(cues=[],makeMedia=url=>new root.Audio(url)){this.director=new Director(cues);this.makeMedia=makeMedia;this.media=null;this.context=null;this.source=null;this.gain=null;this.cue=null;this.epoch=0;this.ended=false;this.failed=false;this.paused=true;this.starting=false;this.desiredActive=false;}
    dispose(){this.epoch++;if(this.media){this.media.pause();this.media.onended=null;this.media.onerror=null;this.media.removeAttribute?.('src');this.media.load?.();}this.source?.disconnect();this.gain?.disconnect();this.media=null;this.source=null;this.gain=null;this.cue=null;this.starting=false;this.paused=true;}
    reset(){this.dispose();this.director.reset();this.ended=false;this.failed=false;}
    async play(){if(!this.media||this.starting)return;const media=this.media,epoch=this.epoch;this.starting=true;try{await media.play();if(epoch!==this.epoch||!this.desiredActive){media.pause();return;}this.paused=false;}catch(error){if(epoch===this.epoch&&this.desiredActive&&error?.name!=='AbortError')this.failed=true;}finally{if(epoch===this.epoch)this.starting=false;}}
    update(context,destination,input){
      if(context!==this.context){this.reset();this.context=context;}
      const active=input.active&&context?.state==='running',enabled=input.enabled&&input.volume>0;
      this.desiredActive=active&&enabled;
      const next=this.director.tick({...input,active,enabled,ended:this.ended,failed:this.failed,mediaTime:Number.isFinite(this.media?.currentTime)?this.media.currentTime:0});this.ended=false;this.failed=false;
      if(!next.cue){if(this.media)this.dispose();return next;}
      if(!enabled){this.dispose();return next;}
      if(this.cue!==next.cue.id){
        this.dispose();this.cue=next.cue.id;
        try{this.media=this.makeMedia(next.cue.file);this.media.preload='metadata';this.media.loop=false;
          this.gain=context.createGain();this.gain.gain.value=0;this.source=context.createMediaElementSource(this.media);this.source.connect(this.gain).connect(destination);
          const epoch=this.epoch;
          this.media.onended=()=>{if(epoch===this.epoch)this.ended=true;};this.media.onerror=()=>{if(epoch===this.epoch)this.failed=true;};
        }catch{this.failed=true;this.dispose();return next;}
      }
      if(!active){this.media.pause();this.paused=true;this.gain.gain.setTargetAtTime(0,context.currentTime,.08);return next;}
      if(this.paused)this.play();
      // File gain is measured during preparation; user volume is applied once
      // on the parent music bus. Do not add the old oscillator's tiny trim here.
      this.gain.gain.setTargetAtTime(clamp(next.level)*clamp(input.volume),context.currentTime,.12);
      return next;
    }
  }
  // Provisional local playtest selections, NOT listening-approved. Full sources,
  // licenses, exact edits and measurements are in assets/audio/world-music.json.
  const cues=[
    {id:'permafrost-closing',file:'assets/audio/world-permafrost-closing.mp3',duration:90,roles:['forest_walk','quiet_shore_evening']},
    {id:'hiraeth-closing',file:'assets/audio/world-hiraeth-closing.mp3',duration:90,roles:['quiet_shore_evening','cabin_rest']},
    {id:'solace-closing',file:'assets/audio/world-solace-closing.mp3',duration:90,roles:['cabin_rest']}
  ];
  const api={Director,Player,cues,listeningReviewed:false,role:s=>s.cabinHome?.inside?'cabin_rest':s.currentMap==='pond'||s.dayTime>.7?'quiet_shore_evening':'forest_walk'};
  root.PEWorldMusic=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
