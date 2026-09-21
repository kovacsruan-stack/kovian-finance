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


## 2026-09-20 Continuous Implementation Checkpoint
- Hardened the read-only AI context contract with bounded 365-day windows.
- Added aggregate income, expense, net cash flow, savings rate, category totals and transaction evidence.
- Cancelled transactions are excluded from AI context.
- Latest main commit: `7484d923bf70101fdcc3e268bed98a47e0a7c452`.


### KOVI Integration Readiness
The Finance application exposes a bounded read-only financial intelligence context for KOVI. Mutation capabilities remain subject to KOVI confirmation, authorization, idempotency and audit controls. External connector implementation remains a separate production gate.


### 2026-09-20 continuation checkpoint
- record bounded KOVI finance summary context milestone.
- Changes are implemented as bounded, authorization-aware domain contracts; CI/build status remains unclaimed until an observed successful run exists.


### KOVI Finance internal federation
Added a fail-closed internal KOVI capability/context surface authenticated by `X-KOVI-INTERNAL-KEY`, with a minimum 32-character secret requirement. The route exposes read-only finance capabilities and context; mutations are not exposed through this contract.


### 2026-09-20 large continuation checkpoint
- Record KOVI forecast federation expansion checkpoint.
- Domain contracts remain bounded, authenticated and read-only for KOVI intelligence access.
- Production CI/build remains a separate validation gate and is not marked successful without observed evidence.


### 2026-09-20 continuation
- Record expanded KOVI read-tool federation.
- Cross-domain access remains authenticated, bounded and read-only unless an explicit governed mutation flow is invoked.
- CI status remains evidence-based; no successful build is inferred from code changes alone.


### 2026-09-20 KOVI Finance intelligence expansion
- Internal federation contract advanced to 1.4 and explicitly declares the surface read-only.
- Added bounded daily cash-flow intelligence (finance.get_cash_flow) over a maximum 366-day window.
- Cancelled transactions remain excluded and no mutation capability is exposed.
- Finance federation now covers accounts, transactions, revenue, cash flow, context, summary, forecast and risk.


### 2026-09-20 large continuation checkpoint — Finance intelligence surface 1.4
- KOVI Finance internal capability contract advanced to 1.4.
- Added bounded read-only cash-flow intelligence with explicit date-window validation.
- Cash-flow output is aggregated by day and excludes cancelled transactions.
- Forecast, risk, context, accounts, transactions and revenue remain read-only federation surfaces.
- No financial mutation capability was added to the KOVI internal contract.


### 2026-09-20 ecosystem security continuation
- Finance KOVI federation remains explicitly read-only at the internal contract boundary.
- Forecast, risk, cash flow, context, accounts, transactions and revenue are exposed through bounded application-level contracts rather than unrestricted database access.
- Financial mutations remain outside the KOVI federation surface and require explicit application authorization, idempotency and audit controls.
- No successful CI/build is inferred from code changes without observed workflow evidence.


### 2026-09-20 continuous implementation checkpoint — financial rules hardening
- Scheduled financial rules are now evaluated per owner instead of using cross-tenant repository scans.
- Invoice, recurring, debt and goal rule queries now carry explicit owner predicates.
- Added owner-scoped database indexes for scheduled-rule access paths and owner discovery.
- This closes a tenant-isolation/performance gap in the notification scheduler; CI/build remains unverified until an observed successful workflow exists.

### 2026-09-20 continuation — rules engine expansion
- Added owner-scoped overdue credit-card invoice detection.
- Added deterministic 30-day negative-cash-flow risk notifications with owner-scoped transaction reads and daily deduplication.
- Financial rule evaluation remains advisory/notification-only and does not mutate financial source-of-truth aggregates.


## Checkpoint 2026-09-20

- Outbox dispatcher now claims pending events with PostgreSQL `FOR UPDATE SKIP LOCKED`, preventing competing dispatcher instances from processing the same pending batch concurrently.
- Owner-facing Outbox reads remain non-mutating and owner-scoped.
- Strengthened internal finance credential contract tests for exact-match, wrong-length and minimum-length behavior.
- Full CI/build evidence remains a release gate; no workflow result is claimed without observed execution.


## 2026-09-20 CI hardening checkpoint
- Finance CI now uses read-only repository permissions, concurrency cancellation and a bounded 15-minute job timeout.
- Maven test execution uses non-interactive mode and the Java 21 toolchain cache.
- These workflow changes improve isolation and deterministic CI behavior; they do not imply a successful workflow run.


## UI/UX phase

A mobile-first Finance frontend shell has been added under `frontend/`. KOVIAN Fitness already has a full frontend; its shared layout now includes a mobile bottom navigation, safe-area handling, touch-target improvements and responsive card/table behavior. The ecosystem UI/UX system is documented in the KOVIAN control-plane repository at `docs/UI_UX_SYSTEM.md`.


## UI/mobile hardening — September 2026

- Finance frontend shell expanded with responsive feature states.
- Added strict TypeScript + Vite build configuration.
- Added PWA manifest/icon and mobile metadata.
- Mobile navigation uses drawer + bottom navigation.
- Dashboard and secondary screens use mobile-first spacing and accessible focus states.
- Backend remains the source of truth for financial data and authorization.


## 2026-09-20 implementation checkpoint
- Notification creation now publishes NOTIFICATION_CREATED.v1 through the transactional outbox using an owner-safe internal path, including scheduled rule execution.
- Deterministic cash-flow risk notification has a unit test.
- Prometheus metrics registry is enabled.
- Local Docker image and ecosystem platform integration are registered in the KOVIAN control plane.
- CI includes Flyway validation, backend verification and frontend build; successful execution must still be observed before marking the gate passed.


## Scope completion estimate — 2026-09-21
Estimated completion toward the documented roadmap: **83%**. This is a scope estimate, not a test/build percentage. The remaining work is explicitly tracked in the roadmap; testing and release validation are intentionally deferred to the final gate.

## 2026-09-20 mobile/security continuation
- Finance frontend PWA now has a service worker, iOS metadata and automated frontend build/PWA checks.
- Backend CORS is explicitly configurable through KOVIAN_CORS_ALLOWED_ORIGINS.
- Render service `kovian-finance-web` was created, but the first build was blocked by the workspace build-minute quota rather than a reported application build error.


## Workstation-first integration

The project is part of the KOVIAN local integration stack. Native tests remain the source of truth before integration. Local execution is expected on the developer PC through the shared KOVIAN Compose environment; Render is not a required runtime dependency for development validation.


## 2026-09-21 workstation validation checkpoint

- Local Docker Compose/workstation orchestration is integrated on main.
- KOVI internal federation forecast metadata is aligned to contract version 1.4.
- Finance remains the source of truth for deterministic financial data.
- Actual build/test/CI success remains unclaimed until an observed successful run exists.


## 2026-09-21 continuation checkpoint
- Finance KOVI forecast federation metadata is aligned to contract 1.4.
- Workstation orchestration is integrated on main.
- Financial source-of-truth boundaries remain enforced; KOVI federation remains read-only.


## 2026-09-21 outbox contract hardening
- Outbox events now validate owner/aggregate identity, version range, versioned event naming and a 1 MB payload ceiling at construction time.
- Added regression coverage for versioned event names and payload bounds.
- The outbox remains transactional and read-only to KOVI; external transport remains a production gate.


## 2026-09-21 contract/test hardening
- Outbox aggregate, payload and event-name invariants are enforced at construction time while preserving existing version-field compatibility.
- Added regression coverage for malformed names and oversized payloads.
- Internal KOVI authentication and owner-isolation security boundaries remain intact.


## 2026-09-21 workstation smoke validation
- Added documented Finance actuator health validation for workstation startup.


## 2026-09-21 container runtime validation
- Added container-level Finance healthcheck against `/actuator/health`.


## Latest implementation checkpoint

**Current scope estimate: 83%**

Workstation integration checkpoint: unified ecosystem launcher now starts Finance with isolated PostgreSQL/Redis, exposes the Finance frontend on 5174 for mobile testing, includes health/readiness probes, and participates in unified health verification.

The percentage is a scope estimate for implemented engineering work, not a claim that local builds, automated tests, end-to-end tests, or production deployment have passed. Those remain verification gates.


## 2026-09-21 implementation continuation — pre-validation scope

**Current scope estimate: 85%**

Production fail-fast profile, operations/recovery runbook, LGPD engineering requirements and explicit remaining implementation scope are now added.

Automated testing and final validation remain intentionally deferred until implementation scope is closed.


## 2026-09-21 pre-validation implementation continuation

**Current scope estimate: 86%**

Added production profile hardening, disabled public API documentation in production, prevented API response caching, and aligned workstation profile explicitly.

Testing and final validation remain deferred by implementation strategy and are not represented as passed.


## 2026-09-21 ecosystem architecture persistence checkpoint

The KOVIAN commercial-builder model is now explicitly persisted across the ecosystem. Finance remains the financial source of truth and KOVI remains the governed generative/engineering layer. Finance-side contracts, financial invariants and production gates remain authoritative; KOVI project/DevTask records are orchestration evidence, not replacements for Finance domain state.
