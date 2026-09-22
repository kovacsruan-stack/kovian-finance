# KOVIAN Finance - Free-First Provider Strategy

KOVIAN Finance remains the source of truth for financial facts. KOVI AI receives only bounded, authorized context through the existing federation boundary.

## Principles

- PostgreSQL remains authoritative for financial records.
- AI providers are replaceable and must not own financial state.
- Analytics sinks are optional and never required for core accounting workflows.
- External integrations must respect owner isolation, idempotency and audit requirements.
- Free/local-capable infrastructure is preferred during early adoption.

## AI upgrade path

The finance domain exposes controlled context to KOVI AI. Provider selection stays in KOVI AI rather than being embedded in finance business services. Paid model providers can therefore be introduced later without changing financial modules.

## Infrastructure

- PostgreSQL/Flyway for durable state and schema evolution.
- Redis for bounded caching/rate limiting where required.
- Railway or equivalent free-tier infrastructure during early stages.
- Supabase can provide compatible managed PostgreSQL services when operationally useful.

## Security

Financial context is minimized before federation. The domain never trusts model output as authorization or accounting truth. Sensitive mutations remain inside finance application services and audit boundaries.
