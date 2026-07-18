export enum SignupDecision {
  APPROVE = "APPROVE",
  REJECT = "REJECT",
}

export interface DecideVolunteerSignupCommand {
  signupId: string;
  /** The staff/admin member deciding — must belong to the event's shelter. */
  actorId: string;
  decision: SignupDecision;
}

/**
 * A shelter's staff approves or rejects a pending volunteer applicant. Rejecting
 * frees the event's capacity slot.
 */
export interface DecideVolunteerSignupUseCase {
  invoke(command: DecideVolunteerSignupCommand): Promise<void>;
}
