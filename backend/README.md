# KOVIAN Finance backend

Python + FastAPI backend for personal and business finance. Finance owns accounts, transactions, transfers, receivables, payables, budgets, and cash-flow reporting. Financial amounts use decimal arithmetic.

## Local development

```bash
python -m venv .venv
# Activate the environment, then:
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

- Health: `GET /health`
- API info: `GET /api/v1`
- OpenAPI: `/docs`
- Tests: `pytest`

## Implemented foundation

- Google OpenID Connect login endpoint (`POST /auth/google`) that verifies Google ID tokens server-side and issues a product-specific KOVIAN access token.

- Decimal-based ledger entry validation and cash-flow calculation.
- Transfers excluded from net cash flow to avoid double-counting internal movements.
- Validated financial-entry request schema.
- Initial SQLAlchemy models for accounts and transactions.
- Async SQLAlchemy session factory, PostgreSQL dependencies, and initial tests.

## Required before production

Add authentication and tenant isolation, migrations, account and transaction endpoints, idempotent imports, transfer pairing, recurring transactions, installment schedules, budgets, goals, forecasts, reconciliation, audit history, and end-to-end tests. Never use binary floating-point for money; keep currency explicit and do not silently convert currencies.

## Database migrations

The Alembic environment is configured, but an initial migration has not yet been generated or applied. After configuring `DATABASE_URL`, generate and review the first migration, then apply it:

```bash
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

Review generated SQL carefully before applying it to any database containing real data.
