import { Inject, Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { DIToken } from "src/shared/di/token.di";
import { HOBOM_TIME_ZONE } from "src/shared/constants/time-zone.constant";
import { DistributedLock } from "src/shared/lock/distributed-lock";
import { CloseExpiredVolunteerEventsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/close-expired-volunteer-events.use-case";

const LOCK_KEY = "volunteer.expiry-sweep";
const LOCK_TTL_MS = 10 * 60_000;

/**
 * Hourly sweep that closes volunteer events whose end time has passed. A
 * distributed lock keeps it to one instance; the work is idempotent regardless
 * (only OPEN events transition), so a lock miss is harmless.
 */
@Injectable()
export class VolunteerExpirySchedule {
  private readonly logger = new Logger(VolunteerExpirySchedule.name);

  constructor(
    @Inject(DIToken.VolunteerModule.CloseExpiredVolunteerEventsUseCase)
    private readonly closeExpired: CloseExpiredVolunteerEventsUseCase,
    private readonly lock: DistributedLock,
  ) {}

  @Cron(CronExpression.EVERY_HOUR, { timeZone: HOBOM_TIME_ZONE })
  public async handle(): Promise<void> {
    await this.lock.runExclusive(LOCK_KEY, LOCK_TTL_MS, async () => {
      const { closed } = await this.closeExpired.invoke();
      if (closed > 0) {
        this.logger.log(`auto-closed ${closed} expired volunteer event(s)`);
      }
    });
  }
}
