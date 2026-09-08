'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');let bad=false;
for(const f of ['privacy.html','terms.html','support.html']){const p=path.join(root,f);if(!fs.existsSync(p)){console.error('MISSING',f);bad=true}else if(fs.readFileSync(p,'utf8').length<500){console.error('TOO SHORT',f);bad=true}else console.log('OK',f)}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),server=fs.readFileSync(path.join(root,'backend/server-core.js'),'utf8');
for(const token of ['deleteAccount()','privacy.html','terms.html','support.html'])if(!html.includes(token)){console.error('Missing trust control:',token);bad=true}
if(!server.includes("req.method==='DELETE'&&url.pathname==='/api/me'")){console.error('Account deletion API missing');bad=true}
if(!server.includes('GET,POST,PATCH,DELETE,OPTIONS')){console.error('DELETE missing from CORS methods');bad=true}
const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
if(pkg.dependencies?.['@onesignal/capacitor-plugin']!=='1.1.9'){console.error('Official OneSignal Capacitor SDK is not pinned');bad=true}
const pushClient=fs.readFileSync(path.join(root,'push-client.js'),'utf8'),prepare=fs.readFileSync(path.join(root,'scripts/prepare-mobile.js'),'utf8'),paymentUi=fs.readFileSync(path.join(root,'payment-ui.js'),'utf8'),paymentClient=fs.readFileSync(path.join(root,'payment-client.js'),'utf8');
for(const token of ['OneSignalCapacitor','login({externalId:userId})','requestPermission({fallbackToSettings:false})'])if(!pushClient.includes(token)){console.error('Native push client missing:',token);bad=true}
if(!prepare.includes("'push-client.js'")){console.error('Native push client is not bundled');bad=true}
if(!prepare.includes("'payment-ui.js'")||!prepare.includes('zovro-api-final.onrender.com')){console.error('Final API/payment UI is not bundled');bad=true}
for(const token of ['quoteJob','payJob','releasePayment','ZOVRO_PAYMENTS.payRequest'])if(!paymentUi.includes(token)){console.error('Secure payment UX missing:',token);bad=true}
if(!paymentClient.includes("localStorage.getItem('zovroToken')")){console.error('Payment client is not using the authenticated ZOVRO session');bad=true}
if(bad)process.exit(1);console.log('ZOVRO store-readiness check passed.');
