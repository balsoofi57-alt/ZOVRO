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
  // Payment helpers intentionally do not override the shared website job-card renderer.
  // The common renderer owns Chat, tracking, security code, repeat request and mutual ratings
  // so the prepared iOS/Android bundle stays visually and behaviorally aligned with the website.
  if(typeof me!=='undefined'&&me)loadJobs().catch(()=>{});
})();
