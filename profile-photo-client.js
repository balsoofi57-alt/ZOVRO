'use strict';
(function(){
  // The native WebView's image picker offers Camera and Photo Library on iOS.
  // Export a small square JPEG so EXIF/location metadata is not uploaded.
  const qs = selector => document.querySelector(selector);
  const current = () => typeof me === 'undefined' ? null : me;
  const request = (path, options) => {
    if (typeof api !== 'function') throw Error('Please sign in to change your photo');
    return api(path, options);
  };
  function setStatus(message) {
    const status = qs('#zPhotoMessage');
    if (status) status.textContent = message;
  }
  function style() {
    if (qs('#zProfilePhotoStyle')) return;
    const el = document.createElement('style');
    el.id = 'zProfilePhotoStyle';
    el.textContent = [
      '.z-photo-controls{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0 16px}',
      '.z-photo-controls .btn{font-size:12px;padding:9px 12px;border-radius:10px}',
      '.z-photo-controls .z-photo-delete{color:#bd3434;background:transparent;border:1px solid #d8a7a7}',
      '.z-photo-status{flex-basis:100%;font-size:12px;min-height:1em;color:#63768a}',
      '.z-profile-avatar{overflow:hidden;border-radius:50%}',
      '.z-profile-avatar img{display:block;width:100%;height:100%;object-fit:cover;border-radius:inherit}',
      '.z-private-field:has(> #zPrivPhoto){display:none!important}'
    ].join('');
    document.head.appendChild(el);
  }
  function paintAvatar(avatar, user) {
    const url = user.photoUrl || '';
    if (!avatar) return;
    if (url) {
      const old = avatar.querySelector('img');
      if (old?.getAttribute('src') === url) return;
      const image = document.createElement('img');
      image.alt = '';
      image.src = url;
      image.onerror = () => {
        if (image.parentNode === avatar) {
          image.remove();
          avatar.textContent = (user.name || '?').trim().charAt(0).toUpperCase();
        }
      };
      avatar.replaceChildren(image);
    } else {
      if (avatar.querySelector('img') || !avatar.textContent.trim()) {
        avatar.textContent = (user.name || '?').trim().charAt(0).toUpperCase();
      }
    }
  }
  function render() {
    const box = qs('#profileBox'), user = current();
    if (!box || !user) {
      qs('#zPhotoControls')?.remove();
      return;
    }
    style();
    paintAvatar(box.querySelector('.z-profile-avatar'), user);
    let controls = qs('#zPhotoControls');
    if (!controls || controls.parentElement !== box) {
      controls?.remove();
      controls = document.createElement('div');
      controls.id = 'zPhotoControls';
      controls.className = 'z-photo-controls';
      controls.innerHTML = '<button type="button" class="btn ghost" id="zPhotoChange">📷 Add or change photo</button>' +
        '<button type="button" class="btn z-photo-delete" id="zPhotoRemove">Remove photo</button>' +
        '<input id="zPhotoFile" type="file" accept="image/*" hidden aria-label="Choose profile photo">' +
        '<span id="zPhotoMessage" class="z-photo-status" role="status" aria-live="polite">Choose a photo from your camera or library. Your profile photo is public.</span>';
      const identity = box.querySelector('.z-profile-identity');
      if (identity) identity.after(controls); else box.prepend(controls);
      qs('#zPhotoChange').addEventListener('click', () => qs('#zPhotoFile').click());
      qs('#zPhotoFile').addEventListener('change', upload);
      qs('#zPhotoRemove').addEventListener('click', remove);
    }
    qs('#zPhotoRemove').hidden = !user.photoUrl;
    const legacyInput = qs('#zPrivPhoto');
    if (legacyInput) {
      legacyInput.closest('.z-private-field')?.setAttribute('hidden', '');
      // If the private-profile sheet is already open, keep its next save in sync.
      if (!qs('#zPrivateProfileModal')?.classList.contains('open')) legacyInput.value = user.photoUrl || '';
    }
  }
  function normalize(file) {
    return new Promise((resolve, reject) => {
      if (!file || !file.type.startsWith('image/')) return reject(Error('Select an image file'));
      if (file.size > 8 * 1024 * 1024) return reject(Error('Select an image smaller than 8 MB'));
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        try {
          const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
          if (!ctx) throw Error('Image editing is not supported on this device');
          canvas.width = canvas.height = 256;
          const w = image.naturalWidth, h = image.naturalHeight;
          if (!w || !h) throw Error('Could not open the selected photo');
          const edge = Math.min(w, h);
          ctx.drawImage(image, (w - edge) / 2, (h - edge) / 2, edge, edge, 0, 0, 256, 256);
          for (const quality of [.82, .70, .56, .40]) {
            const result = canvas.toDataURL('image/jpeg', quality);
            const data = result.split(',')[1];
            if (data && data.length < 240000) return resolve(data);
          }
          reject(Error('Could not compress the selected photo'));
        } catch (err) { reject(err); }
      };
      image.onerror = () => { URL.revokeObjectURL(url); reject(Error('This image format cannot be opened')); };
      image.src = url;
    });
  }
  let busy = false;
  function lock(value) {
    busy = value;
    for (const id of ['zPhotoChange', 'zPhotoRemove']) {
      const button = qs('#' + id);
      if (button) button.disabled = value;
    }
  }
  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || busy || !current()) return;
    lock(true);
    setStatus('Preparing your picture…');
    try {
      const imageBase64 = await normalize(file);
      setStatus('Saving your profile photo…');
      const result = await request('/profile/photo', {
        method:'POST',
        body:JSON.stringify({mimeType:'image/jpeg', imageBase64})
      });
      if (!current()) return;
      current().photoUrl = result.photoUrl || '';
      const legacyInput = qs('#zPrivPhoto');
      if (legacyInput) legacyInput.value = current().photoUrl;
      render();
      setStatus('Profile photo saved.');
    } catch (err) { setStatus(err.message || 'Could not save profile photo'); }
    finally { lock(false); }
  }
  async function remove() {
    if (busy || !current() || !current().photoUrl) return;
    if (!confirm('Remove your profile picture?')) return;
    lock(true);
    setStatus('Removing profile photo…');
    try {
      await request('/profile/photo', {method:'DELETE'});
      if (!current()) return;
      current().photoUrl = '';
      const legacyInput = qs('#zPrivPhoto');
      if (legacyInput) legacyInput.value = '';
      render();
      setStatus('Profile photo removed.');
    } catch (err) { setStatus(err.message || 'Could not remove profile photo'); }
    finally { lock(false); }
  }
  let queued = false;
  function schedule() {
    if (queued) return;
    queued = true;
    Promise.resolve().then(() => { queued = false; render(); });
  }
  function init() {
    style();
    schedule();
    const profile = qs('#profile');
    if (profile) new MutationObserver(schedule).observe(profile, {childList:true, subtree:true});
    const before = window.renderAccount;
    if (typeof before === 'function' && !before.__zPhotoHook) {
      const after = function(...args) { const value = before.apply(this, args); schedule(); return value; };
      after.__zPhotoHook = true;
      window.renderAccount = after;
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  window.ZOVRO_PROFILE_PHOTO = {normalize, render};
})();
