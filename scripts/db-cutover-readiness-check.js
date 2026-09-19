'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const verify=fs.readFileSync(path.join(root,'backend','scripts','verify-cutover-readiness.js'),'utf8');
const pkg=JSON.parse(fs.readFileSync(path.join(root,'backend','package.json'),'utf8'));
const runbook=fs.readFileSync(path.join(root,'POSTGRES_MIGRATION.md'),'utf8');
const required=['nonEmptyRepresentativeData','sha256','localHash','remoteHash','schemaVersion','mismatches'];
let bad=false;
for(const token of required)if(!verify.includes(token)){console.error('Cutover verifier missing:',token);bad=true}
if(pkg.scripts?.['db:verify:cutover']!=='node scripts/verify-cutover-readiness.js'){console.error('Backend cutover verifier script is not wired');bad=true}
if(!runbook.includes('db:verify:cutover')){console.error('Migration runbook does not require strict cutover verification');bad=true}
if(!runbook.toLowerCase().includes('mirror')){console.error('Migration runbook must preserve mirror-mode gate');bad=true}
if(bad)process.exit(1);console.log('ZOVRO database cutover readiness guard passed.');
