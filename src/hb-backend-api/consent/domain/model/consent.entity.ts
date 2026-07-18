import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { ConsentStatus } from "src/hb-backend-api/consent/domain/enums/consent-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/**
 * A user's current consent to a policy type — the standing state (one row per
 * (userId, policyType)). The full grant/withdraw history lives in the audit
 * trail (CONSENT_GIVEN / CONSENT_WITHDRAWN). `agreedVersion` binds the consent to
 * the exact policy version the user saw.
 */
@Schema({ collection: "consents", timestamps: true })
export class ConsentEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public userId: Types.ObjectId;

  @Prop({ required: true, enum: PolicyType, type: String })
  public policyType: PolicyType;

  @Prop({ required: true })
  public agreedVersion: number;

  @Prop({ required: true, enum: ConsentStatus, type: String })
  public status: ConsentStatus;

  @Prop({ required: true, type: Date })
  public grantedAt: Date;

  @Prop({ type: Date, default: null })
  public withdrawnAt?: Date | null;
}
