# Password recovery audit — 2026-09-30

Status: review only. This document does not enable recovery, change production settings, send messages, or reset any account. Based on the main branch at 2225a218b166923d125cde9cdcc626564a0008d0 and historical PR diffs; deployed API behavior has not been verified.

## Evidence and gaps

- Main contains password-recovery-client.js, but backend/password-recovery.js is absent from main. Historical PR #27 introduced a server module, tests and a two-line server-core.js hook. Do not copy it without reconciling current server behavior and dependencies.
- Historical PR #92 added email fallback. Its reset branch accepts an email code when status is email_pending, email_reserved, or email_sent. Require an explicitly confirmed delivery state before allowing email reset; test that pending, reserved, failed, expired and replayed codes cannot reset a password. A delivery acknowledgement must be authenticated and bound to a reservation to prevent stale acknowledgements.
- Historical PR #140 changed the current password minimum to 8 characters, while the old recovery tests and error text use 10. Reconcile server validation, tests and user-facing text with the current policy.
- Historical PR #27 documents risks around account enumeration by provider timing, per-process IP rate limits, synchronous database writes and multi-instance use. Evaluate these before activation.

## Proposed implementation gates

1. Confirm the deployed API source, database mode, frontend endpoint paths and approved recovery provider. No production credentials belong in this repository or this report.
2. Port only reviewed recovery code into an isolated branch with fail-closed configuration. Ensure only verified channels associated with the account are eligible; preserve generic public responses and safe rate limits.
3. Add automated tests for eight-character passwords, absent or ambiguous accounts, send failure, unconfirmed email delivery, expired/incorrect codes, replay, concurrent verification, rate limits, session revocation, and a process restart.
4. Run the repository QA suite and review the resulting diff. Test with a consenting test account and real device in staging before any production activation. Do not claim delivery or durability based on mocked tests.
5. Keep deployment, real SMS/email delivery and customer activation as separate approved actions.
