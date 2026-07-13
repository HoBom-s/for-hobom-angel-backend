import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DIToken } from "src/shared/di/token.di";
import { HOBOM_TIME_ZONE } from "src/shared/constants/time-zone.constant";
import { CloseExpiredVolunteerEventsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/close-expired-volunteer-events.use-case";

/**
 * Hourly sweep that closes volunteer events whose end time has passed. The work
 * is idempotent (only OPEN events transition), so it is safe to run on every
 * instance; a distributed lock for exactly-once is a later refinement.
 */
@Injectable()
export class VolunteerExpirySchedule {
  private readonly logger = new Logger(VolunteerExpirySchedule.name);

  constructor(
    @Inject(DIToken.VolunteerModule.CloseExpiredVolunteerEventsUseCase)
    private readonly closeExpired: CloseExpiredVolunteerEventsUseCase,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, { timeZone: HOBOM_TIME_ZONE })
  public async handle(): Promise<void> {
    const { closed } = await this.closeExpired.invoke();
    if (closed > 0) {
      this.logger.log(`auto-closed ${closed} expired volunteer event(s)`);
    }
  }
}
