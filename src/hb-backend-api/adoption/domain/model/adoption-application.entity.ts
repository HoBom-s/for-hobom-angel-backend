import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { AdoptionApplicationStatus } from "src/hb-backend-api/adoption/domain/enums/adoption-application-status.enum";

export interface AnswerDoc {
  questionId: string;
  values: string[];
}

@Schema({ collection: "adoption_applications", timestamps: true })
export class AdoptionApplicationEntity extends BaseEntity {
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

  @Prop({
    required: true,
    enum: AdoptionApplicationStatus,
    type: String,
    default: AdoptionApplicationStatus.PENDING,
  })
  public status: AdoptionApplicationStatus;

  @Prop({ type: String })
  public decidedReason?: string;

  @Prop({ required: true, default: 0 })
  public version: number;
}
