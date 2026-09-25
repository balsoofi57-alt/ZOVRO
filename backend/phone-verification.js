'use strict';
const crypto = require('node:crypto');
const {verifyProvider, normalizeRecoveryPhone} = require('./password-recovery');
const digest = x => crypto.createHash('sha256').update(x).digest('hex');
const TYPE = 'phone_verification';

function createPhoneVerification({readDb, writeDb, body, json, limited, auth, audit, provider = verifyProvider(), now = Date.now}) {
  return async function handle(req, res, url) {
    if (!['/api/auth/phone/status', '/api/auth/phone/start', '/api/auth/phone/confirm'].includes(url.pathname)) return false;
    const reply = (code, data) => { json(res, code, data); return true; };
    const actor = auth(req);
    if (!actor) return reply(401, {error:'Sign in before verifying your phone.'});
    const eligible = db => db.users.find(u => u.id === actor.uid && (u.accountStatus || 'active') === 'active');
    let db = readDb(), user = eligible(db);
    if (!user) return reply(403, {error:'Account is not active.'});
    if (req.method === 'GET' && url.pathname.endsWith('/status')) return reply(200, {available:provider.configured(), verified:user.phoneVerified === true});
    if (req.method !== 'POST' || url.pathname.endsWith('/status')) return reply(405, {error:'Method not allowed'});
    if (!provider.configured()) return reply(503, {error:'Phone verification is temporarily unavailable. Please check again later.'});
    if (limited(req, 'phone-verification', 10, 60000)) return reply(429, {error:'Too many attempts. Try again later.'});
    const payload = await body(req);
    // The phone and account always come from the authenticated session, never the request body.
    db = readDb(); user = eligible(db);
    if (!user || auth(req)?.sid !== actor.sid) return reply(401, {error:'Sign in again.'});
    const phone = normalizeRecoveryPhone(user.phone);
    if (!phone || db.users.filter(u => normalizeRecoveryPhone(u.phone) === phone).length !== 1) return reply(409, {error:'Your registered phone needs support review before verification.'});
    const bound = (row, current) => current && auth(req)?.sid === actor.sid && row.accountId === actor.uid && row.sessionId === actor.sid && row.phoneHash === digest(current.phone) && row.passwordVersion === digest(current.passwordHash) && row.expiresAt > now();
    if (url.pathname.endsWith('/start')) {
      if (user.phoneVerified === true) return reply(200, {verified:true});
      const recent = db.workflows.filter(r => r.type === TYPE && r.accountId === actor.uid && r.createdMs > now() - 3600000);
      if (recent.length >= 3 || recent.some(r => r.createdMs > now() - 60000)) return reply(429, {error:'Please wait before requesting another code.'});
      const challenge = crypto.randomBytes(32).toString('hex');
      const row = {id:crypto.randomUUID(), type:TYPE, accountId:actor.uid, sessionId:actor.sid, challengeHash:digest(challenge), phoneHash:digest(user.phone), passwordVersion:digest(user.passwordHash), createdMs:now(), createdAt:new Date(now()).toISOString(), expiresAt:now() + 600000, attempts:0, status:'starting'};
      db.workflows = db.workflows.filter(r => r.type !== TYPE || r.createdMs > now() - 3600000);
      db.workflows.push(row); writeDb(db);
      let sid = null; try { sid = await provider.start(phone); } catch {}
      db = readDb(); const current = db.workflows.find(r => r.id === row.id); user = eligible(db);
      if (!current || !bound(current, user)) return reply(401, {error:'Account changed. Sign in and request another code.'});
      current.status = sid ? 'pending' : 'unavailable'; if (sid) current.verificationSid = sid; writeDb(db);
      return sid ? reply(202, {challenge, message:'Enter the code sent to your registered phone.'}) : reply(503, {error:'Could not send the code. Please try again later.'});
    }
    const bad = () => reply(400, {error:'Code is invalid or expired. Request another code.'});
    if (!/^[a-f0-9]{64}$/.test(payload.challenge || '') || !/^\d{4,10}$/.test(payload.code || '')) return bad();
    let row = db.workflows.find(r => r.type === TYPE && r.challengeHash === digest(payload.challenge));
    if (!row || !bound(row, user) || row.status !== 'pending' || row.attempts >= 5) return bad();
    row.attempts++; row.status = 'checking'; writeDb(db);
    let approved = false; try { approved = await provider.check(row.verificationSid, payload.code); } catch {}
    db = readDb(); row = db.workflows.find(r => r.type === TYPE && r.challengeHash === digest(payload.challenge)); user = eligible(db);
    if (!row || row.status !== 'checking' || !bound(row, user)) return bad();
    if (!approved) { row.status = row.attempts >= 5 ? 'locked' : 'pending'; writeDb(db); return bad(); }
    user.phoneVerified = true; user.phoneVerifiedAt = new Date(now()).toISOString();
    for (const attempt of db.workflows) if (attempt.type === TYPE && attempt.accountId === actor.uid) { attempt.status = 'consumed'; delete attempt.verificationSid; delete attempt.passwordVersion; }
    audit(db, actor, 'phone.verified', {method:'twilio_verify'}); writeDb(db);
    return reply(200, {verified:true});
  };
}
module.exports = {createPhoneVerification};
