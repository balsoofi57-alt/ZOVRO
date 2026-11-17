'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const client=read('smart-auth-client.js'),html=read('index.html'),assets=read('backend/static-assets.js'),mobile=read('scripts/prepare-mobile.js');
new vm.Script(client,{filename:'smart-auth-client.js'});
assert.match(html,/<script src="smart-auth-client\.js\?v=/);
assert.match(html,/localStorage\.getItem\('zovroBiometricUnlock'\)==='1'\?'':/,'Page boot must not restore saved token before biometric verification');
assert.match(assets,/"smart-auth-client\.js"/);
assert.match(mobile,/'smart-auth-client\.js'/);
assert.match(client,/form\.hidden=false/,'Existing password login must remain available');
assert.match(client,/\['Apple','Google'\]/,'Only recognized provider names may register');
assert.doesNotMatch(client,/\/auth\/login|\/auth\/register|localStorage\.removeItem|deleteAccount/,'Enhancement must not mutate legacy authentication or accounts');
console.log('Smart sign-in progressive enhancement: syntax, web delivery, mobile bundle, legacy fallback PASS');

assert.match(client,/typeof authMode==='undefined'/,'Sign-in mode must use state rather than translated heading');
assert.match(client,/biometric\?\.native===true/,'Only native biometric integration can offer quick unlock');
assert.match(client,/isNativeSecure\?\.\(\)===true/,'Quick unlock requires native secure storage');
assert.match(client,/!\$\('zovroFaceIdLogin'\)/,'Avoid duplicate Face ID actions');

function element(tag){
 return {
  tag,children:[],dataset:{},hidden:false,attributes:{},style:{},
  appendChild(child){this.children.push(child)},
  insertBefore(child,before){const index=this.children.indexOf(before);this.children.splice(index<0?this.children.length:index,0,child)},
  insertAdjacentElement(_position,child){this.inserted=child},
  setAttribute(name,value){this.attributes[name]=value},
  focus(){this.focused=true},
  querySelector(selector){
   const match=selector.match(/^\[data-provider="([^"]+)"\]$/);
   return match?this.children.find(child=>child.dataset.provider===match[1])||null:null;
  }
 };
}
const modal=element('div'),form=element('form'),tabs=element('div');
const title=element('h2'),password=element('input'),phone=element('input'),status=element('p');
modal.querySelector=selector=>selector==='.tabs'?tabs:null;
const elements={authModal:modal,signInForm:form,authTitle:title,password,phone,authStatus:status};
let domReady,refresh;
const plugins={enabled:true,native:false};
const context={
 authMode:'login',
 window:{ZOVRO_BIOMETRIC:{status:()=>plugins},ZOVRO_SECURE_SESSION:{isNativeSecure:()=>true}},
 document:{
  readyState:'loading',getElementById:id=>elements[id]||null,
  createElement:element,addEventListener:(event,handler)=>{if(event==='DOMContentLoaded')domReady=handler}
 },
 MutationObserver:class {constructor(handler){refresh=handler}observe(){}}
};
vm.runInNewContext(client,context);
assert.equal(typeof domReady,'function','The quick sign-in panel must initialize on DOM ready');
domReady();
const panel=tabs.inserted;
assert.equal(panel.id,'zSmartAuth');
assert.equal(panel.hidden,false,'Password login should show the panel');
assert.equal(form.hidden,false,'Legacy sign-in form must stay visible');
const face=panel.children[0];
assert.equal(face.hidden,true,'Face ID hidden without native plugin');
plugins.native=true;refresh();
assert.equal(face.hidden,false,'Opted-in native biometrics may appear with secure storage');
context.authMode='register';refresh();
assert.equal(panel.hidden,true,'Quick sign-in must not overlap account registration');
assert.equal(form.hidden,false,'Legacy registration form must stay visible');
context.authMode='login';elements.zovroFaceIdLogin=element('button');refresh();
assert.equal(face.hidden,true,'Do not create two Face ID login buttons');
delete elements.zovroFaceIdLogin;
assert.equal(context.window.ZOVRO_SMART_AUTH.registerProvider('Unknown',()=>{}),false);
assert.equal(context.window.ZOVRO_SMART_AUTH.registerProvider('Apple',()=>{}),true);
assert.equal(context.window.ZOVRO_SMART_AUTH.registerProvider('Apple',()=>{}),false,'Duplicate provider buttons must be rejected');
assert.equal(context.window.ZOVRO_SMART_AUTH.registerProvider('Google',()=>{}),true);
panel.children.find(child=>child.textContent==='Use phone and password').onclick();
assert.equal(phone.focused,true,'Legacy phone and password must remain one tap away');
console.log('Smart sign-in simulated DOM: login/register state, native biometric gate, provider uniqueness, password fallback PASS');
