import { Module } from "@nestjs/common";
import { TerminusModule } from "@nestjs/terminus";
import { HealthController } from "src/hb-backend-api/health/health.controller";

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
})
export class HealthModule {}
