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


## Follow-up verification and receipt storage candidate

- PR #51 was deployed as 750c7af on Render service zovro-api-final; deployment dep-daqmof8473hc73bobohg became live at 18:30:53 UTC. Payment config returned 200 and unsigned webhook returned 400. Startup restored 20 application records with verified counts.
- Current authenticated Stripe API read: charges_enabled=true, payouts_enabled=true, card_payments/transfers active. Account requirements and future requirements have no currently_due, past_due, pending_verification or errors. This supersedes earlier tax-ID mismatch notes for current readiness; it is not proof of a completed bank payout.
- Connected account listing returned zero accounts. No provider transfer was initiated.
- Render UI inspection found STRIPE_PUBLISHABLE_KEY contains only its eight-character prefix, not a complete publishable key. No key values or other secrets are recorded here. A complete publishable key from this Stripe account is required; do not loosen validation to accept the prefix.
- Candidate adds an independent append-only stripe_webhook_receipts table. PostgreSQL request snapshot and receipt commit together before HTTP success in durable mode. Duplicate lookup in durable mode reads PostgreSQL, including after local disk replacement. Application snapshots do not delete receipts. Legacy audit matches are promoted into receipts. Unmatched events retain existing behavior and are not marked processed.
- Webhook handlers are serialized within the one Node process currently deployed. This does not provide distributed locking across replicas or eliminate existing stale snapshots from unrelated asynchronous routes. Multi-instance writes and concurrent non-webhook mutations remain outside this candidate's guarantee.
- Local validation: signed HTTP delivery, ten simultaneous duplicates with one commit, audit pruning, storage failure/retry; real SQLite file across separate Node processes; real PostgreSQL adapter with a fault-injection client verifying rollback, commit failure propagation and ordered receipt retention. PostgreSQL fault injection is not a live PostgreSQL integration test.
- Receipt table is independent of the version-7 application snapshot shape. Full native database backups include it; application JSON snapshots alone do not. No existing records are deleted by this additive table creation.
- Live request-state correlation and provider payout lifecycle remain unverified. This candidate has not yet been deployed.
