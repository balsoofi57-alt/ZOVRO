'use strict';

function moduleAvailable(name){
  try { require.resolve(name); return true; } catch { return false; }
}

const status = {
  event: 'zovro.startup_preflight',
  nodeEnv: process.env.NODE_ENV || null,
  databaseUrlPresent: Boolean(process.env.DATABASE_URL),
  pgModuleAvailable: moduleAvailable('pg'),
  stripeSecretPresent: Boolean(process.env.STRIPE_SECRET_KEY),
  stripeWebhookPresent: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  oneSignalRestKeyPresent: Boolean(process.env.ONESIGNAL_REST_API_KEY),
  productionSecretPresent: Boolean(process.env.ZOVRO_SECRET && !String(process.env.ZOVRO_SECRET).includes('dev-only')),
  allowedOriginsPresent: Boolean(process.env.ZOVRO_ALLOWED_ORIGINS)
};

console.log(JSON.stringify(status));
module.exports = status;
