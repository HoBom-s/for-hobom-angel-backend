import { QuestionType } from "src/hb-backend-api/questionnaire/domain/enums/question-type.enum";
import { QuestionnairePurpose } from "src/hb-backend-api/questionnaire/domain/enums/questionnaire-purpose.enum";

export interface QuestionInput {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
}

export interface DefineQuestionnaireCommand {
  shelterId: string;
  purpose: QuestionnairePurpose;
  /** The shelter admin defining the survey. */
  definedBy: string;
  questions: QuestionInput[];
}

/**
 * Creates or replaces a shelter's survey for a purpose (adoption/foster). Only
 * that shelter's admin may define it.
 */
export interface DefineQuestionnaireUseCase {
  invoke(command: DefineQuestionnaireCommand): Promise<void>;
}
