'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function patchIOS(){const p=path.join(root,'ios','App','App','Info.plist');if(!fs.existsSync(p))return console.log('iOS project not present; skipping plist patch.');let s=fs.readFileSync(p,'utf8');const entries=[['NSLocationWhenInUseUsageDescription','ZOVRO uses your location to match you with nearby service providers and track an active service request.'],['NSCameraUsageDescription','ZOVRO uses the camera to upload provider verification and service photos.'],['NSPhotoLibraryUsageDescription','ZOVRO uses your photo library to upload provider verification and service photos.'],['NSFaceIDUsageDescription','ZOVRO uses Face ID to securely unlock your saved account session on this device.']];for(const [k,v] of entries)if(!s.includes(`<key>${k}</key>`))s=s.replace('</dict>',`\t<key>${k}</key>\n\t<string>${v}</string>\n</dict>`);fs.writeFileSync(p,s);console.log('Patched iOS permissions.')}
function patchAndroid(){const p=path.join(root,'android','app','src','main','AndroidManifest.xml');if(!fs.existsSync(p))return console.log('Android project not present; skipping manifest patch.');let s=fs.readFileSync(p,'utf8');const perms=['android.permission.INTERNET','android.permission.ACCESS_NETWORK_STATE','android.permission.ACCESS_FINE_LOCATION','android.permission.ACCESS_COARSE_LOCATION','android.permission.POST_NOTIFICATIONS','android.permission.USE_BIOMETRIC'];for(const perm of perms)if(!s.includes(perm))s=s.replace('<application',`<uses-permission android:name="${perm}" />\n    <application`);if(!s.includes('android.hardware.camera'))s=s.replace('<application','<uses-feature android:name="android.hardware.camera" android:required="false" />\n    <application');fs.writeFileSync(p,s);console.log('Patched Android permissions.')}
function patchAndroidBuild(projectRoot=root){
 const p=path.join(projectRoot,'android','gradle.properties');
 if(!fs.existsSync(path.dirname(p)))return;
 let s=fs.existsSync(p)?fs.readFileSync(p,'utf8'):'';
 const settings={'org.gradle.jvmargs':'-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8','org.gradle.workers.max':'2'};
 for(const [key,value] of Object.entries(settings)){
  s=s.split('\n').filter(line=>!line.trim().startsWith(key+'=')&&!line.trim().startsWith(key+' =')).join('\n').trimEnd();
  s+='\n'+key+'='+value+'\n';
 }
 fs.writeFileSync(p,s);
}
if(require.main===module){patchIOS();patchAndroid();patchAndroidBuild();}
module.exports={patchAndroidBuild};
