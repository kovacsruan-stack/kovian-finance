# KOVIAN Finance integrations

Finance remains the source of truth for financial facts. KOVI AI consumes authorized financial context but does not own financial records.

## Existing integration surfaces

- KOVI AI internal gateway.
- Redis/outbox for asynchronous operational flows.
- Lago and Kill Bill accelerators behind explicit feature flags.
- OpenTelemetry + Prometheus.

## Integration-ready capabilities

| Integration | Planned capability | Activation |
|---|---|---|
| Stripe | billing/subscriptions/checkout and webhook reconciliation | server secret + webhook secret |
| Resend | transaction and billing email | API key + verified sender |
| PostHog | product analytics | public project key |
| Slack | financial/system alerts | webhook/OAuth |
| Notion | documentation and controlled exports | integration token |
| Figma | shared product design | workspace integration |
| Canva | reports/marketing assets | workspace integration |
| Vercel | frontend hosting/CDN/firewall/preview | platform configuration |
| Browser QA | smoke/e2e/accessibility verification | preview/local URL |

Financial integrations must never expose secrets to the browser, and payment webhooks must be idempotent and signature-verified before mutating financial state.

## KOVIAN ecosystem: Finance + Gestão + Fitness

### Domain ownership

- **KOVIAN Finance** is authoritative for accounts, transactions, balances, financial categories, recurring financial obligations and financial reports.
- **KOVIAN Gestão** is authoritative for operational management records, including students/clients, service modality, scheduled/completed sessions and operational status.
- **KOVIAN Fitness** is authoritative for training plans, training sessions, attendance and the fitness calendar.
- A unified interface may compose data from these domains, but must not write directly into another domain's database or treat a cached projection as canonical data.

### Integration sequence

1. Establish a stable ecosystem subject identifier and explicit mapping between each domain's existing user/client identifiers. Never join records by display name, email alone or array position.
2. Define authenticated, versioned server-to-server contracts. Requests must carry tenant/workspace scope and a correlation ID; authorization is evaluated by the owning service.
3. Add a **read-only unified calendar projection** first. Finance events come from Finance APIs; classes, training sessions and attendance come from Fitness APIs; operational appointments/lessons come from Gestão APIs.
4. Add mutations only through the owning domain's API. For example, recording a completed lesson in Gestão must not directly insert a financial transaction. Any resulting charge/payment is a separate Finance-owned operation with an explicit reference and idempotency key.
5. Add reconciliation and observability: source event ID, source domain, last successful sync, retry state and a visible stale/error state. Do not silently show a partial calendar as complete.

### Unified calendar event contract (v1 proposal)

A calendar item is a read model, not a new source of truth:

| Field | Meaning |
|---|---|
| `id` | Stable composite ID: `<source>:<sourceEventId>` |
| `source` | `FINANCE`, `GESTAO` or `FITNESS` |
| `sourceEventId` | Canonical event ID in the owning domain |
| `title` | Display label, never used as an identity |
| `startsAt`, `endsAt` | ISO-8601 timestamp with offset |
| `status` | Source-mapped status; preserve unknown values safely |
| `relatedSubjectId` | Optional canonical ecosystem subject |
| `relatedRecordUrl` | Optional authorized deep link to the source record |
| `updatedAt` | Source update timestamp, used for freshness |

The projection must preserve source ownership and authorization. Financial amounts are excluded from Fitness/Gestão payloads unless a separately authorized Finance view requests them. Calendar writes must route to the owning domain, with conflict checks and idempotency handled server-side.

### Calendar UX reference

Use [QuiK000/FitHub](https://github.com/QuiK000/FitHub) as a **visual and interaction reference**, not as code to transplant blindly. Adapt its clear calendar hierarchy, responsive month grid, selected-day details, event density, loading/empty/error states and accessible controls to KOVIAN's existing design system. Keep KOVIAN branding, Portuguese-first copy and the existing domain services. Review the repository's license and preserve required notices before reusing any source code.

### Delivery gates

- [ ] Confirm the canonical identity mapping and tenant boundary across all three domains.
- [ ] Document API ownership, authentication, scopes, pagination and error semantics.
- [ ] Implement the calendar projection behind a feature flag; no cross-domain database writes.
- [ ] Cover duplicate events, time zones/DST, cancellations, stale sources, partial failures and retries.
- [ ] Validate with local lint, type checks, tests, production build and browser QA.
- [ ] Keep secrets server-side; redact tokens and sensitive financial details from logs.

GitHub Actions is not part of this project's execution path. Validation and delivery must use the local/tooling workflow documented in `AGENTS.md`.


### Implementation status — 2026-09-28

| Capability | Status | Notes |
|---|---|---|
| Finance month calendar | Implemented in Finance UI | Shows transactions and recurring items; selected-day details are available. |
| Fitness internal calendar | Implemented in Fitness UI | Composes training-session calendar data with active management-class sessions; duplicate same-time/title items are collapsed. |
| Cross-product unified calendar | Not yet implemented | No authenticated cross-domain event API/projection is wired between Finance, Gestão and Fitness. |
| Student identity mapping across domains | Pending verification | Do not infer identity from names or email alone. |
| Finance-origin events inside Fitness/Gestão | Not enabled | Financial data remains within Finance until a scoped, authorized projection is implemented. |

The Fitness calendar change is a source-level implementation only until frontend tests/build and runtime QA have been executed. Do not treat GitHub publication as evidence of deployment or production readiness.
