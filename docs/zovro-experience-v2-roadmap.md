# ZOVRO Experience 2.0 — implementation roadmap

**Owner direction (2026-11-16):** Make the ZOVRO marketplace feel intelligent, premium, reliable, and unusually easy to use. Preserve the currently approved dark royal-blue visual identity and existing request, payment, location, identity, and safety rules.

## Design principles

1. **One clear next action.** A customer can search, choose a service, review the location and cost, and confirm without duplicate shortcuts.
2. **Intelligence assists; the customer decides.** Suggestions are not professional diagnoses. Do not submit or charge automatically.
3. **Trust beats engagement tricks.** Return visits come from usefulness, reliability, transparent pricing, safe service providers, and tasteful optional reminders — not compulsive loops or spam.
4. **Location with honesty.** Do not claim GPS precision under 100 m unless reported accuracy supports it; allow movable pins and manual correction. Ask permission in context; auto-update city only with granted permission.
5. **Performance and accessibility.** Fast primary screens on low-end devices, 44 px minimum touch targets, visible focus, readable type, reduced-motion support, four primary navigation destinations, and clear error recovery.
6. **No stealth breaking changes.** The existing approved look, request lifecycle, backend authorization, support options, and live apps must remain intact.

## Phase 1 — implementation in this pull request

- [x] Combine literal catalog matches and existing local smart-match rules into one ordered home-search suggestion interface.
- [x] Only preselect a service when confidence is strong and unambiguous; final user review remains mandatory.
- [x] Optional tap-initiated English voice-to-search on supported browsers; transcript is editable; never auto-submit.
- [x] A recent completed service can be requested again without importing a previous address, GPS position, or notes.
- [x] Link from active-service summary to My Requests.
- [x] Refine the existing dark navy / silver surfaces without overhauling approved navigation.
- [x] Add regression checks and update cache versions.
- [ ] Run full QA and browser/native preview; fix failures before merge.
- [ ] Verify real phone behavior before preparing a store build.

## Phase 2 — reliability and trust

- Precisely report GPS accuracy: show an accuracy indicator, request a manual pin if device accuracy is coarse, and keep all background location sharing opt-in with clear controls.
- Offer a single customer confirmation screen showing service type, destination, pricing basis, fees, provider eligibility, and cancellation rules.
- Show provider identity verification status and applicable credentials without exposing raw identification documents; ensure role-based access.
- Make provider ETA confidence explicit; provide recovery paths if a provider cancels or fails to arrive.
- Improve account/password recovery, offline/network error states, and contrast on iPhone and Android.
- Measure reliability with privacy-conscious aggregated counts; never collect precise route histories merely for product analytics.

## Phase 3 — genuinely useful intelligence

- Optional server-side natural-language assistant for requests that the on-device catalog cannot resolve. Strip personal identifiers, ask permission before processing photos/audio, disclose limitations, and fall back to manual choice.
- Guided triage for roadside, home, and vehicle jobs, with safe questions matched to the selected service.
- Real-time matching that weighs verified provider qualification, distance, availability, and predicted arrival time.
- Repeat booking/favorites and useful reminders with opt-in and simple notification preferences.
- Photo analysis only after consent and with explicit uncertainty. Never use an automated guess as a safety diagnosis.

## Phase 4 — complete premium service experience

- Transparent quotes, Stripe-ready payment flow only after verified activation, invoices, dispute handling, ratings, and customer support.
- Provider dashboard with availability, navigation, job statuses, chat, earnings and payouts, with verification before activation.
- End-to-end iOS TestFlight / Android internal testing with accessibility audits, latency checks, crash monitoring and release gates.

## Acceptance criteria

- A user may request help from an empty search without being forced to describe the problem.
- Text search and optional voice input always lead to the *existing* request-review flow, not a submitted request or charge.
- When search intent is ambiguous, no professional trade is silently assumed.
- A repeat booking does not reuse the last service address or old incident description.
- The primary interface stays English-only and preserves the approved dark royal-blue theme.
- All changes must pass automated QA and device review before deploying to the main production branch.
