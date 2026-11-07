/* Small weight effects for character actions: wood chips, tree sway, falling leaves,
   running and stopping dust. Pure functions of engine time and the renderer's own
   motion memo – nothing here writes simulation or save state. "Reduce motion"
   (settings, defaulting to the OS preference) turns every effect and the axe
   hit-stop off. */
(function(root){'use strict';
 const KEY='timbertrail-reduce-motion';let reduced=null;
 function isReduced(){
  if(reduced===null){try{const v=root.localStorage?.getItem(KEY);reduced=v==null?!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches:v==='1';}catch{reduced=false;}}
  return reduced;
 }
 function setReduced(v){reduced=!!v;try{root.localStorage?.setItem(KEY,reduced?'1':'0');}catch{}return reduced;}
 const CONTACT=.45,SWING=.9;
 // Time since the latest axe contact of the current action (null before the first one).
 function axeContact(e){const a=e?.action;if(!a||!a.target||!['tree','log'].includes(a.target.type))return null;const t=Number(a.time);if(!(t>=CONTACT))return null;
  return {since:((t-CONTACT)%SWING+SWING)%SWING,type:a.target.type,x:a.target.x,id:a.target.id,away:Math.sign((a.target.x??0)-(e.state?.player?.x??0))||1};}
 // Crown sway in px for a standing tree node: 1–2 px away from the axe, settles in 0.3 s.
 function treeSway(e,node){if(isReduced())return 0;const c=axeContact(e);if(!c||c.type!=='tree'||c.since>.3)return 0;
  if(c.id!=null?c.id!==node.id:Math.abs((c.x??-1e9)-node.x)>30)return 0;return c.away*2*(1-c.since/.3)*Math.cos(c.since*Math.PI/.1);}
 const WOOD=['#e2c08a','#c9a26a','#a47343','#7d5634'],LEAF=['#b8823d','#9a6b2e','#c9a24a'],DUST='#8b7a5c';
 function px(c,x,y,w,h,col,a){c.globalAlpha=a;c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);}
 function draw(r,e){
  if(isReduced()||!r?.c||!e?.state)return 0;const c=r.c,s=e.state,p=s.player,f=p.facing||1,ground=x=>root.PE.ground(x,s.currentMap);let n=0;
  c.save();
  const hit=axeContact(e);
  if(hit){const tx=hit.x??p.x+f*28,g=ground(tx),o=hit.type==='tree'?[tx-hit.away*6,g-28]:[tx-hit.away*4,g-3];
   // Chips fly back toward the chopper in a short gravity arc.
   if(hit.since<.45)for(let i=0;i<5;i++){const t=hit.since,vx=-hit.away*(18+i*11),vy=-(46+i*13),x=o[0]+vx*t,y=Math.min(g,o[1]+vy*t+130*t*t);px(c,x,y,i%2?2:1,1,WOOD[i%4],1-t/.45);n++;}
   // Two leaves let go of the crown on each tree hit.
   if(hit.type==='tree'&&hit.since<.85)for(let i=0;i<2;i++){const t=hit.since,x=tx+(i?9:-7)+Math.sin(t*6+i*2)*5+hit.away*t*8,y=g-118+i*14+t*48;px(c,x,y,2,1,LEAF[i],Math.min(1,(.85-t)*4));n++;}
  }
  // Running: a few ground-coloured motes kick up behind each planted foot.
  if(p.moving&&p.running&&!p.crouching){const half=((Number(p.stride)||0)%Math.PI+Math.PI)%Math.PI/Math.PI,since=half*.29;
   if(since<.22){const foot=p.x+f*(12-since*145),g=ground(foot);for(let i=0;i<4;i++){px(c,foot-f*(2+i*3+since*18),g-1-since*(10+i*6)-(i%2),1,1,DUST,(1-since/.22)*.85);n++;}}}
  // Stopping from a run: a short spray ahead of the braking boot.
  const m=r._travellerMotion,now=(root.performance?.now?.()??Date.now())/1000;
  if(m?.kind==='stopRun'&&!p.moving){const age=now-(m.t0||0);if(age>=0&&age<.35)for(let i=0;i<6;i++){const g=ground(p.x+f*14);px(c,p.x+f*(12+i*2+age*30),g-1-age*(8+i*4)*(i%3?1:.5),1,1,DUST,(1-age/.35)*.8);n++;}}
  c.restore();return n;
 }
 const api=Object.freeze({isReduced,setReduced,axeContact,treeSway,draw});
 root.PEMotionFx=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
