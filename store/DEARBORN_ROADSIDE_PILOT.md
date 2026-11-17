# ZOVRO Dearborn–Detroit roadside pilot — operating gate

Status: APPROVED SCOPE, NOT YET OPEN TO CUSTOMERS (2026-11-17)

## Approved initial scope
- Geography: Dearborn and Detroit, Michigan. Dispatch radius must be based on actual provider coverage, not a guaranteed ETA.
- Services: tire help, jump starts, vehicle lockout, towing **only with appropriately qualified/insured providers**.
- Home services remain available as a future phase; do not delete existing categories or data.
- Keep the approved royal-blue design and existing year-one 0% provider commission policy.

## Required go/no-go checks (record evidence, do not assume PASS)
- [ ] Customer request from signed TestFlight build reaches an eligible nearby provider.
- [ ] Provider identity, service eligibility, business/insurance/license checks where applicable; owner approves each pilot provider.
- [ ] Accurate-enough GPS and address confirmation, including wrong-location correction; no unconditional <100m promise.
- [ ] Transparent quote/total, payment authorization, signed webhook confirmation, refund/cancel and double-charge prevention tested with approved test transactions.
- [ ] Provider accepts, messages, updates status, completes; customer receives status, receipt and support path.
- [ ] Push notification delivered on real iOS/Android signed device, with fallback if unavailable; SMS must remain disabled pending A2P approval.
- [ ] SOS messaging does not imply emergency response or replacement for 911.
- [ ] Support inbox monitored, account deletion and privacy/terms reviewed, incident/escalation owner named.
- [ ] Verify Play upload-key acceptance and Android internal-track build, or explicitly limit pilot to approved iOS TestFlight testers.
- [ ] Confirm app/store testing distribution terms and insurance/legal requirements for Michigan operations.

## Pilot execution
1. Recruit 5–10 providers without promising leads or earnings; verify eligibility before enabling them.
2. Use synthetic accounts and approved test transactions for end-to-end checks; preserve timestamp/build/result evidence.
3. Only after all applicable gates pass, owner explicitly authorizes limited real customer transactions and support coverage.
4. Monitor cancellations, provider response time, failed payments, wrong GPS and complaints daily; pause if safety or payment issues arise.

## Economics and scope control
- First-year provider commission remains 0%; do not silently add provider fees.
- Roadside prepayment may be used only after the payment/refund flow and total price are verified and disclosed.
- Do not advertise guaranteed earnings, response times, coverage or 24/7 availability without supporting evidence.
- Public App Store/Play rollout is separate from the limited pilot and requires store approvals.

## Evidence log template
| Date | Build / commit | Gate | Device / environment | Result | Evidence link | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| | | | | BLOCKED | | |
