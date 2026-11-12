'use strict';
(function(){
  function init(){
    const login=document.getElementById('authModal');
    if(!login||document.getElementById('forgotPasswordButton'))return;
    const trigger=document.createElement('button');
    trigger.id='forgotPasswordButton';trigger.type='button';trigger.className='z-forgot-password-link';trigger.setAttribute('aria-controls','passwordRecoveryModal');
    trigger.textContent='Forgot password?';
    login.querySelector('#signInForm .password-control').closest('.field').after(trigger);
    const modal=document.createElement('div');modal.className='modal';modal.id='passwordRecoveryModal';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','recoveryTitle');
    modal.innerHTML='<div class="sheet"><h2 id="recoveryTitle">Reset your password</h2><p class="muted">Enter your phone, receive a verification code, then choose a new password.</p><form id="recoveryForm"><div class="field"><label for="recoveryPhone">Step 1 — Phone number</label><input id="recoveryPhone" type="tel" inputmode="tel" autocomplete="tel" value="+1" placeholder="+1 (313) 555-1234" required></div><div id="recoveryCodeFields" hidden><div class="field"><label for="recoveryCode">Step 2 — Verification code</label><input id="recoveryCode" inputmode="numeric" autocomplete="one-time-code" maxlength="10"></div><div class="field"><label for="recoveryPassword">New password</label><input id="recoveryPassword" type="password" autocomplete="new-password" minlength="8" maxlength="128"></div><div class="field"><label for="recoveryConfirm">Confirm new password</label><input id="recoveryConfirm" type="password" autocomplete="new-password" minlength="8" maxlength="128"></div><p class="muted">Use at least 8 characters, including letters and numbers.</p></div><p id="recoveryStatus" role="status" aria-live="polite"></p><div class="bar"><button id="recoverySubmit" class="btn primary" type="submit" disabled>Send code</button><button id="recoveryRetry" class="btn ghost" type="button" hidden>Check connection</button><button id="recoveryBack" class="btn ghost" type="button">Back to sign in</button></div></form><p class="muted">Cannot receive a code? <button type="button" class="btn ghost" data-support-chat>Contact support</button>.</p></div>';
    document.body.appendChild(modal);window.ZOVRO_PHONE_INPUT?.bind(document.getElementById('recoveryPhone'));
    const el=id=>document.getElementById(id);let challenge=null,sequence=0,busy=false,available=false;
    async function request(path,data){
      const base=(window.ZOVRO_CONFIG?.apiBase||'https://zovro-api-final.onrender.com').replace(/\/$/,'');
      const r=await fetch(base+'/api/auth/'+path,{method:data?'POST':'GET',headers:{'content-type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(20000),cache:'no-store'});
      const out=await r.json().catch(()=>({}));
      if(!r.ok){if(r.status===404||r.status===503)available=false;throw new Error(r.status===404||r.status===503?'Password reset is temporarily unavailable. You can chat with support here or check again later.':out.error||'Unable to complete the request. Try again.');}
      return out;
    }
    function close(){sequence++;challenge=null;busy=false;el('recoveryForm').reset();modal.classList.remove('open');login.classList.add('open');el('recoveryBack').textContent='Back to sign in';trigger.focus();}
    el('recoveryBack').onclick=close;
    modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
    async function checkAvailability(){
      const previous=el('recoveryPhone').value.trim(),registered=el('phone')?.value.trim();
      const phone=previous&&previous!=='+1'?previous:(registered&&registered!=='+1'?registered:'+1');
      const current=++sequence;challenge=null;busy=false;available=false;el('recoveryForm').reset();el('recoveryPhone').value=phone;el('recoverySubmit').hidden=false;
      el('recoveryPhone').readOnly=false;el('recoveryCodeFields').hidden=true;el('recoveryRetry').hidden=true;el('recoveryBack').textContent='Back to sign in';
      for(const id of ['recoveryCode','recoveryPassword','recoveryConfirm'])el(id).required=false;
      el('recoverySubmit').textContent='Send code';el('recoverySubmit').disabled=true;
      el('recoveryStatus').textContent='Checking recovery availability…';
      login.classList.remove('open');modal.classList.add('open');el('recoveryPhone').focus();
      try{const result=await request('recovery/status');if(current!==sequence)return;
        available=result.available===true;el('recoverySubmit').disabled=!available;el('recoveryRetry').hidden=available;
        el('recoveryStatus').textContent=available?'Request a verification code for your account.':'Password reset is temporarily unavailable. You can chat with support here or check again later.';
      }catch(error){if(current===sequence){el('recoveryRetry').hidden=false;el('recoveryStatus').textContent=error.name==='TimeoutError'?'The server took too long. Check again or contact support.':error.message;}}
    };
    trigger.onclick=checkAvailability;
    el('recoveryRetry').onclick=()=>{if(!busy)checkAvailability();};
    el('recoveryForm').onsubmit=async event=>{
      event.preventDefault();if(busy||!available)return;
      if(challenge&&el('recoveryPassword').value!==el('recoveryConfirm').value){el('recoveryStatus').textContent='Passwords do not match.';return;}
      if(challenge&&!(/[A-Za-z]/.test(el('recoveryPassword').value)&&/[0-9]/.test(el('recoveryPassword').value))){el('recoveryStatus').textContent='Include letters and numbers in your password.';return;}
      const current=sequence;busy=true;el('recoverySubmit').disabled=true;el('recoveryStatus').textContent='Please wait…';
      try{
        if(!challenge){const phone=window.ZOVRO_PHONE_INPUT?.normalize(el('recoveryPhone').value);
          if(!phone||!/^\+[1-9][0-9]{7,14}$/.test(phone))throw new Error('Enter a 10-digit US number after +1, or a complete international number.');
          const out=await request('forgot-password',{phone});if(current!==sequence)return;
          challenge=out.challenge;el('recoveryCodeFields').hidden=false;el('recoveryPhone').readOnly=true;
          for(const id of ['recoveryCode','recoveryPassword','recoveryConfirm'])el(id).required=true;
          el('recoverySubmit').textContent='Save new password';el('recoveryStatus').textContent=out.message||'Enter the code you received and set your new password.';el('recoveryCode').focus();
        }else{
          await request('reset-password',{challenge,code:el('recoveryCode').value.trim(),newPassword:el('recoveryPassword').value});if(current!==sequence)return;
          el('phone').value=el('recoveryPhone').value;challenge=null;el('recoveryCodeFields').hidden=true;
          el('recoveryStatus').textContent='Password updated. Sign in with your new password.';
          el('recoverySubmit').hidden=true;el('recoveryBack').textContent='Sign in now';el('recoveryBack').focus();
        }
      }catch(error){if(current===sequence)el('recoveryStatus').textContent=error.name==='TimeoutError'?'The request timed out. If resetting your password, try signing in before requesting another code.':error.message;}
      finally{if(current===sequence){busy=false;if(!el('recoverySubmit').hidden)el('recoverySubmit').disabled=!available;}}
    };
    trigger.addEventListener('click',()=>{el('recoverySubmit').hidden=false;});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
