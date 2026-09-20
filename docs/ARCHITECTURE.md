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

1. Core domain and persistence.
2. Accounts, categories and transactions.
3. Budgets, goals, recurring transactions and cards.
4. Debts, assets, liabilities and forecasting.
5. KOVI AI financial intelligence.
6. KOVIAN Fitness integration.
7. Open Finance/bank integrations after the ledger is stable.
