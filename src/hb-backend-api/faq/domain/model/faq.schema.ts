import { SchemaFactory } from "@nestjs/mongoose";
import { FaqEntity } from "src/hb-backend-api/faq/domain/model/faq.entity";

export const FaqSchema = SchemaFactory.createForClass(FaqEntity);

// A shelter's FAQ list, in display order then oldest-first.
FaqSchema.index({ shelterId: 1, order: 1, createdAt: 1 });
