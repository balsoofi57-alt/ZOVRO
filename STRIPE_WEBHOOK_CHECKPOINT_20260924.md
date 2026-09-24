# Stripe webhook verification — 2026-09-24

## Confirmed external evidence

Owner-provided Stripe Workbench screenshots show the canonical production endpoint
`https://zovro-api-final.onrender.com/api/payments/webhook` delivering:

- `payment_intent.succeeded`: Delivered / Recovered, September 24 at 13:34:04; HTTP 200 with `received: true`.
- `charge.refunded`: Delivered / Recovered, September 24 at 13:09:40; HTTP 200; description reports a USD 1 refund issued.
- Earlier refund deliveries failed with HTTP 400. Later successful deliveries supersede those failures for these events.

The deployed handler at `ab58937245a4fdb48ce2bf3c692888971c5196cc` verifies the Stripe signature before returning its successful acknowledgement. A direct unsigned POST was separately rejected with HTTP 400. This supports delivery and signature validation for these two event types, not complete payment lifecycle closure.

## Candidate fix and local verification

The deployed handler only correlates webhook objects by request metadata. A charge refund with a stored PaymentIntent reference but no request metadata is acknowledged without updating a request. A late successful payment event can also regress a refunded or released request to `paid_held`.

The candidate resolves events against unique stored Stripe identifiers, rejects conflicting request metadata, distinguishes tip refunds by stored identifiers, and preserves downstream payment states against late success/failure or partial-refund events.

Local HTTP regression verification passed for invalid and valid signatures, metadata-free refund correlation, duplicate delivery without state mutation, replay after reloading serialized state, late success/failure/partial-refund events, tip refunds, and conflicting identifiers. Existing payment safety and saved-card checks also passed. These use isolated local fixtures and no live Stripe transactions.

## Still open

- Deploy the reviewed fix and verify an actual ZOVRO request reflects the live payment and refund.
- Prove durable duplicate handling across production restarts and audit retention. Current deduplication relies on a bounded audit log and is not a permanent receipt ledger. Local serialized-state replay does not prove production PostgreSQL durability or concurrency safety.
- Validate other subscribed event types and out-of-order/concurrent delivery across the full lifecycle.
- Verify current platform and provider payout eligibility, tax requirements, and a controlled provider transfer. Existing account API discovery did not expose the needed current account read operation.
- Production payment config returned `publishableKey: null` during this session despite `stripeConfigured: true`. Mobile payment readiness therefore requires separate investigation; presence-only startup checks are insufficient.

No live payment, refund, transfer, secret change, database network change, or production deployment was performed for this candidate. Do not mark the complete Stripe payment gate closed.
