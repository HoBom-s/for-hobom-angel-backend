# ADR-0001: Separate `hobom-angel-backend` repository

- Status: Accepted
- Date: 2026-07-06

## Context

Angel (shelter animal adoption/foster/volunteering) could have been added to the
existing `for-hobom-backend` (the NestJS + Mongo backend behind the HoBom system
back-office). Its domain, however, is entirely different, and its deploy cadence,
scaling profile, and data lifecycle (PII, retention, deletion) are independent.

## Decision

Build Angel as its own repository, cloning `for-hobom-backend`'s proven NestJS
hexagonal scaffold and shared infrastructure patterns (transaction runner, DI
tokens, outbox, response/trace/exception). It sits behind `hobom-api-gateway`
alongside the other services and shares common concerns through the gateway.

## Consequences

- Independent deploy/scale/versioning; a bug or migration in one service can't
  affect the other; PII blast radius is contained.
- Some duplication of scaffold code across repos (accepted — the code is small
  and stable; a shared library would couple release cycles).
- Cross-service contracts (gateway, event-processor, internal-backend) must be
  coordinated explicitly rather than via shared in-process code.
