import { Inject, Injectable, Logger } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { VolunteerEventPersistencePort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-persistence.port";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import {
  CloseExpiredVolunteerEventsResult,
  CloseExpiredVolunteerEventsUseCase,
} from "src/hb-backend-api/volunteer/domain/ports/in/close-expired-volunteer-events.use-case";

/** How many expired events to close per sweep; the hourly schedule drains the rest. */
const BATCH_SIZE = 500;

/**
 * Closes OPEN events past their end time via the aggregate's own transition
 * (OPEN -> CLOSED). Each save is independent — no wrapping transaction — so a
 * lost optimistic race on one event (e.g. a shelter cancelled it concurrently)
 * just skips that one instead of rolling back the whole sweep.
 */
@Injectable()
export class CloseExpiredVolunteerEventsService implements CloseExpiredVolunteerEventsUseCase {
  private readonly logger = new Logger(CloseExpiredVolunteerEventsService.name);

  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly queryPort: VolunteerEventQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerEventPersistencePort)
    private readonly persistencePort: VolunteerEventPersistencePort,
  ) {}

  public async invoke(): Promise<CloseExpiredVolunteerEventsResult> {
    const now = new Date();
    const events = await this.queryPort.findExpiredOpen(now, BATCH_SIZE);

    let closed = 0;
    for (const event of events) {
      try {
        event.close();
        await this.persistencePort.save(event);
        closed += 1;
      } catch (error) {
        // Concurrent close/cancel or optimistic-lock loss — skip this one.
        this.logger.debug(
          `skip ${event.getId.toString()}: ${(error as Error).message}`,
        );
      }
    }
    return { closed };
  }
}
