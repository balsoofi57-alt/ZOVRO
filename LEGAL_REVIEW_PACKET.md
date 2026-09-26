# ZOVRO Final Human Legal Review Packet

Prepared: September 26, 2026
App: ZOVRO 1.0.0
Bundle ID: com.zovro.app
Operator: ZOVRO LLC
Support: support@zovro.work

This packet is for final human legal review before public commercial launch. It does not replace legal advice or attorney approval.

## Documents to review

- `terms.html` — Terms of Service
- `privacy.html` — Privacy Policy
- `support.html` — Support and licensing disclosures
- `APP_PRIVACY_DATA_SAFETY.md` — Apple App Privacy / Google Play Data Safety preparation
- `store/listing.en-US.json` — Store listing, review notes, URLs, and release-gate disclosures

## Product facts the review must preserve

- ZOVRO is a marketplace connecting customers with independent local service providers.
- Providers are responsible for services they offer and for licenses/permits legally required for the service and location.
- ZOVRO does not impose a blanket license requirement where law does not require one.
- SOS / urgent roadside requests do not replace 911, police, fire, or medical emergency services.
- Location is used for location-dependent functionality such as nearby matching, service coordination, and live job/location features.
- Before provider acceptance, discovery responses restrict customer identity, address, precise location, and private messages.
- Account deletion is available in-app.
- Support operates through support@zovro.work and in-app workflows.
- Stripe handles production payment processing. Raw card data is not stored by ZOVRO application code.
- Current source has no advertising or cross-app tracking SDK.
- Automated support must not promise refunds, payment outcomes, emergency response, or legal determinations; those require human review.
- Push uses OneSignal but signed-device delivery is not yet verified at the time this packet was prepared.

## Human legal decisions required

1. Confirm marketplace / independent-provider language is appropriate for intended launch jurisdictions.
2. Confirm limitation-of-liability, warranty/disclaimer, dispute-resolution, governing-law, and termination language is sufficient for commercial launch.
3. Confirm payment, cancellation, refund, tip, provider payout, and chargeback language matches the live Stripe flows.
4. Confirm provider licensing/permit wording is appropriate across U.S. state/local jurisdictions and does not imply ZOVRO authorizes regulated work.
5. Confirm privacy disclosures cover account/contact information, precise/coarse location, messages, service requests, ratings, security/audit records, payment processor use, push identifiers, retention, and deletion.
6. Confirm SMS disclosures and STOP/HELP wording are sufficient before real transactional SMS is enabled.
7. Confirm any biometric/Face ID disclosure is appropriate for local-device unlock behavior and that no biometric template is claimed to be collected by ZOVRO unless that changes.
8. Confirm age/children language and minimum-age treatment.
9. Confirm public support/privacy/terms URLs and support@zovro.work as the official contact.
10. Confirm Apple App Privacy and Google Play Data Safety declarations against the final signed build.

## Release rule

Do not mark the final human legal-review gate CLOSED until an authorized human reviewer has approved the launch documents. Source-side preparation is complete when this packet, public documents, store metadata, and privacy/data-safety worksheet remain consistent with the final product.
