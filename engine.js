/* Pine & Ember — simulation, independent of the DOM and rendering. */
(function(root) {
  'use strict';
  const cabin=root.PECabin||(typeof require==='function'?require('./cabin-interior.js'):null);
  const regions=root.PERegions||(typeof require==='function'?require('./regions.js'):null);
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const needDamage={warmth:.025,hunger:.12,thirst:.35,energy:.04};
  const healthDrain=needs=>needs.reduce((sum,k)=>sum+(needDamage[k]||0),0);
  const random=n=>{const v=Math.sin(n*91.733+17.31)*43758.5453;return v-Math.floor(v);};
  const items={
    puukko:['Puukko','A Finnish carbon-steel knife with a curly-birch handle. Skins game faster and outlasts a flint knife.','tool'],
    firewood:['Large stick','A stout billet split from a fallen trunk. Excellent slow-burning campfire fuel.','material'],
    knife:['Piikiviveitsi','Terävä piikivi, puukahva ja varma ote. Tarvitaan tarkkoihin käsitöihin ja riistan nylkemiseen.','tool'],
    flintaxe:['Piikivikirves','Alkukantainen kivikirves. Hidas, mutta sillä kaataa kuusen ja pilkkoo rungon.','tool'],
    axe:['Teräskirves','Aarnin teräskirves. Nopeampi ja kestävämpi kuin piikivikirves.','tool'],
    bow:['Saarijousi','Hiljainen jousi metsälle. Varusta, tähtää hiirellä ja laukaise klikkaamalla.','tool'],
    rod:['Pajuvapa','Taipuisa vapa. Varusta ja klikkaa joen kalapaikkaa.','tool'],
    arrows:['Nuoli','Suora oksa ja piikivikärki. Yksi nuoli kuluu jokaisesta laukauksesta.','material'],
    wood:['Kuiva oksa','Metsän pohjalta kerättyä kuivaa puuta. Käsitöihin ja nuotion polttoaineeksi.','material'],
    stone:['Jokikivi','Sileä harmaa kivi työkaluihin ja nuotiokehään.','material'],
    fiber:['Kasvikuitu','Sitkeää luonnonkuitua. Kolmesta nipusta syntyy yksi naru.','material'],
    cord:['Kuitunaru','Käsin kierrettyä narua. Sitoo kirveenterän, jousen ja laavun.','material'],
    berries:['Variksenmarjat','Kirpeä pieni välipala. Palauttaa ruokaa ja hieman nestettä.','food'],
    mushroom:['Kangassieni','Tunnistettu syötävä sieni. Pieni eväs matkalle.','food'],
    rawFish:['Tuore kala','Kypsennä nuotiolla loimukalaksi.','raw'],
    cookedFish:['Loimukala','Lämmin, savuntuoksuinen ateria. Palauttaa ruokaa ja voimia.','food'],
    rawMeat:['Riistaliha','Kypsennä nuotiolla ennen syömistä.','raw'],
    cookedMeat:['Paistettu riista','Tukeva metsäretkeilijän ateria.','food'],
    hide:['Peurannahka','Pehmeä nahka. Aarni vaihtaa sen mielellään tarvikkeisiin.','material'],
    canteen:['Canteen','One full drink. Refill at drinking spots. The empty bottle is reusable.','material']
  };
  const toolDurability={knife:20,puukko:80,flintaxe:18,axe:75};
  const foodIds=['berries','mushroom','cookedFish','cookedMeat'];
  const recipes=[
    {id:'knife',need:{stone:2,wood:1},desc:'Ensimmäinen työkalu. Avaa kirveen, jousen ja vavan valmistuksen.'},
    {id:'cord',need:{fiber:3},desc:'Kierrä kolme kuitunippua yhdeksi kestäväksi naruksi.'},
    {id:'wood',name:'Kindling',need:{firewood:1},tool:'knife',toolAny:['knife','puukko'],amount:3,desc:'Shave one split billet into three small branches for crafting or lighting a fire.'},
    {id:'flintaxe',need:{stone:2,wood:3,cord:1},tool:'knife',toolAny:['knife','puukko'],desc:'Valmista ensin piikiviveitsi ja naru. Hidas kivikirves kaataa puun ja pilkkoo rankapuut.'},
    {id:'campfire',name:'Nuotiokehä',need:{stone:4,wood:4},tool:'flintaxe',toolAny:['flintaxe','axe'],structure:'fire',desc:'Rakenna jalkojesi viereen. Lämmittää ja kypsentää ruokaa.'},
    {id:'shelter',name:'Laavusuoja',need:{firewood:8,wood:4,fiber:6,cord:2},tool:'flintaxe',toolAny:['flintaxe','axe'],structure:'shelter',desc:'Oma lepopaikka. Nuku aamuun ja palauta voimasi.'},
    {id:'bow',need:{wood:4,cord:2},tool:'knife',toolAny:['knife','puukko'],desc:'Lähesty riistaa kyykyssä. Muista valmistaa myös nuolia.'},
    {id:'arrows',name:'Neljä nuolta',need:{wood:1,stone:1},tool:'knife',toolAny:['knife','puukko'],amount:4,desc:'Neljä nuolta saarijouseen.'},
    {id:'rod',need:{wood:3,cord:2},tool:'knife',toolAny:['knife','puukko'],desc:'Vapa veden äärelle. Nosta kala, kun koho nykäisee.'},
    {id:'trap',name:'Rihma-ansa',need:{wood:4,cord:1},tool:'knife',toolAny:['knife','puukko'],structure:'trap',desc:'Aseta polun reunaan. Tarkista minuutin kuluttua.'}
  ];
  const tasks=[['firstGather','Kerää oksia, kiviä ja kuitua'],['makeKnife','Valmista piikiviveitsi'],['makeAxe','Valmista piikivikirves'],['makeFire','Rakenna nuotio'],['makeShelter','Rakenna laavu'],['drink','Juo lähteestä'],['meet','Tapaa erakko Aarni'],['trade','Tee vaihtokauppa'],['meal','Valmista lämmin ateria']];
  const animalNames={rabbit:'Metsäjänis',grouse:'Teeri',deer:'Metsäpeura',bear:'Karhu'};
  const WIDTH=960,HEIGHT=540,WORLD=6400,TILE=1620;
  // One authored route, never wrapped or mirrored. Rocks, hollows and gentle rises.
  function ground(x,map='forest') {
    const h=[426,421,414,429,433,406,393,411,432,441,419,408,428,420,401,414,428,422,399,390,418,431,415,396,381,392,413,406,379,391,405,400,394],u=clamp(x/WORLD,0,1)*(h.length-1),i=Math.min(h.length-2,Math.floor(u)),f=u-i,e=f*f*(3-2*f);
    const base=h[i]+(h[i+1]-h[i])*e,smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v);};
    if(map==='pond'&&x>=780&&x<=4470){const blend=smooth((x-3940)/530);return (regions.pond.surface-2)+(base-(regions.pond.surface-2))*blend;}
    if(map==='river')for(const [start,end]of [[3540,3770],[5080,5320]])if(x>start-65&&x<end+65){const blend=smooth(Math.min(x-start+65,end+65-x)/65),ford=425+Math.sin(x*.018)*2;return base+(ford-base)*blend;}
    return base;
  }
  function fresh(){return {
    version:6,running:false,regions:{},visited:{forest:true},cabinRepairs:{},discovered:{berries:true},player:{x:565,facing:1,crouching:false,moving:false,running:false,sitting:false,hunger:88,thirst:86,energy:100,warmth:85,health:100,stride:0},
    dog:{x:506,facing:1,mode:'sit',delay:.8,idle:0,nextDecision:7,lastMoving:false,stride:0},
    canteenFull:false,inventory:Object.fromEntries(Object.keys(items).map(k=>[k,k==='berries'?3:0])),toolDurability:{},quickFood:'berries',quickTools:{knife:'knife',axe:'flintaxe'},equipped:null,
    structures:[{id:'oldfire',type:'oldfire',x:710,lit:false,fuel:0}],picked:{},completed:{},drops:[],falling:[],traders:{aarni:{introDone:false}},
    journal:{seen:{},hunted:{},caught:{}},day:1,dayTime:.38,weather:'clear',rainIntensity:0,currentMap:'forest',camera:181,playSeconds:0,rowanMet:false,traded:false,
    animals:[['rabbit',1510],['grouse',5480],['deer',2810],['bear',4660]].map(([type,x],i)=>({id:'a'+i,type,x,home:x,vx:0,facing:i%2?1:-1,hp:type==='bear'?5:type==='deer'?2:1,alive:true,mode:x>WORLD?'away':'graze',returnAt:150+i*25,timer:8+i,flight:0,stride:0}))
  };}
  class Engine {
    constructor(onEvent=()=>{}){
      this.state=fresh();this.pendingDismantle=null;this.sprintExhausted=false;this.needWarnings=new Set();this.needBubble=null;this.onEvent=onEvent;this.keys={};this.projectiles=[];this.effects=[];this.action=null;this.fishing=null;this.shotCooldown=0;this.sinceSave=0;this.walkTarget=null;this.attack=null;this.activeFire=null;
      this.water=[{type:'water',x:1295,id:'spring'},{type:'water',x:2945,id:'river'}];this.npc={type:'cabin',x:regions.aarni.x,depth:-regions.aarni.setback,id:'aarni'};
      this.nodes=[];
      const pattern=['wood','stone','fiber','berries','wood','mushroom','stone','fiber','tree'];
      for(let i=0,x=350;x<WORLD-100;i++,x+=58+random(i)*40)this.nodes.push({id:'n'+i,type:pattern[i%9],x:Math.round(x)});
      // The starting clearing always has enough reachable resources for the first tools.
      this.nodes.unshift(...[['wood',512],['stone',550],['fiber',592],['fiber',625],['stone',655]].map(([type,x],i)=>({id:'starter'+i,type,x})));
      for(let i=0,x=850;x<WORLD-180;i++,x+=250+random(i+90)*120)if(Math.abs(x-this.npc.x)>155)this.nodes.push({id:'spruce'+i,type:'tree',x:Math.round(x)});
      this.forestNodes=this.nodes;this.forestWater=this.water;this.forestNpc=this.npc;this.hotspots=[];this.transition=null;
    }
    configureRegion(id,initialize=false){
      if(!regions.maps[id])id='forest';const s=this.state;s.currentMap=id;this.hotspots=[];
      if(id==='forest'){this.nodes=this.forestNodes;this.water=this.forestWater;this.npc=this.forestNpc;}
      else{
        this.npc=null;this.nodes=[];const pattern=['wood','fiber','stone','berries','tree','wood','mushroom','fiber'];
        for(let i=0,x=180;x<WORLD-140;i++,x+=85+random(i+82)*55){if(id==='pond'&&(x>780&&x<3980||Math.abs(x-regions.cabin.x)<230||Math.abs(x-regions.pond.spring)<65))continue;if(id==='river'&&(Math.abs(x-regions.trail.x)<140||x>3510&&x<3800||x>5050&&x<5350))continue;this.nodes.push({id:id+'-node-'+i,type:pattern[i%pattern.length],x:Math.round(x)});}
        this.water=id==='river'?[{type:'water',id:'aarni-bank',x:4010,wide:true},{type:'water',id:'aarni-east',x:5610,wide:true}]:[{type:'water',id:'hilja-water',x:regions.pond.drink,wide:true,noFishing:true},{type:'water',id:'cabin-spring',x:regions.pond.spring,noFishing:true,drinkOnly:true,name:'Cabin spring'}];
        if(id==='river')this.hotspots.push({id:'hilja-trail',type:'exit',x:regions.trail.x,destination:'pond',spawn:6250,name:'Sienilampi',box:[-64,-175,166,180]});
        if(id==='pond'){
          // Three cohesive repair areas: the whole facade, the roof and the yard.
          for(const part of ['roof','yard','facade'])this.hotspots.push({id:'repair-'+part,type:'repair',part,x:regions.cabin.x,name:regions.cabin.parts[part].name,box:regions.cabin.parts[part].box.map((v,i)=>v*regions.cabin.scale-(i===1?regions.cabin.setback:0))});
          this.hotspots.push({id:'sienilampi-door',type:'cabinDoor',x:regions.cabin.x,name:'Enter cabin',box:regions.cabin.doorBox.map((v,i)=>v*regions.cabin.scale-(i===1?regions.cabin.setback:0))});
          this.hotspots.push({id:'jetty-chair',type:'chair',x:regions.pond.chair,name:'Sit by the water',box:[-19,-43,38,48]});
        }
      }
      if(initialize){s.picked={};s.drops=[];s.falling=[];s.cabinRepairs={};s.structures=id==='forest'?[{id:'oldfire',type:'oldfire',x:710,lit:false,fuel:0}]:[];s.animals=regions.maps[id].animals.map(([type,x],i)=>({id:id==='forest'?'a'+i:id+'-a'+i,type,x,home:x,vx:0,facing:i%2?1:-1,hp:type==='bear'?5:type==='deer'?2:1,alive:true,mode:'graze',returnAt:0,timer:8+i,flight:0,stride:0}));}
    }
    snapshotRegion(){return Object.fromEntries(regions.regionKeys.map(k=>[k,this.state[k]]));}
    requestTravel(id,x){if(cabin.home(this).inside){this.notify('Go outside before travelling.');return false;}if(!regions.canTravel(this.state,id)||this.transition)return false;this.walkTarget=null;this.action=null;this.attack=null;this.fishing=null;this.keys={};this.state.player.moving=false;this.state.player.running=false;this.state.player.sitting=false;this.transition={to:id,x:Number.isFinite(x)?x:regions.maps[id].spawn,time:0,switched:false};this.emit('change');return true;}
    enterRegion(id,x){if(this.state.cabinHome)this.state.cabinHome.inside=false;
      const s=this.state;for(const drop of s.drops)delete drop.carriedBy;s.regions[s.currentMap]=this.snapshotRegion();const previous=s.regions[id];this.configureRegion(id,true);if(previous)Object.assign(s,previous);s.visited[id]=true;
      s.player.x=clamp(x??regions.maps[id].spawn,80,WORLD-80);if(id==='pond')s.player.x=Math.max(regions.pond.walkMin,s.player.x);s.player.facing=s.player.x>WORLD/2?-1:1;s.player.moving=false;s.player.running=false;s.player.sitting=false;s.camera=clamp(s.player.x-WIDTH*.4,0,WORLD-WIDTH);Object.assign(s.dog,{x:clamp(s.player.x-s.player.facing*42,35,WORLD-35),mode:'sit',facing:s.player.facing,moving:false,retrieveId:null,delay:.6});
      this.keys={};this.action=null;this.attack=null;this.walkTarget=null;this.fishing=null;this.projectiles=[];this.effects=[];this.activeFire=null;this.pendingDismantle=null;this.endOfTrailShown=false;this.notify(regions.maps[id].name);this.emit('change');this.emit('save');
    }
    repairReady(part){const r=regions.cabin.parts[part];return !!(r&&this.state.currentMap==='pond'&&!this.state.cabinRepairs[part]&&Object.entries(r.need).every(([id,n])=>this.state.inventory[id]>=n));}
    rememberItems(){const s=this.state;s.discovered||={};for(const id of Object.keys(items))if(s.inventory[id]>0)s.discovered[id]=true;}
    toolReady(id){return !!(items[id]?.[2]==='tool'&&this.state.inventory[id]>0&&(!toolDurability[id]||this.state.toolDurability[id]>0));}
    hasAnyTool(ids){return ids.some(id=>this.toolReady(id));}
    isKnife(id){return id==='knife'||id==='puukko';}
    isAxe(id){return id==='flintaxe'||id==='axe';}
    toolOptions(recipe){return recipe.toolAny||(!recipe.tool?[]:[recipe.tool]);}
    restoreToolDurability(saved){
      const s=this.state;
      for(const [id,max] of Object.entries(toolDurability)){
        const value=saved?.[id];
        // Pre-durability saves keep all acquired tools at full strength.
        s.toolDurability[id]=s.inventory[id]>0?(Number.isFinite(value)?Math.floor(clamp(value,0,max)):max):0;
      }
    }
    consumeTool(id,amount=1){
      const s=this.state,max=toolDurability[id];
      if(!max||!this.toolReady(id))return false;
      s.toolDurability[id]=Math.max(0,s.toolDurability[id]-amount);
      if(s.toolDurability[id]===0){
        s.inventory[id]--;
        if(s.inventory[id]>0)s.toolDurability[id]=max;
        else if(s.equipped===id)s.equipped=null;
        this.notify(items[id][0]+' broke after hard use.');
      }
      return true;
    }
    recipeKnown(recipe){this.rememberItems();return Object.keys(recipe.need).every(id=>this.state.discovered[id]);}
    emit(type,data={}){if(type==='change'||type==='save')this.rememberItems();this.onEvent({type,...data});}
    notify(text){this.emit('notice',{text});}
    sound(name,intensity=1){this.emit('sound',{name,intensity});}
    start(saved=null){if(saved)this.load(saved);this.roomTarget=null;this.roomRest=false;this.roomSteam=0;this.roomHeart=0;this.roomWarningAt=0;this.sprintExhausted=this.state.player.energy<=0;this.needWarnings=new Set();this.needBubble=null;this.configureRegion(this.state.currentMap);this.transition=null;this.pendingDismantle=null;this.state.running=true;this.state.player.moving=false;this.state.player.sitting=false;this.endOfTrailShown=false;this.sinceSave=0;this.effects=[];this.keys={};this.action=null;this.fishing=null;this.walkTarget=null;this.attack=null;this.projectiles=[];this.emit('change');}
    load(saved,localOnly=false){
      const defaults=fresh(),safeNumber=(v,d,min,max)=>Number.isFinite(v)?clamp(v,min,max):d;
      this.state={...defaults,day:safeNumber(saved.day,1,1,9999),dayTime:safeNumber(saved.dayTime,.38,0,1),playSeconds:safeNumber(saved.playSeconds,0,0,1e9),weather:['clear','rain','mist'].includes(saved.weather)?saved.weather:'clear',rowanMet:!!saved.rowanMet,traded:!!saved.traded};
      this.state.rainIntensity=this.state.weather==='rain'?safeNumber(saved.rainIntensity,.3,.15,1):0;
      this.configureRegion(regions.maps[saved.currentMap]?saved.currentMap:'forest',true);
      for(const k of Object.keys(defaults.inventory))this.state.inventory[k]=Math.floor(safeNumber(saved.inventory?.[k],defaults.inventory[k],0,99999));
      this.restoreToolDurability(saved.toolDurability);
      for(const id of Object.keys(items))if(saved.discovered?.[id]===true)this.state.discovered[id]=true;
      // Older saves cannot remember every spent ingredient; completed products do prove these discoveries.
      for(const r of recipes)if(this.state.inventory[r.id]>0||(r.structure&&saved.structures?.some(v=>v.type===r.structure)))for(const id of Object.keys(r.need))this.state.discovered[id]=true;
      // Before v5, `axe` meant the crafted stone axe. Retain its spent-material discoveries,
      // while a v5 trader steel axe does not reveal a recipe the player has not learned.
      if((saved.version||0)<5&&this.state.inventory.axe>0)for(const id of ['stone','wood','cord'])this.state.discovered[id]=true;
      this.rememberItems();
      for(const k of ['hunger','thirst','energy','warmth','health'])this.state.player[k]=safeNumber(saved.player?.[k],defaults.player[k],0,100);
      this.state.player.x=safeNumber(saved.player?.x,565,80,WORLD-80);this.state.player.crouching=!!saved.player?.crouching;this.state.player.facing=saved.player?.facing===-1?-1:1;
      if(this.state.currentMap==='pond')this.state.player.x=Math.max(regions.pond.walkMin,this.state.player.x);this.state.dog.x=this.state.currentMap==='pond'?Math.max(regions.pond.walkMin+30,this.state.player.x-55):this.state.player.x-55;this.state.camera=clamp(this.state.player.x-WIDTH*.4,0,WORLD-WIDTH);
      this.state.quickFood=foodIds.includes(saved.quickFood)?saved.quickFood:defaults.quickFood;
      this.state.quickTools={knife:this.isKnife(saved.quickTools?.knife)?saved.quickTools.knife:this.state.inventory.puukko>0?'puukko':'knife',axe:this.isAxe(saved.quickTools?.axe)?saved.quickTools.axe:this.state.inventory.axe>0?'axe':'flintaxe'};
      this.state.equipped=items[saved.equipped]?.[2]==='tool'&&this.toolReady(saved.equipped)?saved.equipped:null;
      for(const [k] of tasks)this.state.completed[k]=!!saved.completed?.[k];
      if(saved.version>=2&&saved.picked&&typeof saved.picked==='object')for(const n of this.nodes)if(Number.isFinite(saved.picked[n.id]))this.state.picked[n.id]=saved.picked[n.id];
      if(Array.isArray(saved.structures))this.state.structures=saved.structures.filter(s=>['fire','oldfire','shelter','trap'].includes(s.type)&&Number.isFinite(s.x)).slice(0,60).map((s,i)=>({id:'loaded'+i,type:s.type,x:clamp(s.x,80,WORLD-80),lit:!!s.lit,fuel:safeNumber(s.fuel,s.lit?90:0,0,900),readyAt:safeNumber(s.readyAt,0,0,1e9),buildCost:this.structureCost(s)}));
      if(!Array.isArray(saved.structures)&&this.state.currentMap==='forest')this.state.structures=defaults.structures;
      for(const category of ['seen','hunted','caught'])for(const type of ['rabbit','grouse','deer','bear','fish'])if(saved.journal?.[category]?.[type])this.state.journal[category][type]=true;
      // Preserve v2 animal state; a v1 save keeps its inventory, progress and camp.
      if(saved.version>=3&&Array.isArray(saved.animals))for(const a of this.state.animals){const old=saved.animals.find(v=>v.id===a.id);if(old){a.x=safeNumber(old.x,a.x,-1800,WORLD+1800);a.alive=old.alive!==false;a.hp=safeNumber(old.hp,a.hp,0,5);a.respawnAt=safeNumber(old.respawnAt,0,0,1e9);a.returnAt=safeNumber(old.returnAt,0,0,1e9);a.mode=['away','flee','graze','walk'].includes(old.mode)?old.mode:'graze';a.departing=!!old.departing;a.facing=old.facing===-1?-1:1;}}
      this.state.traders.aarni.introDone=!!saved.traders?.aarni?.introDone;
      if(Array.isArray(saved.drops))this.state.drops=saved.drops.filter(d=>['log','wood','firewood','carcass','stone','fiber','cord'].includes(d.type)&&Number.isFinite(d.x)).slice(0,300).map((d,i)=>({id:'drop'+i,type:d.type,x:clamp(d.x,10,WORLD-10),species:animalNames[d.species]?d.species:'rabbit',amount:Math.floor(safeNumber(d.amount,1,1,1000)),angle:safeNumber(d.angle,(random(i+47)-.5)*.8,-1.2,1.2),depth:safeNumber(d.depth,random(i+13)*7-2,-4,9),variant:safeNumber(d.variant,i,0,1e8)}));
      if(Array.isArray(saved.falling))this.state.falling=saved.falling.filter(f=>Number.isFinite(f.x)).slice(0,30).map((f,i)=>({id:'fall'+i,x:f.x,time:safeNumber(f.time,0,0,1.8),direction:f.direction===-1?-1:1}));
      for(const part of Object.keys(regions.cabin.parts))this.state.cabinRepairs[part]=saved.cabinRepairs?.[part]===true;
      // Honor old individual door/window work by granting the merged facade, without another charge.
      if(saved.cabinRepairs?.door===true||saved.cabinRepairs?.windows===true)this.state.cabinRepairs.facade=true;
      this.state.cabinHome=cabin.restore(saved.cabinHome,items,toolDurability);
      if(saved.inventory?.compass>0&&!this.state.inventory.canteen)this.state.inventory.canteen=1;
      if(saved.cabinHome?.storage?.compass>0&&!this.state.inventory.canteen)this.state.cabinHome.storage.canteen=1;
      this.state.inventory.canteen=Math.min(1,this.state.inventory.canteen);this.state.cabinHome.storage.canteen=this.state.inventory.canteen?0:Math.min(1,this.state.cabinHome.storage.canteen||0);
      this.state.canteenFull=saved.canteenFull===true&&!!(this.state.inventory.canteen||this.state.cabinHome.storage.canteen);if(this.state.currentMap!=='pond'||!this.cabinReady())this.state.cabinHome.inside=false;
      if(!localOnly){
        for(const id of Object.keys(regions.maps)){if(saved.visited?.[id]===true)this.state.visited[id]=true;const raw=saved.regions?.[id];if(raw&&id!==this.state.currentMap){const validator=new Engine();validator.load({...raw,currentMap:id,version:6},true);this.state.regions[id]=validator.snapshotRegion();}}
        this.state.visited[this.state.currentMap]=true;
      }
    }
    recoverFromCollapse(){
      const s=this.state,p=s.player,shelter=s.structures.filter(f=>f.type==='shelter').sort((a,b)=>Math.abs(a.x-p.x)-Math.abs(b.x-p.x))[0];
      const fallback=s.currentMap==='pond'?regions.cabin.x:regions.maps[s.currentMap].spawn;
      p.x=clamp(shelter?.x??fallback,s.currentMap==='pond'?regions.pond.walkMin:80,WORLD-80);
      this.needBubble=null;this.needWarnings.clear();this.sprintExhausted=false;Object.assign(p,{health:65,hunger:55,thirst:55,warmth:60,energy:65,moving:false,running:false,sitting:false,crouching:false});
      this.keys={};this.walkTarget=null;this.action=null;this.attack=null;this.fishing=null;this.projectiles=[];this.effects=[];
      for(const drop of s.drops)delete drop.carriedBy;
      Object.assign(s.dog,{x:Math.max(s.currentMap==='pond'?regions.pond.walkMin+30:35,p.x-42),mode:'sit',moving:false,retrieveId:null,delay:.7});
      s.camera=clamp(p.x-WIDTH*.4,0,WORLD-WIDTH);
      this.notify('You collapsed. Kajo brought you back to safety. Rest, eat and drink.');this.emit('change');this.emit('save');
    }
    dailyWeather(){const s=this.state;s.weather=random(s.day+381)>.87?'rain':'clear';s.rainIntensity=s.weather==='rain'?(random(s.day+912)>.9?.95:random(s.day+18)>.6?.55:.25):0;}
    scatterDrop(type,x,index,spread){const s=this.state,seed=x*1.73+s.playSeconds*3.1+index*29.47,offset=(random(seed)-.5)*spread*2;const drop={id:type+'-'+s.playSeconds+'-'+s.drops.length+'-'+index,type,x:clamp(x+offset,25,WORLD-25),angle:(random(seed+17)-.5)*(type==='log'?.26:.7),depth:random(seed+29)*10-3,variant:Math.floor(random(seed+43)*10000),amount:1};s.drops.push(drop);return drop;}
    save(){this.rememberItems();this.state.regions[this.state.currentMap]=this.snapshotRegion();return JSON.stringify(this.state);}
    finishTask(id){if(!this.state.completed[id]){this.state.completed[id]=true;this.sound('task',.6);this.emit('change');}}
    setCrouch(value){this.state.player.sitting=false;if(this.state.player.crouching!==value){this.state.player.crouching=value;this.sound('rustle',.22);this.emit('change');}}
    assignQuickFood(id){
      if(!foodIds.includes(id))return false;
      this.state.quickFood=id;this.emit('change');return true;
    }
    assignQuickSlot(slot,id){
      if(!(this.state.inventory[id]>0))return false;
      if(slot==='food')return this.assignQuickFood(id);
      if(slot==='knife'&&!this.isKnife(id)||slot==='axe'&&!this.isAxe(id)||!['knife','axe'].includes(slot))return false;
      const s=this.state,previous=s.quickTools[slot];s.quickTools[slot]=id;
      if(s.equipped===previous)s.equipped=id;
      this.emit('change');return true;
    }
    use(id){
      if(this.action||this.attack)return this.notify('Finish the current action first.');
      const s=this.state;if(!(s.inventory[id]>0))return this.notify('Tämä esine täytyy ensin valmistaa tai kerätä.');
      if(id==='canteen'){if(!s.canteenFull){this.notify('The canteen is empty. Refill it at a drinking spot.');return false;}s.canteenFull=false;s.player.thirst=100;this.sound('drink',.65);this.notify('The canteen is empty now. Keep it to refill.');this.emit('change');this.emit('save');return true;}
      if(items[id][2]==='tool'){
        if(!this.toolReady(id))return this.notify('This tool is worn out. Craft or trade for a replacement.');
        s.equipped=s.equipped===id?null:id;if(this.isKnife(id))s.quickTools.knife=id;if(this.isAxe(id))s.quickTools.axe=id;this.sound('equip',.7);this.emit('change');return;
      }
      if(items[id][2]==='food'){
        const food={berries:[10,5,2],mushroom:[16,0,3],cookedFish:[38,0,20],cookedMeat:[44,0,24]}[id];
        if(s.player.hunger>=99&&s.player.energy>=99)return this.notify('Olet jo kylläinen ja levännyt.');
        s.inventory[id]--;['hunger','thirst','energy'].forEach((k,i)=>s.player[k]=clamp(s.player[k]+food[i],0,100));this.sound('eat',.65);this.notify(items[id][0]+' syöty.');this.emit('change');
      }
    }
    requirements(r){const tools=this.toolOptions(r);return Object.entries(r.need).every(([k,n])=>this.state.inventory[k]>=n)&&(!tools.length||this.hasAnyTool(tools));}
    craft(id){const r=recipes.find(v=>v.id===id);if(!r||this.action)return false;if(cabin.home(this).inside&&r.structure){this.notify('Build outdoor structures outside.');return false;}
      if(r.structure&&this.state.currentMap==='pond'&&this.state.player.x<3980){this.notify('Build on dry ground, away from the jetty.');return false;}
      if(r.structure&&this.state.currentMap==='pond'&&Math.abs(this.state.player.x+30-regions.pond.spring)<145){this.notify('Leave space around the spring. Build a little farther away.');return false;}
      if(!this.requirements(r)){this.sound('deny',.6);this.notify('Kerää ensin reseptissä näkyvät puuttuvat tarvikkeet.');return false;}
      if(r.structure&&this.state.structures.some(s=>Math.abs(s.x-this.state.player.x)<65)){this.notify('Siirry hieman kauemmas olemassa olevasta leiristä.');return false;}
      this.rememberItems();for(const[k,n]of Object.entries(r.need))this.state.inventory[k]-=n;
      if(r.structure){this.state.structures.push({id:'built'+this.state.playSeconds,type:r.structure,x:this.state.player.x+30,lit:false,fuel:0,readyAt:this.state.playSeconds+65,buildCost:{...r.need}});}
      else {this.state.inventory[id]+=(r.amount||1);if(toolDurability[id])this.state.toolDurability[id]=toolDurability[id];}
      const task={knife:'makeKnife',flintaxe:'makeAxe',campfire:'makeFire',shelter:'makeShelter'}[id];if(task)this.finishTask(task);
      this.sound('craft',.65);this.notify((r.name||items[id][0])+' valmistui.');this.emit('change');return true;
    }
    structureCost(o){const r=recipes.find(r=>r.structure===(o.type==='oldfire'?'fire':o.type));if(!r)return {};return Object.fromEntries(Object.entries(r.need).map(([id,n])=>[id,Number.isFinite(o.buildCost?.[id])?Math.floor(clamp(o.buildCost[id],0,1000)):n]));}
    structureActions(o){return o&&this.state.structures.some(s=>s.id===o.id)&&Object.keys(this.structureCost(o)).length?['use','dismantle']:[];}
    dismantleReturn(o){return Object.fromEntries(Object.entries(this.structureCost(o)).map(([id,n])=>[id,Math.floor(n/2)]).filter(([,n])=>n>0));}
    confirmDismantle(){
      const pending=this.pendingDismantle,s=this.state;if(!pending||pending.map!==s.currentMap||this.transition||this.action||this.attack)return false;
      const structure=s.structures.find(o=>o.id===pending.id);if(!structure||Math.abs(structure.x-s.player.x)>65)return false;
      const returns=Object.entries(this.dismantleReturn(structure));if(!this.structureActions(structure).length)return false;
      this.pendingDismantle=null;s.structures=s.structures.filter(o=>o!==structure);if(this.activeFire===structure.id)this.activeFire=null;
      returns.forEach(([type,amount],i)=>{const seed=Math.floor(s.playSeconds*1000)+i*47;const x=clamp(structure.x+(i-(returns.length-1)/2)*19+(random(seed)-.5)*9,35,WORLD-35);s.drops.push({id:'salvage-'+structure.id+'-'+seed+'-'+type,type,amount,x,angle:(random(seed+3)-.5)*.65,depth:random(seed+4)*6,variant:seed});});
      this.sound('wood',.55);this.notify('Dismantled. Gather the recovered materials from the ground.');this.emit('change');this.emit('save');return true;
    }
    cabinReady(){return this.state.currentMap==='pond'&&Object.keys(regions.cabin.parts).every(k=>this.state.cabinRepairs[k]);}
    hotspotActive(o){return o.type==='repair'?this.state.currentMap==='pond'&&!this.state.cabinRepairs[o.part]:o.type==='cabinDoor'?this.cabinReady():true;}
    activeHotspots(){return this.hotspots.filter(o=>this.hotspotActive(o));}
    targets(){const s=this.state;return [...this.nodes.filter(n=>!(s.picked[n.id]>s.playSeconds)),...s.drops.filter(d=>!d.carriedBy),...this.water,...s.structures,...this.activeHotspots(),...(this.npc?[this.npc]:[]),{type:'dog',x:s.dog.x,id:'dog'},...s.animals.filter(a=>a.alive&&a.mode!=='away'&&a.x>0&&a.x<WORLD).map(a=>({...a,type:'animal',species:a.type}))];}
    label(target){if(!target)return '';const s=this.state,far=Math.abs(target.x-s.player.x)>95;
      if(!this.hotspotActive(target))return '';
      if(['exit','chair','cabinDoor'].includes(target.type))return target.name;
      if(target.type==='repair')return target.name+' · Restore';
      let label=target.type==='animal'?animalNames[target.species]:({tree:'Spruce · fell with an axe',log:'Trunk · split with an axe',carcass:'Game · skin with a knife',cabin:"Aarni’s cabin · knock on the door",water:s.equipped==='rod'?'Heitä siima':'Juo lähteestä',npc:'Aarni · juttele',dog:'Kajo · heitä keppi',fire:'Nuotio · valmista ruokaa',oldfire:'Vanha nuotiokehä',shelter:'Laavu · lepää aamuun',trap:'Tarkista ansa'})[target.type]||('Kerää · '+items[target.type]?.[0]);
      return label+(far?' · click to approach':'');
    }
    interact(target){
      if(this.transition)return;
      if(!target||this.action||this.attack)return;const s=this.state,p=s.player;
      if(!this.hotspotActive(target))return;
      if(target.type==='animal'){if(s.equipped!=='bow')this.notify(animalNames[target.species]+' — lähesty kyykyssä.');return;}
      if(['tree','log'].includes(target.type)&&!this.isAxe(s.equipped))return this.notify('Equip a flint axe or steel axe from the top belt or backpack.');
      if(target.type==='carcass'&&!this.isKnife(s.equipped))return this.notify('Equip a flint knife or puukko to skin this animal.');
      const reach=target.type==='dog'&&target.command==='pet'?27:['tree','log','carcass','wood','stone','fiber','berries','mushroom','firewood'].includes(target.type)?28:60;
      if(Math.abs(target.x-p.x)>reach){this.walkTarget={...target,reach};this.fishing=null;return;}
      this.walkTarget=null;
      p.facing=target.x<p.x?-1:1;
      p.sitting=false;
      if(target.command==='dismantle'&&this.structureActions(target).length){this.pendingDismantle={id:target.id,map:s.currentMap};this.emit('panel',{panel:'dismantle'});return;}
      if(target.type==='exit'){this.requestTravel(target.destination,target.spawn);return;}
      if(target.type==='chair'){p.x=target.x;p.facing=-1;p.sitting=true;p.moving=false;this.notify('A quiet moment by Sienilampi. Move to stand up.');return;}
      if(target.type==='cabinDoor'){cabin.begin(this,true);return;}
      if(target.type==='repair'){
        if(!this.repairReady(target.part))return this.notify('Gather the materials shown above this part of the cabin.');
        this.action={target,time:0,duration:regions.cabin.parts[target.part].duration};this.sound('wood',.4);return;
      }
      if(target.type==='cabin'){s.rowanMet=true;this.finishTask('meet');this.emit('panel',{panel:'dialogue'});return;}
      if(target.type==='dog'){this.commandDog(target.command||'stick');return;}
      if(['fire','oldfire'].includes(target.type)){
        const fire=s.structures.find(v=>v.id===target.id);
        this.activeFire=fire.id;
        this.emit('panel',{panel:'fire'});return;
      }
      if(target.type==='shelter'){const home=cabin.home(this);home.fire.fuel=0;home.fire.lit=false;s.day++;this.dailyWeather();s.dayTime=.28;for(const f of s.structures){f.fuel=0;f.lit=false;}p.energy=100;p.warmth=95;p.health=clamp(p.health+100/3,0,100);p.hunger=clamp(p.hunger-12,1,100);p.thirst=clamp(p.thirst-15,1,100);this.sound('sleep');this.notify('Heräät uuteen aamuun. Kajo venyttelee vieressä.');this.emit('change');return;}
      if(target.type==='trap'){const trap=s.structures.find(v=>v.id===target.id);if(trap.readyAt>s.playSeconds)return this.notify('Ansa on viritetty. Tarkista vähän myöhemmin.');s.drops.push({id:'trapped-'+s.playSeconds,type:'carcass',species:'rabbit',x:target.x+24});s.journal.hunted.rabbit=true;trap.readyAt=s.playSeconds+90;this.notify('Game down. Approach with a flint knife or puukko to recover meat and hide.');this.sound('pickup');this.emit('change');return;}
      if(target.type==='water'){
        if(s.inventory.canteen&&!s.canteenFull){s.canteenFull=true;p.thirst=100;this.finishTask('drink');this.sound('pour',.6);this.notify('Canteen refilled.');this.emit('change');this.emit('save');return;}
        if(target.noFishing&&!target.drinkOnly&&s.equipped==='rod'){this.notify('Fishing at Sienilampi is coming later. Enjoy the water for now.');return;}
        if(s.equipped==='rod'&&!target.drinkOnly){if(!this.fishing){this.fishing={time:0,biteAt:2.5+random(s.playSeconds)*3,stage:'wait',x:target.x};this.sound('cast');this.emit('change');}return;}
        p.thirst=100;if(s.inventory.canteen){s.canteenFull=true;this.sound('pour',.5);this.notify('Canteen refilled.');}this.finishTask('drink');this.sound('water',.7);this.notify('Raikas lähdevesi sammuttaa janon.');this.emit('change');return;
      }
      const steel=s.equipped==='axe',puukko=s.equipped==='puukko';
      this.action={target,time:0,duration:target.type==='tree'?(steel?1.8:3.6):target.type==='log'?(steel?0.9:1.8):target.type==='carcass'?(puukko?1.45:2.35):.85};
      // Material contact plays at completion, not when reaching toward empty air.
    }
    fuelFire(item){const s=this.state,f=s.structures.find(f=>f.id===this.activeFire);if(!f||Math.abs(f.x-s.player.x)>100||!['wood','firewood'].includes(item)||s.inventory[item]<1)return false;if(f.fuel>=720)return this.notify('The fire already has plenty of fuel.');s.inventory[item]--;f.fuel=Math.min(900,(f.fuel||0)+(item==='wood'?45:150));f.lit=true;this.sound('fire',.6);this.emit('change');return true;}
    finishDialogue(){this.state.traders.aarni.introDone=true;this.emit('change');this.emit('save');}
    cook(id){const s=this.state;if(!['rawFish','rawMeat'].includes(id)||s.inventory[id]<1)return false;
      if(!s.structures.some(f=>f.lit&&Math.abs(f.x-s.player.x)<110)){this.notify('Mene ensin palavan nuotion äärelle.');return false;}
      s.inventory[id]--;s.inventory[id==='rawFish'?'cookedFish':'cookedMeat']++;this.finishTask('meal');this.sound('fire',.6);this.emit('change');this.notify('Ateria on valmis. Löydät sen repusta ja ylävalikosta.');return true;
    }
    trade(offer='canteen'){const s=this.state;if(!this.npc||cabin.home(this).inside||!s.traders.aarni.introDone||Math.abs(s.player.x-this.npc.x)>110)return false;
      if(offer==='arrows'){if(s.inventory.wood<5)return this.notify('Aarni needs five branches for this trade.');s.inventory.wood-=5;s.inventory.arrows+=8;}
      else if(offer==='puukko'){if(s.inventory.hide<1)return this.notify('Aarni asks for one hide.');s.inventory.hide--;s.inventory.puukko++;s.toolDurability.puukko=toolDurability.puukko;}
      else if(offer==='axe'){if(s.inventory.hide<2)return this.notify('Aarni asks for two hides for the steel axe.');s.inventory.hide-=2;s.inventory.axe++;s.toolDurability.axe=toolDurability.axe;}
      else if(offer==='canteen'){if(s.inventory.canteen||cabin.count(cabin.home(this),'canteen')||s.inventory.hide<2)return false;s.inventory.hide-=2;s.inventory.canteen=1;s.canteenFull=false;}else return false;
      s.traded=true;this.finishTask('trade');this.sound('trade');this.emit('change');this.notify('Trade complete. Your supplies are in the backpack.');return true;}
    reel(){if(!this.fishing)return;const f=this.fishing;this.fishing=null;if(f.stage==='bite'){this.state.inventory.rawFish++;this.state.journal.caught.fish=true;this.sound('catch');this.notify('Sait kalan! Kypsennä se nuotiolla.');}else{this.sound('miss',.5);this.notify('Kala pääsi karkuun. Odota, kunnes koho nykäisee.');}this.emit('change');}
    shoot(wx,wy){const s=this.state;if(s.equipped!=='bow'||this.shotCooldown>0||this.action||this.attack)return false;if(!s.inventory.arrows){this.notify('Nuolet loppuivat. Valmista lisää käsitöissä.');return false;}
      s.player.facing=wx<s.player.x?-1:1;this.walkTarget=null;this.attack={time:0,duration:.75,wx,wy,released:false};this.shotCooldown=.9;return true;
    }
    update(dt){
      if(this.transition?.room!==undefined){cabin.fade(this,dt);return;}
      if(this.transition){const tr=this.transition;tr.time+=Math.min(dt,.05);if(tr.time>=.45&&!tr.switched){tr.switched=true;this.enterRegion(tr.to,tr.x);}if(tr.time>=1)this.transition=null;return;}
      const s=this.state;if(!s.running)return;dt=Math.min(dt,.05);s.playSeconds+=dt;this.shotCooldown=Math.max(0,this.shotCooldown-dt);
      s.dayTime+=dt/900;if(s.dayTime>=1){s.dayTime-=1;s.day++;this.dailyWeather();}
      cabin.tick(this,dt);if(cabin.home(this).inside){cabin.update(this,dt);return;}
      const p=s.player,manual=(this.keys.KeyD||this.keys.ArrowRight?1:0)-(this.keys.KeyA||this.keys.ArrowLeft?1:0),shift=!!(this.keys.ShiftLeft||this.keys.ShiftRight);
      if(p.energy<=0)this.sprintExhausted=true;
      if(this.sprintExhausted&&p.energy>=15&&!shift)this.sprintExhausted=false;
      const sprint=!p.crouching&&shift&&!this.sprintExhausted&&p.energy>0;
      const depletedBefore=['hunger','thirst','warmth','energy'].filter(k=>p[k]<=0);
      if(manual){this.walkTarget=null;this.action=null;p.sitting=false;}
      let dir=manual;
      if(this.walkTarget&&!manual){const target=this.targets().find(t=>t.id===this.walkTarget.id);if(!target){this.walkTarget=null;}else if(Math.abs(target.x-p.x)<=this.walkTarget.reach-2){const command=this.walkTarget.command;this.walkTarget=null;this.interact({...target,command});}else dir=target.x<p.x?-1:1;}
      p.moving=!!dir&&!p.sitting&&!this.action&&!this.fishing&&!this.attack;p.running=!!(p.moving&&sprint);const wading=s.currentMap==='river'&&((p.x>3540&&p.x<3770)||(p.x>5080&&p.x<5320));p.wading=wading;const speed=(p.crouching?38:sprint?145:83)*(wading?.7:1);
      if(p.moving){p.facing=dir;p.x=clamp(p.x+dir*speed*dt,35,WORLD-35);p.stride+=dt*(p.crouching?5:sprint?13:8);if(sprint)p.energy=clamp(p.energy-dt*5,0,100);}
      if(p.energy<=0){this.sprintExhausted=true;p.running=false;}
      if(s.currentMap==='pond'&&p.x<regions.pond.walkMin){p.x=regions.pond.walkMin;p.moving=false;p.running=false;this.walkTarget=null;}
      if((p.x>=WORLD-38&&dir>0)||(p.x<=38&&dir<0)){const exit=regions.maps[s.currentMap].exits[dir>0?'right':'left'];if(exit){this.requestTravel(exit.map,exit.x);return;}if(!this.endOfTrailShown){this.endOfTrailShown=true;this.notify(s.currentMap==='pond'?'The reeds thicken here. Follow the bank back to the cabin.':'The trail beyond is not open yet.');}}
      if(p.x>160&&p.x<WORLD-160)this.endOfTrailShown=false;
      if(!sprint||!p.moving)p.energy=clamp(p.energy+dt*2,0,100);
      p.hunger=clamp(p.hunger-dt*.065,0,100);p.thirst=clamp(p.thirst-dt*.085,0,100);
      const nearFire=s.structures.some(f=>f.lit&&Math.abs(f.x-p.x)<110),night=s.dayTime<.22||s.dayTime>.8;
      p.warmth=clamp(p.warmth+dt*(nearFire?.9:night?(Math.min(p.warmth,s.weather==='rain'?5:8)-p.warmth)*.007:s.weather==='rain'?-.12:.025),0,100);
      const depleted=['hunger','thirst','warmth','energy'].filter(k=>p[k]<=0||depletedBefore.includes(k));
      if(this.needBubble){this.needBubble.life-=dt;if(this.needBubble.life<=0)this.needBubble=null;}
      for(const k of ['hunger','thirst','warmth','energy'])if(p[k]>10)this.needWarnings.delete(k);
      const newWarnings=depleted.filter(k=>!this.needWarnings.has(k));
      if(newWarnings.length){for(const k of newWarnings)this.needWarnings.add(k);this.needBubble={needs:[...new Set([...(this.needBubble?.needs||[]),...newWarnings])],life:4.5,duration:4.5};}
      p.health=clamp(p.health+dt*(depleted.length?-healthDrain(depleted):.02),0,100);
      if(p.health<=0){this.recoverFromCollapse();return;}
      s.camera+=(clamp(p.x-WIDTH*.4,0,WORLD-WIDTH)-s.camera)*Math.min(1,dt*6);
      if(this.action){const a=this.action,previous=a.time;a.time+=dt;
        // Equipment animation has four .225s frames: the head contacts wood halfway through
        // each .9s swing. Sound only at that contact, never at action start.
        if(['tree','log'].includes(a.target.type)){const first=Math.floor((previous-.45+1e-7)/.9),last=Math.floor((a.time-.45+1e-7)/.9);for(let swing=first+1;swing<=last;swing++)this.sound('axe',.65);}
        if(a.target.type==='pet'&&previous<.4&&a.time>=.4)this.effects.push({kind:'heart',x:s.dog.x,y:ground(s.dog.x,s.currentMap)-39,life:1.05,duration:1.05});
        if(a.time>=a.duration){this.completeAction(a.target);this.action=null;this.emit('change');}}
      for(const fall of s.falling){fall.time+=dt;if(fall.time>=1.8&&!fall.done){fall.done=true;for(let i=0;i<3;i++)this.scatterDrop('log',fall.x+fall.direction*(35+i*34),i,10);for(let i=0;i<4;i++)this.scatterDrop('wood',fall.x+fall.direction*48,i,70);this.sound('impact',.6);this.emit('change');}}s.falling=s.falling.filter(f=>!f.done);
      for(const fire of s.structures)if(fire.lit){fire.fuel=Math.max(0,(fire.fuel||0)-dt);if(fire.fuel===0){fire.lit=false;this.emit('change');if(Math.abs(fire.x-p.x)<250)this.notify('The campfire has gone out. Add dry wood to relight it.');}}
      if(this.attack){const a=this.attack;a.time+=dt;if(a.time>=.32&&!a.released){a.released=true;const origin=root.PEEquipment?root.PEEquipment.projectileOrigin(this):{x:p.x+p.facing*13,y:ground(p.x,s.currentMap)-(p.crouching?24:40)},dx=a.wx-origin.x,dy=a.wy-origin.y,len=Math.hypot(dx,dy)||1;s.inventory.arrows--;this.projectiles.push({x:origin.x,y:origin.y,vx:dx/len*390,vy:dy/len*390,life:2.5});this.sound('bow',.7);this.emit('change');}if(a.time>=a.duration)this.attack=null;}
      if(this.fishing){const f=this.fishing;f.time+=dt;if(f.stage==='wait'&&f.time>f.biteAt){f.stage='bite';this.sound('water',.5);this.emit('change');}if(f.time>f.biteAt+1.8){this.fishing=null;this.notify('Kala nykäisi ja katosi. Kokeile uudestaan.');this.emit('change');}}
      this.updateDog(dt);this.updateAnimals(dt);
      for(const a of this.projectiles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=28*dt;a.life-=dt;
        for(const animal of s.animals){if(!animal.alive||animal.mode==='away'||a.life<=0)continue;const h=animal.type==='deer'?42:animal.type==='bear'?32:14;if(Math.abs(a.x-animal.x)<(animal.type==='deer'?22:animal.type==='bear'?28:14)&&a.y>ground(animal.x,s.currentMap)-h&&a.y<ground(animal.x,s.currentMap)+3){a.life=0;animal.hp--;animal.mode='flee';animal.flight=6;animal.departing=animal.type==='bear';animal.facing=a.vx>0?1:-1;this.sound('impact',.5);if(animal.hp<=0){animal.alive=false;animal.respawnAt=s.playSeconds+420;s.drops.push({id:'carcass-'+animal.id+'-'+s.playSeconds,type:'carcass',species:animal.type,x:clamp(animal.x,15,WORLD-15)});s.journal.hunted[animal.type]=true;this.notify('Game down. Approach with a flint knife or puukko to recover meat and hide.');this.emit('change');}break;}}
        if(a.y>ground(a.x,s.currentMap)+5)a.life=0;
      }
      this.projectiles=this.projectiles.filter(a=>a.life>0);this.effects.forEach(e=>{e.life-=dt;e.y-=dt*12;});this.effects=this.effects.filter(e=>e.life>0);
      this.sinceSave+=dt;if(this.sinceSave>15){this.sinceSave=0;this.emit('save');}
    }
    completeAction(target){const s=this.state,type=target.type;
      if(type==='repair'){if(!this.repairReady(target.part))return;for(const [id,n]of Object.entries(regions.cabin.parts[target.part].need))s.inventory[id]-=n;s.cabinRepairs[target.part]=true;this.sound('craft',.65);this.notify(regions.cabin.parts[target.part].name+' · Restored');this.emit('save');return;}
      if(type==='pet'){s.dog.mode='sit';s.dog.nextDecision=s.playSeconds+4;this.notify('Kajo leans into your hand.');this.sound('rustle',.18);return;}
      if(type==='tree'){this.consumeTool(s.equipped,s.equipped==='flintaxe'?2:1);s.picked[target.id]=1e12;s.falling.push({id:target.id,x:target.x,time:0,direction:s.player.facing});return;}
      if(type==='log'){this.consumeTool(s.equipped);s.drops=s.drops.filter(d=>d.id!==target.id);for(let i=0;i<3;i++)this.scatterDrop('firewood',target.x,i,49);this.sound('wood',.7);return;}
      if(type==='carcass'){this.consumeTool(s.equipped);s.drops=s.drops.filter(d=>d.id!==target.id);s.inventory.rawMeat+=target.species==='deer'?3:target.species==='bear'?4:1;if(['deer','bear'].includes(target.species))s.inventory.hide++;this.notify('Skinned and packed. Cook the meat at a campfire.');this.sound('skin',.65);return;}
      const amount=target.amount||(type==='fiber'?2:1);s.inventory[type]+=amount;
      if(s.drops.some(d=>d.id===target.id))s.drops=s.drops.filter(d=>d.id!==target.id);else s.picked[target.id]=s.playSeconds+360;
      this.effects.push({x:target.x,y:ground(target.x,s.currentMap)-20,text:'+'+amount+' '+items[type][0],life:1.6});this.sound(({stone:'gatherStone',wood:'gatherWood',firewood:'gatherWood',fiber:'gatherGrass',berries:'gatherFruit',mushroom:'gatherMushroom'})[type]||'pickup',.65);
      if(s.inventory.wood&&s.inventory.stone&&s.inventory.fiber)this.finishTask('firstGather');
    }
    dogActions(){const s=this.state;return ['pet','stick',...(s.drops.some(d=>d.type==='carcass'&&d.species==='grouse'&&!d.carriedBy&&Math.abs(d.x-s.player.x)<900)?['retrieve']:[])];}
    commandDog(command){const s=this.state,d=s.dog,p=s.player;if(['retrieve','fetch','pet'].includes(d.mode))return this.notify('Kajo is busy. Give him a moment.');
      if(command==='pet'){if(Math.abs(d.x-p.x)>27)return false;d.mode='pet';d.moving=false;d.facing=p.x<d.x?-1:1;p.facing=-d.facing;this.action={target:{type:'pet',x:d.x},time:0,duration:2.1};this.sound('rustle',.2);return true;}
      if(command==='retrieve'){const bird=s.drops.filter(v=>v.type==='carcass'&&v.species==='grouse'&&!v.carriedBy&&Math.abs(v.x-p.x)<900).sort((a,b)=>Math.abs(a.x-d.x)-Math.abs(b.x-d.x))[0];if(!bird)return this.notify('There is no downed bird nearby.');Object.assign(d,{mode:'retrieve',retrieveId:bird.id,fetchStage:'out',timer:30,moving:false});this.notify('Kajo goes to retrieve the bird.');return true;}
      if(command!=='stick')return false;Object.assign(d,{mode:'fetch',fetchStage:'out',fetchX:clamp(p.x+p.facing*180,s.currentMap==='pond'?regions.pond.walkMin:30,WORLD-30),fetchFrom:p.x,fetchStarted:s.playSeconds,delay:0,timer:10});this.sound('dog',.25);this.notify('Kajo lähtee kepin perään.');return true;
    }
    updateDog(dt){const s=this.state,d=s.dog,p=s.player;if(s.currentMap==='pond')d.x=Math.max(regions.pond.walkMin+30,d.x);d.idle=p.moving?0:d.idle+dt;
      if(d.mode==='pet'){d.moving=false;if(this.action?.target.type!=='pet')d.mode='follow';return;}
      if(d.mode==='retrieve'){
        d.timer-=dt;const bird=s.drops.find(v=>v.id===d.retrieveId);d.moving=false;
        if(!bird||d.timer<=0){if(bird){delete bird.carriedBy;bird.x=d.x;}d.mode='follow';d.retrieveId=null;return;}
        if(d.fetchStage==='sniff'){d.fetchPause-=dt;if(d.fetchPause<=0){bird.carriedBy='dog';d.fetchStage='return';}return;}
        const destination=d.fetchStage==='return'?p.x-p.facing*26:bird.x,delta=destination-d.x;
        if(Math.abs(delta)>7){d.facing=delta<0?-1:1;d.x+=d.facing*Math.min(Math.abs(delta),dt*155);d.moving=true;d.stride+=dt*12;}
        else if(d.fetchStage==='out'){d.fetchStage='sniff';d.fetchPause=.6;}
        else{bird.x=d.x;delete bird.carriedBy;d.mode='sit';d.retrieveId=null;d.nextDecision=s.playSeconds+3;this.notify('Kajo brings the bird. Skin it with a knife.');this.sound('rustle',.25);this.emit('change');}
        if(bird.carriedBy)bird.x=d.x;return;
      }
      if(this.walkTarget?.type==='dog'){d.moving=false;d.mode='sit';return;}
      if(p.moving&&!d.lastMoving&&d.mode!=='fetch'){d.delay=.35+random(s.playSeconds)*.85;d.mode='wait';}d.lastMoving=p.moving;d.delay=Math.max(0,(d.delay||0)-dt);
      if(d.mode==='fetch'){
        d.timer-=dt;d.moving=false;
        if(d.timer<=0){d.mode='follow';d.fetchStage=null;return;}
        if(d.fetchStage==='sniff'){d.fetchPause-=dt;if(d.fetchPause<=0)d.fetchStage='return';return;}
        const destination=d.fetchStage==='return'?p.x-p.facing*36:d.fetchX,delta=destination-d.x;
        if(Math.abs(delta)>8){d.facing=delta<0?-1:1;d.x+=d.facing*Math.min(Math.abs(delta),dt*145);d.moving=true;d.stride+=dt*12;}
        else if(d.fetchStage==='out'){d.fetchStage='sniff';d.fetchPause=.65;}
        else{d.mode='follow';d.fetchStage=null;this.sound('dog',.2);}
        return;
      }
      if(d.idle>2.5&&Math.abs(d.x-p.x)<95){if(s.playSeconds>d.nextDecision){d.mode=random(s.playSeconds)>.5?'sit':'sniff';d.nextDecision=s.playSeconds+4+random(s.playSeconds+2)*5;}}
      else if(d.delay===0)d.mode='follow';
      const target=d.mode==='fetch'?d.fetchX:p.x-p.facing*(p.crouching?72:58),gap=target-d.x;d.moving=false;
      if((d.mode==='fetch'||d.mode==='follow')&&d.delay===0&&Math.abs(gap)>10){d.facing=gap>0?1:-1;const step=Math.min(Math.abs(gap),dt*(Math.abs(gap)>150?180:98));d.x+=d.facing*step;d.moving=true;d.stride+=dt*11;}
      if(Math.abs(p.x-d.x)>450){d.mode='follow';d.delay=0;}
    }
    updateAnimals(dt){const s=this.state,p=s.player;
      for(const a of s.animals){if(!a.alive){if(s.playSeconds>a.respawnAt){a.alive=true;a.hp=a.type==='deer'?2:a.type==='bear'?5:1;a.x=a.home< WORLD/2?-160:WORLD+160;a.mode='away';a.returnAt=s.playSeconds+60;}continue;}
        if(a.mode==='away'){a.vx=0;if(s.playSeconds>=a.returnAt){a.x=a.x<0?-80:WORLD+80;a.facing=a.x<0?1:-1;a.mode='walk';a.timer=14;a.returning=true;a.departing=false;}continue;}
        const gap=a.x-p.x,dist=Math.abs(gap),fear=(a.type==='deer'?200:a.type==='grouse'?145:125)*(p.crouching?.42:1)*(p.moving?1:.85);a.timer-=dt;
        if(dist<360&&!s.journal.seen[a.type]){s.journal.seen[a.type]=true;this.emit('change');}
        if(dist<fear){a.mode='flee';a.flight=4.5;a.facing=gap<0?-1:1;a.returning=false;if(a.type==='bear')a.departing=true;}
        if(a.mode==='flee'){
          a.flight-=dt;a.vx=a.facing*(a.type==='deer'?167:a.type==='bear'?95:a.type==='grouse'?117:143);
          if(!a.departing&&a.flight<=0&&dist>fear+160){a.mode='graze';a.timer=9;a.vx=0;}
        }else if(a.timer<=0){a.mode=a.mode==='walk'?'graze':'walk';a.timer=2+random(s.playSeconds+a.home)*5;a.facing=random(s.playSeconds+a.home+4)>.5?1:-1;}
        if(a.mode!=='flee')a.vx=a.mode==='walk'?a.facing*(a.returning?25:7):0;
        a.x+=a.vx*dt;if(s.currentMap==='pond'&&a.x<4000){a.x=4000;a.facing=1;a.vx=Math.abs(a.vx);}if(a.x>120&&a.x<WORLD-120)a.returning=false;
        if(!a.returning&&(a.x< -110||a.x>WORLD+110)){a.mode='away';a.returnAt=s.playSeconds+(a.type==='bear'?360:100+random(a.x)*100);a.vx=0;}
        if(a.vx)a.stride+=dt*(a.mode==='flee'?15:4);
      }
    }
    travel(){const s=this.state;for(const drop of s.drops)delete drop.carriedBy;s.player.x=565;s.player.moving=false;s.player.running=false;s.camera=181;s.dog.x=506;s.dog.mode='sit';s.dog.retrieveId=null;s.dog.delay=.7;this.projectiles=[];this.action=null;this.attack=null;this.walkTarget=null;this.fishing=null;this.keys={};this.sound('travel',.5);this.notify('Metsä · palaat vanhalle nuotiopaikalle.');this.emit('change');}
  }
  const api={healthDrain,needDamage,Engine,items,recipes,tasks,animalNames,toolDurability,foodIds,WIDTH,HEIGHT,WORLD,TILE,ground,random,clamp};root.PE=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
