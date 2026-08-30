import { Types } from "mongoose";
import { ObjectIdValueObject } from "src/shared/domain/object-id.value-object";

/** Identity of a questionnaire. */
export class QuestionnaireId extends ObjectIdValueObject {
  public static fromString(id: string): QuestionnaireId {
    return new QuestionnaireId(this.toObjectId(id, "Questionnaire"));
  }

  public static generate(): QuestionnaireId {
    return new QuestionnaireId(new Types.ObjectId());
  }
}
