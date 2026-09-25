'use strict';
const fs = require('fs');
const path = require('path');
// Explicit public files only. Never serve application source, configuration or data.
const PUBLIC_FILES = new Set([
  "admin-requests-client.js",
  "admin.html",
  "biometric-client.js",
  "consent-client.js",
  "i18n.js",
  "index.html",
  "live-map.js",
  "manifest.webmanifest",
  "password-recovery-client.js",
  "payment-client.js",
  "payment-ui.js",
  "phone-verification-client.js",
  "privacy.html",
  "profile-security-client.js",
  "provider-service-picker.js",
  "push-client.js",
  "secure-session.js",
  "service-worker.js",
  "sms-terms.html",
  "support-assistant.js",
  "support-center.js",
  "support-chat.js",
  "support-policy-page.js",
  "support-policy.js",
  "support.html",
  "terms.html",
  "website-final.css",
  "website-final.js",
  "assets/zovro-icon.svg",
  "assets/zovro-official-brand.webp",
  "src/advanced-workflows.js",
  "src/product-features.js",
  "src/provider-services.js",
  "src/service-catalog.js",
  "src/zovro-enhancements.js",
  "src/zovro-theme.css"
]);
function servePublicFile(req, res, url, root, headers = {}) {
  const fail = status => { res.writeHead(status, {'content-type':'text/plain; charset=utf-8', ...headers}); res.end(req.method === 'HEAD' ? undefined : 'Not found'); };
  if (!['GET', 'HEAD'].includes(req.method)) { res.setHeader('allow', 'GET, HEAD'); return fail(405); }
  let relative;
  try { relative = decodeURIComponent(url.pathname === '/' ? 'index.html' : url.pathname.slice(1)); }
  catch { return fail(400); }
  if (!PUBLIC_FILES.has(relative)) return fail(404);
  const canonicalRoot = fs.realpathSync(root);
  const file = path.join(canonicalRoot, relative);
  try {
    // Reject symlink substitutions, including links to private files inside the root.
    if (fs.realpathSync(file) !== file || !fs.statSync(file).isFile()) return fail(404);
  } catch { return fail(404); }
  const types = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.woff':'font/woff','.woff2':'font/woff2'};
  res.writeHead(200, {'content-type':types[path.extname(file)] || 'application/octet-stream', ...headers});
  if (req.method === 'HEAD') return res.end();
  const stream = fs.createReadStream(file);
  stream.on('error', () => res.destroy());
  stream.pipe(res);
}
module.exports = {servePublicFile, PUBLIC_FILES};
