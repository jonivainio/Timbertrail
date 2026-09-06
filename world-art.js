/* Timbertrail: finite, authored scenery; every midground object is a whole cutout. */
(function(root){
  'use strict';
  const {WIDTH:W,HEIGHT:H,WORLD,ground,random,clamp}=root.PE;
  const BW=4880,SW=1680,OVERLAP=80;
  const rect=(c,x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);};
  function line(c,p,color,width=1){c.beginPath();c.strokeStyle=color;c.lineWidth=width;for(let i=0;i<p.length;i++)i?c.lineTo(...p[i]):c.moveTo(...p[i]);c.stroke();}
  function terrain(renderer){
    if(renderer._terrain)return renderer._terrain;
    const canvas=renderer.makeCanvas(WORLD,H),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    c.beginPath();c.moveTo(0,H);for(let x=0;x<=WORLD;x+=4)c.lineTo(x,ground(x)-1);c.lineTo(WORLD,H);c.closePath();c.save();c.clip();c.fillStyle='#283123';c.fillRect(0,0,WORLD,H);
    const floorTexture=backdrop(renderer);
    for(let x=0;x<WORLD;x+=3){const sx=x/WORLD*BW,y=ground(x);c.drawImage(floorTexture,Math.min(BW-3,sx),H*.77,BW/WORLD*3,H*.23,x,y+4,3,H-y+18);}
    // Broken earth, roots and needle litter are on one physical walking surface.
    for(let x=0;x<WORLD;x+=2){const y=ground(x);rect(c,x,y,2,5+random(x)*7,'#76674980');rect(c,x,y+11+random(x+9)*3,2,2,'#29362290');}
    for(let i=0;i<23000;i++){const x=random(i+71)*WORLD,y=ground(x),depth=random(i+23)*31,col=['#b1a1786e','#7273478c','#33472dc9','#4e5a3399','#99875390','#24312480'][i%6];rect(c,x,y-1+depth,1+random(i+7)*3,1+random(i+22)*2,col);}
    for(let i=0;i<330;i++){const x=i*19+random(i)*12,y=ground(x);line(c,[[x,y+6],[x+8,y+8],[x+20,y+6],[x+29,y+12]],'#3e3727aa',2);line(c,[[x,y+5],[x+8,y+7],[x+19,y+5]],'#a18b5955',1);}
    c.restore();renderer._terrain=canvas;return canvas;
  }
  function backdrop(renderer){
    if(renderer._backdrop)return renderer._backdrop;
    const canvas=renderer.makeCanvas(BW,H),c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    for(let i=0;i<3;i++){const image=renderer.scenery[i],x=i*(SW-OVERLAP);if(!i){c.drawImage(image,x,0,SW,H);continue;}
      // Vertical joins blend only remote scenery. Never split an object across height layers.
      const fw=image.naturalWidth||image.width,fh=image.naturalHeight||image.height;
      for(let px=0;px<OVERLAP;px+=2){c.globalAlpha=px/OVERLAP;c.drawImage(image,px/SW*fw,0,2/SW*fw,fh,x+px,0,2,H);}c.globalAlpha=1;c.drawImage(image,OVERLAP/SW*fw,0,fw*(1-OVERLAP/SW),fh,x+OVERLAP,0,SW-OVERLAP,H);
    }
    renderer._backdrop=canvas;return canvas;
  }
  function drawLandscape(renderer,cam){
    const c=renderer.c;if(!renderer.scenery?.every(Boolean)){if(renderer.forest)c.drawImage(renderer.forest,0,0,W,H);return;}
    const bx=clamp(cam/(WORLD-W),0,1)*(BW-W);c.drawImage(backdrop(renderer),Math.round(bx),0,W,H,0,0,W,H);
    // Ground follows the player at 1:1; the unbroken forest behind it moves at 0.72:1.
    c.drawImage(terrain(renderer),Math.round(clamp(cam,0,WORLD-W)),0,W,H,0,0,W,H);
  }
  function brush(c,x,y,size,seed,t,near=false){
    const palette=near?['#14251a','#213623','#31482a','#526036']:['#2e492d','#455c34','#647445','#859051'];
    for(let j=0;j<7;j++){const angle=-2.7+j*.38,len=size*(.6+random(seed+j)*.4),tip=[x+Math.cos(angle)*len+Math.sin(t*.6+j)*1.5,y+Math.sin(angle)*len];line(c,[[x,y],tip],palette[1],1);
      for(let k=1;k<9;k++){const f=k/10,xx=x+(tip[0]-x)*f,yy=y+(tip[1]-y)*f,l=(1-f)*size*.19;line(c,[[xx-l,yy-2],[xx,yy],[xx+l,yy-3]],palette[(j+k)%4],2);}}
  }
  function drawMid(renderer,engine){const cam=engine.state.camera,c=renderer.c,t=engine.state.playSeconds;
    // Complete trees behind the path, with visible root bases and no gradient mask.
    for(const [x,h]of [[275,310],[1790,300],[2460,340],[3820,280],[4650,335],[5650,310],[6230,320]])if(x>cam-130&&x<cam+W+130){contact(c,x,25,false);renderer.prop('tree',x,ground(x)+5,h);contact(c,x,25,true);}
    for(const [x,h]of [[805,43],[2030,49],[2750,46],[3590,37],[4530,52],[5850,50]])if(x>cam-130&&x<cam+W+130){const radius=h*.65;contact(c,x,radius,false);renderer.prop('mound',x,ground(x)+6,h,Math.atan2(ground(x+radius)-ground(x-radius),radius*2));contact(c,x,radius,true);}
    for(let i=0;i<65;i++){const x=100+i*96+random(i)*40;if(x>cam-45&&x<cam+W+45)brush(c,x,ground(x)+4,12+random(i+77)*17,i,t,false);}
  }
  // Contact shadows, root fibres and needle litter follow the physical surface at
  // every sample. Only soil overlays the lowest roots: trunks remain upright/whole.
  function contact(c,x,radius,front=false){
    if(!front){c.beginPath();for(let dx=-radius;dx<=radius;dx+=2){const yy=ground(x+dx)+2-Math.sin((dx/radius+1)*Math.PI/2)*2;dx===-radius?c.moveTo(x+dx,yy):c.lineTo(x+dx,yy);}for(let dx=radius;dx>=-radius;dx-=2)c.lineTo(x+dx,ground(x+dx)+3+Math.sin((dx/radius+1)*Math.PI/2)*4);c.closePath();c.fillStyle='#15231699';c.fill();return;}
    for(let j=0;j<32;j++){const dx=(random(x+j*7)-.5)*radius*2,xx=x+dx,yy=ground(xx)+1+random(x+j)*4;rect(c,xx,yy,1+random(j+17)*3,1,['#616440','#8c8850','#435530','#39442b','#9c905b'][j%5]);}
    for(const sign of [-1,1]){const tip=x+sign*radius*.62;line(c,[[x+sign*3,ground(x)-2],[x+sign*radius*.28,ground(x+sign*radius*.28)+2],[tip,ground(tip)+2]],'#51462e',2);line(c,[[x+sign*radius*.28,ground(x+sign*radius*.28)+1],[tip,ground(tip)+1]],'#9b8a54',1);}
  }
  const foreground=[];
  // Dense clumps alternate with breathing room; composition is fixed to the route, not the screen.
  for(let i=0;i<34;i++){const x=160+i*210+random(i+99)*110,dense=(i>=3&&i<=9)||(i>=16&&i<=24)||i>28;
    if(dense||i%4===0)foreground.push({x,kind:i%5===0?'tree':i%3===0?'mound':'brush',size:i%5===0?410+random(i)*120:i%3===0?85+random(i)*60:55+random(i)*60,seed:i});
    if(dense)foreground.push({x:x+70,kind:'branches',size:60+random(i)*30,seed:i+80});
  }
  function drawForeground(renderer,engine){const c=renderer.c,s=engine.state,cam=s.camera,px=s.player.x-cam,t=s.playSeconds;
    for(const obj of foreground){const speed=obj.kind==='tree'?1.12:1.18,x=obj.x-cam*speed;if(x<-240||x>W+240)continue;
      const radius=obj.kind==='tree'?125:obj.kind==='mound'?110:85,goal=clamp((Math.abs(x-px)-radius*.5)/radius,.15,1),key='fg'+obj.seed,old=renderer.fade.get(key)??1,alpha=old+(goal-old)*.13;renderer.fade.set(key,alpha);
      c.save();c.globalAlpha=alpha;
      if(obj.kind==='tree')renderer.prop('tree',x,H+35,obj.size,0,alpha*.95);
      else if(obj.kind==='mound')renderer.prop('mound',x,H+28,obj.size,0,alpha);
      else if(obj.kind==='brush'){brush(c,x,H+6,obj.size,obj.seed,t,true);brush(c,x+20,H+14,obj.size*.7,obj.seed+10,t,true);}
      else{const y=H-20-random(obj.seed)*32;line(c,[[x-45,y+10],[x-20,y],[x+11,y-7],[x+49,y-3]],'#142318',8);line(c,[[x-44,y+8],[x-20,y-2],[x+13,y-9],[x+48,y-5]],'#46513a',2);for(let j=0;j<6;j++){const xx=x-30+j*12;line(c,[[xx,y+2-j],[xx+9,y-20-j*3],[xx+26,y-30-j*2]],j%2?'#233823':'#34462b',3);}}
      c.restore();
    }
  }
  root.PEWorldArt={drawLandscape,drawMid,drawForeground,contact,BACKGROUND_WIDTH:BW};
  if(typeof module!=='undefined')module.exports=root.PEWorldArt;
})(typeof window!=='undefined'?window:globalThis);
