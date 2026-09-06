/* Chest presentation and transient transfer selection; inventory stays authoritative. */
(function(root){'use strict';
const T=s=>root.L?.text(s)||s,escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function create(engine,host,{art,name,active,refresh,notice}){
 let selection=null,drag=null;
 const home=()=>root.PECabin.home(engine),tool=id=>!!root.PE.toolDurability[id];
 const quantity=(id,dir)=>dir==='store'?(engine.state.inventory[id]||0):root.PECabin.count(home(),id);
 const limit=(id,dir)=>Math.max(0,Math.min(quantity(id,dir),tool(id)?1:Infinity,dir==='store'?200-root.PECabin.storageUsed(home()):Infinity,dir==='take'&&tool(id)&&engine.state.inventory[id]?0:Infinity));
 const valid=()=>selection&&Number.isSafeInteger(selection.amount)&&selection.amount>0&&selection.amount<=limit(selection.id,selection.dir);
 function clearDrag(){drag=null;host.querySelectorAll('.storage-pane').forEach(el=>el.classList.remove('drop-ready','drag-over'));host.querySelectorAll('.storage-card').forEach(el=>el.classList.remove('is-dragging'));}
 function reset(){selection=null;clearDrag();}
 function choose(id,dir){if(!Object.hasOwn(root.PE.items,id)||!['store','take'].includes(dir)||!quantity(id,dir))return;selection={id,dir,amount:tool(id)?1:quantity(id,dir)};}
 function status(){
  const button=host.querySelector('[data-storage-send]'),remaining=host.querySelector('#storage-remaining'),message=host.querySelector('#storage-validation');
  if(!selection)return;if(button)button.disabled=!valid();
  if(remaining)remaining.textContent=String(Math.max(0,quantity(selection.id,selection.dir)-(Number.isSafeInteger(selection.amount)?selection.amount:0)));
  if(message)message.textContent=valid()?T('Drag this amount, or use the transfer button.'):T('Choose a valid amount that fits in the destination.');
 }
 function transfer(id,dir,amount){clearDrag();const ok=root.PECabin.transfer(engine,id,dir,amount);
  if(!ok)notice('Transfer cancelled. Check the amount, free space and matching tools.');
  if(selection?.id===id&&selection.dir===dir){const left=quantity(id,dir);if(!left)selection=null;else selection.amount=Math.min(amount,tool(id)?1:left);}
  refresh();host.querySelector('[data-storage-card="'+id+'"][data-direction="'+dir+'"]')?.focus({preventScroll:true});
 }
 function render(){
  const used=root.PECabin.storageUsed(home());
  if(selection&&!quantity(selection.id,selection.dir))selection=null;
  const column=(title,dir)=>{const ids=Object.keys(root.PE.items).filter(id=>quantity(id,dir)>0),side=dir==='store'?'pack':'chest';
   return '<section class="storage-pane" data-storage-zone="'+side+'" aria-label="'+T(title)+'"><header><div><span class="eyebrow">'+T(dir==='store'?'CARRY WITH YOU':'SAFE AT HOME')+'</span><h3>'+T(title)+'</h3></div><span class="storage-tally">'+(dir==='store'?ids.length+' '+T('stacks'):used+' / 200')+'</span></header><div class="storage-grid">'+ids.map(id=>{
    const n=quantity(id,dir),selected=selection?.id===id&&selection.dir===dir,cap=root.PE.toolDurability[id],condition=cap?Math.round((dir==='store'?engine.state.toolDurability[id]:home().tools[id][0])/cap*100):null;
    return '<button class="storage-card'+(selected?' selected':'')+'" draggable="true" data-storage-card="'+id+'" data-direction="'+dir+'" aria-pressed="'+selected+'" aria-label="'+escape(name(id))+' × '+n+'">'+art(id)+'<span class="storage-count">× '+n+'</span><span class="storage-name">'+escape(name(id))+'</span>'+(condition!==null?'<small>'+T('Condition')+' '+condition+'%</small>':id==='canteen'?'<small>'+T(engine.state.canteenFull?'Full · one drink':'Empty · refill at water')+'</small>':'')+'</button>';
   }).join('')+'<div class="storage-drop-hint">'+T('Drop items here')+'</div></div></section>';
  };
  let detail='<div class="storage-empty-detail"><span aria-hidden="true">↔</span><p>'+T('Select a stack to split it or choose an exact amount.')+'</p></div>';
  if(selection){const {id,dir,amount}=selection,n=quantity(id,dir);detail='<div class="storage-selection"><div class="storage-picked">'+art(id)+'<div><h4>'+escape(name(id))+'</h4><span>'+T(dir==='store'?'Backpack → Chest':'Chest → Backpack')+'</span></div></div><div class="storage-quantity"><label for="storage-amount">'+T('Amount to move')+'</label><div class="storage-quantity-controls"><input id="storage-amount" type="number" inputmode="numeric" min="1" max="'+(tool(id)?1:n)+'" step="1" value="'+amount+'"'+(tool(id)?' disabled':'')+'><button data-storage-portion="one">1</button><button data-storage-portion="half" '+(tool(id)||n<2?'disabled':'')+'>'+T('Split half')+'</button><button data-storage-portion="all" '+(tool(id)?'disabled':'')+'>'+T('All')+'</button></div><small>'+T('Left in source')+': <output id="storage-remaining">'+Math.max(0,n-amount)+'</output></small></div><button class="primary storage-send" data-storage-send="true" '+(valid()?'':'disabled')+'>'+T(dir==='store'?'Store in chest':'Take to backpack')+' <span aria-hidden="true">'+(dir==='store'?'→':'←')+'</span></button></div><p id="storage-validation" class="storage-validation" role="status">'+T(valid()?'Drag this amount, or use the transfer button.':'Choose a valid amount that fits in the destination.')+'</p>';}
  return '<div class="home-panel storage-workspace"><p class="storage-instructions">'+T('Drag stacks between the backpack and chest. Shift-drag moves half.')+'</p><div class="storage-capacity" role="meter" aria-label="'+T('Chest capacity')+'" aria-valuemin="0" aria-valuemax="200" aria-valuenow="'+used+'"><span style="width:'+Math.min(100,used/2)+'%"></span></div><div class="storage-columns">'+column('Backpack','store')+column('Storage chest','take')+'</div><div class="storage-detail">'+detail+'</div><p class="storage-footnote">'+T('Tool condition is preserved. Withdraw matching tools one at a time.')+'</p></div>';
 }
 function click(b){if(!active())return false;
  if(b.dataset.storageCard){choose(b.dataset.storageCard,b.dataset.direction);if(!selection)return true;refresh();host.querySelector('[data-storage-card="'+selection.id+'"][data-direction="'+selection.dir+'"]')?.focus({preventScroll:true});return true;}
  if(b.dataset.storagePortion&&selection){const n=quantity(selection.id,selection.dir);selection.amount=tool(selection.id)?1:b.dataset.storagePortion==='half'?Math.max(1,Math.floor(n/2)):b.dataset.storagePortion==='one'?1:n;refresh();host.querySelector('[data-storage-portion="'+b.dataset.storagePortion+'"]')?.focus({preventScroll:true});return true;}
  if(b.dataset.storageSend&&valid()){const {id,dir,amount}=selection;transfer(id,dir,amount);return true;}return false;
 }
 host.addEventListener('input',event=>{if(!active()||event.target.id!=='storage-amount'||!selection)return;selection.amount=Number(event.target.value);status();});
 host.addEventListener('dragstart',event=>{if(!active())return;const card=event.target.closest?.('[data-storage-card]');if(!card)return;
  const id=card.dataset.storageCard,dir=card.dataset.direction,total=quantity(id,dir),amount=tool(id)?1:event.shiftKey?Math.max(1,Math.floor(total/2)):selection?.id===id&&selection.dir===dir?selection.amount:total;
  if(!Number.isSafeInteger(amount)||amount<1||amount>limit(id,dir)){event.preventDefault();notice('Transfer cancelled. Check the amount, free space and matching tools.');return;}
  drag={id,dir,amount,total};event.dataTransfer?.setData('text/plain',name(id)+' × '+amount);if(event.dataTransfer)event.dataTransfer.effectAllowed='move';card.classList.add('is-dragging');
  host.querySelectorAll('.storage-pane').forEach(el=>el.classList.toggle('drop-ready',el.dataset.storageZone===(dir==='store'?'chest':'pack')));
 });
 host.addEventListener('dragover',event=>{const pane=event.target.closest?.('[data-storage-zone]');if(!active()||!drag||!pane||pane.dataset.storageZone!==(drag.dir==='store'?'chest':'pack'))return;event.preventDefault();if(event.dataTransfer)event.dataTransfer.dropEffect='move';pane.classList.add('drag-over');});
 host.addEventListener('dragleave',event=>{const pane=event.target.closest?.('[data-storage-zone]');if(pane&&!pane.contains?.(event.relatedTarget))pane.classList.remove('drag-over');});
 host.addEventListener('drop',event=>{const pane=event.target.closest?.('[data-storage-zone]'),d=drag;if(!active()||!d)return;event.preventDefault();clearDrag();if(!pane||pane.dataset.storageZone!==(d.dir==='store'?'chest':'pack'))return;
  if(quantity(d.id,d.dir)!==d.total){notice('The stack changed. Select it again.');refresh();return;}transfer(d.id,d.dir,d.amount);
 });
 host.addEventListener('dragend',clearDrag);
 return {render,click,reset};
}
root.PEStorage={create};if(typeof module!=='undefined')module.exports=root.PEStorage;
})(typeof window==='undefined'?globalThis:window);
