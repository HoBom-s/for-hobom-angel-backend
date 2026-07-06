import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";

/**
 * Member record. RRN is NEVER stored — identity is keyed on `ci`
 * (irreversible identity value from the verification provider), which also blocks
 * duplicate signups. `realNameEnc`/`phoneEnc` are AES-256-GCM ciphertext at
 * rest; only `nickname` is public. `di` is optional.
 */
@Schema({ collection: "users", timestamps: true })
export class UserEntity extends BaseEntity {
  @Prop({ required: true, unique: true })
  public nickname: string;

  @Prop({ required: true })
  public realNameEnc: string;

  @Prop({ required: true, unique: true })
  public ci: string;

  @Prop()
  public di?: string;

  @Prop({ required: true })
  public phoneEnc: string;

  @Prop({ required: true })
  public email: string;

  @Prop({ required: true, enum: VerifiedChannel, type: String })
  public verifiedChannel: VerifiedChannel;

  @Prop({ type: [String], enum: UserRole, default: [UserRole.USER] })
  public roles: UserRole[];

  @Prop({ type: [ShelterRole], default: [] })
  public shelterRoles: ShelterRole[];

  @Prop({
    required: true,
    enum: UserStatus,
    type: String,
    default: UserStatus.ACTIVE,
  })
  public status: UserStatus;

  @Prop({ type: Date })
  public withdrawnAt?: Date;

  @Prop({ type: Date })
  public purgeAfter?: Date;
}
