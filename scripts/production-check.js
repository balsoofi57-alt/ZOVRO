'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');let bad=false;
const env=path.join(root,'backend','.env.example'),mobileEnv=path.join(root,'.env.mobile.example'),cap=path.join(root,'capacitor.config.json'),check=path.join(root,'RELEASE_CHECKLIST.md');
for(const p of [env,mobileEnv,cap,check])if(!fs.existsSync(p)){console.error('MISSING',path.relative(root,p));bad=true}
const c=JSON.parse(fs.readFileSync(cap,'utf8'));if(c.appId!=='com.zovro.app'||c.appName!=='ZOVRO'){console.error('Invalid mobile identity');bad=true}
const e=fs.readFileSync(env,'utf8');for(const key of ['ZOVRO_SECRET','ZOVRO_OPS_TOKEN','ZOVRO_ALLOWED_ORIGINS'])if(!e.includes(key)){console.error('Missing production variable documentation:',key);bad=true}
const server=fs.readFileSync(path.join(root,'backend','server.js'),'utf8');if(!server.includes('SECRET.length<32')||!server.includes('OPS_TOKEN.length<24')){console.error('Production secret guards missing');bad=true}
const m=fs.readFileSync(mobileEnv,'utf8');for(const key of ['ZOVRO_API_URL','ZOVRO_BUILD_CHANNEL'])if(!m.includes(key)){console.error('Missing mobile build variable documentation:',key);bad=true}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));if(pkg.version!=='1.0.0'){console.error('Unexpected app version');bad=true}
if(bad)process.exit(1);console.log('ZOVRO 1.0 Final production configuration check passed.');
