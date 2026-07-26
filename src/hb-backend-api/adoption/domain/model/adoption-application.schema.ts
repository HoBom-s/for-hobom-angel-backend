import { SchemaFactory } from "@nestjs/mongoose";
import { AdoptionApplicationEntity } from "src/hb-backend-api/adoption/domain/model/adoption-application.entity";

export const AdoptionApplicationSchema = SchemaFactory.createForClass(
  AdoptionApplicationEntity,
);

// A shelter's review queue, and "my applications" for an applicant.
AdoptionApplicationSchema.index({ shelterId: 1, status: 1, createdAt: -1 });
// Dashboard adoption trend: APPROVED applications bucketed by updatedAt month.
AdoptionApplicationSchema.index({ shelterId: 1, status: 1, updatedAt: 1 });
AdoptionApplicationSchema.index({ applicantId: 1, createdAt: -1 });
// One in-flight application per animal is enforced by the animal's RESERVED
// state; this index just speeds "applications for this animal".
AdoptionApplicationSchema.index({ animalId: 1, status: 1 });
