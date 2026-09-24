'use strict';
// Isolated process-crash harness: no network, credentials or production database.
const fs=require('node:fs');
const path=require('node:path');
const {processMessage,SUPPORT,TEST_RECIPIENT}=require('../bridge');
const [directory,fault]=process.argv.slice(2);
const receiptPath=path.join(directory,'receipt.json');
function checkpoint(name){if(fault===name)process.kill(process.pid,'SIGKILL');}
function persist(record){
 const temporary=receiptPath+'.tmp';
 fs.writeFileSync(temporary,JSON.stringify(record));
 fs.renameSync(temporary,receiptPath);
}
const store={
 async reserve(record){
  if(fs.existsSync(receiptPath))return false;
  checkpoint('before-reservation');
  persist(record);
  checkpoint('after-reservation');
  return true;
 },
 async finish(key,status){
  if(fault==='finish-unavailable')throw Error('Simulated persistence outage');
  const record=JSON.parse(fs.readFileSync(receiptPath,'utf8'));
  if(record.key!==key)throw Error('Unexpected receipt');
  persist({...record,status});
  checkpoint('after-finish');
 }
};
const mail={from:{value:[{address:TEST_RECIPIENT}]},to:{value:[{address:SUPPORT}]},headers:new Map(),text:'What is ZOVRO?',messageId:'<recovery-fixture@example.test>',attachments:[]};
processMessage({mail,uid:22,uidValidity:'17',mode:'test',store,senderVerified:true,
 send:async()=>{
  // Represents remote acceptance. It survives the sender process being killed.
  fs.appendFileSync(path.join(directory,'accepted.jsonl'),JSON.stringify({accepted:true})+'\n');
  checkpoint('after-acceptance');
  if(fault==='ambiguous-smtp')throw Error('Connection lost after remote acceptance');
 }
}).then(status=>process.stdout.write(status)).catch(()=>{process.stdout.write('persistence-error');process.exitCode=1;});
