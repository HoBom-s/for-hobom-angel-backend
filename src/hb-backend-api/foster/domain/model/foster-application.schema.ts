import { SchemaFactory } from "@nestjs/mongoose";
import { FosterApplicationEntity } from "src/hb-backend-api/foster/domain/model/foster-application.entity";

export const FosterApplicationSchema = SchemaFactory.createForClass(
  FosterApplicationEntity,
);

// A shelter's review queue, and "my fosters" for an applicant.
FosterApplicationSchema.index({ shelterId: 1, status: 1, createdAt: -1 });
FosterApplicationSchema.index({ applicantId: 1, createdAt: -1 });
FosterApplicationSchema.index({ animalId: 1, status: 1 });
// Active fosters with a due date — for the (future) expiry sweep.
FosterApplicationSchema.index({ status: 1, endedAt: 1, plannedEndDate: 1 });
