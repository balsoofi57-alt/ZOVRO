const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),os=require('os');
const {patchAndroidBuild,patchAndroidMinSdk,patchAndroidWallet}=require('./patch-native');
test('Android memory patch replaces defaults, preserves settings and is idempotent',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-gradle-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 patchAndroidBuild(root);assert.equal(fs.existsSync(path.join(root,'android')),false);
 fs.mkdirSync(path.join(root,'android'));
 const file=path.join(root,'android/gradle.properties');
 fs.writeFileSync(file,'# app settings\nandroid.useAndroidX=true\norg.gradle.jvmargs=-Xmx1536m\norg.gradle.workers.max=8\n');
 patchAndroidBuild(root);const first=fs.readFileSync(file,'utf8');
 assert.match(first,/android.useAndroidX=true/);assert.match(first,/org.gradle.jvmargs=-Xmx4g/);assert.match(first,/org.gradle.workers.max=2/);assert.doesNotMatch(first,/1536m/);
 patchAndroidBuild(root);assert.equal(fs.readFileSync(file,'utf8'),first);
});
test('Android minimum SDK supports Play protection without lowering future minimums',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-minsdk-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 patchAndroidMinSdk(root);
 fs.mkdirSync(path.join(root,'android'));
 const file=path.join(root,'android/variables.gradle');
 fs.mkdirSync(path.join(root,'android/app'));
 const appBuild=path.join(root,'android/app/build.gradle');
 fs.writeFileSync(appBuild,'android { defaultConfig { versionCode 1 } }');
 for(const minimum of [23,24,26]){
  const source=`ext {\n    minSdkVersion = ${minimum} // supported devices\n    compileSdkVersion = 35\n    targetSdkVersion = 35\n}\n`;
  fs.writeFileSync(file,source);
  patchAndroidMinSdk(root);
  const result=fs.readFileSync(file,'utf8');
  assert.equal(result,source.replace(`= ${minimum} //`,`= ${Math.max(24,minimum)} //`).replaceAll('= 35','= 36'));
  patchAndroidMinSdk(root);assert.equal(fs.readFileSync(file,'utf8'),result);
  assert.match(fs.readFileSync(appBuild,'utf8'),/versionCode 3/);
 }
 fs.writeFileSync(appBuild,'android { defaultConfig { versionCode 5 } }');
 fs.writeFileSync(file,'ext {\n minSdkVersion = 26\n targetSdkVersion = 37\n compileSdkVersion = 37\n}\n');
 const future=fs.readFileSync(file,'utf8');patchAndroidMinSdk(root);assert.equal(fs.readFileSync(file,'utf8'),future);
 assert.match(fs.readFileSync(appBuild,'utf8'),/versionCode 5/);
 fs.writeFileSync(file,'ext { minSdkVersion = unknown }');
 assert.throws(()=>patchAndroidMinSdk(root),/Cannot find numeric minSdkVersion/);
});

test('Google Pay manifest configuration survives repeated native preparation',t=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'zovro-wallet-'));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));
 patchAndroidWallet(root);
 assert.equal(fs.existsSync(path.join(root,'android')),false);
 const file=path.join(root,'android/app/src/main/AndroidManifest.xml');
 fs.mkdirSync(path.dirname(file),{recursive:true});
 for(const previous of ['', '<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="false" />']){
  fs.writeFileSync(file,`<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:label="ZOVRO">${previous}<activity android:name=".MainActivity" /></application></manifest>`);
  patchAndroidWallet(root);
  const result=fs.readFileSync(file,'utf8');
  assert.match(result,/<application[^>]*>[\s\S]*<meta-data android:name="com.google.android.gms.wallet.api.enabled" android:value="true" \/>[\s\S]*<\/application>/);
  assert.match(result,/<activity android:name=".MainActivity" \/>/);
  assert.equal(result.split('com.google.android.gms.wallet.api.enabled').length-1,1);
  patchAndroidWallet(root);
  assert.equal(fs.readFileSync(file,'utf8'),result);
 }
 fs.writeFileSync(file,'<manifest />');
 assert.throws(()=>patchAndroidWallet(root),/Cannot find Android application/);
});
