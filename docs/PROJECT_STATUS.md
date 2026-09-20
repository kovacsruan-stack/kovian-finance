> **Ecosystem master roadmap:** https://github.com/kovacsruan-stack/kovi-ai/blob/main/ECOSYSTEM_MASTER_ROADMAP.md
>
> Finance remains a parallel product track while KOVI AI is the primary platform project.

# KOVIAN Finance — Project Status & Continuation Handoff

Updated: 2026-09-20
Branch: main
Repository: https://github.com/kovacsruan-stack/kovian-finance
Latest known commit: f0755dfab69f73654c2ac4b39856cfda8caa21f0

## Purpose

This document is the canonical continuation point for future chats. Before implementing the next macroblock, read this file together with docs/ARCHITECTURE.md.

## Product

KOVIAN Finance is the financial product of the KOVIAN ecosystem.

- KOVIAN = technology ecosystem
- KOVIAN Finance = personal finance and financial intelligence
- KOVI AI = shared intelligence layer
- KOVIAN Fitness = fitness/business product
- Future: KOVIAN Business and other products

## Current architecture

Java 21, Spring Boot 4.0.6, Spring MVC, JPA, Spring Security, Redis, PostgreSQL, Flyway, Actuator, Springdoc/OpenAPI and Testcontainers.

Core modules currently include:
common, account, transaction, category, budget, goal, recurring, card, debt, asset, liability, snapshot, analytics, forecast, ai, security, audit, ledger, outbox, integration, importer, reconciliation and notification.

## Implemented capabilities

- Financial accounts with materialized balance and opening balance
- Categories
- Income, expense and transfer domain concepts
- Transaction cancellation/reversal
- Optimistic locking on critical aggregates
- Idempotent ledger transfers
- Double-entry ledger entries with database invariants
- Audit trail and correlation IDs
- JWT resource-server authentication
- Server-side owner isolation
- Redis distributed rate limiting
- Security headers and secret-based JWT configuration
- Budgets
- Goals
- Recurring transactions with deterministic external keys
- Credit cards and invoices
- Installment purchases
- Debts and installments
- Assets and liabilities
- Financial snapshots
- Analytics/dashboard summaries
- Historical forecast
- KOVI AI deterministic finance insights
- Controlled finance context endpoint
- Transactional outbox
- Scheduled outbox dispatcher, retries and stale-processing recovery
- CSV import with row errors and deterministic external IDs
- Account reconciliation
- Persistent notifications
- Budget threshold notifications
- Automated financial due-date rules
- KOVIAN Fitness event types and integration boundary preparation

## Important current implementation notes

### Outbox

The outbox is implemented with persistence, claiming, retry and recovery. The current publisher is LoggingOutboxEventPublisher, so a real external broker/transport is still pending.

The dispatcher should be hardened for multi-instance claim semantics before production scale.

### Notifications

Notification rules currently cover budget thresholds, invoice/recurring/debt/goal alerts. Some scheduled rules still use broad findAll-style reads and should be replaced by indexed database-side queries.

Notification creation from scheduled jobs must use owner-aware internal application services and must not depend on an authenticated CurrentUser.

### Security

CurrentUser derives the owner from the authenticated principal. OwnerIsolationFilter is a transitional defense layer. The long-term design should remove ownerId from request DTOs wherever possible and derive ownership exclusively from authenticated context.

### Import

CSV import exists, but the transaction semantics and partial-row failure behavior should receive integration tests before production use.

### AI

KOVI AI must access Finance through explicit application services/tools. Never give the AI unrestricted database credentials. AI-generated insights remain advisory; financial mutations require explicit user authorization.

## Remaining macroblocks before a serious 1.0 release

Execute as complete macroblocks, not fragmented changes.

### M1 — Financial Rules Engine hardening

- Replace scheduled findAll scans with indexed owner/status/date queries.
- Add overdue rules where the domain model supports them.
- Add cash-flow risk rules.
- Add goal progress/deadline intelligence.
- Add anomaly/spending-pattern rules where deterministic signals are available.
- Centralize rule evaluation and deduplication.
- Add rule-level tests.

### M2 — Event architecture completion

- Emit notification events through the outbox.
- Add owner-safe outbox recording for scheduled/internal flows.
- Version event payloads/contracts.
- Harden concurrent outbox claiming for multiple application instances.
- Add consumer idempotency.
- Define retry/DLQ behavior.
- Prepare real broker/transport adapter.

### M3 — KOVI AI Finance tools

Expose controlled application-level tools such as:

- get financial summary
- get cash flow
- get income/expenses
- get budget status
- get goals
- get debts
- get credit-card status
- get upcoming bills
- get forecast
- get financial risks
- get category analysis

Sensitive mutations require explicit confirmation and authorization.

### M4 — Financial-domain audit

Deeply validate:

- card purchase -> invoice -> close -> payment
- installments
- debt payment -> account movement
- cancellation/reversal
- transfer invariants
- reconciliation
- recurring transactions
- import idempotency
- balance materialization

No duplicated financial effects.

### M5 — Test and quality gate

Build comprehensive:

- unit tests
- repository tests
- API/integration tests
- Testcontainers PostgreSQL tests
- security/authorization tests
- tenant-isolation tests
- idempotency tests
- concurrency tests
- Flyway migration tests
- outbox retry/recovery tests
- financial invariant tests

### M6 — Production readiness

- GitHub Actions CI
- build/test gate
- dependency/security scanning
- secret scanning
- Docker/production configuration
- database backup/restore procedure
- Redis production configuration
- structured logs
- metrics
- tracing
- alerting
- operational runbook
- migration/rollback strategy

Important: no successful CI run has been verified for the latest commit at the time this handoff was written.

### M7 — Advanced imports and banking

- OFX/QIF as appropriate
- smarter duplicate detection
- bank transaction matching
- incremental imports
- conflict resolution
- future Open Finance adapters

### M8 — Product/frontend completion

Build the complete user-facing product:

- authentication/onboarding
- dashboard
- accounts
- transactions
- categories
- budgets
- goals
- cards
- debts
- assets/liabilities
- recurring transactions
- imports/reconciliation
- analytics
- forecast
- notifications
- KOVI AI
- responsive/mobile UX
- loading/empty/error states
- accessibility

### M9 — Ecosystem integration

- KOVIAN Fitness financial events
- KOVI AI Finance tools
- explicit contracts/versioning
- cross-product authorization
- observability and failure handling

### M10 — Release and homologation

End-to-end homologation, production deployment, monitoring, backup/restore validation and 1.0 release checklist.

## Definition of Done for KOVIAN Finance 1.0

The project should not be marked production-ready until:

1. Financial invariants are covered by automated tests.
2. Ownership isolation is tested across all sensitive endpoints.
3. Critical mutations are idempotent where required.
4. Card/debt/installment/payment flows have end-to-end tests.
5. Import/reconciliation behavior is verified.
6. Outbox dispatch/retry/recovery is verified under failure.
7. CI builds and tests successfully.
8. Security/dependency checks pass.
9. Production configuration and secrets are externalized.
10. Backup/restore is validated.
11. Frontend and backend are integrated end-to-end.
12. KOVI AI uses controlled tools/services rather than unrestricted DB access.
13. KOVIAN Fitness integration uses explicit contracts/events.
14. Observability and operational runbooks exist.
15. Final release smoke tests pass.

## Continuation instruction for future chats

When the user says to continue the project, do not restart the architecture or re-plan from zero.

1. Read this file.
2. Read docs/ARCHITECTURE.md.
3. Inspect the latest commit and relevant source files.
4. Identify the next unfinished macroblock.
5. Implement the entire macroblock coherently.
6. Add/update migrations, tests and documentation in the same macroblock.
7. Commit the complete change to main unless the user explicitly requests another branch.
8. Report the commit SHA and exactly what was completed.
9. Do not claim CI/build success unless it was actually verified.

User preference: implement complete macroblocks and avoid fragmented/piecemeal updates.
