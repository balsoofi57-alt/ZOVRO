'use strict';
const {readDb}=require('./database');
function logPayoutReadinessSummary(){
  const db=readDb();
  const providers=(db.users||[]).filter(u=>u.role==='provider'&&(u.accountStatus||'active')==='active');
  const linked=providers.filter(u=>String(u.stripeRecipientAccountId||'').startsWith('acct_'));
  const onboardingComplete=linked.filter(u=>u.stripeOnboardingComplete===true);
  const payoutsEnabled=linked.filter(u=>u.stripePayoutsEnabled===true);
  console.log(JSON.stringify({event:'stripe.payout_readiness_summary',providers:providers.length,linked:linked.length,onboardingComplete:onboardingComplete.length,payoutsEnabled:payoutsEnabled.length}));
}
module.exports={logPayoutReadinessSummary};
