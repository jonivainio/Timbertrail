// A deliberately non-browser DOM/event harness: verifies integration, not CSS layout.
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const dir=path.resolve(__dirname,'..');
const decode=t=>t.replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>');
class Element {
 constructor(tag,doc){this.tagName=tag.toUpperCase();this.ownerDocument=doc;this.children=[];this.parentElement=null;this.attributes={};this.dataset={};this.style={};this.listeners={};this.hidden=false;this.disabled=false;this.scrollTop=0;this._text='';this.width=300;this.height=150;}
 get id(){return this.attributes.id||'';}set id(v){this.setAttribute('id',v);}get className(){return this.attributes.class||'';}set className(v){this.attributes.class=v;}
 get classList(){const el=this;return{contains:k=>el.className.split(/\s+/).includes(k),add(...ks){el.className=[...new Set([...el.className.split(/\s+/),...ks])].join(' ').trim();},remove(...ks){el.className=el.className.split(/\s+/).filter(k=>!ks.includes(k)).join(' ');},toggle(k,v){const yes=v===undefined?!this.contains(k):v;yes?this.add(k):this.remove(k);return yes;}};}
 setAttribute(k,v){v=String(v);this.attributes[k]=v;if(k.startsWith('data-'))this.dataset[k.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=v;if(k==='hidden')this.hidden=true;if(k==='disabled')this.disabled=true;if(k==='width'||k==='height')this[k]=Number(v);}
 hasAttribute(k){return k in this.attributes;}getAttribute(k){return this.attributes[k]??null;}get textContent(){return this._text+this.children.map(c=>c.textContent).join('');}set textContent(v){this._text=String(v);this.children=[];}
 set innerHTML(html){this.children=[];this._text='';parse(html,this);}get innerHTML(){return this.children.map(c=>'<'+c.tagName+'>'+c.innerHTML+'</'+c.tagName+'>').join('')+this._text;}
 get firstElementChild(){return this.children[0]||null;}
 append(el){el.parentElement=this;this.children.push(el);}get isConnected(){return this===this.ownerDocument||!!this.parentElement?.isConnected;}
 matches(selector){if(selector.includes(','))return selector.split(',').some(s=>this.matches(s.trim()));const not=selector.match(/:not\(([^)]+)\)/);if(not&&this.matches(not[1]))return false;selector=selector.replace(/:not\([^)]+\)/g,'');const tag=selector.match(/^[\w-]+/);if(tag&&tag[0].toUpperCase()!==this.tagName)return false;for(const m of selector.matchAll(/#([\w-]+)/g))if(this.id!==m[1])return false;for(const m of selector.matchAll(/\.([\w-]+)/g))if(!this.classList.contains(m[1]))return false;for(const m of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)){if(m[1]==='disabled'){if(!this.disabled)return false;}else if(!(m[1] in this.attributes))return false;if(m[2]!==undefined&&this.getAttribute(m[1])!==m[2])return false;}return true;}
 querySelectorAll(selector){const result=[];for(const c of this.children){if(c.matches(selector))result.push(c);result.push(...c.querySelectorAll(selector));}return result;}querySelector(s){return this.querySelectorAll(s)[0]||null;}closest(s){return this.matches(s)?this:this.parentElement?.closest(s)||null;}
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn);}dispatch(type,extra={}){const event={target:this,preventDefault(){},...extra};for(let el=this;el;el=el.parentElement)for(const f of el.listeners[type]||[])f(event);}
 focus(){this.ownerDocument.activeElement=this;}getBoundingClientRect(){return{left:0,top:0,width:960,height:540};}requestFullscreen(){this.ownerDocument.fullscreenElement=this;return Promise.resolve();}
 getContext(){return new Proxy({measureText:t=>({width:t.length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{}),set:(o,k,v)=>(o[k]=v,true)});}
}
function parse(html,parent){const stack=[parent];for(const token of html.match(/<!--[\s\S]*?-->|<[^>]+>|[^<]+/g)||[]){if(token.startsWith('<!--')||token.startsWith('<!'))continue;if(token.startsWith('</')){if(stack.length>1)stack.pop();continue;}if(token[0]==='<'){const m=token.match(/^<([\w-]+)/);if(!m)continue;const el=new Element(m[1],parent.ownerDocument);for(const a of token.slice(m[0].length).matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)'|=([^\s>]+))?/g))el.setAttribute(a[1],decode(a[2]??a[3]??a[4]??''));stack.at(-1).append(el);if(!['meta','link','br','hr','img','input'].includes(m[1])&&!token.endsWith('/>'))stack.push(el);}else stack.at(-1)._text+=decode(token);}}
const doc=new Element('document',null);doc.ownerDocument=doc;doc.createElement=t=>new Element(t,doc);doc.getElementById=id=>doc.querySelector('#'+id);doc.hidden=false;doc.exitFullscreen=()=>Promise.resolve();parse(fs.readFileSync(path.join(dir,'index.html'),'utf8'),doc);
doc.documentElement=doc.querySelector('html');doc.createTreeWalker=scope=>{const nodes=[];function visit(el){if(el._text){if(!el._textNode)el._textNode={parentElement:el,get nodeValue(){return el._text;},set nodeValue(v){el._text=v;}};nodes.push(el._textNode);}for(const c of el.children)visit(c);}visit(scope);let i=0;return{nextNode:()=>nodes[i++]||null};};
const storage=new Map([['pine-and-ember-save-v1',JSON.stringify({player:{x:565},inventory:{wood:40,stone:30,fiber:30,berries:3,knife:1,bow:1,arrows:4},completed:{makeKnife:true}})]]);
let raf;const imageLoads=[];class TestImage{get src(){return this._src;}set src(value){this._src=value;imageLoads.push(Promise.resolve().then(()=>{const b=fs.readFileSync(path.join(dir,value));this.width=b.readUInt32BE(16);this.height=b.readUInt32BE(20);this.onload?.();}));}}
let timerId=0;const timers=new Map();const advance=()=>{for(let pass=0;pass<8;pass++){const batch=[...timers].filter(([,v])=>v.delay<=350);for(const [id,v]of batch){timers.delete(id);v.fn();}}};
const context={document:doc,Image:TestImage,console,performance,setTimeout:(fn,delay)=>(timers.set(++timerId,{fn,delay}),timerId),clearTimeout:id=>timers.delete(id),requestAnimationFrame:fn=>{raf=fn;},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener(){},};context.window=context;context.globalThis=context;


vm.createContext(context);for(const file of ['i18n.js','engine.js','render.js','panels.js'])vm.runInContext(fs.readFileSync(path.join(dir,file),'utf8'),context,{filename:file});
let engine;const Base=context.PE.Engine;context.PE.Engine=class extends Base{constructor(...a){super(...a);if(!engine)engine=this;}};
const sounds=[];context.PEAudio={play(n){sounds.push(n);},start(){},toggle(){return false;},pause(){},update(){},settings:()=>({soundOn:true,musicOn:true,soundVolume:.7,musicVolume:.4})};
vm.runInContext(fs.readFileSync(path.join(dir,'game.js'),'utf8'),context,{filename:'game.js'});
const $=id=>doc.getElementById(id),click=sel=>{const b=doc.querySelector(sel);assert.ok(b,'Element exists: '+sel);assert.equal(b.disabled,false);b.dispatch('click');};
(async()=>{await Promise.all(imageLoads);await Promise.resolve();await Promise.resolve();
assert.equal(context.L.lang,'en');assert.equal($('start-button').disabled,false);
click('#continue-button');assert.equal(engine.state.inventory.wood,40);assert.ok(storage.has('timbertrail-save-v3'));
click('#journal-button');assert.ok($('modal').classList.contains('is-opening'));assert.equal($('book-animation').src,'assets/book-opening-1.png');advance();assert.ok(!$('modal').classList.contains('is-opening'));assert.ok($('game-shell').classList.contains('journal-open'));
assert.equal($('quick-tools').querySelectorAll('[data-slot="knife"]').length,1);assert.equal($('quick-tools').querySelectorAll('[data-slot="axe"]').length,1);
assert.equal(engine.assignQuickSlot('knife','wood'),false);assert.equal(engine.assignQuickSlot('knife','knife'),true);assert.equal(engine.assignQuickSlot('food','berries'),true);assert.equal(engine.assignQuickSlot('axe','knife'),false);
click('[data-panel="craft"]');assert.ok(sounds.includes('pageFlip'));click('[data-panel="map"]');assert.ok(doc.querySelector('.regional-map'));click('[data-panel="journal"]');
click('#close-modal');assert.equal($('book-animation').src,'assets/book-open.png');advance();assert.equal($('modal-backdrop').hidden,true);assert.ok(!$('game-shell').classList.contains('journal-open'));assert.ok(sounds.filter(x=>x==='pageTurn').length>=2);
console.log('PASS Journal frame order, tabs/audio events, one typed tool slot, save migration and boot. DOM harness only; not browser layout QA.');
})().catch(e=>{console.error(e);process.exitCode=1;});
