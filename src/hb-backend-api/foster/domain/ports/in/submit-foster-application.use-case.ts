export interface AnswerInput {
  questionId: string;
  values: string[];
}

export interface SubmitFosterApplicationCommand {
  animalId: string;
  /** The applicant (a general member). */
  applicantId: string;
  answers?: AnswerInput[];
  /** Planned end date; omit or null for an indefinite (무기한) foster. */
  plannedEndDate?: Date | null;
}

export interface SubmitFosterApplicationResult {
  fosterApplicationId: string;
  approvalId: string;
}

/**
 * A member applies to foster an animal. Validates the animal is open and the
 * answers satisfy the shelter's foster survey, reserves the animal, and opens a
 * FOSTER approval — all in one transaction.
 */
export interface SubmitFosterApplicationUseCase {
  invoke(
    command: SubmitFosterApplicationCommand,
  ): Promise<SubmitFosterApplicationResult>;
}
