'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
// Apple accepted "usesNonExemptEncryption=false" on earlier ZOVRO builds
// (e.g. 343.1). This declares only the previously reviewed, exempt use
// of encryption. Review export compliance again before changing crypto SDKs.
function ensureIOSExemptionFlag(plist){
 const name='ITSAppUsesNonExemptEncryption';
 const marker='<key>'+name+'</key>';
 if(plist.includes(marker)){
  if(!/<key>ITSAppUsesNonExemptEncryption<\/key>\s*<false\s*\/>/.test(plist))throw new Error('Existing iOS encryption declaration differs; human compliance review required');
  return plist;
 }
 const at=plist.lastIndexOf('</dict>');
 if(at<0)throw new Error('Cannot find root Info.plist dictionary for encryption declaration');
 return plist.slice(0,at)+'\t'+marker+'\n\t<false/>\n'+plist.slice(at);
}
function patchIOS(){const p=path.join(root,'ios','App','App','Info.plist');if(!fs.existsSync(p))return console.log('iOS project not present; skipping plist patch.');let s=fs.readFileSync(p,'utf8');const entries=[['NSLocationWhenInUseUsageDescription','ZOVRO uses your location to match you with nearby service providers and track an active service request.'],['NSCameraUsageDescription','ZOVRO uses the camera to upload provider verification and service photos.'],['NSPhotoLibraryUsageDescription','ZOVRO uses your photo library to upload provider verification and service photos.']];for(const [k,v] of entries)if(!s.includes(`<key>${k}</key>`)){const at=s.lastIndexOf('</dict>');if(at<0)throw new Error('Cannot find the root dict in Info.plist');s=s.slice(0,at)+`\t<key>${k}</key>\n\t<string>${v}</string>\n`+s.slice(at);}for(const [k] of entries)if(!s.includes(`<key>${k}</key>`))throw new Error('Info.plist is missing '+k);s=ensureIOSExemptionFlag(s);fs.writeFileSync(p,s);patchIOSDeploymentTarget();console.log('Patched iOS permissions and previously reviewed export-compliance flag.')}
function patchIOSDeploymentTarget(){const min=15;const pbx=path.join(root,'ios','App','App.xcodeproj','project.pbxproj');if(fs.existsSync(pbx)){const src=fs.readFileSync(pbx,'utf8');const out=src.replace(/IPHONEOS_DEPLOYMENT_TARGET = (\d+(?:\.\d+)?);/g,(m,v)=>Number(v)<min?'IPHONEOS_DEPLOYMENT_TARGET = '+min+'.0;':m);if(out!==src)fs.writeFileSync(pbx,out);}const pod=path.join(root,'ios','App','Podfile');if(fs.existsSync(pod)){const src=fs.readFileSync(pod,'utf8');const out=src.replace(/platform :ios, '(\d+(?:\.\d+)?)'/,(m,v)=>Number(v)<min?"platform :ios, '"+min+".0'":m);if(out!==src)fs.writeFileSync(pod,out);}}
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
  // Play versions 1 and 2 are already uploaded; the silver update is version 3.
  if(Number(match[1])<3)fs.writeFileSync(appBuild,appSource.replace(version,'versionCode 3'));
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
module.exports={patchAndroidBuild,patchAndroidMinSdk,patchAndroidWallet,ensureIOSExemptionFlag};
