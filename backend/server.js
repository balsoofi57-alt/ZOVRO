'use strict';
require('./startup-preflight');
require('./log-privacy');
const database=require('./database');
(async()=>{
  await database.initDurable();
  if(/^(1|true|yes|on)$/i.test(String(process.env.ZOVRO_POSTGRES_STARTUP_PROBE||''))){
    const {runPostgresWriteProbe}=require('./postgres-write-probe');
    await runPostgresWriteProbe();
  }
  require('./launch-readiness');
  require('./response-security');
  require('./consent-guard');
  require('./request-privacy');
  require('./profile-private-api');
  require('./workflow-api');
  require('./html-inject');
  require('./product-expansion');
  require('./server-mobile-payments');
})().catch(e=>{console.error(JSON.stringify({event:'server_bootstrap_failed',message:e.message}));process.exit(1)});