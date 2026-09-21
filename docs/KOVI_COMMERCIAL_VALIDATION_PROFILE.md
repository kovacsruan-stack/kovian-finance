# KOVIAN Finance — Commercial Validation Profile

## Required gates
- Maven compile/package
- unit tests
- integration tests
- security tests
- Flyway migration validation
- actuator health
- frontend TypeScript/build
- frontend lint
- API smoke checks
- accounting invariant checks

## Domain-specific gates
- Finance remains authoritative for financial records and calculations.
- RLS/owner isolation remains intact.
- Idempotency and reconciliation invariants remain intact.
- Close and export controls remain governed.
- KOVI cannot directly mutate authoritative financial persistence.

## Delivery evidence
A commercial delivery candidate must include commit SHA, validation profile version, backend/frontend results, migration result, security result, accounting invariant result, known limitations and release approval evidence.

## Failure handling
Failed gates become KOVI DEV repair tasks. Repairs occur in isolated worktrees and must pass the complete mandatory gate set before release readiness.
