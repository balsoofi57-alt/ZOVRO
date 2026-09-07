# ZOVRO Mobile Packaging

ZOVRO is prepared for a Capacitor iOS/Android shell using application id `com.zovro.app` and web directory `www` in the verified release artifact.

The final native projects must be generated and signed on supported Apple/Android development environments after the production API URL, push-notification credentials and store accounts are finalized.

Release path: production web bundle → Capacitor sync → physical-device testing → signing → TestFlight / Play internal testing → store submission.
