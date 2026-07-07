# ADR-0008: Two-tier logging — access log vs audit trail

- Status: Accepted
- Date: 2026-07-07

## Context

Two different needs look like "logging" but have opposite reliability
requirements: (1) high-volume HTTP access logs for observability/analytics,
which may be dropped; (2) a compliance trail proving who touched whose PII, which
must never be lost. The sister service ships access logs through the outbox but
logs raw headers/body — unacceptable here, where that would leak PII and secrets
into the log pipeline.

## Decision

Split them into two tiers.

- **Access log (best-effort)** — an interceptor emits a `HOBOM_LOG` event through
  the outbox, fire-and-forget. Request context (query/body/headers) is
  **redacted** (auth/cookie/api-key headers, PII keys). The actor id comes from
  the verified JWT (no extra DB lookup).
- **Audit trail (high-integrity)** — `AuditLog`, written inside the business
  transaction (or a standalone durable insert for read-only `VIEW_PII`). Never
  dropped. Records actor, subject, field, reason. Backs DSAR and security review.

## Consequences

- Observability data never blocks or fails a request; compliance data is never
  silently lost.
- Two write paths and two collections, at different reliability guarantees —
  deliberately.
- Unmasked PII reads must call the audit recorder; that obligation is enforced in
  the use-cases that reveal PII (and reflected in the UI: masked by default +
  explicit, reason-prompted reveal).
