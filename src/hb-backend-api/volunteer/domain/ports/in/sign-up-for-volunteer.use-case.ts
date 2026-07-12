export interface SignUpForVolunteerCommand {
  eventId: string;
  /** The applying member. */
  volunteerId: string;
}

export interface SignUpForVolunteerResult {
  signupId: string;
}

/**
 * A member signs up for a volunteer event. Reserves a capacity slot and records
 * the signup in one transaction; rejects when full, closed, or already started.
 */
export interface SignUpForVolunteerUseCase {
  invoke(command: SignUpForVolunteerCommand): Promise<SignUpForVolunteerResult>;
}
