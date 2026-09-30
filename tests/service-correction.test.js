'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {inferService,correctRequestService,matchesService}=require('../src/provider-services');
test('clear descriptions choose the specific catalog service',()=>{
 for(const text of ['Tree service','TREE SERVICES','I need tree trimming.','Tree removal please'])assert.equal(inferService(text),'Tree Service');
 assert.equal(inferService('dead battery'),'Jump Start');
 assert.equal(inferService('clogged toilet'),'Plumbing');
 assert.equal(inferService('cockroaches'),'Pest & Rodent Control');
 assert.equal(inferService('Emergency Roadside Assistance'),'Emergency Roadside Assistance');
});
test('ambiguous, negative and unrelated text do not override the selection',()=>{
 for(const text of ['Tree service and plumbing','Not tree service','no tree removal','street service','help please','tree service instead of towing'])assert.equal(inferService(text),null,text);
});
test('old clients get corrected before provider matching; explicit overrides and SOS stay intact',()=>{
 const request={service:'Roadside Assistance',details:'Tree service'};
 const service=correctRequestService(request);assert.equal(service,'Tree Service');
 assert.equal(matchesService({services:['Tree Service']},service),true);
 assert.equal(matchesService({services:['Towing']},service),false);
 assert.equal(correctRequestService({...request,serviceSelectionManual:true}),'Roadside Assistance');
 assert.equal(correctRequestService({...request,source:'sos'}),'Roadside Assistance');
});
