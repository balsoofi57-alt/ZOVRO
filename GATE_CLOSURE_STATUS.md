# ZOVRO Gate Closure Status

Checkpoint: 2026-09-09

## Repository / QA — PASS

- Release PR #1 remains Draft and mergeable.
- Current release head before this evidence commit: `9be8f59007e479737ce9493d6d7be4c6b4570228`.
- ZOVRO Full QA #165 completed successfully on that head.
- Production-vs-release parity review confirmed the newer release line preserves the production hardening for SOS validation, request-size/invalid-JSON handling, Stripe webhook idempotency, PostgreSQL readiness, and launch-readiness, while also retaining newer privacy, consent, biometric, Smart Match, and push protections.

## PostgreSQL — CONNECTION PASS / DURABILITY BLOCKED

- Render service remains intentionally in `ZOVRO_DB_MIRROR_MODE=mirror`.
- Application startup repeatedly reports `databaseUrlPresent=true`, `pgModuleAvailable=true`, and `postgresRuntimeReady=true`.
- `postgres_mirror_ready` has completed successfully; latest observed state remains `localRecords=0`, `remoteRecords=0`.
- Direct read-only SQL through the Render connector fails because that connector path does not negotiate the database's required SSL/TLS correctly. Do not weaken TLS.
- DB durability cannot be marked PASS until representative non-empty records are mirrored, row counts match, restart persistence is proven, and backup/restore/rollback evidence exists. Do not switch to `durable` yet.

## Stripe live — BLOCKED BY OWNER-CONTROLLED ONBOARDING

Connected live account: `Zovro` (`acct_1UD4qM2Ydn9Jl8bl`).

Verified current state:
- `charges_enabled=false`
- `payouts_enabled=false`
- `details_submitted=false`
- `card_payments=inactive`
- `transfers=inactive`
- live webhook endpoint count: `0`

Stripe reports the following currently due / past due fields:
- `business_profile.mcc`
- `business_profile.product_description`
- `business_profile.support_phone`
- `business_type`
- representative date of birth
- representative email
- representative first and last name
- `settings.payments.statement_descriptor`
- `tos_acceptance.date`
- `tos_acceptance.ip`

These identity/business/legal fields and Terms acceptance must be completed by the account owner and must not be fabricated or accepted by automation. Production publishable/secret/webhook secrets are also not exposed by the connected Stripe tools.

## OneSignal / push — CODE PASS / REAL DELIVERY BLOCKED

- OneSignal app ID: `7992b022-6c11-4a66-bad4-8cbd114266d0`.
- Server push, mobile registration, external-user binding, permission state, subscription state, tap routing, and native push readiness checks are implemented and included in `qa:all`.
- Active Subscriptions remain `0`.
- Render still lacks `ONESIGNAL_REST_API_KEY`.
- APNs credentials/capability, FCM credentials, and real signed iOS/Android installs are required before end-to-end delivery can be marked PASS.

## Production deployment — HOLD

- Current Render production branch: `zovro-final-deploy`.
- Current deployed commit remains `2eb66a874359abb28d632ad9d2d2f14885626c1c`.
- Do not move production to the release head until Stripe, push credentials/real-device delivery, database durability, signing/store access, support contact, and final legal/store declarations are complete.

## Remaining gates that require owner/external access

1. Complete Stripe owner identity/business profile/ToS and activate card payments + transfers.
2. Create Stripe production webhook and securely add production Stripe keys/secrets to Render.
3. Add OneSignal REST key to Render; configure APNs and FCM.
4. Install signed builds on real iPhone/Android devices and verify push + biometric behavior.
5. Produce signed Android AAB and signed iOS archive; upload to Play Console/TestFlight.
6. Establish a monitored public ZOVRO support contact and verify public support/privacy/terms URLs.
7. Complete final human legal review and store privacy/data-safety declarations.
8. Generate representative non-empty database traffic, verify mirrored row counts, restart persistence, backup/restore and rollback, then perform controlled durable cutover.
9. After all gates are PASS, deploy the final release SHA, run integrated customer/provider/SOS/payment/push lifecycle QA, mark PR ready, and proceed to store submission.
