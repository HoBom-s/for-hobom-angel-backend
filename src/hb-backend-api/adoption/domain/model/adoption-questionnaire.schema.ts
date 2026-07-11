import { SchemaFactory } from "@nestjs/mongoose";
import { AdoptionQuestionnaireEntity } from "src/hb-backend-api/adoption/domain/model/adoption-questionnaire.entity";

export const AdoptionQuestionnaireSchema = SchemaFactory.createForClass(
  AdoptionQuestionnaireEntity,
);
