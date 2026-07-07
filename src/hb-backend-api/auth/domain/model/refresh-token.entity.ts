import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { RefreshTokenStatus } from "src/hb-backend-api/auth/domain/enums/refresh-token-status.enum";

/**
 * A server-side record of one issued refresh token. `familyId` ties together all
 * tokens descended from a single login, so that detecting reuse of a rotated
 * token can revoke the entire family (session).
 */
@Schema({ collection: "refresh_tokens", timestamps: true })
export class RefreshTokenEntity extends BaseEntity {
  @Prop({ required: true, unique: true })
  public jti: string;

  @Prop({ required: true })
  public familyId: string;

  @Prop({ required: true })
  public userId: string;

  @Prop({
    required: true,
    enum: RefreshTokenStatus,
    type: String,
    default: RefreshTokenStatus.ACTIVE,
  })
  public status: RefreshTokenStatus;

  @Prop({ required: true, type: Date })
  public expiresAt: Date;
}
