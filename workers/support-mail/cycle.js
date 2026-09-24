'use strict';
// Sender mode stays independently controlled. Alerts run even if the worker fails.
const {spawnSync}=require('node:child_process');
const path=require('node:path');
const worker=spawnSync(process.execPath,[path.join(__dirname,'worker.js')],{stdio:'inherit',timeout:120000,killSignal:'SIGKILL'});
const alerts=spawnSync(process.execPath,[path.join(__dirname,'alerts.js'),'--notify'],{stdio:'inherit',timeout:45000,killSignal:'SIGKILL'});
if(worker.status!==0||alerts.status!==0)process.exitCode=1;
