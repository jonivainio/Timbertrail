const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=process.argv.includes('--production')?path.join(root,'dist'):root;
const names=fs.readdirSync(base),sources=names.filter(n=>/\.(js|html|css)$/.test(n));
for(const name of sources){const text=fs.readFileSync(path.join(base,name),'utf8');if(name.endsWith('.js'))new vm.Script(text,{filename:name});assert.ok(!/(?:src|href)=["'](?:file:|[A-Za-z]:\\|\/assets\/)/.test(text),name+' uses portable paths');for(const match of text.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|png)(?:\?[^"']*)?)["']/g)){assert.ok(fs.existsSync(path.join(base,match[1].split('?')[0])),name+' missing '+match[1]);}}
if(base!==root){const html=fs.readFileSync(path.join(base,'index.html'),'utf8'),stamp=html.match(/name="timbertrail-build" content="([^"]+)"/)?.[1];assert.ok(stamp,'release build identifier');for(const m of html.matchAll(/(?:src|href)="([^" ]+\.(?:js|css)[^" ]*)"/g))assert.ok(m[1].endsWith('?v='+stamp),'every code/style request uses this release');assert.ok(fs.readFileSync(path.join(base,'audio-samples.js'),'utf8').includes('library.json?v='+stamp),'sound registry follows the same release');}
const assets=['forest-west','forest-ravine','forest-upland','traveller-and-kajo','timber-poses','timber-props','timber-interior','timber-logo','woodland-wildlife','forest-trees','chop-standing','chop-ground','book-icon','book-open',...Array.from({length:4},(_,i)=>'book-opening-'+(i+1)),...['knife','flintaxe','axe','puukko','rod'].map(x=>'tool-'+x)];
assets.push('cabin-yard-props-final','kajo-cabin-poses','sienilampi-interior','icon-canteen','menu_banner','pick_banner1','pick_banner2','pick_banner3');
assets.push('trail-map','menu-landscape','forest-floor-material');
assets.push('title-shore-nov2');
assets.push('cabin-letter');
assert.ok(fs.readFileSync(path.join(base,'assets/fonts/Kalam-Regular.ttf')).length>10000,'bundled letter handwriting font');
assert.ok(fs.readFileSync(path.join(base,'assets/fonts/Kalam-OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'),'redistribution license accompanies the font');
assert.ok(fs.readFileSync(path.join(base,'assets/fonts/PixelifySans.ttf')).length>10000,'bundled pixel UI font');
assert.ok(fs.readFileSync(path.join(base,'assets/fonts/PixelifySans-OFL.txt'),'utf8').includes('SIL OPEN FONT LICENSE'),'pixel UI font redistribution license');
assets.push(...['rawFish','cookedFish','pike','zander','perch'].map(id=>'icon-'+id));
assets.push('fishing-poses-v2');
assets.push('aarni-river','hiljalampi','hiljalampi-cabin','sienilampi-pier','cabin-spring-v2','timber-wordmark','traveller-pet','traveller-seated');
assets.push('traveller-run',...['arrows','berries','bow','campfire','cookedMeat','cord','fiber','firewood','hide','kindling','mushroom','rawMeat','shelter','stone','trap','wood'].map(id=>'icon-'+id));
for(const name of assets){const b=fs.readFileSync(path.join(base,'assets',name+'.png'));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',name+' PNG');assert.ok(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0);}
console.log(`PASS ${assets.length} required images, script syntax, relative asset references${base===root?'':' in production build'}`);
const visual=require(path.join(base,'visual-manifest.js')),crypto=require('node:crypto');assert.equal(visual.artWidth,640);assert.ok(visual.enabled);
for(const [key,name]of visual.assets){assert.ok(/^art-v2\/[a-z0-9-]+$/.test(name));const bytes=fs.readFileSync(path.join(base,'assets',name+'.png')),meta=JSON.parse(fs.readFileSync(path.join(base,'assets',name+'.json'),'utf8'));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),meta.sha256,key+' production asset hash');assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],meta.nativeSize);assert.ok(meta.frames.length&&meta.source.sha256);}
if(base!==root){const stamp=fs.readFileSync(path.join(base,'index.html'),'utf8').match(/name="timbertrail-build" content="([^"]+)"/)[1];assert.equal(visual.buildToken,stamp,'new art uses the release cache key');}
console.log('PASS registered overhaul art, metadata, hashes and release token');

console.log('PASS '+require('./sounds.cjs').readLibrary(base).length+' registered audio files and provenance');

assert.ok(fs.statSync(path.join(base,'assets/title-music.mp3')).size>1000,'title music included');
const worldMusic=require(path.join(base,'world-music.js')),musicMeta=JSON.parse(fs.readFileSync(path.join(base,'assets/audio/world-music.json'),'utf8'));
assert.equal(musicMeta.listeningReviewed,false,'do not silently approve candidate music');
assert.deepEqual(worldMusic.cues.map(c=>c.id),musicMeta.cues.map(c=>c.id));
for(const cue of worldMusic.cues){
  const meta=musicMeta.cues.find(c=>c.id===cue.id),file=path.join(base,cue.file);
  assert.equal(cue.duration,meta.duration);assert.deepEqual(cue.roles,meta.roles);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),meta.sha256);
  assert.equal(meta.source.license,'CC BY 4.0');assert.ok(meta.source.sha256&&meta.source.page&&meta.edit.start>0);
  assert.ok(Number(meta.measurement.after.input_tp)<=-1.5,'encoded music true peak');
}
assert.ok(fs.readFileSync(path.join(base,'music-credits.html'),'utf8').includes('Scott Buckley'));
console.log('PASS recorded world music assets, source credits, matching timing and measured peak metadata (not listening acceptance)');
