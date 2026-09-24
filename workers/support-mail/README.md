# Spacemail policy reply bridge — owner test only

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
