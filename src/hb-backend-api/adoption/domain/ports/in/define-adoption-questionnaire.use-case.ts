import { QuestionType } from "src/hb-backend-api/adoption/domain/enums/question-type.enum";

export interface QuestionInput {
  id: string;
  prompt: string;
  type: QuestionType;
  options?: string[];
  required?: boolean;
}

export interface DefineAdoptionQuestionnaireCommand {
  shelterId: string;
  /** The shelter admin defining the survey. */
  definedBy: string;
  questions: QuestionInput[];
}

/**
 * Creates or replaces a shelter's adoption pre-application survey. Only that
 * shelter's admin may define it.
 */
export interface DefineAdoptionQuestionnaireUseCase {
  invoke(command: DefineAdoptionQuestionnaireCommand): Promise<void>;
}
