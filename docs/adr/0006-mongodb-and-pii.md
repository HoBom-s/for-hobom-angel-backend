# ADR-0006: MongoDB, no RRN, field-level PII encryption

- Status: Accepted
- Date: 2026-07-07

## Context

Angel handles sensitive personal data (real name, phone) and must satisfy
data-minimization and privacy law. It also needs Mongo transactions for the
outbox. A dedicated database was provisioned.

## Decision

- **MongoDB**, with Angel's own database `hobom-system-angel-backend-tiger-db`
  living inside the shared `hobom-system-lion-db` Atlas cluster (Atlas ⇒ replica
  set, so transactions work). Reachable via `HOBOM_SYSTEM_ANGEL_BACKEND_TIGER_DB`.
- **Never store the national ID number (RRN).** Identity verification yields an
  irreversible `ci` (and optional `di`); `ci` is what detects duplicate signups.
- **Field-level encryption** (AES-256-GCM) for real name and phone at rest; the
  key lives outside the DB (secret manager). Plaintext PII is not carried on the
  domain aggregate — reading it is a separate, audited action (see ADR-0008).
- **Response masking** for name/phone/email on display.

## Consequences

- Minimal PII surface; a DB dump alone does not expose name/phone or any RRN.
- Key management (rotation, KMS) is a hard requirement in production; the app
  fails fast if the encryption key is missing there.
- A future move to a dedicated cluster (stronger blast-radius/compliance
  isolation) is possible without a data-model change.
