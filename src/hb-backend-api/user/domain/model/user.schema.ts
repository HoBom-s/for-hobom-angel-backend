import { SchemaFactory } from "@nestjs/mongoose";
import { UserEntity } from "src/hb-backend-api/user/domain/model/user.entity";

export const UserSchema = SchemaFactory.createForClass(UserEntity);

// Deletion batch scans by (status, purgeAfter); nickname/ci are unique above.
UserSchema.index({ status: 1, purgeAfter: 1 });
