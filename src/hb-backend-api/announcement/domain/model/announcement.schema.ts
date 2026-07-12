import { SchemaFactory } from "@nestjs/mongoose";
import { AnnouncementEntity } from "src/hb-backend-api/announcement/domain/model/announcement.entity";

export const AnnouncementSchema =
  SchemaFactory.createForClass(AnnouncementEntity);

// A shelter's notice board: pinned first, then newest.
AnnouncementSchema.index({ shelterId: 1, pinned: -1, createdAt: -1 });
