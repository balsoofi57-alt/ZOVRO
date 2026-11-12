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
assert.equal(count(js,'id="zSmartGo"'),1,'Smart Match must be the one primary start button');
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
assert.ok(js.includes("account.setAttribute('aria-label','More and account')"),'Phone needs one visible More entry when bottom nav is hidden');
assert.ok(js.includes("button('My requests  ›',()=>showTab(1)"),'Requests must remain reachable from More on phones');
assert.ok(css.includes('@media (min-width:701px){.top .z-account-shortcut{display:none!important}}'),'Desktop must use only the web More navigation');
assert.ok(css.includes('body.z-silver-layout nav.bottom'),'Compact layout hides bottom tabs and needs an alternative');

assert.ok(js.includes("group('Become a service provider','zProviderMenu')"),'One provider enrollment section remains');
assert.ok(js.includes("id=\"zProviderJoinBtn\""),'Provider enrollment action remains');
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
