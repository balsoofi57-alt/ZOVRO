'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
process.env.ZOVRO_PROFILE_ENCRYPTION_KEY='unit-test-only-key';
const identity=require('../backend/identity-verification-api');
const rollout=require('../backend/provider-live-face-policy');
const previouslyApproved={role:'provider',identityVerified:true,identityAgeConfirmed:true,identityVerification:{status:'verified',faceVerifiedLive:false}};
delete process.env.ZOVRO_ENFORCE_LIVE_FACE_ID;
assert.equal(rollout.liveFaceRequired(),false,'face checks are off until explicitly enabled');
assert.equal(rollout.canProviderWork(previouslyApproved),true,'prior government ID and age approval must remain valid during staged rollout');
assert.equal(rollout.canProviderWork({...previouslyApproved,identityAgeConfirmed:false}),false,'turning off face rollout must never turn off age rules');
assert.equal(rollout.canProviderWork({...previouslyApproved,identityVerified:false}),false,'turning off face rollout must never turn off government ID rules');
process.env.ZOVRO_ENFORCE_LIVE_FACE_ID='true';
assert.equal(rollout.liveFaceRequired(),true);
assert.equal(rollout.canProviderWork(previouslyApproved),false,'live face must be required after explicit activation');
assert.equal(identity.eligible(previouslyApproved),false,'Stripe identity eligibility must share the same rollout policy');

// The identity provider makes paid/networked calls; never allow per-account rapid retriggering.
const throttleId='unit-identity-throttle';
assert.equal(identity.allowIdentityCall(throttleId,'start',1000).allowed,true);
assert.deepEqual(identity.allowIdentityCall(throttleId,'start',1001),{allowed:false,retryAfter:30});
assert.equal(identity.allowIdentityCall(throttleId,'check',1001).allowed,true,'status checks have their own cooldown');
assert.equal(identity.allowIdentityCall(throttleId,'check',5000).allowed,false);
assert.equal(identity.allowIdentityCall(throttleId+'-other','start',1002).allowed,true,'different providers must not block one another');
assert.equal(identity.allowIdentityCall(throttleId,'check',11001).allowed,true,'10-second check cooldown must expire');
assert.equal(identity.allowIdentityCall(throttleId,'start',31000).allowed,true,'30-second start cooldown must expire');

assert.equal(identity.adultDob({year:2008,month:11,day:12},new Date('2026-11-12T12:00:00Z')),true);
assert.equal(identity.adultDob({year:2008,month:11,day:13},new Date('2026-11-12T12:00:00Z')),false);
assert.equal(identity.eligible({role:'provider',identityVerified:true,identityAgeConfirmed:true,identityVerification:{status:'verified',faceVerifiedLive:true}}),true);
assert.equal(identity.eligible({role:'provider',identityVerified:true,identityAgeConfirmed:false,identityVerification:{status:'verified',faceVerifiedLive:true}}),false);
for(const path of ['backend/server.js','backend/server-core.js','backend/request-privacy.js','backend/identity-verification-api.js','scripts/e2e-smoke.js'])new vm.Script(fs.readFileSync(path,'utf8'),{filename:path});
const core=fs.readFileSync('backend/server-core.js','utf8');
assert.match(core,/Government photo ID and 18\+ age verification required before accepting jobs/);
assert.match(fs.readFileSync('backend/provider-live-face-policy.js','utf8'),/u.identityAgeConfirmed===true&&u.identityVerification\?\.status==='verified'/);
assert.match(fs.readFileSync('backend/server.js','utf8'),/require\('\.\/identity-verification-api'\)/);
// Stripe requires a restricted Identity Results key to expose verified date of birth.
// Without that key, no provider may be marked eligible for work.
const api=fs.readFileSync('backend/identity-verification-api.js','utf8');
assert(api.includes("if(liveFaceRequired())form['options[document][require_live_capture]']='true'"));
assert(api.includes("'options[document][require_matching_selfie]':'true'"));
assert(api.includes('session.options?.document?.require_live_capture!==true'));
assert(api.includes('session.options?.document?.require_matching_selfie!==true'));
console.log('Live selfie and photo ID capture approval requirement PASS');
assert.match(api,/canProviderWork\(u\)/);
assert.match(fs.readFileSync('backend/provider-live-face-policy.js','utf8'),/faceVerifiedLive===true/);
assert.match(core,/canProviderWork\(u\)/);
assert(core.includes("identityStatus:u.identityVerification?.status==='verified'&&!canProviderWork(u)?'reverification_required'"),'the flag must control displayed re-verification status');

const crypto=require('node:crypto');
const proof=crypto.createHmac('sha256','unit-test-only-key').update('provider zovro').digest('hex');
const stored={legalNameProof:proof};
const documentResult={
 status:'verified',
 options:{document:{require_matching_selfie:true,require_live_capture:true}},
 verified_outputs:{first_name:'ZOVRO',last_name:'Provider',dob:{year:1990,month:1,day:1}}
};
const assess=result=>identity.assessVerifiedDocument(result,stored,new Date('2026-11-12T00:00:00Z'));
assert.equal(assess(documentResult).ok,true,'Live selfie plus 18+ verified government ID should be accepted');
assert.equal(assess({...documentResult,redaction:{status:'processing'}}).reason,'verification_redacted','revocation in progress cannot approve');
assert.equal(assess({...documentResult,redaction:{status:'redacted'}}).reason,'verification_redacted','redacted Identity result cannot approve');
assert.equal(assess({...documentResult,status:'processing'}).ok,false,'Processing is never approval');
assert.equal(assess({...documentResult,options:{document:{require_matching_selfie:false,require_live_capture:true}}}).reason,'selfie_required');
assert.equal(assess({...documentResult,options:{document:{require_matching_selfie:true,require_live_capture:false}}}).reason,'live_capture_required');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,first_name:'Different'}}).reason,'name_not_matched');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,dob:{year:2008,month:11,day:13}}}).reason,'age_not_confirmed');
assert.equal(assess({...documentResult,verified_outputs:{...documentResult.verified_outputs,dob:null}}).reason,'age_not_confirmed');
assert.equal(identity.assessVerifiedDocument(documentResult,{},new Date('2026-11-12T00:00:00Z')).reason,'name_not_matched');

assert.match(api,/ZOVRO_STRIPE_IDENTITY_RESULTS_KEY/,'dedicated restricted results credential is required');
assert.match(api,/expand\[\]/,'Identity result expansion should be explicit');
assert.match(api,/verified_outputs\.dob/,'verified birth date expansion is required');
assert.match(api,/state.faceVerifiedLive=strict\|\|state.faceVerifiedLive===true/,'legacy refresh must not erase previously verified live-face proof');

assert.match(api,/identityReady\(\)/,'fail closed when secure Identity configuration is missing');
assert.match(api,/enforced:liveFaceRequired\(\)/,'API must report whether live-face rollout is enabled');
assert.match(api,/legacyIdentityReady\(\)/,'legacy government ID route must remain usable before face rollout');
assert.match(api,/strict\?STRIPE_RESULTS_KEY:STRIPE_KEY/,'legacy and strict result reads use their respective Stripe permissions');
assert.match(api,/if\(s\.status==='verified'\)\{\s*const checked=await refresh\(u,db\)/,'a completed Stripe session is checked instead of creating another paid session');
assert.match(api,/if\(checked\.verified\)return json\(res,200,\{identity:checked\}\)/,'successful recheck resumes existing verified session');
assert(api.indexOf("if(s.status==='verified')")<api.indexOf("const session=await stripe('POST'"),'reuse must precede new Stripe session creation');
assert.match(api,/s\.metadata\?\.zovro_provider_id!==u\.id\|\|s\.livemode!==true/,'stored sessions require provider ownership and live mode');
assert.match(api,/state.reviewReason='unexpected_status'/,'unknown session statuses must revoke prior eligibility');
assert(api.includes("s.status==='requires_input'&&!['processing','redacted'].includes(s.redaction?.status)"),'redacted sessions cannot return reusable Stripe links');
assert.match(api,/liveFaceRequired\(\)\&\&session.options\?\.document\?\.require_live_capture!==true/,'strict sessions must enforce live document capture');
assert.match(api,/session.options\?\.document\?\.require_matching_selfie!==true/,'legacy and strict sessions must match the selfie');
assert.match(api,/if\(strict\&\&!data\.verified_outputs\?\.dob\)throw new Error/,'strict live results require date of birth');
assert.match(api,/adultDob\(data\.verified_outputs\?\.dob\)/,'legacy identity can never approve without an adult date of birth');

console.log('Production API ID verification security checks PASS');
