'use strict';
// The deployed service runs one Node process. Serialize webhook read/modify/write
// sequences, including awaited transfers and durable commits. This is not a
// distributed lock; multi-instance operation requires a transactional store.
let queue=Promise.resolve();
function serializePaymentEvent(operation){
 const pending=queue.then(operation);
 queue=pending.catch(()=>{});
 return pending;
}
module.exports={serializePaymentEvent};
