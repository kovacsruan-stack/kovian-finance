# KOVIAN Finance Architecture

## Product boundary

KOVIAN Finance owns personal financial data and financial intelligence. KOVIAN Fitness owns fitness-business operations. Cross-product financial data uses explicit integration contracts.

KOVI AI consumes authorized application-level data through services and tools; it never receives unrestricted database access.

## Backend modules

```
com.kovian.finance
├── common
├── account
├── transaction
├── category
├── budget
├── goal
├── recurring
├── card
├── debt
├── asset
├── forecast
├── integration
├── ai
└── security
```

## Financial invariants

1. Money uses BigDecimal/DECIMAL, never floating point.
2. External financial events are idempotent.
3. Sensitive mutations are auditable.
4. Ownership and authorization are enforced server-side.
5. Financial records prefer reversible lifecycle states over destructive deletion.
6. AI insights are advisory and cannot silently execute financial mutations.

## KOVIAN Fitness integration

Fitness publishes normalized events such as FITNESS_REVENUE_RECORDED, FITNESS_EXPENSE_RECORDED and FITNESS_REFUND_RECORDED. Finance consumes them through an integration boundary instead of querying Fitness tables directly.

## Security baseline

Authentication, authorization, tenant isolation, input validation, rate limiting, secret management, audit logging and database constraints are mandatory foundations.

## Delivery phases

### Completed foundation

1. Core domain and persistence.
2. Accounts, categories and transactions.
3. Budgets, goals, recurring transactions and cards.
4. Debts, assets, liabilities and forecasting.
5. Security, audit, idempotency and ledger invariants.
6. Transactional outbox, retries and recovery.
7. CSV import and reconciliation.
8. Persistent notifications and automated financial rules.

### Remaining release phases

9. Harden the Financial Rules Engine and optimize scheduled queries.
10. Complete event contracts, owner-safe outbox flows and real broker/consumer integration.
11. Expose controlled KOVI AI Finance tools with explicit authorization for mutations.
12. Complete financial-domain audit and end-to-end invariants for cards, debts, installments and reconciliation.
13. Expand automated tests, CI/CD and production security/observability.
14. Add advanced banking imports and future Open Finance adapters.
15. Complete the user-facing frontend and end-to-end product experience.
16. Finalize KOVIAN Fitness integration, production deployment and 1.0 homologation.

For the detailed continuation checklist, see [docs/PROJECT_STATUS.md](PROJECT_STATUS.md).


## KOVI boundary hardening

The AI integration is fail-closed and domain-owned. Requests are tenant-scoped, context crossing the boundary is bounded/minimized, and domain mutations remain owned by the product. KOVI receives governed context rather than unrestricted persistence access.
