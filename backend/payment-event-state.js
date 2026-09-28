'use strict';

// Charge events may lack the request metadata carried by a PaymentIntent.
// Require a unique match and reject conflicting metadata / stored Stripe IDs.
function resolveRequest(requests, event) {
  const obj = event?.data?.object || {};
  const requestId = obj.metadata?.zovro_request_id || obj.metadata?.request_id;
  const pi = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;
  const matches = requests.filter(r => {
    if (event.type === 'charge.refunded') {
      return (obj.id && [r.stripeChargeId, r.stripeTipChargeId].includes(obj.id)) ||
        (pi && [r.stripePaymentIntentId, r.stripeTipPaymentIntentId].includes(pi));
    }
    if (event.type === 'transfer.reversed') {
      return obj.id && [r.stripeTransferId, r.stripeTipTransferId].includes(obj.id);
    }
    return obj.id && [r.stripePaymentIntentId, r.stripeTipPaymentIntentId].includes(obj.id);
  });
  if (matches.length > 1) return null;
  if (matches.length === 1) return requestId && requestId !== matches[0].id ? null : matches[0];
  const r = requestId ? requests.find(r => r.id === requestId) : null;
  // Metadata fallback is needed when the event arrives before the intent API response.
  if (!r || !['payment_intent.succeeded', 'payment_intent.payment_failed'].includes(event.type)) return null;
  const stored = obj.metadata?.zovro_payment_type === 'tip' ? r.stripeTipPaymentIntentId : r.stripePaymentIntentId;
  return stored && stored !== obj.id ? null : r;
}

function isTipPayment(r, obj) {
  const pi = typeof obj.payment_intent === 'string' ? obj.payment_intent : obj.payment_intent?.id;
  return obj.metadata?.zovro_payment_type === 'tip' ||
    Boolean(obj.id && [r.stripeTipPaymentIntentId, r.stripeTipChargeId, r.stripeTipTransferId].includes(obj.id)) ||
    Boolean(pi && pi === r.stripeTipPaymentIntentId);
}

function preservePaymentState(r, event) {
  const obj = event?.data?.object || {};
  const state = isTipPayment(r, obj) ? r.tipState : r.paymentState;
  const downstream = ['released', 'refund_pending', 'partially_refunded', 'refunded', 'transfer_reversed'];
  if (event.type === 'payment_intent.succeeded') return downstream.includes(state);
  if (event.type === 'payment_intent.payment_failed') return ['paid_held', ...downstream].includes(state);
  if (event.type === 'charge.refunded') return state === 'refunded';
  return false;
}

module.exports = {resolveRequest, isTipPayment, preservePaymentState};
