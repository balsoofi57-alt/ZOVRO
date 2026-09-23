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
