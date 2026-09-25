# In-app support assistant

Twenty help topics have curated English, Arabic and Spanish responses. The existing published policy library and its mailbox behavior remain unchanged. App questions use the expanded catalog; unknown or sensitive matters recommend customer support.

## Live AI connection

Server environment:
- `ZOVRO_SUPPORT_AI_ENABLED=true`
- `OPENAI_API_KEY`: a server-only project key, entered directly in hosting secrets.
- `ZOVRO_SUPPORT_AI_MODEL`: optional; defaults to `gpt-4o-mini`.

`GET /api/support/status` reports configuration only, not successful provider delivery. A real paraphrased question with AI opted in must succeed with `mode: ai-assisted` before the live integration is considered verified. Missing credentials, provider failures, refusals, incomplete outputs and low-confidence classifications fall back to a human-support recommendation.

AI selects an ID from the approved catalog using the Responses API and strict structured output. The server returns the corresponding curated answer, never free-form model copy. It has no account, payment or provider-action tools. Sensitive and known-policy questions bypass AI. Per-IP throttling, four concurrent calls per process, request length limits and a 10-second provider timeout bound usage. Configure account spend limits with the provider before broader rollout.

The chat shows an unchecked AI consent option only when configured. It sends the question and at most three previous user questions after opt-in. Email addresses and number-like sequences are masked before the provider request. This is not comprehensive anonymization. No account profile, access token or service records are sent to the model. `store:false` is used; this does not promise zero provider retention. Do not submit passwords, verification codes or card details.

Official implementation reference: https://developers.openai.com/api/docs/guides/structured-outputs

## Human support boundary

Contact customer support saves an authenticated support ticket with the transcript, category and safety priority. A receipt appears only after a record ID is confirmed. View support requests opens the existing in-app ticket list. This is asynchronous ticket review, not live chat or a phone call. An official customer-service number, staffed agent connection and response-time commitment have not been provided. Guest account recovery still needs a verified recovery method; this feature cannot establish identity or unlock accounts.

## Verification

`node --test backend/support-assistant.test.js` exercises language coverage, route selection, consent, missing configuration, safety/payment escalation, invalid selections, low confidence, rate limits, text limits, redaction and provider outages. It is included in `npm run support:check` and full QA. Provider responses are mocked; successful unit tests do not demonstrate real AI connectivity or staffed support.
