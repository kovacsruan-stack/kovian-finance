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
