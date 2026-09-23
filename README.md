# KOVIAN Finance

KOVIAN Finance is the personal finance platform of the KOVIAN technology ecosystem.

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

User-facing changes require automated validation plus real local browser QA for applicable flows. Keep domain ownership explicit and preserve the KOVI integration boundary.

Canonical local QA:

    cd frontend
    npm run qa:chromium

The smoke suite covers shell rendering, browser errors, bilingual switching, primary navigation, critical routes, keyboard interaction and mobile overflow. See the shared [KOVIAN Local QA Standard](https://github.com/kovacsruan-stack/kovi-ai/blob/main/docs/LOCAL_QA_STANDARD.md).

User-facing changes require automated validation plus real local browser QA for applicable flows. Keep domain ownership explicit and preserve the KOVI integration boundary.

Canonical local QA:

    cd frontend
    npm run qa:chromium

The frontend smoke suite covers shell rendering, browser errors, bilingual switching and primary navigation.

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
