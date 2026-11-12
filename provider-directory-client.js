/* ZOVRO provider directory: customers browse all pros for a service, read ratings
   and reviews, and send a request directly to the pro they pick. Automatic
   nearby dispatch (the existing request flow) is unchanged. */
(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const e=s=>typeof esc==='function'?esc(s):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const say=m=>typeof toast==='function'?toast(m):alert(m);
  const stars=n=>{const v=Math.round(Number(n)||0);return '★'.repeat(v)+'☆'.repeat(5-v)};
  let current=null,rechooseFor=null;

  function mount(){
    const sec=$('nearby');if(!sec||$('dirCard'))return;
    const card=document.createElement('div');
    card.id='dirCard';card.className='card';card.style.marginTop='12px';
    card.innerHTML=`<h3 style="margin:0 0 4px">Browse all pros</h3><p class="muted" style="margin:0 0 10px">See every professional for a service, compare ratings and reviews, and send your request to the one you choose.</p>
      <div class="field"><label>Service</label><select id="dirService"></select></div>
      <div class="row" style="gap:8px"><input id="dirSearch" placeholder="Search by name" style="flex:1;min-width:0;border:1px solid var(--line);border-radius:13px;padding:12px">
      <select id="dirSort" style="flex:0 0 auto;max-width:42%;border:1px solid var(--line);border-radius:13px;padding:12px"><option value="rating">Top rated</option><option value="reviews">Most reviews</option><option value="jobs">Most jobs</option></select></div>
      <button class="btn primary" style="margin-top:10px" id="dirGo">Show pros</button><div id="dirList" style="margin-top:10px"></div>`;
    const head=sec.querySelector('.sectionHead');head?head.after(card):sec.prepend(card);
    try{$('dirService').innerHTML=window.ZOVRO_SERVICE_PICKER?.options?.()||$('nearbyService')?.innerHTML||''}catch{}
    $('dirGo').onclick=load;$('dirSort').onchange=load;
    $('dirSearch').onkeydown=ev=>{if(ev.key==='Enter')load()};

    const modal=document.createElement('div');
    modal.id='proModal';modal.className='modal';
    modal.innerHTML=`<div class="sheet"><div id="proBody"></div>
      <div id="proSend" class="card" style="margin-top:12px"><h3 style="margin:0 0 6px">Message this pro</h3>
      <p class="muted" style="margin:0 0 8px">Describe what you need. Only this pro receives it. If they accept, the job chat opens and you work together.</p>
      <div class="field"><label>What do you need?</label><textarea id="proDetails" rows="4" style="width:100%;border:1px solid var(--line);border-radius:13px;padding:12px" placeholder="Example: kitchen sink is leaking under the cabinet"></textarea></div>
      <div class="field"><label>Address (optional)</label><input id="proAddress" style="width:100%;border:1px solid var(--line);border-radius:13px;padding:12px" placeholder="Street, city"></div>
      <label style="display:flex;gap:8px;align-items:center;margin:6px 0"><input type="checkbox" id="proUrgent"> Urgent</label>
      <button class="btn primary" id="proSendBtn">Send request</button></div>
      <button class="btn ghost" style="margin-top:10px" onclick="closeModal('proModal')">Close</button></div>`;
    document.body.appendChild(modal);
    $('proSendBtn').onclick=send;
  }

  function proCard(p){
    const s=p.summary||{},photo=p.photoUrl?`<img src="${e(p.photoUrl)}" alt="" style="width:52px;height:52px;border-radius:50%;object-fit:cover">`:`<div style="width:52px;height:52px;border-radius:50%;background:var(--line);display:grid;place-items:center;font-weight:700">${e((p.name||'P').charAt(0).toUpperCase())}</div>`;
    const rating=s.rating!=null?`<span style="color:#d97706">${stars(s.rating)}</span> <b>${s.rating}</b> <span class="muted">(${s.ratingCount} ratings)</span>`:'<span class="muted">New pro · no ratings yet</span>';
    return `<div class="card job" style="cursor:pointer" data-pro="${e(p.id)}"><div class="row" style="gap:12px;align-items:center">${photo}<div class="grow"><b>${e(p.name)}</b>${p.verified?' <span class="tag">Verified</span>':''}<div>${rating}</div><div class="muted">${s.completedJobs||0} jobs completed · ${p.available?'Available':'Busy now'}</div></div><button class="btn ghost">View</button></div></div>`;
  }

  async function load(){
    const list=$('dirList');list.innerHTML='<div class="muted">Loading…</div>';
    try{
      const q=new URLSearchParams({service:$('dirService').value||'',q:$('dirSearch').value||'',sort:$('dirSort').value});
      const out=await api('/providers/directory?'+q);
      const rows=out.providers||[];
      list.innerHTML=rows.length?`<div class="muted" style="margin-bottom:6px">${out.total} pros found</div>`+rows.map(proCard).join(''):'<div class="card">No pros for this service yet. You can still send a normal request and nearby pros will be notified.</div>';
      list.querySelectorAll('[data-pro]').forEach(el=>el.onclick=()=>openPro(el.dataset.pro));
    }catch(err){list.innerHTML='';say(err.message||'Sign in to browse pros')}
  }

  async function openPro(id){
    try{
      const out=await api('/providers/'+encodeURIComponent(id)+'/profile');
      current={...out.provider,summary:out.summary,verified:out.verified??out.provider?.providerVerified,available:out.available};const s=current.summary||{};
      const bars=(s.breakdown||[]).map(b=>{const pct=s.ratingCount?Math.round(b.count/s.ratingCount*100):0;return `<div class="row" style="gap:8px;align-items:center;font-size:13px"><span style="width:28px">${b.stars}★</span><div style="flex:1;height:8px;background:var(--line);border-radius:4px"><div style="width:${pct}%;height:8px;background:#d97706;border-radius:4px"></div></div><span style="width:28px;text-align:right">${b.count}</span></div>`}).join('');
      const revs=(out.reviews||[]).map(r=>`<div class="card" style="margin-top:8px"><div class="row"><b class="grow">${e(r.reviewer)}</b><span style="color:#d97706">${stars(r.stars)}</span></div>${r.comment?`<p style="margin:6px 0">${e(r.comment)}</p>`:''}<div class="muted" style="font-size:12px">${e(r.service||'')} · ${r.createdAt?new Date(r.createdAt).toLocaleDateString():''}</div></div>`).join('')||'<p class="muted">No reviews yet.</p>';
      const services=(current.services||[]).join(' · ');
      $('proBody').innerHTML=`<h2 style="margin:0">${e(current.name)}</h2>${current.verified?'<span class="tag">Verified</span>':''}
        ${current.bio?`<p>${e(current.bio)}</p>`:''}${services?`<p class="muted">${e(services)}</p>`:''}
        <div class="card" style="margin-top:10px"><div style="font-size:28px;font-weight:700">${s.rating??'–'} <span style="font-size:16px;color:#d97706">${s.rating!=null?stars(s.rating):''}</span></div><div class="muted">${s.ratingCount||0} ratings · ${s.completedJobs||0} jobs completed</div>${bars}</div>
        <h3 style="margin:14px 0 0">Reviews</h3>${revs}`;
      $('proSendBtn').textContent=rechooseFor?'Send my request to this pro':'Send request';
      $('proDetails').closest('.field').style.display=rechooseFor?'none':'';
      $('proAddress').closest('.field').style.display=rechooseFor?'none':'';
      openModal('proModal');
    }catch(err){say(err.message)}
  }

  async function send(){
    if(!current)return;
    if(typeof me==='undefined'||!me)return say('Please sign in first');
    if(me.role!=='customer')return say('Only customer accounts can send requests');
    const btn=$('proSendBtn');btn.disabled=true;
    try{
      if(rechooseFor){
        await api('/requests/'+rechooseFor+'/choose-provider',{method:'POST',body:JSON.stringify({providerId:current.id})});
        rechooseFor=null;
      }else{
        const details=$('proDetails').value.trim();
        if(details.length<5){btn.disabled=false;return say('Please describe what you need')}
        const service=$('dirService').value||(current.services||[])[0]||'';
        await api('/requests',{method:'POST',headers:{'X-ZOVRO-Terms-Version':'2026-09-27','X-ZOVRO-Privacy-Version':'2026-09-22','X-ZOVRO-Request-Consent':'service-request-v1'},body:JSON.stringify({service,details,address:$('proAddress').value.trim(),time:'As soon as possible',urgent:$('proUrgent').checked,preferredProviderId:current.id,clientRequestId:(crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2)+'xxxxxxxx')})});
        $('proDetails').value='';
      }
      closeModal('proModal');
      say('Sent to '+current.name+'. You will be notified when they reply.');
      if(typeof loadJobs==='function')loadJobs();
    }catch(err){say(err.message)}finally{btn.disabled=false}
  }

  // Provider: decline a direct request. Customer: pick another pro or open to all.
  window.declineDirect=async id=>{const reason=prompt('Optional reason for the customer','');if(reason===null)return;try{await api('/requests/'+id+'/decline-direct',{method:'POST',body:JSON.stringify({reason})});say('Request declined');loadJobs()}catch(err){say(err.message)}};
  window.openToAll=async id=>{try{const out=await api('/requests/'+id+'/choose-provider',{method:'POST',body:JSON.stringify({open:true})});say(`Sent to nearby pros · ${out.notifiedProviders||0} notified`);loadJobs()}catch(err){say(err.message)}};
  window.chooseAnother=id=>{const j=(typeof jobs!=='undefined'?jobs:[]).find(x=>x.id===id);rechooseFor=id;if(typeof nav==='function')nav('nearby');try{if(j&&$('dirService'))$('dirService').value=j.service}catch{}load();say('Pick a pro from the list');};

  function extend(){
    if(typeof window.jobHtml!=='function'||window.jobHtml.__dir)return;
    const base=window.jobHtml;
    const wrapped=function(j){
      let html=base.apply(this,arguments);let extra='';
      if(me?.role==='provider'&&j.directRequest&&!j.providerId&&!['Completed','Cancelled'].includes(j.status)){
        extra=`<div class="muted" style="margin:8px 0"><b>Sent directly to you.</b> The customer picked you from the pro list.</div><button class="btn ghost" onclick="declineDirect('${e(j.id)}')">Decline</button>`;
      }else if(me?.role==='customer'&&j.customerId===me.id&&!j.providerId){
        if(j.status==='Waiting for provider reply')extra=`<div class="muted" style="margin:8px 0">Waiting for ${e(j.preferredProviderName||'your selected pro')} to reply.</div><button class="btn ghost" onclick="chooseAnother('${e(j.id)}')">Choose another pro</button> <button class="btn ghost" onclick="openToAll('${e(j.id)}')">Send to all nearby pros</button>`;
        if(j.status==='Provider declined')extra=`<div class="muted" style="margin:8px 0">The selected pro is not available.${j.lastDeclineReason?' Reason: '+e(j.lastDeclineReason):''}</div><button class="btn primary" onclick="chooseAnother('${e(j.id)}')">Choose another pro</button> <button class="btn ghost" onclick="openToAll('${e(j.id)}')">Send to all nearby pros</button>`;
      }
      if(extra)html=html.replace(/<\/div>\s*$/,extra+'</div>');
      return html;
    };
    wrapped.__dir=true;window.jobHtml=wrapped;
  }

  function init(){mount();extend()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
