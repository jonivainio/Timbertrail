/* Pine & Ember — browser integration and semantic, mouse-operated field UI. */
(() => {
  'use strict';
  const {Engine,items,recipes,tasks,animalNames,toolDurability:durabilityCaps={},WIDTH:W,HEIGHT:H,ground,clamp,random}=PE;
  const $=id=>document.getElementById(id),shell=$('game-shell'),canvas=$('game'),modal=$('modal'),content=$('modal-content');
  const SAVE='timbertrail-save-v3',LEGACY='pine-and-ember-save-v1';
  let panel=null,selected='berries',recipe='knife',tab='all',returnFocus=null,ready=false,last=performance.now(),hudClock=0,toastTimer=0,saveFailed=false,saved=null,modalClosing=false,modalCloseTimer=0,bookFrameTimer=0;
  let pointer=null,pointerWorld=false,dialogueStage='welcome',visits=0,dogChoice='pet',lastDogWheel=-Infinity;
  const journalPanels=new Set(['inventory','craft','journal','map']);
  const bookFrames=['book-opening-1','book-opening-2','book-opening-3','book-opening-4','book-open'];
  const reducedMotion=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const engine=new Engine(event=>{
    if(event.type==='sound')PEAudio.play(event.name,event.intensity);
    if(event.type==='notice')notice(event.text);
    if(event.type==='panel')openPanel(event.panel);
    if(event.type==='change'){syncHUD();if(panel)renderPanel();}
    if(event.type==='save')save();
  });
  const renderer=new PEArt.Renderer(canvas,null);
  const art=(type,cls='')=>`<canvas width="96" height="96" data-art="${type}" class="${cls}" aria-hidden="true"></canvas>`;
  const wildlifeBoxes=[[62,124,244,320],[390,173,286,270],[743,83,332,374],[1106,165,413,289]],wildlifeIndex={rabbit:0,grouse:1,deer:2,bear:3};
  const recipeIndex=Object.fromEntries(recipes.map((v,i)=>[v.id,i]));
  // Keep unobserved species unidentifiable in the DOM as well as on screen.
  const animalArt=(type,known)=>`<canvas width="96" height="96" data-wildlife="${wildlifeIndex[type]}"${known?'':' data-silhouette="true"'} class="animal-art" aria-hidden="true"></canvas>`;
  const unknownRecipeArt=id=>`<canvas width="96" height="96" data-recipe-silhouette="${recipeIndex[id]}" class="recipe-silhouette" aria-hidden="true"></canvas>`;
  const name=id=>L.text(items[id]?.[0]||recipes.find(r=>r.id===id)?.name||id);
  const category={tool:'TYÖKALU',material:'TARVIKE',food:'EVÄS',raw:'KYPSENNETTÄVÄ'};
  function paintIcon(ctx,type,x,y,size){if(window.PEEquipment?.isTool?.(type))window.PEEquipment.drawIcon(ctx,type,x,y,size);else PEArt.icon(ctx,type,x,y,size);}
  function paintIcons(scope=document){scope.querySelectorAll('canvas[data-art]').forEach(c=>{const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;paintIcon(ctx,c.dataset.art,0,0,c.width);});}
  function paintRecipeSilhouettes(scope=document){scope.querySelectorAll('canvas[data-recipe-silhouette]').forEach(c=>{const r=recipes[Number(c.dataset.recipeSilhouette)];if(!r)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;PEArt.icon(ctx,r.id==='wood'?'kindling':r.id,0,0,c.width);ctx.globalCompositeOperation='source-in';ctx.fillStyle='#8b897d';ctx.fillRect(0,0,c.width,c.height);ctx.globalCompositeOperation='source-over';});}
  function paintWildlife(scope=document){if(!renderer.wildlife)return;scope.querySelectorAll('canvas[data-wildlife]').forEach(c=>{const b=wildlifeBoxes[Number(c.dataset.wildlife)];if(!b)return;const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;ctx.save();if(c.dataset.silhouette){ctx.fillStyle='#8a887c';ctx.fillRect(0,0,c.width,c.height);ctx.globalCompositeOperation='destination-in';}const scale=Math.min(c.width/b[2],c.height/b[3])*.84,w=b[2]*scale,h=b[3]*scale;ctx.drawImage(renderer.wildlife,...b,(c.width-w)/2,(c.height-h)/2,w,h);ctx.restore();});}
  function notice(text){$('toast').textContent=L.text(text);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4300);}
  function readSave(){for(const key of [SAVE,'pine-and-ember-save-v2',LEGACY])try{const raw=localStorage.getItem(key);if(raw){const value=JSON.parse(raw);if(value&&value.player&&value.inventory)return value;}}catch{}return null;}
  function save(){if(!engine.state.running)return;try{localStorage.setItem(SAVE,engine.save());saveFailed=false;}catch{if(!saveFailed){saveFailed=true;notice('Selain ei sallinut tallennusta. Retki jatkuu, mutta edistyminen ei säily sulkemisen jälkeen.');}}}
  function refreshTitle(){saved=readSave();$('continue-button').hidden=!saved;$('start-button').textContent=saved?'Aloita uusi retki':'Aloita retki  ⟶';$('start-button').classList.toggle('secondary',!!saved);L.apply($('title-card'));}
  function start(continuing){if(!ready)return;if(panel&&!modalClosing)closePanel();if(modalClosing)finishModalClose();if(!continuing)engine.state=new Engine().state;engine.start(continuing?saved:null);$('title-card').hidden=true;$('hud').hidden=false;shell.classList.add('playing');PEAudio.start(engine.state);canvas.focus();syncHUD();save();notice(continuing?'Tervetuloa takaisin metsään.':'Aloita läheltä: klikkaa polun oksia, kiviä ja kuitunippuja.');}
  function returnToTitle(){save();if(panel&&!modalClosing){panel=null;modalClosing=true;}if(modalClosing)finishModalClose();engine.state.running=false;$('hud').hidden=true;$('title-card').hidden=false;shell.classList.remove('playing','show-top');refreshTitle();(saved?$('continue-button'):$('start-button')).focus();}
  for(const [id,label,color]of[['hunger','RUOKA','#c0a475'],['thirst','VESI','#87adad'],['energy','VOIMA','#a4b887'],['warmth','LÄMPÖ','#bf8965']]){
    const el=document.createElement('div');el.className='stat';el.innerHTML=`<span>${label}</span><b id="value-${id}">100</b><div class="stat-meter" role="meter" aria-label="${label}" aria-valuemin="0" aria-valuemax="100" id="meter-${id}"><span id="bar-${id}" style="--stat-color:${color}"></span></div>`;$('stat-bars').append(el);
  }
  function renderQuickTools(){const s=engine.state;const slots=[['knife',s.quickTools.knife],['axe',s.quickTools.axe],['bow','bow'],['rod','rod']];$('quick-tools').innerHTML=slots.map(([slot,id])=>`<button class="quick-item" data-slot="${slot}" data-use="${id}" aria-label="${name(id)}" aria-pressed="false" title="${name(id)}">${art(id)}<span data-count="${id}"></span></button>`).join('');paintIcons($('quick-tools'));}
  renderQuickTools();
  function renderQuickFood(){const id=engine.state.quickFood||'berries';$('quick-food').innerHTML=`<button class="quick-item quick-food-slot" data-slot="food" data-use="${id}" data-quick-food="${id}" aria-label="${name(id)}" aria-pressed="false" title="${name(id)}">${art(id)}<span data-count="${id}"></span></button>`;paintIcons($('quick-food'));}
  renderQuickFood();paintIcons();
  function syncHUD(){const s=engine.state,p=s.player;
    if($('quick-food').firstElementChild?.dataset.quickFood!==(s.quickFood||'berries'))renderQuickFood();
    if($('quick-tools').querySelector('[data-slot="knife"]')?.dataset.use!==s.quickTools.knife||$('quick-tools').querySelector('[data-slot="axe"]')?.dataset.use!==s.quickTools.axe)renderQuickTools();
    for(const k of ['hunger','thirst','energy','warmth']){$('value-'+k).textContent=Math.round(p[k]);$('bar-'+k).style.width=p[k]+'%';$('meter-'+k).setAttribute('aria-valuenow',String(Math.round(p[k])));}
    $('stance-label').textContent=p.crouching?'Hiljaa aluskasvillisuudessa':'Hiljainen vaeltaja';$('health-label').textContent=Math.round(p.health)+' %';
    $('equipped-label').innerHTML=(s.equipped?name(s.equipped)+(s.equipped==='bow'?' · '+s.inventory.arrows+' nuolta':''):'Vapaat kädet')+'<span>'+(p.crouching?'S / W / ↑ nouse seisomaan':'Yläreunasta työkalut ja eväät')+'</span>';
    $('day-label').textContent='PÄIVÄ '+s.day;const mins=Math.floor(s.dayTime*1440);$('clock-label').textContent=String(Math.floor(mins/60)).padStart(2,'0')+':'+String(mins%60).padStart(2,'0');$('weather-label').textContent=s.weather==='rain'?'SADE':s.dayTime<.22||s.dayTime>.8?'YÖ':'TYYNI';$('weather-icon').textContent=s.weather==='rain'?'☂':s.dayTime<.22||s.dayTime>.8?'☾':'☀';
    const pending=tasks.filter(([k])=>!s.completed[k]);$('task-count').textContent=(tasks.length-pending.length)+' / '+tasks.length;$('task-list').innerHTML=(pending.length?pending.slice(0,3):[['done','Leirisi on valmis. Kulje omaa polkuasi.']]).map(([,title])=>`<li>${title}</li>`).join('');
    document.querySelectorAll('.quick-item').forEach(b=>{const id=b.dataset.use,qty=s.inventory[id]||0,item=items[id],durability=s.toolDurability?.[id],cap=durabilityCaps[id];b.classList.toggle('is-active',s.equipped===id);b.classList.toggle('unavailable',qty<1);b.setAttribute('aria-pressed',String(s.equipped===id));b.querySelector('[data-count]').textContent=id==='bow'?s.inventory.arrows:item?.[2]==='food'?qty:durability!=null&&cap?Math.ceil(durability/cap*100)+'%':'';b.title=name(id)+(qty<1?' · ei repussa':s.equipped===id?' · klikkaa pois käytöstä':item?.[2]==='food'?' · syö':' · varusta');});
    L.apply($('hud'));
    $('fishing-card').hidden=!engine.fishing;if(engine.fishing){const bite=engine.fishing.stage==='bite';$('fishing-card').classList.toggle('bite',bite);$('fishing-label').textContent=bite?'Koho nykäisi — nosta nyt!':'Hiljaa… odota kohon nykäisyä.';$('reel-button').textContent=bite?'Nosta kala!':'Nosta vapa';L.apply($('fishing-card'));}
  }
  function playBookSequence(opening,done){
    clearTimeout(bookFrameTimer);const image=$('book-animation'),frames=opening?bookFrames:[...bookFrames].reverse();let i=0;
    if(reducedMotion()){image.hidden=true;image.src='assets/book-open.png';done?.();return;}
    image.hidden=false;const next=()=>{if(i>=frames.length){image.hidden=true;done?.();return;}image.src='assets/'+frames[i++]+'.png';bookFrameTimer=setTimeout(next,70);};next();
  }
  // Keep keyboard focus within the closed book until its pages have finished turning.
  function restoreModalFocus(){if(returnFocus?.isConnected&&!returnFocus.closest('nav'))returnFocus.focus();else canvas.focus();}
  function finishModalClose(){if(!modalClosing)return;modalClosing=false;clearTimeout(modalCloseTimer);clearTimeout(bookFrameTimer);modal.classList.remove('is-closing','is-opening','journal-shell');shell.classList.remove('journal-open');$('modal-backdrop').classList.remove('is-closing');$('modal-backdrop').hidden=true;$('book-animation').hidden=true;restoreModalFocus();}
  function openPanel(kind){
    if(!engine.state.running&&!['confirm','settings'].includes(kind))return;
    if(panel===kind&&!modalClosing){if(journalPanels.has(kind))return;closePanel();return;}
    if(panel&&journalPanels.has(panel)&&journalPanels.has(kind)&&!modalClosing){panel=kind;renderPanel();PEAudio.play('pageFlip',.6);return;}
    if(kind==='dialogue'){dialogueStage=engine.state.traders.aarni.introDone?'smalltalk':'welcome';visits++;}
    clearTimeout(modalCloseTimer);clearTimeout(bookFrameTimer);modalClosing=false;modal.classList.remove('is-closing');$('modal-backdrop').classList.remove('is-closing');returnFocus=document.activeElement;panel=kind;engine.keys={};engine.walkTarget=null;engine.state.player.moving=false;renderer.hover=null;$('world-tip').hidden=true;$('modal-backdrop').hidden=false;
    const isJournal=journalPanels.has(kind);shell.classList.toggle('journal-open',isJournal);modal.classList.toggle('journal-shell',isJournal);modal.classList.toggle('is-opening',isJournal);renderPanel();modal.focus();
    if(isJournal)playBookSequence(true,()=>modal.classList.remove('is-opening'));PEAudio.play(isJournal?'pageTurn':'uiOpen',.5);
  }
  function closePanel(){if(!panel||modalClosing)return;const wasJournal=journalPanels.has(panel);panel=null;modalClosing=true;modal.classList.remove('is-opening');modal.classList.add('is-closing');$('modal-backdrop').classList.add('is-closing');if(wasJournal){playBookSequence(false,finishModalClose);PEAudio.play('pageTurn',.5);}else{modalCloseTimer=setTimeout(finishModalClose,reducedMotion()?0:180);PEAudio.play('uiClose',.5);}save();}
  function renderPanel(){
    if(!panel)return;const s=engine.state,oldScroll=content.scrollTop,oldFocus=document.activeElement?.dataset?.select||null;
    const headings={inventory:['Reppu','KAIKKI TARPEELLINEN MUKANA'],craft:['Käsityöt','OMIN KÄSIN · LUONNON ANTIMISTA'],map:['Korpilaakson kartta','YHDEN POLUN ALKU'],journal:['Kenttämuistiinpanot','PIENIÄ HETKIÄ METSÄSTÄ'],help:['Retkeilijän opas','KULJE OMAAN TAHTIISI'],pause:['Päävalikko','RETKESI ON TURVASSA'],trade:['Aarnin leirillä','VANHAN METSÄNKÄVIJÄN TARINOITA'],fire:['Nuotion äärellä','LÄMPÖÄ JA LÄMMIN ATERIA'],confirm:['Uusi retki?','NYKYINEN RETKI ON TALLENNETTU']};
    headings.dialogue=['Aarni','A WARM HEARTH · A FAMILIAR FACE'];headings.settings=['Settings','MAKE YOURSELF AT HOME'];headings.trade=['Aarni’s table','A FAIR EXCHANGE'];headings.map=['The northern trails','A MAP OF THINGS TO COME'];
    modal.dataset.panel=panel;
    $('modal-title').textContent=headings[panel][0];$('modal-kicker').textContent=headings[panel][1];
    $('journal-tabs').hidden=!journalPanels.has(panel);$('journal-tabs').querySelectorAll('button').forEach(b=>{const active=b.dataset.panel===panel;b.classList.toggle('active',active);b.setAttribute('aria-current',active?'page':'false');});
    if(panel==='inventory'){
      const visible=Object.keys(items).filter(id=>s.inventory[id]>0&&(tab==='all'||tab==='tools'&&items[id][2]==='tool'||tab==='food'&&['food','raw'].includes(items[id][2])||tab==='material'&&items[id][2]==='material'));
      if(!visible.includes(selected))selected=visible[0];
      const id=selected,data=items[id],use=data?.[2]==='tool'||data?.[2]==='food',quick=s.quickFood||'berries',durability=data?.[2]==='tool'&&s.toolDurability?.[id]!=null?Math.ceil(s.toolDurability[id]/durabilityCaps[id]*100):null;
      content.innerHTML=`<div class="inventory-toolbar"><div class="tabs">${[['all','Kaikki'],['tools','Työkalut'],['food','Eväät'],['material','Tarvikkeet']].map(([key,label])=>`<button data-tab="${key}" class="${tab===key?'active':''}">${label}</button>`).join('')}</div></div><div class="pack-body"><div class="inventory-grid">${visible.map(key=>`<button class="item-slot ${key===id?'selected':''} ${s.equipped===key?'equipped':''} ${quick===key?'quick-assigned':''}" data-select="${key}" ${(items[key][2]==='food'||engine.isKnife(key)||engine.isAxe(key))?`draggable="true" data-item-drag="${key}"`:''} aria-label="${name(key)}, ${s.inventory[key]} kappaletta" aria-pressed="${key===id}">${art(key)}<span class="count">${s.inventory[key]}</span></button>`).join('')}${Array.from({length:Math.max(0,15-visible.length)},()=>'<div class="item-slot empty"></div>').join('')}</div><div class="item-detail">${data?`${art(id,'detail-art')}<div class="detail-category">${category[data[2]]}</div><h3>${data[0]}</h3><p>${data[1]}</p><p class="detail-meta">Repussa ${s.inventory[id]} kpl${s.equipped===id?' · Käytössä':''}${durability!=null?' · Kunto '+durability+' %':''}</p>${use?`<button class="primary" data-use="${id}">${data[2]==='food'?'Syö eväs':s.equipped===id?'Pois kädestä':'Ota käyttöön'} <span>↗</span></button>${data[2]==='food'?`<button class="text-button quick-assign-button" data-assign-slot="food" data-item="${id}" ${quick===id?'disabled':''}>${quick===id?'Valittu pikaevääksi':'Aseta pikaevääksi'}</button>`:''}`:data[2]==='raw'?'<button class="text-button" data-panel="help">Kypsennä palavan nuotion äärellä.</button>':'<button class="text-button" data-panel="craft">Avaa käsityöt →</button>'}`:'<p class="empty-message">Tässä taskussa ei vielä ole mitään. Kerää polulta tarvikkeita hiirellä.</p>'}</div></div>`;
      const slot=engine.isKnife(id)?'knife':engine.isAxe(id)?'axe':null;if(slot){const action=document.createElement('button');action.className='text-button';action.dataset.assignSlot=slot;action.dataset.item=id;action.textContent='Aseta pikapaikkaan';content.querySelector('.item-detail').append(action);}
      const hint=document.createElement('p');hint.className='belt-hint';hint.textContent='Vedä puukko, kirves tai eväs yläpalkin vastaavaan paikkaan.';content.querySelector('.inventory-toolbar').append(hint);
    }else if(panel==='craft'){
      // The engine owns permanent material discovery and recipe visibility.
      const recipeKnown=v=>engine.recipeKnown(v),known=recipes.filter(recipeKnown);
      let r=known.find(v=>v.id===recipe)||known[0];if(r)recipe=r.id;
      const can=r&&engine.requirements(r);
      const rows=recipes.map(v=>{const discovered=recipeKnown(v);return discovered?`<button class="recipe-row ${v.id===r?.id?'selected':''}" data-recipe="${v.id}" aria-pressed="${v.id===r?.id}">${art(v.id==='wood'?'kindling':v.id)}<span>${v.name||name(v.id)}<small class="${engine.requirements(v)?'':'missing'}">${engine.requirements(v)?'Tarvikkeet valmiina':'Katso tarvikkeet'}</small></span></button>`:`<div class="recipe-row undiscovered" role="img" aria-label="Undiscovered recipe">${unknownRecipeArt(v.id)}<span class="visually-hidden">Undiscovered recipe</span></div>`;}).join('');
      const options=r?(r.toolAny||(r.tool?[r.tool]:[])):[],toolReady=options.some(id=>engine.toolReady?engine.toolReady(id):s.inventory[id]>0),toolLabel=options.map(id=>name(id).toLowerCase()).join(' / ');
      const detail=r?`<div class="recipe-detail"><div class="recipe-top">${art(r.id==='wood'?'kindling':r.id)}<div><p class="detail-category">${r.structure?'LEIRIN RAKENTAMINEN':'KÄSIN VALMISTETTU'}</p><h3>${r.name||name(r.id)}</h3></div></div><p>${r.desc}</p><div class="ingredients">${Object.entries(r.need).map(([k,n])=>`<div class="ingredient ${s.inventory[k]<n?'missing':''}">${art(k)}<span>${name(k)}</span><strong>${s.inventory[k]} / ${n}</strong></div>`).join('')}</div>${options.length?`<div class="requirement ${toolReady?'':'missing'}">${toolReady?'✓':'◇'} Sopiva työkalu: ${toolLabel}.<br>Työkalu ei kulu valmistuksessa.${toolReady?'':` <button class="text-button" data-recipe="${r.tool}">Katso sen resepti →</button>`}</div>`:'<div class="requirement">Valmistuu paljain käsin. Et tarvitse muita työkaluja.</div>'}<button class="primary" data-craft="${r.id}" ${can?'':'disabled'}>${can?r.structure?'Rakenna tähän':'Valmista':'Tarvikkeita puuttuu'} <span>↗</span></button></div>`:`<div class="recipe-detail discovery-note"><div class="recipe-top">${art('journal')}<div><p class="detail-category">TUNTEMATON KÄSITYÖ</p><h3>Kerää ja tunnista tarvikkeita</h3></div></div><p>Uudet reseptit piirtyvät tähän, kun olet löytänyt niiden tarvitsemat tarviketyypit.</p></div>`;
      content.innerHTML=`<div class="craft-layout"><div class="recipe-list">${rows}</div>${detail}</div>`;
    }else if(panel==='journal'){
      content.innerHTML=`<div class="journal-view wildlife-journal"><div class="journal-intro"><p class="detail-category">METSÄN ASUKKAAT</p><h3>Metsän asukkaat</h3><p>Hiljainen kulkija näkee enemmän. Lähesty riistaa kyykyssä ja anna metsän kertoa nimensä omassa tahdissaan.</p><p class="journal-count">${Object.keys(animalNames).filter(k=>s.journal.seen[k]).length} / ${Object.keys(animalNames).length} havaittu</p></div><div class="wildlife-entries">${Object.entries(animalNames).map(([k,n])=>{const seen=!!s.journal.seen[k];return `<article class="journal-animal ${seen?'observed':'undiscovered'}">${animalArt(k,seen)}${seen?`<div><h4>${n}</h4><span>${s.journal.hunted[k]?'Saaliiksi saatu':'Havaittu'}</span></div>`:'<div class="unknown-animal" aria-label="Unknown wildlife entry"><b>?</b><span class="visually-hidden">Unknown wildlife entry</span></div>'}</article>`;}).join('')}</div></div>`;
    }else if(panel==='pause'){
      content.innerHTML='<div class="pause-view"><button class="primary" data-resume="true">Jatka retkeä <span>⟶</span></button><div class="pause-actions"><button data-panel="settings"><span>⚙</span><strong>Asetukset</strong></button><button data-audio="true"><span>♪</span><strong>Äänet</strong><small>Mykistä tai palauta metsän äänet</small></button><button data-panel="help"><span>?</span><strong>Ohjeet</strong></button><button data-fullscreen="true"><span>⛶</span><strong>Koko näyttö</strong></button></div><button class="text-button title-menu-action" data-title-menu="true">Palaa aloitusvalikkoon</button><p>Retkesi tallennetaan ennen aloitusvalikkoon palaamista.</p></div>';
    }else if(panel==='help'){
      content.innerHTML='<div class="help-view"><dl><div><dt>A / D tai ← / →</dt><dd>Kulje polkua. Shift-näppäimellä juokset.</dd></div><div><dt>S / ↓ · W / ↑</dt><dd>Kyykisty ja nouse. Kyykyssä liikut hiljaisemmin ja pääset lähemmäs riistaa.</dd></div><div><dt>Hiiren klikkaus</dt><dd>Klikkaa korostettua kohdetta: hahmo kävelee viereen ja kerää. Voit myös juoda, käyttää leiriä tai heittää Kajolle kepin.</dd></div><div><dt>Yläreuna</dt><dd>Työkalut, yksi valitsemasi pikaeväs ja päiväkirja tulevat näkyviin.</dd></div><div><dt>Päiväkirja</dt><dd>Reppu, käsityöt, kenttämuistiinpanot ja kartta ovat saman kirjan välilehdillä. Vedä eväs repusta pikaeväspaikkaan tai valitse se painikkeella.</dd></div><div><dt>Piikivikirves</dt><dd>Tee piikiviveitsi ja naru, sitten piikivikirves. Aarnilta voit myöhemmin vaihtaa kestävämmän teräskirveen.</dd></div><div><dt>Jousi ja vapa</dt><dd>Jousella tähtää ja ammu hiirellä. Vavalla klikkaa vettä, odota kohon nykäisyä ja nosta kala.</dd></div></dl><p>Peli tallentaa automaattisesti selaimeen. Valikot ja piilotettu välilehti pysäyttävät peliajan. Metsä on toistaiseksi ainoa alue.</p><button class="text-button" data-panel="pause">← Takaisin päävalikkoon</button></div>';
    }else if(panel==='confirm'){
      content.innerHTML='<div class="confirm-view"><p>Uusi retki korvaa tämän selaimen nykyisen tallennuksen. Vanhan peliversion alkuperäinen tallennus säilyy erikseen.</p><button class="primary" data-new="true">Aloita uusi retki</button><button class="primary" data-cancel="true">Peruuta</button></div>';
    }
    if(panel==='help'){const hint=document.createElement('p');hint.className='help-shortcuts';hint.textContent='Tab opens or closes Journal. S toggles crouching; W stands up. Hover Kajo, use the wheel to choose an action, then click to confirm.';content.append(hint);}
    if(panel==='map')content.innerHTML=TimberPanels.map();
    if(panel==='dialogue')content.innerHTML=TimberPanels.dialogue(dialogueStage,visits);
    if(panel==='trade')content.innerHTML=TimberPanels.trade(s,art);
    if(panel==='fire')content.innerHTML=TimberPanels.fire(s,engine,art,name);
    if(panel==='settings')content.innerHTML=TimberPanels.settings();
    L.apply(modal);paintIcons(content);paintRecipeSilhouettes(content);paintWildlife(content);content.scrollTop=oldScroll;if(oldFocus)content.querySelector(`[data-select="${oldFocus}"]`)?.focus({preventScroll:true});
  }
  document.addEventListener('click',e=>{
    // A closing cover remains modal even though its panel contents are already released.
    if(modalClosing)return;
    const b=e.target.closest('button');if(!b)return;
    if(b.id==='journal-button'&&panel&&journalPanels.has(panel)){closePanel();return;}
    if(b.dataset.panel){openPanel(b.dataset.panel);return;}
    if(b.dataset.resume){closePanel();return;}
    if(b.dataset.titleMenu){returnToTitle();return;}
    if(b.dataset.audio){toggleSound();renderPanel();return;}
    if(b.dataset.audioChannel){const key=b.dataset.audioChannel;PEAudio.configure({[key]:!PEAudio.settings()[key]});renderPanel();return;}
    if(b.dataset.region){b.focus();return;}
    if(b.dataset.fullscreen){toggleFullscreen();return;}
    if(b.dataset.assignSlot){if(engine.assignQuickSlot(b.dataset.assignSlot,b.dataset.item)){syncHUD();renderPanel();save();PEAudio.play('equip',.45);}return;}
    if(b.dataset.use){engine.use(b.dataset.use);save();}
    if(b.dataset.tab){tab=b.dataset.tab;renderPanel();PEAudio.play('uiTick',.6);}
    if(b.dataset.select){selected=b.dataset.select;renderPanel();PEAudio.play('uiTick',.6);}
    if(b.dataset.recipe){recipe=b.dataset.recipe;renderPanel();}
    if(b.dataset.craft){engine.craft(b.dataset.craft);save();}
    if(b.dataset.cook){engine.cook(b.dataset.cook);save();}
    if(b.dataset.trade){engine.trade(b.dataset.trade);save();}
    if(b.dataset.fuel){engine.fuelFire(b.dataset.fuel);save();}
    if(b.dataset.reply){dialogueStage=b.dataset.reply;if(dialogueStage==='trade'){panel='trade';engine.finishDialogue();}else panel='dialogue';renderPanel();PEAudio.play('uiTick',.5);}
    if(b.dataset.language){L.set(b.dataset.language);syncHUD();renderPanel();}
    if(b.dataset.travel){engine.travel();closePanel();syncHUD();save();}
    if(b.dataset.save){save();if(!saveFailed)notice('Retki tallennettu.');}
    if(b.dataset.new){start(false);}
    if(b.dataset.cancel)closePanel();
  });
  let draggedItem=null;
  document.addEventListener('input',e=>{const key=e.target.dataset?.audioVolume;if(!key)return;const value=Number(e.target.value);PEAudio.configure({[key]:value/100});const out=$('volume-value-'+key);if(out)out.textContent=value+'%';});
  const fitsSlot=(slot,id)=>slot==='food'?items[id]?.[2]==='food':slot==='knife'?engine.isKnife(id):slot==='axe'?engine.isAxe(id):false;
  document.addEventListener('dragstart',e=>{const item=e.target.closest?.('[data-item-drag]');if(!item||!journalPanels.has(panel))return;draggedItem=item.dataset.itemDrag;e.dataTransfer?.setData('text/plain',draggedItem);if(e.dataTransfer)e.dataTransfer.effectAllowed='copy';document.querySelectorAll('[data-slot]').forEach(b=>b.classList.toggle('drop-ready',fitsSlot(b.dataset.slot,draggedItem)));});
  const clearDrag=()=>{draggedItem=null;document.querySelectorAll('[data-slot]').forEach(b=>b.classList.remove('drop-ready','drag-over'));};
  document.addEventListener('dragend',clearDrag);
  document.addEventListener('dragover',e=>{const b=e.target.closest?.('[data-slot]');if(b&&journalPanels.has(panel)&&fitsSlot(b.dataset.slot,draggedItem)){e.preventDefault();if(e.dataTransfer)e.dataTransfer.dropEffect='copy';b.classList.add('drag-over');}});
  document.addEventListener('dragleave',e=>e.target.closest?.('[data-slot]')?.classList.remove('drag-over'));
  document.addEventListener('drop',e=>{const b=e.target.closest?.('[data-slot]');if(!b||!journalPanels.has(panel))return;e.preventDefault();const id=e.dataTransfer?.getData('text/plain');if(fitsSlot(b.dataset.slot,id)&&engine.assignQuickSlot(b.dataset.slot,id)){syncHUD();renderPanel();save();PEAudio.play('equip',.45);}clearDrag();});
  $('start-button').addEventListener('click',()=>saved?openPanel('confirm'):start(false));$('continue-button').addEventListener('click',()=>start(true));$('close-modal').addEventListener('click',closePanel);
  $('modal-backdrop').addEventListener('click',e=>{if(e.target===$('modal-backdrop'))closePanel();});
  function toggleSound(){const on=PEAudio.toggle();notice(on?'Metsän äänet päällä.':'Äänet mykistetty.');return on;}
  async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await shell.requestFullscreen();}catch{notice('Selain ei sallinut koko näytön tilaa.');}}
  $('dismiss-onboarding').addEventListener('click',()=>$('onboarding').hidden=true);$('reel-button').addEventListener('click',()=>engine.reel());$('cancel-fishing').addEventListener('click',()=>{engine.fishing=null;syncHUD();});
  function coords(e){const b=canvas.getBoundingClientRect();return{x:(e.clientX-b.left)/b.width*W,y:(e.clientY-b.top)/b.height*H};}
  function targetAt(p){if(!p)return null;const wx=p.x+engine.state.camera;return engine.targets().map(o=>{const gy=ground(o.x)+(o.depth||0),h=o.type==='cabin'?62:o.type==='tree'?135:o.type==='animal'&&o.species==='deer'?55:['log','carcass'].includes(o.type)?18:27,dx=Math.abs(wx-o.x),dy=Math.abs(p.y-(gy-h*.42));return{o,score:dx+dy*.7,hit:dx<(o.type==='cabin'?15:o.type==='water'?40:o.type==='animal'?25:o.type==='tree'?17:23)&&p.y>gy-h-5&&p.y<gy+15};}).filter(v=>v.hit).sort((a,b)=>a.score-b.score)[0]?.o||null;}
  function updateTip(){const tip=$('world-tip'),o=renderer.hover;tip.hidden=!o;if(o){
    if(o.type==='dog'){const options=engine.dogActions();if(!options.includes(dogChoice))dogChoice='pet';const labels={pet:'Pet Kajo',stick:'Throw a stick',retrieve:'Retrieve the bird'};tip.textContent='Kajo · '+L.text(labels[dogChoice])+'\n'+L.text('Wheel to choose · Click to confirm');}
    else tip.textContent=L.text(engine.label(o));
    tip.style.left=clamp((o.x-engine.state.camera)/W*100,24,80)+'%';tip.style.top=Math.min(ground(o.x)+23,H-45)/H*100+'%';}}
  shell.addEventListener('pointermove',e=>{
    pointer=coords(e);if(!engine.state.running)return;
    const overRail=!!e.target.closest('nav'),top=pointer.y<H/6||!!e.target.closest('#quick-rail');
    shell.classList.toggle('show-top',top&&!panel&&!modalClosing);
    if(!panel&&!modalClosing&&!top&&document.activeElement?.closest('#quick-rail'))canvas.focus({preventScroll:true});
    pointerWorld=!panel&&!modalClosing&&!overRail;renderer.pointer=pointerWorld?pointer:null;renderer.hover=pointerWorld?targetAt(pointer):null;
    const tip=$('world-tip');tip.hidden=!renderer.hover;
    updateTip();
    canvas.style.cursor=renderer.hover?'pointer':engine.state.equipped==='bow'?'crosshair':'default';
  });
  shell.addEventListener('pointerleave',()=>{shell.classList.remove('show-top');if(!panel&&!modalClosing&&document.activeElement?.closest('nav'))canvas.focus({preventScroll:true});renderer.hover=null;renderer.pointer=null;pointer=null;$('world-tip').hidden=true;});
  canvas.addEventListener('wheel',e=>{if(!engine.state.running||panel||modalClosing||!e.deltaY||targetAt(coords(e))?.type!=='dog')return;e.preventDefault();const now=performance.now();if(now-lastDogWheel<110)return;lastDogWheel=now;const options=engine.dogActions();dogChoice=options[(Math.max(0,options.indexOf(dogChoice))+Math.sign(e.deltaY)+options.length)%options.length];renderer.hover=targetAt(coords(e));updateTip();},{passive:false});
  canvas.addEventListener('click',e=>{if(!engine.state.running||panel||modalClosing)return;const p=coords(e),target=targetAt(p);canvas.focus();if(engine.state.equipped==='bow'&&(!target||target.type==='animal'))engine.shoot(p.x+engine.state.camera,p.y);else engine.interact(target?.type==='dog'?{...target,command:engine.dogActions().includes(dogChoice)?dogChoice:'pet'}:target);});
  document.addEventListener('keydown',e=>{
    if(e.code==='Tab'&&!e.shiftKey&&(journalPanels.has(panel)||modalClosing)){e.preventDefault();if(!e.repeat)closePanel();return;}
    if(e.code==='Tab'&&!panel&&!modalClosing&&engine.state.running&&!e.shiftKey){e.preventDefault();if(!e.repeat)openPanel('inventory');return;}
    if(e.code==='Escape'&&(panel||modalClosing)){e.preventDefault();closePanel();return;}
    if(panel||modalClosing){if(!modalClosing&&['Enter','Space'].includes(e.code)&&e.target.closest?.('#quick-food-drop')&&items[selected]?.[2]==='food'){e.preventDefault();if(engine.assignQuickFood(selected)){renderQuickFood();renderPanel();syncHUD();save();notice('Pikaeväs vaihdettu.');}return;}if(!modalClosing&&e.code==='Tab'){const focusable=[...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]'),...(journalPanels.has(panel)?$('quick-rail').querySelectorAll('button:not([disabled])'):[])],first=focusable[0],end=focusable[focusable.length-1];if(e.shiftKey&&(document.activeElement===first||document.activeElement===modal)){e.preventDefault();end?.focus();}else if(!e.shiftKey&&document.activeElement===end){e.preventDefault();first?.focus();}}return;}
    if(!engine.state.running)return;if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','KeyA','KeyD','KeyS','KeyW','ShiftLeft','ShiftRight'].includes(e.code)){e.preventDefault();engine.keys[e.code]=true;if(['ArrowDown','KeyS'].includes(e.code)&&!e.repeat)engine.setCrouch(!engine.state.player.crouching);if(['ArrowUp','KeyW'].includes(e.code))engine.setCrouch(false);}
  });
  document.addEventListener('keyup',e=>delete engine.keys[e.code]);window.addEventListener('blur',()=>{engine.keys={};});
  document.addEventListener('visibilitychange',()=>{engine.keys={};last=performance.now();PEAudio.pause(document.hidden);if(document.hidden)save();});window.addEventListener('pagehide',save);
  function frame(now){const dt=Math.min((now-last)/1000,.05);last=now;
    if(!document.hidden){if(engine.state.running&&!panel&&!modalClosing){engine.update(dt);if(pointer&&pointerWorld){renderer.hover=targetAt(pointer);updateTip();}}renderer.draw(engine);PEAudio.update(engine.state,engine,!!panel||modalClosing);hudClock+=dt;if(hudClock>.25){syncHUD();hudClock=0;}}
    requestAnimationFrame(frame);
  }
  saved=readSave();renderer.scenery=[null,null,null];let loaded=0,loadFailed=false,equipmentReady=false,bookReady=false;
  const assets=[['west','forest-west'],['ravine','forest-ravine'],['upland','forest-upland'],['sprites','traveller-and-kajo'],['wildlife','woodland-wildlife'],['props','timber-props'],['poses','timber-poses'],['chopTree','chop-standing'],['chopLog','chop-ground'],['treeVariants','forest-trees']];
  assets.push(['runPoses','traveller-run']);
  function finishLoading(){if(ready||loadFailed||loaded!==assets.length||!equipmentReady||!bookReady)return;ready=true;$('start-button').disabled=false;refreshTitle();}
  for(const [key,path]of assets){const img=new Image();img.onload=()=>{const i=['west','ravine','upland'].indexOf(key);if(i>=0){renderer.scenery[i]=img;if(i===0)renderer.forest=img;}else renderer[key]=img;loaded++;if(key==='wildlife')paintWildlife(content);finishLoading();};img.onerror=()=>{loadFailed=true;$('load-note').textContent='Metsäkuvaa ei voitu ladata. Tarkista, että assets-kansio on index.html-tiedoston vieressä.';$('start-button').textContent='Lataus epäonnistui';L.apply($('title-card'));};img.src='assets/'+path+'.png';}
  Promise.all([window.PEEquipment?.loadAssets?.(),window.PEIcons?.load?.()]).then(()=>{equipmentReady=true;paintIcons();finishLoading();}).catch(()=>{loadFailed=true;$('load-note').textContent='Työkalukuvia ei voitu ladata assets-kansiosta.';$('start-button').textContent='Lataus epäonnistui';L.apply($('title-card'));});
  Promise.all(['book-icon',...bookFrames].map(frame=>new Promise((resolve,reject)=>{const img=new Image();img.onload=resolve;img.onerror=reject;img.src='assets/'+frame+'.png';}))).then(()=>{bookReady=true;finishLoading();}).catch(()=>{loadFailed=true;$('load-note').textContent='Journal images could not be loaded.';});
  L.apply(document);syncHUD();requestAnimationFrame(frame);
})();
