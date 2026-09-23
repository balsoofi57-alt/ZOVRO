'use strict';
const crypto = require('node:crypto');
const digest = value => crypto.createHash('sha256').update(value).digest('hex');
const TYPE = 'password_recovery';
const TTL = 10 * 60 * 1000;
const unavailable = {error:'Password recovery is not available yet. Contact support@zovro.work for help.'};

function verifyProvider(env=process.env, fetcher=fetch) {
  const configured = () => env.ZOVRO_PASSWORD_RECOVERY_ENABLED === 'true' &&
    /^AC[0-9a-f]{32}$/i.test(env.TWILIO_ACCOUNT_SID || '') &&
    /^VA[0-9a-f]{32}$/i.test(env.TWILIO_RECOVERY_VERIFY_SERVICE_SID || '') &&
    Boolean(env.TWILIO_AUTH_TOKEN);
  async function post(resource, fields) {
    if (!configured()) throw new Error('Recovery unavailable');
    const response = await fetcher(`https://verify.twilio.com/v2/Services/${env.TWILIO_RECOVERY_VERIFY_SERVICE_SID}/${resource}`, {
      method:'POST', redirect:'error', signal:AbortSignal.timeout(10000),
      headers:{'content-type':'application/x-www-form-urlencoded', authorization:'Basic '+Buffer.from(env.TWILIO_ACCOUNT_SID+':'+env.TWILIO_AUTH_TOKEN).toString('base64')},
      body:new URLSearchParams(fields).toString()
    });
    if (!response.ok) throw new Error('Verification unavailable');
    return response.json();
  }
  return { configured,
    async start(phone) {
      const out=await post('Verifications',{To:phone,Channel:'sms'});
      if(out.status!=='pending'||!/^VE[0-9a-f]{32}$/i.test(out.sid||''))throw new Error('Verification unavailable');
      return out.sid;
    },
    async check(sid,code) {
      const out=await post('VerificationCheck',{VerificationSid:sid,Code:code});
      return out.status==='approved' && out.sid===sid;
    }
  };
}

// All database reads after provider awaits are fresh. Secrets and OTPs are never logged.
function createRecovery({readDb,writeDb,body,json,limited,hash,validPassword,audit,provider=verifyProvider(),now=Date.now}) {
  const active=u=>u&&(u.accountStatus||'active')==='active'&&u.phoneVerified===true;
  return async function recovery(req,res,url) {
    const route=url.pathname;
    if(!['/api/auth/recovery/status','/api/auth/forgot-password','/api/auth/reset-password'].includes(route))return false;
    if(route.endsWith('/status')&&req.method==='GET') {json(res,200,{available:provider.configured()});return true;}
    if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return true;}
    if(!provider.configured()){json(res,503,unavailable);return true;}
    if(limited(req,'recovery',10,60000)){json(res,429,{error:'Too many attempts. Try again later.'});return true;}
    const b=await body(req);
    if(route.endsWith('/forgot-password')) {
      const phone=String(b.phone||'').replace(/[\s()-]/g,'');
      if(!/^\+[1-9][0-9]{7,14}$/.test(phone)){json(res,400,{error:'Enter your registered phone number with country code, for example +1.'});return true;}
      const challenge=crypto.randomBytes(32).toString('hex'), timestamp=now(), phoneHash=digest(phone);
      const generic=()=>json(res,202,{challenge,message:'If this number belongs to an eligible verified account, a code will arrive. Otherwise contact support.',expiresIn:600});
      let db=readDb();
      const recent=db.workflows.filter(x=>x.type===TYPE&&x.phoneHash===phoneHash&&x.createdMs>timestamp-3600000);
      // Same response for throttled, absent, inactive and unverified accounts.
      if(recent.length>=3||recent.some(x=>x.createdMs>timestamp-60000)){generic();return true;}
      const user=db.users.find(u=>u.phone===phone);
      const row={id:crypto.randomUUID(),type:TYPE,phoneHash,challengeHash:digest(challenge),createdMs:timestamp,createdAt:new Date(timestamp).toISOString(),expiresAt:timestamp+TTL,attempts:0,status:'starting',recoveryUserId:active(user)?user.id:null,passwordVersion:active(user)?digest(user.passwordHash):null};
      db.workflows=db.workflows.filter(x=>x.type!==TYPE||x.createdMs>timestamp-3600000);
      db.workflows.push(row);writeDb(db);
      let sid=null;
      if(active(user)){try{sid=await provider.start(phone);}catch{/* Fail closed; never expose provider payloads or account existence. */}}
      db=readDb();const current=db.workflows.find(x=>x.id===row.id);
      if(current){current.verificationSid=sid;current.status=sid?'pending':'unavailable';writeDb(db);}
      generic();return true;
    }
    if(!/^[a-f0-9]{64}$/.test(b.challenge||'')||!/^\d{4,10}$/.test(b.code||'')||!validPassword(b.newPassword)) {
      json(res,400,{error:'Enter the verification code and a password of 10–128 characters with letters and numbers.'});return true;
    }
    const bad=()=>json(res,400,{error:'Code is invalid or expired. Request a new code.'});
    let db=readDb(),row=db.workflows.find(x=>x.type===TYPE&&x.challengeHash===digest(b.challenge));
    let user=db.users.find(u=>u.id===row?.recoveryUserId);
    if(!row||row.status!=='pending'||row.expiresAt<=now()||row.attempts>=5||!active(user)||row.phoneHash!==digest(user.phone)||row.passwordVersion!==digest(user.passwordHash)){bad();return true;}
    row.attempts++;row.status='checking';writeDb(db);
    let approved=false;try{approved=await provider.check(row.verificationSid,b.code);}catch{}
    db=readDb();row=db.workflows.find(x=>x.type===TYPE&&x.challengeHash===digest(b.challenge));user=db.users.find(u=>u.id===row?.recoveryUserId);
    if(!row||row.status!=='checking'){bad();return true;}
    if(!approved){row.status=row.attempts>=5?'locked':'pending';writeDb(db);bad();return true;}
    if(row.expiresAt<=now()||!active(user)||row.phoneHash!==digest(user.phone)||row.passwordVersion!==digest(user.passwordHash)){row.status='expired';writeDb(db);bad();return true;}
    user.passwordHash=hash(b.newPassword);
    db.deviceSessions=db.deviceSessions.filter(s=>s.userId!==user.id);
    for(const attempt of db.workflows)if(attempt.type===TYPE&&attempt.recoveryUserId===user.id){attempt.status='consumed';delete attempt.verificationSid;delete attempt.passwordVersion;}
    audit(db,{uid:user.id},'password.recovery',{allSessionsRevoked:true});writeDb(db);
    json(res,200,{ok:true,message:'Password updated. Sign in with your new password.'});return true;
  };
}
module.exports={createRecovery,verifyProvider};
