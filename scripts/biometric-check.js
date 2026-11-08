'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const pkg=JSON.parse(read('package.json'));
assert.equal(pkg.dependencies['@aparajita/capacitor-biometric-auth'],'9.1.2','Capacitor 7 biometric plugin must stay pinned to 9.1.2');
const bio=read('biometric-client.js');
const session=read('secure-session.js');
const prep=read('scripts/prepare-mobile.js');
const native=read('scripts/patch-native.js');
assert.match(bio,/ZOVRO never receives or stores your face or fingerprint data/,'Biometric privacy disclosure missing');
assert.match(bio,/does not store your raw password/,'Raw password must never be stored for biometric sign-in');
assert.match(bio,/allowDeviceCredential:true/,'Device credential fallback must remain enabled');
assert.match(bio,/setEnabled\(true\)/,'Biometric enable flow missing');
assert.match(bio,/Sign in with Face ID/,'Face ID login shortcut missing');
assert.match(bio,/unlockSavedSession/,'Saved-session Face ID login flow missing');
assert.match(bio,/ZOVRO_SECURE_SESSION\?\.get/,'Face ID login must use the secure saved session rather than a stored password');
assert.match(bio,/Sign in once with your phone and password/,'First-login fallback guidance missing');
assert.match(session,/ZOVRO_BIOMETRIC\?\.shouldProtect/,'Saved-session biometric gate missing');
assert.ok(session.indexOf("ZOVRO_BIOMETRIC.authenticate('Unlock your ZOVRO account')")<session.indexOf('setRuntime(saved)'),'Saved session must not enter runtime before biometric authentication');
assert.match(session,/initPromise/,'Secure-session initialization must be idempotent');
assert.match(prep,/biometric-client\.js/,'Biometric client must be included in mobile bundle');
assert.ok(prep.indexOf('<script src="biometric-client.js"></script>')<prep.indexOf('<script src="secure-session.js"></script>'),'Biometric client must load before secure session restoration');
assert.doesNotMatch(prep,/ZOVRO_SECURE_SESSION\.get\(\)\.then\(t=>\{token=t\|\|'';boot/,'Mobile boot must never restore a raw saved token before biometric authorization');
assert.match(prep,/ZOVRO_SECURE_SESSION\.initialize\(\)\.then\(\(\)=>\{token=window\.ZOVRO_SESSION_TOKEN\|\|'';boot/,'Mobile boot must wait for biometric-gated initialization');
assert.match(native,/NSFaceIDUsageDescription/,'iOS Face ID usage description missing');
assert.match(native,/android\.permission\.USE_BIOMETRIC/,'Android biometric permission missing');

// Native Face ID must be opt-in only after sign-in and durable secure-session
// storage. Web/PWA password autofill is separate from native Face ID unlock.
assert.match(bio,/nativePlatform\(\)/,'Biometric UI must check native platform');
assert.match(bio,/nativePromise\('BiometricAuthNative','checkBiometry'/,'Native Capacitor biometric bridge registration missing');
assert.match(bio,/nativePromise\('BiometricAuthNative','internalAuthenticate'/,'Native Capacitor biometric challenge missing');
assert.match(bio,/currentUser\(\)\?\.id/,'Enable biometric must require an account');
assert.match(bio,/ZOVRO_SECURE_SESSION\.set\(session\)/,'Enable biometric must save the existing session');
assert.match(bio,/if\(saved!==session/,'Saved-session verification before opt-in missing');
assert.match(bio,/if\(e\?\.status===401\)/,'Unauthorized login must discard expired biometric token');
assert.match(bio,/Your saved Face ID sign-in is preserved/,'Transient login failures must preserve saved session');

console.log('Biometric security: plugin pin, native permissions, privacy disclosure, secure saved-session Face ID sign-in, device-credential fallback and biometric-gated mobile boot passed.');


const vm=require('node:vm');
async function testNativeRuntime(){
  const prefs=new Map(),prompts=[],messages=[],calls=[];
  let saved='',response={user:{id:'customer-1'}},approveBiometry=true;
  const document={readyState:'loading',documentElement:{},addEventListener(){},
    getElementById(){return null},querySelector(){return null}};
  const capacitor={
    isNativePlatform:()=>true,
    Plugins:{},
    nativePromise:async(name,method,options)=>{
      calls.push({name,method,options});
      if(name!=='BiometricAuthNative')throw Error('Unexpected native plugin');
      if(method==='checkBiometry')return {isAvailable:true};
      if(method==='internalAuthenticate'){
        prompts.push(options);
        if(!approveBiometry)throw Error('User canceled');
        return;
      }
      throw Error('Unexpected native method');
    }
  };
  const ctx=vm.createContext({
    console,document,
    localStorage:{getItem:k=>prefs.get(k)||null,setItem:(k,v)=>prefs.set(k,v),removeItem:k=>prefs.delete(k)},
    Capacitor:capacitor,
    MutationObserver:class{observe(){}},
    setTimeout(){},
    token:'',me:null,
    toast:m=>messages.push(m),
    api:async()=>{if(response instanceof Error)throw response;return response},
    renderAccount(){},loadJobs(){},closeModal(){},resumeRequestIntent(){}
  });
  ctx.window=ctx;
  ctx.ZOVRO_SECURE_SESSION={
    isNativeSecure:()=>true,
    set:async v=>{saved=v},
    get:async()=>saved,
    remove:async()=>{saved=''}
  };
  vm.runInContext(bio,ctx);
  const ui=ctx.ZOVRO_BIOMETRIC;
  assert.equal((await ui.check()).available,true,'Native iOS plugin must be detected through native bridge');
  assert.equal(await ui.enable(),false,'Guest must not enable Face ID');
  assert.equal(prefs.has('zovroBiometricUnlock'),false);
  ctx.me={id:'customer-1'};ctx.token='session-token';
  assert.equal(await ui.enable(),true,'Signed-in customer may opt in');
  assert.equal(prefs.get('zovroBiometricUnlock'),'1');
  assert.equal(saved,'session-token','Only session token saved, never password');
  assert.ok(prompts.every(x=>x.allowDeviceCredential===true),'Keep device passcode fallback');
  ctx.me=null;ctx.token='';
  approveBiometry=false;
  assert.equal(await ui.unlockSavedSession(),false,'Canceled Face ID must leave app locked');
  assert.equal(ctx.token,'');
  assert.equal(saved,'session-token');
  approveBiometry=true;
  response=Object.assign(Error('Temporary connection failure'),{status:503});
  assert.equal(await ui.unlockSavedSession(),false);
  assert.equal(saved,'session-token','Offline error must preserve saved session');
  assert.equal(ctx.token,'','Failed verification must not leave token active');
  response={user:{id:'customer-1'}};
  assert.equal(await ui.unlockSavedSession(),true,'Valid Face ID should restore saved account');
  assert.equal(ctx.me.id,'customer-1');
  assert.equal(ctx.token,'session-token');
  ctx.me=null;ctx.token='';
  response=Object.assign(Error('Invalid login'),{status:401});
  assert.equal(await ui.unlockSavedSession(),false);
  assert.equal(saved,'','Server rejection must clear expired token');
  assert.equal(prefs.has('zovroBiometricUnlock'),false,'Expired enrollment must be disabled');
  assert.ok(calls.some(x=>x.method==='internalAuthenticate'),'Native auth method was never called');
  ctx.Capacitor.isNativePlatform=()=>false;
  assert.equal((await ui.check()).available,false,'Web must not simulate Face ID');
  console.log('Face ID runtime: native bridge, authenticated opt-in, secure session, passcode fallback, cancel, offline retry, success, HTTP 401 and web denial passed.');
}
testNativeRuntime().catch(error=>{console.error(error);process.exitCode=1});
