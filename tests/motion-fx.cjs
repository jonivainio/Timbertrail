const assert=require('node:assert/strict');
global.PERegions=require('../regions.js');global.PE=require('../engine.js');
const fx=require('../motion-fx.js'),art=require('../traveller-art.js');
let rects=0;const c=new Proxy({fillRect(){rects++;}},{get:(o,k)=>k in o?o[k]:()=>{}}),r={c};
const e=new PE.Engine();e.start();const p=e.state.player,tree={id:'t9',type:'tree',x:p.x+28};
fx.setReduced(false);
// Chips and leaves only after a contact; sway settles within 0.3 s and pushes away from the chopper.
e.action={target:{...tree},time:.3,duration:3.6};assert.equal(fx.axeContact(e),null);rects=0;fx.draw(r,e);assert.equal(rects,0);
e.action.time=.5;const before=JSON.stringify(e.state);rects=0;assert.ok(fx.draw(r,e)>=5);assert.ok(rects>=5);assert.equal(JSON.stringify(e.state),before,'effects never write state');
e.action.time=.46;assert.ok(fx.treeSway(e,tree)>1&&Math.abs(fx.treeSway(e,tree))<=2);assert.equal(fx.treeSway(e,{id:'other',x:tree.x+400}),0);
e.action.time=.45+.31;assert.equal(fx.treeSway(e,tree),0,'settled in 0.3 s');
e.action.time=.45+.9+.02;assert.ok(fx.axeContact(e).since<.03,'every .9 s swing');
// Running dust right after each foot contact, none while walking or crouching.
e.action=null;Object.assign(p,{moving:true,running:true,crouching:false,stride:Math.PI+.1});rects=0;fx.draw(r,e);assert.ok(rects>0);
p.running=false;rects=0;fx.draw(r,e);assert.equal(rects,0);
// Reduce motion: no effects, no sway, and no hit-stop – yet the contact still lands on the impact cel.
fx.setReduced(true);p.running=true;rects=0;assert.equal(fx.draw(r,e),0);assert.equal(rects,0);
e.action={target:{...tree},time:.5,duration:3.6};assert.equal(fx.treeSway(e,tree),0);
const ra={artTraveller:{}};for(const t of [.45,.47,.48]){e.action.time=t;assert.equal(art.rigActionSample(e,ra).pose.id,'chop-3');}
e.action.time=.5;assert.equal(art.rigActionSample(e,ra).pose.id,'chop-4','impact cel no longer held');fx.setReduced(false);e.action.time=.5;assert.equal(art.rigActionSample(e,ra).pose.id,'chop-3','hit-stop hold');
console.log('PASS motion fx: chips/leaves/dust only on contacts, 0.3 s tree sway away from the axe, reduce-motion removes effects and hit-stop, state untouched.');
