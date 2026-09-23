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

## Delivery gate

User-facing changes require automated validation plus real local browser QA for applicable flows. Keep domain ownership explicit and preserve the KOVI integration boundary.
