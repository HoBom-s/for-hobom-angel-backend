import { Inject, Injectable } from "@nestjs/common";
import { DIToken } from "src/shared/di/token.di";
import { ShelterId } from "src/hb-backend-api/shelter/domain/model/vo/shelter-id.vo";
import { UserId } from "src/hb-backend-api/user/domain/model/vo/user-id.vo";
import { VolunteerEvent } from "src/hb-backend-api/volunteer/domain/model/volunteer-event";
import { VolunteerEventId } from "src/hb-backend-api/volunteer/domain/model/vo/volunteer-event-id.vo";
import { VolunteerSignup } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup";
import {
  ReadVolunteerEventsUseCase,
  VolunteerEventView,
} from "src/hb-backend-api/volunteer/domain/ports/in/read-volunteer-events.use-case";
import { VolunteerEventQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-event-query.port";
import { VolunteerSignupQueryPort } from "src/hb-backend-api/volunteer/domain/ports/out/volunteer-signup-query.port";

/**
 * Reads events and hydrates each with the viewer's own live signup. The signup
 * lookup is a single batched query over the page's event ids (not one per
 * event), mirroring the feed's viewer-aware like hydration.
 */
@Injectable()
export class ReadVolunteerEventsService implements ReadVolunteerEventsUseCase {
  constructor(
    @Inject(DIToken.VolunteerModule.VolunteerEventQueryPort)
    private readonly eventQueryPort: VolunteerEventQueryPort,
    @Inject(DIToken.VolunteerModule.VolunteerSignupQueryPort)
    private readonly signupQueryPort: VolunteerSignupQueryPort,
  ) {}

  public async byShelter(
    shelterId: string,
    viewerId: string,
  ): Promise<VolunteerEventView[]> {
    const events = await this.eventQueryPort.findByShelter(
      ShelterId.fromString(shelterId),
    );
    return this.attachViewerSignups(events, viewerId);
  }

  public async upcoming(
    viewerId: string,
    limit: number,
  ): Promise<VolunteerEventView[]> {
    const events = await this.eventQueryPort.findUpcoming(new Date(), limit);
    return this.attachViewerSignups(events, viewerId);
  }

  public async one(
    eventId: string,
    viewerId: string,
  ): Promise<VolunteerEventView | null> {
    const event = await this.eventQueryPort.findById(
      VolunteerEventId.fromString(eventId),
    );
    if (!event) {
      return null;
    }
    const [view] = await this.attachViewerSignups([event], viewerId);
    return view;
  }

  private async attachViewerSignups(
    events: VolunteerEvent[],
    viewerId: string,
  ): Promise<VolunteerEventView[]> {
    if (events.length === 0) {
      return [];
    }
    const signups = await this.signupQueryPort.findLiveByVolunteer(
      UserId.fromString(viewerId),
      events.map((event) => event.getId),
    );
    const byEvent = new Map<string, VolunteerSignup>(
      signups.map((signup) => [signup.getEventId.toString(), signup]),
    );
    return events.map((event) => {
      const signup = byEvent.get(event.getId.toString());
      return {
        event,
        mySignupId: signup ? signup.getId.toString() : null,
        mySignupStatus: signup ? signup.getStatus : null,
      };
    });
  }
}
