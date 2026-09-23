# KOVIAN Finance Open Source Foundation

KOVIAN Finance uses `oofangoo/personal-finance-planner` as an open-source UX and financial-planning foundation.

## Upstream

- Repository: https://github.com/oofangoo/personal-finance-planner
- License: MIT
- Adopted as the planner/application-shell foundation on 2026-09-23.
- Upstream concepts adopted: dashboard planning, income/expense organization, recurring expenses, installments, goals, budgets, forecasting, visual analytics, multi-currency and multi-language UX.

## KOVIAN boundary

The upstream project is **not** the financial system of record for KOVIAN Finance.

KOVIAN Finance retains:

- Spring Boot as the application/backend boundary.
- PostgreSQL as the authoritative financial store.
- Server-side authentication and owner isolation.
- Ledger, audit, idempotency, reconciliation and importer controls.
- Forecast, analytics and KOVI Intelligence application services.
- PWA, automated QA and production-operation controls.

The browser may persist UI preferences and transient workflow state, but canonical accounts, transactions, balances, goals, budgets, cards, debts, assets, liabilities and forecasts are never authoritative in browser storage.

## Attribution

The upstream project's MIT license and attribution are retained. KOVIAN modifications are substantial: the planner UX is integrated with a separate Spring Boot domain model, governed API contracts, security controls, PostgreSQL persistence, KOVI Intelligence and KOVIAN ecosystem boundaries.

See `docs/UPSTREAM_PERSONAL_FINANCE_PLANNER_MAPPING.md` for the detailed mapping.

## Ownership

The resulting product is maintained as KOVIAN Finance. Upstream attribution remains visible because the adopted foundation is MIT licensed; KOVIAN-specific behavior, backend services, security controls, integrations and product design are maintained independently.
