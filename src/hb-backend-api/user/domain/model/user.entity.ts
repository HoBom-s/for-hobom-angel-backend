import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { UserRole } from "src/hb-backend-api/user/domain/enums/user-role.enum";
import { UserStatus } from "src/hb-backend-api/user/domain/enums/user-status.enum";
import { VerifiedChannel } from "src/hb-backend-api/user/domain/enums/verified-channel.enum";
import { ShelterRole } from "src/hb-backend-api/user/domain/model/shelter-role";

/**
 * Member record. Identity is keyed on `email` (the login id) and `passwordHash`
 * is the bcrypt credential — plaintext passwords are never stored. RRN is NEVER
 * stored. `realNameEnc`/`phoneEnc` are self-declared PII, AES-256-GCM ciphertext
 * at rest; only `nickname` is public.
 */
@Schema({ collection: "users", timestamps: true })
export class UserEntity extends BaseEntity {
  @Prop({ required: true, unique: true })
  public nickname: string;

  @Prop({ required: true, unique: true })
  public email: string;

  @Prop({ required: true })
  public passwordHash: string;

  @Prop({ required: true })
  public realNameEnc: string;

  @Prop({ required: true })
  public phoneEnc: string;

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

  // Optimistic-concurrency version; guarded and bumped on every authz update.
  @Prop({ required: true, default: 0 })
  public version: number;
}
