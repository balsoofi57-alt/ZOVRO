# Payment integration status

Stripe Connect payment service and safety checks are implemented in the repository.

## Approved commercial model

- Customer subscription: none.
- Provider subscription: none for the current launch model.
- Marketplace fee now: 0% (`ZOVRO_PLATFORM_FEE_BPS=0`).
- Future marketplace fee: 10% (`ZOVRO_PLATFORM_FEE_BPS=1000`) only after ZOVRO intentionally ends the introductory period.
- Charge pattern: separate charges and transfers.
- Provider proceeds are released only after service completion and transfer-readiness verification.

## Production state

The canonical Render API still reports Stripe production credentials as absent, so production payment routes must remain inactive until the following are configured and verified:

- Stripe live publishable key.
- Stripe live secret key.
- Stripe live webhook signing secret.
- Provider Connect onboarding and transfer capability.
- Signed production webhook delivery.
- Controlled real-payment, refund, and provider-transfer verification.

Do not switch the platform fee to 10% during launch testing. Keep the production fee at 0 until the approved introductory period ends.
