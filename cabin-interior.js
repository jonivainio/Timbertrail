/* Sienilampi home: persistent furniture state, room navigation and safe storage. */
(function(root){'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),num=(v,d,a,b)=>Number.isFinite(v)?clamp(v,a,b):d;
const camera={zoom:1.5,top:84,width:640,height:360,min:320,max:640,speed:110};
function view(e){return {zoom:camera.zoom,left:clamp(home(e).x-camera.width/2,0,960-camera.width),top:camera.top};}
function toRoom(e,p){const v=view(e);return {x:p.x/v.zoom+v.left,y:p.y/v.zoom+v.top};}
function toScreen(e,p){const v=view(e);return {x:(p.x-v.left)*v.zoom,y:(p.y-v.top)*v.zoom};}
function visible(e,id){const o=fixtures.find(f=>f.id===id);if(!o)return false;const v=view(e),[x,y,w,h]=o.box;return Math.min(x+w,v.left+camera.width)-Math.max(x,v.left)>12&&Math.min(y+h,v.top+camera.height)-Math.max(y,v.top)>12;}
const fixtures=[
 {id:'door',name:'Go outside',x:132,box:[65,179,132,185]},
 {id:'kitchen',name:'Kitchen',x:288,box:[202,279,168,90]},
 {id:'hearth',name:'Fireplace',x:465,box:[414,273,99,95]},
 {id:'bed',name:'Sleep until morning',x:886,box:[813,260,144,99]},
 {id:'chest',name:'Storage chest',x:877,box:[817,363,130,78]},
 {id:'coffee',name:'Drink from the mug',x:719,box:[704,349,29,29]},
 {id:'jug',name:'Refill the mug',x:798,box:[784,378,30,49]},
 {id:'window',name:'Open / close the curtains',x:740,box:[688,143,89,98]},
 {id:'lantern',name:'Light / put out the lantern',x:625,box:[612,92,27,55]},
 {id:'chair',name:'Living room · a quiet moment',x:657,box:[584,262,133,100]},
 {id:'kajo',name:'Pet Kajo',x:572,box:[526,342,86,69]}
];
function restore(raw={},items={},durability={}){if(!raw||typeof raw!=='object')raw={};const h={inside:raw.inside===true,x:num(raw.x,camera.min,camera.min,camera.max),fire:{fuel:num(raw.fire?.fuel,0,0,900),lit:raw.fire?.lit===true},storage:{},tools:{},shutters:raw.shutters!==false,lantern:raw.lantern!==false,cupFull:raw.cupFull!==false,fixtures:{bed:true,chest:true,kitchen:true,living:true}};h.fire.lit=h.fire.lit&&h.fire.fuel>0;
 for(const id of Object.keys(items)){if(durability[id])h.tools[id]=(Array.isArray(raw.tools?.[id])?raw.tools[id]:[]).filter(Number.isFinite).slice(0,200).map(v=>Math.floor(clamp(v,1,durability[id])));else h.storage[id]=Math.floor(num(raw.storage?.[id],0,0,9999));}return h;}
function home(e){return e.state.cabinHome||(e.state.cabinHome=restore({},root.PE.items,root.PE.toolDurability));}
function begin(e,inside,sleep=false){if(e.transition||inside&&!e.cabinReady())return false;const h=home(e);if(!sleep&&h.inside===inside)return false;e.keys={};e.walkTarget=null;e.action=null;e.attack=null;e.fishing=null;e.projectiles=[];e.roomTarget=null;e.roomRest=false;e.state.player.moving=false;e.state.player.running=false;e.transition={room:inside,sleep,time:0,switched:false};e.sound(sleep?'sleep':'door',.4);return true;}
function advanceFire(f,dt){if(!f?.lit)return;f.fuel=Math.max(0,f.fuel-dt);if(f.fuel<=0)f.lit=false;}
function fade(e,dt){const tr=e.transition;tr.time+=Math.min(dt,.05);if(tr.time>=.45&&!tr.switched){tr.switched=true;const h=home(e);h.inside=tr.room;if(tr.sleep){const s=e.state,p=s.player,elapsed=(1-s.dayTime+.28)*900;s.day++;s.dayTime=.28;e.dailyWeather();advanceFire(h.fire,elapsed);for(const f of s.structures)advanceFire(f,elapsed);for(const r of Object.values(s.regions))for(const f of r.structures||[])advanceFire(f,elapsed);p.energy=100;p.warmth=Math.max(p.warmth,65);p.health=clamp(p.health+100/3,0,100);p.hunger=Math.max(1,p.hunger-12);p.thirst=Math.max(1,p.thirst-15);e.notify('Morning light fills the cabin. Kajo is still dozing.');}else if(tr.room)h.x=camera.min;else{e.state.player.x=root.PERegions.cabin.x;e.state.dog.x=e.state.player.x-45;e.state.dog.mode='sit';}e.emit('change');}if(tr.time>=1){e.transition=null;e.emit('save');}}
function hit(p,e){if(e)p=toRoom(e,p);return fixtures.find(o=>p.x>=o.box[0]&&p.x<=o.box[0]+o.box[2]&&p.y>=o.box[1]&&p.y<=o.box[1]+o.box[3]);}
function interact(e,id){const h=home(e),o=fixtures.find(v=>v.id===id);if(!h.inside||!o||e.transition||!visible(e,id))return false;e.roomTarget=null;e.state.player.moving=false;
 if(id==='door')return begin(e,false);
 if(['hearth','kitchen','bed','chest'].includes(id)){e.sound(id==='chest'?'chestOpen':id==='bed'?'cloth':'wood',.35);e.emit('panel',{panel:'home-'+id});return true;}
 if(id==='window'){h.shutters=!h.shutters;e.sound('cloth',.35);}
 if(id==='lantern'){h.lantern=!h.lantern;e.sound('fire',.25);}
 if(id==='coffee'){if(!h.cupFull){e.notify('The mug is empty. Refill it from the water jug.');return false;}h.cupFull=false;e.state.player.thirst=100;e.roomSteam=0;e.sound('drink',.6);e.notify('A refreshing drink.');}
 if(id==='jug'){h.cupFull=true;if(e.state.inventory.canteen)e.state.canteenFull=true;e.sound('pour',.55);e.notify('The mug is full.');}
 if(id==='chair'){e.roomRest=true;e.sound('cloth',.35);e.notify('A quiet moment at home. Move to get up.');}
 if(id==='kajo'){e.roomHeart=1.2;e.sound('dog',.2);}
 e.emit('change');e.emit('save');return true;}
function tick(e,dt){advanceFire(home(e).fire,dt);}
function update(e,dt){const s=e.state,h=home(e),p=s.player,depletedBefore=['hunger','thirst','warmth','energy'].filter(k=>p[k]<=0),manual=(e.keys.KeyD||e.keys.ArrowRight?1:0)-(e.keys.KeyA||e.keys.ArrowLeft?1:0);let dir=manual;
 e.roomTarget=null;if(manual)e.roomRest=false;
 // A/D pans the view, never an invisible walking actor (or its footsteps).
 p.moving=false;p.running=false;p.crouching=false;p.sitting=false;p.wading=false;if(dir&&!e.transition)h.x=clamp(h.x+dir*camera.speed*dt,camera.min,camera.max);
 p.energy=clamp(p.energy+dt*(e.roomRest?4:1.5),0,100);p.hunger=Math.max(0,p.hunger-dt*.045);p.thirst=Math.max(0,p.thirst-dt*.055);p.warmth=clamp(p.warmth+dt*(h.fire.lit?.85:(35-p.warmth)*.008),0,100);
 const empty=['hunger','thirst','warmth','energy'].filter(k=>p[k]<=0||depletedBefore.includes(k));p.health=clamp(p.health+dt*(empty.length?-root.PE.healthDrain(empty):.02),0,100);if(empty.length&&(!e.roomWarningAt||s.playSeconds>e.roomWarningAt)){e.notify('Empty needs drain health');e.roomWarningAt=s.playSeconds+30;}if(!p.health){p.health=35;p.hunger=30;p.thirst=30;p.energy=55;h.x=camera.max;e.notify('Kajo wakes you by the bed. You need food and water.');}
 e.roomHeart=Math.max(0,(e.roomHeart||0)-dt);e.roomSteam=Math.max(0,(e.roomSteam||0)-dt);e.sinceSave+=dt;if(e.sinceSave>15){e.sinceSave=0;e.emit('save');}}
function count(h,id){return h.tools[id]?.length||h.storage[id]||0;}
function storageUsed(h){return Object.keys(root.PE.items).reduce((n,id)=>n+count(h,id),0);}
function transfer(e,id,direction,amount=false){const h=home(e),s=e.state,item=root.PE.items[id],max=root.PE.toolDurability[id];if(!h.inside||e.transition||!Object.hasOwn(root.PE.items,id)||!item||!visible(e,'chest')||!['store','take'].includes(direction))return false;
 const available=direction==='store'?s.inventory[id]:count(h,id),free=Math.max(0,200-storageUsed(h));
 const n=amount===true?(max?1:Math.min(available,direction==='store'?free:available)):amount===false?1:amount;
 if(!Number.isSafeInteger(n)||n<1||n>available||(max&&n!==1)||direction==='store'&&n>free)return false;
 if(direction==='store'){if(max){if(!Number.isFinite(s.toolDurability[id])||s.toolDurability[id]<=0)return false;h.tools[id]||=[];h.tools[id].push(Math.min(max,s.toolDurability[id]));s.inventory[id]--;s.toolDurability[id]=s.inventory[id]?max:0;if(!s.inventory[id]&&s.equipped===id)s.equipped=null;}else{s.inventory[id]-=n;h.storage[id]=(h.storage[id]||0)+n;}}
 else{if(max){if(s.inventory[id]){e.notify('Store the matching tool first to preserve its condition.');return false;}s.inventory[id]=1;s.toolDurability[id]=h.tools[id].shift();}else{h.storage[id]-=n;s.inventory[id]+=n;}}
 e.sound('storage',.35);e.emit('change');e.emit('save');return true;}
function action(e,id){const h=home(e),s=e.state;if(!h.inside||e.transition)return false;
 if(id==='sleep'&&visible(e,'bed'))return begin(e,true,true);
 const cooking=['rawMeat','rawFish'].includes(id);if(!visible(e,cooking?'kitchen':'hearth'))return false;
 if(id==='wood'||id==='firewood'){if(s.inventory[id]<1||h.fire.fuel>=720)return false;s.inventory[id]--;h.fire.fuel=Math.min(900,h.fire.fuel+(id==='wood'?45:150));h.fire.lit=true;}
 else if(id==='extinguish')h.fire.lit=false;
 else if(id==='relight'){if(!h.fire.fuel)return false;h.fire.lit=true;}
 else if(['rawFish','rawMeat'].includes(id)){if(!h.fire.lit||!h.fire.fuel||s.inventory[id]<1)return false;s.inventory[id]--;s.inventory[id==='rawFish'?'cookedFish':'cookedMeat']++;e.finishTask('meal');}
 else return false;e.sound('fire',.45);e.emit('change');e.emit('save');return true;}
function panel(e,type,art,name){const h=home(e),s=e.state,T=x=>root.L?.text(x)||x;
 if(type==='home-bed')return `<div class="home-panel"><p>${T('Sleep until morning')}</p><p>${T('Rest restores energy and health. Food, water and firewood are still used overnight.')}</p><button class="primary" data-home-action="sleep">${T('Sleep until morning')}</button></div>`;
 if(type==='home-chest'){const column=(title,dir,source)=>`<section><h3>${T(title)}</h3><div class="storage-list">${Object.keys(root.PE.items).filter(id=>source(id)>0).map(id=>`<div class="storage-row">${art(id)}<span>${name(id)}<small> × ${source(id)}</small></span><button data-storage="${dir}" data-item="${id}">${dir==='store'?'→':'←'} 1</button><button data-storage="${dir}" data-item="${id}" data-all="true" ${root.PE.toolDurability[id]?'disabled':''}>${T('All')}</button></div>`).join('')||`<p>${T('Empty')}</p>`}</div></section>`;return `<div class="home-panel"><p>${T('Storage chest')} · ${Object.keys(root.PE.items).reduce((n,id)=>n+count(h,id),0)} / 200</p><div class="storage-columns">${column('Backpack','store',id=>s.inventory[id])}${column('Storage chest','take',id=>count(h,id))}</div><p>${T('Tool condition is preserved. Withdraw matching tools one at a time.')}</p></div>`;}
 const cooking=type==='home-kitchen';
 if(cooking)return `<div class="home-panel"><h3>${T('Kitchen')}</h3><p>${T(h.fire.lit&&h.fire.fuel>0?'The hearth is warm. Ready to cook.':'Light the fireplace before cooking.')}</p><div class="camp-options">${['rawMeat','rawFish'].map(id=>`<button data-home-action="${id}" ${h.fire.lit&&h.fire.fuel>0&&s.inventory[id]>0?'':'disabled'}>${art(id==='rawMeat'?'cookedMeat':'cookedFish')}${T('Cook')} · ${name(id)} (${s.inventory[id]})</button>`).join('')}</div></div>`;
 return `<div class="home-panel"><h3>${T(h.fire.lit?'A steady warmth':'Cold embers')} · ${Math.ceil(h.fire.fuel)} s</h3><p>${T('Add firewood here. Prepare meals at the kitchen counter.')}</p><div class="camp-options">${['wood','firewood'].map(id=>`<button data-home-action="${id}" ${s.inventory[id]>0&&h.fire.fuel<720?'':'disabled'}>${art(id)}${name(id)} · ${s.inventory[id]}<small>+${id==='wood'?45:150} s</small></button>`).join('')}</div><button class="text-button" data-home-action="${h.fire.lit?'extinguish':'relight'}" ${h.fire.fuel?'':'disabled'}>${T(h.fire.lit?'Put out the fire':'Light the fire')}</button></div>`;}
root.PECabin={camera,view,toRoom,toScreen,visible,fixtures,restore,home,begin,fade,hit,interact,tick,update,count,storageUsed,transfer,action,panel};if(typeof module!=='undefined')module.exports=root.PECabin;
})(typeof window==='undefined'?globalThis:window);
