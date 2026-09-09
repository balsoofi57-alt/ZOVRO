'use strict';
require('./startup-preflight');
require('./log-privacy');
const database=require('./database');
(async()=>{
  await database.initDurable();
  require('./launch-readiness');
  require('./response-security');
  require('./consent-guard');
  require('./request-privacy');
  require('./html-inject');
  require('./product-expansion');
  require('./server-mobile-payments');
})().catch(e=>{console.error(JSON.stringify({event:'server_bootstrap_failed',message:e.message}));process.exit(1)});