import { SchemaFactory } from "@nestjs/mongoose";
import { InquiryEntity } from "src/hb-backend-api/inquiry/domain/model/inquiry.entity";

export const InquirySchema = SchemaFactory.createForClass(InquiryEntity);

// A shelter's inquiry inbox, newest first.
InquirySchema.index({ shelterId: 1, createdAt: -1 });
// A member's own inquiries, newest first.
InquirySchema.index({ inquirerId: 1, createdAt: -1 });
// Find-or-create: at most one thread per (inquirer, animal).
InquirySchema.index({ inquirerId: 1, animalId: 1 });
