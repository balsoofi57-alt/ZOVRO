'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const probe=fs.readFileSync(path.join(root,'backend','postgres-write-probe.js'),'utf8');
const server=fs.readFileSync(path.join(root,'backend','server.js'),'utf8');
const required=['schemaVersion 6','workflow_records','BEGIN','ROLLBACK','postgres_write_probe_pass','postgres_write_probe_failed'];
let bad=false;
for(const token of required)if(!probe.includes(token)){console.error('Postgres probe missing safeguard:',token);bad=true}
if(!server.includes('ZOVRO_POSTGRES_STARTUP_PROBE')||!server.includes('runPostgresWriteProbe')){console.error('Postgres startup probe is not safely wired');bad=true}
if(bad)process.exit(1);
console.log(JSON.stringify({ok:true,postgresProbeGuard:true,rollbackRequired:true,schemaVersion:6}));
