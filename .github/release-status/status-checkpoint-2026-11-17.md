# ZOVRO — read-only TestFlight follow-up

Created 2026-11-17 after the successful signed IPA App Store Connect transport upload on GitHub Actions run [44003526768](https://github.com/balsoofi57-alt/ZOVRO/actions/runs/44003526768).

This is a documentation-only, additive trigger for the existing **ZOVRO TestFlight Processing Read-Only Check** workflow. It is intended to query Apple's real build processing states using already-protected App Store Connect credentials, without modifying builds, testers, releases, agreements, payment settings, or users.

**Do not mark the public App Store release ready** unless the resulting action verifies processing and subsequent signed-device, tester-availability, store metadata and public App Review gates are independently verified. The workflow's success alone only verifies the request and reported build state.

Google Play release continues to require the **existing approved upload key**, or an officially accepted reset; the latest build generated an unsigned AAB, not a Play-ready signed release.
