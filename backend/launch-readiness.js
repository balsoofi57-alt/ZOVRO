'use strict';

const http = require('http');
const { dbInfo } = require('./database');
const payments = require('./payments');

const originalCreateServer = http.createServer.bind(http);
const present = name => Boolean(String(process.env[name] || '').trim());
const enabled = name => /^(1|true|yes|on)$/i.test(String(process.env[name] || ''));

function snapshot() {
  const database = dbInfo();
  const dbMirrorMode = String(process.env.ZOVRO_DB_MIRROR_MODE || 'off').toLowerCase();
  const databaseUrlPresent = present('DATABASE_URL');
  const postgresConfigured = Boolean(database.postgresConfigured);
  const stripeConfigured = payments.configured();
  const stripeWebhookConfigured = payments.webhookConfigured();
  const stripePublishablePresent = present('STRIPE_PUBLISHABLE_KEY');
  const oneSignalAppIdPresent = present('ONESIGNAL_APP_ID');
  const oneSignalRestKeyPresent = present('ONESIGNAL_REST_API_KEY');
  const productionSecretPresent = Boolean(
    process.env.ZOVRO_SECRET &&
    String(process.env.ZOVRO_SECRET).length >= 32 &&
    !String(process.env.ZOVRO_SECRET).includes('dev-only')
  );
  const allowedOriginsPresent = present('ZOVRO_ALLOWED_ORIGINS');
  const applePayRequested = enabled('ZOVRO_APPLE_PAY_ENABLED');
  const applePayMerchantPresent = /^merchant\.[A-Za-z0-9.-]+$/.test(String(process.env.ZOVRO_APPLE_PAY_MERCHANT_ID || '').trim());

  const blockers = [];
  if (!databaseUrlPresent) blockers.push('database_url');
  if ((dbMirrorMode === 'mirror' || dbMirrorMode === 'durable') && !postgresConfigured) blockers.push('postgres_runtime');
  if (!stripePublishablePresent) blockers.push('stripe_publishable');
  if (!stripeConfigured) blockers.push('stripe_secret');
  if (!stripeWebhookConfigured) blockers.push('stripe_webhook');
  if (!oneSignalRestKeyPresent) blockers.push('onesignal_rest_key');
  if (!productionSecretPresent) blockers.push('production_secret');
  if (!allowedOriginsPresent) blockers.push('allowed_origins');
  if (applePayRequested && !applePayMerchantPresent) blockers.push('apple_pay_merchant');

  return {
    service: 'zovro-api',
    version: process.env.ZOVRO_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || null,
    launchReady: blockers.length === 0,
    blockers,
    checks: {
      databaseUrlPresent,
      postgresConfigured,
      dbMirrorMode,
      stripePublishablePresent,
      stripeConfigured,
      stripeWebhookConfigured,
      oneSignalAppIdPresent,
      oneSignalRestKeyPresent,
      productionSecretPresent,
      allowedOriginsPresent,
      applePayRequested,
      applePayMerchantPresent
    },
    time: new Date().toISOString()
  };
}

function router(req, res, next) {
  let url;
  try { url = new URL(req.url, 'http://localhost'); } catch { return next(req, res); }
  if (req.method === 'GET' && url.pathname === '/api/launch-readiness') {
    const status = snapshot();
    res.writeHead(status.launchReady ? 200 : 503, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'referrer-policy': 'no-referrer'
    });
    res.end(JSON.stringify(status));
    return;
  }
  return next(req, res);
}

http.createServer = function(handler, ...args) {
  return originalCreateServer((req, res) => router(req, res, handler), ...args);
};

module.exports = { snapshot };
