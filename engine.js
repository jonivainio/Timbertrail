/* Pine & Ember — simulation, independent of the DOM and rendering. */
(function(root) {
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
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
    compass:['Messinkikompassi','Aarnin vanha kompassi. Muisto ensimmäisestä vaihtokaupasta.','material']
  };
  const toolDurability={knife:20,puukko:80,flintaxe:18,axe:75};
  const foodIds=['berries','mushroom','cookedFish','cookedMeat'];
  const recipes=[
    {id:'knife',need:{stone:2,wood:1},desc:'Ensimmäinen työkalu. Avaa kirveen, jousen ja vavan valmistuksen.'},
    {id:'cord',need:{fiber:3},desc:'Kierrä kolme kuitunippua yhdeksi kestäväksi naruksi.'},
    {id:'wood',name:'Kindling',need:{firewood:1},tool:'knife',toolAny:['knife','puukko'],amount:3,desc:'Shave one split billet into three small branches for crafting or lighting a fire.'},
    {id:'flintaxe',need:{stone:2,wood:3,cord:1},tool:'knife',toolAny:['knife','puukko'],desc:'Valmista ensin piikiviveitsi ja naru. Hidas kivikirves kaataa puun ja pilkkoo rankapuut.'},
    {id:'campfire',name:'Nuotiokehä',need:{stone:4,wood:4},tool:'flintaxe',toolAny:['flintaxe','axe'],structure:'fire',desc:'Rakenna jalkojesi viereen. Lämmittää ja kypsentää ruokaa.'},
    {id:'shelter',name:'Laavusuoja',need:{wood:12,fiber:6,cord:2},tool:'flintaxe',toolAny:['flintaxe','axe'],structure:'shelter',desc:'Oma lepopaikka. Nuku aamuun ja palauta voimasi.'},
    {id:'bow',need:{wood:4,cord:2},tool:'knife',toolAny:['knife','puukko'],desc:'Lähesty riistaa kyykyssä. Muista valmistaa myös nuolia.'},
    {id:'arrows',name:'Neljä nuolta',need:{wood:1,stone:1},tool:'knife',toolAny:['knife','puukko'],amount:4,desc:'Neljä nuolta saarijouseen.'},
    {id:'rod',need:{wood:3,cord:2},tool:'knife',toolAny:['knife','puukko'],desc:'Vapa veden äärelle. Nosta kala, kun koho nykäisee.'},
    {id:'trap',name:'Rihma-ansa',need:{wood:4,cord:1},tool:'knife',toolAny:['knife','puukko'],structure:'trap',desc:'Aseta polun reunaan. Tarkista minuutin kuluttua.'}
  ];
  const tasks=[['firstGather','Kerää oksia, kiviä ja kuitua'],['makeKnife','Valmista piikiviveitsi'],['makeAxe','Valmista piikivikirves'],['makeFire','Rakenna nuotio'],['makeShelter','Rakenna laavu'],['drink','Juo lähteestä'],['meet','Tapaa erakko Aarni'],['trade','Tee vaihtokauppa'],['meal','Valmista lämmin ateria']];
  const animalNames={rabbit:'Metsäjänis',grouse:'Teeri',deer:'Metsäpeura',bear:'Karhu'};
  const WIDTH=960,HEIGHT=540,WORLD=6400,TILE=1620;
  // One authored route, never wrapped or mirrored. Rocks, hollows and gentle rises.
  function ground(x) {
    const h=[426,421,414,429,433,406,393,411,432,441,419,408,428,420,401,414,428,422,399,390,418,431,415,396,381,392,413,406,379,391,405,400,394],u=clamp(x/WORLD,0,1)*(h.length-1),i=Math.min(h.length-2,Math.floor(u)),f=u-i,e=f*f*(3-2*f);
    return h[i]+(h[i+1]-h[i])*e;
  }
  function fresh(){return {
    version:5,running:false,discovered:{berries:true},player:{x:565,facing:1,crouching:false,moving:false,hunger:88,thirst:86,energy:100,warmth:85,health:100,stride:0},
    dog:{x:506,facing:1,mode:'sit',delay:.8,idle:0,nextDecision:7,lastMoving:false,stride:0},
    inventory:Object.fromEntries(Object.keys(items).map(k=>[k,k==='berries'?3:0])),toolDurability:{},quickFood:'berries',quickTools:{knife:'knife',axe:'flintaxe'},equipped:null,
    structures:[{id:'oldfire',type:'oldfire',x:710,lit:false,fuel:0}],picked:{},completed:{},drops:[],falling:[],traders:{aarni:{introDone:false}},
    journal:{seen:{},hunted:{},caught:{}},day:1,dayTime:.38,weather:'clear',currentMap:'forest',camera:181,playSeconds:0,rowanMet:false,traded:false,
    animals:[['rabbit',1510],['grouse',5480],['deer',2810],['bear',4660]].map(([type,x],i)=>({id:'a'+i,type,x,home:x,vx:0,facing:i%2?1:-1,hp:type==='bear'?5:type==='deer'?2:1,alive:true,mode:x>WORLD?'away':'graze',returnAt:150+i*25,timer:8+i,flight:0,stride:0}))
  };}
  class Engine {
    constructor(onEvent=()=>{}){
      this.state=fresh();this.onEvent=onEvent;this.keys={};this.projectiles=[];this.effects=[];this.action=null;this.fishing=null;this.shotCooldown=0;this.sinceSave=0;this.walkTarget=null;this.attack=null;this.activeFire=null;
      this.water=[{type:'water',x:1295,id:'spring'},{type:'water',x:2945,id:'river'}];this.npc={type:'cabin',x:3380,id:'aarni'};
      this.nodes=[];
      const pattern=['wood','stone','fiber','berries','wood','mushroom','stone','fiber','tree'];
      for(let i=0,x=350;x<WORLD-100;i++,x+=58+random(i)*40)this.nodes.push({id:'n'+i,type:pattern[i%9],x:Math.round(x)});
      // The starting clearing always has enough reachable resources for the first tools.
      this.nodes.unshift(...[['wood',512],['stone',550],['fiber',592],['fiber',625],['stone',655]].map(([type,x],i)=>({id:'starter'+i,type,x})));
      for(let i=0,x=850;x<WORLD-180;i++,x+=250+random(i+90)*120)if(Math.abs(x-this.npc.x)>155)this.nodes.push({id:'spruce'+i,type:'tree',x:Math.round(x)});
    }
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
    start(saved=null){if(saved)this.load(saved);this.state.running=true;this.state.player.moving=false;this.keys={};this.action=null;this.fishing=null;this.walkTarget=null;this.attack=null;this.projectiles=[];this.emit('change');}
    load(saved){
      const defaults=fresh(),safeNumber=(v,d,min,max)=>Number.isFinite(v)?clamp(v,min,max):d;
      this.state={...defaults,day:safeNumber(saved.day,1,1,9999),dayTime:safeNumber(saved.dayTime,.38,0,1),playSeconds:safeNumber(saved.playSeconds,0,0,1e9),weather:['clear','rain','mist'].includes(saved.weather)?saved.weather:'clear',rowanMet:!!saved.rowanMet,traded:!!saved.traded};
      for(const k of Object.keys(defaults.inventory))this.state.inventory[k]=Math.floor(safeNumber(saved.inventory?.[k],defaults.inventory[k],0,99999));
      this.restoreToolDurability(saved.toolDurability);
      for(const id of Object.keys(items))if(saved.discovered?.[id]===true)this.state.discovered[id]=true;
      // Older saves cannot remember every spent ingredient; completed products do prove these discoveries.
      for(const r of recipes)if(this.state.inventory[r.id]>0||(r.structure&&saved.structures?.some(v=>v.type===r.structure)))for(const id of Object.keys(r.need))this.state.discovered[id]=true;
      // Before v5, `axe` meant the crafted stone axe. Retain its spent-material discoveries,
      // while a v5 trader steel axe does not reveal a recipe the player has not learned.
      if((saved.version||0)<5&&this.state.inventory.axe>0)for(const id of ['stone','wood','cord'])this.state.discovered[id]=true;
      this.rememberItems();
      for(const k of ['hunger','thirst','energy','warmth','health'])this.state.player[k]=safeNumber(saved.player?.[k],defaults.player[k],1,100);
      this.state.player.x=safeNumber(saved.player?.x,565,80,WORLD-80);this.state.player.crouching=!!saved.player?.crouching;this.state.player.facing=saved.player?.facing===-1?-1:1;
      this.state.dog.x=this.state.player.x-55;this.state.camera=clamp(this.state.player.x-WIDTH*.4,0,WORLD-WIDTH);
      this.state.quickFood=foodIds.includes(saved.quickFood)?saved.quickFood:defaults.quickFood;
      this.state.quickTools={knife:this.isKnife(saved.quickTools?.knife)?saved.quickTools.knife:this.state.inventory.puukko>0?'puukko':'knife',axe:this.isAxe(saved.quickTools?.axe)?saved.quickTools.axe:this.state.inventory.axe>0?'axe':'flintaxe'};
      this.state.equipped=items[saved.equipped]?.[2]==='tool'&&this.toolReady(saved.equipped)?saved.equipped:null;
      for(const [k] of tasks)this.state.completed[k]=!!saved.completed?.[k];
      if(saved.version>=2&&saved.picked&&typeof saved.picked==='object')for(const n of this.nodes)if(Number.isFinite(saved.picked[n.id]))this.state.picked[n.id]=saved.picked[n.id];
      if(Array.isArray(saved.structures))this.state.structures=saved.structures.filter(s=>['fire','oldfire','shelter','trap'].includes(s.type)&&Number.isFinite(s.x)).slice(0,60).map((s,i)=>({id:'loaded'+i,type:s.type,x:clamp(s.x,80,WORLD-80),lit:!!s.lit,fuel:safeNumber(s.fuel,s.lit?90:0,0,900),readyAt:safeNumber(s.readyAt,0,0,1e9)}));
      if(!this.state.structures.length)this.state.structures=defaults.structures;
      for(const category of ['seen','hunted','caught'])for(const type of ['rabbit','grouse','deer','bear','fish'])if(saved.journal?.[category]?.[type])this.state.journal[category][type]=true;
      // Preserve v2 animal state; a v1 save keeps its inventory, progress and camp.
      if(saved.version>=3&&Array.isArray(saved.animals))for(const a of this.state.animals){const old=saved.animals.find(v=>v.id===a.id);if(old){a.x=safeNumber(old.x,a.x,-1800,WORLD+1800);a.alive=old.alive!==false;a.hp=safeNumber(old.hp,a.hp,0,5);a.respawnAt=safeNumber(old.respawnAt,0,0,1e9);a.returnAt=safeNumber(old.returnAt,0,0,1e9);a.mode=['away','flee','graze','walk'].includes(old.mode)?old.mode:'graze';a.departing=!!old.departing;a.facing=old.facing===-1?-1:1;}}
      this.state.traders.aarni.introDone=!!saved.traders?.aarni?.introDone;
      if(Array.isArray(saved.drops))this.state.drops=saved.drops.filter(d=>['log','wood','firewood','carcass'].includes(d.type)&&Number.isFinite(d.x)).slice(0,300).map((d,i)=>({id:'drop'+i,type:d.type,x:clamp(d.x,10,WORLD-10),species:animalNames[d.species]?d.species:'rabbit',amount:safeNumber(d.amount,1,1,10)}));
      if(Array.isArray(saved.falling))this.state.falling=saved.falling.filter(f=>Number.isFinite(f.x)).slice(0,30).map((f,i)=>({id:'fall'+i,x:f.x,time:safeNumber(f.time,0,0,1.8),direction:f.direction===-1?-1:1}));
    }
    save(){this.rememberItems();return JSON.stringify(this.state);}
    finishTask(id){if(!this.state.completed[id]){this.state.completed[id]=true;this.sound('task',.6);this.emit('change');}}
    setCrouch(value){if(this.state.player.crouching!==value){this.state.player.crouching=value;this.sound('rustle',.22);this.emit('change');}}
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
    craft(id){const r=recipes.find(v=>v.id===id);if(!r||this.action)return false;
      if(!this.requirements(r)){this.sound('deny',.6);this.notify('Kerää ensin reseptissä näkyvät puuttuvat tarvikkeet.');return false;}
      if(r.structure&&this.state.structures.some(s=>Math.abs(s.x-this.state.player.x)<65)){this.notify('Siirry hieman kauemmas olemassa olevasta leiristä.');return false;}
      this.rememberItems();for(const[k,n]of Object.entries(r.need))this.state.inventory[k]-=n;
      if(r.structure){this.state.structures.push({id:'built'+this.state.playSeconds,type:r.structure,x:this.state.player.x+30,lit:false,fuel:0,readyAt:this.state.playSeconds+65});}
      else {this.state.inventory[id]+=(r.amount||1);if(toolDurability[id])this.state.toolDurability[id]=toolDurability[id];}
      const task={knife:'makeKnife',flintaxe:'makeAxe',campfire:'makeFire',shelter:'makeShelter'}[id];if(task)this.finishTask(task);
      this.sound('craft',.65);this.notify((r.name||items[id][0])+' valmistui.');this.emit('change');return true;
    }
    targets(){const s=this.state;return [...this.nodes.filter(n=>!(s.picked[n.id]>s.playSeconds)),...s.drops,...this.water,...s.structures,this.npc,{type:'dog',x:s.dog.x,id:'dog'},...s.animals.filter(a=>a.alive&&a.mode!=='away'&&a.x>0&&a.x<WORLD).map(a=>({...a,type:'animal',species:a.type}))];}
    label(target){if(!target)return '';const s=this.state,far=Math.abs(target.x-s.player.x)>95;
      let label=target.type==='animal'?animalNames[target.species]:({tree:'Spruce · fell with an axe',log:'Trunk · split with an axe',carcass:'Game · skin with a knife',cabin:"Aarni’s cabin · knock on the door",water:s.equipped==='rod'?'Heitä siima':'Juo lähteestä',npc:'Aarni · juttele',dog:'Kajo · heitä keppi',fire:'Nuotio · valmista ruokaa',oldfire:'Vanha nuotiokehä',shelter:'Laavu · lepää aamuun',trap:'Tarkista ansa'})[target.type]||('Kerää · '+items[target.type]?.[0]);
      return label+(far?' · click to approach':'');
    }
    interact(target){
      if(!target||this.action||this.attack)return;const s=this.state,p=s.player;
      if(target.type==='animal'){if(s.equipped!=='bow')this.notify(animalNames[target.species]+' — lähesty kyykyssä.');return;}
      if(['tree','log'].includes(target.type)&&!this.isAxe(s.equipped))return this.notify('Equip a flint axe or steel axe from the top belt or backpack.');
      if(target.type==='carcass'&&!this.isKnife(s.equipped))return this.notify('Equip a flint knife or puukko to skin this animal.');
      const reach=['tree','log','carcass','wood','stone','fiber','berries','mushroom','firewood'].includes(target.type)?28:60;
      if(Math.abs(target.x-p.x)>reach){this.walkTarget={...target,reach};this.fishing=null;return;}
      this.walkTarget=null;
      p.facing=target.x<p.x?-1:1;
      if(target.type==='cabin'){s.rowanMet=true;this.finishTask('meet');this.emit('panel',{panel:'dialogue'});return;}
      if(target.type==='dog'){Object.assign(s.dog,{mode:'fetch',fetchStage:'out',fetchX:clamp(p.x+p.facing*180,30,WORLD-30),fetchFrom:p.x,fetchStarted:s.playSeconds,delay:0,timer:10});this.sound('dog',.35);this.notify('Kajo lähtee kepin perään.');return;}
      if(['fire','oldfire'].includes(target.type)){
        const fire=s.structures.find(v=>v.id===target.id);
        this.activeFire=fire.id;
        this.emit('panel',{panel:'fire'});return;
      }
      if(target.type==='shelter'){s.day++;s.dayTime=.28;for(const f of s.structures){f.fuel=0;f.lit=false;}p.energy=100;p.warmth=95;p.health=clamp(p.health+30,0,100);p.hunger=clamp(p.hunger-12,1,100);p.thirst=clamp(p.thirst-15,1,100);this.sound('sleep');this.notify('Heräät uuteen aamuun. Kajo venyttelee vieressä.');this.emit('change');return;}
      if(target.type==='trap'){const trap=s.structures.find(v=>v.id===target.id);if(trap.readyAt>s.playSeconds)return this.notify('Ansa on viritetty. Tarkista vähän myöhemmin.');s.drops.push({id:'trapped-'+s.playSeconds,type:'carcass',species:'rabbit',x:target.x+24});s.journal.hunted.rabbit=true;trap.readyAt=s.playSeconds+90;this.notify('Game down. Approach with a flint knife or puukko to recover meat and hide.');this.sound('pickup');this.emit('change');return;}
      if(target.type==='water'){
        if(s.equipped==='rod'){if(!this.fishing){this.fishing={time:0,biteAt:2.5+random(s.playSeconds)*3,stage:'wait',x:target.x};this.sound('cast');this.emit('change');}return;}
        p.thirst=100;this.finishTask('drink');this.sound('water',.7);this.notify('Raikas lähdevesi sammuttaa janon.');this.emit('change');return;
      }
      const steel=s.equipped==='axe',puukko=s.equipped==='puukko';
      this.action={target,time:0,duration:target.type==='tree'?(steel?1.8:3.6):target.type==='log'?(steel?0.9:1.8):target.type==='carcass'?(puukko?1.45:2.35):.85};
      if(!['tree','log'].includes(target.type))this.sound('rustle',.55);
    }
    fuelFire(item){const s=this.state,f=s.structures.find(f=>f.id===this.activeFire);if(!f||Math.abs(f.x-s.player.x)>100||!['wood','firewood'].includes(item)||s.inventory[item]<1)return false;if(f.fuel>=720)return this.notify('The fire already has plenty of fuel.');s.inventory[item]--;f.fuel=Math.min(900,(f.fuel||0)+(item==='wood'?45:150));f.lit=true;this.sound('fire',.6);this.emit('change');return true;}
    finishDialogue(){this.state.traders.aarni.introDone=true;this.emit('change');this.emit('save');}
    cook(id){const s=this.state;if(!['rawFish','rawMeat'].includes(id)||s.inventory[id]<1)return false;
      if(!s.structures.some(f=>f.lit&&Math.abs(f.x-s.player.x)<110)){this.notify('Mene ensin palavan nuotion äärelle.');return false;}
      s.inventory[id]--;s.inventory[id==='rawFish'?'cookedFish':'cookedMeat']++;this.finishTask('meal');this.sound('fire',.6);this.emit('change');this.notify('Ateria on valmis. Löydät sen repusta ja ylävalikosta.');return true;
    }
    trade(offer='compass'){const s=this.state;if(!s.traders.aarni.introDone||Math.abs(s.player.x-this.npc.x)>110)return false;
      if(offer==='arrows'){if(s.inventory.wood<5)return this.notify('Aarni needs five branches for this trade.');s.inventory.wood-=5;s.inventory.arrows+=8;}
      else if(offer==='puukko'){if(s.inventory.hide<1)return this.notify('Aarni asks for one hide.');s.inventory.hide--;s.inventory.puukko++;s.toolDurability.puukko=toolDurability.puukko;}
      else if(offer==='axe'){if(s.inventory.hide<2)return this.notify('Aarni asks for two hides for the steel axe.');s.inventory.hide-=2;s.inventory.axe++;s.toolDurability.axe=toolDurability.axe;}
      else{if(s.inventory.hide<1&&s.inventory.cookedFish<2)return this.notify('Aarni pyytää yhden nahan tai kaksi loimukalaa.');if(s.inventory.hide)s.inventory.hide--;else s.inventory.cookedFish-=2;s.inventory.compass=1;s.inventory.arrows+=8;}
      s.traded=true;this.finishTask('trade');this.sound('trade');this.emit('change');this.notify('Trade complete. Your supplies are in the backpack.');return true;}
    reel(){if(!this.fishing)return;const f=this.fishing;this.fishing=null;if(f.stage==='bite'){this.state.inventory.rawFish++;this.state.journal.caught.fish=true;this.sound('catch');this.notify('Sait kalan! Kypsennä se nuotiolla.');}else{this.sound('miss',.5);this.notify('Kala pääsi karkuun. Odota, kunnes koho nykäisee.');}this.emit('change');}
    shoot(wx,wy){const s=this.state;if(s.equipped!=='bow'||this.shotCooldown>0||this.action||this.attack)return false;if(!s.inventory.arrows){this.notify('Nuolet loppuivat. Valmista lisää käsitöissä.');return false;}
      s.player.facing=wx<s.player.x?-1:1;this.walkTarget=null;this.attack={time:0,duration:.75,wx,wy,released:false};this.shotCooldown=.9;return true;
    }
    update(dt){
      const s=this.state;if(!s.running)return;dt=Math.min(dt,.05);s.playSeconds+=dt;this.shotCooldown=Math.max(0,this.shotCooldown-dt);
      s.dayTime+=dt/900;if(s.dayTime>=1){s.dayTime-=1;s.day++;s.weather=random(s.day)>.7?'rain':'clear';}
      const p=s.player,manual=(this.keys.KeyD||this.keys.ArrowRight?1:0)-(this.keys.KeyA||this.keys.ArrowLeft?1:0),sprint=!p.crouching&&(this.keys.ShiftLeft||this.keys.ShiftRight)&&p.energy>2;
      if(manual){this.walkTarget=null;this.action=null;}
      let dir=manual;
      if(this.walkTarget&&!manual){const target=this.targets().find(t=>t.id===this.walkTarget.id);if(!target){this.walkTarget=null;}else if(Math.abs(target.x-p.x)<=this.walkTarget.reach-2){this.walkTarget=null;this.interact(target);}else dir=target.x<p.x?-1:1;}
      p.moving=!!dir&&!this.action&&!this.fishing&&!this.attack;const speed=p.crouching?38:sprint?145:83;
      if(p.moving){p.facing=dir;p.x=clamp(p.x+dir*speed*dt,35,WORLD-35);p.stride+=dt*(p.crouching?5:sprint?13:8);if(sprint)p.energy=clamp(p.energy-dt*5,0,100);}
      if(p.x>=WORLD-38&&!this.endOfTrailShown){this.endOfTrailShown=true;this.walkTarget=null;this.notify('The demo ends here. More trails will open in a future chapter.');}
      if(p.x<WORLD-160)this.endOfTrailShown=false;
      if(!sprint||!p.moving)p.energy=clamp(p.energy+dt*2,0,100);
      p.hunger=clamp(p.hunger-dt*.065,0,100);p.thirst=clamp(p.thirst-dt*.085,0,100);
      const nearFire=s.structures.some(f=>f.lit&&Math.abs(f.x-p.x)<110),night=s.dayTime<.22||s.dayTime>.8;
      p.warmth=clamp(p.warmth+dt*(nearFire?.9:s.weather==='rain'?-.12:night?-.055:.025),0,100);
      p.health=clamp(p.health+dt*(p.hunger<1||p.thirst<1?-.3:p.warmth<1?-.16:.02),0,100);
      if(p.health<=0){p.x=565;p.health=65;p.hunger=55;p.thirst=55;p.warmth=60;this.notify('Kajo johdattaa sinut takaisin leiripaikalle. Lepää ja syö.');}
      s.camera+=(clamp(p.x-WIDTH*.4,0,WORLD-WIDTH)-s.camera)*Math.min(1,dt*6);
      if(this.action){const a=this.action,previous=a.time;a.time+=dt;
        // Equipment animation has four .225s frames: the head contacts wood halfway through
        // each .9s swing. Sound only at that contact, never at action start.
        if(['tree','log'].includes(a.target.type)){const first=Math.floor((previous-.45+1e-7)/.9),last=Math.floor((a.time-.45+1e-7)/.9);for(let swing=first+1;swing<=last;swing++)this.sound('axe',.65);}
        if(a.time>=a.duration){this.completeAction(a.target);this.action=null;this.emit('change');}}
      for(const fall of s.falling){fall.time+=dt;if(fall.time>=1.8&&!fall.done){fall.done=true;for(let i=0;i<3;i++)s.drops.push({id:'log-'+s.playSeconds+'-'+i,type:'log',x:clamp(fall.x+fall.direction*(35+i*34),15,WORLD-15)});for(let i=0;i<4;i++)s.drops.push({id:'branch-'+s.playSeconds+'-'+i,type:'wood',x:clamp(fall.x-28+i*21,15,WORLD-15),amount:1});this.sound('impact',.6);this.emit('change');}}s.falling=s.falling.filter(f=>!f.done);
      for(const fire of s.structures)if(fire.lit){fire.fuel=Math.max(0,(fire.fuel||0)-dt);if(fire.fuel===0){fire.lit=false;this.emit('change');if(Math.abs(fire.x-p.x)<250)this.notify('The campfire has gone out. Add dry wood to relight it.');}}
      if(this.attack){const a=this.attack;a.time+=dt;if(a.time>=.32&&!a.released){a.released=true;const origin=root.PEEquipment?root.PEEquipment.projectileOrigin(this):{x:p.x+p.facing*13,y:ground(p.x)-(p.crouching?24:40)},dx=a.wx-origin.x,dy=a.wy-origin.y,len=Math.hypot(dx,dy)||1;s.inventory.arrows--;this.projectiles.push({x:origin.x,y:origin.y,vx:dx/len*390,vy:dy/len*390,life:2.5});this.sound('bow',.7);this.emit('change');}if(a.time>=a.duration)this.attack=null;}
      if(this.fishing){const f=this.fishing;f.time+=dt;if(f.stage==='wait'&&f.time>f.biteAt){f.stage='bite';this.sound('water',.5);this.emit('change');}if(f.time>f.biteAt+1.8){this.fishing=null;this.notify('Kala nykäisi ja katosi. Kokeile uudestaan.');this.emit('change');}}
      this.updateDog(dt);this.updateAnimals(dt);
      for(const a of this.projectiles){a.x+=a.vx*dt;a.y+=a.vy*dt;a.vy+=28*dt;a.life-=dt;
        for(const animal of s.animals){if(!animal.alive||animal.mode==='away'||a.life<=0)continue;const h=animal.type==='deer'?42:animal.type==='bear'?32:14;if(Math.abs(a.x-animal.x)<(animal.type==='deer'?22:animal.type==='bear'?28:14)&&a.y>ground(animal.x)-h&&a.y<ground(animal.x)+3){a.life=0;animal.hp--;animal.mode='flee';animal.flight=6;animal.departing=animal.type==='bear';animal.facing=a.vx>0?1:-1;this.sound('impact',.5);if(animal.hp<=0){animal.alive=false;animal.respawnAt=s.playSeconds+420;s.drops.push({id:'carcass-'+animal.id+'-'+s.playSeconds,type:'carcass',species:animal.type,x:clamp(animal.x,15,WORLD-15)});s.journal.hunted[animal.type]=true;this.notify('Game down. Approach with a flint knife or puukko to recover meat and hide.');this.emit('change');}break;}}
        if(a.y>ground(a.x)+5)a.life=0;
      }
      this.projectiles=this.projectiles.filter(a=>a.life>0);this.effects.forEach(e=>{e.life-=dt;e.y-=dt*12;});this.effects=this.effects.filter(e=>e.life>0);
      this.sinceSave+=dt;if(this.sinceSave>15){this.sinceSave=0;this.emit('save');}
    }
    completeAction(target){const s=this.state,type=target.type;
      if(type==='tree'){this.consumeTool(s.equipped,s.equipped==='flintaxe'?2:1);s.picked[target.id]=1e12;s.falling.push({id:target.id,x:target.x,time:0,direction:s.player.facing});return;}
      if(type==='log'){this.consumeTool(s.equipped);s.drops=s.drops.filter(d=>d.id!==target.id);for(let i=0;i<3;i++)s.drops.push({id:'billet-'+s.playSeconds+'-'+i,type:'firewood',x:target.x+(i-1)*17,amount:1});this.sound('wood',.7);return;}
      if(type==='carcass'){this.consumeTool(s.equipped);s.drops=s.drops.filter(d=>d.id!==target.id);s.inventory.rawMeat+=target.species==='deer'?3:target.species==='bear'?4:1;if(['deer','bear'].includes(target.species))s.inventory.hide++;this.notify('Skinned and packed. Cook the meat at a campfire.');this.sound('rustle',.6);return;}
      const amount=target.amount||(type==='fiber'?2:1);s.inventory[type]+=amount;
      if(s.drops.some(d=>d.id===target.id))s.drops=s.drops.filter(d=>d.id!==target.id);else s.picked[target.id]=s.playSeconds+360;
      this.effects.push({x:target.x,y:ground(target.x)-20,text:'+'+amount+' '+items[type][0],life:1.6});this.sound(type==='stone'?'stone':'pickup',.65);
      if(s.inventory.wood&&s.inventory.stone&&s.inventory.fiber)this.finishTask('firstGather');
    }
    updateDog(dt){const s=this.state,d=s.dog,p=s.player;d.idle=p.moving?0:d.idle+dt;
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
        a.x+=a.vx*dt;if(a.x>120&&a.x<WORLD-120)a.returning=false;
        if(!a.returning&&(a.x< -110||a.x>WORLD+110)){a.mode='away';a.returnAt=s.playSeconds+(a.type==='bear'?360:100+random(a.x)*100);a.vx=0;}
        if(a.vx)a.stride+=dt*(a.mode==='flee'?15:4);
      }
    }
    travel(){const s=this.state;s.player.x=565;s.camera=181;s.dog.x=506;s.dog.mode='sit';s.dog.delay=.7;this.projectiles=[];this.action=null;this.attack=null;this.walkTarget=null;this.fishing=null;this.keys={};this.sound('travel',.5);this.notify('Metsä · palaat vanhalle nuotiopaikalle.');this.emit('change');}
  }
  const api={Engine,items,recipes,tasks,animalNames,toolDurability,foodIds,WIDTH,HEIGHT,WORLD,TILE,ground,random,clamp};root.PE=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
