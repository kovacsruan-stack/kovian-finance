# KOVIAN Finance API

## Local startup

1. Copy `.env.example` to `.env` and set a random `JWT_SECRET` of at least 32 characters.
2. Configure `DATABASE_URL` for PostgreSQL.
3. From `backend/`, install `requirements.txt`, run `alembic upgrade head`, then start with `uvicorn app.main:app --reload`.
4. Open `/docs` for the interactive OpenAPI reference.

## Routes

- `GET /health` — liveness check.
- `POST /api/v1/auth/register`, `POST /api/v1/auth/login`, `GET /api/v1/auth/me` — account access.
- `GET /api/v1/accounts`, `POST /api/v1/accounts` — list/create accounts.
- `GET /api/v1/transactions`, `POST /api/v1/transactions` — list/create transactions.
- `POST /api/v1/transactions/{id}/confirm` — confirm a transaction.
- `GET /api/v1/summary` — confirmed cash flow and balance summary by currency.
- `POST /api/v1/integrations/gestao/payments?account_id=...` — ingest an authenticated, idempotent paid-payment event from KOVIAN Gestão.
- `GET /api/v1/budgets`, `POST /api/v1/budgets` — list/create budgets.
- `GET /api/v1/goals`, `POST /api/v1/goals` — list/create savings goals.
- `PATCH /api/v1/goals/{id}/progress` — update goal progress.

Protected routes require `Authorization: Bearer <token>`. Amounts are accepted and returned as decimal strings; account, transaction, budget, and goal queries are scoped to the authenticated account.

## Migration safety

The initial migration creates missing tables. If a legacy table exists without required ownership columns, migration stops instead of guessing record ownership. Review and assign legacy data before retrying. Automatic destructive downgrades are disabled.

## Pre-release validation

Run these checks from `backend/` against a disposable PostgreSQL database before deploying:

1. `pytest -q` — run the backend test suite.
2. `alembic upgrade head` — verify migrations on an empty database and on a reviewed copy of any legacy schema.
3. Start the API and verify `GET /health`, registration, login, `GET /api/v1/auth/me`, and authorization failures without a token.
4. Set explicit production `CORS_ORIGINS` and a unique, high-entropy `JWT_SECRET`; never reuse development secrets.
5. Verify transaction totals, currency separation, ownership isolation, and decimal rounding with representative edge cases before importing or reconciling real financial data.

Do not treat a successful migration or liveness response as proof of production readiness. Financial invariants, backup/restore, external connectors, security, performance and end-to-end validation remain release gates.

## KOVIAN Gestão payment event contract

The Gestão backend sends paid-payment events to `POST /api/v1/integrations/gestao/payments?account_id=...`. The receiver must authenticate the server-to-server bearer token, verify the configured Finance owner and that the target account belongs to that owner, validate BRL minor-unit amounts and payment timestamps, and treat the event ID as an idempotency key. Repeated delivery of the same event must return the original transaction rather than create a duplicate. The integration token must exist only in the Gestão backend and Finance backend environment; it must never be exposed to browser code or logs.

The receiver is implemented in `app/gestao_integration.py`. Before enabling it in production, configure `KOVIAN_FINANCE_INTEGRATION_TOKEN` (at least 32 characters) and `KOVIAN_FINANCE_OWNER_ID` in the Finance backend, and configure the matching token, Finance owner ID, account ID, and API URL in the Gestão backend. The selected account must belong to the configured owner and use the same currency as the event. Verify the endpoint against a disposable database and confirm duplicate delivery does not create duplicate transactions.
