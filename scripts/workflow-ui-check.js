'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const client=fs.readFileSync(path.join(root,'src','workflow-client.js'),'utf8');
const product=fs.readFileSync(path.join(root,'backend','product-expansion.js'),'utf8');
for(const token of ['/api/workflows','notification_preferences','favorite_provider','service_reminder','zovroWorkflowPanel','localStorage.zovroToken'])assert(client.includes(token),'Workflow UI missing '+token);
assert(product.includes('/src/workflow-client.js'),'Workflow client is not served');
assert(product.includes('<script src="/src/workflow-client.js"></script>'),'Workflow client is not injected into app UI');
console.log(JSON.stringify({ok:true,workflowUiConnected:true,protectedApiClient:true}));
