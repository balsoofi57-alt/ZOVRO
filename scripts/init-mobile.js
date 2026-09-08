'use strict';
const {execFileSync}=require('child_process'),fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function npx(args){execFileSync(process.platform==='win32'?'npx.cmd':'npx',args,{cwd:root,stdio:'inherit'})}
execFileSync(process.execPath,[path.join(root,'scripts','prepare-mobile.js')],{cwd:root,stdio:'inherit'});if(!fs.existsSync(path.join(root,'ios')))npx(['cap','add','ios']);if(!fs.existsSync(path.join(root,'android')))npx(['cap','add','android']);npx(['cap','sync']);execFileSync(process.execPath,[path.join(root,'scripts','patch-native.js')],{cwd:root,stdio:'inherit'});console.log('ZOVRO native shells initialized and permissions patched.');
