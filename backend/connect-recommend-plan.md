# ZOVRO Stripe Connect recommendation

## Recommended Connect integration plan

- Business model: Marketplace. ZOVRO collects customer payments and distributes provider proceeds.
- Customer access: no customer subscription fee.
- Provider access: no provider subscription fee for the current launch model.
- Introductory marketplace fee: 0% at launch / during the approved introductory period.
- Future marketplace fee: 10% of completed paid service requests when ZOVRO explicitly activates it after the introductory period.
- Dashboard: Express (lightweight view for providers), with embedded onboarding/components where available.
- Fee collection: ZOVRO manages pricing.
- Negative balance liability: ZOVRO.
- Charge pattern: Separate charges and transfers, so funds can be held before release and released only after service completion.
- Connected accounts: recipient configuration with transfer capability; verify transfer readiness before releasing provider funds.
- Transaction fee implementation: retain the ZOVRO fee by transferring less than the customer charge. Do not use `application_fee_amount` with separate charges and transfers.
- Current production value: keep `ZOVRO_PLATFORM_FEE_BPS=0` until ZOVRO intentionally activates the future fee.
- Future 10% value: `ZOVRO_PLATFORM_FEE_BPS=1000` only after the introductory period is formally ended.

## Payment lifecycle

1. Provider submits a service quote or an approved urgent-service amount is established.
2. Customer confirms and ZOVRO creates a Stripe PaymentIntent on the ZOVRO account.
3. A signed Stripe webhook marks the request paid and held.
4. Provider performs and completes the job.
5. Customer confirms completion or the approved completion workflow closes the job.
6. ZOVRO verifies that the provider connected account is transfer-ready.
7. ZOVRO creates a Transfer for the provider share.
8. During the 0% period, the provider share equals the service amount before Stripe processing costs borne by the platform configuration.
9. When the future 10% fee is activated, the provider transfer equals 90% of the configured service amount and ZOVRO retains 10% using the separate-transfer amount calculation.
10. Refunds before transfer are handled against the PaymentIntent; post-transfer reversals require a controlled support workflow.

## Production safeguards

- Store Stripe publishable key, secret key, and webhook signing secret only in approved production secret/environment configuration.
- Never commit Stripe live credentials to GitHub.
- Use idempotency keys for PaymentIntent, Transfer, and Refund creation.
- Verify every webhook signature and timestamp.
- Do not release funds until the provider payout/transfer capability is active.
- Do not automatically change the marketplace fee based only on a device clock or client value. Fee activation must be a controlled server-side production configuration change.
- Keep `ZOVRO_PLATFORM_FEE_BPS=0` for the current launch model.
- Enable Radar for Platforms / appropriate marketplace fraud controls before live scale.
- Keep payment events and internal request/payment state reconcilable by ZOVRO request ID and Stripe object ID.

## Current production blockers

Production payment routes must remain gated until all of the following are present and verified on the canonical Render API service:

- Stripe live publishable key.
- Stripe live secret key.
- Stripe live webhook signing secret for the canonical production webhook endpoint.
- Provider Connect onboarding enabled and at least one controlled provider test account transfer-ready.
- Signed live webhook delivery verified.
- Controlled real-payment test, refund test, and transfer test verified with evidence.
