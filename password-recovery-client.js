'use strict';
(function(){
  function init(){
    const login=document.getElementById('authModal');
    if(!login||document.getElementById('forgotPasswordButton'))return;
    const trigger=document.createElement('button');
    trigger.id='forgotPasswordButton';trigger.type='button';trigger.className='btn ghost';
    trigger.textContent='Forgot password? / نسيت كلمة السر؟';
    trigger.style.marginTop='14px';login.querySelector('.sheet').appendChild(trigger);
    const modal=document.createElement('div');modal.className='modal';modal.id='passwordRecoveryModal';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','recoveryTitle');
    modal.innerHTML='<div class="sheet"><h2 id="recoveryTitle">Reset your password</h2><p>Use the phone number previously verified on your account.</p><form id="recoveryForm"><div class="field"><label for="recoveryPhone">Registered phone number</label><input id="recoveryPhone" type="tel" autocomplete="tel" placeholder="+13135551234" required></div><div id="recoveryCodeFields" hidden><div class="field"><label for="recoveryCode">Verification code</label><input id="recoveryCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></div><div class="field"><label for="recoveryPassword">New password</label><input id="recoveryPassword" type="password" autocomplete="new-password" minlength="10" maxlength="128"></div><div class="field"><label for="recoveryConfirm">Confirm new password</label><input id="recoveryConfirm" type="password" autocomplete="new-password" minlength="10" maxlength="128"></div><p>Use 10–128 characters, including letters and numbers.</p></div><p id="recoveryStatus" role="status" aria-live="polite"></p><div class="bar"><button id="recoverySubmit" class="btn primary" type="submit" disabled>Send verification code</button><button id="recoveryBack" class="btn ghost" type="button">Back to sign in</button></div></form><p><a href="mailto:support@zovro.work">Contact support</a> if you cannot access your verified phone number.</p></div>';
    document.body.appendChild(modal);
    const el=id=>document.getElementById(id);let challenge=null,sequence=0,busy=false;
    async function request(path,data){
      const base=(window.ZOVRO_CONFIG?.apiBase||'https://zovro-api-final.onrender.com').replace(/\/$/,'');
      const r=await fetch(base+'/api/auth/'+path,{method:data?'POST':'GET',headers:{'content-type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(20000),cache:'no-store'});
      const out=await r.json().catch(()=>({}));
      if(!r.ok)throw new Error(r.status===404||r.status===503?'Recovery is not available yet. Please contact support.':out.error||'Unable to complete the request. Try again.');
      return out;
    }
    function close(){sequence++;challenge=null;busy=false;el('recoveryForm').reset();modal.classList.remove('open');login.classList.add('open');trigger.focus();}
    el('recoveryBack').onclick=close;
    modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
    trigger.onclick=async()=>{
      const current=++sequence;challenge=null;busy=false;el('recoveryForm').reset();
      el('recoveryPhone').readOnly=false;el('recoveryCodeFields').hidden=true;
      for(const id of ['recoveryCode','recoveryPassword','recoveryConfirm'])el(id).required=false;
      el('recoverySubmit').textContent='Send verification code';el('recoverySubmit').disabled=true;
      el('recoveryStatus').textContent='Checking recovery availability…';
      login.classList.remove('open');modal.classList.add('open');el('recoveryPhone').focus();
      try{const result=await request('recovery/status');if(current!==sequence)return;
        el('recoverySubmit').disabled=!result.available;
        el('recoveryStatus').textContent=result.available?'Request a code to verify ownership of your phone.':'Recovery is not available yet. Please contact support.';
      }catch(error){if(current===sequence)el('recoveryStatus').textContent=error.name==='TimeoutError'?'The server took too long. Close and try again.':error.message;}
    };
    el('recoveryForm').onsubmit=async event=>{
      event.preventDefault();if(busy)return;
      if(challenge&&el('recoveryPassword').value!==el('recoveryConfirm').value){el('recoveryStatus').textContent='Passwords do not match.';return;}
      if(challenge&&!(/[A-Za-z]/.test(el('recoveryPassword').value)&&/[0-9]/.test(el('recoveryPassword').value))){el('recoveryStatus').textContent='Include letters and numbers in your password.';return;}
      const current=sequence;busy=true;el('recoverySubmit').disabled=true;el('recoveryStatus').textContent='Please wait…';
      try{
        if(!challenge){const out=await request('forgot-password',{phone:el('recoveryPhone').value.trim()});if(current!==sequence)return;
          challenge=out.challenge;el('recoveryCodeFields').hidden=false;el('recoveryPhone').readOnly=true;
          for(const id of ['recoveryCode','recoveryPassword','recoveryConfirm'])el(id).required=true;
          el('recoverySubmit').textContent='Reset password';el('recoveryStatus').textContent=out.message;el('recoveryCode').focus();
        }else{
          await request('reset-password',{challenge,code:el('recoveryCode').value.trim(),newPassword:el('recoveryPassword').value});if(current!==sequence)return;
          el('recoveryForm').reset();challenge=null;el('recoveryCodeFields').hidden=true;
          el('recoveryStatus').textContent='Password updated. Return to sign in with your new password.';
          el('recoverySubmit').hidden=true;
        }
      }catch(error){if(current===sequence)el('recoveryStatus').textContent=error.name==='TimeoutError'?'The request timed out. If resetting your password, try signing in before requesting another code.':error.message;}
      finally{if(current===sequence){busy=false;if(!el('recoverySubmit').hidden)el('recoverySubmit').disabled=false;}}
    };
    trigger.addEventListener('click',()=>{el('recoverySubmit').hidden=false;});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
