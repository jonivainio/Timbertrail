// Static, dependency-free build. An allowlist keeps tests and private local files
// out of the public site. Existing local source and diagnostic files stay in place.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'dist');
const files=['index.html','style.css','i18n.js','engine.js','equipment.js','world-art.js','render.js','audio.js','panels.js','game.js'];
fs.mkdirSync(path.join(dest,'assets'),{recursive:true});
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(dest,file));
const images=fs.readdirSync(path.join(root,'assets')).filter(f=>f.endsWith('.png'));
for(const image of images)fs.copyFileSync(path.join(root,'assets',image),path.join(dest,'assets',image));
fs.writeFileSync(path.join(dest,'.nojekyll'),'');
console.log(`Static production build: ${files.length} code files, ${images.length} images. No absolute asset paths or runtime packages.`);
