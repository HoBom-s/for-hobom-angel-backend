import { Controller, Get } from "@nestjs/common";
import { SkipThrottle } from "@nestjs/throttler";
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from "@nestjs/terminus";

/**
 * Health endpoints, split by intent:
 *  - `GET /`             smoke check for the deploy pipeline (readiness).
 *  - `GET /health/live`  liveness — is the process up? No dependencies, so a
 *                        slow/down Mongo never gets the container killed.
 *  - `GET /health/ready` readiness — can it serve traffic? Checks dependencies
 *                        (Mongo now; Kafka/gateway indicators plug in here).
 */
// Never throttle health probes — k8s hits them constantly and a 429 would look
// like an outage (and could get the container killed).
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  public check() {
    return this.health.check([() => this.mongoose.pingCheck("mongo")]);
  }

  @Get("health/live")
  @HealthCheck()
  public live() {
    return this.health.check([]);
  }

  @Get("health/ready")
  @HealthCheck()
  public ready() {
    return this.health.check([() => this.mongoose.pingCheck("mongo")]);
  }
}
