import { Prop, Schema } from "@nestjs/mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { PolicyStatus } from "src/hb-backend-api/policy/domain/enums/policy-status.enum";
import { PolicyType } from "src/hb-backend-api/policy/domain/enums/policy-type.enum";

/**
 * One immutable version of a legal document. New edits are new versions (never
 * in-place mutation) so consent can later bind to the exact text a user agreed
 * to. `(type, version)` is unique; one PUBLISHED row per type at a time.
 */
@Schema({ collection: "policy_documents", timestamps: true })
export class PolicyDocumentEntity extends BaseEntity {
  @Prop({ required: true, enum: PolicyType, type: String })
  public type: PolicyType;

  @Prop({ required: true })
  public version: number;

  @Prop({ required: true })
  public title: string;

  @Prop({ required: true })
  public content: string;

  @Prop({ required: true, enum: PolicyStatus, type: String })
  public status: PolicyStatus;

  // When this version takes legal effect (may differ from when it was published).
  @Prop({ required: true, type: Date })
  public effectiveDate: Date;

  @Prop({ required: true, type: Date })
  public publishedAt: Date;
}
