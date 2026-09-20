# KOVI Intelligence Boundary

Finance remains the source of truth for financial facts. KOVI may consume explicitly authorized, tenant-scoped read models through the Finance integration contract.

- KOVI receives bounded domain context, never unrestricted database access.
- Tenant identity must match the requested tenant before reads are allowed.
- Financial mutations remain Finance-owned and disabled by the generic AI policy.
- AI output is advisory unless a separately versioned mutation contract is explicitly approved.
- Domain events and insights retain provenance, timestamps and correlation identifiers.
- Sensitive data is minimized before crossing the integration boundary.
