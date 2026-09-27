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
- `GET /api/v1/budgets`, `POST /api/v1/budgets` — list/create budgets.
- `GET /api/v1/goals`, `POST /api/v1/goals` — list/create savings goals.
- `PATCH /api/v1/goals/{id}/progress` — update goal progress.

Protected routes require `Authorization: Bearer <token>`. Amounts are accepted and returned as decimal strings; account, transaction, budget, and goal queries are scoped to the authenticated account.

## Migration safety

The initial migration creates missing tables. If a legacy table exists without required ownership columns, migration stops instead of guessing record ownership. Review and assign legacy data before retrying. Automatic destructive downgrades are disabled.
