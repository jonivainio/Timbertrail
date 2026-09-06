// Conservative pre-commit guard. Reports paths/line numbers, never matched values.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..');
let files;
try{files=cp.execFileSync('git',['ls-files','--cached','--others','--exclude-standard','-z'],{cwd:root,encoding:'utf8'}).split('\0').filter(Boolean);}catch{throw new Error('Initialize Git before the secret scan.');}
const patterns=[/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,/\bgh[pousr]_[A-Za-z0-9]{30,}\b/,/\bgithub_pat_[A-Za-z0-9_]{40,}\b/,/\bAKIA[A-Z0-9]{16}\b/,/\bsk-(?:proj-)?[A-Za-z0-9_-]{30,}\b/,/(?:api[_-]?key|password|client[_-]?secret|access[_-]?token)\s*[:=]\s*["'][^"'\s]{8,}["']/i];
const failures=[];
for(const f of files){if(f==='scripts/check-secrets.cjs'||/\.(png|jpg|jpeg|webp|woff2?)$/i.test(f))continue;const full=path.join(root,f);if(!fs.statSync(full).isFile())continue;const text=fs.readFileSync(full,'utf8');text.split(/\r?\n/).forEach((line,i)=>{if(patterns.some(p=>p.test(line)))failures.push(f+':'+(i+1));});}
if(failures.length){console.error('Potential secrets require review:\n'+failures.join('\n'));process.exitCode=1;}else console.log('PASS secret-pattern scan of '+files.length+' repository candidate files. Manual review is still required.');
