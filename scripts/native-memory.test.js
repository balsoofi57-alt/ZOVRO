const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('fs'),path=require('path'),os=require('os');
const {patchAndroidBuild}=require('./patch-native');
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
