import { SchemaFactory } from "@nestjs/mongoose";
import { RefreshTokenEntity } from "src/hb-backend-api/auth/domain/model/refresh-token.entity";

export const RefreshTokenSchema =
  SchemaFactory.createForClass(RefreshTokenEntity);

// jti is unique above; look up a whole session by family; expire spent tokens.
RefreshTokenSchema.index({ familyId: 1 });
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
