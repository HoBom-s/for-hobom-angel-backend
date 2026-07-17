import { NodeSDK } from "@opentelemetry/sdk-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-proto";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-proto";
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express";
import { MongooseInstrumentation } from "@opentelemetry/instrumentation-mongoose";
import { GrpcInstrumentation } from "@opentelemetry/instrumentation-grpc";
import { NestInstrumentation } from "@opentelemetry/instrumentation-nestjs-core";

let sdk: NodeSDK | undefined;

/**
 * Boots the OpenTelemetry Node SDK — traces + metrics over OTLP/proto.
 *
 * Fail-open by design: with no `OTEL_EXPORTER_OTLP_ENDPOINT` the SDK stays
 * dormant, so local/dev/test runs carry zero telemetry overhead and never
 * depend on a collector being reachable. Endpoint, headers, sampler, resource
 * attributes, etc. are read from the standard `OTEL_*` env vars by the SDK and
 * exporters themselves — we only supply sensible service identity defaults.
 *
 * Instrumentation is curated (http, express, mongoose, grpc, nestjs) rather
 * than the kitchen-sink meta-package, to keep the patched surface auditable.
 *
 * MUST run before any instrumented module (http, express, mongoose, grpc) is
 * first `require`d — hence the side-effect import at the very top of main.ts.
 */
function start(): void {
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    return;
  }

  try {
    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]:
          process.env.OTEL_SERVICE_NAME ?? "for-hobom-angel-backend",
        [ATTR_SERVICE_VERSION]:
          process.env.HOBOM_ANGEL_BACKEND_VERSION ?? "0.1.0",
      }),
      traceExporter: new OTLPTraceExporter(),
      metricReader: new PeriodicExportingMetricReader({
        exporter: new OTLPMetricExporter(),
      }),
      instrumentations: [
        new HttpInstrumentation(),
        new ExpressInstrumentation(),
        new MongooseInstrumentation(),
        new GrpcInstrumentation(),
        new NestInstrumentation(),
      ],
    });
    sdk.start();
  } catch (error) {
    // Telemetry must never take the process down — degrade to dormant.
    sdk = undefined;
    console.warn("[telemetry] failed to start, running without OTel:", error);
  }
}

/** True once the SDK has started (an OTLP endpoint was configured). */
export function telemetryEnabled(): boolean {
  return sdk !== undefined;
}

/**
 * Flushes pending spans/metrics and shuts the SDK down. Safe (no-op) when
 * telemetry never started, and idempotent across repeated shutdown signals.
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }
  const pending = sdk;
  sdk = undefined;
  await pending.shutdown();
}

start();
