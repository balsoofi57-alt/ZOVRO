# Password recovery activation

Implementation is disabled unless ZOVRO_PASSWORD_RECOVERY_ENABLED=true.

## Configuration on zovro-api-final
- TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN: server-only Twilio credentials.
- TWILIO_RECOVERY_VERIFY_SERVICE_SID: dedicated Twilio Verify service (VA prefix), reserved for password recovery.
- ZOVRO_PASSWORD_RECOVERY_ENABLED=true only after staging verification.

Do not reuse a service that manually approves verifications or serves unrelated authentication purposes. This implementation always checks the submitted code with VerificationCheck; it never marks a verification approved itself.

## Eligibility and deployment
Backend: zovro-final-deploy. Web: main. Merge the matching backend and web changes before activating.
Only active accounts with phoneVerified=true and a registered E.164 phone are eligible. New registrations currently default to unverified; do not bulk-mark them verified. Those users need a separately verified enrollment or support recovery process. This implementation does not create one.

## Required live evidence before enabling for users
1. Configure a dedicated Verify service and server credentials in staging. Retain existing notification SMS flags.
2. Test a consenting, previously verified test account: code delivery, wrong code, correct code, expiration, replay, old password rejection, and old-session rejection.
3. Verify workflow persistence across a real process restart and deployment, and confirm the existing database is durable. Automated unit tests reinstantiate the handler against retained mocked state; they do not establish database durability.
4. Keep a single backend process/instance with the current synchronous read/write database design. Multi-instance activation requires transactional compare-and-set for challenges and shared rate limiting.
5. Verify CORS from https://zovro.work and test the form on physical iPhone and Android.
6. Configure Verify geographic restrictions, Fraud Guard and spend limits. Existing IP limiting is process-local; per-number cooldown and challenge attempts are stored in workflows.

No real codes were sent and no credentials or production configuration changed during implementation. Automated tests use a fake provider.

## Tests
node --test backend/password-recovery.test.js

## API
GET /api/auth/recovery/status returns availability without credentials.
POST /api/auth/forgot-password accepts phone and returns a generic response and opaque challenge.
POST /api/auth/reset-password accepts challenge, code and newPassword. Codes expire after 10 minutes; at most five checks per challenge; requests limited to one per minute and three per hour per number. Successful reset consumes recovery attempts and revokes every account session.

Account responses are generic but provider timing may differ for eligible numbers; assess timing side-channel mitigation before public activation. Support fallback links open the email client and never send automatically.
