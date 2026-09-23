# KOVIAN Finance — Personal Finance Planner Foundation Design

**Date:** 2026-09-23  
**Status:** Draft for review  
**Source foundation:** `oofangoo/personal-finance-planner`  
**Target:** `kovacsruan-stack/kovian-finance`

## 1. Goal

Use the complete functional structure of `oofangoo/personal-finance-planner` as the UX/application-shell foundation for KOVIAN Finance, while preserving the existing KOVIAN Finance Spring Boot domain, security, persistence, integration contracts, QA, and production controls.

The result must be a KOVIAN-owned financial product rather than a thin fork: the source application's reusable functionality becomes the presentation/planning foundation, and KOVIAN capabilities become the authoritative domain and intelligence layer.

The source repository is MIT licensed. KOVIAN must retain the required copyright/license notice and clearly document the upstream attribution. The source README describes Next.js, React, TypeScript, Tailwind, Recharts, multi-currency, localization, financial planning, forecasting, import/export, and browser persistence as core capabilities.

## 2. Current-state findings

### Upstream foundation

The upstream repository contains these major areas:

- `app/`: Dashboard, income, expenses, goals, goal planning, forecast, import/export and supporting routes.
- `components/`: navigation, AI button, currency/language controls, theme and charts.
- `context/`: financial state, currency, language, theme, reducer/actions and persistence.
- `services/ai/`: AI-related client functionality.
- `types/`: financial TypeScript models.
- `utils/`: calculations and application helpers.
- `.github/`, Taskmaster and Cursor rules for development workflow.
- Next.js 15 / React 19 / TypeScript / Tailwind CSS 4 / Recharts.

Its current persistence model is browser-first/localStorage. Its AI roadmap is intentionally limited compared with KOVI Intelligence.

### KOVIAN current foundation

The target repository already has:

- Java 21 / Spring Boot 4
- Spring MVC, Validation, JPA and Security
- PostgreSQL + Flyway
- Redis and caching
- Actuator + Prometheus
- OpenAPI
- account, transaction, category, budget, goal, card, debt, asset and liability domains
- recurring transactions
- forecasting and snapshots
- imports and reconciliation
- ledger and idempotency
- notifications
- audit
- outbox
- KOVI Intelligence services/contracts
- analytics/integration contracts
- owner isolation and internal authentication
- CI, PWA and browser QA
- LGPD/security/production documentation.

These capabilities are authoritative and must not be replaced by localStorage-based client models.

## 3. Architectural decision

### Decision

Adopt the upstream project's **application UX and financial-planning interaction model**, not its persistence architecture.

The KOVIAN backend remains the system of record.

Target flow:

Browser/PWA
→ KOVIAN Frontend
→ typed API client
→ Spring Boot application services
→ PostgreSQL/Redis
→ KOVI Intelligence / integrations where explicitly permitted.

Client state is limited to UI/session concerns, optimistic state where safe, cached query state, and temporary import/export data. Financial truth is always obtained from the KOVIAN API.

### Why

This preserves the strongest parts of both systems:

1. Upstream: mature financial planning UX and visualization.
2. KOVIAN: domain boundaries, persistence, security, auditability, integrations and AI.
3. Combined: a coherent production architecture without maintaining two competing financial data models.

## 4. Frontend strategy

The existing frontend will be migrated toward the upstream structure in a controlled way.

The implementation must preserve the current KOVIAN frontend capabilities that are not present upstream, including:

- KOVIAN branding
- PT-BR and EN localization
- PWA
- current QA harness
- API integration layer
- KOVIAN control-plane hooks
- accessibility and responsive requirements.

The final frontend should expose the upstream modules as KOVIAN routes/components while consuming KOVIAN APIs.

### Mapping

| Upstream concept | KOVIAN implementation |
|---|---|
| Income | Transaction/income domain API |
| Expense | Transaction domain API |
| Goal | Goal API |
| Forecast | Forecast API |
| Dashboard | Analytics + snapshot + forecast APIs |
| Recurring | Recurring transaction API |
| Installments | Card/debt/transaction APIs |
| Categories | Category API |
| Currency | KOVIAN locale/currency contract |
| Import/export | Import API + controlled export |
| AI button | KOVI Intelligence API |
| localStorage financial plan | Removed as authoritative storage |
| browser persistence | UI preferences/cache only |

## 5. Data ownership rules

The following rules are mandatory:

1. PostgreSQL is the authoritative financial datastore.
2. The browser must never become the canonical source for financial records.
3. API DTOs must be separated from persistence entities.
4. Monetary values must use exact decimal semantics; no floating-point financial calculations.
5. Every user-owned financial resource must remain owner-scoped.
6. Mutating operations must respect idempotency where the domain requires it.
7. Audit-sensitive operations must remain auditable.
8. Imports must go through validation/reconciliation rather than direct database writes.
9. AI receives only the minimum approved financial context required for a request.
10. Secrets and provider credentials never enter frontend source or browser storage.

## 6. KOVI Intelligence additions

The upstream AI UX will be converted into a real KOVI Intelligence capability.

Initial intelligence capabilities:

### Financial explanation

Answer questions about the user's own financial data using structured backend context.

### Anomaly detection

Detect unusual spending/income patterns using deterministic rules first, with AI used for explanation rather than authoritative arithmetic.

### Forecast intelligence

Explain forecast changes, identify important assumptions and compare scenarios.

### Goal intelligence

Explain goal progress, projected completion and allocation pressure.

### Recurring-spend intelligence

Identify recurring obligations and potential subscription-like expenses from transaction data.

### Categorization assistance

Suggest transaction categories with confidence and allow user confirmation. The system must retain provenance of automated suggestions.

### Scenario planning

Allow users to model changes without mutating actual financial records.

### Insight lifecycle

Each generated insight should contain:

- source data/time window
- calculation/decision provenance
- confidence where applicable
- generated-at timestamp
- model/provider metadata when AI is involved
- clear distinction between computed fact and generated explanation.

KOVI must not present generated financial explanations as regulated financial advice.

## 7. Financial modules

The consolidated product will expose these user-facing modules:

1. Dashboard
2. Accounts
3. Income
4. Expenses
5. Transactions
6. Recurring transactions
7. Categories
8. Budgets
9. Credit cards
10. Debts
11. Assets
12. Liabilities
13. Goals
14. Goal planning
15. Forecast
16. Net worth
17. Reports/analytics
18. Import/export
19. Notifications
20. KOVI Intelligence
21. Settings.

The exact route organization may differ from the upstream project where required by the KOVIAN domain model.

## 8. Brazil-first financial requirements

The first production market is Brazil.

The design must support:

- BRL as first-class currency
- Brazilian date/number formatting
- installment purchases
- credit-card invoices
- recurring obligations
- Pix-related transaction metadata where available
- Brazilian category defaults
- CSV bank-statement import
- future Open Finance integration boundary.

Open Finance must remain behind an explicit integration boundary. It must not be coupled directly into core financial calculations.

## 9. Security and LGPD

The migration must preserve the existing KOVIAN security controls.

Required controls:

- authenticated access for hosted environments
- owner isolation
- correlation IDs
- rate limiting
- internal KOVI authentication
- audit events
- least-privilege API access
- no sensitive financial data in logs
- no secrets in client bundles
- secure HTTP-only authentication mechanisms where applicable
- input validation
- output encoding
- CSRF/CORS policy appropriate to deployment
- dependency and supply-chain scanning
- import size/type limits
- protection against CSV formula injection on exports
- controlled AI data disclosure.

Any upstream browser persistence mechanism that conflicts with these requirements must be replaced.

## 10. Testing strategy

### Frontend unit/integration

Cover:

- currency formatting
- financial calculations
- forecast presentation
- goal allocation
- recurring schedules
- installment presentation
- API error states
- empty states
- loading states
- localization
- accessibility.

### Backend

Continue:

- domain tests
- repository/integration tests
- API contract tests
- security tests
- idempotency tests
- reconciliation tests
- AI boundary tests.

### End-to-end

The existing browser QA standard remains mandatory.

Critical flows:

1. login/session
2. dashboard
3. create income
4. create expense
5. create recurring transaction
6. create goal
7. create budget
8. credit-card workflow
9. forecast
10. import
11. export
12. KOVI Intelligence
13. language switch
14. responsive/mobile layout.

## 11. Migration safety

The migration must be incremental.

### Phase A — Foundation

- Preserve current backend.
- Preserve current CI and QA.
- Introduce upstream frontend structure.
- Preserve KOVIAN branding and contracts.
- Add upstream attribution/license information.

### Phase B — API adapter

- Create typed frontend API modules.
- Map upstream financial models to KOVIAN DTOs.
- Replace localStorage financial persistence.
- Keep UI preferences locally persisted.

### Phase C — Module migration

Migrate dashboard, income, expenses, goals, goal planning, forecast and import/export.

### Phase D — KOVIAN modules

Add accounts, cards, debts, assets, liabilities, recurring transactions, notifications, reports and net worth.

### Phase E — KOVI Intelligence

Connect the AI UI to backend intelligence services and enforce the context boundary.

### Phase F — Hardening

- accessibility
- performance
- security
- responsive QA
- migration cleanup
- dependency audit
- production build
- deployment validation.

No phase may remove an existing KOVIAN capability without an equivalent replacement or an explicit architectural decision.

## 12. Performance requirements

- Avoid loading all financial records into the browser.
- Use server-side pagination/filtering for large collections.
- Cache safe read models with React/query caching and backend caching where appropriate.
- Use aggregate endpoints for dashboards rather than N+1 requests.
- Lazy-load heavy chart/report modules.
- Virtualize long transaction lists where necessary.
- Avoid unnecessary global React state for server data.
- Keep initial PWA payload bounded.
- Do not send complete financial histories to AI for simple questions.

## 13. Import/export safety

Import pipeline:

File
→ size/type validation
→ parsing
→ schema normalization
→ row validation
→ duplicate detection
→ preview
→ user confirmation
→ transactional import
→ reconciliation
→ audit record.

Export pipeline:

KOVIAN data
→ owner authorization
→ filtered dataset
→ safe serialization
→ CSV/JSON export
→ formula-injection protection
→ download.

## 14. Attribution and licensing

The repository must include a dedicated attribution document identifying:

- upstream repository
- original author/project
- MIT license
- date/foundation of reuse
- major modifications made by KOVIAN.

The upstream LICENSE text must remain available according to MIT requirements.

KOVIAN-specific code, branding and domain functionality remain distinguishable from upstream-originated code.

## 15. Definition of done

The migration is considered complete only when:

- upstream core UX modules are available in KOVIAN;
- KOVIAN backend remains authoritative;
- no financial source of truth depends on localStorage;
- all migrated screens consume typed KOVIAN APIs;
- KOVI Intelligence is integrated through the existing boundary;
- owner isolation remains enforced;
- existing backend tests pass;
- frontend tests pass;
- production builds pass;
- browser QA passes on affected critical flows;
- mobile/PWA behavior passes;
- security controls pass;
- upstream attribution/license requirements are satisfied;
- documentation reflects the final architecture;
- no duplicate financial model remains without an explicit reason.

## 16. Out of scope for the first migration

The first migration will not automatically introduce:

- direct bank credential storage
- automatic bank login
- money movement
- brokerage trading
- autonomous financial transactions
- autonomous investment execution
- unrestricted AI access to financial databases
- replacement of the Spring Boot domain with client-side state.

These can be separate architectural projects later.

## 17. Acceptance criteria

The user should be able to open KOVIAN Finance and experience the upstream planner's core planning workflow while seeing KOVIAN branding and data, with:

- real persistent accounts/transactions;
- real goals;
- real budgets;
- real forecasts;
- real cards/debts/assets/liabilities where applicable;
- reliable import/export;
- localized UI;
- responsive/PWA behavior;
- KOVI Intelligence insights;
- secure owner-scoped data;
- observable and testable APIs.

The implementation must favor explicit domain boundaries, typed contracts, deterministic financial calculations and incremental migration over a large destructive rewrite.
