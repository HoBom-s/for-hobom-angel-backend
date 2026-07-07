# ADR-0003: Self-issued JWT behind the gateway

- Status: Accepted
- Date: 2026-07-06

## Context

Angel runs behind `hobom-api-gateway`. Inspection of the gateway showed it is a
reverse proxy that checks a single entry key and passes `Authorization`/cookies
through; it does **not** own or verify users, and it base64-decodes the JWT
(without signature verification) only to inject an `X-User-Nickname` header.

## Decision

Angel owns its **own user store and issues/verifies its own JWTs** (`@nestjs/jwt`).
Access and refresh tokens use separate secrets. By convention the JWT `sub`
carries the nickname (so the gateway's `X-User-Nickname` injection works), with
the stable user id in a `uid` claim. Integration with the gateway is env-only
(`PROXY_ROUTES` + `SERVICE_API_KEYS`).

## Consequences

- No coupling to another service's user model; Angel controls its own auth,
  roles, and identity verification (CI/DI).
- The gateway is not a trust boundary for user identity — Angel must verify JWT
  signatures itself (it does, via its JwtStrategy), and never trust decoded
  claims from upstream without verification.
- Refresh-token rotation/revocation is Angel's responsibility (tracked
  separately).
