import { Injectable, Logger, OnApplicationShutdown } from "@nestjs/common";
import { shutdownTelemetry } from "src/tracing";

/**
 * Flushes and shuts down the OpenTelemetry SDK as part of Nest's ordered
 * shutdown (driven by `enableShutdownHooks()`), so buffered spans/metrics are
 * exported before the process exits. A failed flush is logged, never thrown —
 * shutdown must not hang or crash on a telemetry hiccup.
 */
@Injectable()
export class TelemetryLifecycle implements OnApplicationShutdown {
  private readonly logger = new Logger(TelemetryLifecycle.name);

  public async onApplicationShutdown(): Promise<void> {
    try {
      await shutdownTelemetry();
    } catch (error) {
      this.logger.warn(
        `Telemetry shutdown failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}
