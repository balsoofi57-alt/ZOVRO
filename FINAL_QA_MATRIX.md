# ZOVRO 1.0 Final QA Matrix

Use this matrix for the last release-candidate pass on web, Android, and iOS.

## Account and security
- Register customer with valid phone/password
- Register provider with service category
- Reject duplicate phone registration
- Reject weak password
- Login succeeds with valid credentials
- Login fails with invalid credentials
- Profile update succeeds
- Change password succeeds and revokes other sessions
- Logout succeeds
- Revoke other sessions succeeds
- Account deletion requires explicit confirmation and removes active access

## Customer request lifecycle
- Create standard service request
- Create urgent/SOS roadside request
- Optional address/landmark is retained correctly
- Customer can view active requests
- Customer can cancel according to rules
- Completed request can be rated
- Completed/cancelled requests remain consistent after refresh/relogin

## Provider workflow
- Provider availability toggles correctly
- Provider location share asks for permission only when used
- Nearby eligible provider discovery works
- First provider acceptance locks assignment
- Other providers cannot overwrite accepted assignment
- Status transitions: Accepted → On the way → Arrived → In progress → Completed
- Provider cancellation returns job to an appropriate state when allowed

## Messaging and notifications
- Customer/provider messages appear only to authorized request participants
- Notification list is user-scoped
- Mark notifications read works
- Push template: new service request
- Push template: provider accepted
- Push template: job status updated
- Real APNs/FCM delivery is tested after production credentials are installed

## Location and privacy
- Location permission is not requested at app launch unless needed
- Nearby search works when permission is granted
- Graceful error shown when permission is denied
- No camera or microphone permission is requested by current feature set
- Privacy, Terms, Support links open correctly
- Account deletion path is visible from profile

## API / operations
- /api/health returns 200
- /api/ready returns 200
- Production CORS allows approved web/mobile origins only
- Rate limits return controlled errors
- Security headers are present
- Invalid/malformed JSON is rejected safely
- Unauthorized protected endpoints return 401/403 as appropriate
- Operational metrics endpoint remains protected by operations token

## PostgreSQL cutover
- Schema created successfully
- Migration script completes without partial transaction
- Row counts validated for users, requests, messages, ratings, notifications, sessions, locations, verification and audit data
- Critical account/request records manually spot-checked
- /api/health reports postgres after cutover
- /api/ready reports ready=true after cutover
- Restart/redeploy preserves data
- Backup/restore procedure tested before public launch

## Payments
Only after live payment integration is installed:
- Correct amount calculated server-side
- Successful payment associated with correct request
- Declined payment handled cleanly
- Duplicate webhook does not duplicate transaction
- Webhook signature validation enforced
- Cancellation/refund path verified
- User receives clear payment/refund status

## Android
- Debug APK installs on physical Android device
- Signed release AAB validates in Play Console
- App ID is com.zovro.app
- Production API connectivity works
- Location permission UX works
- Push permission/delivery works
- Back navigation and app resume behave correctly
- Store screenshots match submitted app

## iOS
- Signed archive builds for physical iPhone
- Bundle ID is com.zovro.app
- TestFlight upload processes successfully
- App launches from TestFlight
- Production API connectivity works
- Location permission string and UX are correct
- Push permission/APNs delivery works
- Safe-area layout and keyboard/forms work on iPhone
- Account deletion and legal links are accessible

## Store review readiness
- Final public support email is live
- Privacy URL is publicly reachable
- Terms URL is publicly reachable
- Support URL is publicly reachable
- Apple App Privacy answers match production behavior
- Google Data Safety answers match production behavior
- Content rating/age declarations completed
- No placeholder text or test credentials are visible
- Reviewer notes explain marketplace role and SOS/911 distinction

Release only when all applicable rows are passing or explicitly documented as intentionally disabled for launch.