'use strict';
// Explicit rollout switch: never change the established government-ID + 18+ gate
// simply because the live-selfie code was deployed.
const liveFaceRequired=()=>String(process.env.ZOVRO_ENFORCE_LIVE_FACE_ID||'').toLowerCase()==='true';
const governmentIdApproved=u=>!!(u&&u.identityVerified===true&&u.identityAgeConfirmed===true&&u.identityVerification?.status==='verified');
const canProviderWork=u=>governmentIdApproved(u)&&(!liveFaceRequired()||u.identityVerification?.faceVerifiedLive===true);
module.exports={liveFaceRequired,governmentIdApproved,canProviderWork};
