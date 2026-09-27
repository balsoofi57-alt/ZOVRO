# Google Play Data Safety — Evidence Mapping

Status: working draft, not a legal certification or Play submission.
Updated: 2026-09-27

## Step 2 — Collection & security
- Collects/shares required user data types: **Yes**
- Encryption in transit: **Yes** — production web/API integrations use HTTPS.
- Account creation: **Username and password** — ZOVRO uses a phone number as the account identifier plus password.
- External account login: **No** based on current source; no OAuth/enterprise/external-account login is implemented.
- Account/data deletion: **Yes** — users can delete from Profile & Security. Public instructions are being published at `https://zovro.work/support.html#delete-account`.

## Candidate data types, grounded in current source/privacy policy

### Location
- **Precise location** — collected only when a location feature is used.
  - Purposes: app functionality, nearby matching, service-address assistance, live job tracking.
  - Optional: yes, feature-dependent.
  - Sharing: may be disclosed to an assigned provider when needed to perform the requested service.

### Personal info
- **Name** — account/profile.
- **Email address** — account/support.
- **User IDs** — internal account identifier and OneSignal external ID linkage.
- **Address** — service request address/landmark when provided.
- **Phone number** — account identifier and optional transactional SMS features.
- **Other info** — role, provider service categories, license/verification information when supplied.
  - Main purposes: account management, app functionality, fraud prevention/security, support.
  - Name/email/phone are required for account creation in current source.
  - Service address and provider verification details are feature-dependent.

### Financial info
- **User payment info** — card/payment details are handled by Stripe's native payment flow; ZOVRO does not intentionally store raw card details.
- **Purchase history** — service payment state/amounts and completed transaction records may be maintained.
  - Purposes: app functionality, payments, fraud/dispute/legal records.
  - Optional: yes, only when a paid transaction is used.
  - Google Play service-provider exemption should be checked before marking Stripe-processed data as "shared."

### Messages
- **Other in-app messages** — job chat between customer and provider.
  - Purpose: app functionality/service coordination.
  - Optional: yes.
  - Sharing: chat messages are visible to the job participants.

### App activity
- **App interactions** — server audit/security records record selected account/request actions.
- **Other user-generated content** — service request details, ratings/reviews, provider notes/verification submissions.
  - Purposes: app functionality, fraud prevention/security, support, marketplace records.

### Device or other IDs
- **Device or other IDs** — OneSignal push subscription identifier may be processed for native notifications.
  - Purpose: app functionality / notifications.
  - Optional: push permission is user-controlled.

## Data types not evidenced as collected by the current release source
Do not select these without new evidence:
- Race/ethnicity
- Political or religious beliefs
- Sexual orientation
- Credit score
- Health info
- Fitness info
- Contacts
- Calendar
- Web browsing history
- Installed apps
- Music files
- Files/documents
- Camera/photo/video uploads as a current user-facing collection flow
- Advertising ID
- Ad data / advertising SDK data

## SMS note
Transactional SMS support exists in source but remains subject to the Twilio/A2P release gate. If live SMS is enabled in the store release, reassess whether **SMS or MMS** data needs disclosure under Google Play's definitions.

## Deletion / retention
Current policy:
- users can delete accounts from the app;
- active identifiers/profile data are removed or de-identified from active use;
- open requests/sessions/notifications/active location records are removed or detached as appropriate;
- limited completed transaction, fraud-prevention, dispute, security, tax, accounting, or legal records may be retained when reasonably necessary or required by law.

## Before certification
Before the final Play Console certification:
1. verify the public deletion URL resolves with the updated instructions;
2. inspect the generated native Android manifest/dependency tree for any additional SDK data collection;
3. confirm OneSignal/Stripe disclosures against their current SDK behavior;
4. verify which fields Google Play treats as "shared" versus service-provider processing;
5. verify optional/required flags and purposes for every selected data type.

## Native Android release artifact evidence — 2026-09-27
Inspected the generated `zovro-android-release-candidate` AAB from the successful Android release workflow.
- No `com.google.android.gms.permission.AD_ID` string present in the release DEX/manifest evidence inspected.
- No Google Mobile Ads / AdMob SDK class strings detected.
- Expected permissions detected: `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `POST_NOTIFICATIONS`, and `INTERNET`.
- Stripe and OneSignal resources/classes are present, consistent with the payment and push integrations already documented.

This supports the Play Console Advertising ID declaration of **No** and confirms that location/push/payment SDK disclosures must be considered in Data Safety.


## Third-party SDK evidence
### Stripe mobile SDK
Stripe documents that its mobile SDK may process payment information, customer/user identifiers, device characteristics, and product-interaction data for app functionality, analytics, and fraud prevention. ZOVRO uses Stripe PaymentSheet and customer-specific ephemeral keys when available. Treat payment information, purchase history, user/customer IDs, and SDK interaction data conservatively in the final Play disclosure.

### OneSignal mobile SDK
OneSignal documents processing of mobile/device identifiers, IP address, device/OS/network/language/time-zone information, app interaction/session information, and push-notification delivery/engagement data. OneSignal's current privacy policy states that it does not collect Android Advertising IDs or IDFAs. ZOVRO's current integration logs the ZOVRO external user ID into OneSignal and requests notification permission; it does not intentionally send precise service location to OneSignal.

These SDK disclosures reinforce selecting Device or other IDs and App interactions in the Data Safety form and support keeping Advertising ID = No.
