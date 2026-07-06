import { Controller, Get } from "@nestjs/common";
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from "@nestjs/terminus";

/**
 * Smoke-check endpoint. Jenkins pings `GET /` (smokeCheckPath).
 * Verifies the Mongo connection is up.
 */
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
}
