# KOVIAN Finance Production Readiness

## Security
- [ ] Internal KOVI key is at least 32 characters and stored outside source control.
- [ ] Constant-time internal-key comparison remains enabled.
- [ ] Owner scoping is enforced on all KOVI-facing reads.
- [ ] Cash-flow and forecast requests remain bounded.
- [ ] Outbox dispatch is idempotent and concurrency-safe.

## CI
- [ ] PostgreSQL integration tests pass.
- [ ] Redis integration tests pass.
- [ ] mvn clean verify passes on the current main head.
- [ ] Migration validation passes.

## Release
- [ ] Finance contract version matches the control-plane registry.
- [ ] KOVI access remains read-only.
- [ ] Audit/outbox evidence is available.
- [ ] Backup and restore test is current.
