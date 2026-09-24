> **Ecosystem master roadmap:** https://github.com/kovacsruan-stack/kovi-ai/blob/main/ECOSYSTEM_MASTER_ROADMAP.md
>
> Finance remains a parallel product track while KOVI AI is the primary platform project.

# KOVIAN Finance — Project Status & Continuation Handoff

Updated: 2026-09-23
Branch: main
Repository: https://github.com/kovacsruan-stack/kovian-finance
Latest known commit: 3c23d018737f2d1ce523c301ab000f9716ec0727

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
- financial calendar aggregating server transactions and recurring schedules
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


## 2026-09-23 Personal Finance Planner Foundation Migration

- Approved architecture specification: `docs/superpowers/specs/2026-09-23-personal-finance-planner-foundation-design.md`.
- Approved native implementation plan: `docs/superpowers/plans/2026-09-23-personal-finance-planner-foundation.md`.
- Added upstream attribution and module mapping for `oofangoo/personal-finance-planner`.
- Extracted frontend finance domain types into `frontend/src/lib/financeTypes.ts`.
- Added Zod runtime response schemas in `frontend/src/lib/apiSchemas.ts`.
- Hardened typed API response validation for accounts, transactions, goals, cards, invoices, categories, budgets, recurring data, reconciliation and analytics.
- Added bounded dashboard analytics query support to the TanStack Query layer.
- Isolated UI-only browser preferences under the `kovian.finance.ui.` namespace.
- Extracted reusable Modal and Field UI primitives from the application shell.
- Added tests for invalid API payloads and UI preference isolation.
- GitHub Actions runs triggered by the migration commits were observed failing/cancelled; no successful CI/build result is claimed yet. The failure logs were not retrievable through the connected GitHub log endpoint, so no speculative fix is recorded.


## 2026-09-23 — Planner parity execution continued

- Re-sequenced the migration so the **Personal Finance Planner 100% parity gate precedes activation of KOVIAN-only differentiators**.
- Extracted the main finance application shell into `frontend/src/components/layout/FinanceShell.tsx`.
- Added planner import/export route and governed CSV import API integration.
- Added bounded CSV transaction export with spreadsheet-formula neutralization.
- Added localized planner import/export UI and localized forecast view.
- Hardened forecast ownership by deriving the authenticated owner server-side and rejecting mismatched optional owner identifiers.
- Current work remains in **Phase A: Personal Finance Planner parity**. KOVI Intelligence UI is intentionally not being activated as a substitute for missing planner parity.
- No CI/build success is claimed until an actual successful verification run is captured.


## 2026-09-23 — Planner parity continuation: forecast security + net worth

- Forecast ownership is now derived from the authenticated principal; optional request owner identifiers are compatibility-only and must match the authenticated owner.
- Added unit coverage for forecast owner isolation, omitted-owner behavior and invalid horizons.
- Hardened asset and liability endpoints to derive owner scope from CurrentUser and reject cross-owner identifiers.
- Added typed frontend asset/liability contracts, runtime validation and API accessors.
- Added a backend-controlled Net Worth planner view consolidating assets, liabilities and calculated net worth.
- Added navigation, routing and PT-BR/EN localization for the Net Worth view.
- Work remains independent of GitHub Actions, Work and Codex execution. CI/build is not used as a prerequisite for continued implementation and no successful CI/build result is claimed.

- Continued without GitHub Actions, Work or Codex as execution dependencies: dashboard analytics authority, KOVI Insights UI/API, net worth validation, forecast localization and owner-isolation tests were implemented directly.

- Additional hardening: analytics, KOVI insights and debt endpoints now enforce authenticated owner scope; corresponding regression tests were added.

- Corrected KOVI Insights frontend contract against the actual backend FinancialInsight record (type/title/explanation/severity/generatedAt).


## 2026-09-23 — Financial integrity continuation

- AI finance context date validation now returns explicit HTTP 400 for missing, reversed or oversized windows instead of leaking generic argument errors.
- Debt responses now have typed frontend contracts and runtime validation; Net Worth now includes outstanding active debt obligations in the consolidated calculation.
- CSV export formula neutralization was corrected so numeric negative values remain numeric while formula-like string values are neutralized.
- Financial snapshot rebuild now refreshes an existing owner/date snapshot instead of returning stale values; regression coverage was added.
- Asset and liability create endpoints now reject malformed balance-sheet requests with explicit HTTP 400 responses.
- Invalid debt installment payments now return HTTP 400 instead of an unhandled generic exception.
- Work continues directly on main without GitHub Actions, Work or Codex as execution dependencies.
- CI/build remains unverified and is not represented as passed.

**Current implementation scope estimate: 88%**

This remains a scope estimate for engineering implementation, not a test/build/release percentage.


## 2026-09-23 — API contract completion pass

- Added runtime schemas for import batches, import errors and debts, and wired them into the typed frontend API layer.
- Centralized CSV serialization and added formula-neutralization tests while preserving numeric negative values.
- Import error responses are now structured DTOs that expose row number, error code and safe error message rather than leaking persistence objects.
- Balance-sheet asset/liability domain objects now expose the fields required by the validated frontend contract; this closes a response-shape mismatch in the Net Worth screen.
- Net Worth now accounts for outstanding debt obligations in addition to registered liabilities.
- Snapshot rebuild semantics and debt/asset/liability validation were hardened with explicit API behavior.
- Current implementation scope estimate: 89%.


## 2026-09-23 — KOVI context payload hardening

- KOVI Finance context now caps transaction evidence at 2,000 records per bounded request while preserving aggregate calculations across the complete requested window.
- The response explicitly reports when transaction evidence is truncated, keeping the internal intelligence contract bounded without silently changing aggregate totals.


## 2026-09-23 — Debt planning surface

- Added a governed frontend debt view with owner-scoped backend data, outstanding balance aggregation, active debt count and localized states.
- Enriched the debt API contract with safe read fields for planning clients while keeping mutations behind authenticated backend authorization.
- Added navigation and routing for the debt planning surface.


## 2026-09-23 — Operational notifications surface

- Added typed notification contracts and runtime validation in the frontend API layer.
- Added a governed Notifications screen with unread count and owner-scoped mark-as-read actions.
- Added routing, navigation and PT-BR/EN localization for financial notifications.
- Added contract regression tests for valid and malformed notification payloads.


The implementation pass also confirmed there are no remaining TODO/TBD placeholders in the repository search used for this checkpoint. CI/build is still not claimed as verified.

## 2026-09-23 — Contract, UX and domain-integrity hardening continuation

- Restored the Finance application effect import and removed remaining hardcoded UI labels from the main financial shell where localization already exists.
- Hardened the command palette with focus trapping and background-scroll locking; notification actions now handle mutation failures without unhandled promises.
- Scoped notification query invalidation to the authenticated owner and localized notification timestamps.
- Kept dashboard income/expense totals currency-consistent by using backend analytics only when all owner accounts are BRL; otherwise the dashboard derives BRL totals from BRL transactions.
- Consolidated frontend response validation for mutation payloads and invoice-purchase lists, including structured multipart import error handling.
- Tightened frontend monetary schemas to reject impossible negative/zero values according to the corresponding domain invariants.
- Enforced category hierarchy type integrity and restricted budgets to expense categories at the backend boundary, with regression tests.
- Hardened asset/liability update validation and debt rate/date invariants, with regression coverage.
- KOVI Finance context now reports the complete non-cancelled transaction count separately from the bounded transaction evidence list, and the summary surface exposes the evidence-truncation flag.
- No CI/build success is claimed from these changes; verification remains a separate release gate.

**Current implementation scope estimate: 93%**

This is an engineering-scope estimate, not a test/build/release percentage. Remaining work is concentrated in integrated QA/E2E coverage, broader application-shell decomposition, deeper planner parity/UX, observability and final production verification.

## 2026-09-23 — Import/export and validation completion pass

- Import history now exposes governed row-level error details through the existing backend import-error contract.
- Import history refresh is now actionable and generated CSV object URLs are released safely after download initiation.
- Multipart API failures now preserve backend error code, message, status and request correlation consistently with JSON requests.
- Mutation responses for core financial creates are now runtime-validated with the same Zod contract boundary used for reads.
- Dashboard, debt, liability and balance-sheet response contracts have stricter monetary bounds.
- Added regression coverage for malformed mutation responses, multipart failures and negative balance-sheet/debt values.
- Latest known implementation checkpoint: `b3ade11674c62ec4409b251e2def650966878357`.
- CI/build remains intentionally unclaimed until an observed successful verification run.

**Current implementation scope estimate: 94%**

This remains a scope estimate for engineering implementation. The remaining 6% is primarily integrated frontend/backend QA, broader E2E coverage, final UX parity polish, observability/release verification and production homologation.


## 2026-09-23 — Planner parity continuation: snapshots and transfers

- Added a safe financial snapshot response DTO instead of exposing the persistence entity directly.
- Snapshot rebuild/list endpoints remain authenticated and owner-scoped; snapshot history is now consumable as a stable frontend contract.
- Fixed the snapshot regression test to use the actual transaction repository method name.
- Added typed/Zod-validated snapshot contracts and a frontend snapshot history section to Net Worth.
- Added the missing core account-transfer user flow backed by the existing idempotent ledger transfer service.
- Added typed/Zod-validated transfer contracts, automatic idempotency keys and localized transfer UI/navigation.
- Hardened the global API exception handler so validation, malformed JSON and constraint failures return structured 400 responses.
- Added frontend regression coverage for snapshot and transfer response contracts.
- Current latest implementation commit: `78f3be7470bb4701e3ba9cf113e4c7c6dfeb4ed7`.
- CI/build remains unverified; no successful workflow or local build is claimed.
- Scope estimate: 91%.


## Checkpoint — 2026-09-23 — transfer, snapshots e hardening de API

- Registrado no GitHub o bloco de evolução do Finance: contratos e histórico de snapshots financeiros; validação centralizada de erros de API; contratos frontend para snapshots e transferências; transferências com Idempotency-Key; nova superfície de transferência entre contas; localização PT-BR/EN; navegação e rotas correspondentes.
- O backend continua como fonte de verdade e o escopo do usuário autenticado permanece obrigatório.
- CI/build não foi considerado aprovado nesta etapa; as alterações foram registradas diretamente no branch `main`.
- Último commit verificado antes deste registro: `8ae4a61b257e1c5db553a9747ae951a923522e23`.


## 2026-09-23 — Transfer reliability hardening

- Transfer retries now reuse the same client-generated idempotency key for a logical submission, preventing a network retry from creating a second ledger transfer.
- The backend ledger transfer service remains the authoritative source for balance, currency, ownership, idempotency and audit enforcement.
- Snapshot history and transfer contracts are now covered by frontend runtime-schema regression tests.
- Final implementation checkpoint for this continuation: latest main commit is tracked below after the final documentation commit.
- Scope estimate: 92%.


## 2026-09-23 — Esqueleto do projeto registrado no GitHub

- Registrado o estado consolidado do esqueleto/arquitetura do KOVIAN Finance após a sequência de evolução da fundação do Personal Finance Planner.
- A arquitetura permanece organizada em frontend/PWA → API tipada → serviços Spring Boot → PostgreSQL/Redis, com o backend como fonte de verdade financeira.
- O esqueleto frontend inclui shell de aplicação, contratos TypeScript/Zod, preferências isoladas, dashboard, planejamento, patrimônio/snapshots, transferências, notificações, dívidas, previsão, importação/exportação e KOVI Intelligence.
- O esqueleto backend mantém domínios financeiros separados, autorização por usuário, ledger, idempotência, auditoria, outbox, reconciliação e contratos controlados para inteligência.
- A integração com o upstream oofangoo/personal-finance-planner permanece documentada como fundação de UX/aplicação, sem substituir a arquitetura de domínio e persistência do KOVIAN.
- Este checkpoint registra a alteração estrutural no branch main; CI/build continua sem aprovação enquanto não houver evidência de verificação bem-sucedida.
- Último commit observado antes deste registro: 6793b69cf342eb3820f4db7315ce79fb7f5fd935.


## 2026-09-23 — Final hardening continuation

- Corrigido teste de snapshot para usar assertiva JUnit explícita em vez de Java assert, tornando a verificação independente de `-ea`.
- Endurecido o contrato de evidências do KOVI para descrições de transação nulas, evitando falhas ao construir respostas de contexto.
- Aplicada a mesma proteção à superfície interna KOVI Finance.
- Removida dependência/import não utilizado do controller de outbox.
- Mantida a separação de responsabilidades: KOVI interno somente leitura, backend financeiro como fonte de verdade e escopo do proprietário autenticado nas superfícies financeiras.
- CI/build continua não aprovado sem evidência verificável de execução bem-sucedida.
- Escopo de implementação estimado: 95%.


## 2026-09-23 — Transfer UX/cache invalidation and query regression coverage

- A transferência entre contas agora invalida as queries financeiras após sucesso, mantendo dashboard, contas e demais superfícies sincronizadas sem depender de um refetch local isolado.
- Preservada a mesma chave de idempotência durante uma tentativa lógica de transferência, evitando duplicidade em retries de rede.
- Adicionada cobertura frontend para o contrato de transferência, incluindo Idempotency-Key, correlação X-Request-ID e validação runtime da resposta.
- Adicionada cobertura para a janela de 90 dias do dashboard, com limites UTC determinísticos.
- CI/build continua sem aprovação por ausência de execução bem-sucedida verificável nesta etapa.

**Current implementation scope estimate: 96%**

O restante está concentrado em QA integrado/E2E, decomposição final do App.tsx, paridade/ajustes finos de UX, observabilidade e homologação final de produção.


## 2026-09-23 — QA surface expansion and frontend hardening

- Expandido o smoke E2E para todas as rotas financeiras principais e novas superfícies de previsão, patrimônio, inteligência, dívidas, notificações, importação/exportação e transferências.
- Adicionada verificação E2E dos títulos das novas páginas, reduzindo o risco de rota registrada mas renderização incorreta.
- Endurecida a apresentação da previsão: horizonte limitado ao conjunto suportado pelo backend, retry controlado e rejeição visual de dados numéricos inválidos.
- Estabilizado o carregamento de patrimônio com retry e histórico ordenado por data mais recente.
- KOVI Intelligence passou a priorizar visualmente insights por severidade e, em empate, por data de geração.
- Nenhuma dependência de GitHub Actions/Codex/Work foi adicionada.
- CI/build continua não aprovado sem execução verificável bem-sucedida.

**Current implementation scope estimate: 97%**

Restante principal: execução/homologação E2E integrada, validação real de build/testes no ambiente de execução, decomposição final do App.tsx, observabilidade e release readiness.


## 2026-09-23 — Application shell decomposition and request correlation

- Decomposed the legacy finance planner page out of `frontend/src/App.tsx` into `frontend/src/pages/FinancePage.tsx`, preserving the existing planner route configuration and behavior while reducing the application entrypoint to routing/composition responsibilities.
- Added a frontend routing-contract regression test covering the nine legacy planner routes and their localization mappings.
- Corrected the extracted page's icon import boundary while moving the existing planner implementation, including the previously referenced Sparkles icon.
- Added a backend request-correlation filter that safely accepts bounded `X-Request-ID` values or generates a UUID when the incoming value is absent/unsafe, and always propagates the correlation id in the response.
- Added backend regression coverage for safe request-id preservation and unsafe-header replacement.
- No GitHub Actions, Work or Codex dependency was introduced.
- Build/test execution remains unverified from this session because the connected workstation is offline and no local execution environment is available; no passing build/test result is claimed.

**Current implementation scope estimate: 98%**

Remaining work is concentrated in integrated execution/homologation, deeper UX parity polish, additional shell decomposition where it materially reduces coupling, observability validation in a live runtime, and final production/release readiness.


## 2026-09-23 — Online deployment gate and hosting hardening

- Frontend hosting was audited against the actual Vercel configuration instead of assuming the local `/app/` base path also applies to root-hosted Vercel deployments.
- Made the Vite base path configurable through VITE_APP_BASE_PATH; local/Spring-hosted behavior keeps `/app/`, while Vercel is configured for `/`.
- Switched PWA manifest/icon URLs to Vite's %BASE_URL% placeholder and derived the React Router basename/service-worker scope from import.meta.env.BASE_URL.
- Added a Vercel rewrite that proxies `/api/v1/*` to the Railway Finance API, keeping the browser API origin aligned with the deployed frontend.
- Verified the Railway Finance API service is connected to kovacsruan-stack/kovian-finance:main and exposes the healthcheck path `/actuator/health`.
- Production backend homologation is still blocked by infrastructure configuration: the Railway Finance API has no PostgreSQL service/connection variables in its production environment, and the latest observed backend startup failed because the resolved datasource URL was not a JDBC URL.
- Vercel deployment verification is currently blocked by the connected provider/build-rate-limit state; no READY deployment is claimed for the new frontend commits.
- No production credentials or secret values were added to the repository.
- No GitHub Actions, Work or Codex dependency was introduced.

**Current implementation scope estimate: 98%**

The remaining implementation is small and concentrated in integrated production homologation: provision/wire PostgreSQL + Redis in the runtime environment, apply production secrets, obtain a successful Vercel build/deployment, execute end-to-end smoke checks against the real API and close the release checklist. This percentage is an engineering-scope estimate, not a build/test/release percentage.


## 2026-09-23 — Runtime configuration hardening

- Spring datasource configuration now gives explicit `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME` and `SPRING_DATASOURCE_PASSWORD` precedence while retaining the existing KOVIAN `DATABASE_*` compatibility variables.
- Redis configuration now accepts the standard `SPRING_DATA_REDIS_URL` variable before the existing `REDIS_URL` fallback.
- Server port now honors Railway's injected `PORT` before `SERVER_PORT`, while preserving the local 8082 default.
- Railway runtime audit confirms the Maven/Docker build succeeds; the current production blocker is infrastructure, not compilation: the project is at the HOBBY 5-service limit and has no PostgreSQL/Redis service available for KOVIAN Finance.
- The Railway Finance deployment still fails at datasource initialization because the configured database URL is not a valid JDBC URL for the current environment.
- No destructive service deletion or unrelated project reuse was performed to bypass the infrastructure limit.

**Current implementation scope estimate: 98%**

The remaining work is concentrated in production infrastructure/homologation: provide a PostgreSQL service/connection, provide Redis or explicitly choose a supported cache fallback, redeploy the API, verify health/Flyway, obtain a READY Vercel deployment and execute integrated smoke checks.


## 2026-09-23 — Final continuation checkpoint

- Hardened Spring runtime configuration with standard Railway/Spring datasource and Redis variable precedence and injected PORT support.
- Hardened the typed frontend API boundary so malformed successful JSON responses become structured FinanceApiError instances instead of leaking parser failures.
- Added regression coverage for malformed successful JSON.
- Added baseline Vercel security response headers.
- Fixed PWA service-worker scope to derive from the actual deployed base path instead of assuming /app/.
- Made the web manifest start URL, scope and icon path relative to the manifest location so both /app/ hosting and root Vercel hosting resolve correctly.
- Added the production runbook covering Railway services, variable contracts, verification order and release gates.
- Local Opera QA confirms the Finance shell renders the Reports route with navigation and language controls without a visible runtime error in the current local environment.
- Railway still skips new deployments because the current service has no deployable snapshot for the new commits; the last real deployment failure remains the missing/invalid JDBC database configuration.
- Vercel's connected status reports the provider build-rate-limit gate; no new READY deployment is claimed.

**Current implementation scope estimate: 98%**

The remaining work is release/homologation rather than broad feature implementation: provision PostgreSQL/Redis or an explicitly approved equivalent runtime, wire production variables, obtain successful Railway and Vercel deployments, run integrated smoke/E2E checks and close the release checklist.


## 2026-09-24 continuation checkpoint
- Added the financial calendar UI, using authoritative transaction/recurring/account APIs and preserving account currency in event rendering.
- Added calendar navigation, responsive month grid, event list and ecosystem navigation entry in PT-BR/EN.
- Added planner mapping documentation so the calendar interaction is recovered without adopting browser-side financial persistence.
- Backend Railway QA remains green on the latest verified finance commit; Vercel frontend deployments are currently blocked by the account build-rate limit, so the new frontend path still requires an executable frontend build/QA before production promotion.
