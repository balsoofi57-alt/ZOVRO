# ZOVRO interface languages

The web app and generated Capacitor bundle share the same language picker and runtime.

- English (`en`), Spanish (`es`), Arabic (`ar`, RTL), Simplified Chinese (`zh`, document language `zh-Hans`).
- The selected language is stored under the existing `zovroLanguage` key. Device-language detection is used when no saved choice exists. Storage failures do not crash the localization layer.
- Main navigation, service catalogs, account/registration controls, request controls, transport inputs and support dialog controls are translated.
- Catalog search accepts the currently displayed translation as well as the original English search terms.
- Canonical service names, option values, user-entered addresses, phone numbers, messages and API payloads are not translated.
- Legal document bodies and automated support answers retain their source-language behavior. This change is not a certified translation of legal policies or an expansion of the support assistant's supported answer languages.
- Unknown strings fall back to their English source. Add English-keyed translations in `i18n-messages.js`.

## Verification

Run `npm run mobile:prepare`, `npm run i18n:check` and `npm run qa:all` using Node 22 or later.

Browser QA covers the four-language cycle, reload persistence, Arabic direction, translated catalog search, unchanged service values, registration and password visibility, request steps, unmodified addresses, support navigation and mobile layout. Login/request UI testing uses intercepted local test responses, not real accounts or submitted service requests.

No TestFlight upload or store publication is part of this change.
