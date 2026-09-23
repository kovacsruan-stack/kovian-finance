# Online QA Standard

GitHub main is the implementation source of truth. Hosted Railway state is the runtime source of truth.

## Validation order
1. Inspect source and current deployment.
2. Check build/runtime logs and public health endpoints.
3. Diagnose the concrete root cause.
4. Apply a minimal safe fix.
5. Verify the new hosted deployment.
6. Use Opera only for browser-specific checks and batch them.

## Resource policy
Treat Vercel and Opera as limited resources. Do not perform blind Vercel redeploys or repeated Opera sessions. Railway watch patterns should limit backend deployments to backend-impacting changes.

## Infrastructure prerequisite
The production application requires PostgreSQL and Redis credentials/URLs. Missing infrastructure variables must remain an explicit deployment blocker rather than being masked with an in-memory or mock database.

## Security
Never commit secrets or .env files and never delete persistent data/services as part of QA.
