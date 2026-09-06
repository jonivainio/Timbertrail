/* Original pixel characters and objects over an original generated forest painting. */
(function(root){
  'use strict';
  const {WIDTH:W,HEIGHT:H,TILE,random,clamp}=root.PE;let currentMap='forest';const ground=x=>root.PE.ground(x,currentMap);
  function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fill();}
  function line(c,points,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='miter';c.lineCap='square';c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.stroke();}
  function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h);}
  function oval(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(Math.round(x),Math.round(y),rx,ry,0,0,Math.PI*2);c.fill();}
  function shadow(c,x,y,w=18){oval(c,x,y+1,w,3,'#10170d88');}
  function flecks(c,x,y,w,h,colors,count,seed=1){for(let i=0;i<count;i++){const a=random(seed+i*2),b=random(seed+17+i*3);rect(c,x+a*w,y+b*h,1+Math.floor(random(i+seed+12)*2),1,colors[i%colors.length]);}}
  function woodDrop(c,d,y){
    const seed=d.variant??d.x,log=d.type==='log',length=log?42+random(seed)*9:25+random(seed)*12,radius=log?6:3,slope=Math.atan2(ground(d.x+15)-ground(d.x-15),30);
    shadow(c,d.x,y,length*.57);c.save();c.translate(Math.round(d.x),Math.round(y-radius+1));c.rotate(slope+(d.angle||0));
    const left=-length*.5,right=length*.5;
    poly(c,[[left,-radius+1],[right-2,-radius],[right+2,-radius*.2],[right,radius],[left+1,radius-1]],log?'#493c30':'#8f734d');
    // Bark stays on the curved exterior; only the split face is pale wood.
    for(let row=-radius+1;row<radius;row+=2){line(c,[[left+1,row],[right-1,row+(random(seed+row)-.5)*2]],['#6e5840','#382f27','#806448','#524132'][(row+radius)%4],1);}
    if(!log){poly(c,[[left,-radius+1],[right,-radius],[right-2,0],[left+3,1]],'#bc9b65');line(c,[[left+4,-1],[right-4,-2]],'#e0bc82',1);line(c,[[left+6,1],[right-6,0]],'#8d693d',1);}
    for(let i=0;i<(log?48:15);i++){const x=left+2+random(seed+i)*Math.max(1,length-5),yy=-radius+random(seed+i+31)*radius*2;rect(c,x,yy,1+random(i+17)*4,1,['#a48a6070','#282b23','#6f5840','#746341'][i%4]);}
    if(log){for(let i=0;i<4;i++){const x=left+5+i*length/5;line(c,[[x,-radius+1],[x+3,-1],[x+1,3]],'#292b24',1);}line(c,[[left+4,-radius],[left+11,-radius-1],[left+20,-radius]],'#82915a',2);rect(c,left+8,-radius-2,5,1,'#a0a376');}
    oval(c,right,0,log?4:2.5,radius,'#d0ad77');oval(c,right,0,log?2.7:1.2,radius*.65,'#947249');oval(c,right,0,log?1.8:.7,radius*.42,'#c0a071');line(c,[[right,0],[right+1,radius-1]],'#614c34',1);
    if(random(seed+51)>.4){line(c,[[left+9,-2],[left+7,-radius-4]],'#554432',log?3:2);rect(c,left+6,-radius-5,2,1,'#b39562');}c.restore();
  }
  function icon(c,type,x=0,y=0,size=48){if(root.PEIcons?.draw(c,type,x,y,size))return;c.save();c.translate(Math.round(x),Math.round(y));c.scale(size/48,size/48);
    if(root.PEEquipment&&root.PEEquipment.isTool(type)){root.PEEquipment.drawIcon(c,type);c.restore();return;}
    const branch=(a,b,d)=>line(c,[[a,b],[d,38]],'#35271e',5);
    if(type==='puukko'){
      line(c,[[11,41],[23,27]],'#38261d',8);line(c,[[11,39],[23,27]],'#a27340',6);line(c,[[12,37],[21,28]],'#d0a76c',2);rect(c,20,26,6,3,'#b3a173');poly(c,[[23,27],[25,18],[38,3],[35,16],[27,28]],'#434c4b');poly(c,[[25,26],[29,17],[38,3],[34,18],[28,28]],'#c1c9bb');line(c,[[26,24],[36,7]],'#e2dfbd',1);
    }else if(type==='firewood'){line(c,[[9,37],[35,12]],'#65492f',9);line(c,[[10,35],[35,12]],'#b2925e',5);line(c,[[11,35],[32,15]],'#d1b483',1);oval(c,35,12,4,3,'#d4b782');}
    else if(['knife','axe'].includes(type)){
      line(c,[[12,40],[29,13]],'#312822',6);line(c,[[12,39],[28,15]],'#99704d',4);line(c,[[14,35],[26,17]],'#d0a576',1);
      if(type==='axe'){poly(c,[[24,10],[32,9],[39,13],[39,23],[33,25],[25,19]],'#3c4241');poly(c,[[25,11],[32,10],[37,14],[37,22],[31,22],[26,18]],'#82918a');poly(c,[[34,12],[39,13],[39,23],[36,24]],'#d0d1b5');rect(c,27,13,3,4,'#515b51');}
      else{poly(c,[[23,21],[24,12],[35,4],[31,17],[27,24]],'#b8c6ba');line(c,[[26,18],[32,8]],'#e3e0bd',1);line(c,[[24,25],[29,25]],'#5e4935',3);}
    }else if(type==='bow'){
      line(c,[[14,4],[24,9],[30,18],[30,27],[25,36],[14,44]],'#372b1f',5);line(c,[[14,4],[24,10],[28,19],[28,28],[23,37],[14,44]],'#af8051',3);line(c,[[14,4],[17,25],[14,44]],'#ddd6a3',1);line(c,[[25,21],[28,26]],'#605032',3);
    }else if(type==='rod'){line(c,[[10,43],[20,20],[32,3]],'#3b2b1d',3);line(c,[[11,41],[23,15],[32,3]],'#ae8959',1);line(c,[[32,3],[39,11],[39,33]],'#cfcaab',1);rect(c,37,31,3,5,'#bb6845');}
    else if(type==='arrows'){line(c,[[10,39],[36,9]],'#bf9b6a',2);poly(c,[[34,8],[41,5],[38,13]],'#aeb5ae');poly(c,[[8,35],[10,42],[16,37],[13,33]],'#ced4bb');line(c,[[12,40],[31,17]],'#6b5138',1);}
    else if(type==='wood'){branch(8,12,35);branch(30,8,14);line(c,[[8,12],[35,38]],'#ad855c',3);line(c,[[30,8],[14,38]],'#896342',3);line(c,[[19,22],[29,21]],'#997448',2);rect(c,7,11,3,2,'#d1ae75');rect(c,28,7,4,3,'#c3a173');}
    else if(type==='stone'){poly(c,[[5,31],[10,17],[24,11],[36,17],[42,32],[30,38],[12,37]],'#434b49');poly(c,[[8,29],[14,18],[25,14],[35,20],[30,29],[16,32]],'#9b9e91');poly(c,[[16,32],[30,29],[38,24],[41,32],[30,36]],'#626f6d');line(c,[[15,20],[24,16],[29,18]],'#c2c1ac',2);rect(c,12,31,5,2,'#737e62');}
    else if(type==='fiber'){for(let i=0;i<6;i++)line(c,[[17+i*2,40],[12+i*4,23],[13+i*5,6+i%3*4]],i%2?'#a5ad62':'#54733e',2);line(c,[[15,30],[29,31]],'#c3a97c',3);line(c,[[19,33],[29,28]],'#725e3b',2);}
    else if(type==='cord'){line(c,[[15,35],[9,27],[12,15],[23,8],[34,13],[38,23],[31,34],[19,37],[15,31],[18,19],[26,16],[30,23],[25,30]],'#4b3b27',6);line(c,[[15,35],[9,27],[12,15],[23,8],[34,13],[38,23],[31,34],[19,37],[15,31],[18,19],[26,16],[30,23],[25,30]],'#bfa371',3);for(let i=0;i<7;i++)rect(c,11+i*3,14+(i%3)*7,2,2,'#e1c895');}
    else if(type==='berries'){line(c,[[12,37],[26,15],[32,9]],'#586b3b',2);poly(c,[[22,17],[15,10],[26,11],[29,15]],'#80974f');for(const[x,y]of[[14,26],[24,22],[29,30],[19,34],[33,21]]){oval(c,x,y,5,5,'#242c39');oval(c,x,y-1,4,3,'#5c6076');rect(c,x-2,y-3,2,1,'#a4a2b0');}}
    else if(type==='mushroom'){poly(c,[[21,21],[28,20],[27,34],[33,39],[19,40],[20,33]],'#c8bea0');poly(c,[[20,24],[24,23],[24,38],[19,40]],'#827b63');poly(c,[[5,24],[10,15],[22,9],[33,12],[41,22],[38,26],[23,28]],'#5c3629');poly(c,[[7,22],[13,15],[22,11],[32,14],[37,21],[27,23]],'#b4804c');line(c,[[14,16],[22,13],[28,15]],'#d5aa73',2);}
    else if(type.includes('Fish')){const cooked=type==='cookedFish';poly(c,[[4,16],[13,22],[25,14],[35,17],[43,24],[36,31],[23,34],[13,28],[4,35],[8,24]],cooked?'#805036':'#4d6870');poly(c,[[13,24],[24,17],[34,19],[39,24],[30,28],[19,28]],cooked?'#c89556':'#a4b9b0');line(c,[[20,29],[30,30]],cooked?'#e0b475':'#d4d4b7',2);rect(c,35,22,2,2,'#1e2625');for(let i=0;i<4;i++)line(c,[[18+i*4,22],[20+i*4,26]],cooked?'#794931':'#647f82');}
    else if(type.includes('Meat')){poly(c,[[7,19],[16,10],[33,12],[41,23],[35,35],[15,38],[7,31]],'#503e30');poly(c,[[10,20],[18,13],[31,15],[37,23],[32,31],[16,34],[10,28]],type==='rawMeat'?'#a2675c':'#a27445');oval(c,27,23,6,6,'#c8b697');oval(c,27,23,3,3,'#695540');line(c,[[13,25],[18,20],[21,21]],'#d4aa77',2);}
    else if(type==='hide'){poly(c,[[8,8],[19,12],[27,11],[37,7],[35,20],[40,29],[35,41],[26,35],[20,37],[9,42],[12,28],[7,18]],'#715238');poly(c,[[13,13],[24,15],[32,12],[30,24],[35,30],[29,34],[19,32],[14,36],[16,24]],'#bd9560');}
    else if(type==='compass'){oval(c,24,25,18,18,'#3b3527');oval(c,24,24,16,16,'#bba06a');oval(c,24,24,12,12,'#e0d5a9');poly(c,[[24,12],[28,26],[24,24],[20,22]],'#925642');poly(c,[[24,36],[20,22],[24,24],[28,26]],'#566567');oval(c,24,24,2,2,'#695842');}
    else if(type==='pack'){
      line(c,[[16,11],[17,5],[29,5],[32,12]],'#bd9b66',3);poly(c,[[11,11],[34,11],[40,22],[40,40],[8,40],[8,22]],'#342b22');poly(c,[[12,12],[33,12],[36,22],[36,38],[11,38],[11,23]],'#8f6848');poly(c,[[12,13],[32,13],[35,23],[12,23]],'#c09b65');rect(c,20,21,7,7,'#d0b87c');rect(c,22,23,3,3,'#634b33');rect(c,14,29,18,8,'#aa8055');rect(c,8,24,3,10,'#71543a');rect(c,36,24,4,10,'#69513c');
    }else if(type==='map'){poly(c,[[5,10],[18,6],[30,11],[43,7],[41,37],[29,41],[17,36],[4,40]],'#bcb68c');poly(c,[[6,11],[18,7],[17,35],[5,38]],'#e0d4aa');poly(c,[[30,12],[41,9],[39,36],[29,39]],'#d7c69a');line(c,[[12,28],[23,22],[32,28],[36,18]],'#746e4b',2);poly(c,[[24,11],[19,20],[29,20]],'#74825b');oval(c,33,29,3,3,'#b36143');}
    else if(type==='journal'){poly(c,[[7,7],[35,7],[40,11],[40,40],[7,40]],'#372b23');rect(c,10,9,27,28,'#8b7050');rect(c,11,9,3,28,'#c3a875');poly(c,[[24,15],[19,22],[22,28],[29,25],[31,17]],'#c7bc90');line(c,[[20,30],[29,17]],'#626447',1);rect(c,36,12,3,24,'#ddd0a5');}
    else if(type==='campfire'){for(let i=0;i<5;i++)oval(c,9+i*8,36+(i%2)*3,5,3,'#949483');line(c,[[13,33],[33,37]],'#896441',4);poly(c,[[16,31],[18,19],[23,23],[27,7],[32,24],[36,31],[28,36],[22,35]],'#bd633b');poly(c,[[23,32],[24,23],[28,19],[31,31],[27,34]],'#ead08a');}
    else if(type==='shelter'){line(c,[[7,39],[22,8],[42,39]],'#baa071',3);poly(c,[[23,9],[44,37],[12,37]],'#7d8560');poly(c,[[22,9],[27,37],[8,37]],'#354333');line(c,[[23,9],[28,34],[40,35]],'#a5a273',1);}
    else if(type==='trap'){line(c,[[9,40],[17,15],[27,15]],'#9d8155',3);line(c,[[25,15],[30,30],[24,39],[18,31],[25,15]],'#d0bd8b',1);}
    c.restore();
  }
  function person(c,x,y,facing,time,moving,crouch,equipped,action=false,npc=false){
    shadow(c,x,y,16);c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing,1);
    const stride=moving?Math.sin(time):0,bob=moving?Math.abs(Math.cos(time))*.9:Math.sin(time*.6)*.35;
    const hip=[-2,crouch?-18:-27],shoulder=[crouch?4:0,crouch?-33:-46],head=[crouch?9:2,crouch?-39:-53];
    const leg=(front)=>{const side=front?1:-1,foot=[side*stride*(crouch?5:9)+(crouch?(front?8:-10):0),-2],knee=crouch?[front?13:-7,-12]:[side*stride*5,-14];
      line(c,[hip,knee,foot],front?'#233a39':'#1b2a29',7);line(c,[[hip[0]+1,hip[1]+1],[knee[0]+1,knee[1]],[foot[0],foot[1]-2]],front?'#496461':'#314b48',4);line(c,[[knee[0]+2,knee[1]-1],[foot[0]+1,foot[1]-5]],front?'#728477':'#41594f',1);poly(c,[[foot[0]-3,-5],[foot[0]+3,-5],[foot[0]+6,-2],[foot[0]+6,0],[foot[0]-4,0]],'#2d2923');rect(c,foot[0]-2,-3,5,1,'#806c4c');};
    leg(false);c.translate(0,-bob);
    // A proper bent torso and knees, not a scaled-down standing sprite.
    poly(c,[[hip[0]-6,hip[1]+1],[shoulder[0]-7,shoulder[1]+2],[shoulder[0]-4,shoulder[1]-2],[shoulder[0]+6,shoulder[1]],[hip[0]+7,hip[1]]],'#3c3a2b');
    poly(c,[[hip[0]-4,hip[1]-2],[shoulder[0]-5,shoulder[1]+1],[shoulder[0]+4,shoulder[1]+1],[hip[0]+5,hip[1]-2]],npc?'#6c7053':'#b29b6c');
    line(c,[[shoulder[0]+1,shoulder[1]+4],[hip[0]+2,hip[1]-2]],'#ddc091',2);line(c,[[hip[0]-4,hip[1]-1],[hip[0]+6,hip[1]-1]],'#574b36',2);
    // Leather backpack, flap, straps and buckles.
    poly(c,[[shoulder[0]-10,shoulder[1]+2],[shoulder[0]-5,shoulder[1]+1],[hip[0]-5,hip[1]-3],[hip[0]-11,hip[1]-4]],'#302d24');
    poly(c,[[shoulder[0]-9,shoulder[1]+4],[shoulder[0]-5,shoulder[1]+3],[hip[0]-5,hip[1]-5],[hip[0]-9,hip[1]-6]],'#876844');line(c,[[shoulder[0]-9,shoulder[1]+6],[shoulder[0]-5,shoulder[1]+7]],'#b49c6d',2);line(c,[[shoulder[0]-4,shoulder[1]],[hip[0]-3,hip[1]-1]],'#66523b',2);rect(c,shoulder[0]-4,shoulder[1]+9,2,2,'#d1b379');
    // Face silhouette: nose, ear, brow, beard and a worn wool hat.
    const hx=head[0],hy=head[1];poly(c,[[hx-5,hy-3],[hx+5,hy-3],[hx+5,hy+2],[hx+8,hy+4],[hx+5,hy+5],[hx+4,hy+9],[hx-3,hy+7]],'#a57f56');
    poly(c,[[hx-2,hy-2],[hx+4,hy-2],[hx+4,hy+3],[hx+6,hy+4],[hx+3,hy+6],[hx,hy+5]],'#ddbc88');rect(c,hx+3,hy+1,1,1,'#293329');rect(c,hx-4,hy+1,2,3,'#c39c6a');line(c,[[hx+1,hy+7],[hx+4,hy+6]],'#62553b',2);
    poly(c,[[hx-6,hy],[hx-5,hy-6],[hx-1,hy-8],[hx+4,hy-7],[hx+6,hy-3],[hx+5,hy]],npc?'#555d47':'#7f4733');rect(c,hx-5,hy-3,11,3,npc?'#879071':'#ae6745');line(c,[[hx-3,hy-6],[hx+2,hy-6]],npc?'#a1a182':'#c38554',1);rect(c,hx+4,hy-2,4,1,'#c3915c');
    const hand=equipped==='bow'?[22,shoulder[1]+8]:action?[18,shoulder[1]+(Math.sin(time*2)*7)]:[8-stride*6,crouch?-20:-29],elbow=equipped==='bow'?[13,shoulder[1]+9]:[9-stride*3,shoulder[1]+12];
    line(c,[[shoulder[0]+4,shoulder[1]+4],elbow,hand],'#544e36',7);line(c,[[shoulder[0]+4,shoulder[1]+3],elbow,[hand[0],hand[1]-2]],npc?'#8b8c69':'#bea276',4);rect(c,hand[0]-1,hand[1]-2,4,4,'#d0ad7b');
    if(equipped){c.save();c.translate(hand[0]-6,hand[1]-18);c.rotate(equipped==='axe'&&action?Math.sin(time*2)*.8:equipped==='knife'?.5:0);icon(c,equipped,-5,-1,equipped==='bow'?34:26);c.restore();}
    c.translate(0,bob);leg(true);c.restore();
  }
  function dog(c,x,y,d,t){shadow(c,x,y,20);c.save();c.translate(Math.round(x),Math.round(y));c.scale(d.facing||1,1);
    const sitting=d.mode==='sit'||d.mode==='wait',sniff=d.mode==='sniff',run=d.moving,s=Math.sin(d.stride||t*4),back=sitting?-14:-8,headY=sniff?-10:-23;
    if(!sitting)for(let i=0;i<4;i++){const xx=i<2?-12:11,k=s*(i%2?1:-1)*4;line(c,[[xx,-13],[xx+k,-6],[xx+k*1.7,-1]],i%2?'#8c917d':'#3e4a46',3);rect(c,xx+k*1.7-1,-2,5,2,i%2?'#d4cbb0':'#75857a');}
    poly(c,[[-18,-12],[-17,-20],[-8,-24],[6,-24],[15,-20],[18,-11],[9,-8],[-11,back]],'#263b3e');
    poly(c,[[-16,-17],[-7,-22],[8,-22],[13,-16],[7,-13],[-10,-13]],'#586e73');line(c,[[-12,-21],[-2,-23],[7,-21]],'#8c9c95',2);
    poly(c,[[7,-21],[15,-25],[19,-17],[16,-9],[8,-9],[9,-15]],'#d2c9ac');poly(c,[[-12,-12],[-7,-14],[1,-12],[-1,-8],[-11,back]],'#967f58');
    if(sitting){oval(c,-10,-8,9,7,'#445655');poly(c,[[7,-15],[11,-15],[11,-2],[17,-2],[17,0],[6,0]],'#c5c5a8');rect(c,-10,-2,12,2,'#a0a48a');}
    const hx=15,hy=headY;poly(c,[[hx-5,hy-3],[hx+2,hy-6],[hx+8,hy-3],[hx+10,hy+2],[hx+17,hy+3],[hx+16,hy+8],[hx+8,hy+9],[hx+2,hy+5]],'#63797a');
    poly(c,[[hx+7,hy+1],[hx+12,hy+3],[hx+17,hy+3],[hx+15,hy+7],[hx+7,hy+7]],'#dfd4b5');poly(c,[[hx-1,hy-4],[hx+4,hy-5],[hx+5,hy+5],[hx+1,hy+7],[hx-3,hy+1]],'#293d42');rect(c,hx+8,hy,2,1,'#e3c793');rect(c,hx+9,hy+1,1,1,'#151d1c');rect(c,hx+16,hy+3,3,2,'#1c2929');line(c,[[9,headY+7],[15,headY+10]],'#9b5d3d',2);
    line(c,[[-15,-15],[-22,-11],[-29,-13+(run?s*2:Math.sin(t*2)*2)]],'#586e70',4);line(c,[[-26,-13],[-31,-17+(run?s*2:0)]],'#c5c6ac',3);c.restore();
  }
  function animal(c,a,t){const x=a.x,y=ground(x),dir=a.facing||1,moving=!!a.vx,step=moving?Math.sin(a.stride)*1:0;shadow(c,x,y,a.type==='deer'?25:a.type==='bear'?31:14);c.save();c.translate(Math.round(x),Math.round(y));c.scale(dir,1);
    if(a.type==='rabbit'){
      const hop=moving?Math.max(0,Math.sin(a.stride))*4:0;c.translate(0,-hop);oval(c,-3,-9,12,8,'#72766c');oval(c,-8,-8,7,7,'#949786');poly(c,[[3,-13],[6,-20],[13,-18],[18,-12],[15,-7],[6,-7]],'#aaac98');poly(c,[[6,-18],[4,-29],[7,-31],[11,-20]],'#a4a992');poly(c,[[10,-19],[12,-28],[15,-27],[14,-17]],'#c2bea6');line(c,[[7,-22],[6,-28]],'#756d66');rect(c,13,-15,2,2,'#202927');rect(c,17,-11,2,1,'#c3b4a0');oval(c,-16,-8,4,4,'#d8d5be');line(c,[[-9,-4],[-3+step*5,-1]],'#bab7a0',3);line(c,[[9,-5],[13-step*4,-1]],'#cecab0',2);flecks(c,-11,-15,13,8,['#8d9181','#b0ad96','#59695f'],18,3);
    }else if(a.type==='grouse'){
      line(c,[[-3,-6],[-4+step*3,0]],'#9b8d66',2);line(c,[[4,-7],[7-step*3,0]],'#a59670',2);poly(c,[[-10,-8],[-19,-21],[-9,-18],[-3,-17],[5,-22],[12,-19],[13,-14],[9,-12],[10,-7],[1,-4]],'#343e3b');oval(c,-1,-13,9,6,'#505a51');line(c,[[-6,-14],[2,-11]],'#818678',2);rect(c,10,-18,2,1,'#e5dcb9');rect(c,8,-20,4,2,'#ac573b');poly(c,[[13,-16],[17,-15],[13,-13]],'#aa9a67');flecks(c,-9,-15,12,8,['#697263','#939481','#343e3a'],14,21);
    }else{
      const bear=a.type==='bear',bodyY=bear?-22:-30,col=bear?'#4f4b3d':'#977e58',light=bear?'#766d55':'#bfa57b';
      for(let i=0;i<4;i++){const xx=i<2?-20:16,off=step*(i%2?1:-1)*(bear?5:8),k=xx+off*.5;line(c,[[xx,bodyY+6],[k,-12],[xx+off,-2]],i%2?col:'#514e3e',bear?7:4);line(c,[[k+1,-12],[xx+off+1,-5]],i%2?light:'#807456',1);rect(c,xx+off-2,-2,bear?7:5,2,'#30352c');}
      poly(c,[[-29,bodyY+3],[-25,bodyY-7],[-14,bodyY-11],[13,bodyY-9],[24,bodyY-3],[26,bodyY+8],[17,bodyY+13],[-16,bodyY+12],[-27,bodyY+9]],col);
      poly(c,[[-24,bodyY-5],[-12,bodyY-9],[12,bodyY-7],[19,bodyY-3],[4,bodyY+1],[-21,bodyY]],light);poly(c,[[-20,bodyY+8],[14,bodyY+9],[21,bodyY+5],[16,bodyY+12],[-12,bodyY+13]],bear?'#3c4037':'#c6bda0');
      if(!bear){const graze=!moving&&Math.sin(t*.4+a.home)>.3,hy=graze?-19:-52,hx=graze?34:26;poly(c,[[14,-32],[20,-39],[hx-4,hy],[hx+4,hy+3],[27,-25],[20,-20]],col);poly(c,[[hx-5,hy],[hx-2,hy-6],[hx+7,hy-5],[hx+13,hy+1],[hx+14,hy+5],[hx+8,hy+7],[hx-2,hy+4]],light);rect(c,hx+6,hy-2,2,2,'#273128');rect(c,hx+13,hy+3,3,2,'#414235');poly(c,[[hx-2,hy-4],[hx-8,hy-13],[hx-2,hy-14],[hx+3,hy-7]],'#c1b799');poly(c,[[hx+3,hy-5],[hx+9,hy-14],[hx+13,hy-14],[hx+8,hy-4]],'#a08f6c');line(c,[[-26,-24],[-30,-20]],'#d8d2b2',4);}
      else{oval(c,28,-23,13,11,col);oval(c,25,-33,4,4,'#514e3e');poly(c,[[31,-25],[43,-22],[43,-17],[33,-15],[28,-20]],'#918368');rect(c,40,-22,5,3,'#262e26');rect(c,32,-27,2,2,'#d0bc89');}
      flecks(c,-24,bodyY-6,44,13,[col,light,bear?'#615e4c':'#aa936c'],65,a.home);
    }c.restore();
  }
  function stump(c,x,y,seed=1){shadow(c,x,y,21);poly(c,[[x-17,y],[x-13,y-19],[x-16,y-39],[x-8,y-43],[x-3,y-37],[x+2,y-47],[x+7,y-40],[x+13,y-42],[x+12,y-16],[x+20,y]],'#352d23');poly(c,[[x-11,y-1],[x-9,y-36],[x-3,y-32],[x+3,y-39],[x+10,y-34],[x+9,y]],'#705738');for(let i=0;i<9;i++)line(c,[[x-11+i*2,y-4],[x-10+i*2+random(i)*2,y-30-random(i+seed)*7]],i%2?'#a38554':'#443f2c',i%3?1:2);poly(c,[[x-17,y],[x-15,y-6],[x-6,y-8],[x-5,y-2],[x+7,y-3],[x+14,y-9],[x+20,y-1]],'#69723c');flecks(c,x-15,y-8,32,7,['#8e9450','#515e32','#b1ab62'],40,seed);}
  function fern(c,x,y,size=25,t=0,dark=false){const sway=Math.sin(t*.6+x)*2;for(let j=-2;j<=2;j++){const tipX=x+j*size*.36+sway,tipY=y-size*(1-Math.abs(j)*.13);line(c,[[x,y],[tipX,tipY]],dark?'#1c3023':'#697443',1);for(let k=2;k<8;k++){const u=k/8,px=x+(tipX-x)*u,py=y+(tipY-y)*u,len=(1-u)*size*.29;line(c,[[px-len,py-2],[px,py],[px+len,py-4]],dark?(k%2?'#233a29':'#172b21'):(k%2?'#7f8747':'#465e37'),2);}}}
  function worldNode(c,n,y,t){const x=n.x;shadow(c,x,y,10);
    if(n.type==='tree'){stump(c,x,y,n.x);c.save();c.beginPath();c.moveTo(x-10,y-3);c.lineTo(x-10,y-33);c.lineTo(x+7,y-37);c.lineTo(x+10,y-3);c.closePath();c.clip();flecks(c,x-12,y-39,25,37,['#80734c','#44462f','#8c8051','#555537','#77643f','#a28a56'],220,n.x);c.restore();fern(c,x-14,y+2,13,t);return;}
    if(n.type==='wood'){
      line(c,[[x-14,y-2],[x-5,y-5],[x+2,y-4],[x+13,y-8]],'#352d22',4);line(c,[[x-13,y-3],[x-4,y-6],[x+3,y-5],[x+13,y-8]],'#9b8156',2);line(c,[[x+1,y-5],[x+4,y-12],[x+8,y-15]],'#725e3e',2);line(c,[[x-7,y-5],[x-11,y-9]],'#796847',1);flecks(c,x-10,y-6,23,3,['#bb9e6e','#595036','#746b44'],15,n.x);
    }else if(n.type==='stone'){
      poly(c,[[x-12,y-2],[x-10,y-10],[x-4,y-15],[x+4,y-14],[x+11,y-8],[x+13,y-1],[x+4,y+1],[x-7,y]],'#556157');poly(c,[[x-10,y-8],[x-3,y-13],[x+4,y-12],[x+9,y-7],[x+2,y-5]],'#939b87');poly(c,[[x-8,y-7],[x-1,y-6],[x+6,y-3],[x+3,y],[x-8,y-1]],'#6b776a');flecks(c,x-9,y-9,18,8,['#a5aa92','#6a7a67','#485c49','#919981'],36,n.x);line(c,[[x-11,y],[x-5,y-3],[x,y-1]],'#627342',2);
    }else if(n.type==='cord'){icon(c,'cord',x-11,y-18,22);
    }else if(n.type==='fiber'){
      for(let i=0;i<12;i++){const dx=random(i+x)*18-9,h=8+random(i+x+5)*15,sway=Math.sin(t+i)*.6;line(c,[[x+dx*.3,y],[x+dx*.7,y-h*.5],[x+dx+sway,y-h]],i%3===0?'#a6ad72':i%2?'#536d3c':'#7d9254',1);line(c,[[x+dx*.6,y-h*.4],[x+dx+3,y-h*.7]],'#708547',1);}
    }else if(n.type==='berries'){
      for(let i=0;i<6;i++){const xx=x-11+i*4,hh=6+random(i+x)*11;line(c,[[xx,y],[xx+2,y-hh]],'#506a3b',1);for(let j=0;j<3;j++){poly(c,[[xx,y-hh+j*4],[xx-4,y-hh+j*4-2],[xx-2,y-hh+j*4+2],[xx+2,y-hh+j*4+1]],i%2?'#748747':'#536e40');}oval(c,xx+2,y-hh+4,2,2,'#454b63');rect(c,xx+1,y-hh+3,1,1,'#9098a0');}
    }else if(n.type==='mushroom'){
      for(let i=0;i<3;i++){const xx=x+i*6-5,yy=y-i%2*3;line(c,[[xx,yy],[xx+1,yy-9]],'#c1b28b',2);poly(c,[[xx-5,yy-8],[xx-3,yy-12],[xx+1,yy-14],[xx+5,yy-11],[xx+6,yy-8]],'#91623e');line(c,[[xx-3,yy-11],[xx+1,yy-12],[xx+4,yy-10]],'#b18a54',1);rect(c,xx-3,yy-8,7,1,'#b0a17c');}
    }
  }
  function structure(c,s,t,makeCanvas){const x=s.x,y=ground(x);shadow(c,x,y,s.type==='shelter'?49:25);
    if(s.type==='fire'||s.type==='oldfire'){
      for(let i=0;i<9;i++){const a=i/9*Math.PI*2;oval(c,x+Math.cos(a)*19,y-3+Math.sin(a)*5,5,3,i%2?'#7e8270':'#515e54');rect(c,x+Math.cos(a)*19-1,y-5+Math.sin(a)*5,3,1,'#b5b197');}
      line(c,[[x-11,y-7],[x+11,y-2]],'#786045',4);line(c,[[x-10,y-2],[x+9,y-9]],'#9c7b4e',4);
      if(s.lit&&s.fuel>0){
        root.PEFire?.draw(c,x,y-5,31,37,t,s.x,clamp(s.fuel/30,.25,1),makeCanvas);
        for(let i=0;i<3;i++){const u=(t*.12+i/3)%1;oval(c,x+Math.sin(t*.45+i)*u*14,y-22-u*48,3+u*7,4+u*5,`rgba(151,156,135,${Math.sin(u*Math.PI)*.06})`);}
      }
    }else if(s.type==='shelter'){
      line(c,[[x-45,y],[x-10,y-54],[x+43,y]],'#463d2a',5);poly(c,[[x-11,y-56],[x+40,y-53],[x+67,y-2],[x+17,y-1]],'#566047');poly(c,[[x-11,y-54],[x+17,y-2],[x-43,y-2]],'#24352b');poly(c,[[x-10,y-50],[x+9,y-4],[x-37,y-4]],'#162921');line(c,[[x-11,y-55],[x+40,y-52],[x+66,y-3]],'#9b9d6c',2);for(let i=0;i<9;i++)line(c,[[x-5+i*5,y-47],[x+21+i*5,y-6]],i%2?'#6f7852':'#475b42',1);line(c,[[x+40,y-52],[x+85,y]],'#b0a481',1);rect(c,x-27,y-4,38,3,'#8f8b5a');
    }else{icon(c,'trap',x-18,y-33,36);}
  }
  function drawCold(r,warmth){const strength=clamp((18-warmth)/18,0,1);if(!strength)return;const c=r.c;if(!r._coldEdge){const layer=r.makeCanvas(W,H),l=layer.getContext('2d');
    // Sparse edge crystals, never an opaque winter mask across the playfield.
    for(let edge=0;edge<4;edge++){l.save();if(edge===1){l.translate(W,0);l.rotate(Math.PI/2);}if(edge===2){l.translate(W,H);l.rotate(Math.PI);}if(edge===3){l.translate(0,H);l.rotate(-Math.PI/2);}const length=edge%2?H:W,g=l.createLinearGradient(0,0,0,24);g.addColorStop(0,'#b9d8df32');g.addColorStop(1,'#b9d8df00');l.fillStyle=g;l.fillRect(0,0,length,24);
      for(let i=0;i<length/8;i++){const x=random(i+edge*330)*length,d=4+random(i+811)*17;l.strokeStyle='#d7e9ec39';l.lineWidth=.6;l.beginPath();l.moveTo(x,0);l.lineTo(x+3,d);for(let j=1;j<4;j++){const y=d*j/4;l.moveTo(x+3*j/4,y);l.lineTo(x-3+j,y-3);l.moveTo(x+3*j/4,y);l.lineTo(x+5+j,y-3);}l.stroke();}l.restore();}r._coldEdge=layer;}
    c.save();c.globalAlpha=strength;c.drawImage(r._coldEdge,0,0);c.restore();}
  class Renderer{
    constructor(canvas,forest,makeCanvas){this.canvas=canvas;this.makeCanvas=makeCanvas||((w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;});this.surface=this.makeCanvas(W,H);this.nearSurface=this.makeCanvas(W,H);this.c=this.surface.getContext('2d');this.forest=forest;this.hover=null;this.pointer=null;this.fade=new Map();}
    prop(kind,x,y,height,angle=0,opacity=1){if(!this.props)return false;const boxes={cabin:[28,24,602,534],shelter:[666,157,542,409],tree:[66,557,355,711],mound:[472,868,744,379]},b=boxes[kind],w=height*b[2]/b[3],c=this.c;c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.globalAlpha=opacity;c.drawImage(this.props,...b,-Math.round(w/2),-Math.round(height),Math.round(w),Math.round(height));c.restore();return true;}
    groundedProp(kind,x,y,height,angle=0){
      const width=kind==='cabin'?height*.53:kind==='shelter'?height*.57:kind==='tree'?height*.085:height*.65;
      root.PETerrainSurface?.socket(this,currentMap,x,y,width,false);this.prop(kind,x,y,height,angle);root.PETerrainSurface?.socket(this,currentMap,x,y,width,true);
    }
    harvestTree(x,angle=0){
      const c=this.c,variant=Math.floor(random(x+24)*3),height=[180,193,157][variant]+random(x)*20,y=ground(x)+4;
      if(!angle){root.PETerrainSurface?.socket(this,currentMap,x,y,23,false);if(root.PEWorldArt)root.PEWorldArt.contact(c,x,22,false);}
      if(this.treeVariants){const boxes=[[0,8,541,1006],[542,12,540,1002],[1082,219,454,795]],anchors=[265,792,1286],b=boxes[variant],k=height/b[3];c.save();c.translate(Math.round(x),Math.round(y));c.rotate(angle);c.drawImage(this.treeVariants,...b,Math.round((b[0]-anchors[variant])*k),-Math.round(height),Math.round(b[2]*k),Math.round(height));c.restore();}
      else this.prop('tree',x,y,height,angle);
      if(!angle){root.PETerrainSurface?.socket(this,currentMap,x,y,23,true);line(c,[[x-3,y-26],[x+4,y-25]],'#cab18788',1);if(root.PEWorldArt)root.PEWorldArt.contact(c,x,22,true);}
    }
    pose(index,x,y,facing){const boxes=[[16,56,278,470],[305,51,165,475],[510,59,268,467],[789,55,166,471],[31,719,201,276],[283,740,239,253],[526,542,232,460],[768,646,245,356],[6,1119,281,353],[313,1046,177,431],[497,1004,264,473],[784,1022,223,455]],anchors=[153,400,650,902,133,396,640,860,115,389,603,882],bases=[523,523,523,523,992,991,999,999,1469,1474,1474,1474],b=boxes[index],scale=.134,c=this.c;c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing,1);c.drawImage(this.poses,...b,Math.round((b[0]-anchors[index])*scale),Math.round((b[1]-bases[index])*scale),Math.round(b[2]*scale),Math.round(b[3]*scale));c.restore();}
    landscape(cam){if(root.PEWorldArt)root.PEWorldArt.drawLandscape(this,cam);else if(this.forest)this.c.drawImage(this.forest,0,0,W,H);}
    sprite(index,x,y,facing,scale){
      const boxes=[[89,44,166,522],[435,52,280,514],[815,58,310,507],[1238,238,223,328],[43,677,307,247],[395,686,358,240],[792,693,346,232],[1196,654,272,270]];
      const anchors=[190,576,967,1360,195,590,980,1360],baseline=index<4?563:922,b=boxes[index],c=this.c;
      c.save();c.translate(Math.round(x),Math.round(y));c.scale(facing,1);c.drawImage(this.sprites,...b,Math.round((b[0]-anchors[index])*scale),Math.round((b[1]-baseline)*scale),Math.round(b[2]*scale),Math.round(b[3]*scale));c.restore();
    }
    animalSprite(a){
      const types=['rabbit','grouse','deer','bear'],col=types.indexOf(a.type),frame=a.vx&&Math.floor(a.stride/2.1)%2?1:0;
      const boxes=[[62,124,244,320],[390,173,286,270],[743,83,332,374],[1106,165,413,289],[12,605,338,253],[384,534,324,336],[704,565,395,323],[1101,616,423,261]];
      const b=boxes[frame*4+col],scale=[.072,.09,.143,.15][col],w=Math.round(b[2]*scale),h=Math.round(b[3]*scale),c=this.c,y=ground(a.x),hop=a.mode==='flee'?Math.max(0,Math.sin(a.stride))*2:0;
      shadow(c,a.x,y,w*.4);c.save();c.translate(Math.round(a.x),Math.round(y-hop));c.scale(a.facing||1,1);c.drawImage(this.wildlife,...b,-Math.floor(w*.5),-h,w,h);c.restore();
    }
    draw(engine){const c=this.c,s=engine.state,t=s.playSeconds,cam=s.camera;c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;c.clearRect(0,0,W,H);
      if(s.cabinHome?.inside&&root.PECabinArt){root.PECabinArt.draw(this,engine);return;}
      currentMap=s.currentMap;root.PEWorldArt?.prepare?.(this,currentMap);
      c.fillStyle='#273c36';c.fillRect(0,0,W,H);
      this.landscape(cam);
      const daylight=.12+.88*Math.max(0,Math.sin((s.dayTime-.22)*Math.PI*2)),dawn=Math.exp(-Math.pow((s.dayTime-.29)/.085,2)),dusk=Math.exp(-Math.pow((s.dayTime-.73)/.09,2)),warm=Math.max(dawn,dusk);
      c.save();c.translate(-Math.round(cam),0);
      if(root.PEWorldArt)root.PEWorldArt.drawMid(this,engine);
      for(const water of engine.water)if(!water.wide&&!water.drinkOnly&&Math.abs(water.x-cam-W*.5)<W*.65){
        const y=ground(water.x),center=yy=>water.x+Math.sin((yy-y)*.035)*9+(yy-y)*.06,half=yy=>20+(yy-y)*.16;
        // Shallow water over pebbles: broken banks, tree reflections and small flowing highlights.
        for(let yy=y-13;yy<H;yy+=2){const xx=center(yy),w=half(yy),edge=Math.sin(yy*1.7)*2;
          rect(c,xx-w-7,yy,w*2+14,2,'#293b2c');rect(c,xx-w-3+edge,yy,w*2+6,2,'#63735a');
          const g=c.createLinearGradient(xx-w,yy,xx+w,yy);g.addColorStop(0,'#344b40');g.addColorStop(.32,'#4c6860');g.addColorStop(.7,'#243e3c');g.addColorStop(1,'#536d5b');c.fillStyle=g;c.fillRect(Math.round(xx-w),yy,Math.round(w*2),2);
        }
        for(let i=0;i<460;i++){const yy=y-12+random(i+46)*(H-y+12),xx=center(yy),w=half(yy),dx=(random(i+water.x)-.5)*w*1.86,flow=Math.sin(t*1.1+i)*2;rect(c,xx+dx+flow,yy,1+random(i+3)*5,1,['#7c8f6f66','#a6b3a14a','#152f3280','#314c4277','#c1cbb346'][i%5]);}
        for(let side of [-1,1])for(let i=0;i<36;i++){const yy=y-5+i*4,xx=center(yy)+side*(half(yy)+3+random(i)*9);oval(c,xx,yy,2+random(i+4)*5,2+random(i+7)*3,i%3?'#384637':'#6d7960');rect(c,xx-2,yy-2,3,1,i%2?'#929477':'#576845');}
        for(let i=0;i<4;i++){const xx=water.x-23+i*16,yy=y-2+(i%2)*3;shadow(c,xx,yy+3,9);poly(c,[[xx-9,yy],[xx-7,yy-5],[xx,yy-8],[xx+7,yy-5],[xx+10,yy+1],[xx+3,yy+3]],'#58675a');poly(c,[[xx-7,yy-5],[xx,yy-8],[xx+7,yy-5],[xx+2,yy-2]],'#a1a58a');flecks(c,xx-7,yy-4,15,5,['#8b927a','#3f5c42','#b4b498'],20,i);}
        fern(c,water.x+38,y,24,t);fern(c,water.x-38,y+12,19,t);
      }
      root.PERegionArt?.draw(this,engine);
      for(const n of engine.nodes){if(n.x<cam-105||n.x>cam+W+105||s.picked[n.id]>s.playSeconds)continue;const y=ground(n.x);if(n.type==='tree'&&this.props)this.harvestTree(n.x);else{if(['stone','wood'].includes(n.type))root.PETerrainSurface?.socket(this,currentMap,n.x,y+2,n.type==='stone'?11:14,false);c.save();if(['stone','wood'].includes(n.type)){c.translate(n.x,y+1);c.rotate(Math.atan2(ground(n.x+14)-ground(n.x-14),28));c.translate(-n.x,-y);}worldNode(c,n,y,t);c.restore();}}
      for(const f of s.falling||[]){const u=clamp(f.time/1.8,0,1);this.harvestTree(f.x,f.direction*u*u*Math.PI/2);}
      for(const d of [...(s.drops||[])].sort((a,b)=>(a.depth||0)-(b.depth||0))){if(d.carriedBy||d.x<cam-70||d.x>cam+W+70)continue;const y=ground(d.x)+(d.depth||0);
        if(['log','firewood'].includes(d.type))woodDrop(c,d,y);
        else if(d.type==='carcass'){if(this.wildlife){c.save();c.translate(d.x,y);c.rotate(.18);c.scale(1,.45);c.translate(-d.x,-y);this.animalSprite({type:d.species,x:d.x,facing:1,stride:0,vx:0});c.restore();}}
        else{c.save();c.translate(d.x,y);c.rotate(d.angle||0);c.translate(-d.x,-y);worldNode(c,d,y,t);c.restore();}
      }
      for(const obj of s.structures)if(obj.x>cam-100&&obj.x<cam+W+100){if(obj.type==='shelter'&&this.props)this.groundedProp('shelter',obj.x,ground(obj.x)+3,100);else{root.PETerrainSurface?.socket(this,currentMap,obj.x,ground(obj.x)+1,obj.type==='trap'?12:27,false);structure(c,obj,t,this.makeCanvas);}}
      if(engine.npc&&engine.npc.x>cam-180&&engine.npc.x<cam+W+180)this.groundedProp('cabin',engine.npc.x-6,ground(engine.npc.x)+8+(engine.npc.depth||0),196);
      for(const a of s.animals)if(a.alive&&a.x>cam-70&&a.x<cam+W+70){if(this.wildlife)this.animalSprite(a);else animal(c,a,t);}
      if(this.sprites){
        const p=s.player,d=s.dog,pframe=p.crouching?3:p.moving?1+Math.floor(p.stride/Math.PI)%2:0,dframe=d.moving?5+Math.floor(d.stride/Math.PI)%2:['sit','wait'].includes(d.mode)?7:4;
        shadow(c,d.x,ground(d.x),20);this.sprite(dframe,d.x,ground(d.x),d.facing,.132);
        if(root.PEEquipment&&root.PEEquipment.drawActor(this,engine)){}
        else{shadow(c,p.x,ground(p.x),16);let poseFrame=null;
          if(this.poses){if(engine.action){const a=engine.action,u=a.time/a.duration;poseFrame=['tree','log'].includes(a.target.type)?(a.time%.9<.42?6:a.time%.9<.66?7:8):u<.58?4:5;}else if(engine.attack)poseFrame=engine.attack.time<.32?10:11;else if(p.moving&&!p.crouching)poseFrame=Math.floor(p.stride/(Math.PI*.5))%4;else if(s.equipped==='bow'&&!p.crouching)poseFrame=9;}
          if(poseFrame!==null)this.pose(poseFrame,p.x,ground(p.x),p.facing);else this.sprite(pframe,p.x,ground(p.x)+(p.moving&&p.crouching?Math.sin(p.stride)*.6:0),p.facing,.12);
          if(s.equipped&&poseFrame!==6&&poseFrame!==7&&poseFrame!==8&&poseFrame!==9&&poseFrame!==10&&poseFrame!==11&&!engine.action){c.save();c.translate(Math.round(p.x+p.facing*(p.crouching?12:5)),Math.round(ground(p.x)-(p.crouching?21:29)));c.scale(p.facing,1);c.rotate(s.equipped==='axe'?.5:s.equipped==='puukko'?-.65:0);icon(c,s.equipped,-5,-4,s.equipped==='bow'?29:20);c.restore();}
        }
      }else{dog(c,s.dog.x,ground(s.dog.x),s.dog,t);person(c,s.player.x,ground(s.player.x),s.player.facing,s.player.moving?s.player.stride:t,s.player.moving,s.player.crouching,s.equipped,!!engine.action);}
      if(s.dog.mode==='retrieve'&&s.dog.fetchStage==='return'&&this.wildlife){const d=s.dog;c.save();c.translate(d.x+d.facing*18,ground(d.x)-19);c.scale(d.facing,1);c.rotate(.35);c.drawImage(this.wildlife,390,173,286,270,-10,-5,20,17);c.restore();}
      if(s.dog.mode==='fetch'){
        const d=s.dog,u=clamp((t-d.fetchStarted)/.65,0,1),carry=d.fetchStage==='return';
        const x=carry?d.x+d.facing*18:d.fetchFrom+(d.fetchX-d.fetchFrom)*u,y=carry?ground(d.x)-22:ground(x)-3-Math.sin(u*Math.PI)*49;
        line(c,[[x-7,y-2],[x+8,y+1]],'#bda06d',2);line(c,[[x+1,y],[x+3,y-4]],'#8e7950',1);
      }
      for(const a of engine.projectiles){const len=Math.hypot(a.vx,a.vy);line(c,[[a.x-a.vx/len*15,a.y-a.vy/len*15],[a.x,a.y]],'#d2bd89',1);rect(c,a.x,a.y,2,1,'#d6d4b6');}
      if(s.currentMap==='pond')root.PEFishingArt?.world(this,engine);
      else if(engine.fishing){const f=engine.fishing,p=s.player,tip=root.PEEquipment?root.PEEquipment.fishingLineOrigin(engine):{x:p.x+22,y:ground(p.x)-39},y=ground(f.x);line(c,[[tip.x,tip.y],[f.x,y-10]],'#c9c4a788',1);rect(c,f.x,y-8+Math.sin(t*5)*(f.stage==='bite'?4:1),3,5,'#cf9255');}
      if(this.hover?.box){} // Screen-readable construction outlines are drawn after lighting.
      else if(this.hover){const o=this.hover,y=ground(o.x),w=o.type==='tree'?24:o.type==='animal'?24:17;line(c,[[o.x-w,y-5],[o.x-w,y+3],[o.x-w+7,y+3]],'#e5d6a2',1);line(c,[[o.x+w-7,y+3],[o.x+w,y+3],[o.x+w,y-5]],'#e5d6a2',1);}
      c.restore();
      if(root.PEWorldArt?.drawLight)root.PEWorldArt.drawLight(this,engine);
      if(root.PEWorldArt)root.PEWorldArt.drawForeground(this,engine);
      c.fillStyle=`rgba(7,17,35,${(1-daylight)*.76+(s.weather==='rain'?.07:0)})`;c.fillRect(0,0,W,H);if(warm>.02){c.globalCompositeOperation='soft-light';c.fillStyle=`rgba(223,129,64,${warm*.46})`;c.fillRect(0,0,W,H);c.globalCompositeOperation='source-over';}
      // Relight the already night-tinted scene. Screen blending reveals actual ground
      // and object texture rather than painting an opaque orange disk over it.
      c.save();c.globalCompositeOperation='screen';
      for(const fire of s.structures){if(!fire.lit||fire.fuel<=0||fire.x<cam-180||fire.x>cam+W+180)continue;
        const x=fire.x-cam,y=ground(fire.x),pulse=.93+Math.sin(t*5.3)*.035+Math.sin(t*8.7+fire.x)*.025,strength=clamp(fire.fuel/30,.25,1)*pulse,radius=145;
        const g=c.createRadialGradient(x,y-14,2,x,y-14,radius);g.addColorStop(0,`rgba(255,169,72,${strength*.46})`);g.addColorStop(.28,`rgba(239,133,43,${strength*.21})`);g.addColorStop(1,'rgba(224,106,29,0)');c.fillStyle=g;c.fillRect(x-radius,y-radius-14,radius*2,radius*2);
        // A separate terrain-following pool catches the forest floor and nearby roots.
        for(let j=-95;j<=95;j+=5){const yy=ground(fire.x+j),a=Math.max(0,1-Math.abs(j)/100)*strength*.11;c.fillStyle=`rgba(247,170,77,${a})`;c.fillRect(x+j,yy-2,5,11);}
        const core=c.createRadialGradient(x,y-12,1,x,y-12,28);core.addColorStop(0,`rgba(255,208,115,${strength*.45})`);core.addColorStop(1,'rgba(255,170,70,0)');c.fillStyle=core;c.fillRect(x-28,y-40,56,56);
      }c.restore();
      if(s.weather==='rain'){c.globalAlpha=.3;for(let i=0;i<25+(s.rainIntensity??.3)*90;i++){const x=(random(i)*W+t*43)%W,y=(random(i+66)*H+t*280)%H;line(c,[[x,y],[x-3,y+10]],'#a0b3b0',1);}c.globalAlpha=1;}
      for(let i=0;i<38;i++){const x=(random(i+55)*W+t*(2+random(i)*3)-cam*.18+W*10)%W,y=70+random(i+17)*365+Math.sin(t*.3+i)*12;rect(c,x,y,1,1,daylight>.5?'#d0d8aa55':'#bbd99488');}
      const vignette=c.createRadialGradient(W*.52,H*.48,H*.25,W*.5,H*.5,W*.66);vignette.addColorStop(0,'#08171000');vignette.addColorStop(1,'#020b0780');c.fillStyle=vignette;c.fillRect(0,0,W,H);
      for(const e of engine.effects){
        if(e.kind==='heart'){const u=1-e.life/e.duration;c.save();c.globalAlpha=Math.min(1,u*9)*Math.pow(1-u,1.3);c.translate(Math.round(e.x-cam),Math.round(e.y));poly(c,[[-5,-5],[-2,-6],[0,-4],[2,-6],[5,-5],[6,-2],[0,5],[-6,-2]],'#dc8d87');rect(c,-3,-4,2,1,'#ffe3c5');c.restore();continue;}
        c.globalAlpha=clamp(e.life,0,1);c.font='12px Georgia';c.textAlign='center';const label=root.L?root.L.text(e.text):e.text;c.fillStyle='#0e211b';c.fillText(label,e.x-cam+1,e.y+1);c.fillStyle='#eee0b2';c.fillText(label,e.x-cam,e.y);c.globalAlpha=1;
      }
      if(engine.needBubble){
        const b=engine.needBubble,texts={hunger:'I need something to eat.',thirst:'I need some water.',energy:'I am exhausted. I need to walk.',warmth:'I need to get warm.'},labels=b.needs.map(k=>root.L?root.L.text(texts[k]):texts[k]);
        c.save();c.font='12px Georgia';c.textAlign='center';c.textBaseline='middle';
        const width=Math.max(138,...labels.map(v=>c.measureText(v).width+30)),height=labels.length*16+16,x=clamp(s.player.x-cam,width/2+12,W-width/2-12),bottom=ground(s.player.x)-(s.player.crouching?58:86),top=bottom-height;
        const age=b.duration-b.life,reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        c.globalAlpha=Math.min(1,age/.18,b.life/.45);if(!reduced){c.translate(x,top+height/2);c.scale(Math.min(1,.75+age*1.4),1);c.translate(-x,-top-height/2);}
        c.shadowColor='#08130fa0';c.shadowBlur=6;c.shadowOffsetY=3;
        const paper=c.createLinearGradient(0,top,0,bottom);paper.addColorStop(0,'#d4b781');paper.addColorStop(.25,'#f4e6bf');paper.addColorStop(1,'#deca99');c.fillStyle=paper;c.strokeStyle='#9b7948';c.lineWidth=1;
        c.beginPath();c.roundRect(x-width/2,top,width,height,4);c.fill();c.stroke();c.shadowBlur=0;c.shadowOffsetY=0;
        const tail=clamp(s.player.x-cam,x-width/2+16,x+width/2-16);poly(c,[[tail-5,bottom-1],[tail+4,bottom-1],[tail,bottom+8]],'#deca99');
        for(const side of [-1,1]){const xx=x+side*width/2-3,g=c.createLinearGradient(xx,0,xx+6,0);g.addColorStop(0,'#987344');g.addColorStop(.5,'#fff0c4');g.addColorStop(1,'#ba955d');c.fillStyle=g;c.beginPath();c.roundRect(xx,top-2,6,height+4,3);c.fill();}
        c.fillStyle='#42331f';labels.forEach((label,i)=>c.fillText(label,x,top+16+i*16));c.restore();
      }
      if(engine.action){const x=s.player.x-cam,y=ground(s.player.x)-74;rect(c,x-22,y,44,3,'#27392a');rect(c,x-22,y,44*engine.action.time/engine.action.duration,3,'#d5bf87');}
      if(s.equipped==='bow'&&this.pointer){const{x,y}=this.pointer;c.strokeStyle='#ede3beaa';c.lineWidth=.65;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.stroke();line(c,[[x-9,y],[x-6,y]],'#e2d1a4');line(c,[[x+6,y],[x+9,y]],'#e2d1a4');}
      drawCold(this,s.player.warmth);
      if(this.hover?.box){c.save();c.translate(-Math.round(cam),0);root.PERegionArt?.hover(this,engine);c.restore();}
      if(engine.transition){const tr=engine.transition,alpha=tr.time<.45?tr.time/.45:1-(tr.time-.45)/.55;c.fillStyle=`rgba(0,0,0,${clamp(alpha,0,1)})`;c.fillRect(0,0,W,H);}
      const output=this.canvas.getContext('2d');output.setTransform(1,0,0,1,0,0);output.imageSmoothingEnabled=false;output.clearRect(0,0,this.canvas.width,this.canvas.height);output.drawImage(this.surface,0,0,this.canvas.width,this.canvas.height);
    }
  }
  root.PEArt={drawCold,Renderer,icon,person,dog,animal};if(typeof module!=='undefined')module.exports=root.PEArt;
})(typeof window!=='undefined'?window:globalThis);
