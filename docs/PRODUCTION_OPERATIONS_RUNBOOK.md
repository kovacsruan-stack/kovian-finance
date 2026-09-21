# KOVIAN Finance — Production Operations

## Domain ownership
Finance is the source of truth for accounts, transactions, ledger state, budgets, cards, debts, goals, forecasts and reconciliation.

## Runtime invariants
- KOVI federation is read-only unless an explicitly governed application flow is introduced.
- Owner isolation is mandatory.
- Critical mutations require idempotency where applicable.
- Outbox events remain transactional with source mutations.
- Financial secrets and database credentials are externalized.
- Redis-backed rate limiting and PostgreSQL concurrency controls are production infrastructure.

## Release gates
1. Migration and accounting invariant review.
2. Idempotency/reconciliation review.
3. Outbox recovery review.
4. Security/dependency review.
5. Backup/restore review.
6. Frontend/backend compatibility review.
7. KOVI contract compatibility review.
8. Final E2E and release smoke validation.

## Incident handling
- Financial data integrity or owner-isolation failures are P0.
- Pause external financial dispatch if event consistency is uncertain.
- Preserve audit/outbox records.
- Never repair balances by directly editing derived totals; reconcile from source transactions/ledger.

## Recovery
- Restore PostgreSQL before rebuilding derived projections.
- Recover Redis only after validating rate-limit and lock semantics.
- Replay/reconcile transactional outbox events after source-of-truth recovery.
- Verify owner boundaries before reopening KOVI federation.

Automated tests and final production validation are intentionally deferred to the final gate.
