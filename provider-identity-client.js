'use strict';
(function(){
 const statuses={not_started:'Government ID and live face check required before accepting jobs',requires_input:'ID check not completed',processing:'Identity verification is under review',reverification_required:'Live face capture is still required. Reverify to accept jobs',verified:'Government ID, live face, and age verified — ready for jobs',manual_review:'Government ID, face match or age could not be confirmed. Contact support.',canceled:'Verification canceled; start again'};
 const apiCall=(path,options)=>api(path,options);
 let lastUser='',loading=false;
 function stateFromUser(user){return user?.identityStatus||'not_started'}
 function render(info){
  const box=document.getElementById('zProviderIdentityCard');if(!box)return;
  const status=info?.status||'not_started';
  const verified=status==='verified'&&info?.verified===true;
  const notice=box.querySelector('[data-identity-status]');
  notice.textContent=statuses[status]||statuses.not_started;
  notice.style.color=verified?'#166534':'#92400e';
  const form=box.querySelector('[data-identity-form]');
  if(form)form.hidden=verified;
  const check=box.querySelector('[data-identity-check]');
  if(check)check.hidden=verified||status==='not_started';
  const start=box.querySelector('[data-identity-start]');
  if(start)start.disabled=!info?.configured||status==='processing';
  const config=box.querySelector('[data-identity-config]');
  if(config)config.textContent=info?.configured?'':'Secure identity checks are not yet available. You cannot accept jobs until verification is enabled.';
 }
 async function refreshStatus(check=false){
  if(loading)return;
  loading=true;
  const box=document.getElementById('zProviderIdentityCard');
  if(!box)return;
  try{
   const data=await apiCall(check?'/provider/identity/check':'/provider/identity',check?{method:'POST',body:'{}'}:{});
   render(data.identity);
  }catch(e){
   const msg=box.querySelector('[data-identity-config]');
   if(msg)msg.textContent=e.message||'Unable to check verification status';
  }finally{loading=false}
 }
 async function begin(){
  const box=document.getElementById('zProviderIdentityCard');
  if(!box)return;
  const name=box.querySelector('[data-identity-name]').value.trim();
  const consent=box.querySelector('[data-identity-consent]').checked;
  if(name.split(/\s+/).length<2)return toast('Enter first and last name as printed on your government ID.');
  if(!consent)return toast('Confirm the secure identity verification notice before continuing.');
  const btn=box.querySelector('[data-identity-start]');btn.disabled=true;btn.textContent='Opening secure face check…';
  try{
   const data=await apiCall('/provider/identity/start',{method:'POST',body:JSON.stringify({legalName:name,consent:true})});
   render(data.identity);
   if(data.verificationUrl&&/^https:\/\/verify\.stripe\.com\//.test(data.verificationUrl)){
    location.assign(data.verificationUrl);
   }else if(data.identity?.verified)toast('Government ID already verified');
   else toast('Verification is pending; check status in Profile.');
  }catch(e){toast(e.message||'Verification is unavailable')}finally{btn.disabled=false;btn.textContent='Verify ID & live face'}
 }
 function inject(){
  let user=null;try{user=me}catch(_){}
  const parent=document.getElementById('profileBox');
  if(!parent||user?.role!=='provider'){document.getElementById('zProviderIdentityCard')?.remove();lastUser='';return}
  if(parent.querySelector('#zProviderIdentityCard'))return;
  const box=document.createElement('section');box.id='zProviderIdentityCard';box.className='card';
  box.style.cssText='margin-top:14px;padding:16px;border:1px solid #bfd0df;border-radius:14px';
  box.innerHTML='<h3 style="margin:0 0 8px">Government ID & live face verification</h3>'+ 
   '<p data-registration-step hidden style="font-weight:800;color:#135e43;margin:8px 0">Step 2 of 2: complete your identity and live face check to activate your provider account.</p>'+ 
   '<p style="margin:4px 0 10px">All service providers and business owners (18+) must capture their real face using the camera and a valid government photo ID. The secure verifier compares the selfie with the document photo; uploading an old ID picture is not allowed.</p>'+ 
   '<p data-identity-status role="status" style="font-weight:700"></p>'+
   '<div data-identity-form><label style="display:block;margin-bottom:6px" for="zIdentityLegalName">Full legal name on your ID</label>'+
   '<input id="zIdentityLegalName" data-identity-name autocomplete="name" maxlength="120" placeholder="First and last name" style="width:100%;padding:12px;margin-bottom:12px">'+
   '<label style="display:flex;gap:8px;align-items:flex-start"><input type="checkbox" data-identity-consent style="width:18px;height:18px;flex-shrink:0;margin-top:3px"><span>I consent to Stripe Identity securely capturing my government ID and a live selfie, checking that my face matches my photo ID, and confirming I am at least 18. Stripe handles biometric images under its privacy practices; ZOVRO does not store the images.</span></label>'+ 
   '<div class="bar" style="margin-top:12px"><button class="btn primary" type="button" data-identity-start>Verify ID & live face</button></div></div>'+
   '<button class="btn ghost" type="button" data-identity-check style="margin-top:10px">Check verification status</button>'+
   '<p data-identity-config class="muted" style="margin-top:10px"></p>'+
   '<small class="muted">Your ID number, face images and birth date are never shown to customers. Camera access is needed during Stripe verification. Business licensing is a separate requirement.</small>';
  parent.appendChild(box);
  box.querySelector('[data-identity-start]').addEventListener('click',begin);
  box.querySelector('[data-identity-check]').addEventListener('click',()=>refreshStatus(true));
  render({status:stateFromUser(user),verified:!!user.identityVerified,configured:true});
  if(lastUser!==user.id){
   lastUser=user.id;
   const returned=new URLSearchParams(location.search).get('identity_verification')==='return';
   if(returned&&typeof nav==='function'){
    const profileTab=[...document.querySelectorAll('.bottom button')].find(button=>(button.getAttribute('onclick')||'').includes("'profile'"));
    nav('profile',profileTab||null);
    box.scrollIntoView({block:'start'});
   }
   refreshStatus(returned);
  }
 }
 function openRegistration(){
  let user=null;try{user=me}catch(_){}
  if(user?.role!=='provider')return false;
  const tab=document.querySelector('.bottom button[onclick*="profile"]');
  if(typeof nav==='function')nav('profile',tab);
  inject();
  const box=document.getElementById('zProviderIdentityCard');
  if(!box)return false;
  const step=box.querySelector('[data-registration-step]');if(step)step.hidden=false;
  const name=box.querySelector('[data-identity-name]');
  if(name&&!name.value)name.value=user.name||'';
  box.scrollIntoView({block:'start'});
  if(name)name.focus({preventScroll:true});
  return true;
 }
 window.ZOVRO_PROVIDER_IDENTITY={openRegistration};
 function boot(){
  const parent=document.getElementById('profileBox');
  if(parent){
   new MutationObserver(()=>{if(!parent.querySelector('#zProviderIdentityCard'))inject()}).observe(parent,{childList:true});
  }
  inject();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
