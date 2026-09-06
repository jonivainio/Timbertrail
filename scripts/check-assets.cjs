const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=process.argv.includes('--production')?path.join(root,'dist'):root;
const names=fs.readdirSync(base),sources=names.filter(n=>/\.(js|html|css)$/.test(n));
for(const name of sources){const text=fs.readFileSync(path.join(base,name),'utf8');if(name.endsWith('.js'))new vm.Script(text,{filename:name});assert.ok(!/(?:src|href)=["'](?:file:|[A-Za-z]:\\|\/assets\/)/.test(text),name+' uses portable paths');for(const match of text.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|png)(?:\?[^"']*)?)["']/g)){assert.ok(fs.existsSync(path.join(base,match[1].split('?')[0])),name+' missing '+match[1]);}}
if(base!==root){const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),stamp=html.match(/name="timbertrail-build" content="([^"]+)"/)?.[1];assert.ok(stamp,'release build identifier');for(const m of html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css)[^" ]*)"/g))assert.ok(m[1].endsWith('?v='+stamp),'every code/style request uses this release');assert.ok(fs.readFileSync(path.join(base,'audio-samples.js'),'utf8').includes('library.json?v='+stamp),'sound registry follows the same release');}
const assets=['forest-west','forest-ravine','forest-upland','traveller-and-kajo','timber-poses','timber-props','timber-interior','timber-logo','woodland-wildlife','forest-trees','chop-standing','chop-ground','book-icon','book-open',...Array.from({length:4},(_,i)=>'book-opening-'+(i+1)),...['knife','flintaxe','axe','puukko','rod'].map(x=>'tool-'+x)];
assets.push('cabin-yard-props-final','kajo-cabin-poses','sienilampi-interior','icon-canteen','menu_banner','pick_banner1','pick_banner2','pick_banner3');
assets.push('trail-map','menu-landscape','forest-floor-material');
assets.push('cabin-letter');
assert.ok(fs.readFileSync(path.join(base,'assets/fonts/Kalam-Regular.ttf')).length>10000,'bundled letter handwriting font');
assert.ok(fs.readFileSync(path.join(base,'assets/fonts/Kalam-OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'),'redistribution license accompanies the font');
assets.push(...['rawFish','cookedFish','pike','zander','perch'].map(id=>'icon-'+id));
assets.push('fishing-poses-v2');
assets.push('aarni-river','hiljalampi','hiljalampi-cabin','sienilampi-pier','cabin-spring-v2','timber-wordmark','traveller-pet','traveller-seated');
assets.push('traveller-run',...['arrows','berries','bow','campfire','cookedMeat','cord','fiber','firewood','hide','kindling','mushroom','rawMeat','shelter','stone','trap','wood'].map(id=>'icon-'+id));
for(const name of assets){const b=fs.readFileSync(path.join(base,'assets',name+'.png'));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',name+' PNG');assert.ok(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0);}
console.log(`PASS ${assets.length} required images, script syntax, relative asset references${base===root?'':' in production build'}`);

console.log('PASS '+require('./sounds.cjs').readLibrary(base).length+' registered audio files and provenance');

assert.ok(fs.statSync(path.join(base,'assets/title-music.mp3')).size>1000,'title music included');
