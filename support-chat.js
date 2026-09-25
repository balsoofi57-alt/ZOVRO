'use strict';
(function () {
  let modal, log, input, status, returnTo, transcript = [], owner, pending = false, submitted = '', attempt = null;
  const signedIn = () => typeof me !== 'undefined' && me ? me.id : null;
  function message(role, text) {
    const item = document.createElement('p');
    item.className = 'msg'; item.dir = 'auto';
    item.textContent = (role === 'user' ? 'You: ' : 'ZOVRO: ') + text;
    log.appendChild(item); log.scrollTop = log.scrollHeight;
    transcript.push({role, text});
    while (transcript.length > 30) { transcript.shift(); log.firstChild.remove(); }
  }
  function close() {
    modal.classList.remove('open');
    if (returnTo && document.contains(returnTo)) {
      returnTo.closest('.modal')?.classList.add('open'); returnTo.focus();
    }
  }
  function init() {
    if (modal) return;
    modal = document.createElement('div'); modal.id = 'supportChatModal'; modal.className = 'modal';
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-labelledby', 'supportChatTitle');
    modal.innerHTML = '<div class="sheet" style="max-height:90dvh;overflow:auto"><h2 id="supportChatTitle">ZOVRO Support</h2><p>Automated answers based on company policies. Do not share passwords, verification codes or card details.</p><div id="supportChatLog" role="log" aria-live="polite" style="max-height:35dvh;overflow:auto;overflow-wrap:anywhere"></div><form id="supportChatForm"><div class="field"><label for="supportChatText">Your message</label><textarea id="supportChatText" maxlength="2000" required placeholder="How can we help?"></textarea></div><button class="btn primary" type="submit">Send message</button></form><p id="supportChatStatus" role="status"></p><div class="bar"><button id="supportChatTicket" class="btn ghost" type="button">Request human review</button><button id="supportChatClose" class="btn ghost" type="button">Back</button></div></div>';
    document.body.appendChild(modal);
    log = document.getElementById('supportChatLog'); input = document.getElementById('supportChatText'); status = document.getElementById('supportChatStatus');
    document.getElementById('supportChatClose').onclick = close;
    modal.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); close(); }
      if (e.key === 'Tab') {
        const focusable = [...modal.querySelectorAll('button:not(:disabled),textarea')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    const suggestions = document.createElement('div'); suggestions.className = 'bar';
    for (const question of ['What is ZOVRO?', 'Do I need a license to join ZOVRO?', 'Why do you need my location?']) {
      const button = document.createElement('button'); button.type = 'button'; button.className = 'btn ghost'; button.textContent = question;
      button.onclick = () => { input.value = question; document.getElementById('supportChatForm').requestSubmit(); };
      suggestions.appendChild(button);
    }
    log.before(suggestions);
    document.getElementById('supportChatForm').onsubmit = e => {
      e.preventDefault(); const text = input.value.trim(); if (!text) return;
      message('user', text); input.value = '';
      const result = window.ZOVRO_SUPPORT_POLICY.respond({text});
      if (result.answerId === 'human-review') {
        result.reply = result.language === 'ar' ? 'لا يوجد جواب معتمد لهذا السؤال. يمكنك طلب مراجعة بشرية من الزر أدناه بعد تسجيل الدخول. هذه المحادثة الآلية لا تغيّر كلمة المرور ولا تتحقق من ملكية الحساب.' : result.language === 'es' ? 'No hay una respuesta aprobada para esta pregunta. Puedes solicitar revisión humana con el botón inferior después de iniciar sesión. Este chat no cambia contraseñas ni verifica la titularidad de una cuenta.' : 'There is no approved answer for this question. Use Request human review below after signing in. This automated chat cannot change passwords or verify account ownership.';
      }
      message('assistant', result.reply);
      document.getElementById('supportChatTicket').disabled = pending;
      input.focus();
    };
    document.getElementById('supportChatTicket').onclick = async e => {
      if (!signedIn()) { status.textContent = 'Automated help is available here. Human review requires sign-in; account recovery still requires a verified recovery method.'; return; }
      if (!transcript.some(x => x.role === 'user')) { status.textContent = 'Describe your issue first.'; input.focus(); return; }
      if (pending) return;
      const snapshot = transcript.map(x => x.role + ': ' + x.text).join('\n').slice(-18000);
      if (submitted === snapshot) { status.textContent = 'This conversation has already been submitted for review.'; return; }
      const actor = signedIn();
      if (!attempt || attempt.snapshot !== snapshot || attempt.actor !== actor) attempt = {snapshot, actor, key:crypto.randomUUID()};
      const activeAttempt = attempt;
      const button = e.currentTarget; pending = true; button.disabled = true; status.textContent = 'Submitting for review…';
      try {
        const out = await api('/workflows/upsert', {method:'POST', signal:AbortSignal.timeout(15000), body:JSON.stringify({type:'support_ticket', key:activeAttempt.key, status:'received', data:{category:'general',subject:'In-app support conversation',description:snapshot,source:'in_app',humanReviewRequired:true}})});
        if (signedIn() !== actor || owner !== actor) return;
        if (!out.record?.id) throw new Error('No ticket confirmation was returned.');
        submitted = snapshot;
        status.textContent = 'Support ticket received: ' + out.record.id + '. Your request was saved for review.';
      } catch (error) {
        if (signedIn() === actor && owner === actor) status.textContent = error.name === 'TimeoutError' ? 'Confirmation took too long. Retry to check the same support request.' : error.message || 'Could not submit. Try again.';
      } finally { pending = false; button.disabled = false; }
    };
  }
  function open(trigger) {
    init(); returnTo = trigger || document.activeElement;
    const current = signedIn();
    if (owner !== current) { owner = current; transcript = []; submitted = ''; attempt = null; log.replaceChildren(); input.value = ''; }
    status.textContent = 'Conversation stays in this page until you leave. Request human review saves it as a ticket when signed in.';
    document.getElementById('supportChatTicket').disabled = pending;
    returnTo?.closest('.modal')?.classList.remove('open');
    modal.classList.add('open');
    if (!transcript.length) message('assistant', 'How can I help? You can ask: What is ZOVRO?');
    input.focus();
  }
  window.ZOVRO_SUPPORT_CHAT = {open};
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href="mailto:support@zovro.work"], [data-support-chat]');
    if (link) { event.preventDefault(); open(link); }
  });
})();
