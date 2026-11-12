'use strict';
// Profile photo transport. Small, normalized JPEG avatars are stored with the
// user record so they survive server restarts and PostgreSQL durable restores.
const http = require('http');
const {readDb, writeDb} = require('./database');
const {currentUser} = require('./request-privacy');
const baseUrl = String(process.env.ZOVRO_PUBLIC_API_BASE_URL || process.env.ZOVRO_API_URL || 'https://zovro-api-final.onrender.com').replace(/\/+$/, '');
const originalCreateServer = http.createServer.bind(http);
const MAX_BODY = 280000;
const MAX_PHOTO = 180000;
function reply(res, status, message) {
  res.writeHead(status, {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'});
  res.end(JSON.stringify({error:message}));
}
function parseJson(req) {
  return new Promise((resolve, reject) => {
    let chunks = [], size = 0, stopped = false;
    req.on('data', chunk => {
      if (stopped) return;
      size += chunk.length;
      if (size > MAX_BODY) { stopped = true; reject(Object.assign(new Error('Photo is too large'), {status:413})); req.resume(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => {
      if (stopped) return;
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(Object.assign(new Error('Invalid photo request'), {status:400})); }
    });
    req.on('error', reject);
  });
}
function jpegFromInput(payload) {
  if (!payload || payload.mimeType !== 'image/jpeg' || typeof payload.imageBase64 !== 'string' ||
      payload.imageBase64.length > Math.ceil(MAX_PHOTO * 4 / 3) + 4 ||
      !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(payload.imageBase64)) {
    throw Object.assign(new Error('Please select a valid JPEG image'), {status:400});
  }
  const image = Buffer.from(payload.imageBase64, 'base64');
  if (image.length < 100 || image.length > MAX_PHOTO ||
      image[0] !== 0xff || image[1] !== 0xd8 ||
      image[image.length - 2] !== 0xff || image[image.length - 1] !== 0xd9) {
    throw Object.assign(new Error('Unsupported or oversized photo'), {status:400});
  }
  return image;
}
http.createServer = function(handler, ...args) {
  return originalCreateServer(async (req, res) => {
    const path = new URL(req.url || '/', 'http://localhost').pathname;
    const match = /^\/api\/profile\/photo\/([A-Za-z0-9_-]{1,120})$/.exec(path);
    if (match && (req.method === 'GET' || req.method === 'HEAD')) {
      const user = (readDb().users || []).find(item => item.id === match[1]);
      if (!user?.profilePhotoJpeg) return reply(res, 404, 'Photo not found');
      const bytes = Buffer.from(user.profilePhotoJpeg, 'base64');
      res.writeHead(200, {
        'content-type':'image/jpeg',
        'content-length':bytes.length,
        'cache-control':'no-store',
        'x-content-type-options':'nosniff'
      });
      return res.end(req.method === 'HEAD' ? undefined : bytes);
    }
    if (path !== '/api/profile/photo') return handler(req, res);
    if (!['POST', 'DELETE'].includes(req.method)) {
      res.setHeader('allow', 'POST, DELETE');
      return reply(res, 405, 'Method not allowed');
    }
    const session = currentUser(req);
    if (!session?.user?.id) return reply(res, 401, 'Authentication required');
    try {
      const state = readDb();
      const user = (state.users || []).find(item => item.id === session.user.id);
      if (!user) return reply(res, 404, 'Account not found');
      if (req.method === 'DELETE') {
        delete user.profilePhotoJpeg;
        user.photoUrl = '';
      } else {
        const payload = await parseJson(req);
        const image = jpegFromInput(payload);
        user.profilePhotoJpeg = image.toString('base64');
        user.photoUrl = baseUrl + '/api/profile/photo/' + encodeURIComponent(user.id) + '?v=' + Date.now();
      }
      writeDb(state);
      res.writeHead(200, {'content-type':'application/json; charset=utf-8', 'cache-control':'no-store'});
      return res.end(JSON.stringify({ok:true,photoUrl:user.photoUrl}));
    } catch (err) {
      return reply(res, err.status || 500, err.status ? err.message : 'Could not save profile photo');
    }
  }, ...args);
};
module.exports = {jpegFromInput, MAX_PHOTO};
