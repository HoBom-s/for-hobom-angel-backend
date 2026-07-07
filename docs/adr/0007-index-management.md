# ADR-0007: Index management — autoIndex off + syncIndexes

- Status: Accepted
- Date: 2026-07-07

## Context

Mongoose `autoIndex` builds indexes on every app boot. At scale that blocks
startup and can hammer a large collection, so it must be off in production — but
then indexes need another, controlled way to exist. A hand-written index
migration was tried first and immediately drifted (it missed the outbox unique
`eventId` index the schema declares).

## Decision

- **`autoIndex` off in production** (on in dev/test for convenience).
- **Indexes come from `syncIndexes()`** via `npm run indexes:sync` — a bootstrap
  script that runs Mongoose `syncIndexes()` over every schema, so the **schema is
  the single source of truth**. Run as a deploy step.
- **migrate-mongo is for DATA migrations only** (backfills, transforms,
  pseudonymization), never indexes.

## Consequences

- Index definitions can't drift from a hand-maintained list; adding an index is
  a schema change plus a re-run of `indexes:sync`.
- `syncIndexes()` will drop indexes not present on the schema — the schema must
  therefore be complete and authoritative (intended).
- Deploy has two ordered concerns: `migrate:up` (data) and `indexes:sync`
  (indexes).
