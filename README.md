# KOVIAN Finance

<p align="center"><img src="frontend/public/kovian-finance-icon.svg" alt="KOVIAN" width="150" /></p>


KOVIAN Finance is the personal finance platform of the KOVIAN technology ecosystem.

## Tooling constraint: no GitHub Actions

GitHub Actions is not available for this project. Do not add or rely on Actions workflows, runners, hosted CI/CD, billing diagnostics, or manual workflow dispatch. Run lint, tests, builds, and browser QA locally using the commands below. Revisit this only if the project owner explicitly confirms Actions has been enabled. See [AGENTS.md](AGENTS.md).

## Vision

Manage personal finances, planning, goals, cash flow, assets, liabilities and financial intelligence, with a controlled integration layer for KOVIAN Fitness and KOVI AI.

## Initial stack

- Java 21
- Spring Boot 4
- Spring Web MVC
- Spring Data JPA
- PostgreSQL
- Flyway
- Spring Security
- Redis
- Actuator
- OpenAPI

## Core modules

Accounts, transactions, categories, budgets, goals, recurring transactions, credit cards, debts, assets/liabilities, financial snapshots, forecasting, AI insights and KOVIAN Fitness integration.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Delivery gate

User-facing changes require automated validation plus real local browser QA for applicable flows. Keep domain ownership explicit and preserve the KOVI integration boundary.

Canonical local QA:

    cd frontend
    npm run qa:chromium

The smoke suite covers shell rendering, browser errors, bilingual switching, primary navigation, critical routes, keyboard interaction and mobile overflow.

## Validation

Backend:

    ./mvnw test

Frontend:

    cd frontend
    npm ci
    npm run lint
    npm run build
    npm run test
    npm run test:e2e
    npm run qa:chromium

For user-facing changes, local browser QA is mandatory when a local environment exists. Validate the real affected flow locally, including navigation, language controls, responsive layouts, loading/empty/error states and critical financial workflows. Automated checks do not replace real browser QA.

## Open-source planner foundation

The planner UX foundation is based on the MIT-licensed `oofangoo/personal-finance-planner` project. KOVIAN Finance adapts its planning workflows while keeping Spring Boot/PostgreSQL as the authoritative financial system. See [docs/OPEN_SOURCE_FOUNDATION.md](docs/OPEN_SOURCE_FOUNDATION.md) and [docs/UPSTREAM_PERSONAL_FINANCE_PLANNER_MAPPING.md](docs/UPSTREAM_PERSONAL_FINANCE_PLANNER_MAPPING.md).

Browser persistence is limited to UI preferences and transient workflow state; canonical financial records remain server-side.

## Gestão e migração de dados

Consulte [docs/MANAGEMENT_DATA_MIGRATION.md](docs/MANAGEMENT_DATA_MIGRATION.md) para os recursos suportados, o contrato de importação idempotente e a checklist de reconciliação. Não considere os dados migrados até concluir a conferência de origem e destino.
