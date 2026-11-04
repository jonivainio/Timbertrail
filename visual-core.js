/* Shared visual coordinates. Simulation, save data and hit targets stay 960 × 540. */
(function(root){'use strict';
  const finite=(name,value)=>{if(!Number.isFinite(value))throw new TypeError(name+' must be finite');return value;};
  const positive=(name,value)=>{finite(name,value);if(value<=0)throw new RangeError(name+' must be positive');return value;};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function projectX(x,camera,{parallax=1,scale=.5,origin=0}={}){
    [x,camera,parallax,origin].forEach(v=>finite('coordinate',v));positive('scale',scale);
    return Math.round((x-origin-camera*parallax)*scale);
  }
  function smooth(current,target,dt,tau=.18){
    [current,target,dt].forEach(v=>finite('smoothing value',v));positive('tau',tau);if(dt<0)throw new RangeError('negative dt');
    return current+(target-current)*(-Math.expm1(-dt/tau));
  }
  function reflectionSample(x,y,waterY,verticalScale=1,offset=0){
    [x,y,waterY,offset].forEach(v=>finite('reflection coordinate',v));positive('verticalScale',verticalScale);
    return y<waterY?null:{x:x+offset,y:waterY-(y-waterY)/verticalScale};
  }
  // One coherent wave field in world coordinates. No per-frame random calls.
  function waterOffset(worldX,depth,seconds,wind=0){
    [worldX,depth,seconds,wind].forEach(v=>finite('wave value',v));wind=clamp(wind,0,1);
    const amplitude=.65+wind*1.3;
    return amplitude*(Math.sin(depth*.19-seconds*(1.05+wind*.45)+worldX*.002)*.74+Math.sin(depth*.073+seconds*.69+worldX*.005)*.26);
  }
  function pointerToLogical(clientX,clientY,rect){
    [clientX,clientY,rect.left,rect.top].forEach(v=>finite('pointer coordinate',v));positive('width',rect.width);positive('height',rect.height);
    const x=clientX-rect.left,y=clientY-rect.top;
    return x<0||y<0||x>=rect.width||y>=rect.height?null:{x:x*960/rect.width,y:y*540/rect.height};
  }
  // A presentation-only crop; simulation, collision and save coordinates stay
  // unchanged. Edge easing exposes region exits without a sudden camera jump.
  function cameraView(state,zoom=1,artScale=null){
    positive('zoom',zoom);zoom=clamp(zoom,1,1.35);
    if(state.cabinHome?.inside||!state.running)zoom=1;
    // Whole native pixels with a 16:9 crop: avoid changing the sample phase
    // while the presentation camera eases near an exit. Input uses this same view.
    if(artScale!==null){positive('artScale',artScale);const nativeWidth=960*artScale;const cropWidth=clamp(Math.round(nativeWidth/zoom/16)*16,16,nativeWidth);zoom=nativeWidth/cropWidth;}
    const width=960/zoom,height=540/zoom,extra=960-width;
    const ease=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
    const cam=clamp(state.camera||0,0,5440);
    const snap=v=>artScale===null?v:Math.round(v*artScale)/artScale;
    const x=snap(extra*(.4*ease(cam/160)+.6*ease((cam-5280)/160)));
    return {x,y:snap((540-height)*.8),width,height,zoom};
  }
  const sceneToScreen=(p,v)=>({x:(p.x-v.x)*v.zoom,y:(p.y-v.y)*v.zoom});
  const screenToScene=(p,v)=>({x:p.x/v.zoom+v.x,y:p.y/v.zoom+v.y});
  function integerFit(artWidth,artHeight,cssWidth,cssHeight,dpr=1){
    [artWidth,artHeight,cssWidth,cssHeight,dpr].forEach(v=>positive('dimension',v));
    if(!Number.isInteger(artWidth)||!Number.isInteger(artHeight))throw new RangeError('fractional art buffer');
    const width=Math.floor(cssWidth*dpr),height=Math.floor(cssHeight*dpr),scale=Math.floor(Math.min(width/artWidth,height/artHeight));
    if(scale<1)return null;
    return {scale,physicalWidth:artWidth*scale,physicalHeight:artHeight*scale,left:Math.floor((width-artWidth*scale)/2)/dpr,top:Math.floor((height-artHeight*scale)/2)/dpr};
  }
  // Explicit ownership: a bounded pool of reusable surfaces, never one per frame.
  class SurfacePool{
    constructor(makeCanvas,limit=8){this.makeCanvas=makeCanvas;this.limit=limit;this.surfaces=new Map();}
    get(key,width,height){
      positive('width',width);positive('height',height);
      // Canvas dimensions are integers. Canonicalize before comparison as well
      // as allocation: 6400 * (2/3) must not evict its cached terrain each frame.
      width=Math.ceil(width);height=Math.ceil(height);const previous=this.surfaces.get(key);
      if(previous&&previous.width===width&&previous.height===height)return previous;
      if(!previous&&this.surfaces.size>=this.limit)throw new RangeError('Visual surface budget exceeded');
      const canvas=this.makeCanvas(width,height);this.surfaces.set(key,canvas);return canvas;
    }
    clear(){this.surfaces.clear();}
    get bytes(){return [...this.surfaces.values()].reduce((total,c)=>total+c.width*c.height*4,0);}
  }
  // Immutable scalars shared by scene, lighting and same-frame reflection passes.
  function snapshot(state){return Object.freeze({map:state.currentMap,camera:finite('camera',state.camera),seconds:finite('seconds',state.playSeconds),dayTime:state.dayTime,weather:state.weather,wind:clamp(state.rainIntensity||0,0,1),playerX:state.player.x});}
  const api={projectX,smooth,reflectionSample,waterOffset,pointerToLogical,cameraView,sceneToScreen,screenToScene,integerFit,SurfacePool,snapshot};
  root.PEVisualCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
