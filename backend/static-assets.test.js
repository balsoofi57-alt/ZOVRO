const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),os=require('os'),path=require('path'),http=require('http');
const {servePublicFile,PUBLIC_FILES}=require('./static-assets');
test('public assets are available but private paths and symlinks are blocked',async t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-static-'));
 fs.mkdirSync(path.join(root,'backend'));
 fs.writeFileSync(path.join(root,'backend','probe.txt'),'LOCAL_TEST_ONLY');
 for(const file of PUBLIC_FILES){fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),'PUBLIC_FIXTURE');}
 const server=http.createServer((req,res)=>servePublicFile(req,res,{pathname:req.url.split('?')[0]},root));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 t.after(async()=>{await new Promise(resolve=>server.close(resolve));fs.rmSync(root,{recursive:true,force:true});});
 const request=(pathname,method='GET')=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port:server.address().port,path:pathname,method},res=>{let body='';res.on('data',b=>body+=b);res.on('end',()=>resolve({status:res.statusCode,body}));});req.on('error',reject);req.end();});
 for(const file of PUBLIC_FILES){const r=await request('/'+file);assert.equal(r.status,200,file);assert.equal(r.body,'PUBLIC_FIXTURE');}
 for(const file of ['/backend/probe.txt','/backend/server-core.js','/package.json','/.git/config','/.env','/scripts/patch-native.js','/backend/data/db.sqlite','/%62ackend/probe.txt','/assets/../backend/probe.txt','/assets/%2e%2e/backend/probe.txt','/%252e%252e/backend/probe.txt','/index.html%00','/src/unknown.js'])assert.equal((await request(file)).status,404,file);
 assert.equal((await request('/%zz')).status,400);
 assert.equal((await request('/index.html','POST')).status,405);
 assert.deepEqual(await request('/index.html','HEAD'),{status:200,body:''});
 fs.unlinkSync(path.join(root,'index.html'));fs.symlinkSync(path.join(root,'backend/probe.txt'),path.join(root,'index.html'));
 assert.equal((await request('/index.html')).status,404);
});
