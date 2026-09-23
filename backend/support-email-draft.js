'use strict';
const policy=require('../support-policy');
// No mail credentials, outbound transport or customer-state mutation here.
// The mailbox adapter must authenticate inbound events, deduplicate message IDs,
// reject bulk/auto-generated mail and verify reply recipients before enabling sends.
function prepareSupportEmail({text,locale}={}){
 const result=policy.respond({text,locale});
 const heading=result.language==='ar'?'رد آلي من دعم ZOVRO':result.language==='es'?'Respuesta automática del soporte de ZOVRO':'Automated ZOVRO Support reply';
 const sources=result.sources.map(s=>'https://zovro.work/'+s.path+' — '+s.section);
 return {...result,sendEnabled:false,body:[heading,result.reply,...sources].join('\n\n')};
}
module.exports={prepareSupportEmail};
