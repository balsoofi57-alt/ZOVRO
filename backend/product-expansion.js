'use strict';
const http=require('http'),fs=require('fs'),path=require('path');
const {SERVICE_CATALOG,smartMatch}=require('../src/service-catalog');
const {PRODUCT_FEATURES,LAUNCH_PHASES,BRAND}=require('../src/product-features');
const originalCreateServer=http.createServer.bind(http),ROOT=path.resolve(__dirname,'..');
const json=(res,code,obj)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(JSON.stringify(obj))};
const send=(res,code,type,text)=>{res.writeHead(code,{'content-type':type,'cache-control':'no-cache','x-content-type-options':'nosniff','referrer-policy':'no-referrer'});res.end(text)};
const body=req=>new Promise((resolve,reject)=>{let s='';req.on('data',c=>{s+=c;if(s.length>250000){reject(new Error('Body too large'));req.destroy()}});req.on('end',()=>{try{resolve(s?JSON.parse(s):{})}catch(e){reject(e)}});req.on('error',reject)});
function file(name){return fs.readFileSync(path.join(ROOT,name),'utf8')}
function enhancedIndex(){let html=file('index.html');const head='<link rel="stylesheet" href="/src/zovro-theme.css">';const scripts='<script src="/src/service-catalog.js"></script><script src="/src/product-features.js"></script><script src="/src/zovro-enhancements.js"></script><script src="/src/workflow-client.js"></script>';return html.replace('</head>',head+'</head>').replace('</body>',scripts+'</body>')}
async function productApi(req,res,next){
  let url;try{url=new URL(req.url,'http://localhost')}catch{return next(req,res)}
  if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html'))return send(res,200,'text/html; charset=utf-8',enhancedIndex());
  if(req.method==='GET'&&url.pathname==='/src/service-catalog.js')return send(res,200,'application/javascript; charset=utf-8',file('src/service-catalog.js'));
  if(req.method==='GET'&&url.pathname==='/src/product-features.js')return send(res,200,'application/javascript; charset=utf-8',file('src/product-features.js'));
  if(req.method==='GET'&&url.pathname==='/src/zovro-enhancements.js')return send(res,200,'application/javascript; charset=utf-8',file('src/zovro-enhancements.js'));
  if(req.method==='GET'&&url.pathname==='/src/workflow-client.js')return send(res,200,'application/javascript; charset=utf-8',file('src/workflow-client.js'));
  if(req.method==='GET'&&url.pathname==='/src/zovro-theme.css')return send(res,200,'text/css; charset=utf-8',file('src/zovro-theme.css'));
  if(req.method==='GET'&&url.pathname==='/api/product/catalog')return json(res,200,{brand:BRAND,categories:SERVICE_CATALOG,language:{default:'en',options:['en','es'],label:'English | Spanish'}});
  if(req.method==='GET'&&url.pathname==='/api/product/features')return json(res,200,{features:PRODUCT_FEATURES,launchPhases:LAUNCH_PHASES});
  if(req.method==='POST'&&url.pathname==='/api/product/smart-match'){
    try{const b=await body(req),text=String(b.text||'').trim().slice(0,2000);if(text.length<3)return json(res,400,{error:'Describe the problem in at least 3 characters.'});const matches=smartMatch(text,{limit:5});return json(res,200,{query:text,matches,urgentHint:/emergency|urgent|stranded|locked out|no heat|burst|flood|tow|flat tire|won.t start/i.test(text)})}catch(e){return json(res,400,{error:e.message||'Invalid request'})}
  }
  return next(req,res);
}
http.createServer=function(handler,...args){return originalCreateServer((req,res)=>productApi(req,res,handler),...args)};
module.exports={productApi};
