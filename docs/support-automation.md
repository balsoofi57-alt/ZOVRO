# Policy-based support replies

Prepared 2026-09-23; local implementation only. Not deployed; support mailbox is not connected.

`support-policy.js` supplies the app and the future email adapter with the same versioned responses. English, Arabic and Spanish are supported. In the app, the user can select a reply language or use automatic detection. Detection is heuristic; explicit selection takes precedence.

The initial FAQ paraphrases the current repository Terms, Privacy and Support pages, with source sections recorded. It does not imply final legal approval: the existing Terms still call for legal review and do not specify complete production payment terms. Financial questions therefore require human review; no fees, refund entitlements, amounts or deadlines are invented. Safety issues receive emergency guidance and require human review. Complaints and other unmatched questions are also escalated. The reply does not claim that a ticket or human notification already exists; submitting the ticket is a separate action.

This is a deterministic policy responder, not a connected generative AI model. Only exact normalized FAQ questions receive a FAQ answer, so unknown or multi-part questions do not receive guessed policy advice. Incoming customer messages cannot add or modify answers. If generative AI is added later, its output must remain grounded in approved sources and preserve the same escalation requirements.

## Updating recurring questions

1. Review support tickets to identify recurring questions; do not copy private customer details into the FAQ.
2. Add an entry in `support-policy.js` with `status: 'draft'`, an ID, source page/section, exact question variants and English/Arabic answers; add the Spanish answer under the same ID in `spanish`.
3. The owner reviews the answer against company policy. Only then set status to `published`, increment the policy version and add tests for all languages.
4. Run `npm run support:check` and review policy-source changes before publishing. The engine ignores draft entries. Customer messages never approve an answer.

## Email activation still required

`backend/support-email-draft.js` prepares response text and source links but always returns `sendEnabled: false`. It has no sending capability and does not create a human-review ticket. A mailbox transport must be connected to the verified support@zovro.work account before replies can go out.

Before activating that transport: authenticate inbound events; deduplicate message IDs durably; exclude bulk, delivery-error and automatic replies to avoid loops; verify reply recipients; apply rate limits; create a durable human-review ticket when required; record policy version and answer ID; and verify send/receive/reply behavior with controlled test mail. App ticket policy metadata is informational, supplied by the client, and must not be trusted by a future server-side automation worker. Such a worker must recompute the policy decision from the submitted question.

No mailbox credentials, external model keys, live email sends, repository push or deployment were performed for this implementation.

## Gate closure checkpoint — 2026-09-23

| Gate | Completed locally | Still required |
| --- | --- | --- |
| Policy-based multilingual support | Shared EN/AR/ES FAQ responder, explicit language selector, source references, unknown/payment/safety human-review decisions, disabled email draft adapter; support checks and full QA passed | Explicit authorization to push to balsoofi57-alt/ZOVRO after automatic approval review rejected the push; PR/CI/deployment verification; authenticated support mailbox transport and real controlled receive/reply test |
| Licensing policy | No blanket registration license requirement; service/location-specific legal duties explained in registration help and support FAQ in three languages; existing optional registration license field preserved; relevant checks passed | Publish and verify visible wording. This change does not implement or prove a nationwide licensing rules database or jurisdiction-specific enforcement |

Outlook Email was declined for this request; do not require or re-suggest it. The connected Gmail identity observed was zovro.llc@gmail.com, which does not establish access to support@zovro.work. A different verified transport or mailbox connection is still needed. Do not send customer mail or treat either deployment or live mailbox operation as complete based on local QA.
