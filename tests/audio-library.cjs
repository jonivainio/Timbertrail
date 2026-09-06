// Checks the actual shipped PCM samples, not perceived sound quality.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const entries=require('../scripts/sounds.cjs').readLibrary();
for(const e of entries){
  if(!e.file.endsWith('.wav'))continue;
  const b=fs.readFileSync(path.join(__dirname,'../assets/audio',e.file));
  let format,pcm;
  for(let i=12;i+8<=b.length;){const n=b.readUInt32LE(i+4);assert.ok(i+8+n<=b.length,'bounded WAV chunk');const id=b.toString('ascii',i,i+4);if(id==='fmt ')format=b.subarray(i+8,i+8+n);if(id==='data')pcm=b.subarray(i+8,i+8+n);i+=8+n+(n%2);}
  assert.ok(format&&pcm,e.event+' PCM chunks');assert.equal(format.readUInt16LE(0),1,'uncompressed PCM');assert.equal(format.readUInt16LE(2),1,'mono');assert.equal(format.readUInt16LE(14),16,'16-bit');
  const rate=format.readUInt32LE(4),duration=pcm.length/2/rate;assert.ok(e.offset+e.duration<=duration+.0001,e.event+' playback range');
  let peak=0,sum=0;for(let i=0;i<pcm.length;i+=2){const v=pcm.readInt16LE(i)/32768;peak=Math.max(peak,Math.abs(v));sum+=v*v;}
  assert.ok(peak<=.66,e.event+' bounded peaks');assert.ok(Math.sqrt(sum/(pcm.length/2))>.0005,e.event+' audible data');
  if(e.loop)assert.ok(Math.abs(pcm.readInt16LE(0)-pcm.readInt16LE(pcm.length-2))/32768<.08,e.event+' continuous loop seam');
}
console.log('PASS '+entries.length+' real sample ranges, PCM payloads, non-silence, headroom and loop seams; listening remains a playtest.');
