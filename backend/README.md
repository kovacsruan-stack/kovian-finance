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

- Registration/login endpoints with password hashing, short-lived signed access tokens, and active-user checks.

- Decimal-based ledger entry validation and cash-flow calculation.
- Transfers excluded from net cash flow to avoid double-counting internal movements.
- Validated financial-entry request schema.
- SQLAlchemy models for accounts, transactions, budgets, goals, and Gestão payment import idempotency.
- Authenticated account/transaction endpoints and a Gestão payment ingestion foundation.
- Async SQLAlchemy session factory, PostgreSQL dependencies, and initial tests.

## Required before production

Complete production hardening: rate limiting and account recovery, reviewed tenant identity mapping, service-secret provisioning, account-selection policy, transfer pairing, recurring transactions, installment schedules, reconciliation, audit history, and database/API/end-to-end tests. Never use binary floating-point for money; keep currency explicit and do not silently convert currencies.

## Database migrations

The Alembic environment includes the initial schema revision and the Gestão payment idempotency revision. After configuring `DATABASE_URL`, review the migrations against the target database and apply them:

```bash
alembic upgrade head
```

Review generated SQL carefully before applying it to any database containing real data.


## Gestão payment ingestion

`POST /api/v1/integrations/gestao/payments?account_id={account_id}` accepts `MANAGEMENT_PAYMENT_PAID.v1` and records one confirmed BRL income transaction.

- Interactive calls use a Finance Bearer token whose user ID must match the event `ownerId`.
- Service calls use `GESTAO_INTEGRATION_TOKEN` (32+ random characters) and server-side `GESTAO_OWNER_MAP` JSON mapping Gestão owner UUIDs to Finance user IDs.
- The target account must be active, belong to the resolved Finance user, and use BRL.
- The event ID and payment reference are unique per Finance user; exact retries return the existing transaction.
- Never expose the service token or owner map to frontend code. Do not enable unattended delivery until production secrets, owner mappings, account selection, and end-to-end checks are complete.
