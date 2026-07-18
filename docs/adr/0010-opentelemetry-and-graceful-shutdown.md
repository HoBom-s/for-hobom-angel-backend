# ADR-0010: OpenTelemetry tracing/metrics + graceful shutdown

- Status: Accepted
- Date: 2026-07-18

## Context

We already had a homegrown correlation id (`x-hobom-trace-id`), propagated via
`AsyncLocalStorage` and carried by the outbox → `hobom.logs` pipeline (see
ADR-0008). That gives per-request log correlation, but not distributed traces
(spans across HTTP → Mongo → gRPC) nor runtime metrics. We want real
OpenTelemetry without (a) breaking the existing log pipeline that downstream
services already key on `x-hobom-trace-id`, (b) forcing a collector to exist for
the app to boot, or (c) dropping in-flight spans/metrics on redeploy.

## Decision

- **OTel Node SDK, curated instrumentation** — http, express, mongoose, grpc,
  nestjs-core only (not the kitchen-sink meta-package), so the patched surface is
  auditable. Traces + metrics exported over OTLP/proto.
- **Fail-open, env-gated** — the SDK boots only when `OTEL_EXPORTER_OTLP_ENDPOINT`
  is set. With no endpoint it stays dormant (zero overhead, no collector
  dependency); local/dev/test runs are unaffected. All tuning is via standard
  `OTEL_*` env vars.
- **Load order** — `src/tracing.ts` is a side-effect import at the very top of
  `main.ts`, so instrumentation patches modules before they are first required
  (CommonJS evaluates requires in order). A start failure degrades to dormant,
  never crashes the process.
- **Coexistence, not replacement** — `x-hobom-trace-id` is unchanged. It is also
  stamped onto the active span as `hobom.trace_id`, and OTel `trace_id`/`span_id`
  are mixed into every pino log line. The two correlation ids live side by side;
  the log pipeline keeps working untouched.
- **Graceful shutdown** — Nest `enableShutdownHooks()` drives the ordered drain
  (HTTP + microservices + Mongo), and a `TelemetryLifecycle` (`OnApplicationShutdown`)
  flushes the SDK so buffered spans/metrics are exported before exit. A `main.ts`
  watchdog force-exits (non-zero) if the drain hangs past `HOBOM_SHUTDOWN_TIMEOUT_MS`,
  so an orchestrator never waits out its grace period. The watchdog timer is
  `unref`'d so a clean shutdown is never held open by it.

## Consequences

- Traces/metrics are opt-in per environment; production wires a collector, lower
  environments pay nothing.
- A flush failure or a hung connection at shutdown is logged and bounded, never
  fatal or unbounded.
- Two correlation ids coexist deliberately — `x-hobom-trace-id` for the log
  pipeline's contract, OTel's W3C context for distributed tracing — joined via the
  `hobom.trace_id` span attribute and the log mixin.
