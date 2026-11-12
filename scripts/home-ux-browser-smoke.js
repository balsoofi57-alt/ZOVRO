'use strict';
// Browser-level smoke test for the drafted ZOVRO Home layout.
// Uses no live account, no real GPS and never submits a service request.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 try{
  const u=new URL(req.url,'http://127.0.0.1');
  const rel=decodeURIComponent(u.pathname)==='/'?'/index.html':decodeURIComponent(u.pathname);
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)) {res.writeHead(403);return res.end('Forbidden')}
  fs.readFile(file,(err,body)=>{
   if(err){res.writeHead(404);return res.end('Not found')}
   res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');
   res.end(body);
  });
 }catch {res.writeHead(400);res.end('Bad request')}
});
(async()=>{
 await new Promise((resolve,reject)=>server.listen(0,'127.0.0.1',err=>err?reject(err):resolve()));
 const url='http://127.0.0.1:'+server.address().port;
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',err=>errors.push(err.message));
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.locator('#zHomeTools').waitFor({state:'visible',timeout:15000});
  const pageData=await page.evaluate(()=>{
   const nav=document.querySelector('nav.bottom');
   return {background:getComputedStyle(document.body).backgroundColor,
    navDisplay:nav?getComputedStyle(nav).display:null,
    links:[...document.querySelectorAll('nav.bottom button')].map(b=>b.textContent.trim()),
    search:!!document.getElementById('zHomeSearch'),
    location:!!document.getElementById('zHomeLocationToggle'),
    urgent:document.querySelectorAll('#zStartRequest').length,
    cards:document.querySelectorAll('#zCategoryGrid .z-category').length,
    notifications:!!document.getElementById('zNotificationBell')};
  });
  assert.equal(pageData.navDisplay,'grid','Bottom navigation must be visible on mobile');
  assert.deepEqual(pageData.links,['Home','My Requests','Messages','Account']);
  assert(pageData.search&&pageData.location&&pageData.notifications);
  assert.equal(pageData.urgent,1,'Only one Help Now button is allowed');
  assert.equal(pageData.cards,6,'Six silver category cards remain');
  // Opt-in manual location does not trigger GPS and is safe for remote requests.
  await page.locator('#zHomeLocationToggle').click();
  await page.locator('#zHomeManualAddress').fill('123 Test Street, Dearborn, MI');
  await page.locator('.z-home-manual-apply').click();
  assert.match(await page.locator('#zHomeLocationToggle').innerText(),/123 Test Street/);
  await page.locator('#zHomeSearch').fill('flat tire');
  const suggestions=await page.locator('#zHomeSearchResults .z-home-result').count();
  assert(suggestions>0,'Search suggestions should include tire-related service options');
  await page.screenshot({path:path.join(root,'zovro-home-mobile-preview.png'),fullPage:true});
  await page.locator('nav.bottom button[data-z-home-tab="messages"]').click();
  assert.equal(await page.locator('#jobs .sectionHead h2').innerText(),'Messages');
  assert(await page.locator('#zHomeMessages').isVisible(),'Messages must be reachable as a full tab');
  await page.locator('nav.bottom button[data-z-home-tab="home"]').click();
  await page.locator('#zStartRequest').click();
  assert(await page.locator('#authModal').evaluate(e=>e.classList.contains('open')),'Urgent button should open login then request review, never silently send a request');
  assert.equal(errors.length,0,'No uncaught browser JavaScript errors: '+errors.join(' | '));
  console.log('ZOVRO mobile browser preview passed',JSON.stringify({nav:pageData.links,cards:pageData.cards,suggestions,errors:errors.length}));
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(err=>{console.error(err);process.exitCode=1});
