import { SchemaFactory } from "@nestjs/mongoose";
import { QuestionnaireEntity } from "src/hb-backend-api/questionnaire/domain/model/questionnaire.entity";

export const QuestionnaireSchema =
  SchemaFactory.createForClass(QuestionnaireEntity);

// At most one questionnaire per (shelter, purpose) — the shelter's adoption form
// and its foster form are distinct, single documents.
QuestionnaireSchema.index({ shelterId: 1, purpose: 1 }, { unique: true });
