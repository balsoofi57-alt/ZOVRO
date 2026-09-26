'use strict';
const crypto = require('node:crypto');
const digest = value => crypto.createHash('sha256').update(String(value)).digest('hex');
const TYPE = 'password_recovery';
const SMS_TTL = 10 * 60 * 1000;
const EMAIL_TTL = 30 * 60 * 1000;
const EMAIL_RESERVATION_MS = 5 * 60 * 1000;
function normalizeRecoveryPhone(value) {
  let phone=String(value||'').replace(/[\s()-]/g,'');
  if(/^1[0-9]{10}$/.test(phone))phone='+'+phone;
  return /^\+[1-9][0-9]{7,14}$/.test(phone)?phone:null;
}
const unavailable = {error:'Password recovery is temporarily unavailable. Contact support@zovro.work for help.'};

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

function keyFromToken(token){return crypto.createHash('sha256').update(String(token)).digest()}
function seal(value,token){
  const iv=crypto.randomBytes(12),cipher=crypto.createCipheriv('aes-256-gcm',keyFromToken(token),iv);
  const encrypted=Buffer.concat([cipher.update(String(value),'utf8'),cipher.final()]),tag=cipher.getAuthTag();
  return Buffer.concat([iv,tag,encrypted]).toString('base64url');
}
function openSealed(value,token){
  const all=Buffer.from(String(value||''),'base64url');
  if(all.length<29)throw new Error('Invalid sealed recovery payload');
  const iv=all.subarray(0,12),tag=all.subarray(12,28),encrypted=all.subarray(28);
  const decipher=crypto.createDecipheriv('aes-256-gcm',keyFromToken(token),iv);decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted),decipher.final()]).toString('utf8');
}
function safeEqual(a,b){const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&crypto.timingSafeEqual(x,y)}
function validRecoveryEmail(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim().toLowerCase())}
function sixDigitCode(){return String(crypto.randomInt(0,1000000)).padStart(6,'0')}

// All database reads after provider awaits are fresh. Secrets and OTPs are never logged.
function createRecovery({readDb,writeDb,body,json,limited,hash,validPassword,audit,provider=verifyProvider(),now=Date.now,workerToken=process.env.ZOVRO_RECOVERY_WORKER_TOKEN||''}) {
  const emailConfigured=()=>String(workerToken).length>=32;
  const active=u=>u&&(u.accountStatus||'active')==='active';
  const activeSms=u=>active(u)&&u.phoneVerified===true;
  const workerAuthorized=req=>emailConfigured()&&safeEqual(req.headers?.['x-zovro-recovery-worker-token']||'',workerToken);
  const generic=challenge=>jsonResponse=>jsonResponse(202,{challenge,message:'If this number belongs to an eligible account, a verification code will arrive by text message or account email. The code expires soon.'});

  return async function recovery(req,res,url) {
    const route=url.pathname;
    const publicRoutes=['/api/auth/recovery/status','/api/auth/forgot-password','/api/auth/reset-password'];
    const workerRoutes=['/api/internal/recovery-email/tasks','/api/internal/recovery-email/result'];
    if(!publicRoutes.includes(route)&&!workerRoutes.includes(route))return false;

    if(workerRoutes.includes(route)){
      if(!workerAuthorized(req)){json(res,404,{error:'Not found'});return true;}
      if(route.endsWith('/tasks')&&req.method==='GET'){
        const db=readDb(),timestamp=now(),tasks=[];
        for(const row of db.workflows){
          if(row.type!==TYPE||row.channel!=='email'||row.expiresAt<=timestamp)continue;
          if(row.status==='email_reserved'&&timestamp-Number(row.reservedAt||0)>EMAIL_RESERVATION_MS)row.status='email_pending';
          if(row.status!=='email_pending'||Number(row.deliveryAttempts||0)>=3)continue;
          let email,code;
          try{email=openSealed(row.deliveryEmail,workerToken);code=openSealed(row.deliveryCode,workerToken)}catch{row.status='unavailable';continue}
          row.status='email_reserved';row.reservedAt=timestamp;row.deliveryAttempts=Number(row.deliveryAttempts||0)+1;
          tasks.push({id:row.id,email,code,expiresAt:row.expiresAt});
          if(tasks.length>=10)break;
        }
        writeDb(db);json(res,200,{tasks});return true;
      }
      if(route.endsWith('/result')&&req.method==='POST'){
        const b=await body(req),db=readDb(),row=db.workflows.find(x=>x.type===TYPE&&x.id===b.id&&x.channel==='email');
        if(!row||row.status!=='email_reserved'){json(res,404,{error:'Not found'});return true;}
        if(b.delivered===true){row.status='email_sent';row.deliveredAt=now();delete row.deliveryEmail;delete row.deliveryCode;delete row.reservedAt;}
        else if(Number(row.deliveryAttempts||0)<3&&row.expiresAt>now()){row.status='email_pending';delete row.reservedAt;}
        else{row.status='unavailable';delete row.deliveryEmail;delete row.deliveryCode;delete row.reservedAt;}
        writeDb(db);json(res,200,{ok:true});return true;
      }
      json(res,405,{error:'Method not allowed'});return true;
    }

    if(route.endsWith('/status')&&req.method==='GET') {json(res,200,{available:provider.configured()||emailConfigured()});return true;}
    if(req.method!=='POST'){json(res,405,{error:'Method not allowed'});return true;}
    if(!provider.configured()&&!emailConfigured()){json(res,503,unavailable);return true;}
    if(limited(req,'recovery',10,60000)){json(res,429,{error:'Too many attempts. Try again later.'});return true;}
    const b=await body(req);

    if(route.endsWith('/forgot-password')) {
      const phone=normalizeRecoveryPhone(b.phone);
      if(!phone){json(res,400,{error:'Enter your registered phone number with country code, for example +1.'});return true;}
      const challenge=crypto.randomBytes(32).toString('hex'),timestamp=now(),phoneHash=digest(phone);
      const reply=()=>json(res,202,{challenge,message:'If this number belongs to an eligible account, a verification code will arrive by text message or account email. The code expires soon.'});
      let db=readDb();
      const recent=db.workflows.filter(x=>x.type===TYPE&&x.phoneHash===phoneHash&&x.createdMs>timestamp-3600000);
      if(recent.length>=3||recent.some(x=>x.createdMs>timestamp-60000)){reply();return true;}
      const matches=db.users.filter(u=>normalizeRecoveryPhone(u.phone)===phone);
      const user=matches.length===1?matches[0]:null;
      const eligibleUser=active(user)?user:null;
      const row={id:crypto.randomUUID(),type:TYPE,phoneHash,challengeHash:digest(challenge),createdMs:timestamp,createdAt:new Date(timestamp).toISOString(),expiresAt:timestamp+(provider.configured()?SMS_TTL:EMAIL_TTL),attempts:0,status:'starting',recoveryUserId:eligibleUser?.id||null,passwordVersion:eligibleUser?digest(eligibleUser.passwordHash):null};
      db.workflows=db.workflows.filter(x=>x.type!==TYPE||x.createdMs>timestamp-3600000);
      db.workflows.push(row);writeDb(db);

      if(activeSms(eligibleUser)&&provider.configured()){
        let sid=null;try{sid=await provider.start(phone);}catch{}
        db=readDb();const current=db.workflows.find(x=>x.id===row.id);
        if(current){current.channel='sms';current.verificationSid=sid;current.status=sid?'pending':'unavailable';writeDb(db);}
        reply();return true;
      }

      if(eligibleUser&&emailConfigured()&&validRecoveryEmail(eligibleUser.email)){
        const code=sixDigitCode();
        db=readDb();const current=db.workflows.find(x=>x.id===row.id);
        if(current){
          current.channel='email';current.status='email_pending';current.expiresAt=timestamp+EMAIL_TTL;
          current.codeHash=digest(code);current.deliveryEmail=seal(String(eligibleUser.email).trim().toLowerCase(),workerToken);current.deliveryCode=seal(code,workerToken);current.deliveryAttempts=0;
          writeDb(db);
        }
        reply();return true;
      }

      db=readDb();const current=db.workflows.find(x=>x.id===row.id);if(current){current.status='unavailable';writeDb(db);}reply();return true;
    }

    if(!/^[a-f0-9]{64}$/.test(b.challenge||'')||!/^\d{4,10}$/.test(b.code||'')||!validPassword(b.newPassword)) {
      json(res,400,{error:'Enter the verification code and a password of 10–128 characters with letters and numbers.'});return true;
    }
    const bad=()=>json(res,400,{error:'Code is invalid or expired. Request a new code.'});
    let db=readDb(),row=db.workflows.find(x=>x.type===TYPE&&x.challengeHash===digest(b.challenge));
    let user=db.users.find(u=>u.id===row?.recoveryUserId);
    const baseValid=()=>row&&row.expiresAt>now()&&row.attempts<5&&active(user)&&row.phoneHash===digest(normalizeRecoveryPhone(user.phone)||'')&&row.passwordVersion===digest(user.passwordHash);
    if(!baseValid()){bad();return true;}

    if(row.channel==='email'){
      if(!['email_pending','email_reserved','email_sent'].includes(row.status)||!row.codeHash){bad();return true;}
      row.attempts++;const approved=safeEqual(row.codeHash,digest(b.code));
      if(!approved){row.status=row.attempts>=5?'locked':row.status;writeDb(db);bad();return true;}
      if(!baseValid()){row.status='expired';writeDb(db);bad();return true;}
    }else{
      if(row.status!=='pending'){bad();return true;}
      row.attempts++;row.status='checking';writeDb(db);
      let approved=false;try{approved=await provider.check(row.verificationSid,b.code);}catch{}
      db=readDb();row=db.workflows.find(x=>x.type===TYPE&&x.challengeHash===digest(b.challenge));user=db.users.find(u=>u.id===row?.recoveryUserId);
      if(!row||row.status!=='checking'){bad();return true;}
      if(!approved){row.status=row.attempts>=5?'locked':'pending';writeDb(db);bad();return true;}
      if(!baseValid()){row.status='expired';writeDb(db);bad();return true;}
    }

    user.passwordHash=hash(b.newPassword);
    db.deviceSessions=db.deviceSessions.filter(s=>s.userId!==user.id);
    for(const attempt of db.workflows)if(attempt.type===TYPE&&attempt.recoveryUserId===user.id){
      attempt.status='consumed';delete attempt.verificationSid;delete attempt.passwordVersion;delete attempt.codeHash;delete attempt.deliveryEmail;delete attempt.deliveryCode;delete attempt.reservedAt;
    }
    audit(db,{uid:user.id},'password.recovery',{allSessionsRevoked:true,channel:row.channel||'sms'});writeDb(db);
    json(res,200,{ok:true,message:'Password updated. Sign in with your new password.'});return true;
  };
}
module.exports={createRecovery,verifyProvider,normalizeRecoveryPhone};
