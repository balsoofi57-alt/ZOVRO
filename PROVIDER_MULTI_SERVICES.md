# Multiple professions and services

Implemented in the release candidate on 2026-09-12.

Providers can select services across categories when registering and edit their choices under Profile → Your professions & services → Save services. The searchable grouped checkboxes show existing selections and a selected count. Examples include Tire Change + Jump Start + Vehicle Lockout, and Painting + Flooring Installation & Repair.

`services` stores the complete normalized selection. `service` remains the first selected service for compatibility with older clients. Existing single-service profiles are read as one-element selections without a destructive migration. Customer fields are unaffected. Selecting services does not grant verification, licensing, or insurance badges.

The shared catalog/matcher drives nearby search, new-request notifications, open-job discovery, acceptance checks and emergency replacement dispatch. A generic roadside SOS can reach providers with specific roadside skills, while a request for a particular skill requires that skill to be selected. Empty profiles are not treated as all-purpose providers. Existing assigned jobs remain accessible when a provider edits their specialties; edits affect new matches.

Both the static website and mobile bundle load the same catalog, selection controls and validation. Customers can request individual services from the full grouped catalog. Specific roadside descriptions match Tire Change, Jump Start, Vehicle Lockout or Towing. Explicit customer selections take precedence over automatic suggestions.

Validation: `npm run multi-service:check` covers registration/profile payloads, saved selections, canonical names, invalid input, legacy accounts, secondary-service search/dispatch/acceptance, handoff matching, removal of specialties, public-profile privacy and restart persistence. It is included in `npm run qa:all`.

Local visual browser preview was unavailable in this environment; UI behavior was checked with the JavaScript harness and real API integration tests. This feature does not close the separate payment, signing, device or store-release gates.
