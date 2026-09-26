'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {recoveryConfig,recoveryMail}=require('./recovery-sender');

function env(){
  return {
    ZOVRO_SUPPORT_MAIL_USER:'support@zovro.work',
    ZOVRO_SUPPORT_MAIL_PASSWORD:'secret',
    ZOVRO_SUPPORT_MAIL_DATABASE_URL:'postgresql://u:p@db.example.com/zovro',
    ZOVRO_RECOVERY_API_BASE:'https://zovro-api-final.onrender.com',
    ZOVRO_RECOVERY_WORKER_TOKEN:'x'.repeat(64)
  };
}
test('recovery sender requires protected API settings',()=>{
  assert.equal(recoveryConfig(env()).apiBase,'https://zovro-api-final.onrender.com');
  assert.throws(()=>recoveryConfig({...env(),ZOVRO_RECOVERY_WORKER_TOKEN:'short'}));
  assert.throws(()=>recoveryConfig({...env(),ZOVRO_RECOVERY_API_BASE:'http://example.com'}));
});
test('recovery email contains only the requested code and safe metadata',()=>{
  const mail=recoveryMail({id:'abc',email:'person@example.com',code:'123456'});
  assert.equal(mail.to,'person@example.com');assert.match(mail.text,/123456/);
  assert.match(mail.subject,/password reset code/i);assert.match(mail.messageId,/abc/);
  assert.equal(mail.headers['Auto-Submitted'],'auto-generated');
});
