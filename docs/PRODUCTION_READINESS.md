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

## Database topology
- [x] Production Supabase project `Fitness e Finance` is provisioned.
- [x] Finance owns the dedicated `finance` PostgreSQL schema.
- [x] Flyway is configured to create and track its history inside the `finance` schema.
- [x] Hibernate validation uses the same `finance` schema.
- [ ] Railway database URL/credentials must point to the new Supabase project before runtime validation.
- [ ] Redis production endpoint must be valid before online testing.
- [ ] Existing Fitness demo seed migration must be reviewed before production execution.
