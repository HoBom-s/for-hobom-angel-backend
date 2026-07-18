import { Injectable } from "@nestjs/common";
import { metrics } from "@opentelemetry/api";

/**
 * Erasure counters on the OTel pipeline (ADR-0010). No-op when OTel is dormant
 * (the API returns no-op instruments), so these are always safe to call. The
 * pending-age SLA gauge (the PIPA 5-day watchdog) arrives with the worker in PR2.
 */
@Injectable()
export class ErasureMetrics {
  private readonly meter = metrics.getMeter("hobom.erasure");
  private readonly completed = this.meter.createCounter(
    "erasure.requests.completed",
    { description: "Erasure requests that completed and reconciled clean" },
  );
  private readonly failed = this.meter.createCounter(
    "erasure.requests.failed",
    { description: "Erasure requests that failed a task or reconciliation" },
  );

  public recordCompletion(): void {
    this.completed.add(1);
  }

  public recordFailure(): void {
    this.failed.add(1);
  }
}
