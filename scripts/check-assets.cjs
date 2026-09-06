const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),base=process.argv.includes('--production')?path.join(root,'dist'):root;
const names=fs.readdirSync(base),sources=names.filter(n=>/\.(js|html|css)$/.test(n));
for(const name of sources){const text=fs.readFileSync(path.join(base,name),'utf8');if(name.endsWith('.js'))new vm.Script(text,{filename:name});assert.ok(!/(?:src|href)=["'](?:file:|[A-Za-z]:\\|\/assets\/)/.test(text),name+' uses portable paths');for(const match of text.matchAll(/(?:src|href)=["']([^"']+\.(?:js|css|png))["']/g)){assert.ok(fs.existsSync(path.join(base,match[1])),name+' missing '+match[1]);}}
const assets=['forest-west','forest-ravine','forest-upland','traveller-and-kajo','timber-poses','timber-props','timber-interior','timber-logo','woodland-wildlife','forest-trees','chop-standing','chop-ground','book-icon','book-open',...Array.from({length:4},(_,i)=>'book-opening-'+(i+1)),...['knife','flintaxe','axe','puukko','rod'].map(x=>'tool-'+x)];
assets.push('trail-map','menu-landscape');
for(const name of assets){const b=fs.readFileSync(path.join(base,'assets',name+'.png'));assert.equal(b.toString('hex',0,8),'89504e470d0a1a0a',name+' PNG');assert.ok(b.readUInt32BE(16)>0&&b.readUInt32BE(20)>0);}
console.log(`PASS ${assets.length} required images, script syntax, relative asset references${base===root?'':' in production build'}`);
