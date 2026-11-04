/* Original 32px UI sprites. Never used by world rigs, fish animation or props. */
(function(root){'use strict';
const palette={ink:'#202b27',wood:'#6e5037',oak:'#aa8050',light:'#d2b17c',paper:'#e5d7b3',steel:'#6d8382',edge:'#b7c6b7',green:'#465b3b',leaf:'#8c9b59',red:'#995c49',gold:'#cc9c58',berry:'#344255',berryLight:'#75808f',water:'#709d9a'};
const ids=['puukko','knife','flintaxe','axe','bow','rod','arrows','wood','firewood','kindling','stone','fiber','cord','berries','mushroom','rawMeat','cookedMeat','hide','canteen','campfire','shelter','trap','journal','rawFish','cookedFish','pike','zander','perch'],fish=new Set(['rawFish','cookedFish','pike','zander','perch']),cache=new Map();
function create(id,makeCanvas){const a=makeCanvas(32,32),c=a.getContext('2d');c.imageSmoothingEnabled=false;
 const rect=(x,y,w,h,key)=>{c.fillStyle=palette[key]||key;c.fillRect(x,y,w,h);};
 const line=(x0,y0,x1,y1,key,w=1)=>{let dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1,e=dx+dy;for(;;){rect(x0-Math.floor(w/2),y0-Math.floor(w/2),w,w,key);if(x0===x1&&y0===y1)break;const d=e*2;if(d>=dy){e+=dy;x0+=sx;}if(d<=dx){e+=dx;y0+=sy;}}};
 const poly=(points,key)=>{const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);for(let y=Math.max(0,Math.min(...ys));y<=Math.min(31,Math.max(...ys));y++)for(let x=Math.max(0,Math.min(...xs));x<=Math.min(31,Math.max(...xs));x++){let hit=false;for(let i=0,j=points.length-1;i<points.length;j=i++){const u=points[i],v=points[j];if((u[1]>y+.5)!==(v[1]>y+.5)&&x+.5<(v[0]-u[0])*(y+.5-u[1])/(v[1]-u[1])+u[0])hit=!hit;}if(hit)rect(x,y,1,1,key);}};
 const stick=(x0,y0,x1,y1)=>{line(x0,y0,x1,y1,'ink',5);line(x0,y0,x1,y1,'wood',3);line(x0-1,y0-1,x1-1,y1-1,'oak');};
 if(fish.has(id)){
  if(!root.PEIcons?.draw(c,id,0,0,32))return null;
  // Small display sprite only. Keep supplied full-size catch/detail illustrations.
  const pixels=c.getImageData(0,0,32,32),colors=Object.values(palette).map(h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)));
  for(let i=0;i<pixels.data.length;i+=4){if(pixels.data[i+3]<110){pixels.data[i+3]=0;continue;}let best=colors[0],distance=Infinity;for(const color of colors){const d=color.reduce((s,v,k)=>s+(v-pixels.data[i+k])**2,0);if(d<distance){distance=d;best=color;}}pixels.data.set([...best,255],i);}c.putImageData(pixels,0,0);return a;
 }
 if(id==='knife'||id==='puukko'){
  stick(6,27,13,20);line(7,26,12,21,'light');
  if(id==='puukko'){
   // Straight spine, one continuous curved cutting edge, a birch grip and ferrule.
   poly([[12,18],[26,4],[28,4],[27,8],[24,13],[19,19],[16,22]],'ink');
   poly([[14,18],[26,6],[25,10],[22,15],[17,20]],'steel');
   poly([[16,19],[23,12],[26,6],[25,11],[22,16],[17,21]],'edge');
   line(14,18,24,8,'#819791');line(12,19,15,22,'gold',2);line(12,19,14,21,'light');
  }else{
   poly([[12,18],[16,12],[24,6],[27,7],[27,10],[24,13],[24,17],[17,22]],'ink');
   poly([[14,18],[17,13],[24,8],[25,9],[22,13],[22,16],[17,20]],'steel');
   poly([[17,16],[23,10],[22,14],[20,17],[17,20]],'edge');
   line(12,18,16,22,'wood',2);line(12,18,15,21,'light');line(10,21,13,24,'light');
  }
 }else if(id==='axe'||id==='flintaxe'){
  // Local haft axis (.6,-.8) and head axis (.8,.6) are perpendicular.
  // All head facets use this same socket, so the blade cannot drift off the haft.
  const point=(along,across)=>[Math.round(18+.6*along+.8*across),Math.round(10-.8*along+.6*across)];
  const head=(points,key)=>poly(points.map(p=>point(...p)),key);
  stick(6,26,18,10);line(7,25,15,14,'light');
  if(id==='axe'){
   head([[-3.5,-4],[3.5,-4],[3.5,0],[5.5,9.5],[1,10.5],[-5.5,9.5],[-3.5,1]],'ink');
   head([[-2.5,-3],[2.5,-3],[2.5,1],[4.5,8.5],[-4.5,8.5],[-2.5,1]],'steel');
   head([[-4,7],[4,7],[4.5,8.5],[-4.5,8.5]],'edge');
   head([[-2,-2],[1,-2],[2,5],[-2,5]],'#819791');
   head([[-1.5,-.5],[1.5,-.5],[1.5,1.5],[-1.5,1.5]],'wood');
  }else{
   head([[-3,-4],[3,-4],[4,0],[5,4],[4,8],[1,10],[-3,9],[-5,6],[-3,1]],'ink');
   head([[-2,-3],[2,-3],[3,0],[4,4],[3,7],[1,8],[-3,7],[-4,5],[-2,1]],'steel');
   head([[2,2],[3,4],[1,7],[-1,6]],'#819791');
   head([[-3,4],[-1,5],[-2,7],[-3,6]],'edge');
   head([[-2,1],[2,2],[1,6],[-3,5]],'green');
   for(const along of [-1,1]){const a=point(along,-3),b=point(along,3);line(...a,...b,'wood',2);line(...a,...b,'light');}
  }
 }else if(id==='bow'){
  const p=[[5,5],[12,4],[20,8],[26,16],[27,23],[25,28]];for(let i=1;i<p.length;i++){line(...p[i-1],...p[i],'ink',3);line(...p[i-1],...p[i],'oak');}line(5,5,25,28,'light');line(20,11,24,17,'wood',3);rect(22,13,1,2,'light');
 }else if(id==='rod'){
  stick(7,27,12,21);line(12,21,26,3,'ink',3);line(12,21,26,3,'oak');line(26,3,28,8,'light');line(28,8,28,24,'paper');rect(27,24,3,3,'red');rect(7,18,7,5,'ink');rect(9,19,4,3,'steel');rect(7,19,1,2,'light');
 }else if(id==='arrows'){
  for(const d of [-2,2]){line(7+d,27,23+d,6,'ink',3);line(7+d,27,23+d,6,'oak');poly([[20+d,7],[26+d,3],[25+d,10]],'edge');line(4+d,23,9+d,27,'paper',2);}
 }else if(['wood','firewood','kindling'].includes(id)){
  if(id==='wood'){stick(6,9,25,25);stick(22,6,9,25);stick(17,17,24,15);}
  else{stick(6,24,25,10);stick(10,27,27,15);line(7,23,24,10,'light');rect(24,8,4,4,'light');if(id==='kindling'){stick(6,14,22,26);line(7,13,22,24,'gold');}}
 }else if(id==='stone'){
  poly([[3,22],[7,12],[16,7],[24,11],[29,22],[23,27],[8,27]],'ink');poly([[5,21],[9,13],[16,9],[23,13],[26,20],[21,24],[9,25]],'steel');poly([[9,13],[16,9],[21,12],[17,16],[7,19]],'edge');line(14,23,23,19,'green');
 }else if(id==='fiber'){
  for(let i=0;i<5;i++){line(12+i,27,5+i*4,5+i%3,'ink',3);line(12+i,27,5+i*4,5+i%3,i%2?'leaf':'green');}rect(10,20,10,4,'wood');line(11,21,19,22,'light');
 }else if(id==='cord'){
  const p=[[11,26],[5,22],[5,12],[11,6],[23,6],[27,12],[27,22],[21,27],[12,27],[10,22],[10,15],[15,11],[21,13],[22,20],[18,23],[15,20]];for(let i=1;i<p.length;i++){line(...p[i-1],...p[i],'ink',4);line(...p[i-1],...p[i],'light',2);}rect(8,13,2,2,'paper');rect(23,12,2,2,'paper');
 }else if(id==='berries'){
  line(7,27,23,6,'green',2);poly([[14,10],[8,6],[16,5],[20,9]],'leaf');for(const [x,y]of[[8,17],[16,13],[22,19],[14,24]]){rect(x-2,y-2,8,8,'ink');rect(x-1,y-1,6,6,'berry');rect(x,y-1,3,2,'berryLight');rect(x-2,y,1,3,'leaf');}
 }else if(id==='mushroom'){
  poly([[13,16],[20,16],[19,25],[24,28],[12,29],[12,24]],'ink');poly([[15,17],[18,17],[17,26],[20,27],[14,27]],'paper');poly([[3,17],[5,11],[13,5],[22,7],[29,15],[28,19],[18,21],[5,20]],'ink');poly([[5,16],[8,11],[14,7],[21,9],[26,15],[21,17],[8,18]],'oak');line(10,11,15,9,'light');
 }else if(id==='rawMeat'||id==='cookedMeat'){
  poly([[4,13],[12,6],[24,9],[29,18],[25,26],[13,29],[4,24]],'ink');poly([[6,14],[13,8],[22,11],[26,18],[22,24],[13,26],[6,22]],id==='rawMeat'?'red':'oak');poly([[19,13],[23,16],[23,20],[19,23],[16,21],[16,17]],'paper');rect(18,17,3,3,'wood');line(8,16,13,12,id==='rawMeat'?'gold':'light');
 }else if(id==='hide'){
  poly([[5,4],[14,8],[21,8],[28,4],[26,14],[29,22],[24,29],[17,26],[8,29],[6,23],[8,15]],'ink');poly([[8,8],[14,11],[22,10],[23,15],[26,22],[22,26],[17,23],[10,26],[10,19]],'oak');line(10,13,12,22,'light');
 }else if(id==='canteen'){
  line(9,9,6,22,'wood',2);rect(13,3,8,4,'ink');rect(14,3,6,2,'steel');rect(11,7,12,2,'ink');poly([[10,9],[24,9],[27,14],[26,26],[21,29],[11,28],[7,23],[7,14]],'ink');poly([[11,11],[22,11],[25,15],[24,24],[20,27],[12,26],[9,22],[9,15]],'green');line(12,12,20,12,'leaf');rect(11,16,2,7,'leaf');line(10,23,23,22,'oak',2);
 }else if(id==='campfire'){
  stick(7,25,25,28);stick(7,28,26,25);poly([[8,22],[10,11],[15,16],[18,3],[23,13],[26,20],[23,25],[12,25]],'red');poly([[13,22],[14,15],[17,18],[19,10],[22,20],[20,23]],'gold');rect(16,19,3,4,'paper');for(const x of [4,10,21,26]){rect(x,27,4,3,'ink');rect(x,26,3,2,'steel');}
 }else if(id==='shelter'){
  poly([[15,4],[30,25],[5,25]],'ink');poly([[16,7],[27,23],[12,23]],'green');poly([[15,7],[17,24],[5,24]],'wood');stick(15,6,4,27);stick(16,6,28,27);line(19,10,26,21,'leaf');
 }else if(id==='trap'){
  stick(6,28,13,6);stick(13,6,24,6);const p=[[22,7],[27,17],[26,25],[20,28],[16,23],[17,15],[22,7]];for(let i=1;i<p.length;i++)line(...p[i-1],...p[i],'light');rect(10,27,17,2,'green');
 }else if(id==='journal'){
  rect(5,4,23,25,'ink');rect(7,5,18,22,'wood');rect(8,6,2,19,'oak');rect(25,7,2,19,'paper');poly([[16,10],[22,10],[21,15],[16,20],[13,17]],'leaf');line(14,20,21,11,'light');rect(9,25,15,1,'oak');
 }return a;
}
function draw(c,id,x=0,y=0,size=32,makeCanvas){if(!ids.includes(id)||!makeCanvas)return false;let a=cache.get(id);if(!a){a=create(id,makeCanvas);if(!a)return false;cache.set(id,a);}c.save();c.imageSmoothingEnabled=false;c.drawImage(a,Math.round(x),Math.round(y),size,size);c.restore();return true;}
root.PEUIIcons={draw,ids,palette,create};if(typeof module!=='undefined')module.exports=root.PEUIIcons;
})(typeof window==='undefined'?globalThis:window);
