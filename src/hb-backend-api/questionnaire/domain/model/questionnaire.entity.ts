import { Prop, Schema } from "@nestjs/mongoose";
import { Types } from "mongoose";
import { BaseEntity } from "src/shared/base/base.entity";
import { QuestionType } from "src/hb-backend-api/questionnaire/domain/enums/question-type.enum";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";

export interface QuestionDoc {
  id: string;
  prompt: string;
  type: QuestionType;
  options: string[];
  required: boolean;
}

@Schema({ collection: "questionnaires", timestamps: true })
export class QuestionnaireEntity extends BaseEntity {
  @Prop({ required: true, type: Types.ObjectId, ref: "shelters" })
  public shelterId: Types.ObjectId;

  @Prop({ required: true, enum: QuestionnairePurpose, type: String })
  public purpose: QuestionnairePurpose;

  @Prop({
    type: [
      {
        id: String,
        prompt: String,
        type: { type: String, enum: QuestionType },
        options: { type: [String], default: [] },
        required: { type: Boolean, default: false },
      },
    ],
    default: [],
  })
  public questions: QuestionDoc[];

  @Prop({ required: true, default: 1 })
  public version: number;
}
