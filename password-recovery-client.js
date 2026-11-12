'use strict';
(function(){
  function init(){
    const login=document.getElementById('authModal');
    if(!login||document.getElementById('forgotPasswordButton'))return;
    const trigger=document.createElement('button');
    trigger.id='forgotPasswordButton';trigger.type='button';trigger.className='btn ghost';
    trigger.textContent='Forgot password or login?';
    trigger.style.marginTop='14px';login.querySelector('.sheet').appendChild(trigger);
    const modal=document.createElement('div');modal.className='modal';modal.id='passwordRecoveryModal';
    modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','recoveryTitle');
    modal.innerHTML="<div class=\"sheet\">\n<h2 id=\"recoveryTitle\">Recover your ZOVRO account</h2>\n<p>Use your registered phone number or email address. Your phone number is your original login; you can also sign in with a registered email. Verification codes go only to your account's registered phone.</p>\n<form id=\"recoveryForm\" autocomplete=\"on\">\n<div class=\"field\"><label for=\"recoveryPhone\">Registered phone or email</label><input id=\"recoveryPhone\" name=\"username\" type=\"text\" autocomplete=\"username\" autocapitalize=\"none\" spellcheck=\"false\" placeholder=\"+13135551234 or email@example.com\" required></div>\n<div id=\"recoveryCodeFields\" hidden>\n<div class=\"field\"><label for=\"recoveryCode\">6-digit verification code</label><input id=\"recoveryCode\" type=\"text\" inputmode=\"numeric\" autocomplete=\"one-time-code\" pattern=\"[0-9]{6}\" maxlength=\"6\"></div>\n<div class=\"field\"><label for=\"recoveryPassword\">New password</label><input id=\"recoveryPassword\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" maxlength=\"128\"></div>\n<div class=\"field\"><label for=\"recoveryConfirm\">Confirm new password</label><input id=\"recoveryConfirm\" type=\"password\" autocomplete=\"new-password\" minlength=\"8\" maxlength=\"128\"></div>\n<p>Use 8–128 characters, including letters and numbers.</p>\n</div>\n<p id=\"recoveryStatus\" role=\"status\" aria-live=\"polite\"></p>\n<div class=\"bar\"><button id=\"recoverySubmit\" class=\"btn primary\" type=\"submit\" disabled>Send code to my phone</button><button id=\"recoveryRetry\" class=\"btn ghost\" type=\"button\">Start again</button><button id=\"recoveryBack\" class=\"btn ghost\" type=\"button\">Back to sign in</button></div>\n</form>\n<p class=\"muted\">Lost access to the registered phone? <button type=\"button\" class=\"btn ghost\" data-support-chat>Contact support</button> for secure account verification. Support will never ask for your password or one-time code.</p>\n</div>";
    document.body.appendChild(modal);
    const el=id=>document.getElementById(id);let challenge=null,sequence=0,busy=false,available=false;
    async function request(path,data){
      const base=(window.ZOVRO_CONFIG?.apiBase||'https://zovro-api-final.onrender.com').replace(/\/$/,'');
      const r=await fetch(base+'/api/auth/'+path,{method:data?'POST':'GET',headers:{'content-type':'application/json'},...(data?{body:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(20000),cache:'no-store'});
      const out=await r.json().catch(()=>({}));
      if(!r.ok){if(r.status===404||r.status===503)available=false;throw new Error(r.status===404||r.status===503?'Password reset is temporarily unavailable. You can chat with support here or check again later.':out.error||'Unable to complete the request. Try again.');}
      return out;
    }
    function close(){sequence++;challenge=null;busy=false;el('recoveryForm').reset();modal.classList.remove('open');login.classList.add('open');trigger.focus();}
    el('recoveryBack').onclick=close;
    modal.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
    async function checkAvailability(){
      const phone=el('recoveryPhone').value||document.getElementById('phone')?.value||'';
      const current=++sequence;challenge=null;busy=false;available=false;el('recoveryForm').reset();el('recoveryPhone').value=phone;el('recoverySubmit').hidden=false;
      el('recoveryPhone').readOnly=false;el('recoveryCodeFields').hidden=true;
      for(const id of ['recoveryCode','recoveryPassword','recoveryConfirm'])el(id).required=false;
      el('recoverySubmit').textContent='Send code to my phone';el('recoverySubmit').disabled=true;
      el('recoveryStatus').textContent='Checking recovery availability…';
      login.classList.remove('open');modal.classList.add('open');el('recoveryPhone').focus();
      try{const result=await request('recovery/status');if(current!==sequence)return;
        available=result.available===true;el('recoverySubmit').disabled=!available;
        el('recoveryStatus').textContent=available?'We'll send a code to the registered phone if your account is found.':'Password reset is temporarily unavailable. You can chat with support here or check again later.';
      }catch(error){if(current===sequence)el('recoveryStatus').textContent=error.name==='TimeoutError'?'The server took too long. Close and try again.':error.message;}
    };
    trigger.onclick=checkAvailability;
    el('recoveryRetry').onclick=()=>{if(!busy)checkAvailability();};
    el('recoveryForm').onsubmit=async event=>{
      event.preventDefault();if(busy||!available)return;
      if(challenge&&el('recoveryPassword').value!==el('recoveryConfirm').value){el('recoveryStatus').textContent='Passwords do not match.';return;}
      if(challenge&&!(/[A-Za-z]/.test(el('recoveryPassword').value)&&/[0-9]/.test(el('recoveryPassword').value))){el('recoveryStatus').textContent='Include letters and numbers in your password.';return;}
      const current=sequence;busy=true;el('recoverySubmit').disabled=true;el('recoveryStatus').textContent='Please wait…';
      try{
        if(!challenge){
          let identifier=el('recoveryPhone').value.trim();
          if(!identifier.includes('@')){
            identifier=identifier.replace(/[\s()-]/g,'');
            if(/^1[0-9]{10}$/.test(identifier))identifier='+'+identifier;
            if(/^[0-9]{10}$/.test(identifier))identifier='+1'+identifier;
            if(!/^\+[1-9][0-9]{7,14}$/.test(identifier))throw new Error('Enter a valid phone number with country code or registered email.');
          }else if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier))throw new Error('Enter a valid email address.');
          const out=await request('forgot-password',{identifier});if(current!==sequence)return;
          challenge=out.challenge;el('recoveryCodeFields').hidden=false;el('recoveryPhone').readOnly=true;
          for(const id of ['recoveryCode','recoveryPassword','recoveryConfirm'])el(id).required=true;
          el('recoverySubmit').textContent='Reset password';el('recoveryStatus').textContent=(out.message||'If this account exists, a code was sent to its registered phone.')+' Check your phone. The code expires in 10 minutes.';el('recoveryCode').focus();
        }else{
          await request('reset-password',{challenge,code:el('recoveryCode').value.trim(),newPassword:el('recoveryPassword').value});if(current!==sequence)return;
          el('recoveryForm').reset();challenge=null;el('recoveryCodeFields').hidden=true;
          el('recoveryStatus').textContent='Password updated. Sign in with your phone or email and new password. All old sessions have been signed out.';
          el('recoverySubmit').hidden=true;
        }
      }catch(error){if(current===sequence)el('recoveryStatus').textContent=error.name==='TimeoutError'?'The request timed out. If resetting your password, try signing in before requesting another code.':error.message;}
      finally{if(current===sequence){busy=false;if(!el('recoverySubmit').hidden)el('recoverySubmit').disabled=!available;}}
    };
    trigger.addEventListener('click',()=>{el('recoverySubmit').hidden=false;});
  }
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
