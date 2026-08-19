export interface StartInquiryCommand {
  /** The member opening the inquiry. */
  inquirerId: string;
  /** The animal the inquiry is about (its shelter becomes the recipient). */
  animalId: string;
  /** The first message body. */
  message: string;
}

export interface StartInquiryResult {
  inquiryId: string;
}

/**
 * Opens (or reuses) a member's inquiry thread with the animal's shelter and
 * posts the first message. One thread per (inquirer, animal): a repeat inquiry
 * on the same animal continues the existing thread.
 */
export interface StartInquiryUseCase {
  invoke(command: StartInquiryCommand): Promise<StartInquiryResult>;
}
