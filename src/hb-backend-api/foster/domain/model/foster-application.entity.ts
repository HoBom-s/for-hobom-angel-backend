import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { FosterApplicationStatus } from "src/hb-backend-api/foster/domain/enums/foster-application-status.enum";
import { FosterEndReason } from "src/hb-backend-api/foster/domain/enums/foster-end-reason.enum";

export interface AnswerDoc {
  questionId: string;
  values: string[];
}

@Schema({ collection: "foster_applications", timestamps: true })
export class FosterApplicationEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "animals" })
  public animalId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, ref: "users" })
  public applicantId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  public questionnaireVersion: number;

  @Prop({ type: [{ questionId: String, values: [String] }], default: [] })
  public answers: AnswerDoc[];

  /** Null = indefinite (무기한). */
  @Prop({ type: Date, default: null })
  public plannedEndDate?: Date | null;

  @Prop({
    required: true,
    enum: FosterApplicationStatus,
    type: String,
    default: FosterApplicationStatus.PENDING,
  })
  public status: FosterApplicationStatus;

  @Prop({ type: String })
  public decidedReason?: string;

  @Prop({ type: Date, default: null })
  public endedAt?: Date | null;

  @Prop({ type: String, enum: FosterEndReason, default: null })
  public endReason?: FosterEndReason | null;

  @Prop({ required: true, default: 0 })
  public version: number;
}
