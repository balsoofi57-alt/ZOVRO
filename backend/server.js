'use strict';
require('./startup-preflight');
const database=require('./database');
(async()=>{
  await database.initDurable();
  require('./response-security');
  require('./server-mobile-payments');
})().catch(e=>{console.error(JSON.stringify({event:'server_bootstrap_failed',message:e.message}));process.exit(1)});
