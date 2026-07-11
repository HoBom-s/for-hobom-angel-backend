import { SchemaFactory } from "@nestjs/mongoose";
import { AnimalEntity } from "src/hb-backend-api/animal/domain/model/animal.entity";

export const AnimalSchema = SchemaFactory.createForClass(AnimalEntity);

// A shelter's roster, newest first.
AnimalSchema.index({ shelterId: 1, status: 1, createdAt: -1 });
// Discovery: browse/filter available animals by species.
AnimalSchema.index({ status: 1, species: 1, createdAt: -1 });
// Match against public 유기동물 공고 when present.
AnimalSchema.index({ "intake.noticeNumber": 1 }, { sparse: true });
