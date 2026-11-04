// Conservative pre-commit guard. Reports paths/line numbers, never matched values.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
let files;
if(fs.existsSync(path.join(root,'.git'))){
  files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);
}else{
  // The isolated art fork intentionally has no Git metadata or remote. Scan
  // source files directly, including new files, without initializing a repo.
  const excluded=new Set(['.git','.visual-overhaul-copy','node_modules','dist','work','.cache','coverage','test-results','playwright-report','.codex','.agents']);
  const textFile=/\.(?:js|cjs|mjs|json|css|html|md|txt|toml|yml|yaml|py|ps1|sh|env)$/i;
  files=[];
  function visit(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if(entry.isSymbolicLink())throw new Error('Secret scan refuses linked path: '+path.relative(root,path.join(dir,entry.name)));
    if(excluded.has(entry.name))continue;
    const full=path.join(dir,entry.name);
    if(entry.isDirectory())visit(full);
    else if(entry.isFile()&&(textFile.test(entry.name)||entry.name.startsWith('.env')||['.npmrc','.netrc'].includes(entry.name)))files.push(path.relative(root,full).replaceAll('\\','/'));
  }}
  visit(root);
}
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/\bAKIA[A-Z0-9]{16}\b/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/,/(?:api[_-]?key|password|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"'\s]{8,}["']/i];
const failures=[];
for(const f of files){if(f==='scripts/check-secrets.cjs'||/\.(png|jpg|jpeg|webp|woff2?|mp3|wav|ogg)$/i.test(f))continue;const full=path.join(root,f);if(!fs.statSync(full).isFile())continue;const text=fs.readFileSync(full,'utf8');text.split(/\r?\n/).forEach((line,i)=>{if(patterns.some(p=>p.test(line)))failures.push(f+':'+(i+1));});}
if(failures.length){console.error('Potential secrets require review:\n'+failures.join('\n'));process.exitCode=1;}else console.log('PASS secret-pattern scan of '+files.length+' repository candidate files. Manual review is still required.');
