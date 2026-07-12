import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerEventEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-event.entity";

export const VolunteerEventSchema =
  SchemaFactory.createForClass(VolunteerEventEntity);

// A shelter's schedule.
VolunteerEventSchema.index({ shelterId: 1, status: 1, startAt: 1 });
// Discovery: upcoming open events, soonest first.
VolunteerEventSchema.index({ status: 1, startAt: 1 });
