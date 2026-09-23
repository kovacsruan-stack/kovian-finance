# KOVIAN Ecosystem — Chat Handoff / Current State

> Living handoff document. Update this file whenever a major implementation, deployment, QA policy, or infrastructure decision is made so work can continue safely after a chat/session change.

## Date / baseline
- Baseline: 2026-09-23
- Source of truth: GitHub `main` branches plus current hosted deployment state.
- Do not rely on an old local workspace as the authoritative state.
- Never commit secrets, `.env` files, API keys, tokens, or credentials.

## Repositories
- `kovacsruan-stack/kovi-ai`
- `kovacsruan-stack/kovian-fitness`
- `kovacsruan-stack/kovian-finance`

## Ecosystem architecture
- KOVI AI is the generative AI/orchestration boundary.
- Fitness and Finance remain domain systems and sources of truth for their own data.
- Domain products should not call model providers directly; governed KOVI gateway/federation is the intended integration boundary.

## Isolated local ports
These are still the intended isolated frontend QA ports when local validation is needed:
- KOVI AI: 5176
- KOVIAN Fitness: 5175
- KOVIAN Finance: 5174
- Integrated KOVI runtime: http://127.0.0.1:3003/app/
Local QA is auxiliary; hosted/online validation is now the primary operational gate.

## Hosted QA infrastructure
Railway project:
- Project: KOVIAN-Cloud-QA
- Project ID: e89866e1-3a36-449d-9259-ed229080a18f
- Environment ID: d30f2098-aa47-44b0-944e-f0905ac8e586
- Workspace ID: 0d109dc2-6965-4e2b-b446-2940d2e162d7

Services:
- kovi-ai
- kovian-fitness-api
- kovian-finance-api
- kovi-ai-web

Known public API domains:
- https://kovi-ai-production.up.railway.app
- https://kovian-fitness-api-production.up.railway.app
- https://kovian-finance-api-production.up.railway.app

Health paths:
- KOVI AI: /health
- Fitness: /actuator/health
- Finance: /actuator/health

Separate KOVI web QA Railway project:
- Project: KOVIAN-Web-QA
- Project ID: eb683a5c-0963-4dc5-9a90-43e54a4c24bc
- Environment ID: f918b598-9016-4013-9783-0ee958f97f6d
- Service ID: 1d98b7c2-1d29-4d1e-844a-a86c3ec7be9b
- Intended start: node scripts/static-server.mjs
- Health path: /health
- Do not claim healthy without a fresh verification.

## Current Railway deployment state at handoff
### KOVI AI
- Latest known successful deployment: a33c95d1-6ca2-4779-8298-046aa3c64afb
- Commit: 483b0a3318abe75f1333fc5a7022ee1f293251a5
- Backend deployment was reported SUCCESS.
- Latest important source fix: revoked_at -> revokedAt in frontend App.tsx.

### KOVIAN Fitness
- Previous runtime failure: duplicate CacheManager bean between RedisConfig and ProductionCacheConfig.
- Fix applied: ProductionCacheConfig changed from profile `prod` to `prod-no-redis`, preventing the fallback bean from loading in the standard production profile.
- Latest known deployment before this fix was still DEPLOYING; verify the next deployment before making further changes.
- Commit containing AppErrorBoundary activation: 3071428dcc1b512906d9fb37df87c7d03590be93.
- Standalone frontend container support commit: bf203394ff04ed0132fb306e40f5097977333c4a.

### KOVIAN Finance
- Previous build failure: OpenTelemetry Spring Boot starter version 1.64.0 was not available in Maven Central.
- Fix applied: opentelemetry.version changed to 2.31.1.
- Also excluded frontend test files from the production TypeScript build and cleaned the temporary @types/node dependency:
  - frontend/tsconfig.json excludes src/**/*.test.ts and src/test
  - frontend/package.json no longer needs @types/node solely for production build
- IMPORTANT: verify the new Railway build/deployment after the 2.31.1 POM change before making more changes.

## Important implementation changes already committed
### KOVI AI
- Vite server/preview port isolated to 5176.
- Fitness default URL changed 5173 -> 5175.
- CORS examples expanded to explicit 5176/5175/5174 localhost + 127.0.0.1 origins.
- Added/updated standalone static frontend server and production serving configuration.
- API/frontend TypeScript fixes applied.
- SPA/deep-route fallback exists in KOVI HTTP server.

### KOVIAN Fitness
- Vite port isolated to 5175.
- PT-BR auth brand title: “Área exclusiva para alunos”.
- Production cache fallback disabled in standard prod profile via `prod-no-redis`.
- TrainerAnalyticsResponse and ClientAnalyticsResponse exported from dashboard service.
- AppErrorBoundary is now mounted around the application.
- Standalone static frontend container added.

### KOVIAN Finance
- Fitness default URL changed 5173 -> 5175.
- PT-BR translation keys added for organization/categories/budgets/category errors/limit status.
- CORS examples explicitly include 5174/5175 localhost + 127.0.0.1.
- Standalone static frontend container added.
- FinanceApiError test typing fixed.
- Production TypeScript build excludes test-only Node imports.
- OpenTelemetry dependency version currently targeted at 2.31.1.

## Vercel policy — LIMITED RESOURCE
Vercel credits must be treated as scarce.
- Railway is the primary hosted QA/deployment path when suitable.
- Do not trigger blind/repeated Vercel deployments.
- Batch known fixes first.
- Verify exact build/config errors before deploying again.
- Do not create duplicate projects/services.
- If Vercel consumption becomes abnormal, stop Vercel deployments and continue through Railway/non-Vercel validation.
- Known projects:
  - KOVI AI: prj_WDR6qZDWQXaof9KLGBJ136XZ5lfP
  - Fitness: prj_OrmzoKq0HevYT75QRk7RaoUkwikF
  - Finance: prj_QLIyD1yryixBdibA84k5t3fCrBDa
- Team: Ruan Kovacs Projetos (team_hgVqZHoKdyepa19OqfADRnoy)
- Do not claim a Vercel deployment is healthy/accesssible without fresh verification.

## Opera Browser QA policy — LIMITED RESOURCE
Opera Connector/browser QA is also a limited resource.
- Do NOT open/reload Opera on every hourly cycle or after every small code change.
- First use GitHub source review, deployment state, logs, healthchecks, HTTP/API checks and other low-cost validation.
- Use Opera only for meaningful browser-specific validation.
- Batch multiple browser checks into one session when possible.
- Reuse an existing relevant tab/session instead of opening duplicate sessions.
- If Opera limits/blocks/consumes unusually, stop browser QA and continue with non-browser checks.
- Reports must distinguish automated/HTTP/deployment checks from actual Opera browser checks.
- Never imply Opera was used if it was not.

## Hourly automation policy
Active scheduled tasks were moved to online-first validation:
1. KOVIAN Health & QA
2. KOVIAN Frontend
3. KOVIAN Evolution

Their intended cadence is hourly. The tasks should:
- inspect hosted implementations first;
- use GitHub main as source of truth;
- check deployments, healthchecks, public routes, logs and runtime errors;
- use Opera conditionally/batched, not automatically every cycle;
- fix safe issues directly in GitHub/hosting when justified;
- republish only when a real change is needed;
- never expose secrets;
- never delete databases, volumes, services or user data;
- avoid duplicate deployments;
- report what was actually checked, what changed, and remaining blockers.

Paused tasks:
- KOVI 24h Evolution
- CI PR #8 verde

## Safety / change discipline
- Preserve user work; do not use destructive reset/force-overwrite operations.
- If a local workspace has uncommitted changes, preserve them before any pull/update.
- Do not treat local build/lint/typecheck as proof of online health.
- Diagnose exact deployment/runtime errors before changing code.
- Prefer small atomic commits with clear messages.
- After a fix, verify the resulting hosted deployment before stacking unrelated fixes.

## Next verification order
1. Verify latest Fitness Railway deployment after the CacheManager profile fix.
2. Verify latest Finance Railway deployment after OpenTelemetry 2.31.1 fix.
3. Verify public health endpoints for all APIs.
4. Inspect runtime logs only if health/deployment fails.
5. Once APIs are stable, perform one batched browser QA session for the affected online flows.
6. Keep Vercel untouched until there is a justified, batched deployment need and the Vercel credit budget is safe.

## Do not lose this context
When continuing in a new chat, read this file first and then inspect current GitHub main/deployment state. Do not assume statuses above are still current; they are a handoff snapshot, not a live status claim.
