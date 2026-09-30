'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function patchIOS(){const p=path.join(root,'ios','App','App','Info.plist');if(!fs.existsSync(p))return console.log('iOS project not present; skipping plist patch.');let s=fs.readFileSync(p,'utf8');const entries=[['NSLocationWhenInUseUsageDescription','ZOVRO uses your location to match you with nearby service providers and track an active service request.'],['NSCameraUsageDescription','ZOVRO uses the camera to upload provider verification and service photos.'],['NSPhotoLibraryUsageDescription','ZOVRO uses your photo library to upload provider verification and service photos.']];for(const [k,v] of entries)if(!s.includes(`<key>${k}</key>`))s=s.replace('</dict>',`\t<key>${k}</key>\n\t<string>${v}</string>\n</dict>`);fs.writeFileSync(p,s);console.log('Patched iOS permissions.')}
function patchAndroid(){const p=path.join(root,'android','app','src','main','AndroidManifest.xml');if(!fs.existsSync(p))return console.log('Android project not present; skipping manifest patch.');let s=fs.readFileSync(p,'utf8');const perms=['android.permission.INTERNET','android.permission.ACCESS_NETWORK_STATE','android.permission.ACCESS_FINE_LOCATION','android.permission.ACCESS_COARSE_LOCATION','android.permission.POST_NOTIFICATIONS'];for(const perm of perms)if(!s.includes(perm))s=s.replace('<application',`<uses-permission android:name="${perm}" />\n    <application`);if(!s.includes('android.hardware.camera'))s=s.replace('<application','<uses-feature android:name="android.hardware.camera" android:required="false" />\n    <application');fs.writeFileSync(p,s);console.log('Patched Android permissions.')}
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
function patchAndroidMinSdk(projectRoot=root){
 const p=path.join(projectRoot,'android','variables.gradle');
 if(!fs.existsSync(path.dirname(p)))return;
 let s=fs.readFileSync(p,'utf8');
 // Play protection requires min SDK 24; submissions require target SDK 36.
 // Compile against at least the target API, preserving higher configured values.
 for(const [key,minimum] of Object.entries({minSdkVersion:24,targetSdkVersion:36,compileSdkVersion:36})){
  const setting=new RegExp('^([ \\t]*'+key+'[ \\t]*=[ \\t]*)(\\d+)([ \\t]*(?://[^\\n]*)?)$','m');
  const match=s.match(setting);
  if(!match)throw new Error('Cannot find numeric '+key+' in android/variables.gradle');
  if(Number(match[2])<minimum)s=s.replace(setting,(_,prefix,value,suffix)=>prefix+minimum+suffix);
 }
 fs.writeFileSync(p,s);
 const appBuild=path.join(projectRoot,'android','app','build.gradle');
 if(fs.existsSync(appBuild)){
  const appSource=fs.readFileSync(appBuild,'utf8');
  const version=/\bversionCode\s+(?:=\s*)?(\d+)\b/;
  const match=appSource.match(version);
  if(!match)throw new Error('Cannot find numeric Android versionCode');
  // Version 1 was uploaded during Play validation; the replacement must be new.
  if(Number(match[1])<2)fs.writeFileSync(appBuild,appSource.replace(version,'versionCode 2'));
 }
}
function patchAndroidWallet(projectRoot=root){
 const p=path.join(projectRoot,'android','app','src','main','AndroidManifest.xml');
 if(!fs.existsSync(p))return;
 let s=fs.readFileSync(p,'utf8');
 const metadata='<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="true" />';
 const existing=/<meta-data\b[^>]*android:name=["']com\.google\.android\.gms\.wallet\.api\.enabled["'][^>]*\/\s*>/g;
 if(existing.test(s))s=s.replace(existing,metadata);
 else {
  if(!s.includes('</application>'))throw new Error('Cannot find Android application element for Google Pay');
  s=s.replace('</application>',`    ${metadata}\n    </application>`);
 }
 fs.writeFileSync(p,s);
}
if(require.main===module){patchIOS();patchAndroid();patchAndroidWallet();patchAndroidBuild();patchAndroidMinSdk();require('./patch-brand-assets').patchBrandAssets();}
module.exports={patchAndroidBuild,patchAndroidMinSdk,patchAndroidWallet};
