import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";

export const VolunteerSignupSchema = SchemaFactory.createForClass(
  VolunteerSignupEntity,
);

// "My signups" and an event's roster.
VolunteerSignupSchema.index({ volunteerId: 1, createdAt: -1 });
VolunteerSignupSchema.index({ eventId: 1, status: 1 });
// Enforce at most one ACTIVE signup per (event, volunteer) at the database — the
// capacity guard bounds totals, this bounds double-signups under races.
VolunteerSignupSchema.index(
  { eventId: 1, volunteerId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: VolunteerSignupStatus.ACTIVE },
  },
);
