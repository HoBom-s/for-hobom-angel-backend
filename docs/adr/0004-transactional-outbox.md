# ADR-0004: Transactional outbox for reliable events

- Status: Accepted
- Date: 2026-07-06

## Context

Some events must not be lost — e.g. a foster-termination notification, or an
approval that triggers mail/push. Publishing to Kafka directly from a request
handler risks the classic dual-write inconsistency: the DB commit succeeds but
the publish fails (or vice versa), leaving "state changed, notification never
sent."

## Decision

Use the platform-standard **transactional outbox**. Within the same Mongo
transaction as the domain change, write a `PENDING` row to the `outbox`
collection. `hobom-event-processor` (Go) polls the outbox over gRPC and publishes
to Kafka (`hobom.angel-events`) with retries; failures are quarantined to a
Redis DLQ. `hobom-internal-backend` consumes and delivers mail/push.

## Consequences

- State change and event record commit atomically — no dual-write gap.
- Requires MongoDB transactions, hence a replica set / Atlas (see ADR-0006).
- Wiring the Go poller for Angel is a cross-repo change (AngelPoller + proto in
  `hobom-buf-proto`); until then the write path exists but the relay is pending.
- The outbox is also used as the best-effort access-log transport (see
  ADR-0008), at a different reliability tier.
