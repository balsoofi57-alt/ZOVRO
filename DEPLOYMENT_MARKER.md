# ZOVRO deployment marker

Production deployment marker for the verified release candidate.

- QA workflow: ZOVRO Full QA
- Verified run: #381
- Verified release commit: `ee12dba479b9894ecdc37b861ea7bbee64099e72`
- Database cutover policy: keep PostgreSQL in `mirror` mode until strict parity, persistence, backup/restore and rollback evidence are complete.
- Pull request policy: keep the release PR in Draft until external store, signing, device and payment-delivery gates are complete.
