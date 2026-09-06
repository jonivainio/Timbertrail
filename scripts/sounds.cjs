// Pixabay has no documented public sound API. Search links + reviewed local imports.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const searches={reelWind:['Virvelin kelaus','spinning reel','fishing reel winding'],reelDrag:['Virvelin jarru','fishing reel drag','reel fish pulling'],cast:['Heitto','fishing rod whoosh'],lureSplash:['Vieheen loiskahdus','small water splash'],lineSnap:['Siiman katkeaminen','fishing line snap'],axe:['Kirves','axe wood chop'],step:['Askeleet','footsteps forest'],door:['Ovi','wooden door'],fireCrackle:['Tulen rätinä','small fire crackle']};
const events=new Set('uiOpen uiClose pageTurn pageFlip uiTick deny drink pour door shutter chestOpen cloth storage floorStep step wood stone rustle pickup gatherWood gatherStone gatherGrass gatherFruit gatherMushroom skin axe water fire fireCrackle eat equip craft task bow impact cast lureSplash fishNibble fishHook lineSnap reelDrag reelWind catch miss sleep trade dog travel'.split(' '));
function validate(entry){
  if(!entry||!events.has(entry.event))throw Error('Unknown sound event');
  const u=new URL(entry.source);
  if(u.protocol!=='https:'||u.hostname!=='pixabay.com'||!/^\/sound-effects\/(?!search\/)[a-z0-9-]+-\d+\/$/.test(u.pathname)||u.search||u.hash)throw Error('Use the individual Pixabay sound page URL');
  for(const k of ['title','creator','notes'])if(typeof entry[k]!=='string'||!entry[k].trim())throw Error('Missing '+k);
  if(entry.reviewed!==true)throw Error('Listen and check the source/license, then set reviewed: true');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(entry.downloadedOn)||!Number.isFinite(Date.parse(entry.downloadedOn)))throw Error('Missing download date YYYY-MM-DD');
  for(const [k,min,max]of [['offset',0,600],['duration',.02,10],['gain',.001,1]])if(!Number.isFinite(entry[k])||entry[k]<min||entry[k]>max)throw Error('Invalid '+k);
  if(entry.event==='reelDrag'&&entry.duration>.12||entry.event==='reelWind'&&entry.duration>.26)throw Error('Reel clips must fit the existing cadence: drag <= 0.12 s, wind <= 0.26 s');
}
function audioType(data){
  if(data.length<16)throw Error('Empty or invalid audio file');
  if(data.toString('ascii',0,4)==='RIFF'&&data.toString('ascii',8,12)==='WAVE')return '.wav';
  if(data.toString('ascii',0,4)==='OggS')return '.ogg';
  if(data.toString('ascii',0,3)==='ID3'||data[0]===255&&(data[1]&224)===224)return '.mp3';
  throw Error('Expected MP3, WAV or OGG audio, not a web page');
}
function readLibrary(base=root){
  const dir=path.join(base,'assets/audio'),entries=JSON.parse(fs.readFileSync(path.join(dir,'library.json'),'utf8')),seen=new Set();
  if(!Array.isArray(entries))throw Error('Sound library must be an array');
  for(const e of entries){validate(e);if(seen.has(e.event))throw Error('Duplicate event');seen.add(e.event);
    if(!/^[a-zA-Z]+-[a-f0-9]{64}\.(mp3|wav|ogg)$/.test(e.file))throw Error('Invalid audio path');
    const data=fs.readFileSync(path.join(dir,e.file));
    if(audioType(data)!==path.extname(e.file)||crypto.createHash('sha256').update(data).digest('hex')!==e.sha256||!e.file.includes(e.sha256))throw Error('Audio integrity mismatch');
  }return entries;
}
function importSound(recipePath,base=root){
  const recipe=JSON.parse(fs.readFileSync(recipePath,'utf8'));validate(recipe);
  const source=path.resolve(path.dirname(recipePath),recipe.file),stat=fs.statSync(source);
  if(stat.size>20*1024*1024)throw Error('Audio exceeds 20 MB; trim it first');
  const data=fs.readFileSync(source),ext=audioType(data),sha256=crypto.createHash('sha256').update(data).digest('hex');
  const entries=readLibrary(base),file=recipe.event+'-'+sha256+ext;
  const entry={};for(const k of ['event','title','creator','source','downloadedOn','reviewed','notes','offset','duration','gain'])entry[k]=recipe[k];
  Object.assign(entry,{file,sha256,license:'Pixabay Content License',licenseUrl:'https://pixabay.com/service/terms/'});
  const dir=path.join(base,'assets/audio'),target=path.join(dir,file);
  if(!fs.existsSync(target))fs.copyFileSync(source,target,fs.constants.COPYFILE_EXCL);
  const next=entries.filter(e=>e.event!==entry.event).concat(entry).sort((a,b)=>a.event.localeCompare(b.event));
  const temp=path.join(dir,'library.json.tmp');fs.writeFileSync(temp,JSON.stringify(next,null,2)+'\n');fs.renameSync(temp,path.join(dir,'library.json'));
  return entry;
}
if(require.main===module){try{
  const [command,arg]=process.argv.slice(2);
  if(command==='search'){
    const terms=arg?(searches[arg]||[arg,arg]):null;
    for(const [event,[label,...queries]]of terms?[[arg,terms]]:Object.entries(searches)){
      console.log(event+' — '+label);for(const q of queries)console.log('https://pixabay.com/sound-effects/search/'+encodeURIComponent(q)+'/');
    }
  }else if(command==='import'&&arg){console.log('Imported '+importSound(path.resolve(arg)).event);}
  else if(command==='check'){console.log('PASS '+readLibrary().length+' reviewed audio assets');}
  else console.log('npm run sounds -- search [reelWind|reelDrag|search phrase]\nnpm run sounds -- import work/audio/recipe.json\nnpm run sounds -- check');
}catch(e){console.error(e.message);process.exitCode=1;}}
module.exports={validate,audioType,readLibrary,importSound};
