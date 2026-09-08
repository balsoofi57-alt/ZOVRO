# ZOVRO 1.0 Final QA Matrix

Use this matrix for the last release-candidate pass on web, Android, and iOS.

Status rule: record each row as `PASS`, `FAIL`, or `BLOCKED`, with evidence. Do not treat an untested row as passing.

## Account and security
- Register customer with valid phone/password.
- Register provider with service category.
- Reject duplicate phone registration.
- Reject weak password.
- Login succeeds with valid credentials.
- Login fails with invalid credentials.
- Profile update succeeds.
- Change password succeeds and revokes other sessions.
- Logout succeeds.
- Revoke other sessions succeeds.
- Account deletion requires explicit confirmation and removes active access.

## Customer request lifecycle
- Create standard service request.
- Create urgent/SOS roadside request.
- Optional address/landmark is retained correctly.
- Customer can view active requests.
- Customer can cancel according to rules.
- Completed request can be rated.
- Completed/cancelled requests remain consistent after refresh/relogin.

## Provider workflow
- Provider availability toggles correctly.
- Provider location share asks for permission only when used.
- Nearby eligible provider discovery works.
- First provider acceptance locks assignment.
- Other providers cannot overwrite accepted assignment.
- Status transitions: Accepted → On the way → Arrived → In progress → Completed.
- Provider cancellation returns job to an appropriate state when allowed.

## Messaging and notifications
- Customer/provider messages appear only to authorized request participants.
- Notification list is user-scoped.
- Mark notifications read works.
- Push template: new service request.
- Push template: provider accepted.
- Push template: job status updated.
- Real APNs/FCM delivery is tested on physical iOS and Android devices after production credentials are installed.

## Location and privacy
- Location permission is not requested at app launch unless needed.
- Nearby search works when permission is granted.
- Graceful error shown when permission is denied.
- No camera or microphone permission is requested by the current submitted feature set.
- Privacy, Terms, and Support links open correctly without requiring sign-in.
- Account deletion path is visible from profile.

## API / operations
Canonical production API: `https://zovro-api-final.onrender.com`

- `GET /api/health` returns HTTP 200.
- `GET /api/ready` returns HTTP 200.
- Production CORS allows approved web/mobile origins only.
- Rate limits return controlled errors.
- Security headers are present.
- Invalid/malformed JSON is rejected safely.
- Unauthorized protected endpoints return 401/403 as appropriate.
- Operational metrics endpoint remains protected by operations token.
- Store metadata and submitted binaries use the canonical production API, not `https://zovro-api.onrender.com`.

## PostgreSQL mirror validation and cutover
- Render Build Command is `cd backend && npm install`.
- `DATABASE_URL` points to `zovro-production-db` through Render's secret configuration.
- Initial verification runs with `ZOVRO_DB_MIRROR_MODE=mirror`.
- Schema creation completes successfully.
- Migration completes without a partial transaction.
- Row counts are validated for users, requests, messages, ratings, notifications, sessions, locations, verification, and audit data.
- Critical account/request records are manually spot-checked.
- Before cutover, readiness reports `databaseUrlPresent=true`, `pgModuleAvailable=true`, `postgresRuntimeReady=true`, and `mirrorOperational=true`.
- New writes are confirmed in both the safe source and PostgreSQL.
- Restart/redeploy preserves data.
- Backup/restore procedure is tested before public launch.
- Only after all mirror checks pass, switch to durable mode.
- After cutover, `/api/health` reports PostgreSQL, and `/api/ready` returns HTTP 200 with `ready=true` and `durableOperational=true`.

## Payments
Only after live payment integration is installed:
- Correct amount is calculated server-side.
- Successful payment is associated with the correct request.
- Declined payment is handled cleanly.
- Duplicate webhook delivery does not duplicate the transaction.
- Webhook signature validation is enforced.
- Cancellation/refund path is verified.
- Provider connected-account and payout readiness are verified.
- User receives clear payment/refund status.

## Android
- Debug APK installs on a physical Android device.
- Signed release AAB validates in Play Console.
- App ID is `com.zovro.app`.
- Production API connectivity works.
- Location permission UX works.
- Push permission and real FCM delivery work.
- Back navigation and app resume behave correctly.
- Store screenshots match the submitted app.

## iOS
- Signed archive builds for a physical iPhone.
- Bundle ID is `com.zovro.app`.
- TestFlight upload processes successfully.
- App launches from TestFlight.
- Production API connectivity works.
- Location permission string and UX are correct.
- Push permission and real APNs delivery work.
- Safe-area layout and keyboard/forms work on iPhone.
- Account deletion and legal links are accessible.

## Store review readiness
- Final public support email is live and monitored.
- Privacy URL is publicly reachable without sign-in.
- Terms URL is publicly reachable without sign-in.
- Support URL is publicly reachable without sign-in.
- Apple App Privacy answers match production behavior.
- Google Data Safety answers match production behavior.
- Content rating/age declarations are completed.
- No placeholder text or test credentials are visible.
- Reviewer notes explain the marketplace role and SOS/911 distinction.
- Screenshots come from the signed release build and do not claim unavailable features.

Release only when every core release gate is `PASS`. A non-core feature may be intentionally disabled only when it is absent from the submitted binary, screenshots, store text, privacy declarations, and reviewer claims.
