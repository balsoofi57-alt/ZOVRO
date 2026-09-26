'use strict';
require('./log-privacy');
const database=require('./database');
(async()=>{
  if(/^(1|true|yes|on)$/i.test(String(process.env.ZOVRO_PUSH_CREDENTIAL_PROBE||''))){
    const probe=await require('./push-credential-probe').runPushCredentialProbe();
    process.env.ZOVRO_ONESIGNAL_CREDENTIALS_VERIFIED=probe.ok?'true':'false';
  }
  require('./startup-preflight');
  await database.initDurable();
  if(/^(1|true|yes|on)$/i.test(String(process.env.ZOVRO_POSTGRES_STARTUP_PROBE||''))){
    const {runPostgresWriteProbe}=require('./postgres-write-probe');
    await runPostgresWriteProbe();
  }
  require('./launch-readiness');
  if(/^(1|true|yes|on)$/i.test(String(process.env.ZOVRO_PAYOUT_READINESS_SUMMARY||''))){
    require('./payout-readiness-summary').logPayoutReadinessSummary();
  }
  require('./response-security');
  require('./consent-guard');
  require('./request-privacy');
  require('./profile-private-api');
  require('./workflow-api');
  require('./html-inject');
  require('./product-expansion');
  require('./server-mobile-payments');
})().catch(e=>{console.error(JSON.stringify({event:'server_bootstrap_failed',message:e.message}));process.exit(1)});