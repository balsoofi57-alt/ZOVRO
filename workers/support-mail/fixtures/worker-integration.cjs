'use strict';
// Test process only: exercise the actual worker with real PostgreSQL and fake mail.
const fs=require('node:fs');
const Module=require('node:module');
const {SUPPORT,TEST_RECIPIENT}=require('../bridge');
const original=Module._load;
const scenario=process.env.ZOVRO_FIXTURE_SCENARIO;
const fixtureSender=scenario.startsWith('customer')?'customer@example.test':TEST_RECIPIENT;
const uidValidity=scenario==='changed-validity'?'18':'17';
class ImapFlow{
 constructor(){this.mailbox={uidValidity,uidNext:2};}
 async connect(){}
 async getMailboxLock(name,options){
  if(name!=='INBOX'||!options.readOnly)throw Error('Expected read-only mailbox');
  return {release(){}};
 }
 async search(){return [1];}
 async fetchOne(uid,fields){return fields.size?{size:100}:{source:Buffer.from('isolated fixture')};}
 async logout(){}
}
Module._load=function(name,parent,isMain){
 if(name==='imapflow')return {ImapFlow};
 if(name==='mailparser')return {simpleParser:async()=>({from:{value:[{address:fixtureSender}]},to:{value:[{address:SUPPORT}]},headers:new Map(),text:'What is ZOVRO?',messageId:'<worker-integration@example.test>',attachments:[]})};
 if(name==='./sender-auth'&&parent?.filename.endsWith('/worker.js'))return {verifySender:async()=>({verified:true})};
 if(name==='nodemailer')return {createTransport:()=>({close(){},async sendMail(data){
  if(data.to!==fixtureSender)throw Error('Incorrect reply recipient');
  fs.appendFileSync(process.env.ZOVRO_FIXTURE_ACCEPTANCES,'accepted\n');
  if(scenario==='kill-after-acceptance')process.kill(process.pid,'SIGKILL');
  if(scenario==='ambiguous')throw Error('Simulated lost SMTP acknowledgement');
  return {accepted:[data.to]};
 }})};
 return original.call(this,name,parent,isMain);
};
require('../worker').run().catch(()=>{process.exitCode=1;});
