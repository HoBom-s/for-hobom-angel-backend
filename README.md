# hobom-angel-backend

## What this is

The backend service for **HoBom Angel Universe** — a platform that connects rescued and
sheltered animals with people through **adoption, temporary fostering, and volunteering**.
It ties shelters, ordinary members, and platform operators together on a single chain of trust.

At its core this is not a CRUD app; it is about **trust and process**.

- **Four roles** carry different authority and responsibility — member (USER), shelter staff
  (SHELTER_STAFF), shelter admin (SHELTER_ADMIN), and platform operator (SYSTEM_ADMIN).
- **Trust is rooted in verifying the shelter representative.** The platform reviews a
  representative's documents to approve a shelter, and the verified representative then approves
  their own shelter's staff. This delegation chain is the root of the entire authorization model.
- **Adoption, fostering, staff promotion, and shelter verification** are unified under a single
  notion of an "approval request." Each shelter can define its own steps and surveys, and an
  application flows through that process.
- **Data minimization is a premise.** The national ID number is never stored; only the
  irreversible CI/DI identity value issued by an identity-verification provider is kept, and it is
  what detects duplicate signups. Real name and contact are stored encrypted and shown masked.
- **Multi-tenancy**: each shelter owns its own space (animals, notices, volunteering, about),
  scoped by `shelterId`.

This domain is thick with rules and invariants — which is why the service adopts an architecture
that fits it.

---

## Architecture

### Hexagonal (Ports & Adapters)

Every feature module follows a hexagonal structure with **the domain on the inside and technology
on the outside**. Dependencies always point inward, toward the domain.

```
inbound adapter (REST/gRPC)  →  in-port (use-case interface)
                                     →  application use-case (orchestration)
                                          →  out-port (persistence/query interface)
                                               →  outbound adapter  →  repository (Mongo)
```

Cross-layer wiring is done entirely through **Symbol DI tokens**. Controllers depend only on
use-case interfaces, and use-cases depend only on out-port interfaces. As a result the
domain/application layers need to know nothing about NestJS or Mongoose, and infrastructure can be
swapped by replacing adapters alone.

### Rich domain model

Business rules and invariants live **inside the domain aggregates**. Services only orchestrate;
they hold no knowledge of the rules.

- **Aggregates enforce their own invariants.** For example, rules like "a withdrawn member cannot
  be promoted to staff" or "a member cannot be promoted to staff of the same shelter twice" are
  checked and thrown by methods on the `User` aggregate. This prevents a rule from being scattered
  across services and dropped in one of them.
- **Value Objects guarantee format invariants at construction time** — an object simply cannot be
  built from an invalid email, phone number, or nickname. VOs are immutable (`Object.freeze`) and
  compared by value via `equals`.
- **The persistence model is separated from the domain model.** The Mongoose schema class
  (persistence) and the behavior-bearing domain aggregate are kept apart, with a **mapper**
  bridging them. The domain is persistence-ignorant.

Records that are technical in nature (e.g. the outbox) are deliberately kept anemic — putting a
heavy domain model over something with thin invariants would be over-engineering. The rich domain
approach is applied only where it earns its keep.

### Embedded approval engine

Adoption, fostering, staff promotion, and shelter verification are unified into **one approval
engine**. Workflow definitions are versioned and immutable (fixed by content-hash), and an
execution instance pins the definition version it ran under. Approval actions accumulate as an
append-only event log, so state is computed as a fold — which makes "who approved what, and when"
provable. Transitions are idempotent, and on completion a callback transitions the domain state
and emits a notification event.

### Schema-driven form engine

Each shelter's adoption/foster surveys are defined without code changes. A form definition is a
data schema (JSON Schema, for validation) plus a UI schema (widgets, layout, conditional rules).
A published version is immutable, and a response pins the version and content-hash at the time it
was filled in — so changing a survey later never breaks existing responses or their rendering.
Validation has a single source of truth in the data schema, and the server re-validates on submit
with that same schema (it does not trust the client).

### Reliable event pipeline (transactional outbox)

Events that must not be lost — such as foster-termination notifications — ride a **transactional
outbox**.

```
domain state change  ┐
                     ├─ same Mongo transaction (atomic)
outbox record (PENDING) ┘
        │  gRPC polling
        ▼
hobom-event-processor (Go)  →  Kafka (hobom.angel-events)
        ▼
hobom-internal-backend (Kotlin)  →  email / push delivery
```

Because the state change and the event record commit in one transaction, the inconsistency of
"the state changed but the notification never went out" is eliminated at the source. Publish
failures are retried and then quarantined to a DLQ.

### Behind the gateway, with its own auth

This service sits behind `hobom-api-gateway`. The gateway is only a reverse proxy and does not own
users, so **Angel has its own user store and issues/verifies its own JWTs**. Access and refresh
tokens use different secrets, and the JWT `sub` carries the nickname per the gateway convention.

### Transaction boundary

Mongo transactions carry the session through an `AsyncLocalStorage`. Annotating a use-case with
`@Transactional()` binds its entire execution to one session, and repositories join the ambient
session automatically without receiving it as a parameter. Because transactions are used, MongoDB
must be a **replica set (or Atlas)**.

### Privacy & security

- **No national ID stored.** Only the CI/DI issued by the identity-verification authority is kept.
- **Field encryption.** Real name and contact are stored with AES-256-GCM, and the key lives
  outside the DB (a secret manager). Plaintext PII is never carried on the aggregate; reading
  plaintext is possible only through a separate, audited path.
- **Response masking.** Real name, phone, and email are masked on display.
- **Retention & deletion.** Data past its retention period or grace window after withdrawal is
  purged or pseudonymized by a batch.

### Quality guardrails

Big-tech-grade automated quality gates ship by default.

- **Test layers**: domain logic is covered by pure unit tests (ports mocked), adapters and
  repositories by integration tests over an in-memory Mongo, and app boot by an e2e test.
- **Coverage gate**: on top of a global floor, the domain and cryptography layers enforce higher
  thresholds.
- **CI**: every PR runs typecheck, lint, build, tests (with coverage), and e2e.
- **pre-commit**: lint-staged and typecheck run before a commit so broken code cannot land.

---

## Related services

| Service | Role |
|---------|------|
| `hobom-api-gateway` | Reverse proxy for auth, rate limiting, tracing (wired by env only) |
| `hobom-event-processor` (Go) | Polls the outbox over gRPC, publishes to Kafka, manages the DLQ |
| `hobom-internal-backend` (Kotlin) | Consumes Kafka and delivers email/push notifications |
| `for-hobom-backend` | The sister repo — source of the proven hexagonal scaffold and shared infrastructure patterns |
