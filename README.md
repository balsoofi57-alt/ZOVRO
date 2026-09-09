# ZOVRO

ZOVRO is a local-services marketplace for fast access to roadside assistance, mobile mechanics, plumbing, electrical, HVAC, appliance repair, moving, lawn/snow, pest control, and other nearby services.

## Release branches

- `store-release-prep` — current release candidate and evidence branch.
- `zovro-unified-latest` — synchronized safety copy of the latest verified release candidate.
- `zovro-final-deploy` — current Render production branch. Keep production on this branch until launch gates pass.

## Current verified checkpoint

- Release candidate head: `0948beb72d28c6298af37dcf58cd5167a6ad8e0d`.
- ZOVRO Full QA #162: PASS.
- Push repository readiness includes server delivery, mobile registration, permission handling, external user binding, tap routing, native Android notification permission guard, and launch-readiness diagnostics.
- PostgreSQL must remain in `mirror` mode until representative non-empty persistence, restart, backup/restore, and rollback checks pass.
- Production payments remain disabled until Stripe onboarding, production keys, webhook validation, and lifecycle evidence are complete.
- Production push remains blocked until the OneSignal server REST credential, APNs/FCM configuration, and real-device subscriptions are available.

## Safety rules

- Never commit production secrets, database passwords, signing keys, certificates, Stripe secret keys, webhook secrets, or OneSignal REST keys.
- Do not move PostgreSQL from `mirror` to `durable` without persistence evidence.
- Do not deploy the release candidate to production until the external launch gates in `RELEASE_EVIDENCE_CHECKLIST.md` are satisfied.

See `PUSH_RELEASE_STATUS.md`, `RELEASE_EVIDENCE_CHECKLIST.md`, `FINAL_QA_MATRIX.md`, and `STORE_SUBMISSION.md` for current release evidence and remaining gates.
