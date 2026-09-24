'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const child=path.join(__dirname,'fixtures/recovery-child.cjs');
for(const scenario of [
 {fault:'before-reservation',signal:'SIGKILL',before:null,after:'sent',accepted:1},
 {fault:'after-reservation',signal:'SIGKILL',before:'reserved',after:'reserved',accepted:0},
 {fault:'after-acceptance',signal:'SIGKILL',before:'reserved',after:'reserved',accepted:1},
 {fault:'after-finish',signal:'SIGKILL',before:'sent',after:'sent',accepted:1},
 {fault:'ambiguous-smtp',exit:0,before:'delivery_unconfirmed',after:'delivery_unconfirmed',accepted:1},
 {fault:'finish-unavailable',exit:1,before:'reserved',after:'reserved',accepted:1}
]){
 test('fresh-process recovery: '+scenario.fault,()=>{
  const directory=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-recovery-'));
  try{
   const run=fault=>spawnSync(process.execPath,[child,directory,fault],{encoding:'utf8',timeout:10000,env:{}});
   const receipt=()=>fs.existsSync(path.join(directory,'receipt.json'))?JSON.parse(fs.readFileSync(path.join(directory,'receipt.json'),'utf8')).status:null;
   const first=run(scenario.fault);
   assert.ifError(first.error);
   assert.equal(first.signal,scenario.signal||null);
   assert.equal(first.status,scenario.exit??null);
   assert.equal(receipt(),scenario.before);
   const recovered=run('normal');
   assert.ifError(recovered.error);
   assert.equal(recovered.status,0,recovered.stderr);
   assert.equal(recovered.stdout,scenario.before?'duplicate':'sent');
   const replay=run('normal');
   assert.ifError(replay.error);
   assert.equal(replay.status,0,replay.stderr);
   assert.equal(replay.stdout,'duplicate');
   assert.equal(receipt(),scenario.after);
   const acceptedPath=path.join(directory,'accepted.jsonl');
   const accepted=fs.existsSync(acceptedPath)?fs.readFileSync(acceptedPath,'utf8').trim().split('\n').length:0;
   assert.equal(accepted,scenario.accepted,'remote acceptance count must not grow on replay');
  }finally{fs.rmSync(directory,{recursive:true,force:true});}
 });
}
