'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const html=read('index.html'),client=read('home-ux-client.js'),css=read('home-ux.css'),mobile=read('scripts/prepare-mobile.js'),allow=read('backend/static-assets.js'),website=read('website-final.js');
new vm.Script(client,{filename:'home-ux-client.js'});
assert.match(html,/<link rel="stylesheet" href="home-ux\.css\?/);
assert.match(html,/<script src="home-ux-client\.js\?/);
assert.match(allow,/"home-ux-client\.js"/);
assert.match(allow,/"home-ux\.css"/);
assert.match(mobile,/'home-ux-client\.js','home-ux\.css'/);
assert.match(client,/const button=byId\('zStartRequest'\)/,'Reuse the existing Help Now action');
assert.doesNotMatch(client,/\/api\/requests[^']*',\{method:'POST'/,'No home code may submit service requests directly');
assert.match(client,/call\('startRequestWithLocation',params\)/,'Always open the original, confirmed request flow');
assert.match(client,/useLocation:customerLocation.mode==='gps'/,'GPS remains an explicit choice');
assert.match(client,/manual\.value='';status\.textContent=''/,'Switching to GPS clears a stale manual address from the visible field');
assert.match(client,/call\('requestAddressTypedManually'\)/,'Manual addresses remove any stale GPS pickup');
assert.match(client,/typeof resume==='function'/,'Manual address choice remains after login');
assert.match(client,/ZOVRO_CATALOG/,'Search should reuse the existing catalog');
assert.match(client,/catalog\.smartMatch/,'Problem descriptions should reuse smart matching');
assert.match(client,/const confident=top&&top\.score>=\.88/,'Strong, unambiguous suggestion only before selecting a service');
assert.match(client,/top\.score-second\.score>=\.10/,'Ambiguous matches must not silently preselect a trade');
assert.match(client,/recognition\.start\(\)/,'Voice input starts only on user interaction');
assert.match(client,/recognition\.onresult/,'Speech transcript becomes editable search, not auto-submitted order');
assert.match(client,/again\.onclick=\(\)=>draft\(\{service:last\.service\}\)/,'Rebook opens a new draft without reusing private history');
assert.match(client,/j\.status==='Completed'/,'Rebooking shows only completed services');
assert.match(client,/go\.onclick=requestNav/,'Active request provides direct navigation');
assert.match(client,/const stages=\{Pending:/,'Request summary describes actual known states');
assert.match(client,/View your request for details/,'Unknown statuses fall back safely without fake arrival time');
assert.match(css,/\.z-home-rebook-card\[hidden\]/,'Rebooking is not displayed before user-specific data exists');
assert.match(css,/\.z-home-voice/,'Voice button is styled only when supported');

assert.match(client,/setAttribute\('onclick',"nav\('"/,'New bottom tabs should reuse the existing navigation');
assert.match(client,/originalNav\(messages\?'jobs':id,b\)/,'Messages view derives from authenticated Requests');
assert.match(client,/call\('openChat',j.id\)/,'Messages must reuse per-job chat');
assert.match(client,/call\('api','\/notifications'\)/,'Bell must read real notifications');
assert.match(client,/if\(noticeList\)noticeList\.replaceChildren\(\)/,'Account switch clears cached private notification text');
assert.match(client,/notifAccount=null;notifLast=0/,'Account switch resets notification polling cache');
assert.match(client,/call\('api','\/notifications\/read',\{method:'POST'/,'Mark read should use existing API');
assert.match(css,/nav\.bottom\.z-simple-nav\.z-home-bottom-nav/,'Mobile bottom tabs override old hidden CSS');
assert.match(css,/grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/,'Exactly four bottom destinations');
assert.match(css,/#zHomeTools #zStartRequest/,'Urgent button is visible and high contrast');
assert.match(website,/if\(permission\.state!=='granted'\)\{stopWatch\(\);return\}/,'Opening home cannot newly prompt for GPS; automatic city watch requires prior permission');
assert.match(website,/if\(document\.visibilityState==='hidden'\)\{stopWatch\(\);return\}/,'City tracking pauses while the app is not visible');


assert.match(client,/function problemGuide\(query\)/,'Search includes explainable local safety guidance');
assert.match(client,/if\(guide.warning\)\{suggest\(\);return\}/,'Dangerous input cannot auto-open a normal request');
assert.match(client,/ZOVRO_REQUEST_GUIDE=problemGuide/,'Safety guide is available to synthetic regressions');
assert.match(client,/if\(e.key==='ArrowDown'/,'Keyboard can move into search suggestions');
assert.match(css,/\.z-home-guide-alert/,'Safety warning is clearly styled');
const guideWindow={ZOVRO_CATALOG:{smartMatch:()=>[
  {service:{id:'tire',label:{en:'Tire Change'}},score:.98},
  {service:{id:'other',label:{en:'General Repairs'}},score:.72}
]}};
vm.runInNewContext(client,{window:guideWindow,document:{readyState:'loading',addEventListener(){}}});
const guide=guideWindow.ZOVRO_REQUEST_GUIDE;
assert.equal(typeof guide,'function','Local guide should be testable');
assert.match(guide('smell gas in my kitchen').warning,/911/,'Gas hazards must point toward emergency services');
assert.match(guide('water flooding near an electrical outlet').warning,/911/,'Flooding near electricity requires safety warning');
assert.equal(guide('flat tire on my car').warning,'','Ordinary roadside query is not an emergency');
assert.equal(guide('flat tire on my car').autoService,'Tire Change','Only strong unique match can be suggested');
assert.equal(guide('smell gas in my kitchen').autoService,null,'Emergency warnings suppress automatic service choice');
assert.match(guide('There is a fire in my kitchen').warning,/911/,'Fire inside a home requires urgent guidance');
assert.match(guide('gas smell in basement').warning,/911/,'Gas-smell phrasing requires urgent guidance');
assert.match(guide('smoke in my room').warning,/911/,'Smoke inside a room requires urgent guidance');
assert.match(guide('my house is on fire').warning,/911/,'House fire phrasing requires urgent guidance');
assert.equal(guide('install a fire alarm').warning,'','Routine fire alarm installation should not be treated as an active fire');

let callback;
vm.runInNewContext(client,{document:{readyState:'loading',addEventListener:(event,fn)=>{if(event==='DOMContentLoaded')callback=fn}}});
assert.equal(typeof callback,'function','Home integration boot should defer until the DOM is ready');
console.log('Home UX integration: unique Help Now, Smart Match, opt-in location, chat, notifications, mobile tabs and native asset parity PASS');
