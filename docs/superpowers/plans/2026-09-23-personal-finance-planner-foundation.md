# Personal Finance Planner Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform KOVIAN Finance into a KOVIAN-owned financial-planning product using the complete UX/application-shell strengths of `oofangoo/personal-finance-planner` while keeping Spring Boot/PostgreSQL as the authoritative financial system.

**Architecture:** The existing Spring Boot 4 backend remains the system of record and keeps its security, ownership, ledger, audit, import, reconciliation, forecasting and KOVI boundaries. The frontend is evolved toward the upstream planner's module-oriented application structure and workflows, but its persistence is replaced by typed KOVIAN API/query adapters; browser persistence is limited to UI preferences, transient state and controlled import/export staging. KOVI Intelligence is exposed only through governed application services.

**Tech Stack:** Java 21, Spring Boot 4, Spring MVC, JPA, PostgreSQL, Flyway, Redis, Spring Security/OAuth2 Resource Server, OpenAPI, Testcontainers; React 19, TypeScript 5.9, Vite 7, React Router 7, TanStack Query 5, React Hook Form, Zod, i18next, Playwright, Vitest; Recharts-compatible charting where needed.

**Spec:** `docs/superpowers/specs/2026-09-23-personal-finance-planner-foundation-design.md`

## Global Constraints

- PostgreSQL remains the authoritative financial source of truth; localStorage must never become canonical financial persistence.
- Money uses exact decimal semantics in backend/domain calculations; frontend display and input must not silently introduce floating-point financial truth.
- All financial reads and mutations are owner-scoped and authorization is enforced server-side.
- DTOs/API contracts remain separate from persistence entities.
- Sensitive mutations remain auditable and externally triggered financial events remain idempotent.
- KOVI receives bounded, governed application context and never unrestricted database access.
- Preserve KOVIAN PT-BR/EN localization, PWA behavior, responsive/mobile behavior, accessibility and existing online-first QA controls.
- Preserve upstream MIT license/attribution in the repository and document major modifications.
- Do not remove an existing KOVIAN capability unless an equivalent replacement is implemented and verified.
- Do not add bank credential storage, money movement, brokerage execution, unrestricted AI database access or autonomous financial transactions in this migration.
- Browser API requests must retain bearer authentication, request IDs, bounded timeouts and safe error handling.
- Avoid loading all historical financial records into the browser; use bounded ranges, pagination, filters and aggregate endpoints.
- Every new financial workflow must have unit/integration coverage and a critical browser flow where applicable.

## Review Focus

1. **Owner mismatch or forged owner IDs** — API calls must derive authorization from authenticated server context rather than trusting a browser-supplied owner ID; pin this in backend authorization tests and frontend contract tests.
2. **Decimal/large monetary values** — calculations and serialization must preserve cents and avoid binary floating-point drift; pin this in transaction, budget, forecast and dashboard tests.
3. **Empty, slow or partially failing APIs** — pages must show stable loading/empty/error states without corrupting cached data; pin this in query and Playwright tests.
4. **Recurring/installment boundary dates** — monthly/yearly recurrence and card installment periods must remain deterministic around month-end and timezone boundaries; pin this in recurring/card service tests.
5. **Import/export hostile input** — malformed rows, duplicates and CSV formula-injection strings must be rejected or safely normalized before persistence/download; pin this in importer/export tests.

---

### Task 1: Preserve the upstream foundation and attribution contract

**Files:**
- Create: `docs/OPEN_SOURCE_FOUNDATION.md`
- Create: `docs/UPSTREAM_PERSONAL_FINANCE_PLANNER_MAPPING.md`
- Modify: `README.md`
- Modify: `LICENSE` only if required to preserve the upstream MIT notice already introduced by the migration
- Test: `docs/superpowers/specs/2026-09-23-personal-finance-planner-foundation-design.md` remains the governing design reference

**Interfaces:**
- Produces the repository-level record of the upstream source, MIT license, adoption date, retained modules and KOVIAN modifications.
- Produces a stable mapping document used by later frontend tasks to avoid reintroducing localStorage financial persistence.

- [ ] **Step 1: Write the attribution document** with the exact upstream repository `oofangoo/personal-finance-planner`, the MIT license, the adopted source snapshot, retained UX concepts, and explicit statement that KOVIAN backend persistence is authoritative.
- [ ] **Step 2: Write the mapping document** listing upstream concepts `app`, `components`, `context`, `services/ai`, `types`, `utils` and their KOVIAN equivalents, including the rule that upstream localStorage persistence is not imported as financial truth.
- [ ] **Step 3: Update README** with the foundation/architecture note and links to both documents.
- [ ] **Step 4: Review** the documents for license compliance, KOVIAN ownership language and contradiction with the architecture spec.
- [ ] **Step 5: Commit.**
```bash
git add docs/OPEN_SOURCE_FOUNDATION.md docs/UPSTREAM_PERSONAL_FINANCE_PLANNER_MAPPING.md README.md LICENSE
git commit -m "docs: record personal finance planner foundation"
```

### Task 2: Establish frontend domain types and API boundaries

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/queries.ts`
- Create: `frontend/src/lib/financeTypes.ts`
- Create: `frontend/src/lib/apiErrors.ts`
- Test: `frontend/src/lib/api.test.ts`
- Test: `frontend/src/lib/queries.test.ts`

**Interfaces:**
- `financeTypes.ts` owns UI/API-safe domain types such as `FinanceAccount`, `FinanceTransaction`, `FinanceGoal`, `FinanceBudget`, `FinanceCard`, `FinanceInvoice`, `FinancePurchase`, `FinanceRecurring`, `FinanceAnalytics`, and importer/export DTOs.
- `api.ts` exposes typed functions such as `getAccounts(ownerId)`, `getTransactions(from,to)`, `createTransaction(input)`, `getGoals(ownerId)`, `getBudgets(ownerId,from,to)`, and module-specific mutations.
- `queries.ts` exposes stable TanStack Query keys and invalidation boundaries.

- [ ] **Step 1: Extract the existing exported finance types** from `api.ts` into `financeTypes.ts` without changing their public shapes.
- [ ] **Step 2: Add schema-level runtime validation** for API payloads with Zod at the response boundary. Example:
```ts
const financeAccountSchema = z.object({
  id: z.string(),
  name: z.string(),
  accountType: z.string(),
  currency: z.string().length(3),
  currentBalance: z.number(),
  status: z.string(),
})
export const financeAccountListSchema = z.array(financeAccountSchema)
```
- [ ] **Step 3: Refactor `api.ts` to parse validated responses** while preserving bearer token, request ID, 15-second timeout, no-store cache policy and `FinanceApiError`.
- [ ] **Step 4: Add explicit owner-safe request helpers** so UI code does not concatenate arbitrary owner identifiers for mutation authorization; retain owner ID only where required by an existing read endpoint.
- [ ] **Step 5: Add tests** proving malformed payloads fail closed, API errors preserve status/request ID/code, timeout/network failures are classified, and query keys include owner/range where server data is scoped.
- [ ] **Step 6: Run frontend unit tests.**
```bash
cd frontend && npm test -- --runInBand
```
Expected: PASS for all existing and new API/query tests.
- [ ] **Step 7: Commit.**
```bash
git add frontend/src/lib/api.ts frontend/src/lib/queries.ts frontend/src/lib/financeTypes.ts frontend/src/lib/apiErrors.ts frontend/src/lib/api.test.ts frontend/src/lib/queries.test.ts
git commit -m "refactor: harden finance frontend API boundaries"
```

### Task 3: Split the monolithic application shell into upstream-inspired focused modules

**Files:**
- Modify: `frontend/src/App.tsx`
- Create: `frontend/src/components/layout/FinanceShell.tsx`
- Create: `frontend/src/components/layout/FinanceNavigation.tsx`
- Create: `frontend/src/components/layout/FinanceHeader.tsx`
- Create: `frontend/src/components/layout/CommandPalette.tsx`
- Create: `frontend/src/components/ui/Modal.tsx`
- Create: `frontend/src/components/ui/Field.tsx`
- Create: `frontend/src/pages/DashboardPage.tsx`
- Create: `frontend/src/pages/FinanceModulePage.tsx`
- Create: `frontend/src/routes.tsx`
- Test: `frontend/src/components/layout/FinanceShell.test.tsx`
- Test: `frontend/src/components/layout/CommandPalette.test.tsx`
- Test: `frontend/src/pages/DashboardPage.test.tsx`

**Interfaces:**
- `FinanceShell({children}: {children: ReactNode})) owns responsive navigation and global chrome.
- `CommandPalette({open,onClose}: {open:boolean; onClose:()=>void})) owns keyboard/search navigation.
- `DashboardPage` owns dashboard presentation only and consumes `useFinanceDashboard`.
- `FinanceModulePage` is a temporary reusable module shell for already-backed modules while dedicated pages are introduced.
- `routes.tsx` maps URL paths to pages without embedding business logic in `App.tsx`.

- [ ] **Step 1: Write rendering tests** for navigation, Ctrl/Cmd+K palette, Escape focus restoration, dashboard loading/error/empty states.
- [ ] **Step 2: Move the current `Shell` implementation** into `FinanceShell.tsx` unchanged in behavior.
- [ ] **Step 3: Move navigation arrays and links** into `FinanceNavigation.tsx`, retaining existing ecosystem links and mobile drawer behavior.
- [ ] **Step 4: Move command palette behavior** into `CommandPalette.tsx`, preserving focus management and keyboard semantics.
- [ ] **Step 5: Move `Modal` and `Field`** into focused UI files and keep the existing focus trap/escape behavior.
- [ ] **Step 6: Move dashboard JSX/calculations** into `DashboardPage.tsx`; use typed query data and no local financial persistence.
- [ ] **Step 7: Move route declarations** into `routes.tsx` and reduce `App.tsx` to composition.
- [ ] **Step 8: Run unit tests and build.**
```bash
cd frontend && npm test && npm run build
```
Expected: PASS and a successful Vite production build.
- [ ] **Step 9: Commit.**
```bash
git add frontend/src/App.tsx frontend/src/components frontend/src/pages frontend/src/routes.tsx
git commit -m "refactor: split finance application shell"
```

### Task 4: Implement the planner dashboard as a real financial overview

**Files:**
- Modify: `frontend/src/pages/DashboardPage.tsx`
- Modify: `frontend/src/lib/queries.ts`
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/components/dashboard/BalanceSummary.tsx`
- Create: `frontend/src/components/dashboard/CashFlowSummary.tsx`
- Create: `frontend/src/components/dashboard/GoalProgress.tsx`
- Create: `frontend/src/components/dashboard/RecentTransactions.tsx`
- Create: `frontend/src/components/dashboard/FinancialChart.tsx`
- Test: `frontend/src/components/dashboard/BalanceSummary.test.tsx`
- Test: `frontend/src/components/dashboard/FinancialChart.test.tsx`
- Test: `frontend/src/pages/DashboardPage.test.tsx`

**Interfaces:**
- `BalanceSummary` accepts `accounts: FinanceAccount[]` and formats by currency.
- `CashFlowSummary` accepts `FinanceAnalytics`.
- `GoalProgress` accepts `FinanceGoal[]`.
- `RecentTransactions` accepts bounded transaction results.
- `FinancialChart` accepts normalized chart points, never raw persistence entities.

- [ ] **Step 1: Write tests** for BRL balance, mixed-currency display, zero-data dashboard and savings-rate formatting.
- [ ] **Step 2: Add/consume an aggregate analytics query** rather than calculating a lifetime dashboard from every transaction.
- [ ] **Step 3: Implement the planner-style overview** with balance, income, expenses, cash flow, net worth, savings rate, goals and recent transactions.
- [ ] **Step 4: Add lazy chart rendering** so heavy chart code is loaded only when the chart section is visible.
- [ ] **Step 5: Verify mobile layout** at the existing PWA breakpoints and preserve 44px touch targets.
- [ ] **Step 6: Run unit/build tests.**
- [ ] **Step 7: Commit.**
```bash
git add frontend/src/pages/DashboardPage.tsx frontend/src/components/dashboard frontend/src/lib/api.ts frontend/src/lib/queries.ts
git commit -m "feat: build financial planner dashboard"
```

### Task 5: Replace generic module placeholders with real planner workflows

**Files:**
- Modify: `frontend/src/routes.tsx`
- Create: `frontend/src/pages/accounts/AccountsPage.tsx`
- Create: `frontend/src/pages/transactions/TransactionsPage.tsx`
- Create: `frontend/src/pages/income/IncomePage.tsx`
- Create: `frontend/src/pages/expenses/ExpensesPage.tsx`
- Create: `frontend/src/pages/categories/CategoriesPage.tsx`
- Create: `frontend/src/pages/budgets/BudgetsPage.tsx`
- Create: `frontend/src/pages/recurring/RecurringPage.tsx`
- Create: `frontend/src/pages/goals/GoalsPage.tsx`
- Create: `frontend/src/pages/cards/CardsPage.tsx`
- Test: matching `*.test.tsx` files for each page

**Interfaces:**
- Each page consumes only typed query/mutation hooks and presentation components.
- Income/expenses are views over the transaction domain; they do not introduce duplicate financial persistence.
- Filters use bounded date ranges and server-supported pagination/filter parameters.

- [ ] **Step 1: Write page tests** for empty/loading/error/success states and one create/edit interaction per module.
- [ ] **Step 2: Implement Accounts** with balances, currency, status and create-account flow.
- [ ] **Step 3: Implement Transactions** with income/expense filters, category filters, date range, pagination and reversible cancellation.
- [ ] **Step 4: Implement dedicated Income and Expenses views** over the transaction API, sharing query infrastructure rather than duplicating storage.
- [ ] **Step 5: Implement Categories and nested parent/child presentation** using existing category APIs.
- [ ] **Step 6: Implement Budgets** with period, limit, spent, remaining and over-limit states.
- [ ] **Step 7: Implement Recurring** with schedule, next occurrence, active state, pause/resume and end date.
- [ ] **Step 8: Implement Goals** with target amount, current amount, progress, target date and planning calculations.
- [ ] **Step 9: Implement Cards** with invoices, purchases and installment presentation backed by existing card endpoints.
- [ ] **Step 10: Run unit tests and build.**
- [ ] **Step 11: Commit.**
```bash
git add frontend/src/routes.tsx frontend/src/pages
git commit -m "feat: implement core financial planner modules"
```

### Task 6: Add forecast, net-worth and multi-year planning views

**Files:**
- Create: `frontend/src/pages/forecast/ForecastPage.tsx`
- Create: `frontend/src/pages/forecast/ForecastFilters.tsx`
- Create: `frontend/src/pages/forecast/ForecastTable.tsx`
- Create: `frontend/src/pages/forecast/ForecastCalendar.tsx`
- Create: `frontend/src/pages/net-worth/NetWorthPage.tsx`
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/queries.ts`
- Test: `frontend/src/pages/forecast/ForecastPage.test.tsx`
- Test: `frontend/src/pages/net-worth/NetWorthPage.test.tsx`

**Interfaces:**
- Forecast API returns a typed projection model with period, income, expenses, cash flow, balances and scenario identifier.
- Forecast filters expose horizon, scenario and display mode.
- Net worth consumes assets/liabilities aggregates, never raw unbounded records.

- [ ] **Step 1: Write tests** for 12/24/36-month horizons, empty projections, scenario switching and date-boundary formatting.
- [ ] **Step 2: Add typed forecast query functions** to the API/query layers.
- [ ] **Step 3: Implement table and calendar views** matching the planner's planning workflow.
- [ ] **Step 4: Implement scenario selection** using existing backend `FinancialScenarioService` semantics.
- [ ] **Step 5: Implement net-worth view** from asset/liability aggregates.
- [ ] **Step 6: Verify no page loads an entire transaction history for forecasting.**
- [ ] **Step 7: Run tests/build and commit.**
```bash
git add frontend/src/pages/forecast frontend/src/pages/net-worth frontend/src/lib/api.ts frontend/src/lib/queries.ts
git commit -m "feat: add forecast and net worth planning"
```

### Task 7: Implement controlled import/export workflows

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Create: `frontend/src/pages/import-export/ImportExportPage.tsx`
- Create: `frontend/src/components/import/ImportPreview.tsx`
- Create: `frontend/src/components/import/ImportResult.tsx`
- Create: `frontend/src/components/export/ExportControls.tsx`
- Create: `frontend/src/lib/importValidation.ts`
- Test: `frontend/src/lib/importValidation.test.ts`
- Test: `frontend/src/pages/import-export/ImportExportPage.test.tsx`
- Backend test: importer/reconciliation integration test in the existing importer test package

**Interfaces:**
- Import flow: file selection → client-side size/type guard → upload/parse endpoint → normalized preview → duplicate/conflict summary → explicit confirmation → server transaction.
- Export flow: owner-authorized backend request → bounded filtered export → safe CSV/JSON download.
- Browser staging may hold a selected file/preview only; it must not persist canonical records.

- [ ] **Step 1: Write tests** for malformed CSV, duplicate rows, empty file, oversized file and formula-like cells beginning with `=`, `+`, `-` or `@`.
- [ ] **Step 2: Implement client-side guards** and preview types; never trust them as the server validation layer.
- [ ] **Step 3: Wire preview/confirm calls** to the existing importer/reconciliation backend.
- [ ] **Step 4: Add safe export controls** for JSON/CSV with explicit filters and download state.
- [ ] **Step 5: Add backend integration coverage** proving duplicate detection, reconciliation and audit behavior.
- [ ] **Step 6: Run frontend/backend tests and build.**
- [ ] **Step 7: Commit.**
```bash
git add frontend/src/pages/import-export frontend/src/components/import frontend/src/components/export frontend/src/lib/importValidation.ts frontend/src/lib/api.ts
git commit -m "feat: add governed import and export workflows"
```

### Task 8: Integrate KOVI Intelligence into the planner UX

**Files:**
- Modify: `frontend/src/lib/api.ts`
- Modify: `frontend/src/lib/queries.ts`
- Create: `frontend/src/pages/intelligence/KoviFinancePage.tsx`
- Create: `frontend/src/components/intelligence/InsightCard.tsx`
- Create: `frontend/src/components/intelligence/InsightSource.tsx`
- Create: `frontend/src/components/intelligence/ScenarioPanel.tsx`
- Modify: existing backend `ai` controllers/services identified by the current KOVI contract
- Test: `frontend/src/pages/intelligence/KoviFinancePage.test.tsx`
- Test: backend AI service/controller tests in the existing `ai` test package

**Interfaces:**
- `InsightCard` receives an explicit insight DTO containing title, explanation, source window, provenance, generatedAt and optional confidence/provider metadata.
- `ScenarioPanel` sends scenario inputs to the governed scenario API and renders computed results separately from AI explanation.
- Frontend must never send database credentials, unrestricted SQL or raw persistence graphs.

- [ ] **Step 1: Write tests** proving insights render provenance, generated time and computed-vs-AI distinction.
- [ ] **Step 2: Expose/consume typed endpoints** for financial insights, anomaly explanations, forecast intelligence and scenario planning through the existing KOVI boundary.
- [ ] **Step 3: Implement intelligence cards** in dashboard and dedicated KOVI Finance view.
- [ ] **Step 4: Implement scenario planning** with explicit user inputs and read-only computed results.
- [ ] **Step 5: Add backend authorization/context-size tests** proving owner scope, bounded context and fail-closed behavior.
- [ ] **Step 6: Run frontend/backend tests.**
- [ ] **Step 7: Commit.**
```bash
git add frontend/src/pages/intelligence frontend/src/components/intelligence frontend/src/lib/api.ts frontend/src/lib/queries.ts
git commit -m "feat: integrate governed KOVI finance intelligence"
```

### Task 9: Complete localization, preferences and planner UX parity

**Files:**
- Modify: `frontend/src/i18n/config.ts`
- Create: `frontend/src/lib/preferences.ts`
- Create: `frontend/src/components/settings/PreferencesPage.tsx`
- Modify: `frontend/src/index.css`
- Modify: `frontend/src/components/layout/FinanceShell.tsx`
- Test: `frontend/src/lib/preferences.test.ts`
- Test: `frontend/src/components/settings/PreferencesPage.test.tsx`

**Interfaces:**
- `preferences.ts` may persist only UI settings such as language, theme, density and last non-sensitive view.
- Financial values, transactions, accounts, goals and forecasts must not be written to browser persistence.
- Language remains PT-BR and EN; Brazilian formatting is the default locale.

- [ ] **Step 1: Write tests** proving UI preferences survive reload while financial mock data never enters preference storage.
- [ ] **Step 2: Move preference persistence behind a small typed adapter** with keys prefixed `kovian.finance.ui.`.
- [ ] **Step 3: Complete missing PT-BR/EN strings for all planner modules and errors.**
- [ ] **Step 4: Add theme preference if the existing design system supports it without duplicating financial state.**
- [ ] **Step 5: Verify currency/date formatting for BRL, EUR and USD.**
- [ ] **Step 6: Run tests/build and commit.**
```bash
git add frontend/src/i18n/config.ts frontend/src/lib/preferences.ts frontend/src/components/settings frontend/src/index.css frontend/src/components/layout/FinanceShell.tsx
git commit -m "feat: complete finance localization and preferences"
```

### Task 10: Expand responsive, accessibility and browser E2E coverage

**Files:**
- Modify: existing Playwright configuration and test files under `frontend/`
- Create: `frontend/e2e/finance-planner.spec.ts`
- Create: `frontend/e2e/import-export.spec.ts`
- Create: `frontend/e2e/kovi-intelligence.spec.ts`
- Test: all new E2E files

**Interfaces:**
- Critical browser flows cover login/session, dashboard, income, expense, recurring, goal, budget, card/installment, forecast, import/export, KOVI Intelligence, language and responsive/mobile navigation.

- [ ] **Step 1: Write the critical-flow test skeletons** with deterministic API mocks or test backend fixtures; do not depend on production data.
- [ ] **Step 2: Add dashboard/account/transaction/goal/budget/card/forecast flow coverage.**
- [ ] **Step 3: Add import/export confirmation and hostile-input coverage.**
- [ ] **Step 4: Add KOVI Intelligence rendering and fail-closed coverage.**
- [ ] **Step 5: Add PT-BR/EN and mobile viewport coverage.**
- [ ] **Step 6: Run Chromium E2E.**
```bash
cd frontend && npm run qa:chromium
```
Expected: PASS with no uncaught console errors on critical flows.
- [ ] **Step 7: Commit.**
```bash
git add frontend/e2e frontend/playwright.config.* frontend/package.json
git commit -m "test: cover finance planner critical flows"
```

### Task 11: Backend hardening for planner-facing aggregates and authorization

**Files:**
- Modify: existing backend controllers/services for analytics, forecast, recurring, card, goal, importer and AI only where required by the planner contracts
- Create: typed response DTOs for missing aggregate/planner endpoints under the existing domain packages
- Test: corresponding controller/service integration tests
- Test: Testcontainers PostgreSQL integration coverage for owner isolation and aggregate correctness

**Interfaces:**
- Planner-facing endpoints return bounded DTOs and aggregates.
- Server derives authenticated ownership and rejects cross-owner access.
- Forecast/scenario endpoints expose deterministic computed values separately from AI explanation metadata.

- [ ] **Step 1: Add failing authorization tests** attempting access to another owner's accounts, transactions, goals, budgets, cards and forecasts.
- [ ] **Step 2: Implement server-side owner derivation/authorization where any endpoint still trusts a request owner identifier.**
- [ ] **Step 3: Add aggregate endpoints for dashboard, net worth and bounded analytics where browser aggregation would require unbounded records.**
- [ ] **Step 4: Add exact decimal assertions** for aggregate totals and forecast outputs.
- [ ] **Step 5: Add recurring/installment month-end tests.**
- [ ] **Step 6: Run backend test suite with PostgreSQL Testcontainers.**
```bash
./mvnw test
```
Expected: PASS, including integration tests.
- [ ] **Step 7: Commit.**
```bash
git add backend src pom.xml 2>/dev/null || git add .
git commit -m "hardening: secure planner-facing finance APIs"
```

### Task 12: Production verification, documentation and migration completion

**Files:**
- Modify: `docs/ARCHITECTURE.md`
- Modify: `docs/PROJECT_STATUS.md`
- Modify: `docs/PROJECT_COMPLETION_ROADMAP.md`
- Modify: `docs/PRODUCTION_READINESS.md`
- Modify: `docs/ONLINE_QA_STANDARD.md`
- Modify: `README.md`
- Test: repository CI workflows under `.github/workflows/`

**Interfaces:**
- Documentation describes the final architecture, upstream foundation attribution, planner modules, KOVI boundary, persistence rules and QA gates.
- CI verifies frontend build/test/lint and backend tests without introducing a new production persistence layer.

- [ ] **Step 1: Run frontend lint, unit tests and production build.**
```bash
cd frontend && npm run lint && npm test && npm run build
```
- [ ] **Step 2: Run backend verification.**
```bash
./mvnw test
```
- [ ] **Step 3: Run browser QA against the online/local deployment using the existing controlled QA standard; capture failures before changing code.**
- [ ] **Step 4: Verify no financial domain writes to localStorage/sessionStorage by searching the frontend source.**
```bash
grep -RniE "localStorage\.(setItem|removeItem)|sessionStorage\.(setItem|removeItem)" frontend/src
```
Expected: only UI preference/session behavior is present; no account/transaction/goal/budget/card/forecast persistence.
- [ ] **Step 5: Verify upstream attribution and license files.**
- [ ] **Step 6: Update project status and roadmap with evidence-based completion percentages for each migration phase.**
- [ ] **Step 7: Commit the final documentation and verification updates.**
```bash
git add docs README.md .github
git commit -m "docs: finalize finance planner migration"
```

## Final Verification Gate

- [ ] Backend `./mvnw test` passes.
- [ ] Frontend `npm run lint`, `npm test`, and `npm run build` pass.
- [ ] Chromium critical E2E suite passes.
- [ ] Cross-owner access tests fail closed.
- [ ] Decimal/aggregate/forecast tests pass.
- [ ] Recurring/installment boundary tests pass.
- [ ] Import/export hostile-input tests pass.
- [ ] KOVI Intelligence tests confirm bounded context and advisory behavior.
- [ ] No canonical financial data is persisted in localStorage/sessionStorage.
- [ ] PT-BR and EN flows are covered.
- [ ] Responsive/mobile navigation is covered.
- [ ] Upstream MIT attribution is present.
- [ ] Architecture and project status documents reflect the actual implemented state.
- [ ] No claim of completion is made until verification output is captured.
