'use strict';
(function () {
  let modal, log, input, status, returnTo, transcript = [], owner;
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
    modal.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); close(); } });
    document.getElementById('supportChatForm').onsubmit = e => {
      e.preventDefault(); const text = input.value.trim(); if (!text) return;
      message('user', text); input.value = '';
      const result = window.ZOVRO_SUPPORT_POLICY.respond({text});
      if (result.answerId === 'human-review') {
        result.reply = result.language === 'ar' ? 'لا يوجد جواب معتمد لهذا السؤال. يمكنك طلب مراجعة بشرية من الزر أدناه بعد تسجيل الدخول. هذه المحادثة الآلية لا تغيّر كلمة المرور ولا تتحقق من ملكية الحساب.' : result.language === 'es' ? 'No hay una respuesta aprobada para esta pregunta. Puedes solicitar revisión humana con el botón inferior después de iniciar sesión. Este chat no cambia contraseñas ni verifica la titularidad de una cuenta.' : 'There is no approved answer for this question. Use Request human review below after signing in. This automated chat cannot change passwords or verify account ownership.';
      }
      message('assistant', result.reply); input.focus();
    };
    document.getElementById('supportChatTicket').onclick = async e => {
      if (!signedIn()) { status.textContent = 'Automated help is available here. Human review requires sign-in; account recovery still requires a verified recovery method.'; return; }
      if (!transcript.some(x => x.role === 'user')) { status.textContent = 'Describe your issue first.'; input.focus(); return; }
      const button = e.currentTarget; button.disabled = true; status.textContent = 'Submitting for review…';
      try {
        const out = await api('/workflows', {method:'POST', body:JSON.stringify({type:'support_ticket', status:'received', data:{category:'general',subject:'In-app support conversation',description:transcript.map(x => x.role + ': ' + x.text).join('\n').slice(-18000),source:'in_app',humanReviewRequired:true}})});
        if (!out.record?.id) throw new Error('No ticket confirmation was returned.');
        status.textContent = 'Support ticket received: ' + out.record.id + '. Your request was saved for review.';
      } catch (error) { status.textContent = error.message || 'Could not submit. Try again.'; button.disabled = false; }
    };
  }
  function open(trigger) {
    init(); returnTo = trigger || document.activeElement;
    const current = signedIn();
    if (owner !== current) { owner = current; transcript = []; log.replaceChildren(); input.value = ''; }
    status.textContent = 'Conversation stays in this page until you leave. Request human review saves it as a ticket when signed in.';
    document.getElementById('supportChatTicket').disabled = false;
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
