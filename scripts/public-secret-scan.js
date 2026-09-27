'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process');
const root=path.resolve(__dirname,'..');
const {PUBLIC_FILES}=require('../backend/static-assets');

const join=(...parts)=>parts.join('_');
const forbiddenNames=[
  join('STRIPE','SECRET','KEY'),
  join('STRIPE','WEBHOOK','SECRET'),
  join('ONESIGNAL','REST','API','KEY'),
  join('TWILIO','AUTH','TOKEN'),
  join('ZOVRO','SECRET'),
  join('ZOVRO','OPS','TOKEN'),
  join('DATABASE','URL'),
  join('ZOVRO','PROFILE','ENCRYPTION','KEY')
];
const forbiddenPatterns=[
  new RegExp('\\b'+'s'+'k_'+'(?:live|test)_'+'[A-Za-z0-9]{10,}\\b','g'),
  new RegExp('\\b'+'w'+'hsec_'+'[A-Za-z0-9]{10,}\\b','g')
];

const textExt=new Set(['.html','.js','.css','.json','.webmanifest','.svg','.txt']);
let bad=false;
function scanText(file,label){
  if(!textExt.has(path.extname(file).toLowerCase()))return;
  const text=fs.readFileSync(file,'utf8');
  for(const name of forbiddenNames){
    if(text.includes(name)){console.error('PUBLIC_BUNDLE_SCAN_FAIL',label,'contains server-only identifier',name);bad=true}
  }
  for(const re of forbiddenPatterns){
    re.lastIndex=0;
    if(re.test(text)){console.error('PUBLIC_BUNDLE_SCAN_FAIL',label,'contains secret-looking credential');bad=true}
  }
}
function walk(dir){
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})){
    const file=path.join(dir,entry.name);
    if(entry.isDirectory())walk(file);
    else if(entry.isFile())scanText(file,path.relative(root,file));
  }
}
for(const rel of PUBLIC_FILES){
  const file=path.join(root,rel);
  if(!fs.existsSync(file)){console.error('PUBLIC_BUNDLE_SCAN_FAIL missing public source',rel);bad=true;continue}
  scanText(file,rel);
}
cp.execFileSync(process.execPath,[path.join(root,'scripts','prepare-mobile.js')],{cwd:root,stdio:'inherit'});
walk(path.join(root,'www'));
if(bad)process.exit(1);
console.log('ZOVRO public bundle secret scan passed.');
