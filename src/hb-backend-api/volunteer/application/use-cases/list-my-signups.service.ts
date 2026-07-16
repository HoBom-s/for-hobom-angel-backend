import { Inject, Injectable } from "@nestjs/common";
import { Page } from "src/shared/pagination/page";
import { DIToken } from "src/shared/di/token.di";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { ListMySignupsUseCase } from "src/hb-backend-api/volunteer/domain/ports/in/list-my-signups.use-case";
import { VolunteerEventView } from "src/hb-backend-api/volunteer/domain/ports/in/read-volunteer-events.use-case";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";

/**
 * Lists the member's signups as event views. Pages on the signup's own id
 * (newest first), fetches the referenced events in one batched query, and pairs
 * each signup with its event. A signup whose event was since deleted is dropped.
 */
@Injectable()
export class ListMySignupsService implements ListMySignupsUseCase {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerSignupQueryPort)
    private readonly signupQueryPort: VolunteerSignupQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
  ) {}

  public async invoke(params: {
    volunteerId: string;
    cursor?: string;
    limit: number;
  }): Promise<Page<VolunteerEventView>> {
    const page = await this.signupQueryPort.findByVolunteer({
      volunteerId: UserId.fromString(params.volunteerId),
      cursor: params.cursor,
      limit: params.limit,
    });

    const events = await this.eventQueryPort.findByIds(
      page.items.map((signup) => signup.getEventId),
    );
    const byId = new Map<string, VolunteerEvent>(
      events.map((event) => [event.getId.toString(), event]),
    );

    const items = page.items
      .map((signup): VolunteerEventView | null => {
        const event = byId.get(signup.getEventId.toString());
        if (!event) {
          return null;
        }
        return {
          event,
          mySignupId: signup.getId.toString(),
          mySignupStatus: signup.getStatus,
        };
      })
      .filter((view): view is VolunteerEventView => view !== null);

    return { items, hasNext: page.hasNext, nextCursor: page.nextCursor };
  }
}
