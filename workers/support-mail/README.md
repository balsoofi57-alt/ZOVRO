# Spacemail policy reply bridge — owner test only

## Company support alerts — approved 2026-09-24

The owner explicitly requested support alerts at `zovro.llc@gmail.com`. `alerts.js --notify` sends aggregate queue alerts from the existing support mailbox to that fixed company address only. No customer content or sender identities are included. Stale reservations/unconfirmed deliveries alert immediately once eligible for the review queue, limited to one attempted urgent alert per rolling hour; other overdue categories alert at most once per six hours. `--test` sends a separately throttled connection test (once per 24 hours). Reservations are committed before SMTP in the additive `zovro_support_mail_alerts` table; uncertain delivery consumes the window and is not immediately retried.

`cycle.js` runs the existing independently gated worker, then checks alerts even when the worker fails. Its child processes have timeouts. The intended ten-minute command is `timeout --signal=TERM --kill-after=15s 180s node workers/support-mail/cycle.js`. Sending mode remains `disabled`; this enables notifications about the recorded review queue, not customer replies or ingestion of new inbox messages. PostgreSQL/SMTP outages may prevent notification; a failed cycle still exits nonzero for the existing hosting failure notifications. This is not an independent uptime monitor.

The alert check creates only its dedicated table/index if missing. It does not modify receipts, review dispositions or the mailbox cursor. Disable company notifications by restoring the original worker-only cron command; retain alert history. Customer mode remains absent from this deployed owner-test branch.

Verified live checkpoint: commit `1fc81cfbdcf0893683854bf4169ad7471afbaeb7` passed all 42 tests and the PostgreSQL integration in GitHub Actions run `35998467300`, including simultaneous notification deduplication and backup preservation. Render built that commit successfully on 2026-09-24 at 12:21 UTC. The authorized connection test was received in the company Gmail INBOX at 12:22:52 UTC (message `1a0d35eb66b9bad0`); the complete body and receiving SPF/DKIM pass results were verified. The saved ten-minute command now runs `cycle.js` with the 180-second outer timeout. A real manually triggered run at 12:23:48–12:23:56 UTC logged the worker as disabled, alerts as healthy, and completed successfully. No customer sending was enabled. The first test created the additive alerts ledger; existing review/cursor/receipt data was retained. A future scheduled run uses the same saved command; no need to run the connection test repeatedly.

Current status: owner-only sending was deployed and verified on 2026-09-24. Persistent scheduled sending is disabled. Later sections retain historical checkpoints; use the latest dated validation and the operational recovery instructions below for current limits. General customer mode is not implemented.

This separate, one-shot process reads **new** INBOX messages over TLS IMAP and can send policy replies over TLS SMTP. It uses the existing deterministic EN/AR/ES policy responder; it is not a generative AI model. It is not imported by the production API and does not run automatically when the app deploys.

## Modes

- `disabled` (default): no connections or sends.
- `preview`: records decisions in a dedicated PostgreSQL receipt table without SMTP sending. Previewed messages will not later be sent automatically; send a new test message for the test stage.
- `test`: only messages from `zovro.llc@gmail.com`, addressed to `support@zovro.work`, can receive a policy reply. The recipient must also be explicitly configured. Other senders never receive mail from this version.
- Customer/live sending is deliberately unsupported pending real test evidence and review.

Only exact approved FAQ matches send a test answer. Other questions, including refunds and safety, are recorded for manual review, with the original message left untouched in INBOX. No automated human notification or support dashboard queue is implemented yet. Query the receipt statuses and review the inbox; do not claim an escalation was delivered to an operator.

## Required secure configuration

Set these as service secrets, never in Git or chat:

- `ZOVRO_SUPPORT_MAIL_USER`: `support@zovro.work`
- `ZOVRO_SUPPORT_MAIL_PASSWORD`: mailbox credential supplied by the owner through the hosting provider's protected settings. A signed-in browser session does not supply this credential to the worker.
- `ZOVRO_SUPPORT_MAIL_DATABASE_URL`: dedicated durable PostgreSQL connection with permission to create/access only the bridge tables where feasible.
- `ZOVRO_SUPPORT_MAIL_MODE`: `preview`, then `test` after review.
- `ZOVRO_SUPPORT_MAIL_TEST_RECIPIENT`: `zovro.llc@gmail.com` for test mode.

Spacemail settings verified from official provider documentation: `mail.spacemail.com`, IMAP 993 and SMTP 465 with TLS. Certificate verification remains enabled. Provider reference: https://www.spaceship.com/en-GB/knowledgebase/connect-spacemail-to-email-client/

## Execution

From `workers/support-mail`: `npm ci`, then `npm test`.

After secure configuration, explicitly run `node worker.js --initialize` once. It captures the current UID watermark and does not answer historical messages. Then send **new** owner-approved test messages. Run `node worker.js` per processing cycle. There is no internal timer: the deployment owner must configure a scheduled job or queue worker separately. No paid Render service or scheduler has been provisioned.

A PostgreSQL advisory lock serializes runs. Durable reservations precede SMTP; a crash, SMTP timeout or database failure after possible delivery results in no automatic resend. This favors avoiding duplicates over guaranteed delivery. Review `reserved` or `delivery_unconfirmed` records manually. A changed UIDVALIDITY stops processing for review. Never reset the cursor to replay old mail blindly.

Each run considers at most 25 messages; raw messages over 256 KiB are not parsed and remain in the inbox for manual review. Attachments, HTML-only messages, automated messages, list mail, conflicting Reply-To addresses and messages not addressed to support are not answered. IMAP opens read-only; messages are not deleted, moved or marked read. Message bodies, subjects, email addresses and credentials are excluded from logs and receipt records. A SHA-256 key identifies a message for deduplication.

## Remaining launch gates

Local fake-transport tests do not prove real IMAP/SMTP connectivity, PostgreSQL durability or mail delivery. Before customer mode is implemented: verify the secure deployment configuration; run an isolated real PostgreSQL crash/restart test; verify three-language owner-test delivery and received headers; implement operator review/notifications and operational monitoring; agree on scheduling costs and permissions; add sender authentication/rate limits appropriate to customer traffic. Browser login and past manual mailbox verification are separate evidence.

## Verified owner-test checkpoint — 2026-09-24

This checkpoint supersedes the earlier statements that no scheduler was provisioned or real delivery was verified. Render service `zovro-support-mail` exists on the Ohio Starter plan with a ten-minute schedule. Its persistent mode remains `disabled`. Tests used a temporary process-local `test` mode, restricted to the owner's company Gmail account. Customer sending remains unsupported.

- IMAP authentication and SMTP verification succeeded with the saved support mailbox credentials.
- Corrected the malformed bridge database URL using the existing production database's internal connection URL. A rebuild of the same deployed commit `3bc11d83824e11a2accae195444a25a759379f9b` succeeded with all 13 original tests. A fresh shell returned `DATABASE_CONNECT_OK` from a real `SELECT 1`.
- Initialized the mailbox cursor once; historical messages were not answered, moved, deleted or marked read.
- Received three real license-policy replies in the owner's Gmail inbox: Arabic at 11:29 UTC and English/Spanish at 11:31 UTC. Inspected the complete reply bodies and receiving Gmail authentication headers: SPF and DKIM passed for all three.
- An unmatched owner question produced one durable `human_review` receipt and no automatic reply. This is a database status, not delivery of an operator notification or creation of a staffed ticket.
- A subsequent fresh worker process left the totals at three `sent` receipts and one `human_review` receipt, with no duplicate reply. This verifies normal process-restart behavior; it does not prove crash recovery during SMTP or database outage, or backup/restore.

The follow-up source change validates PostgreSQL URL structure before integrations open. It rejects malformed URLs without including credentials in the error. All 14 local bridge tests pass. This change is proposed separately and is not yet deployed.

Outstanding before general customer use: implement/review customer mode, trusted inbound sender validation and appropriate sender rate limits, an actionable operator review workflow and monitoring, and controlled crash/recovery evidence. Customer activation needs owner approval after these safeguards are ready. Do not enable customer traffic by changing `test` mode or removing its recipient restriction.

## Proposed operator review workflow (not deployed)

The follow-up review CLI provides a private operator queue. It does not turn on replies, create a dashboard, notify an operator, or mark messages read. After deploying this code, the next explicitly authorized non-disabled worker run creates the additive `zovro_support_mail_reviews` table. Existing receipts and cursors are preserved. There is no automatic schema change while the worker is disabled; review commands themselves do not migrate the database.

From `workers/support-mail` in a protected operator shell:

```sh
npm run review -- summary
npm run review -- list
npm run review -- inspect RECEIPT_KEY
npm run review -- resolve RECEIPT_KEY --resolution answered_manually --confirm RECEIPT_KEY
```

`summary` reports counts and oldest pending dates; `list` returns the oldest 100 unresolved records. Repeat after resolving that page to reach later records. The queue includes human review, unconfirmed sends, skipped messages, oversized messages and reservations older than ten minutes. Skipped messages include automated/list mail and need operator triage; not every skipped item requires a reply. Fresh reservations are excluded from the queue and cannot be resolved while a normal bounded worker run could still be active. Oversized new mail now receives a durable receipt before the cursor advances; historical oversized messages without receipts are not backfilled.

`inspect` retrieves only the IMAP envelope (subject, sender and Message-ID), with a read-only mailbox lock and UID-validity check. Find the original message in the support inbox and review/reply there. Its output is private customer metadata: use only a protected interactive shell, never scheduled logs, public reports or shared screenshots. It does not fetch bodies, render HTML or open attachments. A missing original message or changed mailbox identity stops inspection.

Resolve only after manual handling, selecting `answered_manually`, `no_action` or `verified_delivered`. The same receipt key must be repeated after `--confirm`. Resolution is idempotent and stored separately from the immutable delivery receipt; it never resets the cursor, erases history or retries SMTP. A false `resolved` result means the record was already resolved or is not eligible. Operator identity currently relies on host/account access auditing; there is no application-level operator identity or role-management layer yet.

This completes a code-level operator workflow, not a staffed or deployed support service. An owner still needs to assign monitoring responsibility, deploy/verify the additive schema and CLI, and arrange notifications if desired. Customer mode, trusted inbound authentication, per-sender rate limits and crash/recovery validation remain separate launch gates.

## Proposed sender guards, budgets and health logs (not deployed)

This follow-up implements candidate sender authentication and durable send budgets while retaining the owner-only test restriction. It does not add or activate customer mode. The older deployed three-language tests did not run these new guards; repeat controlled tests after deployment before treating them as production-verified.

Incoming raw MIME is verified with pinned `mailauth` 5.0.3; Node >=22.19.0 is required. See the upstream [DKIM verification API](https://github.com/postalsys/mailauth#dkim-verification). The worker does not trust a message's supplied `Authentication-Results` or `Received-SPF` headers. It requires a passing SHA-256 DKIM signature with exact From-domain alignment, a valid signature time, a full-body signature and signed From, To, Message-ID and present MIME content headers. Duplicate identity/content headers, weak RSA keys, excessive signatures, unsigned mail, altered bodies, DNS failures and unverifiable messages cannot authorize a send. DNS work is bounded. Authentication failures enter the operator queue.

This is a deliberately strict domain-authentication policy, not full SPF/DMARC/ARC processing or proof of an individual's identity. Valid mail with relaxed domain alignment, SPF-only authentication, forwarding changes or unsigned required headers can require human review. Test delivery from the intended providers before customer rollout; do not loosen the rule automatically to improve acceptance.

Durable reservations enforce three conservative rolling budgets: 3 replies per normalized sender per hour, 30 replies for the support mailbox per hour, and 100 per day. Reservations, sent replies and unconfirmed deliveries consume the budget; a timeout is not permission to retry. PostgreSQL transactions and an advisory transaction lock serialize count-and-reserve operations. Duplicates do not consume another reservation, and database failures stop processing before SMTP. Rate-limited messages are recorded for manual review and are not automatically replayed later.

An additive `sender_hash` column stores SHA-256 hashes of normalized sender addresses for rate accounting, not plaintext addresses. Hashes are pseudonymous identifiers, not anonymization; access and retention controls still apply. The additive index and column are created by an authorized active worker run. Old receipts have no sender hash and still count toward global limits.

Active worker runs emit `support_mail_health` with pending status counts and oldest pending timestamps, including runs with no new mail. No sender addresses, subjects, message bodies, credentials or raw authentication errors enter health logs. Operators can also run `npm run review -- summary`. Disabled runs continue to open no connections. These logs are monitoring signals, not configured alerts or a staffed response process.

Validation: 30 local tests pass, including real RSA DKIM signing/verification fixtures, tampered MIME/header rejection, fail-closed DNS/partial-signature cases, no SMTP after authentication/rate denial, and transaction rollback behavior. Actual schema and budget queries also passed with embedded PostgreSQL (PGlite), including sender/global/hour/day limits and duplicate suppression. This does not prove deployed DNS reachability, production concurrency or crash recovery during SMTP. Deployment, provider-specific tests, external alerting/ownership and crash/recovery evidence remain required before customer activation.

Dependency review on 2026-09-24 found vulnerable transitive versions initially bundled by mailauth. Scoped overrides use the project's pinned Nodemailer 10.0.10 and Joi 18.2.5. All signature/MIME tests pass with these overrides, and `npm audit --omit=dev` reports zero known vulnerabilities for the resulting lockfile. Keep the overrides and lockfile together and recheck on upgrades.

## Deployed owner-only validation — 2026-09-24, 11:52–11:55 UTC

With owner approval, Render's existing support-mail service was switched to `feature/support-mail-sender-guards-20260924` and manually built at commit `d3b3204f87b15e1a6c9cb73b3aa1417017a9072d`. Build succeeded, including all 30 tests. Runtime Node was v22.23.3. This supersedes the preceding not-deployed labels for the code in PRs #47–49. Those PRs were not merged to main; the isolated service is running the reviewed branch. Auto-deploy remains off.

- A process-local owner-test run successfully applied the additive review/rate schema while preserving the existing cursor and receipts.
- Three new real messages from the company Gmail address passed the raw-MIME DKIM guard with production DNS. The resulting Arabic, English and Spanish marketplace-policy replies arrived in the owner's Gmail inbox at 11:53 UTC. Complete bodies and Gmail SPF/DKIM pass results were inspected.
- A fourth authenticated owner message was recorded as `rate_limited` at 11:54 UTC, without SMTP sending. A subsequent fresh worker process produced only health output and did not resend prior messages.
- The deployed operator CLI listed the earlier unmatched owner-test case, fetched its correct envelope read-only, and recorded `no_action` for that known test. Its original human-review receipt remains in the database; the separate disposition removes it from the pending queue. The rate-limited test remains pending for inspection.
- Final cumulative database receipt totals: 6 sent (3 before these guards and 3 after deployment), 1 human-review receipt (resolved separately), and 1 rate-limited receipt. The persistent scheduled mode remains `disabled`; manual tests used temporary process-local `test` mode only.

Limits: these results verify Gmail-to-Spacemail owner mail, normal fresh-process replay prevention, sender-hour denial, and the operator workflow. They do not establish other-provider acceptance, global-budget production stress, ambiguous SMTP crash recovery, backup/restore, external monitoring alerts or general customer readiness. Customer mode is still unsupported and no customer sending was activated.

## Isolated process recovery validation — 2026-09-24

`npm test` now includes six recovery scenarios that execute the real `processMessage` in separate Node processes. Four terminate the process with SIGKILL: before reservation, after reservation, after simulated remote acceptance, and after saving the sent receipt. Two simulate lost SMTP acknowledgement and failure to persist the send result. Each starts two fresh processes against the retained test receipt and checks the total simulated remote acceptances. All 36 tests pass.

A crash before reservation permits the next process to send once. Once reserved, replay never sends again: a crash before SMTP can therefore leave an unsent message requiring human review. Acceptance followed by an interrupted or failed status update leaves a reserved or delivery-unconfirmed receipt, also requiring review. This is at-most-once sending after a durable reservation, not guaranteed delivery.

The harness uses a temporary filesystem receipt adapter and simulated SMTP acceptance, with no production credentials or network calls. It verifies bridge process recovery under the durable-store contract, not PostgreSQL server failure, disk/power loss, worker cursor integration, real SMTP transport crashes, concurrency or backup restoration. The fixture is single-process and must not be used as a production store. No runtime code, Render configuration or customer-send setting changed for this validation.

## PostgreSQL integration and read-only monitoring

The support workflow now runs on the isolated sender-guard branch as well as the deployment branch. Its separate PostgreSQL 16 service contains only disposable fixture data. `integration/postgres.cjs` exercises the actual worker with real PostgreSQL and fake IMAP/SMTP/authentication adapters: a killed sender process, lost SMTP acknowledgement, cursor replay, changed UID validity, simultaneous reservations, and logical dump/restore of receipts, cursor and operator dispositions. The suite only accepts a localhost database named `zovro_support_test`, creates a random private schema and drops only that fixture schema. It never targets Render or reads production credentials. A CI run must succeed before this is treated as verified integration evidence; it does not test provider SMTP or a PostgreSQL server/power failure.

`node workers/support-mail/monitor.js` is an explicit read-only check, usable even when the scheduled sender remains disabled. It reports aggregate counts only. Exit 0 means no urgent/overdue items; exit 2 means an uncertain delivery/stale reservation or an unresolved category whose oldest item is at least one hour old; exit 1 means monitoring failed. `overdue` counts all records in an overdue category, not individually aged messages. It does not inspect inbox backlog that has not yet been processed, send notifications, resolve reviews or migrate schema. A successful empty result does not prove that the worker is scheduled or reading new mail.

To operate this check, the owner must explicitly choose its schedule and verify the hosting provider's failure notification destination and actual delivery. Do not append it to the deployed command and assume somebody was notified. No monitoring schedule or external alert destination was changed by this code update.

## Recovery procedure

1. Keep the sender disabled during any database recovery. Stop active sender processes before restoring. Retain the failed database and its receipts for reconciliation; do not clear tables or reinitialize the mailbox cursor.
2. Restore the cursor, receipts and reviews from the same consistent backup into an isolated database first. Verify mailbox UID validity, counts and review dispositions. A changed UID validity requires manual reconciliation, not resetting the watermark.
3. A backup older than an accepted email can omit its reservation. Replaying from that backup can send a duplicate. Reconcile all messages after the backup boundary against retained receipts and provider/inbox evidence before allowing processing. The automatic no-retry guarantee depends on preserving committed reservations; it does not survive loss of that history.
4. Inspect stale `reserved` and `delivery_unconfirmed` cases individually. If delivery is proven, resolve `verified_delivered`; otherwise manually decide whether a reply is appropriate. Never delete a reservation to force a retry. A manual reply is recorded as `answered_manually` only after the operator has sent it.
5. Verify the restored worker with company-only new test messages and review health output. Resuming a restored production service requires an explicit reviewed decision; this runbook does not authorize restore or customer activation.

Remaining operational decisions: assign a person to review the support inbox and urgent queue; verify external alert delivery; establish actual Render backup recovery/reconciliation evidence; implement and review customer mode before separately approving activation. The existing owner-only deployment is not a general customer autoresponder.
