'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const support=fs.readFileSync(path.join(root,'support-center.js'),'utf8');
const prep=fs.readFileSync(path.join(root,'scripts','prepare-mobile.js'),'utf8');
const publicSupport=fs.readFileSync(path.join(root,'support.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'backend','workflow-api.js'),'utf8');
const checks={
 email: support.includes('support@zovro.net')&&publicSupport.includes('support@zovro.net'),
 aiTriage: support.includes('aiReply')&&support.includes('humanReviewRequired'),
 complaint: support.includes("complaint:'Complaint'"),
 paymentDispute: support.includes("payment:'Payment / refund dispute'"),
 safety: support.includes("safety:'Safety report'")&&support.includes('call 911'),
 ticketLifecycle: support.includes('received')&&support.includes('Under Review')&&support.includes('Waiting for Customer')&&support.includes('Resolved'),
 ticketNumbers: support.includes("'ZV-'"),
 durableWorkflow: support.includes("type:'support_ticket'")&&workflow.includes("store.create"),
 authProtected: workflow.includes("Authentication required"),
 mobileBundle: prep.includes('support-center.js')&&prep.includes('supportCenter:true'),
 phoneDeferred: support.includes('Phone support will be added later')&&support.includes('phoneSupport:false'),
 mediaSafety: support.includes('Secure upload will be enabled before media evidence is accepted')
};
const failed=Object.entries(checks).filter(([,v])=>!v).map(([k])=>k);if(failed.length){console.error('Support center check failed:',failed.join(', '));process.exit(1)}
console.log('ZOVRO support center check: PASS',JSON.stringify(checks));
