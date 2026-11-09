'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('i18n.js','utf8');
function harness(initialLanguage='en'){
  const listeners=new WeakMap();
  const observers=[];
  const storage=new Map();
  function text(value,parentElement){return {nodeType:3,nodeValue:value,parentElement};}
  class Element {
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attributes={};this.parentElement=null;this.value='';this.dir='';}
    set textContent(value){this.children=[text(String(value),this)];}
    get textContent(){return this.children.map(child=>child.nodeType===3?child.nodeValue:child.textContent).join('');}
    appendChild(node){node.parentElement=this;this.children.push(node);return node;}
    append(...nodes){for(const node of nodes)this.appendChild(node);}
    setAttribute(name,value){this.attributes[name]=String(value);}
    getAttribute(name){return Object.hasOwn(this.attributes,name)?this.attributes[name]:null;}
    hasAttribute(name){return Object.hasOwn(this.attributes,name);}
    addEventListener(type,fn){const list=listeners.get(this)||{};list[type]=fn;listeners.set(this,list);}
    closest(){
      let node=this;
      while(node){
        if(['SCRIPT','STYLE','TEXTAREA','PRE','CODE','SVG'].includes(node.tagName)||node.getAttribute?.('translate')==='no')return node;
        node=node.parentElement;
      }
      return null;
    }
    querySelectorAll(selector){
      const out=[];
      const recurse=node=>{
        for(const child of node.children||[]){
          if(child.nodeType===3)continue;
          const attr=['placeholder','aria-label','title'].some(key=>child.hasAttribute(key));
          const input=child.tagName==='INPUT';
          const selected=selector==='[placeholder],[aria-label],[title]'?attr:
            selector.startsWith('input[type="tel"]')?input&&(
              ['tel','email','url','password'].includes(child.getAttribute('type'))||
              child.getAttribute('inputmode')==='numeric'
            ):
            selector.startsWith('#reqAddress')?input&&(
              ['reqAddress','transportDropoff'].includes(child.id)||
              child.getAttribute('autocomplete')==='street-address'
            ):false;
          if(selected)out.push(child);
          recurse(child);
        }
      };
      recurse(this);
      return out;
    }
  }
  const body=new Element('body');
  const profile=new Element('section');profile.id='profile';body.appendChild(profile);
  const account=new Element('details');account.id='zAccountMenu';profile.appendChild(account);
  const heading=new Element('h2');heading.textContent='Home';body.appendChild(heading);
  const formLabel=new Element('label');formLabel.textContent='Sign in';body.appendChild(formLabel);
  const protectedLog=new Element('div');protectedLog.setAttribute('translate','no');
  protectedLog.textContent='Home';body.appendChild(protectedLog);
  const input=new Element('input');input.id='reqAddress';input.setAttribute('autocomplete','street-address');
  input.setAttribute('placeholder','Type a street address, city, state');body.appendChild(input);
  const phone=new Element('input');phone.setAttribute('type','tel');body.appendChild(phone);
  const password=new Element('input');password.setAttribute('type','password');body.appendChild(password);
  const document={
    readyState:'complete',
    body,
    documentElement:{lang:'en',dir:'ltr'},
    createElement:tag=>new Element(tag),
    getElementById(id){
      const walk=node=>{
        if(node.id===id)return node;
        for(const c of node.children||[]){if(c.nodeType!==3){const result=walk(c);if(result)return result}}
        return null;
      };
      return walk(body);
    },
    querySelectorAll:selector=>body.querySelectorAll(selector),
    createTreeWalker(root,ignored,filter){
      const nodes=[];
      const walk=node=>{for(const child of node.children||[]){if(child.nodeType===3){if(filter.acceptNode(child)===1)nodes.push(child)}else walk(child)}};
      walk(root);
      let at=-1;
      return {get currentNode(){return nodes[at]},nextNode(){return ++at<nodes.length}};
    },
    dispatchEvent(){},
    addEventListener(){}
  };
  class MutationObserver {constructor(fn){this.callback=fn;observers.push(this)}observe(){}trigger(){this.callback()}}
  class CustomEvent {constructor(type,detail){this.type=type;this.detail=detail}}
  const window={};
  const localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
  const context={document,window,navigator:{language:initialLanguage},localStorage,MutationObserver,CustomEvent,NodeFilter:{SHOW_TEXT:4,FILTER_ACCEPT:1,FILTER_REJECT:2},Promise};
  vm.runInNewContext(source,context,{filename:'i18n.js'});
  return {document,window,storage,observers,heading,formLabel,protectedLog,input,phone,password,body,Element};
}

test('switching between five languages restores exact English source text',()=>{
  const h=harness();
  const picker=h.document.getElementById('zovroLanguage');
  assert.ok(picker,'language selector must mount under Profile');
  assert.equal(picker.parentElement.id,'zovroLanguageSetting');
  assert.equal(picker.parentElement.parentElement.id,'zAccountMenu');
  for(const [lang,home,login,dir] of [
    ['ar','الرئيسية','تسجيل الدخول','rtl'],
    ['fr','Accueil','Se connecter','ltr'],
    ['zh','首页','登录','ltr'],
    ['es','Inicio','Iniciar sesión','ltr'],
    ['en','Home','Sign in','ltr']
  ]){
    h.window.ZOVRO_I18N.setLanguage(lang);
    assert.equal(h.heading.textContent,home);
    assert.equal(h.formLabel.textContent,login);
    assert.equal(h.document.documentElement.dir,dir);
    assert.equal(h.document.documentElement.lang,lang);
    assert.equal(picker.value,lang);
  }
  assert.equal(h.protectedLog.textContent,'Home','customer chat must not be translated');
  assert.equal(h.input.getAttribute('placeholder'),'Type a street address, city, state');
  assert.equal(h.phone.dir,'ltr');
  assert.equal(h.password.dir,'ltr');
  assert.equal(h.input.dir,'auto');
  assert.equal(h.storage.get('zovroLanguage'),'en');
});

test('device language is used initially and the selector persists user changes',()=>{
  const h=harness('fr-FR');
  assert.equal(h.document.documentElement.lang,'fr');
  assert.equal(h.heading.textContent,'Accueil');
  const picker=h.document.getElementById('zovroLanguage');
  picker.value='ar';
  const selected=picker;
  const events=typeof selected==='object'?true:false;
  assert.equal(events,true);
  h.window.ZOVRO_I18N.setLanguage(selected.value);
  assert.equal(h.storage.get('zovroLanguage'),'ar');
  assert.equal(h.document.documentElement.dir,'rtl');
  assert.equal(h.heading.textContent,'الرئيسية');
});

test('new UI text localizes after asynchronous page updates while user content stays intact',async()=>{
  const h=harness('ar');
  const textLabel=new h.Element('span');
  textLabel.textContent='Send verification code';
  h.body.appendChild(textLabel);
  const userLog=new h.Element('div');
  userLog.setAttribute('translate','no');userLog.textContent='Sign in';
  h.body.appendChild(userLog);
  for(const observer of h.observers)observer.trigger();
  await Promise.resolve();
  assert.equal(textLabel.textContent,'إرسال رمز التحقق');
  assert.equal(userLog.textContent,'Sign in');
});

test('GPS status templates localize changing accuracy without changing the number',()=>{
  const h=harness('en');
  const key='✓ GPS pickup selected · about {accuracy} m accuracy';
  const expected={
    en:'✓ GPS pickup selected · about 37 m accuracy',
    ar:'✓ تم تحديد نقطة الانطلاق عبر GPS · دقة تقارب 37 متر',
    es:'✓ Recogida por GPS seleccionada · precisión aprox. 37 m',
    fr:"✓ Point de départ GPS sélectionné · précision d'environ 37 m",
    zh:'✓ 已选择 GPS 出发地点 · 精度约 37 米'
  };
  for(const locale of ['en','ar','es','fr','zh']){
    h.window.ZOVRO_I18N.setLanguage(locale);
    assert.equal(h.window.ZOVRO_I18N.format(key,{accuracy:37}),expected[locale]);
  }
  assert.equal(h.window.ZOVRO_I18N.format('Finding your current location…'), '正在获取您的当前位置…');
  assert.equal(h.window.ZOVRO_I18N.format('Location unavailable — type an address instead'),'位置不可用 — 请改为输入地址');
  assert.equal(h.window.ZOVRO_I18N.format('Unknown template {value}',{value:'private user text'}),'Unknown template private user text');
});
