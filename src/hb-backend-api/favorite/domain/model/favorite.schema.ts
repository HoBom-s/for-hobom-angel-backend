import { SchemaFactory } from "@nestjs/mongoose";
import { FavoriteEntity } from "src/hb-backend-api/favorite/domain/model/favorite.entity";

export const FavoriteSchema = SchemaFactory.createForClass(FavoriteEntity);

// One favorite per (user, target); also serves "my favorites of a type".
FavoriteSchema.index(
  { userId: 1, targetType: 1, targetRef: 1 },
  { unique: true },
);
FavoriteSchema.index({ userId: 1, targetType: 1, createdAt: -1 });
