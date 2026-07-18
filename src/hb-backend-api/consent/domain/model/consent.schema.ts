import { SchemaFactory } from "@nestjs/mongoose";
import { ConsentEntity } from "src/hb-backend-api/consent/domain/model/consent.entity";

export const ConsentSchema = SchemaFactory.createForClass(ConsentEntity);

// One standing consent per (user, policy type).
ConsentSchema.index({ userId: 1, policyType: 1 }, { unique: true });
