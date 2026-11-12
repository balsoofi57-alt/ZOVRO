'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('website-final.js','utf8');
const css=fs.readFileSync('website-final.css','utf8');
const between=(a,b)=>html.split(a)[1]?.split(b)[0]||'';
const home=between('<section id="home">','<section id="jobs"');
const jobs=between('<section id="jobs"','<section id="nearby"');
const request=between('<div id="requestModal"','<div id="chatModal"');
const more=between('<section id="profile"','<nav class="bottom">');
const count=(s,x)=>s.split(x).length-1;

// One primary, non-service-specific start action in Smart Match. Service
// categories, voice dictation and manual/GPS pickup choices remain distinct.
assert.equal(count(js,'id="zSmartGo"'),1,'Retained hidden Smart Match wiring must not be duplicated');
assert.ok(js.includes("const startRequest=button('Help Now',()=>openHelp(''),'btn primary')"),'One compact generic request button must remain visible with the service categories');
assert.equal(count(js,"startRequest.id='zStartRequest'"),1,'Exactly one visible generic request shortcut is required');
assert.ok(css.includes('body.z-silver-layout #smartMatch>.z-smart-box'),'Preserve the user-approved removal of the full Smart Match composer');
assert.equal(count(js,"document.getElementById('zSmartGo').addEventListener('click'"),1,'Smart Match must have one event handler');
assert.equal(count(js,"document.getElementById('zSmartGo').onclick"),0,'Duplicate onclick handler would launch the request twice');
for(const dead of ['id="zHeroHelp"','id="zHeroProvider"','id="zMobileHelp"','id="nativeMobileHelp"','id="zLocationShortcut"']){
  assert.ok(!html.includes(dead)&&!js.includes(dead),'Duplicate shortcut must not be rendered: '+dead);
}
assert.ok(js.includes("id=\"zVoice\""),'Voice input must remain available');
assert.ok(js.includes("['Roadside Assistance','auto-roadside'"),'Service categories must remain');
assert.ok(js.includes("['More Services',null,'more']"),'One full-directory entry must remain');
assert.ok(!js.includes("button('See all  ›'"),'Second full-directory entry is redundant');
assert.ok(!js.includes("className='z-home-shortcuts'"),'Repeated nearby/request navigation cards must be removed');
assert.ok(!js.includes("id='zSupportStrip'"),'Duplicate Support shortcuts must not be inserted');
assert.equal(count(js,'data-support-chat aria-label="Open ZOVRO support chat"'),1,'Exactly one accessible support chat control in More');
assert.ok(js.includes('<button type="button" class="z-menu-row" data-support-chat'),'Support chat must be a real actionable button');
assert.ok(fs.readFileSync('support-chat.js','utf8').includes("event.target.closest('a[href="),'Existing delegated support chat click handler must remain');
assert.ok(!js.includes("Payment help  ›"),'Payment help must not mirror the Help Center URL');

// Requests is navigation, not another place to initiate the same service flow.
// Automatic request refresh still runs; provider controls stay separate.
assert.ok(!jobs.includes('onclick="newRequest()"'), 'Requests tab repeats the primary start action');
assert.ok(!jobs.includes('onclick="loadJobs()"'), 'Manual Refresh duplicates automatic request polling');
assert.ok(jobs.includes('id="availabilityBtn"')&&jobs.includes('id="locationBtn"'),'Provider availability and live location remain');
assert.ok(!request.includes('View my requests</button>'),'Request sheet must not add a second Requests shortcut');
assert.ok(js.includes("['all','All'],['active','Active'],['history','History']"),'Request filters remain');
assert.ok(!js.includes('>Show all requests</button>'),'The All filter must be the only Show All control');

// Critical flows cannot be merged merely because they share similar words.
assert.ok(request.includes('id="reqAddress"')&&request.includes('id="reqLocationRefresh"'),'Manual address and optional request GPS remain');
assert.ok(request.includes('id="transportDropoff"'),'Destination entry remains');
assert.ok(request.includes('id="zReqSend"'),'Final send action remains');
assert.ok(more.includes('id="sosButton"'),'Secondary urgent roadside flow remains');
assert.ok(js.includes("group('Find nearby providers','zNearbyMenu')"),'Nearby search remains in More');
assert.ok(js.includes("account.setAttribute('aria-label','More menu')"),'Legacy top entry stays available for safe notification-bell reuse');
assert.ok(js.includes("const account=button('',()=>showTab(3),'z-account-shortcut')"),'Existing header shortcut must be reused, not duplicated');
assert.ok(js.includes("button('My requests  ›',()=>showTab(1)"),'Requests must remain reachable from More on phones');
assert.ok(css.includes('@media (min-width:701px){.top .z-account-shortcut{display:none!important}}'),'Desktop must use only the web More navigation');
assert.ok(css.includes('body.z-silver-layout nav.bottom'),'Legacy navigation rule is preserved; home-ux.css intentionally overrides it for the new four-tab mobile navigation');
const homeCss=fs.readFileSync('home-ux.css','utf8');
const homeJs=fs.readFileSync('home-ux-client.js','utf8');
assert.ok(homeCss.includes('body.z-silver-layout nav.bottom.z-simple-nav.z-home-bottom-nav'),'Four mobile tabs override the previous hidden bottom navigation');
assert.ok(homeJs.includes("['messages','Messages','messages']"),'Messages must be a distinct navigation destination');
assert.ok(homeJs.includes("bell.onclick=()=>loadNotifications(true)"),'The existing top shortcut must become the notification bell');
assert.ok(homeJs.includes("const button=byId('zStartRequest')"),'Reuse the only Help Now button; do not add another');
assert.ok(homeJs.includes("call('startRequestWithLocation',params)"),'Home actions must reuse the existing request form');

assert.ok(js.includes("group('Become a service provider','zProviderMenu')"),'One provider enrollment section remains');
assert.ok(!js.includes('id="zProviderJoinBtn"'),'Provider enrollment must not repeat the Sign in action');
assert.ok(js.includes('open More → My Account → Create account'),'Provider instructions preserve onboarding access');
assert.ok(js.includes("homeAccount.hidden=true"),'Legacy account summary must be hidden after moving into My Account');
assert.ok(css.includes('#zAccountMenu #accountBox[hidden]{display:none!important}'),'Hide duplicate legacy account summary');
assert.ok(!js.includes('<button type="button" class="btn primary" onclick="openAuth()">Sign in</button>'),'Requests empty state must not repeat Account sign-in');
assert.ok(!js.includes('<a href="#profile">More</a><a href="support.html">Support</a>'),'Desktop header must not duplicate Support destination already in More and footer');
assert.ok(js.includes("id=\"z-smart-match\"")===false,'Do not accidentally rename the live Smart Match container');
assert.ok(html.includes('id="requestSuccessModal"')&&html.includes('View my request</button>'),'Post-submit request tracking remains');

// Full-page sheets supply their own accessible Close control. The inline
// Cancel/Close and manual Refresh buttons would be the same function again.
assert.ok(js.includes("close.className='z-page-close'"),'Full-page modal close must remain');
assert.ok(js.includes("if(modal.id==='trackingModal'&&typeof window.closeTracking==='function')"),'Tracking Close must stop the polling lifecycle');
assert.ok(html.includes('setInterval(refreshTracking,5000)'),'Live tracking still updates without manual Refresh');
for(const redundant of [
  '<button class="btn ghost" type="button" onclick="closeModal(\'authModal\')">Cancel</button>',
  '<button class="btn ghost" onclick="closeModal(\'requestModal\')">Cancel</button>',
  '<button class="btn ghost" style="margin-top:10px" onclick="closeModal(\'chatModal\')">Close</button>',
  '<button class="btn ghost" onclick="closeTracking()">Close</button>',
  '<button class="btn ghost" onclick="refreshTracking()">Refresh</button>',
  '<button class="btn ghost" style="width:100%;margin-top:10px" onclick="closeModal(\'requestSuccessModal\')">Done</button>'
]){
  assert.ok(!html.includes(redundant),'Duplicate modal control removed: '+redundant);
}

console.log('One action / one button: duplicate shortcuts removed, unique service and safety flows preserved.');
