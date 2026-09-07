'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
cp.execFileSync(process.execPath,[path.join(root,'scripts','prepare-mobile.js')],{cwd:root,stdio:'inherit'});
const required=['index.html','www/index.html','manifest.webmanifest','www/manifest.webmanifest','capacitor.config.json','backend/server.js','backend/server-core.js','backend/database.js','backend/payments.js','assets/zovro-icon-1024.png','privacy.html','terms.html','support.html'];
let bad=false;for(const f of required){const p=path.join(root,f);if(!fs.existsSync(p)){console.error('MISSING',f);bad=true}else console.log('OK',f)}
const cap=JSON.parse(fs.readFileSync(path.join(root,'capacitor.config.json'),'utf8'));if(cap.appId!=='com.zovro.app'||cap.appName!=='ZOVRO'||cap.webDir!=='www'){console.error('Invalid Capacitor identity');bad=true}
const html=fs.readFileSync(path.join(root,'www/index.html'),'utf8');if(!html.includes('ZOVRO_CONFIG')||!html.includes('zovroLanguage')||!html.includes('i18n.js')){console.error('Mobile runtime configuration or localization missing');bad=true}
if(bad)process.exit(1);console.log('ZOVRO release preflight passed.');
