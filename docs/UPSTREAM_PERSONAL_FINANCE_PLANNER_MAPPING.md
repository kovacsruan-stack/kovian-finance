# Personal Finance Planner → KOVIAN Finance Mapping

This document prevents accidental duplication of the financial domain while preserving the useful planner structure from `oofangoo/personal-finance-planner`.

| Upstream concept | KOVIAN implementation | Rule |
|---|---|---|
| `app` | `frontend/src` + React Router | Adapt application shell; do not replace KOVIAN auth/API boundaries |
| `components` | `frontend/src/components` | Reuse planner interaction patterns as focused KOVIAN components |
| `context` | TanStack Query + focused UI state | Server state belongs to API/query cache, not browser persistence |
| `services/ai` | Spring Boot `ai` domain + KOVI Intelligence API | AI access is governed and owner-scoped |
| `types` | `frontend/src/lib/financeTypes.ts` + backend DTOs | API-safe contracts; no persistence entities in UI |
| `utils` | `frontend/src/lib` utilities | Pure formatting/calculation helpers only |
| Dashboard | Analytics/snapshot/forecast APIs | Use bounded aggregates instead of loading all transactions |
| Income | Transaction API | Income is a transaction view, not a second persistence model |
| Expenses | Transaction API | Expense is a transaction view, not a second persistence model |
| Recurring | Recurring API | Backend owns schedules and occurrences |
| Installments | Card/debt/transaction APIs | Backend owns installment state |
| Goals | Goal API | PostgreSQL remains authoritative |
| Budgets | Budget API | PostgreSQL remains authoritative |
| Forecast | Forecast/scenario APIs | Computed projections are server-generated |
| Multi-currency | Backend currency/domain contracts + locale-aware UI | Never infer exchange truth in the browser |
| Import/export | Importer/reconciliation + controlled export APIs | Preview is transient; persistence is server-side |
| LocalStorage financial state | **Not adopted** | LocalStorage may contain UI preferences only |
| LocalStorage backup | **Not adopted as source of truth** | Server persistence, audit and controlled export are authoritative |
| Planner AI button | KOVI Intelligence | Show provenance and distinguish computed facts from AI explanations |

## Migration invariant

Every module migrated from the upstream planner must have exactly one authoritative KOVIAN financial domain. If an upstream interaction would require a second browser-side financial model, adapt the interaction to the existing KOVIAN API instead.
