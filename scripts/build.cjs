// Static, dependency-free build. An allowlist keeps tests and private local files
// out of the public site. Existing local source and diagnostic files stay in place.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'dist');
const files=['index.html','style.css','parchment.css','storage.css','fishing.css','i18n.js','regions.js','cabin-interior.js','fishing.js','engine.js','item-icons.js','equipment.js','terrain-surface.js','world-art.js','region-art.js','fire-effects.js','cabin-art.js','fishing-art.js','render.js','audio-samples.js','title-music.js','audio.js','panels.js','storage-ui.js','game.js'];
files.push('visual-manifest.js','visual-core.js','visual-world.js','world-music.js','music-credits.html','cabin-pixels.js','kajo-art.js','traveller-art.js','visual-ui.css','visual-objectives.css','visual-title.css','ui-icons.js','ui-ember.css');
const musicManifest=require('../assets/audio/world-music.json'),musicFiles=['assets/audio/world-music.json',...musicManifest.cues.map(c=>c.file)];
for(const file of musicFiles)if(!/^assets\/audio\/(?:world-music\.json|world-[a-z0-9-]+\.mp3)$/.test(file))throw Error('Invalid recorded music asset path');
const visual=require('../visual-manifest.js'),visualFiles=visual.assets.flatMap(([,name])=>{if(!/^art-v2\/[a-z0-9-]+$/.test(name))throw Error('Invalid visual asset path');return ['assets/'+name+'.png','assets/'+name+'.json'];});
const titleFiles=['assets/title-shore-nov2.png','assets/title-shore-nov2.json'];
fs.mkdirSync(path.join(dest,'assets'),{recursive:true});
fs.mkdirSync(path.join(dest,'assets/fonts'),{recursive:true});
const fontFiles=['Kalam-Regular.ttf','Kalam-OFL.txt','PixelifySans.ttf','PixelifySans-OFL.txt'].map(n=>'assets/fonts/'+n);
for(const file of fontFiles)fs.copyFileSync(path.join(root,file),path.join(dest,file));
const hash=crypto.createHash('sha256');for(const file of [...files,...visualFiles,...titleFiles,...musicFiles,...fontFiles,'package.json','assets/audio/library.json'])hash.update(fs.readFileSync(path.join(root,file)));
const stamp=require('../package.json').version+'-'+hash.digest('hex').slice(0,12);
for(const file of files){
  let text=fs.readFileSync(path.join(root,file),'utf8');
  if(file==='index.html')text=text.replace('<head>','<head><meta name="timbertrail-build" content="'+stamp+'">').replace(/((?:src|href)="[^"?]+\.(?:js|css|png))"/g,'$1?v='+stamp+'"');
  if(file.endsWith('.css'))text=text.replace(/(url\(["']?[^)'"?]+\.(?:png|ttf))(["']?\))/g,'$1?v='+stamp+'$2');
  if(file==='audio-samples.js')text=text.replace("'assets/audio/library.json'","'assets/audio/library.json?v="+stamp+"'");
  if(file==='visual-manifest.js')text=text.replace('buildToken:null','buildToken:'+JSON.stringify(stamp));
  fs.writeFileSync(path.join(dest,file),text);
}
const images=fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.png'));
for(const image of images)fs.copyFileSync(path.join(root,'assets',image),path.join(dest,'assets',image));
fs.copyFileSync(path.join(root,'assets/title-shore-nov2.json'),path.join(dest,'assets/title-shore-nov2.json'));
for(const file of visualFiles){fs.mkdirSync(path.dirname(path.join(dest,file)),{recursive:true});fs.copyFileSync(path.join(root,file),path.join(dest,file));}
fs.writeFileSync(path.join(dest,'.nojekyll'),'');
console.log(`Static production build: ${files.length} code files, ${images.length} images. No absolute asset paths or runtime packages.`);

const audioEntries=require('./sounds.cjs').readLibrary(root);
fs.mkdirSync(path.join(dest,'assets/audio'),{recursive:true});
const allowed=new Set(['library.json',...audioEntries.map(e=>e.file)]);
for(const name of fs.readdirSync(path.join(dest,'assets/audio')))if(!allowed.has(name)&&/^[a-zA-Z]+-[a-f0-9]{64}\.(mp3|wav|ogg)$/.test(name))fs.unlinkSync(path.join(dest,'assets/audio',name));
for(const name of allowed)fs.copyFileSync(path.join(root,'assets/audio',name),path.join(dest,'assets/audio',name));
for(const file of musicFiles)fs.copyFileSync(path.join(root,file),path.join(dest,file));
console.log(musicManifest.cues.length+' licensed, listening-unreviewed world music excerpts included with credits.');
console.log(audioEntries.length+' registered audio clips included.');
console.log('Release cache key: '+stamp);

fs.copyFileSync(path.join(root,'assets/title-music.mp3'),path.join(dest,'assets/title-music.mp3'));
