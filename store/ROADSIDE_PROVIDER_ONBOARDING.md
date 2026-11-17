# ZOVRO roadside pilot — provider onboarding and first-job checklist

Status: preparation only. Do not activate an unverified provider or collect sensitive IDs through public forms.

## Initial pilot staffing
Target 5–10 qualified providers across Dearborn and Detroit, Michigan. Recruit for tire assistance, jump starts, vehicle lockout, and towing. Do not advertise coverage or response times until shifts are confirmed.

## Provider intake (private, access-controlled workflow)
- Business/legal name and safe contact channel; operating city and service radius.
- Services offered, working hours, equipment, vehicle availability, and realistic ETA.
- Official identity verification and minimum age 18; use approved secure verification storage, not GitHub/issues/email attachments.
- Applicable licensing, registration, insurance and authorization for vehicle lockout/towing; verify with issuing sources where required.
- Payout onboarding through approved payments provider; never request or store bank passwords or raw card data.
- Acceptance of current terms, privacy, cancellation policy and service quality/safety rules.
- Admin records verification date, verifier, expiry and approve/reject outcome without storing sensitive documents in repository.

## Safety-specific service checks
- Lockout: confirm vehicle ownership/authorized access before service; refuse suspicious requests.
- Towing: confirm required local/state permits and insurance, equipment and destination, itemized price and consent.
- Jump start/tire: require appropriate safety equipment and provider training; no unsafe roadside positioning.
- All: escalate immediate danger to emergency services; ZOVRO is not 911.

## First paid request rehearsal (no live customer charge until owner go/no-go)
1. On signed TestFlight build, customer selects roadside category, confirms address/GPS pin and sees final disclosed price.
2. Test provider receives only eligible request, accepts, messages, and reports ETA/status.
3. Use authorized test payment; verify backend receipt/webhook and no duplicate charge; test failure, cancellation and refund.
4. Confirm support contact, receipt, completion, rating, and audit trail.
5. Verify push on signed physical device and fallback procedure; do not rely on Twilio SMS while A2P is unapproved.
6. Record device/build/time/result; stop on payment, identity, location, or safety failure.

## Provider outreach copy (English)
> ZOVRO is preparing a limited roadside-assistance pilot in Dearborn and Detroit. We are inviting qualified local providers for tire help, jump starts, lockouts and towing. Joining the pilot does not guarantee jobs or earnings. Provider commission is 0% during the first year. Participation requires identity and applicable business/insurance/license checks. If interested, reply with your services, coverage area and availability. Do not send identity documents by email or text; we will provide a secure verification process.

## Launch authorization record
| Gate | Status | Verified by | Evidence / date |
| --- | --- | --- | --- |
| 5+ approved available providers | BLOCKED | | |
| Signed-device request-to-completion | BLOCKED | | |
| Payment/webhook/refund end-to-end | BLOCKED | | |
| GPS, notifications, support | BLOCKED | | |
| Insurance/legal/store distribution review | BLOCKED | | |
| Owner approval for limited live jobs | NOT GIVEN | | |

Do not turn on real charges, change commissions, or publish provider personal data based on this document alone.
