# KOVIAN Finance Production Runbook

## Runtime topology

Browser/PWA -> Netlify frontend -> /api/v1 rewrite -> Railway kovian-finance-api -> PostgreSQL + Redis.

The backend is the financial source of truth. Browser storage is limited to UI preferences and transient client state.

## Required Railway services

- kovian-finance-api
- PostgreSQL
- Redis

The current KOVIAN-Cloud-QA production environment is limited to five services on the current HOBBY plan. Existing offline services must not be removed automatically to create room for Finance infrastructure.

## Required Finance API variables

Preferred Spring-native variables:

- SPRING_DATASOURCE_URL = JDBC PostgreSQL URL
- SPRING_DATASOURCE_USERNAME
- SPRING_DATASOURCE_PASSWORD
- SPRING_DATA_REDIS_URL
- PORT or SERVER_PORT
- SPRING_PROFILES_ACTIVE=prod

Compatibility variables remain supported:

- DATABASE_URL
- DATABASE_USERNAME
- DATABASE_PASSWORD
- REDIS_URL

SPRING_DATASOURCE_URL must start with jdbc:postgresql:// for the Spring Boot datasource.

## Railway references

When PostgreSQL and Redis are available as Railway services, prefer Railway reference variables rather than copying credentials into source control. Use Railway service references such as ${{Postgres.DATABASE_URL}} when the referenced value is already a JDBC URL, or construct the JDBC URL from the database host/port/name variables supplied by the PostgreSQL service.

Never commit rendered credentials.

## Verification order

1. PostgreSQL service exists and is reachable from Finance API.
2. Redis service exists and is reachable from Finance API.
3. Finance API deploy succeeds.
4. /actuator/health returns healthy.
5. Flyway completes all migrations.
6. Authenticated API smoke checks pass for accounts, transactions, transfers, budgets, goals, cards, debts, assets/liabilities, snapshots, forecast and notifications.
7. Netlify production deployment is live and serving the expected frontend build.
8. Netlify /api/v1/* rewrite reaches the Railway API.
9. Playwright smoke/navigation checks pass against the deployed frontend.

## Current blocker

The current Railway project has four services and a five-service HOBBY limit. Provisioning both PostgreSQL and Redis would require two additional service slots. Do not delete existing services automatically to bypass this limit.

## Release rule

Do not mark KOVIAN Finance production-ready from source-code completion alone. Production readiness requires observed runtime health, database migration success, frontend deployment success and integrated smoke verification.