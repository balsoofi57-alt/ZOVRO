'use strict';
(function () {
  let modal, challenge = null, generation = 0, busy = false, account = null;
  const el = id => document.getElementById(id);
  const current = () => typeof me !== 'undefined' ? me : null;
  async function call(path, data) {
    return api('/auth/phone/' + path, {method:data ? 'POST' : 'GET', ...(data ? {body:JSON.stringify(data)} : {}), signal:AbortSignal.timeout(20000)});
  }
  function close() { generation++; challenge = null; modal.classList.remove('open'); el('phoneVerificationForm').reset(); }
  function init() {
    if (modal) return;
    modal = document.createElement('div'); modal.className = 'modal'; modal.id = 'phoneVerificationModal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'phoneVerificationTitle');
    modal.innerHTML = '<div class="sheet" style="max-height:90dvh;overflow:auto"><h2 id="phoneVerificationTitle">Verify your phone</h2><p>Verify the number on your signed-in account to enable password recovery. Standard message and data rates may apply.</p><form id="phoneVerificationForm"><div id="phoneVerificationCodeField" class="field" hidden><label for="phoneVerificationCode">Verification code</label><input id="phoneVerificationCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{4,10}" maxlength="10"></div><p id="phoneVerificationStatus" role="status" aria-live="polite"></p><div class="bar"><button id="phoneVerificationSubmit" class="btn primary" type="submit" disabled>Send verification code</button><button id="phoneVerificationRetry" class="btn ghost" type="button">Check again</button><button id="phoneVerificationClose" class="btn ghost" type="button">Close</button></div></form></div>';
    document.body.appendChild(modal); el('phoneVerificationClose').onclick = close;
    modal.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
    el('phoneVerificationRetry').onclick = () => { if (!busy) open(); };
    el('phoneVerificationForm').onsubmit = async event => {
      event.preventDefault(); if (busy || el('phoneVerificationSubmit').disabled || current()?.id !== account) return;
      const ticket = generation; busy = true; el('phoneVerificationSubmit').disabled = true; el('phoneVerificationStatus').textContent = 'Please wait…';
      try {
        const result = await call(challenge ? 'confirm' : 'start', challenge ? {challenge, code:el('phoneVerificationCode').value.trim()} : {});
        if (ticket !== generation || current()?.id !== account) return;
        if (result.verified === true) {
          current().phoneVerified = true; el('phoneVerificationStatus').textContent = 'Phone verified. You can now use this number for password recovery.';
          el('phoneVerificationSubmit').hidden = true; el('phoneVerificationCodeField').hidden = true; challenge = null; inject();
        } else if (result.challenge) {
          challenge = result.challenge; el('phoneVerificationCodeField').hidden = false; el('phoneVerificationCode').required = true;
          el('phoneVerificationSubmit').textContent = 'Verify code'; el('phoneVerificationStatus').textContent = result.message; el('phoneVerificationCode').focus();
        } else throw new Error('Verification was not confirmed. Please check again.');
      } catch (error) {
        if (ticket === generation && current()?.id === account) el('phoneVerificationStatus').textContent = error.name === 'TimeoutError' ? 'The server took too long. Check again before requesting another code.' : error.message;
      } finally { if (ticket === generation) { busy = false; el('phoneVerificationSubmit').disabled = false; } }
    };
  }
  async function open() {
    if (!current()) return;
    init(); const ticket = ++generation; account = current().id; challenge = null; busy = false;
    el('phoneVerificationForm').reset(); el('phoneVerificationCode').required = false; el('phoneVerificationCodeField').hidden = true;
    el('phoneVerificationSubmit').textContent = 'Send verification code'; el('phoneVerificationSubmit').hidden = false; el('phoneVerificationSubmit').disabled = true;
    el('phoneVerificationStatus').textContent = 'Checking verification availability…'; modal.classList.add('open'); el('phoneVerificationClose').focus();
    try {
      const result = await call('status'); if (ticket !== generation || current()?.id !== account) return;
      el('phoneVerificationSubmit').disabled = !result.available || result.verified;
      el('phoneVerificationStatus').textContent = result.verified ? 'Your phone is already verified.' : result.available ? 'Send a code to the phone registered on this account.' : 'Phone verification is temporarily unavailable. Please check again later.';
    } catch (error) { if (ticket === generation && current()?.id === account) el('phoneVerificationStatus').textContent = error.message; }
  }
  function inject() {
    el('phoneVerificationCard')?.remove(); const user = current(), profile = el('profile'); if (!user || !profile) return;
    const card = document.createElement('div'); card.className = 'card'; card.id = 'phoneVerificationCard';
    const text = document.createElement('p'); text.textContent = user.phoneVerified ? 'Your phone is verified for password recovery.' : 'Verify your registered phone so you can recover your password later.'; card.appendChild(text);
    if (!user.phoneVerified) { const button = document.createElement('button'); button.type = 'button'; button.className = 'btn primary'; button.textContent = 'Verify phone'; button.onclick = open; card.appendChild(button); }
    profile.appendChild(card);
  }
  const render = window.renderAccount;
  if (typeof render === 'function') window.renderAccount = function (...args) { const result = render.apply(this, args); inject(); return result; };
  window.ZOVRO_PHONE_VERIFICATION = {open, inject}; inject();
})();
