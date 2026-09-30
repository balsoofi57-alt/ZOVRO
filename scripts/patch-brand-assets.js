'use strict';
const fs=require('fs'),path=require('path');
function patchBrandAssets(root=path.resolve(__dirname,'..')) {
  const icon=path.join(root,'assets/zovro-icon-1024.png');
  if(!fs.existsSync(icon))throw new Error('Approved ZOVRO icon is missing');
  const android=path.join(root,'android/app/src/main');
  const manifest=path.join(android,'AndroidManifest.xml');
  if(fs.existsSync(manifest)) {
    const drawable=path.join(android,'res/drawable-nodpi');
    fs.mkdirSync(drawable,{recursive:true});
    fs.copyFileSync(icon,path.join(drawable,'zovro_launcher.png'));
    const xml=fs.readFileSync(manifest,'utf8');
    if(!/android:icon="[^"]+"/.test(xml))throw new Error('Android icon attribute missing');
    fs.writeFileSync(manifest,xml.replace(/android:icon="[^"]+"/g,'android:icon="@drawable/zovro_launcher"').replace(/android:roundIcon="[^"]+"/g,'android:roundIcon="@drawable/zovro_launcher"'));
  }
  const ios=path.join(root,'ios/App/App/Assets.xcassets/AppIcon.appiconset');
  if(fs.existsSync(ios)) {
    fs.copyFileSync(icon,path.join(ios,'ZOVRO-AppIcon.png'));
    fs.writeFileSync(path.join(ios,'Contents.json'),JSON.stringify({images:[{filename:'ZOVRO-AppIcon.png',idiom:'universal',platform:'ios',size:'1024x1024'}],info:{author:'ZOVRO',version:1}},null,2)+'\n');
  }
}
if(require.main===module)patchBrandAssets();
module.exports={patchBrandAssets};
