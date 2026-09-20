# SMS safety follow-up — 2026-09-20

Based on release candidate 30f3068ef888b3140133407ecaf7e4d79ddbd39d.
Prepared on a separate branch; production and the existing release branch are unchanged.

## Changes

- Disabled/mock modes return empty TwiML rather than an SMS response. Disabled mode does not accept or decline jobs; signed STOP still records suppression. Twilio's own automatic opt-out replies are outside this application switch.
- Signed Advanced Opt-Out STOP/HELP/START metadata takes precedence over Body. Already-handled keywords return empty TwiML. START alone never restores application consent: users must opt in through authenticated preferences, and Twilio's block must separately be cleared.
- Added STOPALL, REVOKE and OPTOUT aliases.
- Multiple pending offers require selection in the app instead of choosing the newest offer by SMS. This is a fail-closed ambiguity guard, not per-offer reply addressing.
- Inbound SID hashes are stored in a dedicated sms_receipts table, in the same local transaction as job/consent changes. Duplicate requests return empty TwiML. Receipts do not depend on the 1,000-entry audit window.
- Schema 7 adds the receipt table in SQLite and PostgreSQL. Mirror serialization, restore, migration and parity tooling include it; existing application tables are retained. No production schema migration was run.
- Dispatch reloads current consent and offer state before each send and stores the gateway SID/status on the internal offer. A queued status is not delivery proof. No status-callback endpoint is introduced.

## Verification

- Full local `npm run qa:all`: PASS with an environment cleared of production credentials.
- New `sms-inbound-safety-test.js`: valid/invalid signed fixtures, accept/decline, duplicate processing, SQLite reopen after audit eviction, overlapping offers, STOP/START/HELP, Arabic and additional English STOP aliases, disabled-mode behavior, mocked SID persistence and stale-consent suppression.
- PostgreSQL serialization and restore were checked with an in-memory pg client, not a live PostgreSQL server. Real database migration, parity, backup/restore and restart checks remain required before promotion.
- No real SMS, push, payment, Twilio configuration change, Render secret change or production deployment was performed.

## External gates still open

1. Verify approved ZOVRO LLC A2P Brand and Campaign; approved sender associated with the same Messaging Service.
2. Configure private backend values TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN and TWILIO_MESSAGING_SERVICE_SID. Keep ZOVRO_SMS_MODE=disabled and ZOVRO_SMS_OFFER_TTL_MS=300000.
3. Confirm deployed code contains the reviewed SMS changes. Set PUBLIC_API_BASE_URL to the exact public API origin. Configure POST /api/webhooks/twilio/sms on that origin, without redirects, with valid HTTPS.
4. Configure Advanced Opt-Out keywords and confirmation copy consistently with the actual campaign, including instructions to renew consent in the app after START. Confirm application and Twilio suppression agree.
5. Run signed fixtures only against an isolated test database/transport. Do not trigger Twilio webhook tests or handset SMS under a no-real-message instruction.
6. Later, separately authorize an isolated physical-number test: explicit opt-in, delivered offer, acceptance, decline, expiry, STOP and subsequent suppression. Record redacted handset evidence, Twilio SIDs/delivery statuses, webhook outcomes and application state.
7. Only after all gates pass, intentionally promote and enable general live SMS.

## Deployment limitations

Existing PostgreSQL replication is asynchronous. This change does not establish cross-instance exactly-once behavior or eliminate the existing replication crash window. Promotion requires verifying the actual single-writer deployment, receipt parity and restart recovery. Receipt retention is currently unbounded; do not purge it casually because purging reopens the corresponding replay window. Keep delivery evidence from Twilio logs; an API accepted/queued response alone is insufficient.
