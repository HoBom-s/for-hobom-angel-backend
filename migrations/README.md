# Migrations

migrate-mongo migrations for **data changes** — backfills, field transforms,
pseudonymization for the deletion batch, etc. Run with `npm run migrate:up`.

**Indexes are not managed here.** They live on the Mongoose schemas and are
applied with `npm run indexes:sync` (which runs `syncIndexes()` so the schema is
the single source of truth). Keeping indexes out of migrations avoids the drift
between a schema index and a hand-written migration.

Create a migration with `npm run migrate:create -- <name>`.
