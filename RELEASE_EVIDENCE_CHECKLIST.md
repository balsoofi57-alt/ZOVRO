# ZOVRO release evidence checklist

Verified checkpoint: 2026-09-11, 12:30 UTC. Owner: ZOVRO release maintainer (automated checks performed by Codex).
Release PR: [#1](https://github.com/balsoofi57-alt/ZOVRO/pull/1), Draft. Source and production are separate; no store launch is claimed.

## Evidence rules

- Missing evidence is BLOCKED, not PASS. Repository QA, a configured credential, an HTTP 200 or an unsigned build alone does not prove commercial launch readiness.
- Record exact source/deployed SHAs, timestamps, build IDs, environment, expected/actual results and links. Never commit secrets or customer data.
- Keep PostgreSQL in mirror mode until representative non-empty count/hash parity, restart persistence, backup/restore and rollback checks pass.

## Verified source and build evidence

| Check | Result | Evidence and scope |
| --- | --- | --- |
| Full QA | PASS | [Run #334](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34598884430), source `1e5393a7c0952aff66a09e0b8c58c452bfa4505e`. All 33 QA stages passed. Later source changes need their own applicable checks. |
| Website/release reconciliation | PASS | Merge `722278a338930ac67110f39875b7b885f77bf231` preserves approved design, maps, SOS, biometric/session, consent and private-profile features. Mobile resources exist and scripts load once. |
| Android compilation | PASS | [Build run](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34598595696), source `722278a338930ac67110f39875b7b885f77bf231`; debug APK and unsigned release AAB uploaded at 12:29 UTC. This is not release signing or installed-device validation. |
| Android artifact archive digests | PASS | Debug archive SHA-256 `5265a0d16bbd548b6a7d7468480411197f5c113e4486f4f52a24829e714bd8e1`; unsigned AAB archive SHA-256 `8e9c0b80df996f66de45fadea292287d3d5bc2e01c542a3c8fdfc8f3b1ba3de3`. These are GitHub artifact archive digests, not the contained APK/AAB file hashes. Artifacts expire 2026-09-25. |
| iOS verification coverage | PASS in source | Commit `6bc27e763499825d8a51935c421b6a99bb3f78f5` enables existing macOS simulator build on release-prep and root HTML/JS/CSS changes. [Run](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/34599149738) was running at this checkpoint; build success not yet claimed. |
| Encryption readiness | PASS in source | Runtime readiness now rejects absent/short profile-encryption keys with HTTP 503; byte-length boundary, multibyte values and no-secret-output cases tested. Not yet deployed to production. |

## Live production observations

Source: Render service/deploy tools and direct read-only HTTP requests, 2026-09-11.

- Primary service: `zovro-api-final`; branch `zovro-final-deploy`.
- Render's latest live deployment: `c95e6dc1640b9c649b889bbcce41fe57088adc57`, deployment `dep-dahkbsbl550s73ahl9ag`, finished 00:06:33 UTC.
- At 12:29:30 UTC, `/api/health` returned 200 and `database=sqlite+postgres-mirror`.
- `/api/launch-readiness` returned **503**, `launchReady=false`, blocker **stripe_secret**. Database runtime/connection, Stripe publishable and webhook configuration, OneSignal app/REST configuration, app secret and allowed origins were reported configured.
- The 12:29:27 startup log reported `stripeSecretPresent=true`; the runtime adapter reported `stripeConfigured=false`. This establishes an existing value that fails the adapter's accepted server-key format, not a working payment credential. The value itself was neither read nor disclosed. Correct configuration must be verified through runtime readiness and a real authorized payment lifecycle.
- Startup reported `profileEncryptionConfigured=true`. Runtime encryption readiness hardening remains on the release-prep branch.
- PostgreSQL remains `mirror`; a connected mirror does not prove durable recovery. No production records were created or changed in this verification.
- Public [Privacy](https://zovro-web.onrender.com/privacy.html), [Terms](https://zovro-web.onrender.com/terms.html), and [Support](https://zovro-web.onrender.com/support.html) each returned 200. Inbox monitoring and legal review are not established by those responses.

## Live Stripe observations

Source: connected Stripe account read, 2026-09-11. Account: Zovro, US, live mode.

- `charges_enabled=true`, `payouts_enabled=true`, `details_submitted=true`.
- `card_payments=active`, `transfers=active`.
- `requirements.currently_due` contains `company.tax_id`; error `verification_failed_tax_id_match` remains. Stripe reports an EIN/document mismatch and requires a matching document or corrected account EIN.
- Reported deadline: 2026-10-09 18:52:08 UTC. Current activation does not close the verification gate.
- No identity fields, EIN, documents, Terms acceptance, payment or payout were modified by this pass.
- Historical PR evidence reports a configured production webhook; this pass verified only backend webhook configuration presence, not successful signed Stripe event delivery.

## Remaining launch gates

| ID | Gate | Status | Exact next evidence |
| --- | --- | --- | --- |
| PAY-01 | Runtime Stripe credential | FAIL | Correct `STRIPE_SECRET_KEY` in primary Render service using the existing account's valid server credential, restart, and require `stripeConfigured=true`. Do not place credentials in GitHub, client assets, or chat. Credential validity and permissions still need an API transaction check. |
| TAX-01 | Company verification | BLOCKED | Authorized owner supplies IRS-matching legal name/EIN evidence or corrects account data; Stripe clears `company.tax_id`. Do not infer or fabricate identity information. |
| PAY-02 | Payment/webhook lifecycle | BLOCKED | Authorized success, decline, refund/cancel, replay protection and provider-transfer checks; Stripe delivery event IDs and successful signature verification. |
| PUSH-01 | Real mobile delivery | BLOCKED | APNs/FCM configuration, real signed iOS/Android device subscriptions, new request/acceptance/status delivery and notification tap routing. Server credentials alone do not pass this gate. |
| AND-01 | Android distribution | BLOCKED | Release-signed AAB, source SHA, contained file SHA-256, Play test-track acceptance and physical-device tests. Debug APK and unsigned AAB exist. |
| IOS-01 | iOS distribution | BLOCKED | Apple signing identity/provisioning, signed archive/IPA, TestFlight processing and device GPS/Face ID/payment/push tests. Simulator build is a separate gate. |
| DB-01 | Durable storage | BLOCKED | Representative non-empty production mirror data, `npm run db:verify:cutover` with equal counts/hashes, restart persistence, isolated restore and rollback verification. Only then consider durable cutover. |
| SUPPORT-01 | Support operations | BLOCKED | Public pages pass HTTP checks; monitored inbox send/receive/reply evidence still needed. |
| STORE-01 | Store submission | BLOCKED | Authorized Apple/Google records and roles, signed-build screenshots, accurate privacy/data-safety declarations and final legal review. |
| LIVE-01 | Integrated launch | BLOCKED | Identify final deployed backend SHA and signed mobile builds; customer/provider/request/SOS/payment/push/privacy/consent/support/deletion lifecycle passes. |

## Next execution order

1. Complete native CI on the release source and fix failures without claiming distribution signing.
2. Correct runtime payment configuration and resolve authoritative Stripe verification requirements.
3. Complete non-empty mirror durability/recovery evidence without changing mode prematurely.
4. Obtain signed-device payment/push/GPS/SOS evidence and finalized store/support/legal materials.
5. Deploy the reviewed final source and perform integrated acceptance before commercial rollout.

Production secrets/signing identities cannot be reconstructed from source. Preserve existing keys and records; missing account evidence remains explicit.
