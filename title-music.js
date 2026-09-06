(function(root){'use strict';
  let media=null,gain=null,timer=null,wanted=false,target=-1;
  function set(context,destination,active,volume,retry=false){
    const enabled=active&&volume>0;
    if(!media){
      if(!enabled)return;
      media=new root.Audio('assets/title-music.mp3');media.loop=true;media.preload='metadata';
      gain=context.createGain();gain.gain.value=0;
      context.createMediaElementSource(media).connect(gain).connect(destination);
    }
    if(enabled){
      if(timer!==null){root.clearTimeout(timer);timer=null;}
      if(!wanted||retry)media.play().catch(()=>{}); // A browser gesture can retry blocked autoplay.
    }else if(wanted){
      timer=root.setTimeout(()=>{media.pause();timer=null;},1000);
    }
    wanted=enabled;
    const edge=Math.min(1,media.currentTime/2,Number.isFinite(media.duration)?Math.max(0,(media.duration-media.currentTime)/3):1);
    const next=enabled?volume*.32*edge:0;
    if(next!==target){gain.gain.setTargetAtTime(next,context.currentTime,enabled?.3:.16);target=next;}
  }
  root.PETitleMusic={set};
})(typeof window!=='undefined'?window:globalThis);
