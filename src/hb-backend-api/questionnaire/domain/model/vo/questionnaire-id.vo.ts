import { Types } from "mongoose";

/** Identity of a questionnaire. */
export class QuestionnaireId {
  constructor(private readonly value: Types.ObjectId) {
    Object.freeze(this);
  }

  public static fromString(id: string): QuestionnaireId {
    if (!Types.ObjectId.isValid(id)) {
      throw new Error(`올바르지 않은 Questionnaire ID 형식이에요. ${id}`);
    }
    return new QuestionnaireId(new Types.ObjectId(id));
  }

  public static generate(): QuestionnaireId {
    return new QuestionnaireId(new Types.ObjectId());
  }

  public equals(other: QuestionnaireId): boolean {
    return this.value.equals(other.value);
  }

  public toString(): string {
    return this.value.toHexString();
  }

  public get raw(): Types.ObjectId {
    return this.value;
  }
}
