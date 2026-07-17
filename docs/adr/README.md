# Architecture Decision Records

Short, immutable records of the significant architectural decisions on this
service — the *why* behind choices that aren't obvious from the code, for the
next teammate (and the future us).

Format is lightweight: **Context → Decision → Consequences**, plus a status and
date. Once Accepted, an ADR is not edited; a later decision that changes it gets
a new ADR that supersedes the old one.

| # | Title | Status |
|---|-------|--------|
| [0001](0001-separate-backend-repo.md) | Separate `hobom-angel-backend` repository | Accepted |
| [0002](0002-rich-domain-model.md) | Rich domain model (aggregates + value objects) | Accepted |
| [0003](0003-self-issued-jwt-behind-gateway.md) | Self-issued JWT behind the gateway | Accepted |
| [0004](0004-transactional-outbox.md) | Transactional outbox for reliable events | Accepted |
| [0005](0005-multi-tenancy-shelter-scope.md) | Multi-tenancy via `shelterId` + TenantScope | Accepted |
| [0006](0006-mongodb-and-pii.md) | MongoDB, no RRN, field-level PII encryption | Accepted |
| [0007](0007-index-management.md) | Index management: autoIndex off + syncIndexes | Accepted |
| [0008](0008-two-tier-logging-and-audit.md) | Two-tier logging: access log vs audit trail | Accepted |
| [0009](0009-adoption-questionnaire-and-application.md) | Adoption questionnaire + application | Accepted |
| [0010](0010-opentelemetry-and-graceful-shutdown.md) | OpenTelemetry tracing/metrics + graceful shutdown | Accepted |

To add one: `docs/adr/000N-title.md`, copy the shape of an existing record, add
a row here.
