import { SchemaFactory } from "@nestjs/mongoose";
import { ShelterEntity } from "src/hb-backend-api/shelter/domain/model/shelter.entity";

export const ShelterSchema = SchemaFactory.createForClass(ShelterEntity);

// slug is unique above. A shelter's registration/business number is unique when
// present (sparse) — this is what blocks duplicate registrations.
ShelterSchema.index({ registrationNumber: 1 }, { unique: true, sparse: true });
ShelterSchema.index({ businessNumber: 1 }, { unique: true, sparse: true });
ShelterSchema.index({ status: 1, createdAt: -1 });
