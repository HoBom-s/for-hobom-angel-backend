# ADR-0002: Rich domain model (aggregates + value objects)

- Status: Accepted
- Date: 2026-07-06

## Context

The Angel domain is thick with invariants: role/authorization rules, shelter
verification as the root of trust, approval workflows, account lifecycle,
privacy constraints. An anemic model (data-only entities + procedural services)
tends to scatter these rules across services, where one path eventually forgets
a check.

## Decision

Use a rich domain model where it earns its keep:

- **Aggregates own their invariants** — state transitions are methods that
  enforce and throw (e.g. `User.promoteToShelterStaff` rejects a withdrawn user
  or a duplicate grant). Services only orchestrate.
- **Value Objects** validate format at construction (Email, PhoneNumber,
  Nickname, Ci …), are immutable (`Object.freeze`), and compare by value.
- **Domain model is separated from the Mongoose persistence schema**, bridged by
  a mapper — the domain is persistence-ignorant.
- Technical records with thin invariants (e.g. the outbox) stay intentionally
  anemic; a heavy model there would be over-engineering.

## Consequences

- Invariants live in one enforceable place; higher confidence, better unit
  testability (domain tests need no DB).
- More boilerplate (VOs, factories, mappers) and a mapping layer — accepted for
  this domain's complexity.
- New engineers must follow the layering (adapters → ports → use-cases → domain);
  the hexagonal structure and DI tokens make the boundaries explicit.
