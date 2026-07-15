import { SchemaFactory } from "@nestjs/mongoose";
import { VolunteerSignupStatus } from "src/hb-backend-api/volunteer/domain/enums/volunteer-signup-status.enum";
import { VolunteerSignupEntity } from "src/hb-backend-api/volunteer/domain/model/volunteer-signup.entity";

export const VolunteerSignupSchema = SchemaFactory.createForClass(
  VolunteerSignupEntity,
);

// "My signups" and an event's roster.
VolunteerSignupSchema.index({ volunteerId: 1, createdAt: -1 });
VolunteerSignupSchema.index({ eventId: 1, status: 1 });
// Enforce at most one PENDING signup per (event, volunteer) at the database.
// The insert race is a first-time double-submit (both PENDING); once a signup
// is APPROVED the application-level live check blocks re-signup. ($in isn't
// allowed in a partialFilterExpression, so this guards the PENDING insert.)
VolunteerSignupSchema.index(
  { eventId: 1, volunteerId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: VolunteerSignupStatus.PENDING },
  },
);
