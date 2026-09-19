(function(){
  'use strict';
  const dollars=c=>Number.isFinite(Number(c))?'$'+(Number(c)/100).toFixed(2):'';
  const closed=j=>['Completed','Cancelled'].includes(j.status);
  function paymentLabel(j){
    const s=String(j.paymentState||'').replaceAll('_',' ');
    if(!s&&j.quotedAmountCents)return 'Quote '+dollars(j.quotedAmountCents);
    if(!s)return '';
    return `${dollars(j.quotedAmountCents)} · ${s}`;
  }
  window.quoteJob=async function(id){
    const j=(jobs||[]).find(x=>x.id===id);if(!j)return;
    const current=j.quotedAmountCents?(j.quotedAmountCents/100).toFixed(2):'';
    const entered=prompt('Service price in USD',current);if(entered===null)return;
    const amount=Math.round(Number(entered)*100);
    if(!Number.isFinite(amount)||amount<100||amount>5000000)return toast('Enter an amount from $1 to $50,000');
    try{await api('/requests/'+id+'/quote',{method:'POST',body:JSON.stringify({amountCents:amount})});toast('Quote sent');await loadJobs()}catch(e){toast(e.message)}
  };
  window.payJob=async function(id){
    if(!window.ZOVRO_PAYMENTS)return toast('Secure payment is unavailable on this device');
    try{await window.ZOVRO_PAYMENTS.payRequest(id);toast('Payment submitted securely');await loadJobs()}catch(e){toast(e.message||'Payment was not completed')}
  };
  window.releasePayment=async function(id){
    if(!confirm('Confirm the service is complete and release payment to the provider?'))return;
    try{await api('/requests/'+id+'/confirm-completion',{method:'POST',body:'{}'});toast('Payment released');await loadJobs()}catch(e){toast(e.message)}
  };
  window.jobHtml=function(j){
    const mine=me.role==='provider'&&j.providerId===me.id,open=me.role==='provider'&&!j.providerId&&!closed(j);
    const payState=paymentLabel(j);
    const canQuote=mine&&!closed(j);
    const canPay=me.role==='customer'&&j.customerId===me.id&&j.providerId&&j.quotedAmountCents&&!['paid_held','released','refund_pending','refunded'].includes(j.paymentState);
    const canRelease=me.role==='customer'&&j.customerId===me.id&&j.status==='Completed'&&j.paymentState==='paid_held';
    return `<div class="card job"><div class="row"><div class="grow"><b>${esc(j.service)}</b><div class="muted">${esc(j.details)}</div></div><span class="tag ${j.urgent?'urgent':''}">${esc(j.status)}</span></div><p class="muted">${esc(j.address||'Location shared in app')}</p>${payState?`<p><span class="tag">💳 ${esc(payState)}</span></p>`:''}<div class="bar">${open?`<button class="btn ok" onclick="acceptJob('${j.id}')">Accept</button>`:''}${mine?nextButton(j):''}${canQuote?`<button class="btn ghost" onclick="quoteJob('${j.id}')">${j.quotedAmountCents?'Update quote':'Send quote'}</button>`:''}${canPay?`<button class="btn primary" onclick="payJob('${j.id}')">Pay securely ${dollars(j.quotedAmountCents)}</button>`:''}${canRelease?`<button class="btn ok" onclick="releasePayment('${j.id}')">Release payment</button>`:''}${!closed(j)&&(me.role==='customer'||mine)?`<button class="btn ghost" onclick="cancelJob('${j.id}')">Cancel</button>`:''}${j.providerId?`<button class="btn ghost" onclick="openChat('${j.id}')">Chat</button>`:''}${me.role==='customer'&&j.status==='Completed'&&!j.rating?`<button class="btn primary" onclick="rateJob('${j.id}')">Rate</button>`:''}</div></div>`
  };
  if(typeof me!=='undefined'&&me)loadJobs().catch(()=>{});
})();
