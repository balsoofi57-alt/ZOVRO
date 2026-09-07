# ZOVRO Stripe Connect recommendation

## Recommended Connect integration plan

- Business model: Marketplace. ZOVRO collects customer payments and distributes provider proceeds.
- Dashboard: Express (lightweight view for providers), with embedded onboarding/components where available.
- Fee collection: ZOVRO manages pricing.
- Negative balance liability: ZOVRO.
- Charge pattern: Separate charges and transfers, so funds can be held before release and released after service completion.
- Connected accounts: recipient configuration with transfer capability; verify transfer readiness before releasing provider funds.
- Transaction fee: retain the ZOVRO fee by transferring less than the customer charge. Do not use `application_fee_amount` with separate charges and transfers.
- Provider subscriptions: add later after the first-year-free period using Stripe Billing.

## Payment lifecycle

1. Provider submits a service quote.
2. Customer confirms and creates a Stripe PaymentIntent on the ZOVRO account.
3. Signed Stripe webhook marks the request paid and held.
4. Provider completes the job.
5. Customer confirms completion.
6. ZOVRO creates a Transfer for the provider share.
7. Refunds before transfer are handled against the PaymentIntent; post-transfer reversals require a controlled support workflow.

## Production safeguards

- Store Stripe secret and webhook signing secret only in Render environment variables.
- Use idempotency keys for PaymentIntent, Transfer, and Refund creation.
- Verify every webhook signature and timestamp.
- Do not release funds until the provider payout account is transfer-ready.
- Keep the platform fee configurable through `ZOVRO_PLATFORM_FEE_BPS`; no fee is assumed in code until configured.
