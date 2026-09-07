'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let bad=false;
for(const f of ['privacy.html','terms.html','support.html']){const p=path.join(root,f);if(!fs.existsSync(p)){console.error('MISSING',f);bad=true}else if(fs.readFileSync(p,'utf8').length<500){console.error('TOO SHORT',f);bad=true}else console.log('OK',f)}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),server=fs.readFileSync(path.join(root,'backend/server-core.js'),'utf8');
for(const token of ['deleteAccount()','privacy.html','terms.html','support.html'])if(!html.includes(token)){console.error('Missing trust control:',token);bad=true}
if(!server.includes("req.method==='DELETE'&&url.pathname==='/api/me'")){console.error('Account deletion API missing');bad=true}
if(!server.includes('GET,POST,PATCH,DELETE,OPTIONS')){console.error('DELETE missing from CORS methods');bad=true}
if(bad)process.exit(1);console.log('ZOVRO store-readiness check passed.');
