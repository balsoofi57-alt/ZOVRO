'use strict';
const payments=require('./payments');

function moduleAvailable(name){
  try { require.resolve(name); return true; } catch { return false; }
}
const present=name=>Boolean(String(process.env[name]||'').trim());
const enabled=name=>/^(1|true|yes|on)$/i.test(String(process.env[name]||''));
const merchantOk=/^merchant\.[A-Za-z0-9.-]+$/.test(String(process.env.ZOVRO_APPLE_PAY_MERCHANT_ID||'').trim());
const dbMirrorMode=/^(mirror|durable)$/i.test(String(process.env.ZOVRO_DB_MIRROR_MODE||''))?String(process.env.ZOVRO_DB_MIRROR_MODE).toLowerCase():'off';
const profileEncryptionKeyLength=Buffer.from(String(process.env.ZOVRO_PROFILE_ENCRYPTION_KEY||'')).length;

const status = {
  event: 'zovro.startup_preflight',
  passwordRecoveryEnabled: process.env.ZOVRO_PASSWORD_RECOVERY_ENABLED === 'true',
  recoveryTwilioAccountConfigured: /^AC[0-9a-f]{32}$/i.test(process.env.TWILIO_ACCOUNT_SID || ''),
  recoveryTwilioTokenPresent: present('TWILIO_AUTH_TOKEN'),
  recoveryVerifyServiceConfigured: /^VA[0-9a-f]{32}$/i.test(process.env.TWILIO_RECOVERY_VERIFY_SERVICE_SID || ''),
  passwordRecoveryConfigured: require('./password-recovery').verifyProvider().configured(),
  nodeEnv: process.env.NODE_ENV || null,
  dbMirrorMode,
  mirrorRequested: dbMirrorMode==='mirror',
  durableRequested: dbMirrorMode==='durable',
  databaseUrlPresent: present('DATABASE_URL'),
  pgModuleAvailable: moduleAvailable('pg'),
  stripePublishablePresent: present('STRIPE_PUBLISHABLE_KEY'),
  stripeSecretPresent: present('STRIPE_SECRET_KEY'),
  stripeSecretConfigured: payments.configured(),
  stripeWebhookPresent: present('STRIPE_WEBHOOK_SECRET'),
  applePayRequested: enabled('ZOVRO_APPLE_PAY_ENABLED'),
  applePayMerchantConfigured: merchantOk,
  googlePayRequested: enabled('ZOVRO_GOOGLE_PAY_ENABLED'),
  oneSignalAppIdPresent: present('ONESIGNAL_APP_ID'),
  oneSignalRestKeyPresent: present('ONESIGNAL_REST_API_KEY'),
  productionSecretPresent: Boolean(process.env.ZOVRO_SECRET && !String(process.env.ZOVRO_SECRET).includes('dev-only')),
  allowedOriginsPresent: present('ZOVRO_ALLOWED_ORIGINS'),
  profileEncryptionConfigured: profileEncryptionKeyLength>=32
};
status.postgresRuntimeReady=status.databaseUrlPresent&&status.pgModuleAvailable;
status.mirrorOperational=status.mirrorRequested&&status.postgresRuntimeReady;
status.durableOperational=status.durableRequested&&status.postgresRuntimeReady;
status.blockers=[];
if(status.passwordRecoveryEnabled&&!status.passwordRecoveryConfigured) status.blockers.push('password_recovery_provider');
if(!status.databaseUrlPresent) status.blockers.push('database_url');
if(!status.pgModuleAvailable) status.blockers.push('postgres_driver');
if((status.mirrorRequested||status.durableRequested)&&!status.postgresRuntimeReady) status.blockers.push('postgres_runtime');
if(!status.stripePublishablePresent) status.blockers.push('stripe_publishable');
if(!status.stripeSecretConfigured) status.blockers.push('stripe_secret');
if(!status.stripeWebhookPresent) status.blockers.push('stripe_webhook');
if(status.applePayRequested&&!status.applePayMerchantConfigured) status.blockers.push('apple_pay_merchant');
if(!status.oneSignalRestKeyPresent) status.blockers.push('onesignal_rest_key');
if(!status.profileEncryptionConfigured) status.blockers.push('profile_encryption_key');
status.externalLaunchReady=status.blockers.length===0;

console.log(JSON.stringify(status));
module.exports = status;
