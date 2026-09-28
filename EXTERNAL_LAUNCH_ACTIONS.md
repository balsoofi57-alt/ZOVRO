# ZOVRO External Launch Actions

Checkpoint: 2026-09-28
App: ZOVRO 1.0.0
Bundle / package: com.zovro.app

This file lists only launch work that still requires an external authenticated account, store/provider approval, or a real physical device. Source/build/runtime gates already closed elsewhere should not be repeated here.

## 1. Google Play

Current state:
- Developer/account/organization/contact verification: complete.
- Privacy, ads, government, health, Advertising ID, financial-feature declarations: saved.
- Store listing text: saved as draft.
- Category: Travel & Local.
- Dedicated upload key and signed AAB: prepared and verified.
- Safe GitHub workflow for internal-draft upload: present on main.
- Play Console authenticated session: currently unavailable.

PASS requires:
1. Authenticate to Google Play Console.
2. Upload the verified signed AAB to Internal testing, or run the guarded GitHub workflow with upload_google_play=true after protected secrets are available.
3. Confirm Play accepts the upload and assigns/accepts the versionCode.
4. Complete reviewer sign-in details without exposing credentials in source.
5. Complete/confirm Content rating, Target audience, Data Safety and any remaining App content declarations.
6. Roll out to Internal testing only.
7. Install from Play Internal testing on a real Android device.
8. Record GPS, login/session, request flow, payment UI, OneSignal subscription/delivery/tap, account recovery/deletion, and no-debug-behavior evidence.

Do not mark Google Play CLOSED until Play acceptance plus signed-device evidence exist.

## 2. Apple / TestFlight / APNs

Current state:
- iOS source/build verification: complete for simulator.
- Xcode 26+ guard: implemented.
- Exact Team ID + com.zovro.app provisioning validation: implemented.
- Production APNs entitlement check: implemented.
- Signed archive/IPA export workflow: implemented.
- TestFlight validation/upload workflow: implemented.
- Apple signing/App Store Connect credentials: not present in the last verified CI run.

PASS requires:
1. Authenticate to Apple Developer / App Store Connect.
2. Obtain or confirm Apple Distribution certificate.
3. Obtain App Store provisioning profile for exact com.zovro.app with aps-environment=production.
4. Add protected GitHub Actions secrets for certificate/profile/team and App Store Connect API upload.
5. Run the guarded iOS workflow with upload_testflight=true.
6. Confirm signed IPA validates and uploads.
7. Confirm App Store Connect/TestFlight processing succeeds.
8. Install the TestFlight build on a real iPhone.
9. Verify Face ID/password AutoFill, GPS, foreground/background/terminated push, notification tap routing, account recovery/deletion, and payment UI.
10. Confirm a real OneSignal/APNs subscription exists.

Do not mark iOS CLOSED until TestFlight processing and signed-device evidence exist.

## 3. OneSignal physical-device evidence

Already closed:
- Production backend credentials.
- Android FCM platform configuration.

Still open:
- Real-device subscription/delivery/tap evidence.
- iOS APNs configuration and signed-device evidence.

PASS requires:
1. A signed Android Internal-test install and signed iOS TestFlight install.
2. Active OneSignal subscriptions bound to the correct synthetic ZOVRO users.
3. Record delivery for: new nearby request, provider acceptance, and job-status update.
4. Verify foreground/background/terminated behavior where supported.
5. Verify notification tap opens the correct request/job.
6. Verify duplicate notification IDs do not create duplicate sends.

## 4. Twilio / A2P 10DLC

Already closed:
- SMS source-side safety.
- Exact inbound/status callback routing.
- Twilio signature verification.
- STOP/START/HELP handling.
- Delivery-state persistence and duplicate-send protection.
- Live SMS remains fail-closed/disabled.

Current external state:
- Business Profile rejected because the email domain did not match zovro.work.
- A2P campaign rejected because ZOVRO LLC was registered through a Sole Proprietor flow.
- Correction messages were sent to Twilio Consumer Trust and A2P Compliance on 2026-09-28.

PASS requires:
1. Twilio Business Profile reflects ZOVRO LLC, not Sole Proprietor.
2. Business email uses the zovro.work domain (support@zovro.work is the approved support identity).
3. Register the brand under the appropriate Standard or Low-Volume Standard business flow.
4. Obtain Business Profile/Brand/Campaign approval.
5. Configure the approved sender/number or Messaging Service.
6. Keep SMS disabled until approval is confirmed.
7. Test a real opt-in number.
8. Verify outbound job alert, reply acceptance/decline, HELP, STOP, and post-STOP suppression.
9. Preserve delivery evidence and status callbacks.

## 5. Store screenshots and final assets

Current state:
- Source app icon exists.
- Screenshot story, sizes, privacy rules, and asset checklist are prepared.
- Final screenshots are intentionally not captured from simulator/debug builds.

PASS requires:
1. Capture screenshots only from final signed Play/TestFlight builds using synthetic accounts.
2. Do not expose real names, phone numbers, emails, addresses, payment data, device tokens, account IDs or secrets.
3. Google Play: at least the required phone screenshots plus feature graphic.
4. Apple: required iPhone screenshots for the submitted build.
5. Verify every screenshot claim matches the exact submitted binary.

## 6. Final human legal approval

Technical/legal preparation is complete, but legal approval cannot be automated.

PASS requires an authorized human/legal reviewer to approve:
- marketplace / independent-provider model,
- provider licensing language,
- limitation of liability / warranty / dispute / governing-law terms,
- payment / cancellation / refund / tip / payout / chargeback language,
- privacy disclosures and retention/deletion,
- SMS consent / STOP / HELP language,
- biometric/Face ID wording,
- age/children treatment,
- final Apple App Privacy and Google Play Data Safety answers.

## Final release rule

Do not call ZOVRO fully launched until:
- Google Play signed build is accepted and tested,
- iOS signed build processes in TestFlight and is tested,
- physical-device push evidence is recorded,
- Twilio is approved if live SMS is to be enabled,
- final store screenshots/declarations are complete,
- final human legal approval is recorded.
