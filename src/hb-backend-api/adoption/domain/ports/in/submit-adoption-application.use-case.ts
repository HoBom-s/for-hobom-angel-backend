export interface AnswerInput {
  questionId: string;
  values: string[];
}

export interface SubmitAdoptionApplicationCommand {
  animalId: string;
  /** The applicant (a general member). */
  applicantId: string;
  answers?: AnswerInput[];
}

export interface SubmitAdoptionApplicationResult {
  applicationId: string;
  approvalId: string;
}

/**
 * A member applies to adopt an animal. Validates the animal is open and the
 * answers satisfy the shelter's survey, reserves the animal, and opens an
 * ADOPTION approval — all in one transaction.
 */
export interface SubmitAdoptionApplicationUseCase {
  invoke(
    command: SubmitAdoptionApplicationCommand,
  ): Promise<SubmitAdoptionApplicationResult>;
}
